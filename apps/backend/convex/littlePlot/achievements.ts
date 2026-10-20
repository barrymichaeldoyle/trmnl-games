import { v } from 'convex/values'
import { ACHIEVEMENTS, ACHIEVEMENTS_VERSION, allSatisfied, familyProgress, needsFullPass, newlyUnlocked, type AchievementDef, type AchievementState } from '@trmnl-games/little-plot/content/achievements'
import { contentV1 } from '@trmnl-games/little-plot/content'
import { evaluateGoal, type LittlePlotCatalog } from '@trmnl-games/little-plot/sim'
import type { Doc, Id } from '../_generated/dataModel'
import { query, type MutationCtx, type QueryCtx } from '../_generated/server'
import { currentUser } from '../lib/intent'
import { readEngineWorld } from '../lib/engine/world'
import { fromPlotState, mirrored, storedDetail, toPlotState } from './adapter'
import { currentPlot, littlePlotProfile } from './profile'
import { LITTLE_PLOT_RUNTIME } from './runtime'

/**
 * Little Plot achievement authority (little-plot.md "Achievements"), the D65 rules: unlock rows keyed by owner and
 * unique per id, so a retried evaluation writes nothing twice; each unlock also writes an `achievement` story.
 */
export const MAX_LP_UNLOCKS = ACHIEVEMENTS.length

export const stateOf = (p: Pick<Doc<'plots'>, 'plot'>, flowers = 0): AchievementState => ({ counters: p.plot.counters, catalogue: p.plot.catalogue, level: p.plot.level, beds: p.plot.beds.length, flowers })

export async function flowerTotal(ctx: QueryCtx, userId: Id<'users'>): Promise<number> {
  return (await littlePlotProfile(ctx, userId))?.flowers?.totalCollected ?? 0
}

export async function awardPlot(ctx: MutationCtx, plot: Doc<'plots'>, before: AchievementState, after: AchievementState, now: number, tick: number): Promise<AchievementDef[]> {
  const fullPass = needsFullPass(plot.achievementsVersion)
  const candidates = fullPass ? allSatisfied(after) : newlyUnlocked(before, after)
  const written: AchievementDef[] = []
  let sequence = plot.logSequence
  for (const def of candidates) {
    const existing = await ctx.db.query('lpAchievements').withIndex('by_userId_and_achievementId', (q) => q.eq('userId', plot.userId).eq('achievementId', def.id)).unique()
    if (existing) continue
    await ctx.db.insert('lpAchievements', { userId: plot.userId, plotId: plot._id, achievementId: def.id, unlockedAt: now, tick, catalogVersion: ACHIEVEMENTS_VERSION })
    sequence += 1
    await ctx.db.insert('lpTickLogs', { plotId: plot._id, source: 'lifecycle', tick, sequence, at: now, kind: 'achievement', summary: `Achievement: ${def.name}`, detail: { v: 1, achievementId: def.id } })
    written.push(def)
  }
  const patch: Partial<Doc<'plots'>> = {}
  if (sequence !== plot.logSequence) patch.logSequence = sequence
  if (fullPass) patch.achievementsVersion = ACHIEVEMENTS_VERSION
  if (Object.keys(patch).length > 0) await ctx.db.patch(plot._id, patch)
  return written
}

/**
 * After an intent: first the goal, so a goal met in the companion (a sowing, a purchase, a watering) is marked off
 * and logged at once rather than on the next tick; then the achievements, comparing the plot before the intent with
 * its committed state.
 */
export async function awardAfterPlotIntent(ctx: MutationCtx, before: Doc<'plots'>, content: LittlePlotCatalog, tick: number): Promise<void> {
  await settleGoal(ctx, before._id, content)
  const plot = await ctx.db.get(before._id)
  if (!plot) return
  const flowers = await flowerTotal(ctx, plot.userId)
  await awardPlot(ctx, plot, stateOf(before, flowers), stateOf(plot, flowers), Date.now(), tick)
}

/** The goal step outside a tick: the pure `evaluateGoal`, with its line written as a command story. */
async function settleGoal(ctx: MutationCtx, plotId: Id<'plots'>, content: LittlePlotCatalog): Promise<void> {
  const plot = await ctx.db.get(plotId)
  if (!plot) return
  const before = toPlotState(plot)
  const { plot: after, event } = evaluateGoal(content, before)
  if (after === before) return
  const patch: Partial<Doc<'plots'>> = { plot: fromPlotState(after), ...mirrored(after) }
  if (event) {
    const sequence = plot.logSequence + 1
    await ctx.db.insert('lpTickLogs', { plotId, source: 'command', sequence, at: Date.now(), kind: 'goal', summary: event.summary, detail: storedDetail(event) })
    patch.logSequence = sequence
  }
  await ctx.db.patch(plotId, patch)
}

/** Publication runs: add one owner's unlocks to the run's rarity tally. */
export async function tallyPlotUnlocks(ctx: QueryCtx, userId: Id<'users'>, counts: Record<string, number>): Promise<void> {
  const rows = await ctx.db.query('lpAchievements').withIndex('by_userId_and_achievementId', (q) => q.eq('userId', userId)).take(MAX_LP_UNLOCKS)
  for (const row of rows) counts[row.achievementId] = (counts[row.achievementId] ?? 0) + 1
}

/** The owner's Little Plot achievements: progress per family and rarity from the current publication. */
export const mine = query({
  args: {},
  returns: v.any(),
  handler: async (ctx) => {
    const user = await currentUser(ctx)
    const plot = await currentPlot(ctx, user)
    if (user === null || plot === null || plot.activationState !== 'active') return null
    const world = await readEngineWorld(ctx, LITTLE_PLOT_RUNTIME)
    const content = (world && LITTLE_PLOT_RUNTIME.content(world.activeContentVersion)) ?? contentV1
    const rows = await ctx.db.query('lpAchievements').withIndex('by_userId_and_achievementId', (q) => q.eq('userId', user._id)).take(MAX_LP_UNLOCKS)
    const unlocked = new Map(rows.map((row) => [row.achievementId, row.unlockedAt]))
    const publicationId = world?.publishedPublicationId as unknown as Id<'lpLeaderboardPublications'> | undefined
    const stats = publicationId ? await ctx.db.query('lpAchievementStats').withIndex('by_publicationId', (q) => q.eq('publicationId', publicationId)).unique() : null
    return {
      catalogVersion: ACHIEVEMENTS_VERSION,
      earnedCount: rows.length,
      total: ACHIEVEMENTS.length,
      families: familyProgress(stateOf(plot, await flowerTotal(ctx, user._id)), new Set(unlocked.keys()), content).map((f) => ({
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
