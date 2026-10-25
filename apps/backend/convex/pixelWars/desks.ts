import { v } from 'convex/values'
import { paginationOptsValidator } from 'convex/server'
import { keepsakeWeek, keepsakeWeekStartsAt, weekEndsAt } from '@trmnl-games/engine/calendar'
import { cellAt, cellsToHex, currentGoal, goalProgress, heldBy, localHour, openFactions, refuseReason, shieldedHour, wellAt, type FactionId, type Order, type OrderKind } from '@trmnl-games/pixel-wars/sim'
import type { Doc, Id } from '../_generated/dataModel'
import { mutation, query, type MutationCtx, type QueryCtx } from '../_generated/server'
import { appError } from '../lib/errors'
import { pagePublic } from '../lib/publicPage'
import { currentUser, intentReturns, isIntentRefusal, runIntent, type IntentRefusal, type IntentResult } from '../lib/intent'
import { readEngineWorld } from '../lib/engine/world'
import { awardDesk, stateOf } from './achievements'
import { readDeviceBoard } from './leaderboard'
import { boardOrder, contentOf, getOrCreateGlobalMap, placeDesk, readGlobalMap, setSeatFaction, shieldedSeats, targetTick, toMapState } from './maps'
import { currentDesk, pixelWarsProfile } from './profile'
import { PIXEL_WARS_RUNTIME, PIXEL_WARS_SCHEDULE } from './runtime'

/**
 * Pixel Wars companion API (pixel-wars.md "Cells and ink", "The well", "Desks, maps and placement"). Every change is a
 * receipted, rate-limited intent on the owner's own desk; the rules come from the pure core so the companion, the
 * harness and the tick agree, and a refused order is refused here before any drop is spent.
 */

/** Intents need an activated, healthy desk. */
export async function playableDesk(ctx: QueryCtx, user: Doc<'users'>): Promise<Doc<'desks'>> {
  const desk = await currentDesk(ctx, user)
  if (desk === null) throw appError('HERO_NOT_FOUND', 'No desk yet.')
  if (desk.activationState !== 'active') throw appError('TRMNL_REQUIRED', 'Save Pixel Wars in TRMNL to put your desk on the map.')
  if (desk.simulationState === 'quarantined') throw appError('SERVICE_PAUSED', 'This desk is paused for a service check.')
  return desk
}

const intentResult = intentReturns({ operationId: v.string(), changed: v.boolean() })
const strip = (r: (IntentResult & { operationId: string }) | IntentRefusal) => (isIntentRefusal(r) ? r : { operationId: r.operationId, changed: r.changed })

async function commandLog(ctx: MutationCtx, desk: Doc<'desks'>, summary: string, kind: Doc<'pwTickLogs'>['kind'], detail: Doc<'pwTickLogs'>['detail']): Promise<void> {
  const sequence = desk.logSequence + 1
  await ctx.db.insert('pwTickLogs', { deskId: desk._id, source: 'command', sequence, at: Date.now(), kind, summary: summary.slice(0, 160), detail })
  await ctx.db.patch(desk._id, { logSequence: sequence })
}

const factionIdValidator = v.union(v.literal(1), v.literal(2), v.literal(3), v.literal(4))

/**
 * Pick a side (pixel-wars.md point 11): any open faction, the inviter's whatever its share when joining by a link.
 * An active desk goes on the map at once; a pending one waits for TRMNL's Save.
 */
export const chooseFaction = mutation({
  args: { operationId: v.string(), faction: factionIdValidator, invite: v.optional(v.string()) },
  returns: intentResult,
  handler: async (ctx, { operationId, faction, invite }) =>
    strip(
      await runIntent(ctx, operationId, 'pixelWars.chooseFaction', { faction, invite: invite ?? null }, async (user) => {
        const desk = await currentDesk(ctx, user)
        if (desk === null) throw appError('HERO_NOT_FOUND', 'No desk yet.')
        if (desk.faction !== 0) throw appError('INVALID_STATE', 'Your side is chosen. You can switch in the hour after the bell.')
        const now = Date.now()
        const content = await contentOf(ctx)
        const map = await getOrCreateGlobalMap(ctx, now)
        let chosen: FactionId = faction
        let invitedBy: Id<'desks'> | undefined
        if (invite) {
          const inviter = await ctx.db.query('desks').withIndex('by_inviteCode', (q) => q.eq('inviteCode', invite)).unique()
          if (inviter && inviter._id !== desk._id && inviter.faction !== 0 && inviter.seat !== undefined) {
            chosen = inviter.faction as FactionId
            invitedBy = inviter._id
          }
        }
        if (invitedBy === undefined) {
          const open = openFactions(toMapState(map), content).find((o) => o.faction === chosen)
          if (open && !open.open) throw appError('INVALID_STATE', `${content.factions[chosen - 1]!.name} is full this week. Pick another side.`)
        }
        await ctx.db.patch(desk._id, { faction: chosen, ...(invitedBy === undefined ? {} : { invitedBy }) })
        const updated = (await ctx.db.get(desk._id))!
        if (updated.activationState === 'active') {
          const placed = await placeDesk(ctx, updated, chosen, now)
          if (placed === null) throw appError('INVALID_STATE', 'The map is full. More room opens when a floor is added.')
        }
        await commandLog(ctx, updated, `You chose ${content.factions[chosen - 1]!.name}.${invitedBy ? ' Your desk goes beside the player who invited you.' : ''}`, 'faction', { v: 1, faction: chosen, operation: 'pixelWars.chooseFaction' })
        return { changed: true }
      }),
    ),
})

const orderKindValidator = v.union(v.literal('paint'), v.literal('stamp'), v.literal('strike'), v.literal('liberate'))

/** The owner's local hour at a tick's wall slot, for the night-owl counter. */
const localHourAt = (at: number, owner: Doc<'users'>) => localHour(at, owner.trmnlUtcOffset ?? 0)

/** Queue an order for the next tick (pixel-wars.md "The well"): checked against the map now, its drops held until the tick. */
export const queueOrder = mutation({
  args: { operationId: v.string(), x: v.number(), y: v.number(), kind: orderKindValidator, drops: v.number() },
  returns: intentResult,
  handler: async (ctx, { operationId, x, y, kind, drops }) =>
    strip(
      await runIntent(ctx, operationId, 'pixelWars.queueOrder', { x, y, kind, drops }, async (user) => {
        if (!Number.isInteger(drops) || drops < 1 || drops > 48 || !Number.isInteger(x) || !Number.isInteger(y)) throw appError('INVALID_INPUT', 'An order is a whole number of drops on one cell.')
        const desk = await playableDesk(ctx, user)
        if (desk.mapId === undefined || desk.seat === undefined) throw appError('INVALID_STATE', 'Pick a side first.')
        if (desk.cleared === true) throw appError('INVALID_STATE', 'Your desk stands empty until a screen shows the map again.')
        const content = await contentOf(ctx)
        const map = (await ctx.db.get(desk.mapId))!
        const world = await readEngineWorld(ctx, PIXEL_WARS_RUNTIME)
        const tick = await targetTick(ctx)
        const at = PIXEL_WARS_SCHEDULE.slotEta(Date.now(), tick - (world?.currentTick ?? 0))
        const order: Order = { seat: desk.seat, x, y, kind: kind as OrderKind, drops }
        const reason = refuseReason(toMapState(map), order, content, shieldedSeats(content, map.seats, at))
        if (reason !== null) throw appError('INVALID_STATE', REFUSALS[reason])
        const have = wellAt(content, desk.well.drops, desk.well.tick, world?.currentTick ?? 0)
        if (have < drops) throw appError('INVALID_STATE', `Not enough ink: ${have} ${have === 1 ? 'drop' : 'drops'} in the well.`)
        await ctx.db.patch(desk._id, {
          well: { drops: have - drops, tick: world?.currentTick ?? 0 },
          counters: { ...desk.counters, ordersPlaced: desk.counters.ordersPlaced + 1, ordersAtNight: desk.counters.ordersAtNight + (localHourAt(at, user) < 5 ? 1 : 0) },
        })
        await ctx.db.insert('pwOrders', { deskId: desk._id, mapId: desk.mapId, tick, x, y, kind: kind as OrderKind, drops, createdAt: Date.now() })
        await boardOrder(ctx, desk.mapId, tick, order, drops)
        const updated = (await ctx.db.get(desk._id))!
        await awardDesk(ctx, updated, stateOf(desk), stateOf(updated), Date.now(), world?.currentTick ?? 0)
        return { changed: true }
      }),
    ),
})

const REFUSALS: Record<ReturnType<typeof refuseReason> & string, string> = {
  not_adjacent: 'Your faction holds nothing beside that cell.',
  not_ground: 'That cell is already held. Strike it instead.',
  not_held: 'Your faction does not hold that cell.',
  not_enemy: 'Nothing to strike there.',
  shielded: "That desk is under its owner's night shield.",
  own_desk_held: 'Your desk is already yours.',
  off_map: 'That cell is off the map.',
  no_faction: 'Pick a side first.',
}

/** Cancel a queued order and take the drops back, until its tick is read. */
export const cancelOrder = mutation({
  args: { operationId: v.string(), orderId: v.id('pwOrders') },
  returns: intentResult,
  handler: async (ctx, { operationId, orderId }) =>
    strip(
      await runIntent(ctx, operationId, 'pixelWars.cancelOrder', { orderId }, async (user) => {
        const desk = await playableDesk(ctx, user)
        const row = await ctx.db.get(orderId)
        if (row === null || row.deskId !== desk._id) return { changed: false }
        const tick = await targetTick(ctx)
        if (row.tick < tick) throw appError('INVALID_STATE', 'That order is already being resolved.')
        const content = await contentOf(ctx)
        const world = await readEngineWorld(ctx, PIXEL_WARS_RUNTIME)
        const have = wellAt(content, desk.well.drops, desk.well.tick, world?.currentTick ?? 0)
        await ctx.db.patch(desk._id, { well: { drops: Math.min(content.wellCap, have + row.drops), tick: world?.currentTick ?? 0 } })
        await boardOrder(ctx, row.mapId, row.tick, { seat: desk.seat!, x: row.x, y: row.y, kind: row.kind, drops: row.drops }, -row.drops)
        await ctx.db.delete(row._id)
        return { changed: true }
      }),
    ),
})

/** Whether `now` is inside the hour after the Monday bell, when a side may be switched. */
export const inBellHour = (now: number): boolean => now - keepsakeWeekStartsAt(keepsakeWeek(now)) < 3_600_000

/** Switch sides in the hour after the bell, once a season, under the same 40% guard (pixel-wars.md "Desks, maps and placement"). */
export const switchFaction = mutation({
  args: { operationId: v.string(), faction: factionIdValidator },
  returns: intentResult,
  handler: async (ctx, { operationId, faction }) =>
    strip(
      await runIntent(ctx, operationId, 'pixelWars.switchFaction', { faction }, async (user) => {
        const desk = await playableDesk(ctx, user)
        if (desk.mapId === undefined || desk.seat === undefined || desk.faction === 0) throw appError('INVALID_STATE', 'Pick a side first.')
        if (desk.faction === faction) return { changed: false }
        const now = Date.now()
        if (!inBellHour(now)) throw appError('INVALID_STATE', 'Sides change in the hour after the Monday bell.')
        const week = keepsakeWeek(now)
        if (desk.switchedWeek === week) throw appError('INVALID_STATE', 'One switch a season.')
        const content = await contentOf(ctx)
        const map = (await ctx.db.get(desk.mapId))!
        const open = openFactions(toMapState(map), content).find((o) => o.faction === faction)
        if (open && !open.open) throw appError('INVALID_STATE', `${content.factions[faction - 1]!.name} is full this week.`)
        await setSeatFaction(ctx, map, desk.seat, faction)
        await ctx.db.patch(desk._id, { faction, switchedWeek: week, week: { painted: 0, flipped: 0, desksTaken: 0, liberated: 0, lost: 0, fell: 0, refunded: 0 } })
        await commandLog(ctx, desk, `You switched to ${content.factions[faction - 1]!.name}.`, 'faction', { v: 1, faction, operation: 'pixelWars.switchFaction' })
        return { changed: true }
      }),
    ),
})

export const setPublicProfile = mutation({
  args: { operationId: v.string(), visible: v.boolean() },
  returns: intentResult,
  handler: async (ctx, { operationId, visible }) =>
    strip(
      await runIntent(ctx, operationId, 'pixelWars.setPublicProfile', { visible }, async (user) => {
        const desk = await playableDesk(ctx, user)
        if (pagePublic(desk) === visible) return { changed: false }
        await ctx.db.patch(desk._id, { publicProfile: visible })
        return { changed: true }
      }),
    ),
})

const HIDDEN = 'Hidden player'

async function maskedLog(ctx: QueryCtx, log: Doc<'pwTickLogs'>) {
  let summary = log.summary
  if (log.detail.otherUserId !== undefined && log.detail.otherName !== undefined) {
    const owner = await ctx.db.get(log.detail.otherUserId)
    const visible = owner !== null && owner.state === 'active' && !owner.nameRepairRequired && owner.publicNameVersion === log.detail.otherNameVersion
    if (!visible) summary = summary.replaceAll(`[[${log.detail.otherName}]]`, `[[${HIDDEN}]]`)
  }
  return { id: log._id, at: log.at, tick: log.tick ?? null, kind: log.kind, summary, detail: { faction: log.detail.faction ?? null, cells: log.detail.cells ?? null, xp: log.detail.xp ?? null } }
}

/**
 * The signed-in owner's Map page (pixel-wars.md "Companion"): the desk, the well, the whole map as hex cells with its
 * geometry, the seats' factions, the shares, the queue for the next tick, the countdown, the open factions for a
 * desk without a side, recent stories and the device board. Fixed bounded reads.
 */
export const view = query({
  args: {},
  returns: v.any(),
  handler: async (ctx) => {
    const user = await currentUser(ctx)
    const profile = user ? await pixelWarsProfile(ctx, user._id) : null
    const desk = await currentDesk(ctx, user)
    const content = await contentOf(ctx)
    const now = Date.now()
    const map = await readGlobalMap(ctx)
    const state = map ? toMapState(map) : null
    const factions = content.factions.map((f) => ({ id: f.id, key: f.key, name: f.name, pattern: f.pattern }))
    const open = state ? openFactions(state, content) : content.factions.map((f) => ({ faction: f.id, desks: 0, open: true, smallest: true }))
    if (user === null || desk === null) return { gameState: profile?.state ?? null, desk: null, factions, open }
    const world = await readEngineWorld(ctx, PIXEL_WARS_RUNTIME)
    const tick = world?.currentTick ?? 0
    const nextTickAt = PIXEL_WARS_SCHEDULE.nextSlotAfter(now)
    const target = await targetTick(ctx)
    const queue = desk.mapId ? await ctx.db.query('pwOrders').withIndex('by_deskId_and_tick', (q) => q.eq('deskId', desk._id).gte('tick', target)).take(64) : []
    const logs = await ctx.db.query('pwTickLogs').withIndex('by_deskId_and_at_and_sequence', (q) => q.eq('deskId', desk._id)).order('desc').take(30)
    const seatRow = state && desk.seat !== undefined ? state.seats[desk.seat - 1] : undefined
    const ownCell = state && seatRow ? cellAt(state, seatRow.x, seatRow.y) : null
    const goal = currentGoal(content, desk.goal)
    const shieldNow = shieldedHour(content, localHour(now, user.trmnlUtcOffset ?? 0))
    const latest = map ? await ctx.db.query('pwMapTicks').withIndex('by_mapId_and_tick', (q) => q.eq('mapId', map._id)).order('desc').first() : null
    return {
      gameState: profile?.state ?? 'active',
      desk: {
        id: desk._id,
        activationState: desk.activationState,
        faction: desk.faction,
        placed: desk.seat !== undefined,
        seat: desk.seat ?? null,
        cell: seatRow ? { x: seatRow.x, y: seatRow.y } : null,
        own: ownCell ? { faction: ownCell.faction, ink: ownCell.ink, cap: content.deskInkCap } : null,
        level: desk.level,
        xp: desk.xp,
        xpToNext: xpToLeaveFor(desk.level),
        well: { drops: wellAt(content, desk.well.drops, desk.well.tick, tick), cap: content.wellCap, perHour: content.dropsPerTick * 4 },
        counters: desk.counters,
        week: desk.week,
        held: state && desk.seat !== undefined ? heldBy(state, desk.seat) : 0,
        cleared: desk.cleared === true,
        quarantined: desk.simulationState === 'quarantined',
        publicProfile: pagePublic(desk),
        inviteCode: desk.inviteCode,
        shielded: shieldNow,
        canSwitch: inBellHour(now) && desk.switchedWeek !== keepsakeWeek(now),
      },
      factions,
      open,
      map: state && map
        ? { id: map._id, x0: state.x0, y0: state.y0, cols: state.cols, rows: state.rows, cells: cellsToHex(state.cells), seats: state.seats.map((s) => ({ x: s.x, y: s.y, f: s.faction })), shares: map.shares, seasonScore: map.seasonScore, tick: map.currentTick, lines: latest?.lines ?? [] }
        : null,
      queue: queue.map((o) => ({ id: o._id, x: o.x, y: o.y, kind: o.kind, drops: o.drops, tick: o.tick })),
      targetTick: target,
      nextTickAt,
      season: { week: keepsakeWeek(now), endsAt: weekEndsAt(now), bellHour: inBellHour(now), leader: map?.lastLeader ?? null, lastWinner: map?.lastWinner ?? null },
      goal: goal ? { id: goal.id, title: goal.title, xp: goal.xp, progress: goalProgress(desk.counters, goal) } : null,
      rules: { cellInkCap: content.cellInkCap, deskInkCap: content.deskInkCap, liberateMultiplier: content.liberateMultiplier, underdogMultiplier: content.underdogMultiplier, fadeTicksByRank: content.fadeTicksByRank, shield: content.shield },
      board: desk.activationState === 'active' ? await readDeviceBoard(ctx, desk) : null,
      logs: await Promise.all(logs.map((l) => maskedLog(ctx, l))),
      worldTick: tick,
    }
  },
})

const xpToLeaveFor = (level: number) => Math.floor(50 * level ** 1.6)

/** Past weeks' prints for the Season page: standings and the geometry; the image comes from the art route. */
export const seasons = query({
  args: {},
  returns: v.any(),
  handler: async (ctx) => {
    const map = await readGlobalMap(ctx)
    if (!map) return []
    const rows = await ctx.db.query('pwSeasons').withIndex('by_mapId_and_week', (q) => q.eq('mapId', map._id)).order('desc').take(12)
    return rows.map((r) => ({ id: r._id, week: r.week, endedAt: r.endedAt, winner: r.winner, standings: r.standings, desks: r.desks, cols: r.cols, rows: r.rows }))
  },
})

/** The desk's whole story, newest first, a page at a time. */
export const log = query({
  args: { paginationOpts: paginationOptsValidator },
  returns: v.any(),
  handler: async (ctx, { paginationOpts }) => {
    const user = await currentUser(ctx)
    const desk = await currentDesk(ctx, user)
    const empty = { page: [], isDone: true, continueCursor: '' }
    if (desk === null) return empty
    const result = await ctx.db.query('pwTickLogs').withIndex('by_deskId_and_at_and_sequence', (q) => q.eq('deskId', desk._id)).order('desc').paginate(paginationOpts)
    return { ...result, page: await Promise.all(result.page.map((l) => maskedLog(ctx, l))) }
  },
})
