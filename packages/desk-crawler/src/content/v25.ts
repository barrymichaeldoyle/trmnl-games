import type { CareerRung, ContentCatalog } from '../sim/core/types'
import { contentV24 } from './v24'

/*
 * Content catalog v25 (D178): a level goal before every goal the hero cannot
 * start yet.
 *
 * Office decisions open at level 5, but "Answer an office decision" followed
 * the Laptop Backpack, so a level-4 hero sat on it with no progress. The same
 * gap sits in front of the wandering merchant (level 6), the Cafeteria Depths
 * (level 8) and the Parking Garage (level 16). Each gets a "Reach level N"
 * rung inserted immediately before the goal it unlocks. The Lunchbox stays
 * where it is: it can be bought one tier early, so it is not locked at 6.
 * Stored pointers are indices, so the world switch moves every hero by rung
 * id (`remapRung`): a hero waiting on one of those goals lands on the level
 * goal when it has not reached that level, and a hero already past it skips
 * the new rung unpaid. Everything else is v24.
 */
const inserted: readonly { before: string; rung: CareerRung }[] = [
  { before: 'first_decision', rung: { id: 'level_5', title: 'Reach level 5', blurb: 'Office decisions open at level 5.', predicate: { kind: 'level', atLeast: 5 }, gold: 30 } },
  { before: 'merchant_meet', rung: { id: 'level_6', title: 'Reach level 6', blurb: 'The wandering merchant arrives at level 6.', predicate: { kind: 'level', atLeast: 6 }, gold: 40 } },
  { before: 'cafeteria_win', rung: { id: 'level_8', title: 'Reach level 8', blurb: 'The Cafeteria Depths open at level 8.', predicate: { kind: 'level', atLeast: 8 }, gold: 50 } },
  { before: 'garage_win', rung: { id: 'level_16', title: 'Reach level 16', blurb: 'The Parking Garage opens at level 16.', predicate: { kind: 'level', atLeast: 16 }, gold: 150 } },
]

const rungs = inserted.reduce((list, { before, rung }) => {
  const at = list.findIndex((entry) => entry.id === before)
  if (at < 0) throw new Error(`career rung ${before} is missing`)
  return [...list.slice(0, at), rung, ...list.slice(at)]
}, contentV24.career!.rungs)

export const contentV25: ContentCatalog = {
  ...contentV24,
  contentVersion: 'v25',
  career: { rungs },
}
