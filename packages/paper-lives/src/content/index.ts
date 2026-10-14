import type { PaperLivesCatalog } from '../sim/types'
import { contentV1 } from './v1'

/** Every Paper Lives catalog a run may pin; replays of each stay identical. */
export const catalogs = { v1: contentV1 } as const satisfies Record<string, PaperLivesCatalog>
export type CatalogId = keyof typeof catalogs
export const ACTIVE_CONTENT: CatalogId = 'v1'
export { contentV1 }
