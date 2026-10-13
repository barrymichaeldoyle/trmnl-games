import type { CareerRung, ContentCatalog } from '../sim/core/types'
import { contentV16 } from './v16'

/*
 * Content catalog v17 (D135): two goals before the raid goal.
 *
 * Desk raids and stances open at level 7, but the raid goal came straight
 * after "Beat an elite", so a hero below level 7 sat on it with no progress
 * and no hint why. "Reach level 7" now comes first, then "Switch to Bold",
 * since Bold launches twice as many raids as Balanced. The Bold goal is new,
 * not the retired "Pick a stance": a hero that reached that one reaches this
 * one without its gold. Stored pointers are indices, so the world switch moves
 * every hero to the same rung by id (`remapRung`): heroes already on or past
 * the raid goal skip both. Everything else is v16.
 */
const inserted: readonly CareerRung[] = [
  { id: 'level_7', title: 'Reach level 7', blurb: 'Desk raids and stances open at level 7.', predicate: { kind: 'level', atLeast: 7 }, gold: 40 },
  { id: 'go_bold', title: 'Switch to Bold', blurb: 'Bold launches twice as many desk raids as Balanced. Set it on the Hero page and switch back any time after.', predicate: { kind: 'stance', stance: 'bold' }, gold: 20, companion: true, supersedes: 'pick_stance' },
]

const rungs = contentV16.career!.rungs
const at = rungs.findIndex((rung) => rung.id === 'first_raid')

export const contentV17: ContentCatalog = {
  ...contentV16,
  contentVersion: 'v17',
  career: { rungs: [...rungs.slice(0, at), ...inserted, ...rungs.slice(at)] },
}
