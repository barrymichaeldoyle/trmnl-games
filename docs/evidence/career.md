# Career ladder and feature unlocks: build evidence (P35, D128)

Date: 2026-10-12 · Simulation version 1 · Content v12 (built and deployed; the production world switches between runs, see [Switch](#switch)) · Harness: `pnpm balance --heroes 300 --days 30 --content v12` ([tools/balance/run.ts](../../tools/balance/run.ts)) · Local Node 24, pure simulator in memory, no database. Raw report: [balance-v12-career-30-days.json](balance-v12-career-30-days.json).

## What C1 built

- Content v12 = v11 plus `unlocks` (to-do list at level 2, stances 3, office decisions 5, the wandering merchant 6, desk raids 7) and `career`, nineteen rungs ([v12.ts](../../packages/desk-crawler/src/content/v12.ts)). The validator checks unlock levels against the rules the catalog has, rung ids, title and blurb lengths, gold, counters, bag and pouch targets as real tiers, biomes, and guarantee bounds and prerequisites.
- The pure core ([career.ts](../../packages/desk-crawler/src/sim/core/career.ts)) runs after the to-do list and draws nothing. It writes an `Unlocked:` line for each level crossed this tick, checks the current rung, pays its gold like a task, logs `Goal reached: … Next: …`, and moves the pointer one rung on. One rung pays per tick; a rung the hero has already done pays at the next evaluation, so the ladder is always reached in order. A hero without a place on the ladder joins at the first rung it had not satisfied when the tick began, with no pay and no lines.
- Gates in the simulator: below the unlock a hero takes no `quest` stream draw, plays balanced whatever its stored stance says, turns a merchant or decision loot draw into gold (the draw is still taken), and takes no raid launch draw. The raid pool adapter never picks a target below the level either.
- Guarantees: a rung's lucky event is forced once the hero has explored the bound since the rung was armed, by replacing the rolled encounter kind after every draw is taken. A guarantee arms only once its feature is unlocked, stands down once the event has happened by itself (a find waiting in the bag), fires once per rung, and the decision rung's re-arms because a decision expires unanswered.
- Invariants check a stored career state (rung within the ladder, known rung ids once each, an armed guarantee carrying its count). Output validation checks that to-do and career lines add gold only, that one rung pays per tick with the counter following, and that nothing career-shaped appears under a catalog without a ladder.

## Gate

| Gate (from the [spec](../objectives.md#work-slices)) | Result |
| --- | --- |
| v1 to v11 replay unchanged | Pass. For 300 seeded ticks of a level-8 bold hero, v12's story, item directives, deltas and hero state equal v11's apart from the career state, the rung gold and the career lines (`tests/sim/career.test.ts`). Unlocks and guarantees are new rules, so no earlier catalog takes a different draw |
| A daily manager finishes rung 15 inside 14 days | Pass: the Cafeteria win lands on day 8.5 and the whole ladder on day 12.9 (three-day managers 10.0 and 15.7) |
| Rung gold under 5% of 30-day income | Pass for players: daily 3.8%, three-day 4.4%, seven-day 9.6% (the ladder's 720 gold is most of what a weekly manager earns while it sleeps 46% of the month); unattended 4.0% of a tiny income |
| Every guarantee fires under its bound in a 300-hero run | Pass. Fire rates per hero (daily): first fight 0.18, first gear find 0.51 (the rest found one naturally within twelve adventures), first decision 1.19 (it re-arms), merchant 0.41, elite 0 (an elite arrives by itself within 96 Server Room fights every time) |
| No unlock line for a hero past the level at the switch | Pass by construction: a line is written only when the tick crosses the level (`tests/sim/career.test.ts`, "logs each unlock once") |
| Pacing unchanged | Pass. Level 2, 4, 8 and 12 dates match the v11 run within 0.1 days for every cohort (the stance delay to level 3 costs a bold hero nothing measurable); unattended first inventory sleep 2.0 days (v11: 2.1) |

## Per cohort (300 heroes, 30 days)

Median day each feature unlocks and each rung is reached (`>30` means fewer than half got there):

| Cohort | To-do L2 | Stances L3 | Decisions L5 | Merchant L6 | Raids L7 | Rungs reached (median) | Ladder done |
| --- | --- | --- | --- | --- | --- | --- | --- |
| Unattended | 0.3 | 1.0 | >30 | >30 | >30 | 1 (waiting to equip a find) | never |
| Daily | 0.3 | 1.0 | 3.6 | 4.7 | 6.1 | 19 | day 12.9 |
| Three-day | 0.3 | 1.0 | 4.5 | 5.5 | 7.2 | 19 | day 15.7 |
| Seven-day | 0.3 | 1.0 | 8.5 | 9.5 | 15.2 | 19 | 158 of 300 by day 30 (level 12 is the last rung) |

The seven-day manager's slowest step is "Answer an office decision": unlocked on day 8.5, answered on day 14.9, because a decision open for a day meets a weekly visit about two times in three, and the repeating guarantee makes sure one is waiting at most visits. The unattended hero reaches "Win your first fight" on day 0 and stops at "Equip a piece of gear you found", as the ladder intends: that rung is the first companion step, and the device shows it waiting.

## What the harness changed

1. **A guarantee fires once per rung.** The first build re-armed nothing and fired on every tick after the bound, so an unattended hero got a forced gear find every adventure and slept from day 0.3. Now a fired guarantee stands down for the rest of the rung, and a guarantee also stands down once its event has come by itself (counted at arming).
2. **The decision rung's guarantee repeats.** With one forced decision, a weekly manager answered on day 21.4 (unlocked 8.5). Re-arming after each forced decision (at most one per 48 adventures, never while one is pending) brings it to day 14.9.
3. **"Buy from the wandering merchant" became "Meet the wandering merchant".** The merchant stays four adventures; a daily visitor had a 7% chance per day of catching one open, so the buy was luck for anyone not watching the app. Meeting is passive (and the D114 merchant alert is the real buying prompt).
4. **The pointer walks one rung at a time.** The spec skipped rungs already satisfied when the pointer reached them; for an active player that silently dropped "Sell a piece of gear" and "Buy the Laptop Backpack" from the record. Now every rung is reached and celebrated in order, one per tick; only the join point skips what an existing hero had done.
5. **The harness visits do what a player does once:** equips and sales count, a stance is picked once unlocked, a pending decision is answered, a merchant offer is bought when affordable, and the next pouch is bought like the next bag. A stand-in raid target (balanced, 200 gold) lets launches happen at their natural rate, so the raid rung and everything after it can be measured; earlier evidence files were produced without raids in this harness.

## Not measured

Being raided (the pool belongs to `tools/balance/raids.ts`), and the live share of new heroes who open the companion for the equip rung, which the engagement report now counts.

## C2 backend

`heroes.mine` returns `career` (the current rung with its progress, every rung's state and the wall time it was reached) and `unlocks`; `heroes.setStance` refuses with `LOCKED` below the stance unlock of the world's catalog; `inventory.equip` counts `itemsEquipped`; the raid pool pick and the tick's launch plan both check `canRaid`, and the target's stance is its effective one; career lines are written after the to-do lines with the next sequence numbers; `admin:engagement` reports rungs reached, equips and where heroes stand. Tests: `tests/convex/career.test.ts` (five), plus the raid, to-do, intent and achievement suites. 614 tests pass.

## C3 companion and help

The Goal card sits under the game screen with the rung's title, blurb, gold, progress and whether it is done in the companion; the To-do card and the stance picker show as dashed locked cards with their level below it; the Career page under More lists every rung (reached with its date, done before the ladder, current, the next two previewed, the rest "?") and the unlock table; the Log's Milestones filter includes career lines; the help page gains a Career section and the unlock levels in the stance, raid and to-do sections. Captured through the fixtures harness (`career=1`, `career=new`, `career=done`) at 390 and 320 wide: no overflow, no console errors.

## C4 device (template v52)

A ladder glyph (`career`) marks goal and unlock lines; a goal line's bonus is its gold chip; the celebration badge reads the line's compact form ("Goal reached: Answer an office decision", "Unlocked: the wandering merchant"); narrow rows drop the "Next:" clause through the payload's count form. Preview states `careerGoal` (the longest goal line) and `careerUnlock`: 48 previews, 0 failures in the sweep. The template needs no upload: the screen endpoint returns the markup with every response.

## Switch

Deployed with the push to main. The production world switches from v11 to v12 between runs with `npx convex run world:setActiveContentVersion '{"contentVersion":"v12"}' --prod`; `ACTIVE_CONTENT` is v12 for new worlds. Production's one hero is past every unlock, so no unlock line is written for it and it joins the ladder at its first unfinished rung on its first v12 evaluation. Record the first v12 run here once it completes clean.
