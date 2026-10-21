import { convexQuery } from '@convex-dev/react-query'
import { useQuery } from '@tanstack/react-query'
import { createFileRoute } from '@tanstack/react-router'
import { api } from '@trmnl-games/backend/api'
import { seo } from '../../../lib/seo'
import { messagesFor, useT } from '../../../lib/i18n'
import { headMessages } from '../../../i18n/heads'
import { dcPagesMessages } from '../../../i18n/dcPages'
import { preload } from '../../../lib/preload'
import { LoadingState } from '../../../lib/ui'
import { FieldNotes, type LoreView } from './-fieldNotes'

/** The hero's field notes on their own page under More (D133): every floor and monster, open or still a "?". */
export const Route = createFileRoute('/app/desk-crawler/field-notes')({
  head: ({ match: { context: { locale } } }) => seo({ title: messagesFor(headMessages, locale).dcNotes, index: false, locale }),
  loader: ({ context }) => preload(context, convexQuery(api.heroes.mine, {})),
  component: FieldNotesPage,
})

function FieldNotesPage() {
  const { data: hero } = useQuery(convexQuery(api.heroes.mine, {}))
  const t = useT(dcPagesMessages)
  if (!hero) return <LoadingState label={t.loadingHero} />
  const lore = hero.lore as LoreView | null
  if (!lore) return <p className="text-muted">{t.notesLater}</p>
  return <FieldNotes lore={lore} level={hero.level} />
}
