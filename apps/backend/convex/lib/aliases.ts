import type { Id } from '../_generated/dataModel'
import type { QueryCtx } from '../_generated/server'

/**
 * Whether a normalized public name belongs to another player: in use, or given up by a public name change within the
 * last `PUBLIC_NAME_GAP_MS` (D142), so a shared profile link cannot be picked up by someone else straight away.
 */
export async function aliasTaken(ctx: QueryCtx, normalized: string, now: number, self?: Id<'users'>): Promise<boolean> {
  const inUse = await ctx.db.query('users').withIndex('by_normalizedAlias', (q) => q.eq('normalizedAlias', normalized)).first()
  if (inUse !== null && inUse._id !== self) return true
  const held = await ctx.db.query('users').withIndex('by_heldAlias_and_until', (q) => q.eq('heldAlias.normalized', normalized).gt('heldAlias.until', now)).first()
  return held !== null && held._id !== self
}
