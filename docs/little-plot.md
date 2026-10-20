# Little Plot: a cosy garden that grows on your TRMNL (P46)

Proposed 2026-10-20 for Barry's review. This is the full specification for the fourth TRMNL Games title, a pixel art garden simulator that grows on the desk display and is tended from the shared companion. The idea came from Barry's wife, who plays the games: a cosy garden where you grow rare plants and find seeds, something comes for your garden now and then (gnomes, mostly, sometimes another player), and the gear you buy makes the garden better. Barry chose the name Little Plot on 2026-10-20 from a long list; [Decisions taken in this revision](#decisions-taken-in-this-revision) records the open points settled while drafting. **Proposal only: nothing is approved or built.**

Settled with Barry on 2026-10-20 before drafting: the cosy tone; seeds and rare plants as the hook; pests as gentle setbacks and gnomes as the antagonist; other players as an occasional, kind intrusion rather than a war; equipment that changes the garden rather than the player; seasons short and shared with Idle Angler so a player sees variety within weeks, not months.

The game reuses what [Idle Angler](idle-angler.md) and [Paper Lives](paper-lives.md) lifted out of Desk Crawler: the quarter-hour tick, the pure seeded simulator, bounded cohort reads, receipted intents, achievements over counters, the hourly publication and the D202 calendar boards, the TRMNL lifecycle with the `hidden`, `preview` and `live` status, the launch list (D201), push alerts, the weekly device code, follows and the rival (D143), the eight languages (D193, D200) and the two-level deletion boundary. Where this spec says "as Desk Crawler" or "as Idle Angler", the named document is the authority and Little Plot inherits the rule unchanged.

## The idea in one paragraph

Every player has one little plot: four beds to begin with, twelve at most. A seed sown in the companion grows on the desk one stage at a time, whether or not anyone is watching: sown, sprout, leaf, bud, ripe. The sky and the weather over the plot are the same ones Idle Angler's anglers fish under at the Millpond, and the four seasons turn on the same Mondays, a whole year in four weeks. Rain waters the beds for free; a visit with the watering can speeds everything up for a few hours. When a plant is ripe the player picks it in the companion for coins and a few seeds of its kind. Two kinds growing side by side can cross, and the seed that comes of it is a plant nobody can buy: the rare and epic plants are all discovered this way, and the catalogue, with its silhouettes and hints, is the long game. At night slugs, a fox and the gnomes come. They set a bed back a stage or pinch a seed from the tin, never more, and the fence, the lantern and the garden cat keep most of them away. Now and then the gnome is another player's, and the seed it took turns up in their tin with your name on it. A ripe plant left alone for half a day goes to seed by itself and the bed resows, so nothing is ever lost but the coins, and a plot nobody visits for a fortnight is still green when they come back.

## How it is different from the other three games

| | Desk Crawler | Idle Angler | Paper Lives | Little Plot |
| --- | --- | --- | --- | --- |
| Progress | A hero that levels for ever | A logbook that fills for months | Finite lives, then the next generation | A catalogue of plants, filled by discovery |
| The player's role | Gear, floors, stances, raids | Setup: water, bait, selling | Decisions, and when a year ends | Placement: what grows next to what, and when |
| Device | Pixel scene with a board | Pixel scene with the catch | A portrait and a diary column | A pixel plot seen from above, the weather and the season over it |
| Social | Boards, raids, meetings, friends | Per-water records, Opens, profile | Album, family tree, life pages | Gnomes that carry seeds between gardens, cuttings sent to friends, public plot pages |
| Economy | Gold, shop, workbench | Coins, tackle | Money as one stat; no shop | Coins, the shed; seeds as the second currency, which coins cannot buy past uncommon |
| Antagonist | Monsters and elites | The one that got away | Time | Slugs, the fox, the gnomes |

## What a player sees

- **Device:** a 1-bit top-down scene of the plot, each bed drawn at its stage with the plant's own sprite at bud and ripe, the sky band for the local time of day, the weather, and the season's dressing on the hedge round the plot (blossom, full leaf, falling leaves, bare twigs and snow). The fence, scarecrow, lantern, pond, beehive and bird table appear where they are bought, the cat sits where it likes, and a gnome is drawn mid-escape on the tick it visited. A header with the public alias and level, a status line ("Spring at the plot, dusk, light rain"), the newest story ("The Nasturtium is in bud. A slug had a go at the Lettuce."), level and XP, the ripe count (2 of 6 beds ripe), the season and the day it turns, the seven-day Top 5 with the player's own row, service warnings and the companion QR code. When half or more of the beds are ripe the board gives way to a quiet panel ("3 beds ripe: pick them in the companion") with a QR code to the Plot page, as Idle Angler's full cooler does.
- **Companion:** a Plot page (the scene painted in colour, the grid of beds to tap, Water the plot, the goal line and the season banner), a Seed Tin (every seed held, with count, rarity and where it came from), the Shed (seeds, tools, beds, defences, structures, ornaments), the Catalogue (every kind with count grown, best harvest, first-grown date, the parents once known; unknown kinds as silhouettes with a hint), Rankings, Achievements and More (pause, public profile, send a cutting, help, delete Little Plot progress). Settings and Account are shared.
- **Help page:** `/help/little-plot` explains that the plot grows on its own, that a ripe plant waits and then goes to seed and resows itself, that pests set a bed back and never destroy it, which seeds a gnome can and cannot take, what the seasons and the weather do, and how crossing works.
- **Public profile and plot page:** the shared profile at `/profile/<public name>` lists Little Plot when opted in (public by default, D144): the plot as it stands, the level, the catalogue count, the rarest plant grown and the achievement families. Public pages return the same not-found for missing, private and suspended names (D109).

No streaks, no daily login, no wilting, no dead plants, no watering that must happen or something is lost, no gnome that can empty the tin. The only pressure is a bed that is ripe and waiting, and a bed that waits long enough looks after itself.

## Rules

### The plot and its starting state

| Field | Starting value / meaning |
| --- | --- |
| Name | The account's public alias; a plot has no separate name |
| Level / XP | 1 / 0; lifetime XP kept separately |
| Coins (the `gold` field) | 0 |
| Beds | 4, in a 2 × 2 grid; the plot grows to 2 × 3, 3 × 3 and 3 × 4 through the shed |
| Sown at the start | Marigold, Lettuce, Radish, Nasturtium, one per bed, all at the `sown` stage |
| Seed tin | Marigold 2, Lettuce 2, Radish 2, Nasturtium 2 |
| Tools | A tin watering can (waters the plot for 16 ticks) |
| Defences and structures | None |
| Watered until | Tick 16 (the plot starts freshly watered) |
| Status | `growing` |
| Catalogue | Empty: a plant enters it when it first ripens, not when it is sown |
| First log | "You've been given a little plot. Four beds, a tin can and a packet of seeds." |

Activation is TRMNL-exclusive as in Desk Crawler (D09): the plot is pending until a verified saved installation of the Little Plot plugin, and an installation of another game does not activate it. One plot per account, kept across uninstalls, as [product](product.md) rules for heroes.

### Status

`growing`, `paused` (owner's choice, nothing grows, no pests, no XP) and `pending`. There is no resting, travelling or dead state. Ripe beds do not change status.

### The tick

Once per eligible tick, resolved by the pure core in this order:

1. **Conditions.** Time band from the owner's last TRMNL `utc_offset` (D112), UTC without one (D106): dawn 05:00 to 08:00, day 08:00 to 17:00, dusk 17:00 to 20:00, night 20:00 to 05:00. The season from the UTC week (below). The weather from the shared forecast (below). A Rain block waters the plot for its duration.
2. **Growth.** Every bed with a plant gains growth: base 1 point a tick × the season multiplier × the weather multiplier × 1.5 when watered × the structure bonus (compost, greenhouse). A stage takes a quarter of the kind's `growTicks`; a bed advances a stage when its points reach the next quarter. Reaching `ripe` enters the kind in the catalogue (count, first tick) and awards XP = the kind's XP, doubled the first time that kind ripens on this plot. Several beds can advance in one tick; the story names at most two and says "and two more".
3. **Going to seed.** A bed that has been ripe for 48 ticks (twelve hours) goes to seed: one seed of its kind into the tin (the tin holds at most 20 of a kind; past that the seed is "left for the birds" and nothing is added), and the bed resows itself at `sown`. One volunteer bed in ten resows a different common kind instead ("Something the wind brought in"), drawn from the commons in season, so a plot nobody visits still meets new plants. A volunteer bed never makes a cross. No coins are paid for a plant that goes to seed, which is the whole cost of being away.
4. **Pests.** At most one pest event per tick, one `pest` draw against the band's base chance × the product of the owned defences' multipliers for that pest, floored at ×0.1. The pest, its effect and its line are in [Pests](#pests-and-the-gnomes). A paused plot has no pests.
5. **The other player's gnome.** Night ticks only, one `visitor` draw, resolved as [Gnomes from other gardens](#gnomes-from-other-gardens).
6. **Ambient.** Every fourth tick with nothing to say writes one line from the `narrative` stream (the robin on the fork handle, the smell after rain, a bee working the Lavender), so the device story never goes stale for more than an hour.

Sowing, picking, watering and shop commands never cause growth or a reward on their own, and there is no catch-up for missed ticks (as [simulation](simulation.md)).

### Seasons

The season is the world's, on the shared calendar: a year of four weeks, one season a week from Monday 00:00 UTC, the season being the keepsake week number modulo four, exactly as Idle Angler's (D162). Every garden is in the same season as every water, so "Autumn at the plot until Monday" and "Autumn at the waters until Monday" are the same Monday. Barry asked on 2026-10-20 for short seasons so a player sees variety in a short time; one season a week already gives a whole year a month, and the weather turns every six hours inside it.

| Season | Growth | What changes |
| --- | --- | --- |
| Spring | ×1.1 | Sowing season: every kind can be sown. Blossom on the hedge. Volunteers favour flowers |
| Summer | ×1.25 | Fastest growth; Sunny blocks are commoner and dry the plot sooner. Full leaf |
| Autumn | ×1.0 | Harvest pays ×1.2 coins. Pumpkins and gourds only ripen in autumn or in the greenhouse. Falling leaves |
| Winter | ×0.6 for hardy kinds; tender kinds **pause** in a Frost block | Bare hedge and snow. A Frost block is a Clear night block in winter. The greenhouse bed ignores winter entirely. A Silver Lavender bed at `bud` or `ripe` through a Frost block may be left a Frost Rose seed |

Kinds carry a `hardy` flag and a `sowSeasons` window. A seed sown out of its window grows at ×0.5 until its season arrives rather than failing: the companion says so on the sow button ("Slow until spring"). Nothing dies and nothing closes.

### Weather and the shared forecast

The plot sits by the Millpond. Its weather is Idle Angler's Millpond forecast, read from the same function with the same inputs (`[worldSeed, 'forecast', 'millpond', blockKey]` in UTC six-hour blocks, D162's season-shifted tables), so the rain on an angler's screen is the rain on the gardener's. The world seed is Idle Angler's, read once per tick run from `iaWorldState` and passed into the pure core as an input; the garden's own per-plot seed is its own. The companion and the device read the same function, so no tick writes weather and the simulator stays pure.

| Condition | Growth | Also |
| --- | --- | --- |
| Clear | 1.0 | In winter at night this is Frost |
| Overcast | 1.0 | Slugs like it: slug chance ×1.5 |
| Rain | 1.2 | Waters the plot for the block; birds stay away (×0.5) |
| Fog | 1.0 | Night-blooming kinds (Moon Marigold, Ghost Pansy, Moonflower) treat dawn and dusk as night; gnome chance ×1.3 |

The Millpond table has no Wind, so the garden has none. Every multiplier is a catalog number tuned by the harness.

### Watering

Watering is a boost, never a requirement. "Water the plot" in the companion sets `wateredUntilTick` to now plus the can's ticks (tin can 16, brass can 32, hose 64, hose with a timer 96) and is refused with a plain message while the plot is already watered for longer than that. A Rain block waters the plot until the block ends if that is later. Watered beds grow at ×1.5. An unwatered plot grows at ×1.0 whatever the sky, and nothing ever wilts.

### Plants

Thirty-six kinds at launch in three groups (flowers, vegetables, herbs), each with rarity, `growTicks` (sown to ripe, before multipliers), XP, coins at harvest, seeds returned at harvest, `sowSeasons`, `hardy`, an optional `night` flag and, for a cross, its two parents. Growth times before multipliers: common 24 to 40 ticks (6 to 10 hours), uncommon 48 to 72 (12 to 18 hours), rare 96 to 144 (one to one and a half days), epic 192 to 288 (two to three days). A watered summer bed is roughly twice as fast; an unwatered winter one about half.

| Rarity | Kinds | How they are had |
| --- | --- | --- |
| Common (14) | Marigold, Nasturtium, Radish, Lettuce, Sunflower, Cornflower, Chives, Mint, Pea, Poppy, Pansy, Spinach, Daisy, Carrot | The shed sells them; harvests return 2 to 3 seeds; volunteers bring them |
| Uncommon (10) | Tomato, Lavender, Strawberry, Foxglove, Rosemary, Pumpkin, Sweet Pea, Dahlia, Courgette, Thyme | The shed sells them from level 3 at a higher price; harvests return 1 to 2 seeds |
| Rare (8) | Moon Marigold (Marigold × Poppy, night), Candy Carrot (Carrot × Strawberry), Blue Poppy (Poppy × Cornflower), Midnight Tomato (Tomato × Foxglove), Giant Pumpkin (Pumpkin × Sunflower), Silver Lavender (Lavender × Daisy), Honey Pea (Pea × Sweet Pea), Gnome's Cap (not a cross: the seed a caught gnome drops) | Never sold. Crosses return exactly 1 seed at harvest, so a line is kept going by replanting, not hoarded |
| Epic (4) | Moonflower (Moon Marigold × Ghost Pansy, night), Dragon Gourd (Giant Pumpkin × Midnight Tomato, autumn or greenhouse), Golden Sunflower (Sunflower × Honey Pea, needs the beehive), Frost Rose (a Silver Lavender bed through a winter Frost block) | Never sold; 1 seed at harvest |

Ghost Pansy (Pansy × Mint, fog or night) is the eighth rare in place of Gnome's Cap when the harness finds the gnome trap too slow a source; the build decides which two of the nine named here go where. Each kind has about six story lines across its stages and events, written in the cosy register, with the plant name marked for translation so each language keeps its article and gender (D193).

### Crossing

When a bed reaches `ripe`, the core looks at its four orthogonal neighbours. For every neighbour at `bud` or `ripe` whose kind forms a known pair with this one, a `cross` draw at 25% (beehive ×2, capped at 60%) marks the bed `crossed` with the child kind. A `crossed` bed is drawn with a small star on the device and in the companion, and its harvest returns the child's seed in place of one of its own. The cross is decided at ripening, so the device can tell the story ("The Marigold by the Poppy has set a seed you don't recognise.") and the player picks it knowing. A bed that goes to seed uncrossed loses nothing; a `crossed` bed that goes to seed puts the child seed in the tin and resows the parent, so even an absent player keeps the discovery. Volunteers never cross.

The catalogue shows each uncrossed kind as a silhouette with a hint. Before either parent has been grown the hint is a riddle in the content ("Likes company at the end of the row"); once one parent has ripened on this plot the hint names it ("Grows from a Poppy and one other"); once both have, both are named. The pairs are fixed content, the same for everyone, so players can share them, and that is intended.

### Picking and the shed

Picking a ripe bed pays its coins (×1.2 in autumn) and puts its seeds in the tin, enters the harvest in the catalogue (count, biggest harvest value), and empties the bed. Picking several at once is one intent with one receipt ("Pick all ripe"), as Idle Angler's sell-many. An empty bed grows nothing and attracts nothing; the companion shows it with its sow button and the device draws bare soil. Sowing takes a seed from the tin and starts the bed at `sown`.

The shed sells, with prices the harness sets around these starting marks:

| Group | Items |
| --- | --- |
| Seeds | Common kinds 8 to 15 coins a seed, uncommon 40 to 80 from level 3. The shed never sells a rare or epic seed |
| Tools | Brass can 120, hose 600, hose timer 2,000; a trowel at 300 that sows a whole row from one tap |
| Beds | 2 × 3 at 250, 3 × 3 at 900, 3 × 4 at 2,500 |
| Defences | Copper tape 60 (slugs ×0.2), netting 90 (birds ×0.2), ladybird tub 75 (aphids ×0.3; lasts a season, so a small recurring sink), fence 200 (fox ×0.3, gnomes ×0.8), scarecrow 350 (birds ×0.6, gnomes ×0.6), lantern 400 (gnomes ×0.5 at night), garden cat 1,200 (fox ×0.5, gnomes ×0.5, drawn in the scene), gnome trap 500 (see below), wind chimes 150 (gnomes ×0.9; mostly for the look) |
| Structures | Compost bin 700 (growth ×1.1 on every bed), beehive 1,500 (cross chance ×2; a bee line now and then), pond 1,000 (frogs: slugs ×0.5; a heron line once a season), bird table 450 (one random common seed in the tin a day; birds ×1.5), greenhouse 3,000 (one chosen bed ignores season and frost; a second at 6,000 once the plot is 3 × 4) |
| Ornaments | A bench 200, a path 150, a gnome of your own 300 (a decoy: real gnomes ×0.9), a sundial 250. Cosmetic, drawn in the scene |

Coins are the binding constraint in the first fortnight and seeds afterwards: a daily player owns the useful shed by about day 25 in the harness's first target, after which the rare lines and the epics are what is left to want.

### Progression and goals

XP per ripening: common 10, uncommon 25, rare 60, epic 150, doubled the first time a kind ripens. Levels follow the engine's shared curve (`packages/engine/src/levels.ts`). One current goal as Idle Angler's (D196: reached goals pay through the Claim button, one at a time, with the D128 once-per-rung guarantees):

| # | Goal | Met when | Guarantee | Coins |
| --- | --- | --- | --- | --- |
| 1 | Watch the first sprout | any bed reaches `sprout` | | 10 |
| 2 | Pick your first plant | `harvests` ≥ 1 | the first bed to ripen is ripe within 8 hours of activation | 25 |
| 3 | Water the plot | `waterings` ≥ 1 | | 20 |
| 4 | Sow a seed | `sowings` ≥ 1 | | 20 |
| 5 | Grow all four starters | catalogue has the four | | 40 |
| 6 | Buy a Sunflower seed | shed purchase of a seed | unlocks the shed's seed shelf at level 2 | 30 |
| 7 | Sow a Poppy next to a Marigold | the pair is adjacent | | 50 |
| 8 | Find a cross | `crossesFound` ≥ 1 | the first adjacent known pair to ripen crosses, once | 100 |
| 9 | Fence the plot | fence owned | unlocks defences at level 3 | 60 |
| 10 | Catch a gnome | `gnomesCaught` ≥ 1 | the first gnome after the trap is bought is caught | 150 |
| 11 | Six beds | plot is 2 × 3 | | 100 |
| 12 | Ten kinds in the catalogue | `kindsGrown` ≥ 10 | | 150 |
| 13 | Grow a plant in every season | `seasonsGrown` has all four | | 200 |
| 14 | Keep bees | beehive owned | | 200 |
| 15 | Grow a rare in a greenhouse | | | 300 |
| 16 | Find an epic | `epicsFound` ≥ 1 | | 500 |

Goals 1 to 8 are the first three days of a daily player in the harness; goal 8's guarantee is what makes the discovery loop arrive by day three, which Barry's brainstorm note called the thing to be careful about. The ladder is append-only, as every ladder (D135).

### Pests and the gnomes

One pest draw a tick against the band's base chance: night 2%, dawn and dusk 1%, day 0.5%, which is about one event a day on an undefended plot and one every three or four days behind a fence, tape and netting. The pest is drawn from the band's table; its effect is always a setback, never a loss of the plant.

| Pest | When | Effect | Defences |
| --- | --- | --- | --- |
| Slugs | night, overcast | one bed at `sprout` or `leaf` goes back a stage | copper tape, pond |
| Aphids | day, summer | one bed grows at ×0.5 for 8 ticks | ladybirds |
| Birds | day, dawn | one seed of a common kind leaves the tin, or a `ripe` bed loses one of its harvest seeds | netting, scarecrow, rain |
| The fox | night | one bed at any stage below `ripe` goes back two stages; the bench is knocked over for a tick, cosmetically | fence, cat |
| A gnome | night, dusk | one of: a seed leaves the tin (a kind with at least two in it; never rare or epic), a plant at `sown` or `sprout` is moved to an empty bed, or an ornament is turned round | lantern, cat, scarecrow, fence, chimes, decoy gnome |
| The heron | once a season at most, pond owners | takes a frog: slugs ×1.0 for a day; a line and nothing else | none, by design |

The gnome trap gives the gnome a 40% chance of being caught instead. A caught gnome gives back whatever it took, drops a Gnome's Cap seed one time in four, ticks `gnomesCaught`, is drawn in the scene in the trap for the next hour, and is let go. Gnomes are the only pest that gets commoner as the plot grows: +0.5% at night for each bed past six, because "they've heard about your garden". The lantern, cat and scarecrow are drawn where the player put them, so the device shows the defences working when the morning line says "A gnome came as far as the lantern and thought better of it."

### Gnomes from other gardens

Barry asked for other players "sometimes, randomly", so the gnome that comes in the night is now and then another player's. This reuses Desk Crawler's raid pool shape (D110) and nothing else from raids: no stances, no knockouts, no ledger of damage.

- **The pool.** Each publication writes a bounded `lpGnomePool` of plots active in the last seven days with a public profile, by level group, as the raid pool does. A plot with a private profile is in no pool and sends and receives no gnomes; this is the opt-out, and the help page says so.
- **The draw.** On a night tick, after the pest draw, a `visitor` draw at 1% (lantern ×0.5, cat ×0.5, decoy ×0.9, floor ×0.2) picks a plot from the same level group's pool, never the player's own and never the same plot twice in a week. That is one visit every three nights undefended, one in twelve with the lantern and the cat.
- **The seed.** The visiting gnome takes one seed from a kind with at least two in the tin, common or uncommon only, never rare or epic, never the last of a kind. The seed is added to the other plot's tin tagged `from <public name>` (the tin keeps at most eight tags; older ones become plain seeds), and both plots get a line: "A gnome in a red hat left with a Cornflower seed. Wren's garden, by the look of it." and "A gnome came home with a Cornflower seed from Barry's plot." If the tin has nothing it may take, the gnome "wanders round and leaves" and both lines say so.
- **The trap.** A trapped visiting gnome gives the seed back, drops one common seed from its own garden's tin (again, a kind with two or more; nothing if none) tagged from that garden, and is let go. The other player reads "Your gnome was caught in Barry's trap and came back without its Daisy seed."
- **The rival.** A player's D143 rival, when the rival has a public Little Plot in any level group, is chosen in place of the pool draw one visit in three. Nothing else about rivals changes.
- **Sending a cutting.** On the More page a player picks a followed account with a public Little Plot and a seed from the tin (any rarity, their choice) and sends it, once a day. It lands tagged `cutting from <public name>` with a line on both sides. This is a direct, receipted mutation, not a tick event, and it is the one way a rare seed moves between gardens.

No seed is ever destroyed by a visit; the world's seeds only move. A plot that is paused is not in the pool.

### Determinism and versions

Per-plot seed as [simulation](simulation.md): SHA-256 of `[worldSeed, plotId, tick, simulationVersion, streamName]`, Mulberry32, six streams `growth` (volunteer kind and the wind), `cross`, `pest`, `visitor`, `trap` and `narrative`. The forecast is Idle Angler's function with Idle Angler's world seed, passed in as an input. The season comes from the tick's UTC time. Little Plot has its own simulation version (1) and content version (1) in its own package and never shares a catalog number with another game. Replays of every past content version must stay identical.

## Leaderboards

The same boards as Desk Crawler after D202 (Today from 00:00 UTC, This week from Monday 00:00 UTC, Lifetime) over XP, the same level groups, the same hourly immutable generation with Top 5, population and individual ranks from one publication. A plant that goes to seed earned its XP at ripening, so a player who never visits still ranks; what they forgo is coins. A "rarest plant this week" board is not in the MVP; the catalogue and the achievements cover it, and a weekly Show is listed under [Versions after the MVP](#versions-after-the-mvp).

## Achievements

A Little Plot catalog, versioned and appended as [achievements](achievements.md) requires, with rarity against the Little Plot population. Launch families:

| Family | Counter | Tiers |
| --- | --- | --- |
| Harvests | `harvests` | 1 / 10 / 100 / 1,000 |
| Catalogue | `kindsGrown` | 4 / 10 / 20 / 30 / 36 |
| Crosses | `crossesFound` | 1 / 5 / 15 |
| Epics | `epicsFound` | 1 / 4 |
| Gnomes caught | `gnomesCaught` | 1 / 10 / 50 |
| Gnomes seen off | `pestsDeterred` (a pest draw that failed against a defence) | 10 / 100 / 1,000 |
| Night garden | `nightRipenings` | 1 / 25 / 250 |
| Rain | `rainWateredTicks` | 100 / 1,000 |
| Coins earned | `goldEarned` | 100 / 1,000 / 10,000 / 100,000 |
| Waterings | `waterings` | 1 / 25 / 250 |
| Levels | `level` | 4 / 8 / 12 / 16 / 20 |
| Beds | `beds` | 6 / 9 / 12 |
| Seasons | `seasonsGrown` (a bit set) | 4 |
| Visitors | `gnomesHosted` (another player's gnome, either way) | 1 / 10 / 100 |
| Cuttings | `cuttingsSent` | 1 / 10 |
| Pressed flowers | `pressed.totalCollected` | 1 / 6 / 12 / 24 |
| Per kind | `catalogue[id].count` | First grown; ten grown |

About 72 kind tiers and 50 counter tiers. The platform's Regular and Collector families count the fourth game as the others.

## Device

The screen route is per game (`/trmnl/little-plot/screen`), with its own payload version, templates and scene composer. Layouts follow the [display rules](trmnl-experience.md#display-rules) with the garden's contents:

| Layout | Must retain | Simplification order |
| --- | --- | --- |
| Full | Scene (the plot from above with every bed at its stage, the hedge in its season, the sky band, the weather, the structures and the cat, a gnome if one came this tick), alias and level, status line, newest story, XP bar, ripe count, season and the day it turns, seven-day Top 5 with own row, warnings, companion QR; half the beds ripe swaps the board for the ripe panel and its QR | Season line → coins → older stories → scene scale |
| Half horizontal | Alias and level, status line, newest story, ripe count, QR and warnings | Second story → XP → scene scale |
| Half vertical | Alias and level, status line, newest story, ripe count, QR and warnings | Older stories → XP → scene scale |
| Quadrant | Alias and level, ripe count, QR, newest outcome or setup message and warnings | Scene first; no board |

The plot is drawn as a grid of bed tiles with a one-tile hedge border, so a 2 × 2 plot and a 3 × 4 plot both fit the stage: the tile scale is chosen by plot size per slot width (D125). Each kind has a `bud` and a `ripe` sprite; `sown`, `sprout` and `leaf` use three shared sprites per group (flower, vegetable, herb) so the art count stays near 36 × 2 + 9 rather than 36 × 5. Night recap on layouts with room: "Night: 2 ripened, a slug at the Lettuce, a gnome seen off." The scene is `image--adaptive` from the first template (D181).

## Companion

Routes under `/app/little-plot`: Plot, Tin, Shed, Catalogue, Rankings, Achievements, More; Settings and Account are shared. Empty, pending, paused, disconnected and error states follow [companion](companion.md). Mobile first at 390 wide and checked at 320. Help at `/help/little-plot`, public game page at `/games/little-plot`. The Plot page paints the device's scene in colour through the shared `sceneColour` route (D120) and lays the tappable grid over it: tap a ripe bed to pick, an empty bed to sow (the tin opens as a sheet, seeds in season first), any bed to see its kind, stage, time to the next stage and neighbours. "Pick all ripe" and "Water the plot" sit under the grid and hide when there is nothing to do (D167: only what can be acted on). The season banner names the season and the day it turns. All eight languages from the first build, with plant names carrying their article and gender per language (D193), since a new game ships translated before review (D200).

## Staying on the TRMNL: pressed flowers

The device footer shows the weekly code (D46), claimed in the companion for one **pressed flower** in a permanent scrapbook on the More page: one per account per week, cached-screen grace, no penalty, no XP or ranking effect. The newest pressed flower hangs in the shed window in the device scene, cosmetic only, the way the fly sits on the angler's hat. A seasonal set of 24 and the Pressed flowers family give it an end.

## Alerts

Two opt-in kinds under the D114 machinery, off by default, with the same quiet hours, caps and device rules: `beds_ripe` (30 minutes after half or more of the beds are ripe, once per fill, held through quiet hours) and `new_seed` (when a seed of a kind never grown on this plot lands in the tin, from a cross, a gnome, a cutting or the bird table, once per kind, dropped in quiet hours). Both are things the player can act on. Preferences are per game; devices are shared.

## Analytics

Consent-gated, as the others: `little plot started`, `plant picked` (rarity), `seed sown` (rarity, season), `plot watered`, `shed bought` (group, item), `cross found` (kind), `gnome caught`, `cutting sent`, `catalogue viewed`, plus the shared alert and profile events. No per-tick events.

## Data

New tables prefixed `lp`, as Idle Angler's `ia` and Paper Lives' `pl`. Shared tables gain the game where they already carry a slug.

- `littlePlotProfiles` `{ userId, plotId }`, one per user.
- `plots`: owner, level, xp, lifetimeXp, gold, status, beds (at most 12: `{ kindId?, stage, points, ripeSinceTick?, crossedKindId?, slowUntilTick?, greenhouse }`), rows and columns, tin `{ kindId → count }` (at most 36 keys), tags (at most 8: `{ kindId, from }`), `wateredUntilTick`, tools, defences and structures (a bounded set of item ids), `ladybirdsUntilTick?`, catalogue `{ kindId → { count, best, firstTick } }`, goal pointer and waiting rewards (the D196 shape), counters, publicProfile, activation fields, lastTick, eligibleFromTick, createdAt. Indexes `by_owner`, `by_createdAt`. The whole plot is one document, so a tick and an intent each touch one row.
- `lpGnomePool`: the raid pool shape (level group, plotId, owner's public name, written at publication, bounded per group).
- `lpVisits`: plotId, otherPlotId, kindId, direction, tick, caught; index `by_plotId_and_tick`; at most 30 per plot, trimmed on write, so the More page can show the week's comings and goings.
- `lpTickLogs`, `lpWorldState`, `lpSimulationRuns`, `lpSimulationFailures`, `lpLeaderboardPublications`, `lpAchievements`, `lpAchievementStats`: the engine shapes with `heroId` read as the plot id.
- Shared: `users` (plus a `littlePlotAlerts` block), the TRMNL tables (`gameSlug` widens), `follows`, `operationReceipts`, `rateLimitBuckets`, `pushSubscriptions`, `alertOutbox`, `gameDeletionJobs`, `platformGames`, `launchList` (D201, game-scoped already).

Deleting Little Plot progress revokes its installations, denies its authority and purges the `lp` tables and the profile, leaving the account and the other games untouched; tags on other players' seeds that name the deleted account are rewritten to plain seeds by the purge. Account deletion runs all four purges then the Clerk deletion.

## Architecture

- **Package** `packages/little-plot` with `content`, `sim`, `art`, `i18n` and `templates`, pure and network-free like the other three.
- **Backend module** `apps/backend/convex/littlePlot/` owning the `lp` tables, its crons, its screen route and its intents. Crons at UTC minutes 12, 27, 42 and 57, the free slot after Desk Crawler (0), Idle Angler (5) and Paper Lives (10); its own watchdog and run guards; game-labelled health, notices and cost lines. The tick run reads `iaWorldState` once for the shared forecast seed.
- **Shared engine.** Everything S0 lifted is reused unchanged. Two small additions, both backward compatible: the forecast function moves from the Idle Angler package into `packages/engine` so both games import one implementation, and the raid pool writer takes its table name as a parameter, as the tick runner already does. Idle Angler's and Desk Crawler's tests must pass unchanged.
- **Registry.** `packages/platform` adds `little-plot` to `games` and `GameSlug`; `clientIdEnv` is `TRMNL_CLIENT_ID_LITTLE_PLOT` with its own secret. Status starts `hidden`; `preview` shows the Coming soon tile with Notify me (D201); `live` the day the marketplace approves the plugin.

## TRMNL

A separate marketplace plugin with its own OAuth client, listing image, knowledge-base URL and install and manage routes under `/connect/trmnl/little-plot/`. The same install → Save → activation → uninstall tombstone lifecycle. Submitting it is a separate authorized action, after Idle Angler's review, so the reviewer sees a platform with two live games.

## Art

1-bit, hand-authored like the others: nine shared early-stage sprites, 72 plant sprites (bud and ripe for 36 kinds), a bed tile at three states (bare, sown, mulched), four hedge dressings, the four sky bands and three weather overlays from the shared art package, about fourteen shed items drawn in the scene (fence, scarecrow, lantern, cat in three poses, trap with and without a gnome, pond, beehive, bird table, greenhouse, compost bin, bench, path, sundial, decoy gnome), a gnome in two poses (escaping, trapped), a fox, a robin, 24 pressed flowers, and about twenty icons. The art count is again the largest single cost and the reason launch content is capped at 36 kinds. The companion paints the same sprites in colour from `art/tones.ts`; the device never sees a colour.

## Economy and the harness

A 60-day harness over 300 plots with the Desk Crawler policies (never visits; every three days; daily; twice daily), each policy sowing by a simple rule (pick all ripe, sow the rarest seed in season it holds, place known pairs adjacent once the hint names both parents, buy the cheapest unowned useful item). Gates for G1:

| Gate | Target |
| --- | --- |
| First ripe plant | median under 7 hours for every policy; under 8 hours for 95% (goal 2's guarantee) |
| First cross | by day 3 for the daily and twice-daily policies (goal 8's guarantee); by day 7 for the three-day policy |
| Catalogue, daily player | 14 commons by day 10; 24 kinds by day 30; 30 by day 60 |
| Catalogue, never visits | 8 to 12 kinds by day 60 through volunteers and the wind; XP keeps it on the boards |
| Epics | each epic found by a third of daily plots within 60 days; Frost Rose by a quarter (it needs a winter week) |
| Coins | the useful shed (beds to 3 × 3, fence, tape, netting, lantern, compost, beehive) owned by the daily player between day 20 and day 30; the greenhouse by day 40; never a stall where nothing can be bought for a week with nothing to discover |
| Pests | about one event a day undefended, one in three to four days with fence, tape and netting; stage setbacks never cost a daily player more than 5% of ripenings |
| Visits | one other-garden gnome every three nights undefended, one in twelve with lantern and cat; seeds in the world are conserved exactly |
| Ripe waiting | the three-day policy sees at least half its ripenings go to seed, so the device's ripe panel is often true for that player and never for the twice-daily one |

The harness sets every price, chance and growth time; the numbers above are starting marks.

## Work slices

| Slice | Content | Gate |
| --- | --- | --- |
| G0 Engine | Forecast function into `packages/engine`; pool writer parametrised; registry entry, `gameSlug` unions, crons at 12/27/42/57 | Desk Crawler, Idle Angler and Paper Lives test sets pass unchanged; a production tick of each completes clean after deploy |
| G1 Core | Content v1 (36 kinds, pairs, pests, defences, lines in eight languages), pure core, six streams, harness | Every gate in [Economy](#economy-and-the-harness) |
| G2 Backend | `lp` tables, profile, tick, intents (sow, pick, pick all, water, buy, send cutting, pause, resume), the pool and visits, screen route, payload v1, deletion paths | convex-test matrix: tick, each intent, duplicate receipts, going to seed, a cross, each pest, a visit both ways, a trapped visit, activation, both deletion levels, the tag rewrite on purge |
| G3 Device | Art, scene composer with the tile scale per plot size, templates for four layouts on OG and X, recap, ripe panel | Preview sweep clean in every state, every plot size, every season, with and without the title bar, in eight languages, Dark theme too |
| G4 Companion | Pages, help, game page, switcher, launch list tile, 390 and 320 wide | Fixtures harness walkthrough with no horizontal overflow in eight languages |
| G5 Boards and badges | Rankings, achievement catalog v1, profile and public plot page | Publication consistency tests; profile not-found parity |
| G6 Alerts, flowers and analytics | Two alert kinds, pressed flowers on the D46 machinery, events, privacy policy in eight languages | Alert tests by backend path; a real push on the dev keys |
| G7 Listing (Barry) | OAuth client, listing image, Barry's own install while hidden, preview, submission | Live install, render and uninstall on Barry's device |

Progress preservation applies from the first public install, as every release.

## Versions after the MVP

| Version | Name | Content |
| --- | --- | --- |
| v1.1 | The Show | A weekend Show at the village hall like Idle Angler's Opens: one category a week (heaviest Pumpkin, best Dahlia), rosettes on a shelf, a board from one publication |
| v1.2 | Visitors | Friendly visits: a followed player's robin or bee drawn in your scene; a shared allotment board for friends; the rival's gnome gets a name |
| v1.3 | More ground | The 4 × 4 plot, a second greenhouse, a cold frame that starts seeds early, a shed upgrade that shows the tin on the device |
| v2.0 | The second season | 24 more kinds including a herb garden line and tree fruit that takes a whole year, a wildflower meadow bed that attracts butterflies with their own catalogue, and night-time scenes with the moths |
| Later | Cosmetic nods between games: a hero's cardigan on the scarecrow, the angler's fly as a pressed flower, Paper Lives' gardener hobby reading the catalogue |

## Not in the MVP

- Any plant dying, wilting, rotting or being eaten whole: never.
- Trading seeds for coins between players, a market, or any way to buy a rare seed.
- Weather or seasons of the garden's own: it shares the Millpond's and the world's.
- Pets beyond the cat; a dog; livestock.
- Gnomes that do damage worth defending against with anything but gear: there is no gnome fight, no stance, no knockout.
- A basket or stall between picking and coins: picking pays at once (settled below).

## Decisions taken in this revision

Settled while drafting on 2026-10-20, with recommendations rather than open questions, as Barry prefers settled decisions handed over.

1. **Four beds to start, twelve at most.** Four fills the quadrant scene and gives the first cross (goal 7) a pair to place without buying a bed. Twelve keeps the plot document small and the scene legible on the OG at the half-horizontal width.
2. **The first cross is guaranteed by day three** through goal 8's once-per-rung guarantee, and the shed's seed shelf opens at level 2 so the Poppy is affordable on day one. Barry flagged the slow first week as the thing to be careful about; this settles it the way D199 settled Idle Angler's first fish.
3. **Other players' gnomes are in the MVP, drawn from a pool; the rival is favoured one visit in three; sending a cutting is in the MVP.** Rival-only PvP would leave most players with no visitors, since few have a rival; pool visits make the "sometimes randomly other players" Barry asked for true for everyone with a public profile. A private profile opts out of both directions. No seed is ever destroyed, only moved, so the harness can assert conservation.
4. **The weather is Idle Angler's Millpond forecast and the seasons are the shared four-week year.** One climate for the world, so an angler and a gardener comparing screens agree, and no new forecast to tune. The forecast function moves into the engine package to make the sharing real rather than copied.
5. **Picking pays at once; there is no basket.** A basket would be a second place to visit for no decision; Idle Angler's cooler earns its place because fish have weights worth comparing before selling. Seeds are the inventory that matters here, and the tin is that.
6. **A ripe bed goes to seed after twelve hours and resows itself, one in ten as a different common.** The never-visiting plot keeps growing, keeps ranking and slowly meets new plants, and the only thing an absent player loses is coins, which is Idle Angler's rule for a full cooler.
7. **Rare and epic seeds come only from crossing, the trap, the frost and cuttings.** If the shed sold them the catalogue would be a shopping list. The harness has to prove the epics arrive for a third of daily players within 60 days without the shed.
8. **Pests set back and never destroy.** A stage lost is a few hours; the fox's two stages is the worst case and a fence makes it rare. This is the no-deaths rule from the other games, applied to plants.
