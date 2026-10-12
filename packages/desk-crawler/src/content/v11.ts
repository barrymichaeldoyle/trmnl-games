import type { ContentCatalog } from '../sim/core/types'
import { contentV10 } from './v10'

/*
 * Content catalog v11 (D123): the bag is the only container.
 *
 * Barry's reasoning on 2026-10-12: the desk drawer (D111, v8) was an
 * unnecessary complication. A bag with slots is the whole story: a find that
 * does not fit is held, and the hero sleeps until the player makes room, the
 * rule from before v8. The drawer's rules, intents, HUD count and glyph are
 * gone from the code, so v8 to v10 replay without it too; this version marks
 * the moment the live world changed. Everything else is v10, and no draw
 * moves, so other outcomes replay unchanged.
 */
export const contentV11: ContentCatalog = {
  ...contentV10,
  contentVersion: 'v11',
}
