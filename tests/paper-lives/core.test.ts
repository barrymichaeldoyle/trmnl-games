import { describe, expect, it } from 'vitest'
import { contentV1 } from '@trmnl-games/paper-lives/content'
import {
  BOUNDARY_LINES,
  beginChild,
  bequests,
  choose,
  decisionOf,
  mortalityPermille,
  pause,
  rename,
  requestAgeUp,
  resume,
  seasonAt,
  setPronouns,
  simulateLife,
  starterLife,
  type LifeState,
  type Person,
  type TickResult,
} from '@trmnl-games/paper-lives/sim'
import { deriveLifeSeeds } from '@trmnl-games/paper-lives/sim/seed'
import { lapses } from '@trmnl-games/paper-lives/sim/simulate'
import { fill } from '@trmnl-games/paper-lives/sim/text'

const content = contentV1
const T = content.tuning

function tick(life: LifeState, n: number, id = 'life'): TickResult {
  return simulateLife({ life, content, streams: deriveLifeSeeds('seed', id, n, 1) })
}

/** Run ticks until a predicate on the result holds. */
function runUntil(life: LifeState, done: (r: TickResult, life: LifeState) => boolean, max = 5_000, id = 'life', each?: (l: LifeState) => LifeState): { life: LifeState; result: TickResult; ticks: number } {
  for (let n = 1; n <= max; n += 1) {
    const result = tick(each ? each(life) : life, n, id)
    life = result.life
    if (done(result, life)) return { life, result, ticks: n }
  }
  throw new Error('never happened')
}

const born = () => starterLife(content, deriveLifeSeeds('seed', 'life', 0, 1).birth).life
/** A life at the start of a normal year at this age, with no decision open. */
function grown(age: number, patch: Partial<LifeState> = {}): LifeState {
  const life = born()
  const stage = age < 6 ? 'infant' : age < 13 ? 'child' : age < 18 ? 'teen' : age < 30 ? 'young' : age < 60 ? 'adult' : 'senior'
  return { ...life, age, stage, education: age >= 18 ? 'work' : age >= 6 ? 'school' : 'none', ...patch }
}

describe('starting a life', () => {
  it('draws a stranger at birth with two different traits, two parents and stats around 50', () => {
    const { life, firstLog } = starterLife(content, 42)
    expect(life.age).toBe(0)
    expect(life.stage).toBe('infant')
    expect(life.generation).toBe(1)
    expect(life.pronouns).toBe('they')
    expect(life.traits[0]).not.toBe(life.traits[1])
    expect(life.people.filter((p) => p.role === 'parent')).toHaveLength(2)
    for (const value of Object.values(life.stats)) expect(value).toBeGreaterThanOrEqual(5)
    expect(firstLog).toMatch(/^Born on a \w+day in (spring|summer|autumn|winter)\./)
    expect(starterLife(content, 42)).toEqual(starterLife(content, 42))
  })

  it('name and sex can change only while an infant (D182)', () => {
    const life = born()
    const renamed = rename(life, 'Maud')
    expect(renamed.ok && renamed.life.first).toBe('Maud')
    const she = setPronouns(life, 'she')
    expect(she.ok && she.life.pronouns).toBe('she')
    const toddler = { ...life, age: 3, counters: { ...life.counters, yearsLived: 3 } }
    expect(rename(toddler, 'Maud').ok).toBe(true)
    const older = { ...life, age: 6, stage: 'child' as const, counters: { ...life.counters, yearsLived: 6 } }
    expect(rename(older, 'Maud').ok).toBe(false)
    expect(setPronouns(older, 'he').ok).toBe(false)
  })
})

describe('the year', () => {
  it('compresses ages 0 to 5 into one tick each and starts school at 6', () => {
    let life = born()
    for (let n = 1; n <= 6; n += 1) {
      const result = tick(life, n)
      expect(result.disposition).toBe('boundary')
      expect(result.events.length).toBeGreaterThan(0)
      life = result.life
    }
    expect(life.age).toBe(6)
    expect(life.stage).toBe('child')
    expect(life.education).toBe('school')
  })

  it('closes a year by itself at the close, and never before the minimum', () => {
    const { ticks } = runUntil(grown(30), (r) => r.disposition === 'boundary')
    expect(ticks).toBe(T.closeYearTicks)
  })

  it('takes an age-up at the first tick on or after the minimum, even when asked early', () => {
    const asked = requestAgeUp(grown(30))
    expect(asked.ok).toBe(true)
    const { ticks, life } = runUntil(asked.ok ? asked.life : grown(30), (r) => r.disposition === 'boundary')
    expect(ticks).toBe(T.minYearTicks)
    expect(life.age).toBe(31)
    expect(life.year.ageUpRequested).toBe(false)
    // A second ask in the same year is a no-op.
    const twice = requestAgeUp({ ...grown(30), year: { ...grown(30).year, ageUpRequested: true } })
    expect(twice.ok && twice.life.year.ageUpRequested).toBe(true)
  })

  it('runs four seasons across the minimum, then the year’s end', () => {
    expect([1, 2, 3, 4, 5, 6, 7, 8, 9].map((e) => seasonAt(e, 8).season)).toEqual(['spring', 'spring', 'summer', 'summer', 'autumn', 'autumn', 'winter', 'winter', 'winter'])
    expect(seasonAt(8, 8).yearEnd).toBe(false)
    expect(seasonAt(9, 8).yearEnd).toBe(true)
  })

  it('writes at most one line on a passive tick and at most three story lines plus the recap at a boundary', () => {
    let life = grown(25)
    for (let n = 1; n <= 3_000; n += 1) {
      const result = tick(life, n)
      const story = result.events.filter((e) => e.kind !== 'decision_offered' && e.kind !== 'recap')
      if (result.disposition === 'year') expect(story.length).toBeLessThanOrEqual(1)
      if (result.disposition === 'boundary') {
        expect(story.length).toBeLessThanOrEqual(BOUNDARY_LINES)
        expect(result.events.filter((e) => e.kind === 'recap')).toHaveLength(1)
      }
      life = result.life
      if (life.status !== 'living') break
    }
  })

  it('never repeats a quiet line within a year until its pool runs out', () => {
    let life = grown(45)
    const seen: string[] = []
    for (let n = 1; n < T.closeYearTicks; n += 1) {
      const result = tick(life, n)
      seen.push(...result.events.filter((e) => e.kind === 'ambient').map((e) => e.summary))
      life = result.life
    }
    const pool = content.ambient.filter((a) => a.stage === 'adult').length
    expect(seen.length).toBeGreaterThan(1)
    if (seen.length <= pool) expect(new Set(seen).size).toBe(seen.length)
  })

  it('pauses mid-year with the elapsed ticks kept', () => {
    const life = { ...grown(30), year: { ...grown(30).year, elapsed: 5 } }
    const paused = pause(life)
    expect(paused.ok).toBe(true)
    if (!paused.ok) return
    const result = tick(paused.life, 1)
    expect(result.disposition).toBe('idle')
    expect(result.events).toHaveLength(0)
    expect(result.life.year.elapsed).toBe(5)
    const resumed = resume(paused.life)
    expect(resumed.ok && tick(resumed.life, 1).life.year.elapsed).toBe(6)
  })

  it('is deterministic for the same seeds', () => {
    const a = runUntil(grown(40), (r) => r.disposition === 'boundary')
    const b = runUntil(grown(40), (r) => r.disposition === 'boundary')
    expect(a.life).toEqual(b.life)
  })
})

describe('decisions', () => {
  const withPending = (life: LifeState, decisionId: string, personId?: string): LifeState => ({ ...life, year: { ...life.year, pending: { decisionId, ...(personId ? { personId } : {}) } } })

  it('offers the education decision at 18 to every life', () => {
    const { result } = runUntil(grown(17), (r) => r.disposition === 'boundary')
    expect(result.life.age).toBe(18)
    expect(result.life.year.pending?.decisionId).toBe('yg_education')
  })

  it('resolves a choice at the boundary and a default when nothing was chosen', () => {
    const base = withPending(grown(18, { stats: { health: 70, happiness: 50, smarts: 70, charm: 50 } }), 'yg_education')
    const chose = choose(base, content, 'yg_education', 'university')
    expect(chose.ok).toBe(true)
    if (!chose.ok) return
    const chosen = runUntil(chose.life, (r) => r.disposition !== 'year')
    expect(chosen.life.education).toBe('university')
    expect(chosen.life.counters.decisionsChosen).toBe(1)
    const defaulted = runUntil(base, (r) => r.disposition !== 'year')
    expect(defaulted.life.education).toBe('work')
    expect(defaulted.life.counters.decisionsDefaulted).toBe(1)
  })

  it('marks each story line with the stats and money its effect moved, and nothing else', () => {
    let life = born()
    let marked = 0
    for (let n = 1; n <= 400 && life.status === 'living'; n += 1) {
      const result = tick(life, n)
      for (const event of result.events) {
        if (!event.changes) continue
        marked += 1
        expect(['event', 'infant', 'decision_resolved']).toContain(event.kind)
        for (const delta of Object.values(event.changes.stats ?? {})) expect(delta).not.toBe(0)
        if (event.changes.gold !== undefined) expect(event.changes.gold).not.toBe(0)
      }
      life = result.life
    }
    expect(marked).toBeGreaterThan(10)
    const chose = choose(withPending(grown(18, { stats: { health: 70, happiness: 50, smarts: 70, charm: 50 } }), 'yg_education'), content, 'yg_education', 'university')
    if (!chose.ok) throw new Error('refused')
    const resolved = runUntil(chose.life, (r) => r.disposition !== 'year').result.events.find((e) => e.kind === 'decision_resolved')
    const option = decisionOf(content, 'yg_education').options.find((o) => o.id === 'university')!
    for (const [stat, delta] of Object.entries(option.effects?.stats ?? {})) expect(resolved?.changes?.stats?.[stat as 'smarts']).toBe(delta)
  })

  it('refuses a gated option with its reason, and lets a choice be changed', () => {
    const low = withPending(grown(18, { stats: { health: 70, happiness: 50, smarts: 30, charm: 50 } }), 'yg_education')
    const refused = choose(low, content, 'yg_education', 'university')
    expect(refused).toEqual({ ok: false, code: 'OPTION_GATED', reason: 'Needs Smarts 50' })
    const first = choose(low, content, 'yg_education', 'trade')
    const second = first.ok ? choose(first.life, content, 'yg_education', 'work') : first
    expect(second.ok && second.life.year.pending?.chosen).toBe('work')
    expect(choose(low, content, 'sn_will', 'cause').ok).toBe(false)
  })

  it('lets a decision lapse when the person it was about is gone', () => {
    const life = grown(35)
    const friend: Person = { id: 'pf', name: 'Ada', role: 'friend', bornAt: 0, metAt: 10, relationship: 60, alive: false, history: [] }
    const pending = { decisionId: 'ad_old_friend', personId: 'pf' }
    expect(lapses({ ...life, people: [...life.people, friend] }, decisionOf(content, 'ad_old_friend'), pending)).toBe(true)
    expect(lapses({ ...life, people: [...life.people, { ...friend, alive: true }] }, decisionOf(content, 'ad_old_friend'), pending)).toBe(false)
  })

  it('keeps every default gentle and ungated', () => {
    for (const def of content.decisions) expect(def.options.find((o) => o.id === def.default)?.gate).toBeUndefined()
  })
})

describe('money', () => {
  it('never lets money fall below the debt floor', () => {
    let life = grown(25, { gold: -1_900, home: 'renting' })
    for (let n = 1; n <= 400; n += 1) {
      life = tick(life, n).life
      expect(life.gold).toBeGreaterThanOrEqual(T.debtFloor)
      if (life.status !== 'living') break
    }
  })
})

describe('death and the next life', () => {
  it('has no chance of death under 18 unless health is gone', () => {
    expect(mortalityPermille(grown(12), content)).toBe(0)
    expect(mortalityPermille(grown(12, { stats: { health: 0, happiness: 50, smarts: 50, charm: 50 } }), content)).toBeGreaterThan(0)
    expect(mortalityPermille(grown(85), content)).toBeGreaterThan(mortalityPermille(grown(60), content))
  })

  it('lowers the risk for Lucky until 80 only', () => {
    const plain = grown(70, { traits: ['tidy', 'shy'] })
    const lucky = grown(70, { traits: ['lucky', 'shy'] })
    expect(mortalityPermille(lucky, content)).toBe(Math.round((mortalityPermille(plain, content) * 60) / 100))
    expect(mortalityPermille({ ...lucky, age: 85 }, content)).toBe(mortalityPermille({ ...plain, age: 85 }, content))
  })

  it('ends a life with a record, a cause and an epitaph, written once', () => {
    const old = grown(100, { stats: { health: 0, happiness: 50, smarts: 50, charm: 50 } })
    const { result, life } = runUntil(old, (r) => r.disposition === 'died')
    expect(life.status).toBe('ended')
    expect(result.record?.age).toBe(100)
    expect(result.record?.epitaph.length).toBeGreaterThan(0)
    expect(result.events.at(-1)?.kind).toBe('death')
    expect(tick(life, 99_999).disposition).toBe('idle')
  })

  it('follows the will, or splits half to the partner and half to the children without one', () => {
    const life = grown(80, { gold: 10_000, home: 'owned', house: 2 })
    const kids: Person[] = [
      { id: 'c1', name: 'Ada', role: 'child', bornAt: 30, metAt: 30, relationship: 80, alive: true, history: [] },
      { id: 'c2', name: 'Bea', role: 'child', bornAt: 33, metAt: 33, relationship: 60, alive: true, history: [] },
    ]
    const partner: Person = { id: 'pp', name: 'Cai', role: 'partner', bornAt: 0, metAt: 25, relationship: 70, alive: true, step: 'married', history: [] }
    const family = { ...life, people: [...kids, partner] }
    expect(bequests(family)).toEqual([
      { personId: 'pp', gold: 5_000, house: true },
      { personId: 'c1', gold: 2_500, house: false },
      { personId: 'c2', gold: 2_500, house: false },
    ])
    expect(bequests({ ...family, will: 'one_child' })).toEqual([{ personId: 'c1', gold: 10_000, house: true }])
    expect(bequests({ ...family, will: 'cause' })).toEqual([])
    expect(bequests({ ...family, gold: -1_500 }).every((b) => b.gold === 0)).toBe(true)
  })

  it('begins a child’s life at their age with the surname, the siblings and the inheritance', () => {
    const old = grown(100, { stats: { health: 0, happiness: 50, smarts: 50, charm: 50 }, gold: 9_000 })
    const kids: Person[] = [
      { id: 'c1', name: 'Ada', role: 'child', bornAt: 30, metAt: 30, relationship: 80, alive: true, history: [] },
      { id: 'c2', name: 'Bea', role: 'child', bornAt: 33, metAt: 33, relationship: 60, alive: true, history: [] },
      { id: 'g1', name: 'Cai', role: 'grandchild', bornAt: 60, metAt: 60, relationship: 60, alive: true, parentId: 'c1', history: [] },
    ]
    const { result } = runUntil({ ...old, people: kids }, (r) => r.disposition === 'died')
    const record = result.record!
    const { life } = beginChild(record, 'c1', content, 7)
    expect(life.first).toBe('Ada')
    expect(life.last).toBe(old.last)
    expect(life.age).toBe(70)
    expect(life.generation).toBe(old.generation + 1)
    // The year's costs come off before the will divides what is left between the two children.
    const share = record.bequests.find((b) => b.personId === 'c1')!
    expect(share.gold).toBe(Math.ceil(record.finalGold / 2))
    expect(life.gold).toBe(share.gold)
    expect(life.people.find((p) => p.name === 'Bea')?.role).toBe('sibling')
    expect(life.people.find((p) => p.name === 'Cai')?.role).toBe('child')
    expect(life.people.find((p) => p.name === old.first)?.alive).toBe(false)
    expect(life.traits).not.toEqual(old.traits)
    expect(() => beginChild(record, 'g1', content, 7)).toThrow()
  })
})

describe('text', () => {
  it('fills pronoun slots for all three choices', () => {
    expect(fill('{They} kept {their} garden.', 'they', {})).toBe('They kept their garden.')
    expect(fill('{They} kept {their} garden.', 'she', {})).toBe('She kept her garden.')
    expect(fill('{They} kept {their} garden.', 'he', {})).toBe('He kept his garden.')
    expect(() => fill('{nope}', 'they', {})).toThrow()
  })
})
