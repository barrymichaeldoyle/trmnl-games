import type { Doc, Id } from '../_generated/dataModel'
import type { MutationCtx, QueryCtx } from '../_generated/server'
import { appError } from '../lib/errors'

/** The user's Pixel Wars profile, or null before they start. */
export async function pixelWarsProfile(ctx: QueryCtx, userId: Id<'users'>): Promise<Doc<'pixelWarsProfiles'> | null> {
  return await ctx.db.query('pixelWarsProfiles').withIndex('by_userId', (q) => q.eq('userId', userId)).unique()
}

/** The user's current desk, or null when signed out, inactive, deleting or not started. */
export async function currentDesk(ctx: QueryCtx, user: Doc<'users'> | null): Promise<Doc<'desks'> | null> {
  if (!user || user.state !== 'active') return null
  const profile = await pixelWarsProfile(ctx, user._id)
  if (!profile || profile.state === 'deleting' || !profile.deskId) return null
  const desk = await ctx.db.get(profile.deskId)
  return desk?.userId === user._id && desk.isActive ? desk : null
}

export async function setCurrentDesk(ctx: MutationCtx, user: Doc<'users'>, deskId: Id<'desks'>): Promise<void> {
  const profile = await pixelWarsProfile(ctx, user._id)
  if (profile?.state === 'deleting') throw appError('GAME_UNAVAILABLE', 'Pixel Wars progress is being deleted. Try again shortly.')
  if (profile) await ctx.db.patch(profile._id, { deskId })
  else await ctx.db.insert('pixelWarsProfiles', { userId: user._id, state: 'active', deskId, createdAt: Date.now() })
}
