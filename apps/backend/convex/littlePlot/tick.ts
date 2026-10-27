import { v } from 'convex/values'
import { LittlePlotInvariantError, derivePlotSeeds, kindOf, simulatePlot, stageOf, type LittlePlotCatalog, type PlotState, type Weather } from '@trmnl-games/little-plot/sim'
import { needsFullPass } from '@trmnl-games/little-plot/content/achievements'
import { contentV2 as anglerContent } from '@trmnl-games/idle-angler/content/v2'
import { forecastFor } from '@trmnl-games/idle-angler/sim/seed'
import type { Doc, Id } from '../_generated/dataModel'
import { internalMutation, type MutationCtx, type QueryCtx } from '../_generated/server'
import { runBatch, startRun, watchdogStep, type SubjectStep } from '../lib/engine/runner'
import { noteQuarantine } from '../incidents'
import { accumulatorOf, addBucket, creditTick, foldScore } from '../lib/engine/scores'
import { readEngineWorld } from '../lib/engine/world'
import { IDLE_ANGLER_RUNTIME } from '../idleAngler/runtime'
import { queueLittlePlotAlerts } from '../lib/alerts'
import { fromPlotState, mirrored, storedDetail, toPlotState } from './adapter'
import { awardPlot, flowerTotal, stateOf, tallyPlotUnlocks } from './achievements'
import { writeRankInput } from './leaderboard'
import { currentPlot } from './profile'
import { LITTLE_PLOT_RUNTIME } from './runtime'
import { applyVisits, hostVisit, syncPoolRow } from './visits'

/**
 * Little Plot's tick (little-plot.md "The tick"), on the shared engine run frame: cron at minutes 12, 27, 42 and 57
 * (crons.ts), the same guards, pages, publication and watchdog as the other games, and this per-plot step. The plot
 * ranks by XP like Desk Crawler, so a publication run folds its score and writes a rank input.
 */

export const startTick = internalMutation({
  args: {},
  returns: v.union(v.null(), v.id('lpSimulationRuns')),
  handler: async (ctx) => (await startRun(ctx, LITTLE_PLOT_RUNTIME)) as unknown as Id<'lpSimulationRuns'> | null,
})

export const simulateBatch = internalMutation({
  args: { runId: v.id('lpSimulationRuns'), expectedSequence: v.number() },
  returns: v.null(),
  handler: async (ctx, { runId, expectedSequence }) => await runBatch(ctx, LITTLE_PLOT_RUNTIME, runId as unknown as Id<'simulationRuns'>, expectedSequence, simulatePlotStep),
})

export const watchdog = internalMutation({
  args: {},
  returns: v.null(),
  handler: async (ctx) => await watchdogStep(ctx, LITTLE_PLOT_RUNTIME),
})

/**
 * The plot's weather: Idle Angler's Millpond forecast under its world seed, so an angler and a gardener agree on the
 * sky. Before Idle Angler's world exists the plot's own seed stands in; the Millpond has no wind, so nothing maps to it.
 */
export async function plotWeather(ctx: QueryCtx, fallbackSeed: string, at: number): Promise<Weather> {
  const anglerWorld = await readEngineWorld(ctx, IDLE_ANGLER_RUNTIME)
  const weather = forecastFor(anglerWorld?.worldSeed ?? fallbackSeed, anglerContent, 'millpond', at)
  return weather === 'wind' ? 'clear' : weather
}

/** A publication run's share for one plot: its score fold, rank input and achievement rarity (D31, D65). */
async function publishInputs(ctx: MutationCtx, plot: Doc<'plots'>, owner: Doc<'users'>, step: SubjectStep<LittlePlotCatalog>, accumulator = accumulatorOf(plot)) {
  const scores = await foldScore(ctx, LITTLE_PLOT_RUNTIME, plot._id as unknown as Id<'heroes'>, step.run, accumulator)
  await writeRankInput(ctx, step.run, (await ctx.db.get(plot._id))!, owner, scores)
  await tallyPlotUnlocks(ctx, owner._id, step.tally.unlocks)
  step.tally.population += 1
}

const ripeCount = (state: PlotState, content: LittlePlotCatalog) => state.beds.filter((b) => b.kindId !== undefined && stageOf(b, kindOf(content, b.kindId)) === 'ripe').length

/** One plot's share of a page: eligibility, dormant skip, quarantine, the ledger, the pure tick, then its writes. */
async function simulatePlotStep(ctx: MutationCtx, subject: Doc<'heroes'>, step: SubjectStep<LittlePlotCatalog>): Promise<void> {
  const plot = subject as unknown as Doc<'plots'>
  const { run, world, content, now, tally } = step
  const counts = tally.counts as Record<'eligible' | 'skippedDormant' | 'quarantined' | 'ripenings' | 'pests' | 'visits', number>
  if (!plot.isActive || plot.activationState !== 'active' || plot.eligibleFromTick > run.tick || plot.lastTick >= run.tick) return
  const owner = await ctx.db.get(plot.userId)
  if (owner === null || (await currentPlot(ctx, owner))?._id !== plot._id) return
  counts.eligible += 1

  // A paused plot cannot change without an intent: skip it between publications (D32).
  if (plot.plot.status === 'paused' && !run.publishes) {
    counts.skippedDormant += 1
    return
  }
  if (plot.simulationState === 'quarantined') {
    counts.quarantined += 1
    await ctx.db.patch(plot._id, { lastTick: run.tick })
    if (run.publishes) await publishInputs(ctx, plot, owner, step)
    return
  }

  // The ledger first: seeds other gardens' gnomes and friends sent arrive before the tick, so a new kind can be told.
  const before = toPlotState(plot)
  const ledger = await applyVisits(ctx, plot, before, content, run.tick)
  let result
  try {
    result = simulatePlot({
      plot: ledger.state,
      tick: run.tick,
      tickAt: run.wallSlot,
      ...(owner.trmnlUtcOffset === undefined ? {} : { utcOffsetSeconds: owner.trmnlUtcOffset }),
      weather: await plotWeather(ctx, world.worldSeed, run.wallSlot),
      content,
      streams: derivePlotSeeds(world.worldSeed, plot._id, run.tick, run.simulationVersion),
    })
  } catch (error) {
    if (!(error instanceof LittlePlotInvariantError)) throw error
    counts.quarantined += 1
    await ctx.db.patch(plot._id, { simulationState: 'quarantined', quarantineReasonCode: error.code, lastTick: run.tick })
    await ctx.db.insert('lpSimulationFailures', {
      runId: run._id as unknown as Id<'lpSimulationRuns'>,
      heroId: plot._id,
      reasonCode: error.code,
      simulationVersion: run.simulationVersion,
      contentVersion: run.contentVersion,
      tick: run.tick,
      message: error.message.slice(0, 500),
      createdAt: now,
    })
    await noteQuarantine(ctx, run._id, now)
    if (run.publishes) await publishInputs(ctx, plot, owner, step)
    return
  }

  let state = result.plot
  let sequence = plot.logSequence
  const log = async (summary: string, detail: Doc<'lpTickLogs'>['detail'], kind: Doc<'lpTickLogs'>['kind']) => {
    sequence += 1
    await ctx.db.insert('lpTickLogs', { plotId: plot._id, source: 'tick', tick: run.tick, runId: run._id as unknown as Id<'lpSimulationRuns'>, sequence, at: now, kind, summary: summary.slice(0, 160), detail })
  }
  for (const line of ledger.lines) await log(line.summary, { v: 1, otherUserId: line.otherUserId, otherName: line.otherName, otherNameVersion: line.otherNameVersion, ...(line.kindId ? { kindId: line.kindId } : {}) }, 'visit')
  for (const event of result.events) await log(event.summary, storedDetail(event), event.kind)

  // Another garden's gnome: the core rolled it through the defences; the adapter picks the garden and moves the seed.
  if (result.visit && result.disposition === 'grew') {
    const visit = await hostVisit(ctx, plot, owner, state, content, result.visit, run.tick, now)
    if (visit) {
      state = visit.state
      for (const line of visit.lines) await log(line, { v: 1, otherUserId: visit.otherUserId, otherName: visit.otherName, otherNameVersion: visit.otherNameVersion }, 'visit')
      counts.visits += 1
    }
  }

  // Alerts (D206): half the beds ripe on this tick, and a kind never grown landing in the tin.
  if (owner.alerts !== undefined) {
    const half = Math.ceil(state.beds.length / 2)
    const halfRipe = ripeCount(before, content) < half && ripeCount(state, content) >= half
    const newSeeds = Object.keys(state.tin).filter((id) => (before.tin[id] ?? 0) === 0 && before.catalogue[id] === undefined && state.catalogue[id] === undefined)
    if (halfRipe || newSeeds.length > 0) await queueLittlePlotAlerts(ctx, { owner, plotId: plot._id, halfRipe, newSeeds, content, tick: run.tick, now })
  }

  const patch: Partial<Doc<'plots'>> = { plot: fromPlotState(state), ...mirrored(state), lastTick: run.tick }
  if (result.levelUps > 0) patch.lastLevelUpTick = run.tick
  if (result.disposition === 'grew') {
    patch.lastProgressTick = run.tick
    patch.lastAdvancedAt = now
  }
  if (sequence !== plot.logSequence) patch.logSequence = sequence
  // Credit this tick's XP to the current-hour accumulator (D31).
  const credited = creditTick(accumulatorOf(plot), run.scoreAt, result.xpEarned)
  if (credited.fold) await addBucket(ctx, LITTLE_PLOT_RUNTIME, plot._id as unknown as Id<'heroes'>, credited.fold)
  patch.scoreHourXp = credited.accumulator.scoreHourXp
  patch.scoreHour = credited.accumulator.scoreHour
  await ctx.db.patch(plot._id, patch)
  await syncPoolRow(ctx, plot, state, run.tick)

  // Achievements: diff lifetime state; a plot behind the catalog version gets one full pass.
  if (result.events.length > 0 || ledger.lines.length > 0 || result.visit || needsFullPass(plot.achievementsVersion)) {
    const updated = (await ctx.db.get(plot._id))!
    const flowers = needsFullPass(plot.achievementsVersion) ? await flowerTotal(ctx, owner._id) : 0
    await awardPlot(ctx, updated, stateOf(plot, flowers), stateOf(updated, flowers), now, run.tick)
  }
  if (run.publishes) await publishInputs(ctx, (await ctx.db.get(plot._id))!, owner, step, credited.accumulator)

  counts.ripenings += result.events.filter((e) => e.kind === 'ripe' && e.detail.stage === 'ripe').length
  counts.pests += result.events.filter((e) => e.kind === 'pest').length
}
