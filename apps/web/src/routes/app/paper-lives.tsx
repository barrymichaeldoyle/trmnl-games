import { convexQuery } from '@convex-dev/react-query'
import { useQuery } from '@tanstack/react-query'
import { Link, Outlet, createFileRoute, useLocation } from '@tanstack/react-router'
import { api } from '@trmnl-games/backend/api'
import { games } from '@trmnl-games/platform'
import { requireOpenGame, useGames } from '../../lib/gameAccess'
import { Glyph, type GlyphName } from '../../lib/glyphs'
import { preload } from '../../lib/preload'
import { seo } from '../../lib/seo'
import { Card, LoadingState } from '../../lib/ui'
import { useAlertOpened } from './desk-crawler/-alerts'
import type { LifeView } from '../../lib/paperLives'

/**
 * Paper Lives companion shell (paper-lives.md "Companion", D159): the lifecycle gate (not-found for anyone who cannot
 * open the game yet), setup states and the tab bar for Life, People, Work, Album and More.
 */
export const Route = createFileRoute('/app/paper-lives')({
  head: () => seo({ title: games['paper-lives'].name, index: false }),
  loader: async ({ context }) => {
    await requireOpenGame(context, 'paper-lives')
    await preload(context, convexQuery(api.paperLives.lives.view, {}))
  },
  component: Shell,
})

const NAV = [
  { to: '/app/paper-lives', label: 'Life', glyph: 'hero' },
  { to: '/app/paper-lives/people', label: 'People', glyph: 'heart' },
  { to: '/app/paper-lives/work', label: 'Work', glyph: 'coin' },
  { to: '/app/paper-lives/album', label: 'Album', glyph: 'star' },
  { to: '/app/paper-lives/settings', label: 'More', glyph: 'cog' },
] as const satisfies ReadonlyArray<{ to: string; label: string; glyph: GlyphName }>

function Shell() {
  const { data, isPending } = useQuery(convexQuery(api.paperLives.lives.view, {}))
  const view = data as LifeView | undefined
  const listing = useGames()
  const status = listing?.games.find((game) => game.slug === 'paper-lives')?.status
  useAlertOpened(!isPending)
  const settings = useLocation({ select: (location) => location.pathname.replace(/\/$/, '').endsWith('/settings') })
  const banner = status && status !== 'live' ? <p className="mx-auto mt-3 w-full max-w-3xl px-4 text-sm font-semibold text-muted">{status === 'hidden' ? 'Hidden: only admins can see Paper Lives' : 'Preview: only admins can open Paper Lives'}</p> : null
  if (isPending) return <main id="main" className="mx-auto w-full max-w-3xl px-4 py-8"><LoadingState label="Loading Paper Lives…" /></main>
  if (view?.gameState === 'deleting') return <main id="main" className="mx-auto w-full max-w-3xl px-4 py-8"><Card title="Removing Paper Lives progress"><p>Your account and your other games stay. You can start again from TRMNL once removal finishes.</p></Card></main>
  if (!view?.life) {
    return (
      <>{banner}<main id="main" className="mx-auto w-full max-w-3xl px-4 py-8">
        <Card title="Start on TRMNL">
          <p>Install the Paper Lives plugin from the TRMNL marketplace, connect it here, then save it in TRMNL. A life begins within fifteen minutes.</p>
          <Link to="/help/paper-lives" className="mt-3 inline-flex min-h-11 items-center font-semibold underline underline-offset-4">How Paper Lives works</Link>
        </Card>
      </main></>
    )
  }
  if (view.life.activationState === 'pending_trmnl' && !settings) {
    return (
      <>{banner}<main id="main" className="mx-auto w-full max-w-3xl px-4 py-8">
        <Card title="Save in TRMNL to start">
          <p>{view.life.first} {view.life.last} is about to be born. Back in TRMNL, click <strong>Save</strong> on the Paper Lives plugin and the first years begin.</p>
          <Link to="/help/paper-lives" className="mt-3 inline-flex min-h-11 items-center font-semibold underline underline-offset-4">Help with setup</Link>
        </Card>
      </main></>
    )
  }
  return (
    <>
      <nav aria-label="Paper Lives" className="hud uppercase sticky top-0 z-30 border-b-4 border-raised bg-night px-2">
        <ul className="mx-auto flex min-h-13 max-w-3xl items-stretch">
          <li className="hidden items-center pr-4 pl-2 sm:flex">
            <span className="text-xs whitespace-nowrap text-gold-ink">Paper Lives</span>
          </li>
          {NAV.map((item) => (
            <li key={item.to} className="flex-1">
              <Link
                to={item.to}
                activeOptions={{ exact: true }}
                className="menu-cursor flex min-h-13 flex-col items-center justify-center gap-1 text-[0.625rem] text-muted hover:text-ink aria-[current=page]:text-gold-ink aria-[current=page]:shadow-[inset_0_-4px_0_var(--color-gold)] max-sm:before:hidden sm:flex-row sm:gap-2 sm:text-hud-sm"
              >
                <span className="sm:hidden lg:block"><Glyph name={item.glyph} /></span>
                <span>{item.label}</span>
              </Link>
            </li>
          ))}
        </ul>
      </nav>
      {banner}
      <main id="main" className="mx-auto flex w-full max-w-3xl min-w-0 flex-col gap-6 px-3 pt-6 min-[375px]:px-4 pb-[max(2rem,env(safe-area-inset-bottom))]">
        <Outlet />
      </main>
    </>
  )
}
