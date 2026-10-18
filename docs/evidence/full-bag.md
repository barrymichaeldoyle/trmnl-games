# Full bag keeps going and the Bold goal retired (D189, D190), content v26

Measured 2026-10-18 with the deterministic harness, 150 heroes, 30 days, all eight cohorts, on content v25 (the live catalog) and v26.

```sh
pnpm balance --heroes 150 --days 30 --content v25 --json docs/evidence/balance-v25-baseline-30-days.json
pnpm balance --heroes 150 --days 30 --content v26 --json docs/evidence/balance-v26-full-bag-30-days.json
```

| Cohort | Asleep share: v25 → v26 | Level 8 median day | Level 12 median day | Level at day 30 | Cafeteria knockout days | Gold at day 30 |
| --- | --- | --- | --- | --- | --- | --- |
| Unattended | 93.4% → 0% | >30 → 18.5 | >30 → >30 | 3 → 9 | – | 226 → 2,825 |
| Daily | 0% → 0% | 7.8 → 7.9 | 12.7 → 12.8 | 24 → 24 | 9.0% → 9.6% | 5,331 → 5,131 |
| Three-day | 4.1% → 0% | 9.2 → 8.3 | 16.4 → 13.9 | 21 → 23 | 14.1% → 7.2% | 4,348 → 5,575 |
| Seven-day | 46.3% → 0% | 17.3 → 11.0 | >30 → 17.7 | 11 → 19 | 24.6% → 4.2% | 1,304 → 2,757 |
| Safe-farming three-day | 6.7% → 0% | 20.3 → 18.5 | >30 → >30 | 9 → 9 | – | 595 → 545 |

How to read it. The unattended hero is the player who installs and only watches the screen: under v25 it filled its bag on day 1.9 and the desk showed a bag QR for the rest of the month. Under v26 it keeps adventuring in the Office (it never travels, since travel needs a visit) and the screen keeps telling its story. Daily players never filled the bag, so nothing changes for them. The weekly player's D24 target (level 8 in days 8–14, missed at 16.8 since D61) is met.

## Where the knockouts came from (D190)

Cafeteria knockout days per cohort across content versions, 100 heroes, 30 days, same harness (absolute counts in brackets for three-day):

| Content | Daily | Three-day | Seven-day |
| --- | --- | --- | --- |
| v14 | 2.4% | 2.1% (40) | 5.4% |
| v16 | 8.9% | 5.7% (40) | 6.0% |
| v17 | 8.3% | 14.0% (148) | 24.1% |
| v25 | 9.0% | 14.1% | 24.6% |

v16's rise is the denominator: the same number of knockout days over fewer Cafeteria days, because heroes move on to the Archive at level 12. v17 adds real knockouts, and v17's only change is the two inserted goals; the jump stays when every cohort is pinned to Balanced (`--stance balanced`), so it is the Bold goal and not the stance choice. The harness switches back to the cohort's stance on the visit after the goal, which flatters real players who may never switch back.
