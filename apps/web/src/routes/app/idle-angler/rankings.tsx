import { convexQuery } from '@convex-dev/react-query'
import { keepPreviousData, useQuery } from '@tanstack/react-query'
import { Link, createFileRoute } from '@tanstack/react-router'
import { useState } from 'react'
import { api } from '@trmnl-games/backend/api'
import { Glyph } from '../../../lib/glyphs'
import { preload } from '../../../lib/preload'
import { formatWeight } from '../../../lib/idleAngler'
import { Card, LoadingState } from '../../../lib/ui'
import { FishIcon } from './-art'
import { Coins } from './-coins'
import { FishName, WaterName } from './-fish'
import { LocalTime } from '../../../lib/localTime'
import { seo } from '../../../lib/seo'

/**
 * Idle Angler rankings (2026-10-10): each water's heaviest fish, this week and of all time. No XP or levels: the fish
 * itself is the score. Opens on the angler's own water.
 */
export const Route = createFileRoute('/app/idle-angler/rankings')({
  head: () => seo({ title: 'Rankings · Idle Angler', index: false }),
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

type Opens = { period: string; startsAt: number; endsAt: number; on: boolean; prizes: number[]; waters: Array<{ id: string; name: string; target: { id: string; name: string }; entries: Row[]; own: { rank: number | null; speciesId: string; grams: number } | null }> }

const weekday = (date: Date) => date.toLocaleString([], { weekday: 'long', hour: '2-digit', minute: '2-digit' })

/** D167's segmented picker (the Dock's bait choice): the pressed cell carries the cursor, the rest are what a tap switches to. */
function Segmented<T extends string>({ label, options, value, onChange, wrap = false }: { label: string; options: ReadonlyArray<{ id: T; label: string }>; value: T; onChange: (id: T) => void; wrap?: boolean }) {
  return (
    <div role="group" aria-label={label} className={`grid gap-0.5 border-2 border-edge bg-edge ${wrap ? 'grid-cols-2 min-[480px]:grid-cols-3' : 'grid-cols-2'}`}>
      {options.map((option) => (
        <button
          key={option.id}
          type="button"
          aria-pressed={value === option.id}
          onClick={() => onChange(option.id)}
          className={`menu-cursor flex min-h-11 items-center justify-center px-2 py-2 label-px uppercase tracking-wide whitespace-nowrap not-aria-pressed:before:hidden ${value === option.id ? 'bg-navy text-gold' : 'bg-panel text-muted hover:bg-rule hover:text-ink active:bg-rule active:text-ink'}`}
        >
          {option.label}
        </button>
      ))}
    </div>
  )
}

/** Desk Crawler's podium: a crown for first, medals for second and third, a blank column below so names stay aligned. */
function Podium({ rank }: { rank: number }) {
  return (
    <span aria-hidden="true" className="flex h-6 w-4 shrink-0 items-center text-gold-ink">
      {rank === 1 ? <Glyph name="crown" /> : rank <= 3 ? <Glyph name="medal" /> : null}
    </span>
  )
}

function RankNumber({ rank }: { rank: number }) {
  return <span className={`-ml-1 w-7 shrink-0 text-right font-bold tabular-nums ${rank <= 3 ? 'hud text-sm leading-6 text-gold-ink' : 'text-muted'}`}>{rank}</span>
}

function RankRow({ row }: { row: Row }) {
  return (
    <li aria-current={row.own ? 'true' : undefined} className={`flex min-w-0 items-start gap-3 py-3 ${row.own ? '-mx-2 bg-ground px-2 outline-2 outline-gold' : ''}`}>
      <Podium rank={row.rank} />
      <RankNumber rank={row.rank} />
      <span className="min-w-0 flex-1">
        {row.profile ? (
          <Link to="/profile/$alias" params={{ alias: row.name }} className="block truncate font-semibold underline decoration-dotted underline-offset-4">{row.name}</Link>
        ) : (
          <span className="block truncate font-semibold">{row.name}</span>
        )}
        <span className="mt-1 flex items-center gap-2 text-sm"><FishIcon id={row.speciesId} scale={2} /><FishName id={row.speciesId} /></span>
      </span>
      <span className="shrink-0 font-semibold tabular-nums leading-6">{formatWeight(row.grams)}</span>
    </li>
  )
}

/** D162: the weekend's Open at every water, one line each: the target fish, where, and who leads. */
function OpensCard({ opens }: { opens: Opens }) {
  return (
    <Card title={opens.on ? 'This weekend’s Opens' : 'Next weekend’s Opens'} icon="medal">
      <p className="mb-1 text-sm text-muted">
        {opens.on ? <>Until <LocalTime at={opens.endsAt} format={weekday} />.</> : <><LocalTime at={opens.startsAt} format={weekday} /> to <LocalTime at={opens.endsAt} format={weekday} />.</>} Land the target fish at its water to enter.
      </p>
      <p className="mb-3 flex flex-wrap items-center gap-x-3 gap-y-1 text-sm">
        <span className="text-muted">Top three</span>
        {opens.prizes.map((prize, i) => <span key={i} className="inline-flex items-center gap-1"><Glyph name={i === 0 ? 'crown' : 'medal'} size={12} className="text-gold-ink" /><Coins n={prize} className="font-semibold text-gold-ink" /></span>)}
      </p>
      <ul className="flex flex-col divide-y divide-rule">
        {opens.waters.map((w) => {
          const leader = w.entries[0]
          return (
            <li key={w.id} className="flex min-w-0 items-center gap-3 py-2">
              <span className="flex w-12 shrink-0 justify-center"><FishIcon id={w.target.id} scale={2} /></span>
              <span className="min-w-0 flex-1 leading-tight">
                <span className="block truncate"><FishName id={w.target.id}>{w.target.name}</FishName></span>
                <span className="block truncate text-sm text-muted">{w.name}</span>
              </span>
              {leader ? (
                <span className="flex min-w-0 max-w-[50%] shrink-0 flex-col items-end text-right leading-tight">
                  <span className="inline-flex items-center gap-1 font-semibold tabular-nums"><Glyph name="crown" size={12} className="text-gold-ink" />{formatWeight(leader.grams)}</span>
                  <span className={`max-w-full truncate text-sm ${leader.own ? 'font-semibold text-gold-ink' : 'text-muted'}`}>{leader.name}</span>
                  {w.own && !leader.own ? <span className="text-sm text-muted tabular-nums">You {formatWeight(w.own.grams)}{w.own.rank ? ` · #${w.own.rank}` : ''}</span> : null}
                </span>
              ) : opens.on ? <span className="shrink-0 text-sm text-muted">No entries</span> : null}
            </li>
          )
        })}
      </ul>
    </Card>
  )
}

function RankingsPage() {
  const { data: first } = useQuery(convexQuery(api.idleAngler.leaderboard.view, {}))
  const [water, setWater] = useState<View['waterId'] | null>(null)
  const [period, setPeriod] = useState<View['period']>('week')
  const chosen = water ?? (first as View | undefined)?.waterId ?? 'millpond'
  // The previous board stays while the next loads, so switching water or period never collapses the card.
  const { data, isPlaceholderData } = useQuery({ ...convexQuery(api.idleAngler.leaderboard.view, { waterId: chosen, period }), placeholderData: keepPreviousData })
  const view = data as View | undefined
  const { data: opensData } = useQuery(convexQuery(api.idleAngler.full.opens, {}))
  const opens = opensData as Opens | null | undefined
  const waterLabel = WATERS.find((w) => w.id === chosen)?.label ?? ''
  const when = period === 'week' ? 'this week' : 'yet'
  return (
    <>
      <h1 className="font-display text-3xl font-bold">Rankings</h1>
      {/* A running Open is the thing to chase, so it leads; next weekend's waits under the boards. */}
      {opens?.on ? <OpensCard opens={opens} /> : null}
      <Segmented label="Period" options={PERIODS} value={period} onChange={setPeriod} />
      <Segmented label="Water" options={WATERS} value={chosen} onChange={setWater} wrap />
      {!view ? <LoadingState label="Loading rankings…" /> : (
        <Card title={`${waterLabel}, ${period === 'week' ? 'this week' : 'all time'}`} className={isPlaceholderData ? 'opacity-60 transition-opacity' : 'transition-opacity'}>
          <p className="mb-3 text-sm text-muted">
            Each angler’s heaviest fish here, kept or released.
            {view.period === 'week' ? <> Starts again <LocalTime at={view.weekEndsAt} format={weekday} />.</> : null}
          </p>
          {view.own ? (
            <p className="mb-3 flex flex-wrap items-center gap-x-2 font-semibold">
              {view.own.rank ? <>You are <span className="text-gold-ink">#{view.own.rank}</span> with</> : 'Your best:'}
              <span className="inline-flex items-center gap-2"><FishIcon id={view.own.speciesId} scale={2} /><span className="tabular-nums">{formatWeight(view.own.grams)}</span> <FishName id={view.own.speciesId} /></span>
            </p>
          ) : view.entries.length > 0 ? <p className="mb-3 text-sm text-muted">You have no fish here {when}.</p> : null}
          {view.entries.length === 0 ? (
            <p className="py-3 text-muted">No fish landed here {when}.</p>
          ) : (
            <ol className="flex flex-col divide-y divide-rule">
              {view.entries.map((row) => <RankRow key={row.rank} row={row} />)}
            </ol>
          )}
          {view.full ? <p className="mt-3 text-sm text-muted">Top 100 shown.</p> : null}
        </Card>
      )}
      {opens && !opens.on ? <OpensCard opens={opens} /> : null}
    </>
  )
}
