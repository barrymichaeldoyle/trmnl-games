import type { ContentCatalog } from '../sim/core/types'
import { contentV13 } from './v13'

/*
 * Content catalog v14 (D131): potion strengths.
 *
 * Every potion was the same potion (docs/potions.md). Now three strengths,
 * each its own stack row under one pouch: minor (25% of max HP), healing (40%,
 * the potion every hero already holds, same template id) and major (60%). A
 * potion find draws its strength by biome tier on the reward stream, so the
 * Office drops mostly minors and the Cafeteria mostly healing and majors. The
 * hero drinks the weakest potion that keeps it out of a rest, else the
 * strongest it has; the player can choose by hand. Combine on the Bag page
 * turns three minors and one Scrap into a major, the second sink for the
 * material the D129 harness showed piling up. The starter kit, the merchant
 * and decisions still give healing potions. Everything else is v13.
 */
export const contentV14: ContentCatalog = {
  ...contentV13,
  contentVersion: 'v14',
  potions: {
    strengths: [
      { id: 'minor', templateId: 'minor_potion', name: 'Minor Potion', healPct: 25 },
      { id: 'healing', templateId: 'healing_potion', name: 'Healing Potion', healPct: 40 },
      { id: 'major', templateId: 'major_potion', name: 'Major Potion', healPct: 60 },
    ],
    dropWeightsByTier: {
      1: { minor: 60, healing: 40, major: 0 },
      2: { minor: 25, healing: 60, major: 15 },
      3: { minor: 10, healing: 50, major: 40 },
    },
    combine: { from: 'minor', count: 3, materials: { scrap: 1 }, to: 'major' },
  },
  narrative: {
    ...contentV13.narrative,
    shared: {
      ...contentV13.narrative.shared,
      lootPotion: [
        'Found a {potion}.',
        'Picked up a {potion} left on a desk.',
        'Found a {potion} in the first-aid kit.',
        'A {potion} rolled out from under a desk.',
      ],
    },
  },
}
