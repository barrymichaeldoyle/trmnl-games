import { convexQuery } from '@convex-dev/react-query'
import { useQuery } from '@tanstack/react-query'
import { Link } from '@tanstack/react-router'
import { useMutation } from 'convex/react'
import { useState } from 'react'
import { api } from '@trmnl-games/backend/api'
import { changeKeys } from '../../../lib/changelog'
import { Glyph } from '../../../lib/glyphs'
import { useLocale, useT } from '../../../lib/i18n'
import { dcScreenMessages } from '../../../i18n/dcScreen'

/** At most this many change titles in the card; the rest are counted, and the page has them all. */
const SHOWN = 3

/**
 * D154: the What's new changes added after the owner last hid this card (or, for a new player, from the day they
 * joined), as a short list of titles with a link to the page. Hiding it stores the newest change's key on the account,
 * so it stays hidden on every device until a later change, even one added the same day.
 */
export function WhatsNewCard() {
  const { data: me } = useQuery(convexQuery(api.users.me, {}))
  const dismiss = useMutation(api.users.dismissWhatsNew)
  const [hidden, setHidden] = useState<string | null>(null)
  const t = useT(dcScreenMessages)
  const locale = useLocale()
  const since = me?.user?.whatsNewSince
  if (!since) return null
  const fresh = changeKeys(locale).filter((change) => change.key > since && change.key > (hidden ?? ''))
  if (fresh.length === 0) return null
  const titles = fresh.map((change) => change.title)
  const newest = fresh[0]!.key
  return (
    <section aria-labelledby="whats-new-title" className="border-[3px] border-sky px-3 py-2 text-sm">
      <div className="flex items-baseline justify-between gap-3">
        <h2 id="whats-new-title" className="font-semibold text-sky-ink">{t.newSinceVisit}</h2>
        {/* Hidden at once; a failed save only means the card comes back on the next visit. */}
        <button type="button" className="-my-2 inline-flex min-h-11 shrink-0 items-center text-muted underline underline-offset-4 hover:text-ink" onClick={() => { setHidden(newest); void dismiss({ seen: newest }).catch(() => {}) }}>{t.hide}</button>
      </div>
      <ul className="mt-1 flex flex-col gap-1">
        {titles.slice(0, SHOWN).map((title) => <li key={title}>{title}</li>)}
        {titles.length > SHOWN ? <li className="text-muted">{t.andMore(titles.length - SHOWN)}</li> : null}
      </ul>
      <Link to="/whats-new" className="mt-1 inline-flex min-h-11 items-center gap-1.5 font-semibold underline underline-offset-4">{t.seeWhatsNew} <Glyph name="play" size={8} /></Link>
    </section>
  )
}
