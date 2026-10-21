import { Link, createFileRoute } from '@tanstack/react-router'
import { games } from '@trmnl-games/platform'
import { ScreenBezel } from '../../lib/deskCrawlerPitch'
import { requireOpenGame } from '../../lib/gameAccess'
import { Glyph } from '../../lib/glyphs'
import { messagesFor, useT } from '../../lib/i18n'
import { headMessages } from '../../i18n/heads'
import { IaFaq, IaFeatureGrid, IaHowItPlays, IdleAnglerCta, WaterGrid } from '../../lib/idleAnglerPitch'
import { SITE_FRAME } from '../../lib/platformHeader'
import { SiteShell } from '../../lib/prose'
import { IDLE_ANGLER_JSON_LD, seo } from '../../lib/seo'
import { BUTTON_SECONDARY, LINK_BUTTON } from '../../lib/ui'
import { iaGamePage } from '../../i18n/iaGamePage'

/**
 * Idle Angler's public page (D210), built like Desk Crawler's: the real screen and the call to action, how it plays,
 * the waters, what is in the game, the guide and questions. Eight languages (D200). Hidden with the game until live (D115).
 */
export const Route = createFileRoute('/games/idle-angler')({
  loader: ({ context }) => requireOpenGame(context, 'idle-angler'),
  head: ({ match: { context: { locale } } }) => {
    const t = messagesFor(headMessages, locale)
    // The game and its questions as one graph, as Desk Crawler's page has them (FAQPage in the page's language).
    const faq = { '@type': 'FAQPage', mainEntity: t.iaFaq.map((item) => ({ '@type': 'Question', name: item.q, acceptedAnswer: { '@type': 'Answer', text: item.a } })) }
    const { '@context': _context, ...game } = IDLE_ANGLER_JSON_LD
    return seo({ title: 'Idle Angler', path: '/games/idle-angler', description: t.iaGame, image: { path: '/games/idle-angler/sample.png', alt: t.iaGameImageAlt }, jsonLd: { '@context': 'https://schema.org', '@graph': [game, faq] }, locale })
  },
  component: GamePage,
})

function GamePage() {
  const t = useT(iaGamePage)
  return (
    <SiteShell>
      <main id="main" className="flex flex-col">
        <section aria-labelledby="ia-title" className={`grid items-center gap-10 py-10 sm:py-16 lg:grid-cols-[minmax(0,5fr)_minmax(0,6fr)] lg:gap-14 ${SITE_FRAME}`}>
          <div className="flex flex-col gap-6">
            <header className="flex flex-col gap-4">
              <h1 id="ia-title" className="flex items-center gap-4 font-display text-4xl font-bold leading-tight sm:text-5xl"><img src="/games/idle-angler/icon-192.png" alt="" width={64} height={64} className="size-14 [image-rendering:pixelated] sm:size-16" />{games['idle-angler'].name}</h1>
              <p className="font-display text-2xl font-bold leading-snug text-gold-ink">{t.tagline}</p>
              <p className="max-w-prose text-lg leading-relaxed text-muted">{t.intro}</p>
            </header>
            <IdleAnglerCta place="idle angler page" />
          </div>
          <figure className="flex flex-col gap-3">
            <ScreenBezel slug="idle-angler" alt={t.sampleAlt} priority />
            <figcaption className="text-sm text-muted">{t.caption}</figcaption>
          </figure>
        </section>

        <div className="border-y border-rule bg-night/40 py-14 sm:py-20">
          <div className={SITE_FRAME}><IaHowItPlays headingId="ia-how-heading" /></div>
        </div>

        <div className={`flex flex-col gap-20 py-14 sm:gap-24 sm:py-20 ${SITE_FRAME}`}>
          <WaterGrid headingId="ia-waters-heading" />
          <div className="flex flex-col gap-8">
            <IaFeatureGrid headingId="ia-features-heading" />
            <div className="flex flex-col items-start gap-4 border-t border-rule pt-6 sm:flex-row sm:items-center sm:justify-between">
              <p className="max-w-prose text-muted">{t.guideBody}</p>
              <Link to="/help/idle-angler" className={`shrink-0 gap-2.5 ${LINK_BUTTON} ${BUTTON_SECONDARY}`}><Glyph name="quest" />{t.readGuide}</Link>
            </div>
          </div>
          <div className="grid gap-12 lg:grid-cols-[minmax(0,3fr)_minmax(0,2fr)] lg:gap-16">
            <IaFaq headingId="ia-faq-heading" />
            <section aria-labelledby="ia-get-heading" className="window flex flex-col gap-4 self-start p-5 sm:p-6">
              <h2 id="ia-get-heading" className="font-display text-2xl font-bold text-gold-ink">{t.getIdleAngler}</h2>
              <IdleAnglerCta place="idle angler page end" />
            </section>
          </div>
        </div>
      </main>
    </SiteShell>
  )
}
