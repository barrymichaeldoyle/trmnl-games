import type { IdleAnglerCatalog } from '../sim/types'
import { contentV3 } from './v3'

/**
 * Idle Angler content v4 (issue #8, D196): v3's Claim button, with goals reached one at a time as Desk Crawler's ladder
 * does. v3 still jumped the pointer past every goal already met, so one cast that met two goals paid only the first;
 * here each is reached at its own evaluation, with its own story line and its own reward waiting on the Dock. Draws,
 * prices and goals are v3's; a reached goal's guarantee can point at a different goal for one evaluation, so v4 is its
 * own catalog rather than a change to v3's replays.
 */
export const contentV4: IdleAnglerCatalog = { ...contentV3, contentVersion: 'v4', stepGoals: true }
