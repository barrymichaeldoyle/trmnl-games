import { contentV1 } from './v1'
import type { PixelWarsCatalog } from '../sim/types'

export { contentV1 }
export const catalogs = { v1: contentV1 } as const satisfies Record<string, PixelWarsCatalog>
export type CatalogId = keyof typeof catalogs
export const ACTIVE_CONTENT: CatalogId = 'v1'
