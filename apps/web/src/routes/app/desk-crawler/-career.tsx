import { Link } from '@tanstack/react-router'
import { useEffect, useState } from 'react'
import { api } from '@trmnl-games/backend/api'
import { useIntent } from '../../../lib/intent'
import { Button } from '../../../lib/ui'
import { Glyph, SectionTitle } from '../../../lib/glyphs'
import { LocalTime } from '../../../lib/localTime'
import { captureAnalytics } from '../../../lib/analytics'
import { PixelIcon } from './-pixelIcon'

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

/** " The Server Room opens at level 4, the Cafeteria Depths at level 8, the Archive at level 12 and the Parking Garage at level 16." */
function floorsLine(floors: ReadonlyArray<{ name: string; unlockLevel: number }>): string {
  const later = floors.filter((floor) => floor.unlockLevel > 1).map((floor, i) => `${i === 0 ? 'The' : 'the'} ${floor.name} at level ${floor.unlockLevel}`)
  if (later.length === 0) return ''
  const list = later.length === 1 ? later[0]! : `${later.slice(0, -1).join(', ')} and ${later.at(-1)}`
  return ` ${list.replace(/^The (.*?) at level (\d+)/, 'The $1 opens at level $2')}.`
}

/** How many rungs the Career page previews past the current one; the rest stay a "?" like unearned achievements. */
const PREVIEW = 2

const reachedOn = (date: Date) => date.toLocaleDateString(undefined, { day: 'numeric', month: 'short' })

/** Confetti pieces: a fixed scatter so the burst reads the same every time, in the game's four inks. */
const CONFETTI = Array.from({ length: 28 }, (_, i) => ({ x: ((i * 37) % 100) - 50, y: -(40 + ((i * 53) % 70)), spin: ((i * 97) % 360), delay: (i * 13) % 120, tone: ['bg-gold', 'bg-xp', 'bg-hp', 'bg-sky'][i % 4]! }))

/** A one-shot pixel confetti burst over its parent (D129); reduced motion collapses it to a flash. */
function Confetti() {
  return (
    <span aria-hidden="true" className="pointer-events-none absolute inset-x-0 top-1/2 h-0 overflow-visible">
      {CONFETTI.map((piece, i) => (
        <span key={i} className={`confetti absolute left-1/2 size-2 ${piece.tone}`} style={{ '--dx': `${piece.x * 2.6}px`, '--dy': `${piece.y * 1.6}px`, '--spin': `${piece.spin}deg`, animationDelay: `${piece.delay}ms` } as React.CSSProperties} />
      ))}
    </span>
  )
}

/**
 * The hero page's goal card (P35, D129): rewards waiting to be claimed come first, one at a time with a Claim button
 * that pops confetti and pays the gold; then the one thing to do next, its office blurb, the gold it will set aside
 * and, where the rung counts something, how far along it is. The ladder itself moves without a visit; only the gold
 * waits here, and it never expires.
 */
export function GoalCard({ career, level, notify }: { career: CareerView; level: number; notify?: (feedback: { error: string | null; message: string | null }) => void }) {
  const goal = career.current
  const waiting = career.unclaimed ?? []
  const claim = useIntent(api.heroes.claimGoal, notify ? { onFeedback: notify } : {})
  const [burst, setBurst] = useState(0)
  useEffect(() => {
    if (burst === 0) return
    const timer = setTimeout(() => setBurst(0), 1400)
    return () => clearTimeout(timer)
  }, [burst])
  const counted = goal !== null && goal.target > 1
  // The ladder moves on the hero's next adventure, so a goal done here (an equip, a stance) waits up to one adventure.
  const met = goal !== null && goal.value >= goal.target
  const pct = goal === null ? 0 : Math.max(0, Math.min(100, Math.round((Math.min(goal.value, goal.target) * 100) / Math.max(1, goal.target))))
  const reward = waiting[0]
  return (
    <section aria-labelledby="goal-title" className="window relative flex min-w-0 flex-col gap-2 px-3 pt-3 pb-4 min-[375px]:px-4 sm:px-5">
      {burst > 0 ? <Confetti key={burst} /> : null}
      <div className="flex flex-wrap items-baseline justify-between gap-x-4">
        <SectionTitle id="goal-title" glyph="career">{reward ? 'Goal reached' : 'Goal'}</SectionTitle>
        <Link to="/app/desk-crawler/career" className="inline-flex min-h-11 items-center text-sm underline underline-offset-4">
          Career{career.rung > 0 ? ` · ${Math.min(career.rung, career.total)} of ${career.total}` : ''}
        </Link>
      </div>
      {reward ? (
        <>
          <p className="font-display text-2xl leading-tight font-bold">{reward.title}</p>
          <p className="text-sm">Your hero got there{reward.at !== null ? <> on <LocalTime at={reward.at} format={reachedOn} /></> : ''}. The reward is yours to collect.</p>
          <div className="flex flex-wrap items-center gap-3">
            <Button icon="coin" pending={claim.pending} busyLabel="Claiming…" onClick={async () => { if (await claim.run({ rungId: reward.id }, `+${reward.gold} gold claimed.`)) { setBurst((n) => n + 1); captureAnalytics('goal claimed', { rung: reward.id }) } }}>
              Claim +{reward.gold.toLocaleString()} gold
            </Button>
            {waiting.length > 1 ? <span className="text-xs font-semibold text-muted">{waiting.length - 1} more waiting</span> : null}
          </div>
          {goal ? <p className="border-t-2 border-dashed border-rule pt-2 text-xs font-semibold text-muted">Next goal: {goal.title}</p> : null}
        </>
      ) : goal ? (
        <>
          <p className="font-display text-2xl leading-tight font-bold">{goal.title}</p>
          <p className="text-sm">{met ? 'Done. Your hero marks it off on its next adventure, within fifteen minutes, and the reward waits here.' : goal.blurb}</p>
          <p className="flex flex-wrap items-center gap-x-3 text-xs font-semibold tabular-nums">
            <span className="text-gold-ink">+{goal.gold.toLocaleString()} gold</span>
            {counted ? <span className="text-muted">{Math.min(goal.value, goal.target).toLocaleString()} of {goal.target.toLocaleString()}</span> : null}
            {met ? null : goal.companion ? <span className="text-muted">Done here in the companion</span> : <span className="text-muted">Your hero does this by itself</span>}
          </p>
          {counted ? (
            <div role="meter" aria-label="Progress" aria-valuemin={0} aria-valuemax={goal.target} aria-valuenow={Math.min(goal.value, goal.target)} className="h-3 overflow-hidden border-2 border-night bg-night">
              <div className="h-full bg-gold shadow-[inset_0_2px_0_rgb(255_255_255/0.35)]" style={{ width: `${pct}%` }} />
            </div>
          ) : null}
        </>
      ) : (
        <>
          <p className="font-display text-2xl leading-tight font-bold">Reach level {level + 1}</p>
          <p className="text-sm">The ladder is climbed, for now. Every level from here is its own goal.</p>
        </>
      )}
    </section>
  )
}

/** D157: what each feature does, in one line for the Hero page's "Coming up". */
const FEATURE_BLURB: Record<UnlockView[number]['feature'] | 'roster', string> = {
  todo: 'Three small jobs a day from the morning stand-up, which your hero ticks off by itself for a little gold.',
  meetings: 'Your hero bumps into other players’ heroes around the office.',
  workbench: 'Salvage spare gear for materials, then spend them with gold to improve what your hero wears.',
  stances: 'Cautious, Balanced or Bold: how far your hero pushes before it rests.',
  choices: 'Now and then the office asks your hero to decide something, and you pick the answer here.',
  merchant: 'A merchant passes through now and then, selling potions and bigger bags.',
  raids: 'Your hero raids other players’ desks for gold, and they can raid yours.',
  roster: 'A Rogue joins your roster. One hero adventures at a time, and you choose which.',
}

/**
 * D157: the one locked feature that opens soonest, as a quiet line where the locked cards used to stack, with a link to
 * the Career page's full list. Nothing locked is drawn as a card, so nothing locked looks like something to press.
 */
export function ComingUp({ unlocks, roster }: { unlocks?: UnlockView | null; roster?: { unlockLevel: number; open: boolean } | null }) {
  const locked = [
    ...(unlocks ?? []).filter((entry) => !entry.unlocked).map((entry) => ({ feature: entry.feature as keyof typeof FEATURE_BLURB, label: entry.label, level: entry.level })),
    ...(roster && !roster.open ? [{ feature: 'roster' as const, label: 'a second hero', level: roster.unlockLevel }] : []),
  ].sort((a, b) => a.level - b.level)
  const next = locked[0]
  if (!next) return null
  return (
    <section aria-label="Coming up" className="flex min-w-0 items-start gap-3 text-sm">
      <Glyph name="door" className="mt-0.5 text-sky-ink" />
      <p className="min-w-0">
        <span className="font-semibold">At level {next.level}: {next.label.charAt(0).toUpperCase() + next.label.slice(1)}.</span>{' '}
        <span className="text-muted">{FEATURE_BLURB[next.feature]}</span>{' '}
        <Link to="/app/desk-crawler/career" hash="unlocks-title" className="font-semibold underline underline-offset-4">What opens later</Link>
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
  return (
    <div className="flex min-w-0 flex-col gap-8">
      <section aria-labelledby="career-title" className="window flex min-w-0 flex-col gap-3 px-3 pt-3 pb-4 min-[375px]:px-4 sm:px-5">
        <div className="flex flex-wrap items-baseline justify-between gap-x-4">
          <SectionTitle id="career-title" glyph="career" as="h1">Career</SectionTitle>
          <p className="text-sm text-muted">{reached} of {career.total} reached</p>
        </div>
        <p className="text-sm">One goal at a time. Your hero reaches some by adventuring; the rest are done here in the companion. Each pays a little gold, never XP.</p>
        <ol className="flex flex-col">
          {career.rungs.map((rung, index) => {
            const hidden = rung.state === 'ahead' && index > career.rung + PREVIEW
            return (
              <li key={rung.id} aria-current={rung.state === 'current' ? 'step' : undefined} className={`grid min-w-0 grid-cols-[2rem_minmax(0,1fr)] items-start gap-x-3 border-t-2 border-dashed border-rule py-3 first:border-t-0 ${rung.state === 'ahead' ? 'text-muted' : ''}`}>
                <span aria-hidden="true" className={`grid size-8 place-items-center border-2 ${rung.state === 'done' ? 'border-night bg-gold text-night' : rung.state === 'current' ? 'border-night bg-night text-gold-ink' : 'border-dashed border-faint text-muted'}`}>
                  {rung.state === 'done' ? <PixelIcon kind="todo" plain /> : <span className="hud text-hud-sm">{hidden ? '?' : index + 1}</span>}
                </span>
                {hidden ? (
                  <p className="pt-1.5 text-sm"><span className="sr-only">Rung {index + 1}: </span>Not yet</p>
                ) : (
                  <div className="flex min-w-0 flex-col gap-1">
                    <p className="pt-1 font-semibold">
                      <span className="sr-only">{rung.state === 'done' ? 'Reached: ' : rung.state === 'current' ? 'Current goal: ' : 'Ahead: '}</span>
                      {rung.title}
                    </p>
                    <p className="text-sm">{rung.blurb}</p>
                    <p className="flex flex-wrap items-center gap-x-3 text-xs font-semibold tabular-nums">
                      <span className={rung.state === 'ahead' ? '' : 'text-gold-ink'}>+{rung.gold.toLocaleString()} gold</span>
                      {rung.companion ? <span className="text-muted">In the companion</span> : null}
                      {rung.state === 'done' ? rung.reachedAt !== null ? <LocalTime at={rung.reachedAt} format={reachedOn} className="text-xp-ink" /> : <span className="text-muted">Done before the ladder</span> : null}
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
          <SectionTitle id="unlocks-title" glyph="door" tone="text-sky-ink">What opens when</SectionTitle>
          <p className="text-sm text-muted">Features arrive by level, whether or not you visit.{floorsLine(floors)}</p>
          <ul className="grid gap-2 sm:grid-cols-2">
            {unlocks.map((entry) => (
              <li key={entry.feature} className={`flex items-center gap-3 border-[3px] px-3 py-2 ${entry.unlocked ? 'border-night bg-panel' : 'border-dashed border-faint text-muted'}`}>
                <span aria-hidden="true" className={`hud grid size-7 shrink-0 place-items-center border-[3px] text-hud-sm ${entry.unlocked ? 'border-night bg-night text-gold-ink' : 'border-dashed border-faint'}`}>{entry.level}</span>
                <span className="flex min-w-0 flex-col">
                  <span className="font-semibold capitalize-first">{entry.label.charAt(0).toUpperCase() + entry.label.slice(1)}</span>
                  <span className="text-sm">{entry.unlocked ? 'Unlocked' : `Unlocks at level ${entry.level}`}</span>
                </span>
              </li>
            ))}
          </ul>
        </section>
      ) : null}
    </div>
  )
}
