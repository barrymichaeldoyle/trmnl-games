// @vitest-environment edge-runtime
import { convexTest } from 'convex-test'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { api, internal } from '@trmnl-games/backend/api'
import type { Id } from '@trmnl-games/backend/data-model'
import schema from '../../apps/backend/convex/schema'
import { contentV24 } from '@trmnl-games/desk-crawler/content/v24'
import { heroMaxHp } from '@trmnl-games/desk-crawler/sim/core/stats'
import { runTick, seedHero, seedWorld, type T } from './helpers'

const modules = import.meta.glob('../../apps/backend/convex/**/*.ts')
const hp = heroMaxHp(contentV24, { level: 14, class: 'warrior' })
/** An Auditor one blow from falling, so the next fight tick is the win. */
const standoff = { monsterId: 'auditor', biomeId: 'archive', hp: 1, maxHp: 1160, startedTick: 0, untilTick: 24 }
const hero = { level: 14, hp, biomeId: 'archive', bagCapacity: 24, standoff }

const heroDoc = (t: T, id: Id<'heroes'>) => t.run(async (ctx) => (await ctx.db.get(id))!)
const as = async (t: T, id: Id<'heroes'>) => {
  const user = await t.run(async (ctx) => (await ctx.db.get((await ctx.db.get(id))!.userId))!)
  return t.withIdentity({ tokenIdentifier: user.tokenIdentifier })
}

describe('dug-in elites (D163)', () => {
  let t: T
  beforeEach(() => {
    vi.useFakeTimers()
    vi.setSystemTime(Date.UTC(2026, 9, 14, 10, 0, 2))
    t = convexTest(schema, modules)
  })
  afterEach(() => vi.useRealTimers())

  it('pays a fall once, through a duplicate worker, and stores the log', async () => {
    await seedWorld(t, { activeContentVersion: 'v24' })
    const id = await seedHero(t, hero)
    const runId = (await runTick(t))!
    const after = await heroDoc(t, id)
    expect(after.standoff).toBeUndefined()
    expect(after.counters.standoffsWon).toBe(1)
    expect(after.counters.eliteWins).toBe(1)
    const items = await t.run(async (ctx) => await ctx.db.query('items').withIndex('by_heroId', (q) => q.eq('heroId', id)).collect())
    const found = items.filter((item) => item.kind !== 'potion' && item._id !== after.weaponId && item._id !== after.armorId)
    expect(found).toHaveLength(1)
    expect(['rare', 'epic']).toContain(found[0]!.rarity)
    const logs = await t.run(async (ctx) => await ctx.db.query('tickLogs').withIndex('by_heroId_and_at_and_sequence', (q) => q.eq('heroId', id)).collect())
    const log = logs.find((entry) => entry.kind === 'combat' || entry.kind === 'levelup')
    expect(log?.detail.outcome).toMatchObject({ variant: 'combat', standoff: 'won', monsterHpMax: 1160 })
    // A duplicate page worker changes nothing.
    await t.mutation(internal.sim.runs.tick.simulateBatch, { runId, expectedSequence: 0 })
    expect(await heroDoc(t, id)).toEqual(after)
  })

  it('drops a standoff quietly when the live catalog cannot fight it', async () => {
    await seedWorld(t, { activeContentVersion: 'v23' })
    const id = await seedHero(t, hero)
    await runTick(t)
    const after = await heroDoc(t, id)
    expect(after.standoff).toBeUndefined()
    expect(after.simulationState).toBe('healthy')
    expect(after.lastTick).toBe(1)
  })

  it('walks away once, and a repeat is a no-op', async () => {
    await seedWorld(t, { activeContentVersion: 'v24' })
    const id = await seedHero(t, hero)
    const user = await as(t, id)
    expect(await user.mutation(api.heroes.walkAway, { operationId: 'walk-away-1' })).toMatchObject({ changed: true })
    expect((await heroDoc(t, id)).standoff).toBeUndefined()
    expect(await user.mutation(api.heroes.walkAway, { operationId: 'walk-away-2' })).toMatchObject({ changed: false })
  })

  it('asks before travel leaves a dug-in elite behind', async () => {
    await seedWorld(t, { activeContentVersion: 'v24' })
    const id = await seedHero(t, hero)
    const user = await as(t, id)
    await expect(user.mutation(api.heroes.changeBiome, { operationId: 'travel-0001', biomeId: 'cafeteria_depths' })).rejects.toThrow(/STANDOFF_RUNNING|dug-in/)
    expect((await heroDoc(t, id)).standoff).toEqual(standoff)
    await user.mutation(api.heroes.changeBiome, { operationId: 'travel-0002', biomeId: 'cafeteria_depths', leaveStandoff: true })
    const after = await heroDoc(t, id)
    expect(after.status).toBe('travelling')
    expect(after.standoff).toBeUndefined()
  })
})
