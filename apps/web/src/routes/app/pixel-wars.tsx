import { convexQuery } from '@convex-dev/react-query'
import { useQuery } from '@tanstack/react-query'
import { Link, Outlet, createFileRoute, useLocation } from '@tanstack/react-router'
import { api } from '@trmnl-games/backend/api'
import { games } from '@trmnl-games/platform'
import { requireOpenGame, useGames } from '../../lib/gameAccess'
import { Glyph, type GlyphName } from '../../lib/glyphs'
import { preload } from '../../lib/preload'
import { seo } from '../../lib/seo'
import { Card, LoadingState, NotifyDot } from '../../lib/ui'
import type { WarView } from '../../lib/pixelWars'

/**
 * Pixel Wars companion shell (pixel-wars.md "Companion", D214): the lifecycle gate (not-found for anyone who cannot
 * open the game yet), the setup states and the tab bar for Map, Season, Rankings, Achievements and More. An invite
 * link carries `?invite=<code>`, which the Map page's side picker passes on.
 */
export const Route = createFileRoute('/app/pixel-wars')({
  validateSearch: (search: Record<string, unknown>): { invite?: string } => (typeof search.invite === 'string' && /^[a-z0-9]{4,16}$/.test(search.invite) ? { invite: search.invite } : {}),
  head: () => seo({ title: games['pixel-wars'].name, index: false }),
  loader: async ({ context }) => {
    await requireOpenGame(context, 'pixel-wars')
    await preload(context, convexQuery(api.pixelWars.desks.view, {}))
  },
  component: Shell,
})

const NAV = [
  { to: '/app/pixel-wars', label: 'Map', glyph: 'flag' },
  { to: '/app/pixel-wars/season', label: 'Season', glyph: 'bell' },
  { to: '/app/pixel-wars/rankings', label: 'Ranks', glyph: 'trophy' },
  { to: '/app/pixel-wars/achievements', label: 'Badges', glyph: 'medal' },
  { to: '/app/pixel-wars/settings', label: 'More', glyph: 'cog' },
] as const satisfies ReadonlyArray<{ to: string; label: string; glyph: GlyphName }>

function Shell() {
  const { data, isPending } = useQuery(convexQuery(api.pixelWars.desks.view, {}))
  const view = data as WarView | undefined
  const listing = useGames()
  const status = listing?.games.find((game) => game.slug === 'pixel-wars')?.status
  const settings = useLocation({ select: (location) => location.pathname.replace(/\/$/, '').endsWith('/settings') })
  const banner = status && status !== 'live' ? <p className="mx-auto mt-3 w-full max-w-3xl px-4 text-sm font-semibold text-muted">{status === 'hidden' ? 'Hidden: only admins can see Pixel Wars' : 'Preview: only admins can open Pixel Wars'}</p> : null
  if (isPending) return <main id="main" className="mx-auto w-full max-w-3xl px-4 py-8"><LoadingState label="Loading Pixel Wars…" /></main>
  if (view?.gameState === 'deleting') return <main id="main" className="mx-auto w-full max-w-3xl px-4 py-8"><Card title="Deleting your Pixel Wars progress"><p>Your account and your other games stay. Once it’s done, you can start again from TRMNL.</p></Card></main>
  if (!view?.desk) {
    return (
      <>{banner}<main id="main" className="mx-auto w-full max-w-3xl px-4 py-8">
        <Card title="Start on TRMNL">
          <p>Install the Pixel Wars plugin from the TRMNL marketplace, connect it here, then save it in TRMNL. Pick a side and your desk joins the map within fifteen minutes.</p>
          <Link to="/help/pixel-wars" className="mt-3 inline-flex min-h-11 items-center font-semibold underline underline-offset-4">How Pixel Wars works</Link>
        </Card>
      </main></>
    )
  }
  if (view.desk.activationState === 'pending_trmnl' && !settings) {
    return (
      <>{banner}<main id="main" className="mx-auto flex w-full max-w-3xl flex-col gap-6 px-4 py-8">
        <Card title="One more step in TRMNL">
          <p>Click <strong>Save</strong> on the Pixel Wars plugin in TRMNL. Then pick a side here and your desk goes on the map.</p>
          <Link to="/help/pixel-wars" className="mt-3 inline-flex min-h-11 items-center font-semibold underline underline-offset-4">Help with setup</Link>
        </Card>
      </main></>
    )
  }
  const fallen = view.desk.own !== null && view.desk.faction !== 0 && view.desk.own.faction !== view.desk.faction
  return (
    <>
      <nav aria-label="Pixel Wars" className="hud uppercase sticky top-0 z-30 border-b-4 border-raised bg-night px-2 max-[359px]:px-1">
        <ul className="mx-auto flex min-h-13 max-w-3xl items-stretch">
          <li className="hidden items-center pr-4 pl-2 sm:flex">
            <img src="/games/pixel-wars/favicon.svg" alt="" width={24} height={24} className="[image-rendering:pixelated]" />
            <span className="ml-3 text-xs whitespace-nowrap text-gold-ink">Pixel Wars</span>
          </li>
          {NAV.map((item) => {
            const dot = item.to === '/app/pixel-wars' && (fallen || view.desk!.faction === 0)
            return (
              <li key={item.to} className="flex-1">
                <Link to={item.to} activeOptions={{ exact: item.to === '/app/pixel-wars' }} className="menu-cursor relative flex min-h-13 flex-col items-center justify-center gap-0.5 px-1 py-1 text-[0.6rem] text-gold no-underline before:hidden hover:text-gold-hi [&.active]:bg-raised [&.active]:text-gold-hi" activeProps={{ 'aria-current': 'page' }}>
                  <Glyph name={item.glyph} size={16} />
                  <span>{item.label}</span>
                  {dot ? <NotifyDot className="absolute top-1.5 right-[calc(50%-14px)]" /> : null}
                </Link>
              </li>
            )
          })}
        </ul>
      </nav>
      {banner}
      <main id="main" className="mx-auto flex w-full max-w-3xl flex-col gap-6 px-4 py-6">
        <Outlet />
      </main>
    </>
  )
}
