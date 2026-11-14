import { IA_MARKS, type IaMark } from '@trmnl-games/idle-angler/art/marks'
import type { Dock } from '../../../lib/idleAngler'
import { useEffect, useMemo, useRef, useState } from 'react'
import { inked, type Sprite } from '@trmnl-games/engine/art/canvas'
import { fishSprite, FISH_LARGE, FISH_SMALL } from '@trmnl-games/idle-angler/art/fish'
import { paintedSceneUri, sceneKeyFromUrl, sceneSteps } from '@trmnl-games/idle-angler/art/sceneColour'
import { clampStageWidth, MIN_STAGE_WIDTH, poseFor, STAGE_HEIGHT, STAGE_WIDTH, type SceneKey } from '@trmnl-games/idle-angler/art/scene'
import { fishTones, flyTones, type Tones } from '@trmnl-games/idle-angler/art/tones'
import { badgeColourLayers } from '@trmnl-games/idle-angler/art/badgeColour'
import { BADGE_SIZE, frameForTier } from '@trmnl-games/idle-angler/art/badges'

/**
 * Idle Angler's art in colour (idle-angler.md "Companion"): the device's 1-bit sprites painted with the tones in
 * `art/tones.ts`. Ink cells take the outline tone, white cells the paper tone and shaded cells alternate the two
 * shade tones on the device's checker, so a fish's scales read as texture rather than black noise.
 */
function PaintedSprite({ sprite, tones, scale = 3, className = '' }: { sprite: Sprite; tones: Tones; scale?: number; className?: string }) {
  const paths = new Map<string, string>()
  sprite.rows.forEach((row, y) => {
    ;[...row].forEach((ch, x) => {
      const black = inked(ch, x, y)
      if (black === null) return
      const colour = ch === '#' ? (tones.ink ?? '#1b1530') : ch === 'w' ? tones.paper : tones.shade ? tones.shade[black ? 0 : 1] : black ? tones.ink : tones.paper
      if (!colour) return
      paths.set(colour, `${paths.get(colour) ?? ''}M${x} ${y}h1v1h-1z`)
    })
  })
  return (
    <svg viewBox={`0 0 ${sprite.width} ${sprite.height}`} width={sprite.width * scale} height={sprite.height * scale} aria-hidden="true" shapeRendering="crispEdges" className={`shrink-0 ${className}`}>
      {[...paths].map(([colour, d]) => <path key={colour} d={d} fill={colour} />)}
    </svg>
  )
}

/** One species in its colours: the small sprite for rows and lists, the large one for the logbook. */
export function FishIcon({ id, size = 'small', scale = 3, className = '' }: { id: string; size?: 'small' | 'large'; scale?: number; className?: string }) {
  const dims = size === 'large' ? FISH_LARGE : FISH_SMALL
  return <PaintedSprite sprite={fishSprite(id, dims.width, dims.height)} tones={fishTones(id)} scale={scale} className={className} />
}

/**
 * An achievement badge (P48): the family's picture, or its fish, in the medallion whose frame shows the tier; tier 0
 * is the locked outline. The device's layers painted in the companion's colours, stacked.
 */
export function BadgeIcon({ family, tier, scale = 2, className = '' }: { family: string; tier: number; scale?: number; className?: string }) {
  const frame = frameForTier(family, tier)
  const layers = useMemo(() => badgeColourLayers(family, frame), [family, frame])
  return (
    <span aria-hidden="true" className={`relative inline-block shrink-0 ${className}`} style={{ width: BADGE_SIZE * scale, height: BADGE_SIZE * scale }}>
      {layers.map((layer, i) => <PaintedSprite key={i} sprite={layer.sprite} tones={layer.tones} scale={scale} className="absolute inset-0" />)}
    </span>
  )
}

/** A fly from the box in its colours, drawn from the rows the box sends. */
export function FlyIcon({ id, rows, scale = 4, className = '' }: { id: string; rows: readonly string[]; scale?: number; className?: string }) {
  return <PaintedSprite sprite={{ width: rows[0]!.length, height: rows.length, rows }} tones={flyTones(id)} scale={scale} className={className} />
}

/** The scene's scale for the width of its box: 2x where a 3x stage would be narrower than the composer allows, 4x from 600px. */
const sceneScale = (boxWidth: number) => (boxWidth < 3 * MIN_STAGE_WIDTH ? 2 : boxWidth < 600 ? 3 : 4)

/** Flat bands with hard stops, top to bottom, sized by their pixel rows. */
function stepped(steps: ReadonlyArray<{ colour: string; rows: number }>): string {
  const total = steps.reduce((sum, step) => sum + step.rows, 0)
  let at = 0
  return `linear-gradient(${steps.map((step) => `${step.colour} ${(at * 100) / total}% ${((at += step.rows) * 100) / total}%`).join(', ')})`
}

/**
 * The dock's scene: the device's composition painted in colour over its sky and water bands, edge to edge (D125).
 * The box's width is measured, and the stage composed at that width over a whole-number scale (2x on narrow phones,
 * 3x on phones, 4x from 600px) so the pixels stay crisp and the water reaches both edges; the server render and the
 * first frame use the composed width, cropped to the box, until the measurement lands.
 */
export function Scene({ sceneKey, alt }: { sceneKey: SceneKey; alt: string }) {
  const id = JSON.stringify(sceneKey)
  const box = useRef<HTMLDivElement>(null)
  const [boxWidth, setBoxWidth] = useState<number | null>(null)
  useEffect(() => {
    const el = box.current
    if (!el) return
    const measure = () => setBoxWidth(el.clientWidth)
    measure()
    const observer = new ResizeObserver(measure)
    observer.observe(el)
    return () => observer.disconnect()
  }, [])
  const scale = boxWidth ? sceneScale(boxWidth) : 3
  const width = boxWidth ? clampStageWidth(boxWidth / scale) : STAGE_WIDTH
  // Keyed on the key's text: a fresh dock object with the same scene must not repaint.
  const painted = useMemo(() => paintedSceneUri(JSON.parse(id) as SceneKey, width), [id, width])
  const steps = sceneSteps(sceneKey)
  return (
    <div ref={box} className="relative overflow-hidden border-4 border-night bg-night">
      <div aria-hidden="true" className="absolute inset-0 grid grid-rows-[52.5%_1fr]">
        <div style={{ background: stepped(steps.sky) }} />
        <div style={{ background: stepped(steps.water) }} />
      </div>
      {/* Sized to its pixels, never stretched: the bands take the few columns the whole-number scale leaves over. */}
      <img src={painted} alt={alt} width={width * scale} height={STAGE_HEIGHT * scale} style={{ width: width * scale, height: STAGE_HEIGHT * scale }} className="relative mx-auto block max-w-full object-cover object-left [image-rendering:pixelated]" />
    </div>
  )
}

/** One of the device's 8x8 marks (weather, the catch fish) as a crisp inline SVG in the current colour, for rows that pair a mark with a number. Decorative: the text beside it names the thing. */
export function Mark({ name, size = 16, className = '' }: { name: IaMark; size?: number; className?: string }) {
  const rows = IA_MARKS[name] as readonly string[]
  const path = rows.flatMap((row, y) => [...row.matchAll(/#+/g)].map((run) => `M${run.index} ${y}h${run[0].length}v1h-${run[0].length}z`)).join('')
  return (
    <svg viewBox={`0 0 ${rows[0]!.length} ${rows.length}`} width={size} height={size} aria-hidden="true" shapeRendering="crispEdges" className={`shrink-0 fill-current ${className}`}>
      <path d={path} />
    </svg>
  )
}

/** The scene from the dock alone: the water the angler fishes or heads to, its band and weather, and the pose the latest story calls for. */

function sceneFromDock(dock: Dock | undefined): SceneKey | null {
  const angler = dock?.angler
  const water = dock?.waters?.find((w) => w.id === (angler?.travelTo ?? angler?.waterId))
  if (!angler || !water) return null
  const pose = poseFor(angler.status === 'paused' ? 'paused' : angler.travelTo ? 'travelling' : 'fishing', dock?.logs?.[0]?.kind ?? null)
  // The dock does not say which fish was held, so a catch shows the angler waiting rather than holding nothing.
  return { water: water.id as SceneKey['water'], band: water.band as SceneKey['band'], weather: water.weather as SceneKey['weather'], season: (dock?.full?.season?.id ?? null) as SceneKey['season'], pose: pose === 'holding' ? 'waiting' : pose, fish: null, fly: null }
}

/** The scene the device shows, from the preview payload's scene when it has one, else drawn from the dock's own water, weather and status. */
export const dockScene = (preview: { scene_base?: unknown } | null | undefined, dock: Dock | undefined): SceneKey | null =>
  (typeof preview?.scene_base === 'string' && preview.scene_base ? sceneKeyFromUrl(`${preview.scene_base}/152/3.png`) : null) ?? sceneFromDock(dock)
