import { v } from 'convex/values'
import { internal } from './_generated/api'
import type { Doc, Id, TableNames } from './_generated/dataModel'
import { internalMutation } from './_generated/server'
import { createHero } from './lib/heroCreate'
import { gameProfile } from './lib/gameProfile'

/**
 * One-off public-launch reset (D148). Every account keeps its Warrior's name, its public-page choice, its follows and
 * its TRMNL connections, and gets that Warrior back at level 1 with the starter kit. Everything earned in the beta
 * goes: heroes and second-class heroes, items, logs, scores and ranks, raids, meetings, lost property, achievements
 * and Desk keepsakes. Slow Cast, accounts, alerts settings and the audit log are untouched.
 *
 * Ticks pause while it runs and resume as they were. Run it once, when the launch email goes out; delete this module
 * afterwards, as with the pre-launch reset (D63).
 */

export const LAUNCH_RESET_CONFIRM = 'RESET DESK CRAWLER FOR THE PUBLIC LAUNCH'
export const LAUNCH_RESET_LINE = 'Desk Crawler is out of beta, and every hero starts again from level 1. Thanks for testing.'

/** Children first, heroes last, so nothing is left pointing at a deleted hero mid-reset. */
const TABLES = [
  'items',
  'tickLogs',
  'heroScoreWindows',
  'rankInputs',
  'heroRanks',
  'achievementStats',
  'leaderboardGenerations',
  'leaderboardPublications',
  'simulationFailures',
  'raidPool',
  'raids',
  'meetings',
  'lostProperty',
  'heroAchievements',
  'deskKeepsakes',
  'heroes',
] as const satisfies readonly TableNames[]

const BATCH = 200
const RESTARTS_PER_STEP = 25
/** Far above the beta's player count; the snapshot travels in the scheduled step's arguments. */
const MAX_HEROES = 4000

const restart = v.object({ userId: v.id('users'), name: v.string(), active: v.boolean(), publicProfile: v.optional(v.boolean()) })
type Restart = { userId: Id<'users'>; name: string; active: boolean; publicProfile?: boolean }

/** One restart per account: its Warrior's name and page choice (the first hero if it has no Warrior), active if any hero was. */
export function restartsFor(heroes: Doc<'heroes'>[]): Restart[] {
  const byUser = new Map<Id<'users'>, Doc<'heroes'>[]>()
  for (const hero of heroes) byUser.set(hero.userId, [...(byUser.get(hero.userId) ?? []), hero])
  return [...byUser.values()].map((roster) => {
    const kept = roster.find((hero) => hero.class === 'warrior') ?? [...roster].sort((a, b) => a.createdAt - b.createdAt)[0]!
    return {
      userId: kept.userId,
      name: kept.name,
      active: roster.some((hero) => hero.activationState === 'active'),
      ...(kept.publicProfile === undefined ? {} : { publicProfile: kept.publicProfile }),
    }
  })
}

export const start = internalMutation({
  args: { confirm: v.literal(LAUNCH_RESET_CONFIRM) },
  returns: v.object({ accounts: v.number() }),
  handler: async (ctx) => {
    const world = await ctx.db.query('worldState').withIndex('by_key', (q) => q.eq('key', 'world')).unique()
    if (world === null) throw new Error('no world to reset')
    if (world.activeRunId !== undefined) throw new Error('a run is active; retry after it completes')
    const heroes = await ctx.db.query('heroes').take(MAX_HEROES + 1)
    if (heroes.length > MAX_HEROES) throw new Error('too many heroes for a one-step snapshot')
    const restarts = restartsFor(heroes)
    await ctx.db.patch(world._id, { ticksPaused: true })
    await ctx.db.insert('adminAuditEvents', { actorRef: 'launch-reset', action: 'reset_game_data', targetRef: 'world', reasonCode: 'public_launch', outcome: 'started', at: Date.now() })
    await ctx.scheduler.runAfter(0, internal.launchReset.step, { resumeTicks: !world.ticksPaused, deleted: 0, restarts, restarted: 0 })
    return { accounts: restarts.length }
  },
})

export const step = internalMutation({
  args: { resumeTicks: v.boolean(), deleted: v.number(), restarts: v.array(restart), restarted: v.number() },
  returns: v.null(),
  handler: async (ctx, args) => {
    const again = async (next: Partial<typeof args>) => {
      await ctx.scheduler.runAfter(0, internal.launchReset.step, { ...args, ...next })
      return null
    }
    if (args.restarted === 0) {
      const removed = await clearBeta(ctx)
      if (removed > 0) return await again({ deleted: args.deleted + removed })
    }
    if (args.restarted < args.restarts.length) {
      const now = Date.now()
      for (const entry of args.restarts.slice(args.restarted, args.restarted + RESTARTS_PER_STEP)) await restartHero(ctx, entry, now)
      return await again({ restarted: Math.min(args.restarts.length, args.restarted + RESTARTS_PER_STEP) })
    }
    const world = (await ctx.db.query('worldState').withIndex('by_key', (q) => q.eq('key', 'world')).unique())!
    await ctx.db.patch(world._id, { ticksPaused: !args.resumeTicks })
    await ctx.db.insert('adminAuditEvents', { actorRef: 'launch-reset', action: 'reset_game_data', targetRef: 'world', reasonCode: 'public_launch', outcome: `completed:${args.deleted}:${args.restarted}`, at: Date.now() })
    return null
  },
})

/** One bounded batch of beta data; returns how many rows it changed, 0 once everything is clear. */
async function clearBeta(ctx: Parameters<typeof restartHero>[0]): Promise<number> {
  for (const table of TABLES) {
    const rows = await ctx.db.query(table).take(BATCH)
    if (rows.length === 0) continue
    for (const row of rows) await ctx.db.delete(row._id)
    return rows.length
  }
  let changed = 0
  // Desk Crawler alerts still waiting to go out describe the old heroes; Slow Cast's carry no hero.
  for await (const alert of ctx.db.query('alertOutbox').withIndex('by_state_and_notBefore', (q) => q.eq('state', 'pending'))) {
    if (alert.heroId === undefined) continue
    await ctx.db.delete(alert._id)
    if (++changed >= BATCH) return changed
  }
  // Follows stay; the rival raid tallies were beta results.
  for await (const follow of ctx.db.query('follows')) {
    if (follow.raidsWon === undefined && follow.raidsLost === undefined) continue
    await ctx.db.patch(follow._id, { raidsWon: undefined, raidsLost: undefined })
    if (++changed >= BATCH) return changed
  }
  for await (const profile of ctx.db.query('deskCrawlerProfiles')) {
    if (profile.activeHeroId === undefined && profile.lastSwitch === undefined) continue
    await ctx.db.patch(profile._id, { activeHeroId: undefined, lastSwitch: undefined })
    if (++changed >= BATCH) return changed
  }
  for await (const user of ctx.db.query('users')) {
    if (user.activeHeroId === undefined) continue
    await ctx.db.patch(user._id, { activeHeroId: undefined })
    if (++changed >= BATCH) return changed
  }
  if (changed > 0) return changed
  const world = (await ctx.db.query('worldState').withIndex('by_key', (q) => q.eq('key', 'world')).unique())!
  if (world.publishedPublicationId !== undefined) {
    await ctx.db.patch(world._id, { publishedPublicationId: undefined })
    return 1
  }
  return 0
}

async function restartHero(ctx: Parameters<typeof createHero>[0], entry: Restart, now: number): Promise<void> {
  const user = await ctx.db.get(entry.userId)
  if (user === null) return
  if ((await gameProfile(ctx, user._id))?.state === 'deleting') return
  // A hero made since the clear (a first install finishing mid-reset) is already a fresh start.
  if (await ctx.db.query('heroes').withIndex('by_userId_and_isActive', (q) => q.eq('userId', user._id)).first()) return
  const heroId = await createHero(ctx, user, { name: entry.name, heroClass: 'warrior', now, active: entry.active })
  await ctx.db.patch(heroId, { logSequence: 2, ...(entry.publicProfile === undefined ? {} : { publicProfile: entry.publicProfile }) })
  await ctx.db.insert('tickLogs', {
    heroId,
    source: 'lifecycle',
    sequence: 2,
    at: now,
    kind: 'system',
    summary: LAUNCH_RESET_LINE,
    detail: { v: 1, operation: 'launch_reset' },
    deltas: { xpEarned: 0, gold: 0, hp: 0 },
  })
}
