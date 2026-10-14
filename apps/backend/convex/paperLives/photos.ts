import { v } from 'convex/values'
import { portraitKey } from '@trmnl-games/paper-lives/art/route'
import { photoWeek, photoWeekStartsAt } from '@trmnl-games/paper-lives/content/photos'
import type { Id } from '../_generated/dataModel'
import { mutation, query, type QueryCtx } from '../_generated/server'
import { appError } from '../lib/errors'
import { isGame } from '../lib/gameHooks'
import { currentUser, runIntent } from '../lib/intent'
import { normalizedKeepsakeCode, photoCode } from '../lib/keepsakes'
import { readEngineWorld } from '../lib/engine/world'
import { toLifeState } from './adapter'
import { awardLife } from './achievements'
import { currentLife, paperLivesProfile } from './profile'
import { PAPER_LIVES_RUNTIME } from './runtime'

/**
 * The photo album (paper-lives.md "Staying on the TRMNL"), on Idle Angler's fly rules (D46/D73): the device title bar
 * shows a six-digit weekly code the companion preview never does; entering it takes a photo of the character as they
 * are that week. One a week, last week's code still works for a slow screen, a missed week costs nothing, and wrong
 * guesses are limited to ten a day. Photos change nothing in the life.
 */
const MISS_WINDOW_MS = 24 * 60 * 60 * 1000
export const PHOTO_MISS_LIMIT = 10
/** Photos listed with a life: a year of weeks is far more than one life collects at a weekly code. */
export const PHOTOS_PER_LIFE = 60

/** The newest active Paper Lives installation's grant: the key for this account's code. */
export async function photoGrant(ctx: QueryCtx, userId: Id<'users'>) {
  const instances = await ctx.db.query('trmnlInstances').withIndex('by_userId_and_state', (q) => q.eq('userId', userId).eq('state', 'active')).order('desc').take(10)
  const instance = instances.find((row) => isGame(row, 'paper-lives'))
  if (!instance) return null
  const grant = await ctx.db.get(instance.grantId)
  return grant && isGame(grant, 'paper-lives') && grant.userId === userId && grant.state === 'active' ? grant : null
}

/** The code for this week, for the device route only; never for the companion. Null once this week's photo is taken. */
export async function devicePhotoCode(ctx: QueryCtx, userId: Id<'users'>, now: number): Promise<string | null> {
  const profile = await paperLivesProfile(ctx, userId)
  if (profile?.lastPhotoWeek !== undefined && profile.lastPhotoWeek >= photoWeek(now)) return null
  const grant = await photoGrant(ctx, userId)
  return grant ? photoCode(grant.tokenHash, userId, photoWeek(now)) : null
}

/** One photo as the companion and the public life page show it. */
export const photoView = (photo: { name: string; age: number; petName?: string; takenAt: number; portrait: ReturnType<typeof portraitKey> }) => ({
  name: photo.name,
  age: photo.age,
  petName: photo.petName ?? null,
  takenAt: photo.takenAt,
  portrait: photo.portrait,
})

/** A life's photos, oldest first. */
export async function photosOf(ctx: QueryCtx, userId: Id<'users'>, ordinal: number) {
  const rows = await ctx.db.query('plPhotos').withIndex('by_userId_and_ordinal', (q) => q.eq('userId', userId).eq('ordinal', ordinal)).take(PHOTOS_PER_LIFE)
  return rows.map(photoView)
}

export const mine = query({
  args: {},
  returns: v.any(),
  handler: async (ctx) => {
    const user = await currentUser(ctx)
    const life = await currentLife(ctx, user)
    if (user === null || life === null || life.activationState !== 'active') return null
    const profile = await paperLivesProfile(ctx, user._id)
    const last = profile?.lastPhotoWeek
    return {
      totalCollected: profile?.photosClaimed ?? 0,
      claimedThisWeek: last !== undefined && last >= photoWeek(Date.now()),
      nextAvailableAt: last === undefined ? null : photoWeekStartsAt(last + 1),
      connected: (await photoGrant(ctx, user._id)) !== null,
      living: life.life.status !== 'ended',
      photos: await photosOf(ctx, user._id, life.ordinal),
    }
  },
})

export const claim = mutation({
  args: { operationId: v.string(), code: v.string() },
  returns: v.object({ operationId: v.string(), changed: v.boolean(), outcome: v.union(v.literal('claimed'), v.literal('already_claimed'), v.literal('invalid_code')), totalCollected: v.number() }),
  handler: async (ctx, args) => {
    const code = normalizedKeepsakeCode(args.code.slice(0, 64))
    const result = await runIntent(ctx, args.operationId, 'paperLives.photos.claim', { code }, async (user) => {
      const life = await currentLife(ctx, user)
      if (!life || life.activationState !== 'active') throw appError('TRMNL_REQUIRED', 'Save Paper Lives in TRMNL to take photos.')
      if (life.life.status === 'ended') throw appError('INVALID_STATE', 'A photo needs someone in it. Begin the next life first.')
      const profile = await paperLivesProfile(ctx, user._id)
      if (!profile) throw appError('TRMNL_REQUIRED', 'Save Paper Lives in TRMNL to take photos.')
      const now = Date.now()
      const week = photoWeek(now)
      const total = profile.photosClaimed ?? 0
      if (profile.lastPhotoWeek !== undefined && profile.lastPhotoWeek >= week) return { changed: false, count: total, keepsakeOutcome: 'already_claimed' as const }
      const windowStart = Math.floor(now / MISS_WINDOW_MS) * MISS_WINDOW_MS
      const missKey = `photo:${user._id}`
      const misses = await ctx.db.query('rateLimitBuckets').withIndex('by_key_and_windowStart', (q) => q.eq('key', missKey).eq('windowStart', windowStart)).unique()
      if (misses && misses.count >= PHOTO_MISS_LIMIT) throw appError('RATE_LIMITED', 'Too many wrong photo codes today. Try again tomorrow.')
      const grant = await photoGrant(ctx, user._id)
      const valid = grant !== null && /^\d{6}$/.test(code) && [week, week - 1].some((period) => normalizedKeepsakeCode(photoCode(grant.tokenHash, user._id, period)) === code)
      if (!valid) {
        if (misses) await ctx.db.patch(misses._id, { count: misses.count + 1 })
        else await ctx.db.insert('rateLimitBuckets', { key: missKey, windowStart, count: 1, expiresAt: windowStart + 2 * MISS_WINDOW_MS })
        return { changed: false, count: total, keepsakeOutcome: 'invalid_code' as const }
      }
      const state = life.life
      await ctx.db.insert('plPhotos', {
        userId: user._id,
        lifeId: life._id,
        ordinal: life.ordinal,
        week,
        takenAt: now,
        name: `${state.first} ${state.last}`,
        age: state.age,
        ...(state.pet ? { petName: state.pet.name } : {}),
        portrait: portraitKey({ ...toLifeState(life), status: 'living' }),
      })
      await ctx.db.patch(profile._id, { photosClaimed: total + 1, lastPhotoWeek: week })
      // Cosmetic only: the Photos achievement family reads the new total.
      const world = await readEngineWorld(ctx, PAPER_LIVES_RUNTIME)
      await awardLife(ctx, life._id, now, world?.currentTick ?? 0)
      return { changed: true, count: total + 1, keepsakeOutcome: 'claimed' as const }
    })
    // The receipt field is shared with Desk Crawler keepsakes; photos never produce its Easter Egg outcome (D140).
    const outcome = result.keepsakeOutcome!
    if (outcome === 'easter_egg') throw appError('SERVICE_PAUSED', 'Your album needs a service check.')
    return { operationId: result.operationId, changed: result.changed, outcome, totalCollected: result.count! }
  },
})
