import type { ContentCatalog } from '../sim/core/types'
import { contentV21 } from './v21'

/*
 * Content catalog v22 (D146): bigger bags. Three shop tiers join the bag ladder
 * above the Rolling Suitcase, 24, 28 and 32 slots, bought in order on the Bag
 * page like the rungs below them. They are the gold sink for a hero whose
 * workbench is done: a daily manager reaches +3 on both slots around day 40
 * and then banks about 650 gold a day with nothing to spend it on
 * (docs/evidence/bigger-bags.md). A bigger bag also lets a weekly visitor
 * sleep less on a full one. Nothing is found or granted, and the merchant
 * offers the next rung at its usual discount. One career rung joins the end of
 * the ladder, and the Rolling Suitcase rung stops calling itself the biggest
 * bag. Everything else is v21.
 */
const rungs = contentV21.career!.rungs.map((rung) =>
  rung.id === 'rolling_suitcase' ? { ...rung, blurb: 'Twenty slots, from the Bag page.' } : rung,
)

export const contentV22: ContentCatalog = {
  ...contentV21,
  contentVersion: 'v22',
  bagLadder: {
    ...contentV21.bagLadder,
    tiers: [
      ...contentV21.bagLadder.tiers,
      { id: 'gym_duffel', name: 'Gym Duffel', capacity: 24, price: 4000 },
      { id: 'steamer_trunk', name: 'Steamer Trunk', capacity: 28, price: 10000 },
      { id: 'stationery_cupboard', name: 'Stationery Cupboard', capacity: 32, price: 20000 },
    ],
  },
  career: {
    rungs: [
      ...rungs,
      { id: 'gym_duffel', title: 'Buy the Gym Duffel', blurb: 'Past the Rolling Suitcase, the Bag page sells bigger bags. The Gym Duffel holds 24.', predicate: { kind: 'bag', atLeast: 24 }, gold: 150, companion: true },
    ],
  },
}
