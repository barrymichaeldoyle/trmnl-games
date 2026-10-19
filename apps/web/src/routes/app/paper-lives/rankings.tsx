import { convexQuery } from '@convex-dev/react-query'
import { useQuery } from '@tanstack/react-query'
import { Link, createFileRoute } from '@tanstack/react-router'
import { useState } from 'react'
import { api } from '@trmnl-games/backend/api'
import { useAnalyticsView } from '../../../lib/analyticsProvider'
import { LocalTime } from '../../../lib/localTime'
import { money } from '../../../lib/paperLives'
import { preload } from '../../../lib/preload'
import { Button, Card } from '../../../lib/ui'

/** Rankings (paper-lives.md "Leaderboards"): the longest lives and the biggest fortunes, this week and all time. Only finished lives rank. */
export const Route = createFileRoute('/app/paper-lives/rankings')({
  loader: ({ context }) => preload(context, convexQuery(api.paperLives.album.board, { board: 'longest', period: 'week' })),
  component: RankingsPage,
})

type Board = 'longest' | 'fortune'
type Period = 'week' | 'all'
type View = { board: Board; period: Period; weekEndsAt: number; full: boolean; own: { rank: number | null; value: number; age: number } | null; entries: Array<{ rank: number; name: string; life: string; value: number; age: number; own: boolean; profile: boolean }> }

const BOARD_LABEL: Record<Board, string> = { longest: 'Longest lives', fortune: 'Fortunes' }
const show = (board: Board, value: number) => (board === 'longest' ? `${value} years` : money(value))

function RankingsPage() {
  const [board, setBoard] = useState<Board>('longest')
  const [period, setPeriod] = useState<Period>('week')
  const { data } = useQuery(convexQuery(api.paperLives.album.board, { board, period }))
  const view = data as View | undefined
  useAnalyticsView('rankings viewed', { board, period }, Boolean(view))
  return (
    <>
      <h1 className="font-display text-3xl font-bold">Rankings</h1>
      <div className="flex flex-wrap gap-2" role="group" aria-label="Board">
        {(['longest', 'fortune'] as const).map((b) => <Button key={b} variant={board === b ? 'primary' : 'secondary'} aria-pressed={board === b} onClick={() => setBoard(b)}>{BOARD_LABEL[b]}</Button>)}
      </div>
      <div className="flex flex-wrap gap-2" role="group" aria-label="Period">
        {(['week', 'all'] as const).map((p) => <Button key={p} variant={period === p ? 'primary' : 'secondary'} aria-pressed={period === p} onClick={() => setPeriod(p)}>{p === 'week' ? 'This week' : 'All time'}</Button>)}
      </div>
      <Card title={`${BOARD_LABEL[board]}, ${period === 'week' ? 'this week' : 'all time'}`}>
        {view && period === 'week' ? <p className="mb-3 text-sm text-muted">A new week starts on <LocalTime at={view.weekEndsAt} format={(d) => d.toLocaleDateString([], { weekday: 'long' })} />. Only finished lives are ranked.</p> : <p className="mb-3 text-sm text-muted">Each player’s best finished life.</p>}
        {view && view.entries.length === 0 ? <p className="text-muted">No finished lives yet.</p> : null}
        <ol className="flex flex-col">
          {(view?.entries ?? []).map((row) => (
            <li key={row.rank} className={`flex items-baseline justify-between gap-3 border-b border-rule py-2 last:border-b-0 ${row.own ? 'font-semibold text-gold-ink' : ''}`}>
              <span className="min-w-0"><span className="tabular-nums text-muted">{row.rank}.</span> {row.life || 'A life'} <span className="text-sm text-muted">· {row.profile ? <Link to="/profile/$alias" params={{ alias: row.name }} className="underline underline-offset-4">{row.name}</Link> : row.name}</span></span>
              <span className="shrink-0 tabular-nums">{show(board, row.value)}</span>
            </li>
          ))}
        </ol>
        {view?.own && view.own.rank === null ? <p className="mt-3 text-sm">Your best: {show(board, view.own.value)}, just outside the list.</p> : null}
        {view && !view.own ? <p className="mt-3 text-sm text-muted">Finish a life to show up here.</p> : null}
      </Card>
    </>
  )
}
