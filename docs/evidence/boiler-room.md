# The Boiler Room: build evidence (D228)

Date: 2026-11-10 · Simulation version 1 · Content v30 · Achievement catalog version 14 · Harness: `pnpm balance --heroes 150 --days 90 --content v30 --json docs/evidence/balance-v30-boiler-room-90-days.json` against the same run on v29 ([tools/balance/run.ts](../../tools/balance/run.ts)), and `pnpm balance:standoffs --heroes 90 --days 90 --content v30 --json docs/evidence/standoffs-v30-90-days.json` against v29 ([tools/balance/standoffs.ts](../../tools/balance/standoffs.ts)) · Local Node, pure simulator in memory, no database. Raw reports: [v30](balance-v30-boiler-room-90-days.json), [v29 baseline](balance-v29-baseline-90-days.json), [standoffs v30](standoffs-v30-90-days.json), [standoffs v29 baseline](standoffs-v29-baseline-90-days.json).

## What was built

- Content v30 = v29 plus one floor at level 20 (tier 6, `gearTier: 4`, the Garage's 35 potion share), four monsters with lines, plurals, to-do targets and field notes, potion weights for tier 6, to-do pay of 60 gold, three dug-in and three won standoff lines, gear tier 4 with four templates, a Mk IV workbench step, `reinforceFromTier: 3`, and one career rung inserted before the +3 goal ([v30.ts](../../packages/desk-crawler/src/content/v30.ts), [spec](../biomes.md#the-boiler-room-d228)).
- `nextStep` takes the hero's level: below the reinforcing tier the next tier is always the step (so "Mk II needs level 4" still refuses), from it a tier the hero cannot equip does not count, so a Mk III piece reinforces until level 20 and the Mk IV step then carries the reinforcement ([workbench.ts](../../packages/desk-crawler/src/sim/core/workbench.ts)).
- A floor-win rung counts a win on the named floor or any deeper one ([career.ts](../../packages/desk-crawler/src/sim/core/career.ts)); `remapRung`'s past-the-end branch lands a finished hero on an unmet rung inserted right before the old last rung.
- Art: one backdrop and four sprites on the scene paths, four bag icons, furnace-copper bands, device inks and companion tones; `tools/landing/floors.ts` rerun for the public floor picture and facts. Twenty scene samples from `tools/art/scenes.ts` were looked at; the Furnace Hound was redrawn once to read as a dog, and the right-hand gauge and fuse board moved clear of the elite crown.
- Achievement catalog version 14: four monster families, Boiler Room Cleared, Long service (levels 24, 28, 32, 40, 50).
- Seven dictionaries: 13 nouns and 126 lines each. The help page's workbench paragraph reads the tier steps by number in eight languages.

## Gate

| Gate (from [biomes.md](../biomes.md)) | Result |
| --- | --- |
| Nothing below level 20 changes | Pass: a level-18 hero in the Garage gives the same stories, item changes and hero state under v29 and v30 until it reaches level 20 (`tests/sim/boiler-room.test.ts`); every reach date and knockout rate below level 20 is identical to the decimal in the 90-day run |
| The floor drops tier-4 gear and tier-6 potions | Pass: 400 seeded Boiler Room ticks create only tier-4 templates at required level 20; majors outnumber healing potions and no minor drops |
| Knockouts on the new floor for managed cohorts at or under the Cafeteria's at its own unlock | Pass: 0.6 / 0.5 / 0.5% of hero-days for daily, three-day and weekly managers over about 10,000 hero-days each, against the Cafeteria's 9.3% in its first days and the Archive's 2.7%; the undergeared cohort 1.2% |
| Mk III gear keeps reinforcing below level 20; Mk IV carries reinforcement | Pass (`tests/sim/boiler-room.test.ts`, `tests/convex/workbench.test.ts`): a level-12 Mk III piece gets "Reinforce to +1", a level-1 Letter Opener still gets "Upgrade to Mk II" and `LEVEL_TOO_LOW`, a Mk III +3 at level 20 becomes Mk IV +3 with attack 22 |
| No weekly visitor is held on a floor it skipped | Pass after a fix: the first run left 50 of 150 weekly managers on "Win a fight in the Parking Garage" at day 90, since a weekly visitor at level 15 travels to the Archive and comes back at level 20 and goes straight to the Boiler Room; a floor-win goal now counts a deeper floor's win and every managed hero finishes the ladder |
| Dug-in elites stay winnable with real risk (D163's gate: about one a week, at least half won) | Pass, harder than before: 1.1 a week, 76% won, 12% knocked out, 12% slipped (v29: 85 / 8 / 7%); knockouts per hero-day at level 12+ rise from 0.020 to 0.034 for daily managers |
| Typecheck, tests, knip | Pass: the workspace typecheck, 1,236 tests (six new in `tests/sim/boiler-room.test.ts`) and knip |

## Pacing and knockouts per cohort (150 heroes, 90 days)

| Cohort | Level 20 (median / p90, days) | Level at day 90: v29 → v30 | Knockouts, % of hero-days: Garage (first days only) / Boiler Room | XP in the last week: v29 → v30 | Gold at day 30 / 60 / 90 (v30) | Workbench gold: v29 → v30 | Mk IV weapon (median day, heroes) | Armor +3 (median day): v29 → v30 |
| --- | --- | --- | --- | --- | --- | --- | --- | --- |
| Daily | 21.7 / 22.9 | 46 → 53 | 3.8 / 0.6 | 37,910 → 56,708 | 2,837 / 8,796 / 33,012 | 29,000 → 34,000 | 23.9 (86 of 150) | 49 → 49.5 |
| Three-day | 23.8 / 26.1 | 46 → 52 | 1.7 / 0.5 | 37,686 → 56,344 | 4,115 / 9,531 / 30,931 | 28,000 → 32,500 | 25.0 (114) | 48.8 → 48.9 |
| Seven-day | 29.1 / 35.2 | 44 → 50 | 0.6 / 0.5 | 37,732 → 56,431 | 2,490 / 8,610 / 21,248 | 28,000 → 31,500 | 35.5 (136) | 56.3 → 56.8 |
| Undergeared three-day | 34.9 / 38.3 | 43 → 48 | 3.4 / 1.2 | 37,686 → 56,344 | 2,227 / 7,046 / 11,567 | 25,300 → 30,300 | 36.8 (150) | 63.9 → 66.6 |
| Safe-farming three-day | never (level 14) | 14 → 14 | never leaves the Office | 1,339 → 1,339 | unchanged | unchanged | | |
| Unattended | never (level 14) | 14 → 14 | | 1,336 → 1,336 | unchanged | unchanged | | |

Reading it:

- **The floor is as safe as the rule asks and harder than the Garage was.** The Garage under v29 read 0.3% over seventy days because heroes outgrew it; the Boiler Room reads 0.6% over sixty-eight days with heroes going from level 20 to 53 and into tier-4 gear, and the Garage now reads as a fresh unlock (3.8% over its five days, the Archive's 2.7% beside it). The dug-in elites carry the risk the floor's ordinary fights do not: three in four won instead of six in seven, and knockouts at level 12+ up by about two thirds.
- **Older heroes move again, and the ceiling moved.** A daily manager gains 56,700 XP in its last week instead of 37,900 and stands at level 53 on day 90 instead of 46; the weekly manager at 50 instead of 44. The Boiler Room pays 130 to 186 XP a fight against the Garage's 86 to 124.
- **Gold rises and the workbench takes more of it.** The floor pays 16 to 20 gold a fight and 60 a task (task gold 125 a day, 11% of income, inside the quests gate). A daily manager holds 33,000 gold at day 90 against 26,500 under v29 while spending 34,000 instead of 29,000 on the workbench; the Mk IV step is the difference. Finds matter again: best-in-slot moves from day 43.6 to 48.1 because it now means tier-4 rare-or-better stats.
- **Mk IV arrives on day 24 for the weapon** (86 of 150 daily managers step it; the rest find tier-4 gear and equip it) and later or never for the armor, which the harness upgrades second and often replaces with a find first. The +3 dates barely move (49 → 49.5 for armor), so the deep sink the +3 goal represents is unchanged.
- **The Boiler Room goal is celebrated with the +3 run-up.** It sits right before +3 so a hero waiting on +3 meets it at the switch; in the harness it pays on day 33.4 for daily managers, the same day as level 20 and 24 and the dug-in elite, which is the day the dug-in goal (now ahead of them) is met. The dug-in goal itself moves from day 28.6 to 33.4 because Boiler Room elites are harder to finish; nothing else on the ladder moves.
- **Potions behave as the Garage's share predicts.** Daily managers begin 8.5% of Boiler Room ticks with an empty pouch (4.1 found, 3.6 drunk a day); the Garage during its five-day stay shows 48%, as the Archive did when it was a fresh unlock (D222).
- **Achievement shares at day 30:** every daily manager holds tiers I to III of all four new monster families (10% at tier IV); three-day managers 95 / 95 / 73%; weekly managers 18% at tier I. Long service's first tier (level 24) is reached on day 33.

## How the numbers got here

1. Monster numbers were fitted on paper to the Garage's round and damage band at level 20 in tier-3 common gear before the first run, and were not changed: the first run already passed the knockout gate.
2. The first run put the Boiler Room goal after "Reach level 20"; the switch rule (D135) would then skip it for heroes standing on +3, which are the heroes who need it. It moved to right before +3.
3. The first run left a third of weekly managers stuck on the Garage goal (above); the floor-win rule changed and the run was repeated with the baseline.
