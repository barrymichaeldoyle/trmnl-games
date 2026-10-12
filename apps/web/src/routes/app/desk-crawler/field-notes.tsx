import { convexQuery } from '@convex-dev/react-query'
import { useQuery } from '@tanstack/react-query'
import { createFileRoute } from '@tanstack/react-router'
import { api } from '@trmnl-games/backend/api'
import { seo } from '../../../lib/seo'
import { preload } from '../../../lib/preload'
import { LoadingState } from '../../../lib/ui'
import { FieldNotes, type LoreView } from './-fieldNotes'

/** The hero's field notes on their own page under More (D133): every floor and monster, open or still a "?". */
export const Route = createFileRoute('/app/desk-crawler/field-notes')({
  head: () => seo({ title: 'Field notes', index: false }),
  loader: ({ context }) => preload(context, convexQuery(api.heroes.mine, {})),
  component: FieldNotesPage,
})

function FieldNotesPage() {
  const { data: hero } = useQuery(convexQuery(api.heroes.mine, {}))
  if (!hero) return <LoadingState label="Loading your hero…" />
  const lore = hero.lore as LoreView | null
  if (!lore) return <p className="text-muted">Field notes arrive with the next content update.</p>
  return <FieldNotes lore={lore} level={hero.level} />
}
