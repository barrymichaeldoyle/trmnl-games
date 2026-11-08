---
name: TRMNL Games Companion
description: A shared dark arcade companion with each game’s own painted pixel world.
colors:
  arcade-ground: "#15122b"
  window-plum: "#221d44"
  raised-plum: "#2c2650"
  arcade-night: "#0c0a1c"
  cream: "#f4f1ff"
  muted-lilac: "#b9b2e6"
  faint-lilac: "#8d86c0"
  bezel-plum: "#3a3566"
  screen-white: "#ffffff"
  coin-gold: "#ffd166"
  coin-gold-hi: "#ffe08f"
  coin-gold-lo: "#b07a00"
  heart-red: "#e5483b"
  heart-red-ink: "#ff7b72"
  xp-green: "#4fd18b"
  travel-sky: "#5d8fd6"
  travel-sky-ink: "#86c8ff"
  rare-violet: "#a77bff"
  rare-violet-ink: "#c4a6ff"
  cubicle-tan: "#f3d394"
  cafeteria-coral: "#f08a6b"
typography:
  display:
    fontFamily: "TG Pixel Digits, Pixelify Sans, Pixelify Sans Fallback, ui-sans-serif, system-ui, sans-serif"
    fontSize: "3rem"
    fontWeight: 700
    lineHeight: 1.25
  headline:
    fontFamily: "TG Pixel Digits, Pixelify Sans, Pixelify Sans Fallback, ui-sans-serif, system-ui, sans-serif"
    fontSize: "1.875rem"
    fontWeight: 700
    lineHeight: 1.2
  title:
    fontFamily: "TG Pixel Digits, Pixelify Sans, Pixelify Sans Fallback, ui-sans-serif, system-ui, sans-serif"
    fontSize: "1.5rem"
    fontWeight: 700
    lineHeight: 1.33
  hud-title:
    fontFamily: "Press Start 2P, Press Start 2P Fallback, ui-monospace, monospace"
    fontSize: "0.875rem"
    fontWeight: 400
    lineHeight: 1.6
    letterSpacing: "0.02em"
  hud-label:
    fontFamily: "Press Start 2P, Press Start 2P Fallback, ui-monospace, monospace"
    fontSize: "0.6875rem"
    fontWeight: 400
    lineHeight: 1.6
    letterSpacing: "0.02em"
  small-label:
    fontFamily: "ui-sans-serif, system-ui, -apple-system, Segoe UI, sans-serif"
    fontSize: "0.75rem"
    fontWeight: 700
    lineHeight: 1.4
    letterSpacing: "0.06em"
    fontFeature: "tnum"
  body:
    fontFamily: "ui-sans-serif, system-ui, -apple-system, Segoe UI, sans-serif"
    fontSize: "1rem"
    fontWeight: 400
    lineHeight: 1.5
  body-sm:
    fontFamily: "ui-sans-serif, system-ui, -apple-system, Segoe UI, sans-serif"
    fontSize: "0.875rem"
    fontWeight: 400
    lineHeight: 1.43
  meta:
    fontFamily: "ui-sans-serif, system-ui, -apple-system, Segoe UI, sans-serif"
    fontSize: "0.75rem"
    fontWeight: 600
    lineHeight: 1.33
    fontFeature: "tnum"
rounded:
  none: "0px"
  screen: "0.375rem"
  bezel: "1.4rem"
spacing:
  xs: "8px"
  sm: "12px"
  md: "16px"
  lg: "20px"
  xl: "32px"
  control: "44px"
  nav: "52px"
components:
  button-primary:
    backgroundColor: "{colors.coin-gold}"
    textColor: "{colors.arcade-night}"
    typography: "{typography.hud-label}"
    rounded: "{rounded.none}"
    padding: "8px 16px"
    height: "44px"
  button-primary-hover:
    backgroundColor: "{colors.coin-gold-hi}"
  button-secondary:
    backgroundColor: "transparent"
    textColor: "{colors.cream}"
    typography: "{typography.hud-label}"
    rounded: "{rounded.none}"
    padding: "8px 16px"
    height: "44px"
  button-secondary-hover:
    backgroundColor: "{colors.cream}"
    textColor: "{colors.arcade-night}"
  button-quiet:
    textColor: "{colors.muted-lilac}"
    typography: "{typography.body}"
    padding: "8px 16px"
    height: "44px"
  button-danger:
    backgroundColor: "transparent"
    textColor: "{colors.heart-red-ink}"
    typography: "{typography.hud-label}"
    rounded: "{rounded.none}"
    padding: "8px 16px"
    height: "44px"
  button-danger-hover:
    backgroundColor: "{colors.heart-red}"
    textColor: "{colors.arcade-night}"
  window:
    backgroundColor: "{colors.window-plum}"
    textColor: "{colors.cream}"
    rounded: "{rounded.none}"
    padding: "12px 16px 16px"
  window-title:
    textColor: "{colors.cream}"
    typography: "{typography.title}"
  hud-nav:
    backgroundColor: "{colors.arcade-night}"
    textColor: "{colors.muted-lilac}"
    typography: "{typography.hud-label}"
    height: "52px"
  hud-nav-active:
    textColor: "{colors.coin-gold}"
  segmented-tab:
    textColor: "{colors.muted-lilac}"
    rounded: "{rounded.none}"
    padding: "0 12px"
    height: "44px"
  segmented-tab-active:
    backgroundColor: "{colors.raised-plum}"
    textColor: "{colors.coin-gold}"
  hud-box:
    backgroundColor: "{colors.arcade-night}"
    textColor: "{colors.cream}"
    typography: "{typography.small-label}"
    rounded: "{rounded.none}"
    padding: "10px 12px"
  dialogue-strip:
    backgroundColor: "{colors.cream}"
    textColor: "{colors.arcade-night}"
    typography: "{typography.hud-label}"
    padding: "12px 36px 12px 12px"
  away-tally:
    backgroundColor: "{colors.arcade-night}"
    textColor: "{colors.cream}"
    rounded: "{rounded.none}"
    padding: "16px"
  log-badge:
    textColor: "{colors.arcade-night}"
    size: "32px"
  world-tile-locked:
    backgroundColor: "{colors.window-plum}"
    textColor: "{colors.muted-lilac}"
    rounded: "{rounded.none}"
    padding: "16px"
  device-bezel:
    backgroundColor: "{colors.bezel-plum}"
    rounded: "{rounded.bezel}"
    padding: "clamp(0.5rem, 2.5vw, 1rem)"
  device-screen:
    backgroundColor: "{colors.screen-white}"
    rounded: "{rounded.screen}"
---

# Design System: TRMNL Games Companion

## Overview

**Creative North Star: "The Game Screen"**

The companion belongs to the games themselves: a shared dark arcade shell, with each game's own painted pixel world. Desk Crawler leads with the hero's scene and HUD; Idle Angler leads with the water, weather, angler and newest catch. Public pages are a game-select experience, while help and account pages keep the same vocabulary with less visual density.

The current implementation is the authority for extraction: src/styles.css, src/lib/ui.tsx, the game route folders and packages' art modules. This record was refreshed on 2026-11-08; it preserves the established world rather than introducing a redesign.

**Key Characteristics:**
- Dark plum ground, lighter plum windows, hard night outlines and cream text.
- Gold actions and current choices; semantic stat colors accompanied by labels, glyphs or shapes.
- Pixel display titles, small arcade controls and system sans for reading.
- Square interface controls; curved TRMNL hardware frames.
- Shared game composition painted in color in the companion; the actual device preview keeps its own TRMNL rendering.

## Colors

The frontmatter records the existing palette. Coin Gold marks primary actions, currency and the current choice. Heart Red and its ink tone mark health, harm and errors; XP Green marks progression and recovery. Travel Sky and Rare Violet retain their game meanings, with brighter ink variants for text on dark surfaces.

Arcade Ground fills the page; Window Plum raises panels by tone; Raised Plum separates rows and selected cells; Arcade Night outlines the composition. Cream is primary text; Muted Lilac and Faint Lilac serve secondary and unavailable information. Screen White belongs to device previews and authored art, not general page surfaces.

**The One Meaning Rule.** Reuse established semantic colors; do not give the same stat a different meaning on another page.

**The Never Colour Alone Rule.** Pair color with text, signs, glyphs or shape. Preserve that information in every language.

Game scenery uses its own palettes from the art code. Desk Crawler varies by floor, time and occasion. Idle Angler uses species and fly tones, stepped sky and water bands, weather and seasons. These scenery colors do not become new global interface accents.

## Typography

Display titles use the actual --font-display stack: TG Pixel Digits, Pixelify Sans, Pixelify Sans Fallback, then system sans. TG Pixel Digits keeps numerals legible; Pixelify is self-hosted with Latin and Latin Extended support. The display class disables ligatures and uses the font variation setting from styles.css.

Press Start 2P with its measured fallback is the HUD/control voice. HUD labels use the observed small control size; larger counters use their route's larger step. Body text, narrative, small labels and metadata use system sans. Only buttons and button-like controls are capitalized; section titles, ordinary labels and sentences retain sentence case (D137).

Use tabular numerals for changing figures. Preserve self-hosted font subsets and measured fallback metrics to avoid layout shifts. Do not put long reading passages in arcade lettering.

## Layout

Use the existing route's container and responsive grid rather than imposing one page composition on every game. Shared controls have at least 44px standalone hit areas. Windows use the current spacing scale; small phones reduce button horizontal padding before the 375px step. Reading pages constrain line length; companion pages organize commands, state and history around the game's scene.

Desk Crawler's Hero page leads with the scene and HUD, available commands, reachable floors, progress and stories. Only the next locked floor appears in the map; later destinations belong in the career view. Idle Angler's Dock leads with the waterside scene, conditions, progress, bait, waters and stories, with fly-code discovery and the game's What's new card. The front page gives the two listed games equal standing and shows signed-in players their own games first.

Surface briefs own page-specific sequencing. Their targets are relative to apps/web, not the repository root.

## Elevation & Depth

Depth is drawn through tone and hard outlines rather than diffuse shadows or blur. Windows sit one plum step above the ground in night borders. The primary button has an inset darker bottom lip; pressing it moves the key down and halves the lip. Current choices use gold marks and outlines.

Motion comes from the existing stylesheet: stepped sheet and notice entrances, one-shot coin and checkbox feedback, the dialogue arrow and e-ink refresh. Existing goal-ready and notification states have their own animations. Respect reduced motion; do not turn every panel into a continuously animated object.

## Shapes

Interface controls, windows, tabs, badges, bars and input fields remain square. Standard windows and buttons have 3px edges; inputs and segmented controls have 2px edges; scene frames use the existing game-specific night outline. Rounded corners describe TRMNL hardware and its screen.

Use authored crisp pixel glyphs and sprites, with whole-number pixel scales where the renderer supports them. Spaces in a sprite are transparent; paper and shaded body cells are opaque. The companion must preserve scenery through gaps around held fish tails and fins.

## Components

### Buttons

Primary buttons are gold with night text and an inset lip; hover brightens the fill and a press sinks the key. Secondary buttons have cream edges and invert on interaction. Danger uses health/error tones. Quiet continuations use semibold underlined body text. Keyboard focus is the global gold outline.

Unavailable purchases show their price and remaining requirement as text. Temporarily disabled controls become flat raised-plum blocks with faint text and no lip. Busy controls stay focusable, expose aria-busy and aria-disabled, suppress repeated activation, and reserve both labels in one grid cell so their width does not jump (D219).

### Windows and inputs

Windows use the shared lighter plum fill and hard night border; they are containers, not pressable keys. Text inputs and selects use ground fill, cream edges and a 44px control height. Selects and disclosures use pixel chevrons. Checkboxes use the authored pixel tick; errors are readable text with alert semantics.

### Navigation and filters

The shared shell provides game-aware navigation with glyphs, readable labels and a gold current-page mark. Desk Crawler's Bag tab counts occupied slots whenever nonempty (D221). Segmented controls use pressed raised-plum cells with gold labels. Text and badge filters follow their existing route variants. Do not copy a fixed four-tab inventory into every game.

### Game scenes and device previews

The companion paints the device composition in its game's colors. Desk Crawler's current renderer lives with its hero route and art package. Idle Angler's Scene measures its container, composes at a clamped width and uses whole-number 2x, 3x or 4x scales, over stepped sky and water bands. Its PNG is transparent where the scenery bands should show through; individual fish and fly icons use crisp colored SVG cell paths.

The TRMNL preview remains a separate device frame using actual device layouts and rendering. Keep the monochrome or supported device palette inside that frame; do not apply companion scenery treatment to the device screenshot.

### Ledgers and stories

Use ruled rows and tabular figures for histories, resources and comparisons. Glyphs identify story kinds; signed changes carry units and semantic ink. Shared section titles provide clear landmarks. Avoid making every row look like a button or wrapping every fact in a separate window.

### What's new

The public dev log labels game-specific changes and can filter by game. The Hero and Dock cards show their own game's changes plus shared changes, using the same account dismissal mark (D225). Keep messages player-facing and localized.

## Do's and Don'ts

- **Do** preserve the established arcade shell and each game's own pixel world.
- **Do** use the current code for exact measurements, responsive behavior and state semantics.
- **Do** keep reading text legible, focus visible and controls usable on phones.
- **Do** preserve transparent sprite gaps and opaque body pixels.
- **Don't** replace the interface with rounded dashboard cards, generic icons or blurred glass.
- **Don't** apply the obsolete monochrome companion direction or require the original three-floor MVP layout.
- **Don't** infer launch status from implementation; use the platform registry and confirmed decisions.
