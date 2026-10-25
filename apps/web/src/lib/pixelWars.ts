import { cellFaction, cellInk, cellIsDesk, cellsFromHex, type FactionId, type MapState, type Pattern } from '@trmnl-games/pixel-wars/sim'

/**
 * The Pixel Wars companion's view of `pixelWars.desks.view` (pixel-wars.md "Companion"). The backend returns
 * `v.any()`; this is the shape the pages read. English copy lives in the pages for now; the eight-language catalogs
 * follow the Idle Angler pattern (D200) once the pages have settled.
 */
export type Faction = FactionId | 0
export type OrderKind = 'paint' | 'stamp' | 'strike' | 'liberate'

export interface FactionInfo {
  id: FactionId
  key: string
  name: string
  pattern: Pattern
}

export interface OpenFaction {
  faction: FactionId
  desks: number
  open: boolean
  smallest: boolean
}

interface Share {
  faction: FactionId
  cells: number
  desks: number
  score: number
  percent: number
  rank: number
}

interface DeskView {
  id: string
  activationState: 'pending_trmnl' | 'active'
  faction: Faction
  placed: boolean
  seat: number | null
  cell: { x: number; y: number } | null
  own: { faction: Faction; ink: number; cap: number } | null
  level: number
  xp: number
  xpToNext: number
  well: { drops: number; cap: number; perHour: number }
  counters: Record<string, number>
  week: { painted: number; flipped: number; desksTaken: number; liberated: number; lost: number; fell: number; refunded: number }
  held: number
  cleared: boolean
  quarantined: boolean
  publicProfile: boolean
  inviteCode: string
  shielded: boolean
  canSwitch: boolean
}

export interface MapView {
  id: string
  x0: number
  y0: number
  cols: number
  rows: number
  cells: string
  seats: Array<{ x: number; y: number; f: Faction }>
  shares: Share[]
  seasonScore: number[]
  tick: number
  lines: string[]
}

interface QueuedOrder {
  id: string
  x: number
  y: number
  kind: OrderKind
  drops: number
  tick: number
}

interface LogLine {
  id: string
  at: number
  tick: number | null
  kind: string
  summary: string
}

export interface WarView {
  gameState: string | null
  desk: DeskView | null
  factions: FactionInfo[]
  open: OpenFaction[]
  map: MapView | null
  queue: QueuedOrder[]
  targetTick: number
  nextTickAt: number
  season: { week: number; endsAt: number; bellHour: boolean; leader: Faction | null; lastWinner: Faction | null }
  goal: { id: string; title: string; xp: number; progress: { value: number; target: number } | null } | null
  rules: { cellInkCap: number; deskInkCap: number; liberateMultiplier: number; underdogMultiplier: number; fadeTicksByRank: number[]; shield: { fromHour: number; toHour: number } }
  board: { top: Array<{ rank: number; name: string; level: number; own: boolean }>; own: { rank: number; total: number } | null } | null
  logs: LogLine[]
  worldTick: number
}

/** The factions' colours in the companion; the device never sees a colour. The pattern stays inside the colour. */
export const FACTION_TONES: Record<FactionId, { fill: string; ink: string; name: string }> = {
  1: { fill: '#2b2b28', ink: '#111110', name: 'ink' },
  2: { fill: '#c2410c', ink: '#7c2d12', name: 'hatch' },
  3: { fill: '#1d4ed8', ink: '#1e3a8a', name: 'dots' },
  4: { fill: '#15803d', ink: '#14532d', name: 'weave' },
}
export const GROUND = '#f5f1e6'

export const ORDER_LABEL: Record<OrderKind, string> = { paint: 'Paint', stamp: 'Stamp', strike: 'Strike', liberate: 'Liberate' }

/** The view's map as the pure core's state (painters are not sent; the core's checks never read them). */
export function toMapState(map: MapView): MapState {
  const cells = cellsFromHex(map.cells)
  return { x0: map.x0, y0: map.y0, cols: map.cols, rows: map.rows, cells, painters: new Uint16Array(cells.length), seats: map.seats.map((s) => ({ x: s.x, y: s.y, faction: s.f })) }
}

export function cellOf(map: MapView, cells: Uint8Array, x: number, y: number): { faction: Faction; ink: number; desk: boolean } | null {
  if (x < map.x0 || y < map.y0 || x >= map.x0 + map.cols || y >= map.y0 + map.rows) return null
  const byte = cells[(y - map.y0) * map.cols + (x - map.x0)]!
  return { faction: cellFaction(byte), ink: cellInk(byte), desk: cellIsDesk(byte) }
}

/** Strip the name markers the device hides and the companion links. */
export const plain = (summary: string) => summary.replaceAll('[[', '').replaceAll(']]', '')
