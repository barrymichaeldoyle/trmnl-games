# Idle Angler content v2 balance (F1)

Recorded 2026-10-14 for D162 ([spec](../idle-angler-full.md)). The harness `tools/balance/idle-angler-v2.ts` runs the real pure core on content v2 (`packages/idle-angler/src/content/v2.ts`) for cohorts of anglers in lockstep, so each weekend's Open is ranked across the cohort and its medals are paid on Monday. Runs start on Monday 19 October 2026, a spring week. Rerun with `pnpm tsx tools/balance/idle-angler-v2.ts` (add `--json` for the full report); 100 anglers per cohort over 90 days take about 30 seconds.

Content v1 replays unchanged: `tests/idle-angler/v1-replay.test.ts` fingerprints a visiting and a never-visiting cohort over 21 days, recorded before any v2 code touched the core, and still matches.

## Policies

- **Daily, three-day and weekly** players visit at 19:00 UTC. They hand fish to the fishmonger (cheapest matching fish first), mount one new species a visit while they keep 300 coins, sell the rest, and buy upgrades in a fixed order. They then fish the water with the most species left to log, on the bait that covers most of them. A teaching order sends them to its fish first. They also do what the current goal asks: one deadbait and one charter.
- **Never** never visits.
- **Charter** is a daily player who books a ticket whenever it holds none.
- **Fixed** runs put an angler with every upgrade at one water with one bait. They give the deadbait comparison (River Bend, 14 days, bait refilled every cast) and each epic's catch share in its window (its season's week, or 30 days for a year-round epic).

## Gates (100 anglers, 90 days)

| Gate | Value | Range |
| --- | --- | --- |
| Millpond fish a day, first two days (daily) | 13.25 | 10 to 14 |
| Hours to fill the Bucket the first time (daily) | 10 | 8 to 14 |
| Day a daily player owns every one-off purchase | 68.8 | 45 to 75 |
| Idle coins at day 60 beyond the next purchase, in days of income (daily) | 0 | under 10 |
| A charter's catch value against its ticket | 1.51× | 1.2× to 1.8× |
| Order premiums as a share of income (daily) | 4% | under 25% |
| Deadbait coins a day against the best tub bait at River Bend | 0.98× | 0.9× to 1.3× |
| Goal coins as a share of 60-day income (daily) | 1% | under 6% |
| Species logged at day 90 (daily) | 48 of 58 | 40 to 52 |
| Species logged at day 90 (three-day) | 47 | 30 or more |
| Day a weekly player reaches Heron Lake | 56.8 | by 75 |
| Species logged at day 90, never visiting | 7 | 3 or more |
| Opens entered by day 90, never visiting | 3 | 1 or more |
| Golden Carp / Salmon / Thornback Ray in 30 days | 0.68 / 0.98 / 0.70 | 0.5 to 1 |
| Ghost Koi / Halibut / Golden Char in their season's week | 0.53 / 0.75 / 0.55 | 0.5 to 1 |

All 19 gates pass.

| At day 90 | Daily | Three-day | Weekly | Never |
| --- | --- | --- | --- | --- |
| Species logged | 48 | 47 | 35 | 7 |
| Goal reached (rung, of 26) | 26 | 26 | 21 | 1 |
| Orders filled | 24.5 | 17 | 12 | 0 |
| Fish mounted | 24 | 14 | 5 | 0 |
| Coins held | 4,654 | 3,083 | 1,100 | 10 |
| Coins earned a day, last week | 559 | 203 | 77 | 0 |
| Day reaching Heron Lake | 11.8 | 24.8 | 56.8 | never |

Against content v1 under the same harness shape ([v1 evidence](idle-angler-balance.md)), a daily player owned the whole shop on day 22 and held 25,661 coins at day 90 with 18 species logged. Under v2 it owns everything on day 69, holds 4,654 coins and has logged 48 of 58 species, because teaching orders and the bait choice now lead it to the bread, spinner and strip fish.

## Changes from the spec's starting numbers

| Item | Spec | Tuned | Why |
| --- | --- | --- | --- |
| Deadbait bite chance | 75% of a matched bait | 110% | At 75% deadbait earned 0.29× the spinner at River Bend |
| Chub on deadbait | yes | no | Chub made up most deadbait bites and pulled its value down to a worm's; without it deadbait is a predator hunt (0.98× the spinner) |
| Charter ticket | 400 coins | 550 | A 400-coin ticket returned 2.2× its price |
| Boat Rod | 4,000 | 6,000 | With the lower one-off prices a daily player owned everything on day 49 and held 29 days of income at day 60 |
| Ice Auger | 2,500 | 3,500 | Same |
| Pegs to 12 / 18 / 24 | 500 / 1,500 / 4,000 | 800 / 2,500 / 6,000 | Same |
| Opens unlock | 8 species | 6 species | A never-visiting angler logs 7 species in 90 days and could not enter an Open at 8 |
| Ghost Koi | dawn, clear, rarity weight | dawn or dusk, clear or overcast, weight 90 | 3% of anglers caught one in its summer week |
| Golden Char | dawn, clear | dawn or dusk, clear or overcast, weight 40 | 8% caught one in its winter week |
| Idle-coins gate | coins held at day 60 | coins beyond the next one-off purchase | Coins saved toward a 6,000-coin purchase are a goal, not a pile; the gate measures coins with nothing to go to |
