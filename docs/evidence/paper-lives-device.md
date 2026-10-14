# Paper Lives device layouts (D159, L3)

Template v1 and portrait art v1, checked on 2026-10-14.

- **Previews:** `pnpm preview:paper-lives` renders eleven states (an adult year with a decision, a child between decisions, the year's end without an offset, the infant years, a senior with the will open, a paused life, a service pause, the memorial, long names on every line, a pending life, an unlinked screen) through the real payload builder and templates, in four layouts on OG, X and BWRY, landscape and portrait: 264 previews.
- **Sweep:** `pnpm sweep:trmnl` found 0 failures in 264 ([results](paper-lives-device-results.json)): nothing past the view or under the title bar, no text under the code, no broken images, no unclamped text overflow.
- **Lint:** `pnpm lint:trmnl` passes the official linter and every class exists in framework 3.4.0.
- **Crosscheck:** `pnpm crosscheck:trmnl` renders every Paper Lives scenario and layout identically in liquidjs and Ruby Liquid, including the close time through `utc_offset`.

Measured on the way: the framework's bracket widths stop at 128px (`w--[180px]` does nothing), so the card and board columns use `w--44` and `lg:w--72`, which scale with the X's content scale. A single-line clamp truncated X text early (it seems to be measured before the larger type applies), so names and the generation line clamp at two lines.

Harness evidence for L1 is [paper-lives-l1-harness.json](paper-lives-l1-harness.json) (1,800 lives, every gate passing).
