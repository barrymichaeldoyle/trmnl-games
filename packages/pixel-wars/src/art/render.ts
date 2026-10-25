import { Canvas } from '@trmnl-games/engine/art/canvas'
import { cellFaction, cellInk, cellIsDesk } from '../sim/map'
import type { Faction, FactionId, Pattern } from '../sim/types'

/**
 * The map on paper (pixel-wars.md "Device"): one window of cells at a whole number of pixels a cell, each faction a
 * pattern and never a polarity, so the Dark theme's inversion and the X's 1.8x draw keep them apart. Ink is stroke
 * density inside the faction's pattern: full, two thirds, a sparse outline. Patterns are anchored to world pixels, so
 * neighbouring cells of one faction read as one region. Strokes are never thinner than 2 px at 10 px cells and no
 * pattern is a checkerboard (D165's scale modifiers blur both).
 */
export const PATTERNS: readonly Pattern[] = ['solid', 'hatch', 'dots', 'weave']
export const MIN_CELL_PX = 10
export const MAX_CELL_PX = 24
export const DESK_RING = 2

/** Whether a world pixel is inked for a pattern at an ink level (1 to 3). */
export function patternInk(pattern: Pattern, level: number, gx: number, gy: number): boolean {
  const l = Math.max(1, Math.min(3, level))
  const mod = (n: number, m: number) => ((n % m) + m) % m
  switch (pattern) {
    case 'solid':
      return l === 3 ? true : l === 2 ? mod(gy, 3) !== 2 : mod(gy, 6) < 2
    case 'hatch': {
      const period = l === 3 ? 4 : l === 2 ? 6 : 9
      return mod(gx + gy, period) < 2
    }
    case 'dots': {
      const period = l === 3 ? 4 : l === 2 ? 5 : 7
      return mod(gx, period) < 2 && mod(gy, period) < 2
    }
    case 'weave': {
      const period = l === 3 ? 4 : l === 2 ? 6 : 9
      return mod(gx + gy, period) < 2 || mod(gx - gy, period) < 2
    }
  }
}

/** A desk's ink runs to 5; its pattern level is the nearest of the three. */
export const levelOf = (ink: number, desk: boolean): number => (desk ? (ink >= 4 ? 3 : ink >= 2 ? 2 : 1) : Math.max(1, Math.min(3, ink)))

export interface MapWindow {
  readonly x0: number
  readonly y0: number
  readonly cols: number
  readonly rows: number
  readonly px: number
}

export interface MapSource {
  readonly x0: number
  readonly y0: number
  readonly cols: number
  readonly rows: number
  readonly cells: Uint8Array
}

const FRAME = 1

/** The image size a window draws at. */
export const windowSize = (w: MapWindow) => ({ width: w.cols * w.px + 2 * FRAME, height: w.rows * w.px + 2 * FRAME })

/**
 * Draw a window of the map: a one-pixel frame, each held cell in its faction's pattern at its ink, every desk cell in a
 * two-pixel ring (open when the desk is ground), and the viewer's own desk ringed again outside its cell.
 */
export function renderWindow(source: MapSource, window: MapWindow, patternOf: (f: FactionId) => Pattern, own?: { x: number; y: number }): Canvas {
  const { width, height } = windowSize(window)
  const canvas = new Canvas(width, height)
  canvas.hline(0, width - 1, 0)
  canvas.hline(0, width - 1, height - 1)
  canvas.vline(0, 0, height - 1)
  canvas.vline(width - 1, 0, height - 1)
  const px = window.px
  for (let r = 0; r < window.rows; r += 1) {
    for (let c = 0; c < window.cols; c += 1) {
      const wx = window.x0 + c
      const wy = window.y0 + r
      const inside = wx >= source.x0 && wy >= source.y0 && wx < source.x0 + source.cols && wy < source.y0 + source.rows
      const byte = inside ? source.cells[(wy - source.y0) * source.cols + (wx - source.x0)]! : 0
      const faction: Faction = cellFaction(byte)
      const desk = cellIsDesk(byte)
      const level = levelOf(cellInk(byte), desk)
      const left = FRAME + c * px
      const top = FRAME + r * px
      if (faction === 0 && !desk) continue
      for (let ly = 0; ly < px; ly += 1) {
        for (let lx = 0; lx < px; lx += 1) {
          const edge = lx < DESK_RING || ly < DESK_RING || lx >= px - DESK_RING || ly >= px - DESK_RING
          const inset = !edge && (lx < DESK_RING + 1 || ly < DESK_RING + 1 || lx >= px - DESK_RING - 1 || ly >= px - DESK_RING - 1)
          let black = false
          if (desk) {
            if (edge) black = true
            else if (inset) black = false
            else black = faction !== 0 && patternInk(patternOf(faction), level, wx * px + lx, wy * px + ly)
          } else black = patternInk(patternOf(faction as FactionId), level, wx * px + lx, wy * px + ly)
          if (black) canvas.set(left + lx, top + ly, true)
        }
      }
    }
  }
  if (own) {
    const c = own.x - window.x0
    const r = own.y - window.y0
    if (c >= 0 && r >= 0 && c < window.cols && r < window.rows) {
      const left = FRAME + c * px
      const top = FRAME + r * px
      // A white gap then a black ring, two pixels each, drawn over the neighbours' edges.
      for (let d = 1; d <= 4; d += 1) {
        const black = d > 2
        for (let i = -d; i < px + d; i += 1) {
          canvas.set(left + i, top - d, black)
          canvas.set(left + i, top + px - 1 + d, black)
          canvas.set(left - d, top + i, black)
          canvas.set(left + px - 1 + d, top + i, black)
        }
      }
    }
  }
  return canvas
}

/**
 * The window a slot shows (pixel-wars.md "Device"): the whole map when it fits at ten pixels a cell or more, else a
 * window of the slot's size centred on the desk, clamped to the map.
 */
export function fitWindow(source: Pick<MapSource, 'x0' | 'y0' | 'cols' | 'rows'>, slotWidth: number, slotHeight: number, centre?: { x: number; y: number }, minPx = MIN_CELL_PX, maxPx = MAX_CELL_PX): MapWindow {
  const innerW = slotWidth - 2 * FRAME
  const innerH = slotHeight - 2 * FRAME
  if (source.cols === 0 || source.rows === 0) return { x0: 0, y0: 0, cols: 1, rows: 1, px: minPx }
  const whole = Math.min(maxPx, Math.floor(Math.min(innerW / source.cols, innerH / source.rows)))
  if (whole >= minPx) return { x0: source.x0, y0: source.y0, cols: source.cols, rows: source.rows, px: whole }
  const px = minPx
  const cols = Math.max(1, Math.min(source.cols, Math.floor(innerW / px)))
  const rows = Math.max(1, Math.min(source.rows, Math.floor(innerH / px)))
  const cx = centre?.x ?? source.x0 + Math.floor(source.cols / 2)
  const cy = centre?.y ?? source.y0 + Math.floor(source.rows / 2)
  const x0 = Math.max(source.x0, Math.min(source.x0 + source.cols - cols, cx - Math.floor(cols / 2)))
  const y0 = Math.max(source.y0, Math.min(source.y0 + source.rows - rows, cy - Math.floor(rows / 2)))
  return { x0, y0, cols, rows, px }
}

/** A swatch of one pattern at full ink, for the strip and the companion; `size` pixels square, with a one-pixel frame. */
export function renderSwatch(pattern: Pattern, size: number, level = 3): Canvas {
  const canvas = new Canvas(size, size)
  for (let y = 0; y < size; y += 1) for (let x = 0; x < size; x += 1) canvas.set(x, y, x === 0 || y === 0 || x === size - 1 || y === size - 1 || patternInk(pattern, level, x, y))
  return canvas
}
