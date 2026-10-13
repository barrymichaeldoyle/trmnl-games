import type { Doc } from '../_generated/dataModel'
import type { QueryCtx } from '../_generated/server'
import type { LatestEvent } from '@trmnl-games/desk-crawler/art/sceneKey'

/**
 * The latest event a scene follows, from its log. D149: a meeting or lost-property scene draws the other hero, so its
 * outcome gains that hero's look as `rivalGender` (one indexed read). The look is the hero's current one, so a
 * makeover shows in other players' scenes too; a deleted hero is drawn in the original look.
 */
export async function sceneEvent(ctx: QueryCtx, log: Doc<'tickLogs'> | undefined): Promise<LatestEvent | null> {
  if (log === undefined) return null
  if (!('outcome' in log.detail)) return { kind: log.kind }
  const outcome = log.detail.outcome as LatestEvent['outcome'] & { rivalHeroId?: unknown }
  if ((outcome.variant !== 'meeting' && outcome.variant !== 'lost_property') || typeof outcome.rivalHeroId !== 'string') return { kind: log.kind, outcome }
  const rivalId = ctx.db.normalizeId('heroes', outcome.rivalHeroId)
  const rival = rivalId === null ? null : await ctx.db.get(rivalId)
  return { kind: log.kind, outcome: rival?.gender === 'female' ? { ...outcome, rivalGender: 'female' } : outcome }
}
