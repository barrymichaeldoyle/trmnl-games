# Potion strengths: build evidence (D131)

Date: 2026-10-12 · Simulation version 1 · Content v14 (live in production since 17:52 UTC the same day) · Harness: `pnpm balance --heroes 300 --days 90 --content v14 --json docs/evidence/balance-v14-potions-90-days.json` against the v13 baseline from D129 ([tools/balance/run.ts](../../tools/balance/run.ts)) · Local Node 24, pure simulator in memory, no database. Raw reports: [v14](balance-v14-potions-90-days.json), [v13 baseline](balance-v13-workbench-90-days.json).

## What V1 to V4 built

- Content v14 = v13 plus `potions` ([v14.ts](../../packages/desk-crawler/src/content/v14.ts)): minor (25% of max HP, `minor_potion`), healing (40%, `healing_potion`, the row every hero already holds) and major (60%, `major_potion`); drop weights by biome tier (Office 60 / 40 / 0, Server Room 25 / 60 / 15, Cafeteria 10 / 50 / 40); the combine recipe (3 minors + 1 Scrap → 1 major); loot lines that name the strength. `content.potion` stays the healing potion for the starter kit, the merchant and decisions.
- The pure core ([potions.ts](../../packages/desk-crawler/src/sim/core/potions.ts)) holds the strengths (one entry, the catalog potion, before v14), the automatic drink (weakest potion that puts the hero at or above its stance's potion line, else the strongest), the manual default (smallest that heals to full, else the strongest), the strength draw by tier on the reward stream, combine arithmetic and the catalog checks (ascending distinct strengths, the catalog potion among them at the same heal, weights per tier summing to 100 over known strengths, an upward recipe that costs a material the workbench knows, `{potion}` in every loot line). The read bound becomes 20 + 2 + 1 + 3 + 3 = 29 of 32 rows. Invariants: one row per strength, every row a known strength under v14, every strength under one pouch cap; a world rolled back to v13 carries a multi-row hero.
- The simulator draws the strength only under a catalog with the rule, so v13 replays unchanged for 300 seeded ticks (`tests/sim/potions.test.ts`); under v14 the potion branch records the found `templateId`, the story says "Found a major potion in the first-aid kit.", the drink says "Drank a minor potion." and heals that strength, and a decision's potions join the healing row in one directive.
- Backend ([inventory.ts](../../apps/backend/convex/inventory.ts)): `usePotion` takes an optional `templateId` (by name, or best fit); `combinePotions(batches)` (1 to 10) spends the source potions and materials and adds the result, once per receipt, naming the shortfall (`NOT_ENOUGH_POTIONS`, `NOT_ENOUGH_MATERIALS`) and refusing under v13 (`POTIONS_UNAVAILABLE`). `inventory.mine` adds `potionRows` and `potionCombine`; `potions`, the merchant's pouch check, a decision's potions and the device payload count every row. Counter `potionsCombined`; achievement catalog version 6 appends Potion mixing (1 / 10 / 50).
- Companion: the Hero page's Drink button opens a picker when more than one strength is held (each row: name, HP restored now, count); the Bag page's potion sheet lists the strengths with their heal and a Combine row with the recipe, the batches affordable and the shortfall; the change row reads "+1 major potion"; help explains the strengths, where each drops, the drinking rule and combining, from the active catalog. Analytics `potion combined`.

## Gate

| Gate (from the [spec](../potions.md#work-slices)) | Result |
| --- | --- |
| Existing potion rows replay identically under v13 | Pass: 300 seeded ticks of a level-6 bold hero finding and drinking potions give the same stories and directives under v13 with the new code (no template on the outcome, "Drank a potion.", one row) |
| A hero never holds more potions than its pouch after any combine, find or purchase | Pass: the simulator's full-pouch fallback reads the total; the merchant refuses a bundle over the total (`POUCH_FULL`); a combine removes three and adds one; 600 v14 ticks never exceed the cap (`tests/sim/potions.test.ts`) |
| No step can be paid twice | Pass: a repeated `combinePotions` receipt writes nothing more (`tests/convex/potions.test.ts`) |
| No new per-tick reads | Pass: potion rows ride in the existing bounded item read |
| The derived read bound holds | Pass: 29 of 32 under v14, 27 under v13 |
| Office and Server Room knockouts and the level-8 date within the v13 spread; majors reach the Cafeteria cohorts | Pass for every managed cohort (below); the undergeared cohort moves from 0.8% to 1.3% in the Server Room, which is why the drinking rule clears the potion line rather than the rest line |
| Phone layout | Pass at 390 and 320 wide with the fixtures harness (`?potions=1`, `short`, `one`, `0` on the Bag page; `?hp=40&potions=1` on Hero): the potion sheet with three strengths and the Combine row, the shortfall line, the drink picker and the one-strength button show no horizontal overflow and no console errors |

Typecheck across the workspace and the full suite (651 tests) pass.

## Pacing and knockouts per cohort (300 heroes, 90 days)

Level-8 and level-12 dates, XP per week and gold at days 30 and 90 are unchanged to the decimal for every cohort (daily: level 8 on day 7.9, level 12 on day 12.9, 13,805 XP in the last week, 2,516 gold at day 30 and 16,306 at day 90 under v14 against 7.9 / 12.8 / 13,805 / 2,562 / 16,310 under v13). The workbench's +3 dates and materials held match v13 within a day and a few units.

| Cohort | Server Room knockouts, % of hero-days: v13 → v14 | Cafeteria knockouts: v13 → v14 | Potions drunk per hero-day | Found per hero-day: minor / healing / major | Drunk per hero-day: minor / healing / major | Pouch at day 90 (median): minor / healing / major | Combined per hero |
| --- | --- | --- | --- | --- | --- | --- | --- |
| Daily | 0.1 → 0.1 | 0.6 → 0.7 | 1.4 → 1.5 | 0.3 / 1.0 / 0.7 | 0.3 / 0.9 / 0.2 | 0 / 22 / 38 | 0.5 |
| Three-day | 0.0 → 0.0 | 0.5 → 0.6 | 1.5 → 1.5 | 0.4 / 1.1 / 0.7 | 0.4 / 0.9 / 0.3 | 0 / 22 / 38 | 0.5 |
| Seven-day | 0.0 → 0.0 | 0.6 → 0.6 | 1.5 → 1.5 | 0.4 / 1.1 / 0.7 | 0.4 / 0.9 / 0.3 | 0 / 24 / 36 | 0.6 |
| Undergeared three-day | 0.8 → 1.3 | 6.0 → 6.4 | 2.8 → 2.8 | 0.8 / 1.7 / 0.9 | 0.7 / 1.6 / 0.4 | 0 / 12 / 48 | 2.6 |
| Safe-farming three-day | never leaves the Office | | 0 → 0 | 0.6 / 0.4 / 0 | 0 / 0 / 0 | 1 / 41 / 18 | 17.4 |
| Unattended | never leaves the Office | | 0 → 0 | 0.1 / 0 / 0 | 0 / 0 / 0 | 6 / 7 / 0 | 0 |

Reading it:

- **Better zones drop better potions, and the hero keeps the big ones.** A Cafeteria manager finds a major about two days in three and drinks one in three of those; the rest bank, so a daily manager ends with 38 majors in a pouch of 60. Majors are drunk only when nothing weaker clears the potion line, which is what the rule intends.
- **The rest line was the wrong line.** The proposal drank the weakest potion that kept the hero above its rest line. Measured, that left the undergeared cohort one hit from a rest after every minor: Server Room knockouts 0.8% → 1.8%, Cafeteria 6.0% → 6.8%. Clearing the stance's potion line instead gives 1.3% and 6.4%, with every managed cohort identical to the decimal between the two rules. Built that way; the spec records the change.
- **Combine is small for managed heroes.** Minors are drunk as they come (0.3 found, 0.3 drunk per hero-day), so a daily manager combines about once in 90 days and spends half a Scrap. The safe-farming cohort, which never drinks, combines 17 times. Scrap held at day 90 (705 for a daily manager) is unchanged. The slice's purpose was content variety and the better-zone-better-potion loop, both of which the harness shows; Combine stays the explicit use for a full pouch of minors. The lever, if it should matter, is keeping minors as stock or pricing it in more Scrap, not more minors.
- **Supply and fallbacks are where v13 left them.** Potions found per hero-day (2.0 to 2.1 for managers) and full-pouch fallbacks to gold (2.5 to 2.7) do not move; the loot table did not change.

## Not measured

The harness never picks a strength by hand (it drinks only automatically), so the manual best-fit default is tested in `tests/convex/potions.test.ts` rather than modelled. Real players who save minors for combining will combine more than the harness and drink fewer majors. The device shows one potion count; no template changed, so no device sweep was run.

## Switch

Deployed with the push to main (commit c04debf, Workers build passed). Barry switched the production world from v13 to v14 at about 17:52 UTC on 2026-10-12 (`world:setActiveContentVersion` returned `{ from: "v13", to: "v14" }`), between runs 812 and 813. The first v14 run (tick 813, wall slot 18:00 UTC) completed clean: one eligible hero, one processed, nothing quarantined, no `simulationFailures` row, and the hero's `achievementsVersion` moved to 6. Existing heroes needed no migration: the one potion row every hero holds is `healing_potion`, which v14 reads as the healing strength (the live hero's 20-potion Thermos is a full pouch of healing potions), and achievement catalog version 6 evaluates on each hero's next tick with nothing to award until a hero combines.
