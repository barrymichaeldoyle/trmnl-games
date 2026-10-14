import { createRng, pickOne, pickWeighted, type Rng } from '@trmnl-games/engine/rng'
import { endLife } from './death'
import { addHistory, addPerson, applyEffects, bump, offerJob, PRIORITY, retire, updatePerson, type Candidate } from './effects'
import { clampStat, drawPerson, healthTargetAt, holds, living, moneyBand, PaperLivesInvariantError, partnerOf, permilleAt, personAge, seasonAt, stageFor, tiltPercent, tilts } from './rules'
import { fill } from './text'
import type { DecisionDef, EventDef, LifeEvent, LifeState, OptionDef, PaperLivesCatalog, PendingDecision, Person, Rarity, Season, StatId, StreamName, TickInput, TickResult } from './types'

/**
 * The Paper Lives pure core (paper-lives.md "The year"). One evaluation per living tick:
 * an infant year per tick; otherwise a passive tick (an event or a quiet tick) or, at the
 * minimum with an age-up intent or at the close, the boundary: the decision resolves, the
 * year's drift and checks apply, mortality draws, and the next year opens.
 *
 * Pure: no clock, no network, no storage; the adapter passes the stream seeds in.
 * Draw order is part of the simulation version: `event` draws the chance then the pick;
 * `people` draws persons, names and every family check in a fixed order; `decision`
 * draws the year's chance then the pick; `mortality` draws the death check then the cause;
 * `narrative` picks ambient lines, line variants, the recap and the epitaph.
 */
export const SIMULATION_VERSION = 1

/** At most this many story lines on a boundary tick, plus the recap (paper-lives.md "The year"). */
export const BOUNDARY_LINES = 3
/** Recap names at most this many things that happened. */
const RECAP_NOTES = 2
const HIGHLIGHTS = 16

type Rngs = Readonly<Record<StreamName, Rng>>

function rngsFor(input: TickInput): Rngs {
  const s = input.streams
  return { birth: createRng(s.birth), event: createRng(s.event), decision: createRng(s.decision), people: createRng(s.people), mortality: createRng(s.mortality), narrative: createRng(s.narrative) }
}

export const stagesOf = (def: { stage: EventDef['stage'] }) => (typeof def.stage === 'string' ? [def.stage] : def.stage)

export function decisionOf(content: PaperLivesCatalog, id: string): DecisionDef {
  const def = content.decisions.find((d) => d.id === id)
  if (!def) throw new PaperLivesInvariantError('UNKNOWN_DECISION', `unknown decision ${id}`)
  return def
}

export function optionOf(def: DecisionDef, id: string): OptionDef {
  const option = def.options.find((o) => o.id === id)
  if (!option) throw new PaperLivesInvariantError('UNKNOWN_OPTION', `unknown option ${id} on ${def.id}`)
  return option
}

/** Slot values for a line about this life. */
export function slotsFor(life: LifeState, content: PaperLivesCatalog, extra: Record<string, string> = {}, season?: Season): Record<string, string> {
  const job = life.job ? content.jobs.find((j) => j.id === life.job) : undefined
  const hobby = life.hobby ? content.hobbies.find((h) => h.id === life.hobby) : undefined
  const parent = living(life, 'parent')[0] ?? life.people.find((p) => p.role === 'parent')
  const house = life.house !== undefined ? content.houses.find((h) => h.band === life.house) : undefined
  return {
    first: life.first,
    last: life.last,
    age: String(life.age),
    ...(season ? { season } : {}),
    ...(job ? { job: job.name.toLowerCase() } : {}),
    ...(hobby ? { hobby: hobby.noun } : {}),
    ...(life.pet ? { pet: life.pet.name, petKind: content.pets.find((p) => p.id === life.pet!.kind)?.name.toLowerCase() ?? life.pet.kind } : {}),
    ...(parent ? { parent: parent.name } : {}),
    ...(house ? { house: house.name } : {}),
    ...extra,
  }
}

const line = (life: LifeState, text: string, content: PaperLivesCatalog, extra?: Record<string, string>, season?: Season) => fill(text, life.pronouns, slotsFor(life, content, extra, season))

function highlight(life: LifeState, summary: string): LifeState {
  const highlights = [...life.highlights, `${life.age}: ${summary}`]
  return { ...life, highlights: highlights.length > HIGHLIGHTS ? highlights.slice(highlights.length - HIGHLIGHTS) : highlights }
}

/**
 * Rarity is per draw, not per row (paper-lives.md "The year", step 2): one draw picks the tier from the
 * tiers present, weighted per thousand, and one more picks inside it (by `weight`, default 1).
 */
export function pickByRarity<T extends { readonly rarity: Rarity; readonly weight?: number }>(rng: Rng, pool: readonly T[], weights: Readonly<Record<Rarity, number>>, weightOf: (item: T) => number = (item) => (item.weight ?? 1) * 100): T {
  const tiers = (['common', 'uncommon', 'rare', 'remarkable'] as const).filter((r) => pool.some((p) => p.rarity === r))
  const tier = pickWeighted(rng, tiers.map((r) => [r, weights[r]] as const))
  return pickWeighted(rng, pool.filter((p) => p.rarity === tier).map((p) => [p, Math.max(1, weightOf(p))] as const))
}

/** A meeting event (one that adds a partner) is less likely for a trait that tilts meeting people. */
function eventWeight(life: LifeState, content: PaperLivesCatalog): (event: EventDef) => number {
  const meet = tiltPercent(life, content, 'meet')
  return (event) => (event.weight ?? 1) * (event.effects?.addPerson === 'partner' ? meet : 100)
}

const markSeen = (life: LifeState, id: string): LifeState => (life.seen.includes(id) ? life : { ...life, seen: [...life.seen, id] })

/** Events that could happen now. Seen events are skipped until the stage's pool runs dry. */
export function eligibleEvents(life: LifeState, content: PaperLivesCatalog, season: Season | undefined): EventDef[] {
  const fits = content.events.filter((e) => stagesOf(e).includes(life.stage) && holds(e.when, life, season))
  const fresh = fits.filter((e) => !life.seen.includes(e.id))
  return fresh.length > 0 ? fresh : fits
}

/** Decisions that could open this year; `forced` ones first. */
export function eligibleDecisions(life: LifeState, content: PaperLivesCatalog): { forced: DecisionDef[]; drawn: DecisionDef[] } {
  const fits = content.decisions.filter((d) => !d.eventOnly && stagesOf(d).includes(life.stage) && holds(d.when, life) && (d.recurring === true || !life.seen.includes(d.id)))
  return { forced: fits.filter((d) => d.forced), drawn: fits.filter((d) => !d.forced) }
}

/** Is an option open to this life? Gated options are shown greyed with the reason. */
export function optionOpen(life: LifeState, option: OptionDef): boolean {
  return holds(option.gate, life)
}

function offer(life: LifeState, def: DecisionDef, rngs: Rngs): { life: LifeState; pending: PendingDecision } {
  const person = def.when?.person ? drawPerson(rngs.people, life, def.when) : undefined
  return { life: markSeen(life, def.id), pending: { decisionId: def.id, ...(person ? { personId: person.id } : {}) } }
}

function offeredEvent(life: LifeState, def: DecisionDef, pending: PendingDecision, content: PaperLivesCatalog): LifeEvent {
  const person = pending.personId ? life.people.find((p) => p.id === pending.personId) : undefined
  return { kind: 'decision_offered', glyph: def.glyph, age: life.age, summary: line(life, def.prompt, content, person ? { person: person.name } : {}), ...(def.major ? { major: true } : {}) }
}

export function simulateLife(input: TickInput): TickResult {
  const { content } = input
  const life = input.life
  if (life.status !== 'living') return { life, events: [], disposition: 'idle' }
  const rngs = rngsFor(input)
  if (life.stage === 'infant') return infantYear(life, content, rngs)
  const elapsed = life.year.elapsed + 1
  const t = content.tuning
  const boundary = (life.year.ageUpRequested && elapsed >= t.minYearTicks) || elapsed >= t.closeYearTicks
  if (!boundary) return passiveTick({ ...life, year: { ...life.year, elapsed } }, content, rngs)
  return yearBoundary({ ...life, year: { ...life.year, elapsed } }, content, rngs)
}

function passiveTick(life: LifeState, content: PaperLivesCatalog, rngs: Rngs): TickResult {
  const t = content.tuning
  const { season, yearEnd } = seasonAt(life.year.elapsed, t.minYearTicks)
  const stage = life.stage as Exclude<typeof life.stage, 'infant'>
  const percent = yearEnd ? t.yearEndEventPercent : t.eventPercent[stage]
  if (rngs.event.int(1, 100) <= percent) {
    const pool = eligibleEvents(life, content, yearEnd ? undefined : season)
    if (pool.length > 0) {
      const event = pickByRarity(rngs.event, pool, content.rarityWeights, eventWeight(life, content))
      return happen(life, event, content, rngs, season)
    }
  }
  const quietTicks = life.year.quietTicks + 1
  life = { ...life, year: { ...life.year, quietTicks: quietTicks % t.ambientEvery } }
  if (quietTicks % t.ambientEvery !== 0) return { life, events: [], disposition: 'year' }
  const pool = content.ambient.filter((a) => a.stage === life.stage && (yearEnd ? a.yearEnd === true : a.yearEnd !== true && (a.season === undefined || a.season === season)) && (a.trait === undefined || life.traits.includes(a.trait)))
  if (pool.length === 0) return { life, events: [], disposition: 'year' }
  const ambient = pickOne(rngs.narrative, pool)
  return { life, events: [{ kind: 'ambient', glyph: 'none', age: life.age, summary: line(life, ambient.line, content, {}, season) }], disposition: 'year' }
}

/** A passive event: effects, one line, perhaps the year's decision. */
function happen(life: LifeState, event: EventDef, content: PaperLivesCatalog, rngs: Rngs, season: Season): TickResult {
  const person = event.when?.person ? drawPerson(rngs.people, life, event.when) : undefined
  const applied = applyEffects(life, event.effects, { content, rng: rngs.people, ...(person ? { person } : {}) })
  life = markSeen(applied.life, event.id)
  const summary = line(life, event.line, content, { ...(person ? { person: person.name } : {}), ...applied.slots }, season)
  if (person) life = updatePerson(life, person.id, (p) => addHistory(p, `${life.age}: ${summary}`))
  const remarkable = event.rarity === 'remarkable'
  if (remarkable) life = highlight(bump(life, { remarkableEvents: 1 }), summary)
  const note = line(life, event.note, content, { ...(person ? { person: person.name } : {}), ...applied.slots })
  life = { ...life, year: { ...life.year, quietTicks: 0, lines: life.year.lines + 1, notes: [...life.year.notes, note, ...applied.extra.map((c) => c.note)] } }
  const events: LifeEvent[] = [{ kind: 'event', glyph: event.glyph, age: life.age, summary, ...(remarkable ? { remarkable: true } : {}) }]
  if (event.opens && !life.year.pending) {
    const def = decisionOf(content, event.opens)
    if (holds(def.when, life)) {
      const offered = offer(life, def, rngs)
      life = { ...offered.life, year: { ...offered.life.year, pending: offered.pending } }
      events.push(offeredEvent(life, def, offered.pending, content))
    }
  }
  return { life, events, disposition: 'year' }
}

function infantYear(life: LifeState, content: PaperLivesCatalog, rngs: Rngs): TickResult {
  const events: LifeEvent[] = []
  if (life.age === 0) {
    const top = (Object.entries(life.stats) as Array<[StatId, number]>).reduce((a, b) => (b[1] > a[1] ? b : a))[0]
    events.push({ kind: 'infant', glyph: 'pram', age: 0, summary: line(life, pickOne(rngs.narrative, content.lines.born[top]), content) })
  } else if (life.age <= life.traits.length) {
    const trait = content.traits.find((t) => t.id === life.traits[life.age - 1])
    if (trait) events.push({ kind: 'infant', glyph: 'star', age: life.age, summary: line(life, trait.reveal, content) })
  }
  const pool = eligibleEvents(life, content, undefined)
  if (pool.length > 0 && events.length < 2) {
    const event = pickByRarity(rngs.event, pool, content.rarityWeights)
    const person = event.when?.person ? drawPerson(rngs.people, life, event.when) : undefined
    const applied = applyEffects(life, event.effects, { content, rng: rngs.people, ...(person ? { person } : {}) })
    life = markSeen(applied.life, event.id)
    events.push({ kind: 'infant', glyph: event.glyph, age: life.age, summary: line(life, event.line, content, { ...(person ? { person: person.name } : {}), ...applied.slots }) })
  }
  return newYear(life, content, rngs, events, [])
}

/** Happiness target: the relationship average, moved by money and traits (paper-lives.md "The year", step 5). */
function happinessTarget(life: LifeState, content: PaperLivesCatalog): number {
  const close = life.people.filter((p) => p.alive && p.role !== 'former_partner' && p.role !== 'colleague')
  const relationships = close.length > 0 ? close.reduce((sum, p) => sum + p.relationship, 0) / close.length : 40
  const money = { debt: -12, low: -4, comfortable: 4, wealthy: 6 }[moneyBand(life.gold)]
  return relationships + money + tilts(life, content, 'happiness').reduce((sum, t) => sum + t.target, 0)
}

/** Yearly living cost (paper-lives.md "Work and money"). */
export function livingCost(life: LifeState, content: PaperLivesCatalog): number {
  const t = content.tuning
  if (life.stage === 'infant' || life.stage === 'child' || life.stage === 'teen') return 0
  const base = t.livingCost[life.stage]
  const home = life.home === 'family' ? t.familyHomeCost - base : life.home === 'renting' ? t.rent : t.upkeep
  return Math.round(((base + home) * tiltPercent(life, content, 'cost')) / 100)
}

export function yearlyIncome(life: LifeState, content: PaperLivesCatalog): number {
  if (life.job !== undefined) return Math.round((life.income * tiltPercent(life, content, 'income')) / 100)
  return life.retired ? life.pension : 0
}

function drift(life: LifeState, content: PaperLivesCatalog, cands: Candidate[], rngs: Rngs): LifeState {
  const t = content.tuning
  // Money.
  const net = yearlyIncome(life, content) - livingCost(life, content)
  let gold = life.gold + net
  if (gold < t.debtFloor) {
    gold = t.debtFloor
    cands.push({ priority: PRIORITY.other, kind: 'check', glyph: 'money', summary: line(life, pickOne(rngs.narrative, content.lines.tightYear), content), note: 'a tight year' })
  } else if (life.gold < 0 && gold >= 0) {
    cands.push({ priority: PRIORITY.other, kind: 'check', glyph: 'money', summary: line(life, pickOne(rngs.narrative, content.lines.debtCleared), content), note: 'debts paid' })
  }
  life = { ...life, gold, counters: { ...life.counters, peakMoney: Math.max(life.counters.peakMoney, gold) } }
  if (life.job !== undefined) life = { ...life, jobYears: { ...life.jobYears, [life.job]: (life.jobYears[life.job] ?? 0) + 1 } }
  // Stats.
  const stats = { ...life.stats }
  const healthTarget = healthTargetAt(life.age + 1, t.healthDrift, t.healthTarget, tiltPercent(life, content, 'health'))
  stats.health = clampStat(stats.health + Math.round((healthTarget - stats.health) / 4))
  const target = happinessTarget(life, content)
  stats.happiness = clampStat(stats.happiness + Math.round((target - stats.happiness) / 5) + (life.hobby ? 2 : 0))
  for (const tilt of tilts(life, content, 'stat')) if (life.age < tilt.untilAge) stats[tilt.stat] = clampStat(stats[tilt.stat] + tilt.perYear)
  // Relationships drift toward 50 by one a year; a slower drift skips years.
  const percent = tiltPercent(life, content, 'relationshipDrift')
  const every = percent >= 100 ? 1 : Math.max(1, Math.round(100 / percent))
  const step = life.age % every === 0 ? Math.max(1, Math.round(percent / 100)) : 0
  const people = life.people.map((p) => (p.alive && step > 0 && p.relationship !== 50 ? { ...p, relationship: p.relationship > 50 ? Math.max(50, p.relationship - step) : Math.min(50, p.relationship + step) } : p))
  return { ...life, stats, people }
}

function personLine(life: LifeState, text: string, person: Person, content: PaperLivesCatalog): string {
  return line(life, text, content, { person: person.name })
}

/** The year's checks in a fixed order (paper-lives.md "The year", step 5). Every draw is on `people`. */
function checks(life: LifeState, content: PaperLivesCatalog, cands: Candidate[], rngs: Rngs): LifeState {
  const t = content.tuning
  const rng = rngs.people
  const L = content.lines
  const say = (priority: number, glyph: Candidate['glyph'], summary: string, note: string, extra: Partial<Candidate> = {}) => cands.push({ priority, kind: 'check', glyph, summary, note, ...extra })

  // School: exams at 11 and 17.
  if (life.age === 11 || life.age === 17) {
    const good = life.stats.smarts >= 55
    life = { ...life, stats: { ...life.stats, happiness: clampStat(life.stats.happiness + (good ? 3 : -2)) } }
    say(PRIORITY.other, 'book', line(life, pickOne(rngs.narrative, good ? L.examGood : L.examPoor), content), good ? 'good exam results' : 'middling exams')
  }
  if (life.education === 'university' && life.age >= 21) {
    life = { ...life, education: 'degree' }
    say(PRIORITY.other, 'book', line(life, pickOne(rngs.narrative, L.universityDone), content), 'a degree')
  }
  // Work: offers from 18 while unemployed; retirement at 70.
  if (life.age >= 18 && life.job === undefined && !life.retired && life.education !== 'university' && rng.int(1, 100) <= t.jobOfferPercent) {
    const offered = offerJob(life, rng, content)
    life = offered.life
    if (offered.line) say(PRIORITY.other, 'work', line(life, offered.line, content), 'a new job')
  }
  if (life.job !== undefined && life.age >= 70) {
    life = retire(life, content)
    say(PRIORITY.other, 'work', line(life, pickOne(rngs.narrative, L.retiredAuto), content), 'retirement')
  }
  // Partners.
  const partner = partnerOf(life)
  if (!partner) {
    const meet = Math.round((t.meetPercent * tiltPercent(life, content, 'meet')) / 100)
    if (life.age >= 18 && life.age <= 45 && rng.int(1, 100) <= meet) {
      const added = addPerson(life, 'partner', rng.int(-4, 4), rng.int(55, 75), rng, content, { step: 'dating', stepYears: 0 })
      life = added.life
      say(PRIORITY.family, 'heart', personLine(life, pickOne(rngs.narrative, L.meet), added.person, content), 'someone new')
    }
  } else {
    const years = (partner.stepYears ?? 0) + 1
    life = updatePerson(life, partner.id, (p) => ({ ...p, stepYears: years }))
    const roll = rng.int(1, 100)
    if (partner.relationship < 30 && roll <= t.separationPercent) {
      life = updatePerson(life, partner.id, (p) => {
        const { step: _s, stepYears: _y, ...rest } = p
        return { ...rest, role: 'former_partner' }
      })
      say(PRIORITY.family, 'heart', personLine(life, pickOne(rngs.narrative, L.separation), partner, content), 'a parting')
    } else if (partner.step === 'dating' && years >= 2 && partner.relationship >= 55 && roll <= t.proposalPercent) {
      life = updatePerson(life, partner.id, (p) => ({ ...p, step: 'engaged', stepYears: 0, relationship: clampStat(p.relationship + 5) }))
      say(PRIORITY.family, 'ring', personLine(life, pickOne(rngs.narrative, L.proposal), partner, content), 'an engagement')
    } else if (partner.step === 'engaged' && years >= 1) {
      life = bump(updatePerson(life, partner.id, (p) => ({ ...p, step: 'married', stepYears: 0, relationship: clampStat(p.relationship + 5) })), { marriages: 1 })
      const summary = personLine(life, pickOne(rngs.narrative, L.wedding), partner, content)
      life = highlight(life, summary)
      say(PRIORITY.family, 'ring', summary, 'a wedding')
    } else if (roll > 92) {
      life = updatePerson(life, partner.id, (p) => ({ ...p, relationship: clampStat(p.relationship - 8) }))
      say(PRIORITY.other, 'heart', personLine(life, pickOne(rngs.narrative, L.fallingOut), partner, content), 'a falling out')
    } else if (roll > 86 && partner.relationship < 50) {
      life = updatePerson(life, partner.id, (p) => ({ ...p, relationship: clampStat(p.relationship + 8) }))
      say(PRIORITY.other, 'heart', personLine(life, pickOne(rngs.narrative, L.reconcile), partner, content), 'making up')
    }
  }
  // Children for a couple open to them; grandchildren once a child is over 25.
  const couple = partnerOf(life)
  if (couple && life.flags.includes('family_open') && life.age >= 22 && life.age <= 44 && living(life, 'child').length < t.maxChildren && rng.int(1, 100) <= t.childPercent) {
    const added = addPerson(life, 'child', life.age, rng.int(70, 90), rng, content)
    life = bump(added.life, { childrenRaised: 1 })
    say(PRIORITY.family, 'pram', personLine(life, pickOne(rngs.narrative, L.childBorn), added.person, content), 'a baby')
  }
  const grown = living(life, 'child').filter((c) => personAge(life, c) > 25)
  if (grown.length > 0 && life.counters.grandchildren < t.maxGrandchildren && rng.int(1, 100) <= t.grandchildPercent) {
    const parent = grown[rng.int(0, grown.length - 1)]!
    const added = addPerson(life, 'grandchild', life.age, rng.int(65, 85), rng, content, { parentId: parent.id })
    life = bump(added.life, { grandchildren: 1 })
    say(PRIORITY.family, 'pram', line(life, pickOne(rngs.narrative, L.grandchild), content, { person: added.person.name, parent: parent.name }), 'a grandchild')
  }
  // Ageing: at most one death among the people a year; children and grandchildren are spared.
  for (const person of life.people) {
    if (!person.alive || person.role === 'child' || person.role === 'grandchild' || person.role === 'former_partner' || person.role === 'colleague') continue
    const age = personAge(life, person)
    if (age < 60) continue
    if (rng.int(1, 1000) > permilleAt(t.mortality, age)) continue
    life = updatePerson(life, person.id, (p) => ({ ...p, alive: false }))
    const lines = person.role === 'parent' ? L.parentDied : person.role === 'sibling' ? L.siblingDied : person.role === 'partner' ? L.partnerDied : L.friendDied
    const summary = personLine(life, pickOne(rngs.narrative, lines), person, content)
    life = updatePerson(life, person.id, (p) => addHistory(p, `${life.age}: ${summary}`))
    say(PRIORITY.family, 'candle', summary, person.role === 'partner' ? 'a loss' : 'a funeral')
    break
  }
  if (life.pet && life.age - life.pet.bornAt >= life.pet.lifespan) {
    const pet = life.pet
    const summary = line(life, pickOne(rngs.narrative, L.petDied), content)
    const { pet: _p, ...rest } = life
    life = { ...rest, petLostAt: life.age }
    say(PRIORITY.family, 'candle', summary, `saying goodbye to ${pet.name}`)
  }
  return life
}

function yearBoundary(life: LifeState, content: PaperLivesCatalog, rngs: Rngs): TickResult {
  const cands: Candidate[] = []
  // 1. The decision resolves: the chosen option, or the default.
  const pending = life.year.pending
  const lapsed = pending ? lapses(life, decisionOf(content, pending.decisionId), pending) : false
  if (pending && !lapsed) {
    const def = decisionOf(content, pending.decisionId)
    const chosen = pending.chosen !== undefined ? def.options.find((o) => o.id === pending.chosen) : undefined
    const option = chosen && optionOpen(life, chosen) ? chosen : optionOf(def, def.default)
    const person = pending.personId ? life.people.find((p) => p.id === pending.personId) : undefined
    const applied = applyEffects(life, option.effects, { content, rng: rngs.people, ...(person ? { person } : {}) })
    life = bump(applied.life, chosen === option ? { decisionsChosen: 1 } : { decisionsDefaulted: 1 })
    const summary = line(life, option.line, content, { ...(person ? { person: person.name } : {}), ...applied.slots })
    if (person) life = updatePerson(life, person.id, (p) => addHistory(p, `${life.age}: ${summary}`))
    if (def.major) life = highlight(life, summary)
    const note = line(life, option.note, content, { ...(person ? { person: person.name } : {}), ...applied.slots })
    cands.push({ priority: PRIORITY.decision, kind: 'decision_resolved', glyph: def.glyph, summary, note, ...(def.major ? { major: true } : {}) }, ...applied.extra)
  }
  // 2. Drift, then 3. the yearly checks.
  life = drift(life, content, cands, rngs)
  life = checks(life, content, cands, rngs)
  // 4. Mortality.
  if (dies(life, content, rngs.mortality)) {
    const ended = endLife(life, content, rngs)
    const written = pickLines(cands, BOUNDARY_LINES - 1)
    const events: LifeEvent[] = [...written.map((c) => toEvent(c, life.age)), { kind: 'death', glyph: 'candle', age: life.age, summary: ended.life.death!.line }]
    return { life: ended.life, events, disposition: 'died', record: ended.record }
  }
  return newYear(life, content, rngs, [], cands)
}

/**
 * A decision lapses, unresolved and unwritten, when the year has moved past it: the person it was
 * about died or left that role, or its conditions no longer hold (the money for a house went on a roof).
 */
export function lapses(life: LifeState, def: DecisionDef, pending: PendingDecision): boolean {
  if (!holds(def.when, life)) return true
  if (pending.personId === undefined) return false
  const person = life.people.find((p) => p.id === pending.personId)
  return !person || !person.alive || person.role !== def.when?.person
}

/** One `mortality` draw (paper-lives.md "The year", step 6). */
export function mortalityPermille(life: LifeState, content: PaperLivesCatalog): number {
  const t = content.tuning
  const health = life.stats.health
  if (life.age < 18) return health <= 0 ? 250 : 0
  let permille = permilleAt(t.mortality, life.age)
  if (health < 30) permille += (30 - health) * t.lowHealthPermille
  for (const tilt of tilts(life, content, 'mortality')) if (life.age >= tilt.fromAge && life.age < tilt.untilAge) permille = (permille * tilt.percent) / 100
  if (health <= 0) permille = Math.max(permille, 500)
  return Math.min(1000, Math.round(permille))
}

function dies(life: LifeState, content: PaperLivesCatalog, rng: Rng): boolean {
  return rng.int(1, 1000) <= mortalityPermille(life, content)
}

function pickLines(cands: readonly Candidate[], max: number): Candidate[] {
  return [...cands].sort((a, b) => a.priority - b.priority).slice(0, max)
}

function toEvent(c: Candidate, age: number): LifeEvent {
  return { kind: c.kind, glyph: c.glyph, age, summary: c.summary, ...(c.remarkable ? { remarkable: true } : {}), ...(c.major ? { major: true } : {}) }
}

/** The recap names the year's biggest things first (paper-lives.md "What a player sees"). */
function recapOf(life: LifeState, cands: readonly Candidate[], content: PaperLivesCatalog, rng: Rng): string {
  const notes = [...new Set([...[...cands].sort((a, b) => a.priority - b.priority).map((c) => c.note), ...life.year.notes])].slice(0, RECAP_NOTES)
  if (notes.length === 0) return line(life, pickOne(rng, content.lines.quietYear), content)
  return `Age ${life.age}: ${notes.join(' and ')}.`
}

/** 7. The new year: age, stage, the year's decision. */
function newYear(life: LifeState, content: PaperLivesCatalog, rngs: Rngs, events: LifeEvent[], cands: Candidate[]): TickResult {
  const wasInfant = life.stage === 'infant'
  const recap = wasInfant ? life.recap : recapOf(life, cands, content, rngs.narrative)
  const ended = life.age
  life = bump({ ...life, age: life.age + 1 }, { yearsLived: 1 })
  const stage = stageFor(life.age)
  if (stage !== life.stage) {
    life = { ...life, stage }
    if (stage === 'child') life = { ...life, education: 'school' }
    // A Saturday job ends with the teens; adult work comes from the offers.
    const job = life.job !== undefined ? content.jobs.find((j) => j.id === life.job) : undefined
    if (job && !job.stages.includes(stage)) {
      const { job: _j, jobSince: _s, ...rest } = life
      life = { ...rest, income: 0 }
    }
    const stageLines = content.lines.stage[stage as Exclude<typeof stage, 'infant'>]
    if (stageLines) cands.push({ priority: PRIORITY.stage, kind: 'stage', glyph: 'star', summary: line(life, pickOne(rngs.narrative, stageLines), content), note: 'a new chapter' })
  }
  // The closing year's lines and recap, then the new stage's line at the new age.
  const written = pickLines(cands, BOUNDARY_LINES)
  events.push(...written.filter((c) => c.kind !== 'stage').map((c) => toEvent(c, ended)))
  if (recap !== undefined && !wasInfant) events.push({ kind: 'recap', glyph: 'none', age: ended, summary: recap })
  events.push(...written.filter((c) => c.kind === 'stage').map((c) => toEvent(c, life.age)))
  // The year's decision: forced ones first, else two years in three.
  let pending: PendingDecision | undefined
  if (stage !== 'infant') {
    const { forced, drawn } = eligibleDecisions(life, content)
    let def: DecisionDef | undefined = forced[0]
    if (!def && drawn.length > 0 && rngs.decision.int(1, 100) <= content.tuning.decisionPercent) def = pickByRarity(rngs.decision, drawn, content.rarityWeights)
    if (def) {
      const offered = offer(life, def, rngs)
      life = offered.life
      pending = offered.pending
    }
  }
  life = { ...life, ...(recap !== undefined ? { recap } : {}), year: { elapsed: 0, quietTicks: 0, ageUpRequested: false, notes: [], lines: 0, ...(pending ? { pending } : {}) } }
  if (pending) events.push(offeredEvent(life, decisionOf(content, pending.decisionId), pending, content))
  return { life, events, disposition: 'boundary' }
}

