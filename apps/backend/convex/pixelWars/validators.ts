import { v } from 'convex/values'

/** Pixel Wars storage validators (pixel-wars.md "Data"). Mirrors the pure core's types in packages/pixel-wars. */
export const factionId = v.union(v.literal(1), v.literal(2), v.literal(3), v.literal(4))
export const faction = v.union(v.literal(0), factionId)
export const orderKind = v.union(v.literal('paint'), v.literal('stamp'), v.literal('strike'), v.literal('liberate'))

export const deskCounters = v.object({
  cellsPainted: v.number(),
  stamps: v.number(),
  cellsFlipped: v.number(),
  underdogFlips: v.number(),
  desksTaken: v.number(),
  desksLiberated: v.number(),
  deskFullHours: v.number(),
  seasonsPlayed: v.number(),
  seasonsWon: v.number(),
  invitesPlaced: v.number(),
  ordersAtNight: v.number(),
  deskFalls: v.number(),
  ordersPlaced: v.number(),
  goalsReached: v.number(),
})

/** The week's tallies for the Season page; reset at the bell. */
export const weekTally = v.object({ painted: v.number(), flipped: v.number(), desksTaken: v.number(), liberated: v.number(), lost: v.number(), fell: v.number(), refunded: v.number() })

/** A seat on the map document: its cell, its faction (0 cleared) and the owner's TRMNL offset for the night shield. */
export const seat = v.object({ x: v.number(), y: v.number(), f: faction, o: v.optional(v.number()) })

export const share = v.object({ faction: factionId, cells: v.number(), desks: v.number(), score: v.number(), percent: v.number(), rank: v.number() })

/** What one seat did and suffered on a tick (the core's SeatEvents). */
export const seatEvents = v.object({
  painted: v.number(),
  stamped: v.number(),
  flipped: v.number(),
  underdogFlips: v.number(),
  desksTaken: v.number(),
  liberated: v.number(),
  liberatedOthers: v.number(),
  lost: v.number(),
  refunded: v.number(),
  fell: v.optional(factionId),
  recovered: v.optional(v.literal(true)),
})

export const mapEvent = v.union(
  v.object({ kind: v.literal('deskFell'), seat: v.number(), by: v.number(), faction: factionId }),
  v.object({ kind: v.literal('deskRecovered'), seat: v.number(), by: v.number() }),
  v.object({ kind: v.literal('transfer'), from: faction, to: factionId, cells: v.number() }),
  v.object({ kind: v.literal('faded'), faction: factionId, cells: v.number() }),
  v.object({ kind: v.literal('contested'), cells: v.number() }),
)

export const pwLogKind = v.union(
  v.literal('system'),
  v.literal('order'),
  v.literal('fell'),
  v.literal('recovered'),
  v.literal('taken'),
  v.literal('flips'),
  v.literal('refund'),
  v.literal('bell'),
  v.literal('goal'),
  v.literal('level'),
  v.literal('achievement'),
  v.literal('faction'),
  v.literal('cleared'),
)

export const pwLogDetail = v.object({
  v: v.literal(1),
  faction: v.optional(factionId),
  cells: v.optional(v.number()),
  drops: v.optional(v.number()),
  xp: v.optional(v.number()),
  level: v.optional(v.number()),
  goalId: v.optional(v.string()),
  achievementId: v.optional(v.string()),
  week: v.optional(v.number()),
  /** Another desk named in the line, masked on read like a rank row. */
  otherUserId: v.optional(v.id('users')),
  otherName: v.optional(v.string()),
  otherNameVersion: v.optional(v.number()),
  operation: v.optional(v.string()),
})
