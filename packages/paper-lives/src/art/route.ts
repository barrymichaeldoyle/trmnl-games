import { encodePng1Bit } from '@trmnl-games/engine/art/png'
import { qrInk } from '@trmnl-games/engine/art/qr'
import type { LifeState, Stage } from '../sim/types'
import { composePortrait, HAIR_STYLES, PET_KINDS, type Extra, type PortraitKey } from './portrait'

/**
 * Paper Lives art paths, served by the Convex art route under `/art/pl/` (paper-lives.md "Device"):
 *   /art/pl/portrait/v1/<stage>/<hair>/<g0|g1>/<none|hat|scarf>/<pet|none>/<f0|f1>/<scale>.png
 *   /art/pl/qr/v1/app/<scale>.png
 * Every part is allowlisted, so the route can never draw arbitrary text, mint arbitrary codes or render an unbounded
 * image. Portraits are immutable per URL; codes depend on the companion origin and cache for a day.
 */
export const PORTRAIT_VERSION = 1
export const QR_VERSION = 1
const STAGES = new Set<Stage>(['infant', 'child', 'teen', 'young', 'adult', 'senior'])
const EXTRAS = new Set<Extra>(['none', 'hat', 'scarf'])
/** Whole-number scales only, so pixels stay crisp. */
export const PORTRAIT_SCALES = new Set([1, 2, 3, 4, 5, 6])
export const QR_SCALES = new Set([2, 3, 4, 5])
/** The `/pl` short link to the companion, as Idle Angler's `/ia`: a shorter URL draws a smaller code. */
export const QR_TARGET = '/pl'

/** A stable small number from a string (FNV-1a), for the look a life is drawn with. */
function hash(text: string): number {
  let h = 0x811c9dc5
  for (const ch of text) {
    h ^= ch.codePointAt(0)!
    h = Math.imul(h, 0x01000193) >>> 0
  }
  return h
}

/**
 * How a life is drawn: the hair from its surname, generation and traits (so it holds through a rename), glasses once
 * a line gave them, a hat or a scarf in old age, the pet beside it, and the frame once it has ended.
 */
export function portraitKey(life: Pick<LifeState, 'stage' | 'last' | 'generation' | 'traits' | 'flags' | 'pet' | 'status'>): PortraitKey {
  const h = hash(`${life.last}|${life.generation}|${life.traits.join(',')}`)
  return {
    stage: life.stage,
    hair: h % HAIR_STYLES.length,
    glasses: life.flags.includes('glasses'),
    extra: life.stage === 'senior' ? ((h >>> 8) % 3 === 0 ? 'hat' : (h >>> 8) % 3 === 1 ? 'scarf' : 'none') : 'none',
    pet: life.pet?.kind ?? null,
    frame: life.status === 'ended',
  }
}

export const portraitBase = (key: PortraitKey) =>
  `/art/pl/portrait/v${PORTRAIT_VERSION}/${key.stage}/${key.hair}/${key.glasses ? 'g1' : 'g0'}/${key.extra}/${key.pet ?? 'none'}/${key.frame ? 'f1' : 'f0'}`

export const qrBase = () => `/art/pl/qr/v${QR_VERSION}/app`

export function parsePortraitPath(path: string): (PortraitKey & { scale: number }) | null {
  const m = /^\/art\/pl\/portrait\/v(\d+)\/([a-z]+)\/(\d)\/g([01])\/([a-z]+)\/([a-z]+)\/f([01])\/(\d)\.png$/.exec(path)
  if (!m) return null
  const [, version, stage, hair, glasses, extra, pet, frame, scale] = m
  if (Number(version) !== PORTRAIT_VERSION || !STAGES.has(stage as Stage) || Number(hair) >= HAIR_STYLES.length || !EXTRAS.has(extra as Extra) || (pet !== 'none' && !PET_KINDS.includes(pet!)) || !PORTRAIT_SCALES.has(Number(scale))) return null
  return { stage: stage as Stage, hair: Number(hair), glasses: glasses === '1', extra: extra as Extra, pet: pet === 'none' ? null : pet!, frame: frame === '1', scale: Number(scale) }
}

export function renderPaperLivesArt(path: string, origin: string): { png: Uint8Array; immutable: boolean } | null {
  const qr = /^\/art\/pl\/qr\/v(\d+)\/app\/(\d)\.png$/.exec(path)
  if (qr) {
    const scale = Number(qr[2])
    if (Number(qr[1]) !== QR_VERSION || !QR_SCALES.has(scale)) return null
    const { size, ink } = qrInk(`${origin}${QR_TARGET}`, scale)
    return { png: encodePng1Bit(size, size, ink), immutable: false }
  }
  const key = parsePortraitPath(path)
  if (!key) return null
  const { width, height, ink } = composePortrait(key).scaled(key.scale)
  return { png: encodePng1Bit(width, height, ink), immutable: true }
}
