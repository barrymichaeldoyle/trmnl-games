import { v } from 'convex/values'
import { flowerBook, flowerForClaim, flowerWeek, flowerWeekStartsAt } from '@trmnl-games/little-plot/content/flowers'
import type { Id } from '../_generated/dataModel'
import { mutation, query, type QueryCtx } from '../_generated/server'
import { appError } from '../lib/errors'
import { isGame } from '../lib/gameHooks'
import { currentUser, intentReturns, isIntentRefusal, runIntent } from '../lib/intent'
import { keepsakeCode, normalizedKeepsakeCode } from '../lib/keepsakes'
import { readEngineWorld } from '../lib/engine/world'
import { awardPlot, stateOf } from './achievements'
import { currentPlot, littlePlotProfile } from './profile'
import { LITTLE_PLOT_RUNTIME } from './runtime'

/**
 * Pressed flowers (little-plot.md "Staying on the TRMNL"), Desk Crawler's keepsake rules (D46/D73): the device shows
 * a six-digit weekly code the companion preview never does; entering it presses one flower. One a week, last week's
 * code still works for a slow screen, a missed week costs nothing, and wrong guesses are limited to ten a day.
 */
const MISS_WINDOW_MS = 24 * 60 * 60 * 1000
export const FLOWER_MISS_LIMIT = 10
export const flowerCode = (tokenHash: string, userId: string, week: number) => keepsakeCode(tokenHash, userId, week, 'little-plot-flower-v1')

/** The newest active Little Plot installation's grant: the key for this account's code. */
export async function flowerGrant(ctx: QueryCtx, userId: Id<'users'>) {
  const instances = await ctx.db.query('trmnlInstances').withIndex('by_userId_and_state', (q) => q.eq('userId', userId).eq('state', 'active')).order('desc').take(10)
  const instance = instances.find((row) => isGame(row, 'little-plot'))
  if (!instance) return null
  const grant = await ctx.db.get(instance.grantId)
  return grant && isGame(grant, 'little-plot') && grant.userId === userId && grant.state === 'active' ? grant : null
}

/** The code for this week, for the device route only; never for the companion. */
export async function deviceFlowerCode(ctx: QueryCtx, userId: Id<'users'>, now: number): Promise<string | null> {
  const week = flowerWeek(now)
  const profile = await littlePlotProfile(ctx, userId)
  if (profile?.flowers && profile.flowers.lastClaimWeek >= week) return null
  const grant = await flowerGrant(ctx, userId)
  return grant ? flowerCode(grant.tokenHash, userId, week) : null
}

export const mine = query({
  args: {},
  returns: v.any(),
  handler: async (ctx) => {
    const user = await currentUser(ctx)
    if (!user || user.state !== 'active') return null
    const profile = await littlePlotProfile(ctx, user._id)
    if (profile?.state === 'deleting') return null
    const plot = await currentPlot(ctx, user)
    if (!plot || plot.activationState !== 'active') return null
    const total = profile?.flowers?.totalCollected ?? 0
    return {
      totalCollected: total,
      claimedThisWeek: profile?.flowers !== undefined && profile.flowers.lastClaimWeek >= flowerWeek(Date.now()),
      nextAvailableAt: profile?.flowers ? flowerWeekStartsAt(profile.flowers.lastClaimWeek + 1) : null,
      connected: (await flowerGrant(ctx, user._id)) !== null,
      newest: total > 0 ? flowerForClaim(total).id : null,
      book: flowerBook(total).map((f) => ({ id: f.id, name: f.name, count: f.count })),
    }
  },
})

export const claim = mutation({
  args: { operationId: v.string(), code: v.string() },
  returns: intentReturns({ operationId: v.string(), changed: v.boolean(), outcome: v.union(v.literal('claimed'), v.literal('already_claimed'), v.literal('invalid_code')), totalCollected: v.number() }),
  handler: async (ctx, args) => {
    const code = normalizedKeepsakeCode(args.code.slice(0, 64))
    const result = await runIntent(ctx, args.operationId, 'littlePlot.flowers.claim', { code }, async (user) => {
      const plot = await currentPlot(ctx, user)
      if (!plot || plot.activationState !== 'active') throw appError('TRMNL_REQUIRED', 'Save Little Plot in TRMNL to press flowers.')
      const now = Date.now()
      const week = flowerWeek(now)
      const profile = await littlePlotProfile(ctx, user._id)
      const total = profile?.flowers?.totalCollected ?? 0
      if (profile?.flowers && profile.flowers.lastClaimWeek >= week) return { changed: false, count: total, keepsakeOutcome: 'already_claimed' as const }
      const windowStart = Math.floor(now / MISS_WINDOW_MS) * MISS_WINDOW_MS
      const missKey = `flower:${user._id}`
      const misses = await ctx.db.query('rateLimitBuckets').withIndex('by_key_and_windowStart', (q) => q.eq('key', missKey).eq('windowStart', windowStart)).unique()
      if (misses && misses.count >= FLOWER_MISS_LIMIT) throw appError('RATE_LIMITED', 'Too many wrong flower codes today. Try again tomorrow.')
      const grant = await flowerGrant(ctx, user._id)
      const valid = grant !== null && /^\d{6}$/.test(code) && [week, week - 1].some((period) => normalizedKeepsakeCode(flowerCode(grant.tokenHash, user._id, period)) === code)
      if (!valid) {
        if (misses) await ctx.db.patch(misses._id, { count: misses.count + 1 })
        else await ctx.db.insert('rateLimitBuckets', { key: missKey, windowStart, count: 1, expiresAt: windowStart + 2 * MISS_WINDOW_MS })
        return { changed: false, count: total, keepsakeOutcome: 'invalid_code' as const }
      }
      const flowers = { totalCollected: total + 1, lastClaimWeek: week, lastClaimedAt: now }
      if (profile) await ctx.db.patch(profile._id, { flowers })
      const world = await readEngineWorld(ctx, LITTLE_PLOT_RUNTIME)
      await awardPlot(ctx, plot, stateOf(plot, total), stateOf(plot, total + 1), now, world?.currentTick ?? 0)
      return { changed: true, count: flowers.totalCollected, keepsakeOutcome: 'claimed' as const }
    })
    if (isIntentRefusal(result)) return result
    const outcome = result.keepsakeOutcome!
    if (outcome === 'easter_egg') throw appError('SERVICE_PAUSED', 'Your flower book needs a service check.')
    return { operationId: result.operationId, changed: result.changed, outcome, totalCollected: result.count! }
  },
})
