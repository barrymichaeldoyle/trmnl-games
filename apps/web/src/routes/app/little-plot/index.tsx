import { convexQuery } from '@convex-dev/react-query'
import { useQuery } from '@tanstack/react-query'
import { Link, createFileRoute } from '@tanstack/react-router'
import { useState } from 'react'
import { api } from '@trmnl-games/backend/api'
import { useIntent } from '../../../lib/intent'
import { preload } from '../../../lib/preload'
import { LocalTime } from '../../../lib/localTime'
import { formatTime, useLocale } from '../../../lib/i18n'
import { seo } from '../../../lib/seo'
import { Button, Card, NoticeBar, useNotice } from '../../../lib/ui'
import { plain, SEASON_NAME, STAGE_NAME, ticksLabel, type Bed, type PlotView, type Seed } from '../../../lib/littlePlot'
import { Coins, GoalCard, KindName, Scene } from './-shared'

/** The Plot page (little-plot.md "Companion"): the scene, the grid of beds to tap, Water the plot, the goal and the recent story. */
export const Route = createFileRoute('/app/little-plot/')({
  head: () => seo({ title: 'Plot · Little Plot', index: false }),
  loader: ({ context }) => preload(context, convexQuery(api.littlePlot.plots.view, {}), convexQuery(api.littlePlot.payload.preview, {})),
  component: PlotPage,
})

const STAGE_GLYPH: Record<Bed['stage'], string> = { sown: '·', sprout: 'ᵛ', leaf: 'ʸ', bud: '✿', ripe: '✿' }

function BedTile({ bed, onOpen }: { bed: Bed; onOpen: () => void }) {
  const label = bed.kind ? `${bed.kind.name}, ${STAGE_NAME[bed.stage].toLowerCase()}` : 'Empty bed'
  return (
    <button type="button" onClick={onOpen} aria-label={`Bed ${bed.index + 1}: ${label}${bed.greenhouse ? ', under glass' : ''}${bed.crossed ? ', crossed' : ''}`} className={`menu-cursor relative flex aspect-[4/3] min-h-16 flex-col items-center justify-center gap-1 border-2 p-1 text-center before:hidden ${bed.ripe ? 'border-gold bg-panel' : bed.kind ? 'border-edge' : 'border-dashed border-rule'} ${bed.greenhouse ? 'outline-2 outline-offset-2 outline-sky' : ''}`}>
      <span aria-hidden="true" className={`text-xl leading-none ${bed.ripe ? 'text-gold-ink' : 'text-muted'}`}>{bed.kind ? STAGE_GLYPH[bed.stage] : '+'}</span>
      <span className="text-xs leading-tight font-semibold [overflow-wrap:anywhere]">{bed.kind ? bed.kind.name : 'Sow'}</span>
      {bed.kind ? <span className="text-[0.625rem] leading-tight text-muted">{bed.ripe ? 'Ripe' : STAGE_NAME[bed.stage]}</span> : null}
      {bed.crossed ? <span aria-hidden="true" className="absolute top-0.5 right-1 text-gold-ink">★</span> : null}
    </button>
  )
}

/** One bed's sheet: pick it, or sow a seed from the tin, with what the bed is doing. */
function BedSheet({ bed, view, onClose, notify }: { bed: Bed; view: PlotView; onClose: () => void; notify: (f: { error: string | null; message: string | null }) => void }) {
  const pick = useIntent(api.littlePlot.plots.pickBed, { onFeedback: notify })
  const sow = useIntent(api.littlePlot.plots.sowBed, { onFeedback: notify })
  const seeds = view.tin.filter((s) => s.count > 0)
  const busy = pick.pending || sow.pending
  return (
    <div role="dialog" aria-modal="true" aria-labelledby="bed-title" className="fixed inset-0 z-40 flex items-end justify-center bg-night/60 sm:items-center" onClick={onClose}>
      <div className="window flex w-full max-w-md flex-col gap-3 bg-panel p-4" onClick={(e) => e.stopPropagation()}>
        <h2 id="bed-title" className="font-display text-xl font-bold">Bed {bed.index + 1}{bed.greenhouse ? ' · under glass' : ''}</h2>
        {bed.kind ? (
          <>
            <p className="flex items-center gap-2"><KindName name={bed.kind.name} rarity={bed.kind.rarity} className="font-semibold" /> <span className="text-sm text-muted">· {STAGE_NAME[bed.stage]}{bed.volunteer ? ' · sowed itself' : ''}</span></p>
            {bed.crossed ? <p className="text-sm text-gold-ink">★ It has set a seed you {bed.crossed.known ? `know: ${bed.crossed.name}` : "don't recognise"}. Pick it to have the seed.</p> : null}
            {bed.ripe ? (
              <Button className="inline-flex items-center justify-center gap-2" pending={pick.pending} busyLabel="Picking…" onClick={async () => { if (await pick.run({ bed: bed.index }, `Picked the ${bed.kind!.name}.`)) onClose() }}>Pick <Coins n={bed.coins ?? 0} sign /></Button>
            ) : (
              <p className="text-sm text-muted">{bed.nextStageInTicks !== null ? `Next stage in about ${ticksLabel(bed.nextStageInTicks)}.` : 'Waiting for its season or the night.'}</p>
            )}
          </>
        ) : seeds.length === 0 ? (
          <p className="text-sm text-muted">Nothing in the tin. Pick a ripe bed for seeds, or buy some in the <Link to="/app/little-plot/shed" className="underline underline-offset-4">Shed</Link>.</p>
        ) : (
          <>
            <p className="text-sm text-muted">Sow a seed from the tin:</p>
            <ul className="flex max-h-72 flex-col divide-y divide-rule overflow-y-auto">
              {seeds.map((s: Seed) => (
                <li key={s.id} className="flex items-center justify-between gap-3 py-2">
                  <span className="flex min-w-0 flex-col"><KindName name={s.name} rarity={s.rarity} className="font-semibold" /><span className="text-xs text-muted">{s.count} in the tin{s.note ? ` · ${s.note}` : ''}{!s.grown ? ' · never grown' : ''}</span></span>
                  <Button variant="secondary" className="shrink-0" disabled={busy} onClick={async () => { if (await sow.run({ bed: bed.index, kindId: s.id }, `Sowed a ${s.name}.`)) onClose() }}>Sow</Button>
                </li>
              ))}
            </ul>
          </>
        )}
        <Button variant="quiet" allowOffline onClick={onClose}>Close</Button>
      </div>
    </div>
  )
}

function PlotPage() {
  const { data } = useQuery(convexQuery(api.littlePlot.plots.view, {}))
  const { data: preview } = useQuery(convexQuery(api.littlePlot.payload.preview, {}))
  const { notice, notify, dismiss } = useNotice()
  const water = useIntent(api.littlePlot.plots.waterPlot, { onFeedback: notify })
  const pickAll = useIntent(api.littlePlot.plots.pickAllRipe, { onFeedback: notify })
  const [open, setOpen] = useState<number | null>(null)
  const locale = useLocale()
  const view = data as PlotView | undefined
  const plot = view?.plot
  if (!view || !plot) return null
  const sceneBase = typeof preview?.scene_base === 'string' ? preview.scene_base : ''
  const ripe = plot.beds.filter((b) => b.ripe)
  const ripeCoins = ripe.reduce((s, b) => s + (b.coins ?? 0), 0)
  const openBed = open === null ? null : plot.beds[open] ?? null
  const season = view.season
  return (
    <>
      <section aria-labelledby="plot-title" className="flex flex-col gap-4">
        <div className="flex flex-wrap items-baseline justify-between gap-2">
          <h1 id="plot-title" className="font-display text-3xl font-bold">Your plot</h1>
          <span className="inline-flex flex-wrap items-center gap-x-2 text-sm text-muted"><strong className="text-ink">Level {plot.level}</strong> · <Coins n={plot.gold} className="text-gold-ink" /></span>
        </div>
        <Scene sceneBase={sceneBase} alt="Your plot as the TRMNL shows it" />
        <div className="flex flex-col gap-1">
          <p className="text-lg font-semibold">
            {plot.status === 'paused' ? <>Paused. <Link to="/app/little-plot/settings" className="font-normal underline underline-offset-4">Resume on More</Link>.</> : `${SEASON_NAME[season.id]} at the plot, ${season.band}, ${season.frost ? 'frost' : season.weather}.`}
          </p>
          <p className="text-sm text-muted">{SEASON_NAME[season.id]} until <LocalTime at={season.endsAt} format={(d) => d.toLocaleDateString(undefined, { weekday: 'long' })} /> · next tick <LocalTime at={view.nextTickAt} format={(d) => formatTime(locale, d)} /></p>
          <p className="text-sm text-muted">{plot.wateredHoursLeft > 0 ? `Watered for another ${Math.ceil(plot.wateredHoursLeft)} h.` : 'The plot is dry. It still grows, just slower.'}</p>
        </div>
        <GoalCard view={view} notify={notify} />
        <ol aria-label="Beds" className="grid gap-2" style={{ gridTemplateColumns: `repeat(${plot.cols}, minmax(0, 1fr))` }}>
          {plot.beds.map((bed) => <li key={bed.index}><BedTile bed={bed} onOpen={() => setOpen(bed.index)} /></li>)}
        </ol>
        {/* D167: only what can be acted on. */}
        <div className="flex flex-wrap gap-3">
          {ripe.length > 1 ? <Button className="inline-flex items-center gap-2" pending={pickAll.pending} busyLabel="Picking…" onClick={() => void pickAll.run({}, `Picked ${ripe.length} beds.`)}>Pick all {ripe.length} <Coins n={ripeCoins} sign /></Button> : null}
          {plot.status === 'growing' && plot.wateredHoursLeft * 4 < plot.waterTicks ? <Button variant="secondary" pending={water.pending} busyLabel="Watering…" onClick={() => void water.run({}, 'Watered the plot.')}>Water the plot ({Math.round(plot.waterTicks / 4)} h)</Button> : null}
        </div>
      </section>
      <Card title="Lately">
        <ol className="flex flex-col divide-y divide-rule">
          {view.logs.slice(0, 20).map((line) => (
            <li key={line.id} className="flex items-start justify-between gap-3 py-2 text-sm">
              <span className={line.kind === 'ripe' || line.kind === 'cross' ? 'font-semibold' : ''}>{plain(line.summary)}</span>
              <LocalTime className="shrink-0 text-xs text-muted" at={line.at} format={(d) => formatTime(locale, d)} />
            </li>
          ))}
        </ol>
      </Card>
      {openBed ? <BedSheet bed={openBed} view={view} onClose={() => setOpen(null)} notify={notify} /> : null}
      <NoticeBar notice={notice} onDismiss={dismiss} />
    </>
  )
}
