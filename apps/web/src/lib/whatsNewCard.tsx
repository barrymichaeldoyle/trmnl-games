import { convexQuery } from '@convex-dev/react-query'
import { useQuery } from '@tanstack/react-query'
import { Link } from '@tanstack/react-router'
import { useMutation } from 'convex/react'
import { useState } from 'react'
import { api } from '@trmnl-games/backend/api'
import { changeKeys, type GameTag } from './changelog'
import { Glyph } from './glyphs'
import { Button } from './ui'
import { useLocale, useT } from './i18n'
import { whatsNewMessages } from '../i18n/whatsNew'

/** At most this many change titles in the card; the rest are counted, and the page has them all. */
const SHOWN = 3

/**
 * D154: the What's new changes added after the owner last acknowledged this card (or, for a new player, from the day
 * they joined), as a short list of titles with a link to the page. D243: it is headed New to you, since it lists what
 * the player has not acknowledged rather than what changed since a visit, and it sits near the top of the page; Nice
 * (or following the link to the page) stores the newest change's key on the account, so it stays away on every device
 * until a later change, even one added the same day. With nothing new it is gone, and What's new waits on the More tab.
 * D225: each game's page shows its own changes and the ones for everyone; the mark is the account's, so acknowledging
 * on one page clears both.
 */
export function WhatsNewCard({ game }: { game: GameTag }) {
  const { data: me } = useQuery(convexQuery(api.users.me, {}))
  const dismiss = useMutation(api.users.dismissWhatsNew)
  const [seen, setSeen] = useState<string | null>(null)
  const t = useT(whatsNewMessages)
  const locale = useLocale()
  const since = me?.user?.whatsNewSince
  if (!since) return null
  const fresh = changeKeys(locale, game).filter((change) => change.key > since && change.key > (seen ?? ''))
  if (fresh.length === 0) return null
  const titles = fresh.map((change) => change.title)
  const newest = fresh[0]!.key
  // Cleared at once; a failed save only means the card comes back on the next visit.
  const acknowledge = () => { setSeen(newest); void dismiss({ seen: newest }).catch(() => {}) }
  return (
    <section aria-labelledby="whats-new-title" className="border-[3px] border-sky px-3 py-2 text-sm">
      <h2 id="whats-new-title" className="font-semibold text-sky-ink">{t.newToYou}</h2>
      <ul className="mt-1 flex flex-col gap-1">
        {titles.slice(0, SHOWN).map((title) => <li key={title}>{title}</li>)}
        {titles.length > SHOWN ? <li className="text-muted">{t.andMore(titles.length - SHOWN)}</li> : null}
      </ul>
      <div className="mt-2 flex flex-wrap items-center justify-between gap-x-4 gap-y-1">
        <Link to="/whats-new" search={{ game }} onClick={acknowledge} className="inline-flex min-h-11 items-center gap-1.5 font-semibold underline underline-offset-4">{t.seeWhatsNew} <Glyph name="play" size={8} /></Link>
        <Button variant="secondary" allowOffline onClick={acknowledge}>{t.nice}</Button>
      </div>
    </section>
  )
}
