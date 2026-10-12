import { convexQuery } from '@convex-dev/react-query'
import { createFileRoute } from '@tanstack/react-router'
import { api } from '@trmnl-games/backend/api'
import { seo } from '../../../lib/seo'
import { preload } from '../../../lib/preload'
import { DeskKeepsakes } from './-keepsakes'

/** Desk keepsakes (D46) on their own page under More (D124): the code form and the shelf. */
export const Route = createFileRoute('/app/desk-crawler/keepsakes')({
  head: () => seo({ title: 'Desk keepsakes', index: false }),
  loader: ({ context }) => preload(context, convexQuery(api.keepsakes.mine, {})),
  component: DeskKeepsakes,
})
