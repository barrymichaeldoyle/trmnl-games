import { useMemo } from 'react'
import type { BadgeTones } from '@trmnl-games/engine/art/badge'
import { inked, type Sprite } from '@trmnl-games/engine/art/canvas'

/**
 * An achievement badge's layers painted in colour (P49), the engine's `badgeColourLayers` stacked: ink cells take
 * `ink`, paper cells `paper`, shaded cells alternate the two `shade` tones on the device's checker. Shared by the
 * games whose badges come from the engine's medallion.
 */
export function BadgeArt({ layers, scale = 2, className = '' }: { layers: ReadonlyArray<{ readonly sprite: Sprite; readonly tones: BadgeTones }>; scale?: number; className?: string }) {
  const size = layers[0]?.sprite.width ?? 0
  // A shelf draws seventy of these; the paths depend only on the layers, which callers memoise.
  const painted = useMemo(() => layers.map(({ sprite, tones }) => {
        const paths = new Map<string, string>()
        sprite.rows.forEach((row, y) => {
          ;[...row].forEach((ch, x) => {
            const black = inked(ch, x, y)
            if (black === null) return
            const colour = ch === '#' ? tones.ink : ch === 'w' ? tones.paper : tones.shade ? tones.shade[black ? 0 : 1] : black ? tones.ink : tones.paper
            if (!colour) return
            paths.set(colour, `${paths.get(colour) ?? ''}M${x} ${y}h1v1h-1z`)
          })
        })
        return [...paths]
      }), [layers])
  return (
    <span aria-hidden="true" className={`relative inline-block shrink-0 ${className}`} style={{ width: size * scale, height: size * scale }}>
      {painted.map((paths, i) => (
        <svg key={i} viewBox={`0 0 ${size} ${size}`} width={size * scale} height={size * scale} shapeRendering="crispEdges" className="absolute inset-0">
          {paths.map(([colour, d]) => <path key={colour} d={d} fill={colour} />)}
        </svg>
      ))}
    </span>
  )
}
