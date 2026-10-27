import { v } from 'convex/values'
import { PaperLivesInvariantError, simulateLife, type PaperLivesCatalog } from '@trmnl-games/paper-lives/sim'
import { deriveLifeSeeds } from '@trmnl-games/paper-lives/sim/seed'
import type { Doc, Id } from '../_generated/dataModel'
import { internal } from '../_generated/api'
import { internalMutation, type MutationCtx } from '../_generated/server'
import { runBatch, startRun, watchdogStep, type SubjectStep } from '../lib/engine/runner'
import { noteQuarantine } from '../incidents'
import { fromLifeState, toLifeState } from './adapter'
import { currentLife } from './profile'
import { endedLife } from './records'
import { awardLife, tallyLifeUnlocks } from './achievements'
import { queuePaperLivesAlerts } from '../lib/alerts'
import { PAPER_LIVES_RUNTIME } from './runtime'

/**
 * Paper Lives' tick (paper-lives.md "The year"), on the shared engine run frame: cron at minutes 10, 25, 40 and 55
 * (crons.ts), the same guards, pages, publication and watchdog as the other games, and this per-life step. Paper
 * Lives has no XP: the hourly publication carries only achievement rarity, and the boards are life records.
 */

export const startTick = internalMutation({
  args: {},
  returns: v.union(v.null(), v.id('plSimulationRuns')),
  handler: async (ctx) => (await startRun(ctx, PAPER_LIVES_RUNTIME)) as unknown as Id<'plSimulationRuns'> | null,
})

export const simulateBatch = internalMutation({
  args: { runId: v.id('plSimulationRuns'), expectedSequence: v.number() },
  returns: v.null(),
  handler: async (ctx, { runId, expectedSequence }) => await runBatch(ctx, PAPER_LIVES_RUNTIME, runId as unknown as Id<'simulationRuns'>, expectedSequence, simulateLifeStep),
})

export const watchdog = internalMutation({
  args: {},
  returns: v.null(),
  handler: async (ctx) => await watchdogStep(ctx, PAPER_LIVES_RUNTIME),
})

/** A finished life's age for analytics, in bands rather than the exact age. */
const ageBand = (age: number) => (age < 18 ? 'under 18' : age < 60 ? '18 to 59' : age < 80 ? '60 to 79' : age < 100 ? '80 to 99' : '100 and over')

/** Where a step runs: a scheduled run, or Age up ending a ready year on the spot (no run). */
export type StepAt = { tick: number; runId?: Id<'plSimulationRuns'> }

/** Story lines and recaps go to the log; prompts and ambient lines too, since the device shows the newest. */
async function writeLogs(ctx: MutationCtx, life: Doc<'lives'>, result: ReturnType<typeof simulateLife>, at: StepAt, now: number): Promise<number> {
  let sequence = life.logSequence
  for (const event of result.events) {
    sequence += 1
    await ctx.db.insert('plTickLogs', {
      lifeId: life._id,
      ordinal: life.ordinal,
      source: 'tick',
      tick: at.tick,
      ...(at.runId ? { runId: at.runId } : {}),
      sequence,
      at: now,
      kind: event.kind,
      glyph: event.glyph,
      age: event.age,
      summary: event.summary,
      ...(event.remarkable ? { remarkable: true } : {}),
      ...(event.major ? { major: true } : {}),
      ...(event.changes ? { changes: event.changes } : {}),
    })
  }
  return sequence
}

/** A publication run's share for one life: achievement rarity, published with the hourly set (D65). */
async function publishInputs(ctx: MutationCtx, owner: Doc<'users'>, step: SubjectStep<PaperLivesCatalog>) {
  await tallyLifeUnlocks(ctx, owner._id, step.tally.unlocks)
  step.tally.population += 1
}

/**
 * A step's writes, shared by the scheduled tick and Age up: the story lines, the life, the record and boards at a
 * death, achievements when a year or a life ends, alerts and the life-ended analytics event.
 */
export async function applyStep(ctx: MutationCtx, life: Doc<'lives'>, owner: Doc<'users'>, result: ReturnType<typeof simulateLife>, content: PaperLivesCatalog, at: StepAt, now: number): Promise<void> {
  const sequence = await writeLogs(ctx, life, result, at, now)
  const patch: Partial<Doc<'lives'>> = { life: fromLifeState(result.life), lastTick: at.tick, logSequence: sequence }
  if (result.disposition !== 'idle') {
    patch.lastProgressTick = at.tick
    patch.lastAdvancedAt = now
  }
  await ctx.db.patch(life._id, patch)
  if (result.record) {
    await endedLife(ctx, (await ctx.db.get(life._id))!, result.record, now)
    // One analytics event per finished life, consent-gated (paper-lives.md "Analytics"): an age band and the cause id.
    if (owner.analyticsConsent === true) await ctx.scheduler.runAfter(0, internal.analytics.captureActivation, { userId: owner._id, event: 'life ended', game: 'paper-lives', properties: { age_band: ageBand(result.record.age), cause: result.record.cause } })
  }
  // Achievements: when a year or a life ends, never on a passive tick.
  if (result.disposition === 'boundary' || result.disposition === 'died') await awardLife(ctx, life._id, now, at.tick)
  await queuePaperLivesAlerts(ctx, { owner, lifeId: life._id, before: toLifeState(life), after: result.life, content, tick: at.tick, now })
}

/** One life's share of a page: eligibility, dormant skip, quarantine, the pure tick, then its writes. */
async function simulateLifeStep(ctx: MutationCtx, subject: Doc<'heroes'>, step: SubjectStep<PaperLivesCatalog>): Promise<void> {
  const life = subject as unknown as Doc<'lives'>
  const { run, world, content, now, tally } = step
  const counts = tally.counts as Record<'eligible' | 'skippedDormant' | 'quarantined' | 'events' | 'years' | 'deaths', number>
  if (!life.isActive || life.activationState !== 'active' || life.eligibleFromTick > run.tick || life.lastTick >= run.tick) return
  const owner = await ctx.db.get(life.userId)
  if (owner === null || (await currentLife(ctx, owner))?._id !== life._id) return
  counts.eligible += 1

  // A paused life or a memorial cannot change without an intent: skip it between publications (D32).
  if (life.life.status !== 'living' && !run.publishes) {
    counts.skippedDormant += 1
    return
  }
  if (life.simulationState === 'quarantined') {
    counts.quarantined += 1
    await ctx.db.patch(life._id, { lastTick: run.tick })
    if (run.publishes) await publishInputs(ctx, owner, step)
    return
  }

  let result
  try {
    result = simulateLife({ life: toLifeState(life), content, streams: deriveLifeSeeds(world.worldSeed, life._id, run.tick, run.simulationVersion) })
  } catch (error) {
    if (!(error instanceof PaperLivesInvariantError)) throw error
    counts.quarantined += 1
    await ctx.db.patch(life._id, { simulationState: 'quarantined', quarantineReasonCode: error.code, lastTick: run.tick })
    await ctx.db.insert('plSimulationFailures', {
      runId: run._id as unknown as Id<'plSimulationRuns'>,
      heroId: life._id,
      reasonCode: error.code,
      simulationVersion: run.simulationVersion,
      contentVersion: run.contentVersion,
      tick: run.tick,
      message: error.message.slice(0, 500),
      createdAt: now,
    })
    await noteQuarantine(ctx, run._id, now)
    if (run.publishes) await publishInputs(ctx, owner, step)
    return
  }

  await applyStep(ctx, life, owner, result, content, { tick: run.tick, runId: run._id as unknown as Id<'plSimulationRuns'> }, now)
  if (run.publishes) await publishInputs(ctx, owner, step)

  counts.events += result.events.filter((e) => e.kind === 'event').length
  counts.years += result.disposition === 'boundary' ? 1 : 0
  counts.deaths += result.disposition === 'died' ? 1 : 0
}
