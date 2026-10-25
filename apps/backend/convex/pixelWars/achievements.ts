import { v } from 'convex/values'
import { ACHIEVEMENTS, ACHIEVEMENTS_VERSION, allSatisfied, familyProgress, needsFullPass, newlyUnlocked, type AchievementDef, type AchievementState } from '@trmnl-games/pixel-wars/content/achievements'
import type { Doc, Id } from '../_generated/dataModel'
import { query, type MutationCtx, type QueryCtx } from '../_generated/server'
import { currentUser } from '../lib/intent'
import { readEngineWorld } from '../lib/engine/world'
import { currentDesk } from './profile'
import { PIXEL_WARS_RUNTIME } from './runtime'

/** Pixel Wars achievement authority (pixel-wars.md "Achievements"), the D65 rules: unlock rows keyed by owner and unique per id. */
export const MAX_PW_UNLOCKS = ACHIEVEMENTS.length

export const stateOf = (d: Pick<Doc<'desks'>, 'counters' | 'level'>): AchievementState => ({ counters: d.counters, level: d.level })

export async function awardDesk(ctx: MutationCtx, desk: Doc<'desks'>, before: AchievementState, after: AchievementState, now: number, tick: number): Promise<AchievementDef[]> {
  const fullPass = needsFullPass(desk.achievementsVersion)
  const candidates = fullPass ? allSatisfied(after) : newlyUnlocked(before, after)
  const written: AchievementDef[] = []
  let sequence = desk.logSequence
  for (const def of candidates) {
    const existing = await ctx.db.query('pwAchievements').withIndex('by_userId_and_achievementId', (q) => q.eq('userId', desk.userId).eq('achievementId', def.id)).unique()
    if (existing) continue
    await ctx.db.insert('pwAchievements', { userId: desk.userId, deskId: desk._id, achievementId: def.id, unlockedAt: now, tick, catalogVersion: ACHIEVEMENTS_VERSION })
    sequence += 1
    await ctx.db.insert('pwTickLogs', { deskId: desk._id, source: 'lifecycle', tick, sequence, at: now, kind: 'achievement', summary: `Achievement: ${def.name}`, detail: { v: 1, achievementId: def.id } })
    written.push(def)
  }
  const patch: Partial<Doc<'desks'>> = {}
  if (sequence !== desk.logSequence) patch.logSequence = sequence
  if (fullPass) patch.achievementsVersion = ACHIEVEMENTS_VERSION
  if (Object.keys(patch).length > 0) await ctx.db.patch(desk._id, patch)
  return written
}

/** Publication runs: add one owner's unlocks to the run's rarity tally. */
export async function tallyDeskUnlocks(ctx: QueryCtx, userId: Id<'users'>, counts: Record<string, number>): Promise<void> {
  const rows = await ctx.db.query('pwAchievements').withIndex('by_userId_and_achievementId', (q) => q.eq('userId', userId)).take(MAX_PW_UNLOCKS)
  for (const row of rows) counts[row.achievementId] = (counts[row.achievementId] ?? 0) + 1
}

/** The owner's Pixel Wars achievements: progress per family and rarity from the current publication. */
export const mine = query({
  args: {},
  returns: v.any(),
  handler: async (ctx) => {
    const user = await currentUser(ctx)
    const desk = await currentDesk(ctx, user)
    if (user === null || desk === null || desk.activationState !== 'active') return null
    const world = await readEngineWorld(ctx, PIXEL_WARS_RUNTIME)
    const rows = await ctx.db.query('pwAchievements').withIndex('by_userId_and_achievementId', (q) => q.eq('userId', user._id)).take(MAX_PW_UNLOCKS)
    const unlocked = new Map(rows.map((row) => [row.achievementId, row.unlockedAt]))
    const publicationId = world?.publishedPublicationId as unknown as Id<'pwLeaderboardPublications'> | undefined
    const stats = publicationId ? await ctx.db.query('pwAchievementStats').withIndex('by_publicationId', (q) => q.eq('publicationId', publicationId)).unique() : null
    return {
      catalogVersion: ACHIEVEMENTS_VERSION,
      earnedCount: rows.length,
      total: ACHIEVEMENTS.length,
      families: familyProgress(stateOf(desk), new Set(unlocked.keys())).map((f) => ({
        family: f.family,
        name: f.name,
        category: f.category,
        tiers: f.tiers,
        earned: f.earned ? { id: f.earned.id, name: f.earned.name, blurb: f.earned.blurb, tier: f.earned.tier, unlockedAt: unlocked.get(f.earned.id) ?? null } : null,
        next: f.next ? { id: f.next.id, name: f.next.name, blurb: f.next.blurb, tier: f.next.tier } : null,
        value: f.value,
        target: f.target,
      })),
      rarity: stats ? { counts: stats.counts, totalPlayers: stats.totalPlayers } : null,
    }
  },
})
