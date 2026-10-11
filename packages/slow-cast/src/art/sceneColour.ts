import { Canvas, inked, type Sprite } from '@trmnl-games/engine/art/canvas'
import { encodePngIndexed } from '@trmnl-games/engine/art/png'
import type { TimeBand, WaterId, Weather } from '../sim/types'
import type { AnglerPose } from './angler'
import { parseScenePath } from './route'
import { anglerPlacement, composeScene, STAGE_HEIGHT, STAGE_WIDTH, type SceneKey } from './scene'
import { fishTones, INK, type Tones } from './tones'

/**
 * The companion's painted scene (slow-cast.md "Companion"): the dock paints the device's own composition in colour,
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
}

export function sceneBands(key: Pick<SceneKey, 'water' | 'band' | 'weather'>): { sky: string; water: string } {
  return { sky: SKY[key.band][covered(key.weather) ? 1 : 0], water: WATER[key.water][key.band] }
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
  readonly regions: string[] = new Array<string>(STAGE_WIDTH * STAGE_HEIGHT).fill('')
  readonly chars: string[] = new Array<string>(STAGE_WIDTH * STAGE_HEIGHT).fill('')

  constructor() {
    super(STAGE_WIDTH, STAGE_HEIGHT)
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

/** The stage in full colour as rows of colours (null for clear), painted from the same composition as the device image. */
export function paintedScene(key: SceneKey): Array<Array<string | null>> {
  const c = new PaintedCanvas()
  composeScene(key, c)
  const angler = anglerPlacement(key)
  const table = key.band === 'night' ? NIGHT : key.band === 'day' ? DAY : LOW_SUN
  return Array.from({ length: STAGE_HEIGHT }, (_, y) =>
    Array.from({ length: STAGE_WIDTH }, (_, x) => {
      const ch = c.chars[y * STAGE_WIDTH + x]!
      const region = c.regions[y * STAGE_WIDTH + x]!
      if (!ch) return null
      if (region === 'angler') return anglerTone(angler.sprite, key.pose, ch, x - angler.left, y - angler.top)
      const tones: Tones = region.startsWith('fish:') ? fishTones(region.slice(5)) : (table[region] ?? {})
      if (ch === '#') return tones.ink ?? INK
      if (ch === 'w') return tones.paper ?? null
      const black = inked(ch, x, y)
      if (tones.shade) return tones.shade[black ? 0 : 1]
      return black ? (tones.ink ?? INK) : (tones.paper ?? null)
    }),
  )
}

/** The painted scene as a stage-sized PNG data URI. */
export function paintedSceneUri(key: SceneKey): string {
  const grid = paintedScene(key)
  const colours = new Map<string, number>([['', 0]])
  const index = new Uint8Array(STAGE_WIDTH * STAGE_HEIGHT)
  grid.forEach((row, y) =>
    row.forEach((colour, x) => {
      const id = colour ?? ''
      if (!colours.has(id)) colours.set(id, colours.size)
      index[y * STAGE_WIDTH + x] = colours.get(id)!
    }),
  )
  const palette = [...colours.keys()].map((hex) => (hex ? ([1, 3, 5].map((i) => parseInt(hex.slice(i, i + 2), 16)) as [number, number, number]) : ([0, 0, 0] as const)))
  const png = encodePngIndexed(STAGE_WIDTH, STAGE_HEIGHT, index, palette, 0)
  let binary = ''
  for (const byte of png) binary += String.fromCharCode(byte)
  return `data:image/png;base64,${btoa(binary)}`
}

/** The scene key behind a device image URL (`scene_base/<scale>.png`), or null for anything that is not one. */
export function sceneKeyFromUrl(url: string): SceneKey | null {
  const parsed = parseScenePath(url.replace(/^https?:\/\/[^/]+/, '').replace(/\?.*$/, ''))
  if (!parsed) return null
  const { scale: _scale, ...key } = parsed
  return key
}
