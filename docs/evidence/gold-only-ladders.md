# Gold-only bag and pouch ladders (D122, content v10)

Date: 2026-10-11 · Simulation version 1 · Content v10 (built; production stays on v9 until the switch) · Harness: `pnpm balance --heroes 300 --days 30 --content v10 --json docs/evidence/balance-v10-gold-only-30-days.json` ([tools/balance/run.ts](../../tools/balance/run.ts)) · Local Node 24, pure simulator in memory, no database. Raw report: [balance-v10-gold-only-30-days.json](balance-v10-gold-only-30-days.json). Price sweeps: [sweep 1](gold-only-ladders-sweep-1.json) (v9's prices and multiples of them), [sweep 2](gold-only-ladders-sweep-2.json) (cheaper middle rungs), [sweep 3](gold-only-ladders-sweep-3.json) (the top rung).

## What changed

- Content v10 = v9 with the bag ladder's three upper rungs and the pouch's three upper rungs as **shop tiers**: no level milestone, no 8‰ loot draw (`findPermille` 0), bought in order through `inventory.buyBag` / `inventory.buyPouch` whenever the hero has the gold. The Tote Bag keeps its sixth-adventure milestone and its 40-gold price. Bag prices are 40 / 100 / 300 / 1,500 (v9: 40 / 150 / 600 / 2,000); pouch prices stay 120 / 450 / 1,500. The merchant gains `ladderDiscountPct: 25`, so its bag and pouch offers cost three quarters of the Bag page price.
- Rules ([bag.ts](../../packages/desk-crawler/src/sim/core/bag.ts), [pouch.ts](../../packages/desk-crawler/src/sim/core/pouch.ts)): a tier without a milestone is never guaranteed, and the one-ahead rule applies only up to the last milestone tier. Under v1 to v9 every upper tier has a milestone, so those catalogs behave exactly as before. The validator now asks each upper tier for a price (a milestone is optional), forbids a milestone after a shop tier and asks shop prices to rise.
- The harness's visit now buys every rung it can afford in one sitting (it used to stop after one, which the one-ahead rule made moot) and records every rung it passed.
- v10 also adds seven full-health rest lines ("Watered the desk plant. Nothing needed healing."). A 100-hero, 7-day story-mix count of an Office hero under v10 reads: combat 29%, loot 28%, rest at full health 15%, rest that healed 15%, trap 10%, merchant 2%, choices 1%; the full-health rest was the most repeated story with three variants. Narrative draws its own stream, so the extra lines change no outcome; the v9 replay test compares everything but that line's wording.
- Companion: the Bag page says how the next rung arrives ("Buy it here whenever you have the gold, or from a wandering merchant at 25% off"), the merchant card labels a discounted offer, `inventory.mine` adds `findable` and `merchantDiscountPct` to `ladder` and `pouch`, the help page reads the ladders from the active catalog, and the merchant alert says "at a discount".

## Why these prices

Sweep 1 showed that moving to gold alone at v9's prices costs the weekly cohort: a weekly manager arrives at its first visit with about 500 gold, so it could buy only one rung a visit, reached 20 slots on day 21.4 instead of 14.8 and slept 31.9% of the month, over the 30% gate the desk drawer (D111) was built to hold. Doubling or trebling prices made that worse. Sweep 2 cut the middle rungs; sweep 3 then varied the top rung with 100 and 300 fixed. Medians of the day each cohort first holds 20 slots, the weekly share of the month asleep and the weekly level-8 day:

| Bag prices | Daily 20 slots | Three-day | Seven-day | Seven-day asleep | Seven-day level 8 |
| --- | --- | --- | --- | --- | --- |
| v9 (milestones, finds, 40/150/600/2,000) | 8.9 | 9.4 | 14.8 | 25.7% | 12.1 |
| 40/150/600/2,000, gold only | 9.4 | 9.8 | 21.4 | 31.9% | 14.9 |
| 40/150/450/1,500 | 7.8 | 9.5 | 14.8 | 30.1% | 14.7 |
| 40/120/400/1,000 | 6.2 | 6.7 | 14.6 | 28.4% | 14.1 |
| 40/100/300/800 | 5.5 | 6.6 | 14.5 | 27.3% | 12.5 |
| 40/100/300/1,200 | 6.5 | 6.8 | 14.6 | 27.4% | 12.5 |
| **40/100/300/1,500** | **7.2** | **9.5** | **14.6** | **27.4%** | **12.5** |
| 40/100/300/2,000 | 8.5 | 9.6 | 14.9 | 28.1% | 12.5 |

The 100 and 300 rungs are what a weekly manager can afford at its first visit, which is what returns its level-8 day to v9's. The top rung at 1,500 keeps a daily manager saving into its second week and a three-day manager on v9's cadence, with a tighter weekly spread (p90 day 21) than 2,000 (21.7). Sweeps 1 and 2 ran before the harness recorded rungs passed in one visit, so their intermediate-rung medians read `>30` where a visit jumped two rungs; the 20-slot day, sleep share and level-8 day are unaffected.

## Result under v10 (the chosen prices, all seven cohorts)

| Cohort | Tote 10 | Backpack 13 | Messenger 16 | Suitcase 20 | Buys / gold spent (median) | Asleep | First sleep | Level 8 | Gold at day 30 |
| --- | --- | --- | --- | --- | --- | --- | --- | --- | --- |
| Unattended | 0.1 | >30 | >30 | >30 | 0 / 0 | 89.1% | 3.2 d | >30 | 366 |
| Daily | 0.1 | 1.2 | 3.3 | 7.2 | 3 / 1,900 | 0% | never | 7.9 | 16,132 |
| Three-day | 0.1 | 3.2 | 3.5 | 9.5 | 2.4 / 1,900 | 0.5% | 106 of 300 once, before the first visit | 8.3 | 14,978 |
| Seven-day | 0.1 | 7.2 | 7.5 | 14.6 | 2.4 / 1,900 | 27.2% | 3.8 d | 12.5 | 7,474 |
| Undergeared three-day | 0.1 | 3.1 | 3.5 | 9.5 | 2.4 / 1,900 | 0.5% | as three-day | 8.5 | 4,882 |
| Safe-farming three-day | 0.1 | 3.2 | 3.5 | 15.0 | 2.4 / 1,900 | 0.6% | as three-day | 18.6 | 2,676 |

Against v9 ([to-do evidence](quests.md)): daily and three-day pacing is unchanged (level 8 on days 7.9 and 8.3), the weekly cohort gives up 0.4 of a day to level 8 and 1.5 points of sleep share, and the unattended hero, which never buys, loses the level-4 Laptop Backpack it used to be handed: it now sleeps from day 3.2 instead of 4.0 and 89% of the month instead of 87%. A third of three-day managers now fill the Tote Bag and the drawer before their first visit (16 finds at ~4.7 a day) and sleep for a few hours; nothing is lost and the visit buys two rungs at once. No bag or pouch is ever found; a level-14 hero on a Paper Bag stays on it until it buys.

## Gate

| Check | Result |
| --- | --- |
| v9 replays unchanged seed by seed | Pass: for heroes at the top of both ladders (where neither catalog can find or grant anything) 900 seeded ticks give identical items, stories, deltas, details and hero state (`tests/sim/gold-only-ladders.test.ts`). Lower down, the only differences are the v9 bag and pouch finds and milestones, which v10 does not have, and the merchant's prices |
| No find, no milestone under v10 | Pass: 3,000 seeds at an eligible mid-game hero find neither, where v9 finds both; a level-14 hero on a Paper Bag and a Thermos gets nothing on a tick, in the simulator and through the Convex tick |
| Shop tiers sell in order at any level | Pass: a level-1 hero with 2,000 gold buys Backpack, Messenger and Suitcase in three receipted calls and is refused out of order; the pouch likewise, with `NOT_ENOUGH_GOLD` when short |
| Tote Bag still on the sixth adventure | Pass: 50 fresh heroes over 40 ticks hold 6 until their sixth adventure and 10 from it |
| Merchant discount | Pass: 225 for the Messenger Bag and 90 for the Lunchbox where v9 charged 600 and 120 on the same seed |
| Weekly sleep share under the drawer's 30% gate | Pass: 27.2% |
| Layout | Bag page and merchant card checked at 390 px with the fixtures harness (`?merchant=1`): no overflow, the new copy wraps to two lines |

Typecheck across the workspace and the full suite (603 tests) pass.

## Not measured

The harness never buys pouches and never waits for a merchant, so the discount's effect on bag timing (a player who holds out for 25% off) is not modelled; with 6 of 100 loot draws a merchant visit, that wait is a day or two at most. Real players who keep gear reach the drawer sooner than the sell-everything harness.
