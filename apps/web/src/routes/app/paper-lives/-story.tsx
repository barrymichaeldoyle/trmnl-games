import { usePaginatedQuery } from 'convex/react'
import { api } from '@trmnl-games/backend/api'
import { changeWords, Named, type LifeView } from '../../../lib/paperLives'
import { Button } from '../../../lib/ui'

type Log = NonNullable<LifeView['logs']>[number]

/** Lines a page fetches: about five busy years. */
const PAGE = 80

/**
 * The story as rows, newest first: quiet lines, prompts and year recaps left out (the recap would sit in the next
 * year's group, and "Last year" already says it), achievements unlocked together on one row
 * ("3 achievements: …"), and each age shown once, on the first row of its year.
 */
function storyRows(logs: readonly Log[]): Array<Log & { newAge: boolean }> {
  const rows: Log[] = []
  for (const log of logs) {
    if (log.kind === 'decision_offered' || log.kind === 'ambient' || log.kind === 'recap') continue
    const last = rows.at(-1)
    if (log.kind === 'achievement' && last?.kind === 'achievement' && last.age === log.age) {
      const names = [...(last.summary.match(/^\d+ achievements: (.*)$/)?.[1]?.split(', ') ?? [last.summary.replace(/^Achievement: /, '')]), log.summary.replace(/^Achievement: /, '')]
      rows[rows.length - 1] = { ...last, summary: `${names.length} achievements: ${names.join(', ')}` }
    } else rows.push(log)
  }
  return rows.map((row, i, all) => ({ ...row, newAge: i === 0 || all[i - 1]!.age !== row.age }))
}

/** What a line changed, on its own line under the words, in the muted ink. */
export function Changes({ log }: { log: Log }) {
  const words = changeWords(log.changes)
  return words ? <span className="block text-xs text-muted">{words}</span> : null
}

/**
 * A life's whole story, newest first (D182): the first pages load at once, and "Show earlier years" reads further
 * back, to the birth. `ordinal` reads a finished life of the owner's; without it, the current life.
 */
export function StoryList({ names, ordinal, currentAge }: { names: readonly string[]; ordinal?: number; currentAge?: number }) {
  const { results, status, loadMore } = usePaginatedQuery(api.paperLives.lives.story, ordinal === undefined ? {} : { ordinal }, { initialNumItems: PAGE })
  const rows = storyRows(results as Log[])
  if (status === 'LoadingFirstPage') return <p className="text-muted" role="status">Loading the story…</p>
  return (
    <>
      {rows.length === 0 ? <p className="text-muted">Nothing yet. The story will start within fifteen minutes.</p> : null}
      <ol className="flex flex-col gap-1.5">
        {rows.map((row) => (
          <li key={row.id} className={`text-sm ${row.newAge ? 'mt-3 first:mt-0' : ''}`}>
            {row.newAge ? <p className="mb-1 text-xs font-semibold text-muted">Age {row.age}{row.age === currentAge ? ' · now' : ''}</p> : null}
            <span className={`${row.kind === 'death' || row.remarkable ? 'font-semibold' : ''} ${row.kind === 'achievement' ? 'text-gold-ink' : ''}`}><Named text={row.summary} names={names} /></span>
            <Changes log={row} />
          </li>
        ))}
      </ol>
      {status === 'CanLoadMore' || status === 'LoadingMore' ? (
        <div className="mt-4">
          <Button variant="secondary" pending={status === 'LoadingMore'} busyLabel="Loading…" onClick={() => loadMore(PAGE)}>Show earlier years</Button>
        </div>
      ) : rows.length > 0 ? <p className="mt-4 text-xs text-muted">That’s where it all began.</p> : null}
    </>
  )
}
