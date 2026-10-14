import { v } from 'convex/values'
import type { Id } from '../_generated/dataModel'
import { internalMutation } from '../_generated/server'
import { buildStep, cleanupStep } from '../lib/engine/publication'
import { PAPER_LIVES_RUNTIME } from './runtime'

/**
 * The shared engine's hourly publication, kept for achievement rarity (D65). Paper Lives has no ranking tables, so a
 * build publishes at once; the boards players see are the life records (records.ts).
 */
export const buildBatch = internalMutation({
  args: { publicationId: v.id('plLeaderboardPublications'), expectedSequence: v.number() },
  returns: v.null(),
  handler: async (ctx, { publicationId, expectedSequence }) => await buildStep(ctx, PAPER_LIVES_RUNTIME, publicationId as unknown as Id<'leaderboardPublications'>, expectedSequence),
})

export const cleanupPublication = internalMutation({
  args: { publicationId: v.id('plLeaderboardPublications') },
  returns: v.null(),
  handler: async (ctx, { publicationId }) => await cleanupStep(ctx, PAPER_LIVES_RUNTIME, publicationId as unknown as Id<'leaderboardPublications'>),
})
