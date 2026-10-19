import type { IdleAnglerCatalog } from '../sim/types'
import { contentV4 } from './v4'

/**
 * Idle Angler content v5 (D199): a new angler starts on "Land your first fish" and that goal forces a bite on every
 * cast until one is landed (v4 waited eight casts, and set the goal only after the first cast), so the first screen
 * after Save shows a fish and the goal's reward rather than an empty story. Under v4 half of new anglers landed
 * nothing in their first hour. Every other draw, price and goal is v4's; an angler past its first fish plays exactly
 * as on v4.
 */
export const contentV5: IdleAnglerCatalog = {
  ...contentV4,
  contentVersion: 'v5',
  starterGoal: true,
  goals: contentV4.goals!.map((goal) => (goal.id === 'first_fish' ? { ...goal, guarantee: { casts: 0 } } : goal)),
}
