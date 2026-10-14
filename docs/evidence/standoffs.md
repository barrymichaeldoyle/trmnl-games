# Dug-in elites evidence (D163)

Harness: `pnpm balance:standoffs --heroes 150 --days 90` ([tools/balance/standoffs.ts](../../tools/balance/standoffs.ts)), content v24 against v23, the same heroes and seeds, the three stances in turn. Raw results: [standoffs-v24-90-days.json](standoffs-v24-90-days.json). Eligible means at level 12 or above. Final rule: 1000% HP, 180% attack, step back at half the stance's rest line, a 16-tick clock, ×12 XP, ×8 gold.

| Cohort | Standoffs per eligible hero-week | Won | Knocked out | Slipped away | Median fight ticks to a win | Knockouts per hero-day at 12+ (v23 → v24) | Day-90 XP median | Gold earned median |
| --- | --- | --- | --- | --- | --- | --- | --- | --- |
| Daily | 1.1 | 80.2% (1,437) | 143 | 211 | 3 | 0.020 → 0.031 | +0.1% | −0.9% |
| Three-day | 1.1 | 79.2% (1,312) | 127 | 218 | 3 | 0.013 → 0.025 | −0.8% | −1.5% |
| Seven-day | 0.7 | 60.5% (501) | 112 | 215 | 4 | 0.012 → 0.024 | −5.7% | −2.7% |
| Unattended | never eligible (level 3 at day 90) | | | | | | | |

Final level medians are unchanged (46, 44, 33). Against the spec's gate (E1): about one standoff a week for daily and three-day players (1.1), at least half won (about 80%), XP and gold within 5% except the seven-day cohort's XP. The spec's limit of a 10% rise in knockouts was set aside when Barry asked for real risk: knockouts at level 12+ now run at about 1.5–2 times the v23 rate, roughly one more knockout a month for an eligible hero.

How the numbers got here (30 heroes a cohort over 60 days unless noted):

1. The spec's rule (600% HP, ×12 XP, ×8 gold, six full rounds a tick): 94% won, knockouts at level 12+ up 26–50%.
2. Stepping back at the rest line, 800% HP, ×10 XP, ×6 gold (the first build): every standoff won, knockouts down. No risk.
3. A harder hitter alone (130–200% attack) with a shorter clock: more slip away but almost no knockouts, since the hero steps back sooner and rests longer.
4. Stepping back at a share of the rest line: at 50% with 180% attack and a 16-tick clock, about three in four won with real knockouts. At 90 days heroes outgrow the floors and win more, so HP went from 800% to 1000% (90 heroes, 90 days: 79% won) and the rewards back to the spec's ×12 and ×8.

Checks: `tests/sim/standoff.test.ts` (a hero below level 12 plays exactly as v23 seed by seed, about 12% of elites dig in, the fall pays once with a rare or epic find, knockout, step back, expiry, a catalog without the rule) and `tests/convex/standoffs.test.ts` (a fall through the real tick and a duplicate worker, a v23 world dropping it, Walk away, travel confirmation). Device: the 72 standoff previews (fresh at 100%, nearly beaten at 1%, waiting while resting; the longest eligible name) pass the sweep in every layout, device and orientation, and the Ruby Liquid cross-check matches; the retune changed no template.
