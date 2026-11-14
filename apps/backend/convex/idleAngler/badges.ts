import { v } from 'convex/values'
import { ACHIEVEMENT_BY_ID } from '@trmnl-games/idle-angler/content/achievements'
import { frameForTier } from '@trmnl-games/idle-angler/art/badges'
import type { Id } from '../_generated/dataModel'
import { mutation, query } from '../_generated/server'
import { appError } from '../lib/errors'
import { currentUser, runIntent } from '../lib/intent'
import { readEngineWorld } from '../lib/engine/world'
import { intentResult, strip } from './anglers'
import { currentAngler } from './profile'
import { IDLE_ANGLER_RUNTIME } from './runtime'

/**
 * P48 (idle-angler-badges.md "Celebrating in the companion"): the badges earned since the owner last looked, for the
 * Dock's card, the More tab's dot and the New tags; and the intent that marks them seen.
 */

/** When badges reached the companion. An angler with no seen marker has seen everything before this, so a player who
 * already holds eighty achievements is not greeted with eighty celebrations. */
export const BADGES_RELEASED_AT = Date.UTC(2026, 10, 14, 20, 0)
/** New unlocks read at most; the card names the best and counts the rest. */
export const MAX_NEW_BADGES = 8

/** The owner's new badges, best first (a finished family, then the rarest, then the newest), with each one's share of anglers. */
export const fresh = query({
  args: {},
  returns: v.union(v.null(), v.object({
    badges: v.array(v.object({ id: v.string(), family: v.string(), tier: v.number(), at: v.number(), percent: v.union(v.number(), v.null()) })),
    newest: v.number(),
  })),
  handler: async (ctx) => {
    const user = await currentUser(ctx)
    const angler = await currentAngler(ctx, user)
    if (user === null || angler === null || angler.activationState !== 'active') return null
    const seen = angler.achievementsSeenAt ?? BADGES_RELEASED_AT
    const rows = await ctx.db.query('iaAchievements').withIndex('by_userId_and_unlockedAt', (q) => q.eq('userId', user._id).gt('unlockedAt', seen)).order('desc').take(MAX_NEW_BADGES)
    if (rows.length === 0) return { badges: [], newest: seen }
    const world = await readEngineWorld(ctx, IDLE_ANGLER_RUNTIME)
    const publicationId = world?.publishedPublicationId as unknown as Id<'iaLeaderboardPublications'> | undefined
    const stats = publicationId ? await ctx.db.query('iaAchievementStats').withIndex('by_publicationId', (q) => q.eq('publicationId', publicationId)).unique() : null
    const percent = (id: string) => {
      const held = stats?.counts[id] ?? 0
      return stats && stats.totalPlayers > 0 && held > 0 ? Math.max(1, Math.round((held * 100) / stats.totalPlayers)) : null
    }
    const badges = rows.flatMap((row) => {
      const def = ACHIEVEMENT_BY_ID.get(row.achievementId)
      return def ? [{ id: def.id, family: def.family, tier: def.tier, at: row.unlockedAt, percent: percent(def.id), frame: frameForTier(def.family, def.tier) }] : []
    })
    badges.sort((a, b) => b.frame - a.frame || (a.percent ?? 101) - (b.percent ?? 101) || b.at - a.at)
    return { badges: badges.map(({ frame: _frame, ...badge }) => badge), newest: rows[0]!.unlockedAt }
  },
})

/**
 * Mark the new badges seen up to `upTo`, the newest unlock the owner was shown, so one earned while the card was open
 * still celebrates. The marker only moves forward and never past now; a repeat finds nothing to change.
 */
export const markSeen = mutation({
  args: { operationId: v.string(), upTo: v.number() },
  returns: intentResult,
  handler: async (ctx, { operationId, upTo }) =>
    strip(
      await runIntent(ctx, operationId, 'idleAngler.markBadgesSeen', { upTo }, async (user) => {
        const angler = await currentAngler(ctx, user)
        if (angler === null || angler.activationState !== 'active') throw appError('HERO_NOT_FOUND', 'No angler yet.')
        const next = Math.min(upTo, Date.now())
        if (next <= (angler.achievementsSeenAt ?? BADGES_RELEASED_AT)) return { changed: false }
        await ctx.db.patch(angler._id, { achievementsSeenAt: next })
        return { changed: true }
      }),
    ),
})
