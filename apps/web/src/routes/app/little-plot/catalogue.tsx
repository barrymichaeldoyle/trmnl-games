import { convexQuery } from '@convex-dev/react-query'
import { useQuery } from '@tanstack/react-query'
import { Link, createFileRoute } from '@tanstack/react-router'
import { api } from '@trmnl-games/backend/api'
import { preload } from '../../../lib/preload'
import { seo } from '../../../lib/seo'
import { Card } from '../../../lib/ui'
import { GROUP_NAME, RARITY_NAME, type CatalogueEntry, type PlotView, type Rarity } from '../../../lib/littlePlot'
import { Gem } from '../desk-crawler/-bagSlots'
import { KindName } from './-shared'

/** The Catalogue (little-plot.md "Crossing"): every kind with count grown, best harvest, first-grown date, and for an ungrown cross the riddle, one parent or both. */
export const Route = createFileRoute('/app/little-plot/catalogue')({
  head: () => seo({ title: 'Catalogue · Little Plot', index: false }),
  loader: ({ context }) => preload(context, convexQuery(api.littlePlot.plots.view, {})),
  component: CataloguePage,
})

const RARITIES: Rarity[] = ['common', 'uncommon', 'rare', 'epic']

function Hint({ entry }: { entry: CatalogueEntry }) {
  if (!entry.hint) return null
  if ('parents' in entry.hint) {
    if (entry.hint.more) return <>Grows from <strong>{entry.hint.parents[0]}</strong> and one other, side by side.</>
    return <>Grows from <strong>{entry.hint.parents[0]}</strong> and <strong>{entry.hint.parents[1]}</strong>, side by side.</>
  }
  return <>{entry.hint.riddle ?? (entry.source === 'trap' ? 'Something a caught gnome drops.' : entry.source === 'frost' ? 'Left behind by a cold night.' : 'Sold in the shed.')}</>
}

function CataloguePage() {
  const { data } = useQuery(convexQuery(api.littlePlot.plots.view, {}))
  const view = data as PlotView | undefined
  if (!view?.plot) return null
  return (
    <>
      <div className="flex flex-wrap items-baseline justify-between gap-2">
        <h1 className="font-display text-3xl font-bold">Catalogue</h1>
        <span className="text-sm text-muted">{view.kindsGrown} of {view.kindsTotal} grown</span>
      </div>
      <div className="flex flex-wrap items-center justify-between gap-x-4 gap-y-2 text-sm">
        <span className="flex gap-4"><Link to="/app/little-plot/achievements" className="underline underline-offset-4">Achievements</Link><Link to="/app/little-plot/rankings" className="underline underline-offset-4">Rankings</Link></span>
        <ul className="flex flex-wrap gap-x-3 gap-y-1 text-muted" aria-label="Rarity key">
          {RARITIES.map((rarity) => <li key={rarity} className="flex items-center gap-1.5"><Gem rarity={rarity} scale={2} />{RARITY_NAME[rarity]}</li>)}
        </ul>
      </div>
      {RARITIES.map((rarity) => {
        const entries = view.catalogue.filter((e) => e.rarity === rarity)
        const grown = entries.filter((e) => e.grown).length
        return (
          <Card key={rarity} title={`${RARITY_NAME[rarity]} · ${grown} of ${entries.length}`}>
            {rarity === 'rare' ? <p className="mb-3 text-sm text-muted">Never sold. A cross sets its seed when one parent ripens beside the other at bud or ripe; the beehive doubles the chance. The pairs are the same for everyone, so sharing them is fair game.</p> : null}
            {rarity === 'epic' ? <p className="mb-3 text-sm text-muted">Crosses of crosses, and one the frost leaves. A greenhouse bed ignores the season.</p> : null}
            <ul className="grid gap-3 sm:grid-cols-2">
              {entries.map((e) => (
                <li key={e.id} className={`flex flex-col gap-1 border p-3 ${e.grown ? 'border-rule' : 'border-dashed border-rule opacity-80'}`}>
                  <p className="flex flex-wrap items-center justify-between gap-2"><KindName name={e.grown || e.seeds > 0 ? e.name : '?'} rarity={e.rarity} className="font-semibold" /><span className="text-xs text-muted">{GROUP_NAME[e.group]}</span></p>
                  {e.grown ? (
                    <p className="text-sm">Grown {e.grown.count} {e.grown.count === 1 ? 'time' : 'times'}{e.grown.best > 0 ? ` · best harvest ${e.grown.best} coins` : ''}</p>
                  ) : (
                    <p className="text-sm text-muted"><Hint entry={e} /></p>
                  )}
                  {e.seeds > 0 ? <p className="text-xs text-muted">{e.seeds} {e.seeds === 1 ? 'seed' : 'seeds'} in the tin</p> : null}
                </li>
              ))}
            </ul>
          </Card>
        )
      })}
    </>
  )
}
