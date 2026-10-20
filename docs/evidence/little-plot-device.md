# Little Plot device evidence (G3, 2026-10-20)

The layout gate for the Little Plot screens (little-plot.md "Device"): every device state through the real payload builder and templates, in the pinned framework 3.4 shell, swept headless as the other games are (`pnpm preview:little-plot`, then `pnpm sweep:trmnl`). Real-device renders stay the acceptance gate (G7, Barry's).

## States

Twelve scenarios (`packages/little-plot/src/templates/previewScenarios.ts`): a growing 2 × 3 plot with a board; a 3 × 4 plot with every structure, a greenhouse bed, a crossed bed and a gnome mid-escape; half the beds ripe (the ripe panel and its code); two goal rewards waiting; a brand new plot with one line and no board; a clear winter night with frost and the lantern lit; fog at dawn; a paused plot; a service pause; long names on every line; a pending plot; an unlinked installation.

## Sweeps

| Sweep | Pages | Failures | Results |
| --- | --- | --- | --- |
| Every state, OG, X and BWRY, landscape and portrait, four layouts, with the title bar and the flower code | 288 | 0 | [little-plot-device-results.json](little-plot-device-results.json) |
| The same under TRMNL's Dark theme (D181: the marks are `image--adaptive`) | 288 | 0 | [little-plot-device-dark-results.json](little-plot-device-dark-results.json) |
| The same with the title bar hidden (D180: the fitter bounds the layout without one) | 576 | 0 | [little-plot-device-no-title-results.json](little-plot-device-no-title-results.json) |

## Screenshots read

The OG's full, half-horizontal and quadrant layouts of the big and growing plots were screenshotted and read: the hedge, the beds at their stages, the shed with its pressed flower, the fence posts, the pond with its frog, the beehive, the scarecrow, the bench and the cat all resolve at the OG's 4x and 5x; the header's alias and level, the season line behind its leaf, the time of day and weather behind their marks, the ripe, coin, seed and water counters, the goal under its pennant, four to five stories with their times, the Top 5 with the own row inverted, the twelve-hour recap behind its marks and the flower code in the title bar all land without overflow. A two-letter alias (Mo) read as an ellipsis on the X full layout and the OG quadrant: the framework's single-line clamp rounds the box width down and the text width up, so at the X's 1.8x a short alias whose scaled width lands just above a whole pixel (44.3px) fails its own fit test. The alias now ellipsizes by CSS (`aliasStyle` in `screen.ts`) with no `data-clamp`; the long-name and short-name headers were screenshotted again on the X full and OG quadrant and read whole. Idle Angler's header keeps the framework clamp and would show the same ellipsis for a two-letter alias on the X; its preview alias (Wren) lands on a whole pixel and passes.

## Not yet

A real TRMNL render (G7). The companion pages at 390 wide in the fixtures harness (G4's gate) wait for Little Plot fixtures in `tools/review/companion-fixtures.mjs`.
