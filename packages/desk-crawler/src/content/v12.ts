import type { ContentCatalog } from '../sim/core/types'
import { contentV11 } from './v11'

/*
 * Content catalog v12 (P35): the career ladder and feature unlocks.
 *
 * Barry's direction on 2026-10-12: one long-term objective at a time, so a
 * player always knows the next step and why the companion matters; features
 * that arrive as the hero progresses, with the next objective being to use
 * them; and a more predictable opening for new heroes. Nineteen rungs over
 * the counters achievements already read, paying gold only. The to-do list,
 * stances, office decisions, the wandering merchant and desk raids arrive at
 * levels 2, 3, 5, 6 and 7 (the Server Room and Cafeteria keep levels 4 and 8).
 * Five rungs guarantee their lucky event within a bounded number of
 * adventures by replacing the rolled encounter kind; every draw is still
 * taken, so nothing else moves. Everything else is v11.
 *
 * A hero above a level keeps what it has; an existing hero joins the ladder at
 * its first unfinished rung with no pay and no lines (docs/objectives.md).
 */
export const contentV12: ContentCatalog = {
  ...contentV11,
  contentVersion: 'v12',
  unlocks: { todo: 2, stances: 3, choices: 5, merchant: 6, raids: 7 },
  career: {
    rungs: [
      { id: 'first_win', title: 'Win your first fight', blurb: 'Your hero fights whatever it meets in the Office. One win is enough.', predicate: { kind: 'counter', counter: 'combatWins', atLeast: 1 }, gold: 10, guarantee: { event: 'combat', withinTicks: 4 } },
      { id: 'equip_find', title: 'Equip a piece of gear you found', blurb: 'Found gear waits in the bag until you put it on. The Bag page does it.', predicate: { kind: 'counter', counter: 'itemsEquipped', atLeast: 1 }, gold: 15, companion: true, guarantee: { event: 'gear', withinTicks: 12 } },
      { id: 'level_2', title: 'Reach level 2', blurb: 'The first promotion comes before lunch.', predicate: { kind: 'level', atLeast: 2 }, gold: 15 },
      { id: 'three_tasks', title: 'Finish three to-do tasks', blurb: 'The morning stand-up hands out small jobs. Your hero ticks them off by itself.', predicate: { kind: 'counter', counter: 'tasksCompleted', atLeast: 3 }, gold: 20 },
      { id: 'first_sale', title: 'Sell a piece of gear', blurb: 'Spare gear is gold on the Bag page, and a bag that stays full stops the adventures.', predicate: { kind: 'counter', counter: 'itemsSold', atLeast: 1 }, gold: 20, companion: true },
      { id: 'pick_stance', title: 'Pick a stance', blurb: 'Cautious, Balanced or Bold: how far your hero pushes before it rests.', predicate: { kind: 'counter', counter: 'stanceChanges', atLeast: 1 }, gold: 20, companion: true },
      { id: 'level_4', title: 'Reach level 4', blurb: 'The Server Room opens at level 4.', predicate: { kind: 'level', atLeast: 4 }, gold: 25 },
      { id: 'first_trip', title: 'Travel to the Server Room', blurb: 'The fights there are harder and pay more. Travel is on the Hero page.', predicate: { kind: 'counter', counter: 'trips', atLeast: 1 }, gold: 25, companion: true },
      { id: 'laptop_backpack', title: 'Buy the Laptop Backpack', blurb: 'Thirteen slots instead of ten, bought on the Bag page.', predicate: { kind: 'bag', atLeast: 13 }, gold: 30, companion: true },
      { id: 'first_decision', title: 'Answer an office decision', blurb: 'Now and then a decision turns up on the Hero page. Answer it before time runs out and the default is picked.', predicate: { kind: 'counter', counter: 'choicesMade', atLeast: 1 }, gold: 30, companion: true, guarantee: { event: 'choice', withinTicks: 48, repeat: true } },
      { id: 'lunchbox', title: 'Buy the Lunchbox', blurb: 'Thirty potions instead of twenty, from the Bag page.', predicate: { kind: 'pouch', atLeast: 30 }, gold: 30, companion: true },
      { id: 'merchant_meet', title: 'Meet the wandering merchant', blurb: 'A merchant passes through for four adventures and sells the next bag or pouch at a discount. Alerts can tell you when.', predicate: { kind: 'counter', counter: 'merchantVisits', atLeast: 1 }, gold: 40, guarantee: { event: 'merchant', withinTicks: 48 } },
      { id: 'first_elite', title: 'Beat an elite', blurb: 'About one fight in thirty is an elite. Elites are tougher and give four times the XP.', predicate: { kind: 'counter', counter: 'eliteWins', atLeast: 1 }, gold: 40, guarantee: { event: 'elite', withinTicks: 96, outsideSafe: true } },
      { id: 'first_raid', title: 'Take part in a desk raid', blurb: "Heroes raid each other's desks by chance. Raiding or being raided both count.", predicate: { kind: 'anyCounter', counters: ['raidsLaunched', 'raidsRepelled', 'raidsLost'], atLeast: 1 }, gold: 40 },
      { id: 'cafeteria_win', title: 'Win a fight in the Cafeteria Depths', blurb: 'Level 8 opens the Cafeteria. Travel there and beat something.', predicate: { kind: 'biomeWin', biomeId: 'cafeteria_depths' }, gold: 50, companion: true },
      { id: 'tasks_25', title: 'Finish 25 to-do tasks', blurb: 'About a fortnight of stand-ups.', predicate: { kind: 'counter', counter: 'tasksCompleted', atLeast: 25 }, gold: 50 },
      { id: 'rare_find', title: 'Find a rare piece of gear', blurb: 'Four finds in a hundred are rare, so this one comes down to luck.', predicate: { kind: 'counter', counter: 'rareFinds', atLeast: 1 }, gold: 60 },
      { id: 'rolling_suitcase', title: 'Buy the Rolling Suitcase', blurb: 'The biggest bag there is: twenty slots.', predicate: { kind: 'bag', atLeast: 20 }, gold: 100, companion: true },
      { id: 'level_12', title: 'Reach level 12', blurb: 'The top of the ladder, for now.', predicate: { kind: 'level', atLeast: 12 }, gold: 100 },
    ],
  },
}
