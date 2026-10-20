import { encodePng1Bit } from '@trmnl-games/engine/art/png'
import { qrInk } from '@trmnl-games/engine/art/qr'
import { Canvas } from '@trmnl-games/engine/art/canvas'
import type { Season, TimeBand, Weather } from '../sim/types'
import { clampStageWidth, composeScene, decodeBeds, decodeItems, encodeBeds, encodeItems, MAX_STAGE_WIDTH, MIN_STAGE_WIDTH, SCENE_VERSION, STAGE_HEIGHT, type SceneKey } from './scene'

/**
 * Little Plot art paths, served by the Convex art route under `/art/lp/` (little-plot.md "Device"):
 *   /art/lp/scene/v1/<band>/<weather>/<season>/<rows>x<cols>/<beds>/<items>/<gnome|calm>/<flower|bare>/<width>/<scale>.png
 *   /art/lp/qr/v1/<target>/<scale>.png
 * Every part is allowlisted and the stage width bounded (`MIN_STAGE_WIDTH` to `MAX_STAGE_WIDTH`), so the route can
 * never draw arbitrary text, mint arbitrary codes or render an unbounded image.
 */
const BANDS = new Set<TimeBand>(['dawn', 'day', 'dusk', 'night'])
const WEATHERS = new Set<Weather>(['clear', 'overcast', 'rain', 'fog'])
const SEASONS = new Set<Season>(['spring', 'summer', 'autumn', 'winter'])
export const SCENE_SCALES = new Set([1, 2, 3, 4, 5, 6, 8, 10])
export const QR_VERSION = 1
export const QR_SCALES = new Set([2, 3, 4, 5, 7])
/** `home` encodes the `/lp` short link to the Plot page; `ripe` opens it too, for the ripe panel. */
export const QR_TARGETS = { home: '/lp', ripe: '/lp' } as const
export type QrTarget = keyof typeof QR_TARGETS

export const sceneBase = (key: SceneKey): string =>
  `/art/lp/scene/v${SCENE_VERSION}/${key.band}/${key.weather}/${key.season}/${key.rows}x${key.cols}/${encodeBeds(key.beds)}/${encodeItems(key.items)}/${key.gnome ? 'gnome' : 'calm'}/${key.flower ? 'flower' : 'bare'}`
export const qrBase = (target: QrTarget) => `/art/lp/qr/v${QR_VERSION}/${target}`
/** D180 for the flowers: while this week's flower waits, the standing code opens `/fl/<six digits>`, which presses it in the companion. */
export const flowerQrBase = (code: string) => {
  const digits = code.replace(/\D/g, '')
  return /^\d{6}$/.test(digits) ? `/art/lp/qr/v${QR_VERSION}/flower/${digits}` : null
}
export const scenePath = (key: SceneKey, width: number, scale: number) => `${sceneBase(key)}/${width}/${scale}.png`

export function parseScenePath(path: string): (SceneKey & { width: number; scale: number }) | null {
  const m = /^\/art\/lp\/scene\/v1\/([a-z]+)\/([a-z]+)\/([a-z]+)\/([1-3])x([1-4])\/([a-z*-]{4,48})\/([a-z-]{1,14})\/(gnome|calm)\/(flower|bare)\/(\d{3})\/(\d+)\.png$/.exec(path)
  if (!m) return null
  const [, band, weather, season, rowsText, colsText, bedsText, itemsText, gnome, flower, widthText, scaleText] = m
  if (!BANDS.has(band as TimeBand) || !WEATHERS.has(weather as Weather) || !SEASONS.has(season as Season)) return null
  const rows = Number(rowsText)
  const cols = Number(colsText)
  const beds = decodeBeds(bedsText!, rows * cols)
  const items = decodeItems(itemsText!)
  const width = Number(widthText)
  const scale = Number(scaleText)
  if (beds === null || items === null || width < MIN_STAGE_WIDTH || width > MAX_STAGE_WIDTH || !SCENE_SCALES.has(scale)) return null
  return { band: band as TimeBand, weather: weather as Weather, season: season as Season, rows, cols, beds, items, gnome: gnome === 'gnome', flower: flower === 'flower', width, scale }
}

export function renderLittlePlotArt(path: string, origin: string): { png: Uint8Array; immutable: boolean } | null {
  const qr = /^\/art\/lp\/qr\/v(\d+)\/(home|ripe|flower\/(\d{6}))\/(\d)\.png$/.exec(path)
  if (qr) {
    const scale = Number(qr[4])
    if (Number(qr[1]) !== QR_VERSION || !QR_SCALES.has(scale)) return null
    const target = qr[3] ? `/fl/${qr[3]}` : QR_TARGETS[qr[2] as QrTarget]
    const { size, ink } = qrInk(`${origin}${target}`, scale)
    return { png: encodePng1Bit(size, size, ink), immutable: false }
  }
  const key = parseScenePath(path)
  if (!key) return null
  const canvas = composeScene(key, new Canvas(clampStageWidth(key.width), STAGE_HEIGHT))
  const { width, height, ink } = canvas.scaled(key.scale)
  return { png: encodePng1Bit(width, height, ink), immutable: true }
}
