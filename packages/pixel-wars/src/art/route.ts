import { encodePng1Bit } from '@trmnl-games/engine/art/png'
import { qrInk } from '@trmnl-games/engine/art/qr'
import type { FactionId, Pattern, PixelWarsCatalog } from '../sim/types'
import { MAX_CELL_PX, MIN_CELL_PX, renderWindow, type MapSource, type MapWindow } from './render'

/**
 * Pixel Wars art paths, served by the Convex art route under `/art/pw/` (pixel-wars.md "Device"):
 *   /art/pw/map/v1/<mapId>/<tick>/<x0>,<y0>,<cols>,<rows>/<px>/<seat>.png   a window of a tick's snapshot, the seat's desk ringed (0 for none)
 *   /art/pw/print/v1/<seasonId>/<px>.png                                    a finished week's map
 *   /art/pw/qr/v1/home/<scale>.png                                           the companion code
 * The map and print paths name stored rows, so the backend looks the row up and hands its cells to `renderMapPng`;
 * every number is bounded, so the route can never draw an unbounded image.
 */
export const ART_VERSION = 1
export const QR_SCALES = new Set([2, 3, 4, 5, 7])
export const QR_TARGETS = { home: '/pw' } as const
export type QrTarget = keyof typeof QR_TARGETS
const MAX_WINDOW = 64

export const mapBase = (mapId: string, tick: number) => `/art/pw/map/v${ART_VERSION}/${mapId}/${tick}`
export const mapPath = (mapId: string, tick: number, w: MapWindow, seat: number) => `${mapBase(mapId, tick)}/${w.x0},${w.y0},${w.cols},${w.rows}/${w.px}/${seat}.png`
export const printPath = (seasonId: string, px: number) => `/art/pw/print/v${ART_VERSION}/${seasonId}/${px}.png`
export const qrBase = (target: QrTarget) => `/art/pw/qr/v${ART_VERSION}/${target}`

export type ParsedArtPath =
  | { kind: 'map'; mapId: string; tick: number; window: MapWindow; seat: number }
  | { kind: 'print'; seasonId: string; px: number }
  | { kind: 'qr'; target: QrTarget; scale: number }

export function parseArtPath(path: string): ParsedArtPath | null {
  const map = /^\/art\/pw\/map\/v1\/([a-z0-9]{1,40})\/(\d{1,9})\/(-?\d{1,3}),(-?\d{1,3}),(\d{1,2}),(\d{1,2})\/(\d{1,2})\/(\d{1,3})\.png$/.exec(path)
  if (map) {
    const [, mapId, tick, x0, y0, cols, rows, px, seat] = map
    const window = { x0: Number(x0), y0: Number(y0), cols: Number(cols), rows: Number(rows), px: Number(px) }
    if (window.cols < 1 || window.rows < 1 || window.cols > MAX_WINDOW || window.rows > MAX_WINDOW || window.px < MIN_CELL_PX || window.px > MAX_CELL_PX) return null
    return { kind: 'map', mapId: mapId!, tick: Number(tick), window, seat: Number(seat) }
  }
  const print = /^\/art\/pw\/print\/v1\/([a-z0-9]{1,40})\/(\d{1,2})\.png$/.exec(path)
  if (print) {
    const px = Number(print[2])
    if (px < 4 || px > MAX_CELL_PX) return null
    return { kind: 'print', seasonId: print[1]!, px }
  }
  const qr = /^\/art\/pw\/qr\/v1\/(home)\/(\d)\.png$/.exec(path)
  if (qr) {
    const scale = Number(qr[2])
    if (!QR_SCALES.has(scale)) return null
    return { kind: 'qr', target: qr[1] as QrTarget, scale }
  }
  return null
}

export function renderQrPng(target: QrTarget, scale: number, origin: string): Uint8Array {
  const { size, ink } = qrInk(`${origin}${QR_TARGETS[target]}`, scale)
  return encodePng1Bit(size, size, ink)
}

export const patternsOf = (content: Pick<PixelWarsCatalog, 'factions'>) => (f: FactionId): Pattern => content.factions[f - 1]!.pattern

/** A window of a snapshot (or a whole print) as a one-bit PNG. */
export function renderMapPng(source: MapSource, window: MapWindow, content: Pick<PixelWarsCatalog, 'factions'>, own?: { x: number; y: number }): Uint8Array {
  const { width, height, ink } = renderWindow(source, window, patternsOf(content), own)
  return encodePng1Bit(width, height, ink)
}
