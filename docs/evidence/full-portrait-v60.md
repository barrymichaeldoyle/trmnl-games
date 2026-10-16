# Full portrait layout — 2026-10-16

D177, template v60. The X reads scene → full-width event log → two columns: current goal above today’s tasks on the left, five nearby leaderboard rows on the right. The own row remains highlighted and included. The goal shares one compact row with progress and reward; only longer titles wrap. French and German use the same arrangement.

The OG trial showed only two stories because the tasks wrapped. Its six-row, two-column board stays below its full-width stories. Landscape and mashup layouts keep their arrangements, which use their shorter or narrower slots effectively. Both full portrait headers now stack health, XP and gear left under the hero details, with the standing QR at the top right. Portrait events try icon, story, tightly packed changes and timestamp on one row using measured rich-text boxes at the screen scale. OG and the newest X event keep metadata underneath when the full event does not fit. Empty stat placeholders are removed. The X bottom columns have a vertical separator. Screenshots include the native screen padding through `sweep:trmnl --full-screen`. No backend or payload changes.

## Screenshots

- [X portrait](layouts/full-portrait-v60-x.png)
- [X portrait, German](layouts/full-portrait-v60-x-de.png)
- [OG portrait regression](layouts/full-portrait-v60-og.png)

## Validation

- Release gate `pnpm check`: full typecheck passes; 978 tests passed, one skipped. The screen suite includes 50 passing tests.
- `pnpm crosscheck:trmnl`: 1,204 renders identical in liquidjs and Ruby Liquid.
- `pnpm lint:trmnl`: all three games pass; every class exists in pinned framework 3.4.0.
- Local Chromium checks: 194 Desk Crawler X full portrait cases, zero failures, including English/French/German, long stories/names, attention, setup, empty rankings, bag takeover and recap. Three final OG normal cases (one per language) also pass. [Counts](full-portrait-v60-results.json). The broad directory sweep additionally includes unrelated Paper Lives fixtures; those are excluded from these counts.
- Release preparation fixes the existing `tests/web/dom-mismatch.test.ts:18` fixture typing error: absent optional `id`/`classList` fields are omitted instead of assigned `undefined`, matching `exactOptionalPropertyTypes`. This unblocks the deployment typecheck without changing app behavior.
- Header/goal/log follow-up: 72 normal renders across all device classes, orientations, layouts and languages pass. Another 72 Desk Crawler long-content renders pass. The package typecheck and all 50 updated screen tests pass. [Counts](full-portrait-v60-results.json).
- Mechanical design scan and `git diff --check`: clean.

Local previews use real `buildPayload` scenarios and inline the existing scene/QR renderers. No deployment or live TRMNL installation/render was performed; those remain separately authorized verification.

Adaptive-row follow-up: 72 normal and 72 Desk Crawler long-content renders pass across layouts, devices, orientations and languages. Manual browser assertions verify the newest X event is inline, OG uses both forms, timestamps appear once, and repeating the framework fit twice preserves the arrangement. All 50 screen tests, package typecheck and official markup lint pass.

Final spacing refinement: portrait timestamps add `pl--2` (8 framework units), so they read separately from the packed changes. Both shared screenshots are updated.
