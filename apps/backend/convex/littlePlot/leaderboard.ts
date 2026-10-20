import { v } from 'convex/values'
import { levelGroup } from '@trmnl-games/engine/levels'
import type { Doc, Id } from '../_generated/dataModel'
import { internalMutation, query, type MutationCtx } from '../_generated/server'
import { buildStep, cleanupStep, TOP_ENTRIES } from '../lib/engine/publication'
import { writeEngineRankInput } from '../lib/engine/scores'
import { readEngineWorld } from '../lib/engine/world'
import { currentUser } from '../lib/intent'
import { maskedEntries } from '../lib/rankingRead'
import { currentPlot } from './profile'
import { LITTLE_PLOT_RUNTIME } from './runtime'

/**
 * Little Plot's leaderboards (little-plot.md "Leaderboards"): the same three XP boards as Desk Crawler, built and
 * published by the shared engine (lib/engine/publication.ts); this module registers the builder and the companion read.
 */

/** Write one frozen projection for an eligible plot on a publication run. The owner's public name is the row's name. */
export async function writeRankInput(ctx: MutationCtx, run: Doc<'simulationRuns'>, plot: Doc<'plots'>, owner: Doc<'users'>, scores: { xp24h: number; xp7d: number }): Promise<void> {
  const subject = { ...plot, name: owner.publicAlias, lastLevelUpTick: plot.lastLevelUpTick, scoreHourXp: plot.scoreHourXp, ...(plot.scoreHour === undefined ? {} : { scoreHour: plot.scoreHour }) }
  await writeEngineRankInput(ctx, LITTLE_PLOT_RUNTIME, run, subject as unknown as Doc<'heroes'>, owner, scores, plot.plot.status === 'paused')
}

export const buildBatch = internalMutation({
  args: { publicationId: v.id('lpLeaderboardPublications'), expectedSequence: v.number() },
  returns: v.null(),
  handler: async (ctx, { publicationId, expectedSequence }) => await buildStep(ctx, LITTLE_PLOT_RUNTIME, publicationId as unknown as Id<'leaderboardPublications'>, expectedSequence),
})

export const cleanupPublication = internalMutation({
  args: { publicationId: v.id('lpLeaderboardPublications') },
  returns: v.null(),
  handler: async (ctx, { publicationId }) => await cleanupStep(ctx, LITTLE_PLOT_RUNTIME, publicationId as unknown as Id<'leaderboardPublications'>),
})

const boardValidator = v.union(v.literal('overall'), v.literal('recent_24h'), v.literal('recent_7d'))

/** Companion board: Top 100 of one board and level group from the published set, plus the viewer's own rank in it. */
export const view = query({
  args: { board: v.optional(boardValidator), cohortKey: v.optional(v.string()) },
  returns: v.any(),
  handler: async (ctx, args) => {
    const board = args.board ?? 'recent_7d'
    const world = await readEngineWorld(ctx, LITTLE_PLOT_RUNTIME)
    const publicationId = world?.publishedPublicationId as unknown as Id<'lpLeaderboardPublications'> | undefined
    const publication = publicationId ? await ctx.db.get(publicationId) : null
    if (publication === null || publication === undefined || publication.state !== 'published') return { board, published: false as const }
    const user = await currentUser(ctx)
    const plot = await currentPlot(ctx, user)
    const own = plot ? await ctx.db.query('lpRanks').withIndex('by_publicationId_and_board_and_heroId', (q) => q.eq('publicationId', publication._id).eq('board', board).eq('heroId', plot._id)).unique() : null
    const cohortKey = board === 'overall' ? 'all' : (args.cohortKey ?? own?.cohortKey ?? (plot ? levelGroup(plot.level).key : '1-3'))
    const generation = await ctx.db.query('lpLeaderboardGenerations').withIndex('by_publicationId_and_board_and_cohortKey', (q) => q.eq('publicationId', publication._id).eq('board', board).eq('cohortKey', cohortKey)).unique()
    return {
      board,
      published: true as const,
      cohortKey,
      ownCohortKey: own?.cohortKey ?? null,
      scoreAt: publication.scoreAt,
      asOfTick: publication.asOfTick,
      globalTotalPlayers: publication.globalTotalPlayers,
      totalPlayers: generation?.totalPlayers ?? 0,
      entries: generation ? await maskedEntries(ctx, generation.entries as unknown as Doc<'leaderboardGenerations'>['entries'], TOP_ENTRIES, { profiles: true, current: currentPlot }) : [],
      own: own && own.cohortKey === cohortKey ? { rank: own.rank, rankDelta: own.rankDelta ?? null, score: own.score ?? null } : null,
    }
  },
})

/** Device board: the seven-day Top 5 of the plot's level group and its own row. */
export async function readDeviceBoard(ctx: Parameters<typeof maskedEntries>[0], plot: Doc<'plots'>): Promise<{ top: Array<{ rank: number; name: string; level: number; own: boolean }>; own: { rank: number; total: number } | null } | null> {
  const world = await readEngineWorld(ctx, LITTLE_PLOT_RUNTIME)
  const publicationId = world?.publishedPublicationId as unknown as Id<'lpLeaderboardPublications'> | undefined
  const publication = publicationId ? await ctx.db.get(publicationId) : null
  if (!publication || publication.state !== 'published') return null
  const own = await ctx.db.query('lpRanks').withIndex('by_publicationId_and_board_and_heroId', (q) => q.eq('publicationId', publication._id).eq('board', 'recent_7d').eq('heroId', plot._id)).unique()
  const cohortKey = own?.cohortKey ?? levelGroup(plot.level).key
  const generation = await ctx.db.query('lpLeaderboardGenerations').withIndex('by_publicationId_and_board_and_cohortKey', (q) => q.eq('publicationId', publication._id).eq('board', 'recent_7d').eq('cohortKey', cohortKey)).unique()
  const entries = (generation?.entries ?? []) as unknown as Doc<'leaderboardGenerations'>['entries']
  const rows = generation ? await maskedEntries(ctx, entries, 5, { current: currentPlot }) : []
  return {
    top: rows.map((row, i) => ({ rank: row.rank, name: row.name, level: row.level, own: entries[i]?.heroId === (plot._id as unknown as Id<'heroes'>) })),
    own: own ? { rank: own.rank, total: generation?.totalPlayers ?? 0 } : null,
  }
}
