import type { IdleAnglerCatalog } from '../sim/types'
import { contentV5 } from './v5'

/**
 * Idle Angler content v6 (D204): a rank at each water, from Visitor to Master by the share of its species logged
 * (titles.ts `WATER_RANKS`), and a milestone story when a new species lifts it. The rank is read from the logbook, so
 * an angler switched from v5 already holds the ranks its logbook earns; v6 only adds the story. Every draw, price and
 * goal is v5's.
 */
export const contentV6: IdleAnglerCatalog = { ...contentV5, contentVersion: 'v6', waterRanks: true }
