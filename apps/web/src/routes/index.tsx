import { Link, createFileRoute } from '@tanstack/react-router'
import { games } from '@trmnl-games/platform'
import { DeviceSample, Faq, FeatureGrid, FloorGrid, HowItPlays, InstallCta } from '../lib/deskCrawlerPitch'
import { faqJsonLd } from '../lib/deskCrawlerFaq'
import { Glyph } from '../lib/glyphs'
import { changeDay, latestChanges } from '../lib/changelog'
import { SITE_FRAME } from '../lib/platformHeader'
import { SiteShell } from '../lib/prose'
import { BUTTON_SECONDARY, LINK_BUTTON } from '../lib/ui'
import { DESK_CRAWLER_JSON_LD, SITE_JSON_LD, seo } from '../lib/seo'
import { AfterListing, useGames } from '../lib/gameAccess'
import { messagesFor, useLocale, useT } from '../lib/i18n'
import { pitchMessages } from '../i18n/pitch'

export const Route = createFileRoute('/')({
  head: ({ match: { context: { locale } } }) => seo({
    path: '/',
    locale,
    description: messagesFor(pitchMessages, locale).homeDescription,
    jsonLd: { '@context': 'https://schema.org', '@graph': [SITE_JSON_LD, DESK_CRAWLER_JSON_LD, faqJsonLd(locale)].map(({ '@context': _, ...node }) => node) },
  }),
  // No loader: the page is static, and the games listing (only for the Idle Angler teaser) loads in the browser after it.
  component: Home,
})

/** Idle Angler (D115) once it is listed: a "Coming soon" section in preview, the full section when live. Hidden, nothing. */
function IdleAnglerSection() {
  const data = useGames()
  const t = useT(pitchMessages)
  const game = data?.games.find((g) => g.slug === 'idle-angler')
  if (!game || (game.status === 'hidden' && !data?.admin)) return null
  const live = game.status === 'live'
  return (
    <section aria-labelledby="idle-angler-heading" className="grid gap-6 md:grid-cols-2 md:items-center">
      <img src="/games/idle-angler/sample.png" alt={t.idleAnglerAlt} width={780} height={460} loading="lazy" className="w-full border-2 border-edge bg-white [image-rendering:pixelated]" />
      <div className="flex flex-col gap-3">
        {live ? null : <p className="text-sm font-semibold text-muted">{t.comingNext}</p>}
        <h2 id="idle-angler-heading" className="font-display text-3xl font-bold text-gold-ink">{games['idle-angler'].name}</h2>
        <p className="max-w-prose leading-relaxed">{t.idleAnglerBody}</p>
        {game.canOpen ? (
          <div className="flex flex-wrap gap-3">
            <Link to="/games/idle-angler" className={`${LINK_BUTTON} ${BUTTON_SECONDARY}`}>{t.howItPlaysLink}</Link>
            <Link to="/app/idle-angler" className="inline-flex min-h-11 items-center underline underline-offset-4">{t.openCompanion}</Link>
          </div>
        ) : null}
      </div>
    </section>
  )
}

/** The newest few What's new entries (D153), so the front page shows the game is still moving; the page has them all. */
function RecentChanges() {
  const t = useT(pitchMessages)
  const locale = useLocale()
  return (
    <section aria-labelledby="recent-heading" className="flex flex-col gap-6">
      <div className="flex max-w-prose flex-col gap-2">
        <h2 id="recent-heading" className="font-display text-3xl font-bold text-gold-ink">{t.recentlyChanged}</h2>
        <p className="leading-relaxed text-muted">{t.recentIntro}</p>
      </div>
      <ul className="grid gap-4 lg:grid-cols-3">
        {latestChanges(3, locale).map((change) => (
          <li key={change.title} className="window flex flex-col gap-2 p-5">
            <time dateTime={change.date} className="text-sm font-semibold text-muted">{changeDay(change.date, true, locale)}</time>
            <h3 className="font-display text-xl font-bold">{change.title}</h3>
            <p className="line-clamp-4 leading-relaxed text-muted">{change.body}</p>
          </li>
        ))}
      </ul>
      <Link to="/whats-new" className={`self-start gap-2.5 ${LINK_BUTTON} ${BUTTON_SECONDARY}`}><Glyph name="bell" />{t.seeEveryChange}</Link>
    </section>
  )
}

/** The platform front page: Desk Crawler's screen and install link first, then what the game holds. */
function Home() {
  const t = useT(pitchMessages)
  return (
    <SiteShell>
      <main id="main" className="flex flex-col">
        <section aria-labelledby="home-title" className={`grid items-center gap-10 py-10 sm:py-16 lg:grid-cols-[minmax(0,5fr)_minmax(0,6fr)] lg:gap-14 ${SITE_FRAME}`}>
          <div className="flex flex-col gap-6">
            <div className="flex flex-col gap-4">
              <p className="flex items-center gap-2 text-sm font-semibold text-gold-ink"><img src="/games/desk-crawler/favicon.svg" alt="" width={16} height={16} className="[image-rendering:pixelated]" />{t.eyebrow}</p>
              <h1 id="home-title" className="font-display text-4xl font-bold leading-[1.15] sm:text-5xl">{t.homeTitle}</h1>
              <p className="max-w-prose text-lg leading-relaxed text-muted">{t.homeLead}</p>
            </div>
            <InstallCta place="home" />
          </div>
          <DeviceSample caption={t.homeCaption} priority />
        </section>

        <div className="border-y border-rule bg-night/40 py-14 sm:py-20">
          <div className={SITE_FRAME}><HowItPlays headingId="how-heading" /></div>
        </div>

        <div className={`flex flex-col gap-20 py-14 sm:gap-24 sm:py-20 ${SITE_FRAME}`}>
          <FloorGrid headingId="floors-heading" />
          <div className="flex flex-col gap-8">
            <FeatureGrid headingId="features-heading" />
            <div className="flex flex-col items-start gap-4 border-t border-rule pt-6 sm:flex-row sm:items-center sm:justify-between">
              <p className="max-w-prose text-muted">{t.guideBody}</p>
              <Link to="/help/desk-crawler" className={`shrink-0 gap-2.5 ${LINK_BUTTON} ${BUTTON_SECONDARY}`}><Glyph name="quest" />{t.readGuide}</Link>
            </div>
          </div>
          <RecentChanges />
          <div className="grid gap-12 lg:grid-cols-[minmax(0,3fr)_minmax(0,2fr)] lg:gap-16">
            <Faq headingId="faq-heading" />
            <section aria-labelledby="launch-heading" className="window flex flex-col gap-4 self-start p-5 sm:p-6">
              <h2 id="launch-heading" className="font-display text-2xl font-bold text-gold-ink">{t.getDeskCrawler}</h2>
              <InstallCta place="home end" />
            </section>
          </div>
          <AfterListing><IdleAnglerSection /></AfterListing>
        </div>
      </main>
    </SiteShell>
  )
}
