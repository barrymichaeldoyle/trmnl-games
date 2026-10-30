import { paginator } from 'convex-helpers/server/pagination'
import { shouldPublish } from '@trmnl-games/engine/schedule'
import schema from '../../schema'
import type { Doc, Id } from '../../_generated/dataModel'
import type { MutationCtx } from '../../_generated/server'
import { openIncident, recoverIncidents } from '../../incidents'
import { mergeCounts } from '../achievements'
import { beginEngineBuild } from './publication'
import { typedTables, type EngineRuntime } from './runtime'
import { getOrCreateEngineWorld } from './world'

/**
 * Tick orchestration shared by every game (simulation.md). One logical tick per
 * accepted wall slot; the run's active guard spans the whole page chain; every
 * page is sequence-guarded so duplicates are no-ops; recovery resumes the same
 * run with the same pinned versions and never increments the tick.
 */

export const PAGE_SIZE = 25
export const STALL_MS = 5 * 60 * 1000
export const MAX_RECOVERY_ATTEMPTS = 3

/** What one page of subjects added to the run. */
export interface PageTally {
  readonly counts: Record<string, number>
  readonly unlocks: Record<string, number>
  population: number
  /** D216: who a game's step found where (Desk Crawler: heroes by floor), merged into the run's `censusPresence`. */
  readonly presence?: Record<string, PresenceTally>
}

export interface PresenceTally {
  count: number
  members: Array<{ userId: Id<'users'>; heroId: Id<'heroes'>; level: number }>
}

/** D216: members kept per floor; the count goes on past it. */
export const PRESENCE_MEMBERS_MAX = 50

/** Fold a page's presence into the run's, keeping the highest levels when a floor passes the cap. */
export function mergePresence(into: Record<string, PresenceTally> | undefined, page: Record<string, PresenceTally>): Record<string, PresenceTally> {
  const merged: Record<string, PresenceTally> = { ...into }
  for (const [floor, add] of Object.entries(page)) {
    const prior = merged[floor]
    const members = [...(prior?.members ?? []), ...add.members].sort((a, b) => b.level - a.level).slice(0, PRESENCE_MEMBERS_MAX)
    merged[floor] = { count: (prior?.count ?? 0) + add.count, members }
  }
  return merged
}

export interface SubjectStep<Content> {
  readonly run: Doc<'simulationRuns'>
  readonly world: Doc<'worldState'>
  readonly content: Content
  readonly now: number
  readonly tally: PageTally
}

const ENGINE_COUNTERS = ['processed', 'eligible', 'skippedDormant', 'quarantined'] as const

function zeroCounts(runtime: EngineRuntime<unknown>): Record<string, number> {
  return Object.fromEntries([...ENGINE_COUNTERS, ...runtime.runCounters].map((name) => [name, 0]))
}

/** Start the next tick if the world is free and this wall slot has not started; returns the active run. */
export async function startRun(ctx: MutationCtx, runtime: EngineRuntime<unknown>): Promise<Id<'simulationRuns'> | null> {
  const now = Date.now()
  const world = await getOrCreateEngineWorld(ctx, runtime)
  if (world.ticksPaused || world.maintenanceMode) return null
  if (world.activeRunId !== undefined) return world.activeRunId
  const wallSlot = runtime.schedule.wallSlotFor(now)
  if (world.lastStartedWallSlot !== undefined && wallSlot <= world.lastStartedWallSlot) return null

  const tick = world.currentTick + 1
  const contentVersion = world.activeContentVersion
  if (runtime.content(contentVersion) === undefined) throw new Error(`content version ${contentVersion} is not available`)
  const runId = await ctx.db.insert(typedTables(runtime).runs, {
    tick,
    wallSlot,
    scoreAt: wallSlot,
    publishes: shouldPublish(wallSlot, world.lastPublishedAt, runtime.schedule),
    startedAt: now,
    cohortCutoff: now,
    contentVersion,
    simulationVersion: world.activeSimulationVersion,
    seedVersion: runtime.seedVersion,
    state: 'simulating',
    paginationVersion: 1,
    batchSequence: 0,
    lastProgressAt: now,
    ...(zeroCounts(runtime) as { processed: number; eligible: number; skippedDormant: number; quarantined: number; deaths: number; levelUps: number; heldFinds: number }),
    recoveryAttempts: 0,
  })
  await ctx.db.patch(world._id, { currentTick: tick, lastStartedWallSlot: wallSlot, activeRunId: runId })
  const scheduled = await ctx.scheduler.runAfter(0, runtime.refs.simulateBatch, { runId, expectedSequence: 0 })
  await ctx.db.patch(runId, { nextScheduledFunctionId: scheduled })
  return runId
}

/**
 * One page of a run: guards, version checks, the subject page by immutable creation time, the game's
 * per-subject step, then progress, the next page, the leaderboard build or completion.
 */
export async function runBatch<Content>(
  ctx: MutationCtx,
  runtime: EngineRuntime<Content>,
  runId: Id<'simulationRuns'>,
  expectedSequence: number,
  step: (ctx: MutationCtx, subject: Doc<'heroes'>, context: SubjectStep<Content>) => Promise<void>,
): Promise<null> {
  const run = await ctx.db.get(runId)
  // Stale duplicate or late worker: nothing to do.
  if (run === null || run.state !== 'simulating' || run.batchSequence !== expectedSequence) return null
  const world = await getOrCreateEngineWorld(ctx, runtime)
  if (world.activeRunId !== runId) return null
  if (run.simulationVersion !== runtime.simulationVersion) {
    await blockRun(ctx, run, 'SIMULATION_VERSION_UNAVAILABLE')
    return null
  }
  const content = runtime.content(run.contentVersion)
  if (content === undefined) {
    await blockRun(ctx, run, 'CONTENT_VERSION_UNAVAILABLE')
    return null
  }

  const now = Date.now()
  // Exported index-key cursors survive an isolated restore.
  const db = paginator(ctx.db, schema)
  const page = await db
    .query(typedTables(runtime).subject)
    .withIndex('by_createdAt', (q) => q.lt('createdAt', run.cohortCutoff))
    .paginate({ numItems: PAGE_SIZE, cursor: run.cursor ?? null })

  const tally: PageTally = { counts: zeroCounts(runtime), unlocks: {}, population: 0, presence: {} }
  for (const subject of page.page) {
    tally.counts.processed! += 1
    await step(ctx, subject, { run, world, content, now, tally })
  }

  const runCounts = run as unknown as Record<string, number>
  const progress = {
    cursor: page.continueCursor,
    batchSequence: run.batchSequence + 1,
    lastProgressAt: now,
    ...Object.fromEntries(Object.entries(tally.counts).map(([name, value]) => [name, (runCounts[name] ?? 0) + value])),
    ...(Object.keys(tally.presence ?? {}).length > 0 ? { censusPresence: mergePresence(run.censusPresence, tally.presence!) } : {}),
    ...(run.publishes ? { achievementCounts: mergeCounts(run.achievementCounts, tally.unlocks), achievementPopulation: (run.achievementPopulation ?? 0) + tally.population } : {}),
  } as Partial<Doc<'simulationRuns'>>
  if (!page.isDone) {
    const scheduled = await ctx.scheduler.runAfter(0, runtime.refs.simulateBatch, { runId, expectedSequence: progress.batchSequence! })
    await ctx.db.patch(runId, { ...progress, nextScheduledFunctionId: scheduled })
    return null
  }
  await ctx.db.patch(runId, progress)
  const walked = (await ctx.db.get(runId))!
  if (runtime.onCohortWalked) await runtime.onCohortWalked(ctx, walked)
  if (run.publishes) {
    // Publication run: the hero walk is frozen; build and atomically publish all three boards.
    await beginEngineBuild(ctx, runtime, walked, world, now)
    return null
  }
  await ctx.db.patch(runId, { state: 'completed', finishedAt: now, nextScheduledFunctionId: undefined })
  await ctx.db.patch(world._id, { activeRunId: undefined, lastCompletedTick: run.tick, lastCompletedAt: now })
  await recoverIncidents(ctx, runId, now)
  return null
}

/** Blocked keeps the cursor and the active guard: no newer run starts until recovery. */
export async function blockRun(ctx: MutationCtx, run: Doc<'simulationRuns'>, code: string): Promise<void> {
  await ctx.db.patch(run._id, { state: 'blocked', failureCode: code, nextScheduledFunctionId: undefined })
}

/**
 * Every 5 minutes (simulation.md "Watchdog"): resume a stalled run only when its
 * scheduled continuation failed, was cancelled or vanished; never duplicate a
 * pending/running job; block after three automated attempts.
 */
export async function watchdogStep(ctx: MutationCtx, runtime: EngineRuntime<unknown>): Promise<null> {
  const world = await getOrCreateEngineWorld(ctx, runtime)
  if (world.activeRunId === undefined) return null
  const run = await ctx.db.get(world.activeRunId)
  if (run === null) return null
  const now = Date.now()
  if (run.state === 'ranking') {
    const publication = await ctx.db
      .query(typedTables(runtime).publications)
      .withIndex('by_runId', (q) => q.eq('runId', run._id))
      .unique()
    if (publication === null || publication.state !== 'building' || now - publication.lastProgressAt < STALL_MS) return null
    await openIncident(ctx, run._id, 'stall', now)
    const job = publication.nextScheduledFunctionId ? await ctx.db.system.get(publication.nextScheduledFunctionId) : null
    if (job?.state.kind === 'pending' || job?.state.kind === 'inProgress') return null
    if (run.recoveryAttempts >= MAX_RECOVERY_ATTEMPTS) {
      await blockRun(ctx, run, 'RANKING_STALLED_AFTER_RECOVERY')
      return null
    }
    const scheduled = await ctx.scheduler.runAfter(0, runtime.refs.buildBatch, { publicationId: publication._id, expectedSequence: publication.batchSequence })
    await ctx.db.patch(publication._id, { nextScheduledFunctionId: scheduled, lastProgressAt: now })
    await ctx.db.patch(run._id, { recoveryAttempts: run.recoveryAttempts + 1 })
    return null
  }
  if (run.state !== 'simulating') return null
  if (now - run.lastProgressAt < STALL_MS) return null
  await openIncident(ctx, run._id, 'stall', now)
  const job = run.nextScheduledFunctionId ? await ctx.db.system.get(run.nextScheduledFunctionId) : null
  const kind = job?.state.kind
  if (kind === 'pending' || kind === 'inProgress') return null
  if (run.recoveryAttempts >= MAX_RECOVERY_ATTEMPTS) {
    await blockRun(ctx, run, 'STALLED_AFTER_RECOVERY')
    return null
  }
  const scheduled = await ctx.scheduler.runAfter(0, runtime.refs.simulateBatch, { runId: run._id, expectedSequence: run.batchSequence })
  await ctx.db.patch(run._id, { nextScheduledFunctionId: scheduled, recoveryAttempts: run.recoveryAttempts + 1, lastProgressAt: now })
  return null
}
