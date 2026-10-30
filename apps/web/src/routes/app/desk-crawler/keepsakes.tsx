import { convexQuery } from '@convex-dev/react-query'
import { createFileRoute } from '@tanstack/react-router'
import { api } from '@trmnl-games/backend/api'
import { seo } from '../../../lib/seo'
import { messagesFor } from '../../../lib/i18n'
import { headMessages } from '../../../i18n/heads'
import { preload } from '../../../lib/preload'
import { DeskKeepsakes, keepsakeSearch } from './-keepsakes'

/** Desk keepsakes (D46) on their own page under More (D124): the code form and the shelf. */
export const Route = createFileRoute('/app/desk-crawler/keepsakes')({
  head: ({ match: { context: { locale } } }) => seo({ title: messagesFor(headMessages, locale).dcKeepsakes, index: false, locale }),
  // D218: a keepsake QR lands here (by /k/<code>) with its six digits, collected by the page and then dropped.
  validateSearch: keepsakeSearch,
  loader: ({ context }) => preload(context, convexQuery(api.keepsakes.mine, {})),
  component: KeepsakesPage,
})

function KeepsakesPage() {
  const { keepsake } = Route.useSearch()
  return <DeskKeepsakes scanned={keepsake} />
}
