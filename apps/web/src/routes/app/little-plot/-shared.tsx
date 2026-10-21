import { Link } from '@tanstack/react-router'
import { api } from '@trmnl-games/backend/api'
import { useLocale } from '../../../lib/i18n'
import { formatNumber } from '../../../lib/i18n'
import { Glyph } from '../../../lib/glyphs'
import { useIntent } from '../../../lib/intent'
import { artUrl } from '../../../lib/artUrl'
import { Confetti, useBurst } from '../../../lib/confetti'
import { Button, Meter } from '../../../lib/ui'
import { GOAL_PAGE, RARITY_NAME, type PlotView, type Rarity } from '../../../lib/littlePlot'
import { Gem } from '../desk-crawler/-bagSlots'

/** An amount of coins as the coin mark and the number (D167). */
export function Coins({ n, sign = false, className = '' }: { n: number; sign?: boolean; className?: string }) {
  const locale = useLocale()
  return (
    <span className={`inline-flex items-center gap-1 whitespace-nowrap tabular-nums ${className}`}>
      <Glyph name="coin" size={14} />
      {sign && n > 0 ? '+' : ''}{formatNumber(locale, n)}
      <span className="sr-only"> coins</span>
    </span>
  )
}

/** A price the plot cannot pay yet: the price and what is still to go, where the Buy button will be (D156). */
export function Price({ price, gold, className = '' }: { price: number; gold: number; className?: string }) {
  const locale = useLocale()
  return (
    <p className={`flex flex-wrap items-center gap-x-2 text-sm ${className}`}>
      <Coins n={price} className="font-semibold text-gold-ink" />
      <span className="text-muted">· {formatNumber(locale, price - gold)} to go</span>
    </p>
  )
}

/** A kind's name behind its rarity gem. */
export function KindName({ name, rarity, className = '' }: { name: string; rarity: Rarity; className?: string }) {
  return <span className={`inline-flex items-center gap-2 ${className}`}><Gem rarity={rarity} scale={2} /><span>{name}</span><span className="sr-only"> ({RARITY_NAME[rarity]})</span></span>
}

/** The device's scene, drawn by the art route at a whole-number scale for the box. */
export function Scene({ sceneBase, alt }: { sceneBase: string; alt: string }) {
  if (!sceneBase) return null
  return (
    <figure className="window overflow-hidden bg-white p-0">
      <img src={artUrl(`${sceneBase.replace(/^https?:\/\/[^/]+/, '')}/152/3.png`)} alt={alt} width={456} height={120} className="block w-full [image-rendering:pixelated]" />
    </figure>
  )
}

/**
 * The goal card (D166's shape): a reached goal comes first with a Claim button that pops confetti and pays its
 * coins; the card then turns into the next goal, which links to the page it is done on.
 */
export function GoalCard({ view, notify }: { view: PlotView; notify: (feedback: { error: string | null; message: string | null }) => void }) {
  const claim = useIntent(api.littlePlot.plots.claimGoal, { onFeedback: notify })
  const [burst, fireBurst] = useBurst()
  const waiting = view.waiting
  const goal = view.goal
  return (
    <section aria-labelledby="goal-title" className={`relative flex flex-col gap-2 border-l-4 border-gold pl-3 ${waiting ? 'goal-ready border-4 bg-panel p-3' : ''}`}>
      {burst > 0 ? <Confetti key={burst} /> : null}
      <h2 id="goal-title" className="text-sm font-semibold text-muted">{waiting ? 'Goal reached' : 'Goal'}</h2>
      {waiting ? (
        <>
          <p className="font-display text-2xl leading-tight font-bold">{waiting.count > 1 ? `${waiting.count} goals reached` : 'A goal reached'}</p>
          <div className="flex flex-wrap items-center gap-3">
            <Button className="inline-flex w-full items-center justify-center gap-2 sm:w-auto" pending={claim.pending} busyLabel="Claiming…" onClick={async () => { if (await claim.run({}, 'Claimed.')) fireBurst() }}>
              Claim <Coins n={waiting.coins} sign />
            </Button>
            {waiting.count > 1 ? <span className="text-xs font-semibold text-muted">One at a time.</span> : null}
          </div>
          <p className="border-t-2 border-dashed border-rule pt-2 text-xs font-semibold text-muted">Next: {goal.title}</p>
        </>
      ) : (
        <p>
          <Link to={GOAL_PAGE[goal.page]} className="font-semibold underline underline-offset-4">{goal.title}</Link>
          {goal.coins > 0 ? <> · <Coins n={goal.coins} sign className="text-sm text-gold-ink" /></> : null}
        </p>
      )}
      {!waiting && goal.progress ? <Meter label="Progress" value={goal.progress.value} max={goal.progress.target} tone="gold" /> : null}
    </section>
  )
}
