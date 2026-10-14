# Dug-in elites evidence (D163)

Harness: `pnpm balance:standoffs --heroes 150 --days 90` ([tools/balance/standoffs.ts](../../tools/balance/standoffs.ts)), content v24 against v23, the same heroes and seeds, the three stances in turn. Raw results: [standoffs-v24-90-days.json](standoffs-v24-90-days.json). Eligible means at level 12 or above.

| Cohort | Standoffs per eligible hero-week | Won | Median fight ticks to a win | Median ticks to a win | Knockouts per hero-day at 12+ (v23 → v24) | Day-90 XP median | Gold earned median |
| --- | --- | --- | --- | --- | --- | --- | --- |
| Daily | 1.1 | 100% (1,804) | 3 | 3 | 0.020 → 0.018 (−8.6%) | +1.4% | +0.6% |
| Three-day | 1.1 | 100% (1,708) | 3 | 3 | 0.013 → 0.012 (−6.3%) | +1.8% | +1.1% |
| Seven-day | 0.7 | 100% (859) | 3 | 4 | 0.012 → 0.011 (−12.3%) | −1.0% | −0.9% |
| Unattended | never eligible (level 3 at day 90) | | | | | | |

Against the spec's gate (E1): about one standoff a week for daily and three-day players (1.1), at least half won (all), knockouts per hero-day up by less than 10% (down), XP and gold medians within 5% (under 2%). Final level medians are unchanged (46, 44→45, 33).

How the numbers got here, on 30 heroes a cohort over 60 days:

1. The spec's rule (600% HP, ×12 XP, ×8 gold, six rounds a tick): 1.1 a week, 94% won, but knockouts at level 12+ up 26–50%.
2. With the step back at the rest line: no knockouts in a standoff and 100% won, but daily gold up 5.3%.
3. 800% HP, ×10 XP, ×6 gold: every gate passes (the run above).

Every standoff is won because the hero now rests instead of fighting on at low health, and the six-hour clock is long against three fight ticks. The risk left is the ordinary one of the floor; the cost of a standoff is the time it holds the hero. The 90-day run predates the appended career rung (200 gold once), which does not move these figures.

Checks: `tests/sim/standoff.test.ts` (a hero below level 12 plays exactly as v23 seed by seed, about 12% of elites dig in, the fall pays once with a rare or epic find, knockout, step back, expiry, a catalog without the rule) and `tests/convex/standoffs.test.ts` (a fall through the real tick and a duplicate worker, a v23 world dropping it, Walk away, travel confirmation). Device: the 72 standoff previews (fresh at 100%, nearly beaten at 1%, waiting while resting; the longest eligible name) pass the sweep in every layout, device and orientation, and the Ruby Liquid cross-check matches.
