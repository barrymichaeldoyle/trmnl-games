import { createFileRoute } from '@tanstack/react-router'
import type { Locale } from '@trmnl-games/platform'
import { ProsePage } from '../../lib/prose'
import { DESK_CRAWLER_OG, seo } from '../../lib/seo'
import { useLocale } from '../../lib/i18n'
import { contentsOf, type HelpPage } from './-deskCrawlerHelp'
import { en } from './-deskCrawlerHelp.en'
import { fr } from './-deskCrawlerHelp.fr'
import { de } from './-deskCrawlerHelp.de'

/** D169: the guide is written out in each language; the catalog's numbers come from -deskCrawlerFacts. */
const PAGES: Readonly<Record<Locale, HelpPage>> = { en, fr, de }

export const Route = createFileRoute('/help/desk-crawler')({
  head: ({ match: { context: { locale } } }) => seo({ title: PAGES[locale].seoTitle, path: '/help/desk-crawler', description: PAGES[locale].description, image: DESK_CRAWLER_OG, locale }),
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
