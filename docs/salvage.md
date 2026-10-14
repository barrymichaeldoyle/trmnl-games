# Salvage and the workbench: materials, upgrades and reinforcement (D129)

Proposed 2026-10-12 as P36 and approved as D129 the same day, when Barry handed over the open points ("just go with what you think is best"). Built the same day as content v13 through slices W1 to W4 ([evidence](evidence/workbench.md)); switched on in production the same day (W5, run 807 clean). It is the design amendment the [roadmap](roadmap.md) requires before v2.0 Depth starts, covering its first two slices together: salvage (P26) and owned-gear upgrades (P27), with O13 settled. Potion strengths (P30), bigger bags, legendary gear and elite encounters stay separate slices and are only named where this design must leave room for them.

**Since v23 (D155)** salvage, the workbench and potion combining open at level 4, the level Mk II gear needs, with an "Unlocked: the workbench" line; below it the Bag page shows Sell only and a locked Workbench card, and the intents refuse with `LOCKED`. The "Salvage a piece of gear" goal moved up to straight after "Reach level 4" ([evidence](evidence/workbench-unlock.md)).

Companions: [inventory](inventory.md) (the bag, sale and sleep rules this extends), [achievements](achievements.md) (the counters and the next catalog version), [objectives](objectives.md) (D128, whose ladder gains rungs for the new actions) and the [gold-only ladders evidence](evidence/gold-only-ladders.md) (the gold figures that motivate this release).

## The problem it solves

Gold stops meaning anything in week two. Under content v10 the bag and pouch ladders cost about 4,000 gold in all; a daily manager has bought every rung by day 7 and then holds a median 16,000 gold at day 30 and 57,000 at day 90 with nothing to buy but merchant potions. Finds stop meaning anything around day 40: a daily manager is best-in-slot (an epic or rare tier-3 item in both slots) at a median day 37, a three-day manager at day 42, and from then on every find is sold at sight. Nothing in the game asks an older hero to open the companion except a full bag.

Three things fix that together, and none of them touches power for gold alone (the roadmap's stopgap rule): salvage gives unwanted gear a second use, upgrades let a good find on the wrong tier become the best item the hero owns, and reinforcement gives a best-in-slot hero three more steps per slot that cost the gold it is sitting on. Materials come only from gear the hero found, so nothing here is "buy stats"; gold is the second half of every price, never the whole price.

## The idea in one paragraph

Beside **Sell**, every bag item gets **Salvage**: strip it for materials instead of gold. Materials are three stack rows outside the bag, one per rarity band (Scrap from common, Parts from uncommon, Components from rare and epic), so salvage never fills the bag. On the Bag page, each equipped item has a **Workbench** card with one next step: **Upgrade** raises the item one gear tier within its slot (tier 1 → 2 → 3, the same stats a find of that tier would carry), and once it is tier 3, **Reinforce** adds +1, +2, then +3 to its stat. Rare and epic gear can also **choose an affix** outright. Every step costs materials plus gold, rewrites the item's copied stats in place under a receipt, and shows as one companion log line. Nothing is automatic, nothing is random, and the device template does not change.

## What a player sees

- **Bag page, bag items:** the item sheet shows Sell (gold) and Salvage (the material and count it yields) side by side. The multi-select review that sells up to 32 items (30 before D146) gains "Salvage selected" beside "Sell selected", with the total yield per material. A **Materials** strip sits under the potion row: three counts with their glyphs, "Scrap 14 · Parts 3 · Components 1", and a one-line "What are these?" that opens the help section.
- **Bag page, equipped items:** each equipped item's sheet gains a Workbench card naming the next step, its price and its result: "Upgrade to Mk II: 6 Scrap + 150 gold. Attack 7 → 11." or "Reinforce to +2: 12 Scrap, 4 Parts, 1 Component + 3,000 gold. Defense 16 → 17." A short line under it says what the hero is short of ("Needs 2 more Parts") when the step is not yet affordable, and the button is disabled. Rare and epic gear add a second row, "Choose affix", listing the four affixes with the one it holds marked; picking another costs 2 Components + 1,500 gold. Common and uncommon gear show no affix row.
- **Labels:** an upgraded item reads "Rare Letter Opener Mk II"; a reinforced one "Rare Letter Opener Mk III +2"; with an affix, "Vampiric Rare Letter Opener Mk III +2". The name never changes, so a player's first weapon can carry them to the end.
- **Companion log:** one line per action, from the ordinary command log: "Salvaged 4 items for 6 Scrap and 1 Parts.", "Upgraded the Letter Opener to Mk II.", "Reinforced the Cardigan to +1.", "Fitted Lucky to the Keyboard Mace."
- **Device:** nothing new. No template bump, no attention line, no notice line, no celebration. The device only ever sees the effect: fights go better.
- **Help page:** a Workbench section after Bag, written from the active catalog (yields, costs and caps), with the rule that salvage and upgrades are never automatic.
- **Career:** rungs appended to the D128 ladder for the first salvage, the first upgrade and the first +3 (below).
- **Achievements:** two new counter families under Lifetime (below).

## Rules

### Materials

Three material kinds, one per rarity band, resolving O13 (one generic material would make rare salvage feel like common salvage; one per rarity and tier would be twelve rows and too much to read on a phone):

| Material | Comes from | Glyph | Used for |
| --- | --- | --- | --- |
| Scrap | common gear | paperclip | every step |
| Parts | uncommon gear | screwdriver | tier 3 upgrades and reinforcement |
| Components | rare and epic gear | circuit board | reinforcement past +1 and affix choice |

Yield is the item's gear tier in units of its rarity's material: a tier-1 common gives 1 Scrap, a tier-3 common 3 Scrap, a tier-2 rare 2 Components. Epic gives three times its tier in Components. An upgraded item yields by its current tier, so a tier-1 common raised to Mk III and then salvaged returns 3 Scrap for the 12 Scrap and 650 gold spent: salvage after upgrade is always a loss, which the validator enforces (every step's material cost exceeds the yield of the item it produces).

Materials are item rows with a new `itemKind` literal, `material`, keyed by template id with a quantity, exactly as the potion row is: at most three rows per hero, no empty rows, outside the bag and outside capacity. They are never sold, traded, dropped by loot or spent on anything but the workbench. The bounded inventory read stays 32 rows and is now derived rather than fixed: the ladder's top capacity (20) + 2 equipped + 1 held + 1 potion row + 3 material rows = 27, asserted at validation so the bigger-bags slice cannot overrun it without widening the read on purpose (the [guardrail](roadmap.md#guardrails-what-v10-must-not-foreclose)).

### Salvage

`inventory.salvageMany(operationId, itemIds)` is `sellMany`'s twin: 1 to 32 (D146; 30 before) player-selected bag items, each checked to be the hero's own gear that is neither equipped nor held, deleted in one transaction, the yield added to the material rows, one receipt, one command log line. The hero must be manageable (exploring, resting, travelling or sleeping): a sleeping hero can salvage to make room exactly as it can sell. Potions and materials cannot be salvaged. There is no single-item variant; the sheet calls the same mutation with one id.

Salvage is explicit and only explicit. No automatic salvage, no "salvage everything below my gear" rule, no held-find salvage before claiming. The inventory sleep rules do not change.

### Upgrade

`inventory.upgrade(operationId, itemId)` applies the item's next step. The item must be the hero's own gear (equipped or in the bag, not held), the hero manageable, and the step affordable; the step is determined by the item, so there is nothing to choose:

| Item is | Next step | Costs (starting points) | Effect on copied stats |
| --- | --- | --- | --- |
| tier 1 | Upgrade to Mk II | 6 Scrap + 150 gold | stat = tier-2 stat + template offset + rarity bonus; `requiredLevel` 4; `saleValue` = tier-2 value × rarity multiplier |
| tier 2 | Upgrade to Mk III | 6 Scrap + 4 Parts + 500 gold | as above for tier 3; `requiredLevel` 8 |
| tier 3, +0 | Reinforce to +1 | 8 Scrap + 2 Parts + 1,000 gold | stat + 1; sale value unchanged |
| tier 3, +1 | Reinforce to +2 | 12 Scrap + 4 Parts + 1 Component + 3,000 gold | stat + 1 |
| tier 3, +2 | Reinforce to +3 | 16 Scrap + 6 Parts + 2 Components + 8,000 gold | stat + 1 |
| tier 3, +3 | none | | the sheet reads "Fully reinforced" |

An upgrade is refused with `LEVEL_TOO_LOW` when the resulting tier's `requiredLevel` exceeds the hero's level, so a hero can never make its equipped weapon unequippable; the sheet says "Mk II needs level 4". The item's template offset and rarity bonus are read from the active catalog at upgrade time, so a Ruler Blade stays one point ahead of a Letter Opener at every tier, and a rare stays four ahead of a common. Stats are rewritten in place: `attack` or `defense`, `requiredLevel`, `saleValue`, `contentVersion` (set to the catalog that did the rewrite), plus two new optional item fields, `tier` (absent means the template's tier) and `reinforced` (absent means 0). Retained logs, rank history and achievements are untouched, which is what makes this an in-place rewrite rather than a new item.

Reinforcement is the ceiling raise that makes this a major release: a maxed epic tier-3 weapon goes from 20 attack to 23. Against the Leftovers Hydra (defense 12) that is about a fifth more damage per hit under the `(2 × attack − defense)` formula; the harness measures Cafeteria knockout rates with and without it before the numbers are published.

### Choose an affix

`inventory.chooseAffix(operationId, itemId, affixId)` fits one of the catalog's four affixes to a rare or epic item for 2 Components + 1,500 gold, replacing whatever it had. The choice is explicit, not a reroll: intents have no reward stream, D128 settled that the game does not add randomness dials, and a player who wants Lucky should be able to buy Lucky. Fitting the affix an item already has is refused as `INVALID_INPUT`. Common and uncommon gear cannot take an affix (D81's rule that only rare and epic carry one stands). An affix id a later catalog no longer knows contributes nothing, as today.

### Content and simulation

Content v13 adds a `workbench` rule to the catalog: the three material templates, the yield rule, the step table and the affix price. The validator checks that every step costs more of each material than the item it produces would yield, that gold prices rise step by step, that `requiredLevel` per tier matches `gearTiers`, and that the material count keeps the derived read bound at or under 32. Catalogs v12 and earlier have no `workbench` rule; the intents refuse with `UNAVAILABLE` under them, and nothing else changes.

The simulator does not change its draws. Two pure-core changes only: `bagUsed` counts gear rather than "not potion", so material rows take no slot, and the invariants gain material rules (quantity at least 1, at most one row per material template, `reinforced` 0 to 3, `tier` a known gear tier, and `attack`/`defense` equal to what the catalog would compute for the item's tier, offset, rarity and reinforcement, checked wherever items are validated today). Equipped stats are read from the item as they are now, so a reinforced item plays correctly under every catalog and the v12 replay test passes unchanged: 900 seeded ticks on a hero with reinforced gear give identical results under v12 and v13, because the stats were on the item all along.

Counters: `itemsSalvaged` and `gearUpgraded` (upgrades, reinforcements and affix choices together) on `HeroCounters`, optional in storage with the usual defaults on read, written by the intents. They exist from the first slice so every deed counts from the switch.

### Achievements and career

The next achievement catalog version appends two counter families under Lifetime, ids appended, nothing renumbered: **Salvaged** (1 / 25 / 100 items stripped for parts: Recycling Bin, Spare Parts Drawer, Scrapyard Foreman) and **Workbench** (1 / 5 / 15 upgrades made: Tinkerer, Shop Steward, Master of the Works). Rarity publishes through the existing tally.

The D128 ladder gains three rungs after rung 19, under content v13 and append-only: 20 "Salvage a piece of gear" (`itemsSalvaged ≥ 1`, Bag page, 60 gold), 21 "Upgrade a piece of gear" (`gearUpgraded ≥ 1`, Bag page, 80 gold) and 22 "Reinforce an item to +3" (predicate over the equipped items' `reinforced`, no companion step beyond the workbench, 150 gold). Rung 22 is deliberately far: it is the only rung that takes weeks. No guarantees: these rungs wait on the player, not on luck. After rung 22 the goal line falls back to "Goal: level N" as it does today.

### Economy, as starting points for the harness

Nothing below is a target; the harness sets the published numbers.

- **Supply.** Gear is 15% of loot draws plus 3% of combat wins, common 70 / uncommon 25 / rare 4 / epic 1. A daily manager in the Cafeteria sees a few gear finds a day, nearly all common at tier 3 (3 Scrap each), an uncommon most days and a rare about weekly. The spec expected Components to be the slow material (about 8 per slot for +2, +3 and an affix choice). Measured, they are not: a daily manager salvages 380 pieces in 90 days, nearly five a day, and holds 703 Scrap, 253 Parts and 62 Components at day 90 against the 54 / 16 / 3 per slot the ladder spends ([evidence](evidence/workbench.md)). Gold is the binding constraint, as the sink intends; materials make Salvage-versus-Sell a relaxed choice rather than a second gate. Left as is on 2026-10-12: the lever, if live players sit at +3 in both slots with hundreds of spare Scrap before bigger bags ship, is the Scrap and Parts cost of +2 and +3 under a new content version, never the gold.
- **Sink.** Taking both slots from a tier-3 +0 to +3 costs 24,000 gold; two affix choices add 3,000. That is more than a daily manager holds at day 30 (16,000) and less than it holds at day 90 (57,000), so the gold hoard is spent from the second month into the third, which is when finds stop mattering today. Upgrades to Mk II and Mk III are cheap on purpose: they are the week-two use for a lucky rare, not the sink.
- **Salvage versus sale.** Selling a tier-3 common pays 24 gold; salvaging it pays 3 Scrap. Once the hoard exists, Scrap is worth more than gold, which is the point; before it exists, selling stays right, and the harness's early cohorts should still sell.
- **Raids.** Gold spent on the workbench is gold a raider cannot take (D110 moves gold from loser to winner), which gives an older hero a second reason to spend. Reinforcement never changes raid odds (stance only, D110).

The harness gains a workbench policy for its managed cohorts: salvage everything that is neither equipped nor better than the equipped item, and at each visit apply every affordable step to the equipped items, affix last. It reports, per cohort: gold at days 30, 60 and 90; materials held; the day each slot reaches Mk III, +1, +2 and +3; and Cafeteria knockout rate and last-24h XP against the v12 baseline. The roadmap's re-measurement rule applies: the "best-in-slot at days 35 to 45" assumption behind P27 is re-run on v12 first, since D128's guarantees and unlocks have not been measured over 90 days.

## Data

- `items`: `kind` gains `'material'`; optional `tier` and `reinforced` on gear. No new table, no migration: every existing item reads as its template's tier at +0. Material rows are created on first salvage.
- `heroes.counters`: optional `itemsSalvaged`, `gearUpgraded`.
- Intents: `inventory.salvageMany`, `inventory.upgrade`, `inventory.chooseAffix`, all receipted through `runIntent`, all returning `intentResult`. New errors: `LEVEL_TOO_LOW`, `NOT_ENOUGH_MATERIALS` (naming the shortfall), `UNAVAILABLE` (no workbench rule in the pinned catalog), and the existing `ITEM_EQUIPPED`, `ITEM_HELD`, `ITEM_NOT_AVAILABLE`, `NOT_ENOUGH_GOLD`, `INVALID_STATE`.
- `inventory.mine` adds `materials` (three counts with names and glyph ids), and per gear item `tier`, `reinforced`, `nextStep` (kind, cost, resulting stat, affordable, shortfall) and `affixChoices` for rare and epic.
- Analytics (consenting browsers only): `gear salvaged` (count, materials gained), `gear upgraded` (step kind, tier, reinforced), `affix chosen` (affix id). No item names.
- Reads per intent: the hero, its bounded item rows, the catalog. Nothing per tick changes.

## Deliberate limits

- No recipes, no crafting of new items, no material trading or gifting; the workbench only improves what the hero owns.
- Materials never come from loot, combat, raids, to-do tasks or the merchant, and are never sold for gold. If they could be bought, this would be "buy stats"; if they could be sold, salvage would be a second sell button.
- Nothing is automatic: no auto-salvage, no auto-upgrade, no stance that salvages. The inventory sleep system stays single (D123).
- No randomness: affixes are chosen, not rolled; upgrades always succeed; there is no failure chance or "chance to crit the upgrade".
- No device template change, no push, no notice line. If a device-side nod is wanted later it is a recap fact at most.
- Reinforcement stops at +3 and tiers stop at 3. Legendary gear and a fourth tier are their own slice with their own ceiling proof.
- Potion strengths (P30) are not here; the "three minors plus a material make a major" rule waits for that slice and would spend Scrap.
- Bigger bags are not here; this release only derives the read bound they will need.

## Work slices

| Slice | Scope | Done when |
| --- | --- | --- |
| W1 Rules and harness (done 2026-10-12) | Content v13 `workbench` rule and validator, `material` item kind, `tier` and `reinforced` fields, pure functions `salvageYield`, `nextStep`, `applyStep`, `applyAffix`, `bagUsed` counting gear only, invariants, derived read bound, counters. Harness workbench policy and the v12 90-day baseline | v12 replays unchanged seed by seed; every step costs more than the yield of its result; the 90-day report shows gold at days 30/60/90 and the +3 day per cohort |
| W2 Backend (done 2026-10-12) | Schema (additive), the three intents, `inventory.mine` additions, command log lines, counters written | Duplicate receipts cannot salvage, upgrade or pay twice; an equipped item cannot be salvaged; a held item cannot be upgraded; refusals name the shortfall; no new reads per tick |
| W3 Companion and help (done 2026-10-12) | Salvage beside Sell (sheet and multi-select), Materials strip, Workbench card and affix picker, help section from the catalog, analytics | Phone previews pass at 390 wide with the longest label ("Vampiric Rare Insulated Cardigan Mk III +3") |
| W4 Achievements and career (done 2026-10-12) | Next achievement catalog version with Salvaged and Workbench; ladder rungs 20 to 22 under v13 | Rarity publishes for both families; a hero at rung 19 moves to rung 20 on the switch with no payment |
| W5 Evidence and switch (done 2026-10-12, 16:27 UTC) | Evidence page with the harness tables, gate below, production switch between runs | First v13 run completes clean; existing heroes keep every item, stat and rank |

Gate (from the roadmap's v2.0 gate, narrowed to these slices): existing items replay identically under v13; no step can be paid twice; no item can be made unequippable by its owner; a sleeping hero can still free its bag; no new per-tick reads; the derived read bound holds; and the harness shows the gold hoard falling without the Cafeteria knockout rate rising past the v12 baseline by more than the measured +3 effect.

## Decisions taken in this revision

Settled 2026-10-12 when Barry handed over the open points; each went the way the proposal recommended.

1. **Reinforcement ships in this release.** It is the only sink a best-in-slot hero has, so without it the gold hoard stays; v2.0 is a major release for exactly this reason.
2. **Affixes are chosen, not rerolled.** A reroll would need an RNG source inside an intent and would be the game's first randomness dial (D128 kept the opening free of one too).
3. **Names and glyphs stay Scrap, Parts and Components** with the paperclip, screwdriver and circuit board; W3 may swap a name that does not fit the phone strip, nothing else.
4. **The step table is the harness's starting point.** Two constraints survive tuning: salvage after upgrade is always a loss, and the +3 pair costs more than a daily manager holds at day 30.
5. **No refund on salvaging upgraded gear.** The sheet shows the yield before the player confirms, and a refund rule invites loops.

## Changes while building

Recorded 2026-10-12, W1 to W4 ([evidence](evidence/workbench.md)).

1. **Salvage pays the tier a piece was found at, not its current tier.** The spec's "an upgraded item yields by its current tier" would have let Scrap plus gold become Components: an epic tier-1 find raised to Mk II for 6 Scrap and 150 gold would have salvaged for 6 Components. Yields now ignore `tier`, so no step can raise a yield and the validator's loss rule becomes "every step costs something". The sheet says so: "Salvaging it later still pays what it was found at, not what was spent."
2. **The error code is `WORKBENCH_UNAVAILABLE`**, in the style of `BAG_UNAVAILABLE`, rather than the spec's `UNAVAILABLE`.
3. **The workbench is one card on the Bag page**, after the gear window, rather than a card inside each equipped item's sheet: the materials strip, then one row per equipped piece with its next step, price, resulting stat, shortfall and (for rare and epic) Choose affix. The item sheet keeps Salvage beside Sell and shows the yield. One place to read on a phone, and the sheet stays short.
4. **Rung 22 reads a counter.** "Reinforce an item to +3" is `topReinforcement ≥ 3`, a grow-only counter of the highest reinforcement any item reached, written by the upgrade intent, so career predicates stay over bounded counters and the ladder needs no inventory read.
5. **The harness sells until both ladders are bought, then salvages**, and never chooses an affix (it cannot judge one). Weapon steps are applied before armor steps at each visit.
6. **Materials sit in the Workbench card**, not under the potion row of the Equipped card, which has no room for a fourth column at 320 px.
7. **`inventory.mine` carries the view**: `materials`, `workbench` (affix price and list) and per item `salvage`, `suffix`, `reinforced`, `nextStep` and `affixable`, so the page never recomputes catalog rules.
