import { convexQuery } from '@convex-dev/react-query'
import { useQuery } from '@tanstack/react-query'
import { Outlet, createFileRoute } from '@tanstack/react-router'
import { api } from '@trmnl-games/backend/api'
import { games } from '@trmnl-games/platform'
import { requireOpenGame, useGames } from '../../lib/gameAccess'
import { preload } from '../../lib/preload'
import { seo } from '../../lib/seo'
import { Card, LoadingState } from '../../lib/ui'

/**
 * Little Plot companion shell (little-plot.md "Companion", D206): the lifecycle gate (not-found for anyone who cannot
 * open the game yet) and the setup states. G4 adds the tab bar and the pages; until then the shell holds the Plot page.
 */
export const Route = createFileRoute('/app/little-plot')({
  head: () => seo({ title: games['little-plot'].name, index: false }),
  loader: async ({ context }) => {
    await requireOpenGame(context, 'little-plot')
    await preload(context, convexQuery(api.littlePlot.plots.view, {}))
  },
  component: Shell,
})

function Shell() {
  const { data, isPending } = useQuery(convexQuery(api.littlePlot.plots.view, {}))
  const view = data as { gameState: string | null; plot: { activationState: 'pending_trmnl' | 'active' } | null } | undefined
  const listing = useGames()
  const status = listing?.games.find((game) => game.slug === 'little-plot')?.status
  const banner = status && status !== 'live' ? <p className="mx-auto mt-3 w-full max-w-3xl px-4 text-sm font-semibold text-muted">{status === 'hidden' ? 'Hidden: only admins can see Little Plot' : 'Preview: only admins can open Little Plot'}</p> : null
  if (isPending) return <main id="main" className="mx-auto w-full max-w-3xl px-4 py-8"><LoadingState label="Loading Little Plot…" /></main>
  if (view?.gameState === 'deleting') return <main id="main" className="mx-auto w-full max-w-3xl px-4 py-8"><Card title="Deleting your Little Plot progress"><p>Your account and your other games stay. Once it’s done, you can start again from TRMNL.</p></Card></main>
  if (!view?.plot) {
    return (
      <>{banner}<main id="main" className="mx-auto w-full max-w-3xl px-4 py-8">
        <Card title="Start on TRMNL">
          <p>Install the Little Plot plugin from the TRMNL marketplace, connect it here, then save it in TRMNL. Your four beds start growing within fifteen minutes.</p>
        </Card>
      </main></>
    )
  }
  if (view.plot.activationState === 'pending_trmnl') {
    return (
      <>{banner}<main id="main" className="mx-auto flex w-full max-w-3xl flex-col gap-6 px-4 py-8">
        <Card title="One more step in TRMNL">
          <p>The seeds are in. Click <strong>Save</strong> on the Little Plot plugin in TRMNL and the plot will start growing.</p>
        </Card>
      </main></>
    )
  }
  return (
    <>
      {banner}
      <main id="main" className="mx-auto flex w-full max-w-3xl flex-col gap-6 px-4 py-6">
        <Outlet />
      </main>
    </>
  )
}
