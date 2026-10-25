import type { DeskCounters, GoalDef, GoalState, PixelWarsCatalog } from './types'

/** Goals (pixel-wars.md "Score and XP"): one current goal over the desk's counters, append-only (D135). A met goal pays its XP at once and moves the pointer on. */
export const zeroCounters = (): DeskCounters => ({ cellsPainted: 0, stamps: 0, cellsFlipped: 0, underdogFlips: 0, desksTaken: 0, desksLiberated: 0, deskFullHours: 0, seasonsPlayed: 0, seasonsWon: 0, invitesPlaced: 0, ordersAtNight: 0, deskFalls: 0, ordersPlaced: 0, goalsReached: 0 })

export const goalMet = (counters: DeskCounters, goal: GoalDef): boolean => counters[goal.predicate.counter] >= goal.predicate.at

export const currentGoal = (content: PixelWarsCatalog, state: GoalState | undefined): GoalDef | undefined => (state ? content.goals[state.rung] : content.goals[0])

/** Walk the ladder from the current rung: every goal met pays; stops at the first unmet. */
export function evaluateGoals(content: PixelWarsCatalog, state: GoalState | undefined, counters: DeskCounters): { state: GoalState; counters: DeskCounters; reached: GoalDef[]; xp: number } {
  let rung = state?.rung ?? 0
  const reached: GoalDef[] = []
  let xp = 0
  let next = counters
  while (rung < content.goals.length && goalMet(next, content.goals[rung]!)) {
    const goal = content.goals[rung]!
    reached.push(goal)
    xp += goal.xp
    next = { ...next, goalsReached: next.goalsReached + 1 }
    rung += 1
  }
  return { state: { rung }, counters: next, reached, xp }
}

export function goalProgress(counters: DeskCounters, goal: GoalDef): { value: number; target: number } | null {
  return goal.predicate.at > 1 ? { value: Math.min(counters[goal.predicate.counter], goal.predicate.at), target: goal.predicate.at } : null
}
