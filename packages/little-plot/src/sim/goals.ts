import { kindOf, kindsGrown, neighbours, stageOf } from './rules'
import type { GoalDef, GoalPredicate, LittlePlotCatalog, PlotState, TickEvent, UnclaimedGoal } from './types'

/**
 * Goals (little-plot.md "Progression and goals"): Desk Crawler's career ladder (D128) with Idle Angler's Claim button
 * (D196). One current goal; a met goal sets its coins aside, logs one line naming the next and moves the pointer one
 * goal on, so a later goal already met is reached on its own evaluation. Guarantees are once per rung.
 */

const popcount = (bits: number) => {
  let n = 0
  for (let b = bits; b > 0; b >>= 1) n += b & 1
  return n
}

/** Whether two kinds sit side by side anywhere on the plot, at any stage. */
export function adjacentPair(plot: PlotState, pair: readonly [string, string]): boolean {
  return plot.beds.some((bed, i) => {
    const other = bed.kindId === pair[0] ? pair[1] : bed.kindId === pair[1] ? pair[0] : undefined
    return other !== undefined && neighbours(plot, i).some((n) => plot.beds[n]?.kindId === other)
  })
}

export function goalMet(content: LittlePlotCatalog, plot: PlotState, predicate: GoalPredicate): boolean {
  switch (predicate.kind) {
    case 'counter':
      return (plot.counters[predicate.counter] ?? 0) >= predicate.at
    case 'kinds':
      return kindsGrown(plot) >= predicate.at
    case 'item':
      return plot.items.includes(predicate.id)
    case 'beds':
      return plot.beds.length >= predicate.at
    case 'stage':
      return plot.beds.some((bed) => bed.kindId !== undefined && stageOf(bed, kindOf(content, bed.kindId)) === predicate.stage) || plot.counters.ripenings > 0
    case 'adjacent':
      return adjacentPair(plot, predicate.pair) || plot.counters.crossesFound > 0
    case 'seasons':
      return popcount(plot.counters.seasonsGrown) >= predicate.at
    case 'boughtSeed':
      return plot.counters.seedsBought > 0
  }
}

export function currentGoal(content: LittlePlotCatalog, plot: PlotState): GoalDef | undefined {
  return plot.goal ? content.goals[plot.goal.rung] : undefined
}

/** How far along a counted goal is, for the companion's bar; null for a one-step goal. */
export function goalProgress(content: LittlePlotCatalog, plot: PlotState, predicate: GoalPredicate): { value: number; target: number } | null {
  const of = (value: number, target: number) => (target > 1 ? { value: Math.min(value, target), target } : null)
  switch (predicate.kind) {
    case 'counter':
      return of(plot.counters[predicate.counter] ?? 0, predicate.at)
    case 'kinds':
      return of(kindsGrown(plot), predicate.at)
    case 'beds':
      return of(plot.beds.length, predicate.at)
    case 'seasons':
      return of(popcount(plot.counters.seasonsGrown), predicate.at)
    default:
      return null
  }
}

/** After the ladder: "Grow 25 kinds", counting on with no coins. */
export function goalLine(content: LittlePlotCatalog, plot: PlotState): string | null {
  const goal = currentGoal(content, plot)
  if (goal) return goal.title
  return `Grow ${kindsGrown(plot) + 1} kinds`
}

/** The goal step at the end of an evaluation (and after an intent that may have met one). */
export function evaluateGoal(content: LittlePlotCatalog, plot: PlotState): { plot: PlotState; event?: TickEvent } {
  if (content.goals.length === 0) return { plot }
  if (!plot.goal) return { plot: { ...plot, goal: { rung: firstUnmet(content, plot), ticksAtStart: plot.ticks } } }
  const goal = currentGoal(content, plot)
  if (!goal || !goalMet(content, plot, goal.predicate)) return { plot }
  const waiting: UnclaimedGoal[] = goal.coins > 0 ? [...(plot.goal.unclaimed ?? []), { id: goal.id, coins: goal.coins }] : [...(plot.goal.unclaimed ?? [])]
  const next: PlotState = {
    ...plot,
    goal: { rung: plot.goal.rung + 1, ticksAtStart: plot.ticks, ...(waiting.length > 0 ? { unclaimed: waiting } : {}) },
    counters: { ...plot.counters, goalsReached: plot.counters.goalsReached + 1 },
  }
  const event: TickEvent = { kind: 'goal', summary: `Goal reached: ${goal.title}. Next: ${goalLine(content, next)}.`, detail: { goalId: goal.id, coins: goal.coins } }
  return { plot: next, event }
}

/** The first goal at or after `from` not met yet (D128's backfill for a plot from before the ladder). */
export function firstUnmet(content: LittlePlotCatalog, plot: PlotState, from = 0): number {
  let rung = from
  while (rung < content.goals.length && goalMet(content, plot, content.goals[rung]!.predicate)) rung += 1
  return rung
}

/** Claim one waiting reward, the oldest unless named. */
export function claimGoalReward(plot: PlotState, id?: string): { ok: true; plot: PlotState; reward: UnclaimedGoal } | { ok: false } {
  const waiting = plot.goal?.unclaimed ?? []
  const reward = id === undefined ? waiting[0] : waiting.find((entry) => entry.id === id)
  if (!plot.goal || !reward) return { ok: false }
  const rest = waiting.filter((entry) => entry !== reward)
  const { unclaimed: _gone, ...goal } = plot.goal
  return {
    ok: true,
    reward,
    plot: { ...plot, gold: plot.gold + reward.coins, goal: rest.length > 0 ? { ...goal, unclaimed: rest } : goal, counters: { ...plot.counters, goldEarned: plot.counters.goldEarned + reward.coins } },
  }
}

export function goalWaiting(unclaimed: readonly UnclaimedGoal[] | undefined): { count: number; coins: number } | null {
  if (!unclaimed || unclaimed.length === 0) return null
  return { count: unclaimed.length, coins: unclaimed.reduce((sum, entry) => sum + entry.coins, 0) }
}

/** Whether the current goal's guarantee of this kind is live and unused this rung. */
export function guaranteeLive(content: LittlePlotCatalog, plot: PlotState, kind: 'ripe' | 'cross' | 'trap'): boolean {
  const goal = currentGoal(content, plot)
  const g = goal?.guarantee
  if (!g || !plot.goal || g.kind !== kind || plot.goal.used) return false
  return plot.ticks - plot.goal.ticksAtStart >= (g.afterTicks ?? 0)
}

export const useGuarantee = (plot: PlotState): PlotState => (plot.goal ? { ...plot, goal: { ...plot.goal, used: true } } : plot)
