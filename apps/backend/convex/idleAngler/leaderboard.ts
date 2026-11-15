import { v } from 'convex/values'
import type { Doc, Id } from '../_generated/dataModel'
import { internalMutation, query, type QueryCtx } from '../_generated/server'
import { buildStep, cleanupStep } from '../lib/engine/publication'
import { currentUser } from '../lib/intent'
import { currentAngler } from './profile'
import { worldContentOf } from './anglers'
import { IDLE_ANGLER_RUNTIME } from './runtime'
import { openTarget, openWindow, type IdleAnglerCatalog } from '@trmnl-games/idle-angler/sim'
import { anglerOpen, BOARD_DEPTH, periodKey, readBoard, weekEndsAt, weekKey, type BoardRow } from './records'
import { waterId } from './validators'

/** Rows on the device's board. */
export const DEVICE_TOP = 5

/**
 * The shared engine's hourly publication, kept for achievement rarity (D65). Idle Angler has no ranking tables, so a
 * build publishes at once; the boards players see are the catch records (records.ts).
 */
export const buildBatch = internalMutation({
  args: { publicationId: v.id('iaLeaderboardPublications'), expectedSequence: v.number() },
  returns: v.null(),
  handler: async (ctx, { publicationId, expectedSequence }) => await buildStep(ctx, IDLE_ANGLER_RUNTIME, publicationId as unknown as Id<'leaderboardPublications'>, expectedSequence),
})

export const cleanupPublication = internalMutation({
  args: { publicationId: v.id('iaLeaderboardPublications') },
  returns: v.null(),
  handler: async (ctx, { publicationId }) => await cleanupStep(ctx, IDLE_ANGLER_RUNTIME, publicationId as unknown as Id<'leaderboardPublications'>),
})

/**
 * Companion board: one water's heaviest fish this week or of all time, and the viewer's own row and rank. D240: the
 * `open` period is that water's weekend Open, with its target; a water holding none that weekend has no rows.
 */
export const view = query({
  args: { waterId: v.optional(waterId), period: v.optional(v.union(v.literal('week'), v.literal('all'), v.literal('open'))) },
  returns: v.any(),
  handler: async (ctx, args) => {
    const angler = await currentAngler(ctx, await currentUser(ctx))
    const water = args.waterId ?? angler?.waterId ?? 'millpond'
    const period = args.period ?? 'week'
    const now = Date.now()
    if (period === 'open') {
      const { content } = await worldContentOf(ctx)
      const target = openTarget(content, water, now)
      const window = openWindow(now)
      const board = target ? await readBoard(ctx, water, window.period, angler?._id ?? null, BOARD_DEPTH) : { entries: [], own: null, full: false }
      return { waterId: water, period, weekEndsAt: weekEndsAt(now), ...board, open: { targetId: target?.id ?? null, on: window.on, startsAt: window.startsAt, endsAt: window.endsAt } }
    }
    const board = await readBoard(ctx, water, periodKey(period, now), angler?._id ?? null, BOARD_DEPTH)
    return { waterId: water, period, weekEndsAt: weekEndsAt(now), ...board }
  },
})

/**
 * Device board: this week's heaviest fish at the angler's water, its first rows and the angler's own rank. D240: while
 * that water's weekend Open runs and the angler has the Opens, the board is the Open's instead, ending Sunday night.
 */
export async function readDeviceBoard(ctx: QueryCtx, content: IdleAnglerCatalog, angler: Doc<'anglers'>, now: number): Promise<{ rank: number | null; ownGrams: number | null; endsAt: number; open?: { speciesId: string }; top: Array<Pick<BoardRow, 'rank' | 'name' | 'grams' | 'own'>> }> {
  const open = await anglerOpen(ctx, content, angler, now, angler.waterId)
  const live = open?.on ? open : null
  const board = await readBoard(ctx, angler.waterId, live ? live.period : weekKey(now), angler._id, DEVICE_TOP)
  // The Open's last moment is Sunday 23:59 UTC, so the rank line names Sunday, not the Monday the window closes on.
  return { rank: board.own?.rank ?? null, ownGrams: board.own?.grams ?? null, endsAt: live ? live.endsAt - 60_000 : weekEndsAt(now), ...(live ? { open: { speciesId: live.target.id } } : {}), top: board.entries.map(({ rank, name, grams, own }) => ({ rank, name, grams, own })) }
}
