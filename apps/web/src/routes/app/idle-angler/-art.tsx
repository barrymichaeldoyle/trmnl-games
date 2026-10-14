import { useEffect, useMemo, useRef, useState } from 'react'
import { inked, type Sprite } from '@trmnl-games/engine/art/canvas'
import { fishSprite, FISH_LARGE, FISH_SMALL } from '@trmnl-games/idle-angler/art/fish'
import { paintedSceneUri, sceneBands } from '@trmnl-games/idle-angler/art/sceneColour'
import { clampStageWidth, MIN_STAGE_WIDTH, STAGE_HEIGHT, STAGE_WIDTH, type SceneKey } from '@trmnl-games/idle-angler/art/scene'
import { fishTones, flyTones, type Tones } from '@trmnl-games/idle-angler/art/tones'

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

/** A fly from the box in its colours, drawn from the rows the box sends. */
export function FlyIcon({ id, rows, scale = 4, className = '' }: { id: string; rows: readonly string[]; scale?: number; className?: string }) {
  return <PaintedSprite sprite={{ width: rows[0]!.length, height: rows.length, rows }} tones={flyTones(id)} scale={scale} className={className} />
}

/** The scene's scale for the width of its box: 2x where a 3x stage would be narrower than the composer allows, 4x from 600px. */
const sceneScale = (boxWidth: number) => (boxWidth < 3 * MIN_STAGE_WIDTH ? 2 : boxWidth < 600 ? 3 : 4)

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
  const bands = sceneBands(sceneKey)
  return (
    <div ref={box} className="relative overflow-hidden border-4 border-night bg-night">
      <div aria-hidden="true" className="absolute inset-0 grid grid-rows-[52.5%_1fr]">
        <div style={{ background: bands.sky }} />
        <div className="border-t-2 border-night/20" style={{ background: bands.water }} />
      </div>
      {/* Sized to its pixels, never stretched: the bands take the few columns the whole-number scale leaves over. */}
      <img src={painted} alt={alt} width={width * scale} height={STAGE_HEIGHT * scale} style={{ width: width * scale, height: STAGE_HEIGHT * scale }} className="relative mx-auto block max-w-full object-cover object-left [image-rendering:pixelated]" />
    </div>
  )
}
