import { convexQuery } from '@convex-dev/react-query'
import { useQuery } from '@tanstack/react-query'
import { Link, Outlet, createFileRoute, useLocation } from '@tanstack/react-router'
import { api } from '@trmnl-games/backend/api'
import { Card, CountBadge, LoadingState, NotifyDot } from '../../lib/ui'
import { seo } from '../../lib/seo'
import { NameRepair } from './desk-crawler/-nameRepair'
import { preload } from '../../lib/preload'
import { captureAnalytics } from '../../lib/analytics'
import { useAnalyticsView } from '../../lib/analyticsProvider'
import { SwitchAccount } from '../../lib/switchAccount'
import { InstallLink } from '../../lib/deskCrawlerPitch'
import { Glyph, type GlyphName } from '../../lib/glyphs'
import { useAlertOpened } from './desk-crawler/-alerts'
import { gamesQuery } from '../../lib/gameAccess'
import { messagesFor, useT } from '../../lib/i18n'
import { dcShellMessages } from '../../i18n/dcShell'

/** Companion shell: auth gate, setup states and mobile-first navigation (companion.md). */
export const Route = createFileRoute('/app/desk-crawler')({
  head: ({ match: { context: { locale } } }) => seo({ title: messagesFor(dcShellMessages, locale).title, index: false, locale }),
  // The listing feeds the header's game switcher, so it is in the server render too.
  loader: ({ context }) => preload(context, convexQuery(api.users.me, {}), gamesQuery),
  component: AppShell,
})

/**
 * Five tabs, the shape Idle Angler uses (D124): play on Hero, gear on Bag, what happened on Log, standing on Ranks, and
 * everything else behind More. Five share a phone's width, so the last three take short names.
 */
const NAV = [
  { to: '/app/desk-crawler', label: 'hero', glyph: 'hero' },
  { to: '/app/desk-crawler/inventory', label: 'bag', glyph: 'bag' },
  { to: '/app/desk-crawler/log', label: 'log', glyph: 'quest' },
  { to: '/app/desk-crawler/leaderboard', label: 'ranks', glyph: 'trophy' },
  { to: '/app/desk-crawler/settings', label: 'more', glyph: 'cog' },
] as const satisfies ReadonlyArray<{ to: string; label: keyof (typeof dcShellMessages)['en']['nav']; glyph: GlyphName }>

function AppShell() {
  return <SignedInApp />
}

function SignedInApp() {
  const { data: me, isPending } = useQuery(convexQuery(api.users.me, {}))
  // The Bag tab shows how full the bag is, so a new find is visible from any tab.
  const { data: bag } = useQuery(convexQuery(api.inventory.mine, {}))
  const bagUsed = (bag as { used: number } | null | undefined)?.used
  // The Hero tab shows a dot while a goal reward waits for its Claim button, so it is seen from any tab.
  const { data: heroView } = useQuery(convexQuery(api.heroes.mine, {}))
  const rewardWaiting = ((heroView as { career?: { unclaimed?: unknown[] } | null } | null | undefined)?.career?.unclaimed?.length ?? 0) > 0
  const setupState = !me?.hero ? (me?.hasActiveInstallation ? 'installation_without_hero' : 'not_enrolled') : me.hero.activationState === 'pending_trmnl' ? 'waiting_for_save' : 'active'
  useAnalyticsView(setupState === 'active' ? 'companion ready' : 'setup screen shown', { setup_state: setupState, has_active_installation: me?.hasActiveInstallation ?? false }, !isPending && me?.user?.state !== 'deleting' && me?.gameState !== 'deleting')
  // P33: an alert's tap lands here with ?alert=<kind>; counted once identity is known.
  useAlertOpened(!isPending)
  const settings = useLocation({ select: (location) => location.pathname.replace(/\/$/, '').endsWith('/settings') })
  const t = useT(dcShellMessages)
  if (isPending) return <main id="main" className="mx-auto w-full max-w-3xl px-4 py-8"><LoadingState label={t.loading} /></main>
  if (me?.gameState === 'deleting') return <main id="main" className="mx-auto w-full max-w-3xl px-4 py-8"><Card title={t.removingTitle}><p>{t.removingBody}</p></Card></main>
  if (!me?.hero) {
    return (
      <main id="main" className="mx-auto w-full max-w-3xl px-4 py-8">
        <Card title={me?.hasActiveInstallation ? t.reconnectTitle : t.startTitle}>
          {me?.hasActiveInstallation ? <>
            <p>{t.reconnectBody}</p>
            <p className="mt-3 text-sm text-muted">{t.reconnectQr}</p>
          </> : <>
            <p>{t.startBody}</p>
            <InstallLink place="start card" className="mt-3" />
          </>}
          <div className="mt-3"><SwitchAccount returnTo="/app/desk-crawler" /></div>
          <Link to="/help/desk-crawler" onClick={() => captureAnalytics('setup help opened', { setup_state: setupState })} className="mt-3 inline-flex min-h-11 items-center font-semibold underline underline-offset-4">{t.howToConnect}</Link>
        </Card>
      </main>
    )
  }
  if (me.hero.activationState === 'pending_trmnl' && !settings) {
    return (
      <main id="main" className="mx-auto w-full max-w-3xl px-4 py-8">
        <Card title={t.saveTitle}>
          <p>
            <strong>{me.hero.name}</strong>{t.readyAfter}<strong>{t.save}</strong>{t.readyEnd}
          </p>
          <Link to="/help/desk-crawler" onClick={() => captureAnalytics('setup help opened', { setup_state: setupState })} className="mt-3 inline-flex min-h-11 items-center font-semibold underline underline-offset-4">{t.helpWithSetup}</Link>
          <Link to="/app/desk-crawler/settings" className="ml-4 inline-flex min-h-11 items-center underline underline-offset-4">{t.settings}</Link>
        </Card>
      </main>
    )
  }
  return (
    <>
      <nav aria-label={t.navLabel} className="hud uppercase sticky top-0 z-30 border-b-4 border-raised bg-night px-2">
        {/* One width on every tab: following the page width made the tabs resize and jump when switching. */}
        <ul className="mx-auto flex min-h-13 max-w-3xl items-stretch">
          <li className="hidden items-center pr-4 pl-2 sm:flex">
            <img src="/games/desk-crawler/favicon.svg" alt="" width={24} height={24} className="[image-rendering:pixelated]" />
            <span className="ml-3 text-xs text-gold-ink">Desk Crawler</span>
          </li>
          {NAV.map((item) => {
            // The Bag tab carries how many slots are used as a badge, like a notification count.
            const count = item.to === '/app/desk-crawler/inventory' ? bagUsed : undefined
            const dot = item.to === '/app/desk-crawler' && rewardWaiting
            return (
              <li key={item.to} className="flex-1">
                <Link
                  to={item.to}
                  activeOptions={{ exact: true }}
                  className="menu-cursor flex min-h-13 flex-col items-center justify-center gap-1 text-[0.625rem] text-muted hover:text-ink aria-[current=page]:text-gold-ink aria-[current=page]:shadow-[inset_0_-4px_0_var(--color-gold)] max-sm:before:hidden sm:flex-row sm:gap-2 sm:text-hud-sm"
                >
                  {/* The tab's glyph carries recognition on phones, where the pixel label is at its smallest. On phones the
                      badge sits on its corner; from 640px, where the glyph hides or sits beside the label, it follows the label. */}
                  <span className="relative sm:hidden lg:block">
                    <Glyph name={item.glyph} />
                    {count !== undefined ? <CountBadge count={count} className="absolute -top-2 left-3.5 flex sm:hidden" /> : null}
                    {dot ? <NotifyDot className="absolute -top-1 left-4 sm:hidden" /> : null}
                  </span>
                  <span className="flex items-center">
                    {t.nav[item.label]}
                    {count !== undefined ? <><CountBadge count={count} className="ml-2 hidden sm:flex" /><span className="sr-only">{t.slotsUsed(count)}</span></> : null}
                    {dot ? <><NotifyDot className="ml-2 hidden sm:block" /><span className="sr-only">{t.rewardReady}</span></> : null}
                  </span>
                </Link>
              </li>
            )
          })}
        </ul>
      </nav>
      <main id="main" className="mx-auto flex w-full max-w-3xl min-w-0 flex-col gap-8 px-3 pt-6 min-[375px]:px-4 pb-[max(2rem,env(safe-area-inset-bottom))]">
        {me.user?.nameRepairRequired ? <NameRepair /> : null}
        <Outlet />
      </main>
    </>
  )
}
