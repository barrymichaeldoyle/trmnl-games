import { v } from 'convex/values'
import { applyRenames, familyRenames, renameIn, settleGender } from '@trmnl-games/paper-lives/sim'
import { internal } from '../_generated/api'
import { internalMutation } from '../_generated/server'
import { readEngineWorld, setEngineContentVersion } from '../lib/engine/world'
import { fromLifeState, toLifeState } from './adapter'
import { PAPER_LIVES_RUNTIME } from './runtime'

/**
 * Switch the catalog Paper Lives' next run pins (D159):
 * `npx convex run --prod paperLives/operations:setActiveContentVersion '{"contentVersion":"v2"}'`.
 * Lives keep their state; the next year is drawn from the new catalog.
 */
export const setActiveContentVersion = internalMutation({
  args: { contentVersion: v.string() },
  returns: v.object({ from: v.string(), to: v.string() }),
  handler: async (ctx, { contentVersion }) => await setEngineContentVersion(ctx, PAPER_LIVES_RUNTIME, contentVersion),
})

const gender = v.union(v.literal('female'), v.literal('male'))
const renames = v.array(v.object({ id: v.string(), from: v.string(), to: v.string(), gender }))

/**
 * D182, once after the switch to content v5: every living life begun under an earlier catalog becomes a girl or a
 * boy with everyone's gender fixed (the tick would do that much at the next year), and its family is made a mother
 * and a father, with a partner of the other sex. Someone renamed for that is renamed in the life's story lines too.
 * Pages through the lives, 25 a run, and schedules itself on:
 * `npx convex run --prod paperLives/operations:settleFamilies '{}'`.
 */
export const settleFamilies = internalMutation({
  args: { cursor: v.optional(v.union(v.string(), v.null())) },
  returns: v.object({ lives: v.number(), changed: v.number(), renamed: v.number(), done: v.boolean() }),
  handler: async (ctx, { cursor }) => {
    const world = await readEngineWorld(ctx, PAPER_LIVES_RUNTIME)
    const content = world ? PAPER_LIVES_RUNTIME.content(world.activeContentVersion) : undefined
    if (!content?.tuning.gendered) throw new Error('Switch Paper Lives to content v5 first.')
    const page = await ctx.db.query('lives').withIndex('by_createdAt').paginate({ numItems: 25, cursor: cursor ?? null })
    let changed = 0
    let renamed = 0
    for (const doc of page.page) {
      if (doc.life.status === 'ended') continue
      const stored = toLifeState(doc)
      const settled = settleGender(stored, content)
      const names = familyRenames(settled, content)
      if (settled === stored && names.length === 0) continue
      await ctx.db.patch(doc._id, { life: fromLifeState(applyRenames(settled, names)) })
      changed += 1
      if (names.length > 0) {
        renamed += names.length
        await ctx.scheduler.runAfter(0, internal.paperLives.operations.renameStory, { lifeId: doc._id, ordinal: doc.ordinal, renames: names, cursor: null })
      }
    }
    if (!page.isDone) await ctx.scheduler.runAfter(0, internal.paperLives.operations.settleFamilies, { cursor: page.continueCursor })
    return { lives: page.page.length, changed, renamed, done: page.isDone }
  },
})

/** One life's story lines with the family renames applied, 200 a run (D182). */
export const renameStory = internalMutation({
  args: { lifeId: v.id('lives'), ordinal: v.number(), renames, cursor: v.union(v.string(), v.null()) },
  returns: v.null(),
  handler: async (ctx, args) => {
    const page = await ctx.db
      .query('plTickLogs')
      .withIndex('by_lifeId_and_ordinal_and_at_and_sequence', (q) => q.eq('lifeId', args.lifeId).eq('ordinal', args.ordinal))
      .paginate({ numItems: 200, cursor: args.cursor })
    for (const row of page.page) {
      const summary = renameIn(row.summary, args.renames)
      if (summary !== row.summary) await ctx.db.patch(row._id, { summary })
    }
    if (!page.isDone) await ctx.scheduler.runAfter(0, internal.paperLives.operations.renameStory, { ...args, cursor: page.continueCursor })
    return null
  },
})
