import { Link, createFileRoute } from '@tanstack/react-router'
import { DeviceSample, Faq, FeatureGrid, FloorGrid, HowItPlays, InstallCta, OfficeCensus } from '../../lib/deskCrawlerPitch'
import { faqJsonLd } from '../../lib/deskCrawlerFaq'
import { AfterListing } from '../../lib/gameAccess'
import { Glyph } from '../../lib/glyphs'
import { messagesFor, useT } from '../../lib/i18n'
import { headMessages } from '../../i18n/heads'
import { SITE_FRAME } from '../../lib/platformHeader'
import { SiteShell } from '../../lib/prose'
import { DESK_CRAWLER_JSON_LD, DESK_CRAWLER_OG, seo } from '../../lib/seo'
import { BUTTON_SECONDARY, LINK_BUTTON } from '../../lib/ui'
import { pitchMessages } from '../../i18n/pitch'

/**
 * Desk Crawler's own page (D210). Until Idle Angler arrived the home page was this page and this route redirected there
 * (D137); now home is the two-game front page and Desk Crawler's pitch lives here, in every language (D169).
 */
export const Route = createFileRoute('/games/desk-crawler')({
  head: ({ match: { context: { locale } } }) =>
    seo({
      title: 'Desk Crawler',
      path: '/games/desk-crawler',
      locale,
      description: messagesFor(headMessages, locale).dcGame,
      image: DESK_CRAWLER_OG,
      jsonLd: { '@context': 'https://schema.org', '@graph': [DESK_CRAWLER_JSON_LD, faqJsonLd(locale)].map(({ '@context': _, ...node }) => node) },
    }),
  component: GamePage,
})

function GamePage() {
  const t = useT(pitchMessages)
  return (
    <SiteShell>
      <main id="main" className="flex flex-col">
        <section aria-labelledby="dc-title" className={`grid items-center gap-10 py-10 sm:py-16 lg:grid-cols-[minmax(0,5fr)_minmax(0,6fr)] lg:gap-14 ${SITE_FRAME}`}>
          <div className="flex flex-col gap-6">
            <header className="flex flex-col gap-4">
              <h1 id="dc-title" className="flex items-center gap-4 font-display text-4xl font-bold leading-tight sm:text-5xl"><img src="/games/desk-crawler/icon-192.png" alt="" width={64} height={64} className="size-14 [image-rendering:pixelated] sm:size-16" />Desk Crawler</h1>
              <p className="font-display text-2xl font-bold leading-snug text-gold-ink">{t.homeTitle}</p>
              <p className="max-w-prose text-lg leading-relaxed text-muted">{t.homeLead}</p>
            </header>
            <InstallCta place="game page" />
          </div>
          <DeviceSample caption={t.homeCaption} priority />
          <AfterListing><OfficeCensus className="lg:col-span-2" /></AfterListing>
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
          <div className="grid gap-12 lg:grid-cols-[minmax(0,3fr)_minmax(0,2fr)] lg:gap-16">
            <Faq headingId="faq-heading" />
            <section aria-labelledby="launch-heading" className="window flex flex-col gap-4 self-start p-5 sm:p-6">
              <h2 id="launch-heading" className="font-display text-2xl font-bold text-gold-ink">{t.getDeskCrawler}</h2>
              <InstallCta place="game page end" />
            </section>
          </div>
        </div>
      </main>
    </SiteShell>
  )
}
