import { v } from 'convex/values'
import { internal } from './_generated/api'
import { internalMutation } from './_generated/server'

/**
 * Bounded retention cleanup (data-model.md "Retention plan"). Each job deletes
 * at most BATCH rows per invocation and reschedules itself until done. Active
 * or blocked runs and published leaderboard sets are never touched here.
 */
const BATCH = 200
const HOUR = 3_600_000
const DAY = 24 * HOUR
export const RETENTION = {
  tickLogsMs: 72 * HOUR,
  failuresMs: 7 * DAY,
  runsMs: 30 * DAY,
  installAttemptsMs: DAY,
  /** D110: applied raids, in world ticks (96 a day); pending ones wait for their target. */
  appliedRaidTicks: 30 * 96,
  /** P33: alert outbox rows, whatever their state. */
  alertOutboxMs: 7 * DAY,
} as const

type Job = 'tickLogs' | 'receipts' | 'rateLimits' | 'deletionConfirmations' | 'reconnectAttempts' | 'installAttempts' | 'failures' | 'runs' | 'raids' | 'meetings' | 'alerts' | 'iaTickLogs' | 'iaFailures' | 'iaRuns' | 'plTickLogs' | 'plFailures' | 'plRuns'
const ORDER: readonly Job[] = ['tickLogs', 'receipts', 'rateLimits', 'deletionConfirmations', 'reconnectAttempts', 'installAttempts', 'failures', 'runs', 'raids', 'meetings', 'alerts', 'iaTickLogs', 'iaFailures', 'iaRuns', 'plTickLogs', 'plFailures', 'plRuns']

export const cleanup = internalMutation({
  args: { job: v.optional(v.union(...ORDER.map((j) => v.literal(j)))) },
  returns: v.null(),
  handler: async (ctx, args) => {
    const job = args.job ?? 'tickLogs'
    const now = Date.now()
    let deleted = 0
    switch (job) {
      case 'tickLogs': {
        const rows = await ctx.db.query('tickLogs').withIndex('by_at', (q) => q.lt('at', now - RETENTION.tickLogsMs)).take(BATCH)
        for (const row of rows) await ctx.db.delete(row._id)
        deleted = rows.length
        break
      }
      case 'receipts': {
        const rows = await ctx.db.query('operationReceipts').withIndex('by_expiresAt', (q) => q.lt('expiresAt', now)).take(BATCH)
        for (const row of rows) await ctx.db.delete(row._id)
        deleted = rows.length
        break
      }
      case 'rateLimits': {
        const rows = await ctx.db.query('rateLimitBuckets').withIndex('by_expiresAt', (q) => q.lt('expiresAt', now)).take(BATCH)
        for (const row of rows) await ctx.db.delete(row._id)
        deleted = rows.length
        break
      }
      case 'deletionConfirmations': {
        const rows = await ctx.db.query('accountDeletionConfirmations').withIndex('by_expiresAt', (q) => q.lt('expiresAt', now)).take(BATCH)
        for (const row of rows) await ctx.db.delete(row._id)
        deleted = rows.length
        break
      }
      case 'installAttempts': {
        // Expired attempts are refused at use time; this only purges them within a day.
        const rows = await ctx.db.query('trmnlInstallAttempts').withIndex('by_expiresAt', (q) => q.lt('expiresAt', now - RETENTION.installAttemptsMs)).take(BATCH)
        for (const row of rows) await ctx.db.delete(row._id)
        deleted = rows.length
        break
      }
      case 'reconnectAttempts': {
        const rows = await ctx.db.query('trmnlReconnectAttempts').withIndex('by_expiresAt', q => q.lt('expiresAt', now)).take(BATCH)
        for (const row of rows) await ctx.db.delete(row._id)
        deleted = rows.length
        break
      }
      case 'failures': {
        const rows = await ctx.db.query('simulationFailures').withIndex('by_createdAt', (q) => q.lt('createdAt', now - RETENTION.failuresMs)).take(BATCH)
        for (const row of rows) await ctx.db.delete(row._id)
        deleted = rows.length
        break
      }
      case 'raids': {
        const world = await ctx.db.query('worldState').withIndex('by_key', (q) => q.eq('key', 'world')).unique()
        const before = (world?.currentTick ?? 0) - RETENTION.appliedRaidTicks
        const rows = await ctx.db.query('raids').withIndex('by_state_and_tick', (q) => q.eq('state', 'applied').lt('tick', before)).take(BATCH)
        for (const row of rows) await ctx.db.delete(row._id)
        deleted = rows.length
        break
      }
      // D141: applied meetings keep the raid retention; pending ones stay until their partner applies them.
      case 'meetings': {
        const world = await ctx.db.query('worldState').withIndex('by_key', (q) => q.eq('key', 'world')).unique()
        const before = (world?.currentTick ?? 0) - RETENTION.appliedRaidTicks
        const rows = await ctx.db.query('meetings').withIndex('by_state_and_tick', (q) => q.eq('state', 'applied').lt('tick', before)).take(BATCH)
        for (const row of rows) await ctx.db.delete(row._id)
        deleted = rows.length
        break
      }
      case 'alerts': {
        const rows = await ctx.db.query('alertOutbox').withIndex('by_createdAt', (q) => q.lt('createdAt', now - RETENTION.alertOutboxMs)).take(BATCH)
        for (const row of rows) await ctx.db.delete(row._id)
        deleted = rows.length
        break
      }
      // D115: Idle Angler keeps the same retention as Desk Crawler in its own tables.
      case 'iaTickLogs': {
        const rows = await ctx.db.query('iaTickLogs').withIndex('by_at', (q) => q.lt('at', now - RETENTION.tickLogsMs)).take(BATCH)
        for (const row of rows) await ctx.db.delete(row._id)
        deleted = rows.length
        break
      }
      case 'iaFailures': {
        const rows = await ctx.db.query('iaSimulationFailures').withIndex('by_createdAt', (q) => q.lt('createdAt', now - RETENTION.failuresMs)).take(BATCH)
        for (const row of rows) await ctx.db.delete(row._id)
        deleted = rows.length
        break
      }
      case 'iaRuns': {
        const rows = await ctx.db
          .query('iaSimulationRuns')
          .withIndex('by_state_and_startedAt', (q) => q.eq('state', 'completed').lt('startedAt', now - RETENTION.runsMs))
          .take(BATCH)
        const world = await ctx.db.query('iaWorldState').withIndex('by_key', (q) => q.eq('key', 'world')).unique()
        for (const row of rows) {
          const publication = await ctx.db.query('iaLeaderboardPublications').withIndex('by_runId', (q) => q.eq('runId', row._id)).unique()
          if (publication || row._id === world?.activeRunId) continue
          await ctx.db.delete(row._id)
          deleted += 1
        }
        break
      }
      // D159: Paper Lives keeps the same retention in its own tables. A life's lasting story is its record and highlights.
      case 'plTickLogs': {
        const rows = await ctx.db.query('plTickLogs').withIndex('by_at', (q) => q.lt('at', now - RETENTION.tickLogsMs)).take(BATCH)
        for (const row of rows) await ctx.db.delete(row._id)
        deleted = rows.length
        break
      }
      case 'plFailures': {
        const rows = await ctx.db.query('plSimulationFailures').withIndex('by_createdAt', (q) => q.lt('createdAt', now - RETENTION.failuresMs)).take(BATCH)
        for (const row of rows) await ctx.db.delete(row._id)
        deleted = rows.length
        break
      }
      case 'plRuns': {
        const rows = await ctx.db
          .query('plSimulationRuns')
          .withIndex('by_state_and_startedAt', (q) => q.eq('state', 'completed').lt('startedAt', now - RETENTION.runsMs))
          .take(BATCH)
        const world = await ctx.db.query('plWorldState').withIndex('by_key', (q) => q.eq('key', 'world')).unique()
        for (const row of rows) {
          const publication = await ctx.db.query('plLeaderboardPublications').withIndex('by_runId', (q) => q.eq('runId', row._id)).unique()
          if (publication || row._id === world?.activeRunId) continue
          await ctx.db.delete(row._id)
          deleted += 1
        }
        break
      }
      case 'runs': {
        const rows = await ctx.db
          .query('simulationRuns')
          .withIndex('by_state_and_startedAt', (q) => q.eq('state', 'completed').lt('startedAt', now - RETENTION.runsMs))
          .take(BATCH)
        const world = await ctx.db.query('worldState').withIndex('by_key', (q) => q.eq('key', 'world')).unique()
        for (const row of rows) {
          // A run still referenced by a kept leaderboard publication stays until that set is cleaned.
          const publication = await ctx.db.query('leaderboardPublications').withIndex('by_runId', (q) => q.eq('runId', row._id)).unique()
          if (publication || row._id === world?.activeRunId) continue
          await ctx.db.delete(row._id)
          deleted += 1
        }
        break
      }
    }
    if (deleted === BATCH) {
      await ctx.scheduler.runAfter(0, internal.maintenance.cleanup, { job })
    } else {
      const next = ORDER[ORDER.indexOf(job) + 1]
      if (next) await ctx.scheduler.runAfter(0, internal.maintenance.cleanup, { job: next })
    }
    return null
  },
})
