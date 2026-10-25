import { v } from 'convex/values'
import { levelGroup } from '@trmnl-games/engine/levels'
import type { Doc, Id } from '../_generated/dataModel'
import { internalMutation, query, type MutationCtx, type QueryCtx } from '../_generated/server'
import { buildStep, cleanupStep, TOP_ENTRIES } from '../lib/engine/publication'
import { writeEngineRankInput } from '../lib/engine/scores'
import { readEngineWorld } from '../lib/engine/world'
import { currentUser } from '../lib/intent'
import { maskedEntries } from '../lib/rankingRead'
import { currentDesk } from './profile'
import { PIXEL_WARS_RUNTIME } from './runtime'

/** Pixel Wars' leaderboards (pixel-wars.md "Leaderboards"): the same three XP boards as Desk Crawler, built by the shared engine. */

export async function writeRankInput(ctx: MutationCtx, run: Doc<'simulationRuns'>, desk: Doc<'desks'>, owner: Doc<'users'>, scores: { xp24h: number; xp7d: number }): Promise<void> {
  const subject = { ...desk, name: owner.publicAlias, scoreHourXp: desk.scoreHourXp, ...(desk.scoreHour === undefined ? {} : { scoreHour: desk.scoreHour }) }
  await writeEngineRankInput(ctx, PIXEL_WARS_RUNTIME, run, subject as unknown as Doc<'heroes'>, owner, scores, desk.faction === 0 || desk.cleared === true)
}

export const buildBatch = internalMutation({
  args: { publicationId: v.id('pwLeaderboardPublications'), expectedSequence: v.number() },
  returns: v.null(),
  handler: async (ctx, { publicationId, expectedSequence }) => await buildStep(ctx, PIXEL_WARS_RUNTIME, publicationId as unknown as Id<'leaderboardPublications'>, expectedSequence),
})

export const cleanupPublication = internalMutation({
  args: { publicationId: v.id('pwLeaderboardPublications') },
  returns: v.null(),
  handler: async (ctx, { publicationId }) => await cleanupStep(ctx, PIXEL_WARS_RUNTIME, publicationId as unknown as Id<'leaderboardPublications'>),
})

const boardValidator = v.union(v.literal('overall'), v.literal('recent_24h'), v.literal('recent_7d'))

/** Companion board: Top 100 of one board and level group from the published set, plus the viewer's own rank in it. */
export const view = query({
  args: { board: v.optional(boardValidator), cohortKey: v.optional(v.string()) },
  returns: v.any(),
  handler: async (ctx, args) => {
    const board = args.board ?? 'recent_7d'
    const world = await readEngineWorld(ctx, PIXEL_WARS_RUNTIME)
    const publicationId = world?.publishedPublicationId as unknown as Id<'pwLeaderboardPublications'> | undefined
    const publication = publicationId ? await ctx.db.get(publicationId) : null
    if (publication === null || publication === undefined || publication.state !== 'published') return { board, published: false as const }
    const user = await currentUser(ctx)
    const desk = await currentDesk(ctx, user)
    const own = desk ? await ctx.db.query('pwRanks').withIndex('by_publicationId_and_board_and_heroId', (q) => q.eq('publicationId', publication._id).eq('board', board).eq('heroId', desk._id)).unique() : null
    const cohortKey = board === 'overall' ? 'all' : (args.cohortKey ?? own?.cohortKey ?? (desk ? levelGroup(desk.level).key : '1-3'))
    const generation = await ctx.db.query('pwLeaderboardGenerations').withIndex('by_publicationId_and_board_and_cohortKey', (q) => q.eq('publicationId', publication._id).eq('board', board).eq('cohortKey', cohortKey)).unique()
    return {
      board,
      published: true as const,
      cohortKey,
      ownCohortKey: own?.cohortKey ?? null,
      scoreAt: publication.scoreAt,
      asOfTick: publication.asOfTick,
      globalTotalPlayers: publication.globalTotalPlayers,
      totalPlayers: generation?.totalPlayers ?? 0,
      entries: generation ? await maskedEntries(ctx, generation.entries as unknown as Doc<'leaderboardGenerations'>['entries'], TOP_ENTRIES, { profiles: true, current: currentDesk }) : [],
      own: own && own.cohortKey === cohortKey ? { rank: own.rank, rankDelta: own.rankDelta ?? null, score: own.score ?? null } : null,
    }
  },
})

/** Device board: the seven-day Top 5 of the desk's level group and its own row. */
export async function readDeviceBoard(ctx: QueryCtx, desk: Doc<'desks'>): Promise<{ top: Array<{ rank: number; name: string; level: number; own: boolean }>; own: { rank: number; total: number } | null } | null> {
  const world = await readEngineWorld(ctx, PIXEL_WARS_RUNTIME)
  const publicationId = world?.publishedPublicationId as unknown as Id<'pwLeaderboardPublications'> | undefined
  const publication = publicationId ? await ctx.db.get(publicationId) : null
  if (!publication || publication.state !== 'published') return null
  const own = await ctx.db.query('pwRanks').withIndex('by_publicationId_and_board_and_heroId', (q) => q.eq('publicationId', publication._id).eq('board', 'recent_7d').eq('heroId', desk._id)).unique()
  const cohortKey = own?.cohortKey ?? levelGroup(desk.level).key
  const generation = await ctx.db.query('pwLeaderboardGenerations').withIndex('by_publicationId_and_board_and_cohortKey', (q) => q.eq('publicationId', publication._id).eq('board', 'recent_7d').eq('cohortKey', cohortKey)).unique()
  const entries = (generation?.entries ?? []) as unknown as Doc<'leaderboardGenerations'>['entries']
  const rows = generation ? await maskedEntries(ctx, entries, 5, { current: currentDesk }) : []
  return {
    top: rows.map((row, i) => ({ rank: row.rank, name: row.name, level: row.level, own: entries[i]?.heroId === (desk._id as unknown as Id<'heroes'>) })),
    own: own ? { rank: own.rank, total: generation?.totalPlayers ?? 0 } : null,
  }
}
