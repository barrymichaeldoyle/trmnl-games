import { starterLife } from '@trmnl-games/paper-lives/sim'
import { deriveLifeSeeds } from '@trmnl-games/paper-lives/sim/seed'
import type { Doc, Id } from '../_generated/dataModel'
import type { MutationCtx } from '../_generated/server'
import { internal } from '../_generated/api'
import { getOrCreateEngineWorld } from '../lib/engine/world'
import { fromLifeState } from './adapter'
import { currentLife, setCurrentLife } from './profile'
import { PAPER_LIVES_RUNTIME } from './runtime'

/**
 * Paper Lives' half of the TRMNL lifecycle (paper-lives.md "The life and its starting state"). A life is prepared
 * pending at install, with a name, traits and a family but no years, and activated once by a confirmed saved
 * installation of the Paper Lives plugin. It needs no name from the form: the first name can change in the first year.
 */
export async function prepareLife(ctx: MutationCtx, user: Doc<'users'>, now: number): Promise<Id<'lives'>> {
  const world = await getOrCreateEngineWorld(ctx, PAPER_LIVES_RUNTIME)
  const content = PAPER_LIVES_RUNTIME.content(world.activeContentVersion)!
  // The birth draw is seeded per account and world, so a prepared life is stable for its owner.
  const { life, firstLog } = starterLife(content, deriveLifeSeeds(world.worldSeed, user._id, 0, PAPER_LIVES_RUNTIME.simulationVersion).birth)
  const lifeId = await ctx.db.insert('lives', {
    userId: user._id,
    createdAt: now,
    isActive: true,
    activationState: 'pending_trmnl',
    life: fromLifeState(life),
    ordinal: 1,
    eligibleFromTick: world.currentTick + 1,
    lastTick: world.currentTick,
    lastProgressTick: world.currentTick,
    logSequence: 1,
    simulationState: 'healthy',
  })
  await setCurrentLife(ctx, user, lifeId)
  await ctx.db.insert('plTickLogs', { lifeId, ordinal: 1, source: 'lifecycle', sequence: 1, at: now, kind: 'system', glyph: 'pram', age: 0, summary: firstLog })
  return lifeId
}

/** First activation baseline: the next Paper Lives tick, no catch-up. Never resets an active life. */
export async function activateLife(ctx: MutationCtx, userId: Id<'users'>, now: number): Promise<void> {
  const user = await ctx.db.get(userId)
  const life = await currentLife(ctx, user)
  if (life === null || life.activationState === 'active') return
  const world = await getOrCreateEngineWorld(ctx, PAPER_LIVES_RUNTIME)
  await ctx.db.patch(life._id, { activationState: 'active', activatedAt: now, eligibleFromTick: world.currentTick + 1, lastTick: world.currentTick, lastProgressTick: world.currentTick })
  if (user?.analyticsConsent === true) await ctx.scheduler.runAfter(0, internal.analytics.captureActivation, { userId, event: 'paper lives started', game: 'paper-lives' })
}
