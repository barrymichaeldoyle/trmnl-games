// @vitest-environment edge-runtime
import { convexTest } from 'convex-test'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { internal } from '@trmnl-games/backend/api'
import schema from '../../apps/backend/convex/schema'
import { LAUNCH_RESET_CONFIRM, LAUNCH_RESET_LINE } from '../../apps/backend/convex/launchReset'
import { runTick, seedHero, seedWorld, world, type T } from './helpers'

const modules = import.meta.glob('../../apps/backend/convex/**/*.ts')
const SLOT = Date.UTC(2026, 9, 13, 18, 0, 2)

describe('public-launch reset (D148)', () => {
  let t: T
  beforeEach(async () => {
    vi.useFakeTimers()
    vi.setSystemTime(SLOT)
    t = convexTest(schema, modules)
    await seedWorld(t, { lastPublishedAt: SLOT - 30 * 60_000 })
  })
  afterEach(() => vi.useRealTimers())

  it('restarts every account at level 1 under its Warrior name and wipes what the beta earned', { timeout: 30_000 }, async () => {
    const anaWarrior = await seedHero(t, { name: 'Ana', level: 6, xp: 40, lifetimeXp: 2400, gold: 900, isActive: false, publicProfile: true }, 'ana')
    const { anaUser, rogue } = await t.run(async (ctx) => {
      const warrior = (await ctx.db.get(anaWarrior))!
      const rogue = await ctx.db.insert('heroes', { ...(({ _id, _creationTime, ...rest }) => rest)(warrior), name: 'Vex', class: 'rogue', isActive: true })
      await ctx.db.insert('deskCrawlerProfiles', { userId: warrior.userId, state: 'active', activeHeroId: rogue, lastSwitch: { at: Date.now(), fromHeroId: anaWarrior }, createdAt: Date.now() })
      await ctx.db.insert('deskKeepsakes', { userId: warrior.userId, totalCollected: 3, lastClaimWeek: 2840, lastClaimedAt: Date.now() })
      await ctx.db.insert('heroAchievements', { userId: warrior.userId, heroId: anaWarrior, achievementId: 'first_blood', unlockedAt: Date.now(), tick: 1, catalogVersion: 12 })
      return { anaUser: warrior.userId, rogue }
    })
    const bo = await seedHero(t, { name: 'Bo', activationState: 'pending_trmnl', activatedAt: undefined }, 'bo')
    const boUser = await t.run(async (ctx) => (await ctx.db.get(bo))!.userId)
    await t.run(async (ctx) => {
      await ctx.db.insert('follows', { userId: boUser, followedUserId: anaUser, followedNameVersion: 1, rival: true, raidsWon: 2, raidsLost: 1, createdAt: Date.now() })
    })
    await runTick(t)

    expect(await t.mutation(internal.launchReset.start, { confirm: LAUNCH_RESET_CONFIRM })).toEqual({ accounts: 2 })
    expect((await world(t))?.ticksPaused).toBe(true)
    await t.finishAllScheduledFunctions(vi.runAllTimers)

    const after = await t.run(async (ctx) => ({
      heroes: await ctx.db.query('heroes').collect(),
      keepsakes: await ctx.db.query('deskKeepsakes').collect(),
      unlocks: await ctx.db.query('heroAchievements').collect(),
      follows: await ctx.db.query('follows').collect(),
      profiles: await ctx.db.query('deskCrawlerProfiles').collect(),
      logs: await ctx.db.query('tickLogs').collect(),
      items: await ctx.db.query('items').collect(),
      users: await ctx.db.query('users').collect(),
      audit: (await ctx.db.query('adminAuditEvents').collect()).map((event) => event.outcome),
    }))
    expect(after.heroes).toHaveLength(2)
    const ana = after.heroes.find((hero) => hero.userId === anaUser)!
    expect(ana).toMatchObject({ name: 'Ana', class: 'warrior', level: 1, xp: 0, lifetimeXp: 0, isActive: true, activationState: 'active', publicProfile: true, logSequence: 2 })
    expect(after.heroes.find((hero) => hero.userId === boUser)).toMatchObject({ name: 'Bo', class: 'warrior', level: 1, activationState: 'pending_trmnl' })
    for (const id of [anaWarrior, rogue, bo]) expect(after.heroes.some((hero) => hero._id === id)).toBe(false)
    expect(after.keepsakes).toEqual([])
    expect(after.unlocks).toEqual([])
    expect(after.follows).toHaveLength(1)
    expect(after.follows[0]).toMatchObject({ rival: true })
    expect(after.follows[0]!.raidsWon).toBeUndefined()
    expect(after.profiles.find((profile) => profile.userId === anaUser)).toMatchObject({ activeHeroId: ana._id })
    expect(after.profiles.find((profile) => profile.userId === anaUser)!.lastSwitch).toBeUndefined()
    expect(after.users.every((user) => user.activeHeroId === undefined)).toBe(true)
    expect(after.logs.filter((log) => log.heroId === ana._id).map((log) => log.summary)).toEqual([expect.stringContaining('Your shift begins'), LAUNCH_RESET_LINE])
    expect(after.items.filter((item) => item.heroId === ana._id)).toHaveLength(3)
    expect(after.items.every((item) => after.heroes.some((hero) => hero._id === item.heroId))).toBe(true)
    expect(after.audit).toEqual(['started', expect.stringMatching(/^completed:\d+:2$/)])
    expect(await world(t)).toMatchObject({ ticksPaused: false })
    expect((await world(t))?.publishedPublicationId).toBeUndefined()

    // The restarted heroes adventure and rank on the next tick.
    vi.setSystemTime(SLOT + 15 * 60_000)
    await runTick(t)
    const ticked = await t.run(async (ctx) => await ctx.db.get(ana._id))
    expect(ticked!.lastTick).toBeGreaterThan(ana.lastTick)
  })

  it('refuses while a run is active', async () => {
    await seedHero(t, {}, 'Ana')
    await t.mutation(internal.sim.runs.tick.startTick, {})
    await expect(t.mutation(internal.launchReset.start, { confirm: LAUNCH_RESET_CONFIRM })).rejects.toThrow(/run is active/)
  })
})
