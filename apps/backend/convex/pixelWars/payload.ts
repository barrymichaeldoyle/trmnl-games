import { v } from 'convex/values'
import { buildPayload, MAX_DEVICE_LOGS, type PayloadMap } from '@trmnl-games/pixel-wars/lib/payload'
import { cellAt, localHour, shieldedHour, wellAt, type FactionId } from '@trmnl-games/pixel-wars/sim'
import type { Doc } from '../_generated/dataModel'
import { internalQuery, query, type QueryCtx } from '../_generated/server'
import { isGame } from '../lib/gameHooks'
import { currentUser } from '../lib/intent'
import { readEngineWorld } from '../lib/engine/world'
import { trmnlUserChanged } from '../lib/trmnlUser'
import { readDeviceBoard } from './leaderboard'
import { contentOf, readGlobalMap, toMapState } from './maps'
import { currentDesk, pixelWarsProfile } from './profile'
import { PIXEL_WARS_RUNTIME } from './runtime'

/**
 * Pixel Wars' device payload for one authorized installation (trmnl.md "Query read budget"): fixed reads, null for
 * any authorization failure so the HTTP layer answers a generic 404. Read-only.
 */
export const forInstance = internalQuery({
  args: { tokenHash: v.string(), uuid: v.string(), now: v.number(), utcOffset: v.optional(v.union(v.number(), v.null())), locale: v.optional(v.union(v.string(), v.null())) },
  returns: v.union(v.null(), v.object({ outcome: v.literal('recoverable') }), v.object({ outcome: v.literal('payload'), payload: v.any(), recordUserFor: v.optional(v.id('users')), screenServedFor: v.optional(v.id('trmnlInstances')) })),
  handler: async (ctx, args) => {
    const instance = await ctx.db.query('trmnlInstances').withIndex('by_uuid', (q) => q.eq('uuid', args.uuid)).unique()
    if (!instance) {
      if (await ctx.db.query('revokedTrmnlCredentials').withIndex('by_tokenHash', (q) => q.eq('tokenHash', args.tokenHash)).first()) return null
      const grant = await ctx.db.query('trmnlGrants').withIndex('by_tokenHash', (q) => q.eq('tokenHash', args.tokenHash)).unique()
      return grant && isGame(grant, 'pixel-wars') && grant.state === 'active' && !grant.authorizedUuid ? { outcome: 'recoverable' as const } : null
    }
    const grant = await ctx.db.get(instance.grantId)
    if (!grant || !isGame(grant, 'pixel-wars') || grant.state !== 'active' || grant.tokenHash !== args.tokenHash || (grant.authorizedUuid && grant.authorizedUuid !== args.uuid)) return null
    if (!isGame(instance, 'pixel-wars') || instance.userId !== grant.userId || instance.state !== 'active') return null
    const user = await ctx.db.get(instance.userId)
    if (user === null || user.state !== 'active' || (await pixelWarsProfile(ctx, user._id))?.state === 'deleting') return null
    const payload = await payloadFor(ctx, user, args.now, args.utcOffset ?? user.trmnlUtcOffset)
    const userChanged = trmnlUserChanged(user, args.utcOffset, args.locale)
    // The cleared-desk rule reads when a screen was last served (pixel-wars.md "Desks, maps and placement"), so every valid screen records it.
    return { outcome: 'payload' as const, payload, screenServedFor: instance._id, ...(userChanged ? { recordUserFor: user._id } : {}) }
  },
})

/** The canonical payload for a user's desk; shared by the device route and the owner's preview. */
export async function payloadFor(ctx: QueryCtx, user: Doc<'users'>, now: number, utcOffset?: number | null) {
  const world = await readEngineWorld(ctx, PIXEL_WARS_RUNTIME)
  const content = await contentOf(ctx)
  const desk = await currentDesk(ctx, user)
  const logs = desk ? await ctx.db.query('pwTickLogs').withIndex('by_deskId_and_at_and_sequence', (q) => q.eq('deskId', desk._id)).order('desc').take(MAX_DEVICE_LOGS) : []
  const board = desk && desk.activationState === 'active' ? await readDeviceBoard(ctx, desk) : null
  const mapDoc = await readGlobalMap(ctx)
  let map: PayloadMap | null = null
  let ownCell: { x: number; y: number } | null = null
  let own: { faction: FactionId | 0; ink: number } | null = null
  if (mapDoc) {
    const state = toMapState(mapDoc)
    const latest = await ctx.db.query('pwMapTicks').withIndex('by_mapId_and_tick', (q) => q.eq('mapId', mapDoc._id)).order('desc').first()
    const hourAgo = latest ? await ctx.db.query('pwMapTicks').withIndex('by_mapId_and_tick', (q) => q.eq('mapId', mapDoc._id).eq('tick', latest.tick - 4)).unique() : null
    // The device draws the newest snapshot (its URL is immutable per tick); the shares and seats are the map's.
    const source = latest ? { x0: latest.x0, y0: latest.y0, cols: latest.cols, rows: latest.rows, cells: new Uint8Array(latest.cells) } : { x0: state.x0, y0: state.y0, cols: state.cols, rows: state.rows, cells: state.cells }
    map = { id: mapDoc._id, tick: latest?.tick ?? mapDoc.currentTick, source, shares: mapDoc.shares, sharesBefore: hourAgo?.shares ?? null, lines: latest?.lines ?? [], lastWinner: mapDoc.lastWinner ?? null }
    if (desk?.seat !== undefined && desk.seat !== undefined) {
      const seat = state.seats[desk.seat - 1]
      if (seat) {
        ownCell = { x: seat.x, y: seat.y }
        const cell = cellAt(state, seat.x, seat.y)
        own = cell ? { faction: cell.faction, ink: cell.ink } : null
      }
    }
  }
  const offset = utcOffset === undefined || utcOffset === null ? 0 : utcOffset
  return buildPayload({
    content,
    now,
    world: world ? { createdAt: world.createdAt, paused: world.ticksPaused || world.maintenanceMode, currentTick: world.currentTick, ...(world.lastCompletedAt === undefined ? {} : { lastCompletedAt: world.lastCompletedAt }) } : null,
    desk: desk
      ? {
          alias: user.publicAlias,
          activationState: desk.activationState,
          faction: desk.faction,
          seat: desk.seat ?? null,
          cell: ownCell,
          own,
          holderName: null,
          level: desk.level,
          well: wellAt(content, desk.well.drops, desk.well.tick, world?.currentTick ?? 0),
          held: 0,
          cleared: desk.cleared === true,
          quarantined: desk.simulationState === 'quarantined',
          shielded: shieldedHour(content, localHour(now, offset)),
        }
      : null,
    map,
    stories: logs.map((l) => ({ kind: l.kind, summary: l.summary, at: l.at })),
    board,
    artBaseUrl: process.env.CONVEX_SITE_URL ?? null,
  })
}

/** The owner's own device preview in the companion (no installation needed). */
export const preview = query({
  args: {},
  returns: v.any(),
  handler: async (ctx) => {
    const user = await currentUser(ctx)
    if (user === null || user.state !== 'active') return null
    return await payloadFor(ctx, user, Date.now(), user.trmnlUtcOffset)
  },
})
