import type { ContentCatalog } from '../sim/core/types'
import { contentV14 } from './v14'

/*
 * Content catalog v15 (D132): stances arrive with desk raids.
 *
 * At level 3 a hero is still in Office Cubicles, which cannot knock it out,
 * so Bold was the right answer every time and the choice taught nothing. The
 * stance first matters at level 7, where it sets the raid odds, one level
 * before the Cafeteria Depths can knock a hero out. Stances now unlock at 7.
 * The "Pick a stance" goal sat between levels 3 and 4, where it would have
 * held the ladder back for four levels; rungs are never reordered, so it is
 * retired (heroes who reached it keep it) and the raid goal names the stance
 * instead. Below level 7 every hero plays Balanced, as before. Everything
 * else is v14.
 */
export const contentV15: ContentCatalog = {
  ...contentV14,
  contentVersion: 'v15',
  unlocks: { ...contentV14.unlocks!, stances: 7 },
  career: {
    rungs: contentV14.career!.rungs.map((rung) =>
      rung.id === 'pick_stance'
        ? { ...rung, retired: true as const }
        : rung.id === 'first_raid'
          ? { ...rung, blurb: "Heroes raid each other's desks by chance, and your stance moves the odds. Raiding or being raided both count." }
          : rung,
    ),
  },
}
