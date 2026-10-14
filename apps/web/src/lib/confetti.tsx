import { useEffect, useState } from 'react'

/** Confetti pieces: a fixed scatter so the burst reads the same every time, in the game's four inks. */
const CONFETTI = Array.from({ length: 28 }, (_, i) => ({ x: ((i * 37) % 100) - 50, y: -(40 + ((i * 53) % 70)), spin: ((i * 97) % 360), delay: (i * 13) % 120, tone: ['bg-gold', 'bg-xp', 'bg-hp', 'bg-sky'][i % 4]! }))

/** A one-shot pixel confetti burst over its (relatively positioned) parent (D129); reduced motion collapses it to a flash. */
export function Confetti() {
  return (
    <span aria-hidden="true" className="pointer-events-none absolute inset-x-0 top-1/2 h-0 overflow-visible">
      {CONFETTI.map((piece, i) => (
        <span key={i} className={`confetti absolute left-1/2 size-2 ${piece.tone}`} style={{ '--dx': `${piece.x * 2.6}px`, '--dy': `${piece.y * 1.6}px`, '--spin': `${piece.spin}deg`, animationDelay: `${piece.delay}ms` } as React.CSSProperties} />
      ))}
    </span>
  )
}

/** A claim's burst: `fire()` starts one, and it clears itself after the animation; render `<Confetti key={burst} />` while `burst > 0`. */
export function useBurst(): [number, () => void] {
  const [burst, setBurst] = useState(0)
  useEffect(() => {
    if (burst === 0) return
    const timer = setTimeout(() => setBurst(0), 1400)
    return () => clearTimeout(timer)
  }, [burst])
  return [burst, () => setBurst((n) => n + 1)]
}
