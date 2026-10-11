import { v } from 'convex/values'
import { internalMutation } from '../_generated/server'

const PAGE = 200

/**
 * One-off (2026-10-11): delete the last level-up stories from before XP was retired, a page at a time, so the
 * `levelup` story kind can leave the validators. Rerun with the returned cursor until `done`.
 *   npx convex run slowCast/migrations:dropLevelUpStories '{}'
 */
export const dropLevelUpStories = internalMutation({
  args: { cursor: v.optional(v.union(v.string(), v.null())) },
  returns: v.object({ deleted: v.number(), done: v.boolean(), cursor: v.union(v.string(), v.null()) }),
  handler: async (ctx, { cursor }) => {
    const page = await ctx.db.query('swTickLogs').paginate({ numItems: PAGE, cursor: cursor ?? null })
    let deleted = 0
    for (const log of page.page) {
      if (log.kind !== 'levelup') continue
      await ctx.db.delete(log._id)
      deleted += 1
    }
    return { deleted, done: page.isDone, cursor: page.isDone ? null : page.continueCursor }
  },
})
