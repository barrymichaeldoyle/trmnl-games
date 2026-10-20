import type { Id } from '../_generated/dataModel'
import type { MutationCtx } from '../_generated/server'

/**
 * Delete one plot's rows in bounded batches: stories, visits, the pool row, score windows, achievements, the profile's
 * flowers, then the plot. Returns how many rows went, so callers repeat until it is zero. Tags on other players' seeds
 * that name this account are rewritten as plain seeds by `scrubTags` (little-plot.md "Data"). Copied names in
 * published boards are masked by owner state and rotate out within two publications, as for heroes.
 */
export async function purgePlot(ctx: MutationCtx, plotId: Id<'plots'>, batch: number): Promise<number> {
  let removed = 0
  for (const row of await ctx.db.query('lpTickLogs').withIndex('by_plotId_and_at_and_sequence', (q) => q.eq('plotId', plotId)).take(batch)) {
    await ctx.db.delete(row._id)
    removed += 1
  }
  for (const row of await ctx.db.query('lpVisits').withIndex('by_plotId_and_tick', (q) => q.eq('plotId', plotId)).take(batch)) {
    await ctx.db.delete(row._id)
    removed += 1
  }
  for (const row of await ctx.db.query('lpGnomePool').withIndex('by_plotId', (q) => q.eq('plotId', plotId)).take(batch)) {
    await ctx.db.delete(row._id)
    removed += 1
  }
  for (const row of await ctx.db.query('lpScoreWindows').withIndex('by_heroId', (q) => q.eq('heroId', plotId)).take(batch)) {
    await ctx.db.delete(row._id)
    removed += 1
  }
  if (removed > 0) return removed
  const plot = await ctx.db.get(plotId)
  if (plot) {
    for (const row of await ctx.db.query('lpAchievements').withIndex('by_userId_and_achievementId', (q) => q.eq('userId', plot.userId)).take(batch)) {
      await ctx.db.delete(row._id)
      removed += 1
    }
    if (removed > 0) return removed
    await ctx.db.delete(plotId)
    return 1
  }
  return 0
}
