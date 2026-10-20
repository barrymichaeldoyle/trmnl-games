import { Canvas, sprite, type Sprite } from '@trmnl-games/engine/art/canvas'
import type { Group, Season, Stage, TimeBand, Weather } from '../sim/types'

/**
 * Little Plot scene (little-plot.md "Device"): the plot from above inside its hedge, the sky for the local time of
 * day along the top, the weather over everything and the season's dressing on the hedge, on a 40-row stage whose
 * width each layout chooses (D125). The shed is anchored to the left edge and the structures to the right; the plot
 * sits beside the shed, so a wider stage shows more garden between them. Each bed is a 12 by 9 tile drawn at its
 * stage with its group's head when ripe; a cross is starred; glass frames a greenhouse bed. Deterministic per key
 * and width, so each image URL is immutable.
 */
export const SCENE_VERSION = 1
export const STAGE_WIDTH = 152
export const STAGE_HEIGHT = 40
export const MIN_STAGE_WIDTH = 120
export const MAX_STAGE_WIDTH = 400
export const clampStageWidth = (width: number) => Math.min(MAX_STAGE_WIDTH, Math.max(MIN_STAGE_WIDTH, Math.floor(width)))
/** Drawings at or past this column move with the right edge. */
const RIGHT_ANCHOR = 100
const anchored = (c: Canvas, x: number) => (x >= RIGHT_ANCHOR ? x + c.width - STAGE_WIDTH : x)
/** The sky strip, then the hedge's top row; the beds start under it. */
const SKY = 8
const HEDGE_TOP = SKY
const HEDGE_BOTTOM = STAGE_HEIGHT - 1
const TILE_W = 12
const TILE_H = 9
const PLOT_LEFT = 22
const PLOT_TOP = HEDGE_TOP + 2

export type BedStage = Stage | 'empty'
export interface SceneBed {
  readonly stage: BedStage
  readonly group: Group | null
  readonly crossed: boolean
  readonly greenhouse: boolean
}
/** The items the scene draws, in the key's order. */
export const SCENE_ITEMS = ['fence', 'scarecrow', 'lantern', 'garden_cat', 'gnome_trap', 'pond', 'beehive', 'bird_table', 'compost_bin', 'bench', 'path', 'decoy_gnome', 'sundial', 'wind_chimes'] as const
export type SceneItem = (typeof SCENE_ITEMS)[number]
const ITEM_LETTER: Readonly<Record<SceneItem, string>> = { fence: 'f', scarecrow: 's', lantern: 'l', garden_cat: 'c', gnome_trap: 't', pond: 'p', beehive: 'b', bird_table: 'i', compost_bin: 'm', bench: 'e', path: 'a', decoy_gnome: 'd', sundial: 'u', wind_chimes: 'w' }
const LETTER_ITEM = Object.fromEntries(Object.entries(ITEM_LETTER).map(([k, v]) => [v, k])) as Record<string, SceneItem>

export interface SceneKey {
  readonly band: TimeBand
  readonly weather: Weather
  readonly season: Season
  readonly rows: number
  readonly cols: number
  readonly beds: readonly SceneBed[]
  readonly items: readonly SceneItem[]
  /** A gnome is drawn mid-escape on the tick it visited. */
  readonly gnome: boolean
  /** The newest pressed flower hangs in the shed window; null for none. */
  readonly flower: boolean
}

const STAGE_LETTER: Readonly<Record<BedStage, string>> = { empty: 'e', sown: 's', sprout: 'p', leaf: 'l', bud: 'b', ripe: 'r' }
const LETTER_STAGE = Object.fromEntries(Object.entries(STAGE_LETTER).map(([k, v]) => [v, k])) as Record<string, BedStage>
const GROUP_LETTER: Readonly<Record<Group, string>> = { flower: 'f', vegetable: 'v', herb: 'h' }
const LETTER_GROUP = Object.fromEntries(Object.entries(GROUP_LETTER).map(([k, v]) => [v, k])) as Record<string, Group>

/** Each bed as four letters: stage, group (x for none), cross (* or -), glass (g or -). */
export const encodeBeds = (beds: readonly SceneBed[]): string => beds.map((b) => `${STAGE_LETTER[b.stage]}${b.group ? GROUP_LETTER[b.group] : 'x'}${b.crossed ? '*' : '-'}${b.greenhouse ? 'g' : '-'}`).join('')
export function decodeBeds(text: string, count: number): SceneBed[] | null {
  if (text.length !== count * 4) return null
  const beds: SceneBed[] = []
  for (let i = 0; i < count; i += 1) {
    const stage = LETTER_STAGE[text[i * 4]!]
    const groupLetter = text[i * 4 + 1]!
    const group = groupLetter === 'x' ? null : LETTER_GROUP[groupLetter]
    const cross = text[i * 4 + 2]
    const glass = text[i * 4 + 3]
    if (stage === undefined || group === undefined || (cross !== '*' && cross !== '-') || (glass !== 'g' && glass !== '-')) return null
    beds.push({ stage, group, crossed: cross === '*', greenhouse: glass === 'g' })
  }
  return beds
}
export const encodeItems = (items: readonly SceneItem[]): string => SCENE_ITEMS.filter((i) => items.includes(i)).map((i) => ITEM_LETTER[i]).join('') || '-'
export function decodeItems(text: string): SceneItem[] | null {
  if (text === '-') return []
  const items: SceneItem[] = []
  for (const ch of text) {
    const item = LETTER_ITEM[ch]
    if (item === undefined || items.includes(item)) return null
    items.push(item)
  }
  return items
}

const sun = sprite(`
   #
 #   #
  ###
# #w# #
  ###
 #   #
   #
`)
const lowSun = sprite(`
 #  #  #
  #   #
   ###
 ##www##
#wwwwwww#
`)
const moon = sprite(`
  ###
 ##w
##w
##
##w
 ##w
  ###
`)
const star = sprite(`
 #
###
 #
`)
const cloud = sprite(`
   ###
 ###ww##
#wwwwwww#
 #######
`)
const shed = sprite(`
   ####
  #::::#
 #::::::#
##########
#w#    #w#
#w#  # #w#
#w#  # #w#
##########
`)
const shedFlower = sprite(`
 #
###
 #
`)
const scarecrow = sprite(`
  ###
 #www#
  ###
#######
  #:#
  #:#
  # #
  # #
`)
const lantern = sprite(`
 ##
#ww#
#ww#
 ##
 #
 #
###
`)
const cat = sprite(`
#   #
#####
#w#w#
 ###
 #w#  ##
 ###  #
  ####
`)
const trap = sprite(`
######
#    #
# ## #
#    #
######
`)
const trappedGnome = sprite(`
   #
  ###
 #####
######
 #ww#
  ##
`)
const pond = sprite(`
   ######
 ##::::::##
#::::::::::#
#::::::::::#
 ##::::::##
   ######
`)
const frog = sprite(`
# #
###
###
`)
const beehive = sprite(`
 ####
######
#w##w#
######
 #ww#
 ####
`)
const birdTable = sprite(`
#######
   #
   #
   #
  ###
`)
const bird = sprite(`
 ##
###
 # #
`)
const compost = sprite(`
######
#....#
#....#
#....#
######
`)
const bench = sprite(`
########
#      #
########
#      #
#      #
`)
const decoy = sprite(`
  #
 ###
#####
 #w#
 ###
 # #
`)
const sundial = sprite(`
 #####
# ##  #
#  #  #
 #####
  ###
`)
const chimes = sprite(`
#####
# # #
# # #
#   #
`)
const gnome = sprite(`
  #
 ###
#####
 #ww#
 ####
 #  #
#    #
`)
const fencePost = sprite(`
#
#
#
`)

const seedDots = (c: Canvas, x: number, y: number) => {
  c.set(x + 3, y + 4, true)
  c.set(x + 6, y + 5, true)
  c.set(x + 9, y + 4, true)
}
const sprout = sprite(`
# #
 #
 #
`)
const leafPlant = sprite(`
#   #
 # #
## ##
  #
  #
`)
const budPlant = sprite(`
  ##
 #  #
# ## #
 # #
## ##
  #
`)
const ripeFlower = sprite(`
 #w#
#w#w#
 #w#
#  #
 # # #
  ##
  #
`)
const ripeVegetable = sprite(`
 ####
#:::##
#::::#
##:::#
 ####
  #
  #
`)
const ripeHerb = sprite(`
# # #
#####
 ###
# # #
 ###
  #
  #
`)
const crossStar = sprite(`
 #
###
 #
`)

/** Each drawing names its region on the canvas so the companion's painted scene can tone it; the 1-bit image ignores the names. */
function sky(c: Canvas, band: TimeBand, weather: Weather): void {
  const covered = weather === 'overcast' || weather === 'rain' || weather === 'fog'
  if (band === 'night') {
    c.region = 'star'
    if (!covered) for (const [x, y] of [[12, 2], [40, 5], [70, 1], [98, 4], [118, 6], [140, 2]] as const) c.draw(star, anchored(c, x), y)
    c.region = 'moon'
    if (weather !== 'overcast' && weather !== 'rain') c.draw(moon, anchored(c, 128), 0)
  } else if (band === 'day') {
    c.region = 'sun'
    if (!covered) c.draw(sun, anchored(c, 128), 0)
    c.region = 'cloud'
    c.draw(cloud, 40, 1)
  } else {
    c.region = 'sun'
    if (!covered) c.draw(lowSun, band === 'dawn' ? anchored(c, 136) : 2, SKY - 5)
    c.region = 'dusk'
    if (band === 'dusk') c.rect(0, 0, c.width, 2, '.')
  }
  c.region = 'cloud'
  if (covered) {
    c.draw(cloud, 10, 0)
    c.draw(cloud, 64, 2)
    c.draw(cloud, anchored(c, 112), 1)
  }
}

/** The hedge round the plot, dressed for the season: dots of blossom, full in summer, bare hatch and snow in winter. */
function hedge(c: Canvas, season: Season): void {
  c.region = 'hedge'
  const fill = season === 'winter' ? '=' : ':'
  c.rect(0, HEDGE_TOP, c.width, 2, fill)
  c.rect(0, HEDGE_BOTTOM, c.width, 1, fill)
  c.hline(0, c.width - 1, HEDGE_TOP, '#')
  c.hline(0, c.width - 1, HEDGE_BOTTOM, '#')
  if (season === 'spring') {
    c.region = 'blossom'
    for (let x = 3; x < c.width; x += 9) c.set(x, HEDGE_TOP + 1, false)
  } else if (season === 'autumn') {
    c.region = 'leaf'
    for (const [x, y] of [[30, 12], [58, 20], [88, 14], [116, 24], [140, 18]] as const) {
      c.set(anchored(c, x), y, true)
      c.set(anchored(c, x) + 1, y + 1, true)
    }
  } else if (season === 'winter') {
    c.region = 'snow'
    for (let y = 10; y < HEDGE_BOTTOM - 1; y += 6) for (let x = (y * 7) % 11; x < c.width; x += 13) c.paint(x, y, '#')
  }
}

/** One bed tile: its soil edge, then the plant at its stage, its group's head when ripe, the cross star and the glass. */
function bed(c: Canvas, x: number, y: number, b: SceneBed): void {
  c.region = 'soil'
  c.hline(x, x + TILE_W - 1, y, ':')
  c.hline(x, x + TILE_W - 1, y + TILE_H - 1, ':')
  c.vline(x, y, y + TILE_H - 1, ':')
  c.vline(x + TILE_W - 1, y, y + TILE_H - 1, ':')
  c.region = `plant:${b.stage}`
  switch (b.stage) {
    case 'empty':
      c.set(x + 5, y + 4, true)
      break
    case 'sown':
      seedDots(c, x, y)
      break
    case 'sprout':
      c.draw(sprout, x + 4, y + 4)
      break
    case 'leaf':
      c.draw(leafPlant, x + 3, y + 2)
      break
    case 'bud':
      c.draw(budPlant, x + 3, y + 1)
      break
    case 'ripe':
      c.draw(b.group === 'vegetable' ? ripeVegetable : b.group === 'herb' ? ripeHerb : ripeFlower, x + 3, y + 1)
      break
  }
  if (b.crossed) {
    c.region = 'cross'
    c.draw(crossStar, x + TILE_W - 4, y + 1)
  }
  if (b.greenhouse) {
    c.region = 'glass'
    c.hline(x - 1, x + TILE_W, y - 1, '#')
    c.hline(x - 1, x + TILE_W, y + TILE_H, '#')
    c.vline(x - 1, y - 1, y + TILE_H, '#')
    c.vline(x + TILE_W, y - 1, y + TILE_H, '#')
  }
}

function plot(c: Canvas, key: SceneKey): void {
  for (let r = 0; r < key.rows; r += 1) {
    for (let col = 0; col < key.cols; col += 1) {
      const b = key.beds[r * key.cols + col] ?? { stage: 'empty', group: null, crossed: false, greenhouse: false }
      bed(c, PLOT_LEFT + col * (TILE_W + 2), PLOT_TOP + r * (TILE_H + 1), b)
    }
  }
  if (key.items.includes('path')) {
    c.region = 'path'
    const y = PLOT_TOP + key.rows * (TILE_H + 1) + 1
    if (y < HEDGE_BOTTOM - 1) for (let x = PLOT_LEFT; x < PLOT_LEFT + key.cols * (TILE_W + 2); x += 3) c.set(x, y, true)
  }
}

/** The shed by the left edge, with the newest pressed flower in its window, and the structures by the right. */
function furniture(c: Canvas, key: SceneKey): void {
  c.region = 'shed'
  c.draw(shed, 2, HEDGE_BOTTOM - 9)
  if (key.flower) {
    c.region = 'flower'
    c.draw(shedFlower, 3, HEDGE_BOTTOM - 5)
  }
  const plotRight = PLOT_LEFT + key.cols * (TILE_W + 2)
  const left = (x: number) => Math.max(plotRight + 2, anchored(c, x))
  if (key.items.includes('fence')) {
    c.region = 'fence'
    for (let x = 1; x < c.width; x += 6) c.draw(fencePost, x, HEDGE_TOP + 2)
    c.hline(0, c.width - 1, HEDGE_TOP + 3, '#')
  }
  if (key.items.includes('pond')) {
    c.region = 'pond'
    c.draw(pond, left(132), HEDGE_BOTTOM - 8)
    c.region = 'frog'
    c.draw(frog, left(132) + 2, HEDGE_BOTTOM - 10)
  }
  if (key.items.includes('beehive')) {
    c.region = 'beehive'
    c.draw(beehive, left(118), HEDGE_TOP + 4)
  }
  if (key.items.includes('bird_table')) {
    c.region = 'bird_table'
    c.draw(birdTable, left(104), HEDGE_TOP + 5)
    c.region = 'bird'
    c.draw(bird, left(104) + 1, HEDGE_TOP + 2)
  }
  if (key.items.includes('compost_bin')) {
    c.region = 'compost'
    c.draw(compost, 12, HEDGE_TOP + 3)
  }
  if (key.items.includes('scarecrow')) {
    c.region = 'scarecrow'
    c.draw(scarecrow, left(112), HEDGE_BOTTOM - 10)
  }
  if (key.items.includes('lantern')) {
    c.region = 'lantern'
    c.draw(lantern, left(126), HEDGE_TOP + 4)
    if (key.band === 'night' || key.band === 'dusk') {
      c.region = 'glow'
      for (const [dx, dy] of [[-2, 1], [5, 1], [-3, 3], [6, 3]] as const) c.set(left(126) + dx, HEDGE_TOP + 4 + dy, true)
    }
  }
  if (key.items.includes('garden_cat')) {
    c.region = 'cat'
    c.draw(cat, 13, HEDGE_BOTTOM - 8)
  }
  if (key.items.includes('gnome_trap')) {
    c.region = 'trap'
    c.draw(trap, left(142), HEDGE_BOTTOM - 7)
    if (key.gnome) c.draw(trappedGnome, left(142) + 1, HEDGE_BOTTOM - 13)
  }
  if (key.items.includes('bench')) {
    c.region = 'bench'
    c.draw(bench, left(104), HEDGE_BOTTOM - 7)
  }
  if (key.items.includes('decoy_gnome')) {
    c.region = 'decoy'
    c.draw(decoy, left(140), HEDGE_TOP + 4)
  }
  if (key.items.includes('sundial')) {
    c.region = 'sundial'
    c.draw(sundial, left(118), HEDGE_BOTTOM - 12)
  }
  if (key.items.includes('wind_chimes')) {
    c.region = 'chimes'
    c.draw(chimes, left(110), HEDGE_TOP + 3)
  }
  // The gnome, caught in the trap above or making for the hedge with a seed.
  if (key.gnome && !key.items.includes('gnome_trap')) {
    c.region = 'gnome'
    c.draw(gnome, Math.min(c.width - 8, plotRight + 4), HEDGE_BOTTOM - 8)
  }
}

function weatherOver(c: Canvas, weather: Weather): void {
  c.region = 'rain'
  if (weather === 'rain') for (let y = 1; y < STAGE_HEIGHT; y += 4) for (let x = (y * 3) % 7; x < c.width; x += 7) c.paint(x, y, '#')
  c.region = 'fog'
  if (weather === 'fog') {
    for (let y = 2; y <= HEDGE_TOP + 6; y += 1) for (let x = 0; x < c.width; x += 1) if ((x + y * 3) % 5 === 0 && c.ink[y * c.width + x]) c.set(x, y, false)
    for (let y = 3; y <= HEDGE_TOP + 5; y += 2) for (let x = (y % 4) * 2; x < c.width; x += 8) c.set(x, y, true)
  }
}

/**
 * Compose the scene onto a fresh canvas of the composed width, or onto one passed in: a wider or narrower stage
 * (`clampStageWidth`), or the companion's painted canvas, which notes each region.
 */
export function composeScene(key: SceneKey, c: Canvas = new Canvas(STAGE_WIDTH, STAGE_HEIGHT)): Canvas {
  sky(c, key.band, key.weather)
  hedge(c, key.season)
  plot(c, key)
  furniture(c, key)
  weatherOver(c, key.weather)
  return c
}

export { sprite as _sprite, type Sprite as _Sprite }
