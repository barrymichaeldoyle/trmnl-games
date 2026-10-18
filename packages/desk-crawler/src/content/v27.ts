import type { CareerRung, ContentCatalog } from '../sim/core/types'
import { contentV26 } from './v26'

/*
 * Content catalog v27 (D192): "Choose a stance" where "Switch to Bold" was.
 *
 * v26 retired "Switch to Bold" because it sent heroes into the Cafeteria on
 * the riskiest stance. Barry's idea: when stances unlock, the hero has none
 * chosen (it plays Balanced, as it always has), and the goal is to pick one,
 * any of the three. Choosing Balanced counts. The rung is new, inserted right
 * before the raid goal, so the world switch moves heroes by rung id
 * (`remapRung`): a hero waiting on the raid goal that has not chosen lands on
 * it, and a hero who reached "Switch to Bold" reaches it without gold.
 * Everything else is v26.
 */
const choose: CareerRung = {
  id: 'choose_stance',
  title: 'Choose a stance',
  blurb: 'Cautious, Balanced or Bold: how hard your hero pushes before it rests. Pick one on the Hero page.',
  predicate: { kind: 'stanceChosen' },
  gold: 20,
  companion: true,
  supersedes: 'go_bold',
}

const rungs = contentV26.career!.rungs
const at = rungs.findIndex((rung) => rung.id === 'first_raid')
if (at < 0) throw new Error('career rung first_raid is missing')

export const contentV27: ContentCatalog = {
  ...contentV26,
  contentVersion: 'v27',
  career: { rungs: [...rungs.slice(0, at), choose, ...rungs.slice(at)] },
}
