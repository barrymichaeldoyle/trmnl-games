import type { Doc, Id } from '../_generated/dataModel'
import type { MutationCtx, QueryCtx } from '../_generated/server'
import { ACHIEVEMENTS_VERSION, type AchievementDef } from '@trmnl-games/desk-crawler/content/achievements'
import { allSatisfied, needsFullPass, newlyUnlocked, type AchievementState } from '@trmnl-games/desk-crawler/sim/core/achievements'
import { careerLine, reachSatisfiedRung } from '@trmnl-games/desk-crawler/sim/core/career'
import { codePoints } from '@trmnl-games/desk-crawler/sim/core/narrative'
import { SIMULATION_VERSION } from '@trmnl-games/desk-crawler/sim/core/simulate'
import type { ContentCatalog } from '@trmnl-games/desk-crawler/sim/core/types'
import { withCounterDefaults } from '@trmnl-games/desk-crawler/sim/core/starter'
import { toHeroState } from '../sim/runs/adapter'

/**
 * Achievement authority (achievements.md "Storage", D65). Unlock rows are
 * keyed by owner and unique per achievement id; a duplicate evaluation under a
 * retried or concurrent transaction finds the row and writes nothing. Every
 * unlock also writes one `achievement` log so the device can celebrate it.
 */

/** At most this many unlock rows are read per owner; the catalog is far smaller. */
export const MAX_UNLOCK_ROWS = 1024

export function achievementState(hero: Pick<Doc<'heroes'>, 'level' | 'bagCapacity' | 'counters'> & { class?: Doc<'heroes'>['class'] }, keepsakeTotal: number): AchievementState {
  return { level: hero.level, bagCapacity: hero.bagCapacity, counters: withCounterDefaults(hero.counters), keepsakeTotal, ...(hero.class === undefined ? {} : { heroClass: hero.class }) }
}

export async function keepsakeTotal(ctx: QueryCtx, userId: Id<'users'>): Promise<number> {
  const collection = await ctx.db.query('deskKeepsakes').withIndex('by_userId', (q) => q.eq('userId', userId)).unique()
  return collection?.totalCollected ?? 0
}

/** The owner's unlocked achievement ids. */
export async function unlockedIds(ctx: QueryCtx, userId: Id<'users'>): Promise<Set<string>> {
  const rows = await ctx.db.query('heroAchievements').withIndex('by_userId_and_achievementId', (q) => q.eq('userId', userId)).take(MAX_UNLOCK_ROWS)
  return new Set(rows.map((row) => row.achievementId))
}

/**
 * Award whatever `after` newly satisfies. The fast path diffs the two states
 * without reading storage; a hero behind the catalog version gets one full
 * pass against its unlock rows. Returns the achievements written this call.
 */
export async function awardAchievements(
  ctx: MutationCtx,
  hero: Doc<'heroes'>,
  before: AchievementState,
  after: AchievementState,
  content: ContentCatalog,
  now: number,
  tick: number,
): Promise<AchievementDef[]> {
  const fullPass = needsFullPass(hero.achievementsVersion)
  const candidates = fullPass ? allSatisfied(after, content) : newlyUnlocked(before, after, content)
  const written: AchievementDef[] = []
  let sequence = hero.logSequence
  for (const def of candidates) {
    const existing = await ctx.db
      .query('heroAchievements')
      .withIndex('by_userId_and_achievementId', (q) => q.eq('userId', hero.userId).eq('achievementId', def.id))
      .unique()
    if (existing) continue
    await ctx.db.insert('heroAchievements', { userId: hero.userId, heroId: hero._id, achievementId: def.id, unlockedAt: now, tick, catalogVersion: ACHIEVEMENTS_VERSION })
    sequence += 1
    await ctx.db.insert('tickLogs', {
      heroId: hero._id,
      source: 'lifecycle',
      tick,
      sequence,
      at: now,
      kind: 'achievement',
      summary: `Achievement: [[${def.name}]]`,
      detail: { v: 1, achievementId: def.id, name: def.name, family: def.family, tier: def.tier },
      deltas: { xpEarned: 0, gold: 0, hp: 0 },
    })
    written.push(def)
  }
  const patch: Partial<Doc<'heroes'>> = {}
  if (sequence !== hero.logSequence) patch.logSequence = sequence
  if (fullPass) patch.achievementsVersion = ACHIEVEMENTS_VERSION
  if (Object.keys(patch).length > 0) await ctx.db.patch(hero._id, patch)
  return written
}

/** For intents: the goal first, so a rung the action just finished is marked done before the response returns, then achievements. */
export async function awardAfterIntent(ctx: MutationCtx, before: Doc<'heroes'>, content: ContentCatalog, tick: number): Promise<AchievementDef[]> {
  const hero = await ctx.db.get(before._id)
  if (hero === null) return []
  const settled = await settleCompanionGoal(ctx, hero, content, tick)
  const keepsakes = await keepsakeTotal(ctx, settled.userId)
  return await awardAchievements(ctx, settled, achievementState(before, keepsakes), achievementState(settled, keepsakes), content, Date.now(), tick)
}

/**
 * A companion action can finish the current goal (salvage, sell, equip, a stance). Mark that rung reached now,
 * with its reward waiting on Claim, instead of on the next adventure. The pointer moves, so the following tick
 * does not pay it again.
 */
async function settleCompanionGoal(ctx: MutationCtx, hero: Doc<'heroes'>, content: ContentCatalog, tick: number): Promise<Doc<'heroes'>> {
  const now = Date.now()
  const { hero: next, reached } = reachSatisfiedRung(toHeroState(hero), content, tick, now)
  if (!reached || next.career === undefined) return hero
  const { full, compact } = careerLine({ variant: 'career', phase: 'reached', id: reached.id, title: reached.title, ...(reached.next === undefined ? {} : { next: reached.next }), gold: reached.gold })
  const summary = codePoints(full) <= content.constants.summaryMaxCodePoints ? full : compact
  const sequence = hero.logSequence + 1
  await ctx.db.insert('tickLogs', {
    heroId: hero._id,
    source: 'command',
    sequence,
    at: now,
    kind: 'career',
    summary,
    detail: {
      v: 1,
      simulationVersion: SIMULATION_VERSION,
      contentVersion: content.contentVersion,
      disposition: dispositionFor(hero.status),
      potionsUsed: 0,
      levelsGained: 0,
      goldPenalty: 0,
      heldFind: false,
      outcome: { variant: 'career', phase: 'reached', id: reached.id, title: reached.title, ...(reached.next === undefined ? {} : { next: reached.next }), gold: reached.gold },
    },
    deltas: { xpEarned: 0, gold: 0, hp: 0 },
  })
  const career = next.career
  await ctx.db.patch(hero._id, {
    logSequence: sequence,
    counters: next.counters,
    career: {
      rung: career.rung,
      startedTick: career.startedTick,
      reached: career.reached.map((entry) => ({ ...entry })),
      ...(career.unclaimed === undefined ? {} : { unclaimed: career.unclaimed.map((entry) => ({ ...entry })) }),
    },
  })
  return (await ctx.db.get(hero._id)) ?? hero
}

/** A career line stores a disposition because every simulation detail does. The action itself changed no status. */
function dispositionFor(status: Doc<'heroes'>['status']): 'advanced' | 'rested' | 'waiting_travel' | 'waiting_dead' | 'paused' | 'sleeping' {
  switch (status) {
    case 'resting':
      return 'rested'
    case 'travelling':
      return 'waiting_travel'
    case 'dead':
      return 'waiting_dead'
    case 'paused':
      return 'paused'
    case 'sleeping':
      return 'sleeping'
    default:
      return 'advanced'
  }
}

/** Publication runs: add one hero's unlocks to the run tally (achievements.md "Rarity"). */
export async function tallyUnlocks(ctx: QueryCtx, userId: Id<'users'>, counts: Record<string, number>): Promise<void> {
  for (const id of await unlockedIds(ctx, userId)) counts[id] = (counts[id] ?? 0) + 1
}

export function mergeCounts(base: Record<string, number> | undefined, add: Record<string, number>): Record<string, number> {
  const merged: Record<string, number> = { ...(base ?? {}) }
  for (const [id, count] of Object.entries(add)) merged[id] = (merged[id] ?? 0) + count
  return merged
}
