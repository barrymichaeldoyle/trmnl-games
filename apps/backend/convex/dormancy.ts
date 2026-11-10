import { v } from 'convex/values'
import { internal } from './_generated/api'
import type { Doc, Id } from './_generated/dataModel'
import { internalMutation, type MutationCtx, type QueryCtx } from './_generated/server'
import { readEngineWorld } from './lib/engine/world'
import { isGame } from './lib/gameHooks'
import { currentHero } from './lib/gameProfile'
import { commandLog } from './lib/intent'
import { commandLog as anglerCommandLog } from './idleAngler/anglers'
import { currentAngler } from './idleAngler/profile'
import { IDLE_ANGLER_RUNTIME } from './idleAngler/runtime'

/**
 * D229: a hero nobody is watching has a lie-down. Once a day the sweep pauses every exploring or resting hero whose
 * owner has shown no sign of life: no TRMNL has fetched its screen, and the companion has not been opened, for
 * `QUIET_MS`; when the plugin is uninstalled on every device (or no installation remains) the wait is the shorter
 * `UNINSTALLED_QUIET_MS`, counted from the last screen served before the uninstall. The pause is the player's own
 * pause (D13: prior status kept, no catch-up) with a reason, so the device and the companion can say why, and it ends
 * by itself on the next screen request or companion visit, or on Resume. Dead, travelling and sleeping heroes are
 * left to resolve first, as the pause intent leaves them; a quarantined hero is a service matter, not a quiet one.
 * Idle Angler's anglers follow the same rule on the same telemetry.
 */
const DAY = 24 * 3_600_000
export const QUIET_MS = 14 * DAY
export const UNINSTALLED_QUIET_MS = 7 * DAY
const PAGE = 100

export const LIE_DOWN_LINE = 'Had a lie-down: no TRMNL showed this hero for two weeks.'
export const LIE_DOWN_UNINSTALLED_LINE = 'Had a lie-down: the plugin was uninstalled.'
export const BACK_LINE = 'Back from a lie-down. Adventures resume.'

type Instance = Pick<Doc<'trmnlInstances'>, 'state' | 'createdAt' | 'lastScreenServedAt'>

/** Whether an owner has been quiet long enough, from the installations of one game and the owner's own last visit. */
export function quietVerdict(instances: readonly Instance[], seenAt: readonly (number | undefined)[], now: number): 'awake' | 'quiet' | 'uninstalled' {
  const hasActive = instances.some((instance) => instance.state === 'active')
  // An installation that has never served a screen counts from its own creation: the device may not have polled yet.
  const seen = Math.max(0, ...seenAt.filter((at): at is number => at !== undefined), ...instances.map((instance) => instance.lastScreenServedAt ?? instance.createdAt))
  if (now - seen < (hasActive ? QUIET_MS : UNINSTALLED_QUIET_MS)) return 'awake'
  return hasActive ? 'quiet' : 'uninstalled'
}

async function instancesFor(ctx: QueryCtx, userId: Id<'users'>, slug: 'desk-crawler' | 'idle-angler'): Promise<Doc<'trmnlInstances'>[]> {
  const rows = await ctx.db.query('trmnlInstances').withIndex('by_userId', (q) => q.eq('userId', userId)).collect()
  return rows.filter((row) => isGame(row, slug))
}

/** Pause one quiet hero; returns whether it did. */
async function lieDown(ctx: MutationCtx, hero: Doc<'heroes'>, now: number): Promise<boolean> {
  if (!hero.isActive || hero.activationState !== 'active' || hero.simulationState !== 'healthy') return false
  if (hero.status !== 'exploring' && hero.status !== 'resting') return false
  const verdict = quietVerdict(await instancesFor(ctx, hero.userId, 'desk-crawler'), [hero.activatedAt ?? hero.createdAt, hero.companionVisitBaseline?.at], now)
  if (verdict === 'awake') return false
  await ctx.db.patch(hero._id, { status: 'paused', pausedFromStatus: hero.status, pausedReason: 'dormant' })
  await commandLog(ctx, hero, 'pause', verdict === 'quiet' ? LIE_DOWN_LINE : LIE_DOWN_UNINSTALLED_LINE)
  return true
}

/** A hero paused by the sweep gets up again; a hero the player paused is left alone. */
export async function wakeHero(ctx: MutationCtx, hero: Doc<'heroes'> | null): Promise<boolean> {
  if (hero === null || hero.status !== 'paused' || hero.pausedReason !== 'dormant') return false
  await ctx.db.patch(hero._id, { status: hero.pausedFromStatus ?? 'exploring', pausedFromStatus: undefined, pausedReason: undefined })
  await commandLog(ctx, hero, 'resume', BACK_LINE)
  return true
}

async function restAngler(ctx: MutationCtx, angler: Doc<'anglers'>, now: number): Promise<boolean> {
  if (!angler.isActive || angler.activationState !== 'active' || angler.simulationState !== 'healthy' || angler.status !== 'fishing') return false
  const verdict = quietVerdict(await instancesFor(ctx, angler.userId, 'idle-angler'), [angler.activatedAt ?? angler.createdAt, angler.lastCommandAt], now)
  if (verdict === 'awake') return false
  const sequence = await anglerCommandLog(ctx, angler, 'idleAngler.pause', 'Rod on the rest. Fishing paused.')
  await ctx.db.patch(angler._id, { status: 'paused', pausedReason: 'dormant', logSequence: sequence })
  return true
}

export async function wakeAngler(ctx: MutationCtx, angler: Doc<'anglers'> | null): Promise<boolean> {
  if (angler === null || angler.status !== 'paused' || angler.pausedReason !== 'dormant') return false
  const world = await readEngineWorld(ctx, IDLE_ANGLER_RUNTIME)
  const sequence = await anglerCommandLog(ctx, angler, 'idleAngler.resume', 'Line back in the water.')
  // No catch-up: the next tick is the first that counts (as the Resume intent does).
  await ctx.db.patch(angler._id, { status: 'fishing', pausedReason: undefined, logSequence: sequence, lastTick: Math.max(angler.lastTick, world?.currentTick ?? 0) })
  return true
}

/** The owner of an installation that just served a screen is awake: its hero or angler for that game gets up. */
export async function wakeOwnerOf(ctx: MutationCtx, instance: Doc<'trmnlInstances'>): Promise<void> {
  const user = await ctx.db.get(instance.userId)
  if (isGame(instance, 'desk-crawler')) await wakeHero(ctx, await currentHero(ctx, user))
  else if (isGame(instance, 'idle-angler')) await wakeAngler(ctx, await currentAngler(ctx, user))
}

/** The daily sweep over every hero, a page at a time, then every angler. */
export const sweep = internalMutation({
  args: { cursor: v.optional(v.string()), game: v.optional(v.union(v.literal('desk-crawler'), v.literal('idle-angler'))) },
  returns: v.object({ paused: v.number(), done: v.boolean() }),
  handler: async (ctx, args) => {
    const now = Date.now()
    const game = args.game ?? 'desk-crawler'
    let paused = 0
    const page = game === 'desk-crawler'
      ? await ctx.db.query('heroes').paginate({ numItems: PAGE, cursor: args.cursor ?? null })
      : await ctx.db.query('anglers').paginate({ numItems: PAGE, cursor: args.cursor ?? null })
    for (const row of page.page) {
      if (game === 'desk-crawler' ? await lieDown(ctx, row as Doc<'heroes'>, now) : await restAngler(ctx, row as Doc<'anglers'>, now)) paused += 1
    }
    if (!page.isDone) {
      await ctx.scheduler.runAfter(0, internal.dormancy.sweep, { cursor: page.continueCursor, game })
      return { paused, done: false }
    }
    if (game === 'desk-crawler') {
      await ctx.scheduler.runAfter(0, internal.dormancy.sweep, { game: 'idle-angler' })
      return { paused, done: false }
    }
    return { paused, done: true }
  },
})
