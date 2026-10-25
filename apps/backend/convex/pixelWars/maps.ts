import { keepsakeWeek } from '@trmnl-games/engine/calendar'
import { contentV1 } from '@trmnl-games/pixel-wars/content'
import {
  clearSeat,
  decodePainters,
  emptyMap,
  encodePainters,
  localHour,
  paintClean,
  placeSeat,
  resolve,
  restoreSeat,
  shares,
  shieldedHour,
  type FactionId,
  type MapEvent,
  type MapState,
  type Order,
  type PixelWarsCatalog,
  type Seat,
  type SeatEvents,
} from '@trmnl-games/pixel-wars/sim'
import type { Doc, Id } from '../_generated/dataModel'
import type { MutationCtx, QueryCtx } from '../_generated/server'
import { readEngineWorld } from '../lib/engine/world'
import { PIXEL_WARS_RUNTIME } from './runtime'

/**
 * The map adapter (pixel-wars.md "Architecture"): the stored map document to the pure core's state and back, the
 * global map's creation, desk placement, and the one-per-tick resolution that the first desk of a run to reach a map
 * performs for everyone (`ensureMapTick`). Orders are read from the tick's board shards, the result is written as an
 * immutable snapshot the device and the per-desk steps read, and the map document moves on.
 */

export const ORDER_SHARDS = 8
/** Snapshots kept per map, for the device's immutable URLs. */
export const SNAPSHOTS_KEPT = 8
const MAX_LINES = 3
const MAX_EVENTS = 12

export type StoredSeat = Doc<'pwMaps'>['seats'][number]

export function toMapState(doc: Pick<Doc<'pwMaps'>, 'x0' | 'y0' | 'cols' | 'rows' | 'cells' | 'painters' | 'seats'>): MapState {
  return {
    x0: doc.x0,
    y0: doc.y0,
    cols: doc.cols,
    rows: doc.rows,
    cells: new Uint8Array(doc.cells),
    painters: decodePainters(new Uint8Array(doc.painters)),
    seats: doc.seats.map((s): Seat => ({ x: s.x, y: s.y, faction: s.f })),
  }
}

/** The geometry and bytes of a state, for the map document and the snapshots. */
export function fromMapState(map: MapState, previous: readonly StoredSeat[] = []): Pick<Doc<'pwMaps'>, 'x0' | 'y0' | 'cols' | 'rows' | 'cells' | 'painters' | 'seats'> {
  return {
    x0: map.x0,
    y0: map.y0,
    cols: map.cols,
    rows: map.rows,
    cells: map.cells.slice().buffer as ArrayBuffer,
    painters: encodePainters(map.painters).slice().buffer as ArrayBuffer,
    seats: map.seats.map((s, i) => ({ x: s.x, y: s.y, f: s.faction, ...(previous[i]?.o === undefined ? {} : { o: previous[i]!.o }) })),
  }
}

export async function contentOf(ctx: QueryCtx): Promise<PixelWarsCatalog> {
  const world = await readEngineWorld(ctx, PIXEL_WARS_RUNTIME)
  return (world && PIXEL_WARS_RUNTIME.content(world.activeContentVersion)) ?? contentV1
}

export async function readGlobalMap(ctx: QueryCtx): Promise<Doc<'pwMaps'> | null> {
  return await ctx.db.query('pwMaps').withIndex('by_kind', (q) => q.eq('kind', 'global')).unique()
}

/** The global map, made on first use with the current week. */
export async function getOrCreateGlobalMap(ctx: MutationCtx, now: number): Promise<Doc<'pwMaps'>> {
  const existing = await readGlobalMap(ctx)
  if (existing) return existing
  const content = await contentOf(ctx)
  const empty = emptyMap()
  const id = await ctx.db.insert('pwMaps', { kind: 'global', ...fromMapState(empty), currentTick: 0, seasonWeek: keepsakeWeek(now), seasonScore: [0, 0, 0, 0, 0], shares: shares(empty, content), leadChanges: 0, createdAt: now })
  return (await ctx.db.get(id))!
}

/**
 * Place a desk on the map (an invite beside its inviter, else the spiral) and bind the desk to its seat. The desk's
 * owner offset rides on the seat for the night shield. Returns null when the map is full.
 */
export async function placeDesk(ctx: MutationCtx, desk: Doc<'desks'>, faction: FactionId, now: number): Promise<{ mapId: Id<'pwMaps'>; seat: number } | null> {
  const map = await getOrCreateGlobalMap(ctx, now)
  const content = await contentOf(ctx)
  const inviter = desk.invitedBy ? await ctx.db.get(desk.invitedBy) : null
  const inviterSeat = inviter && inviter.mapId === map._id ? inviter.seat : undefined
  const placed = placeSeat(toMapState(map), content, faction, inviterSeat)
  if (placed === null) return null
  const owner = await ctx.db.get(desk.userId)
  const stored = fromMapState(placed.map, map.seats)
  const seats = stored.seats.map((s, i) => (i === placed.seat - 1 && owner?.trmnlUtcOffset !== undefined ? { ...s, o: owner.trmnlUtcOffset } : s))
  await ctx.db.patch(map._id, { ...stored, seats, shares: shares(placed.map, content) })
  await ctx.db.patch(desk._id, { mapId: map._id, seat: placed.seat, faction })
  if (inviter && inviterSeat !== undefined) await ctx.db.patch(inviter._id, { counters: { ...inviter.counters, invitesPlaced: inviter.counters.invitesPlaced + 1 } })
  return { mapId: map._id, seat: placed.seat }
}

/** A seat's faction changes on the live map (a switch in the bell hour, or a cleared desk's return); its cell follows. */
export async function setSeatFaction(ctx: MutationCtx, map: Doc<'pwMaps'>, seat: number, faction: FactionId | 0): Promise<void> {
  const content = await contentOf(ctx)
  const state = toMapState(map)
  const next = faction === 0 ? clearSeat(state, seat) : restoreSeat(state, content, seat, faction)
  await ctx.db.patch(map._id, { ...fromMapState(next, map.seats), shares: shares(next, content) })
}

/** Keep a seat's owner offset current for the shield; one small patch when it changes. */
export async function syncSeatOffset(ctx: MutationCtx, map: Doc<'pwMaps'>, seat: number, offset: number | undefined): Promise<void> {
  const row = map.seats[seat - 1]
  if (!row || row.o === offset) return
  const seats = map.seats.map((s, i) => (i === seat - 1 ? { x: s.x, y: s.y, f: s.f, ...(offset === undefined ? {} : { o: offset }) } : s))
  await ctx.db.patch(map._id, { seats })
}

/** The seats whose owners are inside the night shield at `at`. */
export function shieldedSeats(content: PixelWarsCatalog, seats: readonly StoredSeat[], at: number): Set<number> {
  const out = new Set<number>()
  seats.forEach((s, i) => {
    if (s.f !== 0 && shieldedHour(content, localHour(at, s.o ?? 0))) out.add(i + 1)
  })
  return out
}

/** The tick a new order targets: the next run's, or the one after when a run is under way (its orders are already read). */
export async function targetTick(ctx: QueryCtx): Promise<number> {
  const world = await readEngineWorld(ctx, PIXEL_WARS_RUNTIME)
  return (world?.currentTick ?? 0) + 1 + (world?.activeRunId !== undefined ? 1 : 0)
}

export const shardOf = (seat: number): number => seat % ORDER_SHARDS

/** Append an order to its board shard, merging into an existing line for the same seat, cell and kind. */
export async function boardOrder(ctx: MutationCtx, mapId: Id<'pwMaps'>, tick: number, order: Order, delta: number): Promise<void> {
  const shard = shardOf(order.seat)
  const row = await ctx.db.query('pwOrderBoards').withIndex('by_mapId_and_tick_and_shard', (q) => q.eq('mapId', mapId).eq('tick', tick).eq('shard', shard)).unique()
  const key = (o: { s: number; x: number; y: number; k: string }) => `${o.s}:${o.x}:${o.y}:${o.k}`
  const mine = key({ s: order.seat, x: order.x, y: order.y, k: order.kind })
  const orders = [...(row?.orders ?? [])]
  const index = orders.findIndex((o) => key(o) === mine)
  if (index >= 0) {
    const d = orders[index]!.d + delta
    if (d <= 0) orders.splice(index, 1)
    else orders[index] = { ...orders[index]!, d }
  } else if (delta > 0) orders.push({ s: order.seat, x: order.x, y: order.y, k: order.kind, d: delta })
  if (row) await ctx.db.patch(row._id, { orders })
  else if (orders.length > 0) await ctx.db.insert('pwOrderBoards', { mapId, tick, shard, orders })
}

const FACTION_NAME = (content: PixelWarsCatalog, f: FactionId) => content.factions[f - 1]!.name

async function aliasOfSeat(ctx: QueryCtx, mapId: Id<'pwMaps'>, seat: number): Promise<string> {
  const desk = await ctx.db.query('desks').withIndex('by_mapId_and_seat', (q) => q.eq('mapId', mapId).eq('seat', seat)).unique()
  const owner = desk ? await ctx.db.get(desk.userId) : null
  return owner && owner.state === 'active' && !owner.nameRepairRequired ? owner.publicAlias : 'A player'
}

/** The device's lines for a tick: desks that fell first, then the biggest transfer, then the fade. */
async function linesFor(ctx: QueryCtx, mapId: Id<'pwMaps'>, content: PixelWarsCatalog, events: readonly MapEvent[], bell: boolean, winner: FactionId | undefined): Promise<string[]> {
  const lines: string[] = []
  if (bell && winner !== undefined) lines.push(`The bell. ${FACTION_NAME(content, winner)} held the most ground this week. The map is clean.`)
  for (const e of events) {
    if (lines.length >= MAX_LINES) break
    if (e.kind === 'deskFell') lines.push(`${await aliasOfSeat(ctx, mapId, e.seat)}'s desk fell to ${FACTION_NAME(content, e.faction)}.`)
  }
  for (const e of events) {
    if (lines.length >= MAX_LINES) break
    if (e.kind === 'deskRecovered') lines.push(`${await aliasOfSeat(ctx, mapId, e.seat)}'s desk is back.`)
  }
  const transfer = events.find((e): e is Extract<MapEvent, { kind: 'transfer' }> => e.kind === 'transfer')
  if (transfer && lines.length < MAX_LINES) lines.push(transfer.from === 0 ? `${FACTION_NAME(content, transfer.to)} painted ${transfer.cells} ${transfer.cells === 1 ? 'cell' : 'cells'}.` : `${FACTION_NAME(content, transfer.to)} took ${transfer.cells} ${transfer.cells === 1 ? 'cell' : 'cells'} from ${FACTION_NAME(content, transfer.from as FactionId)}.`)
  const faded = events.find((e): e is Extract<MapEvent, { kind: 'faded' }> => e.kind === 'faded')
  if (faded && lines.length < MAX_LINES) lines.push(`${faded.cells} of ${FACTION_NAME(content, faded.faction)}'s ${faded.cells === 1 ? 'cell' : 'cells'} faded to nothing.`)
  return lines
}

/**
 * Resolve a map's tick once per run (pixel-wars.md "Architecture"): the bell first when the week has turned, then the
 * tick's orders from the board shards, the pure core, the snapshot and the map's new state. Idempotent within a run:
 * a snapshot for (map, tick) means it is done.
 */
export async function ensureMapTick(ctx: MutationCtx, mapId: Id<'pwMaps'>, run: Doc<'simulationRuns'>, content: PixelWarsCatalog, now: number): Promise<Doc<'pwMapTicks'>> {
  const existing = await ctx.db.query('pwMapTicks').withIndex('by_mapId_and_tick', (q) => q.eq('mapId', mapId).eq('tick', run.tick)).unique()
  if (existing) return existing
  const doc = (await ctx.db.get(mapId))!
  let map = toMapState(doc)
  let seasonScore = [...doc.seasonScore]
  let seasonWeek = doc.seasonWeek
  let leadChanges = doc.leadChanges
  let lastLeader = doc.lastLeader
  let lastWinner = doc.lastWinner
  let bell = false
  const week = keepsakeWeek(run.wallSlot)
  if (week > seasonWeek) {
    // The bell: the week's standings are written, the map painted clean, the running score reset.
    bell = true
    const standings = ([1, 2, 3, 4] as FactionId[]).map((f) => ({ faction: f, score: seasonScore[f] ?? 0 })).sort((a, b) => b.score - a.score || a.faction - b.faction)
    const total = standings.reduce((s, r) => s + r.score, 0)
    lastWinner = standings[0]!.faction
    await ctx.db.insert('pwSeasons', {
      mapId,
      week: seasonWeek,
      endedAt: run.wallSlot,
      x0: map.x0,
      y0: map.y0,
      cols: map.cols,
      rows: map.rows,
      cells: map.cells.slice().buffer as ArrayBuffer,
      standings: standings.map((r) => ({ ...r, percent: total === 0 ? 0 : Math.round((r.score * 100) / total) })),
      winner: lastWinner,
      desks: map.seats.filter((s) => s.faction !== 0).length,
    })
    map = paintClean(map, content)
    seasonScore = [0, 0, 0, 0, 0]
    seasonWeek = week
    leadChanges = 0
    lastLeader = undefined
  }
  const boards = await ctx.db.query('pwOrderBoards').withIndex('by_mapId_and_tick_and_shard', (q) => q.eq('mapId', mapId).eq('tick', run.tick)).take(ORDER_SHARDS)
  const orders: Order[] = boards.flatMap((b) => b.orders.map((o) => ({ seat: o.s, x: o.x, y: o.y, kind: o.k, drops: o.d })))
  const result = resolve({ map, orders, tick: run.tick, content, shielded: shieldedSeats(content, doc.seats, run.wallSlot) })
  for (const s of result.shares) seasonScore[s.faction] = (seasonScore[s.faction] ?? 0) + s.score
  const leader = [...result.shares].sort((a, b) => a.rank - b.rank)[0]!.faction
  const leaderChanged = lastLeader !== undefined && leader !== lastLeader
  if (leaderChanged) leadChanges += 1
  const seatEvents: Record<string, SeatEvents> = {}
  for (const [seat, e] of result.seats) seatEvents[String(seat)] = { ...e }
  const events = result.events.slice(0, MAX_EVENTS)
  const stored = fromMapState(result.map, doc.seats)
  const snapshotId = await ctx.db.insert('pwMapTicks', {
    mapId,
    tick: run.tick,
    at: run.wallSlot,
    x0: stored.x0,
    y0: stored.y0,
    cols: stored.cols,
    rows: stored.rows,
    cells: stored.cells,
    painters: stored.painters,
    shares: [...result.shares],
    events,
    seatEvents,
    lines: await linesFor(ctx, mapId, content, events, bell, lastWinner),
    ...(bell ? { bell: true } : {}),
    ...(leaderChanged && lastLeader !== undefined ? { leaderFrom: lastLeader, leaderTo: leader } : {}),
  })
  await ctx.db.patch(mapId, { ...stored, currentTick: run.tick, seasonScore, seasonWeek, shares: [...result.shares], leadChanges, lastLeader: leader, ...(lastWinner === undefined ? {} : { lastWinner }) })
  for (const b of boards) await ctx.db.delete(b._id)
  // Keep the last snapshots only.
  const old = await ctx.db.query('pwMapTicks').withIndex('by_mapId_and_tick', (q) => q.eq('mapId', mapId).lt('tick', run.tick - SNAPSHOTS_KEPT)).take(4)
  for (const row of old) await ctx.db.delete(row._id)
  void now
  return (await ctx.db.get(snapshotId))!
}
