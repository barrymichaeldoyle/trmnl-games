import { cellFaction, cellInk, cellIsDesk, coordsOf, indexOf, neighbourIndices, packCell, shares } from './map'
import type { Faction, FactionId, FactionShare, MapEvent, MapState, Order, OrderKind, PixelWarsCatalog, RefuseReason, ResolveInput, ResolveResult, SeatEvents } from './types'
import { FACTION_IDS } from './types'

/**
 * The Pixel Wars pure core (pixel-wars.md "Cells and ink", "The fade"): every order on the map resolved at once
 * against the map as it stood when the tick began, then the fade. No draw anywhere; the same map and orders always
 * give the same map, so a week replays from its order log (settled point 7).
 *
 * Order of resolution, part of the simulation version:
 *   1. Each order is checked against the old map: adjacency, the target's state, the shield. A failed order is
 *      refused whole and its drops returned.
 *   2. Per cell: stamps by the holding faction raise its ink; then the attacking factions' effective drops (the
 *      underdog's doubled against the leader, an owner's tripled on their own desk) are summed. If the defence absorbs
 *      them the cell is weakened, to ground at zero. Otherwise the top attacker takes it with its surplus over the
 *      defence as ink (at least 1, at most the cap), unless two attackers tie at the top, which leaves it ground.
 *      Ground goes to the top painter likewise, its ink the margin over the runner-up.
 *   3. Every held cell fades one point on the ticks its faction's rank and its index select, desks at half rate.
 */
export const SIMULATION_VERSION = 1

export const emptySeatEvents = (): SeatEvents => ({ painted: 0, stamped: 0, flipped: 0, underdogFlips: 0, desksTaken: 0, liberated: 0, liberatedOthers: 0, lost: 0, refunded: 0 })

interface Contribution {
  readonly seat: number
  readonly faction: FactionId
  readonly kind: OrderKind
  readonly drops: number
  readonly effective: number
}

const seatEvents = (events: Map<number, SeatEvents>, seat: number): SeatEvents => {
  let e = events.get(seat)
  if (!e) {
    e = emptySeatEvents()
    events.set(seat, e)
  }
  return e
}

/** Whether the seat's faction holds a cell orthogonally beside `index` on the old map. */
function adjacentToFaction(map: MapState, index: number, faction: FactionId): boolean {
  return neighbourIndices(map, index).some((n) => cellFaction(map.cells[n]!) === faction)
}

/** Why an order cannot be carried out on this map, or null when it can. Shared with the companion so a refused tap says why before it is queued. */
export function refuseReason(map: MapState, order: Order, content: PixelWarsCatalog, shielded: ReadonlySet<number>): RefuseReason | null {
  const seat = map.seats[order.seat - 1]
  if (!seat || seat.faction === 0) return 'no_faction'
  const index = indexOf(map, order.x, order.y)
  if (index < 0) return 'off_map'
  const byte = map.cells[index]!
  const holder = cellFaction(byte)
  const ownDesk = seat.x === order.x && seat.y === order.y
  if (order.kind === 'liberate') return ownDesk ? (holder === seat.faction ? 'own_desk_held' : null) : 'not_adjacent'
  if (order.kind === 'stamp') return holder === seat.faction ? null : 'not_held'
  if (order.kind === 'paint') {
    if (holder !== 0) return 'not_ground'
    if (!ownDesk && cellIsDesk(byte)) {
      // A desk that faded to ground is still its owner's desk: the shield covers it against everyone but them.
      const owner = map.seats.findIndex((s) => s.x === order.x && s.y === order.y) + 1
      if (owner > 0 && shielded.has(owner)) return 'shielded'
    }
    return ownDesk || adjacentToFaction(map, index, seat.faction) ? null : 'not_adjacent'
  }
  // strike
  if (holder === 0) return 'not_enemy'
  if (holder === seat.faction) return 'not_enemy'
  if (cellIsDesk(byte)) {
    const owner = map.seats.findIndex((s) => s.x === order.x && s.y === order.y) + 1
    if (owner > 0 && shielded.has(owner) && map.seats[owner - 1]!.faction === holder) return 'shielded'
  }
  return ownDesk || adjacentToFaction(map, index, seat.faction) ? null : 'not_adjacent'
}

const clamp = (n: number, lo: number, hi: number) => Math.max(lo, Math.min(hi, n))

/**
 * The largest and the smallest faction with any presence on the map (a desk or a cell), by rank. A faction nobody has
 * joined is neither, so the underdog rule works with two factions as well as four; with one, both are the same and
 * the rule is off.
 */
export function extremes(rows: readonly FactionShare[]): { largest: FactionId; smallest: FactionId } {
  const present = [...rows].filter((s) => s.cells > 0 || s.desks > 0).sort((a, b) => a.rank - b.rank)
  const largest = present[0]?.faction ?? 1
  const last = present[present.length - 1]
  // Level pegging is nobody's underdog: the rule needs a real gap.
  const smallest = last !== undefined && last.score < present[0]!.score ? last.faction : largest
  return { largest, smallest }
}

export function resolve(input: ResolveInput): ResolveResult {
  const { content, tick } = input
  const old = input.map
  const before = shares(old, content)
  const rankOf = (f: FactionId) => before.find((s) => s.faction === f)!.rank
  const { largest, smallest } = extremes(before)
  const events = new Map<number, SeatEvents>()
  const refused: { seat: number; order: Order; reason: RefuseReason }[] = []
  const byCell = new Map<number, Contribution[]>()

  // 1. Check every order against the old map and group the valid ones by cell.
  for (const order of input.orders) {
    if (!Number.isInteger(order.drops) || order.drops <= 0) continue
    const reason = refuseReason(old, order, content, input.shielded)
    if (reason !== null) {
      refused.push({ seat: order.seat, order, reason })
      seatEvents(events, order.seat).refunded += order.drops
      continue
    }
    const seat = old.seats[order.seat - 1]!
    const faction = seat.faction as FactionId
    const index = indexOf(old, order.x, order.y)
    const holder = cellFaction(old.cells[index]!)
    let effective = order.drops
    if (order.kind === 'liberate') effective *= content.liberateMultiplier
    else if (order.kind === 'strike' && faction === smallest && holder === largest && smallest !== largest) effective *= content.underdogMultiplier
    const list = byCell.get(index) ?? []
    list.push({ seat: order.seat, faction, kind: order.kind, drops: order.drops, effective })
    byCell.set(index, list)
  }

  // 2. Resolve each targeted cell.
  const cells = new Uint8Array(old.cells)
  const painters = new Uint16Array(old.painters)
  /** Cells whose ink changed hands or grew this tick: ink laid this tick does not fade this tick. */
  const touched = new Set<number>()
  const transfers = new Map<string, number>()
  const mapEvents: MapEvent[] = []
  let contested = 0
  const deskOwnerAt = (index: number): number => {
    const { x, y } = coordsOf(old, index)
    return old.seats.findIndex((s) => s.x === x && s.y === y) + 1
  }
  const topContributor = (list: Contribution[], faction: FactionId): Contribution => list.filter((c) => c.faction === faction).sort((a, b) => b.drops - a.drops || a.seat - b.seat)[0]!

  for (const [index, list] of byCell) {
    const byte = old.cells[index]!
    const holder = cellFaction(byte)
    const desk = cellIsDesk(byte)
    const cap = desk ? content.deskInkCap : content.cellInkCap
    let ink = cellInk(byte)
    const previousPainter = old.painters[index]!
    // Stamps first: the defence stands with this tick's reinforcement.
    for (const c of list) {
      if (c.kind !== 'stamp') continue
      ink = Math.min(cap, ink + c.drops)
      seatEvents(events, c.seat).stamped += c.drops
    }
    const attack = new Map<FactionId, number>()
    for (const c of list) {
      if (c.kind === 'stamp') continue
      attack.set(c.faction, (attack.get(c.faction) ?? 0) + c.effective)
    }
    if (attack.size === 0) {
      cells[index] = packCell(holder, ink, desk)
      if (ink > cellInk(byte)) touched.add(index)
      continue
    }
    const ranked = [...attack.entries()].sort((a, b) => b[1] - a[1] || a[0] - b[0])
    const [topFaction, topTotal] = ranked[0]!
    const second = ranked[1]?.[1] ?? 0
    const tie = ranked.length > 1 && second === topTotal
    const total = ranked.reduce((s, [, n]) => s + n, 0)
    const claim = (faction: FactionId, newInk: number) => {
      const painter = topContributor(list, faction)
      cells[index] = packCell(faction, clamp(newInk, 1, cap), desk)
      painters[index] = painter.seat
      touched.add(index)
      const e = seatEvents(events, painter.seat)
      if (holder === 0) e.painted += 1
      else {
        e.flipped += 1
        if (faction === smallest && holder === largest && smallest !== largest) e.underdogFlips += 1
        const key = `${holder}>${faction}`
        transfers.set(key, (transfers.get(key) ?? 0) + 1)
        if (previousPainter > 0) seatEvents(events, previousPainter).lost += 1
      }
      if (desk) {
        const owner = deskOwnerAt(index)
        const ownerFaction = old.seats[owner - 1]?.faction ?? 0
        if (owner > 0 && ownerFaction === faction) {
          const oe = seatEvents(events, owner)
          oe.recovered = true
          if (painter.seat === owner) oe.liberated += 1
          else e.liberatedOthers += 1
          mapEvents.push({ kind: 'deskRecovered', seat: owner, by: painter.seat })
        } else if (owner > 0 && ownerFaction !== 0) {
          e.desksTaken += 1
          seatEvents(events, owner).fell = faction
          mapEvents.push({ kind: 'deskFell', seat: owner, by: painter.seat, faction })
        }
      }
    }
    if (holder === 0) {
      if (tie) {
        contested += 1
        cells[index] = packCell(0, 0, desk)
        painters[index] = 0
      } else claim(topFaction, topTotal - second)
      continue
    }
    if (total <= ink) {
      ink -= total
      if (ink === 0) {
        cells[index] = packCell(0, 0, desk)
        painters[index] = 0
        if (previousPainter > 0) seatEvents(events, previousPainter).lost += 1
        const key = `${holder}>0`
        transfers.set(key, (transfers.get(key) ?? 0) + 1)
      } else cells[index] = packCell(holder, ink, desk)
      continue
    }
    if (tie || topTotal <= ink) {
      // Broken together, or by nobody in particular: ground.
      contested += 1
      cells[index] = packCell(0, 0, desk)
      painters[index] = 0
      if (previousPainter > 0) seatEvents(events, previousPainter).lost += 1
      transfers.set(`${holder}>0`, (transfers.get(`${holder}>0`) ?? 0) + 1)
      continue
    }
    const leaderOverUnderdog = content.leaderClaimsAtOne && topFaction === largest && holder === smallest && smallest !== largest
    claim(topFaction, leaderOverUnderdog ? 1 : topTotal - ink)
  }

  // 3. The fade, on the ranks the tick began with.
  const faded = [0, 0, 0, 0, 0]
  for (let i = 0; i < cells.length; i += 1) {
    const byte = cells[i]!
    const f = cellFaction(byte)
    if (f === 0 || touched.has(i)) continue
    const desk = cellIsDesk(byte)
    const interval = content.fadeTicksByRank[rankOf(f)]! * (desk ? content.deskFadeMultiplier : 1)
    if ((tick + i) % interval !== 0) continue
    const ink = cellInk(byte) - 1
    if (ink > 0) cells[i] = packCell(f, ink, desk)
    else {
      cells[i] = packCell(0, 0, desk)
      const painter = painters[i]!
      if (painter > 0) seatEvents(events, painter).lost += 1
      painters[i] = 0
      faded[f]! += 1
    }
  }

  for (const [key, count] of [...transfers.entries()].sort((a, b) => b[1] - a[1])) {
    const [from, to] = key.split('>').map(Number) as [Faction, Faction]
    if (to !== 0) mapEvents.push({ kind: 'transfer', from, to: to as FactionId, cells: count })
  }
  for (const f of FACTION_IDS) if (faded[f]! > 0) mapEvents.push({ kind: 'faded', faction: f, cells: faded[f]! })
  if (contested > 0) mapEvents.push({ kind: 'contested', cells: contested })

  const map: MapState = { ...old, cells, painters }
  return { map, shares: shares(map, content), events: mapEvents, seats: events, refused }
}

/** Whether `hour` (0-23, the owner's local hour) is inside the night shield. */
export function shieldedHour(content: Pick<PixelWarsCatalog, 'shield'>, hour: number): boolean {
  const { fromHour, toHour } = content.shield
  return fromHour > toHour ? hour >= fromHour || hour < toHour : hour >= fromHour && hour < toHour
}

/** The owner's local hour at a moment from their TRMNL offset in seconds (UTC without one). */
export const localHour = (at: number, utcOffsetSeconds = 0): number => new Date(at + utcOffsetSeconds * 1000).getUTCHours()

/** Lazy well accrual: the drops a well holds at `tick` given what it held at `fromTick`. */
export function wellAt(content: Pick<PixelWarsCatalog, 'wellCap' | 'dropsPerTick'>, drops: number, fromTick: number, tick: number): number {
  return Math.min(content.wellCap, drops + Math.max(0, tick - fromTick) * content.dropsPerTick)
}

/** XP a seat's tick earns, by the catalog's table; held-cell XP is paid by the hour and passed in by the caller. */
export function xpFor(content: Pick<PixelWarsCatalog, 'xp'>, e: SeatEvents, heldCells = 0, deskFullHour = false): number {
  const x = content.xp
  return e.flipped * x.flip + e.desksTaken * x.deskTaken + e.liberated * x.liberatedOwn + e.liberatedOthers * x.liberatedOther + heldCells * x.heldCellPerHour + (deskFullHour ? x.deskFullHour : 0)
}

/** The cells a seat's ink is on. */
export function heldBy(map: MapState, seat: number): number {
  let n = 0
  for (let i = 0; i < map.painters.length; i += 1) if (map.painters[i] === seat && cellFaction(map.cells[i]!) !== 0) n += 1
  return n
}

/** The bell (pixel-wars.md "The season"): every cell to ground, every desk back to its seat's faction at the cap, switches applied. */
export function paintClean(map: MapState, content: PixelWarsCatalog): MapState {
  const cells = new Uint8Array(map.cells.length)
  const painters = new Uint16Array(map.cells.length)
  const seats = map.seats.map((s) => (s.switchTo !== undefined && s.faction !== 0 ? { x: s.x, y: s.y, faction: s.switchTo } : { x: s.x, y: s.y, faction: s.faction }))
  for (let i = 0; i < map.cells.length; i += 1) if (cellIsDesk(map.cells[i]!)) cells[i] = packCell(0, 0, true)
  seats.forEach((s, k) => {
    if (s.faction === 0) return
    const i = indexOf(map, s.x, s.y)
    cells[i] = packCell(s.faction, content.deskInkCap, true)
    painters[i] = k + 1
  })
  return { ...map, cells, painters, seats }
}
