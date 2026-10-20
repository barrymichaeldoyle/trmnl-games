---
version: 1
slug: "apps-web-src-routes-index-tsx"
primary_target: "apps/web/src/routes/index.tsx"
related_targets: ["apps/web/src/routes/games/desk-crawler.tsx","apps/web/src/routes/games/idle-angler.tsx"]
---

# Home and game pages (apps/web/src/routes/index.tsx, games/*)

Scope: the two-game front page, Desk Crawler's page and Idle Angler's page. Visitor mode: Persuade inside the companion's arcade world. Existing players are a second audience: the home page shows them their own games first.

Audience/job: TRMNL owners deciding whether to install a game; existing Desk Crawler players learning that a second game is coming and asking to hear when it lands. Barry chose (2026-10-20): two games as equals, Notify me everywhere while Idle Angler is in review, a What's new entry, a one-time note in Desk Crawler, signed-in players' games on home, and an Idle Angler page as rich as Desk Crawler's.

Constraints: inherits DESIGN.md (dark arcade, windows, gold current-choice marks, Press Start 2P for buttons only); eight languages; device screens shown as the real 1-bit renders in the plum bezel; no install link for a game TRMNL does not list yet.

## Direction contract

THESIS: A game-select screen. The front page is the cabinet's select menu: two TRMNLs side by side, each its own game, the gold cursor on the one you point at. Refuses a marketing page with one hero product and a "more games" footnote.

OWN-WORLD: DESIGN.md's arcade: #15122b ground, plum windows in night outlines, cream text, gold for the current choice, the TRMNL bezel as the one rounded object holding each game's real e-ink screen.

STORY: A visitor reads one line (games that play themselves on your TRMNL), compares two real screens, picks one and installs it or asks to be told; a player sees their hero and angler first and jumps in.

FIRST VIEWPORT: Platform line as h1 with a one-sentence lead; signed-in players' games strip; then two equal select cards, each a bezelled screen over the game's name, pitch, status line and its one action.

FORM: game-select cabinet, code-led, extension of the established world. No concept roll ran (no seed key): the user fixed the structure in the ask round on 2026-10-20, "Two games as equals" for home (a platform promise, then both games side by side, each with its real device screen, pitch and next step) and "Match Desk Crawler" for the Idle Angler page.

FINISH: unreviewed and undocumented is unfinished; this build ends with the finish review, the verdict, DESIGN.md, and every shipping raster carrying its provenance
