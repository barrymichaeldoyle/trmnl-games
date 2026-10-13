import { Link, createFileRoute } from '@tanstack/react-router'
import { games } from '@trmnl-games/platform'
import { DeviceSample, Faq, FeatureGrid, FloorGrid, HowItPlays, LaunchSignup } from '../lib/deskCrawlerPitch'
import { FAQ_JSON_LD } from '../lib/deskCrawlerFaq'
import { Glyph } from '../lib/glyphs'
import { SITE_FRAME } from '../lib/platformHeader'
import { SiteShell } from '../lib/prose'
import { BUTTON_SECONDARY, LINK_BUTTON } from '../lib/ui'
import { DESK_CRAWLER_JSON_LD, SITE_JSON_LD, seo } from '../lib/seo'
import { AfterListing, useGames } from '../lib/gameAccess'

export const Route = createFileRoute('/')({
  head: () => seo({
    path: '/',
    description: 'Games that play themselves on your TRMNL e-ink display. Desk Crawler is a free office RPG: every 15 minutes your hero fights, loots and levels up on the screen on your desk.',
    jsonLd: { '@context': 'https://schema.org', '@graph': [SITE_JSON_LD, DESK_CRAWLER_JSON_LD, FAQ_JSON_LD].map(({ '@context': _, ...node }) => node) },
  }),
  // No loader: the page is static, and the games listing (only for the Slow Cast teaser) loads in the browser after it.
  component: Home,
})

/** Slow Cast (D115) once it is listed: a "Coming soon" section in preview, the full section when live. Hidden, nothing. */
function SlowCastSection() {
  const data = useGames()
  const game = data?.games.find((g) => g.slug === 'slow-cast')
  if (!game || (game.status === 'hidden' && !data?.admin)) return null
  const live = game.status === 'live'
  return (
    <section aria-labelledby="slow-cast-heading" className="grid gap-6 md:grid-cols-2 md:items-center">
      <img src="/games/slow-cast/sample.png" alt="A sample Slow Cast screen: an angler holding a barbel at River Bend at dusk" width={780} height={460} loading="lazy" className="w-full border-2 border-edge bg-white [image-rendering:pixelated]" />
      <div className="flex flex-col gap-3">
        {live ? null : <p className="text-sm font-semibold text-muted">Coming next</p>}
        <h2 id="slow-cast-heading" className="font-display text-3xl font-bold text-gold-ink">{games['slow-cast'].name}</h2>
        <p className="max-w-prose leading-relaxed">{games['slow-cast'].description} Every fifteen minutes your angler casts, and the screen on your desk shows what bit.</p>
        {game.canOpen ? (
          <div className="flex flex-wrap gap-3">
            <Link to="/games/slow-cast" className={`${LINK_BUTTON} ${BUTTON_SECONDARY}`}>How it plays</Link>
            <Link to="/app/slow-cast" className="inline-flex min-h-11 items-center underline underline-offset-4">Open companion</Link>
          </div>
        ) : null}
      </div>
    </section>
  )
}

/** The platform front page: Desk Crawler's screen and launch list first, then what the game holds. */
function Home() {
  return (
    <SiteShell>
      <main id="main" className="flex flex-col">
        <section aria-labelledby="home-title" className={`grid items-center gap-10 py-10 sm:py-16 lg:grid-cols-[minmax(0,5fr)_minmax(0,6fr)] lg:gap-14 ${SITE_FRAME}`}>
          <div className="flex flex-col gap-6">
            <div className="flex flex-col gap-4">
              <p className="flex items-center gap-2 text-sm font-semibold text-gold-ink"><img src="/games/desk-crawler/favicon.svg" alt="" width={16} height={16} className="[image-rendering:pixelated]" />Desk Crawler for TRMNL</p>
              <h1 id="home-title" className="font-display text-4xl font-bold leading-[1.15] sm:text-5xl">An office RPG that plays itself on your desk</h1>
              <p className="max-w-prose text-lg leading-relaxed text-muted">Every 15 minutes your hero fights a Stapler Mimic, finds a Keyboard Mace or gets knocked out, and your TRMNL e-ink screen shows what happened. You check in every few days to sort the loot.</p>
            </div>
            <LaunchSignup source="home" />
          </div>
          <DeviceSample caption="A real Desk Crawler screen on a TRMNL X, with a sample hero." priority />
        </section>

        <div className="border-y border-rule bg-night/40 py-14 sm:py-20">
          <div className={SITE_FRAME}><HowItPlays headingId="how-heading" /></div>
        </div>

        <div className={`flex flex-col gap-20 py-14 sm:gap-24 sm:py-20 ${SITE_FRAME}`}>
          <FloorGrid headingId="floors-heading" />
          <div className="flex flex-col gap-8">
            <FeatureGrid headingId="features-heading" />
            <div className="flex flex-col items-start gap-4 border-t border-rule pt-6 sm:flex-row sm:items-center sm:justify-between">
              <p className="max-w-prose text-muted">The guide covers every system in detail, from the first fight to the workbench.</p>
              <Link to="/help/desk-crawler" className={`shrink-0 gap-2.5 ${LINK_BUTTON} ${BUTTON_SECONDARY}`}><Glyph name="quest" />Read the full guide</Link>
            </div>
          </div>
          <div className="grid gap-12 lg:grid-cols-[minmax(0,3fr)_minmax(0,2fr)] lg:gap-16">
            <Faq headingId="faq-heading" />
            <section aria-labelledby="launch-heading" className="window flex flex-col gap-4 self-start p-5 sm:p-6">
              <h2 id="launch-heading" className="font-display text-2xl font-bold text-gold-ink">Get Desk Crawler at launch</h2>
              <LaunchSignup source="home" instance="footer" />
            </section>
          </div>
          <AfterListing><SlowCastSection /></AfterListing>
        </div>
      </main>
    </SiteShell>
  )
}
