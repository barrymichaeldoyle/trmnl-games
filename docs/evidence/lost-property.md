# Lost property evidence (D145, content v21)

Built 2026-10-13. [Spec](../lost-property.md). Live since run 902 (16:15 UTC on 2026-10-13), the first on v21, which completed clean with nothing quarantined.

## Replay and rules

- `tests/sim/lost-property.test.ts`: v20 replays unchanged, seed by seed, with a graveyard seed, a lying spare and a found notice in the input. A spare replaces only a loot gear find whose look hit. Every other number on the tick is the same as without it (the only exception is a rare spare counting as a rare find). Career guarantees and gifts stay fresh. A knockout drops a spare of one equipped item, and both slots drop over enough knockouts. Nothing drops with no gear on, in the Office, or while a found notice waits. The notice lands as the tick's whole event after a raid or a meeting. The look rate is about 10%.
- `tests/convex/lost-property.test.ts`: nothing is read under v20. A finder takes the spare with the owner's name, account and name version on the item. The owner is told once and the row is deleted. A spare from the same account is never found. A replayed batch commits nothing twice. A knockout inserts the row, replaces a lying one and leaves a found one alone. The bag, the Log card and the public page show held spares, and a renamed owner shows as "Hidden player". Game deletion removes the owner's row and clears its name from the finder's item, which stays.
- `tests/sim/achievements.test.ts`: Lost and found earns at 1, 10 and 25 spares found.

## Progress

`pnpm balance:lost-property --heroes 300 --days 30 --policy <policy>` runs a whole world with raids, meetings and the lost-property table, against the same world without graveyard seeds. A third run uses no spares and a reshuffled raid pool, which shows how much the medians move from pairings alone (JSON: [daily](balance-v21-lost-property-daily-30-days.json), [three-day](balance-v21-lost-property-three-day-30-days.json), [seven-day](balance-v21-lost-property-seven-day-30-days.json)).

| Policy | Stance | Knockouts / hero-day | Spares found / hero-day | Share of loot gear finds | Level 8 (baseline) | Day-30 level (baseline) | Gold earned (baseline, reshuffled) | Day-30 gold (baseline, reshuffled) |
| --- | --- | --- | --- | --- | --- | --- | --- | --- |
| Daily | Cautious | 0.005 | 0.091 | 2.9% | 8.0d (8.0d) | 23 (23) | 20,726 (20,600; 20,647) | 6,033 (6,293; 6,758) |
| Daily | Balanced | 0.032 | 0.107 | 3.3% | 7.8d (7.8d) | 24 (24) | 21,758 (22,006; 21,740) | 6,099 (6,235; 5,929) |
| Daily | Bold | 0.259 | 0.080 | 2.4% | 7.8d (7.8d) | 24 (24) | 19,904 (19,656; 19,697) | 3,818 (3,856; 3,580) |
| Three-day | Cautious | 0.030 | 0.069 | 2.2% | 9.9d (9.9d) | 20 (20) | 16,959 (17,037; 17,165) | 4,331 (4,645; 4,700) |
| Three-day | Balanced | 0.043 | 0.073 | 2.2% | 9.2d (9.2d) | 22 (21) | 17,828 (17,614; 17,817) | 4,826 (4,763; 4,887) |
| Three-day | Bold | 0.130 | 0.048 | 1.4% | 8.8d (8.8d) | 19 (19) | 13,783 (14,054; 14,242) | 3,228 (3,622; 3,596) |
| Seven-day | Cautious | 0.025 | 0.028 | 1.4% | 18.3d (18.3d) | 11 (11) | 5,774 (5,756; 5,769) | 1,473 (1,505; 1,411) |
| Seven-day | Balanced | 0.027 | 0.030 | 1.5% | 16.8d (16.8d) | 11 (11) | 5,967 (5,986; 5,845) | 1,517 (1,428; 1,443) |
| Seven-day | Bold | 0.038 | 0.018 | 0.9% | 17.0d (17.0d) | 11 (11) | 5,637 (5,694; 5,827) | 1,472 (1,377; 1,430) |

- **Levels:** the gate held. Level 8 and level 12 dates match the baseline in every cohort, and day-30 levels differ by at most one.
- **Gold earned:** within 2% everywhere, inside the reshuffled pool's own spread.
- **Day-30 gold:** the spec's "under 1%" gate is not met, and it can't be measured that finely. Final gold moves several percent either way from pairings alone. With the three-day policy over four pool seeds, the 12 cohort comparisons ranged from −11% to +9% (mean −3.5%), while gold earned stayed within ±2%. That fits heroes spending a little more on gear they now hold: a spare is often rarer than the floor's usual find, and visits upgrade what is equipped. Gold has no shortage to protect, so this is recorded rather than tuned.
- **How common:** spares are 1–3% of loot gear finds, more than the spec guessed. Bold heroes on the deep floors are knocked out often, and every knockout drops one.

## Supply and timing

| Policy | Dropped | Found | Owners told | Replaced unfound | Lying at day 30 | Lying ticks (median / p90) | Notice wait ticks (median / p90) |
| --- | --- | --- | --- | --- | --- | --- | --- |
| Daily | 885 | 833 | 832 | 51 | 1 | 3 / 60 | 6 / 9 |
| Three-day | 608 | 569 | 567 | 35 | 4 | 27 / 339 | 1 / 8 |
| Seven-day | 268 | 227 | 227 | 9 | 32 | 97 / 665 | 1 / 14 |

In this 300-hero world a spare is usually found within hours, and almost always within a week. Drops come from the Cafeteria Depths, Archive and Parking Garage; the Server Room rarely knocks anyone out.

## Device and scene

- `pnpm tsx tools/trmnl/preview.ts --portrait --inline-art`, then `pnpm sweep:trmnl docs/evidence/lost-property-device-results.json --filter lostProperty`: 48 previews, 0 failures ([results](lost-property-device-results.json)). The scenarios are the longest finder line and the longest notice, each with a 20-character name, on every layout, device and orientation.
- `pnpm tsx tools/art/lostProperty.ts <dir>` renders the review sheets. The finder's scene shows the lost-property box (a spare's hilt sticking out, a name label on the front). The owner's scene shows the finder beside the box, on ordinary days and on hat-wearing occasions. Both are new segments under scene version 5, so cached scenes don't change.
- The device draws the notice with the system glyph, so the template stays at its current version and needs no ZIP upload.
