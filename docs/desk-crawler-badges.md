# Desk Crawler badges: pictures, frames and the moment you earn one (P49)

Built 2026-11-14 (D234, D236). Proposed the same day after Idle Angler's badges (P48, D231 to D233) shipped and Barry asked to consider the same for Desk Crawler; he agreed to the outline the same day (D234). Status by slice is in the change record at the end.

## What is there now

- 70 families and 259 ids under catalog version 14: 24 monster families (`slay_*`), six floors cleared, lifetime counters (adventures, gold, levels, knockouts, potions and the rest), set pieces, decisions, raids, coworkers, the office calendar.
- The Records page already reads as shelves: an earned family is a tile with a generic glyph on gold (a sword for every monster, a trophy or star for most else), a tier tab (I, II, III), pips, a bar to the next tier, a rarity band (common to legendary) on its edge, and a sheet on tap. A locked family is a dashed "?" with no name, and a legendary first tier stays a surprise (D65).
- A hint card (D127) names one achievement the player can move with a companion action.
- The device's celebration tag (D44) says "Achievement: Night Shift" above the newest story, until the next adventure replaces it, which is usually within a quarter hour.
- The public profile counts Desk Crawler's achievements but shows none.

## The proposal in one line

Every family gets a picture in a tiered medallion, the shelves show the pictures instead of the generic glyph, a new badge is celebrated once on the Hero page and held on the TRMNL for six hours with its picture, and the profile shows six. The page's structure, the "?" mystery and the hint stay.

## 1. Badges

- **A 40x40 medallion**, larger than Idle Angler's 32, because the monster sprites run to 33 pixels wide. Its frames are the Idle Angler ladder drawn at this size from the same code: dotted while locked, then ring, double ring, studded ring, sunburst, and the top frame (a solid disc on the device, violet in the companion) for a family's last tier.
- **Monsters reuse their sprites**: the 24 monster families need no new art. A sprite wider than the medallion's window runs over the ring, as a creature bursting out of its frame; the review sheet decides whether that reads or whether those few get a crop.
- **46 new 20x20 pictures** for the rest, in the office-joke register: a different picture per floor cleared (a cubicle wall, a server rack, a coffee cup, an archive box, a parking cone, a boiler), and one for each counter and set piece (a stapler for adventures, a gold coin stack, a level arrow, a stretcher for knockouts, a potion, a mousetrap, a coffee break, a bag, a price tag, a keepsake, a merchant's cart, a shield for stances, a fork in a corridor for decisions, raid and defence banners, a to-do list, a wrench, a mixing flask, a calendar page, a name badge for networking, the lost property box, and so on). The sheet is the gate before any wiring.
- **Locked stays a mystery**: the dotted ring around a "?", never the picture, so the D65 surprise holds.
- One shared module in `packages/engine/src/art/badges/` for the frames, the colour layers and the best-badge order, used by both games, so Idle Angler's code moves there rather than being copied.

## 2. The Records shelves

The tile keeps its shape, edge, pips, bar and sheet. The gold square with a glyph becomes the family's badge at 2x in its tier's frame; the "?" tile becomes the locked medallion. The sheet shows the badge larger and the family's tiers as a row. A tile earned since the last look carries a New tag for that visit.

## 3. Celebrating in the companion

As Idle Angler (D233): `heroes.achievementsSeenAt?`, absent read as the release; a card on the Hero page with the best new badge (a finished family, then the rarest, then the newest), confetti, its blurb and rarity band, the rest as small badges, Nice and the link to Records; a dot on the Records tab. The card sits with the page's other cards, after anything the hero needs (a full bag, a knockout, a pending decision). The hint card stays; it waits while the celebration shows, so the page never stacks two achievement cards.

## 4. On the TRMNL

- The celebration tag gains the badge's picture before its words when the celebration is an achievement.
- An achievement celebration holds for six hours, as Idle Angler's, rather than until the next adventure; a newer big moment (a level-up, an elite win, a jackpot, a rare or epic find, a career step) still replaces it at once, and an attention line still wins. Everything else about D44 is unchanged.
- No new panel: the screen is already full, so the badge rides in the tag that exists.
- Gate: the full Desk Crawler sweep (every layout, OG, X and BWRY, both orientations, the recap states, the themes, without a title bar and at the large device scales) is clean, and the badge is visible wherever the tag shows.

## 5. The public profile

Six badges in the Desk Crawler section, chosen as Idle Angler's (finished families, then the rarest, then the higher tier).

## Data and versions

- `heroes.achievementsSeenAt?` (optional, no backfill) and an index `heroAchievements.by_userId_and_unlockedAt` if it does not exist.
- No catalog or content version. Template version bumps once.
- A family appended later needs a picture first; a test fails without one, as in Idle Angler.

## Not in this proposal

- A push alert per badge (as P48).
- New achievements, and renaming or reordering the shelves.
- Choosing which badges the profile shows.

## Work slices

| Slice | Content | Gate |
| --- | --- | --- |
| C1 Shared art and pictures | Move the frame and colour code to the engine at both sizes; 46 pictures; monsters at 40; the art route; the review sheet | Barry reviews the sheet; Idle Angler's badges render byte for byte the same after the move |
| C2 Records shelves | Badges on the tiles, the sheet and the locked medallion | Phone captures at 390 and 320, English and German |
| C3 Companion celebration | Seen marker, `fresh`, `markSeen`, the Hero card, the Records dot, New tags | convex-test as Idle Angler's |
| C4 Device | The badge in the tag, the six-hour hold | The sweep above |
| C5 Profile and words | Six badges, eight languages, help and What's new | Profile not-found parity unchanged |

## Change record

- 2026-11-14, C1: shared art and the pictures. The medallion moved to `packages/engine/src/art/badge.ts`, every radius hung off the ring's outer edge so one drawing serves 32 and 40 pixels (the sunburst's ray count grows with the size); Idle Angler's badges hash the same before and after for every family and frame, device and colour. `packages/desk-crawler/src/art/badges.ts` holds 46 pictures (trimmed to their ink so the medallion centres them), the 24 monsters from `monsterArt`, and a "?" for every locked family. The art route serves `/art/badge/v1/<family>/<frame>/<scale>.png` (scales 1 to 4) from the Convex `/art/` handler. Redrawn after the first sheet: the price tag, the cat, the pen, the spanner, and the office calendar (a party hat read as the garage's traffic cone, so it is a balloon with confetti). Wide monsters (oil slick, trolley swarm, ghost car, box file beetle) run into the ring as planned. `tools/art/deskCrawlerBadges.ts` writes the review strips; tests cover completeness, the shared "?", the frames, the route's allowlist and the profile order. Waiting on Barry's review of the sheet before C2.
- 2026-11-14, C1 legibility (Barry: "do your own research on the best way forward"): five rounds of a blind test, each a fresh reviewer naming the object in all 46 pictures from unlabelled, reshuffled files, colour and 1-bit. Round one: 11 unreadable and five lookalike pairs; round five: every picture named, three genuine misses left, then fixed. Redrawn across the rounds: office calendar (wall calendar), boiler room (flame), salvaged (gear), jackpots (treasure chest), finds (magnifying glass), bigger bags (trolley case), full tour (office tower), archive (folder), decisions (solid two-way signpost), keepsakes (rubber duck), networking (speech bubble), cafeteria (burger), office raider (skeleton key), bag ladder (the bag's slot grid), tasks done (ticked box), knock-outs (crossed plasters), workbench (anvil), merchants (scales), trips (paper plane), light fingers (ladder), gold (gold bars), sales (solid tag), cubicles (office chair, side on), server room (bolder rack), office census (bolder clipboard), traps (no dotted floor), dug in (bigger spray). Lesson kept for later pictures: bold filled silhouettes read at 1x on e-ink, one-pixel outlines and fine interior detail do not, and two objects of the same outline (a bag and a box) are confused even when each alone is named. The reviewers also called the violet top frame low-contrast under dark art; it measures about 5.6:1 and stays, as Idle Angler's.
- 2026-11-14, C2: the Records shelves. The earned tile's gold glyph square became the family's badge at 2x (80 pixels), the tier's numeral kept as a tab; the locked tile's dashed square became the 40-pixel "?" medallion; the sheet shows the badge and, for a tiered family, every tier as a small badge with those ahead faded. The public hero page's trophy case (D187) uses the same tiles, so it shows the badges too. The colour painter is shared (`apps/web/src/lib/badgeArt.tsx`) and memoised, since a shelf draws seventy. Checked in the fixtures harness at 390 wide (shelves, a locked tile, a sheet) with no horizontal overflow. What's new in eight languages.
- 2026-11-14, C3: the Hero page's card. `heroes.achievementsSeenAt?` (absent reads as `BADGES_RELEASED_AT`, 2026-11-14 18:00 UTC), `badges.fresh` (best first: finished family, rarest, newest; each with its share of heroes) and the `badges.markSeen` intent, in `convex/badges.ts` beside Idle Angler's twin. The card sits above the goal card with the new full-screen confetti (D235), the badge at 2x (3x split German names at 320), the name and tier numeral, the blurb and the rarity band; Nice marks it seen, as does opening the achievements page after it tags the new tiles New. A dot on the More tab and on More's Achievements link. The D127 hint lives on the achievements page, not the Hero page, so the two never stack and the hint needs no change. convex-test covers the order, the release cut-off, forward-only marking and other owners; harness captures at 390 and 320 in English and German.
- 2026-11-14, C4: the device, template v68. The payload takes the eight newest unlocks inside six hours (`heroAchievements.by_userId_and_unlockedAt`); a newest log that is a big moment of its own shows at once, otherwise the best fresh achievement (finished family, then newest) holds the celebration tag, and `celebration_badge` sends its art base. The tag leads with the 40-pixel badge at 1x and its text may now wrap to two lines (`data-clamp="2"`, `w--min-0`), since at `scale-xxlarge` in the OG's portrait half the badge left the one-line text 21 pixels short. As before (D44) the quadrants and the OG's landscape half show no celebration tag, so no badge there either. Sweeps: 1488 previews (every state, recap states, portrait) clean, and clean without a title bar; 216 badge previews in English, German and the dark theme clean with the badge visible wherever the tag shows; at `scale-xlarge`, `scale-xxlarge` and `text-scale-xlarge` the badge states fail exactly where the badge-free `normal` state fails (13 layouts each). `tools/trmnl/preview.ts` inlines badge art and `sweep.mjs` counts `data-celebration-badge`. TRMNL lint and the Ruby crosscheck (2596 renders) pass.
- 2026-11-14, C5 (D236): six badges in the profile's Desk Crawler section (`showcaseBadges` from the engine's order, rarity from the current publication), named through the content translator. A new Achievements section in the Desk Crawler help pages (after Recaps), and a What's new entry for the celebration, both in eight languages. The earlier What's new entry called the page "Records", the docs' word; players see "Achievements" (Obiettivi, Succès and so on), so it now says that. P49 is complete; not done, as proposed: a push alert per badge, and choosing the profile's six.
