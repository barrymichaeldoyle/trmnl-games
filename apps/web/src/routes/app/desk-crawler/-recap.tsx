import { convexQuery } from '@convex-dev/react-query'
import { useQuery } from '@tanstack/react-query'
import { Link } from '@tanstack/react-router'
import { useMutation } from 'convex/react'
import { useEffect, useRef, useState } from 'react'
import { Glyph } from '../../../lib/glyphs'
import { api } from '@trmnl-games/backend/api'
import { afterVisibleVisit } from '../../../lib/visibleVisit'
import { LocalTime } from '../../../lib/localTime'

type Summary = {
  baseline: { at: number } | null
  observed: { logSequence: number }
  xpGained: number | null
  levelsGained: number | null
  newEvents: number | null
  counters: { combatWins: number; goldEarned: number; itemsFound: number; deaths: number } | null
  unequipped: number
  held: boolean
  status: string
}

const sinceAt = (date: Date) => date.toLocaleString(undefined, { weekday: 'short', day: 'numeric', month: 'short', hour: '2-digit', minute: '2-digit' })

/**
 * D25 return recap: frozen for this visit, acknowledged once after it has been
 * visible for a moment (never during SSR, prefetch or a hidden tab).
 */
export function ReturnRecap() {
  const { data, refetch } = useQuery(convexQuery(api.heroes.returnSummary, {}))
  const record = useMutation(api.heroes.recordCompanionVisit)
  // Seeded from the preloaded query so the tally is in the server render instead of appearing after hydration.
  const [shown, setShown] = useState<Summary | null>(() => (data as Summary | undefined) ?? null)
  const acknowledged = useRef(false)
  const retries = useRef(0)

  useEffect(() => {
    if (data && shown === null) setShown(data as Summary)
  }, [data, shown])

  useEffect(() => {
    if (!shown || acknowledged.current) return
    let cancelled = false
    const acknowledge = async (sequence: number) => {
      if (document.visibilityState !== 'visible') return
      acknowledged.current = true
      try {
        const result = await record({ operationId: crypto.randomUUID(), expectedLogSequence: sequence })
        if (result.recapChanged && retries.current < 1) {
          retries.current += 1
          // Newer events exist: show them before acknowledging (bounded retry).
          try {
            const fresh = (await refetch()).data as Summary | undefined
            if (fresh && !cancelled) {
              setShown(fresh)
              acknowledged.current = false
            }
          } catch {
            // Keep this visit's recap. The next visit can acknowledge fresh data.
          }
        }
      } catch {
        // A failed acknowledgement leaves the baseline alone; the next visit tries again.
      }
    }
    const stop = afterVisibleVisit(() => { if (!acknowledged.current) void acknowledge(shown.observed.logSequence) })
    return () => { cancelled = true; stop() }
  }, [shown, record, refetch])

  if (!shown) return null
  return <Ledger summary={shown} />
}

function Ledger({ summary }: { summary: Summary }) {
  const bag = summary.held ? (
    <p className="mt-3 font-semibold">
      A new find is waiting.{' '}
      <Link to="/app/desk-crawler/inventory" className="underline underline-offset-4">
        Manage your bag
      </Link>
    </p>
  ) : summary.unequipped > 0 ? (
    <p className="mt-3 text-sm text-muted">
      {summary.unequipped} unequipped {summary.unequipped === 1 ? 'item' : 'items'} in your bag.{' '}
      <Link to="/app/desk-crawler/inventory" className="underline underline-offset-4">
        Review gear
      </Link>
    </p>
  ) : null

  if (summary.baseline === null) {
    return (
      <section aria-labelledby="ledger-title" className="min-w-0 border-4 border-gold bg-night px-3 pt-4 pb-4 min-[375px]:px-4 sm:px-5">
        <h2 id="ledger-title" className="hud text-sm text-gold-ink">
          Your first visit
        </h2>
        <p className="mt-2 max-w-prose">Your hero adventures every 15 minutes, even with this page closed. From your next visit, this box sums up what happened while you were away.</p>
        {bag}
      </section>
    )
  }

  const rows: Array<[string, number]> = [
    ['XP', summary.xpGained ?? 0],
    ['Levels', summary.levelsGained ?? 0],
    ...(summary.counters
      ? ([
          ['Fights won', summary.counters.combatWins],
          ['Gold earned', summary.counters.goldEarned],
          ['Items found', summary.counters.itemsFound],
          ...(summary.counters.deaths > 0 ? ([['Knockouts', summary.counters.deaths]] as Array<[string, number]>) : []),
        ] as Array<[string, number]>)
      : []),
  ]
  const quiet = rows.every(([, value]) => value === 0)
  const tone: Record<string, string> = { XP: 'text-xp-ink', Levels: 'text-gold-ink', 'Gold earned': 'text-gold-ink', 'Items found': 'text-rare-ink', Knockouts: 'text-hp-ink' }
  return (
    <section aria-labelledby="ledger-title" className="min-w-0 border-4 border-gold bg-night px-3 pt-4 pb-4 min-[375px]:px-4 sm:px-5">
      <div className="flex flex-wrap items-baseline justify-between gap-x-4">
        <h2 id="ledger-title" className="hud text-sm text-gold-ink">
          While you were away
        </h2>
        <p className="text-sm text-muted">
          <LocalTime at={summary.baseline.at} format={sinceAt} />
          {summary.newEvents && !quiet ? `, ${summary.newEvents} log ${summary.newEvents === 1 ? 'entry' : 'entries'}` : ''}
        </p>
      </div>
      {quiet ? (
        <p className="mt-2">{summary.status === 'paused' ? 'Paused, so nothing new since your last visit.' : summary.status === 'sleeping' ? 'Stopped with a full bag. Make room, then resume.' : 'Nothing new since your last visit.'}</p>
      ) : (
        <dl className="mt-3 grid grid-cols-1 min-[480px]:grid-cols-2 min-[480px]:gap-x-6">
          {rows.map(([label, value]) => (
            <div key={label} className="flex items-baseline justify-between gap-3 border-t-2 border-dashed border-rule py-2.5">
              <dt className="label-px whitespace-nowrap text-muted">{label}</dt>
              <dd className={`hud whitespace-nowrap text-sm tabular-nums ${value === 0 ? 'text-faint' : (tone[label] ?? '')}`}>{value > 0 ? `+${value.toLocaleString()}` : '0'}</dd>
            </div>
          ))}
        </dl>
      )}
      {bag}
    </section>
  )
}

/**
 * The Hero page's one-line pointer at the tally (D124): the recap itself, and its acknowledgement, live on the Log tab,
 * so this reads the live summary without touching the baseline. Nothing shows on a first visit or a quiet return.
 */
export function ReturnNudge() {
  const { data } = useQuery(convexQuery(api.heroes.returnSummary, {}))
  const summary = data as Summary | undefined
  if (!summary || summary.baseline === null) return null
  const parts = [
    [summary.xpGained ?? 0, 'XP', 'XP'],
    [summary.levelsGained ?? 0, 'level', 'levels'],
    [summary.counters?.combatWins ?? 0, 'fight won', 'fights won'],
    [summary.counters?.goldEarned ?? 0, 'gold', 'gold'],
    [summary.counters?.itemsFound ?? 0, 'item found', 'items found'],
    [summary.counters?.deaths ?? 0, 'knockout', 'knockouts'],
  ].filter(([value]) => (value as number) > 0).map(([value, one, many]) => `+${(value as number).toLocaleString()} ${value === 1 ? one : many}`)
  if (parts.length === 0) return null
  return (
    <Link to="/app/desk-crawler/log" className="flex min-h-11 items-center justify-between gap-3 border-[3px] border-gold px-3 py-2 text-sm">
      <span className="min-w-0"><strong className="text-gold-ink">While you were away:</strong> {parts.join(', ')}</span>
      <span className="label-px flex shrink-0 items-center gap-1.5 whitespace-nowrap text-gold-ink">See the log <Glyph name="play" size={8} /></span>
    </Link>
  )
}

/**
 * The recap above stays frozen for the visit (D25); this line counts what
 * arrives while the page is open, from the live hero subscription.
 */
export function LiveGain() {
  const { data: hero } = useQuery(convexQuery(api.heroes.mine, {}))
  const start = useRef(hero)
  start.current ??= hero
  if (!hero || !start.current) return null
  const gained = (
    [
      ['XP', hero.lifetimeXp - start.current.lifetimeXp],
      ['level', hero.level - start.current.level],
      ['fight won', hero.counters.combatWins - start.current.counters.combatWins],
      ['gold', hero.counters.goldEarned - start.current.counters.goldEarned],
      ['item found', hero.counters.itemsFound - start.current.counters.itemsFound],
      ['knockout', hero.counters.deaths - start.current.counters.deaths],
    ] as const
  ).filter(([, value]) => value > 0)
  if (gained.length === 0) return null
  const label = (unit: string, value: number) => (unit === 'XP' || unit === 'gold' || value === 1 ? unit : unit.replace(/^(\w+)/, '$1s'))
  return (
    // Steps in again each time it changes, so a fresh gain while the page is open is noticed.
    <p key={gained.map(([unit, value]) => unit + value).join()} role="status" className="hud notice-rise border-[3px] border-gold px-3 py-2 text-hud-sm text-gold-ink">
      While you've been here: {gained.map(([unit, value]) => `+${value.toLocaleString()} ${label(unit, value)}`).join(', ')}
    </p>
  )
}
