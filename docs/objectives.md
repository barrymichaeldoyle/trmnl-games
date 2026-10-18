# The career ladder: one main objective and feature unlocks (P35)

Proposed 2026-10-12 and approved the same day as D128, when Barry asked for whatever is best for the project's long-term goals; the four open points at the end were settled as recommended and the ladder was built in slices C1 to C5 the same day ([evidence](evidence/career.md)). [Changes while building](#changes-while-building) lists where the build differs from this spec. Barry asked for a single long-term objective that gives players a sense of progression, teaches the game through the companion, and makes the opening more predictable for new heroes; then added that features such as the to-do list could unlock as the hero progresses, with the next objective being to use the new feature. This spec settles the shape and names the open points at the end. It would be a v1.1-style minor release: additive schema, a new content version, old payloads and templates keep their meaning.

Companions: the [to-do list](quests.md) (D112, the daily horizon), [achievements](achievements.md) (D65, the record), and the [roadmap](roadmap.md), whose v2.0 systems extend the ladder later.

## The problem it solves

The game has two horizons and a gap between them. The to-do list covers the next 4 to 16 hours. Achievements cover weeks, but they are records: retroactive, never a list, and they point nowhere. Nothing tells a new player what the next step is, or why the companion matters. Every system is also switched on from the first tick: a brand-new hero has stances, a to-do list, merchant visits, narrative choices and raids all at once, which is a lot to take in on a screen that shows one story at a time, and it leaves nothing to look forward to.

## The idea in one paragraph

Every hero has one **current objective**, the next rung of an authored career ladder: "Equip a piece of gear you found", "Finish three to-do tasks", "Reach the Server Room", "Buy the Satchel". Rungs alternate between things the hero does on its own and things the player does in the companion. Reaching a rung pays a small gold bonus, shows a celebration on the device and moves the hero to the next rung. Game features unlock at **level milestones**, never behind a companion action, and the rung after an unlock is the one that uses it ("Pick a stance"), so the player meets each system once, when it arrives, with a reason to open the companion. For the few rungs that depend on a lucky event (the first gear find, the first merchant, the first elite), the catalog **guarantees the event within a bounded number of adventures**, which is the predictable opening Barry asked for without a game-wide randomness dial. Nothing expires, nothing is lost, and a hero that never visits the companion keeps adventuring and keeps unlocking features by level.

## What a player sees

- **Companion:** one line at the top of the hero page, under the HUD: "Goal: Equip a piece of gear you found", with a short office blurb and the gold bonus, plus a progress figure where the rung counts something ("2 of 3 tasks"). Tapping it opens Records → Career, which lists the rungs reached (with dates), the current one, and the next two as a preview. Later rungs show as "?" like unearned achievements. Locked features appear in their usual place as a quiet locked card: the To-do card reads "Unlocks at level 2", the Stance picker "Unlocks at level 3", and so on. Nothing locked is hidden, so the player can see what is coming.
- **Device:** a reached rung is a log line, "Goal reached: Equip a find. Next: Reach level 2.", and takes the D44 celebration badge ("Goal reached: Equip a find") until the next adventure, exactly as an achievement does. A feature unlock is its own log line, "Unlocked: the to-do list. Stand-up tomorrow at 07:00.", with the same badge. The device never shows a standing goal, progress bar or locked list. Compact layouts drop the "Next:" clause.
- **Help page:** a Career section explains that the goal is one at a time, never fails, and that features arrive by level. Each feature's existing help section gains its unlock level in one sentence.
- **Achievements:** no new family in this release ([deliberate limits](#deliberate-limits)).

## Rules

### Feature unlocks

Unlocks are **level milestones** in the catalog, under a new `unlocks` rule. They gate the simulator's draws and the companion's controls for that hero. A hero below the level behaves exactly as under a catalog without the rule: no `quest` stream draw, no merchant or choice outcome on a loot draw (the loot draw falls through to gold, as a second pending choice does today), no raid launch draw, and balanced sustain thresholds.

| Feature | Unlocks at | Weekly manager reaches it (v11 harness, median) | Why here |
| --- | --- | --- | --- |
| Adventures, bag, equip, sell, manual potions, the Tote Bag on the sixth adventure, keepsakes | start | day 0 | The core loop and the D122 onboarding win. Keepsakes are the playlist incentive and stay on from the first screen |
| To-do list | level 2 | day 1 | The first thing to look forward to, and the first system that needs no companion |
| Stances | level 3, level 7 from v15 (D132) | day 2 | The first real choice, once the player has seen a rest and a potion. Moved to level 7 by D132: in Office Cubicles Bold has no knockout risk, so the choice first matters with raids and the Cafeteria |
| Server Room | level 4 | day 3 to 4 | Unchanged (D24) |
| Salvage, the workbench and potion combining | level 4, from v23 (D155) | day 7 | Open from the start in v13 to v22, but the first workbench step (Mk II) needs level 4, so a new player got materials it could not spend. They open together at the level Mk II gear needs, and the salvage goal follows at once |
| Narrative choices | level 5 | day 5 | Needs a hero that already opens the companion for travel |
| Wandering merchant | level 6 | day 7 | By now the hero has 100 to 300 gold, so a 25% off bag offer means something; also the Lunchbox level under v4 |
| Desk raids | level 7 | day 9 | Raiding and being raided wait until the hero has gold worth moving and a stance to set its odds; a starter cannot lose 30% of its HP to a veteran on day one |
| Cafeteria Depths | level 8 | day 12 to 17 | Unchanged |

The days are the seven-day cohort's medians from the D123 evidence; daily managers reach level 8 in about seven days and go through the ladder twice as fast. The harness reports the day each cohort unlocks each feature, so the table is measured before it is published on the help page.

Unlocks are predicates over hero state, so they are retroactive by construction: a hero already past a level keeps every feature it has today the moment the content version switches, with no migration and no unlock lines for things it already had (an unlock logs only when the hero crosses the level under the new catalog). Production currently has one hero and it is past every gate.

**Raids need both sides unlocked.** The target filter in `planRaid`'s adapter adds "level at or above the raid unlock", one more field on the `raidPool` row (`level`, patched on level-up by the tick that already writes the hero). A below-level hero is never picked and never draws the launch roll, so it neither raids nor gets raided. The pool read stays one bounded indexed read; a filtered-out row costs a spent draw and "nobody was at that desk", like a sleeping target today.

**Stances below the unlock:** the stance intent is refused with a new `LOCKED` refusal naming the level, and a stance stored from before the switch (impossible for a sub-level-3 hero in production today, but the rule is stated) is read as balanced until the unlock, then takes effect unchanged.

### The ladder

The ladder is an ordered list of rungs in the catalog, under a new `career` rule. Each rung is a predicate over the same bounded state achievements use (lifetime counters, level, bag capacity, pouch tier), a title, a blurb, a gold bonus, and optionally a guarantee (below). Rungs are append-only and content-versioned like achievement ids. The launch ladder:

| # | Objective | Predicate | Companion? | Gold | Guarantee |
| --- | --- | --- | --- | --- | --- |
| 1 | Win your first fight | `combatWins ≥ 1` | no | 10 | first combat within 4 adventures |
| 2 | Equip a piece of gear you found | `itemsEquipped ≥ 1` (new counter) | Bag page | 15 | first gear find within 12 adventures |
| 3 | Reach level 2 | `level ≥ 2` | no | 15 | |
| 4 | Finish three to-do tasks | `tasksCompleted ≥ 3` | no, Swap optional | 20 | |
| 5 | Sell a piece of gear | `itemsSold ≥ 1` | Bag page | 20 | |
| 6 | Pick a stance | `stanceChanges ≥ 1` | Hero page | 20 | Retired in v15 (D132) |
| 7 | Reach level 4 | `level ≥ 4` | no | 25 | |
| 7a | Salvage a piece of gear | `itemsSalvaged ≥ 1` | Bag page | 60 | Moved here from after rung 19 in v23 (D155), as the goal after the workbench unlock |
| 8 | Travel to the Server Room | `trips ≥ 1` | Hero page | 25 | |
| 9 | Buy the Satchel | `bagCapacity ≥ 15` | Bag page | 30 | |
| 10 | Answer an office decision | `choicesMade ≥ 1` | Hero page | 30 | first choice within 48 adventures of level 5 |
| 11 | Buy the Lunchbox | `potionCap ≥ 30` | Bag page | 30 | |
| 12 | Buy from the merchant | `purchases ≥ 1` | Hero page | 40 | first merchant visit within 48 adventures of level 6 |
| 13 | Beat an elite | `eliteWins ≥ 1` | no | 40 | first elite within 96 adventures of level 7, outside the Office |
| 13a | Reach level 7 | `level ≥ 7` | no | 40 | Added in v17 (D135) |
| 13b | Switch to Bold | stance played is Bold | Hero page | 20 | Added in v17 (D135); no gold for a hero that reached "Pick a stance". Retired in v26 (D190): it sent heroes into the Cafeteria on Bold |
| 14 | Take part in a raid | any of `raidsLaunched`, `raidsWon`, `raidsRepelled`, `raidsLost` ≥ 1 | no | 40 | |
| 15 | Reach the Cafeteria Depths | `level ≥ 8` and `trips ≥ 2` | Hero page | 50 | |
| 16 | Finish 25 to-do tasks | `tasksCompleted ≥ 25` | no | 50 | |
| 17 | Find a rare | `rareFinds ≥ 1` | no | 60 | none: luck stays luck |
| 18 | Buy the Rolling Suitcase | `bagCapacity ≥ 20` | Bag page | 100 | |
| 19 | Reach level 12 | `level ≥ 12` | no | 100 | |
| 20–24 | Salvage (moved to 7a in v23), Upgrade, Reinforce to +3, Win in the Archive, Win in the Parking Garage | see v13 and v16 | Bag page / Hero page | 60–150 | Appended in v13 (D129) and v16 (D133). The upgrade goal stays here: a level-4 hero needs about five more days of gold and Scrap for Mk II, and a goal that waits that long holds up every goal behind it (D155) |
| 25 | Buy the Gym Duffel | `bagCapacity ≥ 24` | Bag page | 150 | Appended in v22 (D146); rung 18's blurb no longer calls the Rolling Suitcase the biggest bag |

Eight of nineteen rungs need the companion, and each is a thing the player would do anyway; none asks for a visit for its own sake. Companion rungs alternate with passive ones so a device-only player always has a visible goal and reaches it on their own about half the time, then sees the companion rung sit until they visit. That is the one soft nudge in the design, and it costs nothing: the hero keeps earning, unlocking and finishing tasks regardless.

After rung 19 the goal line reads "Goal: level 13" and keeps counting levels with no gold, until v2.0 appends rungs for salvage, upgrades and bigger bags under its own content version.

**Evaluation.** At the end of every evaluation that could change the hero (any status, since equip and sell happen outside ticks and are checked at the next tick), the pure core checks the current rung. If it holds, the rung's gold is applied through the ordinary apply path, `careerRungs` increments, the goal line is logged as the tick's extra log entry after the encounter and any to-do line, and the pointer moves to the next rung whose predicate fails (several may already hold; only the one that was current pays). A rung reached by a companion intent pays at the next evaluation, not inside the intent, so rewards flow through one path and the device learns of it in order.

**Backfill.** The first evaluation under the new catalog sets the pointer to the first rung whose predicate fails, pays nothing, and logs nothing. Existing heroes start the ladder where they stand. A hero that never satisfied an old rung (sold nothing) gets it as its current goal even if it is far past it in level: the ladder is a checklist, not a timeline, and a level-10 hero being told to sell a piece of gear is right.

### Guarantees (the predictable opening)

A guarantee is a bounded pity rule attached to a rung: `{ event, withinExploringTicks, from?: level, biomes?: 'notOffice' }`. While that rung is current and the hero has explored `withinExploringTicks` ticks since the rung started (or since the `from` level, whichever is later) without the event, the next exploring tick that rolls an encounter **replaces the rolled outcome's kind** with the guaranteed one: a combat for rung 1, a gear loot for rung 2, a choice for rung 10, a merchant visit for rung 12, an elite combat for rung 13. The draws are still taken in their usual positions and order, so the streams stay aligned and no other outcome in the tick or after it moves; only the encounter kind (and the elite flag) is overridden. The override obeys every other rule (a full bag still holds the find and sleeps; a pending choice still falls through). The rule is in the pure core, a function of hero state and tick, and the harness reports how often each guarantee fires per cohort. Expected: rung 1 fires for about 24% of heroes (the Office's 30% combat weight over four draws), rung 2 for about half (a gear find is about 5% of ticks), and the three later ones rarely, because 48 to 96 adventures is more than their natural expectation.

This is the whole of "more deterministic for new players". There is no randomness dial and nothing to turn back; guarantees fade because later rungs are about accumulation (levels, 25 tasks, the bag ladder), where there is nothing to force. The one luck rung, the rare find, stays unguaranteed so lucky moments keep their meaning (D35).

### Determinism and versions

Everything exists only under a catalog with `unlocks` and `career` rules, content v12. v11 and earlier replay unchanged seed by seed: unlocks change which draws are taken, guarantees change outcome kinds, and both are new rules. Simulation version stays 1. No new RNG stream.

## Data

Hero: one optional field and one counter.

```
career?: { rung: number; startedTick: number; startedTicksExplored: number; reachedAt: number[] }   // reachedAt: tick per rung, bounded by the ladder length
counters.careerRungs, counters.itemsEquipped                                                      // itemsEquipped written by the equip intent
```

`raidPool.level` on the pool row. No new table. Reads per tick are unchanged; writes go into the patch the tick already makes. The payload adds nothing: goal and unlock lines ride the existing `log` with a new `career` outcome variant, and the celebration reads it like an achievement log.

## Deliberate limits

- One objective at a time, never two, never a choice of objective.
- No XP. The boards stay about adventuring (D112's reason), and a reward only companion visitors collect must not move ranks. Gold bonuses total about 720 across the ladder, under a week of a mid-game hero's income, so nobody buys a bag off the ladder alone.
- No expiry, no streak, no "come back", no alert for a reached rung or an unlock. The two D114 alert kinds stay the only two.
- No unlock behind a companion action. Features arrive by level so a device-only player gets the whole game.
- No guarantee for anything with a ranking weight beyond its own rung: no guaranteed rare, epic, jackpot or raid win.
- No new achievement family. The ladder is finite and its record lives under Career; a family would be a second copy of it.
- Keepsakes and alerts are account features, not hero features, and are not gated.
- Idle Angler gets the same shape later, with its logbook titles as the natural rewards and waters as the natural unlocks; not in this release.

## Work slices

| Slice | Scope | Done when |
| --- | --- | --- |
| C1 Rules and harness | `unlocks` and `career` rules and validator, gated draws, guarantees, rung evaluation, backfill, the two log variants (compact and full), `itemsEquipped` and `careerRungs`. Harness reports per cohort: day each feature unlocks, day each rung is reached, guarantee fire rates, gold from rungs as a share of income, and the share of heroes stuck on a companion rung at day 30 | v1 to v11 replay unchanged; a daily manager finishes rung 15 inside 14 days; rung gold is under 5% of 30-day income; every guarantee fires under its bound in a 300-hero run; no unlock line for a hero past the level at the switch |
| C2 Backend | Hero field and counters, `raidPool.level` and the target filter, `LOCKED` refusal for stance below level 3, equip intent writes `itemsEquipped`, hero query returns the career state | Below-level heroes are never picked as targets (test); duplicate equip receipts count once; no extra reads per tick |
| C3 Companion and help | Goal line on the hero page, Records → Career, locked cards for to-do, stance, choices and merchant with their levels, help section and per-feature unlock sentences, analytics `goal reached` (rung id only) | Phone previews pass at 390 wide; a locked card never shows a control |
| C4 Device | Goal and unlock log lines and celebration text fit all four layouts and the X mashups, template bump, preview sweep | The longest goal line with its "Next:" clause renders without clipping in every full layout; compact layouts drop the clause |
| C5 Switch | Content v12 live under the post-launch preservation rule, evidence page, decisions row | First v12 run completes clean with nothing quarantined; the production hero's goal pointer lands on the right rung |

## Changes while building

1. **A guarantee fires once per rung**, and stands down once its event has come by itself. Fired on every tick after the bound, the gear guarantee filled an unattended hero's bag by day 0.3.
2. **The decision rung's guarantee repeats** (at most one forced decision per 48 adventures, never while one is pending), because a decision expires unanswered and a weekly manager otherwise waited two weeks on that rung.
3. **Rung 12 is "Meet the wandering merchant"** (`merchantVisits ≥ 1`), not a purchase. A merchant stays four adventures, so buying from one is luck for anyone not watching the app; the D114 alert is the buying prompt.
4. **Every rung is reached in order, one per tick.** A rung already satisfied when the pointer arrives pays at the next evaluation instead of being skipped, so an active player keeps "Sell a piece of gear" in the record. Only the join point skips what an existing hero had done.
5. **The raid pool needs no `level` field**: the pick already reads the target hero live, so the level check happens there.
6. **No analytics event**: a goal is reached inside a tick, not by a companion action, so the engagement report counts rungs instead.
7. Rung 9 names the Laptop Backpack (13 slots), the first shop rung under the D122 ladder; the spec's "Satchel" was a placeholder.
8. **The gold waits for a Claim button (D130).** Barry asked for a claim step with confetti. The pointer still moves on its own (a gate would stall device-only players at every rung); the rung's gold sits in `career.unclaimed` until `heroes.claimGoal` pays it, and the Goal card shows each waiting reward with Claim and a confetti burst before the next goal. All gold sinks are companion actions, so nothing is lost by a player who never claims.

9. **Stances move to level 7 and "Pick a stance" is retired (D132, content v15).** At level 3 the hero is still in Office Cubicles, where Bold has no knockout risk, so the choice taught nothing. Rungs are never reordered, so the rung keeps its id and place, carries `retired`, and the ladder walks past it without pay or a line; the Career page hides it unless the hero reached it. The raid goal's blurb names the stance instead.

10. **"Reach level 7" and "Switch to Bold" sit right before the raid goal (D135, content v17).** Raids open at level 7, but the raid goal followed "Beat an elite", so a hero below 7 waited on it with no progress shown and no reason given. The level goal shows the way there; the Bold goal follows because Bold launches twice as many raids as Balanced (20 against 10 per thousand exploring adventures). It is a new rung (`go_bold`, predicate kind `stance`, read from the stance the hero plays by, so a Bold choice stored below level 7 does not count), not the retired `pick_stance` brought back, because a retired id keeps its place and meaning for the heroes who reached it. Its `supersedes: 'pick_stance'` field means a hero paid for "Pick a stance" reaches it with no gold. Switching back after the goal is fine. The visible ladder grows from 23 to 25. Pointers are stored indices, so this is the first insertion mid-ladder: `world:setActiveContentVersion` now remaps every hero's pointer by rung id in the same transaction as the switch (`remapRung`). A hero before the insertion meets both goals in turn. A hero waiting on the raid goal lands on the first new goal it has not met (a level-6 hero on "Reach level 7", a level-9 Balanced hero on "Switch to Bold") and keeps the raid goal if it has met both; what it already meets is skipped unpaid, and the Career page shows it as done, like rungs that held when the ladder arrived. A hero past the raid goal skips both. When the rung under a pointer changes, its guarantee state goes with it, even at the same index. The switch back to v16 is the same remap in reverse: a hero on either new goal lands on the raid goal.

11. **"Reach level 5", "Reach level 6", "Reach level 8" and "Reach level 16" sit immediately before the goal each one unlocks (D178, content v25).** Office decisions open at 5, the wandering merchant at 6, the Cafeteria Depths at 8 and the Parking Garage at 16, and each of those goals could be current while the hero was still short of the level, with no progress shown. The new rungs pay 30, 40, 50 and 150 gold. The Lunchbox is not one of them: it can be bought one tier before its level-6 milestone. Elites are already possible in the Server Room, and the Archive and dug-in elites already follow "Reach level 12". The switch remaps pointers by rung id, as in D135: a hero waiting on a locked goal lands on the level goal when it has not reached that level, and a hero already past it skips the new rung unpaid.

12. **"Switch to Bold" is retired (D190, content v26).** The harness traced a three-to-four-fold rise in Cafeteria knockouts for players who visit every few days to v17, whose only change was this goal and "Reach level 7": the goal lands one level before the Cafeteria opens, and the hero stays Bold into it. The rung keeps its index as retired, so heroes who reached it keep it and a pointer on it moves to the raid goal without gold ([evidence](evidence/full-bag.md)).

## Open points for Barry (settled 2026-10-12)

All four settled as recommended when Barry handed over the decision: level gates, the raid gate protecting new heroes, no backfill line, and the proposed bounds (the decision guarantee now repeats, above).

1. **Gate by level or by adventures?** Level is what the player sees and what the ladder celebrates, so it is proposed. Adventures explored would make unlock days identical for every cohort. Level is the recommendation.
2. **The raid gate at level 7** also protects new heroes from being raided. That is a change to D110's "any active hero" and shrinks the pool for a few days per hero; the harness checks that the times-targeted spread stays near p10 14 / p90 27.
3. **Should existing players see a backfill summary?** Proposed no: an existing hero quietly starts at its first unfinished rung. The alternative, a one-off "You've already reached 11 goals" line, is cheap if wanted.
4. **Guarantee bounds** (4 / 12 / 48 / 48 / 96 adventures) are starting points for the harness. Tighter bounds make the opening more scripted; looser ones make it more honest. The proposal leans honest.
