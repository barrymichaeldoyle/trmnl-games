/**
 * Colours for the companion's art (idle-angler.md "Art"). The device draws everything in one ink; the web app paints the
 * same sprites, so each fish, fly and scene part names its tones here and nowhere else. A sprite's '#' cells take
 * `ink`, its 'w' cells `paper`, and its shades (':', '.', '=') alternate the two `shade` tones on the device's checker,
 * dark where the device inks and light where it leaves paper, so shading reads as texture rather than black noise.
 */
export interface Tones {
  readonly ink?: string
  readonly paper?: string
  readonly shade?: readonly [string, string]
}

/** Foreground outlines in the page's night rather than flat black. */
export const INK = '#1b1530'

/**
 * Each species: outline, paper and the two tones its shading alternates. Paper is the belly on fish whose body is
 * shaded, and the body itself on fish the art draws in paper with marks over it (shine, bars, mottled). Rarer fish
 * get the richer colours.
 */
export const FISH_TONES: Readonly<Record<string, Required<Tones>>> = {
  minnow: { ink: '#3a4a3a', paper: '#eef3e6', shade: ['#7f9a6a', '#b9cfa3'] },
  roach: { ink: '#3a3f5a', paper: '#dfe3f4', shade: ['#8a94b8', '#c9cfe6'] },
  rudd: { ink: '#6b4a1a', paper: '#f6d47a', shade: ['#d49a3a', '#f0c36b'] },
  perch: { ink: '#2f4a2a', paper: '#d8d87a', shade: ['#6f9a3a', '#b4c85a'] },
  bream: { ink: '#4a3a2a', paper: '#efe3cc', shade: ['#9a7a4a', '#c9a876'] },
  crucian_carp: { ink: '#5a4a1a', paper: '#f6ebc2', shade: ['#b8902a', '#dcb552'] },
  tench: { ink: '#1f3a24', paper: '#cfe0b8', shade: ['#3f6b3a', '#6f9a5a'] },
  eel: { ink: '#1f2a22', paper: '#c9d3b8', shade: ['#3f4f3a', '#6b7a5a'] },
  common_carp: { ink: '#4a3215', paper: '#f2e0b4', shade: ['#9a6f2a', '#c9983f'] },
  golden_carp: { ink: '#7a3a10', paper: '#ffc24e', shade: ['#f08a3b', '#ffd97a'] },
  gudgeon: { ink: '#4a3f2a', paper: '#f0e8d6', shade: ['#9a8a62', '#c9bb94'] },
  dace: { ink: '#3a4a5a', paper: '#dde8f2', shade: ['#8aa0b8', '#c9d8e6'] },
  chub: { ink: '#3f3a1f', paper: '#f2ead0', shade: ['#9a8a4a', '#c9ba7a'] },
  grayling: { ink: '#3f2f5a', paper: '#f2ecff', shade: ['#8a7ab8', '#c9bde6'] },
  brown_trout: { ink: '#4a2f15', paper: '#f6e3b8', shade: ['#a0702a', '#d9a94f'] },
  barbel: { ink: '#4a3a1f', paper: '#f2e4c4', shade: ['#a88a4a', '#d4b97a'] },
  rainbow_trout: { ink: '#4a2f4a', paper: '#ffe6ef', shade: ['#d46a8a', '#8fbf9f'] },
  pike: { ink: '#1f3a1f', paper: '#b8c88a', shade: ['#4f7a2a', '#8fae5a'] },
  zander: { ink: '#3a3f3a', paper: '#d0d4b8', shade: ['#7f8a6a', '#b8c09a'] },
  salmon: { ink: '#2f3f5a', paper: '#dfe8f4', shade: ['#6f8fb8', '#e8b8c0'] },
  sand_eel: { ink: '#2f4a4a', paper: '#d8f0e8', shade: ['#6fa89a', '#b0d8cc'] },
  whiting: { ink: '#4a4a3f', paper: '#fbf8ef', shade: ['#b0a888', '#dcd6c0'] },
  mackerel: { ink: '#1f3a4a', paper: '#eef6ff', shade: ['#2f7a8a', '#6fc0cc'] },
  pollock: { ink: '#2f3a2a', paper: '#e6e8d6', shade: ['#5f6f3a', '#9aa86a'] },
  flounder: { ink: '#3f2f1f', paper: '#e6d8c0', shade: ['#8a6a3a', '#b8955a'] },
  wrasse: { ink: '#5a1f2a', paper: '#f08a5a', shade: ['#d4473f', '#f8b07a'] },
  sea_bass: { ink: '#2f3a4a', paper: '#dfe6f0', shade: ['#7a8fa8', '#c0d0e0'] },
  conger_eel: { ink: '#2a2a33', paper: '#d8d8e0', shade: ['#5a5a6a', '#8a8a9a'] },
  smoothhound: { ink: '#2f3a4a', paper: '#eef2f8', shade: ['#6a7f9a', '#a8b8cc'] },
  thornback_ray: { ink: '#3f2f1f', paper: '#e6d2b0', shade: ['#8a6a3a', '#c09a5a'] },
  // Content v2 (D162)
  sea_trout: { ink: '#2f3f4a', paper: '#eef2f6', shade: ['#7a8a9a', '#c4ccd8'] },
  garfish: { ink: '#1f4a3a', paper: '#e6f6ee', shade: ['#3f9a6a', '#8fd0a8'] },
  bleak: { ink: '#3a4a5a', paper: '#f4f8ff', shade: ['#9aa8c0', '#d4dcec'] },
  ide: { ink: '#4a3a2a', paper: '#f2e8d8', shade: ['#b08a5a', '#d8b88a'] },
  silver_bream: { ink: '#4a4a55', paper: '#f6f6fa', shade: ['#a8aab8', '#d8dae4'] },
  mirror_carp: { ink: '#4a3a1f', paper: '#f0dca8', shade: ['#b8903f', '#e0c070'] },
  grass_carp: { ink: '#3a4a2a', paper: '#e8eccf', shade: ['#7f8f4a', '#b8c47a'] },
  leather_carp: { ink: '#3f2f1f', paper: '#d8c098', shade: ['#8a6a3a', '#b8955a'] },
  wels_catfish: { ink: '#2a2a22', paper: '#d0ccb8', shade: ['#5a5a42', '#8a8a6a'] },
  lake_trout: { ink: '#2f3a4a', paper: '#e8eef4', shade: ['#6a7f95', '#b0c0d4'] },
  ghost_koi: { ink: '#5a4a4a', paper: '#fffaf4', shade: ['#e8c8b8', '#fff0e0'] },
  gurnard: { ink: '#5a1f1f', paper: '#f8c8b0', shade: ['#d4573f', '#f0a07a'] },
  coalfish: { ink: '#1f252f', paper: '#d8dce4', shade: ['#3f4a5a', '#7a8494'] },
  haddock: { ink: '#2f2f3a', paper: '#eceef4', shade: ['#6a6f80', '#aab0c0'] },
  ling: { ink: '#3a3f2a', paper: '#dcdcc4', shade: ['#7a7f55', '#aab08a'] },
  cod: { ink: '#3a3a22', paper: '#e8e2c4', shade: ['#8a7f4a', '#c0b47a'] },
  turbot: { ink: '#3a2f1f', paper: '#dccbb0', shade: ['#7a6a4a', '#b0a07a'] },
  tope: { ink: '#2f3540', paper: '#e4e8ee', shade: ['#6a7484', '#a8b0bc'] },
  blue_shark: { ink: '#1f2f5a', paper: '#e8f0ff', shade: ['#3f6ab8', '#8fb0e8'] },
  halibut: { ink: '#2f2a1f', paper: '#d8d0bc', shade: ['#5f5540', '#9a9078'] },
  smelt: { ink: '#3a5a5a', paper: '#f0fbfb', shade: ['#8ac0c0', '#c8eaea'] },
  whitefish: { ink: '#3a4048', paper: '#f6f8fa', shade: ['#a0a8b4', '#d8dee6'] },
  ruffe: { ink: '#3f3a1f', paper: '#e8e0b8', shade: ['#8a7f3a', '#c0b46a'] },
  vendace: { ink: '#2f3f55', paper: '#eef4fa', shade: ['#7a95b8', '#c0d4ea'] },
  arctic_char: { ink: '#4a1f2a', paper: '#f8d8c8', shade: ['#d45a4a', '#f0a090'] },
  brook_trout: { ink: '#2f3a2a', paper: '#e8f0d8', shade: ['#5f8a4a', '#c8705a'] },
  burbot: { ink: '#2f2a1f', paper: '#d4ccb0', shade: ['#6a5f40', '#9a9070'] },
  golden_char: { ink: '#7a3a10', paper: '#ffd06a', shade: ['#f0903b', '#ffe08a'] },
}

const FISH_DEFAULT: Required<Tones> = { ink: '#3a3f5a', paper: '#f4f4ff', shade: ['#8a94b8', '#c9cfe6'] }

export const fishTones = (speciesId: string): Required<Tones> => FISH_TONES[speciesId] ?? FISH_DEFAULT

/** Each fly in the box, by the colours its name promises. */
export const FLY_TONES: Readonly<Record<string, Tones>> = {
  black_gnat: { ink: '#1b1530', shade: ['#3a3a4a', '#6a6a7a'] },
  royal_coachman: { ink: '#5a1f2a', paper: '#ffffff', shade: ['#b8303a', '#e0505a'] },
  mayfly: { ink: '#5a5a2a', paper: '#fff8d0', shade: ['#b8b04a', '#e6dc7a'] },
  woolly_bugger: { ink: '#2f3a1f', paper: '#cfe0b8', shade: ['#4f6b2a', '#7f9a4a'] },
  red_tag: { ink: '#2f4a2a', paper: '#e0505a', shade: ['#2f7a5a', '#5aa87a'] },
  blue_dun: { ink: '#2f3a5a', paper: '#e6ecff', shade: ['#6f7fa8', '#a8b8d8'] },
  march_brown: { ink: '#4a2f15', paper: '#f2e0b4', shade: ['#8a5a2c', '#b8803f'] },
  zulu: { ink: '#1b1530', paper: '#e0505a', shade: ['#3a3a4a', '#5a5a6a'] },
  silver_doctor: { ink: '#2f3f6a', paper: '#ffffff', shade: ['#5d8fd6', '#c9d3e0'] },
  greenwell: { ink: '#3f4a1a', paper: '#fff0b8', shade: ['#7a8a2a', '#b0c04a'] },
  hares_ear: { ink: '#4a3a2a', paper: '#f2e8d6', shade: ['#9a8a62', '#c9b58a'] },
  golden_olive: { ink: '#5a4a10', paper: '#fff0b8', shade: ['#9a8a2a', '#d9b84a'] },
}

const FLY_DEFAULT: Tones = { ink: INK, paper: '#f4f1ff', shade: ['#6a6a7a', '#a8a8b8'] }

export const flyTones = (flyId: string): Tones => FLY_TONES[flyId] ?? FLY_DEFAULT
