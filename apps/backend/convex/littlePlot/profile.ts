import type { Doc, Id } from '../_generated/dataModel'
import type { MutationCtx, QueryCtx } from '../_generated/server'
import { appError } from '../lib/errors'

/** The user's Little Plot profile, or null before they start. */
export async function littlePlotProfile(ctx: QueryCtx, userId: Id<'users'>): Promise<Doc<'littlePlotProfiles'> | null> {
  return await ctx.db.query('littlePlotProfiles').withIndex('by_userId', (q) => q.eq('userId', userId)).unique()
}

/** The user's current plot, or null when signed out, inactive, deleting or not started. */
export async function currentPlot(ctx: QueryCtx, user: Doc<'users'> | null): Promise<Doc<'plots'> | null> {
  if (!user || user.state !== 'active') return null
  const profile = await littlePlotProfile(ctx, user._id)
  if (!profile || profile.state === 'deleting' || !profile.plotId) return null
  const plot = await ctx.db.get(profile.plotId)
  return plot?.userId === user._id && plot.isActive ? plot : null
}

export async function setCurrentPlot(ctx: MutationCtx, user: Doc<'users'>, plotId: Id<'plots'>): Promise<void> {
  const profile = await littlePlotProfile(ctx, user._id)
  if (profile?.state === 'deleting') throw appError('GAME_UNAVAILABLE', 'Little Plot progress is being deleted. Try again shortly.')
  if (profile) await ctx.db.patch(profile._id, { plotId })
  else await ctx.db.insert('littlePlotProfiles', { userId: user._id, state: 'active', plotId, createdAt: Date.now() })
}
