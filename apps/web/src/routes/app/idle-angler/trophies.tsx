import { convexQuery } from '@convex-dev/react-query'
import { useQuery } from '@tanstack/react-query'
import { Link, createFileRoute } from '@tanstack/react-router'
import { useState } from 'react'
import { api } from '@trmnl-games/backend/api'
import type { Id } from '@trmnl-games/backend/data-model'
import { useIntent } from '../../../lib/intent'
import { preload } from '../../../lib/preload'
import { formatWeight, type Dock } from '../../../lib/idleAngler'
import { Button, Card, NoticeBar, useNotice } from '../../../lib/ui'
import { LocalTime } from '../../../lib/localTime'
import { ConfirmSheet } from '../desk-crawler/-confirm'
import { FishIcon } from './-art'
import { FishName } from './-fish'
import { Coins, Price } from './-coins'
import { Rows } from './-rows'

/**
 * The trophy wall (D162, idle-angler-full.md "The trophy wall"): mounted fish on their pegs, the shelf of Open medals
 * and the rosettes, one per Open entered. Fish are mounted from the cooler; pegs are bought here.
 */
export const Route = createFileRoute('/app/idle-angler/trophies')({
  loader: ({ context }) => preload(context, convexQuery(api.idleAngler.full.trophies, {}), convexQuery(api.idleAngler.anglers.dock, {})),
  component: TrophiesPage,
})

type Trophy = { id: Id<'iaTrophies'>; speciesId: string | null; name: string | null; grams: number | null; water: string; at: number; peg: number | null; place: number | null; period: string | null }
type Wall = { pegs: number; wall: Trophy[]; medals: Trophy[]; rosettes: number }

const PLACE = ['', 'Gold', 'Silver', 'Bronze']
const day = (date: Date) => date.toLocaleDateString([], { day: 'numeric', month: 'short' })

function TrophiesPage() {
  const { data } = useQuery(convexQuery(api.idleAngler.full.trophies, {}))
  const { data: dockData } = useQuery(convexQuery(api.idleAngler.anglers.dock, {}))
  const dock = dockData as Dock | undefined
  const wall = data as Wall | null | undefined
  const { notice, notify, dismiss } = useNotice()
  const takeDown = useIntent(api.idleAngler.full.takeDownTrophy, { onFeedback: notify })
  const pegs = useIntent(api.idleAngler.full.buyMorePegs, { onFeedback: notify })
  const [asking, setAsking] = useState<Trophy | null>(null)
  if (!wall || !dock?.angler) return null
  const full = dock.full
  if (full && !full.features.trophies) {
    return (
      <>
        <h1 className="font-display text-3xl font-bold">Trophy wall</h1>
        <Card><p>The wall opens once {full.comingUp?.feature === 'trophies' ? full.comingUp.species : 8} species are in your logbook.</p></Card>
      </>
    )
  }
  const next = full?.pegs.next ?? null
  const empty = Math.max(0, wall.pegs - wall.wall.length)
  return (
    <>
      <div className="flex flex-wrap items-baseline justify-between gap-2">
        <h1 className="font-display text-3xl font-bold">Trophy wall</h1>
        <span className="text-sm text-muted">{wall.wall.length} of {wall.pegs} pegs</span>
      </div>
      <Card title="Mounted fish">
        {wall.wall.length === 0 ? <p>No fish mounted yet. A fish of at least 60% of its species' top weight can be mounted from the <Link to="/app/idle-angler/cooler" className="underline underline-offset-4">cooler</Link>.</p> : (
          <ul className="grid gap-3 sm:grid-cols-2">
            {wall.wall.map((t) => (
              <li key={t.id} className="flex items-start gap-3 border border-rule p-3">
                {t.speciesId ? <FishIcon id={t.speciesId} size="large" scale={2} /> : null}
                <div className="min-w-0 flex-1">
                  <p className="font-semibold">{t.speciesId ? <FishName id={t.speciesId}>{t.name}</FishName> : null}</p>
                  <p className="text-sm">{t.grams ? formatWeight(t.grams) : ''} · {t.water}</p>
                  <p className="text-sm text-muted">Mounted <LocalTime at={t.at} format={day} /></p>
                </div>
                <Button variant="secondary" disabled={takeDown.pending} onClick={() => setAsking(t)}>Take down</Button>
              </li>
            ))}
          </ul>
        )}
        {empty > 0 && wall.wall.length > 0 ? <p className="mt-3 text-sm text-muted">{empty} {empty === 1 ? 'peg is' : 'pegs are'} free.</p> : null}
        {next ? (
          // D156/D167: the Buy button with what it adds and costs, or the price and what is still to go.
          <div className="mt-4">
            {dock.angler.gold >= next.price ? (
              <Button variant="secondary" className="inline-flex items-center justify-center gap-2" disabled={pegs.pending} onClick={() => void pegs.run({}, `The wall now has ${next.pegs} pegs.`)}>
                {wall.pegs}→{next.pegs} pegs <Coins n={next.price} />
              </Button>
            ) : <><p className="mb-1 text-sm">{wall.pegs}→{next.pegs} pegs</p><Price price={next.price} gold={dock.angler.gold} /></>}
          </div>
        ) : null}
      </Card>
      <Card title="Shelf">
        <Rows rows={[['Rosettes', `${wall.rosettes}, one for each Open you entered`], ['Medals', `${wall.medals.length}`]]} />
        {wall.medals.length > 0 ? (
          <ul className="mt-3 flex flex-col">
            {wall.medals.map((m) => (
              <li key={m.id} className="flex items-center gap-3 border-b border-rule py-2 last:border-b-0">
                <span className={`w-16 shrink-0 font-semibold ${m.place === 1 ? 'text-gold-ink' : 'text-ink'}`}>{PLACE[m.place ?? 0]}</span>
                <span className="min-w-0 flex-1 text-sm">{m.speciesId ? <FishName id={m.speciesId}>{m.name}</FishName> : null} Open at {m.water}{m.grams ? `, ${formatWeight(m.grams)}` : ''}</span>
                <span className="shrink-0 text-sm text-muted">{m.period ? m.period.slice(1) : ''}</span>
              </li>
            ))}
          </ul>
        ) : <p className="mt-3 text-sm text-muted">The top three at each water's weekend Open take a medal and coins on Monday.</p>}
      </Card>
      <ConfirmSheet
        open={asking !== null}
        title={asking?.name ? `Take the ${asking.name} down?` : 'Take it down?'}
        confirmLabel="Take down"
        busyLabel="Taking down…"
        cancelLabel="Keep it"
        pending={takeDown.pending}
        onClose={() => setAsking(null)}
        onConfirm={async () => {
          if (!asking) return
          await takeDown.run({ trophyId: asking.id }, 'Taken down. The peg is free.')
          setAsking(null)
        }}
      >
        <p>The peg becomes free for another fish. Mounting is not refunded, and the fish does not go back to the cooler.</p>
      </ConfirmSheet>
      <NoticeBar notice={notice} onDismiss={dismiss} />
    </>
  )
}
