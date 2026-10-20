import { Show } from '@clerk/tanstack-react-start'
import { convexQuery } from '@convex-dev/react-query'
import { useQuery } from '@tanstack/react-query'
import { Link } from '@tanstack/react-router'
import { api } from '@trmnl-games/backend/api'
import { contentV6 as content } from '@trmnl-games/idle-angler/content'
import { anglerWords } from '@trmnl-games/idle-angler/i18n'
import { TITLES } from '@trmnl-games/idle-angler/sim/titles'
import type { WaterDef } from '@trmnl-games/idle-angler/sim/types'
import { games } from '@trmnl-games/platform'
import { useConvexAuth } from 'convex/react'
import { captureAnalytics } from './analytics'
import { Glyph, type GlyphName } from './glyphs'
import { useLocale, useT } from './i18n'
import { NotifyMe } from './launchList'
import { BUTTON_PRIMARY, LINK_BUTTON } from './ui'
import { homeMessages } from '../i18n/home'
import { iaGamePage } from '../i18n/iaGamePage'
import { pitchMessages } from '../i18n/pitch'
import { shellMessages } from '../i18n/shell'

/** Idle Angler's TRMNL listing, or null while TRMNL reviews it (D210): every pitch reads this one value. */
export const IDLE_ANGLER_MARKETPLACE_URL = games['idle-angler'].marketplaceUrl as string | null

/** The latest catalog's facts for the pitch: its waters in order and how many species each holds. */
export const IA_PITCH = {
  waters: content.waters,
  species: content.species.length,
  firstTitle: TITLES[0]!.id,
  topTitle: TITLES.at(-1)!.id,
} as const

/** The signed-in viewer's angler, or null when they have none; undefined while it loads or when signed out. */
export function useMyAngler(enabled = true): { title: string; activationState: string; status: string } | null | undefined {
  const { isAuthenticated } = useConvexAuth()
  const { data } = useQuery({ ...convexQuery(api.idleAngler.anglers.dock, {}), enabled: enabled && isAuthenticated })
  return (data as { angler?: { title: string; activationState: string; status: string } | null } | undefined)?.angler
}

/**
 * Idle Angler's call to action, the block each of its pitches ends its first screen with. Listed: the Install button,
 * or the companion for a player who already has an angler. In review (no listing yet): what that means and Notify me,
 * which a player with an angler (an admin, or anyone once the game opens) skips for the companion. `compact` leaves out
 * the TRMNL requirement, as Desk Crawler's does on the home page's cards.
 */
export function IdleAnglerCta({ place, compact = false }: { place: string; compact?: boolean }) {
  const t = useT(homeMessages)
  const pitch = useT(pitchMessages)
  const shell = useT(shellMessages)
  const angler = useMyAngler()
  const listed = IDLE_ANGLER_MARKETPLACE_URL
  if (angler) {
    return (
      <div className="flex flex-col gap-4">
        <Link to="/app/idle-angler" className={`self-start ${LINK_BUTTON} ${BUTTON_PRIMARY}`}>{t.openIdleAngler}</Link>
      </div>
    )
  }
  return (
    <div className="flex flex-col gap-4">
      <p className={`text-sm font-semibold ${listed ? 'text-xp-ink' : 'text-ink'}`}>{listed ? shell.releaseStatus : t.inReview}</p>
      {listed ? (
        <>
          <a href={listed} onClick={() => captureAnalytics('install link opened', { place, game: 'idle-angler' })} className={`self-start ${LINK_BUTTON} ${BUTTON_PRIMARY}`}>{pitch.installOnTrmnl}</a>
          <Show when="signed-out"><p className="text-sm text-muted">{t.installThen}</p></Show>
          <Show when="signed-in"><p className="text-sm text-muted">{t.signedInNoAnglerBefore}<a href={listed} onClick={() => captureAnalytics('install link opened', { place, game: 'idle-angler' })} className="underline underline-offset-4 hover:text-ink">{t.signedInNoAnglerLink}</a>{t.signedInNoAnglerAfter}</p></Show>
        </>
      ) : (
        <>
          <p className="max-w-prose text-sm leading-relaxed text-muted">{t.inReviewBody}</p>
          <NotifyMe gameSlug="idle-angler" />
        </>
      )}
      {compact ? null : <p className="text-sm text-muted">{pitch.needsBefore}<a href="https://trmnl.com" className="underline underline-offset-4 hover:text-ink">{pitch.needsLink}</a>{pitch.needsAfter}</p>}
    </div>
  )
}

/** The loop, as Desk Crawler's page tells it: once, every fifteen minutes, every day or two. */
export function IaHowItPlays({ headingId }: { headingId: string }) {
  const t = useT(iaGamePage)
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

/** A few of a water's species to name under its picture: its commons first, then its rarest that is not an epic (epics stay a surprise). */
function notableSpecies(water: WaterDef): string[] {
  const here = content.species.filter((s) => s.water === water.id && s.rarity !== 'epic')
  const commons = here.filter((s) => s.rarity === 'common').slice(0, 2)
  const rare = here.filter((s) => s.rarity === 'rare').slice(-2)
  return [...commons, ...rare].map((s) => s.id)
}

/** The six waters in the order they open, each in its painted scene (tools/art/idleAnglerWaters.ts), with what opens it. */
export function WaterGrid({ headingId }: { headingId: string }) {
  const t = useT(iaGamePage)
  const words = anglerWords(useLocale())
  const waters = IA_PITCH.waters
  return (
    <section aria-labelledby={headingId} className="flex flex-col gap-6">
      <div className="flex max-w-prose flex-col gap-2">
        <h2 id={headingId} className="font-display text-3xl font-bold text-gold-ink">{t.watersHeading(waters.length, IA_PITCH.species)}</h2>
        <p className="leading-relaxed text-muted">{t.watersIntro(words.waterName(waters[0]!.id).at)}</p>
      </div>
      <ul className="grid gap-x-5 gap-y-8 sm:grid-cols-2 lg:grid-cols-3">
        {waters.map((water) => {
          const count = content.species.filter((s) => s.water === water.id).length
          const opens = water.opensAfter ? t.opensAfter(water.opensAfter.species, words.waterName(water.opensAfter.water)) : t.startsHere
          const needs = water.charter ? t.byTicket : water.access ? t.needs(words.pass(water.access)) : null
          return (
            <li key={water.id} className="flex flex-col gap-2">
              <img src={`/games/idle-angler/waters/${water.id}.png`} alt="" width={152} height={40} loading="lazy" className="block h-auto w-full border-[3px] border-night [image-rendering:pixelated]" />
              <div className="flex flex-col">
                <h3 className="font-display text-xl font-bold">{words.water(water.id)}</h3>
                <p className="text-sm text-faint">{[opens, needs, water.openIn?.includes('winter') ? t.winterOnly : null].filter(Boolean).join(' · ')}</p>
              </div>
              <p className="text-sm leading-relaxed text-muted">{t.speciesHere(count)} {notableSpecies(water).map((id) => words.species(id)).join(', ')}</p>
            </li>
          )
        })}
      </ul>
    </section>
  )
}

/** Each feature card's mark, in the order of the page's `features` (the copy is per language). */
const FEATURE_MARKS: ReadonlyArray<{ glyph: GlyphName; tone: string }> = [
  { glyph: 'clock', tone: 'text-sky-ink' },
  { glyph: 'tag', tone: 'text-gold-ink' },
  { glyph: 'coin', tone: 'text-gold-ink' },
  { glyph: 'bag', tone: 'text-sky-ink' },
  { glyph: 'cog', tone: 'text-rare-ink' },
  { glyph: 'star', tone: 'text-xp-ink' },
  { glyph: 'crown', tone: 'text-gold-ink' },
  { glyph: 'medal', tone: 'text-gold-ink' },
  { glyph: 'trophy', tone: 'text-gold-ink' },
  { glyph: 'flag', tone: 'text-xp-ink' },
  { glyph: 'keepsake', tone: 'text-rare-ink' },
  { glyph: 'bell', tone: 'text-hp-ink' },
]

/** What there is to do besides watch, one card per system. */
export function IaFeatureGrid({ headingId }: { headingId: string }) {
  const t = useT(iaGamePage)
  const words = anglerWords(useLocale())
  const features = t.features(IA_PITCH.species, words.title(IA_PITCH.firstTitle), words.title(IA_PITCH.topTitle)).map((copy, i) => ({ ...copy, ...FEATURE_MARKS[i]! }))
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

/** Questions as native disclosure rows, as Desk Crawler's page has them. */
export function IaFaq({ headingId }: { headingId: string }) {
  const t = useT(iaGamePage)
  return (
    <section aria-labelledby={headingId} className="flex flex-col gap-6">
      <h2 id={headingId} className="font-display text-3xl font-bold text-gold-ink">{t.questions}</h2>
      <div className="flex flex-col border-t border-rule">
        {t.faq.map((item) => (
          <details key={item.q} className="border-b border-rule">
            <summary className="min-h-14 cursor-pointer py-3 font-semibold hover:text-gold-ink">{item.q}</summary>
            <p className="max-w-prose pb-5 pl-[1.125rem] leading-relaxed text-muted">{item.a}</p>
          </details>
        ))}
      </div>
    </section>
  )
}
