import { convexQuery } from '@convex-dev/react-query'
import { useQuery } from '@tanstack/react-query'
import { Link, Outlet, createFileRoute, useLocation } from '@tanstack/react-router'
import { api } from '@trmnl-games/backend/api'
import { games } from '@trmnl-games/platform'
import { requireOpenGame, useGames } from '../../lib/gameAccess'
import { Glyph, type GlyphName } from '../../lib/glyphs'
import { preload } from '../../lib/preload'
import { seo } from '../../lib/seo'
import { Card, CountBadge, LoadingState } from '../../lib/ui'
import type { Dock } from '../../lib/idleAngler'
import { useAlertOpened } from './desk-crawler/-alerts'

/**
 * Idle Angler companion shell (idle-angler.md "Companion", D115): the lifecycle gate (not-found for anyone who cannot
 * open the game yet), setup states and the tab bar for Dock, Cooler, Shop, Logbook and Settings.
 */
export const Route = createFileRoute('/app/idle-angler')({
  head: () => seo({ title: games['idle-angler'].name, index: false }),
  loader: async ({ context }) => {
    await requireOpenGame(context, 'idle-angler')
    await preload(context, convexQuery(api.idleAngler.anglers.dock, {}))
  },
  component: Shell,
})

const NAV = [
  { to: '/app/idle-angler', label: 'Dock', glyph: 'hero' },
  { to: '/app/idle-angler/cooler', label: 'Cooler', glyph: 'bag' },
  { to: '/app/idle-angler/shop', label: 'Shop', glyph: 'coin' },
  // Five tabs share a phone's width, so the last two take short names.
  { to: '/app/idle-angler/logbook', label: 'Log', glyph: 'star' },
  { to: '/app/idle-angler/settings', label: 'More', glyph: 'cog' },
] as const satisfies ReadonlyArray<{ to: string; label: string; glyph: GlyphName }>

function Shell() {
  const { data, isPending } = useQuery(convexQuery(api.idleAngler.anglers.dock, {}))
  const dock = data as Dock | undefined
  const listing = useGames()
  const status = listing?.games.find((game) => game.slug === 'idle-angler')?.status
  const settings = useLocation({ select: (location) => location.pathname.replace(/\/$/, '').endsWith('/settings') })
  // A cooler or bait alert's tap lands here with ?alert=<kind>; counted once the page is ready.
  useAlertOpened(!isPending)
  const banner = status && status !== 'live' ? <p className="mx-auto mt-3 w-full max-w-3xl px-4 text-sm font-semibold text-muted">{status === 'hidden' ? 'Hidden: only admins can see Idle Angler' : 'Preview: only admins can open Idle Angler'}</p> : null
  if (isPending) return <main id="main" className="mx-auto w-full max-w-3xl px-4 py-8"><LoadingState label="Loading Idle Angler…" /></main>
  if (dock?.gameState === 'deleting') return <main id="main" className="mx-auto w-full max-w-3xl px-4 py-8"><Card title="Removing Idle Angler progress"><p>Your account and your other games stay. You can start again from TRMNL once removal finishes.</p></Card></main>
  if (!dock?.angler) {
    return (
      <>{banner}<main id="main" className="mx-auto w-full max-w-3xl px-4 py-8">
        <Card title="Start on TRMNL">
          <p>Install the Idle Angler plugin from the TRMNL marketplace, connect it here, then save it in TRMNL. Your angler casts the first line within fifteen minutes.</p>
          <Link to="/help/idle-angler" className="mt-3 inline-flex min-h-11 items-center font-semibold underline underline-offset-4">How Idle Angler works</Link>
        </Card>
      </main></>
    )
  }
  if (dock.angler.activationState === 'pending_trmnl' && !settings) {
    return (
      <>{banner}<main id="main" className="mx-auto w-full max-w-3xl px-4 py-8">
        <Card title="Save in TRMNL to start">
          <p>Your angler is ready at the Millpond. Back in TRMNL, click <strong>Save</strong> on the Idle Angler plugin and the first cast follows.</p>
          <Link to="/help/idle-angler" className="mt-3 inline-flex min-h-11 items-center font-semibold underline underline-offset-4">Help with setup</Link>
        </Card>
      </main></>
    )
  }
  const coolerUsed = dock.angler.cooler.used
  return (
    <>
      <nav aria-label="Idle Angler" className="hud uppercase sticky top-0 z-30 border-b-4 border-raised bg-night px-2">
        <ul className="mx-auto flex min-h-13 max-w-3xl items-stretch">
          <li className="hidden items-center pr-4 pl-2 sm:flex">
            <img src="/games/idle-angler/favicon.svg" alt="" width={24} height={24} className="[image-rendering:pixelated]" />
            <span className="ml-3 text-xs whitespace-nowrap text-gold-ink">Idle Angler</span>
          </li>
          {NAV.map((item) => {
            // The Cooler tab carries how many fish are in it as a badge, like Desk Crawler's Bag tab.
            const count = item.to === '/app/idle-angler/cooler' ? coolerUsed : undefined
            return (
              <li key={item.to} className="flex-1">
                <Link
                  to={item.to}
                  activeOptions={{ exact: true }}
                  className="menu-cursor flex min-h-13 flex-col items-center justify-center gap-1 text-[0.625rem] text-muted hover:text-ink aria-[current=page]:text-gold-ink aria-[current=page]:shadow-[inset_0_-4px_0_var(--color-gold)] max-sm:before:hidden sm:flex-row sm:gap-2 sm:text-hud-sm"
                >
                  {/* On phones the badge sits on the glyph's corner; from 640px it follows the label. */}
                  <span className="relative sm:hidden lg:block">
                    <Glyph name={item.glyph} />
                    {count !== undefined ? <CountBadge count={count} className="absolute -top-2 left-3.5 flex sm:hidden" /> : null}
                  </span>
                  <span className="flex items-center">
                    {item.label}
                    {count !== undefined ? <><CountBadge count={count} className="ml-2 hidden sm:flex" /><span className="sr-only">, {count} fish</span></> : null}
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
