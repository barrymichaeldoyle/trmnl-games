import { fill, PRONOUN_SLOTS, slotsOf, VALUE_SLOTS } from '../sim/text'
import type { DecisionDef, Effects, EventDef, PaperLivesCatalog, Pronouns, Stage, When } from '../sim/types'

/**
 * The Paper Lives content validator (paper-lives.md "Content"): ids stable and unique, every reference
 * resolves, every option has a line, every person-mentioning line has a person, every pronoun slot fills
 * for all three choices, device lines stay under 90 code points, and the tone rules hold.
 */
export const MAX_LINE = 90
const STAGES: readonly Stage[] = ['infant', 'child', 'teen', 'young', 'adult', 'senior']
const NORMAL: readonly Stage[] = ['child', 'teen', 'young', 'adult', 'senior']
/** People are always named; only the character has pronouns, through slots. */
const GENDERED = /\b(he|she|him|her|his|hers|himself|herself|mum|dad|mother|father|son|daughter|brother|sister|wife|husband|grandma|grandad|granny|grandpa|aunt|uncle|niece|nephew|boyfriend|girlfriend)\b/i
/** Never in Paper Lives (paper-lives.md "Not in the MVP"). */
const BANNED = /\b(lottery|raffle|scratch ?card|sweepstake|bet|bets|betting|gambl\w*|casino|prison|jail|police|arrest\w*|gun|guns|knife|knives|weapon\w*|drug\w*|drunk|smoking|smoker\w*|cigarette\w*|kill\w*|murder\w*|steal\w*|stole|theft|suicide|sex\w*)\b/i
/** The tone guide's colon reveal ("First love: Sam"). Recap lines are written by the core, not here. */
const COLON_REVEAL = /\w: \w/

export interface ContentReport {
  readonly problems: string[]
  readonly counts: Record<string, number>
}

const stagesOf = (s: Stage | readonly Stage[]) => (typeof s === 'string' ? [s] : s)

function longest(values: readonly string[]): string {
  return values.reduce((a, b) => ([...b].length > [...a].length ? b : a), '')
}

export function validateContent(content: PaperLivesCatalog): ContentReport {
  const problems: string[] = []
  const problem = (msg: string) => problems.push(msg)
  const traitIds = new Set(content.traits.map((t) => t.id))
  const hobbyIds = new Set(content.hobbies.map((h) => h.id))
  const petIds = new Set(content.pets.map((p) => p.id))
  const decisionIds = new Set(content.decisions.map((d) => d.id))
  const knownSlots = new Set<string>([...PRONOUN_SLOTS, ...VALUE_SLOTS])

  const unique = (kind: string, ids: readonly string[]) => {
    const seen = new Set<string>()
    for (const id of ids) {
      if (seen.has(id)) problem(`${kind} id ${id} is duplicated`)
      seen.add(id)
    }
  }
  unique('trait', content.traits.map((t) => t.id))
  unique('hobby', content.hobbies.map((h) => h.id))
  unique('pet', content.pets.map((p) => p.id))
  unique('job', content.jobs.map((j) => j.id))
  unique('event', content.events.map((e) => e.id))
  unique('decision', content.decisions.map((d) => d.id))
  // Events and decisions share the life's `seen` list.
  for (const id of content.events.map((e) => e.id)) if (decisionIds.has(id)) problem(`event ${id} shares its id with a decision`)
  unique('cause', content.causes.map((c) => c.id))
  unique('first name', content.names.first)
  unique('surname', content.names.last)
  unique('pet name', content.names.pets)

  // Longest realistic values, so a line that fits here fits on the device.
  const sample = {
    first: longest(content.names.first),
    last: longest(content.names.last),
    age: '100',
    season: 'autumn',
    person: longest(content.names.first),
    pet: longest(content.names.pets),
    petKind: longest(content.pets.map((p) => p.name.toLowerCase())),
    hobby: longest(content.hobbies.map((h) => h.noun)),
    job: longest(content.jobs.map((j) => j.name.toLowerCase())),
    house: longest(content.houses.map((h) => h.name)),
    trait: longest(content.traits.map((t) => t.name.toLowerCase())),
    weekday: 'Wednesday',
    parent: longest(content.names.first),
  }

  /** Checks one line: slots known and available, fills for every pronoun choice, length, tone. */
  const checkLine = (where: string, line: string, available: ReadonlySet<string>, opts: { maxLength?: number; colon?: boolean } = {}) => {
    if (!line.trim()) problem(`${where}: empty line`)
    for (const slot of slotsOf(line)) {
      if (!knownSlots.has(slot)) problem(`${where}: unknown slot {${slot}}`)
      else if (!PRONOUN_SLOTS.includes(slot) && !available.has(slot)) problem(`${where}: slot {${slot}} has no value here`)
    }
    const bare = line.replace(/\{\w+\}/g, '')
    if (GENDERED.test(bare)) problem(`${where}: gendered word in "${line}"`)
    if (BANNED.test(bare)) problem(`${where}: banned theme in "${line}"`)
    if (opts.colon !== true && COLON_REVEAL.test(bare)) problem(`${where}: colon reveal in "${line}"`)
    for (const pronouns of ['they', 'she', 'he'] as Pronouns[]) {
      try {
        const filled = fill(line, pronouns, sample)
        const length = [...filled].length
        if (length > (opts.maxLength ?? MAX_LINE)) problem(`${where}: ${length} code points once filled ("${filled}")`)
      } catch (error) {
        if (slotsOf(line).every((s) => knownSlots.has(s))) problem(`${where}: ${(error as Error).message}`)
      }
    }
  }

  const always = ['first', 'last', 'age', 'parent']
  /** Which slots a line can rely on, from its conditions and effects. */
  const slotsFrom = (when: When | undefined, effects: Effects | undefined, extra: readonly string[] = []): Set<string> => {
    const slots = new Set<string>([...always, ...extra])
    if (when?.person || effects?.addPerson || (effects?.partner && effects.partner !== undefined)) slots.add('person')
    if ((when?.pet !== undefined && when.pet !== false) || (effects?.pet !== undefined && effects.pet !== 'lose')) {
      slots.add('pet')
      slots.add('petKind')
    }
    if (when?.job === true || effects?.job === 'offer' || effects?.job === 'change') slots.add('job')
    if ((when?.hobby !== undefined && when.hobby !== false) || (effects?.hobby !== undefined && effects.hobby !== 'drop')) slots.add('hobby')
    if (effects?.house !== undefined || effects?.downsize) slots.add('house')
    return slots
  }

  const checkWhen = (where: string, when: When | undefined) => {
    if (!when) return
    for (const t of [...(when.traits ?? []), ...(when.notTraits ?? [])]) if (!traitIds.has(t)) problem(`${where}: unknown trait ${t}`)
    if (Array.isArray(when.pet)) for (const p of when.pet) if (!petIds.has(p)) problem(`${where}: unknown pet ${p}`)
    if (Array.isArray(when.hobby)) for (const h of when.hobby) if (!hobbyIds.has(h)) problem(`${where}: unknown hobby ${h}`)
  }
  const checkEffects = (where: string, effects: Effects | undefined) => {
    if (!effects) return
    if (effects.hobby && effects.hobby !== 'drop' && !hobbyIds.has(effects.hobby)) problem(`${where}: unknown hobby ${effects.hobby}`)
    if (effects.pet && effects.pet !== 'lose' && !petIds.has(effects.pet)) problem(`${where}: unknown pet ${effects.pet}`)
    if (effects.house !== undefined && !content.houses.some((h) => h.band === effects.house)) problem(`${where}: unknown house band ${effects.house}`)
    for (const [stat, delta] of Object.entries(effects.stats ?? {})) if (Math.abs(delta) > 10 || delta === 0) problem(`${where}: ${stat} change ${delta} outside ±1 to ±10`)
    if (effects.relationship !== undefined && Math.abs(effects.relationship) > 15) problem(`${where}: relationship change ${effects.relationship} too large`)
  }

  // Events.
  for (const event of content.events) {
    const where = `event ${event.id}`
    for (const s of stagesOf(event.stage)) if (!STAGES.includes(s)) problem(`${where}: unknown stage ${s}`)
    checkWhen(where, event.when)
    checkEffects(where, event.effects)
    if (event.effects?.relationship !== undefined && !event.when?.person) problem(`${where}: relationship change without a person`)
    const slots = slotsFrom(event.when, event.effects)
    checkLine(where, event.line, slots)
    checkLine(`${where} note`, event.note, slots, { maxLength: 40 })
    if (/ and /.test(event.note)) problem(`${where}: a note joins with "and", which the recap already does`)
    if (event.opens) {
      const def = content.decisions.find((d) => d.id === event.opens)
      if (!def) problem(`${where}: opens unknown decision ${event.opens}`)
      else if (!def.eventOnly) problem(`${where}: opens ${def.id}, which is not eventOnly`)
    }
    if (stagesOf(event.stage).includes('infant') && (event.opens || event.effects?.addPerson)) problem(`${where}: infant events add nobody and open nothing`)
  }

  // Decisions.
  for (const def of content.decisions) {
    const where = `decision ${def.id}`
    checkWhen(where, def.when)
    if (def.options.length < 2 || def.options.length > (def.id === 'sn_will' ? 5 : 4)) problem(`${where}: ${def.options.length} options`)
    unique(`${where} option`, def.options.map((o) => o.id))
    const fallback = def.options.find((o) => o.id === def.default)
    if (!fallback) problem(`${where}: default ${def.default} is not an option`)
    else if (fallback.gate) problem(`${where}: the default option is gated`)
    if (def.eventOnly && !content.events.some((e) => e.opens === def.id)) problem(`${where}: eventOnly but no event opens it`)
    if (stagesOf(def.stage).includes('infant')) problem(`${where}: infants make no decisions`)
    checkLine(`${where} prompt`, def.prompt, slotsFrom(def.when, undefined), { maxLength: 70 })
    for (const option of def.options) {
      const at = `${where}.${option.id}`
      checkWhen(at, option.gate)
      checkEffects(at, option.effects)
      if (option.gate && !option.gateReason) problem(`${at}: gated without a reason`)
      if (option.effects?.relationship !== undefined && !def.when?.person) problem(`${at}: relationship change without a person`)
      const slots = slotsFrom(def.when, option.effects)
      checkLine(`${at} label`, option.label, slotsFrom(def.when, undefined), { maxLength: 32 })
      checkLine(at, option.line, slots)
      checkLine(`${at} note`, option.note, slots, { maxLength: 40 })
      if (/ and /.test(option.note)) problem(`${at}: a note joins with "and", which the recap already does`)
    }
  }

  // Jobs, traits, ambient, causes, epitaphs, system lines.
  for (const job of content.jobs) {
    if (job.easedBy && !traitIds.has(job.easedBy)) problem(`job ${job.id}: unknown trait ${job.easedBy}`)
    if (job.income[0] > job.income[1]) problem(`job ${job.id}: income band reversed`)
    for (const [i, line] of job.startLines.entries()) checkLine(`job ${job.id} line ${i}`, line, new Set(always))
  }
  for (const trait of content.traits) checkLine(`trait ${trait.id}`, trait.reveal, new Set(always))
  for (const [i, amb] of content.ambient.entries()) {
    if (amb.trait && !traitIds.has(amb.trait)) problem(`ambient ${i}: unknown trait ${amb.trait}`)
    checkLine(`ambient ${i}`, amb.line, new Set([...always, 'season']))
  }
  for (const stage of NORMAL) {
    for (const season of ['spring', 'summer', 'autumn', 'winter'] as const) {
      if (!content.ambient.some((a) => a.stage === stage && !a.yearEnd && (a.season === undefined || a.season === season))) problem(`ambient: none for ${stage} in ${season}`)
    }
    if (!content.ambient.some((a) => a.stage === stage && a.yearEnd)) problem(`ambient: no year's-end line for ${stage}`)
  }
  for (const cause of content.causes) checkLine(`cause ${cause.id}`, cause.line, new Set(['age', 'first', 'last', 'job', 'hobby']))
  for (let age = 0; age <= 120; age += 1) if (!content.causes.some((c) => age >= c.minAge && (c.maxAge === undefined || age <= c.maxAge))) problem(`causes: none at age ${age}`)
  if (!content.epitaphs.some((e) => e.needs.length === 0)) problem('epitaphs: none without needs')
  for (const [i, ep] of content.epitaphs.entries()) {
    const slots = new Set(['first', 'last', 'age', ...(ep.needs.includes('job') ? ['job'] : []), ...(ep.needs.includes('hobby') ? ['hobby'] : [])])
    checkLine(`epitaph ${i}`, ep.line, slots)
  }
  const L = content.lines
  const sys = (name: string, list: readonly string[], slots: readonly string[], colon = false) => {
    if (list.length === 0) problem(`lines.${name}: empty`)
    for (const [i, line] of list.entries()) checkLine(`lines.${name} ${i}`, line, new Set([...always, ...slots]), { colon })
  }
  checkLine('lines.firstLog', L.firstLog, new Set([...always, 'weekday', 'season']))
  sys('continues', L.continues, [])
  for (const [stat, list] of Object.entries(L.born)) sys(`born.${stat}`, list, [])
  for (const [stage, list] of Object.entries(L.stage)) sys(`stage.${stage}`, list, [])
  sys('examGood', L.examGood, [])
  sys('examPoor', L.examPoor, [])
  sys('universityDone', L.universityDone, [])
  sys('unemployed', L.unemployed, [])
  sys('tightYear', L.tightYear, [])
  sys('debtCleared', L.debtCleared, [])
  for (const name of ['meet', 'proposal', 'wedding', 'fallingOut', 'reconcile', 'separation', 'childBorn', 'parentDied', 'siblingDied', 'partnerDied', 'friendDied'] as const) sys(name, L[name], ['person'])
  sys('grandchild', L.grandchild, ['person'])
  sys('petDied', L.petDied, ['pet', 'petKind'])
  sys('petArrived', L.petArrived, ['pet', 'petKind'])
  sys('hobbyTaken', L.hobbyTaken, ['hobby'])
  sys('retiredAuto', L.retiredAuto, [])
  sys('quietYear', L.quietYear, [], true)

  // Tuning sanity.
  const t = content.tuning
  if (t.minYearTicks % 4 !== 0) problem('tuning: the minimum must split into four seasons')
  if (t.closeYearTicks <= t.minYearTicks) problem('tuning: the close must come after the minimum')
  if (content.names.first.length < 160) problem(`names: ${content.names.first.length} first names, want 160`)
  if (content.names.last.length < 100) problem(`names: ${content.names.last.length} surnames, want 100`)
  if (content.names.pets.length < 48) problem(`names: ${content.names.pets.length} pet names, want 48`)

  const counts: Record<string, number> = {
    events: content.events.length,
    decisions: content.decisions.length,
    majorDecisions: content.decisions.filter((d) => d.major).length,
    petEvents: content.events.filter((e) => e.kind === 'pet').length,
    hobbyEvents: content.events.filter((e) => e.kind === 'hobby').length,
    ambient: content.ambient.filter((a) => !a.yearEnd).length,
    yearEndAmbient: content.ambient.filter((a) => a.yearEnd).length,
    jobs: content.jobs.length,
    traits: content.traits.length,
    causes: content.causes.length,
    epitaphs: content.epitaphs.length,
  }
  for (const stage of STAGES) {
    counts[`events.${stage}`] = content.events.filter((e: EventDef) => stagesOf(e.stage).includes(stage)).length
    counts[`decisions.${stage}`] = content.decisions.filter((d: DecisionDef) => stagesOf(d.stage).includes(stage)).length
  }
  return { problems, counts }
}
