import { Link } from '@tanstack/react-router'
import { api } from '@trmnl-games/backend/api'
import { captureAnalytics } from '../../../lib/analytics'
import { Confetti, useBurst } from '../../../lib/confetti'
import { GOAL_PAGE, type Dock } from '../../../lib/idleAngler'
import { useIntent } from '../../../lib/intent'
import { Button } from '../../../lib/ui'

type FullDock = NonNullable<Dock['full']>

/**
 * The Dock's goal card (D166), Desk Crawler's shape: a reached goal comes first with a Claim button that pops confetti
 * and pays its coins; the card then turns into the next goal. Under content v2 goals still pay themselves, so a reward
 * is never waiting and the card only names the current goal.
 */
export function GoalCard({ full, notify }: { full: FullDock; notify: (feedback: { error: string | null; message: string | null }) => void }) {
  const claim = useIntent(api.idleAngler.full.claimGoal, { onFeedback: notify })
  const [burst, fireBurst] = useBurst()
  const waiting = full.goal.unclaimed ?? []
  const reward = waiting[0]
  if (!full.goal.line && !reward) return null
  return (
    <section aria-labelledby="goal-title" className={`relative flex flex-col gap-2 border-l-4 border-gold pl-3 ${reward ? 'goal-ready border-4 bg-panel p-3' : ''}`}>
      {burst > 0 ? <Confetti key={burst} /> : null}
      <h2 id="goal-title" className="text-sm font-semibold text-muted">{reward ? 'Goal reached!' : 'Goal'}</h2>
      {reward ? (
        <>
          <p className="font-display text-2xl leading-tight font-bold">{reward.title}</p>
          <p className="text-sm">Your angler got there. The coins are yours to collect.</p>
          <div className="flex flex-wrap items-center gap-3">
            <Button className="w-full sm:w-auto" icon="coin" pending={claim.pending} busyLabel="Claiming…" onClick={async () => { if (await claim.run({ goalId: reward.id }, `+${reward.coins} coins claimed.`)) { fireBurst(); captureAnalytics('goal claimed', { goal: reward.id }) } }}>
              Claim +{reward.coins.toLocaleString()} coins
            </Button>
            {waiting.length > 1 ? <span className="text-xs font-semibold text-muted">{waiting.length - 1} more waiting</span> : null}
          </div>
          {full.goal.line ? <p className="border-t-2 border-dashed border-rule pt-2 text-xs font-semibold text-muted">Next goal: {full.goal.line}</p> : null}
        </>
      ) : (
        <p>
          {full.goal.page ? <Link to={GOAL_PAGE[full.goal.page]!} className="font-semibold underline underline-offset-4">{full.goal.line}</Link> : <strong>{full.goal.line}</strong>}
          {full.goal.coins > 0 ? <span className="text-sm text-gold-ink"> · {full.goal.coins} coins</span> : null}
        </p>
      )}
      {!reward && full.comingUp ? <p className="text-sm text-muted">Coming up: {full.comingUp.name}, at {full.comingUp.species} species ({full.comingUp.logged} so far).</p> : null}
    </section>
  )
}
