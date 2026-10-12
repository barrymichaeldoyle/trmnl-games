import { convexQuery } from '@convex-dev/react-query'
import { useQuery } from '@tanstack/react-query'
import { createFileRoute } from '@tanstack/react-router'
import { api } from '@trmnl-games/backend/api'
import { seo } from '../../../lib/seo'
import { preload } from '../../../lib/preload'
import { LoadingState } from '../../../lib/ui'
import { CareerLadder, type CareerView, type UnlockView } from './-career'

/** The career ladder on its own page under More (P35): every rung in order, and which features the hero's level has opened. */
export const Route = createFileRoute('/app/desk-crawler/career')({
  head: () => seo({ title: 'Career', index: false }),
  loader: ({ context }) => preload(context, convexQuery(api.heroes.mine, {})),
  component: CareerPage,
})

function CareerPage() {
  const { data: hero } = useQuery(convexQuery(api.heroes.mine, {}))
  if (!hero) return <LoadingState label="Loading your hero…" />
  const career = hero.career as CareerView | null
  if (!career) return <p className="text-muted">The career ladder arrives with your hero's next adventure.</p>
  return <CareerLadder career={career} unlocks={hero.unlocks as UnlockView | null} floors={hero.biomes as Array<{ name: string; unlockLevel: number }>} />
}
