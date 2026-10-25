# Pixel Wars device evidence (W3, 2026-10-25)

The layout gate for the Pixel Wars screens (pixel-wars.md "Device"): every device state through the real payload builder and templates, in the pinned framework 3.4 shell, swept headless as the other games are (`pnpm preview:pixel-wars`, then `pnpm sweep:trmnl`). Real-device renders stay the acceptance gate (W6, Barry's).

## States

Twelve scenarios (`packages/pixel-wars/src/templates/previewScenarios.ts`), their maps built by the real core from scripted orders so the previews show real fades and flips: a young map of nine desks; a 60-desk map with a desk held; the 441-desk map (the cap) where every slot windows on the desk; a desk that fell; the night shield up; the bell an hour away; a desk with no side yet; a cleared desk; a long alias with long stories; a service pause; a pending desk; an unlinked installation.

## Sweeps

| Sweep | Pages | Failures | Results |
| --- | --- | --- | --- |
| Every state, OG, X and BWRY, landscape and portrait, four layouts, with the title bar (the directory also held the Dark pages, so the count is doubled) | 576 | 0 | [pixel-wars-device-results.json](pixel-wars-device-results.json) |
| The same under TRMNL's Dark theme (D181: the marks and swatches are `image--adaptive`; the map PNG is not, see below) | 288 | 0 | [pixel-wars-device-dark-results.json](pixel-wars-device-dark-results.json) |
| The same with the title bar hidden (D180: the fitter bounds the layout without one) | 576 | 0 | [pixel-wars-device-no-title-results.json](pixel-wars-device-no-title-results.json) |

## Screenshots read

The OG's full, half-horizontal and quadrant layouts of the 60-desk map, the X's full layout of the fallen desk, the OG portrait side layout of the 441-desk map, and the OG full under the Dark theme were screenshotted and read. The four patterns resolve apart at 10 and 12 pixels a cell (solid, diagonal hatch, dots, crosshatch), fade shows as thinner strokes, every desk sits in its ring and the viewer's own desk in a second ring outside its cell; the alias behind its swatch with the level and the rosette, the four shares with the own faction inverted and the hour's movement, the desk line with the well and the cells held, the inverted attention line, the map, the map's three lines behind the bell, the desk's stories with their times, the Top 5 with the own row inverted and the companion code all land without overflow. On the OG's full layout the board gives way to the map and the lines (it is the first to step aside, as Little Plot's); the X's full layout shows everything.

Three things the first sweep and screenshots caught: `image--adaptive` on the map PNG painted it solid black (the class repaints SVG marks; a 1-bit PNG under it turns to ink), so the map images carry only `image` and the Dark theme shows the map as a white panel with black patterns; the season label overflowed the OG's 205 px portrait side and quadrant title bars, which now keep the name and show the label from the X; and the quadrant's window plus an attention line overran the slot, so the quadrant window is five rows at ten pixels. A desk that had faded to ground read as "Held by " with no name; the payload now says "Desk at ground" and "Your desk has faded to ground".

## Not yet

A real TRMNL render (W6). The companion pages at 390 wide in the fixtures harness (W4's gate).
