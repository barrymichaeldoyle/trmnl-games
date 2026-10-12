# The Archive and the Parking Garage, with field notes: build evidence (D133)

Date: 2026-10-12 · Simulation version 1 · Content v16 (production switch from v15 pending) · Achievement catalog version 7 · Harness: `pnpm balance --heroes 300 --days 90 --content v16 --json docs/evidence/balance-v16-biomes-90-days.json` against the v15 run from D132 ([tools/balance/run.ts](../../tools/balance/run.ts)) · Local Node 24, pure simulator in memory, no database. Raw reports: [v16](balance-v16-biomes-90-days.json), [v15 baseline](balance-v15-stances-90-days.json).

## What was built

- Content v16 = v15 plus two biomes, eight monsters, their lines, plurals and to-do targets, potion drop weights for tiers 4 and 5, to-do pay of 40 and 50 gold, two ladder rungs and `lore` ([v16.ts](../../packages/desk-crawler/src/content/v16.ts), [spec](../biomes.md)). The biome template gains an optional `gearTier` (both floors: 3); the simulator's two gear draws read it through `gearTierOf`, and the validator requires it to be a known gear tier at or below the floor's own and checks that templates exist for it. The harness's best-in-slot reads `topGearTier` rather than the top biome tier.
- `biomesVisited` on the counters (optional record, arrivals per biome id) is written in `arrive()`, carried by `withCounterDefaults` so the adapter's per-tick rebuild keeps it, checked by the invariants (known biome ids, nonnegative integers) and stored under an additive schema field; no migration, no backfill ([biomes.ts](../../packages/desk-crawler/src/sim/core/biomes.ts), [schema.ts](../../apps/backend/convex/schema.ts)).
- `loreView` derives every note's state from the catalog and the hero (presence, arrivals or a win for a floor; a win for a monster); `heroes.mine` returns it as `lore`; `loreProblems` requires a 20-to-240-character placeholder-free note for every floor and monster the catalog has. Twenty-five notes are authored.
- Art: two backdrops and eight sprites (24 to 34 pixels wide) on the existing v4 scene paths, companion tones per foe, hero-card and companion bands for both floors ([scene.ts](../../packages/desk-crawler/src/art/scene.ts), [monsters.ts](../../packages/desk-crawler/src/art/monsters.ts), [sceneColour.ts](../../packages/desk-crawler/src/art/sceneColour.ts)). `tools/art/scenes.ts` renders eight sample scenes of the new floors; every one was looked at during the build, and the sprites were redrawn once for legibility at stage scale.
- Companion: a Field notes page under More (`/app/desk-crawler/field-notes`) with the painted sprite per monster, the floors' notes in their map colours and "?" slots for closed notes; the world map takes five floors from `heroes.mine`; the Career page's "What opens when" names every floor's level from the catalog; the help page gains a Floors section and reads floors, task pay and the floor list from the catalog; two achievement shelves. Fixtures harness: `notes=1` and `notes=new`.
- Achievement catalog version 7 appends eight monster families and two floor set pieces; the levels family's tier III and IV blurbs now name the floors they open (a copy change, no id or threshold moved).

## Gate

| Gate (from the [spec](../biomes.md)) | Result |
| --- | --- |
| v15 heroes below level 12 replay unchanged | Pass: a level-9 hero in the Cafeteria gives the same stories, item changes and hero state under v15 and v16 for 300 seeded ticks (`tests/sim/biomes.test.ts`); every reach date and knockout rate below level 12 is identical to the decimal in the 90-day run (below) |
| Both floors drop tier-3 gear and their own potion tiers | Pass: 400 seeded Archive ticks create only tier-3 templates at required level 8; potion finds follow the tier-4 weights (majors lead, minors rare) |
| The arrival count survives the adapter | Pass: a hero seeded travelling into the Archive arrives with `{ archive: 1 }` and still holds it after three more ticks; `heroes.mine` then reports the Archive note open (`tests/convex/biomes.test.ts`) |
| Knockouts on a new floor for managed cohorts at or under the Cafeteria's at its own unlock | Pass with the published numbers (below). The first draft of the monsters, about 40% stronger, failed it outright: daily managers were knocked out on 84% of their Archive days and 98% of Garage days, levelled to 20 instead of 32 and reached the +3 rung never. The numbers were then fitted to the Cafeteria's own round and damage ratios at each unlock level and the run repeated |
| No new per-tick reads, no template change, bounded reads unchanged | Pass: the lore view reads the hero document the companion already loads; the device template is untouched (the floor name and scene URL come from the payload as before); 29 of 32 inventory rows as under v14 |
| Phone layout | Pass at 390 and 320 wide in the fixtures harness: the Field notes page for a veteran (21 of 25 notes open) and a fresh hero, the five-floor world map and the Career page show no horizontal overflow and no console errors |

Typecheck across the workspace, the web build and the full suite (666 tests, 7 new) pass. While building, `heroes.mine` and `changeBiome` were moved from the code's active catalog to the world's pinned one, so the new floors neither show on the map nor accept travel before the production switch; under v15 the simulator would otherwise have met a biome it did not know.

## Pacing and knockouts per cohort (300 heroes, 90 days)

Reach dates below level 12 are unchanged from v15 to the decimal (daily: level 4 on day 2.5, 8 on 7.9, 12 on 12.9; three-day 2.8 / 9.1 / 15.7; seven-day 2.8 / 17 / 29.3). The new floors add the level-16 date and change what follows.

| Cohort | Level 16 (median / p90, days) | Level at day 90: v15 → v16 | Knockouts, % of hero-days: Archive / Garage | Cafeteria knockouts, its first days only | XP in the last week: v15 → v16 | Gold at day 30 / 60 / 90 (v16) | +3 in both slots (day): v15 → v16 |
| --- | --- | --- | --- | --- | --- | --- | --- |
| Daily | 17.7 / 18.9 | 32 → 46 | 1.7 / 0.1 | 9.2 (days 8 to 13) | 13,805 → 37,324 | 6,110 / 19,889 / 40,120 | 57.8 → 39.3 |
| Three-day | 21 / 22.9 | 32 → 45 | 0.6 / 0.0 | 6.8 | 13,667 → 36,942 | 5,526 / 16,508 / 37,399 | 63.1 → 42.9 |
| Seven-day | 37.4 / 42.6 | 25 → 35 | 0.4 / 0.2 | 4.6 | 8,272 → 22,009 | 1,996 / 7,372 / 13,351 | >90 → 70.9 |
| Undergeared three-day | 32 / 35.2 | 30 → 41 | 5.0 / 0.5 | 47.8 | 13,667 → 36,942 | 1,771 / 6,325 / 23,922 | 75.8 → 60.1 |
| Safe-farming three-day | never (level 14) | 14 → 14 | never leaves the Office | | 1,337 → 1,337 | unchanged | unchanged |
| Unattended | never (level 3) | 3 → 3 | | | 0 → 0 | unchanged | unchanged |

Reading it:

- **The floors are as safe as the Cafeteria was at its own unlock, and safer than it looks.** Under v15 the Cafeteria's 0.7% was averaged over eighty days on the floor, most of them far above level 8. Under v16 heroes leave it at level 12, so its column now shows only its first five days: 9.2% for a daily manager and 47.8% for the undergeared cohort, which is what a fresh unlock costs. The Archive at its own fresh unlock costs 1.7%, 0.6% and 0.4% for the three managed cohorts and 5.0% undergeared; the Garage, which heroes reach in better shape and stay on for seventy days, is near zero. Nothing is stuck: every managed hero finishes the ladder.
- **Older heroes move again.** A daily manager now gains 37,000 XP in its last week instead of 13,800 and stands at level 46 on day 90 instead of 32; the weekly manager at 35 instead of 25. That is the release's goal (the roadmap's "sustained progression for older heroes"); the ranking's recent-XP boards will show it, since a Garage hero out-earns a Cafeteria hero three to one, exactly as a Cafeteria hero out-earned an Office hero before.
- **Gold rises with it, and the +3 rung comes earlier.** The floors pay 10 to 13 and 13 to 16 gold a fight and 40 or 50 a task (the Cafeteria: 7 to 10 and 30), which the first fitted run had at 12 to 16 and 18 to 24 and 45 / 65 before being pulled back onto the existing per-tier curve. Even so a daily manager holds 40,000 gold at day 90 against 16,300 under v15, and both slots reach +3 on day 39 instead of 58. The workbench spend itself is unchanged (26,000 gold median). The roadmap's lever stands: bigger bags were to wait until heroes sit at +3 in both slots, which the harness now puts in the second month for daily and three-day managers.
- **Potions and to-do pay behave as designed.** Majors are the common find on both floors (1.7 found per hero-day against 1.2 healing and 0.2 minor for a daily manager) and the pouch ends with 59 majors; task gold stays at 11% to 13% of daily gold, inside the quests gate.
- **The two ladder rungs are reached on the day the +3 rung is**, because rungs are positional and these two sit after it: day 31.6 for daily managers, 36.2 three-day, 56.9 weekly. The Archive win itself happened weeks earlier; the ladder simply celebrates it late. That is the documented cost of append-only rungs, not a tuning target.
- **Achievement shares at day 30** for the new families are 100% at tiers I to III for every new monster in the daily cohort and 87 to 90% at tier IV for the Garage's (heroes live there from day 18), so the shared 1 / 5 / 25 / 100 / 500 ladder reads as it does on the Cafeteria floor; Office Census and Full Tour are now twenty-monster, five-floor set pieces.
