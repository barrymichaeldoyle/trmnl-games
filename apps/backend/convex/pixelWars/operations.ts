import { v } from 'convex/values'
import { internalMutation } from '../_generated/server'
import { setEngineContentVersion } from '../lib/engine/world'
import { PIXEL_WARS_RUNTIME } from './runtime'

/**
 * Switch the catalog Pixel Wars' next run pins (D214):
 * `npx convex run --prod pixelWars/operations:setActiveContentVersion '{"contentVersion":"v2"}'`.
 */
export const setActiveContentVersion = internalMutation({
  args: { contentVersion: v.string() },
  returns: v.object({ from: v.string(), to: v.string() }),
  handler: async (ctx, { contentVersion }) => await setEngineContentVersion(ctx, PIXEL_WARS_RUNTIME, contentVersion),
})
