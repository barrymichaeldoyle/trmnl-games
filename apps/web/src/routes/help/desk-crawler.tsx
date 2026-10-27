import { createFileRoute } from '@tanstack/react-router'
import { ProsePage } from '../../lib/prose'
import { DESK_CRAWLER_OG, seo } from '../../lib/seo'
import { useLocale } from '../../lib/i18n'
import { contentsOf, deskCrawlerHelp } from './-deskCrawlerHelp'
import { DESK_CRAWLER_HELP_HEAD } from './-helpHeads'

/** D169: the guide is written out in each language; the catalog's numbers come from -deskCrawlerFacts. D215: one language loads. */
export const Route = createFileRoute('/help/desk-crawler')({
  head: ({ match: { context: { locale } } }) => seo({ title: DESK_CRAWLER_HELP_HEAD[locale].seoTitle, path: '/help/desk-crawler', description: DESK_CRAWLER_HELP_HEAD[locale].description, image: DESK_CRAWLER_OG, locale }),
  // Imported on demand: the loader ships in the main bundle, and the guide loader carries the section list and facts (D212).
  loader: ({ context }) => import('./-deskCrawlerHelp').then((m) => m.loadDeskCrawlerHelp(context.locale)),
  component: HelpRoute,
})

function HelpRoute() {
  const page = deskCrawlerHelp(useLocale())
  if (!page) return null
  return (
    <ProsePage title={page.title} contents={contentsOf(page)}>
      <page.Body />
    </ProsePage>
  )
}
