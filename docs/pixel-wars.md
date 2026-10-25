# Pixel Wars: every TRMNL is a tile (P47)

Proposed 2026-10-24 for Barry's review. This is the full specification for the fifth TRMNL Games title, a community territory war in which every player's desk is one cell on a shared map that is drawn on every player's screen. The idea came from Barry's brief on 2026-10-24 for "some sort of TRMNL wars game that acts as a community king of the hill, where there's always a catch-up mechanic to pile on the leader", chosen for the virality and stickiness of social games and asked to be "quite distinct from my existing TRMNL games". Three brainstorm rounds settled the direction: a shared one-bit map rather than a single throne; the player's own device as their tile; ink that fades so the largest faction can never hold what it does not keep painting; orders that resolve on the quarter-hour tick; and a weekly season that ends as a print. Barry confirmed the name **Pixel Wars** on 2026-10-25 and moved private office maps out of the MVP (they are v1.1 in [Versions after the MVP](#versions-after-the-mvp)); [Decisions taken in this revision](#decisions-taken-in-this-revision) lists the other points settled while drafting. **Approved as D214 on 2026-10-25** ("Start"): built in slices W0 to W5 on main, `hidden` in production so nothing on the site or in the companion lists it; the build sections at the end record each slice and where the build departs from this text.

The game reuses what [Idle Angler](idle-angler.md), [Paper Lives](paper-lives.md) and [Little Plot](little-plot.md) lifted out of Desk Crawler: the quarter-hour tick, the pure seeded simulator, bounded reads, receipted intents, achievements over counters, the hourly publication, the TRMNL lifecycle with the `hidden`, `preview` and `live` status, the launch list (D201), push alerts, the weekly device code and keepsakes (D46), follows (D143), the eight languages (D193, D200) and the two-level deletion boundary. Where this spec says "as Desk Crawler" or "as Idle Angler", the named document is the authority and Pixel Wars inherits the rule unchanged.

## The idea in one paragraph

Every player has one desk: a single cell on a shared map, placed when their plugin is activated. Everything else on the map is ground. Players belong to one of four factions, each drawn as a pattern the e-ink can show (solid, hatch, dots, weave), and the map on every TRMNL shows who holds what, right now, across the whole community. Ink accrues to each player by the hour. In the companion a player queues orders: paint a ground cell next to one their faction holds, paint over an enemy cell, or re-stamp their own faction's ink before it fades. Nothing happens when the order is placed. Every quarter-hour the world tick resolves every order on the map at once, then fades every cell a little, and the largest faction fades fastest. The next screen refresh shows the result. When your own desk falls, the enemy's pattern fills your own screen until your faction takes it back, which costs them almost nothing. A season is a week. On Monday the map is frozen, offered to every player as a print for their TRMNL, and painted clean, the desks staying where they are. There is no shop, no gold, no progression tree and nothing to grind: there is the map, the mob and your name on a thousand desks.

## How it is different from the other four games

| | Desk Crawler | Idle Angler | Paper Lives | Little Plot | Pixel Wars |
| --- | --- | --- | --- | --- | --- |
| Progress | A hero that levels for ever | A logbook that fills for months | Finite lives, then the next generation | A catalogue filled by discovery | A week, then a print; nothing carries but the record |
| The player's role | Gear, floors, stances, raids | Setup: water, bait, selling | Decisions | Placement | Orders: where to spend this hour's ink |
| Device | Pixel scene with a board | Pixel scene with the catch | A portrait and a diary column | A pixel plot from above | The shared map, the same picture on every player's screen |
| Social | Boards, raids, meetings, friends | Per-water records, Opens | Album, family tree | Gnomes, cuttings | Everything: four factions, one map, your desk is the stake, invite links that place a friend beside you |
| Economy | Gold, shop, workbench | Coins, tackle | Money as one stat | Coins, seeds, the shed | Ink only, by the hour, the same for everyone |
| Antagonist | Monsters and elites | The one that got away | Time | Slugs, the fox, the gnomes | The other three factions, and the fade |
| Tone | Office fantasy | Cosy | Warm and dry | Cosy | Cheeky, partisan, fast |

The existing four are solo and cosy and reward checking in. Pixel Wars is zero-sum between factions, cooperative inside one, and rewards timing and a plan.

## What a player sees

- **Device:** the map, drawn as one-bit patterns at a whole number of pixels per cell, with the player's own desk marked by a ring. Under it a strip: the four faction swatches with their share of the map and an arrow for the hour's movement, the player's faction and desk state ("Your desk: Ink, 3 of 5" or, large, "YOUR DESK IS HATCH'S"), the since-your-last-look ticker ("+14 −9 cells for Ink since 09:15; Wren took the north corner"), the newest story line, the season's day and the time to Monday's bell, service warnings and the companion QR. A desk that is captured swaps the strip for a panel in the captor's pattern with the one line "Hatch holds your desk. 4 Ink players are within reach." and the QR to the Map page. On a small layout the map becomes a window centred on the player's desk.
- **Companion:** a Map page (the whole map, zoomable, tap a cell to queue an order, the well with the ink held and the ink arriving by the bell, the orders queued for the next tick with Cancel, the countdown to the tick, the faction strip), a Season page (standings over the week, lead changes, the player's own week, past prints), Rankings, Achievements and More (public profile, help, delete Pixel Wars progress). Settings and Account are shared. The companion paints factions in colour and keeps the pattern inside the colour, so the two surfaces agree.
- **Help page:** `/help/pixel-wars` explains that the map is the community, that orders resolve on the quarter-hour, how ink fades and why the leader fades fastest, what happens when a desk falls and why it is cheap to take back, the night shield, the Monday bell and the print, and what an invite link does.
- **Public profile:** the shared profile at `/profile/<public name>` lists Pixel Wars when opted in (public by default, D144): faction, desk state, this week's cells painted and desks taken, seasons played, the prints. Missing, private and suspended names return the same not-found (D109).

No streaks, no daily login reward, no shop, no gold. The one pressure is ink that fades and a desk that can fall, and a desk that falls is the cheapest thing on the map to take back.

## Rules

### Desks, maps and placement

| Field | Meaning |
| --- | --- |
| Desk | One cell per account on a map. A player with three devices has one desk; every device shows the map |
| Map | One global map in the MVP. Every row carries a `mapId` so private maps (v1.1) arrive without a migration |
| Lattice | Desks sit on every third cell in both directions, so two cells of ground separate neighbours and there is always ground to fight over |
| Placement | A player joining from an invite link takes the nearest free lattice point to the inviter's desk. Anyone else takes the next free lattice point on a spiral from the centre, so the map is dense and grows a ring at a time |
| Map size | Grows with the players: when the spiral reaches the edge, a ring of ground is added. Hard cap 64 × 64 cells (about 440 desks) per map; the global map shards into a second "floor" at the cap (see [Versions after the MVP](#versions-after-the-mvp)) |
| Factions | Ink (solid), Hatch (diagonal), Dots, Weave (crosshatch). A new player **chooses** at activation from the four, each shown with its share of the map and its player count, the smallest marked "needs players". A faction holding more than 40% of the desks is closed to new choosers that week (greyed out, "full this week"). An invite link joins the inviter's faction, full or not, and places the desk beside theirs |
| Switching | Allowed in the hour after the Monday bell, once a season, under the same 40% guard. A switch keeps the desk, resets the week's counters, and the companion says so |

Activation is TRMNL-exclusive as in Desk Crawler (D09): the desk is pending until a verified saved installation of the Pixel Wars plugin. One desk per account per map, kept across uninstalls. A desk whose owner's installations have served no screen for 14 days is cleared to ground ("the desk stands empty") with a line on the map; it comes back at the nearest free lattice point to where it was when a screen is served again. That is the only way a desk moves, and it keeps lapsed players from being dead cells.

### Cells and ink

Every cell is `{ faction | ground, ink 0..3 (desk 0..5), lastPainter }`. Ground has no faction and no ink.

| Order | Target | Effect at the tick |
| --- | --- | --- |
| Paint | A ground cell orthogonally adjacent to a cell the player's faction holds | Costs 1 drop. The cell becomes the faction's at ink 1 |
| Stamp | A cell the player's faction holds | Costs 1 drop per level. Raises ink by the drops spent, to the cap |
| Strike | A cell another faction holds, adjacent to one the player's faction holds | Each drop lowers its ink by 1. Drops past zero claim the cell for the striker's faction at that surplus (to the cap), so a level-3 cell costs 4 drops to take at level 1 |
| Liberate | The player's own desk while another faction holds it | A Strike where every one of the owner's drops counts as 3, and adjacency is not required |

Adjacency is checked against the map as it stood when the tick began, so a chain of Paints cannot run across the map in one tick. Several players of one faction may target one cell; their drops add. Several factions targeting one cell resolve by total drops: the defender's ink absorbs the largest attacker first, then the rest in order, and whoever has the largest surplus claims it; ties leave the cell ground. All of this is one pure function over (map, orders, tick) with no draw at all: Pixel Wars has no random stream in its core, only in its story lines.

### The well

Ink arrives at 1 drop a tick, 4 an hour, 96 a day, and the well holds 48. A player who checks once a day spends 48 drops and wastes the other 48; one who checks twice wastes nothing. Nothing else grants ink: there is no bonus for the leader, the underdog, a streak or a purchase, and the harness's first job is to prove that two players spending the same drops get the same result whether they spend them in one go or across the day.

Orders are queued in the companion and resolved at the next tick. A queued order holds its drops; Cancel returns them. A player may queue as many orders as they have drops. The Map page shows the orders queued and the countdown, and a tick that could not carry an order out (the target changed hands first, the adjacency was lost) returns the drops with a line.

### The fade

Every tick, after the orders, every held cell may lose 1 ink. The interval depends on the faction's place on that map, recomputed hourly from the published share:

| Faction's share rank | Loses 1 ink every | A full ground cell stands unattended for |
| --- | --- | --- |
| 1st (largest) | 16 ticks | 12 hours |
| 2nd | 24 ticks | 18 hours |
| 3rd | 32 ticks | 24 hours |
| 4th (smallest) | 48 ticks | 36 hours |

A cell at ink 0 becomes ground. Desks fade at half the rate. The fade is the game's one catch-up mechanic and it is drawn on the screen: a cell at ink 3 is its faction's full pattern, at 2 the same pattern at two thirds of its stroke density, at 1 a sparse outline of it, so the map is honest about who is really defending what, and a faded enemy border is the cheapest ground on the map.

Two amplifiers, both tuned by the harness and both off at a 25% share: the smallest faction's Strikes count double against the largest faction's cells, and a cell the largest faction takes from the smallest starts at ink 1 whatever the surplus.

### The night shield

A desk cannot be taken between 23:00 and 07:00 by its owner's clock, read from the owner's last TRMNL `utc_offset` (D112), UTC without one (D106). Strikes against a shielded desk are refused at order time with the hour it lifts; ground cells have no shield. Desks already held by another faction may be liberated at any hour. The shield is why a global map stays fair across time zones without anyone having to stay up, and it is the whole of the sun mechanic in the MVP; [v1.1](#versions-after-the-mvp) makes daylight matter for ground too.

### The season

A season is one week on the shared calendar, Monday 00:00 UTC to Monday 00:00 UTC, the keepsake week number, as Idle Angler's and Little Plot's seasons are. At the bell:

1. The map is frozen as the season's **print**: a one-bit image of the final map with the four shares along the bottom, offered to every player who held a desk that week as a keepsake image for a gallery slot (D46 machinery), their own desk ringed. Prints stack on the Season page and the public profile.
2. The season's faction standings are written: a faction's score is the sum over the week's ticks of cells held, a desk counting 3. The winner is the faction that held the most ground for the longest, not the one holding the most at the bell, so a last-hour swing changes the print but rarely the week. The winning faction's players carry a small rosette in the device header for the following week ("Last week: Hatch").
3. The map is painted clean: every cell to ground, every desk back to its owner's faction at ink 5, every well filled. Switch requests are applied. Desks stand where they stood.

Nothing is carried between seasons but the record (prints, achievements, lifetime XP, the boards).

### Score and XP

Pixel Wars has no gold and no shop; XP exists for the shared boards, levels and achievements and for nothing else. Credited at each hourly publication:

| Event | XP |
| --- | --- |
| A cell the player last painted, still held at publication | 1 each |
| An enemy cell flipped by the player's surplus this hour | 5 each |
| An enemy desk taken | 25 |
| The player's own desk liberated by the player | 15; by a faction-mate, 10 to the liberator |
| The player's desk held through the whole hour at ink 5 | 2 |
| The week's winning faction, at the bell | 50 to every member who placed an order that week |

Levels follow the engine's shared curve. One current goal as Idle Angler's (D196, one at a time, append-only, D135):

| # | Goal | Met when | XP |
| --- | --- | --- | --- |
| 1 | Paint a cell | `cellsPainted` ≥ 1 | 10 |
| 2 | Hold ground through a tick | a painted cell survives its first fade check | 10 |
| 3 | Stamp your desk full | desk ink 5 | 15 |
| 4 | Take a cell from another faction | `cellsFlipped` ≥ 1 | 25 |
| 5 | Invite a neighbour | an invite link places a desk beside yours | 50 |
| 6 | Take a desk | `desksTaken` ≥ 1 | 50 |
| 7 | Liberate a desk | `desksLiberated` ≥ 1 | 50 |
| 8 | Finish a season | a print is yours | 100 |
| 9 | Win a season | | 200 |

### Stories

One line a tick at most, in the cheeky partisan register, from the `narrative` stream over the tick's real events: "Hatch took the north corner while Ink slept." "Wren's desk fell at 14:30. Three of you are within reach." "Dots is the smallest faction, and its ink counts double against yours this hour." "Weave has held 41% for six hours. The fade is doing its work." Faction names and public aliases are marked for translation so each language keeps its article (D193). Names on the map are public aliases only, masked as rank rows are masked, and the game has no free text anywhere else: no taunts, no chat, no map messages.

### Determinism and versions

The core is pure: `resolve(map, orders, tick, shares) → (map, events)` with no random stream, and `fade(map, tick, shares)` after it. The story stream is the only seeded draw, as [simulation](simulation.md) specifies (`[worldSeed, mapId, tick, simulationVersion, 'narrative']`). Pixel Wars has its own simulation version (1) and content version (1) in its own package. A replay of any week from its order log reproduces its print exactly, and the harness asserts it.

## Leaderboards

The same boards as Desk Crawler after D202 (Today, This week, Lifetime) over XP, the same level groups, the same hourly immutable generation with Top 5, population and individual ranks from one publication. Beside them, read from the same publication, the **faction strip**: each faction's share of each map this hour and its change since the last. No scan of cells happens at query time; the publication writes the shares once per map.

## Achievements

A Pixel Wars catalog, versioned and appended as [achievements](achievements.md) requires, with rarity against the Pixel Wars population:

| Family | Counter | Tiers |
| --- | --- | --- |
| Painter | `cellsPainted` | 10 / 100 / 1,000 / 10,000 |
| Striker | `cellsFlipped` | 1 / 25 / 250 / 2,500 |
| Desks taken | `desksTaken` | 1 / 10 / 100 |
| Liberator | `desksLiberated` | 1 / 10 / 50 |
| Held | `deskFullHours` | 24 / 168 / 720 |
| Seasons | `seasonsPlayed` | 1 / 4 / 12 / 52 |
| Wins | `seasonsWon` | 1 / 3 / 10 |
| Underdog | `underdogFlips` (flips while in the smallest faction) | 10 / 100 / 1,000 |
| Recruiter | `invitesPlaced` | 1 / 5 / 25 |
| Night owl | `ordersAtNight` (orders resolved 00:00 to 05:00 local) | 10 / 100 |
| Levels | `level` | 4 / 8 / 12 / 16 / 20 |

The platform's Regular and Collector families count the fifth game as the others.

## Device

The screen route is per game (`/trmnl/pixel-wars/screen`), with its own payload version, templates and map renderer. The map is one PNG per layout, rendered by the backend from a stored snapshot, never scaled in the browser.

| Layout | Must retain | Simplification order |
| --- | --- | --- |
| Full | The whole map at a whole number of pixels a cell, own desk ringed; the strip (four swatches with share and arrow, own faction and desk state, ticker, story, season day and time to the bell, warnings, QR). A captured desk swaps the strip for the captor's panel and its QR | Story → ticker → season line → cell size (to the 10 px floor, then a window) |
| Half horizontal | A strip of the map 12 rows tall centred on the desk; faction shares; desk state; QR and warnings | Shares → cell size |
| Half vertical | A window of the map centred on the desk, as wide as the slot allows at 12 px; shares as four swatches; desk state; QR | Swatches → cell size |
| Quadrant | Desk state; four swatches with shares; a 12 × 6 window at 12 px; QR | Window → swatches |

Rendering rules, all measured in the pinned framework previews (D125):

- **Cell size.** `px = min(24, floor(min(slotWidth / cols, slotHeight / rows)))`, floored at 10. Below 10 the layout shows a window centred on the desk instead of the whole map. The X draws images at 1.8x, so the template asks for `slotWidth / 1.8` as the other games' scenes do, and patterns are designed to survive that one non-integer scale and the `screen--scale-*` modifiers (D165): strokes are never thinner than 2 px at 10 px cells and no pattern is a checkerboard.
- **Patterns, not polarity.** Factions are told apart by pattern alone, never by black against white, so the D181 adaptive image inverts cleanly on the Dark theme. Ground is paper. Fade is stroke density within a faction's pattern: full, two thirds, sparse outline.
- **Addressing.** `/art/pw/map/<mapId>/<tick>/<x0>,<y0>,<cols>,<rows>/<px>.png`, immutable per URL because the tick is in it. The handler reads the `pwMapTicks` snapshot for that map and tick (a packed byte per cell, at most 4,096 bytes), draws the window and encodes it one-bit. Snapshots are kept for the last eight ticks; an older URL answers 404 and the template's merge variables always carry the newest.
- **Own desk.** The ring is drawn by the renderer from a `desk` query parameter, so two players on one map get two images from one snapshot and the cache stays per URL.

Every state renders in the sweep: four factions holding, desk captured, desk shielded, season bell hour, cleared desk, first hour of a season on an empty map, every layout on OG and X, with and without the title bar, eight languages, Dark theme.

## Companion

Pages under `/pixel-wars/`: Map, Season, Rankings, Achievements, More. The Season page carries the player's invite link with the goal 5 line beside it. The Map page is the game. It draws the map on a canvas at phone width with pinch zoom, the player's desk centred on first open, and taps that queue orders with their cost shown before the tap confirms; a long press on a cell names the faction, its ink and who painted it last. The well, the countdown to the next tick and the queued orders sit above the map; the faction strip below. Only actionable things are shown (D167): a cell that cannot be targeted is not tappable and says why on long press, a shielded desk shows the hour its shield lifts, and a full well shows nothing about arrival. The companion checks at 390 and 320 wide in eight languages on the fixtures harness.

## Alerts

Three kinds on the shared push machinery, each opt-in as the others: **Desk taken** ("Hatch took your desk at 14:30", at most once in four hours), **Lead lost** ("Ink has lost the lead to Weave", at most once a day), **The bell** (Monday 00:05 UTC, the result and the print, once a week). A captured desk already shows on the device, so the first alert is for the player whose TRMNL is in the other room.

## Analytics

Events, with the usual properties and no cell coordinates: `pixel wars order queued` (kind, drops), `pixel wars desk taken` (attacker or defender), `pixel wars desk liberated`, `pixel wars invite placed`, `pixel wars print saved`, `pixel wars faction switched`. The engagement report counts a Pixel Wars player as having opened the companion when an order was queued (D213's owner rule).

## Data

| Table | Rows | Notes |
| --- | --- | --- |
| `pwMaps` | one row (the global map) | kind, size, spiral cursor, faction count, status; the shape private maps reuse in v1.1 |
| `pwMapTicks` | one per map per tick, last eight kept | the packed cell bytes, the four shares, the tick's events summary; the renderer and the device read this and nothing else |
| `pwDesks` | one per account per map | position, faction, counters, `lastScreenAt`, cleared flag, switch request |
| `pwOrders` | one per queued order | map, tick it targets, desk, cell, kind, drops; deleted when resolved or cancelled; indexed by map and tick |
| `pwWells` | one per desk | drops, `lastAccrualTick` |
| `pwSeasons` | one per map per week | standings, winner, print storage id |
| `pwInvites` | one per link | map, inviter desk, uses |

Every tick read is bounded by the map (one snapshot) and by the orders page (200 a page). Cell state lives in the snapshot, never one document per cell, so a map is one read and one write however many cells it has.

## Architecture

- **Package** `packages/pixel-wars` with `content`, `sim`, `art`, `i18n` and `templates`, pure and network-free like the other four.
- **Backend module** `apps/backend/convex/pixelWars/` owning the `pw` tables, its crons, its screen route, its art route and its intents. Crons at UTC minutes 3, 18, 33 and 48, the free slot after Desk Crawler (0), Idle Angler (5), Paper Lives (10) and Little Plot (12); its own watchdog and run guards; game-labelled health, notices and cost lines.
- **The tick.** One run per quarter-hour over all maps: for each map, page its orders for this tick into an accumulator on the run document (per cell, per faction drop totals; at most 4 × 4,096 × 2 bytes), then one mutation applies `resolve` and `fade` to the snapshot, writes the next `pwMapTicks` row and the per-desk event rows, and deletes the orders. Wells accrue lazily: a well's drops are computed from `lastAccrualTick` when read, so the tick writes nothing per player. XP credits happen only at the hourly publication, paged 100 desks at a time over desks with events this hour. A single poisoned order is skipped and reported, as a poisoned hero is.
- **Shared engine.** Everything already lifted is reused unchanged. One addition, backward compatible: the keepsake image machinery (D46) takes a storage id for a one-off image so the print can ride on it; Desk Crawler's keepsakes keep their current path.
- **Registry.** `packages/platform` adds `pixel-wars` to `games` and `GameSlug`; `clientIdEnv` is `TRMNL_CLIENT_ID_PIXEL_WARS` with its own secret. Status starts `hidden`; `preview` shows the Coming soon tile with Notify me (D201); `live` the day the marketplace approves the plugin.

## TRMNL

A separate marketplace plugin with its own OAuth client, listing image, knowledge-base URL and install and manage routes under `/connect/trmnl/pixel-wars/`. The same install → Save → activation → uninstall tombstone lifecycle. Submitting it is a separate authorized action and waits behind Idle Angler's listing and Little Plot's, as the roadmap orders them, unless Barry pulls it forward for the social launch.

## Art

Small, by design: four faction patterns at three densities and a desk variant of each, the desk ring, the shield glyph, the rosette, four swatch icons, the captured-desk panel frame, the print frame and about a dozen icons. The companion's colours live in `art/tones.ts`. There are no sprites, which is what lets this game ship in days rather than weeks.

## Balance and the harness

A 28-day harness over three maps (60, 200 and 440 desks) with the four visit policies (never visits; every three days; daily; twice daily) and a faction split of 40/30/20/10 at the start, each policy spending its well by a simple rule (liberate own desk first, then strike the faded enemy border nearest the desk, then stamp own border, then paint ground). Gates for W1:

| Gate | Target |
| --- | --- |
| Catch-up | The largest faction's share, averaged over any week, never exceeds 45% from a 40% start; the smallest never falls below 12% |
| Lead changes | At least two changes of the leading faction a week on the 200-desk map |
| Desks | A daily player's desk is taken no more than once in three days and liberated within a median 8 hours; a never-visits desk falls within three days and is liberated by faction-mates within two |
| Spend pattern | A daily player spending 48 at once and a twice-daily player spending 24 twice land within 10% of each other's XP |
| Night shield | No desk is ever taken inside its owner's shield; shielded hours cost the attacking faction under 5% of its week's flips |
| Young map | The 60-desk map is not decided by day three: the trailing faction holds at least 15% at the bell in half the runs, and every faction has at least one lead change in the first fortnight |
| Replay | Every run's print is reproduced from its order log byte for byte |

The harness sets the fade intervals, the underdog multiplier, the desk ink cap and the XP table; the numbers above are starting marks.

## Work slices

| Slice | Content | Gate |
| --- | --- | --- |
| W0 Engine | Registry entry, `gameSlug` unions, crons at 3/18/33/48, keepsake image storage id | The four games' test sets pass unchanged; a production tick of each completes clean after deploy |
| W1 Core | Content v1 (patterns, lines in eight languages), `resolve`, `fade`, placement spiral, the harness | Every gate in [Balance](#balance-and-the-harness) |
| W2 Backend | `pw` tables, activation and placement, tick, wells, intents (queue, cancel, switch, pause), publication and shares, season bell and print, screen and art routes, payload v1, deletion paths | convex-test matrix: a tick with contested cells, every order kind, a refused order and its refund, the fade at each rank, the shield by offset, a desk cleared and returned, the bell and the clean map, an invite placing a desk beside its inviter, activation, both deletion levels |
| W3 Device | Patterns and renderer, templates for four layouts on OG and X, captured panel, rosette | Preview sweep clean in every state, every map size, with and without the title bar, in eight languages, Dark theme too |
| W4 Companion | Map canvas and orders, Season, Rankings, Achievements, help, game page, switcher, launch list tile, 390 and 320 wide | Fixtures harness walkthrough with no horizontal overflow in eight languages |
| W5 Alerts and analytics | Invite links on the Season page, three alert kinds, analytics, privacy policy in eight languages | Alert tests by backend path; a real push on the dev keys; an invite link that places a desk beside its inviter in the inviter's faction |
| W6 Listing (Barry) | OAuth client, listing image, Barry's own install while hidden, preview, submission | Live install, render and uninstall on Barry's device |

## Versions after the MVP

| Version | Name | Content |
| --- | --- | --- |
| v1.1 | Offices | Private maps created from an Office page with an invite link and a cap of 64 desks: the same rules, tick and season; two factions (Ink and Hatch) up to eight desks and four from the ninth, existing desks assigned round-robin as it widens; the print offered to its own desks only; up to four maps a player, a desk on each, ink per player per map, each installation picking the map it shows; the creator can close it at the bell. Offices are the growth engine (fantasy leagues, Wordle groups) and the first thing to build once the global map has a week of real play. Moved out of the MVP by Barry on 2026-10-25 |
| v1.2 | Follow the sun | Ground cells painted by a player whose local time is daytime hold at full strength; cells of a sleeping faction fade at the next rank's rate. The terminator is drawn across the map. Mixed-timezone factions become the winning strategy and recruiting abroad the thing to do |
| v1.3 | Landmarks | Half a dozen named ground cells per map (the Fountain, the Lift, the Server Room) worth 5 a tick to whoever holds them, so the fight has places as well as borders |
| v1.4 | The hall | A hall of weeks on the game page: every global print, the winner, the week's best painter; faction all-time records |
| v1.5 | Floors | The global map shards into floors at 440 desks; a stairwell cell on each floor lets a faction's surplus cross |
| v2.0 | Invasions | Two offices agree a weekend match on a shared map; office standings; cosmetic nods between games (a hero's banner on a desk, the angler's fly as a pattern accent) |

## Not in the MVP

Private office maps (v1.1, at Barry's review on 2026-10-25), fog of war (opaque on a 15-minute screen and it moves the game onto Discord), structures and upgrades (progression is what the other games are for), pixel-art objectives judged by vote, taunts or any free text on the map, alliances between factions, ink purchases of any kind, a hill or throne mode (the shared map replaced it in the brainstorm), and hemisphere or real-calendar seasons.

## Decisions taken in this revision

Settled while drafting, each with the recommendation taken and the alternative passed over; Barry can reopen any of them.

1. **Desk per account, not per installation.** A player with three devices has one desk and three screens showing the map. The alternative (a desk per device) rewards buying hardware and breaks the "one account" promise.
2. **Four factions from day one.** Three would read more easily on e-ink but leaves no fourth to pile on. The harness's young-map gate checks that a 60-desk map with four factions still has a fight.
3. **Orders resolve at the tick, never live.** The suspense between ticks is the hook, and it matches how the device works. Live painting would make the phone the game and the device a lagging mirror.
4. **The fade, not a tax, is the catch-up.** It is visible, it needs no explaining beyond "ink fades, the leader's fades fastest", and it makes a map that nobody tends go quiet rather than freeze.
5. **Cumulative score decides the week; the final map is the print.** Scoring at the bell would make the week's play matter less than its last hour.
6. **Night shield on desks only.** Shielding ground would freeze the map for eight hours in each timezone's turn; shielding desks is what keeps the stake fair.
7. **No random draws in the core.** A contest you can reason about is the whole appeal of a slow strategy game, and a replayable week is a cheap print.
8. **Offices out of the MVP (Barry, 2026-10-25).** The global map is the product; offices are v1.1 and the data model carries `mapId` from the start so they cost no migration. Invite links stay in the MVP as the viral hook: a friend's desk lands beside yours, in your faction.
9. **No free text anywhere.** Names come from the moderated public alias and nothing else, so the game adds nothing to moderate.
10. **The name is Pixel Wars**, confirmed by Barry on 2026-10-25 over Ink Front, Hatch, Ground Ink, The Quarter Hour, Desk Wars and Inkfall.
11. **Players choose their faction (Barry, 2026-10-25).** The first draft assigned the smallest faction to protect balance; asked, Barry agreed that picking a side is half the fun. The fade and the underdog multiplier carry the balance, and the one guard is that a faction over 40% of desks closes to new choosers for the week. The harness already starts at the worst legal split, 40/30/20/10, so no gate changes.

## W0 and W1 build (2026-10-25)

W0 registers the game and W1 builds the core; nothing runs in production yet. Where the build departs from the text above, this section is the authority.

- **Registry.** `pixel-wars` is in `packages/platform` (`PIXEL_WARS_GAME`, `GameSlug`, the `games` entry, status `hidden`), in the backend's `gameSlug` validator, in the shell's game descriptions in eight languages, and in the lifecycle test. Route stubs exist for `/games/pixel-wars` and `/app/pixel-wars` (gated by `requireOpenGame`, so not-found for everyone but admins); the route tree was regenerated with TanStack's generator. The cron slot (3, 18, 33, 48) is W2's, with the backend module.
- **Package** `packages/pixel-wars` with `content` (v1, validation, achievements) and `sim` (types, map, resolve, goals). The `lib`, `art` and `templates` entries arrive with W3.
- **The map** is a bounded window over world cells with the lattice origin at cell 0,0, one byte a cell (faction in bits 0-2, ink in bits 3-5, the desk bit) and one seat number a cell for the painter. Desks are placed on a square spiral of lattice points; an invite takes the nearest free point to the inviter (Chebyshev, then Euclid, then spiral order). The window grows a ring at a time and never past 64 cells a side, which holds 441 desks.
- **Resolution** is one pure function with no draw: every order is checked against the map as the tick began; stamps reinforce first; attacks are summed per faction; the defence absorbs them or the top attacker claims with its surplus (ties leave ground). Three rules were settled by the tests and the harness beyond the text: the underdog rule needs a real gap (level pegging is nobody's underdog, and it is read among the factions with any presence, so it works with two factions as well as four); ink laid this tick does not fade this tick (the leader's claim at ink 1 could otherwise vanish in the same tick); and the night shield covers a desk that has faded to ground against everyone but its owner, since a shielded desk could otherwise be taken by a plain paint.
- **Goals** pay their XP the moment they are met and move the pointer on; there is no Claim button, because XP is standing, not economy (the text's D196 reference was written with coins in mind).
- **The print** will be rendered on demand from the season row's stored final cells, not from a file in storage, so the engine's keepsake machinery needs no change and the print of any past week costs one read.
- **Harness** (`pnpm balance:pixel-wars`, [evidence](evidence/pixel-wars-balance.json)): 60, 200 and 440 desks, 28 days, four policies, four time zones, a 40/30/20/10 split. Every gate passes: the leader averages 34 to 36% of held cells, the smallest 13 to 17%, four to eight lead changes a week on the 200-desk map, no shield breach, replay identical over 389,451 orders on the big map, daily and twice-daily XP within 5%. Two things to watch when real players arrive, neither a gate: the faction that starts with 40% of the desks wins every week's cumulative score (the fade keeps its share down, not its win), and the harness planner rarely strikes desks (0 falls a day for daily desks), so the desk-fall and liberation gates pass with little to measure. The 40% join guard and real players' appetite for taking desks should change both; the fade intervals and the underdog multiplier are the knobs if they do not.

## W2 build (2026-10-25)

The hidden backend on the shared engine: `apps/backend/convex/pixelWars/` with the `pw` tables, crons at 3, 18, 33 and 48, the lifecycle hooks, the tick, the intents, the XP boards, achievements, deletion and the shared profile section. Nothing serves a screen yet (W3). Where the build departs from the text above, this section is the authority.

- **The engine's subject is the desk.** `desks` is the engine table (one per account, `heroId` in the engine's names); the map is resolved once per run by the first desk of a page to reach it (`ensureMapTick`), which reads the tick's order board shards, runs the pure core, writes an immutable `pwMapTicks` snapshot and moves the `pwMaps` document on. Every other desk's step reads its own events off that snapshot. No engine change was needed.
- **Orders are aggregated at submission.** `queueOrder` holds the drops, writes the player's own `pwOrders` row for the queue and Cancel, and merges the order into one of eight `pwOrderBoards` shards for (map, tick), so the tick reads eight documents however many orders there are. An order targets the next run's tick, or the one after while a run is under way. Its drops come back at the tick if the target changed hands first (`refunded`), and a cancelled order returns them at once.
- **Faction choice.** A desk is prepared at install with no faction and no seat; `chooseFaction` (any open faction, or the inviter's by `invite` code) places an active desk at once and a pending one at TRMNL's Save. `switchFaction` applies immediately inside the hour after the bell, once a season, under the 40% guard, so the core's deferred `switchTo` is unused.
- **The bell** happens inside `ensureMapTick` on the first tick whose keepsake week passed the map's: the `pwSeasons` row (final cells for the print, standings, winner), `paintClean`, the running score reset. Each desk tallies its own season on its next step (`seasonWeek` behind the map's): the well refilled, `seasonsPlayed`, `seasonsWon` and the winner's XP for a desk that placed an order that week, the week's tallies reset.
- **Cleared desks** are judged hourly on publication runs from the owner's active Pixel Wars installations' `lastScreenServedAt` (two weeks silent clears the seat; a screen served again restores it on the next hour). The seat keeps its number and place for ever; a deleted account's seat stays as cleared ground, so the map never changes shape under anyone.
- **The shield** reads each seat's owner offset, carried on the map document's seat rows and synced hourly, so the pre-step needs no user reads; `queueOrder` refuses a shielded strike (or a paint on a shielded desk that faded to ground) before any drop is spent, with the hour it lifts left to W4's copy.
- **XP** is credited per tick for flips, desks taken and liberations, and on publication ticks for held cells and a full desk; goals pay the moment they are met. Levels follow the shared curve.
- **Shared files.** `gameHooks` (prepare and activate), the receipt scope, the analytics event `pixel wars started`, the connections name, deletion (its own job and the account job), the shared profile (`war` section: faction, pattern, the week, desks taken, seasons won), `alerts` (no kinds yet, W5), `maintenance` (`pwOrders` after two days, `pwMapTicks` after a day) and the install and uninstall routes.
- **Tests.** `tests/convex/pixel-wars-tick.test.ts` (empty world, placement by invite, a paint resolved once with its snapshot and line, a desk taken and liberated, hourly publication with held-cell XP and a dormant unplaced desk, the shield at order time, the bell) and `pixel-wars-lifecycle.test.ts` (install to placement, invite into a full faction, game deletion leaving the seat as cleared ground).
