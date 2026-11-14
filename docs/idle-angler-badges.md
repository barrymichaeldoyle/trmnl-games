# Idle Angler badges: icons, the wall and the moment you earn one (P48)

Proposed 2026-11-14 after Barry asked for icons on Idle Angler's achievements, an achievements wall, and a celebration when someone earns one, on the TRMNL and in the companion. Proposal only: nothing is approved or built.

## What is there now

- 22 tiered families (Catches, Big ones, Night fishing, Orders, Medals, Mastered waters and the rest) and two tiers for each of the 58 species, about 175 ids under catalog version 6.
- The companion's Achievements page is a text list per category: the highest tier's name, "tier 2 of 4", the share of anglers, and a progress line. Species are a list of names.
- The device shows an unlock only as a story line behind the 8x8 trophy glyph ("3 achievements: Specimen Perch, First Perch, A Kilo Fish"). A fish is cast every quarter hour, so the line has scrolled off within an hour or two, often before the screen refreshes.
- Nothing tells a player in the companion that they earned something since they last looked.

## The proposal in one line

Every family gets a pixel badge, the tier gets a frame, the Achievements page becomes a wall of those badges, and a new badge is celebrated once in the companion (a card with confetti on the Dock) and held for six hours on the TRMNL as a badge panel.

## 1. Badges

- **One 16x16 1-bit badge per family**, drawn in the same cell-string style as `IA_MARKS`, in a new `packages/idle-angler/src/art/badges.ts`. A first pass of the 22 subjects:

  | Family | Badge |
  | --- | --- |
  | Catches | a float, tip up |
  | Big ones | a spring balance with a fish on the hook |
  | Rare catches | a fish with a sparkle |
  | Epic catches | a fish wearing a crown |
  | Got away | a snapped line, curled |
  | Night fishing | a hissing lamp |
  | Released | a fish over a ripple, hands beneath |
  | Logbook | the open book with a pencil |
  | Waters | a folded map with a pin |
  | Rods | a rod with its line bent |
  | Coins earned | a coin stack |
  | Sales | a price tag on a fish |
  | Flies | a tied fly |
  | Orders | the fishmonger's slate |
  | Deadbait | a pike's jaw |
  | Trophies | a fish on a wooden plaque |
  | Opens | a rosette |
  | Medals | a medal on its ribbon |
  | Seasons | a leaf, a snowflake, a sun and a blossom in quarters |
  | Runs | three fish swimming in a line |
  | Rosettes | three rosettes on a line |
  | Mastered waters | the map pin with a crown |

- **Species badges reuse the fish sprites** the logbook and the scene already draw, so the 58 species need no new art.
- **The tier is the frame**, not a new picture: tier 1 a plain ring, 2 a double ring, 3 a notched ring, 4 a ring with four studs, 5 a laurel. Frames are 1-bit so they read on the device. In the companion the frame also takes a colour per tier from the game's inks (copper, silver, gold, then the two top tiers in the sky and XP inks). A species' first catch is the plain ring and its specimen the laurel.
- **Locked** is the outline only, dotted, like the logbook's unseen silhouettes.
- One art source draws all three places: an SVG component in the companion (as `FishIcon` does), a PNG from the art route for the device (`/art/ia/badge/v1/<family>/<tier>/<scale>.png`, family and tier allowlisted, whole-number scales only, as every other IA art path), and the public profile.

## 2. The wall

The Achievements page (Log tab → Achievements) becomes a wall:

- **Top:** earned out of total, and the five most recent badges in a row, newest first.
- **Then the five categories** as now (Fishing, Logbook, Progress, Trade, Species), each a grid of badge tiles: four across at 390 wide, more on wider screens. A tile shows the family's highest earned badge in its tier frame with the tier as pips under it, or the locked outline with a thin progress bar toward tier 1. The tile carries no text but the family name, so the wall reads as a wall.
- **Species** is a grid of fish badges in logbook order: silhouette until the first catch, ring for the first, laurel for the specimen. Its heading keeps the count ("31 of 58 species").
- **Tapping a tile** opens a sheet: the badge large, the family's tiers in a row (earned in ink, the rest outlined), the earned tier's name and blurb, the date it was earned, "held by 12% of anglers", and the progress line to the next tier ("Night Owl: 14 of 25").
- A tile earned since the player last opened the wall carries a small New tag until they leave the page.

## 3. Celebrating in the companion

- **Seen marker.** A new optional angler field `achievementsSeenAt`. Every unlock with `unlockedAt` after it is new. An absent field reads as the release time of this change, so nobody who already holds 80 achievements gets 80 celebrations on the first visit.
- **On the Dock**, above the goal card, a celebration card for new badges: the badge pops in with the existing confetti burst (`lib/confetti.tsx`, as the fly box and goal claims do), its name, blurb and share of anglers. A badge held by 5% of anglers or fewer adds "Rare: held by 3% of anglers". Several new badges show as the best one (highest tier, then the rarest) with "+ 2 more" and the others as small badges in a row. **See the wall** opens the wall; **Nice** dismisses. Either one sets `achievementsSeenAt` through a receipted intent (`idleAngler.achievements.markSeen`), so the card shows once, on whichever device the player opens first.
- **A dot** on the More tab and on the Achievements link while anything is new.
- The card waits behind anything the player has to act on (a bare hook, a full cooler, a goal to claim) and never covers it: it is a card in the page, not a modal.

## 4. Celebrating on the TRMNL

- **The badge panel.** For six hours after an unlock, the payload carries `badge { family, tier, name, more }` for the best new badge (highest tier, then the rarest, then the newest). Six hours outlasts the 15-minute refresh and a few skipped ones, and an angler earning several in a day sees each strong one for a while.
- **Full layouts** draw the badge at 3x (4x on the X) beside an inverted "Achievement" label and its name, in the slot the newest-catch panel uses, and the catch panel comes back when the window closes. On BWRY the frame prints in yellow and the label in red, as the Desk Crawler celebration badge does.
- **Half and quadrant layouts** draw the badge at 2x before the name on one inverted line above the stories, like Desk Crawler's celebration badge (D44).
- **Priority:** an attention line (bare hook, cooler full, goal waiting) wins over the badge, as travel waits for Desk Crawler's (D85). The story line stays as it is, so the log still reads in order.
- Species badges on the device draw the fish sprite inside its ring, so "Specimen Pike" shows a pike.
- **Gate:** the preview sweep passes in every layout, both orientations, OG, X and BWRY, the three device themes and the large device scales, with a family badge, a species badge, a badge plus "+ 2 more", and a badge under an attention line.

## 5. The public profile

The Idle Angler section of `/profile/<public name>` shows six badges beside the achievement count: the highest tiers first, then the rarest. This is the one place other players see them, which is what makes a rare badge worth something.

## Data and versions

- `anglers.achievementsSeenAt?: number` (additive, optional). No backfill.
- An index `iaAchievements.by_userId_and_unlockedAt`, so the payload and the Dock read only the newest unlocks (`take(8)`), never every row.
- No achievement catalog version and no content version: predicates and ids do not change. Badges key off the family id, so a family appended later needs a badge drawn before it ships (a test fails on a family without one).
- Template version bumps once for the badge panel. Scene version is unchanged; badges are their own art path.
- Deletion: the new field goes with the angler. The index needs no purge change.

## Words

Badge names and blurbs already exist in all eight languages. New strings ("Achievement", "New", "Rare: held by {n}% of anglers", "+ {n} more", "See the wall", "Nice", the wall's headings, the sheet's labels) are written in all eight, with the device's in `labels` (D200). A What's new entry for Idle Angler in every language, and the help page's achievements section gains a sentence on badges and the wall.

## Not in this proposal

- **A push alert per achievement.** Push is opt-in and kept to things a player must act on (D114); a badge is not. It can be an opt-in alert later.
- **New achievements.** This makes the existing ones visible. New families can follow under catalog version 7 and arrive with their badges.
- **Badges for Desk Crawler, Little Plot and the other games.** The art module and the wall are built so the pattern can be copied, but each game's badges are its own proposal.
- **Choosing which badges show on the profile.** Automatic (best six) until someone asks.

## Work slices

| Slice | Content | Gate |
| --- | --- | --- |
| B1 Badge art | 22 family badges, five tier frames, species ring and laurel, the art route, a contact sheet for Barry to review | Barry approves the sheet; the route test rejects every unknown family, tier and scale |
| B2 The wall | The Achievements page as a wall, the tile sheet, the recent row | Phone captures at 390 and 320 in English and German; the fixtures tool covers new, empty and full walls |
| B3 Companion celebration | `achievementsSeenAt`, `markSeen`, the Dock card with confetti, the dots | convex-test: a new unlock shows once, an absent field shows nothing older than the release, two tabs dismiss once |
| B4 Device panel | The payload's `badge`, the template bump, the panel in every layout | The preview sweep above, clean |
| B5 Profile and words | Six badges on the profile, the eight languages, help and What's new | Profile not-found parity unchanged; i18n completeness test |
