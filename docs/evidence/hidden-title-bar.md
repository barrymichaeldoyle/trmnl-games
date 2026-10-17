# Hidden title bar overlap — 2026-10-17

Template v61 fixes Sergej's TRMNL X report, which v59 did not. His screenshots from 16 Oct 21:15 already showed v60, yet every log entry was drawn: they ran under the leaderboard and the recap ribbon in both the full and vertical half layouts, and neither screen had a title bar.

## Cause

The story fitter looked for a visible `.title_bar` and returned at once when there was none. TRMNL can hide the title bar while keeping its space (both photos keep a blank strip at the bottom), so on his device the fitter never ran: no entries hidden, no board rows trimmed, no recap facts dropped. All our previews draw the bar, so no sweep reached that branch.

## Reproduction

`pnpm pull:trmnl --alias SM` pulled his live payload (read-only). Rendered through the local templates on the X with `.title_bar { display: none !important }` added, v60 reproduces both photos almost exactly, down to the blank footer strip. Stripping the scripts gives the same picture. With the bar shown, and at `screen--scale-large`, `screen--scale-xlarge` and `screen--text-scale-xlarge`, the same payload renders cleanly.

## Fix

The title bar is now optional in the fitter. Without one, the layout and view bottoms bound the stories and boards, the recap spill pass uses the view bottom, and the keepsake-code narrowing is skipped. With v61, his hidden-bar renders fit in both layouts.

`pnpm sweep:trmnl <out> --no-title-bar` serves every preview with the bar hidden the same way and runs the usual checks, bounding by the view when no bar shows.

## Keepsake claim QR (D180)

The same report showed a keepsake code had nowhere to appear with the bar hidden. While a keepsake waits and no urgent code is up, every standing code now encodes `/k/<six digits>` at its usual size, and captions that named the bag read `Keepsake 482 917`. The X header codes gain the same caption; the OG full landscape's corner code and the X half's scene-corner code carry the link without one. The title bar keeps its code.

- Template tests: every layout swaps its standing codes and captions; a full bag keeps its urgent code; an envelope without `keepsake_qr_base` keeps the old codes; the OG corner draws the corner-cut keepsake code.
- Art tests: only six digits draw, the code scans to `https://trmnlgames.com/k/482917`, and it is the `/dc` code's size.
- Convex test: the envelope sends both QR bases beside the code and clears them after a claim.
- Companion harness at 390 wide, with the clock after keepsakes open: `/app/desk-crawler?keepsake=482917` claims and shows the design on the shelf; a wrong code and an already-collected week show their messages with the form open; the address drops the code each time; non-digits are ignored.

## Validation

- Preview sweeps of 1,368 normal and recap previews (`--portrait --recap`) and 912 keepsake previews (`--portrait --keepsakes`), each with the bar shown and with `--no-title-bar`. The only failures are the full bag's panel (`bagSleeping`, `sleeping`, `fullBagRecap`: 51 and 42 in the normal set, 34 and 28 in the keepsake set), whose code and caption run a few pixels past the slot. That panel failed the same way on v60, carries no keepsake code, and does not depend on the fitter; it is left for a separate fix. Every other state passes in both modes, including the board and ribbon overlap checks Sergej's screens would have failed.
- Full test suite (990 tests) and the root typecheck pass. `pnpm crosscheck:trmnl`: 1,204 renders identical in liquidjs and Ruby Liquid.
- `pnpm lint:trmnl` passes for all three games on trmnl_preview 0.31.0 (bumped from 0.30.2 in the same change).
