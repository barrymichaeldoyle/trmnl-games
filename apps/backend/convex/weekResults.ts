import { v } from 'convex/values'
import { keepsakeWeek, keepsakeWeekStartsAt } from '@trmnl-games/engine/calendar'
import { internal } from './_generated/api'
import type { Doc, Id } from './_generated/dataModel'
import { internalMutation, mutation, query, type MutationCtx } from './_generated/server'
import { appError } from './lib/errors'
import { currentHero } from './lib/gameProfile'
import { currentUser, intentReturns, runIntent } from './lib/intent'

/**
 * D249: how the hero did on last week's This week board, kept past the hourly sets so the Hero page can say so on
 * Monday. The boards reset at Monday 00:00 UTC (D202), so the week's last publication holds its final standings;
 * the first publication of the new week still has it as its previous set, and freezes it from there.
 */

const PAGE = 100
/** Weeks of results kept per hero: this one and the one before, for "up 3 places". */
const KEEP_WEEKS = 2

/** The engine's onPublished hook: when the week has turned since the previous set, freeze that set's This week ranks. */
export async function freezeWeekOnTurn(ctx: MutationCtx, publication: Doc<'leaderboardPublications'>): Promise<void> {
  if (publication.previousPublicationId === undefined) return
  const previous = await ctx.db.get(publication.previousPublicationId)
  if (previous === null || previous.state !== 'published') return
  if (keepsakeWeek(previous.scoreAt) === keepsakeWeek(publication.scoreAt)) return
  await ctx.scheduler.runAfter(0, internal.weekResults.freeze, { publicationId: previous._id, week: keepsakeWeek(previous.scoreAt), cursor: null })
}

/** Copy one page of a publication's This week ranks into `heroWeekResults`, then schedule the next page. */
export const freeze = internalMutation({
  args: { publicationId: v.id('leaderboardPublications'), week: v.number(), cursor: v.union(v.string(), v.null()) },
  returns: v.null(),
  handler: async (ctx, { publicationId, week, cursor }) => {
    const publication = await ctx.db.get(publicationId)
    if (publication === null || publication.state === 'obsolete') return null
    const page = await ctx.db
      .query('heroRanks')
      .withIndex('by_publicationId_and_board_and_heroId', (q) => q.eq('publicationId', publicationId).eq('board', 'recent_7d'))
      .paginate({ numItems: PAGE, cursor })
    const totals = new Map<string, number>()
    for (const row of page.page) {
      // A hero with no XP that week only sat on the board; there is nothing to report.
      if ((row.score ?? 0) <= 0) continue
      let total = totals.get(row.cohortKey)
      if (total === undefined) {
        const generation = await ctx.db
          .query('leaderboardGenerations')
          .withIndex('by_publicationId_and_board_and_cohortKey', (q) => q.eq('publicationId', publicationId).eq('board', 'recent_7d').eq('cohortKey', row.cohortKey))
          .unique()
        total = generation?.totalPlayers ?? row.rank
        totals.set(row.cohortKey, total)
      }
      const existing = await ctx.db.query('heroWeekResults').withIndex('by_heroId_and_week', (q) => q.eq('heroId', row.heroId).eq('week', week)).unique()
      if (existing !== null) continue
      await ctx.db.insert('heroWeekResults', { heroId: row.heroId, week, rank: row.rank, cohortKey: row.cohortKey, totalPlayers: total, xp: row.score ?? 0 })
      const old = await ctx.db.query('heroWeekResults').withIndex('by_heroId_and_week', (q) => q.eq('heroId', row.heroId).lte('week', week - KEEP_WEEKS)).take(5)
      for (const stale of old) await ctx.db.delete(stale._id)
    }
    if (!page.isDone) await ctx.scheduler.runAfter(0, internal.weekResults.freeze, { publicationId, week, cursor: page.continueCursor })
    return null
  },
})

/** Last week's result for the Hero page, until Nice or the next Monday; null when there is none to show. */
export const mine = query({
  args: {},
  returns: v.any(),
  handler: async (ctx) => {
    const user = await currentUser(ctx)
    const hero = await currentHero(ctx, user)
    if (hero === null || hero.activationState !== 'active') return null
    const week = keepsakeWeek(Date.now()) - 1
    if (hero.weekSeen !== undefined && hero.weekSeen >= week) return null
    const row = await ctx.db.query('heroWeekResults').withIndex('by_heroId_and_week', (q) => q.eq('heroId', hero._id).eq('week', week)).unique()
    if (row === null) return null
    const before = await ctx.db.query('heroWeekResults').withIndex('by_heroId_and_week', (q) => q.eq('heroId', hero._id).eq('week', week - 1)).unique()
    return {
      week,
      startsAt: keepsakeWeekStartsAt(week),
      rank: row.rank,
      of: row.totalPlayers,
      cohortKey: row.cohortKey,
      xp: row.xp,
      // Places gained on the week before, in the same level group only: a new group is a new board.
      moved: before !== null && before.cohortKey === row.cohortKey ? before.rank - row.rank : null,
    }
  },
})

/** Nice on the card: this week's card is done. */
export const see = mutation({
  args: { operationId: v.string(), week: v.number() },
  returns: intentReturns({ operationId: v.string(), changed: v.boolean() }),
  handler: async (ctx, { operationId, week }) =>
    await runIntent(ctx, operationId, 'weekResults.see', { week }, async (user) => {
      const hero = await currentHero(ctx, user)
      if (hero === null || hero.activationState !== 'active') throw appError('HERO_NOT_FOUND', 'No hero yet.')
      if (!Number.isInteger(week) || week > keepsakeWeek(Date.now())) throw appError('INVALID_INPUT', 'That week has not happened yet.')
      if ((hero.weekSeen ?? -1) >= week) return { changed: false }
      await ctx.db.patch(hero._id as Id<'heroes'>, { weekSeen: week })
      return { changed: true }
    }),
})
