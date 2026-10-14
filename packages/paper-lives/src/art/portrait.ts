import { Canvas, sprite, type Sprite } from '@trmnl-games/engine/art/canvas'
import type { Stage } from '../sim/types'

/**
 * Paper Lives portraits (paper-lives.md "Art"): one 1-bit head-and-shoulders figure per stage of life with trait
 * layers (six hair styles, glasses, an old-age hat or scarf), the pet beside it by kind, and a frame for the
 * memorial. Hand-authored on the engine's canvas; the companion tones the same drawing in colour later (L4).
 */

export const FIGURE_WIDTH = 34
export const PET_WIDTH = 24
export const PORTRAIT_WIDTH = FIGURE_WIDTH + PET_WIDTH
export const PORTRAIT_HEIGHT = 44
/** The memorial frame adds this many pixels on every side. */
export const FRAME = 4

export const HAIR_STYLES = ['short', 'long', 'curly', 'bun', 'crop', 'fringe'] as const
export type Extra = 'none' | 'hat' | 'scarf'

export interface PortraitKey {
  readonly stage: Stage
  readonly hair: number
  readonly glasses: boolean
  readonly extra: Extra
  readonly pet: string | null
  readonly frame: boolean
}

interface Shape {
  readonly cx: number
  readonly cy: number
  readonly rx: number
  readonly ry: number
  /** Shoulders: left and right x, top y. */
  readonly sl: number
  readonly sr: number
  readonly st: number
}

const SHAPES: Readonly<Record<Stage, Shape>> = {
  infant: { cx: 16, cy: 21, rx: 8, ry: 8, sl: 6, sr: 26, st: 31 },
  child: { cx: 16, cy: 17, rx: 7, ry: 8, sl: 6, sr: 26, st: 29 },
  teen: { cx: 16, cy: 15, rx: 7, ry: 9, sl: 4, sr: 28, st: 28 },
  young: { cx: 16, cy: 14, rx: 7, ry: 9, sl: 2, sr: 30, st: 27 },
  adult: { cx: 16, cy: 14, rx: 7, ry: 9, sl: 2, sr: 30, st: 27 },
  senior: { cx: 16, cy: 15, rx: 7, ry: 9, sl: 2, sr: 30, st: 28 },
}

/** Whether (x, y) lies inside the ellipse. */
const inside = (x: number, y: number, cx: number, cy: number, rx: number, ry: number) => ((x - cx) / rx) ** 2 + ((y - cy) / ry) ** 2 <= 1.0001

/** A filled ellipse with a one-pixel outline; `fill` is a shade character, `rows` limits which rows are painted. */
function ellipse(c: Canvas, cx: number, cy: number, rx: number, ry: number, fill: string, rows: (y: number) => boolean = () => true): void {
  for (let y = cy - ry; y <= cy + ry; y += 1) {
    if (!rows(y)) continue
    for (let x = cx - rx; x <= cx + rx; x += 1) {
      if (!inside(x, y, cx, cy, rx, ry)) continue
      // Eight neighbours, so the steep sides draw an unbroken line.
      let edge = false
      for (const [dx, dy] of [[-1, 0], [1, 0], [0, -1], [0, 1], [-1, -1], [1, -1], [-1, 1], [1, 1]] as const) if (!inside(x + dx, y + dy, cx, cy, rx, ry)) edge = true
      c.paint(x, y, edge ? '#' : fill)
    }
  }
}

function shoulders(c: Canvas, s: Shape, stage: Stage, extra: Extra): void {
  const bottom = PORTRAIT_HEIGHT - 1
  // Rounded top corners; white inside, so the head's outline can sit over it.
  for (let y = s.st; y <= bottom; y += 1) {
    const inset = y === s.st ? 3 : y === s.st + 1 ? 1 : 0
    for (let x = s.sl + inset; x <= s.sr - inset; x += 1) {
      const edge = x === s.sl + inset || x === s.sr - inset || y === s.st
      c.paint(x, y, edge ? '#' : 'w')
    }
  }
  // Neck.
  c.rect(s.cx - 2, s.cy + s.ry - 1, 5, s.st - (s.cy + s.ry) + 2, 'w')
  c.vline(s.cx - 2, s.cy + s.ry - 1, s.st)
  c.vline(s.cx + 2, s.cy + s.ry - 1, s.st)
  // Clothes by stage: a swaddle, a plain top, a hoodie, a collar, a cardigan.
  if (stage === 'infant') {
    for (let y = s.st + 2; y <= bottom; y += 1) for (let x = s.sl + 1; x < s.sr; x += 1) c.paint(x, y, '.')
  } else if (stage === 'teen') {
    c.vline(s.cx - 3, s.st + 1, s.st + 7)
    c.vline(s.cx + 3, s.st + 1, s.st + 7)
    c.rect(s.cx - 5, bottom - 5, 11, 1, '#')
  } else if (stage === 'young' || stage === 'adult') {
    for (let i = 0; i < 5; i += 1) {
      c.set(s.cx - 2 - i, s.st + i, true)
      c.set(s.cx + 2 + i, s.st + i, true)
    }
    c.vline(s.cx, s.st + 5, bottom)
    if (stage === 'adult') for (let y = s.st + 8; y <= bottom; y += 4) c.set(s.cx + 2, y, true)
  } else if (stage === 'senior') {
    c.vline(s.cx, s.st + 1, bottom)
    for (let y = s.st + 4; y <= bottom; y += 4) c.set(s.cx - 2, y, true)
    for (let y = s.st + 2; y <= bottom; y += 1) {
      for (let x = s.sl + 1; x < s.cx - 4; x += 1) c.paint(x, y, '.')
      for (let x = s.cx + 5; x < s.sr; x += 1) c.paint(x, y, '.')
    }
  }
  if (extra === 'scarf') {
    for (let y = s.st - 1; y <= s.st + 3; y += 1) for (let x = s.cx - 6; x <= s.cx + 6; x += 1) c.paint(x, y, y === s.st - 1 || y === s.st + 3 ? '#' : x % 3 === 0 ? '#' : 'w')
    c.rect(s.cx + 3, s.st + 4, 3, 7, '=')
    c.vline(s.cx + 2, s.st + 4, s.st + 10)
    c.vline(s.cx + 6, s.st + 4, s.st + 10)
  }
}

function face(c: Canvas, s: Shape, stage: Stage, glasses: boolean): void {
  const { cx, cy } = s
  const eyeY = cy + (stage === 'infant' ? 1 : 0)
  if (stage === 'infant') {
    c.hline(cx - 4, cx - 3, eyeY)
    c.hline(cx + 2, cx + 3, eyeY)
  } else {
    c.set(cx - 3, eyeY, true)
    c.set(cx + 3, eyeY, true)
  }
  // A small smile.
  const my = cy + (stage === 'infant' ? 4 : 4)
  c.hline(cx - 1, cx + 1, my)
  c.set(cx - 2, my - 1, true)
  c.set(cx + 2, my - 1, true)
  if (stage === 'senior') {
    c.hline(cx - 2, cx + 2, cy - 4)
    c.set(cx - 5, cy + 1, true)
    c.set(cx + 5, cy + 1, true)
  }
  if (glasses && stage !== 'infant') {
    for (const ex of [cx - 3, cx + 3]) {
      c.hline(ex - 2, ex + 2, eyeY - 2)
      c.hline(ex - 2, ex + 2, eyeY + 2)
      c.vline(ex - 2, eyeY - 2, eyeY + 2)
      c.vline(ex + 2, eyeY - 2, eyeY + 2)
    }
    c.set(cx, eyeY - 1, true)
  }
}

function hair(c: Canvas, s: Shape, stage: Stage, style: (typeof HAIR_STYLES)[number], extra: Extra): void {
  const { cx, cy, rx, ry } = s
  const top = cy - ry
  // Grey for the old: a 50% shade inside the outline.
  const shade = stage === 'senior' ? ':' : '#'
  if (stage === 'infant') {
    // One curl on top.
    c.set(cx, top - 1, true)
    c.set(cx + 1, top - 2, true)
    c.set(cx + 2, top - 1, true)
    return
  }
  if (extra === 'hat') {
    // A flat cap: the crown over the head's top, a brim to the front.
    ellipse(c, cx, top + 2, rx + 1, 4, '#', (y) => y <= top + 3)
    c.hline(cx - rx - 2, cx + rx + 3, top + 3)
    c.hline(cx - rx - 2, cx + rx + 3, top + 4)
    return
  }
  const cap = (depth: number) => ellipse(c, cx, cy, rx + 1, ry + 1, shade, (y) => y <= top + depth)
  switch (style) {
    case 'short':
      cap(3)
      break
    case 'crop':
      cap(1)
      break
    case 'long':
      cap(3)
      for (let y = top + 3; y <= cy + ry + 3; y += 1) {
        for (const x of [cx - rx - 1, cx - rx, cx + rx, cx + rx + 1]) c.paint(x, y, x === cx - rx - 1 || x === cx + rx + 1 ? '#' : shade)
      }
      break
    case 'curly':
      ellipse(c, cx, cy - 1, rx + 2, ry + 1, stage === 'senior' ? '.' : ':', (y) => y <= top + 4)
      for (let x = cx - rx - 1; x <= cx + rx + 1; x += 2) c.set(x, top - 1, true)
      break
    case 'bun':
      cap(3)
      ellipse(c, cx, top - 3, 3, 2, shade)
      break
    case 'fringe':
      cap(3)
      for (let x = cx - rx + 1; x <= cx + rx - 1; x += 1) {
        const drop = x % 2 === 0 ? 5 : 4
        for (let y = top + 3; y <= top + drop; y += 1) c.paint(x, y, shade)
      }
      break
  }
}

/** Pets, drawn facing the figure and standing on the bottom edge. */
const PETS: Readonly<Record<string, Sprite>> = {
  dog: sprite(`
 ##
####
#ww##
#w#wwww
#wwwww#
 ####w#
    #ww############
    #wwwwwwwwwwwwww#
    #wwwwwwwwwwwwww# #
    #wwwwwwwwwwwwww##
     #ww#####ww#ww#
     #ww#   #ww#ww#
     #ww#   #ww#ww#
     ####   ########
`),
  cat: sprite(`
#    #
##  ##
#w##w#
#wwwww#
#w#w#w#            #
#wwwww#             #
 #####              #
  #wwwwwwwwwwwwww#  #
 #wwwwwwwwwwwwwwww##
 #wwwwwwwwwwwwwwww#
 #ww##ww####ww##w#
 #ww# #ww#  #ww#w#
 ###  ###   ######
`),
  rabbit: sprite(`
  ##  ##
 #w# #w#
 #w# #w#
 #w###w#
 #wwwwww#
#w#wwwww#
#wwwwwww#
 ######w###
  #wwwwwwww#
 #wwwwwwwwww#
#wwwwwwwwwwww##
#wwwwwwwwwwww#w#
#wwwwwwwwwwwww#
 #############
`),
  budgie: sprite(`
   ####
  #wwww#
 #w#www#
###wwww#
  ##www#
   #w:w:#
   #:w:w:#
   #w:w:w:#
    #:w:w:#
    #w:w:w:#
     #:w:#
      ##
################
       #    #
`),
  tortoise: sprite(`
       #######
     ##w#w#w#w##
    #w#w#w#w#w#w#
   #w#w#w#w#w#w#w#
 ### #w#w#w#w#w#w#
#www###############
#w#w#ww#     #ww#
 ####ww#     #ww#
     ###     ####
`),
  goldfish: sprite(`
   ##########
  #wwwwwwwwww#
 #============#
#wwwwwwwwwwwwww#
#wwwwww###wwwww#
#ww#ww#w#ww#www#
#www#w#wwwww#ww#
#ww#ww#w#ww#www#
#wwwwww###wwwww#
#wwwwwwwwwwwwww#
 #wwwwwwwwwwww#
  ############
`),
}

export const PET_KINDS = Object.keys(PETS)

function pet(c: Canvas, kind: string): void {
  const art = PETS[kind]
  if (!art) return
  const left = FIGURE_WIDTH + Math.floor((PET_WIDTH - art.width) / 2)
  c.draw(art, left, PORTRAIT_HEIGHT - art.height)
}

/** The portrait at 1x: the figure, then the pet beside it; centred when there is no pet. */
export function composePortrait(key: PortraitKey): Canvas {
  const width = PORTRAIT_WIDTH + (key.frame ? FRAME * 2 : 0)
  const height = PORTRAIT_HEIGHT + (key.frame ? FRAME * 2 : 0)
  const c = new Canvas(width, height)
  const inner = new Canvas(PORTRAIT_WIDTH, PORTRAIT_HEIGHT)
  const s = SHAPES[key.stage]
  const offset = key.pet ? 0 : Math.floor(PET_WIDTH / 2)
  const figure = new Canvas(FIGURE_WIDTH, PORTRAIT_HEIGHT)
  shoulders(figure, s, key.stage, key.extra)
  ellipse(figure, s.cx, s.cy, s.rx, s.ry, 'w')
  face(figure, s, key.stage, key.glasses)
  hair(figure, s, key.stage, HAIR_STYLES[key.hair % HAIR_STYLES.length]!, key.extra)
  for (let y = 0; y < PORTRAIT_HEIGHT; y += 1) for (let x = 0; x < FIGURE_WIDTH; x += 1) if (figure.ink[y * FIGURE_WIDTH + x]) inner.set(x + offset, y, true)
  if (key.pet) pet(inner, key.pet)
  const o = key.frame ? FRAME : 0
  for (let y = 0; y < PORTRAIT_HEIGHT; y += 1) for (let x = 0; x < PORTRAIT_WIDTH; x += 1) if (inner.ink[y * PORTRAIT_WIDTH + x]) c.set(x + o, y + o, true)
  if (key.frame) {
    // A double rule with small corner squares, as a picture frame on a mantelpiece.
    for (const d of [0, 2]) {
      c.hline(d, width - 1 - d, d)
      c.hline(d, width - 1 - d, height - 1 - d)
      c.vline(d, d, height - 1 - d)
      c.vline(width - 1 - d, d, height - 1 - d)
    }
    for (const [x, y] of [[0, 0], [width - 4, 0], [0, height - 4], [width - 4, height - 4]] as const) c.rect(x, y, 4, 4, '#')
  }
  return c
}
