import { pickOne, pickWeighted, type Rng } from '@trmnl-games/engine/rng'
import { clampStat, genderOfPronouns, living, otherGender, partnerOf, PaperLivesInvariantError, stageFor, tierCap } from './rules'
import type { Effects, Glyph, JobDef, LifeCounters, LifeState, LineChanges, PaperLivesCatalog, Person, Role, StatId } from './types'

/** A story line waiting for the boundary's three-line cap (paper-lives.md "The year"). Lower priority writes first. */
export interface Candidate {
  readonly priority: number
  readonly kind: 'event' | 'decision_resolved' | 'check' | 'stage' | 'death'
  readonly glyph: Glyph
  readonly summary: string
  readonly note: string
  readonly remarkable?: boolean
  readonly major?: boolean
  readonly changes?: LineChanges
}

/** The stats and money that moved between two states of a life, for the line that moved them; undefined when none did. */
export function changesOf(before: LifeState, after: LifeState): LineChanges | undefined {
  const stats: Partial<Record<StatId, number>> = {}
  for (const id of Object.keys(before.stats) as StatId[]) if (after.stats[id] !== before.stats[id]) stats[id] = after.stats[id] - before.stats[id]
  const gold = after.gold - before.gold
  const changed = Object.keys(stats).length > 0
  if (!changed && gold === 0) return undefined
  return { ...(changed ? { stats } : {}), ...(gold !== 0 ? { gold } : {}) }
}

export const PRIORITY = { death: 0, decision: 1, family: 2, stage: 3, other: 4 } as const

export function bump(life: LifeState, patch: Partial<Record<keyof LifeCounters, number>>): LifeState {
  const counters = { ...life.counters } as Record<keyof LifeCounters, number>
  for (const [key, add] of Object.entries(patch) as Array<[keyof LifeCounters, number]>) counters[key] += add
  return { ...life, counters }
}

export function withFlag(life: LifeState, flag: string, content: PaperLivesCatalog): LifeState {
  if (life.flags.includes(flag)) return life
  // Bounded: the oldest flag gives way (flags only gate content, so losing the oldest is harmless).
  const flags = [...life.flags, flag]
  return { ...life, flags: flags.length > content.tuning.maxFlags ? flags.slice(flags.length - content.tuning.maxFlags) : flags }
}

export function addHistory(person: Person, line: string): Person {
  const history = [...person.history, line]
  return { ...person, history: history.length > 4 ? history.slice(history.length - 4) : history }
}

export function updatePerson(life: LifeState, id: string, update: (p: Person) => Person): LifeState {
  return { ...life, people: life.people.map((p) => (p.id === id ? update(p) : p)) }
}

/** Draw a first name nobody in the life already has, from the names for that gender when one is given. One draw. */
export function drawName(rng: Rng, content: PaperLivesCatalog, life: Pick<LifeState, 'people' | 'first'>, gender?: 'female' | 'male'): string {
  const names = (gender === 'female' ? content.names.female : gender === 'male' ? content.names.male : undefined) ?? content.names.first
  const taken = new Set([life.first, ...life.people.map((p) => p.name)])
  const pool = names.filter((n) => !taken.has(n))
  return pickOne(rng, pool.length > 0 ? pool : names)
}

/**
 * Content v5: the gender of someone new. A partner is of the other sex to the character; anyone else is drawn, one
 * draw. Earlier catalogs draw nothing here, so their replays do not change.
 */
export function newPersonGender(life: Pick<LifeState, 'pronouns'>, role: Role, rng: Rng, content: PaperLivesCatalog): 'female' | 'male' | undefined {
  if (!content.tuning.gendered) return undefined
  const own = genderOfPronouns(life.pronouns)
  if (role === 'partner' && own) return otherGender(own)
  return rng.int(0, 1) === 0 ? 'female' : 'male'
}

/**
 * Add a person, or fold them into an existing friend or colleague when the life is full
 * (paper-lives.md "People and the pet"). Returns the person who ends up in the story.
 */
export function addPerson(life: LifeState, role: Role, bornAt: number, relationship: number, rng: Rng, content: PaperLivesCatalog, extra: Partial<Person> = {}): { life: LifeState; person: Person } {
  const gender = newPersonGender(life, role, rng, content)
  const name = drawName(rng, content, life, gender)
  if (life.people.length >= content.tuning.maxPeople) {
    // Fold: the line still reads with the new name nowhere stored; an existing friend takes the warmth.
    const fold = living(life, 'friend')[0] ?? living(life, 'colleague')[0]
    if (fold && role !== 'partner' && role !== 'child' && role !== 'grandchild') {
      const warmed = { ...fold, relationship: Math.min(100, fold.relationship + 5) }
      return { life: updatePerson(life, fold.id, () => warmed), person: { ...warmed, name } }
    }
    // Partners, children and grandchildren always fit: the oldest dead friend or colleague leaves the list.
    const leaving = life.people.find((p) => !p.alive && (p.role === 'friend' || p.role === 'colleague')) ?? life.people.find((p) => p.role === 'friend' || p.role === 'colleague' || p.role === 'former_partner')
    if (leaving) life = { ...life, people: life.people.filter((p) => p.id !== leaving.id) }
  }
  const person: Person = { id: `p${life.nextPersonId}`, name, role, bornAt, metAt: life.age, relationship, alive: true, history: [], ...(gender ? { gender } : {}), ...extra }
  return { life: { ...life, people: [...life.people, person], nextPersonId: life.nextPersonId + 1 }, person }
}

/** Jobs this life could be offered now (paper-lives.md "Work and money"). */
export function eligibleJobs(life: LifeState, content: PaperLivesCatalog): JobDef[] {
  const cap = tierCap(life.education, life.tierBonus)
  const stage = stageFor(life.age)
  return content.jobs.filter((job) => {
    if (job.id === life.job || job.tier > cap || !job.stages.includes(stage)) return false
    // Content v3: some jobs need a particular training (a nurse a degree, an electrician a trade).
    if (job.needs && !job.needs.includes(life.education)) return false
    if (!job.floor) return true
    const floor = job.floor.min - (job.easedBy && life.traits.includes(job.easedBy) ? 15 : 0)
    return life.stats[job.floor.stat] >= floor
  })
}

/** A job offer: the best tiers in reach are likelier. Two draws; none when nothing fits. */
export function offerJob(life: LifeState, rng: Rng, content: PaperLivesCatalog): { life: LifeState; job?: JobDef; line?: string } {
  const pool = eligibleJobs(life, content)
  if (pool.length === 0) return { life }
  const job = pickWeighted(rng, pool.map((j) => [j, j.tier * j.tier] as const))
  const income = rng.int(job.income[0], job.income[1])
  const first = life.counters.jobsHeld === 0 || !(job.id in life.jobYears)
  let next: LifeState = { ...life, job: job.id, jobSince: life.age, income, jobYears: { ...life.jobYears, [job.id]: life.jobYears[job.id] ?? 0 } }
  if (first) next = bump(next, { jobsHeld: 1 })
  return { life: next, job, line: pickOne(rng, job.startLines) }
}

export function retire(life: LifeState, content: PaperLivesCatalog): LifeState {
  const { job: _job, jobSince: _since, ...rest } = life
  return { ...rest, retired: true, pension: Math.floor(life.income / content.tuning.pensionDivisor), income: 0 }
}

export interface ApplyContext {
  readonly content: PaperLivesCatalog
  readonly rng: Rng
  readonly person?: Person
}

/**
 * Apply authored effects (paper-lives.md "Decisions"). Clamped to what the character has: a house
 * needs the money, a child needs a partner or the adoption flag, a pet needs an empty slot.
 * Returns extra story lines the effects wrote (a job started) and the values for the line's slots.
 */
export function applyEffects(life: LifeState, effects: Effects | undefined, ctx: ApplyContext): { life: LifeState; extra: Candidate[]; slots: Record<string, string> } {
  const extra: Candidate[] = []
  const slots: Record<string, string> = {}
  if (!effects) return { life, extra, slots }
  const { content, rng } = ctx
  if (effects.stats) {
    const stats = { ...life.stats }
    for (const [id, delta] of Object.entries(effects.stats) as Array<[keyof typeof stats, number]>) stats[id] = clampStat(stats[id] + delta)
    life = { ...life, stats }
  }
  if (effects.gold) life = { ...life, gold: Math.max(content.tuning.debtFloor, life.gold + effects.gold) }
  if (effects.relationship && ctx.person) {
    const delta = effects.relationship
    life = updatePerson(life, ctx.person.id, (p) => ({ ...p, relationship: clampStat(p.relationship + delta) }))
  }
  if (effects.roleRelationship) {
    const { role, delta } = effects.roleRelationship
    life = { ...life, people: life.people.map((p) => (p.alive && p.role === role ? { ...p, relationship: clampStat(p.relationship + delta) } : p)) }
  }
  if (effects.partner) {
    const partner = partnerOf(life)
    if (partner) {
      if (effects.partner === 'separate') {
        life = updatePerson(life, partner.id, (p) => {
          const { step: _s, stepYears: _y, ...rest } = p
          return { ...rest, role: 'former_partner', relationship: Math.min(p.relationship, 40) }
        })
      } else {
        if (effects.partner === 'married' && partner.step !== 'married') life = bump(life, { marriages: 1 })
        life = updatePerson(life, partner.id, (p) => ({ ...p, step: effects.partner as NonNullable<Person['step']>, stepYears: 0 }))
      }
      slots.person = partner.name
    }
  }
  if (effects.addPerson) {
    const role = effects.addPerson
    if (role === 'partner') {
      if (!partnerOf(life)) {
        const added = addPerson(life, 'partner', rng.int(-4, 4), rng.int(55, 75), rng, content, { step: 'dating', stepYears: 0 })
        life = added.life
        slots.person = added.person.name
      }
    } else if (role === 'child') {
      if (living(life, 'child').length < content.tuning.maxChildren) {
        const added = addPerson(life, 'child', life.age, rng.int(70, 90), rng, content)
        life = bump(added.life, { childrenRaised: 1 })
        slots.person = added.person.name
      }
    } else {
      const added = addPerson(life, role, rng.int(-6, 6), rng.int(50, 70), rng, content)
      life = added.life
      slots.person = added.person.name
    }
  }
  if (effects.education) life = { ...life, education: effects.education }
  if (effects.tierBonus) life = { ...life, tierBonus: life.tierBonus + effects.tierBonus }
  if (effects.job === 'lose' && life.job !== undefined) {
    const { job: _j, jobSince: _s, ...rest } = life
    life = { ...rest, income: 0 }
  } else if (effects.job === 'promote' && life.job !== undefined) {
    life = { ...life, income: Math.round((life.income * 6) / 5) }
  } else if (effects.job === 'retire' && life.job !== undefined) {
    life = retire(life, content)
  } else if (effects.job === 'offer' || effects.job === 'change') {
    const offered = offerJob(life, rng, content)
    life = offered.life
    if (offered.job && offered.line) {
      slots.job = offered.job.name.toLowerCase()
      extra.push({ priority: PRIORITY.other, kind: 'check', glyph: 'work', summary: offered.line, note: 'a new job' })
    }
  }
  if (effects.house !== undefined) {
    const house = content.houses.find((h) => h.band === effects.house)
    if (!house) throw new PaperLivesInvariantError('UNKNOWN_HOUSE', `unknown house band ${effects.house}`)
    const sale = life.home === 'owned' && life.house !== undefined ? (content.houses.find((h) => h.band === life.house)?.price ?? 0) : 0
    if (life.gold + sale >= house.price && life.house !== house.band) {
      life = bump({ ...life, gold: life.gold + sale - house.price, home: 'owned', house: house.band }, { housesOwned: 1 })
      slots.house = house.name
    }
  }
  if (effects.downsize && life.home === 'owned' && life.house !== undefined && life.house > 1) {
    const from = content.houses.find((h) => h.band === life.house)!
    const to = content.houses.find((h) => h.band === 1)!
    life = { ...life, gold: life.gold + from.price - to.price, house: 1 }
    slots.house = to.name
  }
  if (effects.home) life = { ...life, home: effects.home }
  if (effects.hobby === 'drop') {
    const { hobby: _h, ...rest } = life
    life = rest
  } else if (effects.hobby) {
    const hobby = content.hobbies.find((h) => h.id === effects.hobby)
    if (!hobby) throw new PaperLivesInvariantError('UNKNOWN_HOBBY', `unknown hobby ${effects.hobby}`)
    if (life.hobby !== hobby.id) life = bump({ ...life, hobby: hobby.id, hobbiesHad: [...new Set([...(life.hobbiesHad ?? []), hobby.id])] }, { hobbiesTaken: 1 })
    slots.hobby = hobby.noun
  }
  if (effects.pet === 'lose') {
    if (life.pet) {
      slots.pet = life.pet.name
      const { pet: _p, ...rest } = life
      life = { ...rest, petLostAt: life.age }
    }
  } else if (effects.pet && !life.pet) {
    const kind = content.pets.find((p) => p.id === effects.pet)
    if (!kind) throw new PaperLivesInvariantError('UNKNOWN_PET', `unknown pet ${effects.pet}`)
    const name = pickOne(rng, content.names.pets)
    life = bump({ ...life, pet: { kind: kind.id, name, bornAt: life.age, lifespan: rng.int(kind.lifespan[0], kind.lifespan[1]), relationship: 70 } }, { petsKept: 1 })
    slots.pet = name
    slots.petKind = kind.name.toLowerCase()
  }
  if (effects.flag) life = withFlag(life, effects.flag, content)
  if (effects.will) life = { ...life, will: effects.will }
  if (effects.ailment) life = { ...life, ailment: effects.ailment }
  return { life, extra, slots }
}
