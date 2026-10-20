import { v } from 'convex/values'
import { contentV1 } from '@trmnl-games/idle-angler/content'
import { buildPayload, MAX_RECAP_STORIES } from '@trmnl-games/idle-angler/payload'
import { conditionsAt } from '@trmnl-games/idle-angler/sim/simulate'
import { goalLine, goalWaiting, speciesLogged } from '@trmnl-games/idle-angler/sim'
import { toAnglerState } from './adapter'
import { forecastFor } from '@trmnl-games/idle-angler/sim/seed'
import type { Doc } from '../_generated/dataModel'
import { internalQuery, query, type QueryCtx } from '../_generated/server'
import { isGame } from '../lib/gameHooks'
import { currentUser } from '../lib/intent'
import { readEngineWorld } from '../lib/engine/world'
import { currentAngler, idleAnglerProfile } from './profile'
import { IDLE_ANGLER_RUNTIME, IDLE_ANGLER_SCHEDULE } from './runtime'
import { readDeviceBoard } from './leaderboard'
import { deviceFlyCode, flyTotal } from './flies'
import { flyForClaim } from '@trmnl-games/idle-angler/content/flies'
import { deviceLocale, trmnlUserChanged } from '../lib/trmnlUser'

/**
 * Idle Angler's device payload for one authorized installation (trmnl.md "Query read budget"): fixed reads,
 * null for any authorization failure so the HTTP layer answers a generic 404. Read-only.
 */
export const forInstance = internalQuery({
  args: { tokenHash: v.string(), uuid: v.string(), now: v.number(), utcOffset: v.optional(v.union(v.number(), v.null())), locale: v.optional(v.union(v.string(), v.null())) },
  returns: v.union(v.null(), v.object({ outcome: v.literal('recoverable') }), v.object({ outcome: v.literal('payload'), payload: v.any(), flyCode: v.union(v.string(), v.null()), recordUserFor: v.optional(v.id('users')) })),
  handler: async (ctx, args) => {
    const instance = await ctx.db.query('trmnlInstances').withIndex('by_uuid', (q) => q.eq('uuid', args.uuid)).unique()
    if (!instance) {
      if (await ctx.db.query('revokedTrmnlCredentials').withIndex('by_tokenHash', (q) => q.eq('tokenHash', args.tokenHash)).first()) return null
      const grant = await ctx.db.query('trmnlGrants').withIndex('by_tokenHash', (q) => q.eq('tokenHash', args.tokenHash)).unique()
      return grant && isGame(grant, 'idle-angler') && grant.state === 'active' && !grant.authorizedUuid ? { outcome: 'recoverable' as const } : null
    }
    const grant = await ctx.db.get(instance.grantId)
    if (!grant || !isGame(grant, 'idle-angler') || grant.state !== 'active' || grant.tokenHash !== args.tokenHash || (grant.authorizedUuid && grant.authorizedUuid !== args.uuid)) return null
    if (!isGame(instance, 'idle-angler') || instance.userId !== grant.userId || instance.state !== 'active') return null
    const user = await ctx.db.get(instance.userId)
    if (user === null || user.state !== 'active' || (await idleAnglerProfile(ctx, user._id))?.state === 'deleting') return null
    const payload = await payloadFor(ctx, user, args.now, args.utcOffset ?? null)
    const userChanged = trmnlUserChanged(user, args.utcOffset, args.locale)
    // Device envelope only: the companion's preview never carries the weekly fly code.
    const flyCode = payload.status === 'fishing' || payload.status === 'paused' || payload.status === 'travelling' ? await deviceFlyCode(ctx, user._id, args.now) : null
    return { outcome: 'payload' as const, payload, flyCode, ...(userChanged ? { recordUserFor: user._id } : {}) }
  },
})

/** The canonical payload for a user's angler; shared by the device route and the owner's preview. */
export async function payloadFor(ctx: QueryCtx, user: Doc<'users'>, now: number, utcOffset: number | null) {
  const world = await readEngineWorld(ctx, IDLE_ANGLER_RUNTIME)
  const content = (world && IDLE_ANGLER_RUNTIME.content(world.activeContentVersion)) ?? contentV1
  const angler = await currentAngler(ctx, user)
  const slot = IDLE_ANGLER_SCHEDULE.wallSlotFor(now)
  const waterId = angler?.travelTo ?? angler?.waterId ?? 'millpond'
  const weather = world ? forecastFor(world.worldSeed, content, waterId, slot) : 'clear'
  const offset = utcOffset ?? user.trmnlUtcOffset
  const { band } = conditionsAt({ tickAt: slot, ...(offset === undefined ? {} : { utcOffsetSeconds: offset }), weather, content })
  const coolerUsed = angler ? (await ctx.db.query('catches').withIndex('by_anglerId', (q) => q.eq('anglerId', angler._id)).take(32)).length : 0
  const logs = angler
    ? (await ctx.db.query('iaTickLogs').withIndex('by_anglerId_and_at_and_sequence', (q) => q.eq('anglerId', angler._id)).order('desc').take(MAX_RECAP_STORIES)).filter((log) => log.source !== 'command')
    : []
  return buildPayload({
    content,
    now,
    world: world ? { createdAt: world.createdAt, paused: world.ticksPaused || world.maintenanceMode, ...(world.lastCompletedAt === undefined ? {} : { lastCompletedAt: world.lastCompletedAt }) } : null,
    angler: angler && {
      alias: user.publicAlias,
      activationState: angler.activationState,
      status: angler.status,
      quarantined: angler.simulationState === 'quarantined',
      gold: angler.gold,
      waterId: angler.waterId,
      ...(angler.travelTo === undefined ? {} : { travelTo: angler.travelTo }),
      rodTier: angler.rodTier,
      coolerTier: angler.coolerTier,
      ...(angler.baitOnHook === undefined ? {} : { baitOnHook: angler.baitOnHook }),
      bait: angler.bait,
      speciesLogged: Object.keys(angler.logbook).length,
      speciesHere: speciesLogged(content, angler.logbook, angler.waterId),
      fly: await flyTotal(ctx, user._id).then((total) => (total > 0 ? flyForClaim(total).id : null)),
      goal: goalLine(content, toAnglerState(angler)),
      goalWaiting: goalWaiting(angler.goal?.unclaimed),
    },
    coolerUsed,
    weather,
    band,
    artBaseUrl: process.env.CONVEX_SITE_URL ?? null,
    locale: deviceLocale(user),
    board: angler && angler.activationState === 'active' ? await readDeviceBoard(ctx, angler, now) : null,
    stories: logs.map((log) => ({ kind: log.kind, summary: log.summary, at: log.at, ...(log.detail.speciesId === undefined ? {} : { speciesId: log.detail.speciesId }), ...(log.detail.grams === undefined ? {} : { grams: log.detail.grams }), ...(log.kind === 'achievement' && log.detail.name !== undefined ? { title: log.detail.name } : {}) })),
  })
}

/** The owner's own device preview in the companion (no installation needed). */
export const preview = query({
  args: {},
  returns: v.any(),
  handler: async (ctx) => {
    const user = await currentUser(ctx)
    if (user === null || user.state !== 'active') return null
    return await payloadFor(ctx, user, Date.now(), null)
  },
})
