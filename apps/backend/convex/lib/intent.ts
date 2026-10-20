import { currentHero } from './gameProfile'
import { ConvexError, v, type GenericValidator } from 'convex/values'
import type { Doc } from '../_generated/dataModel'
import type { MutationCtx, QueryCtx } from '../_generated/server'
import { appError } from './errors'
import { sha256Hex } from './hash'

/** Receipt retention (api.md): duplicate safety lasts 24 hours. */
export const RECEIPT_TTL_MS = 24 * 60 * 60 * 1000
const RATE_WINDOW_MS = 10 * 60 * 1000
const RATE_LIMIT = 60

export type IntentResult = Doc<'operationReceipts'>['result']

/**
 * An expected refusal (a full bag, not enough gold, the wrong state). Returned instead of thrown, so Convex's
 * exception reporting never sees a normal "you can't do that" (D171). A refusal is decided before any write, and
 * no receipt is stored, so the same action can succeed once the state allows it.
 */
export type IntentRefusal = { ok: false; changed: false; code: string; message: string; operationId: string }

export const intentRefusalValidator = v.object({
  operationId: v.string(),
  ok: v.literal(false),
  changed: v.literal(false),
  code: v.string(),
  message: v.string(),
})

/** A success object, or a refusal. `ok: true` is optional so a refusal's `ok: false` cannot match the success branch. */
export function intentReturns<Fields extends Record<string, GenericValidator>>(fields: Fields) {
  return v.union(v.object({ ...fields, ok: v.optional(v.literal(true)) }), intentRefusalValidator)
}

export function isIntentRefusal(result: object): result is IntentRefusal {
  return 'ok' in result && result.ok === false
}

/** Keep a `{ operationId, changed }` return, passing a refusal through whole. */
export function narrowChanged<T extends { operationId: string; changed: boolean; ok?: false; code?: string; message?: string }>(result: T): { operationId: string; changed: boolean } | IntentRefusal {
  if (isIntentRefusal(result)) return { operationId: result.operationId, ok: false, changed: false, code: String(result.code), message: String(result.message) }
  return { operationId: result.operationId, changed: result.changed }
}

function refusalOf(error: unknown): Omit<IntentRefusal, 'operationId'> | null {
  if (!(error instanceof ConvexError) || typeof error.data !== 'object' || error.data === null || !('code' in error.data) || !('message' in error.data)) return null
  const data = error.data as { code: unknown; message: unknown }
  if (typeof data.code !== 'string' || typeof data.message !== 'string') return null
  return { ok: false, changed: false, code: data.code, message: data.message }
}

export async function currentUser(ctx: QueryCtx): Promise<Doc<'users'> | null> {
  const identity = await ctx.auth.getUserIdentity()
  if (identity === null) return null
  return await ctx.db
    .query('users')
    .withIndex('by_tokenIdentifier', (q) => q.eq('tokenIdentifier', identity.tokenIdentifier))
    .unique()
}

export async function requireActiveUser(ctx: QueryCtx): Promise<Doc<'users'>> {
  const identity = await ctx.auth.getUserIdentity()
  if (identity === null) throw appError('UNAUTHENTICATED', 'Sign in to continue.')
  const user = await currentUser(ctx)
  if (user === null || user.state !== 'active') throw appError('ACCOUNT_UNAVAILABLE', 'This account is not available.')
  return user
}

/** Gameplay intents need an activated, healthy current hero (api.md). */
export async function requirePlayableHero(ctx: QueryCtx, user: Doc<'users'>): Promise<Doc<'heroes'>> {
  const hero = await currentHero(ctx, user)
  if (hero === null) throw appError('HERO_NOT_FOUND', 'No hero yet.')
  if (hero.activationState !== 'active') throw appError('TRMNL_REQUIRED', 'Save Desk Crawler in TRMNL to start adventures.')
  if (hero.simulationState === 'quarantined') throw appError('SERVICE_PAUSED', 'This hero is paused for a service check.')
  return hero
}

/**
 * Shared intent envelope: identity/owner checks, idempotent receipt, atomic rate
 * limit, then the state change. Same operation ID + arguments returns the
 * original result; different arguments conflict. An expected refusal comes back
 * as `{ ok: false, code, message }` with no receipt. Anything else still throws,
 * which rolls the transaction back, including the limiter write.
 */
export async function runIntent(
  ctx: MutationCtx,
  operationId: string,
  operation: string,
  args: unknown,
  handler: (user: Doc<'users'>) => Promise<IntentResult>,
): Promise<(IntentResult & { operationId: string }) | IntentRefusal> {
  try {
    if (!/^[\w-]{8,64}$/.test(operationId)) throw appError('INVALID_INPUT', 'Invalid operation ID.')
    const user = await requireActiveUser(ctx)
    const argumentHash = sha256Hex(JSON.stringify([operation, args]))
    const now = Date.now()
    const prior = await ctx.db
      .query('operationReceipts')
      .withIndex('by_userId_and_operationId', (q) => q.eq('userId', user._id).eq('operationId', operationId))
      .unique()
    if (prior && prior.expiresAt > now) {
      if (prior.argumentHash !== argumentHash) throw appError('OPERATION_CONFLICT', 'This operation ID was already used for a different action.')
      return { ...prior.result, operationId }
    }

    const windowStart = Math.floor(now / RATE_WINDOW_MS) * RATE_WINDOW_MS
    const key = `intent:${user._id}`
    const bucket = await ctx.db
      .query('rateLimitBuckets')
      .withIndex('by_key_and_windowStart', (q) => q.eq('key', key).eq('windowStart', windowStart))
      .unique()
    if (bucket && bucket.count >= RATE_LIMIT) throw appError('RATE_LIMITED', 'Too many actions. Try again in a few minutes.')
    if (bucket) await ctx.db.patch(bucket._id, { count: bucket.count + 1 })
    else await ctx.db.insert('rateLimitBuckets', { key, windowStart, count: 1, expiresAt: windowStart + 2 * RATE_WINDOW_MS })

    const result = await handler(user)
    if (prior) await ctx.db.delete(prior._id)
    await ctx.db.insert('operationReceipts', { scope: operation === 'deletion.requestDeletion' || operation.startsWith('users.') ? 'platform' : operation.startsWith('idleAngler.') ? 'idle-angler' : operation.startsWith('paperLives.') ? 'paper-lives' : operation.startsWith('littlePlot.') ? 'little-plot' : 'desk-crawler', userId: user._id, operationId, operation, argumentHash, result, createdAt: now, expiresAt: now + RECEIPT_TTL_MS })
    return { ...result, operationId }
  } catch (error) {
    const refusal = refusalOf(error)
    if (refusal === null) throw error
    return { ...refusal, operationId }
  }
}

/** Append a short command log line for the hero (device and web history). */
export async function commandLog(ctx: MutationCtx, hero: Doc<'heroes'>, operation: string, summary: string, deltas: Doc<'tickLogs'>['deltas'] = { xpEarned: 0, gold: 0, hp: 0 }, extra: { bagSlots?: number; potionsBought?: number; eventId?: string; optionId?: string; effectGained?: string; stanceFrom?: 'cautious' | 'balanced' | 'bold'; materials?: Record<string, number> } = {}): Promise<void> {
  const sequence = hero.logSequence + 1
  await ctx.db.patch(hero._id, { logSequence: sequence })
  await ctx.db.insert('tickLogs', {
    heroId: hero._id,
    source: 'command',
    sequence,
    at: Date.now(),
    kind: 'system',
    summary: summary.slice(0, 90),
    detail: { v: 1, operation, ...extra },
    deltas,
  })
}
