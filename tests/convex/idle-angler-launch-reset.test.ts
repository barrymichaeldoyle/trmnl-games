// @vitest-environment edge-runtime
import { convexTest } from 'convex-test'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { internal } from '@trmnl-games/backend/api'
import { LAUNCH_LOG } from '@trmnl-games/idle-angler/sim'
import schema from '../../apps/backend/convex/schema'
import { LAUNCH_RESET_CONFIRM } from '../../apps/backend/convex/idleAngler/launchReset'
import { seedWorld, type T } from './helpers'
import { nextIdleAnglerTick, runIdleAnglerTick, seedAngler } from './idleAnglerHelpers'

const modules = import.meta.glob('../../apps/backend/convex/**/*.ts')
const SLOT = Date.UTC(2026, 10, 8, 10, 5, 2)
const iaWorld = async (t: T) => await t.run(async (ctx) => await ctx.db.query('iaWorldState').first())

describe('Idle Angler public-launch reset (D224)', () => {
  let t: T
  beforeEach(async () => {
    vi.useFakeTimers()
    vi.setSystemTime(SLOT)
    t = convexTest(schema, modules)
    await seedWorld(t)
    await runIdleAnglerTick(t)
  })
  afterEach(() => vi.useRealTimers())

  it('restarts every account on the Millpond and wipes what was earned before the listing', { timeout: 30_000 }, async () => {
    const ana = await seedAngler(t, { gold: 900, rodTier: 3, coolerTier: 2, waterId: 'river_bend', access: ['waders'], publicProfile: true }, 'Ana')
    const bo = await seedAngler(t, { activationState: 'pending_trmnl', activatedAt: undefined }, 'Bo')
    const { anaUser, boUser } = await t.run(async (ctx) => {
      const angler = (await ctx.db.get(ana))!
      const now = Date.now()
      await ctx.db.insert('catches', { anglerId: ana, speciesId: 'perch', grams: 640, value: 30, caughtTick: 1, contentVersion: 'v1', createdAt: now })
      await ctx.db.insert('iaTrophies', { anglerId: ana, userId: angler.userId, kind: 'fish', speciesId: 'perch', grams: 900, water: 'millpond', at: now, peg: 0 })
      await ctx.db.insert('iaCatchRecords', { waterId: 'millpond', period: 'all', anglerId: ana, userId: angler.userId, speciesId: 'perch', grams: 900, at: now, earlierFirst: -now })
      await ctx.db.insert('iaOpenAwards', { period: 'o2026-11-01', waterId: 'millpond', awarded: 1, at: now })
      await ctx.db.insert('iaAchievements', { userId: angler.userId, anglerId: ana, achievementId: 'first_bite', unlockedAt: now, tick: 1, catalogVersion: 1 })
      await ctx.db.insert('flyBoxes', { userId: angler.userId, totalCollected: 2, lastClaimWeek: 2965, lastClaimedAt: now })
      await ctx.db.insert('alertOutbox', { userId: angler.userId, anglerId: ana, kind: 'cooler_full', key: `${ana}:cooler_full:1`, eventTick: 1, state: 'pending', notBefore: now, attempts: 0, createdAt: now, updatedAt: now })
      return { anaUser: angler.userId, boUser: (await ctx.db.get(bo))!.userId }
    })
    await nextIdleAnglerTick(t)

    expect(await t.mutation(internal.idleAngler.launchReset.start, { confirm: LAUNCH_RESET_CONFIRM })).toEqual({ accounts: 2 })
    expect((await iaWorld(t))?.ticksPaused).toBe(true)
    await t.finishAllScheduledFunctions(vi.runAllTimers)

    const after = await t.run(async (ctx) => ({
      anglers: await ctx.db.query('anglers').collect(),
      catches: await ctx.db.query('catches').collect(),
      trophies: await ctx.db.query('iaTrophies').collect(),
      records: await ctx.db.query('iaCatchRecords').collect(),
      awards: await ctx.db.query('iaOpenAwards').collect(),
      unlocks: await ctx.db.query('iaAchievements').collect(),
      boxes: await ctx.db.query('flyBoxes').collect(),
      alerts: await ctx.db.query('alertOutbox').collect(),
      publications: await ctx.db.query('iaLeaderboardPublications').collect(),
      profiles: await ctx.db.query('idleAnglerProfiles').collect(),
      logs: await ctx.db.query('iaTickLogs').collect(),
      audit: (await ctx.db.query('adminAuditEvents').collect()).map((event) => event.outcome),
    }))
    expect(after.anglers).toHaveLength(2)
    const anaAfter = after.anglers.find((angler) => angler.userId === anaUser)!
    expect(anaAfter).toMatchObject({ isActive: true, activationState: 'active', waterId: 'millpond', rodTier: 1, coolerTier: 1, access: [], publicProfile: true, logSequence: 2 })
    expect(anaAfter.gold).toBeLessThan(900)
    expect(after.anglers.find((angler) => angler.userId === boUser)).toMatchObject({ activationState: 'pending_trmnl', waterId: 'millpond' })
    for (const id of [ana, bo]) expect(after.anglers.some((angler) => angler._id === id)).toBe(false)
    expect(after.catches).toEqual([])
    expect(after.trophies).toEqual([])
    expect(after.records).toEqual([])
    expect(after.awards).toEqual([])
    expect(after.unlocks).toEqual([])
    expect(after.boxes).toEqual([])
    expect(after.alerts).toEqual([])
    expect(after.publications).toEqual([])
    expect(after.profiles.find((profile) => profile.userId === anaUser)).toMatchObject({ state: 'active', anglerId: anaAfter._id })
    expect(after.logs.filter((log) => log.anglerId === anaAfter._id).map((log) => log.summary)).toEqual([expect.stringContaining('Millpond'), LAUNCH_LOG])
    expect(after.logs.every((log) => after.anglers.some((angler) => angler._id === log.anglerId))).toBe(true)
    expect(after.audit).toEqual(['started', expect.stringMatching(/^completed:\d+:2$/)])
    expect(await iaWorld(t)).toMatchObject({ ticksPaused: false })
    expect((await iaWorld(t))?.publishedPublicationId).toBeUndefined()

    // The restarted anglers fish on the next tick.
    await nextIdleAnglerTick(t)
    const ticked = await t.run(async (ctx) => await ctx.db.get(anaAfter._id))
    expect(ticked!.lastTick).toBeGreaterThan(anaAfter.lastTick)
  })

  it('refuses while a run is active', async () => {
    await seedAngler(t, {}, 'Ana')
    vi.advanceTimersByTime(15 * 60_000)
    await t.mutation(internal.idleAngler.tick.startTick, {})
    await expect(t.mutation(internal.idleAngler.launchReset.start, { confirm: LAUNCH_RESET_CONFIRM })).rejects.toThrow(/run is active/)
  })
})
