import { useEffect, useRef, useState } from 'react'
import type { Shape } from 'canvas-confetti'

/** The games' inks: gold, XP green, HP red, sky, rare violet and cream. */
const COLOURS = ['#ffd166', '#4fd18b', '#e5483b', '#5d8fd6', '#a77bff', '#f4f1ff']

/**
 * A celebration's confetti (D129, reworked 2026-11-14): real confetti over the whole screen, fired from where the
 * celebration sits (its relatively positioned parent), tumbling and falling with `canvas-confetti`. The library loads
 * only when a burst fires, so no page pays for it up front; it draws on its own full-screen canvas and skips the burst
 * entirely under reduced motion.
 */
export function Confetti() {
  const anchor = useRef<HTMLSpanElement>(null)
  useEffect(() => {
    const parent = anchor.current?.parentElement
    if (!parent) return
    let cancelled = false
    void import('canvas-confetti').then(({ default: confetti }) => {
      if (cancelled) return
      const box = parent.getBoundingClientRect()
      const origin = { x: (box.left + box.width / 2) / window.innerWidth, y: Math.min(0.9, (box.top + box.height / 3) / window.innerHeight) }
      const base = { origin, colors: COLOURS, disableForReducedMotion: true, zIndex: 100, shapes: ['square', 'circle'] as Shape[] }
      // A strong pop upward from the celebration, then a wider, softer spray that drifts down across the screen.
      void confetti({ ...base, particleCount: 110, spread: 70, startVelocity: 48, ticks: 260, scalar: 1.35 })
      setTimeout(() => {
        if (!cancelled) void confetti({ ...base, particleCount: 70, spread: 130, startVelocity: 32, decay: 0.92, ticks: 300, scalar: 1.1 })
      }, 140)
    }).catch(() => {})
    return () => { cancelled = true }
  }, [])
  return <span ref={anchor} aria-hidden="true" className="hidden" />
}

/** A claim's burst: `fire()` starts one, and it clears itself afterwards; render `<Confetti key={burst} />` while `burst > 0`. */
export function useBurst(): [number, () => void] {
  const [burst, setBurst] = useState(0)
  useEffect(() => {
    if (burst === 0) return
    const timer = setTimeout(() => setBurst(0), 1400)
    return () => clearTimeout(timer)
  }, [burst])
  return [burst, () => setBurst((n) => n + 1)]
}
