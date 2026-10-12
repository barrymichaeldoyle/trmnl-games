# Slow Cast device layouts (S3)

Recorded 2026-10-09 for D115, updated 2026-10-10 for template v2 and 2026-10-12 for template v4 (`packages/slow-cast/src/templates/screen.ts`), with scene v3, QR v1 and fish v1 (`packages/slow-cast/src/art/`).

## What was checked

`pnpm preview:slowcast` renders 17 device states through the real payload builder and templates, with the art drawn locally, for the OG, the X and the BWRY panel in landscape and portrait, in all four layouts: 408 pages. `pnpm sweep:trmnl <out> --filter sc-` loaded each in the pinned framework 3.4.0 and checked that nothing runs past the view or under the title bar, no image is broken and no unclamped text overflows. Result: **408 pages, 0 failures** ([results](slow-cast-layout-results.json)). The full layout, the half and side views and the quarter were also inspected by eye on the OG and the X in both orientations.

States: achievements, bareHook, catch, coolerFull, gotAway, longText, millpondDawn, outsideTop, paused, pending, pier, servicePaused, stale, travelling, unlinked, unranked, waiting.

## Layouts

Template v2 sets the counters behind 1-bit marks (`art/marks.ts`) instead of words: a pin for the place, marks for the time of day and the weather, then the cooler, the hook and bait left, gold and the logbook. XP is ten half-step ticks like Desk Crawler's. Every story leads with its kind's glyph (a fish kept, a fish released, the one that got away, wildlife, travel, out of bait, an achievement, a star for a level-up). The attention line is inverted behind its mark. The board heads with a trophy and shows each angler's 7-day XP. The recap sits at the foot as Desk Crawler's ribbon: a rule, "Last 12 hours", then each fact behind its mark.

| Layout | Landscape | Portrait |
| --- | --- | --- |
| Full | Name, level and XP ticks, place with time and weather, the counters and the code in the header. On the OG the scene at 4x (the composed 152 stage) beside the board, or 156 wide at 5x across the view without one, then the attention line and five stories (four beside an attention line). On the X the scene 170 wide at 6x, then the stories beside the board with the newest catch under it. The recap at the foot | The same header; the scene 153 wide at 3x (152 at 5x on the X); five stories; the newest catch; the board; the recap |
| Half | Scene 120 wide at 3x (152 at 4x on the X) beside the name and XP, place and conditions, cooler, bait and gold, and the newest story or the attention line; code at the right | Name and code, scene 220 wide at 2x (185 at 4x on the X), place, counters, two stories |
| Side | Name and code, scene 182 wide at 2x (161 at 3x on the X), XP, place, counters, attention, three stories, recap | Name, scene 205 wide at 1x (177 at 2x on the X), XP, place, cooler, bait and gold, three stories, the board, code at the foot |
| Quarter | Name and level, place, cooler and gold beside the code; the newest story or the attention line | The same stacked, code at the foot |

The newest-catch panel draws the fish alone (`/art/sc/fish/v1/<species>/<scale>.png`, the 30x12 sprite) beside "Newest catch" or "Released", its name and weight. On the X landscape it shows only without an attention line and with five board rows or fewer, which is what fits.

A held fish is drawn at the angler's hands when the newest story is a catch or a release; one that got away bends the rod. The code opens the dock, or the cooler when it is full. Attention lines, most urgent first: a service pause, delayed updates, a full cooler, a bare hook.

**Parity and lint.** `pnpm crosscheck:trmnl` now renders every Slow Cast scenario, with and without a fly code, in liquidjs and in Ruby Liquid through `trmnlp`: all 532 renders of both games match. `pnpm lint:trmnl` runs the official linter over both games' templates: both pass.

## Notes

- Fish sprites come from one trait row per species (`art/fish.ts`): body shape, tail, fin and markings. A sheet of all thirty is drawn by `pnpm tsx tools/art/slowcastSheet.ts <out.png>`; scenes by `tools/art/slowcastScenes.ts`.
- The pixel canvas, PNG encoder, font and QR drawing moved to `packages/engine/src/art/`; Desk Crawler re-exports them from its old paths and its art tests pass unchanged.
- Each scene image is a small 1-bit PNG and every scene URL is immutable. Scene v3 (D125) composes the stage at the width in the URL, 120 to 400 columns: the angler and the cast keep the left edge, the far backdrop the right, and the horizon, ripples and weather run the whole width. Each slot asks for the width that fills it at its whole-number scale, so the water reaches the slot's edges; `.previews/`-style measurements in the framework put the OG's full view at 780 wide inside its padding, the side view at 365, the portrait half at 440 and the portrait side at 205.
- The X draws images about 1.8 times their pixel size, so its widths and scales are chosen to fit after that: 170 wide at 6x fills its 1836-wide full view.
- The board's own row is the label itself, so its inverted text stays white. The weekly fly code sits in the title bar; narrow portrait columns (side, quarter) show it as "Fly 482 917" in the title's place while a code is showing, as Desk Crawler's keepsake does. The previews carry a code on every fishing screen. The newest fly is drawn on the angler's hat (scene v2). The quarter shows no scene or board, as the spec's simplification order allows.
