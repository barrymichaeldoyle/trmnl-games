import type { Doc, Id } from '../_generated/dataModel'
import type { MutationCtx, QueryCtx } from '../_generated/server'
import { appError } from '../lib/errors'

/** The user's Paper Lives profile, or null before they start. */
export async function paperLivesProfile(ctx: QueryCtx, userId: Id<'users'>): Promise<Doc<'paperLivesProfiles'> | null> {
  return await ctx.db.query('paperLivesProfiles').withIndex('by_userId', (q) => q.eq('userId', userId)).unique()
}

/** The user's current life, or null when signed out, inactive, deleting or not started. An ended life is still current. */
export async function currentLife(ctx: QueryCtx, user: Doc<'users'> | null): Promise<Doc<'lives'> | null> {
  if (!user || user.state !== 'active') return null
  const profile = await paperLivesProfile(ctx, user._id)
  if (!profile || profile.state === 'deleting' || !profile.lifeId) return null
  const life = await ctx.db.get(profile.lifeId)
  return life?.userId === user._id && life.isActive ? life : null
}

export async function setCurrentLife(ctx: MutationCtx, user: Doc<'users'>, lifeId: Id<'lives'>): Promise<void> {
  const profile = await paperLivesProfile(ctx, user._id)
  if (profile?.state === 'deleting') throw appError('GAME_UNAVAILABLE', 'Paper Lives progress is being deleted. Try again shortly.')
  if (profile) await ctx.db.patch(profile._id, { lifeId })
  else await ctx.db.insert('paperLivesProfiles', { userId: user._id, state: 'active', lifeId, createdAt: Date.now() })
}
