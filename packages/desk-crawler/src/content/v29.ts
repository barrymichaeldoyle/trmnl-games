import type { CareerRung, ContentCatalog } from '../sim/core/types'
import { contentV28 } from './v28'

/*
 * Content catalog v29 (D227): the +3 goal moves to the end of the ladder, and
 * the ladder names levels 20 and 24.
 *
 * On 2026-11-10 twenty-one of the eighty production heroes stood on
 * "Reinforce an item to +3", eighteen of them already on the Archive or in the
 * Parking Garage. The rung costs 12,000 gold in all against 500 to 1,000 a
 * day, so they had sat on it for four to fifteen days while the five goals
 * behind it (the Archive, level 16, the Garage, the Gym Duffel, a dug-in elite)
 * were done and uncelebrated. The ladder is read in order, so the +3 goal now
 * comes last, where a weeks-long sink belongs, and "Reach level 20" and
 * "Reach level 24" sit before it so a hero past the Garage keeps a goal it can
 * reach by playing. Stored pointers are indices, so the world switch moves every
 * hero by rung id (`remapRung`); a hero that reached the +3 goal under an earlier
 * ladder keeps it as done and is never paid for it twice, and a hero past the
 * old ladder's end lands on the first appended goal. Everything else is v28.
 */
const MOVED_LAST = 'reinforce_3'

const appended: readonly CareerRung[] = [
  { id: 'level_20', title: 'Reach level 20', blurb: 'Twenty levels in. The Garage regulars are no match for you now.', predicate: { kind: 'level', atLeast: 20 }, gold: 150 },
  { id: 'level_24', title: 'Reach level 24', blurb: 'Every floor is yours. The Garage pays the best XP there is, so keep going.', predicate: { kind: 'level', atLeast: 24 }, gold: 200 },
]

const rungs = contentV28.career!.rungs
const moved = rungs.find((rung) => rung.id === MOVED_LAST)
if (moved === undefined) throw new Error(`career rung ${MOVED_LAST} is missing`)

export const contentV29: ContentCatalog = {
  ...contentV28,
  contentVersion: 'v29',
  career: { rungs: [...rungs.filter((rung) => rung.id !== MOVED_LAST), ...appended, moved] },
}
