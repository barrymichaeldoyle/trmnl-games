import type { ContentCatalog } from '../sim/core/types'
import { contentV9 } from './v9'

/*
 * Content catalog v10 (D122): bags and pouches are bought, not granted.
 *
 * Barry's reasoning on 2026-10-11: a level milestone takes away the reason to
 * spend gold on a bag, and a rare bag drop makes every purchase feel like a
 * bet against luck. So the ladders keep one onboarding step, the Tote Bag on
 * the sixth adventure, and everything above it is a shop tier: no milestone,
 * no loot draw (`findPermille` 0), bought in order on the Bag page whenever
 * the hero has the gold. The wandering merchant sells the next rung at a
 * discount, which gives a visit a reason to exist now that the Bag page sells
 * the same rung at any time.
 *
 * Prices come from the harness (docs/evidence/gold-only-ladders.md): the
 * middle rungs are cheaper than v9's so a weekly manager can climb at its
 * first visits instead of sleeping on a small bag, and the top rung stays dear
 * enough that a daily manager is still saving for it in its second week. The
 * pouch keeps its v4 prices. Monsters, gear, stances, choices, effects, raids
 * and the to-do list are v9; the bag and pouch draws still consume their
 * reward-stream rolls, so other outcomes replay unchanged. The desk drawer
 * that v8 to v10 carried was removed in D123 (see v11).
 */
export const contentV10: ContentCatalog = {
  ...contentV9,
  contentVersion: 'v10',
  bagLadder: {
    tiers: [
      { id: 'paper_bag', name: 'Paper Bag', capacity: 6 },
      // The one milestone left: a guaranteed early win about two hours in.
      { id: 'tote_bag', name: 'Tote Bag', capacity: 10, milestone: { ticksExplored: 6 }, price: 40 },
      { id: 'laptop_backpack', name: 'Laptop Backpack', capacity: 13, price: 100 },
      { id: 'messenger_bag', name: 'Messenger Bag', capacity: 16, price: 300 },
      { id: 'rolling_suitcase', name: 'Rolling Suitcase', capacity: 20, price: 1500 },
    ],
    findPermille: 0,
  },
  potionPouch: {
    tiers: [
      { id: 'thermos', name: 'Thermos', cap: 20 },
      { id: 'lunchbox', name: 'Lunchbox', cap: 30, price: 120 },
      { id: 'cooler_bag', name: 'Cooler Bag', cap: 40, price: 450 },
      { id: 'vending_cart', name: 'Vending Cart', cap: 60, price: 1500 },
    ],
    findPermille: 0,
  },
  merchant: { ...contentV9.merchant!, ladderDiscountPct: 25 },
  // A rest at full health is about one Office story in seven, so it gets more to say. Narrative draws its own
  // stream, so the extra lines change which words appear and nothing else.
  narrative: {
    ...contentV9.narrative,
    shared: {
      ...contentV9.narrative.shared,
      restFull: [
        ...contentV9.narrative.shared.restFull,
        'Watered the desk plant. Nothing needed healing.',
        'Sat through a stand-up that could have been an email.',
        'Tidied the cable drawer, just because.',
        'Found the good chair and kept it for ten minutes.',
        'Read the notes on the fridge twice.',
        'Reheated lunch and ate it at the desk.',
        'Straightened the mouse mat.',
      ],
    },
  },
}
