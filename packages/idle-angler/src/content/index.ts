import type { IdleAnglerCatalog } from '../sim/types'
import { contentV1 } from './v1'
import { contentV2 } from './v2'
import { contentV3 } from './v3'
import { contentV4 } from './v4'
import { contentV5 } from './v5'

/** Every Idle Angler catalog a run may pin; replays of each stay identical. */
export const catalogs = { v1: contentV1, v2: contentV2, v3: contentV3, v4: contentV4, v5: contentV5 } as const satisfies Record<string, IdleAnglerCatalog>
export type CatalogId = keyof typeof catalogs
/** The catalog a brand-new world starts on. Live worlds switch with `idleAngler/operations:setActiveContentVersion` (D162 moves production to v2 that way, D166 to v3, D196 to v4, D199 to v5). */
export const ACTIVE_CONTENT: CatalogId = 'v1'
export { contentV1, contentV2, contentV3, contentV4, contentV5 }
