import type { ContentCatalog } from '../sim/core/types'
import { contentV1 } from './v1'
import { contentV2 } from './v2'
import { contentV3 } from './v3'
import { contentV4 } from './v4'
import { contentV5 } from './v5'
import { contentV6 } from './v6'
import { contentV7 } from './v7'
import { contentV8 } from './v8'
import { contentV9 } from './v9'
import { contentV10 } from './v10'
import { contentV11 } from './v11'
import { contentV12 } from './v12'
import { contentV13 } from './v13'
import { contentV14 } from './v14'
import { contentV15 } from './v15'
import { contentV16 } from './v16'
import { contentV17 } from './v17'
import { contentV18 } from './v18'
import { contentV19 } from './v19'
import { contentV20 } from './v20'
import { contentV21 } from './v21'
import { contentV22 } from './v22'
import { contentV23 } from './v23'
import { contentV24 } from './v24'
import { contentV25 } from './v25'
import { contentV26 } from './v26'
import { contentV27 } from './v27'

/**
 * Every supported catalog version. Runs pin one; a balance change after launch
 * adds a new version beside the live one rather than editing it.
 */
export const catalogs = {
  v1: contentV1,
  v2: contentV2,
  v3: contentV3,
  v4: contentV4,
  v5: contentV5,
  v6: contentV6,
  v7: contentV7,
  v8: contentV8,
  v9: contentV9,
  v10: contentV10,
  v11: contentV11,
  v12: contentV12,
  v13: contentV13,
  v14: contentV14,
  v15: contentV15,
  v16: contentV16,
  v17: contentV17,
  v18: contentV18,
  v19: contentV19,
  v20: contentV20,
  v21: contentV21,
  v22: contentV22,
  v23: contentV23,
  v24: contentV24,
  v25: contentV25,
  v26: contentV26,
  v27: contentV27,
} as const satisfies Record<string, ContentCatalog>

export type CatalogId = keyof typeof catalogs

/** New worlds start here; a live world switches with `world.setActiveContentVersion` between runs. */
export const ACTIVE_CONTENT: CatalogId = 'v27'
