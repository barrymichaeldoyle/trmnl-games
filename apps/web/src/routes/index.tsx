import { Show } from '@clerk/tanstack-react-start'
import { convexQuery } from '@convex-dev/react-query'
import { useQuery } from '@tanstack/react-query'
import { Link, createFileRoute } from '@tanstack/react-router'
import { api } from '@trmnl-games/backend/api'
import { games } from '@trmnl-games/platform'
import { useConvexAuth } from 'convex/react'
import type { ReactNode } from 'react'
import { InstallCta, ScreenBezel } from '../lib/deskCrawlerPitch'
import { FLOORS } from '../lib/facts.gen'
import { Glyph, type GlyphName } from '../lib/glyphs'
import { changeDay, latestChanges } from '../lib/changelogRecent'
import { IA_PITCH, IDLE_ANGLER_MARKETPLACE_URL, IdleAnglerCta, useMyAngler } from '../lib/idleAnglerPitch'
import { NotifyMe } from '../lib/launchList'
import { SITE_FRAME } from '../lib/platformHeader'
import { SiteShell } from '../lib/prose'
import { BUTTON_PRIMARY, BUTTON_SECONDARY, LINK_BUTTON } from '../lib/ui'
import { DESK_CRAWLER_JSON_LD, IDLE_ANGLER_JSON_LD, SITE_JSON_LD, seo } from '../lib/seo'
import { messagesFor, useLocale, useT } from '../lib/i18n'
import { headMessages } from '../i18n/heads'
import { homeMessages } from '../i18n/home'
import { iaGamePage } from '../i18n/iaGamePage'
import { pitchMessages } from '../i18n/pitch'
import { shellMessages } from '../i18n/shell'

export const Route = createFileRoute('/')({
  head: ({ match: { context: { locale } } }) => seo({
    path: '/',
    locale,
    description: messagesFor(headMessages, locale).home,
    jsonLd: { '@context': 'https://schema.org', '@graph': [SITE_JSON_LD, DESK_CRAWLER_JSON_LD, IDLE_ANGLER_JSON_LD].map(({ '@context': _, ...node }) => node) },
  }),
  // No loader: the page is static, and the signed-in player's games load in the browser after it.
  component: Home,
})

/**
 * The signed-in player's games above the pitch (D210): each game's character and status with the way in, or, for a game
 * they have not started, its page (Desk Crawler) or the in-review state with Notify me (Idle Angler before its listing).
 */
function YourGames() {
  const t = useT(homeMessages)
  const shell = useT(shellMessages)
  const { isAuthenticated } = useConvexAuth()
  const { data: me } = useQuery({ ...convexQuery(api.users.me, {}), enabled: isAuthenticated })
  const angler = useMyAngler()
  if (!me) return null
  const rows: Array<{ slug: 'desk-crawler' | 'idle-angler'; line: string; action: ReactNode }> = [
    {
      slug: 'desk-crawler',
      line: me.hero ? shell.heroLine(me.hero) : t.notStarted,
      action: me.hero ? <Link to="/app/desk-crawler" className={`${LINK_BUTTON} ${BUTTON_PRIMARY}`}>{t.open}</Link> : <Link to="/games/desk-crawler" className="inline-flex min-h-11 items-center underline underline-offset-4">{t.seeGame('Desk Crawler')}</Link>,
    },
    {
      slug: 'idle-angler',
      line: angler ? shell.anglerLine(angler) : angler === null && !IDLE_ANGLER_MARKETPLACE_URL ? t.inReview : t.notStarted,
      action: angler ? <Link to="/app/idle-angler" className={`${LINK_BUTTON} ${BUTTON_PRIMARY}`}>{t.open}</Link> : IDLE_ANGLER_MARKETPLACE_URL ? <Link to="/games/idle-angler" className="inline-flex min-h-11 items-center underline underline-offset-4">{t.seeGame('Idle Angler')}</Link> : angler === null ? <NotifyMe gameSlug="idle-angler" /> : null,
    },
  ]
  return (
    <section aria-labelledby="your-games-heading" className="window flex flex-col gap-1 p-4 sm:p-5">
      <h2 id="your-games-heading" className="font-display text-xl font-bold">{t.yourGames}</h2>
      <ul className="flex flex-col">
        {rows.map((row) => (
          <li key={row.slug} className="flex flex-col gap-3 border-t-2 border-rule py-3 first:border-t-0 sm:flex-row sm:items-center sm:justify-between">
            <div className="flex min-w-0 items-center gap-3">
              <img src={`/games/${row.slug}/favicon.svg`} alt="" width={32} height={32} className="size-8 shrink-0 [image-rendering:pixelated]" />
              <div className="flex min-w-0 flex-col">
                <span className="font-semibold">{games[row.slug].name}</span>
                <span className="truncate text-sm text-muted">{row.line}</span>
              </div>
            </div>
            <div className="shrink-0 max-sm:pl-11">{row.action}</div>
          </li>
        ))}
      </ul>
    </section>
  )
}

/**
 * One cabinet on the game-select screen (D210): the game's real screen in its bezel, its name with the gold cursor that
 * lands on whichever game the visitor points at, a figure from its catalog, its pitch and its one call to action. From
 * 1024px the two cards share rows (subgrid), so their screens, pitches and calls to action line up side by side.
 */
function GameCard({ slug, alt, caption, facts, factGlyph, pitch, priority = false, children }: { slug: 'desk-crawler' | 'idle-angler'; alt: string; caption: string; facts: string; factGlyph: GlyphName; pitch: string; priority?: boolean; children: ReactNode }) {
  const t = useT(homeMessages)
  const name = games[slug].name
  return (
    <li className="group window flex flex-col gap-5 p-4 outline-4 outline-offset-0 outline-transparent transition-[outline-color] duration-150 focus-within:outline-gold hover:outline-gold sm:p-6 lg:row-span-4 lg:grid lg:grid-rows-subgrid">
      <figure className="flex flex-col gap-2">
        {/* The first cabinet's screen is the largest thing on the page at every width: it loads first, the second waits. */}
        <Link to={games[slug].publicPath} tabIndex={-1} aria-hidden="true" className="block"><ScreenBezel slug={slug} alt={alt} priority={priority} sizes="(min-width: 1024px) 560px, 100vw" /></Link>
        <figcaption className="text-sm text-faint">{caption}</figcaption>
      </figure>
      {/* Below 1024px the cards stack, so the name goes above the screen: a visitor reads which game it is before the pixels. */}
      <div className="flex flex-col gap-2 max-lg:order-first">
        <h3 className="flex items-center gap-3 font-display text-3xl font-bold">
          {/* The select screen's cursor: hidden until this cabinet is pointed at or focused. */}
          <span aria-hidden="true" className="h-[15px] w-[9px] shrink-0 bg-[url(&quot;data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='3' height='5' shape-rendering='crispEdges'%3E%3Cpath fill='%23ffd166' d='M0 0h1v5H0zM1 1h1v3H1zM2 2h1v1H2z'/%3E%3C/svg%3E&quot;)] bg-contain bg-no-repeat opacity-0 transition-opacity duration-150 group-focus-within:opacity-100 group-hover:opacity-100" />
          <img src={`/games/${slug}/icon-192.png`} alt="" width={40} height={40} className="size-10 [image-rendering:pixelated]" />
          <Link to={games[slug].publicPath} className="no-underline hover:text-gold-ink">{name}</Link>
        </h3>
        <p className="flex items-center gap-2 text-sm font-semibold text-muted"><Glyph name={factGlyph} size={16} className="text-gold-ink" />{facts}</p>
      </div>
      <p className="leading-relaxed text-muted">{pitch}</p>
      <div className="flex flex-col gap-4 border-t-2 border-rule pt-4 lg:self-start">
        {children}
        <Link to={games[slug].publicPath} className="inline-flex min-h-11 items-center self-start underline underline-offset-4">{t.about(name)}</Link>
      </div>
    </li>
  )
}

/** The newest few What's new entries (D153), so the front page shows the games are still moving; the page has them all. */
function RecentChanges() {
  const t = useT(pitchMessages)
  const home = useT(homeMessages)
  const locale = useLocale()
  return (
    <section aria-labelledby="recent-heading" className="flex flex-col gap-6">
      <div className="flex max-w-prose flex-col gap-2">
        <h2 id="recent-heading" className="font-display text-3xl font-bold text-gold-ink">{t.recentlyChanged}</h2>
        <p className="leading-relaxed text-muted">{home.recentIntro}</p>
      </div>
      <ul className="grid gap-4 lg:grid-cols-3">
        {latestChanges(3, locale).map((change) => (
          <li key={change.key} className="window flex flex-col gap-2 p-5">
            <time dateTime={change.date} className="text-sm font-semibold text-muted">{changeDay(change.date, true, locale)}</time>
            <h3 className="font-display text-xl font-bold"><Link to="/whats-new" hash={change.key} className="no-underline hover:text-gold-ink">{change.title}</Link></h3>
            <p className="line-clamp-4 leading-relaxed text-muted">{change.body}</p>
          </li>
        ))}
      </ul>
      <Link to="/whats-new" className={`self-start gap-2.5 ${LINK_BUTTON} ${BUTTON_SECONDARY}`}><Glyph name="bell" />{t.seeEveryChange}</Link>
    </section>
  )
}

/** The platform front page (D210): the promise, the player's own games, the two games side by side, then how it all works. */
function Home() {
  const t = useT(homeMessages)
  const pitch = useT(pitchMessages)
  const ia = useT(iaGamePage)
  const monsters = FLOORS.reduce((sum, floor) => sum + floor.monsters.length, 0)
  return (
    <SiteShell>
      <main id="main" className="flex flex-col">
        <div className={`flex flex-col gap-8 pt-8 pb-10 sm:pt-10 sm:pb-14 ${SITE_FRAME}`}>
          <header className="flex max-w-3xl flex-col gap-4">
            <h1 className="font-display text-4xl font-bold leading-[1.15] text-balance sm:text-5xl">{t.title}</h1>
            <p className="max-w-prose text-lg leading-relaxed text-muted">{t.lead}</p>
          </header>
          <Show when="signed-in"><YourGames /></Show>
          <section aria-labelledby="pick-heading" className="flex flex-col gap-4">
            <h2 id="pick-heading" className="sr-only">{t.pickHeading}</h2>
            <ul className="grid gap-6 lg:grid-cols-2 lg:gap-x-8">
              <GameCard slug="desk-crawler" alt={pitch.sampleAlt} caption={pitch.homeCaption} facts={t.deskCrawlerFacts(FLOORS.length, monsters)} factGlyph="sword" pitch={t.deskCrawlerPitch} priority>
                <InstallCta place="home card" compact />
              </GameCard>
              <GameCard slug="idle-angler" alt={ia.sampleAlt} caption={ia.caption} facts={t.idleAnglerFacts(IA_PITCH.waters.length, IA_PITCH.species)} factGlyph="pin" pitch={t.idleAnglerPitch}>
                <IdleAnglerCta place="home card" compact />
              </GameCard>
            </ul>
            <p className="text-sm text-muted">{pitch.needsBefore}<a href="https://trmnl.com" className="underline underline-offset-4 hover:text-ink">{pitch.needsLink}</a>{pitch.needsAfter}</p>
          </section>
        </div>

        <div className="border-y border-rule bg-night/40 py-14 sm:py-20">
          <section aria-labelledby="how-heading" className={`flex flex-col gap-8 ${SITE_FRAME}`}>
            <h2 id="how-heading" className="font-display text-3xl font-bold text-gold-ink">{t.howItWorks}</h2>
            <ol className="grid gap-10 md:grid-cols-3 md:gap-8">
              {t.steps.map((step) => (
                <li key={step.when} className="flex flex-col gap-2 border-t-2 border-rule pt-5">
                  <p className="text-sm font-semibold text-gold-ink">{step.when}</p>
                  <h3 className="font-display text-2xl font-bold">{step.title}</h3>
                  <p className="leading-relaxed text-muted">{step.body}</p>
                </li>
              ))}
            </ol>
            <div className="flex max-w-prose flex-col gap-2 border-t-2 border-rule pt-5">
              <h3 className="flex items-center gap-3 font-display text-2xl font-bold"><Glyph name="hero" size={24} className="text-sky-ink" />{t.oneAccountTitle}</h3>
              <p className="leading-relaxed text-muted">{t.oneAccountBody}</p>
            </div>
          </section>
        </div>

        <div className={`flex flex-col gap-20 py-14 sm:gap-24 sm:py-20 ${SITE_FRAME}`}>
          <RecentChanges />
          <section aria-labelledby="faq-heading" className="flex max-w-3xl flex-col gap-6">
            <h2 id="faq-heading" className="font-display text-3xl font-bold text-gold-ink">{t.questions}</h2>
            <div className="flex flex-col border-t border-rule">
              {t.faq.map((item) => (
                <details key={item.q} className="border-b border-rule">
                  <summary className="min-h-14 cursor-pointer py-3 font-semibold hover:text-gold-ink">{item.q}</summary>
                  <p className="max-w-prose pb-5 pl-[1.125rem] leading-relaxed text-muted">{item.a}</p>
                </details>
              ))}
            </div>
          </section>
        </div>
      </main>
    </SiteShell>
  )
}
