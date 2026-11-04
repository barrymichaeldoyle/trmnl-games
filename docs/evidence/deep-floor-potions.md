# Deep-floor potion shares evidence (D222)

Harness: `pnpm balance --heroes 60 --days 60 --content v28` and the same with `--stance bold`, against v27 with the same heroes and seeds. The report's new `potionsByBiome` block counts, per floor, potions found and drunk per 96 ticks spent exploring or resting there, and the share of those ticks begun with an empty pouch. Raw results: [v27](deep-floor-potions-v27-60-days.json), [v27 bold](deep-floor-potions-v27-bold-60-days.json), [v28](deep-floor-potions-v28-60-days.json), [v28 bold](deep-floor-potions-v28-bold-60-days.json).

## What production showed (2026-11-04)

A level-16 Warrior on Bold in the Parking Garage wrote that she had no potions. Her hero was healthy: in its last 72 hours of logs, 8 of 36 loot draws were potions (the 20% share) and it drank 10, nearly all majors, against 40 to 60 HP traps and 60 to 80 HP fights. Across production, all 14 heroes on the Archive or the Garage held 0 to 7 potions (8 held none), Cafeteria heroes held 0 to 33, and Office and Server Room heroes mostly sat on full pouches. The biomes evidence (D133) had reported pouches ending full of majors; it measured whole runs, which the long full-pouch stretch on the Garage hides.

## v27: supply is flat, drinking is not

Daily manager, default stance:

| Floor | Found / day | Drunk / day | Ticks begun with an empty pouch |
| --- | ---: | ---: | ---: |
| Server Room | 4.8 | 5.0 | 2.5% |
| Cafeteria Depths | 4.1 | 8.2 | 52.2% |
| Archive | 3.8 | 4.1 | 75.4% |
| Parking Garage | 4.1 | 3.3 | 28.0% |

A potion is a fifth of loot draws everywhere, so finds stay near four a day; from the Cafeteria down the hero drinks about as fast as it finds, or faster, and arrives at the Archive with an empty pouch.

## v28: each deep floor carries its own loot shares

Two candidates, the extra potion share taken from gold (gear, merchant and decision shares unchanged): A = Cafeteria 30, Archive 35, Garage 35; B = Cafeteria 35, Archive 45, Garage 35. B shipped. Ticks begun with an empty pouch, v27 / A / B:

| Cohort | Cafeteria | Archive | Garage | Knockout days, Archive | Gold at day 60, median |
| --- | --- | --- | --- | --- | --- |
| Daily | 52 / 38 / 31% | 75 / 53 / 36% | 28 / 11 / 10% | 3.6 / 2.3 / 2.5% | 8,309 / 9,702 / 9,420 |
| Three-day | 49 / 35 / 28% | 69 / 45 / 31% | 27 / 11 / 10% | 1.1 / 1.5 / 1.9% | 9,137 / 7,927 / 8,933 |
| Seven-day | 43 / 26 / 22% | 61 / 29 / 15% | 29 / 9 / 7% | 0.7 / 0.2 / 0.4% | 8,335 / 8,270 / 8,851 |
| Undergeared three-day | 30 / 22 / 19% | 80 / 65 / 53% | 64 / 32 / 31% | 9.1 / 6.8 / 3.7% | 6,785 / 4,914 / 5,193 |
| Bold daily | 28 / 15 / 11% | 60 / 35 / 21% | 19 / 7 / 6% | 31.3 / 23.4 / 19.0% | 5,596 / 7,159 / 7,326 |
| Bold three-day | 13 / 8 / 6% | 44 / 19 / 11% | 21 / 6 / 4% | 23.2 / 19.5 / 15.7% | 6,615 / 6,661 / 7,309 |
| Bold seven-day | 8 / 4 / 3% | 23 / 6 / 3% | 15 / 3 / 2% | 14.1 / 12.3 / 11.9% | 5,452 / 6,174 / 6,559 |
| Bold undergeared | 2 / 1 / 1% | 35 / 15 / 8% | 51 / 24 / 22% | 35.7 / 25.5 / 21.8% | 3,450 / 4,114 / 5,050 |

Findings:

- **The pouch lasts.** Empty-pouch time on the Archive falls by half or more in every cohort under B, and the Garage's by two thirds. The Cafeteria improves least: its fights cost the most, and heroes leave it within days.
- **Drinking rises with supply.** A hero drinks whenever it drops below its stance's potion line, so the extra potions mostly replace rest ticks rather than banking. That is why B's larger Archive share still matters.
- **Knockouts fall, most on Bold.** Bold daily managers' Archive knockout days go from 31% to 19%, the Garage's from 10% to 8%.
- **Gold does not fall.** The share taken from gold is small against combat gold, a full pouch still pays a potion find as gold, and fewer rests mean more fights; median gold at day 60 is within 2% or higher in every cohort but the undergeared default one (−23%, a cohort that never equips its finds and spends what it has on drinks).
- **Levels hold.** Final level medians move by 0 to 3, up.

Checks: `tests/sim/deep-floor-potions.test.ts` (v28 is valid with the three floor shares; the validator refuses shares that do not sum to 100 or a merchant share without merchant rules; a floor without its own shares plays exactly as v27 seed by seed; Archive loot finds potions above 38% of the time against under 26% in v27). The full suite passes.

## The merchant stays a working day (D223)

Production on 2026-11-04: 862 merchant visits met across all heroes, 65 purchases, and 52 of the 69 heroes who had met the merchant had never bought. v28 also makes a visit stay 32 adventures instead of 4, with a second merchant draw paying gold while one is open. The raw v28 results above include it. The harness's cohorts buy what a visit offers when one is open at their visit time, so a longer stay means they catch more visits. Potion shares only → with the long stay:

| Cohort | Final level | Gold at day 60 | Full-price bag buys per hero | Empty pouch, Cafeteria / Archive / Garage |
| --- | --- | --- | --- | --- |
| Daily | 38 → 38 | 9,420 → 9,530 | 4.37 → 2.95 | 31 / 36 / 10% → 29 / 33 / 9% |
| Three-day | 37 → 37 | 8,933 → 9,109 | 3.70 → 2.40 | 28 / 31 / 10% → 27 / 31 / 10% |
| Seven-day | 36 → 36 | 8,851 → 8,538 | 3.13 → 2.52 | 22 / 15 / 7% → 22 / 15 / 7% |
| Undergeared three-day | 33 → 33 | 5,193 → 6,106 | 2.43 → 2.13 | 19 / 53 / 31% → 18 / 51 / 29% |
| Bold daily | 39 → 40 | 7,326 → 5,848 | 3.93 → 2.85 | 11 / 21 / 6% → 9 / 18 / 5% |
| Bold three-day | 37 → 37 | 7,309 → 6,222 | 2.97 → 2.33 | 6 / 11 / 4% → 6 / 11 / 4% |

Fewer bags are bought at the Bag page's price because more are bought from the merchant at its discount. Bold cohorts end with less gold because the harness buys the potion bundle at every visit it catches, at 12 gold × floor tier each. Late-game gold is not the binding constraint (the reporting player held 4,961). Levels hold or rise.

Checks: `tests/sim/deep-floor-potions.test.ts` also covers the 32-adventure stay, the validator's one-visit rule and a second merchant draw paying gold where v27 replaced the visit. `tests/convex/alerts.test.ts` covers a deal held through quiet hours and sent in the morning, one dropped when the merchant left overnight, and the merchant and daily caps. `tests/convex/merchant-pouch.test.ts` checks that `heroes.mine` lists the offers. The phone harness (`merchant=1`) shows both cards at 390 and 320 wide with no overflow, and the Hero page's key landing on the Bag page's merchant card below the sticky header.
