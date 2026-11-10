# The Archive and the Parking Garage, with field notes

Status: built and live 2026-10-12 as content v16 (D133, [evidence](evidence/biomes.md)); production switched from v15 at about 19:10 UTC, run 818 clean. Two floors below the Cafeteria Depths, and a bestiary-style lore layer for all five floors and twenty monsters. The sixth floor, the Boiler Room, is [below](#the-boiler-room-d228) (D228, content v30).

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

Two backdrops (rolling shelves and a hanging light; pillars, a ramp, a strip light and a level sign) and eight sprites, each 24 to 34 pixels wide, served on the same scene paths (`/art/scene/v5/archive/...` and `/art/scene/v5/parking_garage/...` since D139, `v4` before) and painted on the companion with their own tones. The hero card and the companion's biome bands take old-paper buff and concrete grey. No template change: the device names the floor from the payload as it always has.

## Field notes

A note per floor and per monster, in the voice of a hero's notebook, authored for all five floors and twenty monsters in `lore` on the catalog (`biomes` and `monsters`, keyed by id, 20 to 240 characters, no placeholders; the validator requires one for every floor and monster the catalog has).

- **Opening.** A floor's note opens the first time the hero stands there: it is there now, it has arrived there since content v16 (counter `biomesVisited`, arrivals per biome id, written by the simulator on arrival), or it has beaten one of the floor's monsters, which covers arrivals before the counter existed. The Office is every hero's first floor, so its note is open from the first tick. A monster's note opens with the first win over it (`monsterWins`). Nothing is drawn, stored or logged for a note; a catalog without `lore` changes nothing in play.
- **Companion.** A Field notes page under More: a header with "N of 25 notes", then each floor in order with its note in the floor's map colour (or a dashed "?" slot saying "Opens at level 12", "Travel there and the note opens" or "Where every hero starts"), then its four monsters as cards with the sprite painted the way the hero page paints it, the name, the lifetime win count and the note; a closed monster is a dashed card with the silhouette in the muted tone, "?" and "Beat one and the note opens". `heroes.mine` returns `lore` with every floor and monster, the note where open and null where not. No hint, alert or device line; the help page's Floors section says how notes open.
- **Why derived.** Lore is read-only flavour; storing unlock rows would add writes and a migration for something the counters already know. The one new counter is the arrival count, because "stood there" is not otherwise recorded, and it is optional so stored heroes need no backfill.

## The Boiler Room (D228)

Status: built 2026-11-10 as content v30 ([evidence](evidence/boiler-room.md)). The sixth floor, under the lowest level of the garage, and the first to drop a new gear tier.

The 2026-11-10 audit (D227) found the top production hero at level 26 with nothing new since level 16, Garage fights costing under a fifth of its HP, and finds that stopped mattering once both slots were at +3. The Boiler Room answers all three.

| Floor | Level | Tier | Gear | Combat / Loot / Trap / Rest | Loot gold | Trap damage | Potion share | Monsters |
| --- | ---: | ---: | ---: | --- | --- | --- | ---: | --- |
| Boiler Room (`boiler_room`) | 20 | 6 | 4 | 50 / 25 / 15 / 10 | 16–20 | 50–80 | 35 (D222, as the Garage) | Pipe Python, Fuse Box Fiend, Furnace Hound, Caretaker |

Past a door marked NO ADMITTANCE below the garage, the building's heating has run unattended for forty years and the caretaker never left. To-do pay is 60 gold a task (tier 6 targets continue the tier-3 ranges, gold targets at 2.2 times); potion drops are 0 minor / 25 healing / 75 major; the floor has its own field notes, two arrivals, eight victories, six gold finds, eighteen mishaps with one callback, six rests, three elite victories, three jackpots, three gear finds, two signature lines a monster and three dug-in and three won lines for standoffs.

**Tier-4 gear.** `gearTiers[4]` is attack 18 / defense 14, required level 20, sale value 48, continuing the 3 / 7 / 12 and 2 / 5 / 9 curves; four templates drop there (Pipe Wrench −1, Furnace Poker +1, Boiler Suit −1, Fire Blanket Cloak +1). The workbench gains one step, Upgrade to Mk IV (10 Scrap + 6 Parts + 2 Components + 2,500 gold), which keeps a piece's reinforcement: Mk III +3 becomes Mk IV +3. `nextStep` now takes the hero's level, and a tier the hero cannot equip does not count, so a level-12 hero's Mk III piece still reinforces as before and the Mk IV step appears at level 20 ([salvage](salvage.md)). The "Reinforce an item to +3" goal is unchanged: the counter reads the top reinforcement whatever the tier.

### Monster numbers

Fitted to the Garage's own ratios at its unlock (above): at level 20 in common tier-3 gear (328 HP, attack 60, defense 27) a fight takes three to four rounds and costs 26% to 35% of max HP before potions, the band the Garage gives a level-16 hero. Tier-4 gear then takes about a sixth off the cost.

| Monster | HP | ATK | DEF | XP | Gold |
| --- | ---: | ---: | ---: | --- | --- |
| Pipe Python | 165 | 42 | 18 | 130–146 | 16–18 |
| Fuse Box Fiend | 185 | 45 | 20 | 138–156 | 16–19 |
| Furnace Hound | 200 | 49 | 19 | 150–170 | 17–20 |
| Caretaker | 190 | 52 | 22 | 162–186 | 17–21 |

The gate is D133's: managed cohorts' knockouts on the new floor at or under the Cafeteria's at its own unlock, the undergeared cohort worse but not stuck. The harness travels every managed cohort to the hardest unlocked floor, so the Boiler Room is measured from level 20 ([evidence](evidence/boiler-room.md)).

### Ladder, achievements, art

One rung, "Win a fight in the Boiler Room" (200 gold), is inserted right before the +3 goal at the end of the ladder, and "Reach level 20" now says what it opens ([objectives](objectives.md), change 15). A floor-win goal now counts a win on the named floor or any deeper one: the first 90-day run held fifty of a hundred and fifty weekly visitors on the Garage goal, since a weekly visitor at level 15 goes to the Archive and comes back at level 20 and goes straight to the Boiler Room. Achievement catalog version 14 appends four monster families, Boiler Room Cleared, and Long service (levels 24 to 50), so Office Census and Full Tour need twenty-four monsters and six floors ([achievements](achievements.md)). One backdrop (two riveted boilers, a furnace with a glowing grate, gauges, a fuse board, a grating floor) and four sprites on the scene paths, furnace-copper bands on the hero card and the companion, and the public floor picture from `tools/landing/floors.ts`. No template change.

## What does not change

Pacing below level 12 is identical: the floors, their tables and the ladder rungs sit after everything a lower hero can reach, so a level-9 hero in the Cafeteria replays v15 tick for tick under v16 (`tests/sim/biomes.test.ts`). The device template, the bounded reads, the raid rules and the stance thresholds are untouched. Bigger bags and a fourth gear tier stay separate slices.
