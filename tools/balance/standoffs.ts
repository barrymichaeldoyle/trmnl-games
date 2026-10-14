/**
 * Dug-in elites harness (D163, slice E1). Runs the balance cohorts under a catalog with the standoff rule and under the
 * one before it, the same heroes and seeds, and reports what the spec's gate asks: standoffs per hero-week once a hero
 * is eligible (level 12), the share won, fight ticks and wall ticks to a win, why the others ended, and the change in
 * knockouts per hero-day at level 12+ and in day-N XP and gold medians. Heroes take the three stances in turn. The
 * harness player never walks away and stays to finish a standoff instead of travelling (run.ts `visit`). Usage:
 *   pnpm balance:standoffs [--heroes 150] [--days 90] [--content v24] [--json out.json]
 * Never touches a database.
 */
import { writeFileSync } from 'node:fs'
import { pathToFileURL } from 'node:url'
import { catalogs, type CatalogId } from '@trmnl-games/desk-crawler/content'
import type { ContentCatalog, StanceId } from '@trmnl-games/desk-crawler/sim/core/types'
import { POLICIES, simulateCohort, type HeroLog, type Policy, type TickObserver } from './run'

const TICKS_PER_DAY = 96
const STANCES: readonly StanceId[] = ['cautious', 'balanced', 'bold']
const COHORTS = ['daily', 'three-day', 'seven-day', 'unattended'] as const

interface Tally {
  starts: number
  wins: number
  knockouts: number
  clocks: number
  other: number
  fightTicksToWin: number[]
  ticksToWin: number[]
  /** Ticks a hero spent at level 12 or above, the standoff's eligibility. */
  eligibleTicks: number
  deathsEligible: number
}

const emptyTally = (): Tally => ({ starts: 0, wins: 0, knockouts: 0, clocks: 0, other: 0, fightTicksToWin: [], ticksToWin: [], eligibleTicks: 0, deathsEligible: 0 })

function observe(tally: Tally, minLevel: number): TickObserver {
  const open = new Map<number, { started: number; fights: number }>()
  return (index, tick, before, result) => {
    if (before.level >= minLevel) {
      tally.eligibleTicks += 1
      tally.deathsEligible += result.metrics.deaths
    }
    const outcome = result.event?.detail.outcome
    if (result.metrics.standoffStarts) {
      tally.starts += 1
      open.set(index, { started: tick, fights: 0 })
    }
    const track = open.get(index)
    if (track !== undefined && outcome?.variant === 'combat' && outcome.standoff !== undefined) track.fights += 1
    if (result.metrics.standoffWins) {
      tally.wins += 1
      if (track !== undefined) {
        tally.fightTicksToWin.push(track.fights)
        tally.ticksToWin.push(tick - track.started + 1)
      }
      open.delete(index)
    } else if (result.metrics.standoffEnds) {
      if (result.metrics.deaths) tally.knockouts += 1
      else if (outcome?.variant === 'standoff_left' || (before.standoff !== undefined && tick >= before.standoff.untilTick)) tally.clocks += 1
      else tally.other += 1
      open.delete(index)
    }
  }
}

const median = (values: readonly number[]): number => {
  if (values.length === 0) return NaN
  const sorted = [...values].sort((a, b) => a - b)
  return sorted[Math.floor(sorted.length / 2)]!
}
const round1 = (n: number) => Math.round(n * 10) / 10
const change = (from: number, to: number) => (from === 0 ? 0 : round1(((to - from) * 100) / from))

function cohort(policy: Policy, heroes: number, days: number, content: ContentCatalog): { tally: Tally; logs: HeroLog[] } {
  const tally = emptyTally()
  const minLevel = content.standoff?.minLevel ?? 12
  const logs: HeroLog[] = []
  // The same heroes under each stance; the observer's index is per stance run, so offset it to keep heroes apart.
  STANCES.forEach((stance, s) => {
    const observer = observe(tally, minLevel)
    logs.push(...simulateCohort(policy, Math.ceil(heroes / STANCES.length), days, content, days * TICKS_PER_DAY, stance, 'warrior', (index, tick, before, result) => observer(index + s * 1_000_000, tick, before, result)))
  })
  return { tally, logs }
}

function args() {
  const argv = process.argv.slice(2)
  const value = (flag: string) => {
    const i = argv.indexOf(flag)
    return i >= 0 ? argv[i + 1] : undefined
  }
  const content = (value('--content') ?? 'v24') as CatalogId
  const ids = Object.keys(catalogs) as CatalogId[]
  const before = ids[ids.indexOf(content) - 1]
  if (catalogs[content]?.standoff === undefined || before === undefined) throw new Error(`${content} has no standoff rule`)
  return { heroes: Number(value('--heroes') ?? 150), days: Number(value('--days') ?? 90), content, before, json: value('--json') }
}

export function report(heroes: number, days: number, content: CatalogId, before: CatalogId) {
  const rows = COHORTS.map((name) => {
    const policy = POLICIES.find((p) => p.name === name)!
    const withRule = cohort(policy, heroes, days, catalogs[content])
    const without = cohort(policy, heroes, days, catalogs[before])
    const t = withRule.tally
    const weeks = t.eligibleTicks / (7 * TICKS_PER_DAY)
    const xp = (logs: HeroLog[]) => median(logs.map((l) => l.dailyXp.reduce((a, b) => a + b, 0)))
    const gold = (logs: HeroLog[]) => median(logs.map((l) => l.goldEarned))
    const deathsPerDay = (x: Tally) => (x.eligibleTicks === 0 ? 0 : (x.deathsEligible * TICKS_PER_DAY) / x.eligibleTicks)
    return {
      cohort: name,
      eligibleHeroWeeks: round1(weeks),
      standoffsPerHeroWeek: weeks === 0 ? 0 : round1(t.starts / weeks),
      starts: t.starts,
      winShare: t.starts === 0 ? 0 : round1((t.wins * 100) / t.starts),
      ended: { won: t.wins, knockout: t.knockouts, clock: t.clocks, other: t.other },
      medianFightTicksToWin: median(t.fightTicksToWin),
      medianTicksToWin: median(t.ticksToWin),
      knockoutsPerHeroDayAt12: { before: round1(deathsPerDay(without.tally) * 100) / 100, after: round1(deathsPerDay(t) * 100) / 100, changePct: change(deathsPerDay(without.tally), deathsPerDay(t)) },
      xpMedianChangePct: change(xp(without.logs), xp(withRule.logs)),
      goldEarnedMedianChangePct: change(gold(without.logs), gold(withRule.logs)),
      finalLevelMedian: { before: median(without.logs.map((l) => l.finalLevel)), after: median(withRule.logs.map((l) => l.finalLevel)) },
    }
  })
  return { content, before, heroes, days, rows }
}

function main() {
  const { heroes, days, content, before, json } = args()
  const result = report(heroes, days, content, before)
  console.log(JSON.stringify(result, null, 2))
  if (json) writeFileSync(json, JSON.stringify(result, null, 2))
}

if (process.argv[1] && import.meta.url === pathToFileURL(process.argv[1]).href) main()
