import { v } from 'convex/values'
import { internal } from '../_generated/api'
import type { Doc, TableNames } from '../_generated/dataModel'
import { internalMutation, internalQuery, type QueryCtx } from '../_generated/server'

/**
 * D158: the one-off fresh start when Slow Cast became Idle Angler. The game was hidden with no players, so its old
 * tables, every angler and the shared rows that still name `slow-cast` are deleted rather than copied. Run once per
 * deployment after the rename deploys: `npx convex run idleAngler/legacyReset:run` (add `--prod` for production); it
 * schedules itself until every step is empty, then `idleAngler/legacyReset:check` should list nothing. The follow-up
 * deploy removes this file, the legacy tables and the `slow-cast` literal from the schema.
 */
interface Step {
  readonly table: TableNames
  /** Absent: every row goes. */
  readonly matches?: (ctx: QueryCtx, row: Doc<TableNames>) => boolean
}

/** Both slugs: the reset is the whole game's, so an install made after the deploy cannot outlive its angler. */
const anglerGame = (slug: string | undefined) => slug === 'slow-cast' || slug === 'idle-angler'
const gameRow = (_ctx: QueryCtx, row: Doc<TableNames>) => anglerGame((row as { gameSlug?: string }).gameSlug)

const STEPS: readonly Step[] = [
  // The tables under their old names (`sw` from the working title Still Waters).
  { table: 'swTickLogs' },
  { table: 'swCatchRecords' },
  { table: 'swAchievements' },
  { table: 'slowCastProfiles' },
  { table: 'swAchievementStats' },
  { table: 'swLeaderboardPublications' },
  { table: 'swSimulationFailures' },
  { table: 'swWorldState' },
  // Every angler and its rows, including any the renamed tick wrote before this ran.
  { table: 'catches' },
  { table: 'iaTickLogs' },
  { table: 'iaCatchRecords' },
  { table: 'iaAchievements' },
  { table: 'flyBoxes' },
  { table: 'anglers' },
  { table: 'idleAnglerProfiles' },
  { table: 'alertOutbox', matches: (_ctx, row) => (row as Doc<'alertOutbox'>).anglerId !== undefined },
  // Shared rows for the game under either slug; the status row only under the old one.
  { table: 'trmnlInstances', matches: gameRow },
  { table: 'trmnlInstallAttempts', matches: gameRow },
  { table: 'trmnlGrants', matches: gameRow },
  { table: 'gameDeletionJobs', matches: gameRow },
  { table: 'platformGames', matches: (_ctx, row) => (row as Doc<'platformGames'>).slug === 'slow-cast' },
  { table: 'operationReceipts', matches: (_ctx, row) => anglerGame((row as Doc<'operationReceipts'>).scope) },
  { table: 'operationalIncidents', matches: (ctx, row) => ctx.db.normalizeId('swSimulationRuns', (row as Doc<'operationalIncidents'>).runId) !== null },
  // Last, once no incident points at an old run.
  { table: 'swSimulationRuns' },
]

const PAGE = 200

export const run = internalMutation({
  args: { step: v.optional(v.number()), cursor: v.optional(v.union(v.string(), v.null())), removed: v.optional(v.number()) },
  returns: v.null(),
  handler: async (ctx, args) => {
    const index = args.step ?? 0
    const step = STEPS[index]
    if (!step) {
      console.log(`legacy reset done: ${args.removed ?? 0} rows removed`)
      return null
    }
    const page = await ctx.db.query(step.table).paginate({ cursor: args.cursor ?? null, numItems: PAGE })
    let removed = args.removed ?? 0
    for (const row of page.page) {
      if (step.matches && !step.matches(ctx, row)) continue
      // A revoked token stays refused, as a game deletion leaves it (deletion.ts).
      if (step.table === 'trmnlGrants') {
        const tokenHash = (row as Doc<'trmnlGrants'>).tokenHash
        const known = await ctx.db.query('revokedTrmnlCredentials').withIndex('by_tokenHash', (q) => q.eq('tokenHash', tokenHash)).first()
        if (!known) await ctx.db.insert('revokedTrmnlCredentials', { tokenHash, revokedAt: Date.now(), reasonCode: 'game_renamed' })
      }
      await ctx.db.delete(row._id)
      removed += 1
    }
    // A table emptied without a filter is read from the start again until a page comes back empty.
    const next = page.isDone ? { step: index + 1, cursor: null } : { step: index, cursor: step.matches ? page.continueCursor : null }
    if (page.isDone) console.log(`legacy reset: ${step.table} clear`)
    await ctx.scheduler.runAfter(0, internal.idleAngler.legacyReset.run, { ...next, removed })
    return null
  },
})

/** Which steps still have rows; empty once the reset has finished. Scans at most 1,000 rows per table. */
export const check = internalQuery({
  args: {},
  returns: v.array(v.string()),
  handler: async (ctx) => {
    const left: string[] = []
    for (const step of STEPS) {
      const rows = await ctx.db.query(step.table).take(1000)
      if (rows.some((row) => !step.matches || step.matches(ctx, row))) left.push(step.table)
    }
    return left
  },
})
