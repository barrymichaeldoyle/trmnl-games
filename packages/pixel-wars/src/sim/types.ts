/**
 * Pixel Wars pure-core types (pixel-wars.md "Rules", D214). The map is a grid of cells over a lattice of desks; every
 * number is a whole number, every rule a catalog constant, and nothing here reads a clock, a seed or the network. The
 * core has no random stream at all: a contest you can reason about is the whole appeal (settled point 7).
 */

/** Factions 1 to 4; 0 is ground, or a cleared seat. */
export type FactionId = 1 | 2 | 3 | 4
export type Faction = FactionId | 0
export const FACTION_IDS: readonly FactionId[] = [1, 2, 3, 4]
export type Pattern = 'solid' | 'hatch' | 'dots' | 'weave'

export interface FactionDef {
  readonly id: FactionId
  readonly key: 'ink' | 'hatch' | 'dots' | 'weave'
  readonly name: string
  readonly pattern: Pattern
}

export type OrderKind = 'paint' | 'stamp' | 'strike' | 'liberate'
export const ORDER_KINDS: readonly OrderKind[] = ['paint', 'stamp', 'strike', 'liberate']

/** One queued order: a seat spends drops on a cell. World cell coordinates (the lattice origin is cell 0,0). */
export interface Order {
  readonly seat: number
  readonly x: number
  readonly y: number
  readonly kind: OrderKind
  readonly drops: number
}

/** A desk's place on the map and the faction it belongs to; `faction` 0 is a cleared seat whose cell is ground. */
export interface Seat {
  readonly x: number
  readonly y: number
  readonly faction: Faction
  /** A switch requested for the bell (pixel-wars.md "Desks, maps and placement"). */
  readonly switchTo?: FactionId
}

/**
 * The map: a bounded window of world cells (`x0`, `y0`, `cols`, `rows`) with one byte a cell and one seat number a cell.
 * Cell byte: bits 0-2 the faction (0 ground), bits 3-5 the ink (0-5), bit 6 set on a desk cell.
 * Painter: 0 for none, else the seat number (1-based) whose ink is on the cell.
 */
export interface MapState {
  readonly x0: number
  readonly y0: number
  readonly cols: number
  readonly rows: number
  readonly cells: Uint8Array
  readonly painters: Uint16Array
  /** Seat n is `seats[n - 1]`. Append-only: a cleared seat keeps its number. */
  readonly seats: readonly Seat[]
}

export interface CellView {
  readonly faction: Faction
  readonly ink: number
  readonly desk: boolean
  readonly painter: number
}

export interface FactionShare {
  readonly faction: FactionId
  readonly cells: number
  readonly desks: number
  /** Cells held, desks counting `deskScoreWeight`. */
  readonly score: number
  /** Share of all held cells, whole percent; 0 when nothing is held. */
  readonly percent: number
  /** 0 for the largest faction by score, 3 for the smallest (ties by faction id). */
  readonly rank: number
}

/** What one seat did and suffered on a tick, for XP, counters and stories. */
export interface SeatEvents {
  painted: number
  stamped: number
  flipped: number
  /** Flips while in the smallest faction against the largest. */
  underdogFlips: number
  desksTaken: number
  /** The seat's own desk back in its faction's hands by its own drops. */
  liberated: number
  /** Another seat's desk liberated by this seat. */
  liberatedOthers: number
  /** Cells this seat had painted that another faction took or that faded away. */
  lost: number
  /** Drops returned for orders that could not be carried out. */
  refunded: number
  /** The seat's desk fell to this faction on this tick. */
  fell?: FactionId
  /** The seat's desk came back to its faction on this tick (by whichever seat). */
  recovered?: true
}

export type MapEvent =
  | { readonly kind: 'deskFell'; readonly seat: number; readonly by: number; readonly faction: FactionId }
  | { readonly kind: 'deskRecovered'; readonly seat: number; readonly by: number }
  | { readonly kind: 'transfer'; readonly from: Faction; readonly to: FactionId; readonly cells: number }
  | { readonly kind: 'faded'; readonly faction: FactionId; readonly cells: number }
  | { readonly kind: 'contested'; readonly cells: number }

export interface ResolveInput {
  readonly map: MapState
  readonly orders: readonly Order[]
  readonly tick: number
  readonly content: PixelWarsCatalog
  /** Seats whose desks are under the night shield this tick: strikes on them are refused and refunded. */
  readonly shielded: ReadonlySet<number>
}

export interface ResolveResult {
  readonly map: MapState
  readonly shares: readonly FactionShare[]
  readonly events: readonly MapEvent[]
  readonly seats: ReadonlyMap<number, SeatEvents>
  /** Orders refused before any drop was spent, for the companion's refund line. */
  readonly refused: readonly { readonly seat: number; readonly order: Order; readonly reason: RefuseReason }[]
}

export type RefuseReason = 'not_adjacent' | 'not_ground' | 'not_held' | 'not_enemy' | 'shielded' | 'own_desk_held' | 'off_map' | 'no_faction'

export interface XpTable {
  readonly heldCellPerHour: number
  readonly flip: number
  readonly deskTaken: number
  readonly liberatedOwn: number
  readonly liberatedOther: number
  readonly deskFullHour: number
  readonly seasonWon: number
}

export interface DeskCounters {
  readonly cellsPainted: number
  readonly stamps: number
  readonly cellsFlipped: number
  readonly underdogFlips: number
  readonly desksTaken: number
  readonly desksLiberated: number
  readonly deskFullHours: number
  readonly seasonsPlayed: number
  readonly seasonsWon: number
  readonly invitesPlaced: number
  readonly ordersAtNight: number
  readonly deskFalls: number
  readonly ordersPlaced: number
  readonly goalsReached: number
}

export type GoalPredicate = { readonly kind: 'counter'; readonly counter: keyof DeskCounters; readonly at: number }

export interface GoalDef {
  readonly id: string
  readonly title: string
  readonly predicate: GoalPredicate
  readonly xp: number
}

export interface PixelWarsCatalog {
  readonly contentVersion: string
  readonly factions: readonly [FactionDef, FactionDef, FactionDef, FactionDef]
  /** Cells between desks on the lattice, plus one: 3 leaves two ground cells between neighbours. */
  readonly latticeSpacing: number
  /** The map never grows past this many cells a side. */
  readonly maxSide: number
  readonly cellInkCap: number
  readonly deskInkCap: number
  /** Ticks between one point of fade, by share rank (0 the largest faction). */
  readonly fadeTicksByRank: readonly [number, number, number, number]
  /** A desk fades this many times slower than ground. */
  readonly deskFadeMultiplier: number
  /** The smallest faction's strikes against the largest count this many times. */
  readonly underdogMultiplier: number
  /** A cell the largest takes from the smallest starts at ink 1 whatever the surplus. */
  readonly leaderClaimsAtOne: boolean
  /** The owner's drops on their own desk count this many times. */
  readonly liberateMultiplier: number
  readonly wellCap: number
  readonly dropsPerTick: number
  /** A desk counts this many cells in the season score. */
  readonly deskScoreWeight: number
  /** The night shield by the owner's clock: from this hour to that hour. */
  readonly shield: { readonly fromHour: number; readonly toHour: number }
  /** A faction holding more than this share of desks is closed to new choosers for the week. */
  readonly fullFactionPercent: number
  /** A desk whose owner's screens have been silent this long is cleared to ground. */
  readonly clearAfterDays: number
  readonly xp: XpTable
  readonly goals: readonly GoalDef[]
}

export type GoalState = { readonly rung: number }
