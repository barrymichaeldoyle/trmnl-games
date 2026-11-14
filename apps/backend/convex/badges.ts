import { v } from 'convex/values'
import { ACHIEVEMENT_BY_ID } from '@trmnl-games/desk-crawler/content/achievements'
import { frameForTier } from '@trmnl-games/desk-crawler/art/badges'
import { mutation, query } from './_generated/server'
import { appError } from './lib/errors'
import { currentHero } from './lib/gameProfile'
import { currentUser, intentReturns, runIntent } from './lib/intent'
import { readWorld } from './world'

/**
 * P49 (desk-crawler-badges.md "Celebrating in the companion"): Desk Crawler's badges earned since the owner last
 * looked, for the Hero page's card, the Records dot and the New tags; and the intent that marks them seen. Idle
 * Angler's twin is `idleAngler/badges.ts`.
 */

/** When badges reached Desk Crawler's companion. A hero with no seen marker has seen everything before this. */
export const BADGES_RELEASED_AT = Date.UTC(2026, 10, 14, 18, 0)
/** New unlocks read at most; the card names the best and counts the rest. */
export const MAX_NEW_BADGES = 8

/** The owner's new badges, best first (a finished family, then the rarest, then the newest), each with its share of heroes. */
export const fresh = query({
  args: {},
  returns: v.union(v.null(), v.object({
    badges: v.array(v.object({ id: v.string(), family: v.string(), tier: v.number(), at: v.number(), share: v.union(v.number(), v.null()) })),
    newest: v.number(),
  })),
  handler: async (ctx) => {
    const user = await currentUser(ctx)
    const hero = await currentHero(ctx, user)
    if (user === null || hero === null || hero.activationState !== 'active') return null
    const seen = hero.achievementsSeenAt ?? BADGES_RELEASED_AT
    const rows = await ctx.db.query('heroAchievements').withIndex('by_userId_and_unlockedAt', (q) => q.eq('userId', user._id).gt('unlockedAt', seen)).order('desc').take(MAX_NEW_BADGES)
    if (rows.length === 0) return { badges: [], newest: seen }
    const world = await readWorld(ctx)
    const publication = world?.publishedPublicationId ? await ctx.db.get(world.publishedPublicationId) : null
    const stats = publication && publication.state === 'published' ? await ctx.db.query('achievementStats').withIndex('by_publicationId', (q) => q.eq('publicationId', publication._id)).unique() : null
    const share = (id: string) => (stats && stats.totalPlayers > 0 && (stats.counts[id] ?? 0) > 0 ? (stats.counts[id] ?? 0) / stats.totalPlayers : null)
    const badges = rows.flatMap((row) => {
      const def = ACHIEVEMENT_BY_ID.get(row.achievementId)
      return def ? [{ id: def.id, family: def.family, tier: def.tier, at: row.unlockedAt, share: share(def.id), frame: frameForTier(def.family, def.tier) }] : []
    })
    badges.sort((a, b) => b.frame - a.frame || (a.share ?? 2) - (b.share ?? 2) || b.at - a.at)
    return { badges: badges.map(({ frame: _frame, ...badge }) => badge), newest: rows[0]!.unlockedAt }
  },
})

/**
 * Mark the new badges seen up to `upTo`, the newest unlock the owner was shown, so one earned while the card was open
 * still celebrates. The marker only moves forward and never past now; a repeat changes nothing.
 */
export const markSeen = mutation({
  args: { operationId: v.string(), upTo: v.number() },
  returns: intentReturns({ operationId: v.string(), changed: v.boolean() }),
  handler: async (ctx, { operationId, upTo }) =>
    await runIntent(ctx, operationId, 'badges.markSeen', { upTo }, async (user) => {
      const hero = await currentHero(ctx, user)
      if (hero === null || hero.activationState !== 'active') throw appError('HERO_NOT_FOUND', 'No hero yet.')
      const next = Math.min(upTo, Date.now())
      if (next <= (hero.achievementsSeenAt ?? BADGES_RELEASED_AT)) return { changed: false }
      await ctx.db.patch(hero._id, { achievementsSeenAt: next })
      return { changed: true }
    }),
})
