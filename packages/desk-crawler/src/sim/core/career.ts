import { codePoints } from './narrative'
import { potionCap } from './pouch'
import type { CareerPredicate, CareerRule, CareerRung, CareerState, ContentCatalog, GuaranteedEvent, HeroState, LogDetail, SimulationInput, SimulationResult, StanceId, TickEvent, UnlockableFeature } from './types'

/**
 * The career ladder and feature unlocks (P35). Applied after the tick's own story and the to-do list, from state
 * only: no draw, so the encounter and every other line are exactly what the same catalog without a ladder produces,
 * plus the rung's gold. Unlocks are level milestones read by the simulator before each gated draw; the lines that
 * announce them are written here, once, on the tick the hero crosses the level.
 */

export const FEATURES: readonly UnlockableFeature[] = ['todo', 'stances', 'choices', 'merchant', 'raids']

/** How each feature reads on the device and in the companion. */
export const FEATURE_LABEL: Readonly<Record<UnlockableFeature, string>> = {
  todo: 'the to-do list',
  stances: 'stances',
  choices: 'office decisions',
  merchant: 'the wandering merchant',
  raids: 'desk raids',
}

/** Whether a hero at `level` has this feature under the catalog; a catalog without unlocks has everything on. */
export function unlocked(content: ContentCatalog, level: number, feature: UnlockableFeature): boolean {
  return content.unlocks === undefined || level >= content.unlocks[feature]
}

/** The stance the hero plays by: its own once stances are unlocked, else balanced (undefined). */
export function effectiveStance(content: ContentCatalog, hero: Pick<HeroState, 'level' | 'stance'>): StanceId | undefined {
  return unlocked(content, hero.level, 'stances') ? hero.stance : undefined
}

/** The rung's current value and target, for progress figures and the predicate itself. */
export function measureRung(predicate: CareerPredicate, hero: HeroState, content: ContentCatalog): { value: number; target: number } {
  switch (predicate.kind) {
    case 'counter':
      return { value: hero.counters[predicate.counter], target: predicate.atLeast }
    case 'anyCounter':
      return { value: Math.max(...predicate.counters.map((counter) => hero.counters[counter])), target: predicate.atLeast }
    case 'level':
      return { value: hero.level, target: predicate.atLeast }
    case 'bag':
      return { value: hero.bagCapacity, target: predicate.atLeast }
    case 'pouch':
      return { value: potionCap(content, hero), target: predicate.atLeast }
    case 'biomeWin': {
      const ids = content.biomes.find((b) => b.id === predicate.biomeId)?.monsterIds ?? []
      return { value: ids.reduce((sum, id) => sum + (hero.counters.monsterWins[id] ?? 0), 0), target: 1 }
    }
  }
}

export const rungSatisfied = (rung: CareerRung, hero: HeroState, content: ContentCatalog): boolean => {
  const { value, target } = measureRung(rung.predicate, hero, content)
  return value >= target
}

/** The first rung at or after `from` the hero has not satisfied; the ladder's length when none is left. */
export function firstOpenRung(rules: CareerRule, hero: HeroState, content: ContentCatalog, from = 0): number {
  for (let i = from; i < rules.rungs.length; i += 1) if (!rungSatisfied(rules.rungs[i]!, hero, content)) return i
  return rules.rungs.length
}

/** The feature a guaranteed event needs, if any. */
const guaranteeFeature = (event: GuaranteedEvent): UnlockableFeature | undefined => (event === 'choice' ? 'choices' : event === 'merchant' ? 'merchant' : undefined)

/** How many times the guaranteed event has happened to this hero, so a guarantee can tell it already did. */
export function eventCount(hero: HeroState, event: GuaranteedEvent): number {
  const c = hero.counters
  switch (event) {
    case 'combat':
      return c.combatWins + c.retreats + c.deaths + c.rescues
    case 'gear':
      return c.itemsFound
    case 'choice':
      return c.choicesMade + c.choicesDefaulted
    case 'merchant':
      return c.merchantVisits
    case 'elite':
      return c.eliteWins
  }
}

/** The hero's current rung under the catalog, or undefined off the ladder. */
export function currentRung(content: ContentCatalog, hero: HeroState): CareerRung | undefined {
  return hero.career === undefined ? undefined : content.career?.rungs[hero.career.rung]
}

/**
 * The event this exploring tick must produce, or undefined. Fires once per rung (a repeating guarantee re-arms, so at
 * most once per bound), once the hero has explored the rung's bound since the guarantee was armed: a choice only with
 * none pending, a merchant only with none visiting, an elite only outside the safe biome when the rung says so. The
 * caller still takes every draw, and marks the rung fired or disarmed.
 */
export function guaranteeDue(content: ContentCatalog, hero: HeroState): GuaranteedEvent | undefined {
  const rung = currentRung(content, hero)
  const guarantee = rung?.guarantee
  const armedAt = hero.career?.armedAt
  if (guarantee === undefined || armedAt === undefined || hero.career?.fired) return undefined
  if (hero.counters.ticksExplored - armedAt < guarantee.withinTicks) return undefined
  // The event came by itself since the rung was armed (a find waiting to be equipped): nothing to force. A repeating
  // guarantee skips this, since its event expires and the pending check above is the one that matters.
  if (!guarantee.repeat && eventCount(hero, guarantee.event) !== (hero.career?.armedCount ?? 0)) return undefined
  const feature = guaranteeFeature(guarantee.event)
  if (feature !== undefined && !unlocked(content, hero.level, feature)) return undefined
  if (guarantee.event === 'choice' && (hero.choice !== undefined || content.choices === undefined)) return undefined
  if (guarantee.event === 'merchant' && (hero.merchant !== undefined || content.merchant === undefined)) return undefined
  if (guarantee.outsideSafe && content.biomes.find((b) => b.id === hero.biomeId)?.safe) return undefined
  return guarantee.event
}

/**
 * Apply the ladder to a finished tick: unlock lines for levels crossed this tick, then the current rung. A rung that
 * holds pays its gold through the hero's gold like a task, logs a goal line, and the pointer moves to the next rung,
 * which pays at the next evaluation if the hero has already done it, so every rung is reached in order and one pays
 * per tick. A hero without a place on the ladder joins at the first rung it had not satisfied when the tick began:
 * an existing hero skips what it has done without pay or lines, a new hero starts at the first rung with its first
 * win still ahead.
 */
export function applyCareer(input: SimulationInput, result: SimulationResult): SimulationResult {
  const { content, tick } = input
  const rules = content.career
  const unlocks = content.unlocks
  if (rules === undefined && unlocks === undefined) return result
  const before = input.hero
  let hero = result.nextHero
  const events: TickEvent[] = [...(result.extraEvents ?? [])]
  const metrics = { ...result.metrics }

  if (unlocks !== undefined) {
    for (const feature of FEATURES) {
      const level = unlocks[feature]
      if (before.level < level && hero.level >= level) {
        metrics.unlocks += 1
        events.push(careerEvent(input, result, { variant: 'career', phase: 'unlocked', id: feature, title: FEATURE_LABEL[feature], gold: 0 }))
      }
    }
  }

  if (rules !== undefined && rules.rungs.length > 0) {
    let state: CareerState = hero.career ?? { rung: firstOpenRung(rules, before, content), startedTick: tick, reached: [] }
    const current = rules.rungs[state.rung]
    if (current !== undefined && rungSatisfied(current, hero, content)) {
      const gold = current.gold
      hero = { ...hero, gold: hero.gold + gold, counters: { ...hero.counters, goldEarned: hero.counters.goldEarned + gold, careerRungs: hero.counters.careerRungs + 1 } }
      metrics.careerRungs = 1
      const next = state.rung + 1
      state = { rung: next, startedTick: tick, reached: [...state.reached, { id: current.id, tick, ...(input.tickAt === undefined ? {} : { at: input.tickAt }) }] }
      const following = rules.rungs[next]
      events.push(careerEvent(input, result, { variant: 'career', phase: 'reached', id: current.id, title: current.title, ...(following === undefined ? {} : { next: following.title }), gold }))
    }
    // Arm the rung's guarantee once its feature is on; it counts adventures from here.
    const rung = rules.rungs[state.rung]
    const feature = rung?.guarantee === undefined ? undefined : guaranteeFeature(rung.guarantee.event)
    if (rung?.guarantee !== undefined && state.armedAt === undefined && !state.fired && (feature === undefined || unlocked(content, hero.level, feature))) {
      state = { ...state, armedAt: hero.counters.ticksExplored, armedCount: eventCount(hero, rung.guarantee.event) }
    }
    hero = { ...hero, career: state }
  }

  if (events.length === (result.extraEvents?.length ?? 0) && hero === result.nextHero) return result
  return { ...result, nextHero: hero, metrics, ...(events.length === 0 ? {} : { extraEvents: events }) }
}

/** The line's text: full form with the next goal when it fits the budget, else the compact form the device also uses. */
export function careerLine(outcome: Extract<LogDetail['outcome'], { variant: 'career' }>): { full: string; compact: string } {
  if (outcome.phase === 'unlocked') {
    const full = `Unlocked: ${outcome.title}.`
    return { full, compact: full }
  }
  const compact = `Goal reached: ${outcome.title}.`
  return { full: outcome.next === undefined ? `${compact} That was the last one, for now.` : `${compact} Next: ${outcome.next}.`, compact }
}

function careerEvent(input: SimulationInput, result: SimulationResult, outcome: Extract<LogDetail['outcome'], { variant: 'career' }>): TickEvent {
  const { content } = input
  const { full, compact } = careerLine(outcome)
  const detail: LogDetail = {
    v: 1,
    simulationVersion: input.simulationVersion,
    contentVersion: content.contentVersion,
    disposition: result.disposition,
    potionsUsed: 0,
    levelsGained: 0,
    goldPenalty: 0,
    heldFind: false,
    outcome,
  }
  return { kind: 'career', summary: codePoints(full) <= content.constants.summaryMaxCodePoints ? full : compact, detail, deltas: { xpEarned: 0, gold: outcome.gold, hp: 0 } }
}

/** Cross-field checks on a stored career state under a catalog with a ladder. */
export function careerProblems(state: CareerState, content: ContentCatalog): string | undefined {
  const rungs = content.career?.rungs ?? []
  if (!Number.isSafeInteger(state.rung) || state.rung < 0 || state.rung > rungs.length) return `rung ${state.rung} outside the ladder`
  if (!Number.isSafeInteger(state.startedTick) || state.startedTick < 0) return 'invalid started tick'
  if (state.armedAt !== undefined && (!Number.isSafeInteger(state.armedAt) || state.armedAt < 0)) return 'invalid guarantee mark'
  if (state.fired && state.armedAt !== undefined) return 'a fired guarantee is no longer armed'
  if ((state.armedAt === undefined) !== (state.armedCount === undefined)) return 'an armed guarantee carries its event count'
  if (state.armedCount !== undefined && (!Number.isSafeInteger(state.armedCount) || state.armedCount < 0)) return 'invalid guarantee count'
  if (state.reached.length > rungs.length) return 'more rungs reached than the ladder has'
  const seen = new Set<string>()
  for (const entry of state.reached) {
    if (!rungs.some((rung) => rung.id === entry.id)) return `unknown rung ${entry.id}`
    if (seen.has(entry.id)) return `rung ${entry.id} reached twice`
    seen.add(entry.id)
    if (!Number.isSafeInteger(entry.tick) || entry.tick < 0) return `invalid tick for ${entry.id}`
  }
  return undefined
}

/** For adapters that must agree with the core on whether a raid can happen at all this tick. */
export const canRaid = (content: ContentCatalog, level: number): boolean => content.raids !== undefined && unlocked(content, level, 'raids')
