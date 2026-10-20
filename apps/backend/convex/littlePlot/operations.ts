import { v } from 'convex/values'
import { internalMutation } from '../_generated/server'
import { setEngineContentVersion } from '../lib/engine/world'
import { LITTLE_PLOT_RUNTIME } from './runtime'

/**
 * Switch the catalog Little Plot's next run pins (D206):
 * `npx convex run --prod littlePlot/operations:setActiveContentVersion '{"contentVersion":"v2"}'`.
 * Plots keep their state; the next tick grows them under the new catalog.
 */
export const setActiveContentVersion = internalMutation({
  args: { contentVersion: v.string() },
  returns: v.object({ from: v.string(), to: v.string() }),
  handler: async (ctx, { contentVersion }) => await setEngineContentVersion(ctx, LITTLE_PLOT_RUNTIME, contentVersion),
})
