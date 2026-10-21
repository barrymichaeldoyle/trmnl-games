import { createFileRoute } from '@tanstack/react-router'
import type { Locale } from '@trmnl-games/platform'
import { requireOpenGame } from '../../lib/gameAccess'
import { useLocale } from '../../lib/i18n'
import { ProsePage } from '../../lib/prose'
import { seo } from '../../lib/seo'
import { contentsOf, type HelpPage } from './-idleAnglerHelp'
import { IDLE_ANGLER_HELP_HEAD, SAMPLE_IMAGE } from './-helpHeads'
import { en } from './-idleAnglerHelp.en'
import { fr } from './-idleAnglerHelp.fr'
import { de } from './-idleAnglerHelp.de'
import { es } from './-idleAnglerHelp.es'
import { it } from './-idleAnglerHelp.it'
import { pt } from './-idleAnglerHelp.pt'
import { pl } from './-idleAnglerHelp.pl'
import { nl } from './-idleAnglerHelp.nl'

/** D200: the guide is written out in each language; its numbers and names come from the catalog and `anglerWords`. */
const PAGES: Readonly<Record<Locale, HelpPage>> = { en, fr, de, es, it, pt, pl, nl }

/** Idle Angler help (idle-angler.md "Companion"). Hidden with the game until it is live (D115). */
export const Route = createFileRoute('/help/idle-angler')({
  loader: ({ context }) => requireOpenGame(context, 'idle-angler'),
  head: ({ match: { context: { locale } } }) => seo({ title: IDLE_ANGLER_HELP_HEAD[locale].seoTitle, path: '/help/idle-angler', description: IDLE_ANGLER_HELP_HEAD[locale].description, image: SAMPLE_IMAGE, locale }),
  component: HelpRoute,
})

function HelpRoute() {
  const page = PAGES[useLocale()]
  return (
    <ProsePage title={page.title} contents={contentsOf(page)}>
      <page.Body />
    </ProsePage>
  )
}
