/**
 * Lost-property harness (D145, slice L1). Runs a whole world of heroes tick by tick with the real pure simulator,
 * with raids and meetings as in production (a synthetic pool and ledger, as tools/balance/meetings.ts does), plus a
 * synthetic lost-property table: one row per hero at most, written at its knockout, picked by a finder on the same
 * floor from the first lying row at or after the plan's shard, and deleted when the owner has been told. The
 * baseline is the same world without graveyard seeds, so no spare drops. Usage:
 *   pnpm balance:lost-property [--heroes 300] [--days 30] [--policy three-day] [--content v21] [--json out.json]
 * Heroes take the three stances in turn. Never touches a database.
 */
import { writeFileSync } from 'node:fs'
import { pathToFileURL } from 'node:url'
import { catalogs, type CatalogId } from '@trmnl-games/desk-crawler/content'
import { applyItemChanges } from '@trmnl-games/desk-crawler/sim/core/apply'
import { canMeet, canRaid } from '@trmnl-games/desk-crawler/sim/core/career'
import { planFind } from '@trmnl-games/desk-crawler/sim/core/lostProperty'
import { effectiveStats } from '@trmnl-games/desk-crawler/sim/core/modifiers'
import { planMeeting } from '@trmnl-games/desk-crawler/sim/core/meeting'
import { planRaid } from '@trmnl-games/desk-crawler/sim/core/raid'
import { createRng } from '@trmnl-games/desk-crawler/sim/core/rng'
import { simulateHero, SIMULATION_VERSION } from '@trmnl-games/desk-crawler/sim/core/simulate'
import { starterHero, starterKit } from '@trmnl-games/desk-crawler/sim/core/starter'
import type { ContentCatalog, HeroState, IncomingFound, IncomingMeeting, IncomingRaid, ItemSnapshot, LostSpare, MeetingPartner, RaidTarget, SpareDrop, StanceId, StreamSeeds } from '@trmnl-games/desk-crawler/sim/core/types'
import { HARNESS_EPOCH, harnessOffset, POLICIES, visit, type Policy } from './run'

const TICKS_PER_DAY = 96
const SLOT_MS = 15 * 60 * 1000
const STANCES: readonly StanceId[] = ['cautious', 'balanced', 'bold']

/** The meetings harness's seven streams plus an eighth `graveyard` seed drawn after them, so the first seven are unchanged. */
function streams(heroIndex: number, tick: number, graveyard: boolean): StreamSeeds {
  const base = createRng((heroIndex * 0x9e3779b1 + tick * 0x85ebca77) >>> 0)
  const next = () => Math.floor(base.next() * 2 ** 32)
  const seeds = { encounter: next(), combat: next(), reward: next(), narrative: next(), quest: next(), raid: next(), meeting: next() }
  return graveyard ? { ...seeds, graveyard: next() } : seeds
}

interface SpareRow {
  readonly owner: HeroRun
  drop: SpareDrop
  found?: { finder: HeroRun; tick: number }
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
  spare: SpareRow | undefined
  dropped: number
  replaced: number
  gearFinds: number
  workbenchGold: number
  reachTick: Map<number, number>
}

export interface LostPropertyStanceReport {
  heroes: number
  deathsPerHeroDay: number
  droppedPerHeroDay: number
  foundPerHeroDay: number
  spareShareOfGearFindsPct: number
  level8MedianDays: number | string
  level12MedianDays: number | string
  finalLevelMedian: number
  finalGoldMedian: number
  goldEarnedMedian: number
  workbenchGoldMedian: number
}

export interface LostPropertyWorldReport {
  stances: Record<StanceId, LostPropertyStanceReport>
  all: {
    dropped: number
    found: number
    told: number
    replacedUnfound: number
    lyingAtEnd: number
    lyingTicks: { median: number; p90: number; max: number }
    noticeWaitTicks: { median: number; p90: number; max: number }
    droppedPerFloor: Record<string, number>
    foundPerFloor: Record<string, number>
  }
}

const median = (values: readonly number[]): number => {
  const sorted = [...values].sort((a, b) => a - b)
  return sorted[Math.floor(sorted.length / 2)] ?? NaN
}
const percentile = (values: readonly number[], p: number): number => {
  const sorted = [...values].sort((a, b) => a - b)
  return sorted[Math.min(sorted.length - 1, Math.floor(p * sorted.length))] ?? NaN
}
const spread = (values: readonly number[]) => ({ median: values.length ? median(values) : 0, p90: values.length ? percentile(values, 0.9) : 0, max: values.length ? Math.max(...values) : 0 })
const round = (n: number, places = 2) => Math.round(n * 10 ** places) / 10 ** places

export function simulateLostPropertyWorld(content: ContentCatalog, heroes: number, days: number, policy: Policy, graveyard: boolean, poolSeed = 0x5eed): LostPropertyWorldReport {
  const ticks = days * TICKS_PER_DAY
  const kit = starterKit(content)
  const shardRng = createRng(poolSeed)
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
      spare: undefined,
      dropped: 0,
      replaced: 0,
      gearFinds: 0,
      workbenchGold: 0,
      reachTick: new Map(),
    }
    const id = () => `h${String(run.nextId++).padStart(6, '0')}`
    run.inventory = [{ ...kit.weapon, id: id() }, { ...kit.armor, id: id() }, { ...kit.potions, id: id() }]
    run.hero = { ...starterHero(`hero-${index}`, content, 0), weaponId: run.inventory[0]!.id, armorId: run.inventory[1]!.id, stance }
    runs.push(run)
  }
  const pick = <T extends { shard: number }>(rows: readonly T[], shard: number): T | undefined => {
    let best: T | undefined
    let first: T | undefined
    for (const row of rows) {
      if (first === undefined || row.shard < first.shard) first = row
      if (row.shard >= shard && (best === undefined || row.shard < best.shard)) best = row
    }
    return best ?? first
  }
  const raidCooldown = content.raids?.targetCooldownTicks ?? 0
  const meetingCooldown = content.meetings?.cooldownTicks ?? 0
  const lyingTicks: number[] = []
  const noticeWait: number[] = []
  const droppedPerFloor: Record<string, number> = {}
  const foundPerFloor: Record<string, number> = {}
  let told = 0

  for (let tick = 1; tick <= ticks; tick += 1) {
    const day = Math.floor((tick - 1) / TICKS_PER_DAY)
    for (const run of runs) {
      const offset = (run.index * 37) % TICKS_PER_DAY
      if (policy.everyDays > 0 && (tick - offset) % (policy.everyDays * TICKS_PER_DAY) === 0) {
        const visited = visit(run.hero, run.inventory, tick, content, policy, run.stance)
        ;({ hero: run.hero, inventory: run.inventory } = visited)
        run.workbenchGold += visited.workbenchGold
      }
      const seeds = streams(run.index, tick, graveyard)
      const available = (other: HeroRun) => other !== run && (other.hero.status === 'exploring' || other.hero.status === 'resting')
      let raidTarget: RaidTarget | undefined
      let raidCandidate: HeroRun | undefined
      const raidPlan = canRaid(content, run.hero.level) ? planRaid(seeds, run.hero.stance, content) : undefined
      if (raidPlan !== undefined) {
        const row = pick(runs, raidPlan.shard)
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
        const floor = run.hero.biomeId
        const row = pick(runs.filter((other) => other !== run && other.hero.biomeId === floor), meetingPlan.shard)
        if (row !== undefined && available(row) && canMeet(content, row.hero.level) && tick - row.metAtTick >= meetingCooldown && tick - run.metAtTick >= meetingCooldown) {
          partnerRun = row
          partner = { heroId: row.hero.id, name: row.name, class: row.hero.class }
        }
      }
      // D145: one lying spare on the hero's floor at or after the plan's shard, not its own, as the adapter takes it.
      let lostSpare: LostSpare | undefined
      let spareRow: SpareRow | undefined
      const findPlan = run.hero.status === 'exploring' ? planFind(seeds, content) : undefined
      if (findPlan !== undefined) {
        const lying = runs.flatMap((other) => (other.spare !== undefined && other.spare.found === undefined && other.spare.drop.biomeId === run.hero.biomeId ? [{ row: other.spare, shard: other.spare.drop.shard }] : []))
        const hit = pick(lying, findPlan.shard)?.row
        if (hit !== undefined && hit.owner !== run) {
          spareRow = hit
          const d = hit.drop
          lostSpare = { ownerHeroId: hit.owner.hero.id, ownerName: hit.owner.name, templateId: d.templateId, kind: d.kind, rarity: d.rarity, ...(d.affixId === undefined ? {} : { affixId: d.affixId }) }
        }
      }
      const own = run.spare
      const incomingFound: IncomingFound | undefined = own?.found === undefined ? undefined : { finderHeroId: own.found.finder.hero.id, finderName: own.found.finder.name, finderClass: own.found.finder.hero.class, templateId: own.drop.templateId, name: own.drop.name, biomeId: own.drop.biomeId, foundTick: own.found.tick }
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
        ...(lostSpare ? { lostSpare } : {}),
        ...(incomingFound ? { incomingFound } : {}),
      })
      if (result.event) run.recentSummaries = [result.event.summary, ...run.recentSummaries].slice(0, 2)
      if (result.raidLaunch && raidCandidate) {
        raidCandidate.raidedAtTick = tick
        raidCandidate.shard = raidPlan!.reshard
        raidCandidate.raids.push({ raiderHeroId: run.hero.id, raiderName: run.name, tick, raiderWon: result.raidLaunch.raiderWon, gold: result.raidLaunch.gold, targetHpPct: result.raidLaunch.targetHpPct, ...(result.raidLaunch.mishap ? { mishap: true as const } : {}) })
      }
      if (result.raidApplied) run.raids.shift()
      if (result.meetingLaunch && partnerRun) {
        run.metAtTick = tick
        partnerRun.metAtTick = tick
        partnerRun.shard = meetingPlan!.reshard
        partnerRun.meetings.push({ starterHeroId: run.hero.id, starterName: run.name, starterClass: run.hero.class, tick, kindId: result.meetingLaunch.kindId })
      }
      if (result.meetingApplied) run.meetings.shift()
      const outcome = result.event?.detail.outcome
      if (outcome?.variant === 'loot' && outcome.found === 'gear') run.gearFinds += 1
      if (result.spareFound && spareRow) {
        spareRow.found = { finder: run, tick }
        lyingTicks.push(tick - spareRow.drop.tick)
        foundPerFloor[spareRow.drop.biomeId] = (foundPerFloor[spareRow.drop.biomeId] ?? 0) + 1
      }
      if (result.foundApplied && own?.found) {
        noticeWait.push(tick - own.found.tick)
        run.spare = undefined
        told += 1
      }
      if (result.spareDropped) {
        // The adapter overwrites a lying spare; a found one waiting to be told keeps the core from dropping at all.
        if (run.spare !== undefined && run.spare.found === undefined) run.replaced += 1
        run.spare = { owner: run, drop: result.spareDropped }
        run.dropped += 1
        droppedPerFloor[result.spareDropped.biomeId] = (droppedPerFloor[result.spareDropped.biomeId] ?? 0) + 1
      }
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
      const found = sum((run) => run.hero.counters.lostPropertyFound)
      const report: LostPropertyStanceReport = {
        heroes: group.length,
        deathsPerHeroDay: round(sum((run) => run.hero.counters.deaths) / heroDays, 3),
        droppedPerHeroDay: round(sum((run) => run.dropped) / heroDays, 3),
        foundPerHeroDay: round(found / heroDays, 3),
        spareShareOfGearFindsPct: round((found / Math.max(1, sum((run) => run.gearFinds))) * 100, 2),
        level8MedianDays: reach(8),
        level12MedianDays: reach(12),
        finalLevelMedian: median(group.map((run) => run.hero.level)),
        finalGoldMedian: median(group.map((run) => run.hero.gold)),
        goldEarnedMedian: median(group.map((run) => run.hero.counters.goldEarned)),
        workbenchGoldMedian: median(group.map((run) => run.workbenchGold)),
      }
      return [stance, report]
    }),
  ) as Record<StanceId, LostPropertyStanceReport>
  return {
    stances,
    all: {
      dropped: runs.reduce((total, run) => total + run.dropped, 0),
      found: lyingTicks.length,
      told,
      replacedUnfound: runs.reduce((total, run) => total + run.replaced, 0),
      lyingAtEnd: runs.filter((run) => run.spare !== undefined && run.spare.found === undefined).length,
      lyingTicks: spread(lyingTicks),
      noticeWaitTicks: spread(noticeWait),
      droppedPerFloor,
      foundPerFloor,
    },
  }
}

function args() {
  const argv = process.argv.slice(2)
  const get = (flag: string, fallback: string) => {
    const i = argv.indexOf(flag)
    return i >= 0 && argv[i + 1] !== undefined ? argv[i + 1]! : fallback
  }
  return { heroes: Number(get('--heroes', '300')), days: Number(get('--days', '30')), policy: get('--policy', 'three-day'), content: get('--content', 'v21') as CatalogId, json: get('--json', '') }
}

function main() {
  const options = args()
  const content = catalogs[options.content]
  if (!content?.lostProperty) throw new Error(`content ${options.content} has no lost-property rules`)
  const policy = POLICIES.find((p) => p.name === options.policy)
  if (!policy) throw new Error(`unknown policy ${options.policy}`)
  if (!Number.isSafeInteger(options.heroes) || options.heroes < 3 || options.heroes > 3000) throw new Error('--heroes must be an integer from 3 to 3000')
  if (!Number.isSafeInteger(options.days) || options.days < 1 || options.days > 120) throw new Error('--days must be an integer from 1 to 120')
  const started = Date.now()
  const withSpares = simulateLostPropertyWorld(content, options.heroes, options.days, policy, true)
  const baseline = simulateLostPropertyWorld(content, options.heroes, options.days, policy, false)
  // The noise floor: the same world without spares, its pool shuffled, so raid and meeting pairings differ.
  const control = simulateLostPropertyWorld(content, options.heroes, options.days, policy, false, 0xc0ffee)
  const meta = { reportVersion: 1, contentVersion: content.contentVersion, simulationVersion: SIMULATION_VERSION, heroes: options.heroes, days: options.days, policy: policy.name, lookPermille: content.lostProperty.lookPermille, seconds: (Date.now() - started) / 1000 }
  const out = { meta, withSpares, baseline: { stances: baseline.stances }, control: { stances: control.stances } }
  if (options.json) writeFileSync(options.json, JSON.stringify(out, null, 2) + '\n')
  console.log(JSON.stringify(meta))
  for (const stance of STANCES) {
    const r = withSpares.stances[stance]
    const b = baseline.stances[stance]
    const k = control.stances[stance]
    console.log(`\n== ${stance} (${r.heroes} heroes)`)
    console.log(`  knockouts/hero-day ${r.deathsPerHeroDay}; spares dropped ${r.droppedPerHeroDay}, found ${r.foundPerHeroDay} per hero-day; ${r.spareShareOfGearFindsPct}% of loot gear finds`)
    console.log(`  L8 median ${r.level8MedianDays}d (baseline ${b.level8MedianDays}d); L12 ${r.level12MedianDays}d (${b.level12MedianDays}d); final level median ${r.finalLevelMedian} (${b.finalLevelMedian}); final gold median ${r.finalGoldMedian} (${b.finalGoldMedian}; reshuffled pool ${k.finalGoldMedian})`)
    console.log(`  gold earned median ${r.goldEarnedMedian} (${b.goldEarnedMedian}; ${k.goldEarnedMedian}); workbench gold median ${r.workbenchGoldMedian} (${b.workbenchGoldMedian}; ${k.workbenchGoldMedian})`)
  }
  console.log(`\nall ${JSON.stringify(withSpares.all)}`)
}

if (process.argv[1] && import.meta.url === pathToFileURL(process.argv[1]).href) main()
