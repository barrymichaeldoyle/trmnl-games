import { convexQuery } from '@convex-dev/react-query'
import { useQuery } from '@tanstack/react-query'
import { createFileRoute } from '@tanstack/react-router'
import { api } from '@trmnl-games/backend/api'
import { preload } from '../../../lib/preload'
import { Card } from '../../../lib/ui'

/** The Plot page (little-plot.md "Companion"). G2 shows the beds as a list; G4 draws the grid, the tin, the shed and the catalogue. */
export const Route = createFileRoute('/app/little-plot/')({
  loader: ({ context }) => preload(context, convexQuery(api.littlePlot.plots.view, {})),
  component: PlotPage,
})

type Bed = { index: number; kind: { name: string } | null; stage: string; ripe: boolean; greenhouse: boolean }
type View = { plot: { level: number; gold: number; rows: number; cols: number; beds: Bed[]; ripeCount: number } | null; goal: { title: string }; season: { id: string; weather: string } }

function PlotPage() {
  const { data } = useQuery(convexQuery(api.littlePlot.plots.view, {}))
  const view = data as View | undefined
  if (!view?.plot) return null
  return (
    <>
      <Card title={`Level ${view.plot.level}, ${view.plot.gold} coins`}>
        <p className="text-sm text-muted">
          {view.season.id}, {view.season.weather}. Goal: {view.goal.title}.
        </p>
        <ol className="mt-3 grid gap-2" style={{ gridTemplateColumns: `repeat(${view.plot.cols}, minmax(0, 1fr))` }}>
          {view.plot.beds.map((bed) => (
            <li key={bed.index} className={`border-2 p-2 text-sm ${bed.ripe ? 'border-gold' : 'border-edge'}`}>
              {bed.kind ? `${bed.kind.name}, ${bed.stage}` : 'Empty bed'}
              {bed.greenhouse ? ' (glass)' : ''}
            </li>
          ))}
        </ol>
      </Card>
    </>
  )
}
