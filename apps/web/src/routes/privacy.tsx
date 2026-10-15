import { createFileRoute } from '@tanstack/react-router'
import type { Locale } from '@trmnl-games/platform'
import { AfterListing, useGames } from '../lib/gameAccess'
import { PRIVACY_UPDATED, ProsePage } from '../lib/prose'
import { seo } from '../lib/seo'
import { formatDate, useLocale } from '../lib/i18n'
import type { LegalPage } from './-legal'
import { privacyEn } from './-privacy.en'
import { privacyFr } from './-privacy.fr'
import { privacyDe } from './-privacy.de'

/** D169: the policy in each language; the English text prevails. */
const PAGES: Readonly<Record<Locale, LegalPage>> = { en: privacyEn, fr: privacyFr, de: privacyDe }

/**
 * Idle Angler's and Paper Lives' parts of the policy (D115, D159). Each renders once its game is listed (preview or
 * live), so a hidden game stays unannounced; admins, the only players while it is hidden, see it too. They render in the
 * browser (AfterListing), so the rest of the policy is not held behind the listing.
 */
function ListedGame({ slug, Part }: { slug: string; Part?: LegalPage['IdleAngler'] }) {
  const data = useGames()
  if (!Part || !data?.games.some((game) => game.slug === slug)) return null
  return <Part />
}

export const Route = createFileRoute('/privacy')({
  head: ({ match: { context: { locale } } }) => seo({ title: PAGES[locale].title, path: '/privacy', description: PAGES[locale].description, locale }),
  component: Privacy,
})

function Privacy() {
  const locale = useLocale()
  const page = PAGES[locale]
  return (
    <ProsePage title={page.title} updated={formatDate(locale, Date.parse(`${PRIVACY_UPDATED}T12:00:00Z`), { day: 'numeric', month: 'long', year: 'numeric', timeZone: 'UTC' })}>
      {page.translationNote ? <page.translationNote /> : null}
      <page.Body />
      <AfterListing><ListedGame slug="idle-angler" Part={page.IdleAngler} /></AfterListing>
      <AfterListing><ListedGame slug="paper-lives" Part={page.PaperLives} /></AfterListing>
    </ProsePage>
  )
}
