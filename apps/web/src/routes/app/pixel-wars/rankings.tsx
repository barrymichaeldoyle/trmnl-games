import { convexQuery } from '@convex-dev/react-query'
import { keepPreviousData, useQuery } from '@tanstack/react-query'
import { Link, createFileRoute } from '@tanstack/react-router'
import { useState } from 'react'
import { api } from '@trmnl-games/backend/api'
import { Glyph } from '../../../lib/glyphs'
import { preload } from '../../../lib/preload'
import { seo } from '../../../lib/seo'
import { Card, LoadingState } from '../../../lib/ui'

/** Pixel Wars rankings (pixel-wars.md "Leaderboards"): the three XP boards of Desk Crawler's shape, Today, This week and Lifetime, by level group. */
export const Route = createFileRoute('/app/pixel-wars/rankings')({
  head: () => seo({ title: 'Rankings · Pixel Wars', index: false }),
  loader: ({ context }) => preload(context, convexQuery(api.pixelWars.leaderboard.view, {})),
  component: RankingsPage,
})

type Board = 'recent_24h' | 'recent_7d' | 'overall'
type Row = { rank: number; name: string; level: number; score: number; profile?: boolean }
type View = { board: Board; published: false } | { board: Board; published: true; cohortKey: string; ownCohortKey: string | null; totalPlayers: number; globalTotalPlayers: number; entries: Row[]; own: { rank: number; rankDelta: number | null; score: number | null } | null }

const BOARDS: ReadonlyArray<{ id: Board; label: string }> = [
  { id: 'recent_24h', label: 'Today' },
  { id: 'recent_7d', label: 'This week' },
  { id: 'overall', label: 'Lifetime' },
]

function RankingsPage() {
  const [board, setBoard] = useState<Board>('recent_7d')
  const { data } = useQuery({ ...convexQuery(api.pixelWars.leaderboard.view, { board }), placeholderData: keepPreviousData })
  const view = data as View | undefined
  if (!view) return <LoadingState label="Loading rankings…" />
  return (
    <>
      <h1 className="font-display text-3xl font-bold">Rankings</h1>
      <div role="group" aria-label="Period" className="grid grid-cols-3 gap-0.5 border-2 border-edge bg-edge">
        {BOARDS.map((b) => (
          <button key={b.id} type="button" aria-pressed={board === b.id} onClick={() => setBoard(b.id)} className={`menu-cursor flex min-h-11 items-center justify-center px-2 py-2 label-px uppercase tracking-wide whitespace-nowrap not-aria-pressed:before:hidden ${board === b.id ? 'bg-navy text-gold' : 'bg-panel text-muted hover:text-ink'}`}>{b.label}</button>
        ))}
      </div>
      {!view.published ? (
        <Card><p className="text-muted">The first board publishes within the hour.</p></Card>
      ) : (
        <Card title={view.board === 'overall' ? 'Every desk' : `Levels ${view.cohortKey}`}>
          <p className="mb-3 text-sm text-muted">{view.board === 'overall' ? 'By level, then XP.' : 'XP earned in the period, among desks in your level group.'}{view.own ? ` You are #${view.own.rank}${view.own.rankDelta ? ` (${view.own.rankDelta > 0 ? '+' : ''}${view.own.rankDelta})` : ''}.` : ''}</p>
          {view.entries.length === 0 ? <p className="text-muted">No desks on this board yet.</p> : (
            <ol className="flex flex-col divide-y divide-rule">
              {view.entries.map((row, i) => {
                const own = view.own?.rank === row.rank && view.ownCohortKey === view.cohortKey
                return (
                  <li key={`${row.rank}-${i}`} aria-current={own ? 'true' : undefined} className={`flex min-w-0 items-center gap-3 py-2 ${own ? '-mx-2 bg-ground px-2 outline-2 outline-gold' : ''}`}>
                    <span aria-hidden="true" className="flex h-6 w-4 shrink-0 items-center text-gold-ink">{row.rank === 1 ? <Glyph name="crown" /> : row.rank <= 3 ? <Glyph name="medal" /> : null}</span>
                    <span className={`-ml-1 w-7 shrink-0 text-right font-bold tabular-nums ${row.rank <= 3 ? 'hud text-sm leading-6 text-gold-ink' : 'text-muted'}`}>{row.rank}</span>
                    <span className="min-w-0 flex-1">
                      {row.profile ? <Link to="/profile/$alias" params={{ alias: row.name }} className="block truncate font-semibold underline decoration-dotted underline-offset-4">{row.name}</Link> : <span className="block truncate font-semibold">{row.name}</span>}
                      <span className="text-sm text-muted">Level {row.level}</span>
                    </span>
                    {view.board !== 'overall' ? <span className="shrink-0 font-semibold tabular-nums">{row.score} XP</span> : null}
                  </li>
                )
              })}
            </ol>
          )}
        </Card>
      )}
    </>
  )
}
