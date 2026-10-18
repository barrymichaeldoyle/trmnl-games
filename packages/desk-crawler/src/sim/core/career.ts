import { codePoints } from './narrative'
import { potionCap } from './pouch'
import type { CareerPredicate, CareerRule, CareerRung, CareerState, ContentCatalog, GuaranteedEvent, HeroState, LogDetail, SimulationInput, SimulationResult, StanceId, TickEvent, UnlockableFeature } from './types'

/**
 * The career ladder and feature unlocks (P35). Applied after the tick's own story and the to-do list, from state
 * only: no draw, so the encounter and every other line are exactly what the same catalog without a ladder produces,
 * plus the rung's gold. Unlocks are level milestones read by the simulator before each gated draw; the lines that
 * announce them are written here, once, on the tick the hero crosses the level.
 */

export const FEATURES: readonly UnlockableFeature[] = ['todo', 'meetings', 'workbench', 'stances', 'choices', 'merchant', 'raids', 'roster']

/** How each feature reads on the device and in the companion. */
export const FEATURE_LABEL: Readonly<Record<UnlockableFeature, string>> = {
  todo: 'the to-do list',
  stances: 'stances',
  choices: 'office decisions',
  merchant: 'the wandering merchant',
  raids: 'desk raids',
  meetings: 'meetings with coworkers',
  workbench: 'the workbench',
  roster: 'a second hero',
}

/** The level a feature opens at, or undefined when the catalog never opens it (the roster before P37). */
export function unlockLevel(content: ContentCatalog, feature: UnlockableFeature): number | undefined {
  if (feature === 'roster') return content.classes === undefined ? undefined : content.unlocks?.roster
  return content.unlocks?.[feature]
}

/**
 * Whether a hero at `level` has this feature under the catalog; a catalog without unlocks has everything on except
 * the roster, which needs classes. The roster reads the account's Warrior's level (P37), so callers pass that.
 */
export function unlocked(content: ContentCatalog, level: number, feature: UnlockableFeature): boolean {
  if (feature !== 'roster' && content.unlocks === undefined) return true
  // D155: catalogs before the workbench unlock had salvage and the workbench open from level 1.
  if (feature === 'workbench' && content.unlocks?.workbench === undefined) return true
  const at = unlockLevel(content, feature)
  return at !== undefined && level >= at
}

/**
 * The companion Career page's "What opens when" list: each gated feature at its resolved catalog level, lowest first.
 * Ties keep FEATURES order. Null when the catalog has no unlocks. The roster is reported separately (P37).
 */
export function unlocksView(content: ContentCatalog, level: number) {
  if (content.unlocks === undefined) return null
  return FEATURES.filter((feature): feature is Exclude<UnlockableFeature, 'roster'> => feature !== 'roster' && unlockLevel(content, feature) !== undefined)
    .map((feature) => ({ feature, label: FEATURE_LABEL[feature], level: unlockLevel(content, feature)!, unlocked: unlocked(content, level, feature) }))
    .sort((a, b) => a.level - b.level)
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
    case 'stance':
      return { value: (effectiveStance(content, hero) ?? 'balanced') === predicate.stance ? 1 : 0, target: 1 }
    case 'stanceChosen':
      return { value: effectiveStance(content, hero) === undefined ? 0 : 1, target: 1 }
  }
}

export const rungSatisfied = (rung: CareerRung, hero: HeroState, content: ContentCatalog): boolean => {
  const { value, target } = measureRung(rung.predicate, hero, content)
  return value >= target
}

/** The first rung at or after `from` the hero has not satisfied; the ladder's length when none is left. */
export function firstOpenRung(rules: CareerRule, hero: HeroState, content: ContentCatalog, from = 0): number {
  for (let i = from; i < rules.rungs.length; i += 1) if (!rules.rungs[i]!.retired && !rungSatisfied(rules.rungs[i]!, hero, content)) return i
  return rules.rungs.length
}

/** The first rung at or after `from` that is not retired; the ladder's length when none is left. */
export function liveRung(rules: CareerRule, from: number): number {
  let i = from
  while (rules.rungs[i]?.retired) i += 1
  return i
}

/**
 * Where a stored pointer lands when the world switches ladders (D135): on the same rung by id, so inserting rungs
 * mid-ladder moves nobody past what it has done. A pointer on a rung the new ladder lacks moves on to the next old
 * rung it has; one past the old ladder's end stays past the new one's. With `open` (the hero has not met this rung),
 * rungs the new ladder inserts right before the pointer's rung come first when the hero has not met them: a level-6
 * hero waiting on the raid goal meets "Reach level 7" first, while one already level 7 and Bold keeps the raid goal.
 * D155: a rung the new ladder moves from ahead of the pointer to before it is still ahead for this hero, so an unmet
 * one comes first too, wherever it now sits: moving "Salvage a piece of gear" up the ladder skips nobody past it.
 */
export function remapRung(from: CareerRule, to: CareerRule, rung: number, open?: (rung: CareerRung) => boolean): number {
  for (let i = rung; i < from.rungs.length; i += 1) {
    const index = to.rungs.findIndex((entry) => entry.id === from.rungs[i]!.id)
    if (index < 0) continue
    if (open === undefined || i !== rung) return index
    let start = index
    while (start > 0 && !from.rungs.some((entry) => entry.id === to.rungs[start - 1]!.id)) start -= 1
    const movedBack = (id: string) => from.rungs.findIndex((entry) => entry.id === id) > rung
    for (let j = 0; j < index; j += 1) if ((j >= start || movedBack(to.rungs[j]!.id)) && !to.rungs[j]!.retired && open(to.rungs[j]!)) return j
    return index
  }
  return to.rungs.length
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
  const rules = content.career
  return hero.career === undefined || rules === undefined ? undefined : rules.rungs[liveRung(rules, hero.career.rung)]
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
 * holds sets its gold aside as an unclaimed reward (D129: the companion's Claim button pays it, so the moment is the
 * player's and the ladder still moves without a visit), logs a goal line, and the pointer moves to the next rung,
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
      const level = unlockLevel(content, feature)
      // P37: the roster opens on the Warrior's level, so only a Warrior announces it.
      if (level === undefined || (feature === 'roster' && hero.class !== 'warrior')) continue
      if (before.level < level && hero.level >= level) {
        metrics.unlocks += 1
        events.push(careerEvent(input, result, { variant: 'career', phase: 'unlocked', id: feature, title: FEATURE_LABEL[feature], gold: 0 }))
      }
    }
  }

  if (rules !== undefined && rules.rungs.length > 0) {
    // A hero with no place yet joins at the first rung it had not satisfied when the tick began, then this tick can pay it.
    if (hero.career === undefined) hero = { ...hero, career: { rung: firstOpenRung(rules, before, content), startedTick: tick, reached: [] } }
    const settled = reachSatisfiedRung(hero, content, tick, input.tickAt)
    hero = settled.hero
    if (settled.reached) {
      metrics.careerRungs = 1
      const { id, title, next, gold } = settled.reached
      events.push(careerEvent(input, result, { variant: 'career', phase: 'reached', id, title, ...(next === undefined ? {} : { next }), gold }))
    }
    let state: CareerState = hero.career ?? { rung: firstOpenRung(rules, before, content), startedTick: tick, reached: [] }
    if (liveRung(rules, state.rung) !== state.rung) state = { rung: liveRung(rules, state.rung), startedTick: state.startedTick, reached: state.reached, ...(state.unclaimed === undefined ? {} : { unclaimed: state.unclaimed }) }
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

export interface ReachedRung {
  readonly id: string
  readonly title: string
  readonly next?: string
  readonly gold: number
}

/**
 * Mark the current rung done when the hero has already satisfied it. One rung per call, the same step a tick takes,
 * so a companion action and the next adventure cannot both pay it. A hero with no place on the ladder is left alone:
 * the tick's first evaluation backfills that place without pay. A pointer sitting on a rung a later catalog retired
 * moves past it with no gold and no line.
 */
export function reachSatisfiedRung(hero: HeroState, content: ContentCatalog, tick: number, at?: number): { hero: HeroState; reached?: ReachedRung } {
  const rules = content.career
  if (rules === undefined || rules.rungs.length === 0 || hero.career === undefined) return { hero }
  let state = hero.career
  const live = liveRung(rules, state.rung)
  if (live !== state.rung) {
    state = { rung: live, startedTick: state.startedTick, reached: state.reached, ...(state.unclaimed === undefined ? {} : { unclaimed: state.unclaimed }) }
    hero = { ...hero, career: state }
  }
  const current = rules.rungs[state.rung]
  if (current === undefined || !rungSatisfied(current, hero, content)) return { hero }
  const gold = current.supersedes !== undefined && state.reached.some((entry) => entry.id === current.supersedes) ? 0 : current.gold
  const next = liveRung(rules, state.rung + 1)
  const when = at === undefined ? {} : { at }
  const following = rules.rungs[next]
  return {
    hero: {
      ...hero,
      counters: { ...hero.counters, careerRungs: hero.counters.careerRungs + 1 },
      career: {
        rung: next,
        startedTick: tick,
        reached: [...state.reached, { id: current.id, tick, ...when }],
        unclaimed: [...(state.unclaimed ?? []), ...(gold > 0 ? [{ id: current.id, gold, tick, ...when }] : [])],
      },
    },
    reached: { id: current.id, title: current.title, ...(following === undefined ? {} : { next: following.title }), gold },
  }
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
  // D129: the gold is set aside, not paid, so the line's deltas carry none; the outcome keeps the amount to claim.
  return { kind: 'career', summary: codePoints(full) <= content.constants.summaryMaxCodePoints ? full : compact, detail, deltas: { xpEarned: 0, gold: 0, hp: 0 } }
}

export type ClaimRefusal = 'NO_LADDER' | 'NOTHING_TO_CLAIM'

/**
 * The claim intent (D129): pay one waiting reward, oldest first unless a rung is named. Pure, so the intent and its
 * tests share it; the adapter adds the gold to the hero and logs the command line.
 */
export function claimReward(hero: HeroState, content: ContentCatalog, rungId?: string): { career: CareerState; reward: { id: string; title: string; gold: number } } | { refusal: ClaimRefusal } {
  const state = hero.career
  if (content.career === undefined || state === undefined) return { refusal: 'NO_LADDER' }
  const waiting = state.unclaimed ?? []
  const reward = rungId === undefined ? waiting[0] : waiting.find((entry) => entry.id === rungId)
  if (reward === undefined) return { refusal: 'NOTHING_TO_CLAIM' }
  const rest = waiting.filter((entry) => entry !== reward)
  const { unclaimed: _u, ...without } = state
  const title = content.career.rungs.find((rung) => rung.id === reward.id)?.title ?? reward.id
  return { career: rest.length === 0 ? without : { ...without, unclaimed: rest }, reward: { id: reward.id, title, gold: reward.gold } }
}

/** Cross-field checks on a stored career state under a catalog with a ladder. */
export function careerProblems(state: CareerState, content: ContentCatalog): string | undefined {
  const rungs = content.career?.rungs ?? []
  if (!Number.isSafeInteger(state.rung) || state.rung < 0 || state.rung > rungs.length) return `rung ${state.rung} outside the ladder`
  if (!Number.isSafeInteger(state.startedTick) || state.startedTick < 0) return 'invalid started tick'
  if (state.armedAt !== undefined && (!Number.isSafeInteger(state.armedAt) || state.armedAt < 0)) return 'invalid guarantee mark'
  if (state.fired && state.armedAt !== undefined) return 'a fired guarantee is no longer armed'
  if ((state.armedAt === undefined) !== (state.armedCount === undefined)) return 'an armed guarantee carries its event count'
  const pending = new Set<string>()
  for (const reward of state.unclaimed ?? []) {
    if (!rungs.some((rung) => rung.id === reward.id)) return `unknown unclaimed rung ${reward.id}`
    if (pending.has(reward.id)) return `rung ${reward.id} unclaimed twice`
    pending.add(reward.id)
    if (!Number.isSafeInteger(reward.gold) || reward.gold < 0 || !Number.isSafeInteger(reward.tick) || reward.tick < 0) return `invalid unclaimed reward for ${reward.id}`
  }
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

/** D141: whether a hero at `level` can start or be picked for a meeting. */
export const canMeet = (content: ContentCatalog, level: number): boolean => content.meetings !== undefined && unlocked(content, level, 'meetings')
