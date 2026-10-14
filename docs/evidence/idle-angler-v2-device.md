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
