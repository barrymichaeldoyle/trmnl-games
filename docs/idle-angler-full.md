# Idle Angler, the full game (P44)

Proposed 2026-10-14 and **approved as D162** the same day, when Barry handed the six open points over ("decide on each of those items on what is best"); [Decisions taken](#decisions-taken-2026-10-14) records them. Barry said there was a lot he wanted in Idle Angler before submitting it, and that the MVP could grow because the game is hidden and has no players. He asked for goals that unlock the game slowly so new players are not overwhelmed, daily tasks, better UI everywhere and fish used as bait. He then asked to include more waters, seasons, tournaments and a trophy wall, and to write a full spec "for the new goal of having a fully fleshed out game". This document is that spec. The [MVP spec](idle-angler.md) stays the authority for everything it already covers; where this one changes a rule, it says so.

Settled with Barry before drafting (2026-10-14): Idle Angler keeps mechanics that differ from Desk Crawler's (his rule from 2026-10-10), so the to-do list returns as **fishmonger orders** filled from the cooler, not passive tasks. Fish become **deadbait**, not live bait. The goal ladder copies the shape of Desk Crawler's career ladder (D128) and its hidden locked content (D157). The cosy rules stay: no streaks, nothing that expires, nothing lost, no XP (D116).

## The problem, measured

The S1 harness ([balance evidence](evidence/idle-angler-balance.md)) was run on 2026-10-14 for 90 days, 100 anglers per policy, on content v1:

| | Daily player | Every three days | Weekly |
| --- | --- | --- | --- |
| Species logged at day 7 / 30 / 90 | 10 / 18 / 18 | 7 / 13.5 / 18 | 6 / 11 / 19 |
| Day every rod, cooler and pass is owned (median) | 22 | 49 | after 90 |
| Coins held at day 30 / 60 / 90 | 2,938 / 14,420 / 25,661 | 311 / 2,383 / 8,732 | 187 / 483 / 1,000 |
| Coins earned a day at the end | 448 | 209 | 79 |

Three problems follow.

1. **The shop runs out in three weeks.** A daily player owns everything by day 22 and then banks about 450 coins a day with nothing to spend them on.
2. **The logbook stalls at 18 of 30.** A player who leaves one bait on at each water never meets the bread, spinner and mackerel-strip fish. Bait, time of day and weather decide which fish bite, and nothing in the game teaches that, so the harness's simple player is stuck where many real players would be.
3. **A new player sees everything at once.** The Dock lists every water, the Shop every tier, and the Log thirty silhouettes on the first day, with no step to take next.

## The idea in one paragraph

Idle Angler grows from three waters and a shop into a fishing year. A **goal** at the top of the Dock always names one next step. The game opens up as the logbook fills: orders, the trophy wall, deadbait and the weekend opens each arrive with a goal that uses them. The **fishmonger** posts three orders that pay more than the market for fish already in the cooler. A small fish can go back on the hook as **deadbait** for the predators. Three new waters (**Heron Lake** by rowing boat, a **deep-sea charter** out of the harbour and **Frozen Tarn**, open in winter only) bring 28 new species. **Seasons** belong to the world, shared by every angler like the weather: they change which fish feed, dress the scene and bring **runs**, a few days when the mackerel or the salmon are in. Every weekend each water holds an **Open** for its heaviest fish of one species. Medals and specimen fish go on a **trophy wall**. Every new system is also a place to spend coins.

## What a player sees

- **First day.** The Dock shows the scene, the cooler and one line: "Goal: Land your first fish". The Shop has worms and bread. The Log lists only fish already caught. A new feature appears when its goal arrives, as D157 does for Desk Crawler.
- **Companion.** The goal line and a "Coming up" line on the Dock. The fishmonger's three orders above the fish on the Cooler page. "Use as bait" on small fish. The trophy wall in the Log. The weekend Open in Rankings, with your place beside the top rows. A season and run banner on the Dock.
- **Device.** Seasonal dressing on every scene: blossom, full trees, falling leaves, snow. A boat, a charter deck or a hole in the ice when the angler is there. Goal, unlock, run and Open lines in the story log, with the D44 celebration badge for a reached goal or a medal. The X full landscape adds the goal line, as Desk Crawler's does (D138).
- **Help.** A section for each new system with the title that opens it.

## Systems

### Goals and unlocks

The shape is Desk Crawler's career ladder (D128, [spec](objectives.md)). There is one current goal per angler. Reaching it pays a few coins, writes a log line, takes the celebration badge and moves the pointer to the next goal that is not already met. Goals never fail, never expire and never send an alert. Companion goals alternate with goals the angler meets on its own, so a device-only player always sees progress.

**Unlocks follow species logged**, because Idle Angler has no levels (D116). Unlocks are predicates over the logbook, so they are retroactive and need no migration, as D128's are.

| Feature | Opens at | Daily player reaches it | Three-day player |
| --- | --- | --- | --- |
| Dock, Cooler, selling, worms and bread, the Log | start | day 0 | day 0 |
| Cooler and rod upgrades in the Shop | 2 species | day 0 | day 0 |
| Fishmonger orders | 4 species (Regular) | day 1 to 2 | day 2 |
| River Bend, Waders | 6 Millpond species (unchanged) | day 3 to 4 | day 7 |
| Trophy wall, weekend Opens | 8 species (Local) | day 5 | day 9 |
| Deadbait | 10 species | day 7 | day 12 |
| Harbour Pier (unchanged), Heron Lake | 5 River Bend species / 6 River Bend species | day 11 / day 12 | day 25 / day 27 |
| Deep-sea charter | 6 Harbour Pier species | about day 20 | about day 45 |
| Frozen Tarn | 5 Heron Lake species, in winter | the next winter week, at most three weeks later | the same |

Days for the first six rows come from the v1 pacing above; the last three are estimates for waters that do not exist yet. The F1 harness measures every row on content v2 before the help page prints it.

**The ladder** (starting list; about 1,040 coins in all, roughly 5% of what a daily player earns in its first 60 days):

| # | Goal | Predicate | Companion | Coins | Guarantee |
| --- | --- | --- | --- | --- | --- |
| 1 | Land your first fish | `fishCaught ≥ 1` | | 10 | a bite within 8 casts |
| 2 | Sell a fish | `fishSold ≥ 1` | Cooler | 10 | |
| 3 | Buy a tub of bread | bread bought | Shop | 10 | |
| 4 | Catch a fish on bread | a bread catch | | 15 | a bread-only species within 16 casts on bread |
| 5 | Log four species | `speciesLogged ≥ 4` | | 20 | |
| 6 | Fill an order for the fishmonger | `ordersFilled ≥ 1` | Cooler | 20 | |
| 7 | Buy the Cool Box | `coolerTier ≥ 2` | Shop | 20 | |
| 8 | Catch a fish at dawn or dusk | a dawn or dusk catch | | 15 | |
| 9 | Buy the Fibreglass Rod | `rodTier ≥ 2` | Shop | 25 | |
| 10 | Log six Millpond species | as River Bend's gate | | 25 | |
| 11 | Fish River Bend | `trips ≥ 1` to River Bend | Dock | 30 | |
| 12 | Catch a fish in the rain | a rain catch | | 20 | none: weather stays weather |
| 13 | Log eight species | `speciesLogged ≥ 8` | | 30 | |
| 14 | Mount a fish on the wall | `trophiesMounted ≥ 1` | Log | 30 | |
| 15 | Land the target fish in a weekend Open | `opensEntered ≥ 1` | | 30 | |
| 16 | Put a fish on the hook as bait | `deadbaitUsed ≥ 1` | Cooler | 30 | |
| 17 | Catch a Pike or a Zander | either logged | | 40 | |
| 18 | Fill ten orders | `ordersFilled ≥ 10` | Cooler | 40 | |
| 19 | Buy the Pier Permit | owned | Shop | 50 | |
| 20 | Log fourteen species | `speciesLogged ≥ 14` | | 50 | |
| 21 | Hire the rowing boat | owned | Shop | 60 | |
| 22 | Win a medal in an Open | `medals ≥ 1` | | 80 | none |
| 23 | Book a deep-sea charter | `charters ≥ 1` | Shop | 80 | |
| 24 | Catch a fish in every season | four seasons logged | | 100 | |
| 25 | Log twenty-six species | Master Angler | | 100 | |
| 26 | Fish Frozen Tarn | `trips ≥ 1` there | Dock | 100 | |

After the last rung the line reads "Goal: log N species" and counts up with no coins. Rungs are append-only and content-versioned, as D128's are.

**Guarantees** are D128's bounded pity rule. While a goal with a guarantee is current and its cast count passes, the next bite takes the guaranteed outcome kind. The draws keep their positions, so the streams stay aligned. There are only two, both in the first hour. Luck goals (the rain, a medal) have none.

### Fishmonger orders

The fishmonger's slate holds three orders. Each names fish the angler has to hand in from the cooler.

| Kind | Example | Reward |
| --- | --- | --- |
| Species | "2 Roach" | the fish's value × 1.5 + 20 |
| Weight | "One fish over 1.5 kg" | the fish's value × 1.5 + 40 |
| Water | "3 fish from River Bend" | the fish's value × 1.5 + 30 |
| Time | "A fish caught at night" | the fish's value × 1.5 + 30 |
| Rarity | "An uncommon fish" | the fish's value × 1.5 + 50 |
| Teaching | "A Tench (bread, at dawn or dusk)" | the fish's value × 1.5 + 60 |

- **Filling.** On the Cooler page, an order lists the fish that match. "Hand over" sells them to the fishmonger for the order's reward instead of the market price. This is a receipted intent; the fish are chosen explicitly and nothing is filled on its own.
- **Refill.** An empty slot gets a new order at the angler's 07:00 local time (the D112 boundary, from the stored `utc_offset`), at most one per slot per day. A full slate with nothing filled stays as it is. **Orders never expire.**
- **One free swap a day** replaces an order the player does not want.
- **Teaching orders.** At most one slot names a species not yet logged at a water the angler can fish, with its bait and time of day. This is how the game teaches bait without a tutorial screen: the harness's stalled 18 species are exactly the fish these orders point at.
- **Draws.** Orders come from a new `orders` stream drawn only at refill, so casts are unchanged. Each catch row gains its time band, weather and season, so time and weather orders can be checked.
- **Limit.** The F1 gate keeps order premiums under 25% of a daily player's income, so selling to the market stays the main way to earn.

### Deadbait

Small fish can go back on the hook for the predators that eat them.

- **Bait fish:** Minnow, Roach, Rudd, Gudgeon, Dace, Bleak, Smelt, Sand Eel, Mackerel and Whiting. On the Cooler page, "Use as bait" turns one into three units of deadbait. The fish is not sold. Deadbait holds at most 24 units and never spoils.
- **Who takes it:** Perch, Chub, Eel, Pike, Zander, Wels Catfish, Burbot, Sea Bass, Conger Eel, Smoothhound, Ling, Cod, Turbot, Tope, Blue Shark and Halibut. With deadbait on, only these species can bite, which makes it the way to hunt one predator.
- **The effect:** bite chance 75% of a matched bait's, and the weight draw leans to the top of the species' range (the same single `size` draw, mapped through a square root), so deadbait catches bigger fish less often.
- **Limit.** F1 gates deadbait's coins a day at a water to between 0.9× and 1.3× that water's best tub bait, so it is a choice, not the new default.

### New waters

Each new water has ten or so species, a backdrop, an ambient line set and a pose. The two earlier gates stay as they are.

| Water | Opens after | Access | Base bite | Baits | Notes |
| --- | --- | --- | --- | --- | --- |
| Heron Lake | 6 River Bend species | Rowing Boat, 1,200 coins, permanent | 12% | worms, maggots, bread, boilies (new), deadbait | Big carp and catfish; the boat pose |
| Deep-sea charter | 6 Harbour Pier species | Charter ticket, 400 coins for 96 casts at sea | 15% | ragworm, strip, spinner, deadbait | Leaves from the Pier; when the ticket's casts run out the angler sails back to the Pier. Casts, not hours, so a pause does not waste a ticket |
| Frozen Tarn | 5 Heron Lake species, world winter only | Ice Auger, 2,500 coins, permanent | 10% | maggots, worms, deadbait | Open the winter week of every four. An angler there when the ice goes out walks back to Heron Lake with a log line |

A fifth rod, the **Boat Rod** (lands up to 60 kg, +20% bite, 4,000 coins), is needed for the largest sea fish and the catfish. **Boilies** (12 bites a tub, 45 coins) are the carp bait at Heron Lake. The cooler stays at 24 fish, so the per-angler read stays bounded.

**Species** (starting table; F1 sets weights and prices like S1 did):

| Water | Common | Uncommon | Rare | Epic |
| --- | --- | --- | --- | --- |
| Heron Lake | Bleak, Ide, Silver Bream | Mirror Carp, Grass Carp (summer) | Leather Carp, Wels Catfish (summer, night, to 40 kg), Lake Trout (spring, autumn) | Ghost Koi (summer, dawn, clear) |
| Deep-sea charter | Gurnard, Coalfish, Haddock | Ling, Cod (autumn, winter), Turbot (summer) | Tope (summer), Blue Shark (summer, to 60 kg) | Halibut (winter, to 60 kg) |
| Frozen Tarn | Smelt, Whitefish, Ruffe | Vendace, Arctic Char | Burbot (night) | Golden Char (dawn, clear) |
| Season visitors | Sea Trout at River Bend (summer nights), Garfish at the Harbour Pier (spring) | | | |

That is 28 new species and 58 in all. Titles extend past Master Angler (26): Old Salt at 36, Lakeside Legend at 46 and Keeper of the Logbook at 56.

### Seasons and runs

- **The season is the world's, on the game's own calendar** (Barry, 2026-10-14: seasons and weather are shared by everyone and do not follow the real year). A fishing year lasts four weeks, one season a week: spring, summer, autumn and winter, each starting on Monday 00:00 UTC, the same moment the weekend Open's target and the weekly fly code change. The cycle is counted from a fixed epoch in the catalog, so it is a pure function of the UTC time. Every angler at a water sees the same season, the same run and the same rain, so an Open is fished in the same conditions by everyone. The Dock names it plainly ("Autumn at the waters until Monday"), never a real month.
- **One world forecast.** Weather tables shift by season (more rain in autumn, more fog in winter), and the forecast still hashes `[worldSeed, waterId, blockKey]`, with the season read from the block's UTC date. No per-player term.
- **Time of day stays local.** Dawn, day, dusk and night still come from the owner's `utc_offset` (D112), so the scene's sky matches the player's window. A shared clock would show night at midday for half the world.
- **What a season changes:** species gain an optional `seasons` window, as they have `times` and `weather` today. Each water has a season bite multiplier (freshwater winter 85%, spring and autumn 110%), and the scene takes the season's dressing. No season closes a water except the Tarn.
- **Runs** are four-day windows inside their season week, Monday to Thursday, the same for everyone, so they never sit on an Open's weekend. One run per season, so each week has one. Mackerel at the Harbour Pier in high summer, Salmon at River Bend in autumn (rain no longer needed, the species' draw weight ×4), Cod on the charter in winter and Sea Trout at River Bend at midsummer. A run writes "The mackerel are in at the Pier." on its first day and shows a Dock banner. A run is a catalog rule like a Desk Crawler occasion (D139), so it needs no admin and no ongoing work.
- **Pure.** The season and the run come from the cast's UTC time, which the simulator already receives, so they need no new input.

### Weekend Opens

- **Every water holds an Open every weekend**, from Saturday 00:00 to Sunday 23:59 UTC, so every timezone gets two full days. The catalog names one target species per water per week from a fixed rotation, chosen from the species the water's entry gear can land: "This weekend: the Perch Open at the Millpond."
- **Entry is automatic.** An angler takes part by landing the target at that water during the window, kept or released. Its heaviest one is its entry. Nothing to sign up for.
- **Boards.** Each Open is a board on the D116 record machinery: `iaCatchRecords` rows with a period `o2026-10-17`, written only for the target species, read with the same bounded indexed queries. Rankings shows the top rows and your own neighbours (D152).
- **Medals.** A cron at Monday 00:10 UTC reads each water's top three and awards gold, silver and bronze medals with 500, 300 and 150 coins. Every entrant gets a rosette. With few players a medal is easy to win, which is fine for a cosy game.
- **Device.** A status line ("Fishing the Perch Open at the Millpond") during the window, and a medal line with the celebration badge on Monday.

### The trophy wall

- **Mounting.** A fish in the cooler that weighs at least 60% of its species' maximum can go to the taxidermist instead of the market. Mounting costs the fish's value plus 100 coins and takes the fish out of sale. The wall keeps species, weight, water and date.
- **Pegs.** The wall starts with 6 pegs and extends to 12, 18 and 24 for 500, 1,500 and 4,000 coins. A mounted fish can be taken down, which frees its peg (no refund). The ceiling of 24 keeps the read bounded.
- **The shelf** holds Open medals, rosettes and one cup per completed season, and needs no pegs.
- **Where it shows:** the Log tab's Trophies page, and the public profile (D109) when the player has opted in.

### The UI pass

One pass over the whole companion, done with goals because goals change what the Dock shows:

- **D156:** only buttons look pressable.
- **D157:** locked features stay hidden, with one "Coming up" line.
- **D154:** "New since your last visit".
- **D152:** boards show your neighbours.
- **The Dock:** shows the current water, the next one and how to reach it, not every water.
- **The Cooler:** orders first, then fish with Sell, Hand over, Use as bait and Mount, each enabled only when it applies.
- **Rankings:** gains the Open.
- **The Log:** gains Trophies and seasons on each species.
- **Help:** rewritten per system.
- **Gate:** every page checked at 390 wide with no overflow, as every companion change is.

## Economy

The new coin sinks are the rowing boat (1,200), the Boat Rod (4,000), the Ice Auger (2,500), charter tickets (400 each, recurring), mounting (value + 100 each) and pegs (6,000 in all). That is about 13,700 coins of one-off purchases on top of today's shop, plus the charter as a sink that never runs out. The new income is order premiums, Open prizes and goal coins.

**F1 gates** (the harness decides the final numbers, as S1 did):

| Gate | Range |
| --- | --- |
| Day a daily player owns every one-off purchase | 45 to 75 |
| Coins a daily player holds at day 60, in days of its own income | under 10 |
| A charter day's catch value against its ticket | 1.2× to 1.8× |
| Order premiums as a share of a daily player's income | under 25% |
| Deadbait coins a day against the water's best tub bait | 0.9× to 1.3× |
| Goal coins as a share of 60-day income | under 6% |
| Species logged at day 90, daily player following its orders | 40 to 52 of 58 |
| Species logged at day 90, three-day player | 30 or more |
| Weekly player reaches Heron Lake | by day 75 |
| A never-visiting angler still logs species and enters Opens | yes |
| Each epic caught within its season by half of the anglers fishing for it | 0.5 to 1 |

The harness gains three policies: a player who follows its orders and switches bait for them, a deadbait hunter and a charter player.

## Achievements

Catalog v4 appends families in the cosy register. Rarity is per game as now.

| Family | Counter | Tiers |
| --- | --- | --- |
| Orders | `ordersFilled` | 1 / 10 / 50 / 250 |
| Deadbait | `deadbaitCatches` | 1 / 25 / 250 |
| Trophies | `trophiesMounted` | 1 / 6 / 24 |
| Opens | `opensEntered` | 1 / 10 / 52 |
| Medals | `medals` | 1 / 5 / 25 |
| Seasons | seasons with a catch | 4 |
| Runs | runs with a catch | 4 |
| Waters | `watersVisited` | extends to 4 / 5 / 6 |

New species append their two tiers each.

## Device

- **Art.** Three backdrops (the lake with reeds and a boathouse, open sea with a charter's rail, a white tarn with pines). Four seasonal dressings for each of the six waters (blossom, leaves, bare branches, snow), drawn as overlay sprites on the D139 occasion mechanism. Three poses (rowing boat, charter deck, ice hole). 28 fish sprites at two sizes. About ten icons (slate, medal, rosette, trophy, boilies, deadbait, boat, auger, ticket, Boat Rod).
- **Template.** The new lines fit the four layouts on OG, X and BWRY in both orientations. The X full landscape gains the goal line.
- **Gate.** The preview sweep is clean in every new state: each water and season, a run, an Open, a medal, a goal reached and an unlock.

## Data

- **Angler fields:**
  - `goal { rung, startedTick, castsAtStart, reachedAt[] }`
  - `orders[] ≤ 3 { id, kind, target, count, reward, drawnDay }`, `orderSwapDay`
  - `bait.deadbait`, `bait.boilies`
  - `charterCastsLeft?`
  - `pegs`
  - counters `ordersFilled`, `deadbaitUsed`, `deadbaitCatches`, `trophiesMounted`, `opensEntered`, `medals`, `charters`, `seasonsFished` (a bit set) and `runsFished` (a bit set)
- **Catch rows** gain `band`, `weather` and `season`.
- **New tables:**
  - `iaTrophies { anglerId, kind: 'fish' | 'medal' | 'rosette' | 'cup', speciesId?, grams?, water, periodKey?, at, peg? }`, indexed by angler. Mounted fish are bounded by pegs (24). The shelf grows by about two rows a week and is read a page at a time.
  - `iaOpenAwards`: the Monday run's receipt per Open, so a medal is awarded once.
- **Opens** reuse `iaCatchRecords` with an `o` period. No new board tables.
- **Deletion** purges the new table with the angler, and the purge test covers it.

## Determinism and versions

Everything new lives under content v2 and achievements v4. v1 replays unchanged seed by seed. There is one new stream, `orders`, drawn only at a refill. Season and run come from the cast's UTC time, not draws. Deadbait's skew reuses the `size` draw. Simulation version stays 1. The game is hidden with no players, so the switch to v2 needs no progress-preservation steps beyond the usual retroactive predicates. Barry's own angler moves onto v2 at its next cast.

## Work slices

| Slice | Content | Gate |
| --- | --- | --- |
| F1 Rules and harness | Content v2: seasons and runs, the three waters and 28 species, the Boat Rod and boilies, deadbait, orders, goals, unlocks and guarantees. Pure core, the `orders` stream, three new policies, a 90-day run | Every gate in [Economy](#economy); v1 replays unchanged |
| F2 Backend | Angler fields, catch row fields, intents (`orders.handOver`, `orders.swap`, `bait.fromCatch`, `trophies.mount`, `trophies.takeDown`, `trophies.addPegs`, `shop.buyCharter`), refill at 07:00, the Monday Open cron, `iaTrophies` and deletion | convex-test matrix: duplicate receipts, an order filled once, an expired-free slate, a ticket that ends at sea, a medal awarded once, deletion of the new rows |
| F3 Companion and UI pass | Every page in [The UI pass](#the-ui-pass), the Dock goal and Coming up lines, orders, deadbait, trophies, Opens, help | Fixtures walkthrough at 390 wide with no overflow or console errors; locked features never render a control |
| F4 Art and device | Backdrops, dressings, poses, sprites, icons, template bump | Preview sweep clean in every new state; Ruby crosscheck and linter pass |
| F5 Opens, wall and badges | Open boards and medals end to end, the shelf, achievements v4, the profile section | A full Open week on dev with medals awarded once; profile not-found parity |
| F6 Switch | Content v2 live in production (hidden), evidence pages, the MVP spec's "Not in the MVP" list trimmed | First v2 run clean with nothing quarantined; Barry's angler lands on the right goal |
| F7 Listing | The existing S7 steps: play-test, featured image, review submission (Barry's) | Live install, render and uninstall on Barry's device |

Content and art are the long poles. F1's numbers decide every price above, so F1 comes first. F3 and F4 can run side by side once F1 has fixed the content.

## Still not in the game

- Raids and meetings between anglers, prestige, XP and levels.
- Tackle accessories, a rotating merchant, found gear and cosmetic nods between games.
- Spoilage, line breaks, lost gear and deaths: never.

## Decisions taken (2026-10-14)

Barry asked for the best option on each open point. Each is settled as recommended, with the reason.

1. **Seasons, runs and weather are one world calendar shared by everyone, on the game's own four-week year, one season a week.** First settled as hemisphere seasons from the account's timezone; Barry changed it the same day so the world is shared, like the weather already was, and does not follow the real year. A real season would keep Frozen Tarn shut nine months and the "every season" goal most of a year away, and one real calendar would put snow in summer for half the world. Barry then asked for the simplest version, one season a week, so the season, the Open and the fly code all turn over on the same Monday and a player sees the whole cycle in a month. Two-week seasons were considered and dropped. It keeps one forecast and makes every Open fair across timezones. Time of day stays local so the sky matches the player's window.
2. **The charter is a recurring ticket of 96 casts.** It is the one sink that keeps a late-game player's coins meaningful, it stays optional, and counting casts rather than hours means a pause or a quiet night never wastes it. The angler always sails back to the Pier, so nobody is stranded.
3. **An Open at every water every weekend.** With one rotating Open, a new player at the Millpond would sit out most weekends; with one per water, every angler is in one every week from the day Opens unlock.
4. **Mounting costs the fish's value plus 100 coins.** The wall is a sink and a mounted fish should mean something; a free mount would fill the wall with no cost.
5. **Teaching orders may name a species not yet caught.** They are the game's bait and timing tutorial and the fix for the logbook stall the harness measured. At most one of the three slots does it.
6. **Submit for review after F6.** The reviewer and the first players see the full game, the listing's featured image shows it, and nothing needs migrating after launch. The game stays hidden while the slices land in production.
