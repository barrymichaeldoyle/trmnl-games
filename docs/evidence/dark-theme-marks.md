# Dark theme marks — 2026-10-17

D181, template v63. While looking for what hid Sergej's title bar ([hidden title bar](hidden-title-bar.md)), Desk Crawler was rendered on TRMNL itself under all four device themes (Default, White and Red, Black and Yellow, Dark) through its playlist item's theme override and Refresh now, then set back to Device Default. Every theme kept the title bar and fitted the stories, so no theme explains his screen. The Dark render did show a separate fault: every mark was gone.

## Cause

The marks (hearts, XP ticks, counters, attack and defense, log and to-do glyphs, recap and change marks, the rune ornament and its rule fills, the title icon) are black art on a clear ground, inlined as data URIs. TRMNL's themes recolour the framework's own variables only (`themes/dark-theme.css` has no image rules), so on Dark's black canvas the marks drew black on black. Scenes and codes carry their own white ground and stayed visible.

## Fix

Framework 3.4 ships `image--adaptive`: its script reads the image and the stylesheet masks it with the theme's icon ink (falling back to the primary text colour: black by default, white on Dark). Every 1-bit mark now carries the class. A mask draws the image at its own proportions (`contain`), so the stretched rule fills could not use it; they are now `bg--black` bars two units thick, which the themes remap (`--theme-bg-black-color` is white under Dark). Scenes, scannable codes and the red hearts drawn for ink panels keep their own colours.

`pnpm tsx tools/trmnl/preview.ts --theme dark` renders the matrix under a theme (the theme's stylesheet plus `screen--theme-dark`), pages named `dark.<state>--…`.

Idle Angler (template v11) and Paper Lives (template v8) drew their marks the same way and get the same fix: counters, weather, ticks, story and line marks and the title icon are adaptive; scenes, fish, portraits and codes are not. Paper Lives' line fitter swaps only its size classes, so the adaptive class survives its resizing. `preview-idle-angler.ts` and `preview-paper-lives.ts` take `--theme` too.

## Screenshots

- [X under Dark, v60](layouts/dark-theme-v60-x.png): marks missing.
- [X under Dark, v63](layouts/dark-theme-v63-x.png)
- [OG under Dark, v63](layouts/dark-theme-v63-og.png)
- [Idle Angler X under Dark, v11](layouts/dark-theme-ia-v11-x.png)
- [Paper Lives X under Dark, v8](layouts/dark-theme-pl-v8-x.png)

## Validation

- Default theme: 48 renders (three states, every device, layout and orientation) compared with the v61 template pixel for pixel. OG and BWRY are identical; the X differs only in the one-pixel smoothing at the edge of each mark, which the X's 1.8x scale already produced.
- A screen test checks every layout: each data-URI mark is adaptive, network art (scenes, codes) and the red ink hearts are not, and no stretched rule image remains. Idle Angler and Paper Lives have the same test over every preview scenario and layout (141 of 155 images adaptive in an Idle Angler full render, 114 of 122 in Paper Lives; the rest are art and codes).
- Idle Angler and Paper Lives full X renders under Dark show every mark.
- `pnpm lint:trmnl` passes for all three games; every class exists in framework 3.4.0.
- Preview sweep of 2,736 Desk Crawler pages (every state with recaps, both orientations, Default and Dark): 0 failures.
- `pnpm crosscheck:trmnl`: 1,204 renders identical in liquidjs and Ruby Liquid. `pnpm check`: typecheck and 994 tests pass (one skipped).
