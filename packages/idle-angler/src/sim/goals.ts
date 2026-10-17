import { speciesLogged } from './titles'
import type { AnglerState, FeatureId, GoalDef, GoalPredicate, IdleAnglerCatalog, TickEvent, UnclaimedGoal } from './types'

/**
 * Goals and unlocks (D162, idle-angler-full.md "Goals and unlocks"): Desk Crawler's career ladder (D128) in Idle
 * Angler's terms. One current goal; unlocks follow species logged because the game has no levels (D116). A catalog
 * without the rules has no goals and every feature open, which is how content v1 replays.
 */

export function unlocked(content: Pick<IdleAnglerCatalog, 'unlocks' | 'species'>, angler: Pick<AnglerState, 'logbook'>, feature: FeatureId): boolean {
  const at = content.unlocks?.[feature]
  return at === undefined || Object.keys(angler.logbook).length >= at
}

const FEATURE_LINE: Readonly<Record<FeatureId, (content: IdleAnglerCatalog) => string>> = {
  shop_upgrades: () => 'Unlocked: rod and cooler upgrades in the tackle shop.',
  orders: () => 'Unlocked: fishmonger orders. Three are on the slate.',
  // Issue #6: the line says what "big" means; the Dock links it to the wall.
  trophies: (content) => `Unlocked: the trophy wall. Fish at ${content.trophies?.minPercent ?? 60}% of their species' top weight can be mounted from the Cooler.`,
  opens: () => 'Unlocked: the weekend Opens at every water.',
  deadbait: () => 'Unlocked: small fish can go back on the hook as deadbait.',
}

/** Unlock lines for features that opened with this many species (written once, when the count crosses). */
export function unlockEvents(content: IdleAnglerCatalog, logged: number): TickEvent[] {
  if (!content.unlocks) return []
  return (Object.entries(content.unlocks) as Array<[FeatureId, number]>)
    .filter(([, at]) => at === logged && at > 0)
    .map(([feature]) => ({ kind: 'milestone', summary: FEATURE_LINE[feature](content), detail: {}, deltas: { gold: 0 } }))
}

const popcount = (bits: number) => {
  let n = 0
  for (let b = bits; b > 0; b >>= 1) n += b & 1
  return n
}

export function goalMet(content: IdleAnglerCatalog, angler: AnglerState, predicate: GoalPredicate): boolean {
  switch (predicate.kind) {
    case 'counter':
      return (angler.counters[predicate.counter] ?? 0) >= predicate.at
    case 'species':
      return speciesLogged(content, angler.logbook, predicate.water) >= predicate.at
    case 'rod':
      return angler.rodTier >= predicate.at
    case 'cooler':
      return angler.coolerTier >= predicate.at
    case 'access':
      return angler.access.includes(predicate.id)
    case 'fished':
      return angler.waterId === predicate.water || speciesLogged(content, angler.logbook, predicate.water) > 0
    case 'bought':
      return (angler.bait[predicate.bait] ?? 0) > 0 || (predicate.bait === 'bread' && (angler.counters.breadCatches ?? 0) > 0)
    case 'logged':
      return predicate.anyOf.some((id) => angler.logbook[id] !== undefined)
    case 'seasons':
      return popcount(angler.counters.seasonsFished ?? 0) >= predicate.at
  }
}

/** The first goal at or after `from` that is not met yet; the ladder's length when every goal is met. */
export function firstUnmet(content: IdleAnglerCatalog, angler: AnglerState, from = 0): number {
  const goals = content.goals ?? []
  let rung = from
  while (rung < goals.length && goalMet(content, angler, goals[rung]!.predicate)) rung += 1
  return rung
}

export function currentGoal(content: IdleAnglerCatalog, angler: AnglerState): GoalDef | undefined {
  return angler.goal ? content.goals?.[angler.goal.rung] : undefined
}

/**
 * How far along a counted goal is, for the companion's progress bar: "Log eight species" at 5 of 8. Null for a goal
 * that is one step (buy, fish, catch once), where a bar would only ever read 0 of 1.
 */
export function goalProgress(content: IdleAnglerCatalog, angler: AnglerState, predicate: GoalPredicate): { value: number; target: number } | null {
  const of = (value: number, target: number) => (target > 1 ? { value: Math.min(value, target), target } : null)
  switch (predicate.kind) {
    case 'counter':
      return of(angler.counters[predicate.counter] ?? 0, predicate.at)
    case 'species':
      return of(speciesLogged(content, angler.logbook, predicate.water), predicate.at)
    case 'seasons':
      return of(popcount(angler.counters.seasonsFished ?? 0), predicate.at)
    default:
      return null
  }
}

/** After the ladder: "Log 27 species", counting on with no coins. */
export function goalLine(content: IdleAnglerCatalog, angler: AnglerState): string | null {
  if (!content.goals) return null
  const goal = currentGoal(content, angler)
  if (goal) return goal.title
  return `Log ${speciesLogged(content, angler.logbook) + 1} species`
}

/**
 * The goal step at the end of an evaluation. The first evaluation under a catalog with goals backfills the pointer to
 * the first unmet goal, paying and logging nothing (D128's backfill). After that, a met current goal pays its coins,
 * logs one line naming the next goal and moves the pointer past every goal already met.
 */
export function evaluateGoal(content: IdleAnglerCatalog, angler: AnglerState): { angler: AnglerState; event?: TickEvent } {
  if (!content.goals) return { angler }
  if (!angler.goal) return { angler: { ...angler, goal: { rung: firstUnmet(content, angler), castsAtStart: angler.counters.casts } } }
  const goal = currentGoal(content, angler)
  if (!goal || !goalMet(content, angler, goal.predicate)) return { angler }
  const rung = firstUnmet(content, angler, angler.goal.rung + 1)
  // v3 sets the coins aside until the player claims them (D129's shape); earlier catalogs pay on the spot.
  const waiting: UnclaimedGoal[] = content.claimGoals && goal.coins > 0 ? [...(angler.goal.unclaimed ?? []), { id: goal.id, coins: goal.coins }] : (angler.goal.unclaimed ?? [])
  const next: AnglerState = {
    ...angler,
    gold: content.claimGoals ? angler.gold : angler.gold + goal.coins,
    goal: { rung, castsAtStart: angler.counters.casts, ...(waiting.length > 0 ? { unclaimed: waiting } : {}) },
    counters: { ...angler.counters, goalsReached: (angler.counters.goalsReached ?? 0) + 1 },
  }
  const following = goalLine(content, next)
  const event: TickEvent = { kind: 'goal', summary: `Goal reached: ${goal.title}. Next: ${following}.`, detail: { goalId: goal.id }, deltas: { gold: content.claimGoals ? 0 : goal.coins } }
  return { angler: next, event }
}

/**
 * Claim one waiting goal reward (v3), the oldest unless an id is named: its coins are paid and counted as earned.
 * Nothing waiting, or no such reward, is a refusal.
 */
export function claimGoalReward(content: IdleAnglerCatalog, angler: AnglerState, id?: string): { ok: true; angler: AnglerState; reward: UnclaimedGoal } | { ok: false } {
  const waiting = angler.goal?.unclaimed ?? []
  const reward = id === undefined ? waiting[0] : waiting.find((entry) => entry.id === id)
  if (!angler.goal || !reward || !content.goals) return { ok: false }
  const rest = waiting.filter((entry) => entry !== reward)
  const { unclaimed: _gone, ...goal } = angler.goal
  return {
    ok: true,
    reward,
    angler: {
      ...angler,
      gold: angler.gold + reward.coins,
      goal: rest.length > 0 ? { ...goal, unclaimed: rest } : goal,
      counters: { ...angler.counters, goldEarned: angler.counters.goldEarned + reward.coins },
    },
  }
}

/** Whether the current goal's guarantee forces this cast's bite. */
export function guaranteedBite(content: IdleAnglerCatalog, angler: AnglerState, bait: string | undefined): boolean {
  const goal = currentGoal(content, angler)
  const guarantee = goal?.guarantee
  if (!guarantee || !angler.goal) return false
  if (guarantee.bait !== undefined && bait !== guarantee.bait) return false
  return angler.counters.casts - angler.goal.castsAtStart >= guarantee.casts
}
