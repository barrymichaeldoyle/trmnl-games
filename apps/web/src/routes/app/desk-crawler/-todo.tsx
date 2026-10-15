import { useState } from 'react'
import { api } from '@trmnl-games/backend/api'
import { markedRuns } from '@trmnl-games/desk-crawler/sim/core/narrative'
import { useIntent } from '../../../lib/intent'
import { ConfirmSheet, Consequences } from './-confirm'
import { captureAnalytics } from '../../../lib/analytics'
import { PixelIcon } from './-pixelIcon'
import { useGains } from '../../../lib/ui'
import { SectionTitle } from '../../../lib/glyphs'
import { formatNumber, useLocale, useT } from '../../../lib/i18n'
import { dcRecapMessages } from '../../../i18n/dcRecap'
import { useContent } from '../../../lib/useContent'

export type TodoView = {
  tasks: Array<{ slot: number; templateId: string; label: string; progress: number; target: number; reward: number; done: boolean; biomeId: string | null; local: boolean }>
  swapAvailable: boolean
  nextStandupAt: number
  refillHour: number
}

const clock = (hour: number) => `${String(hour).padStart(2, '0')}:00`

/** A task label with its names in bold, as the log shows them. */
const Label = ({ text }: { text: string }) => <>{markedRuns(text).map((run, i) => (run.bold ? <strong key={i}>{run.text}</strong> : run.text))}</>

/**
 * The office to-do list (D112): three tasks the hero works through on its own. A finished task waits for the
 * morning stand-up with its tick; the one free swap per refill period is the only control, so the card stays a
 * glance, never a chore. Swap asks first in a sheet that says how often it can be used and what is lost, so a stray
 * tap never spends it. Swaps report into the hero page's pinned notice (D98).
 */
export function TodoCard({ todo, biomes, healthy, notify }: { todo: TodoView; biomes: ReadonlyArray<{ id: string; name: string }>; healthy: boolean; notify: (feedback: { error: string | null; message: string | null }) => void }) {
  const swap = useIntent(api.heroes.swapTask, { onFeedback: notify })
  // The task the confirmation sheet is asking about; null while it is closed.
  const [asking, setAsking] = useState<number | null>(null)
  const askingTask = todo.tasks.find((task) => task.slot === asking) ?? null
  const done = todo.tasks.filter((task) => task.done).length
  const biomeName = (id: string | null) => biomes.find((biome) => biome.id === id)?.name ?? ''
  const t = useT(dcRecapMessages)
  const c = useContent()
  const locale = useLocale()
  const n = (value: number) => formatNumber(locale, value)
  return (
    <section aria-labelledby="todo-title" className="window flex min-w-0 flex-col gap-3 px-3 pt-3 pb-4 min-[375px]:px-4 sm:px-5">
      <div className="flex flex-wrap items-baseline justify-between gap-x-4">
        <SectionTitle id="todo-title" glyph="todo" tone="text-xp-ink">{t.todo}</SectionTitle>
        <p className="text-sm text-muted">{done === 0 ? t.finishedGetNew(clock(todo.refillHour)) : t.newAtStandup(clock(todo.refillHour))}</p>
      </div>
      <ol aria-label={t.tasks} className="flex flex-col gap-3">
        {todo.tasks.map((task) => {
          const pct = Math.max(0, Math.min(100, Math.round((task.progress * 100) / task.target)))
          return (
            <li key={`${task.slot}-${task.templateId}-${task.label}`} className="grid min-w-0 grid-cols-[2rem_minmax(0,1fr)] items-start gap-x-3">
              <TaskBox done={task.done} />
              <div className="flex min-w-0 flex-col gap-1">
                <p className="pt-1">
                  <span className="sr-only">{task.done ? t.done : ''}</span>
                  <Label text={c.text(task.label)} />
                </p>
                <div className="flex min-w-0 items-center gap-2">
                  {/* The stat bar's track and fill (Meter), at task size. */}
                  <div role="meter" aria-label={t.progress} aria-valuemin={0} aria-valuemax={task.target} aria-valuenow={task.progress} aria-valuetext={t.progressOf(task.progress, task.target)} className="h-3 min-w-0 flex-1 overflow-hidden border-2 border-night bg-night">
                    <div className={`h-full ${task.done ? 'bg-xp' : 'bg-gold'} shadow-[inset_0_2px_0_rgb(255_255_255/0.35)]`} style={{ width: `${pct}%` }} />
                  </div>
                  <span className="shrink-0 text-xs font-semibold tabular-nums">{n(task.progress)}/{n(task.target)}</span>
                </div>
                <p className="flex flex-wrap items-center gap-x-3 text-xs font-semibold tabular-nums">
                  <span className="text-gold-ink">{t.reward(n(task.reward))}</span>
                  {task.done ? <span className="text-xp-ink">{t.doneNewTask}</span> : null}
                  {!task.done && !task.local ? <span className="text-muted">{t.needsTrip(c.name(biomeName(task.biomeId)))}</span> : null}
                  {!task.done && todo.swapAvailable ? (
                    <button type="button" disabled={!healthy} onClick={() => setAsking(task.slot)} className="inline-flex min-h-11 items-center font-semibold text-muted underline underline-offset-4 hover:text-ink active:text-ink disabled:no-underline">
                      {t.swap}<span className="sr-only">{t.swapThis}</span>
                    </button>
                  ) : null}
                </p>
              </div>
            </li>
          )
        })}
      </ol>
      <p className="text-xs text-muted">{t.worksThrough}</p>
      <ConfirmSheet
        open={askingTask !== null}
        title={t.swapTitle}
        confirmLabel={t.swapConfirm}
        busyLabel={t.swapping}
        cancelLabel={t.keepIt}
        pending={swap.pending}
        disabled={!healthy}
        onClose={() => setAsking(null)}
        onConfirm={async () => {
          if (swap.pending || askingTask === null) return
          const task = askingTask
          if (await swap.run({ slot: task.slot }, t.swapped)) captureAnalytics('task swapped', { template_id: task.templateId })
          setAsking(null)
        }}
      >
        {askingTask ? (
          <>
            <p><Label text={c.text(askingTask.label)} /></p>
            <Consequences>
              <li>{t.oneSwapBefore}<strong>{t.oneSwapStrong}</strong>{t.oneSwapAfter(clock(todo.refillHour))}</li>
              <li>{t.newKind(askingTask.local)}</li>
              {askingTask.progress > 0 ? <li>{t.progressLost(n(askingTask.progress), n(askingTask.target))}</li> : null}
              <li>{t.stuckSwapped}</li>
            </Consequences>
          </>
        ) : null}
      </ConfirmSheet>
    </section>
  )
}

/** The task's checkbox badge; ticking off while the page is open hops it once, like a collected coin. */
function TaskBox({ done }: { done: boolean }) {
  const ticks = useGains(done ? 1 : 0)
  return (
    <span key={ticks} aria-hidden="true" className={`grid size-8 place-items-center border-2 border-night ${done ? 'bg-xp' : 'bg-panel'} ${ticks > 0 ? 'coin-hop' : ''}`}>
      <PixelIcon kind={done ? 'todo' : 'todoOpen'} plain className="text-night" />
    </span>
  )
}
