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
import { seo } from '../../../lib/seo'

/**
 * The trophy wall (D162, idle-angler-full.md "The trophy wall"): mounted fish on their pegs, the shelf of Open medals
 * and the rosettes, one per Open entered. Fish are mounted from the cooler; pegs are bought here.
 */
export const Route = createFileRoute('/app/idle-angler/trophies')({
  head: () => seo({ title: 'Trophy wall · Idle Angler', index: false }),
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
  const rule = full?.trophies ?? null
  // Issue #6: a cooler fish already big enough is the first thing to say on an empty wall.
  const trophyInCooler = Object.values(full?.catchActions ?? {}).some((a) => a.mountCost !== null)
  const cooler = <Link to="/app/idle-angler/cooler" className="underline underline-offset-4">Cooler</Link>
  return (
    <>
      <div className="flex flex-wrap items-baseline justify-between gap-2">
        <h1 className="font-display text-3xl font-bold">Trophy wall</h1>
        <span className="text-sm text-muted">{wall.wall.length} of {wall.pegs} pegs</span>
      </div>
      <Card title="Mounted fish">
        {wall.wall.length === 0 ? <p>No fish mounted yet. {trophyInCooler ? <>A fish in your cooler is big enough: mount it from the {cooler}.</> : <>Nothing in your cooler is big enough yet{rule ? <>: a fish needs {rule.minPercent}% of its species' top weight. The Logbook shows each one's trophy weight</> : null}.</>}</p> : (
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
      {/* Issue #6: the rules stay on the page, open while the wall is empty and folded away once a fish is up. */}
      {rule ? (
        <Card>
          <details open={wall.wall.length === 0}>
            <summary className="min-h-11 cursor-pointer py-2 font-semibold">How mounting works</summary>
            <Rows rows={[
              ['Which fish', `At least ${rule.minPercent}% of its species' top weight`],
              ['Where', <>Mount it from the {cooler}</>],
              ['Cost', <span className="inline-flex flex-wrap items-center gap-x-1">The fish's value + <Coins n={rule.fee} /></span>],
              ['The fish', "Isn't sold and earns no coins"],
              ['Pegs', next ? `${wall.pegs} now, more on this page` : `${wall.pegs}, the most the wall takes`],
              ['Take down', 'Frees the peg, with no refund'],
            ]} />
            <Link to="/help/idle-angler" hash="the-trophy-wall" className="mt-2 inline-flex min-h-11 items-center text-sm underline underline-offset-4">More in the help</Link>
          </details>
        </Card>
      ) : null}
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
        <p>Frees the peg. The fish is gone and the mounting cost isn't refunded.</p>
      </ConfirmSheet>
      <NoticeBar notice={notice} onDismiss={dismiss} />
    </>
  )
}
