import { v } from 'convex/values'
import { openPeriod, openTarget, openWindow, unlocked, type IdleAnglerCatalog, type Rarity, type WaterId } from '@trmnl-games/idle-angler/sim'
import { catalogs } from '@trmnl-games/idle-angler/content'
import { RARITY_RANK } from '@trmnl-games/idle-angler/content/order'
import { internal } from '../_generated/api'
import type { Doc, Id } from '../_generated/dataModel'
import { internalMutation, type MutationCtx, type QueryCtx } from '../_generated/server'
import { toAnglerState } from './adapter'
import { currentAngler } from './profile'
import { pagePublic } from '../lib/publicPage'

/**
 * Idle Angler boards (2026-10-10): the best fish each angler has landed at each water, this week and of all time.
 * Written as fish land (records the tick's catches); read with fixed, indexed reads. Desk Crawler ranks by XP;
 * Idle Angler has no XP and ranks by the fish itself: since D244 the rarest first, then the heaviest. An Open's board
 * is one species, so it ranks by weight alone.
 */

export type Period = 'week' | 'all'

/** Rows a board reads: the shown entries, and how far down the angler's own rank is looked for. */
export const BOARD_DEPTH = 100

const DAY_MS = 86_400_000

/** The week's key: its Monday in UTC, "w2026-10-05". */
export function weekKey(at: number): string {
  const day = new Date(at)
  const sinceMonday = (day.getUTCDay() + 6) % 7
  const monday = new Date(Date.UTC(day.getUTCFullYear(), day.getUTCMonth(), day.getUTCDate()) - sinceMonday * DAY_MS)
  return `w${monday.toISOString().slice(0, 10)}`
}

/** The next Monday 00:00 UTC after `at`, when the weekly boards start again. */
export function weekEndsAt(at: number): number {
  return Date.parse(`${weekKey(at).slice(1)}T00:00:00Z`) + 7 * DAY_MS
}

export const periodKey = (period: Period, at: number) => (period === 'all' ? 'all' : weekKey(at))

/** Every species' rarity, which no catalog has changed since v1, so a board needs no world catalog to rank or show it. */
const RARITY_OF: ReadonlyMap<string, Rarity> = new Map(Object.values(catalogs).flatMap((content) => content.species.map((s) => [s.id, s.rarity] as const)))
export const speciesRarity = (speciesId: string): Rarity => RARITY_OF.get(speciesId) ?? 'common'
export const rarityRankOf = (speciesId: string) => RARITY_RANK[speciesRarity(speciesId)]
/** Every species' water, as the all-time rebuild reads the logbook. */
const WATER_OF: ReadonlyMap<string, string> = new Map(Object.values(catalogs).flatMap((content) => content.species.map((s) => [s.id, s.water] as const)))

/** An Open's rows (`o` periods) are its one target species, ranked by weight; the week and all-time rows rank rarest first. */
const isOpenPeriod = (period: string) => period.startsWith('o')

/** D244: whether a fish beats a board row: rarer wins, then heavier; in an Open, heavier. */
export function beats(period: string, fish: { speciesId: string; grams: number }, row: { speciesId: string; grams: number }): boolean {
  if (!isOpenPeriod(period)) {
    const rarer = rarityRankOf(fish.speciesId) - rarityRankOf(row.speciesId)
    if (rarer !== 0) return rarer > 0
  }
  return fish.grams > row.grams
}

/**
 * Keep the better of a landed fish and the angler's row for its water, this week and all time (rarer, then heavier,
 * D244), and, when the fish enters that weekend's Open (D162), the heavier for the Open's `o` period. Returns whether
 * this was the angler's first entry in that Open, so the tick counts it and says so.
 */
export async function recordCatch(ctx: MutationCtx, angler: Doc<'anglers'>, fish: { waterId: WaterId; speciesId: string; grams: number }, at: number, open = false): Promise<{ firstOpenEntry: boolean }> {
  let firstOpenEntry = false
  for (const period of [weekKey(at), 'all', ...(open ? [openPeriod(at)] : [])]) {
    const existing = await ctx.db
      .query('iaCatchRecords')
      .withIndex('by_anglerId_and_waterId_and_period', (q) => q.eq('anglerId', angler._id).eq('waterId', fish.waterId).eq('period', period))
      .unique()
    const row = { speciesId: fish.speciesId, grams: fish.grams, rarityRank: rarityRankOf(fish.speciesId), at, earlierFirst: -at }
    if (existing === null) {
      await ctx.db.insert('iaCatchRecords', { waterId: fish.waterId, period, anglerId: angler._id, userId: angler.userId, ...row })
      if (isOpenPeriod(period)) firstOpenEntry = true
    } else if (beats(period, fish, existing)) await ctx.db.patch(existing._id, row)
  }
  return { firstOpenEntry }
}

export type BoardRow = { rank: number; name: string; speciesId: string; rarity: Rarity; grams: number; own: boolean; profile: boolean }

/** A board's rows in rank order: an Open's by weight, the week and all-time boards rarest first, then by weight. */
const boardRows = (ctx: QueryCtx, waterId: WaterId, period: string) =>
  isOpenPeriod(period)
    ? ctx.db.query('iaCatchRecords').withIndex('by_waterId_and_period_and_grams', (q) => q.eq('waterId', waterId).eq('period', period)).order('desc')
    : ctx.db.query('iaCatchRecords').withIndex('by_waterId_and_period_and_rarityRank_and_grams', (q) => q.eq('waterId', waterId).eq('period', period)).order('desc')

/** How deep the Monday award reads each Open board (D230): three medals, plus room for anglers whose medal is elsewhere. */
export const OPEN_AWARD_DEPTH = 20

/** A board's heaviest rows, heaviest first, as the award and the Rankings card read them. */
export async function topRows(ctx: QueryCtx, waterId: WaterId, period: string, limit: number) {
  return await boardRows(ctx, waterId, period).take(limit)
}

/**
 * A water's board: its first `limit` rows in rank order, and the viewer's own row and rank when it is within
 * `BOARD_DEPTH`. Names are the owner's current public name; a row whose owner is gone, suspended or deleting, or whose
 * angler is no longer the owner's own, reads "Hidden player".
 */
export async function readBoard(ctx: QueryCtx, waterId: WaterId, period: string, viewer: Id<'anglers'> | null, limit: number) {
  const rows = await boardRows(ctx, waterId, period).take(BOARD_DEPTH)
  const shown = rows.slice(0, limit)
  const owners = await Promise.all(shown.map((row) => ctx.db.get(row.userId)))
  const anglers = await Promise.all(owners.map((owner) => currentAngler(ctx, owner ?? null)))
  const entries: BoardRow[] = shown.map((row, index) => {
    const owner = owners[index]
    const visible = owner !== null && owner !== undefined && owner.state === 'active' && anglers[index]?._id === row.anglerId
    return { rank: index + 1, name: visible ? owner.publicAlias : 'Hidden player', speciesId: row.speciesId, rarity: speciesRarity(row.speciesId), grams: row.grams, own: row.anglerId === viewer, profile: visible && pagePublic(anglers[index]) }
  })
  const ownIndex = viewer === null ? -1 : rows.findIndex((row) => row.anglerId === viewer)
  const ownRow = viewer === null ? null : ownIndex >= 0 ? rows[ownIndex]! : await ctx.db.query('iaCatchRecords').withIndex('by_anglerId_and_waterId_and_period', (q) => q.eq('anglerId', viewer).eq('waterId', waterId).eq('period', period)).unique()
  return {
    entries,
    own: ownRow ? { rank: ownIndex >= 0 ? ownIndex + 1 : null, speciesId: ownRow.speciesId, rarity: speciesRarity(ownRow.speciesId), grams: ownRow.grams } : null,
    full: rows.length === BOARD_DEPTH,
  }
}

/**
 * D240: this weekend's Open at the angler's water (the one it is heading to while travelling), for the Dock and the
 * device: the target and its bites, the window, the leader and the angler's own entry. Monday to Friday it names the
 * coming weekend. Null before the Opens unlock or where the water holds none (Frozen Tarn outside winter).
 */
export async function anglerOpen(ctx: QueryCtx, content: IdleAnglerCatalog, angler: Doc<'anglers'>, now: number, waterId: WaterId = angler.travelTo ?? angler.waterId) {
  if (!content.opens || !unlocked(content, toAnglerState(angler), 'opens')) return null
  const target = openTarget(content, waterId, now)
  if (!target) return null
  const window = openWindow(now)
  const board = window.on ? await readBoard(ctx, waterId, window.period, angler._id, 1) : null
  return {
    waterId,
    target: { id: target.id, baits: target.baits, times: target.times ?? null, weather: target.weather ?? null },
    startsAt: window.startsAt,
    endsAt: window.endsAt,
    on: window.on,
    period: window.period,
    leader: board?.entries[0] ? { grams: board.entries[0].grams, own: board.entries[0].own } : null,
    own: board?.own ? { rank: board.own.rank, grams: board.own.grams } : null,
  }
}

/**
 * D244, run once after the deploy that ranks rarest first (`npx convex run idleAngler/records:backfillRarity`): give
 * every row its `rarityRank`, and rebuild each all-time row from the angler's logbook, which keeps every species' best
 * weight, so it holds the rarest fish ever landed there and the heaviest of that rarity. A week's rows only knew their
 * heaviest fish, so they keep it (exact again from the next Monday); Open rows are one species and only gain the rank.
 * Pages through the table and schedules itself until done; safe to run again.
 */
export const backfillRarity = internalMutation({
  args: { cursor: v.optional(v.union(v.string(), v.null())), rebuilt: v.optional(v.number()), ranked: v.optional(v.number()) },
  returns: v.null(),
  handler: async (ctx, args) => {
    const page = await ctx.db.query('iaCatchRecords').paginate({ cursor: args.cursor ?? null, numItems: 200 })
    let rebuilt = args.rebuilt ?? 0
    let ranked = args.ranked ?? 0
    for (const row of page.page) {
      if (row.period === 'all') {
        const angler = await ctx.db.get(row.anglerId)
        const logged = angler
          ? Object.entries(angler.logbook).flatMap(([speciesId, entry]) => (WATER_OF.get(speciesId) === row.waterId ? [{ speciesId, grams: entry.bestGrams }] : []))
          : []
        const best = logged.reduce<{ speciesId: string; grams: number }>((top, fish) => (beats('all', fish, top) ? fish : top), { speciesId: row.speciesId, grams: row.grams })
        if (best.speciesId !== row.speciesId || best.grams !== row.grams) {
          // The logbook keeps no catch time, so the rebuilt row keeps the old row's: ties stay where they were.
          await ctx.db.patch(row._id, { speciesId: best.speciesId, grams: best.grams, rarityRank: rarityRankOf(best.speciesId) })
          rebuilt += 1
          continue
        }
      }
      if (row.rarityRank !== rarityRankOf(row.speciesId)) {
        await ctx.db.patch(row._id, { rarityRank: rarityRankOf(row.speciesId) })
        ranked += 1
      }
    }
    if (page.isDone) console.log(`backfillRarity: ${rebuilt} all-time rows rebuilt from logbooks, ${ranked} rows ranked`)
    else await ctx.scheduler.runAfter(0, internal.idleAngler.records.backfillRarity, { cursor: page.continueCursor, rebuilt, ranked })
    return null
  },
})
