# TRMNL Games

<!-- impeccable:product-schema 1 -->

## Platform

web

## Users

TRMNL owners who want calm games on their desk display and occasional decisions in a browser companion. Prospective players can inspect public game pages and samples before installing. Existing players may use multiple games under one account.

## Product Purpose

Free passive games that progress on a scheduled world tick and tell a readable story on TRMNL. The companion lets players review progress, manage resources and make occasional decisions. It must stay useful after days away.

## Positioning

TRMNL is the primary display. The website is the companion, using the same game state and pixel art. Installation activates play; refreshing the website or device never earns extra progress.

## Operating Context

Desk Crawler and Idle Angler are listed on the TRMNL marketplace as of 2026-11-08 (D224). The shared companion runs at trmnlgames.com. Other implemented games remain subject to their own visibility and release gates; implementation is not launch authorization.

Players sign in through Clerk, install through TRMNL, then return to manage their games. Desk Crawler covers heroes, equipment, floors and adventures. Idle Angler covers fishing at six waters, bait and equipment, the cooler, fishmonger orders, weekend Opens, trophies and the logbook. Public profiles, rankings, help, account controls and a game-filtered dev log support those journeys.

## Capabilities and Constraints

- TanStack Start with Vite and React on Cloudflare Workers; Convex owns authoritative game state, scheduling and transactional mutations; Clerk governs authenticated game intents.
- Public samples do not create rewarded progress. Verified saved installations activate a game; browser accounts alone do not.
- After activation, device polling, hardware sleep, installation count and a closed browser do not control progression. Explicit pause and game-specific stopping rules do.
- Clients submit intents, never authoritative stats or rewards. Reads and writes stay bounded; leaderboard views use immutable published generations.
- Continuous releases preserve player progress. Production changes, external resource creation, email and publication require the user's authorization.
- English plus French, German, Spanish, Italian, Portuguese, Polish and Dutch. Player-visible changes have dated entries in all eight languages and the appropriate game tag.
- Route heads and loaders must obey the translation bundle boundary in AGENTS.md and D212.

## Brand Commitments

TRMNL Games is the shared platform. Desk Crawler and Idle Angler retain their names and distinct worlds. Keep the established pixel theme and plain, calm player language; avoid nagging, streak pressure and fabricated claims. The current visual system lives in DESIGN.md.

## Evidence on Hand

Repository authorities: ../../README.md, ../../AGENTS.md, ../../docs/decisions.md, ../../docs/status.md, ../../docs/quality.md and each game's specification. ../../docs/product.md preserves the original Desk Crawler MVP specification; its deferred-feature table is historical, not the current cross-game feature inventory.

Actual assets and behavior: src/styles.css, src/lib/ui.tsx, src/routes/app/desk-crawler/, src/routes/app/idle-angler/, ../../packages/*/src/art/, ../../tests/ and ../../docs/evidence/. Tests and local renders prove their stated scope; they do not substitute for a required live installation or physical display check. Do not invent testimonials, player counts, income or display evidence.

## Product Principles

1. The world advances without visits; the player chooses when to return.
2. Preserve earned progress and account boundaries across releases.
3. Make status, consequences and available actions clear in plain language.
4. Keep each game's identity inside a consistent companion shell.
5. Treat confirmed decisions and verified evidence as stronger than proposals.

## Accessibility & Inclusion

Keep keyboard focus visible, controls usable on phones, reduced-motion behavior, and labels or shapes alongside semantic color. Localized text must remain readable without changing gameplay meaning.
