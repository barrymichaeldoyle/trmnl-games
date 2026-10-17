// @vitest-environment edge-runtime
import { convexTest } from 'convex-test'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { api, internal } from '@trmnl-games/backend/api'
import type { Id } from '@trmnl-games/backend/data-model'
import { contentV24 } from '@trmnl-games/desk-crawler/content/v24'
import schema from '../../apps/backend/convex/schema'
import { runTick, seedHero, seedWorld, type T } from './helpers'

const modules = import.meta.glob('../../apps/backend/convex/**/*.ts')
/** 10:00 UTC on 2026-10-12, two seconds into the slot. */
const SLOT = Date.UTC(2026, 9, 12, 10, 0, 2)
let op = 0
const opId = () => `career-op-${String(++op).padStart(6, '0')}`
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
const logs = (t: T, heroId: Id<'heroes'>) => t.run(async (ctx) => await ctx.db.query('tickLogs').withIndex('by_heroId_and_at_and_sequence', (q) => q.eq('heroId', heroId)).collect())

/** Advance the clock one slot and run a tick. */
async function tickAt(t: T, slot: number) {
  vi.setSystemTime(SLOT + slot * 15 * 60_000)
  await runTick(t)
}

describe('career ladder backend (P35)', () => {
  let t: T
  beforeEach(() => {
    vi.useFakeTimers()
    vi.setSystemTime(SLOT)
    t = convexTest(schema, modules)
  })
  afterEach(() => {
    vi.useRealTimers()
    vi.unstubAllEnvs()
  })

  it('places a new hero on the ladder at its first v12 tick and logs a reached rung after the story, in sequence', { timeout: 30_000 }, async () => {
    await seedWorld(t, { activeContentVersion: 'v12', currentTick: 10 })
    const heroId = await seedHero(t, {}, 'Ana')
    // Up to a dozen ticks for the first win; the first rung pays with it.
    let hero = await heroDoc(t, heroId)
    for (let slot = 0; slot < 12 && (hero.counters.careerRungs ?? 0) === 0; slot += 1) {
      await tickAt(t, slot)
      hero = await heroDoc(t, heroId)
    }
    expect(hero.career).toBeDefined()
    expect(hero.counters.careerRungs).toBe(1)
    expect(hero.career?.reached).toEqual([{ id: 'first_win', tick: expect.any(Number), at: expect.any(Number) }])
    // Level 1: no to-do list yet, and no stance in play.
    expect(hero.todo).toBeUndefined()
    const rows = (await logs(t, heroId)).filter((log) => log.source === 'tick').sort((a, b) => a.sequence - b.sequence)
    const line = rows.find((log) => log.kind === 'career')!
    expect(line.summary).toBe('Goal reached: Win your first fight. Next: Equip a piece of gear you found.')
    expect(line.detail).toMatchObject({ outcome: { variant: 'career', phase: 'reached', id: 'first_win', gold: 10 } })
    expect(line.deltas).toEqual({ xpEarned: 0, gold: 0, hp: 0 })
    expect(hero.career?.unclaimed).toEqual([{ id: 'first_win', gold: 10, tick: expect.any(Number), at: expect.any(Number) }])
    // D129: the claim pays it once and logs a command line; a second claim finds nothing waiting.
    const before = hero.gold
    const claimed = await as(t, 'Ana').mutation(api.heroes.claimGoal, { operationId: opId() })
    expect(claimed).toMatchObject({ changed: true, gold: 10 })
    const after = await heroDoc(t, heroId)
    expect(after.gold).toBe(before + 10)
    expect(after.counters.goldEarned).toBe((hero.counters.goldEarned ?? 0) + 10)
    expect(after.career?.unclaimed).toBeUndefined()
    expect((await logs(t, heroId)).at(-1)).toMatchObject({ source: 'command', summary: 'Claimed 10 gold for a goal: Win your first fight.', deltas: { gold: 10 } })
    expect(await errorCode(as(t, 'Ana').mutation(api.heroes.claimGoal, { operationId: opId() }))).toBe('NOTHING_TO_CLAIM')
    // The goal line follows its tick's story with the next sequence number.
    const story = rows.find((log) => log.tick === line.tick && log.kind !== 'career' && log.kind !== 'achievement')!
    expect(line.sequence).toBe(story.sequence + 1)
    expect((await heroDoc(t, heroId)).logSequence).toBe(Math.max(...(await logs(t, heroId)).map((log) => log.sequence)))
  })

  it('writes no ladder under v11', { timeout: 30_000 }, async () => {
    await seedWorld(t, { activeContentVersion: 'v11', currentTick: 10 })
    const heroId = await seedHero(t, {}, 'Bo')
    await runTick(t)
    const hero = await heroDoc(t, heroId)
    expect(hero.career).toBeUndefined()
    expect((await logs(t, heroId)).some((log) => log.kind === 'career')).toBe(false)
  })

  it('refuses a stance below level 3 and counts an equip, so the companion rungs can be reached', { timeout: 30_000 }, async () => {
    await seedWorld(t, { activeContentVersion: 'v12', currentTick: 10 })
    const heroId = await seedHero(t, { level: 2 }, 'Cy')
    expect(await errorCode(as(t, 'Cy').mutation(api.heroes.setStance, { operationId: opId(), stance: 'bold' }))).toBe('LOCKED')
    await t.run(async (ctx) => await ctx.db.patch(heroId, { level: 3 }))
    await as(t, 'Cy').mutation(api.heroes.setStance, { operationId: opId(), stance: 'bold' })
    expect((await heroDoc(t, heroId)).stance).toBe('bold')
    // A spare weapon in the bag, equipped once.
    const spare = await t.run(async (ctx) => {
      const hero = (await ctx.db.get(heroId))!
      const weapon = (await ctx.db.get(hero.weaponId!))!
      return await ctx.db.insert('items', { ...weapon, _id: undefined, _creationTime: undefined, attack: weapon.attack + 1 } as never)
    })
    await as(t, 'Cy').mutation(api.inventory.equip, { operationId: opId(), itemId: spare })
    expect((await heroDoc(t, heroId)).counters.itemsEquipped).toBe(1)
    // Equipping what is already worn changes nothing and counts nothing.
    await as(t, 'Cy').mutation(api.inventory.equip, { operationId: opId(), itemId: spare })
    expect((await heroDoc(t, heroId)).counters.itemsEquipped).toBe(1)
  })

  it('returns the goal, the ladder and the unlocks to the owner', { timeout: 30_000 }, async () => {
    await seedWorld(t, { activeContentVersion: 'v12', currentTick: 10 })
    const heroId = await seedHero(t, { level: 4, biomeId: 'server_room', bagCapacity: 6, counters: { combatWins: 20, retreats: 0, deaths: 0, rescues: 0, goldEarned: 100, itemsFound: 3, ticksExplored: 300, itemsEquipped: 1, tasksCompleted: 3, itemsSold: 2, stanceChanges: 1, trips: 1 } }, 'Di')
    await runTick(t)
    const view = await as(t, 'Di').query(api.heroes.mine, {})
    // Everything up to the first trip was done before the ladder: the current goal is the Laptop Backpack.
    expect(view.career.current).toMatchObject({ id: 'laptop_backpack', title: 'Buy the Laptop Backpack', gold: 30, companion: true, value: 10, target: 13 })
    expect(view.career.rungs.filter((r: { state: string }) => r.state === 'done').map((r: { id: string; reachedAt: number | null }) => [r.id, r.reachedAt])).toEqual([['first_win', null], ['equip_find', null], ['level_2', null], ['three_tasks', null], ['first_sale', null], ['pick_stance', null], ['level_4', null], ['first_trip', null]])
    expect(view.unlocks).toEqual([
      { feature: 'todo', label: 'the to-do list', level: 2, unlocked: true },
      { feature: 'stances', label: 'stances', level: 3, unlocked: true },
      { feature: 'choices', label: 'office decisions', level: 5, unlocked: false },
      { feature: 'merchant', label: 'the wandering merchant', level: 6, unlocked: false },
      { feature: 'raids', label: 'desk raids', level: 7, unlocked: false },
    ])
    expect((await heroDoc(t, heroId)).career?.rung).toBe(8)
  })

  it('keeps heroes below the raid unlock out of raids on both sides', { timeout: 120_000 }, async () => {
    await seedWorld(t, { activeContentVersion: 'v12', currentTick: 10, lastPublishedAt: SLOT - 30 * 60_000 })
    // Bold heroes launch most often (20 in 1,000 exploring ticks); below level 7 the draw is never taken.
    for (const alias of ['Eli', 'Fen', 'Gus', 'Hal', 'Ida', 'Jo']) await seedHero(t, { level: 6, hp: 60, gold: 400, stance: 'bold' }, alias)
    for (let slot = 0; slot < 24; slot += 1) await tickAt(t, slot)
    expect(await t.run(async (ctx) => await ctx.db.query('raids').collect())).toEqual([])
    expect(await t.run(async (ctx) => await ctx.db.query('raidPool').collect())).toHaveLength(6)
    // The same desks at level 7 raid each other.
    await t.run(async (ctx) => {
      for (const hero of await ctx.db.query('heroes').collect()) await ctx.db.patch(hero._id, { level: 7, xp: 0, hp: 60 })
    })
    // Six bold desks over 80 ticks draw about ten launches, so an empty ledger here would be the gate, not luck.
    for (let slot = 24; slot < 104; slot += 1) await tickAt(t, slot)
    expect((await t.run(async (ctx) => await ctx.db.query('raids').collect())).length).toBeGreaterThan(0)
  })

  it('opens stances at level 7 under v15 and hides the retired stance goal unless it was reached (D132)', { timeout: 30_000 }, async () => {
    await seedWorld(t, { activeContentVersion: 'v15', currentTick: 10 })
    const heroId = await seedHero(t, { level: 6 }, 'Di')
    expect(await errorCode(as(t, 'Di').mutation(api.heroes.setStance, { operationId: opId(), stance: 'bold' }))).toBe('LOCKED')
    await t.run(async (ctx) => await ctx.db.patch(heroId, { level: 7 }))
    await as(t, 'Di').mutation(api.heroes.setStance, { operationId: opId(), stance: 'bold' })
    expect((await heroDoc(t, heroId)).stance).toBe('bold')
    // Past the retired rung without reaching it: the page neither lists nor counts it.
    await t.run(async (ctx) => await ctx.db.patch(heroId, { career: { rung: 7, startedTick: 0, reached: [] } }))
    let view = (await as(t, 'Di').query(api.heroes.mine, {}))!
    expect(view.career!.rungs.map((rung) => rung.id)).not.toContain('pick_stance')
    expect(view.career).toMatchObject({ rung: 6, total: 21, current: { id: 'first_trip' } })
    expect(view.career!.rungs[6]).toMatchObject({ id: 'first_trip', state: 'current' })
    // A hero who reached it under v12 to v14 keeps it in the list.
    await t.run(async (ctx) => await ctx.db.patch(heroId, { career: { rung: 7, startedTick: 0, reached: [{ id: 'pick_stance', tick: 5 }] } }))
    view = (await as(t, 'Di').query(api.heroes.mine, {}))!
    expect(view.career).toMatchObject({ rung: 7, total: 22 })
    expect(view.career!.rungs.find((rung) => rung.id === 'pick_stance')).toMatchObject({ state: 'done' })
    // A pointer still on the retired rung shows the next live one as the goal.
    await t.run(async (ctx) => await ctx.db.patch(heroId, { career: { rung: 5, startedTick: 0, reached: [] } }))
    view = (await as(t, 'Di').query(api.heroes.mine, {}))!
    expect(view.career).toMatchObject({ rung: 5, current: { id: 'level_4' } })
    expect(view.career!.rungs[5]).toMatchObject({ id: 'level_4', state: 'current' })
    // The stance card's floor line reads which biome is safe.
    expect(view.biomes.map((biome) => [biome.id, biome.safe])).toEqual([['office_cubicles', true], ['server_room', false], ['cafeteria_depths', false]])
    expect(view.unlocks.map((entry) => entry.feature)).toEqual(['todo', 'choices', 'merchant', 'stances', 'raids'])
  })

  it('moves every hero to the same rung by id when the world switches from v16 to v17, and back (D135)', { timeout: 30_000 }, async () => {
    await seedWorld(t, { activeContentVersion: 'v16', currentTick: 10 })
    // v16 indices: 12 is the elite goal, 13 the raid goal, 14 the Cafeteria goal; 24 is past the end.
    const before = await seedHero(t, { level: 9 }, 'Bo')
    const low = await seedHero(t, { level: 6 }, 'Cy')
    const balanced = await seedHero(t, { level: 9 }, 'Di')
    const bold = await seedHero(t, { level: 9, stance: 'bold' }, 'Ed')
    const after = await seedHero(t, { level: 9 }, 'Fi')
    const done = await seedHero(t, { level: 20 }, 'Gu')
    const onRaid = { rung: 13, startedTick: 0, reached: [{ id: 'first_elite', tick: 4 }], unclaimed: [{ id: 'first_elite', gold: 40, tick: 4 }] }
    await t.run(async (ctx) => {
      await ctx.db.patch(before, { career: { rung: 12, startedTick: 0, reached: [], armedAt: 3, armedCount: 0 } })
      for (const id of [balanced, bold]) await ctx.db.patch(id, { career: onRaid })
      // Same index, different rung after the switch: the raid goal's armed state cannot carry over to level 7.
      await ctx.db.patch(low, { career: { ...onRaid, armedAt: 5, armedCount: 0 } })
      await ctx.db.patch(after, { career: { rung: 14, startedTick: 0, reached: [], armedAt: 2, armedCount: 1 } })
      await ctx.db.patch(done, { career: { rung: 24, startedTick: 0, reached: [] } })
    })
    expect(await t.mutation(internal.world.setActiveContentVersion, { contentVersion: 'v17' })).toEqual({ from: 'v16', to: 'v17', heroesMoved: 5 })
    expect((await heroDoc(t, before)).career).toEqual({ rung: 12, startedTick: 0, reached: [], armedAt: 3, armedCount: 0 })
    // On the raid goal: the first new goal the hero has not met becomes current, reached rewards untouched.
    expect((await heroDoc(t, low)).career).toEqual({ ...onRaid, rung: 13 })
    expect((await heroDoc(t, balanced)).career).toEqual({ ...onRaid, rung: 14 })
    expect((await heroDoc(t, bold)).career).toEqual({ ...onRaid, rung: 15 })
    expect((await heroDoc(t, after)).career).toEqual({ rung: 16, startedTick: 0, reached: [], armedAt: 2, armedCount: 1 })
    expect((await heroDoc(t, done)).career!.rung).toBe(26)
    // The level-6 hero sees "Reach level 7" as its goal with progress, and the page counts 25.
    const view = (await as(t, 'Cy').query(api.heroes.mine, {}))!
    expect(view.career).toMatchObject({ rung: 12, total: 25, current: { id: 'level_7', value: 6, target: 7 } })
    // Already level 7 and Bold: both new goals read as done, the raid goal stays current.
    const boldView = (await as(t, 'Ed').query(api.heroes.mine, {}))!
    expect(boldView.career).toMatchObject({ rung: 14, current: { id: 'first_raid' } })
    expect(boldView.career!.rungs.filter((rung) => ['level_7', 'go_bold'].includes(rung.id)).map((rung) => rung.state)).toEqual(['done', 'done'])
    // Rolling back lands a hero on either new goal on the raid goal.
    expect(await t.mutation(internal.world.setActiveContentVersion, { contentVersion: 'v16' })).toEqual({ from: 'v17', to: 'v16', heroesMoved: 4 })
    for (const id of [low, balanced, bold]) expect((await heroDoc(t, id)).career).toEqual(onRaid)
    expect((await heroDoc(t, after)).career!.rung).toBe(14)
    expect((await heroDoc(t, done)).career!.rung).toBe(24)
  })

  it('marks Equip a piece of gear you found done as soon as you equip it', { timeout: 30_000 }, async () => {
    const equipFind = contentV24.career!.rungs.findIndex((rung) => rung.id === 'equip_find')
    await seedWorld(t, { activeContentVersion: 'v24', currentTick: 10 })
    const heroId = await seedHero(t, { level: 3, career: { rung: equipFind, startedTick: 0, reached: [] } }, 'Jo')
    const spare = await t.run(async (ctx) => {
      const hero = (await ctx.db.get(heroId))!
      const weapon = (await ctx.db.get(hero.weaponId!))!
      return await ctx.db.insert('items', { ...weapon, _id: undefined, _creationTime: undefined, attack: weapon.attack + 1 } as never)
    })
    await as(t, 'Jo').mutation(api.inventory.equip, { operationId: opId(), itemId: spare })
    const equipped = await heroDoc(t, heroId)
    expect(equipped.career?.reached.map((entry) => entry.id)).toEqual(['equip_find'])
    expect(equipped.career?.unclaimed).toEqual([expect.objectContaining({ id: 'equip_find', gold: 15 })])
    await tickAt(t, 1)
    const after = await heroDoc(t, heroId)
    expect(after.career?.reached.filter((entry) => entry.id === 'equip_find')).toHaveLength(1)
    expect(after.career?.unclaimed?.filter((entry) => entry.id === 'equip_find')).toHaveLength(1)
  })

  it('marks Switch to Bold done when a later switch lands on Bold', { timeout: 30_000 }, async () => {
    const goBold = contentV24.career!.rungs.findIndex((rung) => rung.id === 'go_bold')
    await seedWorld(t, { activeContentVersion: 'v24', currentTick: 10 })
    const rewrite = await seedHero(t, { level: 9, career: { rung: goBold, startedTick: 0, reached: [] } }, 'Kay')
    await as(t, 'Kay').mutation(api.heroes.setStance, { operationId: opId(), stance: 'cautious' })
    expect((await heroDoc(t, rewrite)).career?.rung).toBe(goBold)
    await as(t, 'Kay').mutation(api.heroes.setStance, { operationId: opId(), stance: 'bold' })
    const rewritten = await heroDoc(t, rewrite)
    expect(rewritten.stance).toBe('bold')
    expect(rewritten.career?.reached.map((entry) => entry.id)).toEqual(['go_bold'])
    expect(rewritten.career?.unclaimed).toEqual([expect.objectContaining({ id: 'go_bold', gold: 20 })])

    // Switching away from Bold and straight back undoes the log line and still lands on Bold.
    const undo = await seedHero(t, { level: 9, stance: 'bold', career: { rung: goBold, startedTick: 0, reached: [] } }, 'Lee')
    await as(t, 'Lee').mutation(api.heroes.setStance, { operationId: opId(), stance: 'cautious' })
    expect((await heroDoc(t, undo)).career?.rung).toBe(goBold)
    await as(t, 'Lee').mutation(api.heroes.setStance, { operationId: opId(), stance: 'bold' })
    const undone = await heroDoc(t, undo)
    expect(undone.stance).toBe('bold')
    expect(undone.career?.reached.map((entry) => entry.id)).toEqual(['go_bold'])
    expect(undone.career?.unclaimed).toEqual([expect.objectContaining({ id: 'go_bold', gold: 20 })])
  })
})
