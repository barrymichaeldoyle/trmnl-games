import { convexQuery } from '@convex-dev/react-query'
import { useQuery } from '@tanstack/react-query'
import { Link, createFileRoute, getRouteApi } from '@tanstack/react-router'
import { useMemo, useState } from 'react'
import { api } from '@trmnl-games/backend/api'
import { contentV1 } from '@trmnl-games/pixel-wars/content'
import { cellsFromHex, refuseReason, type FactionId, type MapState, type OrderKind } from '@trmnl-games/pixel-wars/sim'
import { useIntent } from '../../../lib/intent'
import { preload } from '../../../lib/preload'
import { LocalTime } from '../../../lib/localTime'
import { formatTime, useLocale } from '../../../lib/i18n'
import { seo } from '../../../lib/seo'
import { Button, Card, Meter, NoticeBar, useNotice } from '../../../lib/ui'
import { cellOf, ORDER_LABEL, plain, toMapState, type FactionInfo, type OpenFaction, type WarView } from '../../../lib/pixelWars'
import { FactionName, MapCanvas, Swatch, type Selection } from './-shared'

/** The Map page (pixel-wars.md "Companion"): the side picker until a side is chosen, then the map, the well, the orders and the queue. */
export const Route = createFileRoute('/app/pixel-wars/')({
  head: () => seo({ title: 'Map · Pixel Wars', index: false }),
  loader: ({ context }) => preload(context, convexQuery(api.pixelWars.desks.view, {})),
  component: MapPage,
})

const shell = getRouteApi('/app/pixel-wars')

/** Pick a side (pixel-wars.md point 11): every faction with its desks, the smallest flagged, a full one closed; an invite joins the inviter's side. */
function ChooseSide({ factions, open, invite, notify }: { factions: FactionInfo[]; open: OpenFaction[]; invite: string | undefined; notify: (f: { error: string | null; message: string | null }) => void }) {
  const choose = useIntent(api.pixelWars.desks.chooseFaction, { onFeedback: notify })
  return (
    <section aria-labelledby="choose-title" className="flex flex-col gap-4">
      <h1 id="choose-title" className="font-display text-3xl font-bold">Pick a side</h1>
      <p className="text-muted">Four factions, one map. Your desk takes your side’s pattern and your drops paint for it. {invite ? 'You came by an invite: whichever side you pick, your desk lands beside your friend in their faction.' : 'The smallest side needs players; a side holding too many desks is closed for the week.'}</p>
      <ul className="grid gap-3 sm:grid-cols-2">
        {factions.map((f) => {
          const o = open.find((x) => x.faction === f.id)
          const closed = !invite && o !== undefined && !o.open
          return (
            <li key={f.id}>
              <button type="button" disabled={closed || choose.pending} onClick={() => void choose.run({ faction: f.id, ...(invite ? { invite } : {}) }, `You chose ${f.name}.`)} className={`menu-cursor flex w-full items-center gap-3 border-[3px] p-3 text-left before:hidden ${closed ? 'border-rule text-muted' : 'border-night bg-panel hover:bg-ground'}`}>
                <Swatch faction={f.id} factions={factions} size={40} />
                <span className="flex min-w-0 flex-col">
                  <span className="font-display text-xl font-bold">{f.name}</span>
                  <span className="text-sm text-muted">{o?.desks ?? 0} {o?.desks === 1 ? 'desk' : 'desks'}{o?.smallest ? ' · needs players' : ''}{closed ? ' · full this week' : ''}</span>
                </span>
              </button>
            </li>
          )
        })}
      </ul>
    </section>
  )
}

/** One cell's sheet: what it is, and the orders it can take with their cost. */
function CellSheet({ sel, view, state, onClose, notify }: { sel: Selection; view: WarView; state: MapState; onClose: () => void; notify: (f: { error: string | null; message: string | null }) => void }) {
  const queue = useIntent(api.pixelWars.desks.queueOrder, { onFeedback: notify })
  const map = view.map!
  const desk = view.desk!
  const cells = useMemo(() => cellsFromHex(map.cells), [map.cells])
  const cell = cellOf(map, cells, sel.x, sel.y)
  const [drops, setDrops] = useState<number | null>(null)
  if (!cell) return null
  const seatAt = map.seats.findIndex((s) => s.x === sel.x && s.y === sel.y) + 1
  const ownDesk = seatAt === desk.seat
  const kinds: OrderKind[] = ['paint', 'stamp', 'strike', 'liberate']
  // The shield is the server's to judge; here the map alone decides what the cell can take.
  const possible = kinds.filter((kind) => refuseReason(state, { seat: desk.seat!, x: sel.x, y: sel.y, kind, drops: 1 }, contentV1, new Set()) === null)
  const cap = cell.desk ? view.rules.deskInkCap : view.rules.cellInkCap
  const suggested = (kind: OrderKind) => (kind === 'paint' ? 1 : kind === 'stamp' ? Math.max(1, cap - cell.ink) : kind === 'strike' ? cell.ink + 1 : Math.max(1, Math.ceil((cell.ink + 1) / view.rules.liberateMultiplier)))
  const what = cell.faction === 0 ? (cell.desk ? 'A desk at ground' : 'Ground') : `${view.factions.find((f) => f.id === cell.faction)?.name ?? ''} · ink ${cell.ink}/${cap}${cell.desk ? ' · a desk' : ''}`
  return (
    <div role="dialog" aria-modal="true" aria-labelledby="cell-title" className="fixed inset-0 z-40 flex items-end justify-center bg-night/60 sm:items-center" onClick={onClose}>
      <div className="window flex w-full max-w-md flex-col gap-3 bg-panel p-4" onClick={(e) => e.stopPropagation()}>
        <h2 id="cell-title" className="font-display text-xl font-bold">{ownDesk ? 'Your desk' : seatAt > 0 ? 'A desk' : 'Cell'} {sel.x},{sel.y}</h2>
        <p className="flex items-center gap-2 text-sm">{cell.faction !== 0 ? <Swatch faction={cell.faction as FactionId} factions={view.factions} /> : null}{what}</p>
        {possible.length === 0 ? (
          <p className="text-sm text-muted">{cell.faction === desk.faction && cell.faction !== 0 ? 'Yours, and full.' : 'Out of reach: your faction holds nothing beside it.'}</p>
        ) : (
          <ul className="flex flex-col gap-2">
            {possible.map((kind) => {
              const n = drops ?? suggested(kind)
              return (
                <li key={kind} className="flex flex-wrap items-center justify-between gap-2 border-t border-rule pt-2">
                  <span className="flex flex-col"><span className="font-semibold">{ORDER_LABEL[kind]}</span><span className="text-xs text-muted">{kind === 'paint' ? 'Claim ground beside your faction.' : kind === 'stamp' ? 'Add ink to a cell you hold.' : kind === 'strike' ? 'Each drop takes one ink; the surplus claims it.' : `Your own desk: each drop counts ${view.rules.liberateMultiplier}.`}</span></span>
                  <span className="flex items-center gap-2">
                    <label className="flex items-center gap-1 text-sm"><span className="sr-only">Drops</span><input type="number" min={1} max={desk.well.drops} value={n} onChange={(e) => setDrops(Math.max(1, Math.min(desk.well.drops, Number(e.target.value) || 1)))} className="w-16 min-h-11 border-2 border-edge bg-ground px-2 text-base" /></label>
                    <Button className="shrink-0" disabled={queue.pending || desk.well.drops < n} pending={queue.pending} busyLabel="Queuing…" onClick={async () => { if (await queue.run({ x: sel.x, y: sel.y, kind, drops: n }, `${ORDER_LABEL[kind]} queued for the next tick.`)) onClose() }}>{ORDER_LABEL[kind]}</Button>
                  </span>
                </li>
              )
            })}
          </ul>
        )}
        {desk.well.drops === 0 ? <p className="text-sm text-muted">The well is dry. A drop arrives every quarter-hour.</p> : null}
        <Button variant="quiet" allowOffline onClick={onClose}>Close</Button>
      </div>
    </div>
  )
}

function MapPage() {
  const { data } = useQuery(convexQuery(api.pixelWars.desks.view, {}))
  const { invite } = shell.useSearch()
  const { notice, notify, dismiss } = useNotice()
  const cancel = useIntent(api.pixelWars.desks.cancelOrder, { onFeedback: notify })
  const [selected, setSelected] = useState<Selection | null>(null)
  const [open, setOpen] = useState(false)
  const [zoom, setZoom] = useState(1)
  const locale = useLocale()
  const view = data as WarView | undefined
  const desk = view?.desk
  const state = useMemo(() => (view?.map ? toMapState(view.map) : null), [view?.map])
  if (!view || !desk) return null
  if (desk.faction === 0 || !desk.placed) return <><ChooseSide factions={view.factions} open={view.open} invite={invite} notify={notify} /><NoticeBar notice={notice} onDismiss={dismiss} /></>
  const map = view.map
  const fallen = desk.own !== null && desk.own.faction !== desk.faction
  const base = Math.max(6, Math.floor(Math.min(24, 358 / (map?.cols ?? 1))))
  const cellPx = base * zoom
  const shares = [...(map?.shares ?? [])].sort((a, b) => a.rank - b.rank)
  return (
    <>
      <section aria-labelledby="map-title" className="flex flex-col gap-4">
        <div className="flex flex-wrap items-baseline justify-between gap-2">
          <h1 id="map-title" className="font-display text-3xl font-bold">The map</h1>
          <span className="inline-flex flex-wrap items-center gap-x-2 text-sm text-muted"><FactionName faction={desk.faction as FactionId} factions={view.factions} className="font-semibold text-ink" /> · <strong className="text-ink">Level {desk.level}</strong></span>
        </div>
        <ul aria-label="Shares" className="flex flex-wrap gap-x-4 gap-y-1 text-sm">
          {shares.map((s) => <li key={s.faction} className={s.faction === desk.faction ? 'font-semibold' : 'text-muted'}><FactionName faction={s.faction} factions={view.factions} /> {s.percent}%</li>)}
        </ul>
        {desk.cleared ? <p className="border-l-4 border-hp pl-3 font-semibold">Your desk stands empty: it returns within the hour after a screen shows the map.</p> : fallen ? <p className="border-l-4 border-hp pl-3 font-semibold">{desk.own!.faction === 0 ? 'Your desk has faded to ground.' : `${view.factions.find((f) => f.id === desk.own!.faction)?.name} holds your desk.`} Liberate it: one drop of yours counts {view.rules.liberateMultiplier}.</p> : null}
        <div className="flex flex-wrap items-center justify-between gap-2 text-sm">
          <span><strong>{desk.well.drops}</strong>/{desk.well.cap} drops · {desk.well.perHour} an hour · <strong>{desk.held}</strong> {desk.held === 1 ? 'cell' : 'cells'} yours</span>
          <span className="text-muted">next tick <LocalTime at={view.nextTickAt} format={(d) => formatTime(locale, d)} />{desk.shielded ? ' · your desk is shielded' : ''}</span>
        </div>
        <Meter label="Well" value={desk.well.drops} max={desk.well.cap} />
        {map && state ? (
          <div className="flex flex-col gap-2">
            <div className="window overflow-auto bg-white p-1" style={{ maxHeight: '70vh' }}>
              <MapCanvas map={map} factions={view.factions} cell={cellPx} own={desk.cell} selected={selected} queued={view.queue} onSelect={(s) => { setSelected(s); setOpen(true) }} />
            </div>
            <div className="flex flex-wrap items-center justify-between gap-2 text-xs text-muted">
              <span>Tap a cell to give an order. Orders resolve on the quarter-hour.</span>
              <span className="flex gap-1">{[1, 2, 3].map((z) => <button key={z} type="button" aria-pressed={zoom === z} onClick={() => setZoom(z)} className={`menu-cursor min-h-8 border-2 px-2 before:hidden ${zoom === z ? 'border-night bg-night text-gold' : 'border-edge'}`}>{z}×</button>)}</span>
            </div>
          </div>
        ) : null}
        {map?.lines.length ? <ul className="flex flex-col gap-1 text-sm">{map.lines.map((l) => <li key={l}>{l}</li>)}</ul> : null}
      </section>
      <Card title={`Queued for tick ${view.targetTick}`}>
        {view.queue.length === 0 ? <p className="text-sm text-muted">Nothing queued. Tap a cell on the map.</p> : (
          <ul className="flex flex-col divide-y divide-rule">
            {view.queue.map((o) => (
              <li key={o.id} className="flex items-center justify-between gap-3 py-2 text-sm">
                <span><strong>{ORDER_LABEL[o.kind]}</strong> {o.x},{o.y} · {o.drops} {o.drops === 1 ? 'drop' : 'drops'}</span>
                <Button variant="quiet" className="shrink-0" disabled={cancel.pending} onClick={() => void cancel.run({ orderId: o.id as never }, 'Drops returned.')}>Cancel</Button>
              </li>
            ))}
          </ul>
        )}
      </Card>
      {view.goal ? (
        <section className="flex flex-col gap-1 border-l-4 border-gold pl-3">
          <h2 className="text-sm font-semibold text-muted">Goal</h2>
          <p className="font-semibold">{view.goal.title} <span className="text-sm text-gold-ink">+{view.goal.xp} XP</span>{view.goal.progress ? <span className="text-sm text-muted"> · {view.goal.progress.value} of {view.goal.progress.target}</span> : null}</p>
        </section>
      ) : null}
      <Card title="Lately">
        {view.logs.length === 0 ? <p className="text-sm text-muted">Nothing yet.</p> : (
          <ol className="flex flex-col divide-y divide-rule">
            {view.logs.slice(0, 20).map((line) => (
              <li key={line.id} className="flex items-start justify-between gap-3 py-2 text-sm">
                <span className={line.kind === 'fell' || line.kind === 'taken' || line.kind === 'bell' ? 'font-semibold' : ''}>{plain(line.summary)}</span>
                <LocalTime className="shrink-0 text-xs text-muted" at={line.at} format={(d) => formatTime(locale, d)} />
              </li>
            ))}
          </ol>
        )}
        <p className="mt-3 text-sm"><Link to="/help/pixel-wars" className="underline underline-offset-4">How the war works</Link></p>
      </Card>
      {open && selected && state ? <CellSheet sel={selected} view={view} state={state} onClose={() => setOpen(false)} notify={notify} /> : null}
      <NoticeBar notice={notice} onDismiss={dismiss} />
    </>
  )
}
