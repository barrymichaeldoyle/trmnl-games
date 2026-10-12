# No desk drawer: the cost of removing it (D123)

Date: 2026-10-12 · Simulation version 1 · Content v11 (v10 without the desk drawer) · Harness: `pnpm balance --heroes 300 --days 30 --content v11` ([tools/balance/run.ts](../../tools/balance/run.ts)) · Local Node 24, pure simulator in memory, no database. Raw report: [balance-v11-no-drawer-30-days.json](balance-v11-no-drawer-30-days.json). The v10 figures come from the same harness before the removal, on the catalog with its six-slot drawer ([balance-v10-gold-only-30-days.json](balance-v10-gold-only-30-days.json)).

## Why

Barry said on 2026-10-12 that the desk drawer (D111) is an unnecessary complication: a bag with slots is a lot simpler to understand, and the drawer makes bags less useful. The numbers below were put to him first, with the option of folding the six slots into every bag rung or retuning prices, and he chose a plain removal with today's bag sizes. This record keeps the cost on file.

## What changed

- Content v11 has no `deskDrawer` rule and the simulator no longer knows one: a gear find that does not fit the bag is held and the hero sleeps, the rule from before v8. The drawer drew no randomness, so every other outcome replays unchanged.
- The two drawer intents, the Bag page section, the help paragraph, the alert copy, the HUD `+N` and the drawer glyph (template v51) are gone. The harness lost its `--drawer` flag and the drawer-finds column.
- Production had one hero, exploring, with an empty drawer and no drawer finds, so no data moved. The legacy fields stay optional in the schema for a later cleanup.

## Cost

Share of 30 days asleep, median day of the first inventory sleep, median day to level 8 and median gold on day 30 (300 heroes per cohort, visits sell every spare and buy every rung they can afford):

| Cohort | v10 (drawer 6) | **v11 (no drawer)** |
| --- | --- | --- |
| Unattended asleep | 89.1% | 93.0% |
| Unattended first sleep | 3.2 d | 2.1 d |
| Daily asleep | 0% | 0% |
| Three-day asleep | 0.5% | 4.3% |
| Three-day level 8 | 8.3 d | 9.2 d |
| Seven-day asleep | 27.2% | **46.8%** |
| Seven-day first sleep | 3.8 d | 2.6 d |
| Seven-day level 8 | 12.5 d | **17.2 d** |
| Seven-day gold, day 30 | 7,474 | 3,720 |
| Seven-day Rolling Suitcase bought | 14.6 d | 21.3 d |

Daily players never fill the bag, so nothing changes for them. The weekly manager pays: it sleeps close to half the month, reaches level 8 almost five days later and buys the last bag a week later, because it earns less gold while asleep. These are the D61 figures the drawer had bought back (48% asleep, level 8 on day 17), which D61 accepted as a cost of the smaller bag and D122's bag prices were tuned with the drawer in place.

## Not retuned

The D122 bag prices (40 / 100 / 300 / 1,500) were chosen against a 30% weekly-sleep gate that assumed the drawer. Barry chose not to retune them now. If weekly sleep matters later, the options on record are cheaper middle rungs or bigger rungs, both measured with this harness.
