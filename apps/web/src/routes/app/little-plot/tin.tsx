import { convexQuery } from '@convex-dev/react-query'
import { useQuery } from '@tanstack/react-query'
import { Link, createFileRoute } from '@tanstack/react-router'
import { api } from '@trmnl-games/backend/api'
import { preload } from '../../../lib/preload'
import { seo } from '../../../lib/seo'
import { Card } from '../../../lib/ui'
import { GROUP_NAME, type PlotView, type Seed } from '../../../lib/littlePlot'
import { KindName } from './-shared'

/** The Seed Tin (little-plot.md "Companion"): every seed held, with count, rarity and where it came from. */
export const Route = createFileRoute('/app/little-plot/tin')({
  head: () => seo({ title: 'Seed tin · Little Plot', index: false }),
  loader: ({ context }) => preload(context, convexQuery(api.littlePlot.plots.view, {})),
  component: TinPage,
})

const ORDER = { epic: 0, rare: 1, uncommon: 2, common: 3 } as const

function TinPage() {
  const { data } = useQuery(convexQuery(api.littlePlot.plots.view, {}))
  const view = data as PlotView | undefined
  if (!view?.plot) return null
  const seeds = [...view.tin].sort((a, b) => ORDER[a.rarity] - ORDER[b.rarity] || a.name.localeCompare(b.name))
  const total = seeds.reduce((s, x) => s + x.count, 0)
  const empties = view.plot.beds.filter((b) => !b.kind).length
  return (
    <>
      <div className="flex flex-wrap items-baseline justify-between gap-2">
        <h1 className="font-display text-3xl font-bold">Seed tin</h1>
        <span className="text-sm text-muted">{total} {total === 1 ? 'seed' : 'seeds'}</span>
      </div>
      {empties > 0 && seeds.length > 0 ? <p className="text-sm">{empties} {empties === 1 ? 'bed is' : 'beds are'} empty. <Link to="/app/little-plot" className="underline underline-offset-4">Sow from the plot</Link>.</p> : null}
      <Card>
        {seeds.length === 0 ? (
          <p className="text-muted">The tin is empty. Picking a ripe bed returns seeds, and the <Link to="/app/little-plot/shed" className="underline underline-offset-4">Shed</Link> sells the common kinds.</p>
        ) : (
          <ul className="flex flex-col divide-y divide-rule">
            {seeds.map((s: Seed) => (
              <li key={s.id} className="flex items-start justify-between gap-3 py-3">
                <span className="flex min-w-0 flex-col gap-0.5">
                  <KindName name={s.name} rarity={s.rarity} className="font-semibold" />
                  <span className="text-sm text-muted">{GROUP_NAME[s.group]}{s.note ? ` · ${s.note}` : ''}{!s.grown ? ' · never grown here' : ''}</span>
                  {s.tags.length > 0 ? <span className="text-xs text-muted">{s.tags.map((t, i) => <span key={i}>{i > 0 ? ', ' : ''}{t.cutting ? `a cutting from ${t.from}` : `from ${t.from}'s plot`}</span>)}</span> : null}
                </span>
                <span className="shrink-0 font-semibold tabular-nums">× {s.count}</span>
              </li>
            ))}
          </ul>
        )}
      </Card>
    </>
  )
}
