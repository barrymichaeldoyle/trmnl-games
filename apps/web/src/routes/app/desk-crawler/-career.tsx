import { Link } from '@tanstack/react-router'
import { Glyph, SectionTitle } from '../../../lib/glyphs'
import { LocalTime } from '../../../lib/localTime'
import { PixelIcon } from './-pixelIcon'

/** heroes.mine's `career` (P35): the current rung with its progress, and every rung's state for the Career page. */
export type CareerView = {
  rung: number
  total: number
  current: { id: string; title: string; blurb: string; gold: number; companion: boolean; value: number; target: number } | null
  rungs: Array<{ id: string; title: string; blurb: string; gold: number; companion: boolean; state: 'done' | 'current' | 'ahead'; reachedAt: number | null }>
}

/** heroes.mine's `unlocks` (P35): each gated feature, its level and whether this hero has it. */
export type UnlockView = Array<{ feature: 'todo' | 'stances' | 'choices' | 'merchant' | 'raids'; label: string; level: number; unlocked: boolean }>

/** How many rungs the Career page previews past the current one; the rest stay a "?" like unearned achievements. */
const PREVIEW = 2

const reachedOn = (date: Date) => date.toLocaleDateString(undefined, { day: 'numeric', month: 'short' })

/**
 * The hero page's goal line (P35): the one thing to do next, its office blurb, the gold it pays and, where the rung
 * counts something, how far along it is. A companion rung says where to do it. Nothing here is a control: the goal
 * is reached by playing, and the Career page under More holds the whole ladder.
 */
export function GoalCard({ career, level }: { career: CareerView; level: number }) {
  const goal = career.current
  const counted = goal !== null && goal.target > 1
  const pct = goal === null ? 0 : Math.max(0, Math.min(100, Math.round((Math.min(goal.value, goal.target) * 100) / Math.max(1, goal.target))))
  return (
    <section aria-labelledby="goal-title" className="window flex min-w-0 flex-col gap-2 px-3 pt-3 pb-4 min-[375px]:px-4 sm:px-5">
      <div className="flex flex-wrap items-baseline justify-between gap-x-4">
        <SectionTitle id="goal-title" glyph="career">Goal</SectionTitle>
        <Link to="/app/desk-crawler/career" className="inline-flex min-h-11 items-center text-sm underline underline-offset-4">
          Career{career.rung > 0 ? ` · ${Math.min(career.rung, career.total)} of ${career.total}` : ''}
        </Link>
      </div>
      {goal ? (
        <>
          <p className="font-display text-2xl leading-tight font-bold">{goal.title}</p>
          <p className="text-sm">{goal.blurb}</p>
          <p className="flex flex-wrap items-center gap-x-3 text-xs font-semibold tabular-nums">
            <span className="text-gold-ink">+{goal.gold.toLocaleString()} gold</span>
            {counted ? <span className="text-muted">{Math.min(goal.value, goal.target).toLocaleString()} of {goal.target.toLocaleString()}</span> : null}
            {goal.companion ? <span className="text-muted">Done here in the companion</span> : <span className="text-muted">Your hero does this by itself</span>}
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

/** A feature the hero's level has not reached yet, in the place its card will take (P35). Never a control. */
export function LockedCard({ title, glyph, level, blurb }: { title: string; glyph: 'todo' | 'shield'; level: number; blurb: string }) {
  return (
    <section aria-label={`${title}, unlocks at level ${level}`} className="flex min-w-0 flex-col gap-1 border-[3px] border-dashed border-faint px-3 py-3 text-muted min-[375px]:px-4">
      <p className="flex items-center gap-3 font-display text-xl font-bold">
        {glyph === 'todo' ? <PixelIcon kind="todoOpen" plain className="shrink-0" /> : <Glyph name="shield" className="shrink-0" />}
        <span>{title}</span>
        <span className="hud ml-auto text-hud-sm">Level {level}</span>
      </p>
      <p className="text-sm">{blurb}</p>
    </section>
  )
}

/**
 * The Career page (P35): the ladder in order. Rungs reached under the ladder carry their date; rungs done before it
 * arrived say so; the current rung is marked; the next two are previewed and the rest stay a "?". Under it, which
 * features this hero's level has opened and the level each of the others arrives at.
 */
export function CareerLadder({ career, unlocks }: { career: CareerView; unlocks: UnlockView | null }) {
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
          <p className="text-sm text-muted">Features arrive by level, whether or not you visit. The Server Room opens at level 4 and the Cafeteria Depths at level 8.</p>
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
