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
import { BadgeIcon, FishIcon } from './-art'
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
 * and the rosettes, one per Open entered. Fish are mounted from the cooler; pegs are bought here. D250: the shelf lists
 * each Open entered and shows from the Opens on, before the wall itself opens.
 */
export const Route = createFileRoute('/app/idle-angler/trophies')({
  head: () => seo({ title: 'Trophy wall · Idle Angler', index: false }),
  loader: ({ context }) => preload(context, convexQuery(api.idleAngler.full.trophies, {}), convexQuery(api.idleAngler.anglers.dock, {})),
  component: TrophiesPage,
})

type Trophy = { id: Id<'iaTrophies'>; speciesId: string | null; name: string | null; grams: number | null; water: string; at: number; peg: number | null; place: number | null; period: string | null }
/** Gold, silver and bronze medals wear the gold, silver and copper badge frames. */
const MEDAL_FRAME: Record<number, 1 | 2 | 3> = { 1: 3, 2: 2, 3: 1 }

type Rosette = { period: string; waterId: string; speciesId: string; grams: number; rank: number | null; closed: boolean; place: number | null; passed: boolean }
type Wall = { pegs: number; wall: Trophy[]; medals: Trophy[]; rosettes: number; shelf: Rosette[] }


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
  if (full && !full.features.trophies && !full.features.opens) {
    return (
      <>
        <h1 className="font-display text-3xl font-bold">{t.trophyWall}</h1>
        <Card><p>{t.wallOpens(full.comingUp?.feature === 'trophies' ? full.comingUp.species : 8)}</p></Card>
      </>
    )
  }
  const day2 = (period: string) => day(new Date(`${period.slice(1)}T12:00:00Z`))
  const shelf = (
    <div id="shelf" className="scroll-mt-4">
      <Card title={t.shelf}>
        <Rows rows={[[t.rosettes, t.rosettesValue(wall.rosettes)], [t.medals, `${wall.medals.length}`]]} />
        {wall.shelf.length > 0 ? (
          <ul className="mt-3 flex flex-col">
            {wall.shelf.map((r) => (
              <li key={`${r.period}-${r.waterId}`} className="flex items-center gap-3 border-b border-rule py-2 last:border-b-0">
                {/* A medal in its own metal (gold, silver, copper frames); any other entry is the Opens' rosette. */}
                <BadgeIcon family={r.place !== null ? 'medals' : 'opens'} tier={1} frame={r.place !== null ? MEDAL_FRAME[r.place] : 1} scale={1} />
                <span className="min-w-0 flex-1 leading-tight">
                  <span className={`block font-semibold ${r.place === 1 ? 'text-gold-ink' : 'text-ink'}`}>
                    {r.place !== null ? t.place[r.place] : !r.closed ? <>{t.underWay}{r.rank !== null ? ` · ${t.soFar(r.rank)}` : ''}</> : r.rank !== null ? `#${r.rank}` : t.rosettes}
                    {r.place !== null && r.rank !== null && r.rank !== r.place ? <span className="font-normal text-muted"> · #{r.rank}</span> : null}
                  </span>
                  <span className="block text-sm"><FishName id={r.speciesId} /> · {t.openAt(words.water(r.waterId))}, <span className="whitespace-nowrap">{formatWeight(r.grams)}</span></span>
                  {r.passed ? <span className="block text-sm text-muted">{t.passedOn}</span> : null}
                </span>
                {/* An Open's period is its Saturday ('o2026-10-17'), shown as a date like the wall's. */}
                <span className="shrink-0 text-sm text-muted">{day2(r.period)}</span>
              </li>
            ))}
          </ul>
        ) : <p className="mt-3 text-sm text-muted">{t.noRosettes}</p>}
        {wall.shelf.length > 0 && wall.rosettes > wall.shelf.length ? <p className="mt-2 text-sm text-muted">{t.newest(wall.shelf.length, wall.rosettes)}</p> : null}
        {wall.medals.length === 0 && wall.shelf.length > 0 ? <p className="mt-3 text-sm text-muted">{t.noMedals}</p> : null}
      </Card>
    </div>
  )
  if (full && !full.features.trophies) {
    return (
      <>
        <h1 className="font-display text-3xl font-bold">{t.trophyWall}</h1>
        {shelf}
        <Card><p>{t.wallLater(full.comingUp?.feature === 'trophies' ? full.comingUp.species : 8)}</p></Card>
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
                  {/* A quiet button under the details: taking a fish down is rare, and a boxed one beside them squeezed them into a narrow column on phones. */}
                  <Button variant="quiet" className="-ml-3 text-sm min-[375px]:-ml-4" disabled={takeDown.pending} onClick={() => { takeDown.clearFeedback(); setAsking(trophy) }}>{t.takeDown}</Button>
                </div>
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
              [t.eachKind, t.eachKindValue],
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
      {shelf}
      <ConfirmSheet
        open={asking !== null}
        title={t.takeDownTitle(asking?.speciesId ? words.species(asking.speciesId) : null)}
        confirmLabel={t.takeDown}
        busyLabel={t.takingDown}
        cancelLabel={t.keepIt}
        pending={takeDown.pending}
        error={takeDown.error}
        onClose={() => setAsking(null)}
        onConfirm={async () => {
          if (!asking) return
          if (await takeDown.run({ trophyId: asking.id }, t.takenDown)) setAsking(null)
        }}
      >
        <p>{t.takeDownBody}</p>
      </ConfirmSheet>
      <NoticeBar notice={asking ? null : notice} onDismiss={dismiss} />
    </>
  )
}
