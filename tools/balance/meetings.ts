/**
 * Meetings harness (D141, slice M1). Runs a whole world of heroes tick by tick with the real pure simulator, a
 * synthetic pool (one row per hero at a random shard, grouped by floor, moved on every pick), raids from the whole
 * pool and meetings from the hero's floor, and a synthetic ledger for both (the starter inserts, the other side
 * applies at its next evaluation). The baseline is the same world without meeting seeds. Usage:
 *   pnpm balance:meetings [--heroes 300] [--days 30] [--policy three-day] [--content v20] [--json out.json]
 * Heroes take the three stances in turn. Never touches a database.
 */
import { writeFileSync } from 'node:fs'
import { pathToFileURL } from 'node:url'
import { catalogs, type CatalogId } from '@trmnl-games/desk-crawler/content'
import { applyItemChanges } from '@trmnl-games/desk-crawler/sim/core/apply'
import { canMeet, canRaid } from '@trmnl-games/desk-crawler/sim/core/career'
import { effectiveStats } from '@trmnl-games/desk-crawler/sim/core/modifiers'
import { planMeeting } from '@trmnl-games/desk-crawler/sim/core/meeting'
import { planRaid } from '@trmnl-games/desk-crawler/sim/core/raid'
import { createRng } from '@trmnl-games/desk-crawler/sim/core/rng'
import { simulateHero, SIMULATION_VERSION } from '@trmnl-games/desk-crawler/sim/core/simulate'
import { starterHero, starterKit } from '@trmnl-games/desk-crawler/sim/core/starter'
import type { ContentCatalog, HeroState, IncomingMeeting, IncomingRaid, ItemSnapshot, MeetingPartner, RaidTarget, StanceId, StreamSeeds } from '@trmnl-games/desk-crawler/sim/core/types'
import { HARNESS_EPOCH, harnessOffset, POLICIES, visit, type Policy } from './run'

const TICKS_PER_DAY = 96
const SLOT_MS = 15 * 60 * 1000
const STANCES: readonly StanceId[] = ['cautious', 'balanced', 'bold']

/** The run.ts streams plus a seventh `meeting` seed drawn after them, so the first six are unchanged. */
function streams(heroIndex: number, tick: number, meetings: boolean): StreamSeeds {
  const base = createRng((heroIndex * 0x9e3779b1 + tick * 0x85ebca77) >>> 0)
  const next = () => Math.floor(base.next() * 2 ** 32)
  const seeds = { encounter: next(), combat: next(), reward: next(), narrative: next(), quest: next(), raid: next() }
  return meetings ? { ...seeds, meeting: next() } : seeds
}

interface HeroRun {
  readonly index: number
  readonly stance: StanceId
  readonly name: string
  hero: HeroState
  inventory: ItemSnapshot[]
  nextId: number
  recentSummaries: string[]
  raids: IncomingRaid[]
  meetings: IncomingMeeting[]
  shard: number
  raidedAtTick: number
  metAtTick: number
  launches: number
  noPartner: number
  pendingWait: number[]
  meetingDays: Set<number>
  reachTick: Map<number, number>
  effectsAtCap: number
}

export interface MeetingStanceReport {
  heroes: number
  meetingsPerHeroDay: number
  startedPerHeroDay: number
  noPartnerSharePct: number
  heroDaysWithMeetingPct: number
  level8MedianDays: number | string
  level12MedianDays: number | string
  finalLevelMedian: number
  finalGoldMedian: number
}

export interface MeetingWorldReport {
  stances: Record<StanceId, MeetingStanceReport>
  all: { meetingsPerHeroDay: number; meetingsPerFloor: Record<string, number>; partnerWaitTicks: { median: number; p90: number; max: number }; kinds: Record<string, number>; raidsPerHeroDay: number; effectsAtCapTicks: number }
}

const median = (values: readonly number[]): number => {
  const sorted = [...values].sort((a, b) => a - b)
  return sorted[Math.floor(sorted.length / 2)] ?? NaN
}
const percentile = (values: readonly number[], p: number): number => {
  const sorted = [...values].sort((a, b) => a - b)
  return sorted[Math.min(sorted.length - 1, Math.floor(p * sorted.length))] ?? NaN
}
const round = (n: number, places = 2) => Math.round(n * 10 ** places) / 10 ** places

export function simulateMeetingWorld(content: ContentCatalog, heroes: number, days: number, policy: Policy, meetings: boolean): MeetingWorldReport {
  const ticks = days * TICKS_PER_DAY
  const kit = starterKit(content)
  const shardRng = createRng(0x5eed)
  const runs: HeroRun[] = []
  for (let index = 0; index < heroes; index += 1) {
    const stance = STANCES[index % STANCES.length]!
    const run: HeroRun = {
      index,
      stance,
      name: `Hero ${index}`,
      hero: undefined as unknown as HeroState,
      inventory: [],
      nextId: 0,
      recentSummaries: [],
      raids: [],
      meetings: [],
      shard: Math.floor(shardRng.next() * 2 ** 32),
      raidedAtTick: -Infinity,
      metAtTick: -Infinity,
      launches: 0,
      noPartner: 0,
      pendingWait: [],
      meetingDays: new Set(),
      reachTick: new Map(),
      effectsAtCap: 0,
    }
    const id = () => `h${String(run.nextId++).padStart(6, '0')}`
    run.inventory = [{ ...kit.weapon, id: id() }, { ...kit.armor, id: id() }, { ...kit.potions, id: id() }]
    run.hero = { ...starterHero(`hero-${index}`, content, 0), weaponId: run.inventory[0]!.id, armorId: run.inventory[1]!.id, stance }
    runs.push(run)
  }
  // The first row at or after a shard, wrapping once, among the rows that pass `where`; ties fall to index order.
  const pick = (shard: number, where: (run: HeroRun) => boolean): HeroRun | undefined => {
    let best: HeroRun | undefined
    let first: HeroRun | undefined
    for (const run of runs) {
      if (!where(run)) continue
      if (first === undefined || run.shard < first.shard) first = run
      if (run.shard >= shard && (best === undefined || run.shard < best.shard)) best = run
    }
    return best ?? first
  }
  const raidCooldown = content.raids?.targetCooldownTicks ?? 0
  const meetingCooldown = content.meetings?.cooldownTicks ?? 0
  const floorMeetings: Record<string, number> = {}
  const kinds: Record<string, number> = {}
  let raidsInvolved = 0

  for (let tick = 1; tick <= ticks; tick += 1) {
    const day = Math.floor((tick - 1) / TICKS_PER_DAY)
    for (const run of runs) {
      const offset = (run.index * 37) % TICKS_PER_DAY
      if (policy.everyDays > 0 && (tick - offset) % (policy.everyDays * TICKS_PER_DAY) === 0) {
        ;({ hero: run.hero, inventory: run.inventory } = visit(run.hero, run.inventory, tick, content, policy, run.stance))
      }
      const seeds = streams(run.index, tick, meetings)
      const available = (other: HeroRun) => other !== run && (other.hero.status === 'exploring' || other.hero.status === 'resting')
      let raidTarget: RaidTarget | undefined
      let raidCandidate: HeroRun | undefined
      const raidPlan = canRaid(content, run.hero.level) ? planRaid(seeds, run.hero.stance, content) : undefined
      if (raidPlan !== undefined) {
        // The adapter takes one row and gives up when it is not raidable.
        const row = pick(raidPlan.shard, () => true)
        if (row !== undefined && available(row) && canRaid(content, row.hero.level) && tick - row.raidedAtTick >= raidCooldown) {
          raidCandidate = row
          const thrifty = effectiveStats(content, row.hero, row.inventory, tick).modifiers.goldLossPct
          raidTarget = { heroId: row.hero.id, name: row.name, gold: row.hero.gold, ...(row.hero.stance ? { stance: row.hero.stance } : {}), ...(thrifty > 0 ? { goldLossPct: thrifty } : {}) }
        }
      }
      let partner: MeetingPartner | undefined
      let partnerRun: HeroRun | undefined
      const meetingPlan = raidTarget === undefined && canMeet(content, run.hero.level) ? planMeeting(seeds, content) : undefined
      if (meetingPlan !== undefined) {
        // One row on the hero's floor at or after the shard, skipping the hero itself, as the adapter does.
        const floor = run.hero.biomeId
        const row = pick(meetingPlan.shard, (other) => other !== run && other.hero.biomeId === floor)
        if (row !== undefined && available(row) && canMeet(content, row.hero.level) && tick - row.metAtTick >= meetingCooldown && tick - run.metAtTick >= meetingCooldown) {
          partnerRun = row
          partner = { heroId: row.hero.id, name: row.name, class: row.hero.class }
        }
      }
      const before = run.hero
      const result = simulateHero({
        hero: run.hero,
        inventory: run.inventory,
        tick,
        content,
        simulationVersion: SIMULATION_VERSION,
        streams: seeds,
        recentSummaries: run.recentSummaries,
        tickAt: HARNESS_EPOCH + tick * SLOT_MS,
        utcOffsetSeconds: harnessOffset(policy, run.index, day),
        ...(raidTarget ? { raidTarget } : {}),
        ...(partner ? { meetingPartner: partner } : {}),
        ...(run.raids[0] ? { incomingRaid: run.raids[0] } : {}),
        ...(run.meetings[0] ? { incomingMeeting: run.meetings[0] } : {}),
      })
      if (result.event) run.recentSummaries = [result.event.summary, ...run.recentSummaries].slice(0, 2)
      if (meetingPlan !== undefined && partner === undefined && result.metrics.encounter !== 'none') run.noPartner += 1
      if (result.raidLaunch && raidCandidate) {
        raidCandidate.raidedAtTick = tick
        raidCandidate.shard = raidPlan!.reshard
        raidCandidate.raids.push({ raiderHeroId: run.hero.id, raiderName: run.name, tick, raiderWon: result.raidLaunch.raiderWon, gold: result.raidLaunch.gold, targetHpPct: result.raidLaunch.targetHpPct, ...(result.raidLaunch.mishap ? { mishap: true as const } : {}) })
        raidsInvolved += 2
      }
      if (result.raidApplied) run.raids.shift()
      if (result.meetingLaunch && partnerRun) {
        run.launches += 1
        run.metAtTick = tick
        partnerRun.metAtTick = tick
        partnerRun.shard = meetingPlan!.reshard
        partnerRun.meetings.push({ starterHeroId: run.hero.id, starterName: run.name, starterClass: run.hero.class, tick, kindId: result.meetingLaunch.kindId })
        floorMeetings[run.hero.biomeId] = (floorMeetings[run.hero.biomeId] ?? 0) + 1
        kinds[result.meetingLaunch.kindId] = (kinds[result.meetingLaunch.kindId] ?? 0) + 1
      }
      if (result.meetingApplied) run.pendingWait.push(tick - run.meetings.shift()!.tick)
      if (result.event?.detail.outcome.variant === 'meeting') run.meetingDays.add(day)
      if ((result.nextHero.effects?.length ?? 0) >= 3) run.effectsAtCap += 1
      const id = () => `h${String(run.nextId++).padStart(6, '0')}`
      ;({ hero: run.hero, inventory: run.inventory } = applyItemChanges(result.nextHero, run.inventory, result.itemChanges, id))
      for (let level = before.level + 1; level <= run.hero.level; level += 1) if (!run.reachTick.has(level)) run.reachTick.set(level, tick)
    }
  }

  const stances = Object.fromEntries(
    STANCES.map((stance) => {
      const group = runs.filter((run) => run.stance === stance)
      const heroDays = group.length * days
      const sum = (f: (run: HeroRun) => number) => group.reduce((total, run) => total + f(run), 0)
      const reach = (level: number): number | string => {
        const m = median(group.map((run) => (run.reachTick.has(level) ? run.reachTick.get(level)! / TICKS_PER_DAY : Infinity)))
        return Number.isFinite(m) ? round(m, 1) : `>${days}`
      }
      const attempts = sum((run) => run.launches + run.noPartner)
      const report: MeetingStanceReport = {
        heroes: group.length,
        meetingsPerHeroDay: round(sum((run) => run.hero.counters.meetings) / heroDays, 3),
        startedPerHeroDay: round(sum((run) => run.launches) / heroDays, 3),
        noPartnerSharePct: attempts ? round((sum((run) => run.noPartner) / attempts) * 100, 1) : 0,
        heroDaysWithMeetingPct: round((sum((run) => run.meetingDays.size) / heroDays) * 100, 1),
        level8MedianDays: reach(8),
        level12MedianDays: reach(12),
        finalLevelMedian: median(group.map((run) => run.hero.level)),
        finalGoldMedian: median(group.map((run) => run.hero.gold)),
      }
      return [stance, report]
    }),
  ) as Record<StanceId, MeetingStanceReport>
  const waits = runs.flatMap((run) => run.pendingWait)
  const heroDays = runs.length * days
  return {
    stances,
    all: {
      meetingsPerHeroDay: round(runs.reduce((total, run) => total + run.hero.counters.meetings, 0) / heroDays, 3),
      meetingsPerFloor: floorMeetings,
      partnerWaitTicks: { median: waits.length ? median(waits) : 0, p90: waits.length ? percentile(waits, 0.9) : 0, max: waits.length ? Math.max(...waits) : 0 },
      kinds,
      raidsPerHeroDay: round(raidsInvolved / heroDays, 3),
      effectsAtCapTicks: runs.reduce((total, run) => total + run.effectsAtCap, 0),
    },
  }
}

function args() {
  const argv = process.argv.slice(2)
  const get = (flag: string, fallback: string) => {
    const i = argv.indexOf(flag)
    return i >= 0 && argv[i + 1] !== undefined ? argv[i + 1]! : fallback
  }
  return { heroes: Number(get('--heroes', '300')), days: Number(get('--days', '30')), policy: get('--policy', 'three-day'), content: get('--content', 'v20') as CatalogId, json: get('--json', '') }
}

function main() {
  const options = args()
  const content = catalogs[options.content]
  if (!content?.meetings) throw new Error(`content ${options.content} has no meeting rules`)
  const policy = POLICIES.find((p) => p.name === options.policy)
  if (!policy) throw new Error(`unknown policy ${options.policy}`)
  if (!Number.isSafeInteger(options.heroes) || options.heroes < 3 || options.heroes > 3000) throw new Error('--heroes must be an integer from 3 to 3000')
  if (!Number.isSafeInteger(options.days) || options.days < 1 || options.days > 120) throw new Error('--days must be an integer from 1 to 120')
  const started = Date.now()
  const withMeetings = simulateMeetingWorld(content, options.heroes, options.days, policy, true)
  const baseline = simulateMeetingWorld(content, options.heroes, options.days, policy, false)
  const { kinds: _kinds, ...rules } = content.meetings
  const meta = { reportVersion: 1, contentVersion: content.contentVersion, simulationVersion: SIMULATION_VERSION, heroes: options.heroes, days: options.days, policy: policy.name, meetings: rules, seconds: (Date.now() - started) / 1000 }
  const out = { meta, withMeetings, baseline: { stances: baseline.stances } }
  if (options.json) writeFileSync(options.json, JSON.stringify(out, null, 2) + '\n')
  console.log(JSON.stringify(meta))
  for (const stance of STANCES) {
    const r = withMeetings.stances[stance]
    const b = baseline.stances[stance]
    console.log(`\n== ${stance} (${r.heroes} heroes)`)
    console.log(`  meetings/hero-day ${r.meetingsPerHeroDay} (started ${r.startedPerHeroDay}); no partner ${r.noPartnerSharePct}%; hero-days with a meeting ${r.heroDaysWithMeetingPct}%`)
    console.log(`  L8 median ${r.level8MedianDays}d (baseline ${b.level8MedianDays}d); L12 ${r.level12MedianDays}d (${b.level12MedianDays}d); final level median ${r.finalLevelMedian} (${b.finalLevelMedian}); final gold median ${r.finalGoldMedian} (${b.finalGoldMedian})`)
  }
  console.log(`\nall ${JSON.stringify(withMeetings.all)}`)
}

if (process.argv[1] && import.meta.url === pathToFileURL(process.argv[1]).href) main()
