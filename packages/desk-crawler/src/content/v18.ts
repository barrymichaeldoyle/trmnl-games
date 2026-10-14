import type { ContentCatalog } from '../sim/core/types'
import { contentV17 } from './v17'

/*
 * Content catalog v18 (D136): classes and the hero roster.
 *
 * Every hero so far has been a Warrior, and stays one: the Warrior is the
 * baseline and its numbers do not change. At Warrior level 6, one level before
 * raids and stances, the account's roster opens and the player may recruit a
 * Rogue, which starts at level 1 and plays by its own rule: less health and
 * defense, a little more attack, more gold from every fight and find, and an
 * edge in desk raids. One hero adventures at a time; the other waits where it
 * was left. The Rogue's numbers were fitted with the harness so it levels at
 * the Warrior's pace (docs/evidence/classes.md). Everything else is v17.
 */
export const contentV18: ContentCatalog = {
  ...contentV17,
  contentVersion: 'v18',
  unlocks: { ...contentV17.unlocks!, roster: 6 },
  classes: {
    warrior: {
      id: 'warrior',
      name: 'Warrior',
      blurb: 'Holds the desk, with the most health and the steadiest fights.',
      passive: { name: 'Steady', blurb: 'Full health and defense, with no special trick.' },
      hpPct: 100,
      modifiers: {},
      raidEdgePct: 0,
    },
    rogue: {
      id: 'rogue',
      name: 'Rogue',
      blurb: 'Works the corridors. Hits a bit harder and pockets more, but takes hits worse.',
      passive: { name: 'Light fingers', blurb: 'More gold from every fight and find, and an edge in desk raids, raiding or defending.' },
      hpPct: 93,
      modifiers: { attackPct: 10, defensePct: -10, goldPct: 20 },
      raidEdgePct: 5,
    },
  },
}
