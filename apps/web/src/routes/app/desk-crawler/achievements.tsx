import { convexQuery } from '@convex-dev/react-query'
import { createFileRoute } from '@tanstack/react-router'
import { api } from '@trmnl-games/backend/api'
import { seo } from '../../../lib/seo'
import { preload } from '../../../lib/preload'
import { Achievements } from './-achievements'

/** Achievements on their own page under More (D124), with the earned badges and the ones still to find. */
export const Route = createFileRoute('/app/desk-crawler/achievements')({
  head: () => seo({ title: 'Achievements', index: false }),
  loader: ({ context }) => preload(context, convexQuery(api.achievements.mine, {})),
  component: () => <Achievements as="h1" />,
})
