import { convexQuery } from '@convex-dev/react-query'
import { useQuery } from '@tanstack/react-query'
import { Link, createFileRoute } from '@tanstack/react-router'
import { api } from '@trmnl-games/backend/api'
import { poseFor, type SceneKey } from '@trmnl-games/idle-angler/art/scene'
import { sceneKeyFromUrl } from '@trmnl-games/idle-angler/art/sceneColour'
import { useIntent } from '../../../lib/intent'
import { preload } from '../../../lib/preload'
import { readyOrders, useAngler, type Dock } from '../../../lib/idleAngler'
import { Button, Card, Meter, NoticeBar, useNotice } from '../../../lib/ui'
import { FishIcon, Scene } from './-art'
import { FishName, FishText, FromWater, WaterName } from './-fish'
import { Coins } from './-coins'
import { GoalCard } from './-goalCard'
import { Rows } from './-rows'
import { LocalTime } from '../../../lib/localTime'
import { formatDate, formatTime, useLocale, useT } from '../../../lib/i18n'
import { iaDock } from '../../../i18n/iaDock'
import { seo } from '../../../lib/seo'

/** The dock: the angler's scene, progress, the bait in use, the waters and the latest stories. The fly box lives in the logbook. */
export const Route = createFileRoute('/app/idle-angler/')({
  head: () => seo({ title: 'Dock · Idle Angler', index: false }),
  loader: ({ context }) => preload(context, convexQuery(api.idleAngler.anglers.dock, {}), convexQuery(api.idleAngler.payload.preview, {})),
  component: DockPage,
})


function DockPage() {
  const { data } = useQuery(convexQuery(api.idleAngler.anglers.dock, {}))
  const { data: preview } = useQuery(convexQuery(api.idleAngler.payload.preview, {}))
  const { notice, notify, dismiss } = useNotice()
  const travel = useIntent(api.idleAngler.anglers.travelTo, { onFeedback: notify })
  const chooseBait = useIntent(api.idleAngler.anglers.chooseBait, { onFeedback: notify })
  const t = useT(iaDock)
  const words = useAngler()
  const locale = useLocale()
  const time = (at: number) => <LocalTime at={at} format={(date) => formatTime(locale, date)} />
  const dock = data as Dock | undefined
  const angler = dock?.angler
  if (!dock || !angler) return null
  const here = dock.waters?.find((w) => w.id === angler.waterId)
  const destination = angler.travelTo ? dock.waters?.find((w) => w.id === angler.travelTo) : null
  // The scene the device shows, painted here in colour; without a device image yet, the dock's own water, weather and status draw the same scene.
  const scene: SceneKey | null = (typeof preview?.scene_base === 'string' && preview.scene_base ? sceneKeyFromUrl(`${preview.scene_base}/152/3.png`) : null) ?? sceneFromDock(dock)
  // While travelling, bait choices are for the water the angler is heading to: the next cast is there.
  const baitWater = destination ?? here
  // Bait this water uses that the angler holds, plus the one in use even when it ran out.
  const usable = angler.bait.filter((b) => (baitWater?.baits ?? []).includes(b.class) && (b.units > 0 || b.class === angler.baitOnHook))
  const held = (water: { baits: readonly string[] }) => angler.bait.filter((b) => water.baits.includes(b.class) && b.units > 0)
  // The bait the move switches to (idleAngler baitForTravel): the chosen one if it works there, else the fullest held one.
  const travelBait = (water: { baits: readonly string[] }) => {
    const current = held(water).find((b) => b.class === angler.baitOnHook)
    return current ?? [...held(water)].sort((a, b) => b.units - a.units || water.baits.indexOf(a.class) - water.baits.indexOf(b.class))[0]
  }
  const coolerFull = angler.cooler.used >= angler.cooler.capacity
  const catches = dock.catches ?? []
  const coolerValue = catches.reduce((sum, fish) => sum + fish.value, 0)
  // The bait that actually fishes here (as the simulator's activeBait): chosen, used at this water and not used up.
  const fishing = angler.bait.find((b) => b.class === angler.baitOnHook && (baitWater?.baits ?? []).includes(b.class) && b.units > 0)
  // Travelling spends the next cast on the move, so the first cast at the new water is the one after.
  const firstCastThere = dock.nextTickAt ? time(dock.nextTickAt + 15 * 60_000) : null
  const recap = dock.recap
  const nextRod = dock.shop?.rod ?? null
  // The recap spans twelve hours, so some fish may have broken free on a rod since replaced, and the rod held now lands
  // those. Only the ones still too heavy for it count towards the next rod's nudge.
  const tooHeavy = (recap?.awayGrams ?? []).filter((g) => g > angler.rod.limitGrams)
  // Fish that broke free and the next rod would have held: the clearest reason to upgrade.
  const rodWouldLand = nextRod ? tooHeavy.filter((g) => g <= nextRod.limitGrams).length : 0
  const full = dock.full ?? null
  // D167: what the fishmonger pays now, counting each fish once when two orders could take the same one.
  const taken = new Set<string>()
  const fishmongerPays = readyOrders(dock).reduce((sum, r) => {
    if (r.going.some((c) => taken.has(c.id))) return sum
    r.going.forEach((c) => taken.add(c.id))
    return sum + r.reward
  }, 0)
  // D157 for Idle Angler (D162): open waters, then only the next locked one; the rest stay out of sight until it opens.
  const firstLocked = dock.waters?.find((w) => !w.open && !w.closed && !w.charter)
  const shownWaters = full ? (dock.waters ?? []).filter((w) => w.open || w.closed || (w.charter && full.charter && w.opensAfter && w.opensAfter.logged >= w.opensAfter.species) || w === firstLocked) : (dock.waters ?? [])

  return (
    <>
      <section aria-labelledby="dock-title" className="flex flex-col gap-4">
        <div className="flex flex-wrap items-baseline justify-between gap-2">
          <h1 id="dock-title" className="font-display text-3xl font-bold">{angler.alias}</h1>
          <span className="inline-flex flex-wrap items-center gap-x-2 text-sm text-muted"><strong className="text-ink">{words.title(angler.title)}</strong> · <Coins n={angler.gold} className="text-gold-ink" /></span>
        </div>
        {scene ? <Scene sceneKey={scene} alt={t.sceneAlt(angler.alias, here ? words.water(here.id) : '')} /> : null}
        {/* Status, conditions and timing on their own lines: run together, a phone wrapped them mid-phrase. */}
        <div className="flex flex-col gap-1">
          <p className="text-lg font-semibold">
            {angler.status === 'paused' ? <>{t.paused} <Link to="/app/idle-angler/settings" className="font-normal underline underline-offset-4">{t.resumeOnMore}</Link>.</> : destination ? <>{t.headingTo} <WaterName id={destination.id} />.{firstCastThere ? <> {t.firstCastThere} {firstCastThere}.</> : null}</> : <>{t.castingAt} {here ? <WaterName id={here.id} /> : null}.</>}
          </p>
          {here ? <p className="text-muted">{full?.season ? <>{words.season(full.season.id)} · </> : null}{words.band(here.band)}, {words.weather(here.weather).toLowerCase()} · {t.biteChance(here.bitePercent)}</p> : null}
          {dock.nextTickAt && !destination && angler.status !== 'paused' ? <p className="text-sm text-muted">{t.nextCast} {time(dock.nextTickAt)}.</p> : null}
        </div>
        {/* The logbook meter counts species towards the next title; the sentence under it says what the title is, in words a first visit can follow. */}
        <div className="grid gap-4 sm:grid-cols-2">
          <div className="flex flex-col gap-1">
            <Meter label={t.logbook} value={angler.speciesLogged} max={angler.nextTitle?.species ?? angler.speciesTotal} tone="xp" />
            <p className="text-sm text-muted">{angler.nextTitle ? <>{t.nextTitle(angler.speciesLogged, angler.nextTitle.species)[0]}<strong className="text-ink">{words.title(angler.nextTitle.name)}</strong>{t.nextTitle(angler.speciesLogged, angler.nextTitle.species)[1]}</> : <>{t.allTitles(angler.speciesLogged, angler.speciesTotal)}</>}</p>
          </div>
          <Meter label={words.cooler(angler.cooler.name)} value={angler.cooler.used} max={angler.cooler.capacity} tone="gold" />
        </div>
        {!coolerFull && catches.length > 0 ? (
          <p className="text-sm"><Link to="/app/idle-angler/cooler" className="inline-flex items-center gap-2 underline underline-offset-4">{t.sell(catches.length)} <Coins n={coolerValue} sign /></Link></p>
        ) : null}
        {fishmongerPays > 0 ? <p className="text-sm"><Link to="/app/idle-angler/cooler" className="inline-flex items-center gap-2 font-semibold text-gold-ink underline underline-offset-4">{t.fishmongerBuying} <Coins n={fishmongerPays} sign /></Link></p> : null}
        {full ? <GoalCard full={full} fishmonger={fishmongerPays > 0} notify={notify} /> : null}
        {/* Issue #6: the wall's way in from the Dock once it opens, with what is on it. */}
        {full?.features.trophies ? <p className="text-sm"><Link to="/app/idle-angler/trophies" className="underline underline-offset-4">{t.trophyWall}</Link> <span className="text-muted">· {t.pegs(full.pegs.pegs - full.pegs.free, full.pegs.pegs)}</span></p> : null}
        {full?.runs.length ? <ul className="flex flex-col gap-1 text-sm">{full.runs.map((run) => <li key={run.id} className="font-semibold text-sky-ink">{words.text(run.line)}</li>)}</ul> : null}
        {coolerFull ? (
          <p className="font-semibold text-hp-ink">
            {t.coolerFull} <Link to="/app/idle-angler/cooler" className="underline underline-offset-4">{t.sellCatch}</Link>.
          </p>
        ) : null}
      </section>

      {recap && recap.landed + recap.gotAway > 0 ? (
        <Card title={t.recapTitle}>
          <Rows rows={[
            [t.landed, t.landedValue(recap.landed, recap.released)],
            recap.best ? [t.heaviest, <span className="inline-flex flex-wrap items-center gap-2"><FishIcon id={recap.best.speciesId} scale={2} /><span>{words.weight(recap.best.grams)} <FishName id={recap.best.speciesId} /></span></span>] : null,
            recap.records ? [t.personalBests, `${recap.records}`] : null,
            recap.firsts ? [t.newSpecies, `${recap.firsts}`] : null,
            recap.gotAway ? [t.gotAway, t.gotAwayValue(recap.gotAway, tooHeavy.length, words.rod(angler.rod.name))] : null,
          ]} />
          {nextRod && rodWouldLand > 0 ? (
            <p className="mt-3 text-sm">{t.rodWould(words.rod(nextRod.name), rodWouldLand, tooHeavy.length)} <Link to="/app/idle-angler/shop" className="inline-flex items-center gap-1 underline underline-offset-4">{t.inShopFor} <Coins n={nextRod.price} /></Link></p>
          ) : null}
        </Card>
      ) : null}

      <Card title={t.bait}>
        {usable.length === 0 ? <p className="mb-3 font-semibold text-hp-ink">{t.noBaitFor(baitWater ? words.water(baitWater.id) : '', Boolean(destination))} <Link to="/app/idle-angler/shop" className="underline underline-offset-4">{t.buyBait}</Link>.</p> : null}
        {usable.length > 0 && !fishing ? <p className="mb-3 font-semibold text-hp-ink">{t.bareHookNow}{usable.every((b) => b.units === 0) ? <>, <Link to="/app/idle-angler/shop" className="underline underline-offset-4">{t.orBuySome}</Link></> : null}.</p> : null}
        {/* D167: Desk Crawler's stance picker (one look for a choice): the bait on the hook is the pressed cell with the cursor, the others are what a tap switches to. */}
        {usable.length > 0 ? <p className="mb-2 text-sm text-muted">{t.onHook}</p> : null}
        <div role="group" aria-label={t.baitGroup} className="flex flex-wrap gap-0.5 border-2 border-edge bg-edge">
          {usable.map((bait) => {
            const chosen = angler.baitOnHook === bait.class
            return (
              <button
                key={bait.class}
                type="button"
                aria-pressed={chosen}
                aria-disabled={chooseBait.pending || undefined}
                onClick={() => { if (!chosen && !chooseBait.pending) void chooseBait.run({ bait: bait.class as never }, t.fishingWith(words.bait(bait.class).toLowerCase())) }}
                className={`menu-cursor flex min-h-11 grow basis-[40%] items-center min-[480px]:basis-[30%] justify-center gap-2 px-2 py-2 label-px uppercase tracking-wide not-aria-pressed:before:hidden ${chosen ? 'bg-navy text-gold' : 'bg-panel text-muted hover:bg-rule hover:text-ink active:bg-rule active:text-ink'}`}
              >
                {words.bait(bait.class)} <span className="tabular-nums">×{bait.units}</span>
              </button>
            )
          })}
        </div>
        <dl className="mt-3 grid grid-cols-[auto_1fr] gap-x-3 gap-y-1 text-sm">
          <dt className="text-muted">{t.uses}</dt><dd>{t.usesValue}</dd>
          <dt className="text-muted">{t.noBait}</dt><dd>{t.noBaitValue}</dd>
        </dl>
        <p className="mt-3 text-sm"><Link to="/app/idle-angler/shop" className="underline underline-offset-4">{t.whatBaitCatches}</Link></p>
      </Card>

      <Card title={t.waters}>
        <ul className="flex flex-col gap-3">
          {shownWaters.map((water) => (
            <li key={water.id} className="flex flex-wrap items-center justify-between gap-3 border-b border-rule pb-3 last:border-b-0">
              <div className="min-w-0">
                <p className="font-semibold"><WaterName id={water.id} />{water.id === angler.waterId ? <span className="text-muted"> · {t.here}</span> : water.id === angler.travelTo ? <span className="text-muted"> · {t.headingThere}</span> : ''}</p>
                {water.rank ? <p className="text-sm"><strong>{words.waterRank(water.rank.id, water.id)}</strong> · <span className="text-muted">{water.rank.next ? t.rankNext(water.rank.next.species - water.rank.logged, words.lang.waterRanks[water.rank.next.id] ?? water.rank.next.id) : t.rankTop}</span></p> : null}
                {water.open ? (
                  <>
                    <p className="text-sm text-muted">{t.until(words.band(water.band), words.weather(water.weather).toLowerCase())} {time(water.weatherUntil)}</p>
                    <p className="text-sm text-muted">{t.baitList(water.baits.filter((b) => b !== 'deadbait' || !full || full.features.deadbait).map((b) => words.bait(b)).join(', '))}</p>
                    {held(water).length === 0 ? <p className="text-sm text-hp-ink">{t.noneOfItsBait}</p> : null}
                  </>
                ) : water.closed ? <p className="text-sm text-muted">{t.winterOnly}</p> : water.charter ? <p className="text-sm text-muted">{t.charterLine} <Link to="/app/idle-angler/shop" className="underline underline-offset-4">{t.bookInShop}</Link>.</p> : <p className="text-sm text-muted">{water.opensAfter ? <>{t.opensOnce(water.opensAfter.species, Math.min(water.opensAfter.logged, water.opensAfter.species))[0]}<FromWater id={water.opensAfter.waterId} />{t.opensOnce(water.opensAfter.species, Math.min(water.opensAfter.logged, water.opensAfter.species))[1]}</> : t.opensLater}{water.access ? t.withPass(words.pass(water.access)) : ''}.</p>}
              </div>
              {water.open && water.id !== angler.waterId && water.id !== angler.travelTo ? (
                <Button variant="secondary" disabled={travel.pending} onClick={() => {
                  const next = travelBait(water)
                  void travel.run({ waterId: water.id as never }, t.headingNotice(words.water(water.id), next ? words.bait(next.class).toLowerCase() : null))
                }}>{t.fishHere}</Button>
              ) : null}
            </li>
          ))}
        </ul>
        <p className="mt-3 text-sm text-muted">{t.weatherNote}{full?.season ? <> {t.seasonNote(words.season(full.season.id).toLowerCase())} <LocalTime at={full.season.endsAt} format={(d) => formatDate(locale, d, { weekday: 'long' })} />.</> : null} {t.moveNote}</p>
      </Card>

      <Card title={t.latest}>
        <ol className="flex flex-col gap-2">
          {dock.logs?.slice(0, 10).map((log) => (
            <li key={log.id} className="flex gap-3 text-sm">
              <span className="w-12 shrink-0 tabular-nums text-muted">{time(log.at)}</span>
              <span className="min-w-0"><FishText text={log.summary} />{log.summary.startsWith('Unlocked: the trophy wall') ? <> <Link to="/app/idle-angler/trophies" className="underline underline-offset-4">{t.seeWall}</Link></> : null}</span>
            </li>
          ))}
        </ol>
      </Card>
      <NoticeBar notice={notice} onDismiss={dismiss} />
    </>
  )
}

/** The scene from the dock alone: the water the angler fishes or heads to, its band and weather, and the pose the latest story calls for. */

function sceneFromDock(dock: Dock): SceneKey | null {
  const angler = dock.angler
  const water = dock.waters?.find((w) => w.id === (angler?.travelTo ?? angler?.waterId))
  if (!angler || !water) return null
  const pose = poseFor(angler.status === 'paused' ? 'paused' : angler.travelTo ? 'travelling' : 'fishing', dock.logs?.[0]?.kind ?? null)
  // The dock does not say which fish was held, so a catch shows the angler waiting rather than holding nothing.
  return { water: water.id as SceneKey['water'], band: water.band as SceneKey['band'], weather: water.weather as SceneKey['weather'], season: (dock.full?.season?.id ?? null) as SceneKey['season'], pose: pose === 'holding' ? 'waiting' : pose, fish: null, fly: null }
}
