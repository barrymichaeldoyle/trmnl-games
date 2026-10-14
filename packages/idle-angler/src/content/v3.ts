import type { IdleAnglerCatalog } from '../sim/types'
import { contentV2 } from './v2'

/**
 * Idle Angler content v3 (D166): v2 unchanged except that a reached goal sets its coins aside for the Claim button on
 * the Dock instead of paying them on the spot, as Desk Crawler's career ladder does (D129). Every draw, price and rung
 * is v2's, so a v2 replay and a v3 replay differ only in when goal coins arrive.
 */
export const contentV3: IdleAnglerCatalog = { ...contentV2, contentVersion: 'v3', claimGoals: true }
