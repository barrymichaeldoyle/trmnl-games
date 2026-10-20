import { convexQuery } from '@convex-dev/react-query'
import { useQuery } from '@tanstack/react-query'
import { Link, Outlet, createFileRoute, useLocation } from '@tanstack/react-router'
import { api } from '@trmnl-games/backend/api'
import { games } from '@trmnl-games/platform'
import { requireOpenGame, useGames } from '../../lib/gameAccess'
import { Glyph, type GlyphName } from '../../lib/glyphs'
import { preload } from '../../lib/preload'
import { seo } from '../../lib/seo'
import { BUTTON_PRIMARY, Card, CountBadge, LINK_BUTTON, LoadingState, NotifyDot } from '../../lib/ui'
import { captureAnalytics } from '../../lib/analytics'
import { IDLE_ANGLER_MARKETPLACE_URL } from '../../lib/idleAnglerPitch'
import { NotifyMe } from '../../lib/launchList'
import type { Dock } from '../../lib/idleAngler'
import { useAlertOpened } from './desk-crawler/-alerts'
import { useT } from '../../lib/i18n'
import { iaCommon } from '../../i18n/ia'
import { homeMessages } from '../../i18n/home'
import { pitchMessages } from '../../i18n/pitch'

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
  { to: '/app/idle-angler', key: 'dock', glyph: 'hero' },
  { to: '/app/idle-angler/cooler', key: 'cooler', glyph: 'bag' },
  { to: '/app/idle-angler/shop', key: 'shop', glyph: 'coin' },
  // Five tabs share a phone's width, so each label stays about six characters in every language.
  { to: '/app/idle-angler/logbook', key: 'log', glyph: 'star' },
  { to: '/app/idle-angler/settings', key: 'more', glyph: 'cog' },
] as const satisfies ReadonlyArray<{ to: string; key: string; glyph: GlyphName }>

function Shell() {
  const { data, isPending } = useQuery(convexQuery(api.idleAngler.anglers.dock, {}))
  const dock = data as Dock | undefined
  const t = useT(iaCommon)
  const home = useT(homeMessages)
  const pitch = useT(pitchMessages)
  const listing = useGames()
  const status = listing?.games.find((game) => game.slug === 'idle-angler')?.status
  const settings = useLocation({ select: (location) => location.pathname.replace(/\/$/, '').endsWith('/settings') })
  // A cooler or bait alert's tap lands here with ?alert=<kind>; counted once the page is ready.
  useAlertOpened(!isPending)
  const banner = status && status !== 'live' ? <p className="mx-auto mt-3 w-full max-w-3xl px-4 text-sm font-semibold text-muted">{status === 'hidden' ? t.hidden : t.preview}</p> : null
  if (isPending) return <main id="main" className="mx-auto w-full max-w-3xl px-4 py-8"><LoadingState label={t.loading} /></main>
  if (dock?.gameState === 'deleting') return <main id="main" className="mx-auto w-full max-w-3xl px-4 py-8"><Card title={t.deletingTitle}><p>{t.deletingBody}</p></Card></main>
  if (!dock?.angler) {
    return (
      <>{banner}<main id="main" className="mx-auto w-full max-w-3xl px-4 py-8">
        <Card title={t.startTitle}>
          {/* D210: until TRMNL lists the plugin there is nothing to install, so the card says so and offers Notify me. */}
          {IDLE_ANGLER_MARKETPLACE_URL ? (
            <>
              <p>{t.startBody}</p>
              <a href={IDLE_ANGLER_MARKETPLACE_URL} onClick={() => captureAnalytics('install link opened', { place: 'idle angler start card', game: 'idle-angler' })} className={`mt-3 self-start ${LINK_BUTTON} ${BUTTON_PRIMARY}`}>{pitch.installOnTrmnl}</a>
            </>
          ) : (
            <div className="flex flex-col gap-3">
              <p className="text-sm font-semibold text-ink">{home.inReview}</p>
              <p>{home.startInReview}</p>
              <NotifyMe gameSlug="idle-angler" />
            </div>
          )}
          <Link to="/games/idle-angler" className="mt-3 inline-flex min-h-11 items-center font-semibold underline underline-offset-4">{t.howItWorks}</Link>
        </Card>
      </main></>
    )
  }
  if (dock.angler.activationState === 'pending_trmnl' && !settings) {
    return (
      <>{banner}<main id="main" className="mx-auto w-full max-w-3xl px-4 py-8">
        <Card title={t.saveTitle}>
          <p>{t.saveBefore}<strong>{t.saveWord}</strong>{t.saveAfter}</p>
          <Link to="/help/idle-angler" className="mt-3 inline-flex min-h-11 items-center font-semibold underline underline-offset-4">{t.setupHelp}</Link>
        </Card>
      </main></>
    )
  }
  const coolerUsed = dock.angler.cooler.used
  // The Dock tab shows a dot while a goal reward waits for its Claim button, so it is seen from any tab.
  const rewardWaiting = (dock.full?.goal.unclaimed?.length ?? 0) > 0
  return (
    <>
      <nav aria-label="Idle Angler" className="hud uppercase sticky top-0 z-30 border-b-4 border-raised bg-night px-2 max-[359px]:px-1">
        <ul className="mx-auto flex min-h-13 max-w-3xl items-stretch">
          <li className="hidden items-center pr-4 pl-2 sm:flex">
            <img src="/games/idle-angler/favicon.svg" alt="" width={24} height={24} className="[image-rendering:pixelated]" />
            <span className="ml-3 text-xs whitespace-nowrap text-gold-ink">Idle Angler</span>
          </li>
          {NAV.map((item) => {
            // The Cooler tab carries how many fish are in it as a badge, like Desk Crawler's Bag tab; an empty cooler has none.
            const count = item.to === '/app/idle-angler/cooler' && coolerUsed > 0 ? coolerUsed : undefined
            const dot = item.to === '/app/idle-angler' && rewardWaiting
            return (
              <li key={item.to} className="flex-1">
                <Link
                  to={item.to}
                  activeOptions={{ exact: true }}
                  className="menu-cursor flex min-h-13 flex-col items-center justify-center gap-1 text-[0.625rem] max-[359px]:text-[0.5625rem] text-muted hover:text-ink aria-[current=page]:text-gold-ink aria-[current=page]:shadow-[inset_0_-4px_0_var(--color-gold)] max-sm:before:hidden sm:flex-row sm:gap-2 sm:text-hud-sm"
                >
                  {/* On phones the badge sits on the glyph's corner; from 640px it follows the label. */}
                  <span className="relative sm:hidden lg:block">
                    <Glyph name={item.glyph} />
                    {count !== undefined ? <CountBadge count={count} className="absolute -top-2 left-3.5 flex sm:hidden" /> : null}
                    {dot ? <NotifyDot className="absolute -top-1 left-4 sm:hidden" /> : null}
                  </span>
                  <span className="flex items-center">
                    {t.nav[item.key]}
                    {count !== undefined ? <><CountBadge count={count} className="ml-2 hidden sm:flex" /><span className="sr-only">{t.fishCount(count)}</span></> : null}
                    {dot ? <><NotifyDot className="ml-2 hidden sm:block" /><span className="sr-only">{t.rewardWaiting}</span></> : null}
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
