import { Link, createFileRoute, redirect } from '@tanstack/react-router'
import type { ReactNode } from 'react'
import { DeviceSample, FloorGrid, HowItPlays, InstallCta } from '../../lib/deskCrawlerPitch'
import { UNLOCKS } from '../../lib/facts.gen'
import { Glyph, type GlyphName } from '../../lib/glyphs'
import { SITE_FRAME } from '../../lib/platformHeader'
import { SiteShell } from '../../lib/prose'
import { DESK_CRAWLER_JSON_LD, DESK_CRAWLER_OG, seo } from '../../lib/seo'

/**
 * While Desk Crawler is the only game, the home page is its page: this one repeated it, so it redirects there (D137).
 * The redirect is temporary (302) and the page below is kept: at the Idle Angler launch home becomes a two-game front page
 * and this becomes Desk Crawler's own page again, so remove the redirect then.
 */
export const Route = createFileRoute('/games/desk-crawler')({ beforeLoad: () => { throw redirect({ to: '/', statusCode: 302 }) }, head: () => seo({ title: 'Desk Crawler', path: '/games/desk-crawler', description: 'Desk Crawler is a free office RPG that plays itself on your TRMNL e-ink display. Every 15 minutes your hero takes on another adventure across five office floors, and it climbs the weekly rankings against other players.', image: DESK_CRAWLER_OG, jsonLd: DESK_CRAWLER_JSON_LD }), component: Landing })

/** One topic of the game: a heading with its glyph, a few paragraphs, and a link into the matching help section. */
function Topic({ id, glyph, tone, title, help, children }: { id: string; glyph: GlyphName; tone: string; title: string; help: string; children: ReactNode }) {
  return (
    <section aria-labelledby={id} className="flex flex-col gap-3">
      <h2 id={id} className="flex items-center gap-3 font-display text-2xl font-bold sm:text-3xl"><Glyph name={glyph} size={24} className={tone} />{title}</h2>
      <div className="flex max-w-prose flex-col gap-3 leading-relaxed text-muted">{children}</div>
      <Link to="/help/desk-crawler" hash={help} className="inline-flex min-h-11 items-center self-start text-sm underline underline-offset-4">More in the guide</Link>
    </section>
  )
}

/** Public landing. The screen is a static, labelled sample; it never creates a hero. */
function Landing() {
  return (
    <SiteShell>
      <main id="main" className={`flex flex-col gap-20 py-10 sm:gap-24 sm:py-16 ${SITE_FRAME}`}>
        <section aria-labelledby="dc-title" className="grid items-center gap-10 lg:grid-cols-[minmax(0,5fr)_minmax(0,6fr)] lg:gap-14">
          <div className="flex flex-col gap-6">
            <header className="flex flex-col gap-4">
              <h1 id="dc-title" className="flex items-center gap-4 font-display text-4xl font-bold leading-tight sm:text-5xl"><img src="/games/desk-crawler/icon-192.png" alt="" width={64} height={64} className="size-14 [image-rendering:pixelated] sm:size-16" />Desk Crawler</h1>
              <p className="max-w-prose text-lg leading-relaxed text-muted">
                An office RPG that plays itself on your TRMNL. Every fifteen minutes your hero fights a Stapler Mimic, finds a Keyboard Mace or gets knocked out, and the screen on
                your desk shows what happened. Every few days you open the companion to sort gear and pick the next floor.
              </p>
            </header>
            <InstallCta place="landing" />
          </div>
          <DeviceSample caption="Sample hero on a TRMNL X. Your own hero starts when you install the plugin and save it in TRMNL." priority />
        </section>

        <HowItPlays headingId="how-heading" />
        <FloorGrid headingId="floors-heading" />

        <div className="grid gap-14 md:grid-cols-2 md:gap-x-16">
          <Topic id="choices-heading" glyph="shield" tone="text-sky-ink" title="Choices that change the run" help="stances">
            <p>Pick a stance on the Hero page: Cautious, Balanced or Bold. It changes how your hero handles danger and how its desk raids go. Which one pays best depends on the floor.</p>
            <p>Now and then the office asks something small, like chipping in for a cake or staying late. Both options say exactly what they change, and if you don’t answer within about a day, the default is chosen for you.</p>
          </Topic>
          <Topic id="gear-heading" glyph="cog" tone="text-rare-ink" title="Gear, bags and the workbench" help="salvage-and-the-workbench">
            <p>Gear comes as common, uncommon, rare or epic. Rare and epic pieces carry a trait: Vampiric heals after every win, Lucky adds gold, Sturdy takes less damage from traps and Thrifty loses less when things go wrong.</p>
            <p>When the bag fills, your hero naps until you make room. Sell spare gear for gold, or salvage it for materials and upgrade the pieces your hero wears. Bigger bags and potion pouches are bought with gold, and a wandering merchant sometimes sells items at a discount.</p>
          </Topic>
          <Topic id="players-heading" glyph="sword" tone="text-hp-ink" title="Other players" help="desk-raids">
            <p>From level {UNLOCKS.raids}, heroes raid each other’s desks while exploring. A raid is a coin toss tilted by stance, never by level, and nobody chooses who gets raided. The loser hands over 5% of its gold.</p>
            <p>Your screen shows the seven-day XP Top 5 for your level group, with your own row marked. You can also give your hero a public page with its level, rank and achievements, and share it with a picture card.</p>
          </Topic>
          <Topic id="career-heading" glyph="quest" tone="text-xp-ink" title="A career and a second hero" help="career">
            <p>Your hero always has one goal, from “Win your first fight” to reaching the Parking Garage, and new features arrive as it levels up. Every morning the stand-up hands out small tasks, like defeating four Paper Imps, for a little gold.</p>
            <p>At level {UNLOCKS.roster} your Warrior can recruit a Rogue, with less health, more gold from every fight and an edge in raids. One hero adventures at a time and you can switch once a day.</p>
          </Topic>
          <Topic id="extras-heading" glyph="keepsake" tone="text-gold-ink" title="Weekly keepsakes" help="desk-keepsakes">
            <p>Each week a six-digit keepsake code appears in the screen’s title bar. Enter it in the companion to collect a permanent office souvenir.</p>
          </Topic>
          <Topic id="alerts-heading" glyph="bell" tone="text-hp-ink" title="Alerts, if you want them" help="alerts">
            <p>Your TRMNL is the main way to keep up. If you like, the companion can send a phone notification when the bag is full or the merchant has a deal you can afford, at most twice a day and never in quiet hours.</p>
          </Topic>
        </div>

        <section aria-labelledby="start-heading" className="window flex flex-col gap-4 p-5 sm:p-8 lg:max-w-3xl">
          <h2 id="start-heading" className="font-display text-3xl font-bold text-gold-ink">Start your hero</h2>
          <InstallCta place="landing end" />
          <Link to="/help/desk-crawler" className="inline-flex min-h-11 items-center self-start underline underline-offset-4">Setup and TRMNL help</Link>
        </section>
      </main>
    </SiteShell>
  )
}
