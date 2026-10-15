import { createFileRoute } from '@tanstack/react-router'
import type { Locale } from '@trmnl-games/platform'
import { POLICY_UPDATED, ProsePage } from '../lib/prose'
import { seo } from '../lib/seo'
import { formatDate, useLocale } from '../lib/i18n'
import type { LegalPage } from './-legal'
import { termsEn } from './-terms.en'
import { termsFr } from './-terms.fr'
import { termsDe } from './-terms.de'

/** D169: the terms in each language; the English text prevails. */
const PAGES: Readonly<Record<Locale, LegalPage>> = { en: termsEn, fr: termsFr, de: termsDe }

export const Route = createFileRoute('/terms')({
  head: ({ match: { context: { locale } } }) => seo({ title: PAGES[locale].seoTitle ?? PAGES[locale].title, path: '/terms', description: PAGES[locale].description, locale }),
  component: Terms,
})

function Terms() {
  const locale = useLocale()
  const page = PAGES[locale]
  return (
    <ProsePage title={page.title} updated={formatDate(locale, Date.parse(`${POLICY_UPDATED}T12:00:00Z`), { day: 'numeric', month: 'long', year: 'numeric', timeZone: 'UTC' })}>
      {page.translationNote ? <page.translationNote /> : null}
      <page.Body />
    </ProsePage>
  )
}
