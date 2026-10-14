# The workbench opens at level 4: build evidence (D155)

Date: 2026-10-14 · Simulation version 1 · Content v23 against v22 · Harness: `pnpm balance --heroes 300 --days 30 --content v22|v23` ([tools/balance/run.ts](../../tools/balance/run.ts)) · Local Node 24, pure simulator in memory, about five minutes a run.

## What changed in the harness

A visit salvages and upgrades only once the workbench is unlocked. A player on the salvage goal salvages one spare for it and sells the rest. A player on the upgrade goal salvages everything and upgrades as soon as it can afford a step, ahead of the bags, since that is what the goal asks. Otherwise the D129 policy is unchanged: sell while a bag or pouch is still to buy, then salvage. The v22 baseline below is re-run under this policy, so the two columns differ only in the catalog.

## Where the goals land (median day reached, 300 heroes, 30 days)

| Cohort | Catalog | Level 4 | Salvage goal | Travel goal | Laptop Backpack goal | Lunchbox goal | Upgrade goal | Rolling Suitcase goal | Gold at day 30 |
| --- | --- | --- | --- | --- | --- | --- | --- | --- | --- |
| Daily | v22 | 2.5 | 12.8 | 3.0 | 3.0 | 4.5 | 13.0 | 9.8 | 5,630 |
| Daily | v23 | 2.5 | 3.0 | 3.0 | 3.1 | 4.5 | 13.0 | 9.8 | 5,628 |
| Daily | upgrade moved too | 2.5 | 3.0 | 8.0 | 8.0 | 8.0 | 8.0 | 10.5 | 5,291 |
| Three-day | v22 | 3.1 | 18.3 | 3.9 | 4.0 | 6.9 | 18.5 | 12.1 | 4,615 |
| Three-day | v23 | 3.1 | 6.0 | 6.0 | 6.0 | 6.9 | 18.3 | 12.1 | 4,514 |
| Three-day | upgrade moved too | 3.1 | 6.0 | 12.5 | 12.5 | 12.7 | 12.5 | 15.8 | 4,572 |
| Seven-day | v22 | 7.1 | >30 | 7.9 | 8.0 | 14.9 | >30 | 23.2 | 1,411 |
| Seven-day | v23 | 7.1 | 14.0 | 14.0 | 14.0 | 14.9 | >30 | 28.1 | 1,340 |
| Seven-day | upgrade moved too | 7.1 | 14.0 | 28.2 | 28.2 | 28.5 | 28.2 | >30 | 1,490 |

Unattended heroes never reach a companion goal in either catalog, and their numbers are identical.

## Reading

- **Daily players** meet the salvage goal half a day after level 4, the visit after the unlock line, and nothing else on the ladder moves.
- **Three-day players** reach it on day 6, the first visit after level 4. The two goals behind it wait for that visit, then catch up by the Lunchbox.
- **Weekly players** reach level 4 just after a visit, so the salvage goal waits for the next one, a week later, and the goals behind it record later (the Rolling Suitcase goal by about five days). The bags themselves are bought on the same visits as before; only the goal pointer waits. Any companion goal after an unlock costs a weekly player one visit, so this is accepted.
- **The upgrade goal stays where it is.** Moved up beside the salvage goal, a level-4 hero needs about five more days to hold 6 Scrap and 150 gold, and the goal holds up every goal behind it: a daily player's Laptop Backpack goal moves from day 3 to day 8.
- Pacing, gold and materials are otherwise unchanged; no cohort's level dates move.

## Gate

| Gate | Result |
| --- | --- |
| The salvage goal follows the unlock for daily and three-day players | Pass: day 3.0 and 6.0, level 4 at 2.5 and 3.1 |
| No cohort's level dates or day-30 gold move by more than a few percent | Pass: gold within 2% for daily and three-day, 5% for weekly (later goal gold) |
| Remapping skips nobody past an unmet salvage goal | Pass by test (`tests/sim/career.test.ts`): a hero past level 4 without a salvage lands on it, in either direction of the switch |
| Below level 4 nothing salvages, upgrades, fits an affix or combines | Pass by test (`tests/convex/workbench.test.ts`): each intent refuses with `LOCKED`, and the Bag view carries the locked card's level instead of the workbench |
