import { convexQuery } from '@convex-dev/react-query'
import { createFileRoute } from '@tanstack/react-router'
import { api } from '@trmnl-games/backend/api'
import { seo } from '../../../lib/seo'
import { messagesFor } from '../../../lib/i18n'
import { dcMoreMessages } from '../../../i18n/dcMore'
import { preload } from '../../../lib/preload'
import { DeskKeepsakes } from './-keepsakes'

/** Desk keepsakes (D46) on their own page under More (D124): the code form and the shelf. */
export const Route = createFileRoute('/app/desk-crawler/keepsakes')({
  head: ({ match: { context: { locale } } }) => seo({ title: messagesFor(dcMoreMessages, locale).links.keepsakes.label, index: false, locale }),
  loader: ({ context }) => preload(context, convexQuery(api.keepsakes.mine, {})),
  component: DeskKeepsakes,
})
