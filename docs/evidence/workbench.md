# Salvage and the workbench: build evidence (D129)

Date: 2026-10-12 · Simulation version 1 · Content v13 (built; production runs v12 until Barry switches it between runs) · Harness: `pnpm balance --heroes 300 --days 90 --content v13 --json docs/evidence/balance-v13-workbench-90-days.json` and the same for v12 ([tools/balance/run.ts](../../tools/balance/run.ts)) · Local Node 24, pure simulator in memory, no database. Raw reports: [v13](balance-v13-workbench-90-days.json), [v12 baseline](balance-v12-career-90-days.json).

## What W1 to W4 built

- Content v13 = v12 plus `workbench` ([v13.ts](../../packages/desk-crawler/src/content/v13.ts)): three materials (Scrap from common, Parts from uncommon, Components from rare and epic at three times the yield), five steps (Mk II 6 Scrap + 150 gold; Mk III 6 Scrap, 4 Parts + 500; +1 8 Scrap, 2 Parts + 1,000; +2 12 Scrap, 4 Parts, 1 Component + 3,000; +3 16 Scrap, 6 Parts, 2 Components + 8,000) and the affix price (2 Components + 1,500). Three rungs join the career ladder: salvage a piece, upgrade a piece, reinforce to +3.
- The pure core ([workbench.ts](../../packages/desk-crawler/src/sim/core/workbench.ts)) holds the yield, step and stat rules, the derived read bound (20 + 2 + 1 + 1 + 3 = 27 of 32 rows) and the catalog checks: every rarity salvages into exactly one material, every tier above the first has a step, reinforcement steps run +1, +2, +3 at rising gold, every step costs something. `bagUsed` counts gear only, so material rows take no slot. Invariants check material rows (one per kind, quantity at least 1) and that an upgraded item's copied stats match its tier and reinforcement under a catalog that can compute them.
- The simulator changes no draw. A hero with reinforced gear and material rows replays identically under v12 and v13 for 300 seeded ticks (`tests/sim/workbench.test.ts`): the stats were always on the item.
- Backend ([inventory.ts](../../apps/backend/convex/inventory.ts)): `salvageMany` (1 to 30 bag items, `sellMany`'s checks), `upgrade` (the item's next step, refused when the result would be unequippable or unaffordable, naming the shortfall) and `chooseAffix` (rare and epic only, never the affix it has), all receipted; `inventory.mine` carries the materials, the affix price and list, and per item the yield, suffix, next step and affixability. New counters `itemsSalvaged`, `gearUpgraded`, `topReinforcement`. Achievement catalog version 5 appends Salvaged (1 / 25 / 100) and Workbench (1 / 5 / 15).
- Companion: Salvage beside Sell on the gear window and in the item sheet, a salvage review sheet naming the yield, a Workbench card (materials strip, one row per equipped piece with its next step, price, resulting stat and shortfall, Choose affix for rare and epic) and confirmation sheets for every job. Help gains "Salvage and the workbench", read from the active catalog. Analytics `gear salvaged`, `gear upgraded`, `affix chosen`.

## Gate

| Gate (from the [spec](../salvage.md#work-slices)) | Result |
| --- | --- |
| v12 replays unchanged under v13 | Pass: 300 seeded ticks of a level-9 bold hero wearing a +3 weapon and a +2 armor, with material rows, give the same story, item directives, deltas and hero state (the new item's catalog stamp aside) |
| Every step costs more than the yield of its result | Pass by construction: yields read the found tier, so no step raises one; the validator refuses a free step |
| No step can be paid twice | Pass: a repeated `salvageMany` receipt writes nothing more; `upgrade` runs under the same receipt helper (`tests/convex/workbench.test.ts`) |
| No item can be made unequippable by its owner | Pass: `LEVEL_TOO_LOW` for a level-3 hero's Mk II; the step table reports `requiredLevel` so the card says so first |
| A sleeping hero can still free its bag | Pass: salvage is allowed in every manageable status, sleeping included |
| No new per-tick reads | Pass: material rows ride in the existing bounded item read; the adapter copies `tier` and `reinforced` into the snapshot |
| The derived read bound holds | Pass: 27 of 32 under v13; a catalog with nine material kinds is refused |
| Gold hoard falls; Cafeteria knockouts no worse than v12 plus the +3 effect | Pass: see below. Daily managers' knockout rate is 0.6% of Cafeteria hero-days under both catalogs; the undergeared cohort's falls from 7.8% to 6.0% because the workbench is the only thing it ever improves |
| Phone layout | Pass at 390 and 320 wide with the fixtures harness (`?workbench=1`, `rich`, `done&long=1&slots=20`, `0`): the Workbench card, salvage mode, the review sheet, the item sheet, the upgrade confirmation and the affix picker show no horizontal overflow |

Typecheck across the workspace and the full suite (634 tests) pass.

## Gold and steps per cohort (300 heroes, 90 days)

The harness sells while a bag or pouch is still to buy, then salvages everything it does not wear, and at each visit applies every affordable step to the equipped weapon, then the armor. It never chooses an affix.

| Cohort | Gold day 30: v12 → v13 | Gold day 60 | Gold day 90: v12 → v13 | Spent on the workbench (median) | Weapon +3 | Armor +3 | Best-in-slot median: v12 → v13 |
| --- | --- | --- | --- | --- | --- | --- | --- |
| Daily | 12,784 → 2,562 | 4,755 | 38,813 → 16,310 | 28,000 | day 42.9 | day 57.5 | >90 (119 of 300) → 52.4 (240 of 300) |
| Three-day | 10,826 → 3,204 | 5,753 | 36,653 → 14,629 | 28,000 | 45.8 | 63.0 | >90 (112) → 54.5 (240) |
| Seven-day | 2,559 → 2,152 | 4,597 | 23,471 → 6,285 | 17,000 | 77.7 (247 of 300) | >90 (22) | >90 (40) → >90 (124) |
| Undergeared three-day | 2,988 → 1,685 | 7,003 | 24,189 → 8,013 | 25,300 | 60.1 | 75.5 | never → never |
| Safe-farming three-day | 679 → 632 | 811 | 6,319 → 1,945 | 6,300 | >90 | >90 | never → >90 (77) |
| Unattended | 241 → 241 | 241 | 241 → 241 | 0 | never | never | never |

Reading it:

- **The hoard is spent in months two and three**, as designed: a daily manager holds 2,562 gold at day 30 instead of 12,784 and 16,310 at day 90 instead of 38,813, having put 28,000 into the bench. Gold starts to pile again once both slots are +3 (day 57), which is where bigger bags and the later slices take over.
- **Reinforcement is what reaches the ceiling.** Under v12 fewer than half of daily managers were best-in-slot by day 90 (the epic tier-3 find in both slots is a 1-in-100 draw twice over); under v13 the median is day 52, because +3 on a rare Mk III matches it. The D30 "days 35 to 45" window is behind the finds alone now; the workbench brings older heroes to the ceiling without a lucky find.
- **Gold is the binding constraint, not materials.** At day 90 a daily manager holds 703 Scrap, 253 Parts and 62 Components, far more than the ladder spends (54 Scrap, 16 Parts, 3 Components per slot). Components are not the slow material the spec expected: a daily manager salvages 380 pieces in 90 days and one in twenty is rare. The two constraints the decision fixed hold (salvage after a step is a loss; the +3 pair costs 24,000 against 2,562 held at day 30), so prices stay as the starting points. If a later pass wants materials to matter, raising the Scrap and Parts costs of +2 and +3 is the lever; gold prices should not rise, since the weekly manager only just reaches weapon +3 by day 78.
- **Pacing is untouched.** Level 8 and 12 dates, XP per day and Cafeteria knockout rates match v12 for every cohort; the step adds attack and defense the hero's own level already dwarfs by month two, so the +3 effect on knockouts is within the interval for managed cohorts and visible only for the undergeared one.
- **The three new rungs** pay in order after "Reach level 12", so the first salvage and first upgrade rungs land together on the visit after level 12 (daily day 12.9, three-day 18.1, seven-day 35.4; the salvaging itself started once both ladders were bought) and +3 on day 42.9 / 45.8 / 77.7 (247 of 300 weekly managers), so the ladder now runs into the third month for a weekly manager.

## Not measured

The harness never fits an affix (it cannot judge one), so the affix price's share of the sink is not modelled; two choices per slot would add 6,000 gold and 8 Components. Real players who keep gear they like salvage less than the sell-everything harness, so their materials come slower and their gold faster. Raids are modelled with a stand-in target only, so the "spent gold cannot be raided" effect is not measured.

## Switch

Deployed with the push to main (commit 7193943, Workers build passed). Barry switched the production world from v12 to v13 at about 16:27 UTC on 2026-10-12 (`world:setActiveContentVersion` returned `{ from: "v12", to: "v13" }`), between runs 806 and 807; `ACTIVE_CONTENT` is v13 for new worlds. The first v13 run (tick 807, wall slot 16:30 UTC) completed clean: one eligible hero, one processed, nothing quarantined, no `simulationFailures` row, and the hero's `achievementsVersion` moved to 5. Existing items needed no migration: every item reads as its template's tier at +0, and material rows appear on the first salvage. Achievement catalog version 5 evaluates retroactively on each hero's next tick, with nothing to award until a hero salvages or upgrades.
