import { convexQuery } from '@convex-dev/react-query'
import { useQuery } from '@tanstack/react-query'
import { Link, createFileRoute } from '@tanstack/react-router'
import { useState } from 'react'
import { api } from '@trmnl-games/backend/api'
import type { Id } from '@trmnl-games/backend/data-model'
import { useIntent } from '../../../lib/intent'
import { preload } from '../../../lib/preload'
import type { Dock } from '../../../lib/idleAngler'
import { Button, Card, NoticeBar, useNotice } from '../../../lib/ui'
import { LocalTime } from '../../../lib/localTime'
import { ConfirmSheet } from '../desk-crawler/-confirm'
import { FishIcon } from './-art'
import { FishName } from './-fish'
import { Coins, Price } from './-coins'
import { Rows } from './-rows'
import { seo } from '../../../lib/seo'
import { formatDate, useLocale, useT } from '../../../lib/i18n'
import { iaLog } from '../../../i18n/iaLog'
import { iaCommon } from '../../../i18n/ia'
import { useAngler } from '../../../lib/idleAngler'

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


function TrophiesPage() {
  const { data } = useQuery(convexQuery(api.idleAngler.full.trophies, {}))
  const { data: dockData } = useQuery(convexQuery(api.idleAngler.anglers.dock, {}))
  const dock = dockData as Dock | undefined
  const wall = data as Wall | null | undefined
  const { notice, notify, dismiss } = useNotice()
  const takeDown = useIntent(api.idleAngler.full.takeDownTrophy, { onFeedback: notify })
  const pegs = useIntent(api.idleAngler.full.buyMorePegs, { onFeedback: notify })
  const [asking, setAsking] = useState<Trophy | null>(null)
  const t = useT(iaLog)
  const common = useT(iaCommon)
  const words = useAngler()
  const locale = useLocale()
  const formatWeight = words.weight
  const day = (date: Date) => formatDate(locale, date, { day: 'numeric', month: 'short' })
  if (!wall || !dock?.angler) return null
  const full = dock.full
  if (full && !full.features.trophies) {
    return (
      <>
        <h1 className="font-display text-3xl font-bold">{t.trophyWall}</h1>
        <Card><p>{t.wallOpens(full.comingUp?.feature === 'trophies' ? full.comingUp.species : 8)}</p></Card>
      </>
    )
  }
  const next = full?.pegs.next ?? null
  const empty = Math.max(0, wall.pegs - wall.wall.length)
  const rule = full?.trophies ?? null
  // Issue #6: a cooler fish already big enough is the first thing to say on an empty wall.
  const trophyInCooler = Object.values(full?.catchActions ?? {}).some((a) => a.mountCost !== null)
  const cooler = <Link to="/app/idle-angler/cooler" className="underline underline-offset-4">{t.cooler}</Link>
  return (
    <>
      <div className="flex flex-wrap items-baseline justify-between gap-2">
        <h1 className="font-display text-3xl font-bold">{t.trophyWall}</h1>
        <span className="text-sm text-muted">{t.pegsOf(wall.wall.length, wall.pegs)}</span>
      </div>
      <Card title={t.mounted}>
        {wall.wall.length === 0 ? <p>{t.noneMounted} {trophyInCooler ? <>{t.bigEnough} {cooler}.</> : <>{t.nothingBigEnough}{rule ? t.needsPercent(rule.minPercent) : null}.</>}</p> : (
          <ul className="grid gap-3 sm:grid-cols-2">
            {wall.wall.map((trophy) => (
              <li key={trophy.id} className="flex items-start gap-3 border border-rule p-3">
                {trophy.speciesId ? <FishIcon id={trophy.speciesId} size="large" scale={2} /> : null}
                <div className="min-w-0 flex-1">
                  <p className="font-semibold">{trophy.speciesId ? <FishName id={trophy.speciesId} /> : null}</p>
                  <p className="text-sm">{trophy.grams ? formatWeight(trophy.grams) : ''} · {words.water(trophy.water)}</p>
                  <p className="text-sm text-muted">{t.mountedOn} <LocalTime at={trophy.at} format={day} /></p>
                </div>
                <Button variant="secondary" disabled={takeDown.pending} onClick={() => setAsking(trophy)}>{t.takeDown}</Button>
              </li>
            ))}
          </ul>
        )}
        {empty > 0 && wall.wall.length > 0 ? <p className="mt-3 text-sm text-muted">{t.freePegs(empty)}</p> : null}
        {next ? (
          // D156/D167: the Buy button with what it adds and costs, or the price and what is still to go.
          <div className="mt-4">
            {dock.angler.gold >= next.price ? (
              <Button variant="secondary" className="inline-flex items-center justify-center gap-2" disabled={pegs.pending} onClick={() => void pegs.run({}, t.pegsNow(next.pegs))}>
                {t.morePegs(wall.pegs, next.pegs)} <Coins n={next.price} />
              </Button>
            ) : <><p className="mb-1 text-sm">{t.morePegs(wall.pegs, next.pegs)}</p><Price price={next.price} gold={dock.angler.gold} /></>}
          </div>
        ) : null}
      </Card>
      {/* Issue #6: the rules stay on the page, open while the wall is empty and folded away once a fish is up. */}
      {rule ? (
        <Card>
          <details open={wall.wall.length === 0}>
            <summary className="min-h-11 cursor-pointer py-2 font-semibold">{t.howMounting}</summary>
            <Rows rows={[
              [t.whichFish, t.whichFishValue(rule.minPercent)],
              [t.where, <>{t.mountFrom} {cooler}</>],
              [common.cost, <span className="inline-flex flex-wrap items-center gap-x-1">{t.fishValuePlus} <Coins n={rule.fee} /></span>],
              [t.theFish, t.theFishValue],
              [t.pegs, t.pegsValue(wall.pegs, Boolean(next))],
              [t.takeDown, t.takeDownValue],
            ]} />
            <Link to="/help/idle-angler" hash="the-trophy-wall" className="mt-2 inline-flex min-h-11 items-center text-sm underline underline-offset-4">{t.moreInHelp}</Link>
          </details>
        </Card>
      ) : null}
      <Card title={t.shelf}>
        <Rows rows={[[t.rosettes, t.rosettesValue(wall.rosettes)], [t.medals, `${wall.medals.length}`]]} />
        {wall.medals.length > 0 ? (
          <ul className="mt-3 flex flex-col">
            {wall.medals.map((m) => (
              <li key={m.id} className="flex items-center gap-3 border-b border-rule py-2 last:border-b-0">
                <span className={`w-16 shrink-0 font-semibold ${m.place === 1 ? 'text-gold-ink' : 'text-ink'}`}>{t.place[m.place ?? 0]}</span>
                <span className="min-w-0 flex-1 text-sm">{m.speciesId ? <FishName id={m.speciesId} /> : null} · {t.openAt(words.water(m.water))}{m.grams ? `, ${formatWeight(m.grams)}` : ''}</span>
                <span className="shrink-0 text-sm text-muted">{m.period ? m.period.slice(1) : ''}</span>
              </li>
            ))}
          </ul>
        ) : <p className="mt-3 text-sm text-muted">{t.noMedals}</p>}
      </Card>
      <ConfirmSheet
        open={asking !== null}
        title={t.takeDownTitle(asking?.speciesId ? words.species(asking.speciesId) : null)}
        confirmLabel={t.takeDown}
        busyLabel={t.takingDown}
        cancelLabel={t.keepIt}
        pending={takeDown.pending}
        onClose={() => setAsking(null)}
        onConfirm={async () => {
          if (!asking) return
          await takeDown.run({ trophyId: asking.id }, t.takenDown)
          setAsking(null)
        }}
      >
        <p>{t.takeDownBody}</p>
      </ConfirmSheet>
      <NoticeBar notice={notice} onDismiss={dismiss} />
    </>
  )
}
