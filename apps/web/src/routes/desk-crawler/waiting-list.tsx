import { Link, createFileRoute } from '@tanstack/react-router'
import { SiteShell } from '../../lib/prose'
import { SITE_FRAME } from '../../lib/platformHeader'
import { DESK_CRAWLER_OG, seo } from '../../lib/seo'
import { DeviceSample } from '../../lib/deskCrawlerPitch'
import { Glyph, type GlyphName } from '../../lib/glyphs'
import { WaitlistForm } from '../../lib/waitlist'

export const Route = createFileRoute('/desk-crawler/waiting-list')({
  head: () => seo({ title: 'Desk Crawler waiting list', path: '/desk-crawler/waiting-list', description: 'Get one email when Desk Crawler, an office RPG for your TRMNL e-ink display, is in the TRMNL marketplace.', image: DESK_CRAWLER_OG }),
  component: Notify,
})

const FACTS: ReadonlyArray<{ glyph: GlyphName; tone: string; text: string }> = [
  { glyph: 'clock', tone: 'text-sky-ink', text: 'A new adventure every 15 minutes, day and night' },
  { glyph: 'coin', tone: 'text-gold-ink', text: 'Free to play' },
  { glyph: 'screen', tone: 'text-xp-ink', text: 'Runs on a TRMNL e-ink display' },
]

/** Shareable launch-list page (D105): the signup comes first, the pitch after it; on wide screens the device sits beside it. */
function Notify() {
  return (
    <SiteShell>
      <main id="main" className={`grid items-center gap-10 py-10 sm:py-16 lg:grid-cols-[minmax(0,5fr)_minmax(0,6fr)] lg:gap-14 ${SITE_FRAME}`}>
        <div className="flex flex-col gap-8">
          <header className="flex flex-col gap-4">
            <p className="flex items-center gap-2 self-start border-2 border-gold/50 px-3 py-1 text-sm font-semibold text-gold-ink"><span aria-hidden="true" className="size-2 bg-gold motion-safe:animate-pulse" />In TRMNL marketplace review</p>
            <h1 className="flex items-center gap-4 font-display text-4xl font-bold leading-tight sm:text-5xl"><img src="/games/desk-crawler/icon-192.png" alt="" width={64} height={64} className="size-14 [image-rendering:pixelated] sm:size-16" />Desk Crawler</h1>
            <p className="max-w-prose text-lg leading-relaxed text-muted">An office RPG that plays itself on your TRMNL. Leave your email and we'll send one message the day it's in the marketplace.</p>
          </header>
          <div className="window p-4 sm:p-6">
            <WaitlistForm source="notify" />
          </div>
          <ul className="flex flex-col gap-3">
            {FACTS.map((fact) => (
              <li key={fact.text} className="flex items-center gap-3"><Glyph name={fact.glyph} size={16} className={fact.tone} />{fact.text}</li>
            ))}
          </ul>
          <div className="flex flex-wrap items-center gap-x-6 gap-y-1">
            <Link to="/" className="inline-flex min-h-11 items-center underline underline-offset-4">More about Desk Crawler</Link>
            <a href="https://trmnl.com" className="inline-flex min-h-11 items-center underline underline-offset-4">What's a TRMNL?</a>
          </div>
        </div>
        <DeviceSample caption="Sample hero on a TRMNL X. Every fifteen minutes your hero fights, loots or gets knocked out, and the screen shows what happened." priority />
      </main>
    </SiteShell>
  )
}
