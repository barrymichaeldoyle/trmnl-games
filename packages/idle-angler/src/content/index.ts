import type { IdleAnglerCatalog } from '../sim/types'
import { contentV1 } from './v1'
import { contentV2 } from './v2'

/** Every Idle Angler catalog a run may pin; replays of each stay identical. */
export const catalogs = { v1: contentV1, v2: contentV2 } as const satisfies Record<string, IdleAnglerCatalog>
export type CatalogId = keyof typeof catalogs
/** The catalog a brand-new world starts on. Live worlds switch with `idleAngler/operations:setActiveContentVersion` (D162 moves production to v2 that way). */
export const ACTIVE_CONTENT: CatalogId = 'v1'
export { contentV1, contentV2 }
