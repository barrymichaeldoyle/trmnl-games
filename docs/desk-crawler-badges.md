# Desk Crawler badges: pictures, frames and the moment you earn one (P49)

Proposed 2026-11-14 after Idle Angler's badges (P48, D231 to D233) shipped and Barry asked to consider the same for Desk Crawler; he agreed to the outline the same day (D234). Status by slice is in the change record at the end.

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
