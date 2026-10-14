import { Canvas, sprite, type Sprite } from '@trmnl-games/engine/art/canvas'
import type { TimeBand, WaterId, Weather } from '../sim/types'
import { anglerPoses, ROD_HAND, type AnglerPose } from './angler'
import { FISH_LARGE, fishSprite } from './fish'

/**
 * Idle Angler scene (idle-angler.md "Device"): sky by local time band, the water's backdrop, the forecast's weather,
 * the angler and the line, on a 40-row stage whose width each layout chooses (D125). The angler, the pier or bank
 * and the cast are anchored to the left edge; the far backdrop (the mill, the willow, the lighthouse, the moon and
 * the sun) to the right edge; the horizon, the ripples and the weather run the whole width. So a slot asks for the
 * width that fills it at a whole-number scale and the water reaches both edges. 152 is the composed width every
 * sprite was placed on. A held catch draws the large fish at the angler's hands. Deterministic per key and width, so
 * each image URL is immutable.
 */
/** v2 (S6) adds the newest fly on the angler's hat; v3 (D125) takes the stage width from the URL. */
export const SCENE_VERSION = 3
export const STAGE_WIDTH = 152
export const STAGE_HEIGHT = 40
/** The narrowest stage: the cast still lands clear of the right-anchored backdrop. The widest bounds the served image. */
export const MIN_STAGE_WIDTH = 120
export const MAX_STAGE_WIDTH = 400
export const clampStageWidth = (width: number) => Math.min(MAX_STAGE_WIDTH, Math.max(MIN_STAGE_WIDTH, Math.floor(width)))
/** Backdrop drawings at or past this column move with the right edge; nearer ones stay with the angler. */
const RIGHT_ANCHOR = 76
/** The column a drawing placed at `x` on the composed stage takes on a canvas of another width. */
const anchored = (c: Canvas, x: number) => (x >= RIGHT_ANCHOR ? x + c.width - STAGE_WIDTH : x)
export const FULL_SCALE = 5
export const SMALL_SCALE = 2
export const LARGE_SCALE = 6
export const MEDIUM_SCALE = 3
const HORIZON = 21
/** The top row of the near ground: the pier's deck and the grass bank. */
const DECK = 30
const BANK = 31

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
const bigCloud = sprite(`
     ####
  ###wwww###
 #wwwwwwwwww##
#wwwwwwwwwwwww#
 ##############
`)
const float = sprite(`
 #
###
#w#
`)
const reeds = sprite(`
 #   #  #
 #  ##  #
## # # ##
 # # # #
 ### ###
`)
const mill = sprite(`
     #
    ###
   #:::#
  #:::::#
 #########
 #w#   #w#
 #w# # #w#
 #########
`)
const willow = sprite(`
    ######
  ##::::::##
 #:::::::::::#
#:#:#:#:#:#:#:
#: #: #: #: #
 #  #  #  #
    ##
    ##
`)
const lighthouse = sprite(`
  ###
 #www#
  ###
  #:#
  #w#
  #:#
  #w#
 #####
`)
const boat = sprite(`
     #
     #
    ##
   # #
######## 
 #wwwwww#
  ######
`)
const gull = sprite(`
#   #
 # #
  #
`)
const rest = sprite(`
#   #
 # #
  #
  #
  #
  #
`)

/** Each drawing names its region on the canvas (`Canvas.region`) so the companion's painted scene (sceneColour.ts) can tone it; the 1-bit image ignores the names. */
function sky(c: Canvas, band: TimeBand, weather: Weather): void {
  const covered = weather === 'overcast' || weather === 'rain' || weather === 'fog'
  if (band === 'night') {
    c.region = 'star'
    if (!covered) for (const [x, y] of [[12, 3], [40, 8], [70, 2], [98, 6], [118, 11], [140, 4]] as const) c.draw(star, anchored(c, x), y)
    c.region = 'moon'
    if (weather !== 'overcast' && weather !== 'rain') c.draw(moon, anchored(c, 128), 3)
  } else if (band === 'day') {
    c.region = 'sun'
    if (!covered) c.draw(sun, anchored(c, 128), 2)
    c.region = 'cloud'
    c.draw(cloud, 30, 4)
  } else {
    // Dawn rises on the right, dusk sets on the left: the low sun sits on the horizon.
    c.region = 'sun'
    if (!covered) c.draw(lowSun, band === 'dawn' ? anchored(c, 138) : 2, HORIZON - 5)
    c.region = 'dusk'
    if (band === 'dusk') c.rect(0, 0, c.width, 3, '.')
  }
  c.region = 'cloud'
  if (covered) {
    c.draw(bigCloud, 10, 2)
    c.draw(bigCloud, 62, 0)
    c.draw(bigCloud, anchored(c, 112), 3)
  }
  if (weather === 'wind') {
    c.draw(cloud, anchored(c, 92), 9)
    c.region = 'wind'
    for (const [x, y] of [[20, 9], [48, 14], [84, 5], [110, 15], [136, 10]] as const) c.hline(anchored(c, x), anchored(c, x) + 7, y, '#')
  }
}

function backdrop(c: Canvas, water: WaterId): void {
  c.region = 'horizon'
  c.hline(0, c.width - 1, HORIZON, '#')
  if (water === 'millpond') {
    c.region = 'mill'
    c.draw(mill, anchored(c, 110), HORIZON - 8)
    c.region = 'reeds'
    c.draw(reeds, 62, HORIZON - 4)
    c.draw(reeds, anchored(c, 88), HORIZON - 4)
  } else if (water === 'river_bend') {
    c.region = 'willow'
    c.draw(willow, 70, HORIZON - 8)
    c.draw(willow, anchored(c, 118), HORIZON - 8)
    // The far bank's edge sits just above the river.
    c.region = 'far_bank'
    c.hline(60, c.width - 1, HORIZON - 1, ':')
  } else {
    c.region = 'lighthouse'
    c.draw(lighthouse, anchored(c, 136), HORIZON - 8)
    c.region = 'boat'
    c.draw(boat, anchored(c, 96), HORIZON - 7)
    c.region = 'gull'
    c.draw(gull, 70, 8)
    c.draw(gull, anchored(c, 82), 12)
  }
  // Water: ripples, wider apart toward the viewer.
  c.region = 'ripple'
  for (let y = HORIZON + 2, row = 0; y < STAGE_HEIGHT; y += 3 + Math.floor(row / 2), row += 1) {
    const gap = 9 + row * 3
    for (let x = (row * 5) % gap; x < c.width; x += gap) c.hline(x, x + (water === 'harbour_pier' ? 3 : 2), y, water === 'harbour_pier' && row % 2 ? '#' : ':')
  }
}

/** Near ground for the angler: a grass bank on fresh water, wooden planks on the pier. Returns the ground's top row. */
function nearGround(c: Canvas, water: WaterId): number {
  if (water === 'harbour_pier') {
    c.region = 'deck'
    const deck = DECK
    c.rect(0, deck, 58, 2, '#')
    c.rect(0, deck + 2, 58, 1, '=')
    for (const x of [4, 22, 40, 56]) c.rect(x, deck + 3, 2, STAGE_HEIGHT - deck - 3, '#')
    return deck
  }
  c.region = 'grass'
  const bank = BANK
  c.rect(0, bank, 46, STAGE_HEIGHT - bank, 'w')
  c.hline(0, 40, bank, '#')
  for (let x = 40; x <= 46; x += 1) c.paint(x, bank + (x - 40), '#')
  c.rect(0, bank + 1, 40, STAGE_HEIGHT - bank - 1, '.')
  for (const x of [3, 11, 19, 29, 37]) {
    c.paint(x, bank - 1, '#')
    c.paint(x + 1, bank - 2, '#')
  }
  return bank
}

function weatherOver(c: Canvas, weather: Weather): void {
  c.region = 'rain'
  if (weather === 'rain') for (let y = 1; y < STAGE_HEIGHT; y += 4) for (let x = (y * 3) % 7; x < c.width; x += 7) c.paint(x, y, '#')
  c.region = 'fog'
  if (weather === 'fog') {
    for (let y = HORIZON - 6; y <= HORIZON + 6; y += 1) for (let x = 0; x < c.width; x += 1) if ((x + y * 3) % 5 === 0 && c.ink[y * c.width + x]) c.set(x, y, false)
    for (let y = HORIZON - 4; y <= HORIZON + 4; y += 2) for (let x = (y % 4) * 2; x < c.width; x += 8) c.set(x, y, true)
  }
}

/** Draw a sprite over a solid paper silhouette, so lines behind it never show through its shaded areas. */
function drawSolid(c: Canvas, s: Sprite, left: number, top: number): void {
  s.rows.forEach((row, dy) => {
    const first = row.search(/[^ ]/)
    if (first < 0) return
    const last = row.length - 1 - [...row].reverse().join('').search(/[^ ]/)
    for (let x = first; x <= last; x += 1) c.set(left + x, top + dy, false)
  })
  c.draw(s, left, top)
}

/** A dotted line from (x0, y0) to (x1, y1); every other pixel so it reads as fishing line. */
function line(c: Canvas, x0: number, y0: number, x1: number, y1: number, dotted = true): void {
  const steps = Math.max(Math.abs(x1 - x0), Math.abs(y1 - y0))
  for (let i = 0; i <= steps; i += 1) {
    if (dotted && i % 2 === 1) continue
    c.set(Math.round(x0 + ((x1 - x0) * i) / steps), Math.round(y0 + ((y1 - y0) * i) / steps), true)
  }
}

/** A curved rod: a quadratic bend from the hand to the tip, solid so it reads as a rod rather than line. */
function rod(c: Canvas, x0: number, y0: number, x1: number, y1: number, bend: number): void {
  const steps = Math.max(Math.abs(x1 - x0), Math.abs(y1 - y0)) * 2
  for (let i = 0; i <= steps; i += 1) {
    const t = i / steps
    const x = x0 + (x1 - x0) * t
    const y = y0 + (y1 - y0) * t + bend * 4 * t * (1 - t)
    c.set(Math.round(x), Math.round(y), true)
  }
}

export interface SceneKey {
  readonly water: WaterId
  readonly band: TimeBand
  readonly weather: Weather
  readonly pose: AnglerPose
  /** The held fish for the `holding` pose; ignored otherwise. */
  readonly fish: string | null
  /** The newest fly from the fly box, pinned to the hat; null for none. */
  readonly fly?: string | null
}

/** Where the angler stands on the stage for a key: the sprite's top-left and its pose. */
export function anglerPlacement(key: SceneKey): { sprite: Sprite; left: number; top: number } {
  const sprite = anglerPoses[key.pose]
  const ground = key.water === 'harbour_pier' ? DECK : BANK
  return { sprite, left: key.water === 'harbour_pier' ? 26 : 18, top: ground - sprite.height }
}

/**
 * Compose the scene onto a fresh canvas of the composed width, or onto one passed in: a wider or narrower stage
 * (`clampStageWidth`), or the companion's painted canvas, which notes each region.
 */
export function composeScene(key: SceneKey, c: Canvas = new Canvas(STAGE_WIDTH, STAGE_HEIGHT)): Canvas {
  sky(c, key.band, key.weather)
  backdrop(c, key.water)
  const ground = nearGround(c, key.water)
  const angler = anglerPoses[key.pose]
  const { left: ax, top: ay } = anglerPlacement(key)
  c.region = 'angler'
  drawSolid(c, angler, ax, ay)
  c.region = 'fly'
  if (key.fly) {
    // A fly is three pixels on the hat band, with a tail: small, but it is the reward drawn where it was earned.
    const hatRow = angler.rows.findIndex((row) => row.includes('########'))
    const hx = ax + angler.rows[hatRow]!.indexOf('#') + 6
    c.set(hx, ay + hatRow - 1, true)
    c.set(hx + 1, ay + hatRow - 2, true)
    c.set(hx + 1, ay + hatRow - 1, false)
    c.set(hx + 2, ay + hatRow - 1, true)
  }
  const [hx, hy] = ROD_HAND[key.pose]
  const handX = ax + hx
  const handY = ay + hy
  const floatX = key.water === 'harbour_pier' ? 104 : 96
  const floatY = HORIZON + 7
  switch (key.pose) {
    case 'waiting':
      c.region = 'rod'
      rod(c, handX, handY, handX + 26, handY - 12, -2)
      c.region = 'line'
      line(c, handX + 26, handY - 12, floatX + 1, floatY)
      c.region = 'float'
      c.draw(float, floatX, floatY)
      break
    case 'casting':
      c.region = 'rod'
      rod(c, handX, handY, handX - 8, handY - 2 - 0, 0)
      rod(c, handX, handY, handX + 4, 0, -3)
      c.region = 'line'
      line(c, handX + 4, 0, floatX + 10, 4)
      break
    case 'reeling':
      c.region = 'rod'
      rod(c, handX, handY, handX + 24, handY - 4, -6)
      c.region = 'line'
      line(c, handX + 24, handY - 4, floatX - 6, floatY + 2, false)
      // The splash where the fish fights.
      c.region = 'splash'
      for (const [dx, dy] of [[-2, -1], [2, -1], [0, -2], [-3, 1], [3, 1]] as const) c.set(floatX - 6 + dx, floatY + 2 + dy, true)
      break
    case 'holding': {
      if (key.fish) {
        const fish = fishSprite(key.fish, FISH_LARGE.width, FISH_LARGE.height)
        const fx = handX + 1
        const fy = handY - Math.floor(fish.height / 2)
        c.region = `fish:${key.fish}`
        drawSolid(c, fish, fx, fy)
      }
      break
    }
    case 'paused': {
      const restX = ax + 20
      c.region = 'rest'
      c.draw(rest, restX, ground - 6)
      c.region = 'rod'
      rod(c, restX + 2, ground - 4, restX + 30, ground - 16, -2)
      rod(c, restX + 2, ground - 4, restX - 6, ground - 1, 0)
      c.region = 'line'
      line(c, restX + 30, ground - 16, floatX + 1, floatY)
      c.region = 'float'
      c.draw(float, floatX, floatY)
      break
    }
  }
  weatherOver(c, key.weather)
  return c
}

/** Pose for the newest story: a kept or released fish is held up, one that got away bends the rod. */
export function poseFor(status: 'fishing' | 'paused' | 'travelling' | 'pending' | 'unlinked', latestKind: string | null): AnglerPose {
  if (status === 'paused') return 'paused'
  if (status === 'travelling') return 'casting'
  if (latestKind === 'catch' || latestKind === 'release') return 'holding'
  if (latestKind === 'got_away') return 'reeling'
  return 'waiting'
}

export { HORIZON }
export type { AnglerPose, Sprite }
