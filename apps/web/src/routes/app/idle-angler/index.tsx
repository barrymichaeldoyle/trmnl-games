import { convexQuery } from '@convex-dev/react-query'
import { useQuery } from '@tanstack/react-query'
import { Link, createFileRoute } from '@tanstack/react-router'
import type { ReactNode } from 'react'
import { api } from '@trmnl-games/backend/api'
import { poseFor, type SceneKey } from '@trmnl-games/idle-angler/art/scene'
import { sceneKeyFromUrl } from '@trmnl-games/idle-angler/art/sceneColour'
import { useIntent } from '../../../lib/intent'
import { preload } from '../../../lib/preload'
import { BAIT_LABEL, BAND_LABEL, WEATHER_LABEL, formatWeight, readyOrders, type Dock } from '../../../lib/idleAngler'
import { Button, Card, Meter, NoticeBar, useNotice } from '../../../lib/ui'
import { FishIcon, Scene } from './-art'
import { FishName, FishText, WaterName } from './-fish'
import { Coins } from './-coins'
import { GoalCard } from './-goalCard'
import { Rows } from './-rows'
import { LocalTime } from '../../../lib/localTime'

/** The dock: the angler's scene, progress, the bait in use, the waters and the latest stories. The fly box lives in the logbook. */
export const Route = createFileRoute('/app/idle-angler/')({
  loader: ({ context }) => preload(context, convexQuery(api.idleAngler.anglers.dock, {}), convexQuery(api.idleAngler.payload.preview, {})),
  component: DockPage,
})

const clock = (date: Date) => date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
const time = (at: number) => <LocalTime at={at} format={clock} />

function DockPage() {
  const { data } = useQuery(convexQuery(api.idleAngler.anglers.dock, {}))
  const { data: preview } = useQuery(convexQuery(api.idleAngler.payload.preview, {}))
  const { notice, notify, dismiss } = useNotice()
  const travel = useIntent(api.idleAngler.anglers.travelTo, { onFeedback: notify })
  const chooseBait = useIntent(api.idleAngler.anglers.chooseBait, { onFeedback: notify })
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
  // Fish that broke free and the next rod would have held: the clearest reason to upgrade.
  const rodWouldLand = nextRod ? (recap?.awayGrams ?? []).filter((g) => g <= nextRod.limitGrams).length : 0
  const full = dock.full ?? null
  const goal = full ? null : nextGoal(dock)
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
          <span className="inline-flex flex-wrap items-center gap-x-2 text-sm text-muted"><strong className="text-ink">{angler.title}</strong> · <Coins n={angler.gold} className="text-gold-ink" /></span>
        </div>
        {scene ? <Scene sceneKey={scene} alt={`${angler.alias} fishing at ${here?.name ?? 'the water'}`} /> : null}
        {/* Status, conditions and timing on their own lines: run together, a phone wrapped them mid-phrase. */}
        <div className="flex flex-col gap-1">
          <p className="text-lg font-semibold">
            {angler.status === 'paused' ? <>Fishing is paused. <Link to="/app/idle-angler/settings" className="font-normal underline underline-offset-4">Resume on the More page</Link>.</> : destination ? <>Heading to <WaterName id={destination.id} />.{firstCastThere ? <> First cast there at {firstCastThere}.</> : null}</> : <>Casting at {here ? <WaterName id={here.id} /> : 'the water'}.</>}
          </p>
          {here ? <p className="text-muted">{full?.season ? <>{full.season.name} · </> : null}{BAND_LABEL[here.band]}, {WEATHER_LABEL[here.weather]?.toLowerCase()} · Bite chance {here.bitePercent}%</p> : null}
          {dock.nextTickAt && !destination && angler.status !== 'paused' ? <p className="text-sm text-muted">Next cast at {time(dock.nextTickAt)}.</p> : null}
        </div>
        {/* The logbook meter counts species towards the next title; the sentence under it says what the title is, in words a first visit can follow. */}
        <div className="grid gap-4 sm:grid-cols-2">
          <div className="flex flex-col gap-1">
            <Meter label="Logbook" value={angler.speciesLogged} max={angler.nextTitle?.species ?? angler.speciesTotal} tone="xp" />
            <p className="text-sm text-muted">{angler.nextTitle ? <>{angler.speciesLogged} of {angler.nextTitle.species} species logged. <strong className="text-ink">{angler.nextTitle.name}</strong> is the next title, at {angler.nextTitle.species}.</> : <>Every title earned: {angler.speciesLogged} of {angler.speciesTotal} species logged.</>}</p>
          </div>
          <Meter label={angler.cooler.name} value={angler.cooler.used} max={angler.cooler.capacity} tone="gold" />
        </div>
        {!coolerFull && catches.length > 0 ? (
          <p className="text-sm"><Link to="/app/idle-angler/cooler" className="inline-flex items-center gap-2 underline underline-offset-4">Sell {catches.length} fish <Coins n={coolerValue} sign /></Link></p>
        ) : null}
        {fishmongerPays > 0 ? <p className="text-sm"><Link to="/app/idle-angler/cooler" className="inline-flex items-center gap-2 font-semibold text-gold-ink underline underline-offset-4">The fishmonger is buying <Coins n={fishmongerPays} sign /></Link></p> : null}
        {goal ? <p className="text-sm"><span className="text-muted">Next goal:</span> <Link to="/app/idle-angler/shop" className="underline underline-offset-4">{goal}</Link></p> : null}
        {full ? <GoalCard full={full} fishmonger={fishmongerPays > 0} notify={notify} /> : null}
        {full?.runs.length ? <ul className="flex flex-col gap-1 text-sm">{full.runs.map((run) => <li key={run.id} className="font-semibold text-sky-ink">{run.line}</li>)}</ul> : null}
        {coolerFull ? (
          <p className="font-semibold text-hp-ink">
            The cooler is full, so new catches are released. <Link to="/app/idle-angler/cooler" className="underline underline-offset-4">Sell your catch</Link>.
          </p>
        ) : null}
      </section>

      {recap && recap.landed + recap.gotAway > 0 ? (
        <Card title="Last 12 hours">
          <Rows rows={[
            ['Landed', `${recap.landed} fish${recap.released ? ` (${recap.released} released, cooler full)` : ''}`],
            recap.best ? ['Heaviest', <span className="inline-flex flex-wrap items-center gap-2"><FishIcon id={recap.best.speciesId} scale={2} /><span>{formatWeight(recap.best.grams)} <FishName id={recap.best.speciesId} /></span></span>] : null,
            recap.records ? ['Personal bests', `${recap.records}`] : null,
            recap.firsts ? ['New species', `${recap.firsts}`] : null,
            recap.gotAway ? ['Got away', `${recap.gotAway}, too heavy for the ${angler.rod.name}`] : null,
          ]} />
          {nextRod && rodWouldLand > 0 ? (
            <p className="mt-3 text-sm">The {nextRod.name} would have landed {rodWouldLand === recap.gotAway ? (rodWouldLand === 1 ? 'it' : 'all of them') : `${rodWouldLand} of them`}. <Link to="/app/idle-angler/shop" className="underline underline-offset-4">{nextRod.price} coins in the shop</Link>.</p>
          ) : null}
        </Card>
      ) : null}

      <Card title="Bait">
        {usable.length === 0 ? <p className="mb-3 font-semibold text-hp-ink">You have no bait for {baitWater?.name}, so your angler {destination ? 'will fish' : 'is fishing'} a bare hook. <Link to="/app/idle-angler/shop" className="underline underline-offset-4">Buy bait</Link>.</p> : null}
        {usable.length > 0 && !fishing ? <p className="mb-3 font-semibold text-hp-ink">Your angler is fishing a bare hook. Choose a bait below{usable.every((b) => b.units === 0) ? <>, or <Link to="/app/idle-angler/shop" className="underline underline-offset-4">buy some</Link></> : null}.</p> : null}
        {/* D167: Desk Crawler's stance picker (one look for a choice): the bait on the hook is the pressed cell with the cursor, the others are what a tap switches to. */}
        {usable.length > 0 ? <p className="mb-2 text-sm text-muted">On the hook from the next cast:</p> : null}
        <div role="group" aria-label="Bait on the hook" className="flex flex-wrap gap-0.5 border-2 border-edge bg-edge">
          {usable.map((bait) => {
            const chosen = angler.baitOnHook === bait.class
            return (
              <button
                key={bait.class}
                type="button"
                aria-pressed={chosen}
                aria-disabled={chooseBait.pending || undefined}
                onClick={() => { if (!chosen && !chooseBait.pending) void chooseBait.run({ bait: bait.class as never }, `Fishing with ${bait.name.toLowerCase()} from the next cast.`) }}
                className={`menu-cursor flex min-h-11 grow basis-[40%] items-center min-[480px]:basis-[30%] justify-center gap-2 px-2 py-2 label-px uppercase tracking-wide not-aria-pressed:before:hidden ${chosen ? 'bg-navy text-gold' : 'bg-panel text-muted hover:bg-rule hover:text-ink active:bg-rule active:text-ink'}`}
              >
                {bait.name} <span className="tabular-nums">×{bait.units}</span>
              </button>
            )
          })}
        </div>
        <dl className="mt-3 grid grid-cols-[auto_1fr] gap-x-3 gap-y-1 text-sm">
          <dt className="text-muted">Uses</dt><dd>One per fish kept or lost</dd>
          <dt className="text-muted">No bait</dt><dd>Fewer bites, small fish only</dd>
        </dl>
        <p className="mt-3 text-sm"><Link to="/app/idle-angler/shop" className="underline underline-offset-4">What each bait catches</Link></p>
      </Card>

      <Card title="Waters">
        <ul className="flex flex-col gap-3">
          {shownWaters.map((water) => (
            <li key={water.id} className="flex flex-wrap items-center justify-between gap-3 border-b border-rule pb-3 last:border-b-0">
              <div className="min-w-0">
                <p className="font-semibold"><WaterName id={water.id} />{water.id === angler.waterId ? <span className="text-muted"> · here</span> : water.id === angler.travelTo ? <span className="text-muted"> · heading there</span> : ''}</p>
                {water.open ? (
                  <>
                    <p className="text-sm text-muted">{BAND_LABEL[water.band]}, {WEATHER_LABEL[water.weather]?.toLowerCase()} until {time(water.weatherUntil)}</p>
                    <p className="text-sm text-muted">Bait: {water.baits.filter((b) => b !== 'deadbait' || !full || full.features.deadbait).map((b) => BAIT_LABEL[b]).join(', ')}</p>
                    {held(water).length === 0 ? <p className="text-sm text-hp-ink">You have none of its bait.</p> : null}
                  </>
                ) : water.closed ? <p className="text-sm text-muted">Open in the winter week only, when the ice is thick enough.</p> : water.charter ? <p className="text-sm text-muted">Fished on a charter ticket. <Link to="/app/idle-angler/shop" className="underline underline-offset-4">Book one in the shop</Link>.</p> : <p className="text-sm text-muted">{water.opensAfter ? <>Opens once {water.opensAfter.species} <WaterName id={water.opensAfter.waterId}>{water.opensAfter.waterName}</WaterName> species are in your logbook ({Math.min(water.opensAfter.logged, water.opensAfter.species)} so far)</> : 'Opens later'}{water.access ? <>, with the <strong>{ACCESS_NAME[water.access] ?? water.access}</strong> from the shop</> : ''}.</p>}
              </div>
              {water.open && water.id !== angler.waterId && water.id !== angler.travelTo ? (
                <Button variant="secondary" disabled={travel.pending} onClick={() => {
                  const next = travelBait(water)
                  void travel.run({ waterId: water.id as never }, next ? `Heading to ${water.name}. Fishing with ${next.name.toLowerCase()} there.` : `Heading to ${water.name}. You have no bait for it yet.`)
                }}>Fish here</Button>
              ) : null}
            </li>
          ))}
        </ul>
        <p className="mt-3 text-sm text-muted">Weather is the same for every angler at a water and changes every six hours.{full?.season ? <> The season changes every Monday for everyone: {full.season.name.toLowerCase()} until <LocalTime at={full.season.endsAt} format={(d) => d.toLocaleDateString([], { weekday: 'long' })} />.</> : null} Moving skips one cast, then the angler fishes the new water.</p>
      </Card>

      <Card title="Latest">
        <ol className="flex flex-col gap-2">
          {dock.logs?.slice(0, 10).map((log) => (
            <li key={log.id} className="flex gap-3 text-sm">
              <span className="w-12 shrink-0 tabular-nums text-muted">{time(log.at)}</span>
              <span className="min-w-0"><FishText text={log.summary} /></span>
            </li>
          ))}
        </ol>
      </Card>
      <NoticeBar notice={notice} onDismiss={dismiss} />
    </>
  )
}

const ACCESS_NAME: Record<string, string> = { waders: 'Waders', pier_permit: 'Pier Permit', rowing_boat: 'Rowing Boat', ice_auger: 'Ice Auger' }

/** The scene from the dock alone: the water the angler fishes or heads to, its band and weather, and the pose the latest story calls for. */
function sceneFromDock(dock: Dock): SceneKey | null {
  const angler = dock.angler
  const water = dock.waters?.find((w) => w.id === (angler?.travelTo ?? angler?.waterId))
  if (!angler || !water) return null
  const pose = poseFor(angler.status === 'paused' ? 'paused' : angler.travelTo ? 'travelling' : 'fishing', dock.logs?.[0]?.kind ?? null)
  // The dock does not say which fish was held, so a catch shows the angler waiting rather than holding nothing.
  return { water: water.id as SceneKey['water'], band: water.band as SceneKey['band'], weather: water.weather as SceneKey['weather'], season: (dock.full?.season?.id ?? null) as SceneKey['season'], pose: pose === 'holding' ? 'waiting' : pose, fish: null, fly: null }
}

/**
 * The one thing to work towards next: the nearest locked water (the species its logbook gate needs, then its pass),
 * else the next rod, else the next cooler. Null once everything is owned.
 */
function nextGoal(dock: Dock): ReactNode {
  const angler = dock.angler!
  const gold = angler.gold
  const afford = (price: number) => (gold >= price ? `${price} coins, which you have` : `${price - gold} more coins`)
  const locked = dock.waters?.find((w) => !w.open)
  if (locked) {
    const pass = dock.shop?.access.find((a) => a.water === locked.id && !a.owned)
    const gate = locked.opensAfter
    if (gate && gate.logged < gate.species) return <>log {gate.species - gate.logged} more <WaterName id={gate.waterId} /> species to open <WaterName id={locked.id} />{pass ? <>, and buy the <strong>{pass.name}</strong></> : null}</>
    if (pass) return <>the <strong>{pass.name}</strong> to fish <WaterName id={locked.id} />, {afford(pass.price)}</>
  }
  if (dock.shop?.rod) return <>the <strong>{dock.shop.rod.name}</strong>, {afford(dock.shop.rod.price)}</>
  if (dock.shop?.cooler) return <>the <strong>{dock.shop.cooler.name}</strong>, {afford(dock.shop.cooler.price)}</>
  return null
}
