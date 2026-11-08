import { v } from 'convex/values'
import { LAUNCH_LOG } from '@trmnl-games/idle-angler/sim'
import { internal } from '../_generated/api'
import type { Doc, Id, TableNames } from '../_generated/dataModel'
import { internalMutation, type MutationCtx } from '../_generated/server'
import { readEngineWorld } from '../lib/engine/world'
import { prepareAngler } from './lifecycle'
import { idleAnglerProfile } from './profile'
import { IDLE_ANGLER_RUNTIME } from './runtime'

/**
 * One-off public-launch reset for Idle Angler (D224), the D148 shape. Every account that has an angler keeps its
 * profile, its public-page choice, its activation and its TRMNL connection, and gets a fresh angler on the Millpond with
 * the starter kit. Everything earned before the listing goes: catches, logs, trophies and medals, board records, Open
 * awards, achievements, fly boxes, published boards, the water census and pending Idle Angler alerts. Desk Crawler,
 * accounts, follows, alert settings and the audit log are untouched.
 *
 * Ticks pause while it runs and resume as they were. Run it once, when the launch email goes out; delete this module
 * afterwards, as with D63 and D148.
 */

export const LAUNCH_RESET_CONFIRM = 'RESET IDLE ANGLER FOR THE PUBLIC LAUNCH'

/** Children first, anglers last, so nothing is left pointing at a deleted angler mid-reset. */
const TABLES = [
  'catches',
  'iaTickLogs',
  'iaTrophies',
  'iaCatchRecords',
  'iaOpenAwards',
  'iaAchievements',
  'flyBoxes',
  'iaAchievementStats',
  'iaLeaderboardPublications',
  'iaSimulationFailures',
  'waterPresence',
  'anglers',
] as const satisfies readonly TableNames[]

const BATCH = 200
const RESTARTS_PER_STEP = 25
/** Far above the pre-launch player count; the snapshot travels in the scheduled step's arguments. */
const MAX_ANGLERS = 4000

const restart = v.object({ userId: v.id('users'), active: v.boolean(), publicProfile: v.optional(v.boolean()) })
type Restart = { userId: Id<'users'>; active: boolean; publicProfile?: boolean }

/** One restart per account: its current angler's activation and page choice. An angler has no name of its own. */
function restartsFor(anglers: Doc<'anglers'>[]): Restart[] {
  const byUser = new Map<Id<'users'>, Doc<'anglers'>[]>()
  for (const angler of anglers) byUser.set(angler.userId, [...(byUser.get(angler.userId) ?? []), angler])
  return [...byUser.values()].map((owned) => {
    const kept = owned.find((angler) => angler.isActive) ?? [...owned].sort((a, b) => b.createdAt - a.createdAt)[0]!
    return {
      userId: kept.userId,
      active: owned.some((angler) => angler.activationState === 'active'),
      ...(kept.publicProfile === undefined ? {} : { publicProfile: kept.publicProfile }),
    }
  })
}

export const start = internalMutation({
  args: { confirm: v.literal(LAUNCH_RESET_CONFIRM) },
  returns: v.object({ accounts: v.number() }),
  handler: async (ctx) => {
    const world = await readEngineWorld(ctx, IDLE_ANGLER_RUNTIME)
    if (world === null) throw new Error('no world to reset')
    if (world.activeRunId !== undefined) throw new Error('a run is active; retry after it completes')
    const anglers = await ctx.db.query('anglers').take(MAX_ANGLERS + 1)
    if (anglers.length > MAX_ANGLERS) throw new Error('too many anglers for a one-step snapshot')
    const restarts = restartsFor(anglers)
    await ctx.db.patch(world._id, { ticksPaused: true })
    await ctx.db.insert('adminAuditEvents', { actorRef: 'launch-reset', action: 'reset_game_data', targetRef: 'idle-angler', reasonCode: 'public_launch', outcome: 'started', at: Date.now() })
    await ctx.scheduler.runAfter(0, internal.idleAngler.launchReset.step, { resumeTicks: !world.ticksPaused, deleted: 0, restarts, restarted: 0 })
    return { accounts: restarts.length }
  },
})

export const step = internalMutation({
  args: { resumeTicks: v.boolean(), deleted: v.number(), restarts: v.array(restart), restarted: v.number() },
  returns: v.null(),
  handler: async (ctx, args) => {
    const again = async (next: Partial<typeof args>) => {
      await ctx.scheduler.runAfter(0, internal.idleAngler.launchReset.step, { ...args, ...next })
      return null
    }
    if (args.restarted === 0) {
      const removed = await clearBeforeLaunch(ctx)
      if (removed > 0) return await again({ deleted: args.deleted + removed })
    }
    if (args.restarted < args.restarts.length) {
      const now = Date.now()
      for (const entry of args.restarts.slice(args.restarted, args.restarted + RESTARTS_PER_STEP)) await restartAngler(ctx, entry, now)
      return await again({ restarted: Math.min(args.restarts.length, args.restarted + RESTARTS_PER_STEP) })
    }
    const world = (await readEngineWorld(ctx, IDLE_ANGLER_RUNTIME))!
    await ctx.db.patch(world._id, { ticksPaused: !args.resumeTicks })
    await ctx.db.insert('adminAuditEvents', { actorRef: 'launch-reset', action: 'reset_game_data', targetRef: 'idle-angler', reasonCode: 'public_launch', outcome: `completed:${args.deleted}:${args.restarted}`, at: Date.now() })
    return null
  },
})

/** One bounded batch of pre-launch data; returns how many rows it changed, 0 once everything is clear. */
async function clearBeforeLaunch(ctx: MutationCtx): Promise<number> {
  for (const table of TABLES) {
    const rows = await ctx.db.query(table).take(BATCH)
    if (rows.length === 0) continue
    for (const row of rows) await ctx.db.delete(row._id)
    return rows.length
  }
  let changed = 0
  // Idle Angler alerts still waiting to go out describe the old anglers; the other games' carry no angler.
  for await (const alert of ctx.db.query('alertOutbox').withIndex('by_state_and_notBefore', (q) => q.eq('state', 'pending'))) {
    if (alert.anglerId === undefined) continue
    await ctx.db.delete(alert._id)
    if (++changed >= BATCH) return changed
  }
  for await (const profile of ctx.db.query('idleAnglerProfiles')) {
    if (profile.anglerId === undefined) continue
    await ctx.db.patch(profile._id, { anglerId: undefined })
    if (++changed >= BATCH) return changed
  }
  if (changed > 0) return changed
  const world = (await readEngineWorld(ctx, IDLE_ANGLER_RUNTIME))!
  if (world.publishedPublicationId !== undefined) {
    await ctx.db.patch(world._id, { publishedPublicationId: undefined })
    return 1
  }
  return 0
}

async function restartAngler(ctx: MutationCtx, entry: Restart, now: number): Promise<void> {
  const user = await ctx.db.get(entry.userId)
  if (user === null || user.state !== 'active') return
  if ((await idleAnglerProfile(ctx, user._id))?.state === 'deleting') return
  // An angler made since the clear (a first install finishing mid-reset) is already a fresh start.
  if (await ctx.db.query('anglers').withIndex('by_userId_and_isActive', (q) => q.eq('userId', user._id)).first()) return
  const anglerId = await prepareAngler(ctx, user, now)
  await ctx.db.patch(anglerId, {
    logSequence: 2,
    ...(entry.active ? { activationState: 'active' as const, activatedAt: now } : {}),
    ...(entry.publicProfile === undefined ? {} : { publicProfile: entry.publicProfile }),
  })
  await ctx.db.insert('iaTickLogs', { anglerId, source: 'lifecycle', sequence: 2, at: now, kind: 'system', summary: LAUNCH_LOG, detail: { v: 1, operation: 'launch_reset' }, deltas: { gold: 0 } })
}
