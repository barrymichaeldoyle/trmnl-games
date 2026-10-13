# Meetings (P39)

Proposed 2026-10-13 after Barry picked the roadmap's v1.2 "Meetings" row as the next feature. Barry approved it the same day by handing over the open points, so every recommendation stands (D141); [settled points](#settled-points) records them. All five slices were built the same day as content v20 and achievement catalog version 10 ([evidence](evidence/meetings.md)); [changes while building](#changes-while-building) lists where they differ from this spec. Production runs v19 until the world is switched to v20.

Companions: [raids](raids.md) (the ledger, pool and apply path this reuses), [the roadmap](roadmap.md) (the v1.2 row and its gate), [gameplay](gameplay.md) (effects, D80), [world events](world-events.md) (the scene layers), [achievements](achievements.md) (the planned "meetings completed" family) and [the source brief](source-brief.md), whose meetings row reads "shared stories/buffs/trade; start with stories only".

## The idea in one paragraph

Desk raids are the hostile way two heroes meet. Meetings are the friendly way. Now and then, instead of a fight, a hero runs into another player's hero on the same floor: they grab a coffee, swap war stories by the printer or split a sandwich in the break room. Both devices tell the same story from their own side, naming the other hero, and both heroes leave with the same small boon for the next two hours, such as +10% XP. The scene shows the other hero standing there. Nothing changes hands, nobody can lose, and there's no setting, button or notification. It's the clearest sign on the device that other people are playing.

## What a player sees

- One morning Baz's device reads "Grabbed a coffee with **Quill** by the machine. Caffeinated." with a +10% ATK chip. Quill's device, on its next adventure, reads "**Baz** dragged you out for a coffee. Caffeinated."
- The scene shows the hero facing the other player's hero (Warrior or Rogue, drawn in its own class sprite and turned to face ours) with the meeting's prop between them: a coffee machine, a printer or a lunch table.
- The companion log shows meetings with their own badge. The Hero page gains a Coworkers card with the last five meetings (name, where, what boon), and a name links to that hero's public profile when it's on (D109). The boon shows as an effect chip, like Fired up or Well fed today.
- No push, email or device alert. No chat, no reply, no "meet again" button, no trading.

## Rules

### When a meeting starts

A meeting is one more thing that can happen on an exploring tick, in the same place as a raid: after sustain and before the ordinary encounter roll. The raid draw goes first. If a raid happens, that's the tick's event and no meeting draw matters. Otherwise the simulator takes one draw from a new `meeting` stream. If the draw is under the launch chance and the adapter found a partner, the meeting is the tick's whole event and no ordinary encounter happens.

The launch chance is the same for every stance: a meeting is neither brave nor careful. Starting value 5‰ per exploring tick. A hero both starts meetings and gets met, so an active hero should see about one meeting every two days. The harness sets the final value against that target.

The `meeting` stream exists only under a catalog with meeting rules, so content v19 and earlier replay unchanged, seed by seed, and the simulation version stays 1. Its draws have fixed positions, like the raid stream's: 1 launch (permille), 2 where to look in the floor's pool, 3 the partner's new pool position, 4 which meeting. A pure `planMeeting(streams, content)` takes draws 1 to 3 for the adapter, and the core takes the same draws from the same seed.

A career guarantee that's due waits for the next tick, as it does after a raid.

### Who you meet

Another active hero **on the same floor**, so the story happens somewhere both heroes are. The roadmap row asked for a cohort by floor, and the live floor is the simplest one: no snapshot to publish and no stale pairings.

Picking is one bounded indexed read. The existing `raidPool` row gains the hero's `biomeId` and a `by_biomeId_and_shard` index. The adapter takes the first row on the hero's floor at or after `planMeeting`'s shard, wrapping once within that floor, then reads the partner itself, live. A hero patches its own row's `biomeId` in the tick it arrives on a new floor. Raids keep picking from the whole pool exactly as today; the two share one shard, and either move just puts the row somewhere else at random. One table means one maintenance path for activation, suspension, quarantine, parking and deletion.

A partner is available when all of these hold at pick time. Otherwise the draw is spent, nothing is logged and the tick plays its ordinary encounter:

- active, the owner's current hero (parked heroes are out), not the hero itself, not suspended, quarantined or deleting;
- exploring or resting (dead, travelling, paused and sleeping heroes are out);
- on the same floor;
- at or above the meeting unlock (level 2, [settled point 1](#settled-points));
- not met in the last 48 ticks (twelve hours). The pool row stores `metAtTick`. Both rows are stamped when a meeting happens, so a hero doesn't start a second meeting right after being met.

A floor with only one hero on it has nobody to meet, and the draw is spent. That's expected on the Parking Garage for a while, and it costs nothing.

### What happens

The fourth draw picks one meeting kind from the catalog. Each kind is a catalog row with a prop for the scene, story lines from both sides and one boon from the existing effect rules. Both heroes get the same boon for 8 ticks from their own application tick. Starting list:

| Kind | Starter's line | Partner's line | Boon (8 ticks) |
| --- | --- | --- | --- |
| Coffee run | Grabbed a coffee with **Quill** by the machine. | **Baz** dragged you out for a coffee. | Caffeinated: +10% attack |
| War stories | Swapped war stories with **Quill** at the printer. | **Baz** had a story about the Stapler Mimic. | Inspired: +10% XP |
| Shared lunch | Split a sandwich with **Quill** in the break room. | **Baz** shared their lunch. | Well fed: +10% XP (the existing effect) |
| Shortcut | **Quill** showed you a shortcut past the shredders. | Showed **Baz** the way past the shredders. | Shown the ropes: −30% trap damage |
| Pep talk | **Quill** gave you a pep talk before the next fight. | Gave **Baz** a pep talk. | Backed up: +10% defense |
| Office gossip | Caught up on office gossip with **Quill**. | **Baz** had news from the fourth floor. | In the loop: +10% gold |

Every boon uses a modifier the simulator already sums in `activeModifiers`. The three-effect cap and its "drop the one ending soonest" rule apply as they do today, and a rest keeps boons. A knockout clears them, as it clears every effect.

No gold, XP, HP or items change hands, and nothing is lost. A meeting takes the place of one encounter on both sides, which costs each hero about 1% of a day's adventures. The two hours of boon about makes up for it, so meetings neither speed up nor slow down progress. The harness checks that (M1's gate).

### How each side applies it

This is the raid apply path with friendlier contents, so the roadmap's gate holds for the same reason it holds for raids.

The starter applies its side inside its own tick: the boon, the `meetings` counter, one log entry. The same tick inserts one `meetings` ledger row (starter, partner, tick, kind, both public names with their name versions) keyed by starter and tick, so a retried batch finds the row instead of inserting a second one. In the same patch it stamps `metAtTick` and moves the partner's pool row.

At the partner's next evaluation the adapter reads its oldest pending meeting and passes it to the core as `incomingMeeting`. The core applies it after an incoming raid would land and before sustain, as that tick's whole event, the way an incoming raid is. If a raid and a meeting are both waiting, the raid lands first and the meeting on the next tick. The adapter marks the row applied in the same transaction. A meeting lands only on an exploring or resting hero; a dead, paused, sleeping, travelling or parked partner keeps it pending until it's back, and takes the boon then. The story still makes sense late ("**Baz** dragged you out for a coffee"), so there's no expiry.

Side effects therefore commit at most once for both parties: the starter's under its `lastTick` guard, the partner's through the ledger row's state. Reads per tick stay bounded: one pool take and one partner get when the launch hits, and one pending take for every hero under a catalog with meetings.

### Counters and achievements

One grow-only counter on the hero, `meetings`, counted on both sides. A new achievement catalog version appends one family, Networking: meetings 1, 10 and 50. It's account-keyed like every family.

The planned "meetings with the same hero" family is dropped. Achievement predicates read counters, never history, and counting meetings per pair would need a row per pair that grows without bound. The Coworkers card already shows repeat names.

### Names and privacy

Exactly the raid rules. The ledger stores both names with their versions, and the read path masks a renamed, suspended or repaired name as "Hidden player" (the stored log summary is masked the same way `maskRaidSummaries` does it, generalised to both kinds). A name links to a public profile only when that profile is on. Deletion removes the hero's meeting rows in the existing deletion job, alongside its raid rows; the other party keeps its log line, which is its own history. The privacy policy line that already covers raids ("your hero's public name can appear in another player's adventure log") covers meetings too, with "raided" generalised.

## Scene

The scene is where meetings should feel new, so the starter's and the partner's last-event scene both show the other hero:

- A new subject kind, `coworker`, carrying the other hero's class. It draws that class's idle sprite at the subject's position, mirrored to face ours. Both class sprites already exist, so no new figure art is needed; the mirror and any colour regions are the work.
- The meeting kind's prop stands between them at the floor-prop anchor that occasions use (column 66): a coffee machine, a printer, a lunch table, a shredder, a whiteboard and a water cooler. Six small props.
- On an occasion, the occasion's floor prop gives way to the meeting's prop for that scene; the garland, hats and window stay. Both heroes wear the occasion's hat.
- The `coworker` subject is a new segment under scene version 5 (see [changes while building](#changes-while-building)).
- The device template doesn't change. The scene comes in through the image URL, and the story is a log line with an existing glyph slot.

## Deliberate limits

- No choosing who to meet, no friend requirement and no repeat button. Friends and rivals are a separate v1.2 row.
- No trading, gifts, gold or items between players, now or as part of this feature. The source brief's "trade" stays out until item ownership transfer is designed.
- No stance or class edge. Meetings happen at the same rate for everyone.
- No new modifier kinds and no boon above +10% (or −30% trap damage), so a meeting can't swing a fight or a board.
- No notifications and no recap fact. The device story and the companion card are enough, and the morning stand-up stays short.
- No cross-game meetings with Slow Cast.

## Work slices

Each slice ships on its own, keeps every earlier payload and template meaning, and preserves progress.

| Slice | Scope | Done when |
| --- | --- | --- |
| M1 Rules and harness | Content v20: `meetings` rules (launch permille, cooldown, unlock, kinds), five new effect rows, validator. Pure core: `planMeeting`, the meeting event for the starter, the incoming application for the partner, a `meeting` log outcome with both perspectives, the `meetings` counter, device-compact and full lines. Harness scenario with a synthetic per-floor pool | v19 replays unchanged seed by seed; meetings per hero-day within 0.4 to 0.6; day-30 and day-90 level and gold medians move by less than 2%; boons never stack past three effects |
| M2 Backend | Schema: `biomeId` and `metAtTick` on `raidPool` with the floor index, `meetings` ledger with pending/applied state and indexes by starter and tick and by partner, state and tick. Adapter: plan, pick, live checks, ledger insert, pending application and marking; arrival patches the pool row's floor. `meetings.recent` query with masked names. Deletion job and runbook cover the table. Production switch to content v20 between runs | Both sides commit once under duplicate workers and retries (tests); bounded reads per tick as above |
| M3 Companion | Meeting badge and lines in the log, Coworkers card on the Hero page, boon chips, help page section, privacy line | Phone previews pass per the companion QA conventions |
| M4 Device and scene | Scene version 6 with the `coworker` subject, mirrored class sprites, six props, occasion interplay, preview sweep with a `--meeting` flag | Every layout renders the longest meeting line without clipping, and both inks print the coworker clearly apart from our hero |
| M5 Achievements and admin | Achievement catalog version 10 with Networking, `admin:engagement` reports meetings, analytics doc updated | Rarity publishes for the family |

M1 blocks the rest. M2 can start while M1's harness runs; the production switch waits for M1's gate. M3 and M4 are independent once M2's query exists. M5 is last so the family counts real meetings from the switch.

## Changes while building

- **No scene version bump.** The coworker is a new subject segment (`coworker-<class>-<prop>`) under scene version 5. Every existing path draws exactly as before, so nothing cached changes and there's no version 6.
- **The prop lives with the art.** The scene key reads the log outcome, not the catalog, so each kind's prop is in `MEETING_PROPS` (art/props.ts) keyed by kind id instead of a `prop` field on the catalog row. A test checks that every v20 kind has one, and a kind the art doesn't know draws the coworker alone.
- **The coworker leaves its blade at its desk.** It's its class's idle pose without the blade's columns, mirrored to face ours, so the scene reads as a chat rather than a duel. The Warrior's cloak hangs off its back. On an occasion both heroes wear the hat, and the meeting's prop takes the occasion prop's place.
- **The starter has a cooldown too.** The adapter reads the starter's own pool row, so a hero that was just met doesn't start another meeting within twelve hours; the row is stamped after a first evaluation has joined it to the pool.
- **Previews use a scenario,** `meeting` in previewScenarios.ts (the longest line that fits, the Rogue at the whiteboard), rather than a `--meeting` flag.
- **The device keeps its glyphs.** The mug glyph is companion-only. The device draws meeting lines with the system glyph, like occasion lines, so the template stays at v53 and needs no ZIP upload.
- **The Coworkers card is on the Log tab,** after Raids, where the raid record moved in D124. The log's Raids filter became "Raids & meetings".
- **Gold medians are noisy.** Levels held the "neither faster nor slower" gate. The day-30 gold medians move a few percent each way per cohort with no pattern, because each meeting changes which raids happen afterwards ([evidence](evidence/meetings.md#progress)).

## Settled points

Barry handed these over on 2026-10-13 (D141), so the recommendation, listed first in each, stands.

1. **Unlock level.** (a) Level 2, the same as the to-do list: new players see other people within their first hour, and a meeting can't hurt. (b) Level 7 with raids, so all the multiplayer arrives at once. (c) Level 1. Recommend (a): a key in `unlocks`, with no new career rung, because rungs are append-only and a level-2 rung would need the v17 insert-and-remap.
2. **What a meeting gives.** (a) The same small boon to both, as above. (b) Story only, as the source brief first suggested. Recommend (a): a story with no effect is easy to skim past, and the boon gives a reason to check who you met.
3. **The scene.** (a) Draw the other hero, as above. (b) Show only the prop, like a lost raid's empty desk. Recommend (a): it's the visible novelty and reuses both class sprites.
4. **Rate.** About one meeting every two days per active hero, against roughly one raid a day. Tunable after M1's harness run.
