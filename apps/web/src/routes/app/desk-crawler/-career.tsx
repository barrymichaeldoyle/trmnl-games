import { Link } from '@tanstack/react-router'
import { api } from '@trmnl-games/backend/api'
import { useIntent } from '../../../lib/intent'
import { Button } from '../../../lib/ui'
import { Glyph, SectionTitle } from '../../../lib/glyphs'
import { LocalTime } from '../../../lib/localTime'
import { captureAnalytics } from '../../../lib/analytics'
import { Confetti, useBurst } from '../../../lib/confetti'
import { PixelIcon } from './-pixelIcon'
import { formatNumber, useLocale, useT } from '../../../lib/i18n'
import { useContent } from '../../../lib/useContent'
import { dcCareerMessages } from '../../../i18n/dcCareer'

/** heroes.mine's `career` (P35): the current rung with its progress, and every rung's state for the Career page. */
export type CareerView = {
  rung: number
  total: number
  /** D129: rewards waiting for the Claim button, oldest first. */
  unclaimed?: Array<{ id: string; title: string; gold: number; at: number | null }>
  current: { id: string; title: string; blurb: string; gold: number; companion: boolean; value: number; target: number } | null
  rungs: Array<{ id: string; title: string; blurb: string; gold: number; companion: boolean; state: 'done' | 'current' | 'ahead'; reachedAt: number | null }>
}

/** heroes.mine's `unlocks` (P35): each gated feature, its level and whether this hero has it. */
export type UnlockView = Array<{ feature: 'todo' | 'meetings' | 'workbench' | 'stances' | 'choices' | 'merchant' | 'raids'; label: string; level: number; unlocked: boolean }>


/** How many rungs the Career page previews past the current one; the rest stay a "?" like unearned achievements. */
const PREVIEW = 2

// French and German short months end in a full stop ("13 oct."), which would double the sentence's own.
const reachedOn = (tag: string) => (date: Date) => date.toLocaleDateString(tag, { day: 'numeric', month: tag.startsWith('en') ? 'short' : 'long' })
const TAGS = { en: 'en-GB', fr: 'fr-FR', de: 'de-DE' } as const

/**
 * The hero page's goal card (P35, D129): rewards waiting to be claimed come first, one at a time with a Claim button
 * that pops confetti and pays the gold; then the one thing to do next, its office blurb, the gold it will set aside
 * and, where the rung counts something, how far along it is. A goal finished in the companion is marked off in that
 * same action. A goal the hero finishes while adventuring is marked off on that adventure. Only the gold waits here.
 */
export function GoalCard({ career, level, notify }: { career: CareerView; level: number; notify?: (feedback: { error: string | null; message: string | null }) => void }) {
  const goal = career.current
  const waiting = career.unclaimed ?? []
  const claim = useIntent(api.heroes.claimGoal, notify ? { onFeedback: notify } : {})
  const [burst, fireBurst] = useBurst()
  const counted = goal !== null && goal.target > 1
  const met = goal !== null && goal.value >= goal.target
  const pct = goal === null ? 0 : Math.max(0, Math.min(100, Math.round((Math.min(goal.value, goal.target) * 100) / Math.max(1, goal.target))))
  const reward = waiting[0]
  const t = useT(dcCareerMessages)
  const c = useContent()
  const locale = useLocale()
  const n = (value: number) => formatNumber(locale, value)
  return (
    <section aria-labelledby="goal-title" className={`window relative flex min-w-0 flex-col gap-2 px-3 pt-3 pb-4 min-[375px]:px-4 sm:px-5 ${reward ? 'goal-ready' : ''}`}>
      {burst > 0 ? <Confetti key={burst} /> : null}
      <div className="flex flex-wrap items-baseline justify-between gap-x-4">
        <SectionTitle id="goal-title" glyph="career">{reward ? t.goalReached : t.goal}</SectionTitle>
        <Link to="/app/desk-crawler/career" className="inline-flex min-h-11 items-center text-sm underline underline-offset-4">
          {t.career}{career.rung > 0 ? t.rungOf(Math.min(career.rung, career.total), career.total) : ''}
        </Link>
      </div>
      {reward ? (
        <>
          <p className="font-display text-2xl leading-tight font-bold">{c.text(reward.title)}</p>
          <p className="text-sm">{t.gotThereOn}{reward.at !== null ? <>{t.on}<LocalTime at={reward.at} format={reachedOn(TAGS[locale])} /></> : ''}{t.rewardYours}</p>
          <div className="flex flex-wrap items-center gap-3">
            <Button className="w-full sm:w-auto" icon="coin" pending={claim.pending} busyLabel={t.claiming} onClick={async () => { if (await claim.run({ rungId: reward.id }, t.claimed(n(reward.gold)))) { fireBurst(); captureAnalytics('goal claimed', { rung: reward.id }) } }}>
              {t.claim(n(reward.gold))}
            </Button>
            {waiting.length > 1 ? <span className="text-xs font-semibold text-muted">{t.moreWaiting(waiting.length - 1)}</span> : null}
          </div>
          {goal ? <p className="border-t-2 border-dashed border-rule pt-2 text-xs font-semibold text-muted">{t.nextGoal(goal.title)}</p> : null}
        </>
      ) : goal ? (
        <>
          <p className="font-display text-2xl leading-tight font-bold">{c.text(goal.title)}</p>
          <p className="text-sm">{met ? t.marked : c.text(goal.blurb)}</p>
          <p className="flex flex-wrap items-center gap-x-3 text-xs font-semibold tabular-nums">
            <span className="text-gold-ink">{t.gold(n(goal.gold))}</span>
            {counted ? <span className="text-muted">{t.of(n(Math.min(goal.value, goal.target)), n(goal.target))}</span> : null}
            {met ? null : goal.companion ? <span className="text-muted">{t.doneHere}</span> : <span className="text-muted">{t.whileAdventuring}</span>}
          </p>
          {counted ? (
            <div role="meter" aria-label={t.progress} aria-valuemin={0} aria-valuemax={goal.target} aria-valuenow={Math.min(goal.value, goal.target)} className="h-3 overflow-hidden border-2 border-night bg-night">
              <div className="h-full bg-gold shadow-[inset_0_2px_0_rgb(255_255_255/0.35)]" style={{ width: `${pct}%` }} />
            </div>
          ) : null}
        </>
      ) : (
        <>
          <p className="font-display text-2xl leading-tight font-bold">{t.reachLevel(level + 1)}</p>
          <p className="text-sm">{t.everyGoal}</p>
        </>
      )}
    </section>
  )
}


/**
 * D157: the one locked feature that opens soonest, as a quiet line where the locked cards used to stack, with a link to
 * the Career page's full list. Nothing locked is drawn as a card, so nothing locked looks like something to press.
 */
export function ComingUp({ unlocks, roster }: { unlocks?: UnlockView | null; roster?: { unlockLevel: number; open: boolean } | null }) {
  const t = useT(dcCareerMessages)
  const locked = [
    ...(unlocks ?? []).filter((entry) => !entry.unlocked).map((entry) => ({ feature: entry.feature as keyof typeof t.features, label: entry.label, level: entry.level })),
    ...(roster && !roster.open ? [{ feature: 'roster' as const, label: 'a second hero', level: roster.unlockLevel }] : []),
  ].sort((a, b) => a.level - b.level)
  const next = locked[0]
  if (!next) return null
  return (
    <section aria-label={t.comingUp} className="flex min-w-0 items-start gap-3 text-sm">
      <Glyph name="door" className="mt-0.5 text-sky-ink" />
      <p className="min-w-0">
        <span className="font-semibold">{t.atLevel(next.level, next.label)}</span>{' '}
        <span className="text-muted">{t.features[next.feature]}</span>{' '}
        <Link to="/app/desk-crawler/career" hash="unlocks-title" className="font-semibold underline underline-offset-4">{t.whatOpensLater}</Link>
      </p>
    </section>
  )
}

/**
 * The Career page (P35): the ladder in order. Rungs reached under the ladder carry their date; rungs done before it
 * arrived say so; the current rung is marked; the next two are previewed and the rest stay a "?". Under it, which
 * features this hero's level has opened and the level each of the others arrives at.
 */
export function CareerLadder({ career, unlocks, floors = [] }: { career: CareerView; unlocks: UnlockView | null; floors?: ReadonlyArray<{ name: string; unlockLevel: number }> }) {
  const reached = career.rungs.filter((rung) => rung.state === 'done').length
  const t = useT(dcCareerMessages)
  const c = useContent()
  const locale = useLocale()
  return (
    <div className="flex min-w-0 flex-col gap-8">
      <section aria-labelledby="career-title" className="window flex min-w-0 flex-col gap-3 px-3 pt-3 pb-4 min-[375px]:px-4 sm:px-5">
        <div className="flex flex-wrap items-baseline justify-between gap-x-4">
          <SectionTitle id="career-title" glyph="career" as="h1">{t.career}</SectionTitle>
          <p className="text-sm text-muted">{t.reached(reached, career.total)}</p>
        </div>
        <p className="text-sm">{t.ladderIntro}</p>
        <ol className="flex flex-col">
          {career.rungs.map((rung, index) => {
            const hidden = rung.state === 'ahead' && index > career.rung + PREVIEW
            return (
              <li key={rung.id} aria-current={rung.state === 'current' ? 'step' : undefined} className={`grid min-w-0 grid-cols-[2rem_minmax(0,1fr)] items-start gap-x-3 border-t-2 border-dashed border-rule py-3 first:border-t-0 ${rung.state === 'ahead' ? 'text-muted' : ''}`}>
                <span aria-hidden="true" className={`grid size-8 place-items-center border-2 ${rung.state === 'done' ? 'border-night bg-gold text-night' : rung.state === 'current' ? 'border-night bg-night text-gold-ink' : 'border-dashed border-faint text-muted'}`}>
                  {rung.state === 'done' ? <PixelIcon kind="todo" plain /> : <span className="hud text-hud-sm">{hidden ? '?' : index + 1}</span>}
                </span>
                {hidden ? (
                  <p className="pt-1.5 text-sm"><span className="sr-only">{t.rung(index + 1)}</span>{t.notYet}</p>
                ) : (
                  <div className="flex min-w-0 flex-col gap-1">
                    <p className="pt-1 font-semibold">
                      <span className="sr-only">{rung.state === 'done' ? t.reachedLabel : rung.state === 'current' ? t.currentGoal : t.ahead}</span>
                      {c.text(rung.title)}
                    </p>
                    <p className="text-sm">{c.text(rung.blurb)}</p>
                    <p className="flex flex-wrap items-center gap-x-3 text-xs font-semibold tabular-nums">
                      <span className={rung.state === 'ahead' ? '' : 'text-gold-ink'}>{t.gold(formatNumber(locale, rung.gold))}</span>
                      {rung.companion ? <span className="text-muted">{t.inCompanion}</span> : null}
                      {rung.state === 'done' ? rung.reachedAt !== null ? <LocalTime at={rung.reachedAt} format={reachedOn(TAGS[locale])} className="text-xp-ink" /> : <span className="text-muted">{t.beforeLadder}</span> : null}
                    </p>
                  </div>
                )}
              </li>
            )
          })}
        </ol>
      </section>

      {unlocks ? (
        <section aria-labelledby="unlocks-title" className="flex min-w-0 flex-col gap-3">
          <SectionTitle id="unlocks-title" glyph="door" tone="text-sky-ink">{t.whatOpensWhen}</SectionTitle>
          <p className="text-sm text-muted">{t.featuresArrive}{t.floorsLine(floors)}</p>
          <ul className="grid gap-2 sm:grid-cols-2">
            {unlocks.map((entry) => (
              <li key={entry.feature} className={`flex items-center gap-3 border-[3px] px-3 py-2 ${entry.unlocked ? 'border-night bg-panel' : 'border-dashed border-faint text-muted'}`}>
                <span aria-hidden="true" className={`hud grid size-7 shrink-0 place-items-center border-[3px] text-hud-sm ${entry.unlocked ? 'border-night bg-night text-gold-ink' : 'border-dashed border-faint'}`}>{entry.level}</span>
                <span className="flex min-w-0 flex-col">
                  <span className="font-semibold capitalize-first">{c.text(entry.label).charAt(0).toUpperCase() + c.text(entry.label).slice(1)}</span>
                  <span className="text-sm">{entry.unlocked ? t.unlocked : t.unlocksAt(entry.level)}</span>
                </span>
              </li>
            ))}
          </ul>
        </section>
      ) : null}
    </div>
  )
}
