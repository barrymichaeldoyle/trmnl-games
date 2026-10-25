import { useEffect, useRef } from 'react'
import { patternInk } from '@trmnl-games/pixel-wars/art/render'
import type { FactionId, Pattern } from '@trmnl-games/pixel-wars/sim'
import { cellFaction, cellInk, cellIsDesk, cellsFromHex } from '@trmnl-games/pixel-wars/sim'
import { FACTION_TONES, GROUND, type FactionInfo, type MapView } from '../../../lib/pixelWars'

/** A faction's swatch: its pattern inside its colour, so the companion and the device agree. */
export function Swatch({ faction, factions, size = 16, className = '' }: { faction: FactionId; factions: FactionInfo[]; size?: number; className?: string }) {
  const info = factions.find((f) => f.id === faction)
  const tone = FACTION_TONES[faction]
  const path = info ? patternPath(info.pattern, 12) : ''
  return (
    <svg width={size} height={size} viewBox="0 0 12 12" shapeRendering="crispEdges" aria-hidden="true" className={`shrink-0 ${className}`}>
      <rect width="12" height="12" fill={tone.fill} opacity="0.35" />
      <path d={path} fill={tone.ink} />
      <rect x="0.5" y="0.5" width="11" height="11" fill="none" stroke={tone.ink} />
    </svg>
  )
}

function patternPath(pattern: Pattern, size: number): string {
  const runs: string[] = []
  for (let y = 0; y < size; y += 1) {
    let start = -1
    for (let x = 0; x <= size; x += 1) {
      const on = x < size && patternInk(pattern, 3, x, y)
      if (on && start < 0) start = x
      if (!on && start >= 0) {
        runs.push(`M${start} ${y}h${x - start}v1h-${x - start}z`)
        start = -1
      }
    }
  }
  return runs.join('')
}

export function FactionName({ faction, factions, className = '' }: { faction: FactionId; factions: FactionInfo[]; className?: string }) {
  const info = factions.find((f) => f.id === faction)
  return <span className={`inline-flex items-center gap-1.5 ${className}`}><Swatch faction={faction} factions={factions} /><span>{info?.name ?? ''}</span></span>
}

export interface Selection {
  x: number
  y: number
}

/**
 * The map in colour (pixel-wars.md "Companion"): every cell in its faction's colour at its ink, the pattern drawn inside
 * it at two cells a pixel and up, desks ringed, the viewer's own desk ringed in gold, queued targets dotted. Tap a cell
 * to select it.
 */
export function MapCanvas({ map, factions, cell, own, selected, queued, onSelect }: { map: MapView; factions: FactionInfo[]; cell: number; own: { x: number; y: number } | null; selected: Selection | null; queued: ReadonlyArray<{ x: number; y: number }>; onSelect: (s: Selection) => void }) {
  const ref = useRef<HTMLCanvasElement>(null)
  const width = map.cols * cell
  const height = map.rows * cell
  useEffect(() => {
    const canvas = ref.current
    if (!canvas) return
    const ctx = canvas.getContext('2d')
    if (!ctx) return
    const cells = cellsFromHex(map.cells)
    ctx.fillStyle = GROUND
    ctx.fillRect(0, 0, width, height)
    for (let r = 0; r < map.rows; r += 1) {
      for (let c = 0; c < map.cols; c += 1) {
        const byte = cells[r * map.cols + c]!
        const f = cellFaction(byte)
        const desk = cellIsDesk(byte)
        const left = c * cell
        const top = r * cell
        if (f !== 0) {
          const ink = cellInk(byte)
          const level = desk ? (ink >= 4 ? 3 : ink >= 2 ? 2 : 1) : Math.max(1, Math.min(3, ink))
          const tone = FACTION_TONES[f as FactionId]
          ctx.globalAlpha = level === 3 ? 1 : level === 2 ? 0.7 : 0.4
          ctx.fillStyle = tone.fill
          ctx.fillRect(left, top, cell, cell)
          ctx.globalAlpha = 1
          if (cell >= 10) {
            const pattern = factions.find((x) => x.id === f)?.pattern ?? 'solid'
            if (pattern !== 'solid') {
              ctx.fillStyle = tone.ink
              const wx = map.x0 + c
              const wy = map.y0 + r
              for (let py = 0; py < cell; py += 1) for (let px = 0; px < cell; px += 1) if (patternInk(pattern, level, wx * cell + px, wy * cell + py)) ctx.fillRect(left + px, top + py, 1, 1)
            }
          }
        }
        if (desk) {
          ctx.strokeStyle = f === 0 ? '#8a8578' : '#111110'
          ctx.lineWidth = Math.max(1, Math.round(cell / 8))
          ctx.strokeRect(left + ctx.lineWidth / 2, top + ctx.lineWidth / 2, cell - ctx.lineWidth, cell - ctx.lineWidth)
        }
      }
    }
    // Faint grid at bigger cells so a tap has a target.
    if (cell >= 12) {
      ctx.strokeStyle = 'rgba(0,0,0,0.08)'
      ctx.lineWidth = 1
      for (let c = 0; c <= map.cols; c += 1) { ctx.beginPath(); ctx.moveTo(c * cell + 0.5, 0); ctx.lineTo(c * cell + 0.5, height); ctx.stroke() }
      for (let r = 0; r <= map.rows; r += 1) { ctx.beginPath(); ctx.moveTo(0, r * cell + 0.5); ctx.lineTo(width, r * cell + 0.5); ctx.stroke() }
    }
    for (const q of queued) {
      const left = (q.x - map.x0) * cell
      const top = (q.y - map.y0) * cell
      ctx.fillStyle = '#d97706'
      const d = Math.max(3, Math.round(cell / 3))
      ctx.fillRect(left + (cell - d) / 2, top + (cell - d) / 2, d, d)
    }
    if (own) {
      const left = (own.x - map.x0) * cell
      const top = (own.y - map.y0) * cell
      ctx.strokeStyle = '#d4a017'
      ctx.lineWidth = Math.max(2, Math.round(cell / 5))
      ctx.strokeRect(left - ctx.lineWidth, top - ctx.lineWidth, cell + 2 * ctx.lineWidth, cell + 2 * ctx.lineWidth)
    }
    if (selected) {
      const left = (selected.x - map.x0) * cell
      const top = (selected.y - map.y0) * cell
      ctx.strokeStyle = '#111110'
      ctx.setLineDash([3, 2])
      ctx.lineWidth = 2
      ctx.strokeRect(left + 1, top + 1, cell - 2, cell - 2)
      ctx.setLineDash([])
    }
  }, [map, factions, cell, own, selected, queued, width, height])
  return (
    <canvas
      ref={ref}
      width={width}
      height={height}
      role="img"
      aria-label={`The map, ${map.cols} by ${map.rows} cells`}
      className="block cursor-crosshair touch-manipulation"
      style={{ width, height, imageRendering: 'pixelated' }}
      onClick={(event) => {
        const rect = event.currentTarget.getBoundingClientRect()
        const c = Math.floor(((event.clientX - rect.left) / rect.width) * map.cols)
        const r = Math.floor(((event.clientY - rect.top) / rect.height) * map.rows)
        if (c >= 0 && r >= 0 && c < map.cols && r < map.rows) onSelect({ x: map.x0 + c, y: map.y0 + r })
      }}
    />
  )
}
