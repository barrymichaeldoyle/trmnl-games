import type { Id } from '@trmnl-games/backend/data-model'
import { contentV1 } from '@trmnl-games/paper-lives/content'
import { starterLife, type LifeState } from '@trmnl-games/paper-lives/sim'
import { vi } from 'vitest'
import { internal } from '@trmnl-games/backend/api'
import type { T } from './helpers'
import { PAPER_LIVES_RUNTIME } from '../../apps/backend/convex/paperLives/runtime'
import { readEngineWorld } from '../../apps/backend/convex/lib/engine/world'
import { typedTables } from '../../apps/backend/convex/lib/engine/runtime'

let counter = 0

/** An activated life with a profile and an owner, ready for the next Paper Lives tick. `life` patches the core state. */
export async function seedLife(t: T, life: Partial<LifeState> = {}, alias = `Life${++counter}`, overrides: Record<string, unknown> = {}): Promise<Id<'lives'>> {
  return await t.run(async (ctx) => {
    const now = Date.now() - 60_000
    const existing = await ctx.db.query('users').withIndex('by_tokenIdentifier', (q) => q.eq('tokenIdentifier', `issuer|${alias}`)).unique()
    const userId = existing?._id ?? (await ctx.db.insert('users', { tokenIdentifier: `issuer|${alias}`, publicAlias: alias, normalizedAlias: alias.toLowerCase(), timezone: 'UTC', state: 'active', createdAt: now, publicNameVersion: 1 }))
    const base = { ...starterLife(contentV1, 1000 + counter).life, ...life }
    const lifeId = await ctx.db.insert('lives', {
      userId,
      createdAt: now - counter,
      isActive: true,
      activationState: 'active',
      activatedAt: now - counter,
      life: JSON.parse(JSON.stringify({ ...base, traits: [...base.traits] })),
      ordinal: 1,
      eligibleFromTick: 1,
      lastTick: 0,
      lastProgressTick: 0,
      logSequence: 1,
      simulationState: 'healthy',
      ...overrides,
    })
    await ctx.db.insert('paperLivesProfiles', { userId, state: 'active', lifeId, createdAt: now })
    return lifeId
  })
}

export async function runPaperLivesTick(t: T) {
  await ensureSeededWorld(t)
  const runId = await t.mutation(internal.paperLives.tick.startTick, {})
  await t.finishAllScheduledFunctions(vi.runAllTimers)
  return runId
}

/** Advance the clock one Paper Lives slot (15 minutes) and run its tick. */
export async function nextPaperLivesTick(t: T) {
  vi.advanceTimersByTime(15 * 60_000)
  return await runPaperLivesTick(t)
}

export const lifeOf = async (t: T, id: Id<'lives'>) => (await t.run(async (ctx) => await ctx.db.get(id)))!

/**
 * The world as the first tick would create it, but with a fixed seed: the real one comes from Math.random, so a test
 * that lives many years would play out differently on every run and could fail now and then.
 */
async function ensureSeededWorld(t: T) {
  await t.run(async (ctx) => {
    if (await readEngineWorld(ctx, PAPER_LIVES_RUNTIME)) return
    await ctx.db.insert(typedTables(PAPER_LIVES_RUNTIME).world, {
      key: 'world',
      currentTick: 0,
      activeContentVersion: PAPER_LIVES_RUNTIME.initialContentVersion,
      activeSimulationVersion: PAPER_LIVES_RUNTIME.simulationVersion,
      worldSeed: '5eed5eed5eed5eed5eed5eed5eed5eed',
      ticksPaused: false,
      maintenanceMode: false,
      createdAt: Date.now(),
      schemaVersion: 1,
    })
  })
}
