# World events: the office calendar (P38)

Proposed 2026-10-13 after Barry chose the roadmap's v1.2 "World events" row as the next feature. He also set its shape: events follow the office holiday calendar (Thanksgiving, Black Friday, Christmas, New Year, Valentine's Day, Easter and so on) instead of being run by an admin, so they need no ongoing work and can be prepared well ahead. And the event should show up in the scene itself, which he called first prize for novelty. Nothing here is built. The open points at the end need Barry's call.

Companions: [the roadmap](roadmap.md) (the v1.2 row this replaces), [trmnl-experience](trmnl-experience.md) (the scene and its slots), [achievements](achievements.md) (the planned "world events survived" family), [quests](quests.md) (the stored `utc_offset` this reuses) and [the source brief](source-brief.md), whose "admin/cron 6–24h modifiers" this replaces with a fixed calendar.

## The idea in one paragraph

The game has a fixed calendar of **occasions**. On an occasion's date in the player's own timezone, every scene that hero shows is dressed for it: bunting or cobwebs along the ceiling, a seasonal prop on the floor, a hat on the hero, and snow, hearts or fireworks in the office window. When the hero has nothing in front of it, it stands beside the occasion's prop (a pumpkin, a wrapped gift) instead of an empty floor. The hero's first adventure that day writes one story line naming the occasion, and while it lasts one small, plainly stated bonus applies. Black Friday halves the merchant's prices, for example. All the dates are rules in the content catalog, so nobody has to switch anything on, and the whole year's art can be drawn and previewed months ahead.

## What the code already has

- **A cosmetic local clock on the scene.** The scene URL already carries `day` or `night`. `sceneUrlsAt` in `art/sceneTime.ts` picks it while the screen is being served, from TRMNL's `utc_offset` (`apps/backend/convex/http.ts`), not in the simulator. Occasion dressing is a second segment chosen in the same place the same way. Neither the stored payload nor the device template changes.
- **The player's offset on the server.** The to-do list (D112) stores the last TRMNL `utc_offset` on the user (`users.trmnlUtcOffset`), and the tick runner already passes it to the simulator as hero input. An occasion's gameplay window can read the hero's local date from that value, so evaluation stays pure.
- **Overlay sprites on the stage.** `scenePlacements` already adds sprites relative to the hero and the subject: the cloak for some poses, and the elite crown, which is placed generically from any monster's width and height. A hero hat and a monster hat use the same mechanism.
- **Named regions for colour.** Every drawn pixel has a region (`sceneColour.ts`), so on the colour panels Santa hats can be red and pumpkins yellow, and the companion paints them too.
- **One modifier sum.** `activeModifiers` adds up class, affix and effect modifiers in one place. An occasion is one more term in that sum.

## The calendar

Each occasion is a catalog rule with an id, a date rule, a length in local days, its dressing and at most one effect. The rule kinds are a fixed month and day, the nth weekday of a month (Thanksgiving), the Friday of a 13th, Easter-relative (computed), and a dated table for lunar holidays. If two occasions overlap, the catalog's order decides which one shows, and only one occasion is ever live at a time.

| Occasion | Date rule | Next date | Days | Dressing (scene) | Effect (starting point) |
| --- | --- | --- | --- | --- | --- |
| Halloween | 31 Oct | Sat 31 Oct 2026 | 1 | Cobwebs on the ceiling, a carved pumpkin, a witch hat on the hero, every monster in a sheet-ghost costume (elites keep the crown) | +15% gold |
| Friday the 13th | any Friday the 13th | Fri 13 Nov 2026 | 1 | A black cat on the floor, a cracked mirror on the office wall, flickering lights | −10% defense and +25% XP |
| Thanksgiving | 4th Thu of Nov | Thu 26 Nov 2026 | 1 | A potluck table, a paper-turkey garland | Heal 5% of max HP after each win |
| Black Friday | day after Thanksgiving | Fri 27 Nov 2026 | 1 | SALE signs, shopping bags | Merchant prices halved, merchant visits twice as likely |
| Christmas | 24 to 26 Dec | Thu 24 Dec 2026 | 3 | Tinsel, a small tree, snow in the office window, Santa hats on the hero and the monsters | One wrapped gift per hero per year: a gear find at the hero's floor tier |
| New Year | 31 Dec to 1 Jan | Thu 31 Dec 2026 | 2 | Party bunting, a party hat, fireworks in the night window | +20% XP |
| Valentine's Day | 14 Feb | Sun 14 Feb 2027 | 1 | A string of hearts, a card on the desk | +10% attack and defense |
| St Patrick's Day | 17 Mar | Wed 17 Mar 2027 | 1 | Shamrock bunting, a pot of gold | +15% gold |
| Easter | Good Friday to Easter Monday | Fri 26 Mar 2027 | 4 | Egg garland, a basket, bunny ears on the hero | +15% gold |
| April Fools' Day | 1 Apr | Thu 1 Apr 2027 | 1 | A whoopee cushion, a stapler set in jelly | Cosmetic only: prank story lines |
| Talk Like a Pirate Day | 19 Sep | Sun 19 Sep 2027 | 1 | A pirate hat and a paper parrot | Cosmetic only: pirate story lines |

Halloween is 18 days away, which makes it the obvious first occasion: it proves the whole pipeline against a real date, and on a dungeon game it's the costume holiday. Every effect uses a modifier kind the simulator already has, except Black Friday's price cut and merchant odds (one new modifier each) and Christmas's gift (a one-off grant, below). No effect changes raid odds, death or the career ladder.

**Gaps you may want filled (open point 3):** Lunar New Year (Sat 6 Feb 2027) and Diwali (dated table), Boss's Day (16 Oct, very office), Pi Day (14 Mar), a summer occasion that doesn't assume the northern hemisphere, and leap day.

## Rules

**Local dates.** An occasion runs over the player's local calendar days. Both the dressing and the effect use the same offset: the device request's `utc_offset` for the image, and the stored `users.trmnlUtcOffset` for the simulator, which is the same value once the screen route has stored it. With no offset, both read UTC, like the recap (D106). Changing timezone can stretch an occasion by at most the offset difference, and every rule below is either per adventure or once per occasion and year, so there's nothing to farm.

**The announcement.** A hero's first evaluation inside an occasion writes one story line from the occasion's list ("Someone has hung cobwebs over the printer."). The hero stores `lastOccasion: '<id>-<year>'` so the line and the `occasionsSeen` counter fire once. Paused and parked heroes get nothing and catch nothing up, like every other reward. A dead or sleeping hero still gets the line, so the device says why the scene changed.

**Effects.** Each occasion contributes one modifier set to `activeModifiers` while the hero's local date is inside it. There are no stacking rules to learn, because only one occasion is ever live. The companion's Hero page shows it as an effect chip with its plain number ("Black Friday: merchant prices −50%"), next to potions and affixes.

**Christmas gift.** This is the only grant. On the hero's first adventure on 24, 25 or 26 December it finds a gift box with gear at its floor's tier, keyed by `lastOccasion` so a year gives one gift. If the bag is full, it falls back to gold, as finds already do.

**Boards.** Occasions apply to every active hero over the same local days, so boards stay fair. A +20% XP day shows up in the recent-XP boards, which is intended.

## Scenes: the novelty

Dressing is drawn into the scene in four layers, all inside the fixed 152×40 stage, so every layout and scale gets them for free:

1. **Ceiling strip** (rows 0 to 4): bunting, tinsel, cobwebs or hearts, drawn per biome around each biome's existing ceiling detail (the office lamps, the server room's cables, the archive and garage pipes).
2. **Floor prop**: one sprite at a fixed per-biome anchor in the clear band between the hero (x 24) and the subject (x 92), so it never sits under a fight.
3. **Hats**: a hero hat placed from a per-pose head anchor, like the cloak's offset, for both classes' poses, with sleep and knockout poses putting it beside the hero. On the occasions that have one, a monster hat placed like the elite crown from each monster's own size, so twenty monsters need only one hat sprite.
4. **The office window**: snow, fireworks or hearts in place of the clouds and stars. The office is the only biome with a window, and it's where every hero starts.

On an occasion, the empty-handed scene (subject `none`, used after a lost raid and when idle with nothing to show) draws the occasion's prop where the subject would stand.

**URLs.** Scene version 5 adds an occasion segment after the time: `/art/scene/v5/<biome>/<day|night>/<occasion|plain>/<pose>/<subject>/<scale>.png`. Version 4 paths stay frozen, so cached screens and rolling deploys keep working. The serve-time choice lives next to `sceneTimeAt`, so nothing the tick stores names an occasion image.

**Device template.** It doesn't change. The image URL is rewritten while the screen is served, and the announcement arrives as a story line. That means no ZIP upload and no sync-bot round trip. The roadmap's "world-event banner" isn't needed (open point 2).

**Companion.** Its painted scene draws the same occasion, chosen by the server from the stored offset so it matches the device. A small "Next occasion" line on the Hero page ("Halloween in 18 days") and a help section list the calendar and its effects. Previews gain an `--occasion` flag so every occasion can be checked on all four layouts and both panel inks long before its date.

## Achievements

A new catalog version appends an Office calendar family, read from the hero's `occasionsSeen` counter: on duty for 1, 5 and 11 occasions. It's account-keyed like every family, and it fills the "world events survived" slot that achievements.md already plans.

## Work slices

1. **W1 Calendar and rules.** Occasion rules in the catalog as content v19, a pure `occasionAt(content, at, offset)`, validator checks (ids unique, one live at a time, rules resolve for the next ten years), `lastOccasion` and `occasionsSeen` as additive hero fields, effects in `activeModifiers`, the two Black Friday modifiers, the Christmas gift, story lines, and harness runs over a calendar year to confirm a year of occasions moves the day-90 level and gold medians by less than 3%.
2. **W2 Scene pipeline with Halloween.** Scene v5 paths and parser, the four dressing layers, head anchors for every pose of both classes, the monster hat, the occasion prop as subject, colour regions, serve-time selection, `--occasion` previews on all four layouts and both inks. Halloween's art ships here, deployed before 31 October.
3. **W3 Companion.** The painted scene with the server's occasion, the effect chip, the Next occasion line, a help section, and an `occasion` property on existing analytics events.
4. **W4 The rest of the year's art.** Authored in date order, each deployed and preview-checked at least a week before its date. Friday the 13th, Thanksgiving and Black Friday come next, before 13 November.
5. **W5 Achievements and docs.** The catalog version, achievements.md, gameplay, help and data-model.

## Open points for Barry

1. **Small effects (recommended) or dressing only.** A one-line bonus gives players a reason to look on the day, and it's stated as a plain number. Dressing only would be simpler still, and fits your rule of removing mechanics players can't grasp. The effects are cheap to drop later, because they're catalog rows.
2. **No banner (recommended) or a banner row on the device.** The scene plus one story line already announce the occasion, and a banner means a template change on four layouts with the ZIP upload each time.
3. **The calendar.** Take the eleven in the table and say which of the gaps to add. Lunar New Year and Diwali widen it beyond a Western calendar, and Boss's Day is the most office-flavoured option. Thanksgiving is US-only, but it's in because you asked for it.
4. **Local dates (recommended) or UTC.** Local dates mean the dressing appears at the player's midnight, which is what a holiday feels like, and the to-do list already relies on the stored offset. UTC is simpler, but Christmas would start at 02:00 for you and at 19:00 on Christmas Eve in California.
5. **Halloween by 31 October as the first deliverable (recommended).** W1 to W3 with Halloween's art are about a week of work, which leaves room for previews and Barry's look before the date.
6. **Slow Cast later.** The calendar rules live in the shared content shape, so Slow Cast's waters can be dressed afterwards (snow on the lake, a pumpkin on the jetty). That would be its own small proposal, after Desk Crawler's occasions prove out.
