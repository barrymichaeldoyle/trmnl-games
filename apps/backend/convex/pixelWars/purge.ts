import type { Id } from '../_generated/dataModel'
import type { MutationCtx } from '../_generated/server'
import { setSeatFaction } from './maps'

/**
 * Delete one desk's rows in bounded batches: stories, queued orders, score windows, achievements, then the desk. The
 * seat stays on the map as a cleared place (its number is never reused), so the map keeps its shape; copied names in
 * published boards are masked by owner state and rotate out within two publications, as for heroes.
 */
export async function purgeDesk(ctx: MutationCtx, deskId: Id<'desks'>, batch: number): Promise<number> {
  let removed = 0
  for (const row of await ctx.db.query('pwTickLogs').withIndex('by_deskId_and_at_and_sequence', (q) => q.eq('deskId', deskId)).take(batch)) {
    await ctx.db.delete(row._id)
    removed += 1
  }
  for (const row of await ctx.db.query('pwOrders').withIndex('by_deskId_and_tick', (q) => q.eq('deskId', deskId)).take(batch)) {
    await ctx.db.delete(row._id)
    removed += 1
  }
  for (const row of await ctx.db.query('pwScoreWindows').withIndex('by_heroId', (q) => q.eq('heroId', deskId)).take(batch)) {
    await ctx.db.delete(row._id)
    removed += 1
  }
  if (removed > 0) return removed
  const desk = await ctx.db.get(deskId)
  if (desk) {
    for (const row of await ctx.db.query('pwAchievements').withIndex('by_userId_and_achievementId', (q) => q.eq('userId', desk.userId)).take(batch)) {
      await ctx.db.delete(row._id)
      removed += 1
    }
    if (removed > 0) return removed
    if (desk.mapId !== undefined && desk.seat !== undefined) {
      const map = await ctx.db.get(desk.mapId)
      if (map && map.seats[desk.seat - 1]?.f !== 0) await setSeatFaction(ctx, map, desk.seat, 0)
    }
    await ctx.db.delete(deskId)
    return 1
  }
  return 0
}
