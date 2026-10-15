import { Show, SignInButton } from '@clerk/tanstack-react-start'
import { Link } from '@tanstack/react-router'
import { FAQ } from './deskCrawlerFaq'
import { FLOORS, UNLOCKS } from './facts.gen'
import { Glyph, type GlyphName } from './glyphs'
import { BIOME_BANDS } from './palette'
import { DESK_CRAWLER_INSTALL_URL } from './prose'
import { BUTTON_PRIMARY, Button, LINK_BUTTON } from './ui'
import { useAnalyticsView } from './analyticsProvider'
import { captureAnalytics } from './analytics'
import { PRELOAD_CLERK_UI } from './clerkUi'
import { useLocale, useT } from './i18n'
import { pitchMessages } from '../i18n/pitch'
import { shellMessages } from '../i18n/shell'

/**
 * The real device screen, framed like a TRMNL: the labelled sample shared by the public pages and the signed-out
 * companion; it never creates a hero. `priority` marks it as the page's main image, so it loads first.
 */
export function DeviceSample({ caption, priority = false }: { caption: string; priority?: boolean }) {
  const t = useT(pitchMessages)
  return (
    <figure className="flex flex-col gap-3">
      <div className="rounded-[1.4rem] bg-[#3a3566] p-[clamp(0.5rem,2.5vw,1rem)] shadow-[0_0_0_3px_var(--color-night),0_24px_48px_-24px_rgb(0_0_0/0.8)]">
        {/* Rendered from the marketing preview (tools/trmnl/preview.ts --marketing --recap) on the X full layout. 16-colour
            PNGs, the X's own 4-bit greys, beat WebP at both sizes: 800px for phones at 2x, 1200px for 3x phones and desktop. */}
        <img
          src="/games/desk-crawler/screen-sample.png"
          srcSet="/games/desk-crawler/screen-sample-800.png 800w, /games/desk-crawler/screen-sample.png 1200w"
          sizes="(min-width: 1024px) 600px, 100vw"
          alt={t.sampleAlt}
          width={1200}
          height={900}
          fetchPriority={priority ? 'high' : undefined}
          loading={priority ? undefined : 'lazy'}
          className="block h-auto w-full rounded-md bg-white"
        />
      </div>
      <figcaption className="text-sm text-muted">{caption}</figcaption>
    </figure>
  )
}

/** One floor's painted fight scene over its sky, wall and floor bands, as the hero page paints it (D96). */
function FloorScene({ id, alt }: { id: string; alt: string }) {
  const bands = BIOME_BANDS[id] ?? BIOME_BANDS.office_cubicles!
  return (
    <div className="relative overflow-hidden border-[3px] border-night">
      <div aria-hidden="true" className="absolute inset-0 grid grid-rows-[18%_14%_40%_28%]">
        {bands.map((colour, i) => <div key={i} style={{ background: colour }} />)}
      </div>
      <img src={`/games/desk-crawler/floors/${id}.png`} alt={alt} width={152} height={40} loading="lazy" className="relative block h-auto w-full pt-6 [image-rendering:pixelated]" />
    </div>
  )
}

/** The building's floors in order, each with its picture, opening level and monsters (generated from the active catalog). */
export function FloorGrid({ headingId, headingLevel: Heading = 'h2' }: { headingId: string; headingLevel?: 'h2' | 'h3' }) {
  const t = useT(pitchMessages)
  const locale = useLocale()
  // D169: the generated facts carry each floor's French and German names.
  const floors = FLOORS.map((floor) => (locale === 'en' ? { ...floor, alt: `A hero fights a ${floor.featured} in the ${floor.name}` } : { ...floor, ...floor[locale] }))
  return (
    <section aria-labelledby={headingId} className="flex flex-col gap-6">
      <div className="flex max-w-prose flex-col gap-2">
        <Heading id={headingId} className="font-display text-3xl font-bold text-gold-ink">{t.floorsHeading(floors.length, floors.reduce((sum, floor) => sum + floor.monsters.length, 0))}</Heading>
        <p className="leading-relaxed text-muted">{t.floorsIntro(floors[0]?.name ?? '')}</p>
      </div>
      <ul className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-5">
        {floors.map((floor) => (
          <li key={floor.id} className="flex flex-col gap-2">
            <FloorScene id={floor.id} alt={floor.alt} />
            <div className="flex flex-col">
              <h3 className="font-display text-xl font-bold">{floor.name}</h3>
              <p className="text-sm text-faint">{floor.level === 1 ? t.fromTheStart : t.opensAt(floor.level)}</p>
            </div>
            <p className="text-sm leading-relaxed text-muted">{floor.monsters.join(', ')}</p>
          </li>
        ))}
      </ul>
    </section>
  )
}

/** The loop for a visitor who has never seen an idle game on e-ink. */
export function HowItPlays({ headingId }: { headingId: string }) {
  const t = useT(pitchMessages)
  return (
    <section aria-labelledby={headingId} className="flex flex-col gap-8">
      <h2 id={headingId} className="font-display text-3xl font-bold text-gold-ink">{t.howItPlays}</h2>
      <ol className="grid gap-10 md:grid-cols-3 md:gap-8">
        {t.steps.map((step) => (
          <li key={step.when} className="flex flex-col gap-2 border-t-2 border-rule pt-5">
            <p className="text-sm font-semibold text-gold-ink">{step.when}</p>
            <h3 className="font-display text-2xl font-bold">{step.title}</h3>
            <p className="leading-relaxed text-muted">{step.body}</p>
            {step.lines ? (
              <ul aria-label={t.sampleLines} className="mt-2 flex flex-col gap-1 border-l-2 border-gold/60 pl-3 text-sm">
                {step.lines.map((line) => <li key={line}>{line}</li>)}
              </ul>
            ) : null}
          </li>
        ))}
      </ol>
    </section>
  )
}

/** Each feature card's mark, in the order of the catalog's `features` (D169: the copy is per language). */
const FEATURE_MARKS: ReadonlyArray<{ glyph: GlyphName; tone: string }> = [
  { glyph: 'sword', tone: 'text-hp-ink' },
  { glyph: 'trophy', tone: 'text-gold-ink' },
  { glyph: 'shield', tone: 'text-sky-ink' },
  { glyph: 'coin', tone: 'text-gold-ink' },
  { glyph: 'cog', tone: 'text-rare-ink' },
  { glyph: 'heart', tone: 'text-hp-ink' },
  { glyph: 'tag', tone: 'text-gold-ink' },
  { glyph: 'flag', tone: 'text-xp-ink' },
  { glyph: 'quest', tone: 'text-xp-ink' },
  { glyph: 'hero', tone: 'text-sky-ink' },
  { glyph: 'keepsake', tone: 'text-rare-ink' },
  { glyph: 'bell', tone: 'text-hp-ink' },
]

/** What there is to do besides watch, one card per system, with the numbers players see in the game. */
export function FeatureGrid({ headingId }: { headingId: string }) {
  const t = useT(pitchMessages)
  const features = t.features(UNLOCKS.roster).map((copy, i) => ({ ...copy, ...FEATURE_MARKS[i]! }))
  return (
    <section aria-labelledby={headingId} className="flex flex-col gap-6">
      <div className="flex max-w-prose flex-col gap-2">
        <h2 id={headingId} className="font-display text-3xl font-bold text-gold-ink">{t.whatsInTheGame}</h2>
        <p className="leading-relaxed text-muted">{t.whatsInIntro}</p>
      </div>
      <ul className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {features.map((feature) => (
          <li key={feature.title} className="window flex flex-col gap-2 p-5">
            <h3 className="flex items-center gap-3 font-display text-xl font-bold"><Glyph name={feature.glyph} size={20} className={feature.tone} />{feature.title}</h3>
            <p className="leading-relaxed text-muted">{feature.body}</p>
          </li>
        ))}
      </ul>
    </section>
  )
}

/** The FAQ as native disclosure rows: keyboard and screen-reader ready with no script. */
export function Faq({ headingId }: { headingId: string }) {
  const t = useT(pitchMessages)
  const locale = useLocale()
  return (
    <section aria-labelledby={headingId} className="flex flex-col gap-6">
      <h2 id={headingId} className="font-display text-3xl font-bold text-gold-ink">{t.questions}</h2>
      <div className="flex flex-col border-t border-rule">
        {FAQ[locale].map((item) => (
          <details key={item.q} className="border-b border-rule">
            {/* The site's pixel triangle (styles.css) marks each row open or closed. */}
            <summary className="min-h-14 cursor-pointer py-3 font-semibold hover:text-gold-ink">{item.q}</summary>
            <p className="max-w-prose pb-5 pl-[1.125rem] leading-relaxed text-muted">{item.a}</p>
          </details>
        ))}
      </div>
    </section>
  )
}

/** The marketplace listing's Install button, counted by where it sits. */
export function InstallLink({ place, className = '' }: { place: string; className?: string }) {
  const t = useT(pitchMessages)
  return <a href={DESK_CRAWLER_INSTALL_URL} onClick={() => captureAnalytics('install link opened', { place })} className={`self-start ${LINK_BUTTON} ${BUTTON_PRIMARY} ${className}`}>{t.installOnTrmnl}</a>
}

/**
 * Release status, the install link and the TRMNL requirement: the block every pitch ends its first screen with. A
 * signed-in visitor gets the companion first: it shows their hero, or how to start one.
 */
export function InstallCta({ place }: { place: string }) {
  const t = useT(pitchMessages)
  const shell = useT(shellMessages)
  return (
    <div className="flex flex-col gap-4">
      <p className="text-sm font-semibold text-xp-ink">{shell.releaseStatus}</p>
      <Show when="signed-out">
        <InstallLink place={place} />
        <p className="text-sm text-muted">{t.thenSignIn}</p>
      </Show>
      <Show when="signed-in">
        <Link to="/app/desk-crawler" className={`self-start ${LINK_BUTTON} ${BUTTON_PRIMARY}`}>{t.openDeskCrawler}</Link>
        <p className="text-sm text-muted">{t.signedInBefore}<a href={DESK_CRAWLER_INSTALL_URL} onClick={() => captureAnalytics('install link opened', { place })} className="underline underline-offset-4 hover:text-ink">{t.signedInLink}</a>{t.signedInAfter}</p>
      </Show>
      <p className="text-sm text-muted">{t.needsBefore}<a href="https://trmnl.com" className="underline underline-offset-4 hover:text-ink">{t.needsLink}</a>{t.needsAfter}</p>
    </div>
  )
}

/**
 * Signed-out view of the companion routes (D102). The screen's QR codes lead here, so a visitor who scanned someone
 * else's TRMNL learns what Desk Crawler is and that it needs a TRMNL before being asked to sign in.
 */
export function DeskCrawlerSignedOut() {
  useAnalyticsView('setup screen shown', { setup_state: 'signed_out' })
  const t = useT(pitchMessages)
  return (
    <main id="main" className="mx-auto flex w-full max-w-2xl flex-col gap-8 px-4 py-10">
      <header className="flex flex-col gap-3">
        <h1 className="flex items-center gap-4 font-display text-3xl font-bold leading-tight sm:text-4xl"><img src="/games/desk-crawler/icon-192.png" alt="" width={64} height={64} className="size-12 [image-rendering:pixelated] sm:size-14" />Desk Crawler</h1>
        <p className="text-lg">{t.tagline}</p>
        <p className="text-muted">{t.signedOutIntro}</p>
      </header>
      <DeviceSample caption={t.sampleCaption} priority />
      <section className="flex flex-col gap-3" aria-labelledby="play-heading">
        <h2 id="play-heading" className="font-display text-xl font-semibold">{t.wantYourOwn}</h2>
        <p>{t.wantBefore}<a href="https://trmnl.com" className="underline underline-offset-4">TRMNL</a>{t.wantAfter}</p>
        <InstallLink place="qr pitch" />
        <div className="flex flex-wrap items-center gap-4">
          <Link to="/" className="inline-flex min-h-11 items-center underline underline-offset-4">{t.aboutDeskCrawler}</Link>
          <Link to="/help/desk-crawler" className="inline-flex min-h-11 items-center underline underline-offset-4">{t.setupHelp}</Link>
        </div>
      </section>
      <section className="flex flex-col gap-3 border-t border-rule pt-6" aria-labelledby="signin-heading">
        <h2 id="signin-heading" className="font-display text-xl font-semibold">{t.alreadyPlaying}</h2>
        <p>{t.alreadyBody}</p>
        <div><SignInButton mode="modal"><Button variant="secondary" {...PRELOAD_CLERK_UI}>{t.signIn}</Button></SignInButton></div>
      </section>
    </main>
  )
}
