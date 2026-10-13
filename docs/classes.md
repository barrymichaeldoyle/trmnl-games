# Classes and the hero roster (P37)

Proposed 2026-10-13 as P37 after Barry asked for several heroes per account, one active at a time, one hero per class, everyone starting as a Warrior, and a second class opening once the Warrior reaches a set level, before the raid goal. Barry approved the whole plan with every recommendation the same day (D136), and it was built as content v18 with achievement catalog version 8 ([evidence](evidence/classes.md)). [Changes while building](#changes-while-building) lists where the build differs from this spec.

Companions: [objectives](objectives.md) (the career ladder and level unlocks), [achievements](achievements.md) (D65, account-keyed unlocks), [raids](raids.md), [leaderboards](leaderboards.md), and the [roadmap](roadmap.md), whose v1.2 row "Additional classes" this replaces with a concrete plan.

## The idea in one paragraph

An account keeps a **roster** of heroes, at most one per class. Exactly one hero is **current**: it adventures, shows on the TRMNL, ranks, raids and is raided. The others are **parked**: frozen exactly where they were, like a paused hero (D13), with no rewards and no catch-up. Everyone starts as a Warrior. At Warrior level 6 the roster unlocks with a device line and a companion card that explains it, and the player may recruit a Rogue, which starts at level 1 with its own name, gear, gold and career ladder. Switching takes effect from the next adventure. Classes differ by a small set of catalog numbers and one passive each, fitted by the harness so that no class levels faster than another; they trade safety for gold or raid odds instead.

## What the code already has

The design leans on what exists, so the change is smaller than it sounds:

- **A current-hero pointer.** `deskCrawlerProfiles.activeHeroId` (and the older `users.activeHeroId`) already names the hero the companion and device read; `currentHero()` in `lib/gameProfile.ts` follows it and checks `isActive`.
- **A one-active-hero invariant.** Creation enforces at most one `isActive` hero per user (data-model.md). The roster keeps that invariant unchanged: the current hero is the only one with `isActive: true`; parked heroes have `isActive: false` and a new `parkedAt`. The tick (`sim/runs/tick.ts`) already skips heroes that are not `isActive`, so parked heroes never simulate.
- **Account-keyed achievements.** `heroAchievements` is keyed by `userId` (D65: "unlocks outlive a hero's lifecycle"), so switching hero loses nothing; counters stay per hero.
- **Per-hero everything else.** Items, gold, career state, to-do list, raid pool row and tick logs all hang off `heroId`, so a second hero is naturally separate.
- **Pause semantics.** A paused hero is dormant on the boards and gets no catch-up; parking reuses that meaning.

What does not exist: a `class` other than the literal `'warrior'` (schema, `HeroState`, payload, profile), stats that depend on class (`stats.ts` derives HP, attack and defense from level alone), a create-hero flow after the first one, and class art.

## Rules

**Roster.** At most one hero per class per account (a `by_userId_and_class` index checked at creation). No deleting or retiring a hero in the first release; account deletion already removes every hero of the user and must be checked to cover parked ones.

**Unlock.** A new unlockable feature `roster` at Warrior level 6 (open point 1), announced like the others: "Unlocked: a second hero." on the device, and a Hero page card that explains the mechanic in three lines: one hero adventures at a time; the other waits exactly where you left it; each has its own gear, gold and goals. The unlock is per account and reads the Warrior's level, so a Rogue at level 1 does not lock the roster again.

**Recruiting.** The companion's roster page offers each unlocked class not yet on the roster, with its passive, its trade-off and its art. Recruiting asks for a name, creates the hero at level 1 in Office Cubicles with the class's starter kit and makes it current (open point 3). No transfer of gold, items or potions between heroes (open point 5).

**Switching.** An intent `heroes.switchHero` from the companion, applied between runs like every other intent:
- Refused while the current hero is dead or travelling, so parking cannot skip a knockout or a trip; allowed while exploring, resting, sleeping or paused.
- The leaving hero keeps its status, HP and pending decision exactly; a pending choice's expiry and an effect's duration are counted in the hero's own adventures, so nothing runs out while parked. The merchant leaves (four adventures is a visit, not a reservation).
- No catch-up on return, as with pause. One switch per day (open point 4).
- The device shows the new hero from its next screen; the switch logs a command line on both heroes ("Clocked out. Tobias takes the desk.").

**Boards and raids.** Only the current hero ranks; a parked hero is dormant on every board, as a paused one is today, and its raid pool row is skipped by the pick (the pick already reads the target live). Recent-XP boards therefore show what the player is doing now. Lifetime boards keep a parked hero's frozen total visible but marked (open point 6).

**Career ladder.** Each hero has its own ladder from the first rung, including the companion rungs, because a new hero really does need to equip, sell and travel, and the rung gold is its starting money. Unlocks read the hero's own level, so a Rogue meets the to-do list at 2 and raids at 7 like a Warrior did. The Warrior gains no rung for recruiting: a rung that demands a second hero would push every player into it.

**Achievements.** A new catalog version appends a roster family (recruit a second class; a second class to level 7, 12, 16; every class at level 12) and one family per class for its passive (a Rogue's raids won, a Rogue's gold from fights). Existing families keep reading the current hero's counters, so a Rogue cannot re-earn a tier the Warrior already holds; the account keeps the unlock.

## The first new class: the Rogue

Warrior stays the baseline; nothing about it changes. The Rogue fits the office: it works the corridors, not the desk. Numbers are starting points for the harness, not decisions:

| | Warrior | Rogue |
| --- | --- | --- |
| Max HP | 100 + 12 per level | 85% of the Warrior's |
| Attack | 10 + 2 per level | +10% |
| Defense | 4 + 0.75 per level | −15% |
| Passive | none (the steady class) | Light fingers: +20% gold from fights, and +5 points on its side of a raid |

The harness gate: over 90 days the Rogue's median level per cohort (daily, three-day, weekly) is within 5% of the Warrior's, its knockout rate in the Cafeteria and below stays under 1.5 times the Warrior's, and raid win chance stays inside the validator's 10 to 90% band for every stance pair. A Mage waits: the roadmap's v1.2 row says MP and spells only once their economy is designed, and a third class should follow live data on the second.

Classes live in the catalog as a `classes` rule (stat percentages, passive modifiers, starter kit, display name and blurb), read by `deriveStats` and the encounter, so a later class is content plus art. Gear stays shared between classes in the first release; class-only gear is a later question.

## Device and companion

- **TRMNL.** The payload's `class` becomes the hero's class; the hero card and scene draw the class sprite. That is a template change: under the sync bot, the ZIP upload to trmnl.com goes with it. Top rows keep showing each row's class instead of the hard-coded `'warrior'`.
- **Companion.** A Roster page under More (current hero, parked heroes with level and where they wait, recruit cards); the Hero page header gains a small switch control once a second hero exists; the switch uses the existing confirm sheet.
- **Public profiles.** Stay per hero; a parked hero's page says it is parked.

## Work slices

1. **R1 Data and switch, Warrior only.** `class` as a union (`warrior | rogue`) everywhere it is a literal; `parkedAt`; the class index; `switchHero` and recruit intents behind the `roster` unlock; tick, raid pick, ranking and deletion checks for parked heroes; tests for one hero, two heroes, switching in each status, and deletion.
2. **R2 The Rogue in the simulator.** The `classes` catalog rule as a new content version; class-aware `deriveStats`, gold and raid edge; harness cohorts per class against the gate above; evidence page.
3. **R3 Companion.** Roster page, recruit flow with the explanation, switch control, unlock card, help section.
4. **R4 Device.** Rogue sprite at every size the scene uses, payload class, template version, previews on all four layouts, ZIP upload.
5. **R5 Achievements and docs.** Catalog version with the roster and Rogue families, achievements.md, gameplay, api, data-model.

## Open points (settled 2026-10-13, D136)

All seven settled as recommended.


1. **Unlock level: 6 (recommended) or 5.** You asked for it before the raid goal. Level 6 is the last level before raids and stances, about day 4 to 5 for a daily player, and the ladder's raid goals sit at 7, so a player who recruits then still meets raids soon on either hero. Level 5 shares the level with office decisions. Reading your note as "offer the second hero before raids open, not after"; say if you meant something else.
2. **Parked heroes freeze (recommended) or keep adventuring slowly.** Freezing is what "one active hero at a time" means and keeps every board fair; a slow background pace is a second simulation path with its own balance.
3. **The new hero becomes current at once (recommended) or waits until you switch.** Recruiting and then playing it is the obvious intent; the Warrior parks where it stands.
4. **One switch per day (recommended) or free switching.** Free switching invites hopping to whichever hero has a merchant or a pending decision; a daily limit keeps the choice a choice. Switching back within the first ten minutes could be free, for mistakes.
5. **No sharing of gold or items between heroes (recommended).** A shared stash is a later feature with its own economy check.
6. **Lifetime boards: current hero only (recommended), or parked heroes keep their row.** Showing only the current hero keeps one row per person.
7. **Rogue first, other classes later (recommended).** One class proves the roster; the next class follows live data.

## Changes while building

1. **Parked timers are tick numbers, so they move on.** A parked hero's effects, pending decision and nap end at absolute ticks; freezing it properly means the return (`roster.switchHero`) adds the gap to `wakeAtTick`, the choice's ticks and every effect's `untilTick`. The merchant still leaves at parking.
2. **Recruiting is the day's switch.** Otherwise recruiting would be a free extra switch; the ten-minute undo returns to the hero just left. An undo keeps the day's clock from the original switch and cannot itself be undone.
3. **Deletion covered only the current hero.** Both game deletion and account deletion deleted `activeHeroId` and its rows; they now delete every hero of the account (`purgeHeroes`), current or parked.
4. **The class's numbers ride on the modifier resolver.** Attack, defense and gold shares join the affix and effect totals (`activeModifiers`), so the HUD, the device payload, raids and every fight read them from one place; maximum HP goes through `heroMaxHp` everywhere `maxHp(level)` was read.
5. **The device template does not change.** The scene is a server-rendered image named by its pose, so a Rogue is new poses (`rogue_idle` and so on) under the same URL scheme; the Warrior's paths are unchanged and cached screens keep working. No template version or ZIP upload.
6. **Lying-down Rogue poses share the Warrior's ink.** Sleeping and knocked-out heroes show no face on the 1-bit screen; the companion's colours (dark hood, green tunic) tell them apart.
7. **The Rogue's numbers were fitted** to 93% health, +10% attack, −10% defense, +20% gold and +5 raid points; see the evidence page for the harness runs that set them.
