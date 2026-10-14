import { createRng, pickOne, type Rng } from '@trmnl-games/engine/rng'
import { drawName, offerJob } from './effects'
import { clampStat, healthTargetAt, PaperLivesInvariantError, STATS, stageFor, tiltPercent } from './rules'
import { fill } from './text'
import type { Education, LifeCounters, LifeRecord, LifeState, PaperLivesCatalog, Person, Stats } from './types'

export const zeroCounters = (): LifeCounters => ({
  yearsLived: 0,
  decisionsChosen: 0,
  decisionsDefaulted: 0,
  remarkableEvents: 0,
  jobsHeld: 0,
  marriages: 0,
  childrenRaised: 0,
  grandchildren: 0,
  housesOwned: 0,
  petsKept: 0,
  hobbiesTaken: 0,
  peakMoney: 0,
})

const WEEKDAYS = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday'] as const

/** Two traits, never the same pair as the parent's (paper-lives.md "The life and its starting state"). */
function drawTraits(rng: Rng, content: PaperLivesCatalog, parent?: readonly string[]): readonly [string, string] {
  const ids = content.traits.map((t) => t.id)
  for (;;) {
    const a = rng.int(0, ids.length - 1)
    let b = rng.int(0, ids.length - 2)
    if (b >= a) b += 1
    const pair: [string, string] = [ids[a]!, ids[b]!]
    if (!parent || !(parent.includes(pair[0]) && parent.includes(pair[1]))) return pair
  }
}

/** Around 50, one stat high and one low; a child inherits a fifth of the parent's distance from 50. */
function drawStats(rng: Rng, parent?: Stats): Stats {
  const stats = {} as Record<(typeof STATS)[number], number>
  for (const id of STATS) stats[id] = 50 + rng.int(-8, 8)
  const high = rng.int(0, 3)
  let low = rng.int(0, 2)
  if (low >= high) low += 1
  stats[STATS[high]!] += rng.int(15, 25)
  stats[STATS[low]!] -= rng.int(10, 20)
  for (const id of STATS) stats[id] = Math.max(5, Math.min(95, clampStat(stats[id] + (parent ? Math.round((parent[id] - 50) / 5) : 0))))
  return stats
}

function blank(content: PaperLivesCatalog, first: string, last: string, traits: readonly [string, string], stats: Stats, generation: number): LifeState {
  return {
    first,
    last,
    pronouns: 'they',
    traits,
    generation,
    age: 0,
    stage: 'infant',
    status: 'living',
    stats,
    gold: 0,
    education: 'none',
    tierBonus: 0,
    income: 0,
    jobYears: {},
    retired: false,
    pension: 0,
    home: 'family',
    people: [],
    flags: [],
    seen: [],
    year: { elapsed: 0, quietTicks: 0, ageUpRequested: false, notes: [], lines: 0 },
    nextPersonId: 1,
    counters: zeroCounters(),
    highlights: [],
  }
}

/** A stranger at birth: a new family, generation 1 (paper-lives.md "The life and its starting state"). */
export function starterLife(content: PaperLivesCatalog, birthSeed: number): { life: LifeState; firstLog: string } {
  const rng = createRng(birthSeed)
  const first = pickOne(rng, content.names.first)
  const last = pickOne(rng, content.names.last)
  const traits = drawTraits(rng, content)
  let life = blank(content, first, last, traits, drawStats(rng), 1)
  const people: Person[] = []
  const add = (role: Person['role'], bornAt: number, relationship: number) => {
    const name = drawName(rng, content, { first, people })
    people.push({ id: `p${people.length + 1}`, name, role, bornAt, metAt: 0, relationship, alive: true, history: [] })
  }
  add('parent', -rng.int(24, 38), rng.int(60, 85))
  add('parent', -rng.int(24, 38), rng.int(60, 85))
  if (rng.int(1, 5) <= 2) add('sibling', -rng.int(1, 7), rng.int(50, 75))
  life = { ...life, people, nextPersonId: people.length + 1 }
  const season = (['spring', 'summer', 'autumn', 'winter'] as const)[rng.int(0, 3)]!
  const firstLog = fill(content.lines.firstLog, life.pronouns, { first, last, weekday: pickOne(rng, WEEKDAYS), season, parent: people[0]!.name })
  return { life, firstLog }
}


/**
 * The next life as one of the deceased's children (paper-lives.md "The will, death and the next life"):
 * the surname, their age at the death, the siblings, their own children, what the will left them.
 */
export function beginChild(record: LifeRecord, heirId: string, content: PaperLivesCatalog, birthSeed: number): { life: LifeState; firstLog: string } {
  const heir = record.heirs.find((h) => h.id === heirId && h.role === 'child')
  if (!heir) throw new PaperLivesInvariantError('NOT_AN_HEIR', `no living child ${heirId}`)
  const rng = createRng(birthSeed)
  const age = heir.age
  const traits = drawTraits(rng, content, record.traits)
  const drawn = drawStats(rng, record.finalStats)
  // A grown child starts near the health of their age, give or take the drawn spread.
  const target = healthTargetAt(age, content.tuning.healthDrift, content.tuning.healthTarget, tiltPercent({ traits }, content, 'health'))
  const stats: Stats = { ...drawn, health: age < 6 ? drawn.health : Math.max(10, clampStat(target + (drawn.health - 50) / 2)) }
  let life = blank(content, heir.name, record.last, traits, stats, record.generation + 1)
  const people: Person[] = []
  const push = (name: string, role: Person['role'], bornAt: number, relationship: number, alive = true) => people.push({ id: `p${people.length + 1}`, name, role, bornAt, metAt: Math.max(0, bornAt), relationship, alive, history: [] })
  push(record.first, 'parent', -(record.age - age), heir.relationship, false)
  if (record.partner) push(record.partner.name, 'parent', -(record.partner.age - age), record.partner.relationship)
  for (const sibling of record.heirs.filter((h) => h.role === 'child' && h.id !== heir.id)) push(sibling.name, 'sibling', age - sibling.age, sibling.relationship)
  const own = record.heirs.filter((h) => h.role === 'grandchild' && h.parentId === heir.id)
  for (const child of own) push(child.name, 'child', age - child.age, child.relationship)
  const bequest = record.bequests.find((b) => b.personId === heir.id)
  const house = bequest?.house && record.house !== undefined ? record.house : undefined
  const education: Education = age < 6 ? 'none' : age < 18 ? 'school' : (['degree', 'trade', 'work'] as const)[rng.int(0, 2)]!
  life = {
    ...life,
    age,
    stage: stageFor(age),
    education,
    gold: bequest?.gold ?? 0,
    home: house !== undefined ? 'owned' : age < 18 ? 'family' : 'renting',
    ...(house !== undefined ? { house } : {}),
    people,
    nextPersonId: people.length + 1,
    flags: own.length > 0 ? ['family_open'] : [],
    counters: { ...zeroCounters(), childrenRaised: own.length, housesOwned: house !== undefined ? 1 : 0, peakMoney: Math.max(0, bequest?.gold ?? 0) },
  }
  if (age >= 18 && age < 70) life = offerJob(life, rng, content).life
  if (age >= 70) life = { ...life, retired: true, pension: rng.int(6_000, 12_000) }
  const firstLog = fill(pickOne(rng, content.lines.continues), life.pronouns, { first: life.first, last: life.last, age: String(age), parent: record.first })
  return { life, firstLog }
}
