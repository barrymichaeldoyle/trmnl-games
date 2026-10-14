# World events: the office calendar (P38)

Proposed 2026-10-13 after Barry chose the roadmap's v1.2 "World events" row as the next feature. He also set its shape: events follow the office holiday calendar (Thanksgiving, Black Friday, Christmas, New Year, Valentine's Day, Easter and so on) instead of being run by an admin, so they need no ongoing work and can be prepared well ahead. And the event should show up in the scene itself, which he called first prize for novelty. Barry approved it the same day with every recommendation (D139). He added one idea of his own: on Friday the 13th, raids should go wrong for both sides ([below](#friday-the-13th-every-raid-goes-wrong)). [Settled points](#settled-points) records the answers. W1 (the calendar, effects, announcement, gift and raid mishaps) is built as content v19, and the scene dressing for all eighteen occasions (W2 and W4) as scene version 5; [changes while building](#changes-while-building) lists where they differ from this spec.

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

Each occasion is a catalog rule with an id, a date rule, a length in local days, its dressing and at most one effect. The rule kinds are a fixed month and day, the nth weekday of a month with an optional day offset (Thanksgiving; Black Friday and Take Your Dog to Work Day are offsets from one), the Friday of a 13th, Easter-relative (computed), and a dated table for Lunar New Year and Diwali. The table's dates are checked against a published calendar when they are authored, ten years ahead. If two occasions overlap, the catalog's order decides which one shows, and only one occasion is ever live at a time.

| Occasion | Date rule | Next date | Days | Dressing (scene) | Effect (starting point) |
| --- | --- | --- | --- | --- | --- |
| Halloween | 31 Oct | Sat 31 Oct 2026 | 1 | Cobwebs on the ceiling, a carved pumpkin, a witch hat on the hero, every monster in a sheet-ghost costume (elites keep the crown) | +15% gold |
| Diwali | dated table | Sun 8 Nov 2026 | 1 | A row of clay lamps along the ceiling, a rangoli pattern on the floor | +15% XP |
| Friday the 13th | any Friday the 13th | Fri 13 Nov 2026 | 1 | A black cat on the floor, a cracked mirror on the office wall, flickering lights | Every raid goes wrong for both sides, and raids start twice as often ([below](#friday-the-13th-every-raid-goes-wrong)) |
| Thanksgiving | 4th Thu of Nov | Thu 26 Nov 2026 | 1 | A potluck table, a paper-turkey garland | Heal 5% of max HP after each win |
| Black Friday | day after Thanksgiving | Fri 27 Nov 2026 | 1 | SALE signs, shopping bags | Merchant prices halved, merchant visits twice as likely |
| Christmas | 24 to 26 Dec | Thu 24 Dec 2026 | 3 | Tinsel, a small tree, snow in the office window, Santa hats on the hero and the monsters | One wrapped gift per hero per year: a gear find at the hero's floor tier |
| New Year | 31 Dec to 1 Jan | Thu 31 Dec 2026 | 2 | Party bunting, a party hat, fireworks in the night window | +20% XP |
| Lunar New Year | dated table | Sat 6 Feb 2027 | 1 | Paper lanterns, a red envelope on the desk | +15% gold |
| Valentine's Day | 14 Feb | Sun 14 Feb 2027 | 1 | A string of hearts, a card on the desk | +10% attack and defense |
| Pi Day | 14 Mar | Sun 14 Mar 2027 | 1 | A pie on the desk, digits of pi on the whiteboard | +14% XP |
| St Patrick's Day | 17 Mar | Wed 17 Mar 2027 | 1 | Shamrock bunting, a pot of gold | +15% gold |
| Easter | Good Friday to Easter Monday | Fri 26 Mar 2027 | 4 | Egg garland, a basket, bunny ears on the hero | +15% gold |
| April Fools' Day | 1 Apr | Thu 1 Apr 2027 | 1 | A whoopee cushion, a stapler set in jelly | Cosmetic only: prank story lines |
| Take Your Dog to Work Day | Friday after the 3rd Sunday of June | Fri 25 Jun 2027 | 1 | A dog sitting beside the hero, a water bowl | +10% defense |
| Talk Like a Pirate Day | 19 Sep | Sun 19 Sep 2027 | 1 | A pirate hat and a paper parrot | Cosmetic only: pirate story lines |
| International Coffee Day | 1 Oct | Fri 1 Oct 2027 | 1 | A coffee machine, a steaming mug on every desk | +10% attack |
| Boss's Day | 16 Oct | Fri 16 Oct 2026 | 1 | A "World's Best Boss" banner, a mug with a bow on it | Cosmetic only: boss story lines |
| Leap Day | 29 Feb | Tue 29 Feb 2028 | 1 | A frog on the filing cabinet, a calendar page with an extra square | +29% gold |

Halloween is 18 days away, which makes it the obvious first occasion: it proves the whole pipeline against a real date, and on a dungeon game it's the costume holiday. Every effect uses a modifier kind the simulator already has, with three exceptions: Black Friday's price cut and merchant odds (one new modifier each), Christmas's gift (a one-off grant, below) and Friday the 13th's raid mishap (a third raid outcome, below). No effect changes the raid win odds, the death rule or the career ladder.

Eighteen occasions in all, about one every three weeks. Boss's Day falls on Friday 16 October 2026, three days after approval; the art for all eighteen was finished the same day, so it is the first occasion players see. Diwali on 8 November is the second deadline after Halloween. Take Your Dog to Work Day is the summer occasion because it doesn't assume a hemisphere. Barry's rule for the list is that more is better: cutting an occasion later means deleting its row, and a stored `lastOccasion` key for a deleted occasion matches nothing and costs nothing. Sponsored occasions could take a row's place later. They would need their own check against TRMNL's terms, since D134 covered only a sponsor link.

## Rules

**Local dates.** An occasion runs over the player's local calendar days. Both the dressing and the effect use the same offset: the device request's `utc_offset` for the image, and the stored `users.trmnlUtcOffset` for the simulator, which is the same value once the screen route has stored it. With no offset, both read UTC, like the recap (D106). Changing timezone can stretch an occasion by at most the offset difference, and every rule below is either per adventure or once per occasion and year, so there's nothing to farm.

**The announcement.** A hero's first evaluation inside an occasion writes one story line from the occasion's list ("Someone has hung cobwebs over the printer."). The hero stores `lastOccasion: '<id>-<year>'` so the line and the `occasionsSeen` counter fire once. Paused and parked heroes get nothing and catch nothing up, like every other reward. A dead or sleeping hero still gets the line, so the device says why the scene changed.

**Effects.** Each occasion contributes one modifier set to `activeModifiers` while the hero's local date is inside it. There are no stacking rules to learn, because only one occasion is ever live. The companion's Hero page shows it as an effect chip with its plain number ("Black Friday: merchant prices −50%"), next to potions and affixes.

**Christmas gift.** This is the only grant. On the hero's first adventure on 24, 25 or 26 December it finds a gift box with gear at its floor's tier, keyed by `lastOccasion` so a year gives one gift. If the bag is full it is held and the hero sleeps until there is room, as with any gear find.

### Friday the 13th: every raid goes wrong

This is the one occasion that changes a system instead of adding a bonus. Barry's idea: both sides of a raid lose to some unfortunate event.

- **When.** The raider's local date decides, because the raid resolves in the raider's evaluation. A raid launched on Friday the 13th is a mishap even if the target applies it on Saturday.
- **More raids.** Launch chances double for the day (balanced 10‰ becomes 20‰), so most active heroes from level 7 are caught in at least one mishap from one side or the other. Targeting and the 24-tick cooldown don't change.
- **No contest.** A mishap replaces the win/lose roll, so nobody wins. Both sides lose `ceil(20% of maximum HP)` and `floor(5% of current gold)`. The gold goes nowhere: nothing changes hands, and the day works as a small gold sink. Thrifty gear takes its five points off as it does for any gold loss.
- **Knockouts.** A mishap can knock a hero out under the ordinary death rule, like any raid. The harness reports mishap knockouts per stance, and the 20% share is tuned against that number.
- **Apply path.** Unchanged. The raider applies its side in its own evaluation, and the target applies the ledger row at its next one. The ledger's outcome gains `mishap`, and the target's gold loss is its own 5%, clamped to what it holds.
- **Draws.** The mishap needs no new random draw. The contest draw (position 4) is still taken and then ignored, so the `raid` stream's later positions don't move. Older catalogs have no occasion rules and replay unchanged.
- **Story lines.** Each side reads a concrete accident with the other hero's name, from a short list: "The sprinkler went off over **Quill**'s desk mid-raid. You both got soaked." and from the target's side "**Baz** came to raid the desk just as a ceiling tile came down on you both." Others: the fire drill, a coffee spill across both keyboards, the shredder eating the loot. The gold and HP chips sit beside the line as usual.
- **Counters and scene.** A new `raidMishaps` counter, separate from launched, won, repelled and lost, so the win/loss record is untouched and the Hero page's raid list shows a mishap as its own entry. The device scene after a mishap shows the hero standing beside the black cat.

### Boards

Occasions apply to every active hero over the same local days, so boards stay fair. A +20% XP day shows up in the recent-XP boards, which is intended.

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

A new catalog version appends an Office calendar family, read from the hero's `occasionsSeen` counter: on duty for 1, 6 and 12 occasions. The top tier stops short of all eighteen because Leap Day comes once every four years. It's account-keyed like every family, and it fills the "world events survived" slot that achievements.md already plans. One single-tier achievement, Thirteenth Floor, goes to a hero caught in a Friday the 13th mishap, read from `raidMishaps`.

## Work slices

1. **W1 Calendar and rules.** Occasion rules in the catalog as content v19, a pure `occasionAt(content, at, offset)`, validator checks (ids unique, one live at a time, rules resolve for the next ten years), `lastOccasion` and `occasionsSeen` as additive hero fields, effects in `activeModifiers`, the two Black Friday modifiers, the Christmas gift, the Friday the 13th mishap (raid outcome, ledger value, counter and lines), story lines, and harness runs over a calendar year to confirm a year of occasions moves the day-90 level and gold medians by less than 3%, with mishap knockouts reported per stance.
2. **W2 Scene pipeline with Halloween.** Scene v5 paths and parser, the four dressing layers, head anchors for every pose of both classes, the monster hat, the occasion prop as subject, colour regions, serve-time selection, `--occasion` previews on all four layouts and both inks. Halloween's art ships here, deployed before 31 October.
3. **W3 Companion.** The painted scene with the server's occasion, the effect chip, the Next occasion line, a help section, and an `occasion` property on existing analytics events.
4. **W4 The rest of the year's art.** Authored in date order, each deployed and preview-checked at least a week before its date. Diwali comes next, before 8 November, then Friday the 13th before 13 November, then Thanksgiving and Black Friday.
5. **W5 Achievements and docs.** The catalog version, achievements.md, gameplay, help and data-model.

## Changes while building

W1, built 2026-10-13 as content v19 ([evidence](evidence/world-events.md)):

- **Mishaps aren't launches.** A raider's mishap counts only in `raidMishaps`, not in `raidsLaunched`, so the record's "raids failed" (launched minus won) stays exact. v19's "Take part in a desk raid" goal adds `raidMishaps` to its counters so a mishap still counts as taking part.
- **A full bag holds the gift.** The Christmas gift is an ordinary gear find, so a full bag holds it and the hero sleeps, instead of the gold fallback this spec first described. The gift waits for a free adventure: a career guarantee due that tick goes first, and a bag or pouch find that tick moves the gift to the next adventure.
- **The announcement is a log kind of its own.** `occasion` lines change nothing, so they carry no chips. The device draws them with the system glyph (unknown kinds fall back to it), so the device template doesn't change. They don't steer the next story variant, like to-do and career lines.
- **The line is picked by tick, not drawn.** Announcement lines use no random draw, so a tick on an occasion takes exactly the draws it would take without one, and an ordinary day on v19 replays v18 exactly.
- **Effects are snapshotted where they apply.** Black Friday's prices are fixed when a merchant visit opens and hold for the whole visit, even past midnight.
W2 and W4, built 2026-10-13 as scene version 5 (`art/occasions.ts`; review sheets with `pnpm tsx tools/art/occasions.ts .previews/occasions [--contact]`):

- **The payload picks the occasion, not the screen route.** `buildPayload` already holds the catalog, the time and the device's offset, so it writes the occasion into every scene URL, and the screen route still only swaps the sky. The companion's hero page and the public profile and its card take the occasion from the owner's stored offset; the companion's painted scene and the social card read it from the path.
- **Halloween's monsters wear witch hats**, not sheet-ghost costumes: one hat sprite fits all twenty monsters, a costume would need twenty. Christmas gives them Santa hats and New Year party hats; an elite keeps its crown instead. A hat sits on the monster's topmost row, so on the trolley swarm and the barrier golem it lands on the handle and the raised arm.
- **One prop, two places.** The floor prop stands at column 66 between the hero and its foe, and in the foe's place when the stage is otherwise empty, rather than drawing a second sprite.
- **Garlands can spell.** Black Friday hangs SALE cards, Boss's Day BOSS cards and Pi Day a π then the digits of pi, in a 3×5 figure set; the other garlands hang one motif. Friday the 13th, April Fools' Day and Leap Day have no garland.
- **Hero hats** for Christmas, New Year, Halloween, St Patrick's Day (a top hat), Easter (bunny ears), April Fools' Day (a jester's hat) and Talk Like a Pirate Day (a tricorn), on every pose of both classes; lying down, the hat stays on the head on the pillow.
- **Window views** for Christmas (snow and a drift on the sill), New Year, Diwali and Lunar New Year (fireworks) and Valentine's Day (hearts); the other occasions keep the day or night sky.
- **Four-ink panels** print each hat and prop in one ink from its companion colour (Santa hats red, the pumpkin, tree and pot of gold yellow); garlands and window views stay in black like the backdrop.
- **Previews** take `--occasion <id>` (`tools/trmnl/preview.ts`); the device template is unchanged and the sweep of the Halloween previews passed on every layout and device.
W3 and W5, built 2026-10-13:

- **No browser analytics event.** Occasions happen in the simulation, like raids, so the planned `occasion` property on browser events was dropped; `admin:engagement` counts announcements, heroes who saw one, mishaps and each hero's last occurrence from game data instead.
- **The companion's calendar** is a gold chip for today's occasion beside the effects and a "Next on the office calendar" line, both on the owner's last TRMNL date; the help page lists every occasion with its date in words and its bonus, read from the catalog.
- **Achievements** are catalog version 9: Office calendar at 1, 6 and 12 occasions and Thirteenth Floor for a mishap.
- **Diwali's table runs to 2031.** Lunar New Year's runs to 2036. Both come from published calendars and need extending before they run out.

## Settled points

Barry approved every recommendation on 2026-10-13 (D139):

1. **Small effects**, one per occasion, as catalog rows that are cheap to drop.
2. **No banner.** The scene and one story line announce the occasion, and the device template stays as it is.
3. **The eighteen occasions in the table.** The first draft had eleven. Barry then added the candidates (Lunar New Year, Diwali, Boss's Day, Pi Day, Leap Day and a summer occasion) on the grounds that more is better and occasions can be cut later in favour of sponsored ones.
4. **Local dates**, from the stored `utc_offset`, falling back to UTC.
5. **Halloween by 31 October** as the first deliverable: W1 to W3 with Halloween's art.
6. **Idle Angler later**, in its own small proposal.

Barry's addition: Friday the 13th's effect is the raid mishap above, in place of the drafted −10% defense and +25% XP.
