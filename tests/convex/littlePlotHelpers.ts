import type { Id } from '@trmnl-games/backend/data-model'
import { contentV1 } from '@trmnl-games/little-plot/content'
import { starterPlot, type PlotState } from '@trmnl-games/little-plot/sim'
import { vi } from 'vitest'
import { internal } from '@trmnl-games/backend/api'
import type { T } from './helpers'
import { LITTLE_PLOT_RUNTIME } from '../../apps/backend/convex/littlePlot/runtime'
import { readEngineWorld } from '../../apps/backend/convex/lib/engine/world'
import { typedTables } from '../../apps/backend/convex/lib/engine/runtime'

let counter = 0

/** An activated plot with a profile and an owner, ready for the next Little Plot tick. `plot` patches the core state. */
export async function seedPlot(t: T, plot: Partial<PlotState> = {}, alias = `Plot${++counter}`, overrides: Record<string, unknown> = {}): Promise<Id<'plots'>> {
  return await t.run(async (ctx) => {
    const now = Date.now() - 60_000
    const existing = await ctx.db.query('users').withIndex('by_tokenIdentifier', (q) => q.eq('tokenIdentifier', `issuer|${alias}`)).unique()
    const userId = existing?._id ?? (await ctx.db.insert('users', { tokenIdentifier: `issuer|${alias}`, publicAlias: alias, normalizedAlias: alias.toLowerCase(), timezone: 'UTC', state: 'active', createdAt: now, publicNameVersion: 1 }))
    const base: PlotState = { ...starterPlot(contentV1, 0), ...plot }
    const plotId = await ctx.db.insert('plots', {
      userId,
      createdAt: now - counter,
      isActive: true,
      activationState: 'active',
      activatedAt: now - counter,
      plot: JSON.parse(JSON.stringify(base)),
      level: base.level,
      xp: base.xp,
      gold: base.gold,
      lastLevelUpTick: 0,
      scoreHourXp: 0,
      eligibleFromTick: 1,
      lastTick: 0,
      lastProgressTick: 0,
      logSequence: 1,
      simulationState: 'healthy',
      ...overrides,
    })
    await ctx.db.insert('littlePlotProfiles', { userId, state: 'active', plotId, createdAt: now })
    return plotId
  })
}

export async function runLittlePlotTick(t: T) {
  await ensureSeededWorld(t)
  const runId = await t.mutation(internal.littlePlot.tick.startTick, {})
  await t.finishAllScheduledFunctions(vi.runAllTimers)
  return runId
}

/** Advance the clock one Little Plot slot (15 minutes) and run its tick. */
export async function nextLittlePlotTick(t: T) {
  vi.advanceTimersByTime(15 * 60_000)
  return await runLittlePlotTick(t)
}

export const plotOf = async (t: T, id: Id<'plots'>) => (await t.run(async (ctx) => await ctx.db.get(id)))!

/** The world as the first tick would create it, with a fixed seed so a test plays out the same way every run. */
async function ensureSeededWorld(t: T) {
  await t.run(async (ctx) => {
    if (await readEngineWorld(ctx, LITTLE_PLOT_RUNTIME)) return
    await ctx.db.insert(typedTables(LITTLE_PLOT_RUNTIME).world, {
      key: 'world',
      currentTick: 0,
      activeContentVersion: LITTLE_PLOT_RUNTIME.initialContentVersion,
      activeSimulationVersion: LITTLE_PLOT_RUNTIME.simulationVersion,
      worldSeed: '5eed5eed5eed5eed5eed5eed5eed5eed',
      ticksPaused: false,
      maintenanceMode: false,
      createdAt: Date.now(),
      schemaVersion: 1,
    })
  })
}
