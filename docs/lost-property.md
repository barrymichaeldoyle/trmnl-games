# Lost property (graveyard items, P41)

Proposed and approved 2026-10-13 as D145. Barry asked what the roadmap's v1.2 stretch row "Graveyard items" meant, then asked for a spec and left the decisions to the lead ("I trust you to make the best decisions using the information you already have"). [Settled points](#settled-points) records each one. Barry said "let's build it" the same day and asked for public hero pages to show the spares a hero holds. All five slices were built that day as content v21 and achievement catalog version 11 ([evidence](evidence/lost-property.md)); [changes while building](#changes-while-building) lists where they differ from this spec. Live in production since run 902 (16:15 UTC on 2026-10-13).

Companions: [the roadmap](roadmap.md) (the v1.2 stretch row: "only after item-transfer ownership and death-rule changes are designed"), [the source brief](source-brief.md) (the graveyard row: "other heroes find named dropped gear"), [gameplay](gameplay.md) (death and safe-biome protection), [inventory](inventory.md) (owned item rows and the bounded read), [meetings](meetings.md) (the pool, ledger and apply-once path this copies), [salvage](salvage.md) (workbench fields on gear) and [D144](decisions.md) (public hero pages and name masking).

## The idea in one paragraph

When a hero is knocked out on a floor, it drops a spare: a copy of the weapon or armour it was wearing, with its owner's name written on it in marker, like a lunchbox in the office fridge. The hero keeps its own gear. The spare lies on that floor until another player's hero finds it in place of an ordinary gear find: "Found a Ladle of Ruin with **Baz** written on it." Later, Baz's device reads "**Quill** found your spare Ladle of Ruin in the Cafeteria." The finder can equip, sell, salvage or upgrade it like any other find, and the name stays on it. Dying costs nothing it didn't cost before, and nobody gets more gear than they would have. It's the second-quietest sign that other people play the same office, after meetings.

## Why a copy, not a transfer

The roadmap blocked this row on two designs: who owns a transferred item, and what death takes. A copy settles both without changing either.

- **Death stays as it is.** A knockout still costs 10% of the hero's gold and 8 ticks, and the hero keeps its equipment, potions and XP ([gameplay](gameplay.md#death-and-safe-biome-protection)). Taking real gear would make dying far harsher in a passive game the player can't steer mid-fight, and would punish players who check in once a week.
- **Nothing changes hands.** The finder gets a new item row built from its own catalog. No row moves between heroes, so there is no ownership history, no shared row to race on and no undo.
- **No new power.** A spare replaces a gear find the finder would have had anyway, so finds per day are unchanged. The spare is rebuilt from its template and rarity at base stats: the owner's workbench tier and reinforcement don't come with it.

## What a player sees

- **The fallen hero.** The knockout line gains one consequence: "Dropped a spare Ladle of Ruin." Nothing else changes.
- **The finder.** On a gear find: "Found a Ladle of Ruin with **Baz** written on it." The compact device line is "Found Baz's Ladle of Ruin." In the companion the item shows a small name-tag chip ("Baz's") on the Bag page, and the name links to Baz's public page while it's public.
- **Back to the owner.** At the owner's next evaluation: "**Quill** found your spare Ladle of Ruin in the Cafeteria." It's a story line with no effect.
- **The companion.** The Log tab gains a Lost property card under Coworkers: where your spare is lying ("Your spare Ladle of Ruin is somewhere in the Cafeteria"), or who found it, plus the last five spares you found. The log's "Raids & meetings" filter becomes "Other people" and includes both lost-property lines.
- **The scene.** The finder's loot scene shows the gear prop with a masking-tape label instead of the plain gear prop. The owner's notice draws the coworker who found it holding the item, reusing the meeting subject.
- No push, email or device alert. No asking for it back, no reward for returning it, no trading.

## Rules

### Dropping a spare

Every knockout outside Office Cubicles drops a spare: in combat, from a trap, in a raid or as a Friday the 13th mishap. Office Cubicles can't knock a hero out (it rescues at 1 HP), so the Office never holds one.

The spare copies one equipped item. With both a weapon and armour equipped, draw 1 of a new `graveyard` stream picks which (even split). With one, that one. With none, nothing drops.

A spare records the item's `templateId`, `kind`, `rarity`, `affixId` and catalog version, the floor and the tick. It doesn't record stats, tier or reinforcement: the finder's catalog rebuilds the stats.

**One spare per hero.** A hero has at most one lost-property row. A new knockout while the old spare is still lying replaces it with the new item and floor ("the cleaner tidied the old one away"). A knockout while the found notice is still waiting drops nothing, so the notice lands first. That bounds the table at one row per hero, with no expiry job.

### Finding one

A spare can only take the place of an ordinary gear find from a loot encounter. Combat drops, Christmas gifts and career guarantees stay fresh items, so a guaranteed upgrade is never a lower-tier spare.

The stream's draws have fixed positions, as the raid and meeting streams' do: 1 which item drops, 2 whether to look, 3 where to look. On every exploring tick, before the core runs, a pure `planFind(streams, content)` takes the first three draws and reads 2 and 3: whether to look (`lookPermille`, starting at 100) and where to look on the floor. The core takes the same draws from the same seed. When the look hits, the adapter takes the first lying spare on the hero's floor at or after the shard, wrapping once, and checks it:

- not dropped by a hero of the same account (your Rogue can't find your Warrior's spare);
- the owner isn't deleting, suspended or under name repair;
- the template exists in the finder's catalog.

If the check fails, nothing is passed and the tick is untouched. If it passes, the adapter passes the spare to the core as `lostProperty`. The core uses it only if the tick's loot draw comes up `gear`. Otherwise it's ignored and the spare stays where it is.

When the core uses it, every draw for the fresh item is still taken in its usual place (rarity, kind, template, affix), so the reward stream never shifts. The item is then built from the spare instead: the spare's template, kind, rarity and affix (when the finder's catalog has it), with attack, defense, required level and sale value from the template's tier and that rarity, exactly as `generateGear` computes them. A full bag holds it as the held find, like any other.

The look rate only decides how often the adapter reads. Supply is set by knockouts, which the gameplay targets keep to a few per hundred hero-days on the harder floors, so spares will stay rare. Every look that finds nothing costs one bounded read. The harness sets `lookPermille` so a spare on a floor with five or more active heroes is usually found within a day.

### The owner's notice

This is the meetings partner path. The finder's tick marks the row `found` with the finder's name, name version and class, in the same transaction that creates the finder's item. At the owner's next evaluation the adapter reads its own row by `by_ownerHeroId` (one indexed get every evaluation) and, when it's `found`, passes it to the core as `incomingFound`. The core writes the notice as that tick's whole event, after an incoming raid or meeting would land, and the adapter deletes the row in the same transaction. The notice lands only on an exploring or resting hero. A dead, travelling, paused, sleeping or parked owner keeps it pending until it's back.

The notice costs the owner one encounter, about once per knockout. That's well under 1% of a day.

### Side effects commit once

- The fallen hero's spare is written under its `lastTick` guard, keyed by owner hero, so a retried batch overwrites the same row with the same values.
- The finder's item and the row's `found` mark commit in one transaction. The pick re-reads the row's state, so two finders in one batch can't both take it: the second sees `found`.
- The notice applies once, through the row's deletion.

Reads per tick stay bounded: one own-row get for every hero under a catalog with lost property, plus at most two pool rows and the owner's user doc when the look hits.

### Names and privacy

The same rules as raids and meetings. The finder's item stores the owner's public name, its version and user id (`relicUserId`, `relicName`, `relicNameVersion`). Every read masks a renamed, suspended or repaired name as "a coworker" on items and "Hidden player" in log lines. A name links to a public page only while that page is public (D144). Hiding your page doesn't stop your spares being found. It only stops the link, as with raids.

Deletion: the deletion job removes the hero's own lost-property row, and clears the three relic fields on other players' items through a sparse `by_relicUserId` index, a batch at a time. The item stays with its finder as a plain item. The finder's log lines are its own history and are masked on read, as raid lines are. The privacy page's sentence on raids and meetings gains "or written on an item another player finds".

### Counters and achievements

One grow-only counter, `lostPropertyFound`, on the finder. A new achievement catalog version appends one family, Lost and found: 1, 10 and 25 spares found. Nothing counts spares dropped (that would reward dying) or spares of yours found (that depends only on other players).

## Data

| Change | Shape |
| --- | --- |
| Content v21 | `lostProperty: { lookPermille }`; the `graveyard` stream exists only when this is set, so v20 and earlier replay unchanged and the simulation version stays 1. Narrative: drop consequence, finder lines (two or three variants, `{rival}` and `{item}`), owner lines |
| `lostProperty` table | `ownerHeroId`, `ownerUserId`, `ownerName`, `ownerNameVersion`, `biomeId`, `shard`, `templateId`, `kind`, `rarity`, `affixId?`, `contentVersion`, `droppedTick`, `state: lying \| found`, then on `found`: `finderHeroId`, `finderUserId`, `finderName`, `finderNameVersion`, `finderClass`, `foundTick`. Indexes `by_ownerHeroId`, `by_biomeId_and_state_and_shard`, `by_finderUserId` (deletion) |
| `items` | Optional `relicUserId`, `relicName`, `relicNameVersion`; index `by_relicUserId`. Absent on every existing and fresh item |
| Hero counters | `lostPropertyFound` |
| Log outcomes | Loot gains optional `relic: { rivalName }`; a new `lost_property` variant for the owner's notice (`finderClass`, `templateId`, `biomeId`); the death consequence is text only |
| Bounded inventory read | Unchanged: a spare is an ordinary gear row |

## Deliberate limits

- No real item ever leaves a hero. The roadmap's "item-transfer ownership" stays undesigned on purpose. Trading remains out, as meetings left it.
- No workbench tier, reinforcement or chosen affix travels with a spare.
- No choosing whose spare you find, no searching, no returning it, no finder's fee.
- Spares replace ordinary loot gear finds only, never combat drops, gifts or career guarantees.
- No spares in the Office, and none from Slow Cast.
- No notification beyond the device line and the companion card.

## Work slices

Each slice ships on its own, keeps every earlier payload and template meaning, and preserves progress.

| Slice | Scope | Done when |
| --- | --- | --- |
| L1 Rules and harness | Content v21: `lostProperty` rules and narrative, validator. Pure core: the `graveyard` stream and `planFind`, the drop on knockout (draw 1, reported as `spareDropped` on the result), the spare-built item, `incomingFound` and the notice log, the counter, device-compact and full lines. Harness scenario with a synthetic per-floor spare pool fed by the cohort's own knockouts | v20 replays unchanged seed by seed; spares are under 3% of gear finds; day-30 and day-90 level and gold medians move by less than 1%; the median lying time is under a day on floors with five or more active heroes |
| L2 Backend | Schema above. Adapter: drop write, pick, checks, found mark and item fields in one transaction, owner notice and row deletion. `lostProperty.mine` query (your spare, the last five you found, masked names). Deletion job and runbook cover the table and the item fields. Production switch to v21 between runs | Every side commits once under duplicate workers and retries (tests); two finders in one batch can't take one spare; bounded reads as above |
| L3 Companion | Name-tag chip on items, Lost property card on the Log tab, the "Other people" filter, help page section, privacy sentence | Phone previews pass per the companion QA conventions |
| L4 Device and scene | A labelled-gear prop and the coworker-with-item subject as new segments under scene version 5 (no version bump, as meetings did); preview scenarios for the longest finder and notice lines | Every layout renders the longest lines without clipping |
| L5 Achievements and admin | Achievement catalog version 11 with Lost and found; `admin:engagement` reports spares dropped, found and lying; analytics doc | Rarity publishes for the family |

L1 blocks the rest. L2 can start while L1's harness runs; the production switch waits for L1's gate. L3 and L4 are independent once L2's query exists. L5 is last so the family counts real finds from the switch.

## Changes while building

- **Public hero pages show held spares.** Barry asked for it when he approved the build: a hero's page lists the other players' spares it holds, with the names on them, and counts "Spares found". This is the one exception to D109's "never gear" on public pages. The help and privacy pages say so.
- **Where a spare lies.** The row's shard is the graveyard stream's third draw on the knockout tick, so no other random number is needed.
- **Only exploring heroes look.** The adapter plans a find only for a hero that starts the tick exploring. A resting hero never reaches a loot draw.
- **A rare spare counts as a rare find.** The finder's `itemsFound`, `rareFinds` and `epicFinds` grow as for any find. The harness confirms finds per day are unchanged.
- **The notice can land in the same run as the find,** when the owner is evaluated after the finder. The row is then gone before the run ends.
- **One prop for both scenes.** Instead of a labelled-gear prop plus a coworker holding the item, both scenes use the lost-property box: on its own for the finder, and beside the finder for the owner. Both are new segments under scene version 5.
- **The log filter is "Other people"** (raids, meetings and lost-property notices). The finder's line stays a `loot` entry under Finds.
- **The Lost property card lists the spares held, not the last five found.** The bag's item rows already hold them (bounded at 40), so the card, the bag and the public page share one read. History lives in the log.
- **No retention job.** The table holds at most one row per hero, so nothing piles up.
- **Achievement names:** Lost and Found, Label Reader, Head of Lost Property ("Lost Property Office" was already the 5,000-finds tier).
- **The day-30 gold gate.** "Medians move by less than 1%" held for levels but not for final gold, which moves several percent either way from raid pairings alone. Gold earned stayed within 2% ([evidence](evidence/lost-property.md#progress)).
- **Spares are more common than guessed:** 1–3% of loot gear finds in the harness, not "rare", because bold heroes deep in the building are knocked out often.

## Settled points

Barry left these to the lead on 2026-10-13 (D145). The choice made is listed first in each.

1. **What a death leaves.** (a) A copy of one equipped item; the hero keeps everything. (b) The real item, moved to the finder. (c) A cosmetic keepsake only. Chose (a): (b) needs the transfer design the roadmap warned about and makes death much harsher; (c) is a weaker story, since the point is finding someone's actual weapon.
2. **What the finder gets.** (a) The spare in place of a gear find it would have had anyway, at base stats. (b) An extra find on top. Chose (a): finds per day stay exactly as tuned, and the workbench's sink isn't bypassed.
3. **Telling the owner.** (a) A story line at its next evaluation, like a meeting's partner. (b) Companion only. Chose (a): "Quill found your spare" is the social moment, and the device is where the game lives.
4. **How many spares a hero leaves.** One at a time; a new knockout replaces a lying one. That keeps the table bounded without an expiry job.
5. **Player-facing name.** "Lost property", not "graveyard": nobody dies in the office, they get knocked out, and lost property is the office version.
