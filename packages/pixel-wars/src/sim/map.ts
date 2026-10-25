import type { CellView, Faction, FactionId, FactionShare, MapState, PixelWarsCatalog, Seat } from './types'
import { FACTION_IDS } from './types'

/**
 * The map (pixel-wars.md "Desks, maps and placement"): world cells on an infinite plane, stored as a bounded window
 * that grows a ring at a time as desks are placed. Desks sit on the lattice (every `latticeSpacing` cells in both
 * directions, the first at 0,0), so two ground cells separate neighbours and there is always ground to fight over.
 */

const FACTION_MASK = 0b111
const INK_SHIFT = 3
const INK_MASK = 0b111 << INK_SHIFT
const DESK_BIT = 1 << 6

export const packCell = (faction: Faction, ink: number, desk: boolean): number => (faction & FACTION_MASK) | ((ink << INK_SHIFT) & INK_MASK) | (desk ? DESK_BIT : 0)
export const cellFaction = (byte: number): Faction => (byte & FACTION_MASK) as Faction
export const cellInk = (byte: number): number => (byte & INK_MASK) >> INK_SHIFT
export const cellIsDesk = (byte: number): boolean => (byte & DESK_BIT) !== 0

export const inBounds = (map: Pick<MapState, 'x0' | 'y0' | 'cols' | 'rows'>, x: number, y: number): boolean => x >= map.x0 && y >= map.y0 && x < map.x0 + map.cols && y < map.y0 + map.rows
/** The array index of a world cell, or -1 outside the window. */
export const indexOf = (map: Pick<MapState, 'x0' | 'y0' | 'cols' | 'rows'>, x: number, y: number): number => (inBounds(map, x, y) ? (y - map.y0) * map.cols + (x - map.x0) : -1)
export const coordsOf = (map: Pick<MapState, 'x0' | 'y0' | 'cols'>, index: number): { x: number; y: number } => ({ x: map.x0 + (index % map.cols), y: map.y0 + Math.floor(index / map.cols) })

export function cellAt(map: MapState, x: number, y: number): CellView | null {
  const i = indexOf(map, x, y)
  if (i < 0) return null
  const byte = map.cells[i]!
  return { faction: cellFaction(byte), ink: cellInk(byte), desk: cellIsDesk(byte), painter: map.painters[i]! }
}

/** The four orthogonal neighbours inside the window, as indices. */
export function neighbourIndices(map: Pick<MapState, 'x0' | 'y0' | 'cols' | 'rows'>, index: number): number[] {
  const { x, y } = coordsOf(map, index)
  const out: number[] = []
  for (const [dx, dy] of [[1, 0], [-1, 0], [0, 1], [0, -1]] as const) {
    const n = indexOf(map, x + dx, y + dy)
    if (n >= 0) out.push(n)
  }
  return out
}

export const emptyMap = (): MapState => ({ x0: 0, y0: 0, cols: 0, rows: 0, cells: new Uint8Array(0), painters: new Uint16Array(0), seats: [] })

/** The n-th lattice point (0-based) on a square spiral from the origin: right, up, left, down, widening each lap. */
export function spiralPoint(n: number): { u: number; v: number } {
  if (n === 0) return { u: 0, v: 0 }
  // Ring r holds the points with Chebyshev distance r; it starts at index (2r-1)^2 and has 8r points.
  const r = Math.ceil((Math.sqrt(n + 1) - 1) / 2)
  const start = (2 * r - 1) ** 2
  const k = n - start
  const side = 2 * r
  const leg = Math.floor(k / side)
  const t = k % side
  // Start just below the ring's right-bottom corner and walk up the right side, then left along the top, down the left, right along the bottom.
  if (leg === 0) return { u: r, v: -r + 1 + t }
  if (leg === 1) return { u: r - 1 - t, v: r }
  if (leg === 2) return { u: -r, v: r - 1 - t }
  return { u: -r + 1 + t, v: -r }
}

/** The spiral index of a lattice point, the inverse of `spiralPoint`. */
export function spiralIndex(u: number, v: number): number {
  const r = Math.max(Math.abs(u), Math.abs(v))
  if (r === 0) return 0
  const start = (2 * r - 1) ** 2
  const side = 2 * r
  if (u === r && v > -r) return start + (v + r - 1)
  if (v === r) return start + side + (r - 1 - u)
  if (u === -r) return start + 2 * side + (r - 1 - v)
  return start + 3 * side + (u + r - 1)
}

const latticeToCell = (content: Pick<PixelWarsCatalog, 'latticeSpacing'>, u: number, v: number) => ({ x: u * content.latticeSpacing, y: v * content.latticeSpacing })

/** Whether the lattice point is taken by any seat (cleared seats keep their place). */
const latticeTaken = (map: MapState, content: Pick<PixelWarsCatalog, 'latticeSpacing'>, u: number, v: number): boolean => {
  const { x, y } = latticeToCell(content, u, v)
  return map.seats.some((s) => s.x === x && s.y === y)
}

/** The lattice rings the cap allows: a side of `maxSide` cells holds lattice points out to this Chebyshev distance. */
export const maxRing = (content: Pick<PixelWarsCatalog, 'latticeSpacing' | 'maxSide'>): number => Math.floor(Math.floor((content.maxSide - 2) / content.latticeSpacing) / 2)

/**
 * Where the next desk goes: the nearest free lattice point to the inviter's desk (Chebyshev, then Euclid, then spiral
 * order), else the first free point on the spiral from the centre. Null when the map is full.
 */
export function nextSeatPlace(map: MapState, content: Pick<PixelWarsCatalog, 'latticeSpacing' | 'maxSide'>, inviterSeat?: number): { x: number; y: number } | null {
  const limit = maxRing(content)
  const inviter = inviterSeat === undefined ? undefined : map.seats[inviterSeat - 1]
  if (inviter) {
    const iu = inviter.x / content.latticeSpacing
    const iv = inviter.y / content.latticeSpacing
    let best: { u: number; v: number; d2: number; n: number } | null = null
    for (let ring = 1; ring <= 2 * limit + 1 && best === null; ring += 1) {
      for (let du = -ring; du <= ring; du += 1) {
        for (let dv = -ring; dv <= ring; dv += 1) {
          if (Math.max(Math.abs(du), Math.abs(dv)) !== ring) continue
          const u = iu + du
          const v = iv + dv
          if (Math.max(Math.abs(u), Math.abs(v)) > limit || latticeTaken(map, content, u, v)) continue
          const candidate = { u, v, d2: du * du + dv * dv, n: spiralIndex(u, v) }
          if (best === null || candidate.d2 < best.d2 || (candidate.d2 === best.d2 && candidate.n < best.n)) best = candidate
        }
      }
    }
    if (best) return latticeToCell(content, best.u, best.v)
  }
  const points = (2 * limit + 1) ** 2
  for (let n = 0; n < points; n += 1) {
    const { u, v } = spiralPoint(n)
    if (!latticeTaken(map, content, u, v)) return latticeToCell(content, u, v)
  }
  return null
}

/** Grow the window to hold every seat with one cell of ground around, keeping every cell where it was. */
export function fitBounds(map: MapState): MapState {
  if (map.seats.length === 0) return map
  let minX = Infinity
  let minY = Infinity
  let maxX = -Infinity
  let maxY = -Infinity
  for (const s of map.seats) {
    minX = Math.min(minX, s.x)
    minY = Math.min(minY, s.y)
    maxX = Math.max(maxX, s.x)
    maxY = Math.max(maxY, s.y)
  }
  const x0 = Math.min(map.cols === 0 ? Infinity : map.x0, minX - 1)
  const y0 = Math.min(map.rows === 0 ? Infinity : map.y0, minY - 1)
  const x1 = Math.max(map.cols === 0 ? -Infinity : map.x0 + map.cols - 1, maxX + 1)
  const y1 = Math.max(map.rows === 0 ? -Infinity : map.y0 + map.rows - 1, maxY + 1)
  const cols = x1 - x0 + 1
  const rows = y1 - y0 + 1
  if (x0 === map.x0 && y0 === map.y0 && cols === map.cols && rows === map.rows) return map
  const cells = new Uint8Array(cols * rows)
  const painters = new Uint16Array(cols * rows)
  for (let i = 0; i < map.cells.length; i += 1) {
    const { x, y } = coordsOf(map, i)
    const j = (y - y0) * cols + (x - x0)
    cells[j] = map.cells[i]!
    painters[j] = map.painters[i]!
  }
  return { ...map, x0, y0, cols, rows, cells, painters }
}

/**
 * Place a desk: the seat is appended, the window grows if it must, and the desk cell takes the faction at the desk cap.
 * Returns the new map and the seat number.
 */
export function placeSeat(map: MapState, content: PixelWarsCatalog, faction: FactionId, inviterSeat?: number): { map: MapState; seat: number } | null {
  const place = nextSeatPlace(map, content, inviterSeat)
  if (place === null) return null
  const seats: Seat[] = [...map.seats, { x: place.x, y: place.y, faction }]
  const grown = fitBounds({ ...map, seats })
  const cells = new Uint8Array(grown.cells)
  const painters = new Uint16Array(grown.painters)
  const i = indexOf(grown, place.x, place.y)
  const seat = seats.length
  cells[i] = packCell(faction, content.deskInkCap, true)
  painters[i] = seat
  return { map: { ...grown, cells, painters }, seat }
}

/** A seat's desk cell is cleared to ground and the seat loses its faction (the owner's screens went silent). */
export function clearSeat(map: MapState, seat: number): MapState {
  const s = map.seats[seat - 1]
  if (!s || s.faction === 0) return map
  const cells = new Uint8Array(map.cells)
  const painters = new Uint16Array(map.painters)
  const i = indexOf(map, s.x, s.y)
  cells[i] = packCell(0, 0, true)
  painters[i] = 0
  const seats = map.seats.map((row, k) => (k === seat - 1 ? { x: row.x, y: row.y, faction: 0 as const } : row))
  return { ...map, cells, painters, seats }
}

/** A cleared seat's owner is back: the desk takes its faction again at the cap. */
export function restoreSeat(map: MapState, content: PixelWarsCatalog, seat: number, faction: FactionId): MapState {
  const s = map.seats[seat - 1]
  if (!s) return map
  const cells = new Uint8Array(map.cells)
  const painters = new Uint16Array(map.painters)
  const i = indexOf(map, s.x, s.y)
  cells[i] = packCell(faction, content.deskInkCap, true)
  painters[i] = seat
  const seats = map.seats.map((row, k) => (k === seat - 1 ? { x: row.x, y: row.y, faction } : row))
  return { ...map, cells, painters, seats }
}

/** Each faction's holding and its rank by score (pixel-wars.md "The fade"). */
export function shares(map: MapState, content: Pick<PixelWarsCatalog, 'deskScoreWeight'>): FactionShare[] {
  const cells = [0, 0, 0, 0, 0]
  const desks = [0, 0, 0, 0, 0]
  for (let i = 0; i < map.cells.length; i += 1) {
    const byte = map.cells[i]!
    const f = cellFaction(byte)
    if (f === 0) continue
    cells[f]! += 1
    if (cellIsDesk(byte)) desks[f]! += 1
  }
  const held = cells.reduce((s, n) => s + n, 0)
  const rows = FACTION_IDS.map((faction) => ({ faction, cells: cells[faction]!, desks: desks[faction]!, score: cells[faction]! + desks[faction]! * (content.deskScoreWeight - 1), percent: held === 0 ? 0 : Math.round((cells[faction]! * 100) / held) }))
  const order = [...rows].sort((a, b) => b.score - a.score || a.faction - b.faction)
  return rows.map((row) => ({ ...row, rank: order.findIndex((r) => r.faction === row.faction) }))
}

/** The number of desks per faction, for the join guard and the switch guard. */
export function deskCounts(map: MapState): Record<FactionId, number> {
  const out: Record<FactionId, number> = { 1: 0, 2: 0, 3: 0, 4: 0 }
  for (const s of map.seats) if (s.faction !== 0) out[s.faction] += 1
  return out
}

/** Factions a new player may choose: the smallest first, those over the full share closed (pixel-wars.md point 11). */
export function openFactions(map: MapState, content: Pick<PixelWarsCatalog, 'fullFactionPercent'>): { faction: FactionId; desks: number; open: boolean; smallest: boolean }[] {
  const counts = deskCounts(map)
  const total = FACTION_IDS.reduce((s, f) => s + counts[f], 0)
  const min = Math.min(...FACTION_IDS.map((f) => counts[f]))
  return FACTION_IDS.map((faction) => ({ faction, desks: counts[faction], open: total === 0 || (counts[faction] * 100) / total <= content.fullFactionPercent, smallest: counts[faction] === min }))
}

/** Bytes for storage (little-endian painters), and back. */
export const encodePainters = (painters: Uint16Array): Uint8Array => {
  const out = new Uint8Array(painters.length * 2)
  for (let i = 0; i < painters.length; i += 1) {
    out[i * 2] = painters[i]! & 0xff
    out[i * 2 + 1] = painters[i]! >> 8
  }
  return out
}
export const decodePainters = (bytes: Uint8Array): Uint16Array => {
  const out = new Uint16Array(bytes.length / 2)
  for (let i = 0; i < out.length; i += 1) out[i] = bytes[i * 2]! | (bytes[i * 2 + 1]! << 8)
  return out
}

/** A compact text form of the cells for URLs and tests: one base-36 digit... too narrow for 7 bits, so two hex digits a cell. */
export const cellsToHex = (cells: Uint8Array): string => Array.from(cells, (b) => b.toString(16).padStart(2, '0')).join('')
export const cellsFromHex = (hex: string): Uint8Array => {
  const out = new Uint8Array(hex.length / 2)
  for (let i = 0; i < out.length; i += 1) out[i] = parseInt(hex.slice(i * 2, i * 2 + 2), 16)
  return out
}
