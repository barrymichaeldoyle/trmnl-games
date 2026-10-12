# The Archive and the Parking Garage, with field notes

Status: built 2026-10-12 as content v16 (D133, [evidence](evidence/biomes.md)); the production switch from v15 is Barry's. Two floors below the Cafeteria Depths, and a bestiary-style lore layer for all five floors and twenty monsters.

## Why now

Under content v15 the Cafeteria Depths are the top floor from level 8 on. A daily manager reaches level 8 on day 8 and level 32 by day 90 ([balance](evidence/balance-v15-stances-90-days.json)), so for eighty of its first ninety days nothing new appears on the device. Barry's order after the workbench ([roadmap](roadmap.md)): potion strengths first, because they drop from level 1, then two new floors with lore for every floor, while bigger bags wait.

## The floors

| Floor | Level | Tier | Gear | Combat / Loot / Trap / Rest | Loot gold | Trap damage | Monsters |
| --- | ---: | ---: | ---: | --- | --- | --- | --- |
| Archive (`archive`) | 12 | 4 | 3 | 50 / 25 / 15 / 10 | 10–13 | 30–50 | Box File Beetle, Shelf Lurker, Microfilm Phantom, Auditor |
| Parking Garage (`parking_garage`) | 16 | 5 | 3 | 50 / 25 / 15 / 10 | 13–16 | 40–65 | Trolley Swarm, Oil Slick, Barrier Golem, Ghost Car |

The Archive is the records basement under the cafeteria: rolling shelves, forty years of paper, one working light. The Parking Garage is the concrete levels below it, reached by a ramp that keeps turning. Both are unlocked by level like the Server Room and the Cafeteria, announced by the same "New area unlocked" line, and travelled to from the world map; neither is safe.

**Difficulty tier and gear tier are separate.** A biome's `tier` keys everything that scales with the floor: its monsters, to-do targets and pay (40 and 50 gold a task, continuing 5 / 16 / 30), potion drop weights (tier 4: minor 5 / healing 45 / major 50; tier 5: 0 / 35 / 65), merchant potion prices (12 gold × tier) and a decision's gold per tier. A new optional `gearTier` names the gear tier whose templates drop there, and both new floors set it to 3. The workbench's ceiling (tiers stop at 3, reinforcement to +3) is its own slice with its own ceiling proof ([salvage](salvage.md)), so better gear does not arrive with the floors; harder fights, better potions, bigger to-do pay and more gold do. The validator requires `gearTier` to be a known gear tier at or below the floor's own.

### Monster numbers

Hero stats at the unlock level in tier-3 +0 common gear: level 8 has 184 HP, attack 36, defense 18; level 12 has 232 HP, attack 44, defense 21; level 16 has 280 HP, attack 52, defense 24. Under the combat formula a Cafeteria fight at level 8 takes three to four rounds and costs 21% to 50% of max HP before potions. The new monsters are fitted to the same ratios at their own unlock level (three to four rounds, 21% to 43%), which is what keeps a stance's rest line reached about as often as it is in the Cafeteria. The first draft was about 40% stronger than this and knocked daily managers out on 84% of their Archive days, so the fit is the published rule rather than a feel.

| Monster | HP | ATK | DEF | XP | Gold |
| --- | ---: | ---: | ---: | --- | --- |
| Box File Beetle | 105 | 27 | 10 | 55–64 | 10–12 |
| Shelf Lurker | 120 | 30 | 12 | 60–70 | 10–13 |
| Microfilm Phantom | 135 | 33 | 11 | 66–76 | 11–13 |
| Auditor | 145 | 35 | 14 | 72–82 | 11–14 |
| Trolley Swarm | 130 | 33 | 13 | 86–98 | 13–15 |
| Oil Slick | 150 | 36 | 15 | 92–106 | 13–16 |
| Barrier Golem | 165 | 39 | 14 | 100–114 | 14–16 |
| Ghost Car | 170 | 42 | 17 | 108–124 | 14–17 |

The gate is the one every floor has had since D24: for managed cohorts in the right gear, knockouts on the new floor at or under the Cafeteria's at its own unlock (about 1% of hero-days), and the undergeared cohort clearly worse but not stuck. The harness travels every managed cohort to the hardest unlocked floor at each visit, so the Archive is measured from level 12 and the Garage from level 16; the numbers published are the ones the 90-day run passed ([evidence](evidence/biomes.md)).

### Content

Each floor has the D26 floor: eight victory lines, six loot-gold lines, eighteen mishaps (one with a callback), six rests, three elite victories, three jackpots, three gear finds and two arrivals; each monster has two signature victory lines and a plural for the to-do list. Two rungs join the end of the career ladder, "Win a fight in the Archive" (120 gold) and "Win a fight in the Parking Garage" (150 gold); rungs are indexed by position, so they can only be appended, which means a hero reaches them after the +3 rung. Achievement catalog version 7 appends eight monster families on the shared 1 / 5 / 25 / 100 / 500 ladder and two set pieces (Archive Cleared, Garage Cleared). Office Census and Full Tour read the pinned catalog, so they now need twenty monsters and five floors; an earned one is never revoked ([achievements](achievements.md)).

### Art

Two backdrops (rolling shelves and a hanging light; pillars, a ramp, a strip light and a level sign) and eight sprites, each 24 to 34 pixels wide, served on the same scene paths (`/art/scene/v4/archive/...`, `/art/scene/v4/parking_garage/...`) and painted on the companion with their own tones. The hero card and the companion's biome bands take old-paper buff and concrete grey. No template change: the device names the floor from the payload as it always has.

## Field notes

A note per floor and per monster, in the voice of a hero's notebook, authored for all five floors and twenty monsters in `lore` on the catalog (`biomes` and `monsters`, keyed by id, 20 to 240 characters, no placeholders; the validator requires one for every floor and monster the catalog has).

- **Opening.** A floor's note opens the first time the hero stands there: it is there now, it has arrived there since content v16 (counter `biomesVisited`, arrivals per biome id, written by the simulator on arrival), or it has beaten one of the floor's monsters, which covers arrivals before the counter existed. The Office is every hero's first floor, so its note is open from the first tick. A monster's note opens with the first win over it (`monsterWins`). Nothing is drawn, stored or logged for a note; a catalog without `lore` changes nothing in play.
- **Companion.** A Field notes page under More: a header with "N of 25 notes", then each floor in order with its note in the floor's map colour (or a dashed "?" slot saying "Opens at level 12", "Travel there and the note opens" or "Where every hero starts"), then its four monsters as cards with the sprite painted the way the hero page paints it, the name, the lifetime win count and the note; a closed monster is a dashed card with the silhouette in the muted tone, "?" and "Beat one and the note opens". `heroes.mine` returns `lore` with every floor and monster, the note where open and null where not. No hint, alert or device line; the help page's Floors section says how notes open.
- **Why derived.** Lore is read-only flavour; storing unlock rows would add writes and a migration for something the counters already know. The one new counter is the arrival count, because "stood there" is not otherwise recorded, and it is optional so stored heroes need no backfill.

## What does not change

Pacing below level 12 is identical: the floors, their tables and the ladder rungs sit after everything a lower hero can reach, so a level-9 hero in the Cafeteria replays v15 tick for tick under v16 (`tests/sim/biomes.test.ts`). The device template, the bounded reads, the raid rules and the stance thresholds are untouched. Bigger bags and a fourth gear tier stay separate slices.
