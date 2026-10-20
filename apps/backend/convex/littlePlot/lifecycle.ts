import { FIRST_LOG, starterPlot } from '@trmnl-games/little-plot/sim'
import type { Doc, Id } from '../_generated/dataModel'
import type { MutationCtx } from '../_generated/server'
import { internal } from '../_generated/api'
import { getOrCreateEngineWorld } from '../lib/engine/world'
import { fromPlotState, mirrored } from './adapter'
import { currentPlot, setCurrentPlot } from './profile'
import { LITTLE_PLOT_RUNTIME } from './runtime'

/**
 * Little Plot's half of the TRMNL lifecycle (little-plot.md "The plot and its starting state"). A plot is prepared
 * pending at install, with the four starters sown, and activated once by a confirmed saved installation of the Little
 * Plot plugin. It has no name of its own: the public alias is its name.
 */
export async function preparePlot(ctx: MutationCtx, user: Doc<'users'>, now: number): Promise<Id<'plots'>> {
  const world = await getOrCreateEngineWorld(ctx, LITTLE_PLOT_RUNTIME)
  const content = LITTLE_PLOT_RUNTIME.content(world.activeContentVersion)!
  const base = starterPlot(content, world.currentTick)
  const plotId = await ctx.db.insert('plots', {
    userId: user._id,
    createdAt: now,
    isActive: true,
    activationState: 'pending_trmnl',
    plot: fromPlotState(base),
    ...mirrored(base),
    lastLevelUpTick: world.currentTick,
    scoreHourXp: 0,
    eligibleFromTick: world.currentTick + 1,
    lastTick: world.currentTick,
    lastProgressTick: world.currentTick,
    logSequence: 1,
    simulationState: 'healthy',
  })
  await setCurrentPlot(ctx, user, plotId)
  await ctx.db.insert('lpTickLogs', { plotId, source: 'lifecycle', sequence: 1, at: now, kind: 'system', summary: FIRST_LOG, detail: { v: 1, operation: 'plot_created' } })
  return plotId
}

/** First activation baseline: the next Little Plot tick, no catch-up. Never resets an active plot. */
export async function activatePlot(ctx: MutationCtx, userId: Id<'users'>, now: number): Promise<void> {
  const user = await ctx.db.get(userId)
  const plot = await currentPlot(ctx, user)
  if (plot === null || plot.activationState === 'active') return
  const world = await getOrCreateEngineWorld(ctx, LITTLE_PLOT_RUNTIME)
  // The starters were sown at install; they start growing, freshly watered, from activation.
  const state = { ...plot.plot, beds: plot.plot.beds.map((b) => ({ ...b, sownTick: world.currentTick, points: 0 })), wateredUntilTick: world.currentTick + 16 }
  await ctx.db.patch(plot._id, { activationState: 'active', activatedAt: now, plot: state, eligibleFromTick: world.currentTick + 1, lastTick: world.currentTick, lastProgressTick: world.currentTick })
  if (user?.analyticsConsent === true) await ctx.scheduler.runAfter(0, internal.analytics.captureActivation, { userId, event: 'little plot started', game: 'little-plot' })
}
