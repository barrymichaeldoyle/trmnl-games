import { contentV1 } from './v1'
import type { LittlePlotCatalog } from '../sim/types'

export { contentV1 }
export const catalogs = { v1: contentV1 } as const satisfies Record<string, LittlePlotCatalog>
export type CatalogId = keyof typeof catalogs
export const ACTIVE_CONTENT: CatalogId = 'v1'
