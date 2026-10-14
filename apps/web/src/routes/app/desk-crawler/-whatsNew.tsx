import { convexQuery } from '@convex-dev/react-query'
import { useQuery } from '@tanstack/react-query'
import { Link } from '@tanstack/react-router'
import { useMutation } from 'convex/react'
import { useState } from 'react'
import { api } from '@trmnl-games/backend/api'
import { CHANGELOG } from '../../../lib/changelog'
import { Glyph } from '../../../lib/glyphs'

/** At most this many change titles in the card; the rest are counted, and the page has them all. */
const SHOWN = 3

/**
 * D154: the What's new entries dated after the owner last hid this card (or, for a new player, after the day they
 * joined), as a short list of titles with a link to the page. Hiding it stores the newest entry's date on the account,
 * so it stays hidden on every device until a later entry.
 */
export function WhatsNewCard() {
  const { data: me } = useQuery(convexQuery(api.users.me, {}))
  const dismiss = useMutation(api.users.dismissWhatsNew)
  const [hidden, setHidden] = useState<string | null>(null)
  const since = me?.user?.whatsNewSince
  if (!since) return null
  const fresh = CHANGELOG.filter((entry) => entry.date > since && entry.date > (hidden ?? ''))
  if (fresh.length === 0) return null
  const titles = fresh.flatMap((entry) => entry.changes.map((change) => change.title))
  const newest = fresh[0]!.date
  return (
    <section aria-labelledby="whats-new-title" className="border-[3px] border-sky px-3 py-2 text-sm">
      <div className="flex items-baseline justify-between gap-3">
        <h2 id="whats-new-title" className="font-semibold text-sky-ink">New since your last visit</h2>
        {/* Hidden at once; a failed save only means the card comes back on the next visit. */}
        <button type="button" className="-my-2 inline-flex min-h-11 shrink-0 items-center text-muted underline underline-offset-4 hover:text-ink" onClick={() => { setHidden(newest); void dismiss({ seen: newest }).catch(() => {}) }}>Hide</button>
      </div>
      <ul className="mt-1 flex flex-col gap-1">
        {titles.slice(0, SHOWN).map((title) => <li key={title}>{title}</li>)}
        {titles.length > SHOWN ? <li className="text-muted">and {titles.length - SHOWN} more</li> : null}
      </ul>
      <Link to="/whats-new" className="mt-1 inline-flex min-h-11 items-center gap-1.5 font-semibold underline underline-offset-4">See what’s new <Glyph name="play" size={8} /></Link>
    </section>
  )
}
