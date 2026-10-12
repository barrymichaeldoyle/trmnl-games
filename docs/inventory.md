# Inventory cadence, retained finds and sleep

Approved policy: D18/D19/D29, with capacity and cadence amended by D61 (bag ladder). This supersedes full-bag auto-sale and the suggested 24-hour-inactivity trigger. Numerical capacity/acquisition values are approved tuning starting points, not measured outcomes.

## Cadence and capacity

D61, amended by D122 (content v10, 2026-10-11): bag capacity grows per hero. A new hero starts with a 6-slot Paper Bag; capacity counts only unequipped, non-held gear, so equipped gear and potions take no space. The ladder is Paper Bag 6 → Tote Bag 10 → Laptop Backpack 13 → Messenger Bag 16 → Rolling Suitcase 20. Under v10 there are two kinds of rung:

1. One milestone: the Tote Bag on the hero's sixth adventure (about 1.5–2 hours, a deliberate early win and the only step a player who never opens the companion gets). It lands before that tick's gear is placed and can also be bought for 40 gold before then.
2. Shop tiers: the Laptop Backpack (100 gold), Messenger Bag (300) and Rolling Suitcase (1,500) have no milestone and no loot draw. `inventory.buyBag` sells them in order whenever the hero has the gold, at any level. The wandering merchant (D78) offers the next rung at 25% off the Bag page price for four adventures.

Content v1 to v9 keep D61's three sources (milestones at levels 4, 8 and 12, an 8‰ find per loot encounter, purchases at most one tier ahead of the guaranteed tier) and replay unchanged; the one-ahead rule applies only to milestone tiers, so a catalog may mix a milestone floor with shop tiers above it. Capacity never shrinks. The MVP ceiling is 20 slots, deliberately below the old 30 so crafting, raids and later content can offer bigger bags. Warn quietly at 80% of current capacity.

Cadence under v10 (harness, visits buy every rung they can afford): daily managers finish the ladder on day 7.2, three-day managers on day 9.5 and weekly managers on day 14.6, sleeping 27% of the month against 26% under v9 (measured with the desk drawer, which D123 removed: without it the weekly figure is about 43%, see [D123 evidence](evidence/no-drawer.md)); an unattended hero stays on the Tote Bag and sleeps 89% (see [gold-only ladders](evidence/gold-only-ladders.md), earlier [bag ladder evidence](evidence/bag-ladder.md)). At 20 slots (~4.7 gear/day) the comfortable visit is every three to four days. Manual equip/sell/biome choices remain intentional.

Under the ladder, unequipping needs a free bag slot; swapping is always possible, and equipping into an empty slot frees one. Rows stay bounded: 20 bag + 2 equipped + 1 held + 3 potion rows (D131) + 3 material rows (D129) = 29, within the 32-row read.

Separate potion stack: quantity 1 to the hero's pouch cap (D77: 20, 30, 40 or 60; 20 before content v4), with no empty stack row. Loot selects a documented gold outcome before generation when the stack is full; it never creates and discards/sells an excess potion. Do not force inventory sleep for potion capacity. Potions never take bag slots. The cap is the pouch ladder (D77), and under content v14 (D131, [spec](potions.md)) potions come in three strengths, each its own stack row keyed by template id, all counted against the one cap; a loot find draws its strength by biome tier.

## First overflow and held find

At 30 bag gear, keep adventuring until another actual gear find. Store that find in one held slot with its original copied stats/template/version/rarity. Apply the encounter's earned XP/gold/level-up once, then set gameplay status `sleeping`. Never automatically sell/discard the find. No further encounter, XP or passive HP healing while sleeping; previous window XP continues aging out.

The authoritative held reference is `heroes.heldItemId`; held gear uses an ordinary owned item row and is excluded from bag/equipment until claimed. Maximum reads: 32 rows, derived from the ladder's top bag plus the equipped, held and stack rows (29 under v14). No independent location/equipped flags or expanding queue. A full bag alone does not sleep, and no browser/device/check-in clock triggers it.

The desk drawer (D111, content v8 to v10, [spec](desk-drawer.md)) was a six-slot overflow that caught finds once the bag was full. Barry removed it on 2026-10-12 (D123, content v11) as an unnecessary complication: the bag is the only container, and a find that does not fit is held as above. The legacy `heroes.drawer` field stays optional in the schema until a later release drops it; no production hero held anything in it.

## Return journey

1. Review bag and held find. Equip/unequip/sell bag gear remain available while sleeping; held gear cannot equip/sell before claiming.
2. Free a bag slot and call `inventory.claimHeld`: clear the held reference atomically, keeping the same owned item and stats. A duplicate receipt cannot claim again.
3. Leave at least one free bag slot and select Resume adventures. Claiming into a full bag requires another sale before waking; UI explains this.
4. `inventory.resumeAdventures(biomeId?)` sets `wakeAtTick = world.currentTick + 1` and optionally a pending unlocked destination, preserving `sleeping` until that evaluation. Repeating it with the same arguments is a no-op. At that tick clear the wake deadline; with a destination, depart (travelling, arriving the following tick, no encounter); otherwise set exploring and continue normal sustain/one-encounter rules. No catch-up. This lets a returning player sell, claim, resume and move on in one visit (D29).

Selling many items one at a time is tedious on mobile and close to the intent rate limit. `inventory.sellMany` sells up to 30 player-selected bag items in one atomic intent. Selection remains explicit: no automatic or rule-based disposal.

Commands do not advance gameplay evaluation markers or XP. Pending wake shows “Adventures resume next tick.” No new find can appear while sleeping or waiting for wake. Owner/activation/quarantine checks remain mandatory.

## State rules and display

Inventory sleep is distinct from HP rest, voluntary pause and service quarantine. Manual potions/travel/pause cannot run while sleeping. Death/travel cannot occur simultaneously with sleep; overflow arises from an exploring loot/victory outcome after survival/level-up processing. Existing auto-revival and one-tick travel rules remain unchanged.

Device text when held: “Bag full, holding a new find” with the attention line “Make room in your bag in the companion, then resume.” and a QR code to the bag. After claim/full bag: explain free-space requirement. Keep status distinct from service failure; use the idle sprite. Recent rank remains eligible, though XP accrual stops and old XP ages out; once window XP reaches zero the sleeping hero is dormant and leaves recent boards until it resumes (D32). Hardware Sleep Mode/offline/uninstall still never determine progress.

## Acceptance

Test exact capacity boundaries, rare gear retention, potion cap fallback, copied-stat integrity, duplicate acquisition/claim/wake/sale, simultaneous tick/intent races, sleep without HP/XP/log spam, next-tick wake, no catch-up, and space checks after claiming. Measure cadence percentiles for all biomes and player policies. Update [gameplay](gameplay.md), [domain](domain-contracts.md), [model](data-model.md), [API](api.md), [quality](quality.md) and fixtures together when tuning changes.
