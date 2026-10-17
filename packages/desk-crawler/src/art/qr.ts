import { qrInk } from '@trmnl-games/engine/art/qr'
import { encodePng1Bit } from './png'

/**
 * QR codes that lead from the screen back to the companion. Only allowlisted
 * targets are encoded, so the route can never be used to mint arbitrary codes.
 * Base scale suits the OG (1 logical px = 1 device px); the large scale gives
 * the TRMNL X whole device pixels per module (5 x 1.8 = 9).
 */
export const QR_VERSION = 3
export const QR_SCALE = 3
export const QR_LARGE_SCALE = 5
/** Every served scale: layouts pick one per size and screen (2-5 on the OG, up to 7 on the X). 2 is the full layout's corner code. */
export const QR_SCALES = new Set([2, 3, 4, 5, 7])
/**
 * v3: low error correction and a two-module quiet zone keep the codes compact on the screen (the bag link drops from
 * 33 to 29 modules). The 1-bit render is crisp and the layout leaves white space around every code, so both hold up.
 * The drawing lives in the shared engine (`@trmnl-games/engine/art/qr`).
 */

/**
 * `home` and `corner` encode the `/dc` short link to the companion home: 25 modules instead of 29 (D108). `corner` is
 * the OG full layout's top-right code, drawn with its quiet zone on the left and bottom only, since the screen's white
 * margin already surrounds its top and right.
 */
export const QR_TARGETS = { app: '/app/desk-crawler', bag: '/app/desk-crawler/inventory', home: '/dc', corner: '/dc' } as const
export type QrTarget = keyof typeof QR_TARGETS
const CORNER_TARGETS: ReadonlySet<QrTarget> = new Set(['corner'])

export const DEFAULT_COMPANION_ORIGIN = 'https://trmnlgames.com'

export const qrBasePath = (target: QrTarget) => `/art/qr/v${QR_VERSION}/${target}`
export const qrPath = (target: QrTarget, scale: number) => `${qrBasePath(target)}/${scale}.png`

export function parseQrPath(path: string): { target: QrTarget; scale: number } | null {
  const match = /^\/art\/qr\/v(\d+)\/([a-z]+)\/(\d)\.png$/.exec(path)
  if (!match || Number(match[1]) !== QR_VERSION) return null
  const target = match[2] as QrTarget
  const scale = Number(match[3])
  if (!(target in QR_TARGETS) || !QR_SCALES.has(scale)) return null
  return { target, scale }
}

/**
 * D180: while a weekly keepsake waits, the standing codes open `/k/<code>`, which claims it on the companion. Only six
 * digits are encoded, so the route still mints nothing but links into the companion. The URL is no longer than the
 * `/dc` link's 25 modules, so the code takes any standing code's place at the same size. `corner` is cut like D108's.
 */
const KEEPSAKE_DIGITS = /^\d{6}$/
export const keepsakeQrBasePath = (code: string, corner = false) => {
  const digits = code.replace(/\D/g, '')
  return KEEPSAKE_DIGITS.test(digits) ? `/art/qr/v${QR_VERSION}/${corner ? 'keepsake-corner' : 'keepsake'}/${digits}` : null
}

export function parseKeepsakeQrPath(path: string): { digits: string; corner: boolean; scale: number } | null {
  const match = /^\/art\/qr\/v(\d+)\/(keepsake|keepsake-corner)\/(\d{6})\/(\d)\.png$/.exec(path)
  if (!match || Number(match[1]) !== QR_VERSION || !QR_SCALES.has(Number(match[4]))) return null
  return { digits: match[3]!, corner: match[2] === 'keepsake-corner', scale: Number(match[4]) }
}

export function renderQrPng(path: string, origin: string): Uint8Array | null {
  const keepsake = parseKeepsakeQrPath(path)
  if (keepsake) {
    const { size, ink } = qrInk(`${origin}/k/${keepsake.digits}`, keepsake.scale, keepsake.corner)
    return encodePng1Bit(size, size, ink)
  }
  const parsed = parseQrPath(path)
  if (!parsed) return null
  const { size, ink } = qrInk(`${origin}${QR_TARGETS[parsed.target]}`, parsed.scale, CORNER_TARGETS.has(parsed.target))
  return encodePng1Bit(size, size, ink)
}

export { qrInk }

/** D180: the merge variables the screen envelope adds beside `desk_keepsake_code`; empty without a code or art origin. */
export function keepsakeQrFields(code: string | null, artBaseUrl: string | null): { keepsake_qr_base: string; keepsake_corner_qr_base: string } {
  const base = code && artBaseUrl ? keepsakeQrBasePath(code) : null
  const corner = code && artBaseUrl ? keepsakeQrBasePath(code, true) : null
  return { keepsake_qr_base: base ? `${artBaseUrl}${base}` : '', keepsake_corner_qr_base: corner ? `${artBaseUrl}${corner}` : '' }
}
