import { encodePng1Bit } from '@trmnl-games/engine/art/png'
import { qrInk } from '@trmnl-games/engine/art/qr'
import type { Season, TimeBand, WaterId, Weather } from '../sim/types'
import { anglerPoses, type AnglerPose } from './angler'
import { Canvas } from '@trmnl-games/engine/art/canvas'
import { FISH_LARGE, FISH_TRAITS, fishSprite } from './fish'
import { FLIES } from '../content/flies'
import { composeScene, MAX_STAGE_WIDTH, MIN_STAGE_WIDTH, SCENE_VERSION, STAGE_HEIGHT, type SceneKey } from './scene'

/**
 * Idle Angler art paths, served by the Convex art route under `/art/ia/` (idle-angler.md "Device"):
 *   /art/ia/scene/v4/<water>/<band>/<weather>/<season|noseason>/<pose>/<fish|none>/<fly|nofly>/<width>/<scale>.png
 *   (v3, the same without the season, still renders while devices catch up)
 *   /art/ia/qr/v1/<target>/<scale>.png
 *   /art/ia/fish/v1/<species>/<scale>.png   (template v2's newest-catch panel)
 * Every part is allowlisted and the stage width bounded (`MIN_STAGE_WIDTH` to `MAX_STAGE_WIDTH`, D125), so the
 * route can never draw arbitrary text, mint arbitrary codes or render an unbounded image.
 */
const WATERS = new Set<WaterId>(['millpond', 'river_bend', 'harbour_pier', 'heron_lake', 'deep_sea', 'frozen_tarn'])
const SEASONS = new Set<Season>(['spring', 'summer', 'autumn', 'winter'])
const BANDS = new Set<TimeBand>(['dawn', 'day', 'dusk', 'night'])
const WEATHERS = new Set<Weather>(['clear', 'overcast', 'rain', 'wind', 'fog'])
/** Whole-number scales only, so pixels stay crisp: 1 for narrow portrait columns up to 10 for the X's full view. */
export const SCENE_SCALES = new Set([1, 2, 3, 4, 5, 6, 8, 10])

export const QR_VERSION = 1
export const QR_SCALES = new Set([2, 3, 4, 5, 7])
/** `home` encodes the `/ia` short link to the dock; `cooler` opens the cooler, for a full one. */
export const QR_TARGETS = { home: '/ia', cooler: '/app/idle-angler/cooler' } as const
export type QrTarget = keyof typeof QR_TARGETS

export function sceneBase(key: SceneKey): string {
  return `/art/ia/scene/v${SCENE_VERSION}/${key.water}/${key.band}/${key.weather}/${key.season ?? 'noseason'}/${key.pose}/${key.pose === 'holding' && key.fish ? key.fish : 'none'}/${key.fly ?? 'nofly'}`
}

export const qrBase = (target: QrTarget) => `/art/ia/qr/v${QR_VERSION}/${target}`
/**
 * D180 for the fly box: while this week's fly waits, the standing code opens `/f/<six digits>`, which adds it in the
 * companion. Only six digits are encoded, and the URL is the `/ia` link's size.
 */
export const flyQrBase = (code: string) => {
  const digits = code.replace(/\D/g, '')
  return /^\d{6}$/.test(digits) ? `/art/ia/qr/v${QR_VERSION}/fly/${digits}` : null
}

export const FISH_VERSION = 1
/** The large catalogue sprite (30x12) at whole-number scales: 3 for the OG's portrait panel up to 8 for the X. */
export const FISH_SCALES = new Set([2, 3, 4, 5, 6, 8])
export const fishBase = (speciesId: string) => `/art/ia/fish/v${FISH_VERSION}/${speciesId}`

/** The scene image path for a key: `sceneBase(key)` then the stage width and the whole-number scale. */
export const scenePath = (key: SceneKey, width: number, scale: number) => `${sceneBase(key)}/${width}/${scale}.png`

export function parseScenePath(path: string): (SceneKey & { width: number; scale: number }) | null {
  const v4 = /^\/art\/ia\/scene\/v4\/([a-z_]+)\/([a-z]+)\/([a-z]+)\/([a-z]+)\/([a-z]+)\/([a-z_]+)\/([a-z_]+)\/(\d{3})\/(\d+)\.png$/.exec(path)
  const v3 = v4 ? null : /^\/art\/ia\/scene\/v3\/([a-z_]+)\/([a-z]+)\/([a-z]+)\/([a-z]+)\/([a-z_]+)\/([a-z_]+)\/(\d{3})\/(\d+)\.png$/.exec(path)
  if (!v4 && !v3) return null
  const [, water, band, weather, seasonText, pose, fish, fly, widthText, scaleText] = v4 ?? [v3![0], v3![1], v3![2], v3![3], 'noseason', v3![4], v3![5], v3![6], v3![7], v3![8]]
  if (seasonText !== 'noseason' && !SEASONS.has(seasonText as Season)) return null
  const season = seasonText === 'noseason' ? null : (seasonText as Season)
  if (fly !== 'nofly' && !FLIES.some((f) => f.id === fly)) return null
  const width = Number(widthText)
  const scale = Number(scaleText)
  if (width < MIN_STAGE_WIDTH || width > MAX_STAGE_WIDTH) return null
  if (!WATERS.has(water as WaterId) || !BANDS.has(band as TimeBand) || !WEATHERS.has(weather as Weather) || !(pose! in anglerPoses) || !SCENE_SCALES.has(scale)) return null
  if (fish !== 'none' && !(fish! in FISH_TRAITS)) return null
  if ((pose === 'holding') !== (fish !== 'none') && fish !== 'none') return null
  return { water: water as WaterId, band: band as TimeBand, weather: weather as Weather, season, pose: pose as AnglerPose, fish: fish === 'none' ? null : fish!, fly: fly === 'nofly' ? null : fly!, width, scale }
}

export function renderIdleAnglerArt(path: string, origin: string): { png: Uint8Array; immutable: boolean } | null {
  const fly = /^\/art\/ia\/qr\/v(\d+)\/fly\/(\d{6})\/(\d)\.png$/.exec(path)
  if (fly) {
    const scale = Number(fly[3])
    if (Number(fly[1]) !== QR_VERSION || !QR_SCALES.has(scale)) return null
    const { size, ink } = qrInk(`${origin}/f/${fly[2]}`, scale)
    return { png: encodePng1Bit(size, size, ink), immutable: false }
  }
  const qr = /^\/art\/ia\/qr\/v(\d+)\/([a-z]+)\/(\d)\.png$/.exec(path)
  if (qr) {
    const target = qr[2] as QrTarget
    const scale = Number(qr[3])
    if (Number(qr[1]) !== QR_VERSION || !(target in QR_TARGETS) || !QR_SCALES.has(scale)) return null
    const { size, ink } = qrInk(`${origin}${QR_TARGETS[target]}`, scale)
    return { png: encodePng1Bit(size, size, ink), immutable: false }
  }
  const fish = /^\/art\/ia\/fish\/v(\d+)\/([a-z_]+)\/(\d)\.png$/.exec(path)
  if (fish) {
    const scale = Number(fish[3])
    if (Number(fish[1]) !== FISH_VERSION || !(fish[2]! in FISH_TRAITS) || !FISH_SCALES.has(scale)) return null
    const canvas = new Canvas(FISH_LARGE.width, FISH_LARGE.height)
    canvas.draw(fishSprite(fish[2]!, FISH_LARGE.width, FISH_LARGE.height), 0, 0)
    const { width, height, ink } = canvas.scaled(scale)
    return { png: encodePng1Bit(width, height, ink), immutable: true }
  }
  const parsed = parseScenePath(path)
  if (!parsed) return null
  const { width, height, ink } = composeScene(parsed, new Canvas(parsed.width, STAGE_HEIGHT)).scaled(parsed.scale)
  return { png: encodePng1Bit(width, height, ink), immutable: true }
}
