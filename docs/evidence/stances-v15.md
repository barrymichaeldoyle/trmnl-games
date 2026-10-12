# Stances with desk raids: build evidence (D132)

Date: 2026-10-12 · Simulation version 1 · Content v15 (built; production runs v14 until Barry switches it between runs) · Harness: `pnpm balance` ([tools/balance/run.ts](../../tools/balance/run.ts)) · Local Node 24, pure simulator in memory, no database.

## What changed

- Content v15 = v14 with `unlocks.stances` moved from 3 to 7 and the `pick_stance` rung marked `retired` ([v15.ts](../../packages/desk-crawler/src/content/v15.ts)). Every rung id stays in its place. The `first_raid` blurb now says the stance moves the raid odds.
- A retired rung ([career.ts](../../packages/desk-crawler/src/sim/core/career.ts)) is walked past without pay or a line: when a hero joins, when the pointer moves on from the rung before it, and when a pointer was left on it by an earlier catalog. The validator refuses a guarantee on a retired rung and a ladder with no live rung.
- `heroes.mine` hides a retired rung that the hero never reached and counts the rest, so the Career page reads "5 of 21". A hero who reached "Pick a stance" under v12 to v14 still sees it with its date, and a reward still waiting for it can be claimed.
- The stance card says what the stance risks where the hero is now. In Office Cubicles it reads "Office Cubicles can't knock your hero out, so Bold has no knockout risk here.", and on the other floors "Here a knockout costs gold and sends your hero back to Office Cubicles. Cautious gets knocked out least and Bold most." `heroes.mine` biomes carry `safe` for this. The help page's Stances section says the same.

## Gate

| Gate | Result |
| --- | --- |
| No reordered or reused rung id | Pass: the v15 ids equal v14's in order (`tests/sim/career.test.ts`) |
| No hero can be held on, or paid twice for, the retired rung | Pass: a joining hero, a hero finishing "Sell a piece of gear" and a pointer left on the retired rung all move to "Reach level 4" with no line for it (`tests/sim/career.test.ts`) |
| Stored states from v12 to v14 stay valid | Pass: a state that reached and has not claimed `pick_stance` passes `careerProblems` and claims under v15 |
| Stance refused below level 7 | Pass: `LOCKED` at 6, allowed at 7 (`tests/convex/career.test.ts`) |
| Balanced pacing unchanged | Pass: 90-day level medians match v14 in five cohorts and differ by 0.1 days in the other two; final levels and Cafeteria death rates are unchanged ([v15](balance-v15-stances-90-days.json), [v14](balance-v14-potions-90-days.json)) |

## Stance cohorts, 30 days, v14 → v15

Every hero in a run holds one stance. Under v15 the stance only applies from level 7, so a run measures what changes before it. Reproduction:

```sh
pnpm balance --heroes 300 --days 30 --content v14 --stance bold --json docs/evidence/balance-v14-bold-30-days.json
pnpm balance --heroes 300 --days 30 --content v15 --stance bold --json docs/evidence/balance-v15-bold-30-days.json
pnpm balance --heroes 300 --days 30 --content v14 --stance cautious --json docs/evidence/balance-v14-cautious-30-days.json
pnpm balance --heroes 300 --days 30 --content v15 --stance cautious --json docs/evidence/balance-v15-cautious-30-days.json
pnpm balance --heroes 300 --days 90 --content v15 --json docs/evidence/balance-v15-stances-90-days.json
```

| Cohort | Bold: level 8 median day | Bold: level 12 | Bold: Cafeteria death-day % | Cautious: level 8 | Cautious: level 12 | Cautious: Cafeteria death-day % |
| --- | --- | --- | --- | --- | --- | --- |
| Daily | 7.3 → 7.7 | 12.9 → 13.3 | 11.7 → 12.7 | 9.0 → 8.2 | 14.6 → 13.8 | 0.6 → 0.5 |
| Three-day | 8.6 → 8.9 | 17.0 → 17.3 | 9.3 → 10.3 | 11.0 → 9.4 | 17.1 → 16.3 | 0.5 → 0.6 |
| Seven-day | 16.6 → 16.9 | >30 (105 → 97 of 300 reach it) | 26.7 → 27.0 | 21.6 → 17.3 | >30 → 28.6 (134 → 181 of 300) | 1.0 → 1.0 |
| Undergeared three-day | 10.0 → 10.1 | >30 (127 → 104 of 300) | 74.1 → 76.5 | 11.4 → 10.4 | 23.3 → 23.0 | 16.5 → 18.6 |

How to read it: before level 7 every hero plays Balanced, so Bold loses its early XP bonus (level 8 about 0.3 days later) and Cautious stops paying for safety it did not need in the Office (the weekly cohort reaches level 8 four days sooner). Cafeteria knockouts move within sampling noise, because the Cafeteria opens at level 8, after the stance is back in play. Stances arrive with raids on day 6.1 for a daily manager, 7.2 for three-day and 15 for weekly (v14: level 3, about day 1 to 2).

The career ladder pays 20 gold less (990 instead of 1,010 per finished ladder) and has 21 live rungs.
