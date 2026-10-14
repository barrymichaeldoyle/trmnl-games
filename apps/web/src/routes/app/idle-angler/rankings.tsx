import { convexQuery } from '@convex-dev/react-query'
import { useQuery } from '@tanstack/react-query'
import { Link, createFileRoute } from '@tanstack/react-router'
import { useState } from 'react'
import { api } from '@trmnl-games/backend/api'
import { preload } from '../../../lib/preload'
import { formatWeight } from '../../../lib/idleAngler'
import { Card } from '../../../lib/ui'
import { FishIcon } from './-art'
import { FishName } from './-fish'
import { LocalTime } from '../../../lib/localTime'

/**
 * Idle Angler rankings (2026-10-10): each water's heaviest fish, this week and of all time. No XP or levels: the fish
 * itself is the score. Opens on the angler's own water.
 */
export const Route = createFileRoute('/app/idle-angler/rankings')({
  loader: ({ context }) => preload(context, convexQuery(api.idleAngler.leaderboard.view, {}), convexQuery(api.idleAngler.full.opens, {})),
  component: RankingsPage,
})

const WATERS = [
  { id: 'millpond', label: 'Millpond' },
  { id: 'river_bend', label: 'River Bend' },
  { id: 'harbour_pier', label: 'Harbour Pier' },
  // Content v2 (D162).
  { id: 'heron_lake', label: 'Heron Lake' },
  { id: 'deep_sea', label: 'Charter' },
  { id: 'frozen_tarn', label: 'Frozen Tarn' },
] as const
const PERIODS = [
  { id: 'week', label: 'This week' },
  { id: 'all', label: 'All time' },
] as const

type Row = { rank: number; name: string; speciesId: string; grams: number; own: boolean; profile: boolean }
type View = { waterId: (typeof WATERS)[number]['id']; period: 'week' | 'all'; weekEndsAt: number; entries: Row[]; own: { rank: number | null; speciesId: string; grams: number } | null; full: boolean }

const TAB = 'hud text-hud-sm min-h-11 flex-1 border-[3px] px-2'

type Opens = { period: string; startsAt: number; endsAt: number; on: boolean; prizes: number[]; waters: Array<{ id: string; name: string; target: { id: string; name: string }; entries: Row[]; own: { rank: number | null; speciesId: string; grams: number } | null }> }

const weekday = (date: Date) => date.toLocaleString([], { weekday: 'long', hour: '2-digit', minute: '2-digit' })

/** D162: this weekend's Open at every water: the target fish, the top three and your own entry. */
function OpensCard({ opens }: { opens: Opens }) {
  return (
    <Card title={opens.on ? 'This weekend\'s Opens' : 'Next weekend\'s Opens'}>
      <p className="mb-3 text-sm text-muted">
        {opens.on ? <>On until <LocalTime at={opens.endsAt} format={weekday} />.</> : <>From <LocalTime at={opens.startsAt} format={weekday} /> to <LocalTime at={opens.endsAt} format={weekday} />.</>} Land the target fish at its water to enter. The top three take {opens.prizes.join(', ')} coins and a medal on Monday.
      </p>
      <ul className="flex flex-col gap-3">
        {opens.waters.map((w) => (
          <li key={w.id} className="border-b border-rule pb-3 last:border-b-0">
            <p className="font-semibold"><FishName id={w.target.id}>{w.target.name}</FishName> Open · {w.name}</p>
            {w.entries.length === 0 ? <p className="text-sm text-muted">No entries yet.</p> : (
              <ol className="mt-1 flex flex-col text-sm">
                {w.entries.slice(0, 3).map((row) => <li key={row.rank} className={`flex gap-3 ${row.own ? 'font-semibold text-gold-ink' : ''}`}><span className="w-6 tabular-nums text-muted">{row.rank}</span><span className="min-w-0 flex-1 truncate">{row.name}</span><span className="tabular-nums">{formatWeight(row.grams)}</span></li>)}
              </ol>
            )}
            {w.own && !w.entries.slice(0, 3).some((r) => r.own) ? <p className="mt-1 text-sm text-muted">Your entry: {formatWeight(w.own.grams)}{w.own.rank ? `, #${w.own.rank}` : ''}.</p> : null}
          </li>
        ))}
      </ul>
    </Card>
  )
}

const resetsAt = (date: Date) => date.toLocaleString([], { weekday: 'long', hour: '2-digit', minute: '2-digit' })

function RankingsPage() {
  const { data: first } = useQuery(convexQuery(api.idleAngler.leaderboard.view, {}))
  const [water, setWater] = useState<View['waterId'] | null>(null)
  const [period, setPeriod] = useState<View['period']>('week')
  const chosen = water ?? (first as View | undefined)?.waterId ?? 'millpond'
  const { data } = useQuery(convexQuery(api.idleAngler.leaderboard.view, { waterId: chosen, period }))
  const view = data as View | undefined
  const { data: opensData } = useQuery(convexQuery(api.idleAngler.full.opens, {}))
  const opens = opensData as Opens | null | undefined
  return (
    <>
      <h1 className="font-display text-3xl font-bold">Rankings</h1>
      {opens ? <OpensCard opens={opens} /> : null}
      <p className="text-sm text-muted">The heaviest fish each angler has landed at each water, kept or released.</p>
      <div role="tablist" aria-label="Water" className="grid grid-cols-3 gap-2">
        {WATERS.map((w) => (
          <button key={w.id} type="button" role="tab" aria-selected={chosen === w.id} onClick={() => setWater(w.id)} className={`${TAB} ${chosen === w.id ? 'border-gold bg-gold text-night' : 'border-edge text-ink'}`}>
            {w.label}
          </button>
        ))}
      </div>
      <div role="tablist" aria-label="Period" className="flex gap-2">
        {PERIODS.map((p) => (
          <button key={p.id} type="button" role="tab" aria-selected={period === p.id} onClick={() => setPeriod(p.id)} className={`${TAB} ${period === p.id ? 'border-gold text-gold-ink' : 'border-edge text-muted'}`}>
            {p.label}
          </button>
        ))}
      </div>
      {!view ? null : (
        <Card>
          <p className="mb-3 text-sm text-muted">
            {view.own ? <>Your best: {formatWeight(view.own.grams)} <FishName id={view.own.speciesId} />{view.own.rank ? `, #${view.own.rank}` : ''}.</> : `You have no fish here ${view.period === 'week' ? 'this week' : 'yet'}.`}
            {view.period === 'week' ? <> Starts again <LocalTime at={view.weekEndsAt} format={resetsAt} />.</> : null}
          </p>
          {view.entries.length === 0 ? <p>No fish landed here {view.period === 'week' ? 'this week' : 'yet'}.</p> : (
            <ol className="flex flex-col">
              {view.entries.map((row) => (
                <li key={row.rank} className={`flex items-center gap-3 border-b border-rule py-2 last:border-b-0 ${row.own ? 'bg-raised' : ''}`}>
                  <span className="w-8 shrink-0 tabular-nums text-muted">{row.rank}</span>
                  <span className="flex min-w-0 flex-1 flex-col leading-tight">
                    <span className={`truncate ${row.own ? 'font-semibold text-gold-ink' : ''}`}>
                      {row.profile ? <Link to="/profile/$alias" params={{ alias: row.name }} className="underline underline-offset-4">{row.name}</Link> : row.name}
                    </span>
                    <span className="flex items-center gap-2 text-sm"><FishIcon id={row.speciesId} scale={2} /><FishName id={row.speciesId} /></span>
                  </span>
                  <span className="shrink-0 tabular-nums">{formatWeight(row.grams)}</span>
                </li>
              ))}
            </ol>
          )}
          {view.full ? <p className="mt-3 text-sm text-muted">Showing the top 100.</p> : null}
        </Card>
      )}
    </>
  )
}
