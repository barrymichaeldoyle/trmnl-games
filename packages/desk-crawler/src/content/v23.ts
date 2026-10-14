import type { ContentCatalog } from '../sim/core/types'
import { contentV22 } from './v22'

/*
 * Content catalog v23 (D155): the workbench opens at level 4.
 *
 * Salvage and the workbench were open from level 1, but the first workbench
 * step (Mk II) needs level 4, and the ladder taught salvage only after
 * "Reach level 12". A new player saw Salvage beside Sell and got materials it
 * could not spend. Now both open at level 4, the level Mk II gear needs, with
 * an "Unlocked: the workbench" line, and "Salvage a piece of gear" moves up to
 * straight after "Reach level 4", so the goal after the unlock is the one that
 * uses it. Stored pointers are indices, so the world switch moves every hero by
 * rung id (`remapRung`); a hero the moved rung would land behind meets it first.
 * Everything else is v22.
 */
const MOVED = ['first_salvage'] as const

const rungs = contentV22.career!.rungs
const moved = rungs.filter((rung) => (MOVED as readonly string[]).includes(rung.id))
const rest = rungs.filter((rung) => !(MOVED as readonly string[]).includes(rung.id))
const after = rest.findIndex((rung) => rung.id === 'level_4') + 1

export const contentV23: ContentCatalog = {
  ...contentV22,
  contentVersion: 'v23',
  unlocks: { ...contentV22.unlocks!, workbench: 4 },
  career: { rungs: [...rest.slice(0, after), ...moved, ...rest.slice(after)] },
}
