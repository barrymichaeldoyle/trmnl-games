// @vitest-environment edge-runtime
import { convexTest } from 'convex-test'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { api } from '@trmnl-games/backend/api'
import type { Id } from '@trmnl-games/backend/data-model'
import schema from '../../apps/backend/convex/schema'
import { runTick, seedHero, seedWorld, type T } from './helpers'

const modules = import.meta.glob('../../apps/backend/convex/**/*.ts')
/** 10:00 UTC on 2026-10-13, two seconds into the slot. */
const SLOT = Date.UTC(2026, 9, 13, 10, 0, 2)
const DAY = 24 * 60 * 60_000
let op = 0
const opId = () => `roster-op-${String(++op).padStart(6, '0')}`
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
const heroesOf = (t: T, heroId: Id<'heroes'>) =>
  t.run(async (ctx) => {
    const userId = (await ctx.db.get(heroId))!.userId
    return await ctx.db.query('heroes').withIndex('by_userId_and_isActive', (q) => q.eq('userId', userId)).collect()
  })

describe('hero roster (P37)', () => {
  let t: T
  beforeEach(() => {
    vi.useFakeTimers()
    vi.setSystemTime(SLOT)
    t = convexTest(schema, modules)
  })
  afterEach(() => {
    vi.useRealTimers()
  })

  it('stays closed before content v18 and below the Warrior level, then recruits a Rogue that becomes current', { timeout: 30_000 }, async () => {
    await seedWorld(t, { activeContentVersion: 'v17', currentTick: 40 })
    const warrior = await seedHero(t, { level: 6, name: 'Tobias' }, 'Ana')
    const ana = as(t, 'Ana')
    expect(await errorCode(ana.mutation(api.roster.recruit, { operationId: opId(), heroClass: 'rogue', name: 'Vex' }))).toBe('INVALID_INPUT')
    expect(await ana.query(api.roster.mine, { now: Date.now() })).toMatchObject({ available: false, open: false })

    await t.run(async (ctx) => {
      const world = (await ctx.db.query('worldState').first())!
      await ctx.db.patch(world._id, { activeContentVersion: 'v18' })
      await ctx.db.patch(warrior, { level: 5 })
    })
    expect(await ana.query(api.roster.mine, { now: Date.now() })).toMatchObject({ available: true, open: false, unlockLevel: 6, warriorLevel: 5 })
    expect(await errorCode(ana.mutation(api.roster.recruit, { operationId: opId(), heroClass: 'rogue', name: 'Vex' }))).toBe('LOCKED')

    await t.run(async (ctx) => await ctx.db.patch(warrior, { level: 6 }))
    expect(await errorCode(ana.mutation(api.roster.recruit, { operationId: opId(), heroClass: 'warrior', name: 'Vex' }))).toBe('INVALID_STATE')
    await ana.mutation(api.roster.recruit, { operationId: opId(), heroClass: 'rogue', name: 'Vex' })

    const heroes = await heroesOf(t, warrior)
    const rogue = heroes.find((hero) => hero.class === 'rogue')!
    expect(rogue).toMatchObject({ name: 'Vex', level: 1, hp: 93, isActive: true, activationState: 'active', eligibleFromTick: 41 })
    expect(await heroDoc(t, warrior)).toMatchObject({ isActive: false, parkedAtTick: 40 })
    expect((await ana.query(api.heroes.mine, {}))!).toMatchObject({ name: 'Vex', maxHp: 93 })
    const roster = await ana.query(api.roster.mine, { now: Date.now() })
    expect(roster.heroes.map((hero: { name: string; current: boolean; parkedFor: number | null }) => [hero.name, hero.current, hero.parkedFor])).toEqual([['Tobias', false, 0], ['Vex', true, null]])
    expect(roster.classes.map((c: { id: string; recruited: boolean }) => [c.id, c.recruited])).toEqual([['warrior', true], ['rogue', true]])
    // A second recruit of either class is refused.
    expect(await errorCode(ana.mutation(api.roster.recruit, { operationId: opId(), heroClass: 'rogue', name: 'Other' }))).toBe('INVALID_STATE')
  })

  it('serves the log of the hero the page names, current or parked, so a recruit or switch never changes a page under its cursor', { timeout: 30_000 }, async () => {
    await seedWorld(t, { activeContentVersion: 'v18', currentTick: 40 })
    const warrior = await seedHero(t, { level: 7, name: 'Tobias' }, 'Ana')
    await t.run(async (ctx) => {
      await ctx.db.insert('tickLogs', { heroId: warrior, source: 'tick', sequence: 0, tick: 39, at: SLOT - 60_000, kind: 'rest', summary: 'Rested at the desk.', detail: { v: 1, operation: 'x' }, deltas: { xpEarned: 0, gold: 0, hp: 0 } })
    })
    const ana = as(t, 'Ana')
    await ana.mutation(api.roster.recruit, { operationId: opId(), heroClass: 'rogue', name: 'Vex' })
    const rogue = (await heroesOf(t, warrior)).find((hero) => hero.class === 'rogue')!._id
    const first = { numItems: 10, cursor: null }
    // The parked Warrior's page is still the Warrior's log, with a real cursor.
    const parked = await ana.query(api.heroes.recentLog, { heroId: warrior, paginationOpts: first })
    expect(parked.page.map((row: { summary: string }) => row.summary)).toEqual(['Clocked out. [[Vex]] takes the desk.', 'Rested at the desk.'])
    // TRMNL-GAMES-CONVEX-8: a live page re-runs from its pinned end cursor. Switching back to the Warrior used to turn
    // the same page from an empty stand-in (cursor "") into the real query, which then refused that cursor.
    vi.setSystemTime(SLOT + 5 * 60_000)
    await ana.mutation(api.roster.switchHero, { operationId: opId(), heroId: warrior })
    const rerun = await ana.query(api.heroes.recentLog, { heroId: warrior, paginationOpts: { ...first, endCursor: parked.continueCursor } })
    // The first page grows by the switch's own line on top and keeps everything it had.
    expect(rerun.page.slice(1)).toEqual(parked.page)
    expect(await ana.query(api.heroes.latestLog, {})).toEqual(rerun.page[0])
    // The Rogue's page, now parked, still reads its own log, and another player's hero reads nothing.
    const rogues = (await ana.query(api.heroes.recentLog, { heroId: rogue, paginationOpts: first })).page
    expect(rogues.map((row: { summary: string }) => row.summary)).not.toContain('Rested at the desk.')
    await seedHero(t, { level: 3, name: 'Bo' }, 'Ben')
    const bens = (await as(t, 'Ben').query(api.heroes.mine, {}))!.id
    expect(await ana.query(api.heroes.recentLog, { heroId: bens, paginationOpts: first })).toMatchObject({ page: [], isDone: true })
  })

  it('switches once a day, with a ten-minute undo back to the hero just left', { timeout: 30_000 }, async () => {
    await seedWorld(t, { activeContentVersion: 'v18', currentTick: 40 })
    const warrior = await seedHero(t, { level: 7, name: 'Tobias' }, 'Ana')
    const ana = as(t, 'Ana')
    await ana.mutation(api.roster.recruit, { operationId: opId(), heroClass: 'rogue', name: 'Vex' })
    const rogue = (await heroesOf(t, warrior)).find((hero) => hero.class === 'rogue')!._id

    // Within ten minutes, going back is an undo.
    vi.setSystemTime(SLOT + 5 * 60_000)
    expect((await ana.query(api.roster.mine, { now: Date.now() })).undoHeroId).toBe(warrior)
    await ana.mutation(api.roster.switchHero, { operationId: opId(), heroId: warrior })
    expect((await ana.query(api.heroes.mine, {}))!.name).toBe('Tobias')
    // The undo cannot be undone, and the day's clock still runs from the recruit.
    expect(await errorCode(ana.mutation(api.roster.switchHero, { operationId: opId(), heroId: rogue }))).toBe('RATE_LIMITED')
    expect((await ana.query(api.roster.mine, { now: Date.now() })).nextAt).toBe(SLOT + DAY)

    vi.setSystemTime(SLOT + DAY + 1000)
    await ana.mutation(api.roster.switchHero, { operationId: opId(), heroId: rogue })
    expect((await ana.query(api.heroes.mine, {}))!.name).toBe('Vex')
    // Past the ten minutes, going back waits for the next day.
    vi.setSystemTime(SLOT + DAY + 20 * 60_000)
    expect(await errorCode(ana.mutation(api.roster.switchHero, { operationId: opId(), heroId: warrior }))).toBe('RATE_LIMITED')
    // Switching to the current hero changes nothing.
    expect(await ana.mutation(api.roster.switchHero, { operationId: opId(), heroId: rogue })).toMatchObject({ changed: false })
  })

  it('refuses to park a hero that is knocked out or travelling, and a hero of another account', { timeout: 30_000 }, async () => {
    await seedWorld(t, { activeContentVersion: 'v18', currentTick: 40 })
    const warrior = await seedHero(t, { level: 7, status: 'dead', reviveAtTick: 45 }, 'Ana')
    const other = await seedHero(t, { level: 7 }, 'Bo')
    const ana = as(t, 'Ana')
    expect(await errorCode(ana.mutation(api.roster.recruit, { operationId: opId(), heroClass: 'rogue', name: 'Vex' }))).toBe('INVALID_STATE')
    await t.run(async (ctx) => await ctx.db.patch(warrior, { status: 'travelling', reviveAtTick: undefined, targetBiomeId: 'server_room', arriveAtTick: 44 }))
    expect(await errorCode(ana.mutation(api.roster.recruit, { operationId: opId(), heroClass: 'rogue', name: 'Vex' }))).toBe('INVALID_STATE')
    expect(await errorCode(ana.mutation(api.roster.switchHero, { operationId: opId(), heroId: other }))).toBe('HERO_NOT_FOUND')
  })

  it('freezes a parked hero: no ticks while away, its timers move on by the gap, the merchant leaves', { timeout: 30_000 }, async () => {
    await seedWorld(t, { activeContentVersion: 'v18', currentTick: 40 })
    const warrior = await seedHero(t, {
      level: 7,
      lastTick: 40,
      eligibleFromTick: 1,
      effects: [{ id: 'fired_up', untilTick: 46 }],
      choice: { eventId: 'misfiled_expense', offeredAtTick: 38, expiresAtTick: 134, biomeTier: 1 },
      merchant: { expiresAtTick: 43, offers: [], biomeId: 'office_cubicles' },
    }, 'Ana')
    const ana = as(t, 'Ana')
    await ana.mutation(api.roster.recruit, { operationId: opId(), heroClass: 'rogue', name: 'Vex' })
    const rogue = (await heroesOf(t, warrior)).find((hero) => hero.class === 'rogue')!._id
    expect((await heroDoc(t, warrior)).merchant).toBeUndefined()

    for (let slot = 1; slot <= 6; slot += 1) {
      vi.setSystemTime(SLOT + slot * 15 * 60_000)
      await runTick(t)
    }
    const parked = await heroDoc(t, warrior)
    expect(parked.lastTick).toBe(40)
    expect((await heroDoc(t, rogue)).lastTick).toBe(46)

    vi.setSystemTime(SLOT + DAY + 1000)
    await ana.mutation(api.roster.switchHero, { operationId: opId(), heroId: warrior })
    const back = await heroDoc(t, warrior)
    expect(back).toMatchObject({ isActive: true, effects: [{ id: 'fired_up', untilTick: 52 }], choice: { offeredAtTick: 44, expiresAtTick: 140 }, eligibleFromTick: 47 })
    expect(back.parkedAtTick).toBeUndefined()
    expect(await heroDoc(t, rogue)).toMatchObject({ isActive: false, parkedAtTick: 46 })
  })

  it('deletes every hero on the roster with the game', { timeout: 30_000 }, async () => {
    await seedWorld(t, { activeContentVersion: 'v18', currentTick: 40 })
    const warrior = await seedHero(t, { level: 7 }, 'Ana')
    const ana = as(t, 'Ana')
    await ana.mutation(api.roster.recruit, { operationId: opId(), heroClass: 'rogue', name: 'Vex' })
    const ids = (await heroesOf(t, warrior)).map((hero) => hero._id)
    expect(ids).toHaveLength(2)
    await ana.mutation(api.deletion.requestGameDeletion, { operationId: opId(), confirm: 'DELETE' })
    await t.finishAllScheduledFunctions(vi.runAllTimers)
    const left = await t.run(async (ctx) => ({
      heroes: await Promise.all(ids.map((id) => ctx.db.get(id))),
      items: (await Promise.all(ids.map((id) => ctx.db.query('items').withIndex('by_heroId', (q) => q.eq('heroId', id)).collect()))).flat(),
    }))
    expect(left).toEqual({ heroes: [null, null], items: [] })
  })
})
