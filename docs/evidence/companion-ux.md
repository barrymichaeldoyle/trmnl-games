# Companion UX — 2026-11-08 (D226)

Barry approved the five priorities from the [independent review](../../.impeccable/critique/2026-11-08T16-23-08Z__apps-web.md), delegating the detailed choices. Implementation is local; no production deployment was performed for this change.

## Result

- Angler QR/saved-link visitors see Idle Angler, its labeled sample, sign-in, installation, explanation and guide. The header's Help destination follows the current game; general account entry describes the platform instead of offering the wrong game's installation. The fishing entry is lazy-loaded, leaving it out of other signed-out paths.
- Failed purchases, cooler sales, mounting, pausing and trophy removal keep their decision open and show the error inside the confirmation. Success closes it. Reopening clears old feedback. Shared confirmations support inline errors; other games' behavior is unchanged.
- Selecting catches opens a pinned count, total, Clear selection and Sell control. Its actual wrapped height reserves document space and lifts notices, including on narrow screens and in German.
- Bulk sales review a fixed set of IDs and exclude trophy-size fish by default. The player can explicitly include them, with a consequence warning. Intentionally selected trophies, trophy bait and trophy fishmonger orders require confirmation. These safeguards use existing `catchActions.mountCost` information; they add no persistent locks or backend authority. Newly caught fish cannot enter an already-open sale; missing fish drop out. An all-trophy cooler cannot submit a zero-fish sale.
- Fishing status, full-cooler and bare-hook warnings precede the scene. The bait warning links to its control or shop. Paused anglers are not described as currently fishing a bare hook. The weekly fly callout remains on the Dock after the scene; release notes follow the waters.
- New copy and the player changelog cover English, French, German, Spanish, Italian, Portuguese, Polish and Dutch.

## Validation

- `pnpm check`: workspace typecheck and 1,225 tests passed, one previously skipped test unchanged.
- `pnpm build`: production client and Worker build passed. Existing TanStack input-validator deprecation warnings remain.
- `pnpm knip`: passed. `git diff --check`: passed.
- Impeccable detector over touched UI surfaces: no findings.
- `tests/web/cooler-selection.test.ts`: default trophy exclusion (including a zero mounting cost), explicit inclusion, fixed reviewed IDs, missing catches and pre-trophy content.
- `node tools/review/companion-ux.mjs`: 56 browser assertions passed against the real components with synthetic query/mutation adapters. Covers signed-out entry and destinations in all eight languages, phone overflow, failed sale and same-operation retry, actual sale payload trophy exclusion, explicit inclusion warnings, selected-sale controls at the top of an 18-fish list, notices above the bar, clearing selection, failed mount/purchase/pause/removal, all-trophy cooler, trophy bait, successful sale feedback, Dock warning order and paused copy, plus 320px German selection.
- Visually inspected mobile cooler/review, narrow German selection, translated fishing entry, and mobile/desktop Dock captures in `.previews/ux-*.png` (ignored local evidence).

Run the fixture harness first:

```sh
node tools/review/companion-fixtures.mjs
pnpm exec vite --config .previews/submission-companion/vite.config.mjs
# In another terminal:
node tools/review/companion-ux.mjs
```

The T3 preview browser timed out twice while taking snapshots; Chromium drove the local fixture harness instead. No production game actions, live sign-in, schema changes, device-template changes or live TRMNL renders were required or performed. These checks prove companion rendering and client intent behavior, not live authentication or authoritative backend outcomes.
