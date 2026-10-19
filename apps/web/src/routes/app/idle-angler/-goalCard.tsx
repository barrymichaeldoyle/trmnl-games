import { Link } from '@tanstack/react-router'
import { api } from '@trmnl-games/backend/api'
import { captureAnalytics } from '../../../lib/analytics'
import { Confetti, useBurst } from '../../../lib/confetti'
import { GOAL_PAGE, type Dock } from '../../../lib/idleAngler'
import { useIntent } from '../../../lib/intent'
import { Button, Meter } from '../../../lib/ui'
import { Coins } from './-coins'
import { useT } from '../../../lib/i18n'
import { iaGoal } from '../../../i18n/ia'
import { useAngler } from '../../../lib/idleAngler'

type FullDock = NonNullable<Dock['full']>

/**
 * The Dock's goal card (D166), Desk Crawler's shape: a reached goal comes first with a Claim button that pops confetti
 * and pays its coins; the card then turns into the next goal. Under content v2 goals still pay themselves, so a reward
 * is never waiting and the card only names the current goal.
 */
export function GoalCard({ full, fishmonger, notify }: { full: FullDock; fishmonger: boolean; notify: (feedback: { error: string | null; message: string | null }) => void }) {
  const t = useT(iaGoal)
  const words = useAngler()
  const claim = useIntent(api.idleAngler.full.claimGoal, { onFeedback: notify })
  const [burst, fireBurst] = useBurst()
  const waiting = full.goal.unclaimed ?? []
  const reward = waiting[0]
  if (!full.goal.line && !reward) return null
  return (
    <section aria-labelledby="goal-title" className={`relative flex flex-col gap-2 border-l-4 border-gold pl-3 ${reward ? 'goal-ready border-4 bg-panel p-3' : ''}`}>
      {burst > 0 ? <Confetti key={burst} /> : null}
      <h2 id="goal-title" className="text-sm font-semibold text-muted">{reward ? t.reached : t.goal}</h2>
      {reward ? (
        <>
          <p className="font-display text-2xl leading-tight font-bold">{words.goal(reward.id)}</p>
          <div className="flex flex-wrap items-center gap-3">
            <Button className="inline-flex w-full items-center justify-center gap-2 sm:w-auto" pending={claim.pending} busyLabel={t.claiming} onClick={async () => { if (await claim.run({ goalId: reward.id }, t.claimed(reward.coins))) { fireBurst(); captureAnalytics('goal claimed', { goal: reward.id }) } }}>
              {t.claim} <Coins n={reward.coins} sign />
            </Button>
            {waiting.length > 1 ? <span className="text-xs font-semibold text-muted">{t.moreWaiting(waiting.length - 1)}</span> : null}
          </div>
          {full.goal.line ? <p className="border-t-2 border-dashed border-rule pt-2 text-xs font-semibold text-muted">{t.nextGoal} {words.goal(full.goal.line)}</p> : null}
        </>
      ) : (
        <p>
          {/* D167: an order goal links to the cooler only while the fishmonger is there; the angler cannot choose its catch. */}
          {full.goal.page && (!full.goal.orders || fishmonger) ? <Link to={GOAL_PAGE[full.goal.page]!} className="font-semibold underline underline-offset-4">{words.goal(full.goal.line ?? '')}</Link> : <strong>{words.goal(full.goal.line ?? '')}</strong>}
          {full.goal.coins > 0 ? <> · <Coins n={full.goal.coins} sign className="text-sm text-gold-ink" /></> : null}
        </p>
      )}
      {!reward && full.goal.progress ? <Meter label={t.progress} value={full.goal.progress.value} max={full.goal.progress.target} tone="gold" /> : null}
      {!reward && full.goal.hint ? <p className="text-sm text-muted">{words.text(full.goal.hint)}</p> : null}
      {!reward && full.goal.orders && !fishmonger ? <p className="text-sm text-muted">{t.fishmongerTurnsUp}</p> : null}
      {!reward && full.comingUp ? <p className="text-sm text-muted">{t.comingUp(words.text(full.comingUp.name), full.comingUp.species, full.comingUp.logged)}</p> : null}
    </section>
  )
}
