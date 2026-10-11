import { useMemo } from 'react'
import { inked, type Sprite } from '@trmnl-games/engine/art/canvas'
import { fishSprite, FISH_LARGE, FISH_SMALL } from '@trmnl-games/slow-cast/art/fish'
import { paintedSceneUri, sceneBands } from '@trmnl-games/slow-cast/art/sceneColour'
import type { SceneKey } from '@trmnl-games/slow-cast/art/scene'
import { fishTones, flyTones, type Tones } from '@trmnl-games/slow-cast/art/tones'

/**
 * Slow Cast's art in colour (slow-cast.md "Companion"): the device's 1-bit sprites painted with the tones in
 * `art/tones.ts`. Ink cells take the outline tone, white cells the paper tone and shaded cells alternate the two
 * shade tones on the device's checker, so a fish's scales read as texture rather than black noise.
 */
export function PaintedSprite({ sprite, tones, scale = 3, className = '' }: { sprite: Sprite; tones: Tones; scale?: number; className?: string }) {
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

/**
 * The dock's scene: the device's composition painted in colour over its sky and water bands, at a whole-number
 * scale so the pixels stay crisp (2x on phones, 3x from 640px, 4x from 1024px); the bands fill the rest of the width.
 */
export function Scene({ sceneKey, alt }: { sceneKey: SceneKey; alt: string }) {
  const id = JSON.stringify(sceneKey)
  // Keyed on the key's text: a fresh dock object with the same scene must not repaint.
  const painted = useMemo(() => paintedSceneUri(JSON.parse(id) as SceneKey), [id])
  const bands = sceneBands(sceneKey)
  return (
    <div className="relative overflow-hidden border-4 border-night bg-night">
      <div aria-hidden="true" className="absolute inset-0 grid grid-rows-[52.5%_1fr]">
        <div style={{ background: bands.sky }} />
        <div className="border-t-2 border-night/20" style={{ background: bands.water }} />
      </div>
      <img src={painted} alt={alt} width={608} height={160} className="relative mx-auto block h-20 w-[304px] max-w-full object-cover object-center [image-rendering:pixelated] sm:h-[120px] sm:w-[456px] lg:h-40 lg:w-[608px]" />
    </div>
  )
}
