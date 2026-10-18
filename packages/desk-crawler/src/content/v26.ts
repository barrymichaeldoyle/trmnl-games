import type { ContentCatalog } from '../sim/core/types'
import { contentV25 } from './v25'

/*
 * Content catalog v26 (D189, D190): a full bag never stops the hero, and the
 * "Switch to Bold" goal is retired.
 *
 * A full bag used to put the hero to sleep until the player made room. A
 * hero nobody visited slept through 93% of its first month and ended it at
 * level 3, with the desk showing a QR code instead of the story. Now the first
 * find that does not fit is held as before and the hero keeps exploring; while
 * that find waits, later finds stay behind. Making room in the companion moves
 * the held find into the bag. A hero asleep on a full bag when the world
 * switches wakes on the next adventure.
 *
 * "Switch to Bold" (D135, v17) sent heroes into Bold at level 7, one level
 * before the Cafeteria Depths, and the harness counted three to four times as
 * many Cafeteria knockouts for players who visit every few days. Rungs are
 * never reordered, so it is retired: heroes who reached it keep it, and a
 * pointer on it moves on to the raid goal. "Sell a piece of gear" no
 * longer says a full bag stops the adventures. Everything else is v25.
 */
export const contentV26: ContentCatalog = {
  ...contentV25,
  contentVersion: 'v26',
  keepGoingWhenFull: true,
  career: {
    rungs: contentV25.career!.rungs.map((rung) =>
      rung.id === 'go_bold'
        ? { ...rung, retired: true as const }
        : rung.id === 'first_sale'
          ? { ...rung, blurb: 'Spare gear is gold on the Bag page, and a full bag leaves new finds behind.' }
          : rung,
    ),
  },
}
