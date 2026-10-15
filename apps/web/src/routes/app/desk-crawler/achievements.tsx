import { convexQuery } from '@convex-dev/react-query'
import { createFileRoute } from '@tanstack/react-router'
import { api } from '@trmnl-games/backend/api'
import { seo } from '../../../lib/seo'
import { messagesFor } from '../../../lib/i18n'
import { dcAchievementsMessages } from '../../../i18n/dcAchievements'
import { preload } from '../../../lib/preload'
import { Achievements } from './-achievements'

/** Achievements on their own page under More (D124), with the earned badges, the ones still to find and a hint once a day has passed (D127). */
export const Route = createFileRoute('/app/desk-crawler/achievements')({
  head: ({ match: { context: { locale } } }) => seo({ title: messagesFor(dcAchievementsMessages, locale).title, index: false, locale }),
  loader: ({ context }) => preload(context, convexQuery(api.achievements.mine, {}), convexQuery(api.heroes.mine, {}), convexQuery(api.inventory.mine, {}), convexQuery(api.keepsakes.mine, {})),
  component: Achievements,
})
