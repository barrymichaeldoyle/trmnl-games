# Meetings evidence (D141, content v20)

Built and checked on 2026-10-13. M1's harness (`tools/balance/meetings.ts`) runs a whole world of heroes tick by tick through the real simulator, with a synthetic pool (one row per hero, grouped by floor and moved on every pick), raids from the whole pool and meetings from the hero's floor, and a ledger for both. The baseline is the same world without meeting seeds. Heroes take the three stances in turn. Commands:

```
pnpm balance:meetings --heroes 300 --days 30 --policy three-day --json docs/evidence/balance-v20-meetings-three-day-30-days.json
pnpm balance:meetings --heroes 300 --days 30 --policy daily --json docs/evidence/balance-v20-meetings-daily-30-days.json
```

## Rate

The gate was 0.4 to 0.6 meetings per hero-day, counting both sides. At 5‰ per exploring tick with a 48-tick cooldown:

| Policy | Stance | Meetings per hero-day | Started per hero-day | No partner | Hero-days with a meeting |
| --- | --- | --- | --- | --- | --- |
| three-day | cautious | 0.462 | 0.225 | 44.3% | 43.2% |
| three-day | balanced | 0.441 | 0.232 | 44.4% | 41.4% |
| three-day | bold | 0.442 | 0.216 | 47.4% | 41.2% |
| daily | cautious | 0.459 | 0.223 | 43.5% | 42.7% |
| daily | balanced | 0.457 | 0.232 | 46.3% | 42.3% |
| daily | bold | 0.460 | 0.233 | 44.0% | 42.7% |

That's a meeting about every two days, the same for every stance. "No partner" counts launch draws whose picked row was unavailable (resting on another floor's cooldown, travelling, dead or met in the last twelve hours); the draw is spent and the tick plays its ordinary encounter. Every floor saw meetings, including the Parking Garage. The six kinds came up evenly (319 to 363 each in the three-day run). Partners applied their side a median of 0 to 1 ticks later (at most 10). Effects at the three-effect cap occurred on about 450 hero-ticks out of 864,000, and the cap's existing rule handled them.

## Progress

The gate was that meetings neither speed up nor slow down progress.

| Policy | Stance | Level 8 median (days) | Level 12 median (days) | Final level median | Final gold median |
| --- | --- | --- | --- | --- | --- |
| three-day | cautious | 9.9 / 9.7 | 17.2 / 17.2 | 20 / 20 | 4,645 / 4,522 |
| three-day | balanced | 9.2 / 9.1 | 16.3 / 16.1 | 21 / 21 | 4,763 / 5,154 |
| three-day | bold | 8.8 / 8.8 | 17.7 / 17.4 | 19 / 19 | 3,622 / 3,843 |
| daily | cautious | 8 / 8 | 13.7 / 13.7 | 23 / 23 | 6,293 / 6,402 |
| daily | balanced | 7.8 / 7.8 | 12.9 / 12.8 | 24 / 25 | 6,235 / 6,039 |
| daily | bold | 7.8 / 7.7 | 13.4 / 13.5 | 24 / 24 | 3,856 / 4,102 |

With meetings / without. Level milestones move by at most 0.3 days and the final level median by at most one. The day-30 gold medians move by 2% to 8% per 100-hero cohort, in both directions and with no pattern by stance or policy. That's the noise of a world where every meeting shifts which raids happen, and which heroes they land on, for the rest of the run. Meetings create no gold; the in-the-loop boon adds 10% gold for 8 adventures, about one day in 25.

## Tests

- `tests/sim/meetings.test.ts`: v19 replays unchanged with a meeting seed, a partner and a pending meeting; the starter launches exactly when `planMeeting` says so and only when no raid took the tick; nobody meets itself, below level 2 or on a tick that rests; the partner applies once, exploring or resting, behind any incoming raid, and not while away; a retired kind lands as the first kind; the level-2 unlock line; every compact line fits beside a 20-character name; the scene draws the coworker and its prop, and bad coworker paths don't parse.
- `tests/convex/meetings.test.ts`: v19 writes no ledger and no floors; heroes on one floor meet, each meeting applies once, counters agree with the ledger on both sides and the 48-tick cooldown holds; heroes on different floors never meet; a duplicate batch worker commits nothing twice; `meetings.recent` masks a renamed partner, as does the quest log; game deletion removes the hero's rows; retention keeps pending rows and removes applied ones after 30 days.

## Device and companion

The device template is unchanged at v53: meeting lines use the system glyph and the scene arrives through the image URL. `--inline-art` previews of the longest meeting line (89 code points with a 20-character name) with the Rogue coworker at the whiteboard pass the sweep on all 24 layouts and orientations ([results](meetings-device-results.json)). Review sheets for every prop with both classes, on an ordinary day and on Christmas and Halloween, come from `pnpm tsx tools/art/meetings.ts <outDir>`. The Log tab's Coworkers card was checked at 390px with `meetings=1` and `meetings=none` in the companion fixtures, with no horizontal overflow.
