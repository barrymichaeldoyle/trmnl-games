/**
 * Pixel Wars balance harness (pixel-wars.md "Balance and the harness", W1). Runs the real pure core over three maps
 * (60, 200 and 440 desks) for 28 days with four visit policies, a 40/30/20/10 faction split and four time zones, and
 * reports the spec's gates. Deterministic: no draw anywhere, so one run is the run.
 *   pnpm balance:pixel-wars                 (all three maps)
 *   pnpm balance:pixel-wars -- --desks 60   (one map)
 *   pnpm balance:pixel-wars -- --days 7
 * Writes docs/evidence/pixel-wars-balance.json.
 */
import { writeFileSync } from 'node:fs'
import { ACTIVE_CONTENT, catalogs } from '@trmnl-games/pixel-wars/content'
import {
  cellAt,
  cellFaction,
  cellInk,
  cellIsDesk,
  cellsToHex,
  coordsOf,
  emptyMap,
  extremes,
  heldBy,
  localHour,
  neighbourIndices,
  paintClean,
  placeSeat,
  refuseReason,
  resolve,
  shares,
  shieldedHour,
  wellAt,
  xpFor,
  type FactionId,
  type MapState,
  type Order,
  type SeatEvents,
} from '@trmnl-games/pixel-wars/sim'

const content = catalogs[ACTIVE_CONTENT]
const TICKS_PER_DAY = 96
const TICKS_PER_WEEK = 7 * TICKS_PER_DAY
/** Monday 2026-10-19 00:00 UTC. */
const START_AT = Date.UTC(2026, 9, 19)
const arg = (name: string) => (process.argv.includes(name) ? process.argv[process.argv.indexOf(name) + 1] : undefined)
const DAYS = Number(arg('--days') ?? 28)
const SIZES = arg('--desks') ? [Number(arg('--desks'))] : [60, 200, 440]

type PolicyName = 'never' | 'threeDay' | 'daily' | 'twiceDaily'
const POLICIES: PolicyName[] = ['never', 'threeDay', 'daily', 'twiceDaily']
/** Visits at 19:00 local (and 08:00 for the twice-daily player), by the player's zone. */
const visits = (policy: PolicyName, localTick: number): boolean => {
  const inDay = localTick % TICKS_PER_DAY
  if (policy === 'never') return false
  if (policy === 'threeDay') return localTick % (3 * TICKS_PER_DAY) === 19 * 4
  if (policy === 'daily') return inDay === 19 * 4
  return inDay === 8 * 4 || inDay === 19 * 4
}
/** Four zones: Pacific, London, Berlin, Tokyo. */
const ZONES = [-7 * 3600, 0, 2 * 3600, 9 * 3600]
/** A 40/30/20/10 split by join order. */
const factionFor = (i: number, n: number): FactionId => (i < n * 0.4 ? 1 : i < n * 0.7 ? 2 : i < n * 0.9 ? 3 : 4)

interface Desk {
  readonly seat: number
  readonly policy: PolicyName
  readonly zone: number
  faction: FactionId
  well: number
  wellTick: number
  xp: number
  parts: { flips: number; desks: number; held: number; full: number; lib: number }
  orders: Record<string, number>
  fell: number[]
  liberated: number[]
  fallenAt: number | null
}

const dist = (a: { x: number; y: number }, b: { x: number; y: number }) => Math.abs(a.x - b.x) + Math.abs(a.y - b.y)

/** The visiting player's orders: liberate the desk, strike the faded enemy border nearby, stamp the own border, paint ground. */
function plan(map: MapState, desk: Desk, shielded: Set<number>): Order[] {
  const seat = map.seats[desk.seat - 1]!
  if (seat.faction === 0) return []
  const f = seat.faction
  let drops = desk.well
  const orders: Order[] = []
  const place = (order: Order) => {
    if (drops < order.drops || order.drops <= 0) return
    if (refuseReason(map, order, content, shielded) !== null) return
    drops -= order.drops
    orders.push(order)
  }
  const own = cellAt(map, seat.x, seat.y)!
  if (own.faction !== f) place({ seat: desk.seat, x: seat.x, y: seat.y, kind: 'liberate', drops: Math.ceil((own.ink + 1) / content.liberateMultiplier) })
  // Enemy cells beside our cells, nearest the desk first, lowest ink first.
  const enemy: Array<{ x: number; y: number; ink: number; d: number }> = []
  const ownCells: Array<{ x: number; y: number; ink: number; d: number }> = []
  const ground: Array<{ x: number; y: number; d: number }> = []
  for (let i = 0; i < map.cells.length; i += 1) {
    const byte = map.cells[i]!
    const faction = cellFaction(byte)
    const p = coordsOf(map, i)
    const d = dist(p, seat)
    if (d > 9) continue
    const besideUs = neighbourIndices(map, i).some((n) => cellFaction(map.cells[n]!) === f)
    if (faction === f && (map.painters[i] === desk.seat || (p.x === seat.x && p.y === seat.y))) ownCells.push({ ...p, ink: cellInk(byte), d })
    else if (faction === 0 && besideUs) ground.push({ ...p, d })
    else if (faction !== 0 && besideUs) enemy.push({ ...p, ink: cellInk(byte) + (cellIsDesk(byte) ? 0 : 0), d })
  }
  enemy.sort((a, b) => a.ink - b.ink || a.d - b.d)
  for (const e of enemy.slice(0, 6)) place({ seat: desk.seat, x: e.x, y: e.y, kind: 'strike', drops: e.ink + 1 })
  ownCells.sort((a, b) => a.d - b.d)
  const stampBudget = Math.floor(drops / 2)
  let stamped = 0
  for (const c of ownCells) {
    const cap = c.x === seat.x && c.y === seat.y ? content.deskInkCap : content.cellInkCap
    const need = Math.min(cap - c.ink, stampBudget - stamped)
    if (need <= 0) continue
    place({ seat: desk.seat, x: c.x, y: c.y, kind: 'stamp', drops: need })
    stamped += need
  }
  ground.sort((a, b) => a.d - b.d)
  for (const g of ground) place({ seat: desk.seat, x: g.x, y: g.y, kind: 'paint', drops: 1 })
  return orders
}

interface RunReport {
  desks: number
  weeks: Array<{ winner: FactionId; leaderAvgPercent: number; smallestAvgPercent: number; leadChanges: number; finalPercents: number[] }>
  deskFallsPerDailyDeskPerDay: number
  deskFallsPerNeverDeskPerDay: number
  medianLiberationHoursDaily: number | null
  medianLiberationHoursNever: number | null
  xpByPolicy: Record<PolicyName, number>
  partsByPolicy: Record<PolicyName, Record<string, number>>
  shieldBreaches: number
  replayIdentical: boolean
  refusedOrders: number
  ordersPlaced: number
}

function run(n: number): RunReport {
  let map = emptyMap()
  const desks: Desk[] = []
  for (let i = 0; i < n; i += 1) {
    const faction = factionFor(i, n)
    const placed = placeSeat(map, content, faction)
    if (!placed) throw new Error('map full')
    map = placed.map
    desks.push({ seat: placed.seat, policy: POLICIES[i % 4]!, zone: ZONES[Math.floor(i / 4) % 4]!, faction, well: content.wellCap, wellTick: 0, xp: 0, parts: { flips: 0, desks: 0, held: 0, full: 0, lib: 0 }, orders: {}, fell: [], liberated: [], fallenAt: null })
  }
  const start = map
  const ticks = DAYS * TICKS_PER_DAY
  const log = new Map<number, Order[]>()
  let queued: Order[] = []
  const weeks: RunReport['weeks'] = []
  let leaderSum = 0
  let smallestSum = 0
  let leadChanges = 0
  let lastLeader: FactionId | null = null
  let seasonScore = [0, 0, 0, 0, 0]
  let weekTicks = 0
  let shieldBreaches = 0
  let refused = 0
  let placed = 0
  const shieldedAt = (tick: number) => new Set(desks.filter((d) => shieldedHour(content, localHour(START_AT + tick * 15 * 60_000, d.zone))).map((d) => d.seat))

  for (let tick = 1; tick <= ticks; tick += 1) {
    const at = START_AT + tick * 15 * 60_000
    const shielded = shieldedAt(tick)
    const orders = queued
    log.set(tick, orders)
    const result = resolve({ map, orders, tick, content, shielded })
    refused += result.refused.length
    // Shield gate: no shielded desk changed hands to an enemy this tick.
    for (const d of desks) {
      if (!shielded.has(d.seat)) continue
      const e = result.seats.get(d.seat)
      if (e?.fell !== undefined) shieldBreaches += 1
    }
    for (const d of desks) {
      const e: SeatEvents | undefined = result.seats.get(d.seat)
      if (e) {
        d.well = wellAt(content, d.well, d.wellTick, tick) + e.refunded
        d.wellTick = tick
        if (e.fell !== undefined) {
          d.fell.push(tick)
          d.fallenAt = tick
        }
        if (e.recovered && d.fallenAt !== null) {
          d.liberated.push(tick - d.fallenAt)
          d.fallenAt = null
        }
      }
      const hourly = tick % 4 === 0
      const seat = result.map.seats[d.seat - 1]!
      const own = cellAt(result.map, seat.x, seat.y)!
      const held = hourly ? heldBy(result.map, d.seat) : 0
      const full = hourly && own.faction === seat.faction && own.ink === content.deskInkCap
      d.xp += xpFor(content, e ?? { painted: 0, stamped: 0, flipped: 0, underdogFlips: 0, desksTaken: 0, liberated: 0, liberatedOthers: 0, lost: 0, refunded: 0 }, held, full)
      d.parts.held += held
      if (full) d.parts.full += 1
      if (e) {
        d.parts.flips += e.flipped
        d.parts.desks += e.desksTaken
        d.parts.lib += e.liberated + e.liberatedOthers
      }
    }
    map = result.map
    const s = result.shares
    const { largest, smallest } = extremes(s)
    leaderSum += s.find((r) => r.faction === largest)!.percent
    smallestSum += s.find((r) => r.faction === smallest)!.percent
    if (lastLeader !== null && largest !== lastLeader) leadChanges += 1
    lastLeader = largest
    for (const r of s) seasonScore[r.faction]! += r.score
    weekTicks += 1
    // Queue the visiting players' orders for the next tick.
    queued = []
    for (const d of desks) {
      const localTick = tick + Math.round(d.zone / 900)
      if (!visits(d.policy, localTick)) continue
      d.well = wellAt(content, d.well, d.wellTick, tick)
      d.wellTick = tick
      const mine = plan(map, d, shieldedAt(tick + 1))
      d.well -= mine.reduce((sum, o) => sum + o.drops, 0)
      for (const o of mine) d.orders[o.kind] = (d.orders[o.kind] ?? 0) + o.drops
      queued.push(...mine)
      placed += mine.length
    }
    if (tick % TICKS_PER_WEEK === 0) {
      const winner = ([1, 2, 3, 4] as FactionId[]).sort((a, b) => seasonScore[b]! - seasonScore[a]! || a - b)[0]!
      for (const d of desks) if (d.faction === winner) d.xp += content.xp.seasonWon
      weeks.push({ winner, leaderAvgPercent: Math.round(leaderSum / weekTicks), smallestAvgPercent: Math.round(smallestSum / weekTicks), leadChanges, finalPercents: s.map((r) => r.percent) })
      map = paintClean(map, content)
      for (const d of desks) {
        d.well = content.wellCap
        d.wellTick = tick
        d.fallenAt = null
      }
      leaderSum = smallestSum = leadChanges = weekTicks = 0
      lastLeader = null
      seasonScore = [0, 0, 0, 0, 0]
      queued = []
    }
  }
  // Replay from the log.
  let replay = start
  for (let tick = 1; tick <= ticks; tick += 1) {
    replay = resolve({ map: replay, orders: log.get(tick) ?? [], tick, content, shielded: shieldedAt(tick) }).map
    if (tick % TICKS_PER_WEEK === 0) replay = paintClean(replay, content)
  }
  const replayIdentical = cellsToHex(replay.cells) === cellsToHex(map.cells)
  const by = (p: PolicyName) => desks.filter((d) => d.policy === p)
  const median = (xs: number[]) => (xs.length === 0 ? null : [...xs].sort((a, b) => a - b)[Math.floor(xs.length / 2)]! / 4)
  const falls = (p: PolicyName) => by(p).reduce((s, d) => s + d.fell.length, 0) / (by(p).length * DAYS)
  const xpByPolicy = Object.fromEntries(POLICIES.map((p) => [p, Math.round(by(p).reduce((s, d) => s + d.xp, 0) / by(p).length)])) as Record<PolicyName, number>
  return {
    desks: n,
    weeks,
    deskFallsPerDailyDeskPerDay: Number(falls('daily').toFixed(3)),
    deskFallsPerNeverDeskPerDay: Number(falls('never').toFixed(3)),
    medianLiberationHoursDaily: median(by('daily').flatMap((d) => d.liberated)),
    medianLiberationHoursNever: median(by('never').flatMap((d) => d.liberated)),
    xpByPolicy,
    partsByPolicy: Object.fromEntries(POLICIES.map((p) => {
      const rows = by(p)
      const avg = (f: (d: Desk) => number) => Math.round(rows.reduce((s, d) => s + f(d), 0) / rows.length)
      return [p, { flips: avg((d) => d.parts.flips), desks: avg((d) => d.parts.desks), held: avg((d) => d.parts.held), full: avg((d) => d.parts.full), lib: avg((d) => d.parts.lib), paint: avg((d) => d.orders.paint ?? 0), stamp: avg((d) => d.orders.stamp ?? 0), strike: avg((d) => d.orders.strike ?? 0), liberate: avg((d) => d.orders.liberate ?? 0) }]
    })) as unknown as Record<PolicyName, Record<string, number>>,
    shieldBreaches,
    replayIdentical,
    refusedOrders: refused,
    ordersPlaced: placed,
  }
}

const reports = SIZES.map(run)
const gates: Array<{ gate: string; pass: boolean; detail: string }> = []
for (const r of reports) {
  const weeks = r.weeks
  gates.push({ gate: `${r.desks}: leader share averaged over any week never over 45%`, pass: weeks.every((w) => w.leaderAvgPercent <= 45), detail: weeks.map((w) => w.leaderAvgPercent).join('/') })
  gates.push({ gate: `${r.desks}: smallest share averaged over any week never under 12%`, pass: weeks.every((w) => w.smallestAvgPercent >= 12), detail: weeks.map((w) => w.smallestAvgPercent).join('/') })
  if (r.desks === 200) gates.push({ gate: `${r.desks}: at least two lead changes a week`, pass: weeks.every((w) => w.leadChanges >= 2), detail: weeks.map((w) => w.leadChanges).join('/') })
  gates.push({ gate: `${r.desks}: a daily desk falls at most once in three days`, pass: r.deskFallsPerDailyDeskPerDay <= 1 / 3, detail: `${r.deskFallsPerDailyDeskPerDay}/day` })
  gates.push({ gate: `${r.desks}: a daily desk is liberated within a median 8 hours`, pass: r.medianLiberationHoursDaily === null || r.medianLiberationHoursDaily <= 8, detail: `${r.medianLiberationHoursDaily ?? 'never fell'} h` })
  gates.push({ gate: `${r.desks}: a never-visits desk is liberated by faction-mates within two days`, pass: r.medianLiberationHoursNever === null || r.medianLiberationHoursNever <= 48, detail: `${r.medianLiberationHoursNever ?? 'never fell'} h` })
  const daily = r.xpByPolicy.daily
  const twice = r.xpByPolicy.twiceDaily
  gates.push({ gate: `${r.desks}: daily and twice-daily XP within 10% (spend pattern)`, pass: Math.abs(daily - twice) <= 0.1 * Math.max(daily, twice), detail: `${daily} vs ${twice}` })
  gates.push({ gate: `${r.desks}: no desk taken inside its owner's shield`, pass: r.shieldBreaches === 0, detail: `${r.shieldBreaches}` })
  if (r.desks === 60) gates.push({ gate: `${r.desks}: young map not decided by the bell (trailing faction at least 15% at the bell in half the weeks)`, pass: weeks.filter((w) => Math.min(...w.finalPercents) >= 15).length * 2 >= weeks.length, detail: weeks.map((w) => Math.min(...w.finalPercents)).join('/') })
  gates.push({ gate: `${r.desks}: replay from the order log is identical`, pass: r.replayIdentical, detail: `${r.ordersPlaced} orders, ${r.refusedOrders} refused` })
}
for (const g of gates) console.log(`${g.pass ? 'PASS' : 'FAIL'}  ${g.gate}  (${g.detail})`)
for (const r of reports) {
  console.log(`${r.desks} desks: XP by policy`, r.xpByPolicy, 'weeks', r.weeks.map((w) => `${w.winner}:${w.finalPercents.join('-')}`).join(' '))
  for (const p of POLICIES) console.log(`  ${p}`, r.partsByPolicy[p])
}
writeFileSync('docs/evidence/pixel-wars-balance.json', JSON.stringify({ generatedAt: new Date().toISOString(), days: DAYS, content: content.contentVersion, gates, reports }, null, 2) + '\n')
if (gates.some((g) => !g.pass)) process.exitCode = 1
