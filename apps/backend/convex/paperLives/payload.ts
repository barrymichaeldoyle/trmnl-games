import { v } from 'convex/values'
import { contentV1 } from '@trmnl-games/paper-lives/content'
import { buildPayload, MAX_DEVICE_LOGS } from '@trmnl-games/paper-lives/payload'
import type { Doc } from '../_generated/dataModel'
import { internalQuery, query, type QueryCtx } from '../_generated/server'
import { weekKey } from '../idleAngler/records'
import { isGame } from '../lib/gameHooks'
import { currentUser } from '../lib/intent'
import { readEngineWorld } from '../lib/engine/world'
import { toLifeState } from './adapter'
import { yearTimes } from './lives'
import { currentLife, paperLivesProfile } from './profile'
import { readBoard } from './records'
import { devicePhotoCode } from './photos'
import { PAPER_LIVES_RUNTIME } from './runtime'

/** Rows on the device's board. */
export const DEVICE_TOP = 5

/**
 * Paper Lives' device payload for one authorized installation (trmnl.md "Query read budget"): fixed reads, null for
 * any authorization failure so the HTTP layer answers a generic 404. Read-only.
 */
export const forInstance = internalQuery({
  args: { tokenHash: v.string(), uuid: v.string(), now: v.number(), utcOffset: v.optional(v.union(v.number(), v.null())) },
  returns: v.union(v.null(), v.object({ outcome: v.literal('recoverable') }), v.object({ outcome: v.literal('payload'), payload: v.any(), photoCode: v.union(v.string(), v.null()), recordOffsetFor: v.optional(v.id('users')) })),
  handler: async (ctx, args) => {
    const instance = await ctx.db.query('trmnlInstances').withIndex('by_uuid', (q) => q.eq('uuid', args.uuid)).unique()
    if (!instance) {
      if (await ctx.db.query('revokedTrmnlCredentials').withIndex('by_tokenHash', (q) => q.eq('tokenHash', args.tokenHash)).first()) return null
      const grant = await ctx.db.query('trmnlGrants').withIndex('by_tokenHash', (q) => q.eq('tokenHash', args.tokenHash)).unique()
      return grant && isGame(grant, 'paper-lives') && grant.state === 'active' && !grant.authorizedUuid ? { outcome: 'recoverable' as const } : null
    }
    const grant = await ctx.db.get(instance.grantId)
    if (!grant || !isGame(grant, 'paper-lives') || grant.state !== 'active' || grant.tokenHash !== args.tokenHash || (grant.authorizedUuid && grant.authorizedUuid !== args.uuid)) return null
    if (!isGame(instance, 'paper-lives') || instance.userId !== grant.userId || instance.state !== 'active') return null
    const user = await ctx.db.get(instance.userId)
    if (user === null || user.state !== 'active' || (await paperLivesProfile(ctx, user._id))?.state === 'deleting') return null
    const payload = await payloadFor(ctx, user, args.now)
    const offsetChanged = args.utcOffset !== undefined && args.utcOffset !== null && args.utcOffset !== user.trmnlUtcOffset
    // The weekly photo code (L6) shows while a life is being lived, never in the companion's preview.
    const photoCode = payload.status === 'living' || payload.status === 'paused' ? await devicePhotoCode(ctx, user._id, args.now) : null
    return { outcome: 'payload' as const, payload, photoCode, ...(offsetChanged ? { recordOffsetFor: user._id } : {}) }
  },
})

/** The canonical payload for a user's life; shared by the device route and the owner's preview. */
export async function payloadFor(ctx: QueryCtx, user: Doc<'users'>, now: number) {
  const world = await readEngineWorld(ctx, PAPER_LIVES_RUNTIME)
  const content = (world && PAPER_LIVES_RUNTIME.content(world.activeContentVersion)) ?? contentV1
  const doc = await currentLife(ctx, user)
  const logs = doc ? await ctx.db.query('plTickLogs').withIndex('by_lifeId_and_at_and_sequence', (q) => q.eq('lifeId', doc._id)).order('desc').take(MAX_DEVICE_LOGS) : []
  const state = doc ? toLifeState(doc) : null
  const board = doc && doc.activationState === 'active' ? await readBoard(ctx, 'longest', weekKey(now), user._id, DEVICE_TOP) : null
  return buildPayload({
    content,
    now,
    world: world ? { createdAt: world.createdAt, paused: world.ticksPaused || world.maintenanceMode, ...(world.lastCompletedAt === undefined ? {} : { lastCompletedAt: world.lastCompletedAt }) } : null,
    life:
      doc && state
        ? { state, activationState: doc.activationState, quarantined: doc.simulationState === 'quarantined', ordinal: doc.ordinal, ...yearTimes(state, content, now) }
        : null,
    stories: logs.map((l) => ({ kind: l.kind, glyph: l.glyph, age: l.age, summary: l.summary, at: l.at, ordinal: l.ordinal })),
    board: board ? { top: board.entries.map(({ rank, name, life, age, own }) => ({ rank, name, life, age, own })), own: board.own ? { rank: board.own.rank, age: board.own.age } : null } : null,
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
    return await payloadFor(ctx, user, Date.now())
  },
})
