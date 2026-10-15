import { Glyph } from '../../../lib/glyphs'

/**
 * An amount of coins as the coin mark and the number (D167): symbols and numbers over words, so a price reads the same
 * in any language. `sign` adds a + to a gain. The word stays for screen readers.
 */
export function Coins({ n, sign = false, className = '' }: { n: number; sign?: boolean; className?: string }) {
  return (
    <span className={`inline-flex items-center gap-1 whitespace-nowrap tabular-nums ${className}`}>
      <Glyph name="coin" size={14} />
      {sign && n > 0 ? '+' : ''}{n.toLocaleString()}
      <span className="sr-only"> coins</span>
    </span>
  )
}

/** D156 for Idle Angler: a price the angler cannot pay yet, as text where the Buy button will be, so no dead button sits on the page. */
export function Price({ price, gold, className = '' }: { price: number; gold: number; className?: string }) {
  return (
    <p className={`flex flex-wrap items-center gap-x-2 text-sm ${className}`}>
      <Coins n={price} className="font-semibold text-gold-ink" />
      <span className="text-muted">· {(price - gold).toLocaleString()} to go</span>
    </p>
  )
}
