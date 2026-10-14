import type { PaperLivesCatalog } from '../sim/types'
import { contentV1 } from './v1'
import { contentV2 } from './v2'

/** Every Paper Lives catalog a run may pin; replays of each stay identical. */
export const catalogs = { v1: contentV1, v2: contentV2 } as const satisfies Record<string, PaperLivesCatalog>
export type CatalogId = keyof typeof catalogs
export const ACTIVE_CONTENT: CatalogId = 'v2'
export { contentV1, contentV2 }
