import { convexQuery } from '@convex-dev/react-query'
import { useQuery } from '@tanstack/react-query'
import { Link, Outlet, createFileRoute, useLocation } from '@tanstack/react-router'
import { api } from '@trmnl-games/backend/api'
import { games } from '@trmnl-games/platform'
import { requireOpenGame, useGames } from '../../lib/gameAccess'
import { Glyph, type GlyphName } from '../../lib/glyphs'
import { preload } from '../../lib/preload'
import { seo } from '../../lib/seo'
import { Card, CountBadge, LoadingState, NotifyDot } from '../../lib/ui'
import type { PlotView } from '../../lib/littlePlot'
import { useAlertOpened } from './desk-crawler/-alerts'

/**
 * Little Plot companion shell (little-plot.md "Companion", D206): the lifecycle gate (not-found for anyone who cannot
 * open the game yet), the setup states and the tab bar for Plot, Tin, Shed, Catalogue and More.
 */
export const Route = createFileRoute('/app/little-plot')({
  head: () => seo({ title: games['little-plot'].name, index: false }),
  loader: async ({ context }) => {
    await requireOpenGame(context, 'little-plot')
    await preload(context, convexQuery(api.littlePlot.plots.view, {}))
  },
  component: Shell,
})

const NAV = [
  { to: '/app/little-plot', label: 'Plot', glyph: 'hero' },
  { to: '/app/little-plot/tin', label: 'Tin', glyph: 'bag' },
  { to: '/app/little-plot/shed', label: 'Shed', glyph: 'coin' },
  { to: '/app/little-plot/catalogue', label: 'Kinds', glyph: 'star' },
  { to: '/app/little-plot/settings', label: 'More', glyph: 'cog' },
] as const satisfies ReadonlyArray<{ to: string; label: string; glyph: GlyphName }>

function Shell() {
  const { data, isPending } = useQuery(convexQuery(api.littlePlot.plots.view, {}))
  const view = data as PlotView | undefined
  const listing = useGames()
  const status = listing?.games.find((game) => game.slug === 'little-plot')?.status
  const settings = useLocation({ select: (location) => location.pathname.replace(/\/$/, '').endsWith('/settings') })
  useAlertOpened(!isPending)
  const banner = status && status !== 'live' ? <p className="mx-auto mt-3 w-full max-w-3xl px-4 text-sm font-semibold text-muted">{status === 'hidden' ? 'Hidden: only admins can see Little Plot' : 'Preview: only admins can open Little Plot'}</p> : null
  if (isPending) return <main id="main" className="mx-auto w-full max-w-3xl px-4 py-8"><LoadingState label="Loading Little Plot…" /></main>
  if (view?.gameState === 'deleting') return <main id="main" className="mx-auto w-full max-w-3xl px-4 py-8"><Card title="Deleting your Little Plot progress"><p>Your account and your other games stay. Once it’s done, you can start again from TRMNL.</p></Card></main>
  if (!view?.plot) {
    return (
      <>{banner}<main id="main" className="mx-auto w-full max-w-3xl px-4 py-8">
        <Card title="Start on TRMNL">
          <p>Install the Little Plot plugin from the TRMNL marketplace, connect it here, then save it in TRMNL. Your four beds start growing within fifteen minutes.</p>
          <Link to="/help/little-plot" className="mt-3 inline-flex min-h-11 items-center font-semibold underline underline-offset-4">How Little Plot works</Link>
        </Card>
      </main></>
    )
  }
  if (view.plot.activationState === 'pending_trmnl' && !settings) {
    return (
      <>{banner}<main id="main" className="mx-auto flex w-full max-w-3xl flex-col gap-6 px-4 py-8">
        <Card title="One more step in TRMNL">
          <p>The seeds are in. Click <strong>Save</strong> on the Little Plot plugin in TRMNL and the plot will start growing.</p>
          <Link to="/help/little-plot" className="mt-3 inline-flex min-h-11 items-center font-semibold underline underline-offset-4">Help with setup</Link>
        </Card>
      </main></>
    )
  }
  const ripe = view.plot.ripeCount
  const rewardWaiting = (view.waiting?.count ?? 0) > 0
  return (
    <>
      <nav aria-label="Little Plot" className="hud uppercase sticky top-0 z-30 border-b-4 border-raised bg-night px-2 max-[359px]:px-1">
        <ul className="mx-auto flex min-h-13 max-w-3xl items-stretch">
          <li className="hidden items-center pr-4 pl-2 sm:flex">
            <img src="/games/little-plot/favicon.svg" alt="" width={24} height={24} className="[image-rendering:pixelated]" />
            <span className="ml-3 text-xs whitespace-nowrap text-gold-ink">Little Plot</span>
          </li>
          {NAV.map((item) => {
            // The Plot tab carries the ripe count as a badge, so a bed waiting to be picked is seen from any tab.
            const count = item.to === '/app/little-plot' && ripe > 0 ? ripe : undefined
            const dot = item.to === '/app/little-plot' && rewardWaiting && ripe === 0
            return (
              <li key={item.to} className="flex-1">
                <Link
                  to={item.to}
                  activeOptions={{ exact: true }}
                  className="menu-cursor flex min-h-13 flex-col items-center justify-center gap-1 text-[0.625rem] max-[359px]:text-[0.5625rem] text-muted hover:text-ink aria-[current=page]:text-gold-ink aria-[current=page]:shadow-[inset_0_-4px_0_var(--color-gold)] max-sm:before:hidden sm:flex-row sm:gap-2 sm:text-hud-sm"
                >
                  <span className="relative sm:hidden lg:block">
                    <Glyph name={item.glyph} />
                    {count !== undefined ? <CountBadge count={count} className="absolute -top-2 left-3.5 flex sm:hidden" /> : null}
                    {dot ? <NotifyDot className="absolute -top-1 left-4 sm:hidden" /> : null}
                  </span>
                  <span className="flex items-center">
                    {item.label}
                    {count !== undefined ? <><CountBadge count={count} className="ml-2 hidden sm:flex" /><span className="sr-only">{count} ripe</span></> : null}
                    {dot ? <><NotifyDot className="ml-2 hidden sm:block" /><span className="sr-only">A reward is waiting</span></> : null}
                  </span>
                </Link>
              </li>
            )
          })}
        </ul>
      </nav>
      {banner}
      <main id="main" className="mx-auto flex w-full max-w-3xl min-w-0 flex-col gap-6 px-3 pt-6 min-[375px]:px-4 pb-[max(2rem,env(safe-area-inset-bottom))]">
        <Outlet />
      </main>
    </>
  )
}
