# Dug-in elites (persistent elite encounters, P42)

Proposed 2026-10-13. This is the v2.0 Depth row "persistent elite encounters with explicit intervention/retreat rules" ([roadmap](roadmap.md)). Barry asked for a spec after bigger bags (D146). Nothing is built yet. [Settled points](#settled-points) lists each choice with the recommended option first, for Barry to approve or change.

Companions: [gameplay](gameplay.md) (combat, luck and the 3% elite, death and safe-biome protection), [simulation](simulation.md) (streams, one evaluation per tick), [inventory](inventory.md) (finds, held gear and sleep), [biomes](biomes.md) (the five floors and their tiers), [raids](raids.md) and [meetings](meetings.md) (what else can take a tick's encounter slot), [objectives](objectives.md) (career guarantees) and [quality](quality.md).

## The idea in one paragraph

Today an elite is a lucky one-tick fight: 3% of combats meet a crowned monster with 1.5× HP, and a win pays 4× XP and 3× gold. A dug-in elite is one that doesn't fall in a single tick. Once a hero reaches level 12, about one elite in eight digs in: "An elite Auditor has dug in behind the filing cabinets." It has far more HP, and its HP carries over from tick to tick. The hero fights it six rounds a tick, drinks and rests by its usual stance, and comes back to finish the job. The device shows the crowned monster and its health bar going down over a few hours. Winning pays a big lump of XP and gold and a guaranteed rare-or-better find from that floor. The elite leaves if the hero is knocked out, walks away, travels, or runs out the clock (six hours). It's the first thing in the game that takes more than one tick to beat, and it's built from parts that already exist: monsters, the crown, the stance, potions and rest.

## Why per hero, inside the tick

The roadmap names eight things a persistent fight must define: saved monster state, damage and reward idempotency, abandonment, pause and travel, policy ordering, maximum duration, defeat and revival, and inventory concurrency. Most of them become simple if the elite belongs to one hero and lives on the hero document.

- **No shared row.** Each hero's elite is its own. Nothing contends with other heroes' ticks, and there's no contribution ledger. Shared bosses belong to v2.1 guild raids and the v3.0 world boss, which need their own RFCs.
- **The pure simulator owns it.** The standoff is one more hero field the core reads and writes, like effects or the merchant. Damage and rewards happen inside one tick's evaluation, so they commit exactly once under the existing run ledger. The kill tick clears the field in the same result that pays the reward, so a reward can't repeat.
- **No new status.** The hero stays `exploring` or `resting`. The device, payload meanings and pause rules are unchanged; the standoff is an extra field, not a state.

## What a player sees

- **When it digs in.** The tick's line: "An elite Auditor has dug in behind the filing cabinets. Took it to 64%." (The first tick already fights.) The scene shows the crowned monster.
- **While it lasts.** Each fight tick: "Still at the elite Auditor. Down to 31%." On a rest tick the hero rests as usual, and the line notes the elite is waiting. The device draws a thin HP bar under the crowned monster in every layout, plus "leaves in 3h" in the full layouts.
- **The win.** "The elite Auditor is filed for good. +1,240 XP, +410 gold. Found a Rare Spork Halberd." Fired up (the existing elite boon) applies.
- **When it leaves.** "The elite Auditor slipped away." No penalty beyond the time spent.
- **The companion.** A card on the hero page while a standoff lasts: the monster, its HP, the time left, the hero's HP and potions, and two actions: Drink a potion (the existing intent) and Walk away. The Log tab gets the lines as `combat` entries. No push alert: a standoff runs for hours, and the device is where the game lives.

## Rules

### When an elite digs in

- Only on an ordinary combat in which the existing elite draw hits (3% of combats). A second draw on the `encounter` stream, taken on every elite combat so later draws line up, decides whether it digs in: `digInPct` 12 (about one elite in eight). This is a starting point for the harness.
- Only for heroes at level 12 or above (the Archive's unlock level), on a floor of tier 3 or deeper (the Cafeteria, the Archive, the Garage). Below that, elites stay one-tick fights, so the opening is unchanged.
- Never in the Office, and never from a career guarantee (a forced elite stays a one-tick fight, so the guarantee pays out the same tick).
- Never while a standoff is already running.

### The elite

- Monster: the one the combat drew. Stats: ATK and DEF as the monster; HP is `monster.hp × hpMultiplierPct / 100`, starting at 600% (four times the one-tick elite's 150%). The harness tunes this so a geared hero at the floor's unlock level needs three to six fight ticks.
- Stored on the hero as `standoff`: `{ monsterId, biomeId, hp, maxHp, startedTick, untilTick }`. `untilTick` is `startedTick + durationTicks` (24, six hours). One per hero, at most.

### Each tick of a standoff

The order inside an `exploring` tick, with every existing step kept where it is:

1. **Expiry first.** At the start of any evaluation (whatever the status), a standoff past `untilTick`, on another floor than the hero, or naming a monster the pinned catalog lacks is dropped. In an exploring tick that's a story line ("slipped away"); otherwise it's quiet, like an expired merchant.
2. **Incoming events.** An expired decision, an incoming raid, meeting or found spare applies first, exactly as today. The standoff waits a tick.
3. **Sustain.** The auto-potion and rest lines apply exactly as today. A hero below its rest line rests; the elite keeps its HP and waits (no regeneration).
4. **The fight replaces the tick's encounter.** No raid or meeting launches and no encounter is rolled. The hero fights up to `maxCombatRounds` (6) rounds against the saved HP, with the ordinary damage rule and the `combat` stream.
   - Elite HP reaches 0: the win (below). `standoff` is cleared.
   - Hero HP reaches 0: an ordinary knockout (10% gold, 8 ticks, a lost-property spare under v21+). `standoff` is cleared.
   - Six rounds pass: the HP is saved and the fight goes on. Unlike an ordinary fight, there's **no retreat and no 5% gold loss**.
5. A fight tick counts as an adventure (`ticksExplored`) and for `explore_biome` to-do tasks. A career guarantee that's due waits until the standoff ends; it isn't consumed.

A resting hero resumes exploring at its stance's resume line and goes straight back to the fight.

### The win

- XP: the monster's rolled XP × `xpMultiplier` (12), scaled by stance and modifiers as any victory. Gold: rolled gold × `goldMultiplier` (8). Starting points; the harness checks they stay a small share of a week's XP and gold.
- One guaranteed gear find from the floor's `gearTier`, rarity drawn from rare and epic only (the rarity weights renormalised over those two). It goes through the ordinary find path: bag, or held and sleep when the bag is full. This is a reward, not luck, so D35's "luck never creates gear" still holds.
- `combatWins`, `monsterWins[id]` and `eliteWins` grow as for any elite win, plus a new lifetime counter `standoffsWon`. The Fired up boon applies. To-do `elite`, `defeat_any` and `defeat_monster` tasks move.

### Leaving

| Cause | What happens |
| --- | --- |
| Knockout | Ordinary knockout; the hero revives in the Office, so the standoff ends |
| Travel (the player or a pending destination) | Departing clears it. The companion asks first: "Leave the elite Auditor behind?" |
| Walk away (new intent) | Clears it at once. Repeating it is a no-op. Allowed while exploring or resting |
| Time | Past `untilTick` it's dropped at the next evaluation |
| Pause | Allowed as today. The clock keeps running, so a long pause loses the elite. That's the price of pausing |
| Inventory sleep | Can't start mid-standoff: no finds happen until the win, and the win's own find can start a sleep only after the standoff has cleared |
| A content switch | Kept if the new catalog has the monster, its floor and the standoff rule; otherwise dropped quietly. A deploy never leaves a hero stuck in a fight |

No penalty for any of these beyond the time spent and, for a knockout, the ordinary knockout cost.

### Intents and concurrency

- `heroes.walkAway(operationId)`: clears `standoff` under a receipt. It's a no-op if there's no standoff.
- Every existing intent behaves as it does now: equip, sell, salvage and upgrade change stats from the next tick; a manual potion heals now; stance changes move the rest line. These run in their own Convex transactions, and the tick reads the hero once, so a fight tick sees either the before or after of any intent, never half.
- There's no separate "claim" step and no reward outside the tick, so nothing is paid twice.

### Counters, achievements, recap

- New counter `standoffsWon`, backfilled to 0 with the counter-defaults path every new counter uses.
- Achievement family "Dug in" (standoffs won: 1, 10, 50), a new catalog version.
- One career rung appended: "Beat an elite that dug in" (reach level 12 first).
- The stand-up and retro recaps count a standoff win as an elite win. No new recap line.

## Data

- `heroes.standoff` (optional object, above). Bounded: one per hero. It's in the simulation input and output and is validated by invariants: `1 ≤ hp ≤ maxHp`, `startedTick < untilTick`, and `biomeId` equals the hero's floor while exploring or resting.
- Content: `standoff: { digInPct, minLevel, minBiomeTier, hpMultiplierPct, durationTicks, xpMultiplier, goldMultiplier }` plus narrative (dug in, still at it, waiting, won, slipped away; per floor, three lines each, with the D26 floor as the minimum).
- Payload: optional `standoff: { monsterId, name, hpPct, leavesAt }`. It's additive, so existing templates ignore it.
- Scene: the crowned monster is already drawn for elites (`elite-<id>` segments). The HP bar is drawn by the template, not the scene, so there's no scene version bump.

## Deliberate limits

- No shared or guild elites, no world boss, no dungeons. Those are v2.1 and v3.0.
- No new monsters or art: the elites are the floor's own monsters, crowned.
- No regeneration, no enrage, no special abilities. It's the ordinary combat rule with more HP and no retreat.
- No paying to finish it, no reviving into the fight, no calling friends in. Raids and meetings don't touch it.
- No notification beyond the device and the companion card.

## Work slices

Each slice ships on its own, keeps every earlier payload and template meaning, and preserves progress.

| Slice | Scope | Done when |
| --- | --- | --- |
| E1 Rules and harness | Content v23: `standoff` rule and narrative, validator, invariants. Pure core: the dig-in draw, the standoff tick, expiry, the win and its find, the counter. Harness reports standoffs per hero-week, win share, fight ticks to win, causes of leaving by stance and cohort, and the change in death rate, XP and gold | v22 replays unchanged seed by seed; daily and three-day cohorts at level 12+ see about one standoff a week and win at least half; knockouts per hero-day rise by less than 10%; XP and gold medians at day 90 move by less than 5% |
| E2 Backend | Schema field, adapter, `heroes.walkAway`, travel confirmation flag, payload field, deletion (nothing new: it's on the hero). Production switch to v23 between runs | Duplicate workers and retries pay a win once (tests); a content switch with an unknown monster drops the standoff; bounded reads unchanged |
| E3 Companion | Hero-page card with HP, time left, Drink and Walk away; travel confirmation; log lines; help section | Phone previews pass per the companion QA conventions |
| E4 Device | HP bar under the crowned monster in every layout, "leaves in" text in the full layouts, preview scenarios for the longest monster name at 1% and 100% | The preview sweep passes every layout, device and orientation |
| E5 Achievements and ladder | Dug in family (new catalog version), the career rung, `admin:engagement` counts | Rarity publishes for the family |

E1 blocks the rest, and its harness gate decides the numbers. E3 and E4 are independent once E2's payload field exists.

## Settled points

These are proposals with the recommended option first. Barry approves or changes them.

1. **Whose elite.** (a) Each hero's own, on the hero document. (b) Shared per floor, everyone chipping in. Recommend (a): no contention, no ledger, and rewards are idempotent through the tick. (b) is the v2.1/v3.0 design.
2. **Where it comes from.** (a) A share of the existing 3% elite draw, from level 12, on tier-3+ floors. (b) A new separate encounter weight. (c) A scheduled weekly elite. Recommend (a): it reuses a moment players already know, the crown means the same thing, and the opening is untouched.
3. **Retreat.** (a) No retreat inside a standoff: the fight carries on, and sustain decides when to rest. (b) Keep the six-round retreat and its 5% gold loss. Recommend (a): (b) would charge 5% gold every tick of a long fight.
4. **Knockout.** (a) Ends the standoff, with the ordinary knockout cost. (b) The elite waits for the hero to come back from the Office. Recommend (a): revival moves the hero to the Office anyway, and (b) would need travel back plus a longer clock.
5. **Duration.** (a) 24 ticks (six hours) from the dig-in, wall-tick based. (b) Count only fight ticks. Recommend (a): one clock that's simple to show ("leaves in 3h"), and pause can't stretch it.
6. **Reward.** (a) Big XP and gold plus one guaranteed rare-or-better find from the floor. (b) XP and gold only. (c) Workbench materials. Recommend (a): a named find is the memorable part, and gold-only would add to the gold glut that D146 is meant to soak up. (c) isn't scarce: daily managers hold 60+ Components by day 90.
7. **Player control.** (a) Walk away plus the existing potion and stance controls. (b) A "push on" toggle that ignores the rest line. Recommend (a): (b) is a death button in a passive game.
8. **Player-facing name.** "Dug in" (an elite that has dug in). Not "boss", which suggests something unique and authored, and not "persistent", which is jargon.
