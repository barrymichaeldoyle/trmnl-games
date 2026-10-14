/**
 * Paper Lives balance harness (paper-lives.md "Work slices", L1). Runs the real pure core over
 * simulated lives for three players and reports the spec's gates.
 *   pnpm balance:paper-lives             (400 lives per policy)
 *   pnpm balance:paper-lives -- --lives 1000
 *   pnpm balance:paper-lives -- --json   (machine-readable report)
 *   pnpm balance:paper-lives -- --story  (print one hourly life's story)
 */
import { createRng, type Rng } from '@trmnl-games/engine/rng'
import { contentV1 } from '@trmnl-games/paper-lives/content'
import { beginChild, choose, decisionOf, optionOpen, requestAgeUp, simulateLife, starterLife, type LifeEvent, type LifeRecord, type LifeState, type PaperLivesCatalog, type StatId } from '@trmnl-games/paper-lives/sim'
import { deriveLifeSeeds } from '@trmnl-games/paper-lives/sim/seed'

export const TICKS_PER_DAY = 96
const WORLD = 'harness'

export interface Policy {
  readonly name: string
  /** Visits: every hour while awake, once a day in the evening, or never. */
  readonly visits: 'hourly' | 'daily' | 'never'
  /** How a visiting player answers decisions. */
  readonly choice: 'uniform' | 'default'
}

export const POLICIES: readonly Policy[] = [
  { name: 'hourly', visits: 'hourly', choice: 'uniform' },
  { name: 'daily', visits: 'daily', choice: 'uniform' },
  { name: 'never', visits: 'never', choice: 'default' },
]

const visiting = (policy: Policy, tick: number): boolean => {
  const inDay = tick % TICKS_PER_DAY
  if (policy.visits === 'hourly') return inDay % 4 === 0 && inDay >= 7 * 4 && inDay <= 23 * 4
  if (policy.visits === 'daily') return inDay === 19 * 4
  return false
}

export interface YearLog {
  readonly age: number
  readonly ticks: number
  /** Story lines: events and the boundary's lines, not ambient lines, prompts or the recap. */
  readonly lines: number
}

export interface LifeRun {
  readonly policy: string
  readonly index: number
  readonly record: LifeRecord | null
  readonly final: LifeState
  readonly ticks: number
  readonly years: YearLog[]
  readonly eventDraws: Record<string, number>
  readonly repeats: Record<string, number>
  readonly minGold: number
  readonly at: Partial<Record<30 | 60, Record<StatId, number>>>
  /** The age the first partner came into the story. */
  readonly firstPartnerAge: number | null
  /** Decision id → option chosen (resolved), for the dominance gate. */
  readonly choices: Array<readonly [string, string]>
  readonly story: LifeEvent[]
}

const STORY = new Set<LifeEvent['kind']>(['event', 'decision_resolved', 'check', 'stage', 'death'])

/** One life from birth (or from `start`) to death or the day limit. */
export function simulateLifeRun(policy: Policy, index: number, maxDays = 60, content: PaperLivesCatalog = contentV1, start?: LifeState, keepStory = false): LifeRun {
  const lifeId = `${policy.name}-${index}`
  let life = start ?? starterLife(content, deriveLifeSeeds(WORLD, lifeId, 0, 1).birth).life
  const choiceRng: Rng = createRng(index * 7919 + policy.name.length)
  const years: YearLog[] = []
  const eventDraws: Record<string, number> = {}
  const repeats: Record<string, number> = {}
  const at: LifeRun['at'] = {}
  const choices: Array<readonly [string, string]> = []
  const story: LifeEvent[] = []
  let minGold = life.gold
  let firstPartnerAge: number | null = null
  let yearTicks = 0
  let yearLines = 0
  let record: LifeRecord | null = null
  let tick = 0
  const end = maxDays * TICKS_PER_DAY
  for (tick = 1; tick <= end; tick += 1) {
    if (policy.visits !== 'never' && visiting(policy, tick)) {
      const pending = life.year.pending
      if (pending && pending.chosen === undefined && policy.choice === 'uniform') {
        const def = decisionOf(content, pending.decisionId)
        const open = def.options.filter((o) => optionOpen(life, o))
        const pick = open[choiceRng.int(0, open.length - 1)]!
        const chosen = choose(life, content, def.id, pick.id)
        if (chosen.ok) life = chosen.life
      }
      if (life.stage !== 'infant') {
        const asked = requestAgeUp(life)
        if (asked.ok) life = asked.life
      }
    }
    const before = life
    const result = simulateLife({ life, content, streams: deriveLifeSeeds(WORLD, lifeId, tick, 1) })
    life = result.life
    if (keepStory) story.push(...result.events)
    for (const event of result.events) {
      if (event.kind === 'event') {
        eventDraws[before.stage] = (eventDraws[before.stage] ?? 0) + 1
        if (life.seen.length === before.seen.length && !result.events.some((e) => e.kind === 'decision_offered')) repeats[before.stage] = (repeats[before.stage] ?? 0) + 1
      }
    }
    if (before.stage !== 'infant') {
      yearTicks += 1
      yearLines += result.events.filter((e) => STORY.has(e.kind)).length
    }
    if (result.disposition === 'boundary' || result.disposition === 'died') {
      if (before.stage !== 'infant') years.push({ age: before.age, ticks: yearTicks, lines: yearLines })
      yearTicks = 0
      yearLines = 0
      if (before.year.pending) {
        const def = decisionOf(content, before.year.pending.decisionId)
        const chosen = before.year.pending.chosen
        choices.push([def.id, chosen !== undefined && optionOpen(before, def.options.find((o) => o.id === chosen)!) ? chosen : def.default])
      }
      if (life.age === 30 && !at[30]) at[30] = { ...life.stats }
      if (life.age === 60 && !at[60]) at[60] = { ...life.stats }
    }
    minGold = Math.min(minGold, life.gold)
    if (firstPartnerAge === null && life.people.some((p) => p.role === 'partner' || p.role === 'former_partner')) firstPartnerAge = life.age
    if (result.record) {
      record = result.record
      break
    }
  }
  return { policy: policy.name, index, record, final: life, ticks: Math.min(tick, end), years, eventDraws, repeats, minGold, at, firstPartnerAge, choices, story }
}

export interface Gate {
  readonly name: string
  readonly value: number | null
  readonly target: string
  readonly pass: boolean
}

const median = (xs: number[]) => {
  if (xs.length === 0) return NaN
  const s = [...xs].sort((a, b) => a - b)
  return s[Math.floor(s.length / 2)]!
}
const quantile = (xs: number[], q: number) => {
  if (xs.length === 0) return NaN
  const s = [...xs].sort((a, b) => a - b)
  return s[Math.min(s.length - 1, Math.floor(s.length * q))]!
}
const mean = (xs: number[]) => (xs.length === 0 ? NaN : xs.reduce((a, b) => a + b, 0) / xs.length)
const round = (x: number, places = 2) => Math.round(x * 10 ** places) / 10 ** places

/** Outcomes the trait gate measures. */
function outcomes(run: LifeRun): Record<string, number> {
  const r = run.record
  return {
    ageAtDeath: r?.age ?? run.final.age,
    yearsPast70: Math.max(0, (r?.age ?? run.final.age) - 70),
    firstPartnerAge: run.firstPartnerAge ?? NaN,
    peakMoney: run.final.counters.peakMoney,
    happiness60: run.at[60]?.happiness ?? NaN,
    health60: run.at[60]?.health ?? NaN,
    smarts30: run.at[30]?.smarts ?? NaN,
    charm30: run.at[30]?.charm ?? NaN,
    married: run.final.counters.marriages > 0 ? 1 : 0,
    children: run.final.counters.childrenRaised,
  }
}

export interface HarnessReport {
  readonly lives: number
  readonly gates: Gate[]
  readonly stats: Record<string, number | string>
  readonly traits: Record<string, Record<string, number>>
}

export function runHarness(livesPerPolicy = 400, maxDays = 60, content: PaperLivesCatalog = contentV1): HarnessReport {
  const runs: Record<string, LifeRun[]> = {}
  for (const policy of POLICIES) {
    runs[policy.name] = []
    for (let i = 0; i < livesPerPolicy; i += 1) runs[policy.name]!.push(simulateLifeRun(policy, i, maxDays, content))
  }
  const all = Object.values(runs).flat()
  const ended = all.filter((r) => r.record)
  const ages = ended.map((r) => r.record!.age)
  const days = (name: string) => runs[name]!.filter((r) => r.record).map((r) => r.ticks / TICKS_PER_DAY)
  const normalYears = all.flatMap((r) => r.years)
  const yearLines = normalYears.map((y) => y.lines)
  const stages = ['child', 'teen', 'young', 'adult', 'senior'] as const
  const repeatRate = (stage: string) => {
    const draws = all.reduce((s, r) => s + (r.eventDraws[stage] ?? 0), 0)
    const reps = all.reduce((s, r) => s + (r.repeats[stage] ?? 0), 0)
    return draws === 0 ? 0 : reps / draws
  }
  const worstRepeat = Math.max(...stages.map(repeatRate))
  const minGold = Math.min(...all.map((r) => r.minGold))

  // Dominance: each decision's options, chosen by the uniform policy, end within 15% of the same happiness at 60.
  const byOption = new Map<string, number[]>()
  for (const run of all.filter((r) => r.policy !== 'never' && r.at[60])) {
    for (const [decision, option] of run.choices) {
      const key = `${decision}.${option}`
      if (!byOption.has(key)) byOption.set(key, [])
      byOption.get(key)!.push(run.at[60]!.happiness)
    }
  }
  let worstSpread = 0
  let worstDecision = ''
  for (const def of content.decisions) {
    const means = def.options.map((o) => byOption.get(`${def.id}.${o.id}`) ?? []).filter((xs) => xs.length >= 15).map(mean)
    if (means.length < 2) continue
    const spread = (Math.max(...means) - Math.min(...means)) / mean(means)
    if (spread > worstSpread) {
      worstSpread = spread
      worstDecision = def.id
    }
  }
  const remarkable = mean(ended.map((r) => (r.record!.counters.remarkableEvents > 0 ? 1 : 0)))
  const pets = mean(ended.map((r) => (r.record!.counters.petsKept > 0 ? 1 : 0)))
  const hobbies = mean(ended.map((r) => (r.record!.counters.hobbiesTaken > 0 ? 1 : 0)))

  // Traits: relative change in each outcome with the trait versus without.
  const traitTable: Record<string, Record<string, number>> = {}
  let traitsOk = true
  for (const trait of content.traits) {
    const withT = all.filter((r) => r.final.traits.includes(trait.id))
    const without = all.filter((r) => !r.final.traits.includes(trait.id))
    const row: Record<string, number> = {}
    let best = 0
    let worst = 0
    for (const key of Object.keys(outcomes(all[0]!))) {
      const a = mean(withT.map((r) => outcomes(r)[key]!).filter((x) => !Number.isNaN(x)))
      const b = mean(without.map((r) => outcomes(r)[key]!).filter((x) => !Number.isNaN(x)))
      const change = b === 0 ? 0 : (a - b) / Math.abs(b)
      row[key] = round(change, 3)
      best = Math.max(best, Math.abs(change))
      worst = Math.max(worst, Math.abs(change))
    }
    row.max = round(best, 3)
    traitTable[trait.id] = row
    if (best < 0.05 || worst > 0.25) traitsOk = false
  }

  const gates: Gate[] = []
  const gate = (name: string, value: number | null, target: string, pass: boolean) => gates.push({ name, value: value === null || Number.isNaN(value) ? null : round(value), target, pass })
  const med = median(ages)
  gate('Median life (years)', med, '72 to 84', med >= 72 && med <= 84)
  const young = mean(ended.map((r) => (r.record!.age < 18 ? 1 : 0)))
  gate('Deaths under 18', young, 'below 2%', young < 0.02)
  const hourly = median(days('hourly'))
  gate('Hourly player life (days)', hourly, '5 to 9', hourly >= 5 && hourly <= 9)
  const never = median(days('never'))
  gate('Never-visiting life (days)', never, '24 to 32', never >= 24 && never <= 32)
  const lineMean = mean(yearLines)
  gate('Lines a normal year (mean)', lineMean, '2 to 4', lineMean >= 2 && lineMean <= 4)
  const p10 = quantile(yearLines, 0.1)
  gate('Lines a normal year (p10)', p10, 'at least 1', p10 >= 1)
  gate('Worst stage repeat rate', worstRepeat, 'at most 10%', worstRepeat <= 0.1)
  gate('Lowest money seen', minGold, `at or above ${content.tuning.debtFloor}`, minGold >= content.tuning.debtFloor)
  gate(`Widest option spread (${worstDecision || 'none'})`, worstSpread, 'within 15%', worstSpread <= 0.15)
  gate('Lives with a remarkable event', remarkable, 'at least 80%', remarkable >= 0.8)
  gate('Lives with a pet', pets, 'at least 70%', pets >= 0.7)
  gate('Lives with a hobby', hobbies, 'at least 80%', hobbies >= 0.8)
  gate('Every trait moves an outcome 5 to 25%', traitsOk ? 1 : 0, 'all traits', traitsOk)

  const stats: Record<string, number | string> = {
    livesEnded: ended.length,
    livesRunning: all.length - ended.length,
    p10Age: quantile(ages, 0.1),
    p90Age: quantile(ages, 0.9),
    dailyDays: round(median(days('daily'))),
    meanYearTicksHourly: round(mean(runs.hourly!.flatMap((r) => r.years.map((y) => y.ticks)))),
    p90Lines: quantile(yearLines, 0.9),
    married: round(mean(ended.map((r) => (r.record!.counters.marriages > 0 ? 1 : 0)))),
    withChildren: round(mean(ended.map((r) => (r.record!.counters.childrenRaised > 0 ? 1 : 0)))),
    medianPeakMoney: median(ended.map((r) => r.record!.peakMoney)),
    housesOwned: round(mean(ended.map((r) => (r.record!.counters.housesOwned > 0 ? 1 : 0)))),
    willMade: round(mean(ended.filter((r) => r.record!.age >= 61).map((r) => (r.record!.will ? 1 : 0)))),
    ...Object.fromEntries(stages.map((s) => [`repeat.${s}`, round(repeatRate(s), 3)])),
  }
  return { lives: all.length, gates, stats, traits: traitTable }
}

/** A child's life after an hourly parent's, for the next-life rules. */
export function nextGeneration(run: LifeRun, content: PaperLivesCatalog = contentV1): LifeState | null {
  const heir = run.record?.heirs.find((h) => h.role === 'child')
  if (!run.record || !heir) return null
  return beginChild(run.record, heir.id, content, 1234).life
}

function main() {
  const args = process.argv.slice(2)
  const livesArg = args.indexOf('--lives')
  const lives = livesArg >= 0 ? Number(args[livesArg + 1]) : 400
  if (args.includes('--story')) {
    const run = simulateLifeRun(POLICIES[0]!, Number(args[args.indexOf('--story') + 1] ?? 0) || 0, 60, contentV1, undefined, true)
    for (const e of run.story) if (e.kind !== 'ambient') console.log(`${String(e.age).padStart(3)}  ${e.kind.padEnd(17)} ${e.summary}`)
    console.log(run.record ? `\n${run.record.first} ${run.record.last}, ${run.record.age}. ${run.record.epitaph}` : '\n(still living)')
    return
  }
  const report = runHarness(lives)
  if (args.includes('--json')) {
    console.log(JSON.stringify(report, null, 2))
    return
  }
  console.log(`Paper Lives harness: ${report.lives} lives`)
  for (const g of report.gates) console.log(`${g.pass ? 'PASS' : 'FAIL'}  ${g.name.padEnd(44)} ${String(g.value).padStart(10)}  (${g.target})`)
  console.log('\nStats')
  for (const [k, v] of Object.entries(report.stats)) console.log(`  ${k.padEnd(24)} ${v}`)
  console.log('\nTraits (relative change with the trait)')
  for (const [id, row] of Object.entries(report.traits)) console.log(`  ${id.padEnd(10)} ${Object.entries(row).map(([k, v]) => `${k} ${v}`).join('  ')}`)
}

if (import.meta.url === `file://${process.argv[1]}`) main()
