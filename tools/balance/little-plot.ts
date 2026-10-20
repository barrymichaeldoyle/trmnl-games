/**
 * Little Plot balance harness (little-plot.md "Economy and the harness", G1). Runs the real pure core over simulated
 * plots for four players and reports the spec's gates.
 *   pnpm balance:little-plot                (300 plots per policy, 60 days)
 *   pnpm balance:little-plot -- --plots 100
 *   pnpm balance:little-plot -- --json
 *   pnpm balance:little-plot -- --story     (print one daily plot's story)
 */
import { createRng, pickOne } from '@trmnl-games/engine/rng'
import { ACTIVE_CONTENT, catalogs } from '@trmnl-games/little-plot/content'
import { drawForecast } from '@trmnl-games/engine/forecast'
import { buyItem, buySeed, childrenOf, derivePlotSeeds, itemOnShelf, kindOf, kindsGrown, neighbours, pick, pickAll, seasonAt, seedOnShelf, simulatePlot, sow, stageOf, starterPlot, water, claimGoalReward, receiveSeed, spareSeeds, type KindDef, type LittlePlotCatalog, type PlotState, type TickEvent, type Weather } from '@trmnl-games/little-plot/sim'

const CONTENT = catalogs[ACTIVE_CONTENT]
export const TICKS_PER_DAY = 96
const WORLD = 'harness-world'
/** The Millpond's year-round weights (Idle Angler content v1), so the harness sees the same sky the game will. */
const MILLPOND: ReadonlyArray<readonly [Weather, number]> = [['clear', 45], ['overcast', 30], ['rain', 15], ['fog', 10]]
/** Monday 2026-10-19 00:00 UTC, a spring week on the shared calendar. */
const START_AT = Date.UTC(2026, 9, 19)

export interface Policy {
  readonly name: 'never' | 'threeDay' | 'daily' | 'twiceDaily'
  visits(tick: number): boolean
}

export const POLICIES: readonly Policy[] = [
  { name: 'never', visits: () => false },
  { name: 'threeDay', visits: (tick) => tick % (3 * TICKS_PER_DAY) === 19 * 4 },
  { name: 'daily', visits: (tick) => tick % TICKS_PER_DAY === 19 * 4 },
  { name: 'twiceDaily', visits: (tick) => tick % TICKS_PER_DAY === 8 * 4 || tick % TICKS_PER_DAY === 19 * 4 },
]

/** What the visiting player buys, cheapest useful first. */
const SHOPPING = ['beds_6', 'copper_tape', 'netting', 'brass_can', 'fence', 'beds_9', 'lantern', 'scarecrow', 'gnome_trap', 'compost_bin', 'bird_table', 'trowel', 'hose', 'pond', 'garden_cat', 'beehive', 'beds_12', 'greenhouse', 'hose_timer', 'greenhouse_2'] as const

export interface PlotRun {
  readonly policy: Policy['name']
  readonly index: number
  readonly final: PlotState
  readonly firstRipeTick: number | null
  readonly firstCrossTick: number | null
  readonly epicTicks: Record<string, number>
  readonly kindsByDay: number[]
  readonly shedDoneDay: number | null
  readonly greenhouseDay: number | null
  readonly pestEvents: number
  readonly deterred: number
  readonly visits: number
  /** Visits and night ticks once both the lantern and the cat are owned, for the defended rate. */
  readonly defendedVisits: number
  readonly defendedNightTicks: number
  readonly ripeToSeed: number
  readonly ripenings: number
  readonly setbackStages: number
  readonly stories: TickEvent[]
}

/** The weather of the Millpond at this moment, as the backend will read it from Idle Angler's seed. */
const weatherAt = (at: number): Weather => drawForecast(WORLD, 'millpond', at, MILLPOND)

/**
 * The visiting player's turn: pick everything ripe, claim rewards, buy one item, buy seeds of kinds not yet grown and
 * the parents of ungrown crosses, sow (new kinds first, then a pair of parents across two empty beds, then the rarest
 * seed in season), water.
 */
function visit(plot: PlotState, content: LittlePlotCatalog, tick: number, at: number): PlotState {
  let next = plot
  if (next.beds.some((b) => b.kindId !== undefined && stageOf(b, kindOf(content, b.kindId)) === 'ripe')) {
    const r = pickAll(next, content, tick, at)
    if (r.ok) next = r.plot
  }
  for (;;) {
    const c = claimGoalReward(next)
    if (!c.ok) break
    next = c.plot
  }
  for (const id of SHOPPING) {
    const item = content.items.find((i) => i.id === id)!
    if (!itemOnShelf(item, content, next, tick).shown) continue
    const r = buyItem(next, content, id, tick)
    if (r.ok) next = r.plot
    break
  }
  const ungrownCrosses = content.kinds.filter((k) => k.parents && k.parents[0] !== k.parents[1] && next.catalogue[k.id] === undefined && (next.tin[k.id] ?? 0) === 0 && !next.beds.some((b) => b.crossedKindId === k.id || b.kindId === k.id) && (k.needs === undefined || next.items.includes(k.needs)))
  const wanted = new Set(ungrownCrosses.flatMap((k) => k.parents!))
  // Seeds: one of each kind never grown, then the parents of the crosses still to find, while coins stay for the shed.
  for (const kind of [...content.kinds].sort((a, b) => Number(next.catalogue[a.id] !== undefined) - Number(next.catalogue[b.id] !== undefined) || Number(wanted.has(b.id)) - Number(wanted.has(a.id)))) {
    if (!seedOnShelf(kind, content, next)) continue
    const target = next.catalogue[kind.id] === undefined || wanted.has(kind.id) ? 1 : 0
    if ((next.tin[kind.id] ?? 0) >= target || next.gold < 30) continue
    const r = buySeed(next, content, kind.id, 1)
    if (r.ok) next = r.plot
  }
  const season = seasonAt(content, at)
  const rank = (k: KindDef) => (next.catalogue[k.id] === undefined ? 100 : 0) + { common: 0, uncommon: 10, rare: 20, epic: 30 }[k.rarity] + (k.sowSeasons === undefined || k.sowSeasons.includes(season) ? 5 : 0)
  for (let index = 0; index < next.beds.length; index += 1) {
    if (next.beds[index]!.kindId !== undefined) continue
    const held = Object.keys(next.tin).filter((id) => (next.tin[id] ?? 0) > 0)
    if (held.length === 0) break
    // Autumn and winter: keep the frost kinds' parent in a bed while the Frost Rose is still to find.
    const frostParent = content.kinds.find((k) => k.source === 'frost' && next.catalogue[k.id] === undefined && (next.tin[k.id] ?? 0) === 0)?.parents?.[0]
    if (frostParent && (season === 'autumn' || season === 'winter') && held.includes(frostParent) && !next.beds.some((b) => b.kindId === frostParent)) {
      const r = sow(next, content, index, frostParent, tick)
      if (r.ok) next = r.plot
      continue
    }
    // A kind never grown goes in first, wherever there is room.
    const fresh = held.map((id) => kindOf(content, id)).filter((k) => next.catalogue[k.id] === undefined && !next.beds.some((b) => b.kindId === k.id))
    if (fresh.length > 0) {
      const r = sow(next, content, index, fresh.sort((a, b) => rank(b) - rank(a))[0]!.id, tick)
      if (r.ok) next = r.plot
      continue
    }
    // Two empty neighbours and both parents of an ungrown cross in the tin: sow the pair.
    const emptyNb = neighbours(next, index).find((n) => next.beds[n]!.kindId === undefined)
    const cross = emptyNb === undefined ? undefined : ungrownCrosses.find((k) => held.includes(k.parents![0]) && held.includes(k.parents![1]) && !next.beds.some((b, i) => b.kindId === k.parents![0] && neighbours(next, i).some((n) => next.beds[n]!.kindId === k.parents![1])))
    if (cross && emptyNb !== undefined) {
      const a = sow(next, content, index, cross.parents![0], tick)
      if (a.ok) next = a.plot
      const b = sow(next, content, emptyNb, cross.parents![1], tick)
      if (b.ok) next = b.plot
      continue
    }
    // A seed that pairs with a neighbour already growing, else the rarest seed in season.
    const nbKinds = neighbours(next, index).map((n) => next.beds[n]?.kindId).filter((k): k is string => k !== undefined)
    const pairing = held.filter((id) => nbKinds.some((nk) => childrenOf(content, id, nk).some((c) => next.catalogue[c.id] === undefined && (c.needs === undefined || next.items.includes(c.needs)))))
    const pool = (pairing.length > 0 ? pairing : held).map((id) => kindOf(content, id)).sort((a, b) => rank(b) - rank(a) || a.id.localeCompare(b.id))
    const r = sow(next, content, index, pool[0]!.id, tick)
    if (r.ok) next = r.plot
  }
  const w = water(next, content, tick)
  if (w.ok) next = w.plot
  return next
}

export function runPlot(policy: Policy, index: number, days: number, content = CONTENT): PlotRun {
  let plot = starterPlot(content, 0)
  const id = `${policy.name}-${index}`
  const stories: TickEvent[] = []
  let firstRipeTick: number | null = null
  let firstCrossTick: number | null = null
  const epicTicks: Record<string, number> = {}
  const kindsByDay: number[] = []
  let shedDoneDay: number | null = null
  let greenhouseDay: number | null = null
  let pestEvents = 0
  let deterred = 0
  let visits = 0
  let defendedVisits = 0
  let defendedNightTicks = 0
  let setbackStages = 0
  const ticks = days * TICKS_PER_DAY
  for (let tick = 1; tick <= ticks; tick += 1) {
    const at = START_AT + tick * 15 * 60_000
    const before = plot
    const result = simulatePlot({ plot, tick, tickAt: at, utcOffsetSeconds: 0, weather: weatherAt(at), content, streams: derivePlotSeeds(WORLD, id, tick, 1) })
    plot = result.plot
    const defended = plot.items.includes('lantern') && plot.items.includes('garden_cat')
    if (defended && result.conditions.band === 'night') defendedNightTicks += 1
    if (result.visit) {
      if (defended) defendedVisits += 1
      // The pool's garden is a stand-in with a tin like a daily player's: one common seed changes hands.
      const spare = spareSeeds(plot, content)
      if (spare.length > 0) {
        const taken = pickOne(createRng(result.visit.pick), spare)
        plot = { ...plot, tin: { ...plot.tin, [taken]: (plot.tin[taken] ?? 0) - 1 }, counters: { ...plot.counters, seedsLost: plot.counters.seedsLost + 1, gnomesHosted: plot.counters.gnomesHosted + 1 } }
      }
      plot = receiveSeed(plot, content, pickOne(createRng(result.visit.pick + 1), ['marigold', 'daisy', 'lettuce']), 'Wren', false)
      visits += 1
    }
    for (const e of result.events) {
      if (e.kind === 'pest') {
        pestEvents += 1
        if (e.detail.effect === 'slugs') setbackStages += 1
        if (e.detail.effect === 'fox') setbackStages += 2
      }
      if (e.kind === 'deterred') deterred += 1
      if (e.kind === 'ripe' && firstRipeTick === null) firstRipeTick = tick
      if (e.kind === 'cross' && firstCrossTick === null) firstCrossTick = tick
      if (e.kind === 'ripe' && e.detail.first && e.detail.kindId && kindOf(content, e.detail.kindId).rarity === 'epic') epicTicks[e.detail.kindId] = tick
    }
    if (policy.name === 'daily' && index === 0) stories.push(...result.events)
    if (policy.visits(tick)) {
      plot = visit(plot, content, tick, at)
      if (policy.name === 'daily' && index === 0) stories.push({ kind: 'system', summary: `[visit] gold ${plot.gold}, level ${plot.level}, kinds ${kindsGrown(plot)}, items ${plot.items.length}`, detail: {} })
    }
    if (tick % TICKS_PER_DAY === 0) {
      kindsByDay.push(kindsGrown(plot))
      const day = tick / TICKS_PER_DAY
      if (shedDoneDay === null && ['beds_9', 'fence', 'copper_tape', 'netting', 'lantern', 'compost_bin', 'beehive'].every((i) => plot.items.includes(i))) shedDoneDay = day
      if (greenhouseDay === null && plot.items.includes('greenhouse')) greenhouseDay = day
    }
    void before
  }
  return { policy: policy.name, index, final: plot, firstRipeTick, firstCrossTick, epicTicks, kindsByDay, shedDoneDay, greenhouseDay, pestEvents, deterred, visits, defendedVisits, defendedNightTicks, ripeToSeed: plot.counters.volunteers, ripenings: plot.counters.ripenings, setbackStages, stories }
}

const median = (xs: number[]) => {
  const s = [...xs].sort((a, b) => a - b)
  return s.length === 0 ? NaN : s[Math.floor(s.length / 2)]!
}
const pct = (xs: number[], p: number) => {
  const s = [...xs].sort((a, b) => a - b)
  return s.length === 0 ? NaN : s[Math.min(s.length - 1, Math.floor((s.length * p) / 100))]!
}
const share = (xs: boolean[]) => (xs.length === 0 ? 0 : Math.round((100 * xs.filter(Boolean).length) / xs.length))

export interface Report {
  readonly plots: number
  readonly days: number
  readonly byPolicy: Record<string, Record<string, number | string | null>>
  readonly gates: Array<{ gate: string; result: string; pass: boolean }>
}

export function report(runs: PlotRun[], days: number): Report {
  const byPolicy: Report['byPolicy'] = {}
  const policy = (name: string) => runs.filter((r) => r.policy === name)
  for (const p of POLICIES) {
    const rs = policy(p.name)
    const d = (day: number) => rs.map((r) => r.kindsByDay[Math.min(day, days) - 1] ?? 0)
    byPolicy[p.name] = {
      firstRipeHoursMedian: median(rs.map((r) => (r.firstRipeTick ?? Infinity) / 4)),
      firstRipeHoursP95: pct(rs.map((r) => (r.firstRipeTick ?? Infinity) / 4), 95),
      firstCrossDayMedian: median(rs.map((r) => (r.firstCrossTick ?? Infinity) / TICKS_PER_DAY)),
      crossBy3Days: share(rs.map((r) => r.firstCrossTick !== null && r.firstCrossTick <= 3 * TICKS_PER_DAY)),
      crossBy7Days: share(rs.map((r) => r.firstCrossTick !== null && r.firstCrossTick <= 7 * TICKS_PER_DAY)),
      kindsDay10: median(d(10)),
      kindsDay30: median(d(30)),
      kindsDay60: median(d(60)),
      shedDoneDayMedian: median(rs.map((r) => r.shedDoneDay ?? Infinity)),
      greenhouseDayMedian: median(rs.map((r) => r.greenhouseDay ?? Infinity)),
      pestEventsPerDay: Math.round((100 * rs.reduce((s, r) => s + r.pestEvents, 0)) / (rs.length * days)) / 100,
      deterredPerDay: Math.round((100 * rs.reduce((s, r) => s + r.deterred, 0)) / (rs.length * days)) / 100,
      visitsPerNight: Math.round((100 * rs.reduce((s, r) => s + r.visits, 0)) / (rs.length * days)) / 100,
      defendedVisitsPerNight: Math.round((100 * rs.reduce((s, r) => s + r.defendedVisits, 0)) / Math.max(1, rs.reduce((s, r) => s + r.defendedNightTicks, 0) / 36)) / 100,
      ripeToSeedShare: Math.round((100 * rs.reduce((s, r) => s + r.ripeToSeed, 0)) / Math.max(1, rs.reduce((s, r) => s + r.ripenings, 0))),
      setbackShare: Math.round((100 * rs.reduce((s, r) => s + r.setbackStages, 0)) / Math.max(1, rs.reduce((s, r) => s + r.ripenings, 0) * 4)),
      goldDay60: median(rs.map((r) => r.final.gold)),
      levelDay60: median(rs.map((r) => r.final.level)),
      ...Object.fromEntries(CONTENT.kinds.filter((k) => k.rarity === 'epic').map((k) => [`epic_${k.id}`, share(rs.map((r) => r.epicTicks[k.id] !== undefined))])),
    }
  }
  const daily = byPolicy.daily!
  const never = byPolicy.never!
  const three = byPolicy.threeDay!
  const twice = byPolicy.twiceDaily!
  const gates: Report['gates'] = [
    { gate: 'First ripe plant: median under 7 hours for every policy, under 8 hours for 95%', result: `medians ${POLICIES.map((p) => byPolicy[p.name]!.firstRipeHoursMedian).join('/')} h, p95 ${POLICIES.map((p) => byPolicy[p.name]!.firstRipeHoursP95).join('/')} h`, pass: POLICIES.every((p) => Number(byPolicy[p.name]!.firstRipeHoursMedian) < 7 && Number(byPolicy[p.name]!.firstRipeHoursP95) <= 8) },
    { gate: 'First cross by day 3 for daily and twice daily (95%), by day 7 for three-day (80%)', result: `daily ${daily.crossBy3Days}%, twice ${twice.crossBy3Days}%, three-day by 7: ${three.crossBy7Days}%`, pass: Number(daily.crossBy3Days) >= 95 && Number(twice.crossBy3Days) >= 95 && Number(three.crossBy7Days) >= 80 },
    { gate: 'Catalogue, daily: 14 by day 10, 24 by day 30, 30 by day 60', result: `${daily.kindsDay10} / ${daily.kindsDay30} / ${daily.kindsDay60}`, pass: Number(daily.kindsDay10) >= 14 && Number(daily.kindsDay30) >= 24 && Number(daily.kindsDay60) >= 30 },
    { gate: 'Catalogue, never visits: 8 to 12 kinds by day 60', result: `${never.kindsDay60}`, pass: Number(never.kindsDay60) >= 8 && Number(never.kindsDay60) <= 12 },
    { gate: 'Epics: each found by a third of daily plots in 60 days (Frost Rose a quarter)', result: CONTENT.kinds.filter((k) => k.rarity === 'epic').map((k) => `${k.id} ${daily[`epic_${k.id}`]}%`).join(', '), pass: CONTENT.kinds.filter((k) => k.rarity === 'epic').every((k) => Number(daily[`epic_${k.id}`]) >= (k.id === 'frost_rose' ? 25 : 33)) },
    { gate: 'Coins, daily: the useful shed between day 20 and 30, the greenhouse by day 40', result: `shed day ${daily.shedDoneDayMedian}, greenhouse day ${daily.greenhouseDayMedian}`, pass: Number(daily.shedDoneDayMedian) >= 20 && Number(daily.shedDoneDayMedian) <= 30 && Number(daily.greenhouseDayMedian) <= 40 },
    { gate: 'Pests: about one event a day undefended (never visits), one in three to four days defended (daily)', result: `never ${never.pestEventsPerDay}/day, daily ${daily.pestEventsPerDay}/day`, pass: Number(never.pestEventsPerDay) >= 0.7 && Number(never.pestEventsPerDay) <= 1.4 && Number(daily.pestEventsPerDay) <= 0.4 },
    { gate: 'Setbacks cost a daily player at most 5% of growth', result: `${daily.setbackShare}%`, pass: Number(daily.setbackShare) <= 5 },
    { gate: 'Visits: one every three nights undefended, one in twelve with lantern and cat', result: `never ${never.visitsPerNight}/night, daily with lantern and cat ${daily.defendedVisitsPerNight}/night`, pass: Number(never.visitsPerNight) >= 0.25 && Number(never.visitsPerNight) <= 0.45 && Number(daily.defendedVisitsPerNight) <= 0.12 },
    { gate: 'Ripe waiting: the three-day player sees at least half its ripenings go to seed; twice daily under 10%', result: `three-day ${three.ripeToSeedShare}%, twice daily ${twice.ripeToSeedShare}%`, pass: Number(three.ripeToSeedShare) >= 50 && Number(twice.ripeToSeedShare) < 10 },
  ]
  return { plots: runs.length / POLICIES.length, days, byPolicy, gates }
}

export function runHarness(plots: number, days: number): { runs: PlotRun[]; report: Report } {
  const runs: PlotRun[] = []
  for (const policy of POLICIES) for (let i = 0; i < plots; i += 1) runs.push(runPlot(policy, i, days))
  return { runs, report: report(runs, days) }
}

const isMain = typeof process !== 'undefined' && process.argv[1]?.endsWith('little-plot.ts')
if (isMain) {
  const args = process.argv.slice(2)
  const plots = Number(args[args.indexOf('--plots') + 1] || 300)
  const days = Number(args[args.indexOf('--days') + 1] || 60)
  const { runs, report: r } = runHarness(plots, days)
  if (args.includes('--story')) {
    const story = runs.find((x) => x.policy === 'daily' && x.index === 0)!
    for (const e of story.stories) console.log(`${e.kind.padEnd(9)} ${e.summary}`)
  } else if (args.includes('--json')) console.log(JSON.stringify(r, null, 2))
  else {
    console.log(`Little Plot harness: ${plots} plots per policy, ${days} days\n`)
    for (const [name, stats] of Object.entries(r.byPolicy)) console.log(name, JSON.stringify(stats))
    console.log('')
    for (const g of r.gates) console.log(`${g.pass ? 'PASS' : 'FAIL'}  ${g.gate}\n      ${g.result}`)
  }
}
