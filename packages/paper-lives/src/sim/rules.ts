import type { Rng } from '@trmnl-games/engine/rng'
import type { Education, LifeState, MoneyBand, PaperLivesCatalog, Person, Role, Season, Stage, StatId, TraitTilt, When } from './types'

export const STATS: readonly StatId[] = ['health', 'happiness', 'smarts', 'charm']
export const SEASONS: readonly Season[] = ['spring', 'summer', 'autumn', 'winter']

export class PaperLivesInvariantError extends Error {
  constructor(readonly code: string, message: string) {
    super(message)
  }
}

export function stageFor(age: number): Stage {
  if (age < 6) return 'infant'
  if (age < 13) return 'child'
  if (age < 18) return 'teen'
  if (age < 30) return 'young'
  if (age < 60) return 'adult'
  return 'senior'
}

export const clampStat = (value: number) => Math.max(0, Math.min(100, Math.round(value)))

export function moneyBand(gold: number): MoneyBand {
  if (gold < 0) return 'debt'
  if (gold < 5_000) return 'low'
  if (gold < 100_000) return 'comfortable'
  return 'wealthy'
}

/**
 * The season of a tick inside the year (paper-lives.md "Stages"): two ticks each across the minimum,
 * then the year's end (still winter) until it closes.
 */
export function seasonAt(elapsed: number, minYearTicks: number): { season: Season; yearEnd: boolean } {
  if (elapsed > minYearTicks) return { season: 'winter', yearEnd: true }
  const perSeason = minYearTicks / SEASONS.length
  return { season: SEASONS[Math.min(SEASONS.length - 1, Math.floor((Math.max(1, elapsed) - 1) / perSeason))]!, yearEnd: false }
}

export const personAge = (life: Pick<LifeState, 'age'>, person: Pick<Person, 'bornAt'>) => life.age - person.bornAt
export const living = (life: Pick<LifeState, 'people'>, role?: Role) => life.people.filter((p) => p.alive && (role === undefined || p.role === role))
export const partnerOf = (life: Pick<LifeState, 'people'>) => living(life, 'partner')[0]

export function tilts<K extends TraitTilt['kind']>(life: { readonly traits: readonly string[] }, content: PaperLivesCatalog, kind: K): Extract<TraitTilt, { kind: K }>[] {
  const out: Extract<TraitTilt, { kind: K }>[] = []
  for (const id of life.traits) {
    const tilt = content.traits.find((t) => t.id === id)?.tilt
    if (tilt?.kind === kind) out.push(tilt as Extract<TraitTilt, { kind: K }>)
  }
  return out
}

/** Product of the percent tilts of one kind, as a multiplier (100 = no change). */
export function tiltPercent(life: { readonly traits: readonly string[] }, content: PaperLivesCatalog, kind: 'health' | 'cost' | 'income' | 'relationshipDrift' | 'meet'): number {
  return tilts(life, content, kind).reduce((acc, t) => (acc * t.percent) / 100, 100)
}

/** The highest job tier reachable with this education (paper-lives.md "Work and money"). */
export function tierCap(education: Education, tierBonus: number): number {
  const base: Record<Education, number> = { none: 1, school: 1, university: 1, work: 2, trade: 3, degree: 5 }
  return Math.min(5, base[education] + tierBonus)
}

/** Does a condition hold for this life (and, for `person`, is there a living person of that role)? */
export function holds(when: When | undefined, life: LifeState, season?: Season): boolean {
  if (!when) return true
  if (when.minAge !== undefined && life.age < when.minAge) return false
  if (when.maxAge !== undefined && life.age > when.maxAge) return false
  if (when.traits && !when.traits.some((t) => life.traits.includes(t))) return false
  if (when.notTraits && when.notTraits.some((t) => life.traits.includes(t))) return false
  if (when.partner !== undefined) {
    const partner = partnerOf(life)
    if (when.partner === true && !partner) return false
    if (when.partner === false && partner) return false
    if (typeof when.partner === 'string' && partner?.step !== when.partner) return false
  }
  if (when.partnerYears !== undefined && (partnerOf(life)?.stepYears ?? 0) < when.partnerYears) return false
  if (when.job !== undefined && (life.job !== undefined) !== when.job) return false
  if (when.retired !== undefined && life.retired !== when.retired) return false
  if (when.education && !when.education.includes(life.education)) return false
  if (when.parentAlive !== undefined && (living(life, 'parent').length > 0) !== when.parentAlive) return false
  if (when.hasChildren !== undefined && (living(life, 'child').length > 0) !== when.hasChildren) return false
  if (when.hasGrandchildren !== undefined && (living(life, 'grandchild').length > 0) !== when.hasGrandchildren) return false
  if (when.pet !== undefined) {
    if (when.pet === true && !life.pet) return false
    if (when.pet === false && life.pet) return false
    if (Array.isArray(when.pet) && (!life.pet || !when.pet.includes(life.pet.kind))) return false
  }
  if (when.hobby !== undefined) {
    if (when.hobby === true && !life.hobby) return false
    if (when.hobby === false && life.hobby) return false
    if (Array.isArray(when.hobby) && (!life.hobby || !when.hobby.includes(life.hobby))) return false
  }
  if (when.home && !when.home.includes(life.home)) return false
  if (when.money && !when.money.includes(moneyBand(life.gold))) return false
  if (when.minGold !== undefined && life.gold < when.minGold) return false
  if (when.stat) {
    const value = life.stats[when.stat.id]
    if (when.stat.min !== undefined && value < when.stat.min) return false
    if (when.stat.max !== undefined && value > when.stat.max) return false
  }
  if (when.seasons && season !== undefined && !when.seasons.includes(season)) return false
  if (when.flags && !when.flags.every((f) => life.flags.includes(f))) return false
  if (when.notFlags && when.notFlags.some((f) => life.flags.includes(f))) return false
  if (when.person && peopleFor(life, when).length === 0) return false
  if (when.will !== undefined && (life.will !== undefined) !== when.will) return false
  return true
}

/** Living people an event or decision could name. */
export function peopleFor(life: LifeState, when: When): Person[] {
  if (!when.person) return []
  return living(life, when.person).filter((p) => {
    const age = personAge(life, p)
    if (when.personMinAge !== undefined && age < when.personMinAge) return false
    if (when.personMaxAge !== undefined && age > when.personMaxAge) return false
    if (when.personKnownYears !== undefined && life.age - p.metAt < when.personKnownYears) return false
    if (when.personMinRelationship !== undefined && p.relationship < when.personMinRelationship) return false
    return when.personMaxRelationship === undefined || p.relationship <= when.personMaxRelationship
  })
}

/** Draw a person an event or decision names (one draw). */
export function drawPerson(rng: Rng, life: LifeState, when: When): Person | undefined {
  const pool = peopleFor(life, when)
  if (pool.length === 0) return undefined
  return pool[rng.int(0, pool.length - 1)]
}

export function permilleAt(table: readonly (readonly [number, number])[], age: number): number {
  const first = table[0]!
  if (age <= first[0]) return first[1]
  for (let i = 1; i < table.length; i += 1) {
    const [a1, p1] = table[i]!
    const [a0, p0] = table[i - 1]!
    if (age <= a1) return p0 + ((p1 - p0) * (age - a0)) / (a1 - a0)
  }
  return table[table.length - 1]![1]
}

/**
 * A fractional yearly amount as whole points: tenths spread over each decade by age, so -0.6 a year takes
 * one point in six years of every ten. Deterministic, no draw.
 */
export function wholeAt(value: number, percent: number, age: number): number {
  const tenths = Math.round((value * percent) / 10)
  const whole = Math.trunc(tenths / 10)
  const rest = Math.abs(tenths % 10)
  return whole + (age % 10 < rest ? Math.sign(tenths) : 0)
}

/** The health a body drifts toward at this age, with the traits' tilt (100 = no tilt). */
export function healthTargetAt(age: number, healthDrift: readonly (readonly [number, number])[], start: number, percent: number): number {
  let target = start
  for (let a = 0; a < age; a += 1) target += (stepAt(healthDrift, a) * percent) / 100
  return Math.max(0, target)
}

/** Step lookup: the value of the last row whose age is at or below. */
export function stepAt(table: readonly (readonly [number, number])[], age: number): number {
  let value = table[0]![1]
  for (const [from, v] of table) if (age >= from) value = v
  return value
}
