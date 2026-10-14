import { v } from 'convex/values'
import { ACHIEVEMENTS, ACHIEVEMENTS_VERSION, allSatisfied, emptyCareer, familyProgress, withLife, type AchievementDef, type Career } from '@trmnl-games/paper-lives/content/achievements'
import type { Doc, Id } from '../_generated/dataModel'
import { query, type MutationCtx, type QueryCtx } from '../_generated/server'
import { currentUser } from '../lib/intent'
import { readEngineWorld } from '../lib/engine/world'
import { toLifeState } from './adapter'
import { currentLife, paperLivesProfile } from './profile'
import { PAPER_LIVES_RUNTIME } from './runtime'

/**
 * Paper Lives achievement authority (paper-lives.md "Achievements"), the D65 rules: unlock rows keyed by owner and unique
 * per id, so a retried evaluation writes nothing twice; each unlock also writes an `achievement` line. Evaluated when a
 * year ends, a life ends or the next begins, against the account's career: its finished lives plus the current one.
 */
export const MAX_PL_UNLOCKS = ACHIEVEMENTS.length

/** The folded career as stored, with the account's photo count beside it (photos are never folded from a life). */
const storedCareer = (profile: Doc<'paperLivesProfiles'> | null): Career => ({ ...emptyCareer(), ...profile?.career, photosClaimed: profile?.photosClaimed ?? 0 })

/** The account's career now: the folded finished lives, plus the current life while it is still being lived. */
export function careerNow(profile: Doc<'paperLivesProfiles'> | null, life: Doc<'lives'> | null): Career {
  const folded = storedCareer(profile)
  return life && life.life.status !== 'ended' && life.activationState === 'active' ? withLife(folded, toLifeState(life), false) : folded
}

/** Fold a finished life into the profile's career, once (records.ts calls it with the record write). */
export async function foldLife(ctx: MutationCtx, life: Doc<'lives'>, extraPieces: readonly string[] = []): Promise<void> {
  const profile = await paperLivesProfile(ctx, life.userId)
  if (!profile) return
  const { photosClaimed: _photos, ...folded } = withLife(storedCareer(profile), toLifeState(life), true)
  await ctx.db.patch(profile._id, {
    career: { ...folded, jobs: [...folded.jobs], longJobs: [...folded.longJobs], hobbies: [...folded.hobbies], traits: [...folded.traits], setPieces: [...new Set([...folded.setPieces, ...extraPieces])].sort() },
  })
}

/** Award every satisfied achievement the owner does not hold yet. Returns what was written. */
export async function awardLife(ctx: MutationCtx, lifeId: Id<'lives'>, now: number, tick: number): Promise<AchievementDef[]> {
  const life = await ctx.db.get(lifeId)
  if (!life || life.activationState !== 'active') return []
  const profile = await paperLivesProfile(ctx, life.userId)
  const held = new Set((await ctx.db.query('plAchievements').withIndex('by_userId_and_achievementId', (q) => q.eq('userId', life.userId)).take(MAX_PL_UNLOCKS)).map((row) => row.achievementId))
  const fresh = allSatisfied(careerNow(profile, life)).filter((def) => !held.has(def.id))
  let sequence = life.logSequence
  for (const def of fresh) {
    await ctx.db.insert('plAchievements', { userId: life.userId, achievementId: def.id, unlockedAt: now, tick, catalogVersion: ACHIEVEMENTS_VERSION })
    sequence += 1
    await ctx.db.insert('plTickLogs', { lifeId, ordinal: life.ordinal, source: 'lifecycle', tick, sequence, at: now, kind: 'achievement', glyph: 'star', age: life.life.age, summary: `Achievement: ${def.name}` })
  }
  if (sequence !== life.logSequence) await ctx.db.patch(lifeId, { logSequence: sequence })
  return fresh
}

/** Publication runs: add one owner's unlocks to the run's rarity tally. */
export async function tallyLifeUnlocks(ctx: QueryCtx, userId: Id<'users'>, counts: Record<string, number>): Promise<void> {
  const rows = await ctx.db.query('plAchievements').withIndex('by_userId_and_achievementId', (q) => q.eq('userId', userId)).take(MAX_PL_UNLOCKS)
  for (const row of rows) counts[row.achievementId] = (counts[row.achievementId] ?? 0) + 1
}

/** The owner's Paper Lives achievements: progress per family and rarity from the current publication. */
export const mine = query({
  args: {},
  returns: v.any(),
  handler: async (ctx) => {
    const user = await currentUser(ctx)
    const life = await currentLife(ctx, user)
    if (user === null || life === null || life.activationState !== 'active') return null
    const profile = await paperLivesProfile(ctx, user._id)
    const rows = await ctx.db.query('plAchievements').withIndex('by_userId_and_achievementId', (q) => q.eq('userId', user._id)).take(MAX_PL_UNLOCKS)
    const unlocked = new Map(rows.map((row) => [row.achievementId, row.unlockedAt]))
    const world = await readEngineWorld(ctx, PAPER_LIVES_RUNTIME)
    const publicationId = world?.publishedPublicationId as unknown as Id<'plLeaderboardPublications'> | undefined
    const stats = publicationId ? await ctx.db.query('plAchievementStats').withIndex('by_publicationId', (q) => q.eq('publicationId', publicationId)).unique() : null
    return {
      catalogVersion: ACHIEVEMENTS_VERSION,
      earnedCount: rows.length,
      total: ACHIEVEMENTS.length,
      families: familyProgress(careerNow(profile, life), new Set(unlocked.keys())).map((f) => ({
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
