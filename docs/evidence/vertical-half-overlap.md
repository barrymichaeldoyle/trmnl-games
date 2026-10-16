# Vertical half log boundary and portrait preview — 2026-10-16

Template v59 responds to Sergej's TRMNL X vertical 50/50 report. His screenshot shows older adventure entries crossing the leaderboard and the bottom recap. The companion preview now has Landscape / Portrait controls, translated into French and German, remembered with the existing device/layout preference. Portrait swaps both the iframe dimensions and the framework orientation; it does not rotate a landscape render.

The fitter previously measured only the log's immediate parent. A nested full-height ledger can exceed the flex slot assigned to it, so that measurement can include space belonging to the board below. The fitter now respects each containing slot and reserves space for its following blocks, ignoring columns beside it. It also measures again once webfonts are ready. Whole older entries give way; the newest entries remain together with their changes.

## Regression and validation

`sideAchievementLog` reproduces the report's mixture of achievements, healing, gold, combat and a wrapped mishap with ten candidate entries. The ordinary local render alone did not reproduce Sergej's overlap. To exercise the failing boundary deterministically, the sweep temporarily grows only the inner X side ledger to 1000 CSS pixels with no flex shrinking, leaving its outer slot fixed, and dispatches the real framework fitting event. It restores the box before taking the ordinary screenshot. With the original boundary calculation this put 18 story text elements over the board; with v59 it puts none there. This is a controlled layout stress case, not a claim to have reproduced the user's exact renderer timing.

The permanent sweep also checks story/board intersections in every layout and requires the report's regression case to retain at least one adventure entry. Footer-only checks previously missed internal overlap.

- All 24 report-case renders: OG, BWRY and X, four layouts, both orientations; no overflow, board/recap overlap, broken images or missing adventure entries. Both X side orientations pass the inner-ledger stress check.
- 51 focused screen and preview-scenario tests pass.
- TRMNL lint passes for all three games. Also corrected the existing unsupported `lg:title` utility in the bag prompt to `lg:title--base`.
- All package and web application typechecks pass. The final root simulation/test typecheck is blocked by the existing `tests/web/dom-mismatch.test.ts:18` optional `id`/`classList` typing error.
- The web design detector reports no findings for the changed preview controls.

[Render results](layouts/vertical-half-v59-results.json) · [X side](layouts/vertical-half-v59-x.png) · [X portrait side](layouts/vertical-half-v59-x-portrait.png).

Local framework validation approximates TRMNL. Production deployment, the live TRMNL server render and physical display confirmation remain pending Barry's release authorization; no external plugin settings were changed.
