// @vitest-environment edge-runtime
import { convexTest } from 'convex-test'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { api } from '@trmnl-games/backend/api'
import type { Id } from '@trmnl-games/backend/data-model'
import { maxHp } from '@trmnl-games/desk-crawler/sim/core/stats'
import schema from '../../apps/backend/convex/schema'
import { seedHero, seedWorld, type T } from './helpers'

const modules = import.meta.glob('../../apps/backend/convex/**/*.ts')
const SLOT = Date.UTC(2026, 9, 12, 10, 0, 2)
let op = 0
const opId = () => `po-${String(++op).padStart(6, '0')}`
const as = (t: T, alias: string) => t.withIdentity({ issuer: 'issuer', subject: alias })

async function errorCode(promise: Promise<unknown>): Promise<string | undefined> {
  try {
    await promise
    return undefined
  } catch (error) {
    return (error as { data?: { code?: string } }).data?.code
  }
}

const heroDoc = (t: T, heroId: Id<'heroes'>) => t.run(async (ctx) => (await ctx.db.get(heroId))!)
const items = (t: T, heroId: Id<'heroes'>) => t.run(async (ctx) => await ctx.db.query('items').withIndex('by_heroId', (q) => q.eq('heroId', heroId)).collect())
const logs = (t: T, heroId: Id<'heroes'>) => t.run(async (ctx) => (await ctx.db.query('tickLogs').withIndex('by_heroId_and_at_and_sequence', (q) => q.eq('heroId', heroId)).collect()).filter((log) => log.source === 'command'))
const potionsOf = async (t: T, heroId: Id<'heroes'>) => Object.fromEntries((await items(t, heroId)).filter((item) => item.kind === 'potion').map((item) => [item.templateId, item.quantity]))
const materialsOf = async (t: T, heroId: Id<'heroes'>) => Object.fromEntries((await items(t, heroId)).filter((item) => item.kind === 'material').map((item) => [item.templateId, item.quantity]))

const givePotions = (t: T, heroId: Id<'heroes'>, counts: Record<string, number>) =>
  t.run(async (ctx) => {
    for (const [templateId, quantity] of Object.entries(counts)) {
      const name = templateId === 'minor_potion' ? 'Minor Potion' : templateId === 'major_potion' ? 'Major Potion' : 'Healing Potion'
      await ctx.db.insert('items', { heroId, templateId, contentVersion: 'v14', kind: 'potion', name, rarity: 'common', requiredLevel: 1, attack: 0, defense: 0, saleValue: 0, quantity, createdAt: Date.now() })
    }
  })
const giveMaterials = (t: T, heroId: Id<'heroes'>, counts: Record<string, number>) =>
  t.run(async (ctx) => {
    for (const [templateId, quantity] of Object.entries(counts)) await ctx.db.insert('items', { heroId, templateId, contentVersion: 'v14', kind: 'material', name: templateId, rarity: 'common', requiredLevel: 1, attack: 0, defense: 0, saleValue: 0, quantity, createdAt: Date.now() })
  })

describe('potion strengths (D131, content v14)', () => {
  let t: T
  beforeEach(async () => {
    vi.useFakeTimers()
    vi.setSystemTime(SLOT)
    t = convexTest(schema, modules)
    await seedWorld(t, { activeContentVersion: 'v14', currentTick: 1, lastPublishedAt: SLOT - 30 * 60_000 })
  })
  afterEach(() => vi.useRealTimers())

  it('drinks by strength when asked, by best fit otherwise, and refuses an empty strength by name', async () => {
    // Level 5, hurt. The seeded hero holds three healing potions; add a minor and a major.
    const max = maxHp(5)
    const heroId = await seedHero(t, { level: 5, hp: 10 }, 'Ana')
    const user = as(t, 'Ana')
    await givePotions(t, heroId, { minor_potion: 1, major_potion: 1 })
    const view = await user.query(api.inventory.mine, {})
    expect(view.potions).toBe(5)
    expect(view.potionRows.map((r: { templateId: string; count: number; healPct: number }) => [r.templateId, r.count, r.healPct])).toEqual([['minor_potion', 1, 25], ['healing_potion', 3, 40], ['major_potion', 1, 60]])
    // 10 HP: nothing heals to full, so best fit is the strongest.
    const first = await user.mutation(api.inventory.usePotion, { operationId: opId() })
    expect(first.hp).toBe(10 + Math.ceil((max * 60) / 100))
    expect(await potionsOf(t, heroId)).toEqual({ minor_potion: 1, healing_potion: 3 })
    // By name: the minor.
    const second = await user.mutation(api.inventory.usePotion, { operationId: opId(), templateId: 'minor_potion' })
    expect(second.hp).toBe(Math.min(max, first.hp! + Math.ceil((max * 25) / 100)))
    expect(await potionsOf(t, heroId)).toEqual({ healing_potion: 3 })
    const code = await errorCode(user.mutation(api.inventory.usePotion, { operationId: opId(), templateId: 'major_potion' }))
    expect(code).toBe('NO_POTION')
    expect((await logs(t, heroId)).map((log) => log.summary)).toEqual(['Drank a major potion.', 'Drank a minor potion.'])
    const hero = await heroDoc(t, heroId)
    expect(hero.counters.potionsUsed).toBe(2)
  })

  it('combines three minors and one Scrap into a major, once per receipt, naming the shortfall otherwise', async () => {
    const heroId = await seedHero(t, { bagCapacity: 10 }, 'Ben')
    const user = as(t, 'Ben')
    await givePotions(t, heroId, { minor_potion: 7 })
    expect(await errorCode(user.mutation(api.inventory.combinePotions, { operationId: opId() }))).toBe('NOT_ENOUGH_MATERIALS')
    await giveMaterials(t, heroId, { scrap: 2 })
    expect(await errorCode(user.mutation(api.inventory.combinePotions, { operationId: opId(), batches: 3 }))).toBe('NOT_ENOUGH_POTIONS')
    const before = await user.query(api.inventory.mine, {})
    expect(before.potionCombine).toMatchObject({ from: { templateId: 'minor_potion', count: 3, have: 7 }, to: { templateId: 'major_potion' }, materials: { scrap: 1 }, batches: 2, shortfall: { potions: 0, materials: {} } })
    const operationId = opId()
    expect(await user.mutation(api.inventory.combinePotions, { operationId, batches: 2 })).toMatchObject({ changed: true, count: 2 })
    await user.mutation(api.inventory.combinePotions, { operationId, batches: 2 })
    expect(await potionsOf(t, heroId)).toEqual({ healing_potion: 3, minor_potion: 1, major_potion: 2 })
    expect(await materialsOf(t, heroId)).toEqual({})
    const hero = await heroDoc(t, heroId)
    expect(hero.counters.potionsCombined).toBe(2)
    expect((await logs(t, heroId)).map((log) => log.summary)).toEqual(['Combined 6 minor potions and 2 Scrap into 2 major potions.'])
    const after = await user.query(api.inventory.mine, {})
    expect(after.potions).toBe(6)
    expect(after.potionCombine).toMatchObject({ batches: 0, shortfall: { potions: 2, materials: { scrap: 1 } } })
    expect(await errorCode(user.mutation(api.inventory.combinePotions, { operationId: opId(), batches: 0 }))).toBe('INVALID_INPUT')
  })

  it('never lets the merchant or a decision overflow the pouch, and both add to the healing row beside other strengths', async () => {
    const heroId = await seedHero(t, { level: 6, hp: 1, gold: 500, potionCap: 20, merchant: { offers: [{ id: 'potions', name: '3 healing potions', quantity: 3, price: 36 }], expiresAtTick: 5, biomeId: 'office_cubicles' } }, 'Cal')
    const user = as(t, 'Cal')
    await givePotions(t, heroId, { minor_potion: 15 })
    // 18 held of 20: three more would overflow.
    expect(await errorCode(user.mutation(api.inventory.buyOffer, { operationId: opId(), offerId: 'potions' }))).toBe('POUCH_FULL')
    await user.mutation(api.inventory.usePotion, { operationId: opId(), templateId: 'minor_potion' })
    expect(await user.mutation(api.inventory.buyOffer, { operationId: opId(), offerId: 'potions' })).toMatchObject({ changed: true })
    expect(await potionsOf(t, heroId)).toEqual({ healing_potion: 6, minor_potion: 14 })
    const view = await user.query(api.heroes.mine, {})
    expect(view.choice).toBeNull()
  })

  it('has one strength under v13: the view lists the healing row alone and combining is unavailable', async () => {
    await t.run(async (ctx) => {
      const world = (await ctx.db.query('worldState').first())!
      await ctx.db.patch(world._id, { activeContentVersion: 'v13' })
    })
    const heroId = await seedHero(t, { hp: 5 }, 'Dee')
    const user = as(t, 'Dee')
    expect(await errorCode(user.mutation(api.inventory.combinePotions, { operationId: opId() }))).toBe('POTIONS_UNAVAILABLE')
    const view = await user.query(api.inventory.mine, {})
    expect(view.potionRows).toEqual([{ templateId: 'healing_potion', name: 'Healing Potion', healPct: 40, heals: expect.any(Number), count: 3 }])
    expect(view.potionCombine).toBeNull()
    await user.mutation(api.inventory.usePotion, { operationId: opId(), templateId: 'major_potion' })
    expect((await logs(t, heroId)).map((log) => log.summary)).toEqual(['Drank a potion.'])
    expect(await potionsOf(t, heroId)).toEqual({ healing_potion: 2 })
  })
})
