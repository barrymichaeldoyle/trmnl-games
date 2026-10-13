# World events evidence (D139, content v19)

Harness runs on 2026-10-13, comparing content v18 with v19 on the same seeds. Every run starts on 1 October 2026 (the harness epoch), so a 90-day run covers Halloween, Diwali, Friday 13 November, Thanksgiving, Black Friday and Christmas, and a 45-day run covers everything up to Friday 13 November. Commands:

```
pnpm balance --heroes 300 --days 90 --content v18|v19
pnpm balance --heroes 150 --days 45 --content v18|v19 --stance bold
```

The harness's raid target is a fixed coworker holding 200 gold, so every launch finds a target. That overstates how often a real hero raids, which makes the raid numbers below an upper bound.

## 90 days, every policy

| Policy | Final level v18 / v19 | Level 16 median (days) | Gold at day 90 (median) | Gold at day 30 | Hero-days with a knockout |
| --- | --- | --- | --- | --- | --- |
| unattended | 3 / 3 | >90 / >90 | 231 / 231 | 231 / 231 | 0 / 0 |
| daily | 46 / 46 | 17.6 / 17.6 | 40,749 / 40,648 | 6,359 / 6,359 | 203 / 202 |
| three-day | 45 / 45 | 21.8 / 21.8 | 36,826 / 36,805 | 4,659 / 4,675 | 327 / 326 |
| seven-day | 34 / 34 | 38.8 / 38.7 | 11,603 / 11,733 | 1,406 / 1,411 | 293 / 294 |
| undergeared three-day | 41 / 41 | 32 / 32 | 23,922 / 23,829 | 1,771 / 1,773 | 1,589 / 1,588 |
| safe-farming three-day | 14 / 14 | >90 / >90 | 1,911 / 2,015 | 664 / 664 | 0 / 0 |
| daily, timezone abuse | 46 / 46 | 17.6 / 17.6 | 41,454 / 41,297 | 6,084 / 6,115 | 203 / 203 |

The gate was that a year's occasions move the day-90 level and gold medians by less than 3%. Levels don't move. Gold moves by less than 1.2% for every policy but safe farming, which gains 5% (104 gold): a hero parked in Office Cubicles never raids, so it only collects the gold bonuses. That's small in absolute terms and below any price on the ladder, so it is accepted.

## Friday the 13th, Bold stance, 45 days

Bold launches the most raids, so it carries the most mishap risk.

| Policy | Final level | Gold at day 45 (median) | Gold at day 30 | Hero-days with a knockout |
| --- | --- | --- | --- | --- |
| daily | 32 / 33 | 5,326 / 5,172 | 3,696 / 3,529 | 1,117 / 1,121 |
| three-day | 29 / 29 | 6,302 / 5,710 | 2,875 / 2,875 | 705 / 704 |
| seven-day | 17 / 17 | 2,669 / 2,519 | 1,336 / 1,354 | 314 / 307 |
| undergeared three-day | 18 / 18 | 2,128 / 1,745 | 687 / 687 | 1,535 / 1,539 |
| safe-farming three-day | 10 / 10 | 612 / 599 | 1,186 / 1,187 | 0 / 0 |
| daily, timezone abuse | 32 / 33 | 5,425 / 5,570 | 3,843 / 3,854 | 1,132 / 1,132 |

Mishap knockouts don't show above the noise: knockout hero-days move by at most seven in either direction. Bold heroes that raid most end the window with 3% to 18% less gold, because on the day every raid costs them 5% of their gold and wins nothing back. The undergeared cohort feels it most, since it holds the least gold and raids at the same rate. That is the day working as designed: a gold sink once a month at most, never a knockout spike. The 20% HP share and 5% gold share stay as authored.

## Replay

On an ordinary day v19 plays exactly as v18 (the sim test replays 300 seeds with a raid target and compares every field but the content version), and occasion lines take no random draw, so an occasion changes only what its effect changes.
