/**
 * Idle Angler content v2 harness (idle-angler-full.md "Economy", slice F1). Runs the real pure core over cohorts of
 * anglers in lockstep, so each weekend's Open can be ranked across the cohort and its medals paid on Monday, and reports
 * the spec's F1 gates.
 *   pnpm balance:idle-angler-v2              (100 anglers per cohort, 90 days)
 *   pnpm balance:idle-angler-v2 -- --json    (machine-readable report)
 */
import { contentV2 } from '@trmnl-games/idle-angler/content'
import {
  canFish,
  catchMatches,
  currentGoal,
  coolerOf,
  entersOpen,
  fillOrder,
  openPeriod,
  seasonAt,
  simulateAngler,
  speciesLogged,
  starterAngler,
  waterOf,
  type AnglerState,
  type BaitClass,
  type CatchRecord,
  type IdleAnglerCatalog,
  type SpeciesDef,
  type WaterId,
} from '@trmnl-games/idle-angler/sim'
import { baitFromCatch, buyAccess, buyBait, buyCharter, buyCooler, buyPegs, buyRod, mountCost, mountFish, nextCooler, nextPegs, nextRod, sell, tubsThatFit } from '@trmnl-games/idle-angler/sim/shop'
import { deriveAnglerSeeds, forecast } from '@trmnl-games/idle-angler/sim/seed'

export const TICKS_PER_DAY = 96
const SLOT_MS = 15 * 60_000
/** A Monday, so seasons and Opens line up with day boundaries: the week of 19 Oct 2026 is spring under v2. */
const START = Date.UTC(2026, 9, 19, 0, 5)

export interface Policy {
  readonly name: string
  /** Days between companion visits; 0 never visits. */
  readonly everyDays: number
  /** Puts fish on the hook as deadbait at waters with predators. */
  readonly deadbait?: boolean
  /** Books a charter whenever it can. */
  readonly charter?: boolean
}

interface Run {
  angler: AnglerState
  cooler: CatchRecord[]
  mounted: Set<string>
  readonly id: string
  readonly seed: string
  // measures
  dailyEarned: number[]
  dailyLanded: number[]
  orderPremium: number
  goalCoins: number
  openPrizes: number
  charterValue: number
  charterTickets: number
  ownedAllDay: number | null
  heronDay: number | null
  firstBucketFillHours: number | null
  openBest: Map<string, { grams: number; tick: number }>
  epics: Set<string>
  /** The angler at the end of day 60, for the idle-coins gate. */
  at60?: { gold: number; income: number; angler: AnglerState }
}

/** The price of the cheapest one-off purchase still to make, or 0 when everything is owned. */
function nextPrice(content: IdleAnglerCatalog, snapshot: { angler: AnglerState }): number {
  const a = snapshot.angler
  const prices = [nextRod(content, a)?.price, nextCooler(content, a)?.price, nextPegs(content, a)?.price, ...content.access.filter((x) => !a.access.includes(x.id)).map((x) => x.price)].filter((p): p is number => p !== undefined)
  return prices.length ? Math.min(...prices) : 0
}

const ONE_OFFS = (content: IdleAnglerCatalog) => ({ rods: content.rods.length, coolers: content.coolers.length, access: content.access.length, pegs: content.trophies!.pegs.at(-1)! })
const ownsAll = (content: IdleAnglerCatalog, a: AnglerState) => {
  const all = ONE_OFFS(content)
  return a.rodTier === all.rods && a.coolerTier === all.coolers && a.access.length === all.access && (a.pegs ?? 0) >= all.pegs
}

const speciesOf = (content: IdleAnglerCatalog, id: string) => content.species.find((s) => s.id === id)!

/** The water and bait a logbook-minded player picks: a teaching order's fish first, then the water with most left to log. */
function choose(content: IdleAnglerCatalog, a: AnglerState, at: number, policy: Policy): { water: WaterId; bait: BaitClass } {
  const season = seasonAt(content, at)
  const open = content.waters.filter((w) => canFish(content, a, w.id, at) && !(w.id === 'harbour_pier' && a.rodTier < 3))
  const baitsAt = (water: WaterId) => waterOf(content, water).baits.filter((b) => b !== 'deadbait')
  const teaching = a.orders?.find((o) => o.kind === 'teaching' && o.speciesId)
  if (teaching) {
    const s = speciesOf(content, teaching.speciesId!)
    if (open.some((w) => w.id === s.water)) return { water: s.water, bait: s.baits.find((b) => b !== 'deadbait') ?? baitsAt(s.water)[0]! }
  }
  if (open.some((w) => w.charter)) return { water: 'deep_sea', bait: 'strip' }
  const left = (water: WaterId) => content.species.filter((s) => s.water === water && a.logbook[s.id] === undefined && s.rarity !== 'epic' && (s.seasons === undefined || (season !== undefined && s.seasons.includes(season))))
  const ranked = [...open].sort((x, y) => left(y.id).length - left(x.id).length || content.waters.indexOf(y) - content.waters.indexOf(x))
  const water = ranked[0]!.id
  const todo = left(water)
  const bait = [...baitsAt(water)].sort((x, y) => todo.filter((s) => s.baits.includes(y)).length - todo.filter((s) => s.baits.includes(x)).length)[0]!
  if (policy.deadbait && (a.bait.deadbait ?? 0) > 0 && content.species.some((s) => s.water === water && s.baits.includes('deadbait'))) return { water, bait: 'deadbait' }
  return { water, bait }
}

function visit(content: IdleAnglerCatalog, run: Run, policy: Policy, at: number, day: number) {
  let a = run.angler
  const earn = (amount: number) => (run.dailyEarned[day]! += amount)
  // 1. Orders from the cooler, cheapest matching fish first.
  for (const order of [...(a.orders ?? [])]) {
    const matches = run.cooler.filter((f) => catchMatches(content, order, f)).sort((x, y) => x.value - y.value).slice(0, order.count)
    if (matches.length < order.count) continue
    const filled = fillOrder(content, a, order.id, matches)
    if (!filled.ok) continue
    a = filled.angler
    earn(filled.earned)
    run.orderPremium += filled.earned - matches.reduce((s, f) => s + f.value, 0)
    run.cooler = run.cooler.filter((f) => !matches.includes(f))
  }
  // 2. Mount one new species a visit while there is room and a reserve.
  const mountable = run.cooler.filter((f) => !run.mounted.has(f.speciesId) && mountCost(content, f) !== null).sort((x, y) => y.value - x.value)[0]
  if (mountable && a.gold - mountCost(content, mountable)! > 300) {
    const mounted = mountFish(content, a, mountable, run.mounted.size)
    if (mounted.ok) {
      a = mounted.angler
      run.mounted.add(mountable.speciesId)
      run.cooler = run.cooler.filter((f) => f !== mountable)
    }
  }
  // 3. Deadbait from small fish: the deadbait hunter always, everyone else once, for the goal.
  if (policy.deadbait || currentGoal(content, a)?.id === 'deadbait') {
    for (const fish of run.cooler.filter((f) => speciesOf(content, f.speciesId).baitFish)) {
      const used = baitFromCatch(content, a, fish)
      if (!used.ok) break
      a = used.angler
      run.cooler = run.cooler.filter((f) => f !== fish)
    }
  }
  // 4. Sell the rest.
  const values = run.cooler.map((f) => f.value)
  a = sell(a, values)
  earn(values.reduce((s, v) => s + v, 0))
  run.cooler = []
  // 5. Upgrades in a sensible order, saving for the next when it is not affordable.
  for (;;) {
    const options: Array<() => ReturnType<typeof buyRod>> = []
    if (nextCooler(content, a)?.tier === 2) options.push(() => buyCooler(content, a))
    if (canFish(content, { ...a, access: [...a.access, 'waders'] }, 'river_bend') && !a.access.includes('waders')) options.push(() => buyAccess(content, a, 'waders'))
    if (nextRod(content, a)?.tier === 2) options.push(() => buyRod(content, a))
    if (nextCooler(content, a)?.tier === 3) options.push(() => buyCooler(content, a))
    if (nextRod(content, a)?.tier === 3) options.push(() => buyRod(content, a))
    if (canFish(content, { ...a, access: [...a.access, 'pier_permit'] }, 'harbour_pier') && !a.access.includes('pier_permit')) options.push(() => buyAccess(content, a, 'pier_permit'))
    if (canFish(content, { ...a, access: [...a.access, 'rowing_boat'] }, 'heron_lake') && !a.access.includes('rowing_boat')) options.push(() => buyAccess(content, a, 'rowing_boat'))
    if (nextCooler(content, a)?.tier === 4) options.push(() => buyCooler(content, a))
    if (nextRod(content, a)?.tier === 4) options.push(() => buyRod(content, a))
    if (canFish(content, { ...a, access: [...a.access, 'ice_auger'] }, 'frozen_tarn') && !a.access.includes('ice_auger')) options.push(() => buyAccess(content, a, 'ice_auger'))
    if (run.mounted.size >= (a.pegs ?? 6) && nextPegs(content, a)) options.push(() => buyPegs(content, a))
    if (nextRod(content, a)?.tier === 5) options.push(() => buyRod(content, a))
    if (nextPegs(content, a) && ownsAllBut(content, a)) options.push(() => buyPegs(content, a))
    const first = options[0]
    if (!first) break
    const bought = first()
    if (!bought.ok) break
    a = bought.angler
  }
  // 6. A charter: the charter player whenever it can, others once everything else is owned and coins pile up.
  if ((a.charterCasts ?? 0) === 0 && (policy.charter || currentGoal(content, a)?.id === 'charter' || (ownsAll(content, a) && a.gold > 2000))) {
    const booked = buyCharter(content, a)
    if (booked.ok) {
      a = booked.angler
      run.charterTickets += 1
    }
  }
  // 7. Water and bait, with bait for about two coolers.
  const { water, bait } = choose(content, a, at, policy)
  if (water !== a.waterId) a = { ...a, travelTo: water }
  a = { ...a, baitOnHook: bait }
  if (bait !== 'deadbait') {
    const tub = content.baits.find((b) => b.class === bait)!.castsPerTub
    const want = Math.max(0, coolerOf(content, a.coolerTier).capacity * 2 - (a.bait[bait] ?? 0))
    for (let tubs = Math.min(tubsThatFit(content, a, bait), Math.ceil(want / tub)); tubs > 0; tubs -= 1) {
      const bought = buyBait(content, a, bait, tubs)
      if (bought.ok) {
        a = bought.angler
        earn(-bought.spent)
        break
      }
    }
  }
  run.angler = a
}

/** Everything but the last pegs: the late game's last sink. */
const ownsAllBut = (content: IdleAnglerCatalog, a: AnglerState) => {
  const all = ONE_OFFS(content)
  return a.rodTier === all.rods && a.coolerTier === all.coolers && a.access.length === all.access
}

export function runCohort(policy: Policy, anglers: number, days: number, content: IdleAnglerCatalog = contentV2): Run[] {
  const runs: Run[] = Array.from({ length: anglers }, (_, i) => ({
    angler: starterAngler(content, 0),
    cooler: [],
    mounted: new Set<string>(),
    id: `angler-${policy.name}-${i}`,
    seed: `harness-${i}`,
    dailyEarned: Array(days).fill(0),
    dailyLanded: Array(days).fill(0),
    orderPremium: 0,
    goalCoins: 0,
    openPrizes: 0,
    charterValue: 0,
    charterTickets: 0,
    ownedAllDay: null,
    heronDay: null,
    firstBucketFillHours: null,
    openBest: new Map(),
    epics: new Set(),
  }))
  let lastPeriod: string | null = null
  for (let tick = 1; tick <= days * TICKS_PER_DAY; tick += 1) {
    const at = START + (tick - 1) * SLOT_MS
    const day = Math.floor((tick - 1) / TICKS_PER_DAY)
    const hour = new Date(at).getUTCHours()
    const minute = new Date(at).getUTCMinutes()
    // Monday 00:10: medals for last weekend's Opens across the cohort.
    const period = openPeriod(at)
    if (lastPeriod !== null && period !== lastPeriod) award(content, runs, lastPeriod)
    lastPeriod = period
    for (const run of runs) {
      if (policy.everyDays > 0 && day % policy.everyDays === 0 && hour === 19 && minute === 5) visit(content, run, policy, at, day)
      const water = waterOf(content, run.angler.travelTo ?? run.angler.waterId)
      const before = run.angler
      const result = simulateAngler({ angler: run.angler, coolerCount: run.cooler.length, tick, tickAt: at, weather: forecast(run.seed, water, at, content), content, streams: deriveAnglerSeeds(run.seed, run.id, tick, 1) })
      run.angler = result.angler
      run.goalCoins += [result.event, ...(result.extraEvents ?? [])].filter((e) => e?.kind === 'goal').reduce((s, e) => s + e!.deltas.gold, 0)
      if (result.catch) run.cooler.push(result.catch)
      run.dailyLanded[day]! += result.metrics.landed
      const detail = result.event?.detail
      if (result.metrics.landed && detail?.speciesId && detail.grams !== undefined) {
        if (speciesOf(content, detail.speciesId).rarity === 'epic') run.epics.add(detail.speciesId)
        if (before.waterId === 'deep_sea' && result.catch) run.charterValue += result.catch.value
        if (entersOpen(content, before.waterId, detail.speciesId, at) && speciesLogged(content, run.angler.logbook) >= (content.unlocks?.opens ?? 0)) {
          const key = `${period}:${before.waterId}`
          const best = run.openBest.get(key)
          if (!best) run.angler = { ...run.angler, counters: { ...run.angler.counters, opensEntered: (run.angler.counters.opensEntered ?? 0) + 1 } }
          if (!best || detail.grams > best.grams) run.openBest.set(key, { grams: detail.grams, tick })
        }
      }
      if (run.ownedAllDay === null && ownsAll(content, run.angler)) run.ownedAllDay = tick / TICKS_PER_DAY
      if (tick === 60 * TICKS_PER_DAY) run.at60 = { gold: run.angler.gold, income: sum(run.dailyEarned.slice(53, 60)) / 7, angler: run.angler }
      if (run.heronDay === null && run.angler.waterId === 'heron_lake') run.heronDay = tick / TICKS_PER_DAY
      if (run.firstBucketFillHours === null && run.cooler.length >= 6 && run.angler.coolerTier === 1) run.firstBucketFillHours = tick / 4
    }
  }
  return runs
}

function award(content: IdleAnglerCatalog, runs: Run[], period: string) {
  const byWater = new Map<string, Array<{ run: Run; grams: number; tick: number }>>()
  for (const run of runs) {
    for (const [key, best] of run.openBest) {
      if (!key.startsWith(`${period}:`)) continue
      const water = key.slice(period.length + 1)
      byWater.set(water, [...(byWater.get(water) ?? []), { run, ...best }])
    }
  }
  for (const entries of byWater.values()) {
    entries.sort((x, y) => y.grams - x.grams || x.tick - y.tick)
    entries.slice(0, 3).forEach((entry, place) => {
      const prize = content.opens!.prizes[place]!
      const a = entry.run.angler
      entry.run.angler = { ...a, gold: a.gold + prize, counters: { ...a.counters, medals: (a.counters.medals ?? 0) + 1, goldEarned: a.counters.goldEarned + prize } }
      entry.run.openPrizes += prize
    })
  }
}

/** Value a day landed at one water with all gear, deadbait against a tub bait (gate 5). */
export function baitComparison(content: IdleAnglerCatalog, water: WaterId, bait: BaitClass, anglers: number, days: number): number {
  let total = 0
  for (let i = 0; i < anglers; i += 1) {
    let a: AnglerState = { ...starterAngler(content, 0), rodTier: content.rods.length, coolerTier: content.coolers.length, access: content.access.map((x) => x.id), waterId: water, baitOnHook: bait, logbook: Object.fromEntries(content.species.map((s) => [s.id, { count: 1, bestGrams: 1, firstTick: 0 }])) }
    for (let tick = 1; tick <= days * TICKS_PER_DAY; tick += 1) {
      const at = START + (tick - 1) * SLOT_MS
      a = { ...a, bait: { [bait]: 24 } }
      const result = simulateAngler({ angler: a, coolerCount: 0, tick, tickAt: at, weather: forecast(`cmp-${i}`, waterOf(content, water), at, content), content, streams: deriveAnglerSeeds(`cmp-${i}`, `cmp-${bait}-${i}`, tick, 1) })
      a = result.angler
      if (result.catch) total += result.catch.value
    }
  }
  return total / anglers / days
}

/** Share of anglers fishing for an epic, at its water with its bait and every upgrade, who land one in `days` from `startDay`. */
export function epicShare(content: IdleAnglerCatalog, species: SpeciesDef, anglers: number, startDay: number, days: number): number {
  let caught = 0
  for (let i = 0; i < anglers; i += 1) {
    const bait = species.baits[0]!
    let a: AnglerState = { ...starterAngler(content, 0), rodTier: content.rods.length, coolerTier: content.coolers.length, access: content.access.map((x) => x.id), waterId: species.water, baitOnHook: bait, charterCasts: 10_000, logbook: Object.fromEntries(content.species.map((s) => [s.id, { count: 1, bestGrams: 1, firstTick: 0 }])) }
    for (let tick = 1; tick <= days * TICKS_PER_DAY; tick += 1) {
      const at = START + (startDay * TICKS_PER_DAY + tick - 1) * SLOT_MS
      const { travelTo: _away, ...settled } = a
      a = { ...settled, waterId: species.water, bait: { [bait]: 24 }, charterCasts: 10_000 }
      const result = simulateAngler({ angler: a, coolerCount: 0, tick, tickAt: at, weather: forecast(`epic-${i}`, waterOf(content, species.water), at, content), content, streams: deriveAnglerSeeds(`epic-${i}`, `epic-${species.id}-${i}`, tick, 1) })
      a = result.angler
      if (result.metrics.landed && result.event?.detail.speciesId === species.id) {
        caught += 1
        break
      }
    }
  }
  return caught / anglers
}

const median = (values: number[]): number | null => {
  if (values.length === 0) return null
  const sorted = [...values].sort((a, b) => a - b)
  const mid = Math.floor(sorted.length / 2)
  return sorted.length % 2 ? sorted[mid]! : (sorted[mid - 1]! + sorted[mid]!) / 2
}
const round = (value: number | null, places = 2) => (value === null ? null : Math.round(value * 10 ** places) / 10 ** places)
const sum = (values: number[]) => values.reduce((a, b) => a + b, 0)

export interface Gate {
  readonly name: string
  readonly value: number | null
  readonly min: number
  readonly max: number
  readonly pass: boolean
}
const gate = (name: string, value: number | null, min: number, max: number): Gate => ({ name, value: round(value), min, max, pass: value !== null && value >= min && value <= max })

/** The first day of a season's week on or after the start. */
const seasonStartDay = (content: IdleAnglerCatalog, season: string) => {
  for (let week = 0; week < 8; week += 1) if (seasonAt(content, START + week * 7 * 86_400_000) === season) return week * 7
  return 0
}

export function runHarness(anglers = 100, days = 90, content: IdleAnglerCatalog = contentV2) {
  const daily = runCohort({ name: 'daily', everyDays: 1 }, anglers, days, content)
  const threeDay = runCohort({ name: 'three-day', everyDays: 3 }, anglers, days, content)
  const weekly = runCohort({ name: 'weekly', everyDays: 7 }, anglers, days, content)
  const never = runCohort({ name: 'never', everyDays: 0 }, Math.max(20, anglers / 2), days, content)
  const charter = runCohort({ name: 'charter', everyDays: 1, charter: true }, Math.max(20, anglers / 2), Math.min(days, 60), content)
  const income = (run: Run, upTo: number) => sum(run.dailyEarned.slice(0, upTo))
  const daily60 = daily.map((r) => r.at60 ?? { gold: r.angler.gold, income: sum(r.dailyEarned.slice(-7)) / 7, angler: r.angler })
  const lastWeekIncome = (run: Run, d: number) => sum(run.dailyEarned.slice(d - 7, d)) / 7
  const deadbaitWater: WaterId = 'river_bend'
  const tubBaits: BaitClass[] = ['worms', 'maggots', 'spinner']
  const bestTub = Math.max(...tubBaits.map((b) => baitComparison(content, deadbaitWater, b, 20, 14)))
  const deadbait = baitComparison(content, deadbaitWater, 'deadbait', 20, 14)
  const epics = content.species.filter((s) => s.rarity === 'epic')
  const epicShares = Object.fromEntries(
    epics.map((s) => {
      const water = waterOf(content, s.water)
      const season = s.seasons?.[0] ?? water.openIn?.[0]
      return [s.id, season ? epicShare(content, s, 40, seasonStartDay(content, season), 7) : epicShare(content, s, 40, 0, 30)]
    }),
  )
  const gates = [
    gate('Millpond fish a day, first two days (daily player)', median(daily.map((r) => (r.dailyLanded[0]! + r.dailyLanded[1]!) / 2)), 10, 14),
    gate('Hours to fill the Bucket the first time (daily player)', median(daily.map((r) => r.firstBucketFillHours ?? days * 24)), 8, 14),
    gate('Day a daily player owns every one-off purchase', median(daily.map((r) => r.ownedAllDay ?? days + 1)), 45, 75),
    // F1: coins saved toward the next one-off purchase are not idle; the gate reads what is left over beyond it.
    gate('Idle coins at day 60 in days of own income (daily player)', median(daily60.map((r) => Math.max(0, r.gold - nextPrice(content, r)) / Math.max(1, r.income))), 0, 10),
    gate("A charter's catch value against its ticket (charter player)", median(charter.filter((r) => r.charterTickets > 0).map((r) => r.charterValue / (r.charterTickets * content.charterTicket!.price))), 1.2, 1.8),
    gate('Order premiums as a share of income (daily player)', sum(daily.map((r) => r.orderPremium)) / Math.max(1, sum(daily.map((r) => income(r, days)))), 0, 0.25),
    gate('Deadbait coins a day against the best tub bait at River Bend', deadbait / bestTub, 0.9, 1.3),
    gate('Goal coins as a share of 60-day income (daily player)', sum(daily.map((r) => r.goalCoins)) / Math.max(1, sum(daily.map((r) => income(r, 60)))), 0, 0.06),
    gate('Species logged at day 90 (daily player following orders)', median(daily.map((r) => Object.keys(r.angler.logbook).length)), 40, 52),
    gate('Species logged at day 90 (three-day player)', median(threeDay.map((r) => Object.keys(r.angler.logbook).length)), 30, 58),
    gate('Day a weekly player reaches Heron Lake', median(weekly.map((r) => r.heronDay ?? days + 1)), 0, 75),
    gate('Species logged at day 90, never visiting', median(never.map((r) => Object.keys(r.angler.logbook).length)), 3, 58),
    gate('Opens entered by day 90, never visiting', median(never.map((r) => r.angler.counters.opensEntered ?? 0)), 1, 99),
    ...epics.map((s) => gate(`Share catching a ${s.name} in its window at its water`, epicShares[s.id]!, 0.5, 1)),
  ]
  const detail = (runs: Run[], d: number) => ({
    species: median(runs.map((r) => Object.keys(r.angler.logbook).length)),
    coins: median(runs.map((r) => r.angler.gold)),
    rod: median(runs.map((r) => r.angler.rodTier)),
    cooler: median(runs.map((r) => r.angler.coolerTier)),
    access: median(runs.map((r) => r.angler.access.length)),
    pegs: median(runs.map((r) => r.angler.pegs ?? 6)),
    goal: median(runs.map((r) => r.angler.goal?.rung ?? 0)),
    ordersFilled: median(runs.map((r) => r.angler.counters.ordersFilled ?? 0)),
    medals: median(runs.map((r) => r.angler.counters.medals ?? 0)),
    trophies: median(runs.map((r) => r.mounted.size)),
    incomeLastWeek: round(median(runs.map((r) => lastWeekIncome(r, d)))),
    ownedAllDay: median(runs.map((r) => r.ownedAllDay ?? d + 1)),
    heronDay: median(runs.map((r) => r.heronDay ?? d + 1)),
  })
  return {
    anglers,
    days,
    gates,
    detail: { daily: detail(daily, days), threeDay: detail(threeDay, days), weekly: detail(weekly, days), never: detail(never, days), charter: { ...detail(charter, Math.min(days, 60)), tickets: median(charter.map((r) => r.charterTickets)) }, deadbait: { deadbait: round(deadbait), bestTub: round(bestTub) }, epicShares },
  }
}

if (import.meta.url === `file://${process.argv[1]}`) {
  const report = runHarness()
  if (process.argv.includes('--json')) console.log(JSON.stringify(report, null, 2))
  else {
    for (const g of report.gates) console.log(`${g.pass ? 'PASS' : 'FAIL'}  ${g.name}: ${g.value} (gate ${g.min} to ${g.max})`)
    console.log(JSON.stringify(report.detail, null, 2))
  }
}
