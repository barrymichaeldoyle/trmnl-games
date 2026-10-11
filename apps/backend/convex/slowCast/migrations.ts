import { v } from 'convex/values'
import { internalMutation } from '../_generated/server'

const PAGE = 100
const STAGES = ['anglers', 'tickLogs', 'runs'] as const

/**
 * One-off (2026-10-10): Slow Cast dropped XP and levels. Clears what is left of them, a page at a time: the retired
 * angler fields and score windows, then `xpEarned` on stories, then `levelUps` on tick runs. Rerun with the returned
 * stage and cursor until `done`. Once every deployment has run it, the retired fields leave the schema.
 *   npx convex run slowCast/migrations:clearRetiredFields '{}'
 */
export const clearRetiredFields = internalMutation({
  args: { stage: v.optional(v.union(...STAGES.map((s) => v.literal(s)))), cursor: v.optional(v.union(v.string(), v.null())) },
  returns: v.object({ cleared: v.number(), done: v.boolean(), stage: v.union(...STAGES.map((s) => v.literal(s))), cursor: v.union(v.string(), v.null()) }),
  handler: async (ctx, args) => {
    const stage = args.stage ?? 'anglers'
    const cursor = args.cursor ?? null
    let cleared = 0
    let page: { isDone: boolean; continueCursor: string }
    if (stage === 'anglers') {
      const anglers = await ctx.db.query('anglers').paginate({ numItems: PAGE, cursor })
      for (const angler of anglers.page) {
        if ([angler.level, angler.xp, angler.lifetimeXp, angler.lastLevelUpTick, angler.scoreHour, angler.scoreHourXp].some((field) => field !== undefined)) {
          await ctx.db.patch(angler._id, { level: undefined, xp: undefined, lifetimeXp: undefined, lastLevelUpTick: undefined, scoreHour: undefined, scoreHourXp: undefined })
          cleared += 1
        }
        for (const row of await ctx.db.query('swScoreWindows').withIndex('by_heroId', (q) => q.eq('heroId', angler._id)).take(10)) await ctx.db.delete(row._id)
      }
      page = anglers
    } else if (stage === 'tickLogs') {
      const logs = await ctx.db.query('swTickLogs').paginate({ numItems: PAGE, cursor })
      for (const log of logs.page) {
        if (log.deltas.xpEarned === undefined) continue
        await ctx.db.patch(log._id, { deltas: { gold: log.deltas.gold } })
        cleared += 1
      }
      page = logs
    } else {
      const runs = await ctx.db.query('swSimulationRuns').paginate({ numItems: PAGE, cursor })
      for (const run of runs.page) {
        if (run.levelUps === undefined) continue
        await ctx.db.patch(run._id, { levelUps: undefined })
        cleared += 1
      }
      page = runs
    }
    if (!page.isDone) return { cleared, done: false, stage, cursor: page.continueCursor }
    const next = STAGES[STAGES.indexOf(stage) + 1]
    return next ? { cleared, done: false, stage: next, cursor: null } : { cleared, done: true, stage, cursor: null }
  },
})
