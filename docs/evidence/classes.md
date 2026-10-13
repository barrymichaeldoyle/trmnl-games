# Classes and the hero roster: evidence (D136)

Date: 2026-10-13 · Simulation version 1 · Content v18 · Achievement catalog version 8 · Spec: [classes.md](../classes.md)

## What was checked

| Check | Result |
| --- | --- |
| The Warrior is untouched | Pass: v18 validates with the Warrior at 100% health, no modifiers and no raid edge, and a level-9 Bold Warrior in the Cafeteria replays 300 seeded ticks under v18 with stories and state identical to v17 (`tests/sim/classes.test.ts`) |
| The Rogue's rule applies everywhere stats resolve | Pass: health through `heroMaxHp` (fights, potions, revival, level-ups, decisions, invariants, the HUD and the device payload); attack, defense and gold through the modifier resolver; the raid edge on both sides of the contest, with every stance and class pairing inside 10 to 90% |
| The roster opens once, for the Warrior | Pass: "Unlocked: a second hero." when a Warrior reaches level 6 under v18; nothing for a Rogue reaching 6, and nothing under v17 |
| Recruit, switch and undo | Pass: closed before v18 and below Warrior level 6; one hero per class; the recruit is current at once at its own full health; one switch a day; a switch back inside ten minutes is free and cannot itself be undone; a dead or travelling hero cannot be parked; another account's hero cannot be switched to (`tests/convex/roster.test.ts`) |
| Parked heroes freeze | Pass: six runs with the Warrior parked leave its `lastTick` untouched while the Rogue's advances; on return its effect, decision and nap ticks move on by the gap and its merchant has left |
| Deletion covers the roster | Pass: game deletion removes both heroes and all their items (before D136 only the current hero was removed) |
| Rogue achievements | Pass: `classLevel` and `classCounter` read zero for a Warrior, so no Warrior earns a Rogue tier |
| Art | Pass: six Rogue poses under the same scene URL scheme, each parsed and rendered; the Warrior's paths are unchanged |
| Companion | Pass in the fixtures harness at 320 and 390 wide, no horizontal overflow: the Heroes page (one hero with a recruit card, two heroes with the switch spent, inside the undo), the Hero page's locked, ready and two-hero cards, and the More tab |

## Fitting the Rogue

Harness: `pnpm balance --heroes 300 --days 90 --content v18 --stance balanced --class warrior|rogue`. Gate: median level within 5% of the Warrior's in every cohort, Cafeteria knockout days no more than 1.5 times the Warrior's.

| Rogue (health / attack / defense / gold) | Daily: Cafeteria knockout days | Three-day | Seven-day | Pace |
| --- | --- | --- | --- | --- |
| Warrior baseline | 8.5% | 14.6% | 13.2% | level 12 on day 12.7 / 16.3 / 30.8 |
| 85 / +10 / −15 / +20 (first draft) | 21.7% (2.6×) | 20.0% | 16.3% | 13.7 / 18.0 / 31.6 |
| 90 / +5 / −5 / +20 | 18.4% (2.2×) | 18.4% | 15.8% | 13.3 / 17.6 / 31.2 |
| 90 / +10 / −10 / +20 | 15.3% (1.8×) | 16.8% | 14.2% | 13.1 / 16.8 / 31.0 |
| 92 / +10 / −10 / +20 | 12.9% (1.52×) | 15.5% | 13.2% | 13.0 / 16.8 / 30.8 |
| **93 / +10 / −10 / +20 (shipped)** | **10.4% (1.22×)** | **15.4% (1.05×)** | **12.8% (0.97×)** | **12.9 / 16.5 / 30.8** |
| 95 / +10 / −10 / +20 | 9.5% (1.12×) | 14.5% | 12.1% | 12.8 / 16.2 / 30.7 |
| 95 / +10 / −5 / +20 | 8.5% (1.0×) | 13.3% | 10.9% | 12.7 / 15.9 / 30.5 |

Health was the lever: the first draft's 85% doubled the Cafeteria knockouts. At 95% the Rogue was as safe as the Warrior and kept its gold, which would have made it strictly better. 93% keeps a visible cost for the daily player, who spends the most time in the Cafeteria, and the same pace for everyone.

Shipped numbers over 90 days ([warrior](balance-v18-warrior-90-days.json), [rogue](balance-v18-rogue-90-days.json)): median final level 46 / 44 / 34 for the Rogue against 46 / 45 / 34; gold held on day 90 50,450 / 45,235 / 17,008 against 40,749 / 36,826 / 11,603 (+24%, +23%, +47%), with the same workbench spending. The Rogue's raid edge is not in these numbers: the harness raids a stand-in Balanced Warrior desk.

## Switch

Deployed with dd4155f (Workers build passed). Barry switched production from v17 to v18 on 2026-10-13 (`heroesMoved: 0`, since v18's ladder is v17's); run 867, the first on v18, completed clean: one eligible hero, one processed, nothing quarantined, no simulation failures, and the hero's `achievementsVersion` moved to 8. That hero is a level-6 Warrior, so its roster is already open.
