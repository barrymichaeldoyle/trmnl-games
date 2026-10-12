import { convexQuery } from '@convex-dev/react-query'
import { createFileRoute } from '@tanstack/react-router'
import { api } from '@trmnl-games/backend/api'
import { seo } from '../../../lib/seo'
import { preload } from '../../../lib/preload'
import { Achievements } from './-achievements'

/** Achievements on their own page under More (D124), with the earned badges, the ones still to find and a hint once a day has passed (D127). */
export const Route = createFileRoute('/app/desk-crawler/achievements')({
  head: () => seo({ title: 'Achievements', index: false }),
  loader: ({ context }) => preload(context, convexQuery(api.achievements.mine, {}), convexQuery(api.heroes.mine, {}), convexQuery(api.inventory.mine, {}), convexQuery(api.keepsakes.mine, {})),
  component: Achievements,
})
