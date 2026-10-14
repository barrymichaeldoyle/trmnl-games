import type { Id } from '../_generated/dataModel'
import type { MutationCtx } from '../_generated/server'

/**
 * Delete one account's Paper Lives rows in bounded batches: the story lines, the board rows, the achievements, the
 * photos, the finished lives' records, then the life. Returns how many rows went, so callers repeat until it is zero. Public life pages go with
 * the records (paper-lives.md "Data").
 */
export async function purgeLives(ctx: MutationCtx, userId: Id<'users'>, lifeId: Id<'lives'> | undefined, batch: number): Promise<number> {
  let removed = 0
  if (lifeId) {
    for (const row of await ctx.db.query('plTickLogs').withIndex('by_lifeId_and_at_and_sequence', (q) => q.eq('lifeId', lifeId)).take(batch)) {
      await ctx.db.delete(row._id)
      removed += 1
    }
  }
  for (const row of await ctx.db.query('plLifeBoards').withIndex('by_userId', (q) => q.eq('userId', userId)).take(batch)) {
    await ctx.db.delete(row._id)
    removed += 1
  }
  for (const row of await ctx.db.query('plAchievements').withIndex('by_userId_and_achievementId', (q) => q.eq('userId', userId)).take(batch)) {
    await ctx.db.delete(row._id)
    removed += 1
  }
  for (const row of await ctx.db.query('plPhotos').withIndex('by_userId_and_ordinal', (q) => q.eq('userId', userId)).take(batch)) {
    await ctx.db.delete(row._id)
    removed += 1
  }
  for (const row of await ctx.db.query('lifeRecords').withIndex('by_userId_and_endedAt', (q) => q.eq('userId', userId)).take(batch)) {
    await ctx.db.delete(row._id)
    removed += 1
  }
  if (removed > 0) return removed
  if (lifeId && (await ctx.db.get(lifeId))) {
    await ctx.db.delete(lifeId)
    return 1
  }
  return 0
}
