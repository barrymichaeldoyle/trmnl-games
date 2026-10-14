import { v } from 'convex/values'
import { internalMutation } from '../_generated/server'
import { setEngineContentVersion } from '../lib/engine/world'
import { PAPER_LIVES_RUNTIME } from './runtime'

/**
 * Switch the catalog Paper Lives' next run pins (D159):
 * `npx convex run --prod paperLives/operations:setActiveContentVersion '{"contentVersion":"v2"}'`.
 * Lives keep their state; the next year is drawn from the new catalog.
 */
export const setActiveContentVersion = internalMutation({
  args: { contentVersion: v.string() },
  returns: v.object({ from: v.string(), to: v.string() }),
  handler: async (ctx, { contentVersion }) => await setEngineContentVersion(ctx, PAPER_LIVES_RUNTIME, contentVersion),
})
