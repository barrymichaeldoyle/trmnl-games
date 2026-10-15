import { Canvas, inked, type Sprite } from '@trmnl-games/engine/art/canvas'
import { encodePngIndexed } from '@trmnl-games/engine/art/png'
import type { TimeBand, WaterId, Weather } from '../sim/types'
import type { AnglerPose } from './angler'
import { parseScenePath } from './route'
import { anglerPlacement, composeScene, STAGE_HEIGHT, STAGE_WIDTH, type SceneKey } from './scene'
import { fishTones, INK, type Tones } from './tones'

/**
 * The companion's painted scene (idle-angler.md "Companion"): the dock paints the device's own composition in colour,
 * as Desk Crawler's hero page does (D96). `composeScene` names each drawing's region on the canvas; this module
 * notes, per cell, the region and grid character last painted there, then tones every cell from the tables below.
 * Clear cells stay transparent so the sky and water bands (`sceneBands`) show through.
 */
const covered = (weather: Weather) => weather === 'overcast' || weather === 'rain' || weather === 'fog'

/** The sky above the horizon and the water below it, by time band, weather and water. */
const SKY: Record<TimeBand, readonly [clear: string, covered: string]> = {
  dawn: ['#f8cfa0', '#cdbcb4'],
  day: ['#a8d8f0', '#b9c6d2'],
  dusk: ['#f0a07a', '#b08a90'],
  night: ['#1f2550', '#262a44'],
}
const WATER: Record<WaterId, Record<TimeBand, string>> = {
  millpond: { dawn: '#8fb8b0', day: '#5fa8b8', dusk: '#9a7f90', night: '#243a5a' },
  river_bend: { dawn: '#8fb0c8', day: '#4f98c8', dusk: '#8a7aa0', night: '#20365a' },
  harbour_pier: { dawn: '#7fa0c0', day: '#3f80b8', dusk: '#7a6f98', night: '#1b2f52' },
  heron_lake: { dawn: '#94b8a8', day: '#5a9fa0', dusk: '#958396', night: '#22384f' },
  deep_sea: { dawn: '#6f90b8', day: '#2f6aa8', dusk: '#6a6290', night: '#16284a' },
  frozen_tarn: { dawn: '#d8e4ec', day: '#e6f0f6', dusk: '#c8c4d4', night: '#3a4a66' },
}

export function sceneBands(key: Pick<SceneKey, 'water' | 'band' | 'weather'>): { sky: string; water: string } {
  return { sky: SKY[key.band][covered(key.weather) ? 1 : 0], water: WATER[key.water][key.band] }
}

/** `a` moved toward `b` by `t` (0 to 1), as #rrggbb. */
export function mix(a: string, b: string, t: number): string {
  const channel = (hex: string, i: number) => parseInt(hex.slice(1 + i * 2, 3 + i * 2), 16)
  return `#${[0, 1, 2].map((i) => Math.round(channel(a, i) + (channel(b, i) - channel(a, i)) * t).toString(16).padStart(2, '0')).join('')}`
}

/**
 * The bands as stepped pixel gradients, top to bottom, each step `rows` tall: the sky pales toward the horizon and the
 * water deepens toward the viewer, in a few flat steps as pixel art does, never a smooth blend. Rows add up to the
 * stage's 21 sky rows and 19 water rows, so each step edge lands on a pixel row at any whole-number scale.
 */
export function sceneSteps(key: Pick<SceneKey, 'water' | 'band' | 'weather'>): { sky: Array<{ colour: string; rows: number }>; water: Array<{ colour: string; rows: number }> } {
  const { sky, water } = sceneBands(key)
  const night = key.band === 'night'
  const haze = night ? '#4a5280' : '#ffffff'
  // Ice deepens toward a cold blue rather than dark water.
  const deep = night ? '#0b1026' : key.water === 'frozen_tarn' ? '#8fb0cc' : '#1b2a4a'
  return {
    sky: [10, 6, 3, 2].map((rows, i) => ({ colour: mix(sky, haze, [0, 0.12, 0.24, 0.36][i]!), rows })),
    water: [3, 5, 5, 6].map((rows, i) => ({ colour: mix(water, i === 0 ? haze : deep, [0.14, 0, 0.1, 0.2][i]!), rows })),
  }
}

/** Backdrop and weather tones by day; the night table overrides what the dark changes. */
const DAY: Record<string, Tones> = {
  star: { ink: '#ffe08f' },
  moon: { ink: '#f4e7b0', paper: '#1f2550' },
  sun: { ink: '#f0a03a', paper: '#ffe08f' },
  dusk: { ink: '#d47a8a' },
  cloud: { ink: '#9cc0e0', paper: '#ffffff' },
  wind: { ink: '#ffffff' },
  horizon: { ink: '#2f4f6f' },
  mill: { ink: '#6b4a33', paper: '#fff3c4', shade: ['#b5793f', '#d9a066'] },
  reeds: { ink: '#3f7a2e' },
  willow: { ink: '#2f6b3a', shade: ['#4f9a3f', '#8fc45e'] },
  far_bank: { ink: '#5a8a3a' },
  lighthouse: { ink: '#b8303a', paper: '#ffffff', shade: ['#b8303a', '#ffffff'] },
  boat: { ink: '#5a3a24', paper: '#d9a066' },
  gull: { ink: '#ffffff' },
  ripple: { ink: '#e6f6ff' },
  deck: { ink: '#7a4f2e', shade: ['#9c6a3f', '#c48a55'] },
  grass: { ink: '#3f7a2e', paper: '#8fd36b', shade: ['#5aa348', '#8fd36b'] },
  fly: { ink: '#e0505a', paper: '#ffffff' },
  rod: { ink: '#8a5a3c' },
  line: { ink: '#2f3f5a' },
  float: { ink: '#e0503a', paper: '#ffffff' },
  splash: { ink: '#ffffff' },
  rest: { ink: '#8a5a3c' },
  rain: { ink: '#dff0ff' },
  fog: { ink: '#f0f4f8', paper: '#cfdce8' },
  // Content v2 (D162)
  pines: { ink: '#1f4a2e', shade: ['#2f6b3a', '#4f8a4a'] },
  boathouse: { ink: '#5a3a24', paper: '#fff3c4', shade: ['#8a5a3c', '#b5793f'] },
  heron: { ink: '#4a5a6a', paper: '#e8eef4' },
  fell: { ink: '#ffffff' },
  ice: { ink: '#a8c8dc' },
  hole: { ink: '#2f4f6f' },
  snowbank: { ink: '#a8c0d4', paper: '#ffffff', shade: ['#d4e4f0', '#ffffff'] },
  hull: { ink: '#5a3a24', shade: ['#8a5a3c', '#c48a55'] },
  oar: { ink: '#8a5a3c' },
  rail: { ink: '#e6e6e6' },
  cabin: { ink: '#2f3f5a', paper: '#fff3c4' },
  blossom: { ink: '#f08ab0' },
  dragonfly: { ink: '#3f8fd0' },
  leaf: { ink: '#d4782f' },
  snow: { ink: '#ffffff' },
}
const NIGHT: Record<string, Tones> = {
  ...DAY,
  cloud: { ink: '#4a5280', paper: '#7a80a8' },
  wind: { ink: '#8a90b8' },
  horizon: { ink: '#101a30' },
  mill: { ink: '#4a3324', paper: '#ffd166', shade: ['#6b4a33', '#8a6a4a'] },
  reeds: { ink: '#2a4a28' },
  willow: { ink: '#1f4a28', shade: ['#2f5a30', '#4a7a40'] },
  far_bank: { ink: '#3a5a2a' },
  gull: { ink: '#c9d3e0' },
  ripple: { ink: '#6f8fc0' },
  deck: { ink: '#4a3324', shade: ['#6b4a33', '#8a6a4a'] },
  grass: { ink: '#24481f', paper: '#4a7a40', shade: ['#3a6a34', '#4a7a40'] },
  line: { ink: '#c9d3e0' },
  rain: { ink: '#8aa0c8' },
  fog: { ink: '#8a98b8', paper: '#4a5478' },
}
/** Dawn and dusk keep the day's tones under their own sky, with ripples catching the low light. */
const LOW_SUN: Record<string, Tones> = { ...DAY, ripple: { ink: '#fff0d8' } }

const ANGLER = {
  hat: { ink: '#4a3a2a', paper: '#7a8a4a' },
  skin: '#f2c39b',
  jacket: ['#3f6b5a', '#5f8f7a'] as const,
  waders: ['#3a4a5c', '#55697f'] as const,
  steel: '#c9d3e0',
  stool: '#8a5a3c',
}

/**
 * The angler's parts by row (angler.ts): hat above and on the brim row, face below it, the jacket where the sprite
 * shades with ':', the waders where it hatches with '=', then boots, or the stool when sitting.
 */
function anglerTone(sprite: Sprite, pose: AnglerPose, ch: string, x: number, y: number): string {
  const rows = sprite.rows
  const brim = rows.findIndex((row) => row.includes('########'))
  const firstLeg = rows.findIndex((row) => row.includes('='))
  const lastLeg = rows.length - 1 - [...rows].reverse().findIndex((row) => row.includes('='))
  const shaded = ch === ':' || ch === '.' || ch === '='
  if (y <= brim) return ch === 'w' ? ANGLER.hat.paper : ANGLER.hat.ink
  if (y <= brim + 3) return ch === 'w' ? ANGLER.skin : INK
  if (shaded) return (y >= firstLeg ? ANGLER.waders : ANGLER.jacket)[inked(ch, x, y) ? 0 : 1]
  if (y > lastLeg) return pose === 'paused' ? ANGLER.stool : INK
  if (ch === 'w') return y >= firstLeg ? ANGLER.waders[1] : ANGLER.steel
  // Solid rows between the jacket and the waders are the belt and hem; solid rows among the legs are the boots' tops.
  return y < firstLeg ? ANGLER.jacket[0] : INK
}

/** A canvas that also notes, per cell, the region and grid character last painted there. */
class PaintedCanvas extends Canvas {
  readonly regions: string[]
  readonly chars: string[]

  constructor(width: number) {
    super(width, STAGE_HEIGHT)
    this.regions = new Array<string>(width * STAGE_HEIGHT).fill('')
    this.chars = new Array<string>(width * STAGE_HEIGHT).fill('')
  }

  private note(x: number, y: number, ch: string): void {
    if (x < 0 || y < 0 || x >= this.width || y >= this.height) return
    this.regions[y * this.width + x] = this.region
    this.chars[y * this.width + x] = ch
  }

  // Lines, rods, splashes and fog erase through `set`; sprites and shades through `paint`, whose character wins.
  override set(x: number, y: number, black: boolean): void {
    super.set(x, y, black)
    this.note(x, y, black ? '#' : 'w')
  }

  override paint(x: number, y: number, ch: string): void {
    if (inked(ch, x, y) === null) return
    super.paint(x, y, ch)
    this.note(x, y, ch)
  }
}

/**
 * The stage in full colour as rows of colours (null for clear), painted from the same composition as the device
 * image, at the composed width or any width the device may show (`clampStageWidth`).
 */
export function paintedScene(key: SceneKey, width = STAGE_WIDTH): Array<Array<string | null>> {
  const c = new PaintedCanvas(width)
  composeScene(key, c)
  const angler = anglerPlacement(key)
  const table = key.band === 'night' ? NIGHT : key.band === 'day' ? DAY : LOW_SUN
  // The colour layer's own polish (the device art is unchanged): ripples become solid glints in a paler tint of their
  // water rather than white checker dots, the sea's bright rows a little brighter, and the horizon a deeper shade of
  // the water instead of one navy line for every water.
  const waterTone = WATER[key.water][key.band]
  const glint = mix(waterTone, key.band === 'night' ? '#8fa8d8' : key.band === 'day' ? '#ffffff' : '#fff0d8', 0.38)
  const sparkle = mix(waterTone, key.band === 'night' ? '#c9d3e0' : '#ffffff', 0.62)
  const horizon = mix(waterTone, '#101a30', 0.55)
  return Array.from({ length: STAGE_HEIGHT }, (_, y) =>
    Array.from({ length: width }, (_, x) => {
      const ch = c.chars[y * width + x]!
      const region = c.regions[y * width + x]!
      if (!ch) return null
      if (region === 'angler') return anglerTone(angler.sprite, key.pose, ch, x - angler.left, y - angler.top)
      if (region === 'ripple') return ch === '#' ? sparkle : glint
      if (region === 'horizon') return horizon
      const tones: Tones = region.startsWith('fish:') ? fishTones(region.slice(5)) : (table[region] ?? {})
      if (ch === '#') return tones.ink ?? INK
      if (ch === 'w') return tones.paper ?? null
      const black = inked(ch, x, y)
      if (tones.shade) return tones.shade[black ? 0 : 1]
      return black ? (tones.ink ?? INK) : (tones.paper ?? null)
    }),
  )
}

/** The painted scene as a PNG data URI, `width` columns by the stage's 40 rows. */
export function paintedSceneUri(key: SceneKey, width = STAGE_WIDTH): string {
  const grid = paintedScene(key, width)
  const colours = new Map<string, number>([['', 0]])
  const index = new Uint8Array(width * STAGE_HEIGHT)
  grid.forEach((row, y) =>
    row.forEach((colour, x) => {
      const id = colour ?? ''
      if (!colours.has(id)) colours.set(id, colours.size)
      index[y * width + x] = colours.get(id)!
    }),
  )
  const palette = [...colours.keys()].map((hex) => (hex ? ([1, 3, 5].map((i) => parseInt(hex.slice(i, i + 2), 16)) as [number, number, number]) : ([0, 0, 0] as const)))
  const png = encodePngIndexed(width, STAGE_HEIGHT, index, palette, 0)
  let binary = ''
  for (const byte of png) binary += String.fromCharCode(byte)
  return `data:image/png;base64,${btoa(binary)}`
}

/** The scene key behind a device image URL (`scene_base/<width>/<scale>.png`), or null for anything that is not one. */
export function sceneKeyFromUrl(url: string): SceneKey | null {
  const parsed = parseScenePath(url.replace(/^https?:\/\/[^/]+/, '').replace(/\?.*$/, ''))
  if (!parsed) return null
  const { scale: _scale, width: _width, ...key } = parsed
  return key
}
