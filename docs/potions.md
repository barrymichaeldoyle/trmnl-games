# Potion strengths: minor, healing and major potions (D131)

Proposed 2026-10-07 as P30 and approved as D131 on 2026-10-12, when Barry chose, with the marketplace review still open and no public players, content that early players see over late-game sinks ("new biomes and potion strengths ... lore") and handed over the order ("do what you think is best"). It is the v2.0 Depth slice the [roadmap](roadmap.md) lists after salvage and the workbench ([D129](salvage.md)), built as content v14 the same day ([evidence](evidence/potions.md)) and switched on in production at about 17:52 UTC (V5, run 813 clean). Bigger bags, new biomes and lore stay separate slices.

Companions: [gameplay](gameplay.md) (the sustain steps and loot table this changes), [inventory](inventory.md) (the stack rows and read bound), [salvage](salvage.md) (the materials the combine rule spends) and [achievements](achievements.md) (the next catalog version).

## The problem it solves

Every potion is the same potion. A find in the Cafeteria Depths is worth exactly what a find in the Office is, the pouch is a single number, and the only potion decision a player ever makes is whether to buy the next pouch. Salvage materials have one sink, the workbench, and the D129 harness found that sink leaves a daily manager with 700 Scrap at day 90 against the 54 it spends per slot: materials are not binding, gold is. Nothing about potions says "better zones, better loot".

Three strengths fix both without a new system: better biomes drop better potions, so a trip to the Server Room changes what the pouch holds; the simulator keeps the big ones for when they matter; and a flat combine rule turns the small ones plus a Scrap into a big one, which gives the most plentiful material a use from the first day a hero salvages.

## The idea in one paragraph

Potions come in three strengths: **minor** (25% of max HP), **healing** (40%, the potion every hero has today) and **major** (60%). Each is its own stack row, all three share the pouch, and the device still shows one count. The Office drops mostly minors, the Server Room mostly healing potions with the odd major, the Cafeteria mostly healing and majors. When the hero needs a drink it takes the weakest potion that puts it back above its drinking line and a stronger one only when the weak one would not do; a player can pick the strength by hand on the Hero page. On the Bag page, **Combine** turns three minors and one Scrap into one major. Nothing else changes: the starter kit, the merchant and office decisions hand out healing potions as they do now, the pouch ladder is untouched, and the device template does not change.

## What a player sees

- **Device:** the same potion count in the HUD (all strengths together). Stories name the find: "Found a major potion in the first-aid kit." The recap's "N potions found" is unchanged.
- **Hero page:** the Drink button says what it will do ("Drink potion +12 HP (7)") as today. With more than one strength in the pouch it opens a short picker: one row per strength held, with the HP it restores and how many are left; with one strength it drinks at once. The default, when the player does not choose, is the smallest potion that heals to full, else the strongest held.
- **Bag page:** the potion slot keeps its total. Its sheet lists each strength with its heal and count ("Minor potion, +8 HP: 4 · Healing potion, +12 HP: 2 · Major potion, +18 HP: 1"), the pouch line, and a **Combine** row: "3 minor potions + 1 Scrap → 1 major potion", with the button disabled and the shortfall named ("Needs 2 more minor potions") until it is affordable. A hero with many minors can combine several batches at once.
- **Companion log:** "Found a minor potion." in the story and "+1 minor potion" in the change row; "Drank a major potion." for a drink; "Combined 3 minor potions and 1 Scrap into a major potion." for the combine.
- **Help page:** the Potions section explains the three strengths, where each turns up, the drinking rule and combining, read from the active catalog.
- **Achievements:** one new counter family under Lifetime (below). No career rung: rungs are reached in order and the ladder's last rung (+3 reinforcement) takes weeks, so a potion rung behind it would never be seen in the opening, and a rung cannot be inserted ahead of it (the pointer is a position).

## Rules

### Strengths

| Strength | Template | Heals | Comes from |
| --- | --- | --- | --- |
| Minor potion | `minor_potion` | 25% of max HP | finds, mostly in the Office |
| Healing potion | `healing_potion` | 40% | finds, the starter kit, the merchant, office decisions |
| Major potion | `major_potion` | 60% | finds in the Server Room and Cafeteria, combining |

Heals round up (`ceil`) as today and never exceed max HP. The healing potion keeps its template id, so every potion row a hero holds today reads as a healing potion under v14 with no migration. `content.potion` stays the healing potion: the starter kit, the merchant's bundle and a decision's potions are healing potions, as they are now (a deliberate limit, below).

Each strength is one item row of `kind: 'potion'` keyed by template id with a quantity, exactly as the one row is today: at most three potion rows per hero, no empty rows, outside the bag, and all three counted against one pouch cap. The bounded read grows from 27 to 29 rows (20 bag + 2 equipped + 1 held + 3 potion rows + 3 material rows), asserted by the validator against the 32-row read.

### Finding potions

The loot table does not change: 20 of 100 loot draws are a potion, and a full pouch still turns a potion find into gold. Under a catalog with potion strengths the find's strength is drawn from the `reward` stream by the biome's tier, with weights the catalog authors per tier (starting points; the harness sets the numbers):

| Biome tier | Minor | Healing | Major |
| --- | ---: | ---: | ---: |
| 1 (Office Cubicles) | 60 | 40 | 0 |
| 2 (Server Room) | 25 | 60 | 15 |
| 3 (Cafeteria Depths) | 10 | 50 | 40 |

A later biome tier authors its own row. The draw happens only under a catalog with the rule, so a world pinned to v13 replays exactly as before; v14 is a new content version because the draw, the summaries and the change-row labels change meaning.

### Drinking

The automatic drink (gameplay step 6) keeps its trigger: HP below the stance's potion line while exploring, at most one potion per tick. Which potion changes: the hero drinks the **weakest potion that leaves it at or above the stance's potion line**, so it will not need another drink next tick; if no potion it holds would, it drinks the **strongest** it holds. The rule is deterministic and reads only the potion rows and the thresholds, so it adds no draw. Under a catalog without the rule the single row heals the catalog's `potionHealPct`, unchanged. (The proposal said the rest line; the harness compared both and the potion line costs the undergeared cohort fewer knockouts with no other difference, see "Changes while building".)

The manual drink (`inventory.usePotion`) takes an optional `templateId`. Given, that strength is drunk (`NO_POTION` names it when the row is empty). Absent, the backend picks the smallest potion that heals to full, else the strongest held. Everything else about manual drinks stands (D118: exploring, resting or travelling, below full HP).

### Combining

`inventory.combinePotions(operationId, batches)` turns, per batch, three minor potions and one Scrap into one major potion: the catalog's `combine` rule names the source strength, its count, the materials and the result, so a later catalog can change the recipe without a code change. `batches` is 1 to 10 (default 1). The hero must be manageable (exploring, resting, travelling or sleeping), hold enough of the source potion (`NOT_ENOUGH_POTIONS`, naming the shortfall) and enough materials (`NOT_ENOUGH_MATERIALS`, as the workbench). Under a catalog without the rule the intent refuses with `POTIONS_UNAVAILABLE`. One receipt, one command log line, one counter (`potionsCombined`, by batches). The pouch never overflows: a batch removes three potions and adds one.

Combining is explicit and only explicit: no automatic combining, no stance that combines, no combine on the device.

### Content and simulation

Content v14 adds a `potions` rule to the catalog: the three strengths in ascending heal order, the drop weights per biome tier and the combine recipe. The shared `lootPotion` lines gain a `{potion}` placeholder ("Found a {potion} in the first-aid kit.") so a story names the strength; the compact line is "Found a {potion}." The validator checks that the strengths are distinct and ascending, that one of them is `content.potion` with the same name, that every biome tier has weights summing to 100 over known strengths, that the combine rule goes from a weaker strength to a stronger one for at least two potions plus a material the workbench knows, and that the read bound holds.

Simulator changes, all gated on the rule so earlier catalogs replay unchanged: the potion branch of a loot encounter draws the strength and creates or increments that strength's row (the loot outcome records the `templateId`); the automatic drink picks its row by the drinking rule and heals that strength's percentage; the pouch check sums every potion row; a decision's potions go to the healing row. The adapter's directives (`potion_decrement`, `potion_increment`, `create` into `potion_stack`) already address a row by id and need no change.

Counters: `potionsCombined` on `HeroCounters`, optional in storage with the usual default on read, written by the combine intent.

### Achievements

Achievement catalog version 6 appends one counter family under Lifetime, ids appended, nothing renumbered: **Potion mixing** (1 / 10 / 50 major potions combined: Kitchen Chemist, Tea Round, Head of Pharmacy). Rarity publishes through the existing tally.

### Economy, as starting points for the harness

Nothing below is a target; the harness sets the published numbers.

- **Supply.** A daily manager finds about one potion a day (20% of loot draws) and drinks a little under one. In the Office that becomes mostly minors, which heal less than today's potion, so the opening gets slightly harsher; the starter kit's three healing potions and the Office's safe-biome protection cover it. The harness watches the Office and Server Room knockout rates and the level-8 date against the v13 baseline.
- **Majors.** A Cafeteria hero finds a major about two days in five. A major clears the rest line from any HP a stance drinks at, so it is the potion that keeps a bold hero exploring; the harness reports rest ticks per hero-day and knockouts per Cafeteria hero-day against v13.
- **Combining.** Three minors (75% of max HP in three drinks) and one Scrap become one major (60% in one drink): the trade spends heal total for pouch room and one big drink, and it spends Scrap, the material the D129 harness showed piling up (700 at day 90). The harness's managed cohorts combine whenever they can and report Scrap spent on potions and majors made.

## Data

- `items`: no new kind, no new field. Up to three `kind: 'potion'` rows per hero, keyed by template id. No migration: the one row today is `healing_potion`.
- `heroes.counters`: optional `potionsCombined`.
- Intents: `inventory.usePotion` gains optional `templateId`; `inventory.combinePotions(operationId, batches?)`, receipted through `runIntent`, returning `intentResult`. New errors: `NOT_ENOUGH_POTIONS`, `POTIONS_UNAVAILABLE`.
- `inventory.mine` keeps `potions` (the total) and adds `potionRows` (one entry per strength in catalog order: template id, name, heal percentage, HP healed for this hero, count) and `potionCombine` (the recipe with names, and how many batches the hero can afford), null under a catalog without the rule.
- `heroes.mine` and the device payload count potions across every row.
- Analytics (consenting browsers only): `potion combined` (batches). The drink is not an analytics event today and stays that way.
- Reads per intent: the hero, its bounded item rows, the catalog. Nothing per tick changes.

## Deliberate limits

- Three strengths, not a ladder of ten; the names are plain so the device line stays short.
- One pouch for every strength. Per-strength caps would need three numbers on the device and three ladders.
- The starter kit, the merchant and decisions hand out healing potions. A merchant selling the biome's potion is a later catalog's choice; it changes the offer shape and the help copy.
- One combine recipe, upward only: minors into a major. No splitting a major, no healing-into-major recipe (that would make healing potions a currency).
- No potion affects anything but HP. Stat potions are a different system.
- No device template change, no push, no notice line.

## Work slices

| Slice | Scope | Done when |
| --- | --- | --- |
| V1 Rules and harness | Content v14 `potions` rule, validator, pure `potions.ts` (strengths, drinking rule, draw, combine arithmetic, row bound), simulator changes under the rule, invariants, counter. Harness combine policy and per-strength reporting; the v13 90-day baseline already exists | v13 replays unchanged seed by seed; every potion row under v14 is a known strength; the 90-day report shows finds and drinks per strength, majors combined and knockouts per cohort |
| V2 Backend | Schema (additive counter), `usePotion` by strength, `combinePotions`, `inventory.mine` additions, every potion read summed across rows, command log lines | Duplicate receipts cannot combine twice; a combine never overflows the pouch; a drink of an empty strength is refused by name; the merchant and a decision add to the healing row beside other rows |
| V3 Companion and help | Drink picker on the Hero page, potion sheet with strengths and Combine on the Bag page, log labels, help section from the catalog, analytics | Phone previews pass at 390 and 320 wide with three strengths held and the combine shortfall shown |
| V4 Achievements | Achievement catalog version 6 with Potion mixing | Rarity publishes for the family; a hero with no combines gains nothing on the switch |
| V5 Evidence and switch (done 2026-10-12, 17:52 UTC) | Evidence page with the harness tables, gate below, production switch between runs | First v14 run completes clean; existing heroes keep their potion row as healing potions |

Gate (from the roadmap's v2.0 gate, narrowed to this slice): existing potion rows replay identically under v13; a hero never holds more potions than its pouch after any combine, find or purchase; no step can be paid twice; no new per-tick reads; the derived read bound holds; and the harness shows Office and Server Room knockout rates and the level-8 date within the v13 baseline's spread, with majors reaching the Cafeteria cohorts.

## Decisions taken in this revision

Settled 2026-10-12 under Barry's handover; each went the way the proposal recommended.

1. **Three strengths at 25 / 40 / 60.** Today's 40% is the middle tier, as P30 said; the minor is a visible step down and the major is one drink from any stance's drinking line to above its rest line.
2. **One shared pouch.** The device shows one count and the pouch ladder stays one ladder.
3. **Weakest that clears the line, else the strongest.** A rule a player can predict from the help page; no draw. Built against the potion line rather than the rest line (below).
4. **Combine, not brew.** The companion verb is Combine and the recipe is three minors plus one Scrap. Scrap because it is the material that piles up.
5. **No career rung.** The ladder is append-only by position and ends on a rung that takes weeks.

## Changes while building

Recorded 2026-10-12, V1 to V4 ([evidence](evidence/potions.md)).

1. **The drink clears the potion line, not the rest line.** The proposal's rule (weakest potion that keeps the hero above the stance's rest line) left an undergeared hero one hit from a rest after every minor: Server Room knockouts for the undergeared three-day cohort rose from 0.8% to 1.8% of hero-days. Clearing the stance's potion line instead (so the hero needs no second drink next tick) brings that to 1.3% and the Cafeteria from 6.8% to 6.4%, with every managed cohort unchanged to the decimal. Same shape, one threshold swapped; the help page says "above the stance's potion level".
2. **Combine is a small sink for managed heroes.** Weakest-first drinking consumes minors as they come, so a daily manager combines about once in 90 days (half a Scrap); the safe-farming cohort, which never drinks, combines 17 times. The slice's purpose was content variety and better-zone-better-potion, which the harness shows; Combine stays as the explicit use for a full pouch of minors. If a later pass wants it to matter, the lever is keeping minors as stock (drink healing before minors when both clear the line) or a bigger Scrap price, not more minors.
3. **Majors bank.** Every managed cohort ends with a full pouch that is mostly majors (median 36 to 48 of 60), because majors are drunk only when nothing weaker clears the line. That is the intended reserve; full-pouch fallbacks to gold stay where v13 had them (2.5 to 2.7 per hero-day for managers).
