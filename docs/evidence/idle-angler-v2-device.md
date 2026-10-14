# Idle Angler content v2 device and companion (F3, F4)

Recorded 2026-10-14 for D162 ([spec](../idle-angler-full.md)).

## Device

- **Scene v4** (`packages/idle-angler/src/art/scene.ts`) adds the world's season to the image path (`/art/ia/scene/v4/<water>/<band>/<weather>/<season|noseason>/...`) and draws the three content v2 waters: Heron Lake (pines, a boathouse, a heron, the angler in a rowing boat), the deep-sea charter (a far headland, gannets, the boat's deck, rail and cabin) and Frozen Tarn (pines, a white fell, ice with cracks, the float in a hole in the ice). Seasons dress every scene: flowers on the bank or water in spring, dragonflies over fresh water in summer, falling leaves in autumn and snow in winter. v3 paths still render, with no season, while devices pick up the new URLs.
- **28 new fish sprites**, one trait row and one tone row each (`art/fish.ts`, `art/tones.ts`). `pnpm tsx tools/art/idleAnglerPainted.ts <out.png>` now writes the scenes and flies to `<out.png>` and every fish to `<out>-fish.png`, because 58 species need more colours than one 256-colour palette holds.
- **Template v6**: under content v2 the X's full landscape heads its stories column with the current goal behind the star ("Goal: Win a medal in an Open") and shows four stories rather than five, so the board and the newest-catch panel keep their room. A first version put the goal on its own row and pushed the recap past the view by 25px in all five v2 states; the sweep caught it. All 93 X full-landscape previews pass, the Ruby Liquid crosscheck matches 680 renders and the linter passes.
- **Payload**: `season` and `goal_line` fields, and the scene's season under content v2. The story log lists goal (star), Open (trophy) and run (fish) lines; a cast's fish still leads its own lines.
- **Layout gate**: `pnpm preview:idle-angler` renders 22 states (17 from v1 and five v2 states: Heron Lake with a goal line, the charter with the cod run, Frozen Tarn with a new title, an Open entry and a medal) on the OG, the X and BWRY in both orientations and all four layouts: 528 pages. `pnpm sweep:trmnl <out> --filter ia-` passed all 528 with no failures, and each v2 state was swept again after its world and story times were made relative to its own date.

## Companion

The fixtures harness (`node tools/review/companion-fixtures.mjs`) gains `v2=1` (content v2's goal, slate, season, run, charter, wall and Opens) and `v2=new` (a first-day angler with everything locked), and serves `/app/idle-angler/trophies`. At 390 wide the Dock, Cooler, Shop (both variants), Trophies, Rankings and Log pages have no horizontal overflow and no console errors.

## Template v7: every layout fills with stories (2026-10-14)

Barry noticed the X showed about five stories with most of the screen empty. The payload sent only five, and every layout had a fixed count chosen for the smallest screen. The payload now sends up to sixteen, and each layout shows as many as fit:

- **OG and BWRY:** the stories are a `data-overflow` list inside a `.columns > .column` pair, so the framework's overflow engine measures them in place and hides the trailing ones that do not fit above what follows. The list and the full layouts' wrappers are `flex-auto` so they take exactly the space left, the recap's spacer is gone (it split that space), and board names on the OG are sent short (`name_short`, ten characters) because a long name wrapped before the framework's clamp pass and shrank the measured space. The `.columns` engine itself was tried first and dropped: it plans in a fresh column with the default 10px gap and so showed one story fewer.
- **X:** the same engine misjudges heights on the X preview, so the X has one line a story (every row the same height) and a fixed count per layout, measured as the most that fits the tightest state: full 10 landscape and 9 portrait, half horizontal 4 and 4, half vertical 12 and 16, quadrant 8 and 11.
- **Counts for the catch state** (before → now): OG full 5 → 6, OG portrait full 5 → 9, OG half vertical 3 → 5, X full 5 → 10, X portrait full 5 → 9, X half vertical 3 → 12 and 16, X quadrant 1 → 8 and 11.
- **Checks:** a clip check (`.previews/clip-check.mjs`, every page: a story whose box runs past the list's box) finds none, because `.columns` hides its overflow and the sweep cannot see a clipped story; all 528 previews pass the sweep; the Ruby Liquid crosscheck matches 732 renders and the linter passes.

## Template v8: the X fits its stories at any device scale (2026-10-14)

v7's fixed X counts were measured at the default scale. A player can set `screen--scale-xlarge` or `screen--text-scale-xlarge`, and there the last two to five stories ran past the list and were cut in half: 130 of the X pages clipped at `scale-xlarge`. Template v8 replaces the counts with `fitStories`, a short script like Desk Crawler's: once the framework has laid out the view, it hides the trailing stories that end below their list.

- **Default scale:** each X layout now shows what its own state fits instead of the tightest state's count, for example the X full view 10 to 12.
- **`scale-xlarge` and `text-scale-xlarge`:** no story is clipped on any X page; the full view shows 6 to 8. The landscape half horizontal shows none at those scales, since the scene and the line above it fill the slot. Which part gives way there is still open (see D165's note on device scales).
- **Checks:** the clip check at all three scales finds no clipped story; all 528 previews pass the sweep; the crosscheck matches 732 renders; the linter passes.
