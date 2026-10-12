import type { ContentCatalog } from '../sim/core/types'
import { contentV7 } from './v7'

/*
 * Content catalog v8 (D111): shipped the six-slot desk drawer, where gear
 * finds went once the bag was full. The drawer was removed in D123 (content
 * v11) along with its rules, so v8 now replays as v7 with its own version
 * label: ticks that ran under v8 before 2026-10-12 keep their recorded logs.
 */
export const contentV8: ContentCatalog = {
  ...contentV7,
  contentVersion: 'v8',
}
