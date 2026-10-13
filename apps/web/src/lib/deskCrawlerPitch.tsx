import { Show, SignInButton } from '@clerk/tanstack-react-start'
import { Link } from '@tanstack/react-router'
import { FAQ } from './deskCrawlerFaq'
import { FLOORS, UNLOCKS } from './facts.gen'
import { Glyph, type GlyphName } from './glyphs'
import { BIOME_BANDS } from './palette'
import { DESK_CRAWLER_INSTALL_URL, RELEASE_STATUS } from './prose'
import { BUTTON_PRIMARY, Button, LINK_BUTTON } from './ui'
import { useAnalyticsView } from './analyticsProvider'
import { captureAnalytics } from './analytics'
import { PRELOAD_CLERK_UI } from './clerkUi'

/**
 * The real device screen, framed like a TRMNL: the labelled sample shared by the public pages and the signed-out
 * companion; it never creates a hero. `priority` marks it as the page's main image, so it loads first.
 */
export function DeviceSample({ caption, priority = false }: { caption: string; priority?: boolean }) {
  return (
    <figure className="flex flex-col gap-3">
      <div className="rounded-[1.4rem] bg-[#3a3566] p-[clamp(0.5rem,2.5vw,1rem)] shadow-[0_0_0_3px_var(--color-night),0_24px_48px_-24px_rgb(0_0_0/0.8)]">
        {/* Rendered from the marketing preview (tools/trmnl/preview.ts --marketing --recap) on the X full layout. 16-colour
            PNGs, the X's own 4-bit greys, beat WebP at both sizes: 800px for phones at 2x, 1200px for 3x phones and desktop. */}
        <img
          src="/games/desk-crawler/screen-sample.png"
          srcSet="/games/desk-crawler/screen-sample-800.png 800w, /games/desk-crawler/screen-sample.png 1200w"
          sizes="(min-width: 1024px) 600px, 100vw"
          alt="Example Desk Crawler screen on a TRMNL X: Pip, level 7, explores the Server Room on the Bold stance. Its adventure stories include a desk raid on another player, beside today's to-do list, the current goal, the weekly rankings, the night recap and this week's keepsake code."
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
function FloorScene({ id, name, featured }: { id: string; name: string; featured: string }) {
  const bands = BIOME_BANDS[id] ?? BIOME_BANDS.office_cubicles!
  return (
    <div className="relative overflow-hidden border-[3px] border-night">
      <div aria-hidden="true" className="absolute inset-0 grid grid-rows-[18%_14%_40%_28%]">
        {bands.map((colour, i) => <div key={i} style={{ background: colour }} />)}
      </div>
      <img src={`/games/desk-crawler/floors/${id}.png`} alt={`A hero fights a ${featured} in the ${name}`} width={152} height={40} loading="lazy" className="relative block h-auto w-full pt-6 [image-rendering:pixelated]" />
    </div>
  )
}

/** The building's floors in order, each with its picture, opening level and monsters (generated from the active catalog). */
export function FloorGrid({ headingId, headingLevel: Heading = 'h2' }: { headingId: string; headingLevel?: 'h2' | 'h3' }) {
  return (
    <section aria-labelledby={headingId} className="flex flex-col gap-6">
      <div className="flex max-w-prose flex-col gap-2">
        <Heading id={headingId} className="font-display text-3xl font-bold text-gold-ink">{FLOORS.length} floors, {FLOORS.reduce((sum, floor) => sum + floor.monsters.length, 0)} monsters</Heading>
        <p className="leading-relaxed text-muted">Your hero starts in the {FLOORS[0]?.name}, where nothing can knock it out. Deeper floors open as it levels up, with tougher monsters and better loot. You choose when to travel.</p>
      </div>
      <ul className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-5">
        {FLOORS.map((floor) => (
          <li key={floor.id} className="flex flex-col gap-2">
            <FloorScene id={floor.id} name={floor.name} featured={floor.featured} />
            <div className="flex flex-col">
              <h3 className="font-display text-xl font-bold">{floor.name}</h3>
              <p className="text-sm text-faint">{floor.level === 1 ? 'From the start' : `Opens at level ${floor.level}`}</p>
            </div>
            <p className="text-sm leading-relaxed text-muted">{floor.monsters.join(', ')}</p>
          </li>
        ))}
      </ul>
    </section>
  )
}

/** The loop by how often each part happens, which also gives the order; the adventure lines are from the sample screen. */
const STEPS: ReadonlyArray<{ when: string; title: string; body: string; lines?: readonly string[] }> = [
  { when: 'Once', title: 'Install it on your TRMNL', body: 'Add Desk Crawler from the TRMNL marketplace, name your hero in the companion and press Save.' },
  { when: 'Every 15 minutes', title: 'Your hero adventures', body: 'Fights, finds, traps and the odd knockout, day and night, whether or not your screen is awake.', lines: ['Untangled a Cable Serpent and zip-tied it.', 'Found gold under a raised floor tile.'] },
  { when: 'Every few days', title: 'You check in', body: 'Open the companion on your phone to sort the bag and pick the next floor.' },
]

/** The loop for a visitor who has never seen an idle game on e-ink. */
export function HowItPlays({ headingId }: { headingId: string }) {
  return (
    <section aria-labelledby={headingId} className="flex flex-col gap-8">
      <h2 id={headingId} className="font-display text-3xl font-bold text-gold-ink">How it plays</h2>
      <ol className="grid gap-10 md:grid-cols-3 md:gap-8">
        {STEPS.map((step) => (
          <li key={step.when} className="flex flex-col gap-2 border-t-2 border-rule pt-5">
            <p className="text-sm font-semibold text-gold-ink">{step.when}</p>
            <h3 className="font-display text-2xl font-bold">{step.title}</h3>
            <p className="leading-relaxed text-muted">{step.body}</p>
            {step.lines ? (
              <ul aria-label="From a sample screen" className="mt-2 flex flex-col gap-1 border-l-2 border-gold/60 pl-3 text-sm">
                {step.lines.map((line) => <li key={line}>{line}</li>)}
              </ul>
            ) : null}
          </li>
        ))}
      </ol>
    </section>
  )
}

const FEATURES: ReadonlyArray<{ glyph: GlyphName; tone: string; title: string; body: string }> = [
  { glyph: 'sword', tone: 'text-hp-ink', title: 'Desk raids', body: 'Heroes raid each other’s desks for gold while they explore. Your stance tilts the coin toss; level and gear never count.' },
  { glyph: 'trophy', tone: 'text-gold-ink', title: 'Rankings and rivals', body: 'Your screen shows the seven-day XP Top 5 for your level group. Follow other heroes from their public pages and pick one rival to keep an eye on.' },
  { glyph: 'shield', tone: 'text-sky-ink', title: 'Stances', body: 'Choose how careful your hero is. Bolder heroes earn more and get knocked out more often; how much more is something you find out on the screen.' },
  { glyph: 'coin', tone: 'text-gold-ink', title: 'Decisions and a merchant', body: 'Chip in for the cake or stay late. A wandering merchant sometimes sells items at a discount.' },
  { glyph: 'cog', tone: 'text-rare-ink', title: 'Loot and the workbench', body: 'Gear comes in four rarities, with traits like Vampiric and Lucky on the best. Salvage spares, upgrade what you wear and save up for a bigger bag.' },
  { glyph: 'heart', tone: 'text-hp-ink', title: 'Meetings', body: 'Now and then your hero runs into another player’s hero on the same floor. They split a sandwich or swap war stories, and both get a small boost for a while.' },
  { glyph: 'tag', tone: 'text-gold-ink', title: 'Lost property', body: 'A knocked-out hero drops a spare of its weapon or armour with the owner’s name on it in marker. Another player’s hero might find it, and the owner hears who did.' },
  { glyph: 'flag', tone: 'text-xp-ink', title: 'Office calendar', body: 'Boss’s Day, Halloween, Christmas and more dress up your hero’s scene for the day, and most bring a small bonus while they last.' },
  { glyph: 'quest', tone: 'text-xp-ink', title: 'A career to climb', body: 'One goal at a time, a daily to-do list from the morning stand-up, and new features as your hero levels up.' },
  { glyph: 'hero', tone: 'text-sky-ink', title: 'A second hero', body: `Everyone starts as a Warrior. At level ${UNLOCKS.roster} you can recruit a Rogue, who earns more gold and has an edge in desk raids.` },
  { glyph: 'keepsake', tone: 'text-rare-ink', title: 'Weekly keepsakes', body: 'A six-digit code appears on your screen each week. Enter it in the companion to collect an office souvenir.' },
  { glyph: 'bell', tone: 'text-hp-ink', title: 'Optional alerts', body: 'A phone notification when the bag is full or the merchant has a deal you can afford. Off until you turn it on.' },
]

/** What there is to do besides watch, one card per system, with the numbers players see in the game. */
export function FeatureGrid({ headingId }: { headingId: string }) {
  return (
    <section aria-labelledby={headingId} className="flex flex-col gap-6">
      <div className="flex max-w-prose flex-col gap-2">
        <h2 id={headingId} className="font-display text-3xl font-bold text-gold-ink">What’s in the game</h2>
        <p className="leading-relaxed text-muted">Your hero plays on its own, and the companion gives you plenty to steer.</p>
      </div>
      <ul className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {FEATURES.map((feature) => (
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
  return (
    <section aria-labelledby={headingId} className="flex flex-col gap-6">
      <h2 id={headingId} className="font-display text-3xl font-bold text-gold-ink">Questions</h2>
      <div className="flex flex-col border-t border-rule">
        {FAQ.map((item) => (
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
  return <a href={DESK_CRAWLER_INSTALL_URL} onClick={() => captureAnalytics('install link opened', { place })} className={`self-start ${LINK_BUTTON} ${BUTTON_PRIMARY} ${className}`}>Install on TRMNL</a>
}

/**
 * Release status, the install link and the TRMNL requirement: the block every pitch ends its first screen with. A
 * signed-in visitor gets the companion first: it shows their hero, or how to start one.
 */
export function InstallCta({ place }: { place: string }) {
  return (
    <div className="flex flex-col gap-4">
      <p className="text-sm font-semibold text-xp-ink">{RELEASE_STATUS}</p>
      <Show when="signed-out">
        <InstallLink place={place} />
        <p className="text-sm text-muted">Then sign in here to name your hero and click Save. The first adventure shows up within 15 minutes.</p>
      </Show>
      <Show when="signed-in">
        <Link to="/app/desk-crawler" className={`self-start ${LINK_BUTTON} ${BUTTON_PRIMARY}`}>Open Desk Crawler</Link>
        <p className="text-sm text-muted">You’re signed in. No hero yet? <a href={DESK_CRAWLER_INSTALL_URL} onClick={() => captureAnalytics('install link opened', { place })} className="underline underline-offset-4 hover:text-ink">Install Desk Crawler on TRMNL</a> and connect it with this account.</p>
      </Show>
      <p className="text-sm text-muted">Needs a <a href="https://trmnl.com" className="underline underline-offset-4 hover:text-ink">TRMNL e-ink display</a>. The game runs on our servers; the screen shows what happened.</p>
    </div>
  )
}

/**
 * Signed-out view of the companion routes (D102). The screen's QR codes lead here, so a visitor who scanned someone
 * else's TRMNL learns what Desk Crawler is and that it needs a TRMNL before being asked to sign in.
 */
export function DeskCrawlerSignedOut() {
  useAnalyticsView('setup screen shown', { setup_state: 'signed_out' })
  return (
    <main id="main" className="mx-auto flex w-full max-w-2xl flex-col gap-8 px-4 py-10">
      <header className="flex flex-col gap-3">
        <h1 className="flex items-center gap-4 font-display text-3xl font-bold leading-tight sm:text-4xl"><img src="/games/desk-crawler/icon-192.png" alt="" width={64} height={64} className="size-12 [image-rendering:pixelated] sm:size-14" />Desk Crawler</h1>
        <p className="text-lg">An office RPG that plays itself on a TRMNL e-ink display.</p>
        <p className="text-muted">Every fifteen minutes a hero fights, finds loot or gets knocked out, and the screen shows what happened. Players open this companion every few days to sort gear and pick the next floor.</p>
      </header>
      <DeviceSample caption="Sample hero on a TRMNL X." priority />
      <section className="flex flex-col gap-3" aria-labelledby="play-heading">
        <h2 id="play-heading" className="font-display text-xl font-semibold">Want your own hero?</h2>
        <p>Desk Crawler is free and needs a <a href="https://trmnl.com" className="underline underline-offset-4">TRMNL</a> display. Install it from the marketplace, sign in here to name your hero, then click Save.</p>
        <InstallLink place="qr pitch" />
        <div className="flex flex-wrap items-center gap-4">
          <Link to="/" className="inline-flex min-h-11 items-center underline underline-offset-4">About Desk Crawler</Link>
          <Link to="/help/desk-crawler" className="inline-flex min-h-11 items-center underline underline-offset-4">Setup and TRMNL help</Link>
        </div>
      </section>
      <section className="flex flex-col gap-3 border-t border-rule pt-6" aria-labelledby="signin-heading">
        <h2 id="signin-heading" className="font-display text-xl font-semibold">Already playing?</h2>
        <p>Sign in to open your hero, bag and rankings.</p>
        <div><SignInButton mode="modal"><Button variant="secondary" {...PRELOAD_CLERK_UI}>Sign in</Button></SignInButton></div>
      </section>
    </main>
  )
}
