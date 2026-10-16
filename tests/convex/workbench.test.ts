// @vitest-environment edge-runtime
import { convexTest } from 'convex-test'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { api } from '@trmnl-games/backend/api'
import type { Id } from '@trmnl-games/backend/data-model'
import schema from '../../apps/backend/convex/schema'
import { runTick, seedHero, seedWorld, type T } from './helpers'

const modules = import.meta.glob('../../apps/backend/convex/**/*.ts')
const SLOT = Date.UTC(2026, 9, 12, 10, 0, 2)
let op = 0
const opId = () => `wb-${String(++op).padStart(6, '0')}`
const as = (t: T, alias: string) => t.withIdentity({ issuer: 'issuer', subject: alias })

async function errorCode(promise: Promise<unknown>): Promise<string | undefined> {
  try {
    const result = await promise
    if (typeof result === 'object' && result !== null && 'ok' in result && (result as { ok: unknown }).ok === false && 'code' in result) return String((result as { code: unknown }).code)
    return undefined
  } catch (error) {
    return (error as { data?: { code?: string } }).data?.code
  }
}

const heroDoc = (t: T, heroId: Id<'heroes'>) => t.run(async (ctx) => (await ctx.db.get(heroId))!)
const items = (t: T, heroId: Id<'heroes'>) => t.run(async (ctx) => await ctx.db.query('items').withIndex('by_heroId', (q) => q.eq('heroId', heroId)).collect())
const logs = (t: T, heroId: Id<'heroes'>) => t.run(async (ctx) => (await ctx.db.query('tickLogs').withIndex('by_heroId_and_at_and_sequence', (q) => q.eq('heroId', heroId)).collect()).filter((log) => log.source === 'command'))

/** Put a piece of gear in the bag (or, with `equip`, in a slot) and return its id. */
async function giveGear(t: T, heroId: Id<'heroes'>, over: Record<string, unknown> = {}, equip = false): Promise<Id<'items'>> {
  return await t.run(async (ctx) => {
    const id = await ctx.db.insert('items', { heroId, templateId: 'letter_opener', contentVersion: 'v13', kind: 'weapon', name: 'Letter Opener', rarity: 'common', requiredLevel: 1, attack: 3, defense: 0, saleValue: 5, quantity: 1, createdAt: Date.now(), ...over })
    if (equip) await ctx.db.patch(heroId, { [over.kind === 'armor' ? 'armorId' : 'weaponId']: id })
    return id
  })
}
const giveMaterials = (t: T, heroId: Id<'heroes'>, counts: Record<string, number>) =>
  t.run(async (ctx) => {
    for (const [templateId, quantity] of Object.entries(counts)) await ctx.db.insert('items', { heroId, templateId, contentVersion: 'v13', kind: 'material', name: templateId, rarity: 'common', requiredLevel: 1, attack: 0, defense: 0, saleValue: 0, quantity, createdAt: Date.now() })
  })
const materialsOf = async (t: T, heroId: Id<'heroes'>) => Object.fromEntries((await items(t, heroId)).filter((item) => item.kind === 'material').map((item) => [item.templateId, item.quantity]))

describe('salvage and the workbench (D129, content v13)', () => {
  let t: T
  beforeEach(async () => {
    vi.useFakeTimers()
    vi.setSystemTime(SLOT)
    t = convexTest(schema, modules)
    await seedWorld(t, { activeContentVersion: 'v13', currentTick: 1, lastPublishedAt: SLOT - 30 * 60_000 })
  })
  afterEach(() => vi.useRealTimers())

  it('salvages bag gear into material rows, once per receipt, and never an equipped or held piece', async () => {
    const heroId = await seedHero(t, { bagCapacity: 10 }, 'Ana')
    const user = as(t, 'Ana')
    const common = await giveGear(t, heroId)
    const uncommon = await giveGear(t, heroId, { templateId: 'cable_cutter', requiredLevel: 4, rarity: 'uncommon', attack: 8 })
    const epic = await giveGear(t, heroId, { templateId: 'spork_halberd', requiredLevel: 8, rarity: 'epic', attack: 20, affixId: 'lucky' })
    const held = await giveGear(t, heroId)
    await t.run(async (ctx) => await ctx.db.patch(heroId, { heldItemId: held, status: 'sleeping' }))
    const hero = await heroDoc(t, heroId)
    expect(await errorCode(user.mutation(api.inventory.salvageMany, { operationId: opId(), itemIds: [hero.weaponId!] }))).toBe('ITEM_EQUIPPED')
    expect(await errorCode(user.mutation(api.inventory.salvageMany, { operationId: opId(), itemIds: [held] }))).toBe('ITEM_HELD')
    expect(await errorCode(user.mutation(api.inventory.salvageMany, { operationId: opId(), itemIds: [common, common] }))).toBe('INVALID_INPUT')
    // A sleeping hero can salvage to make room, like selling.
    const operationId = opId()
    expect(await user.mutation(api.inventory.salvageMany, { operationId, itemIds: [common, uncommon, epic] })).toMatchObject({ changed: true, count: 3 })
    expect(await materialsOf(t, heroId)).toEqual({ scrap: 1, parts: 2, components: 9 })
    // The same receipt again writes nothing more.
    await user.mutation(api.inventory.salvageMany, { operationId, itemIds: [common, uncommon, epic] })
    expect(await materialsOf(t, heroId)).toEqual({ scrap: 1, parts: 2, components: 9 })
    const after = await heroDoc(t, heroId)
    expect(after.counters.itemsSalvaged).toBe(3)
    expect(after.gold).toBe(hero.gold)
    expect((await logs(t, heroId)).map((log) => log.summary)).toEqual(['Salvaged 3 items for 1 Scrap, 2 Parts and 9 Components.'])
    const view = await user.query(api.inventory.mine, {})
    expect(view.materials).toEqual([
      { id: 'scrap', name: 'Scrap', glyph: 'scrap', count: 1 },
      { id: 'parts', name: 'Parts', glyph: 'parts', count: 2 },
      { id: 'components', name: 'Components', glyph: 'components', count: 9 },
    ])
    // Materials take no bag slot and never appear as gear; the held find sits outside the bag until claimed.
    expect(view.used).toBe(0)
    expect(view.gear.every((g: { kind: string }) => g.kind !== 'material')).toBe(true)
  })

  it('upgrades an equipped weapon tier by tier, then reinforces it, spending materials and gold under receipts', async () => {
    const heroId = await seedHero(t, { level: 8, gold: 20_000 }, 'Ben')
    const user = as(t, 'Ben')
    await giveMaterials(t, heroId, { scrap: 60, parts: 20, components: 5 })
    const weaponId = (await heroDoc(t, heroId)).weaponId!
    const before = await user.query(api.inventory.mine, {})
    const starter = before.gear.find((g: { id: string }) => g.id === weaponId)
    expect(starter.nextStep).toMatchObject({ kind: 'tier', label: 'Upgrade to Mk II', gold: 150, materials: { scrap: 6 }, stat: { from: 3, to: 7 }, affordable: true, shortfall: {} })
    expect(starter.salvage).toEqual({ scrap: 1 })
    const results = []
    for (let i = 0; i < 5; i += 1) results.push(await user.mutation(api.inventory.upgrade, { operationId: opId(), itemId: weaponId }))
    expect(results.map((r) => r.gold)).toEqual([-150, -500, -1000, -3000, -8000])
    expect(await errorCode(user.mutation(api.inventory.upgrade, { operationId: opId(), itemId: weaponId }))).toBe('INVALID_STATE')
    const weapon = (await items(t, heroId)).find((item) => item._id === weaponId)!
    expect(weapon).toMatchObject({ tier: 3, reinforced: 3, attack: 15, requiredLevel: 8, saleValue: 24, contentVersion: 'v13', name: 'Letter Opener' })
    expect(await materialsOf(t, heroId)).toEqual({ scrap: 60 - 6 - 6 - 8 - 12 - 16, parts: 20 - 4 - 2 - 4 - 6, components: 5 - 1 - 2 })
    const hero = await heroDoc(t, heroId)
    expect(hero).toMatchObject({ gold: 20_000 - 12_650, weaponId })
    expect(hero.counters).toMatchObject({ gearUpgraded: 5, topReinforcement: 3 })
    expect((await logs(t, heroId)).map((log) => log.summary)).toEqual([
      'Upgraded the Letter Opener to Mk II.',
      'Upgraded the Letter Opener Mk II to Mk III.',
      'Reinforced the Letter Opener Mk III to +1.',
      'Reinforced the Letter Opener Mk III +1 to +2.',
      'Reinforced the Letter Opener Mk III +2 to +3.',
    ])
    const view = await user.query(api.inventory.mine, {})
    const done = view.gear.find((g: { id: string }) => g.id === weaponId)
    expect(done).toMatchObject({ label: 'Letter Opener Mk III +3', suffix: 'Mk III +3', reinforced: 3, nextStep: null })
    // The upgraded weapon still fights as the stats say on the next tick.
    await runTick(t)
    expect((await items(t, heroId)).find((item) => item._id === weaponId)).toMatchObject({ attack: 15, tier: 3, reinforced: 3 })
  })

  it('refuses a step the hero could not wear, one it cannot afford, and names the shortfall', async () => {
    const heroId = await seedHero(t, { level: 3, gold: 100 }, 'Cal')
    const user = as(t, 'Cal')
    const weaponId = (await heroDoc(t, heroId)).weaponId!
    await giveMaterials(t, heroId, { scrap: 6 })
    expect(await errorCode(user.mutation(api.inventory.upgrade, { operationId: opId(), itemId: weaponId }))).toBe('LEVEL_TOO_LOW')
    await t.run(async (ctx) => await ctx.db.patch(heroId, { level: 4 }))
    expect(await errorCode(user.mutation(api.inventory.upgrade, { operationId: opId(), itemId: weaponId }))).toBe('NOT_ENOUGH_GOLD')
    await t.run(async (ctx) => await ctx.db.patch(heroId, { gold: 150 }))
    expect(await user.mutation(api.inventory.upgrade, { operationId: opId(), itemId: weaponId })).toMatchObject({ changed: true, gold: -150 })
    // Mk III wants 6 Scrap and 4 Parts: the shortfall names both once the level allows it.
    await t.run(async (ctx) => await ctx.db.patch(heroId, { level: 8 }))
    const view = await user.query(api.inventory.mine, {})
    expect(view.gear.find((g: { id: string }) => g.id === weaponId).nextStep).toMatchObject({ label: 'Upgrade to Mk III', affordable: false, shortfall: { scrap: 6, parts: 4 } })
    expect(await user.mutation(api.inventory.upgrade, { operationId: opId(), itemId: weaponId })).toMatchObject({ ok: false, code: 'NOT_ENOUGH_MATERIALS', message: 'Needs 6 Scrap and 4 Parts more.' })
    expect(await materialsOf(t, heroId)).toEqual({})
  })

  it('fits a chosen affix to rare gear for Components and gold, never to common gear, never the one it has', async () => {
    const heroId = await seedHero(t, { level: 8, gold: 5000 }, 'Dee')
    const user = as(t, 'Dee')
    const rare = await giveGear(t, heroId, { templateId: 'keyboard_mace', name: 'Keyboard Mace', requiredLevel: 4, rarity: 'rare', attack: 12, saleValue: 48, affixId: 'vampiric' }, true)
    const common = await giveGear(t, heroId)
    await giveMaterials(t, heroId, { components: 3 })
    expect(await errorCode(user.mutation(api.inventory.chooseAffix, { operationId: opId(), itemId: common, affixId: 'lucky' }))).toBe('ITEM_NOT_AVAILABLE')
    expect(await errorCode(user.mutation(api.inventory.chooseAffix, { operationId: opId(), itemId: rare, affixId: 'vampiric' }))).toBe('INVALID_INPUT')
    expect(await errorCode(user.mutation(api.inventory.chooseAffix, { operationId: opId(), itemId: rare, affixId: 'shiny' }))).toBe('INVALID_INPUT')
    expect(await user.mutation(api.inventory.chooseAffix, { operationId: opId(), itemId: rare, affixId: 'lucky' })).toMatchObject({ changed: true, gold: -1500 })
    expect((await items(t, heroId)).find((item) => item._id === rare)).toMatchObject({ affixId: 'lucky', attack: 12 })
    expect(await materialsOf(t, heroId)).toEqual({ components: 1 })
    expect(await errorCode(user.mutation(api.inventory.chooseAffix, { operationId: opId(), itemId: rare, affixId: 'sturdy' }))).toBe('NOT_ENOUGH_MATERIALS')
    expect((await logs(t, heroId)).map((log) => log.summary)).toEqual(['Fitted Lucky to the Rare Keyboard Mace.'])
    const view = await user.query(api.inventory.mine, {})
    expect(view.gear.find((g: { id: string }) => g.id === rare)).toMatchObject({ label: 'Lucky Rare Keyboard Mace', affixable: true })
    expect(view.gear.find((g: { id: string }) => g.id === common)).toMatchObject({ affixable: false })
    expect(view.workbench).toMatchObject({ affix: { gold: 1500, materials: { components: 2 } } })
  })

  it('has no workbench under v12: the intents refuse and the view carries no materials', async () => {
    await t.run(async (ctx) => {
      const world = (await ctx.db.query('worldState').first())!
      await ctx.db.patch(world._id, { activeContentVersion: 'v12' })
    })
    const heroId = await seedHero(t, {}, 'Eve')
    const user = as(t, 'Eve')
    const spare = await giveGear(t, heroId)
    expect(await errorCode(user.mutation(api.inventory.salvageMany, { operationId: opId(), itemIds: [spare] }))).toBe('WORKBENCH_UNAVAILABLE')
    expect(await errorCode(user.mutation(api.inventory.upgrade, { operationId: opId(), itemId: spare }))).toBe('WORKBENCH_UNAVAILABLE')
    const view = await user.query(api.inventory.mine, {})
    expect(view.materials).toEqual([])
    expect(view.workbench).toBeNull()
    expect(view.gear.find((g: { id: string }) => g.id === spare)).toMatchObject({ nextStep: null, salvage: {}, affixable: false })
  })

  it('pays the salvage rung at the next tick once the hero has salvaged', async () => {
    const heroId = await seedHero(t, { level: 12, gold: 500, bagCapacity: 10, career: { rung: 19, startedTick: 0, reached: [] } }, 'Fay')
    const user = as(t, 'Fay')
    const spare = await giveGear(t, heroId)
    await user.mutation(api.inventory.salvageMany, { operationId: opId(), itemIds: [spare] })
    vi.setSystemTime(SLOT + 15 * 60_000)
    await runTick(t)
    const hero = await heroDoc(t, heroId)
    expect(hero.career?.rung).toBe(20)
    expect(hero.career?.reached.map((r) => r.id)).toEqual(['first_salvage'])
  })
})

describe('the workbench opens at level 4 (D155, content v23)', () => {
  let t: T
  beforeEach(async () => {
    vi.useFakeTimers()
    vi.setSystemTime(SLOT)
    t = convexTest(schema, modules)
    await seedWorld(t, { activeContentVersion: 'v23', currentTick: 1, lastPublishedAt: SLOT - 30 * 60_000 })
  })
  afterEach(() => vi.useRealTimers())

  it('refuses salvage, upgrades, affixes and combining below level 4, and the Bag page shows a locked card instead', async () => {
    const heroId = await seedHero(t, { level: 3, gold: 5000, bagCapacity: 10 }, 'Gus')
    const user = as(t, 'Gus')
    const spare = await giveGear(t, heroId)
    const rare = await giveGear(t, heroId, { rarity: 'rare' }, true)
    for (const call of [
      user.mutation(api.inventory.salvageMany, { operationId: opId(), itemIds: [spare] }),
      user.mutation(api.inventory.upgrade, { operationId: opId(), itemId: rare }),
      user.mutation(api.inventory.chooseAffix, { operationId: opId(), itemId: rare, affixId: 'lucky' }),
      user.mutation(api.inventory.combinePotions, { operationId: opId() }),
    ]) expect(await errorCode(call)).toBe('LOCKED')
    const view = await user.query(api.inventory.mine, {})
    expect(view).toMatchObject({ workbench: null, workbenchUnlockLevel: 4, materials: [], potionCombine: null })
    expect(view.gear.find((g: { id: string }) => g.id === spare)).toMatchObject({ nextStep: null })

    await t.run(async (ctx) => await ctx.db.patch(heroId, { level: 4 }))
    expect(await user.mutation(api.inventory.salvageMany, { operationId: opId(), itemIds: [spare] })).toMatchObject({ changed: true, count: 1 })
    const open = await user.query(api.inventory.mine, {})
    expect(open.workbench).not.toBeNull()
    expect(open.workbenchUnlockLevel).toBeNull()
    expect(open.potionCombine).not.toBeNull()
  })
})
