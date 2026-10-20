import { v } from 'convex/values'
import { contentV1 } from '@trmnl-games/little-plot/content'
import { buildPayload, MAX_DEVICE_LOGS } from '@trmnl-games/little-plot/lib/payload'
import type { Doc } from '../_generated/dataModel'
import { internalQuery, query, type QueryCtx } from '../_generated/server'
import { isGame } from '../lib/gameHooks'
import { currentUser } from '../lib/intent'
import { readEngineWorld } from '../lib/engine/world'
import { trmnlUserChanged } from '../lib/trmnlUser'
import { toPlotState } from './adapter'
import { deviceFlowerCode } from './flowers'
import { readDeviceBoard } from './leaderboard'
import { currentPlot, littlePlotProfile } from './profile'
import { LITTLE_PLOT_RUNTIME } from './runtime'
import { plotWeather } from './tick'

/**
 * Little Plot's device payload for one authorized installation (trmnl.md "Query read budget"): fixed reads, null for
 * any authorization failure so the HTTP layer answers a generic 404. Read-only.
 */
export const forInstance = internalQuery({
  args: { tokenHash: v.string(), uuid: v.string(), now: v.number(), utcOffset: v.optional(v.union(v.number(), v.null())), locale: v.optional(v.union(v.string(), v.null())) },
  returns: v.union(v.null(), v.object({ outcome: v.literal('recoverable') }), v.object({ outcome: v.literal('payload'), payload: v.any(), flowerCode: v.union(v.string(), v.null()), recordUserFor: v.optional(v.id('users')) })),
  handler: async (ctx, args) => {
    const instance = await ctx.db.query('trmnlInstances').withIndex('by_uuid', (q) => q.eq('uuid', args.uuid)).unique()
    if (!instance) {
      if (await ctx.db.query('revokedTrmnlCredentials').withIndex('by_tokenHash', (q) => q.eq('tokenHash', args.tokenHash)).first()) return null
      const grant = await ctx.db.query('trmnlGrants').withIndex('by_tokenHash', (q) => q.eq('tokenHash', args.tokenHash)).unique()
      return grant && isGame(grant, 'little-plot') && grant.state === 'active' && !grant.authorizedUuid ? { outcome: 'recoverable' as const } : null
    }
    const grant = await ctx.db.get(instance.grantId)
    if (!grant || !isGame(grant, 'little-plot') || grant.state !== 'active' || grant.tokenHash !== args.tokenHash || (grant.authorizedUuid && grant.authorizedUuid !== args.uuid)) return null
    if (!isGame(instance, 'little-plot') || instance.userId !== grant.userId || instance.state !== 'active') return null
    const user = await ctx.db.get(instance.userId)
    if (user === null || user.state !== 'active' || (await littlePlotProfile(ctx, user._id))?.state === 'deleting') return null
    const payload = await payloadFor(ctx, user, args.now, args.utcOffset ?? user.trmnlUtcOffset)
    const userChanged = trmnlUserChanged(user, args.utcOffset, args.locale)
    // The weekly flower code shows while the plot grows, never in the companion's preview.
    const flowerCode = payload.status === 'growing' || payload.status === 'paused' ? await deviceFlowerCode(ctx, user._id, args.now) : null
    return { outcome: 'payload' as const, payload, flowerCode, ...(userChanged ? { recordUserFor: user._id } : {}) }
  },
})

/** The canonical payload for a user's plot; shared by the device route and the owner's preview. */
export async function payloadFor(ctx: QueryCtx, user: Doc<'users'>, now: number, utcOffset?: number | null) {
  const world = await readEngineWorld(ctx, LITTLE_PLOT_RUNTIME)
  const content = (world && LITTLE_PLOT_RUNTIME.content(world.activeContentVersion)) ?? contentV1
  const doc = await currentPlot(ctx, user)
  const logs = doc ? await ctx.db.query('lpTickLogs').withIndex('by_plotId_and_at_and_sequence', (q) => q.eq('plotId', doc._id)).order('desc').take(MAX_DEVICE_LOGS) : []
  const board = doc && doc.activationState === 'active' ? await readDeviceBoard(ctx, doc) : null
  const flowers = (await littlePlotProfile(ctx, user._id))?.flowers?.totalCollected ?? 0
  return buildPayload({
    content,
    now,
    world: world ? { createdAt: world.createdAt, paused: world.ticksPaused || world.maintenanceMode, currentTick: world.currentTick, ...(world.lastCompletedAt === undefined ? {} : { lastCompletedAt: world.lastCompletedAt }) } : null,
    plot: doc ? { alias: user.publicAlias, state: toPlotState(doc), activationState: doc.activationState, quarantined: doc.simulationState === 'quarantined', flowers } : null,
    weather: await plotWeather(ctx, world?.worldSeed ?? 'world', now),
    ...(utcOffset === undefined || utcOffset === null ? {} : { utcOffsetSeconds: utcOffset }),
    stories: logs.map((l) => ({ kind: l.kind, summary: l.summary, at: l.at, effect: l.detail.effect ?? null, kindId: l.detail.kindId ?? null, ...(l.kind === 'achievement' ? { title: l.summary.replace(/^Achievement: /, '') } : {}) })),
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
