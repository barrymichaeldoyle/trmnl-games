import { Link } from '@tanstack/react-router'
import { useEffect, useState } from 'react'
import { useGames } from '../../../lib/gameAccess'
import { useT } from '../../../lib/i18n'
import { IDLE_ANGLER_MARKETPLACE_URL, useMyAngler } from '../../../lib/idleAnglerPitch'
import { NotifyMe } from '../../../lib/launchList'
import { homeMessages } from '../../../i18n/home'

const DISMISSED_KEY = 'idle-angler-note-dismissed'

/**
 * D210: a Desk Crawler player's one note about the second game, under the game screen. While TRMNL reviews Idle Angler
 * it offers Notify me; once listed it points at the game's page. It stays away for good once dismissed on this device,
 * and for a player who already has an angler.
 */
export function IdleAnglerNote() {
  const t = useT(homeMessages)
  const listing = useGames()
  const live = listing?.games.some((game) => game.slug === 'idle-angler' && game.status === 'live') === true
  const angler = useMyAngler(live)
  // Read after mount: the server render has no storage, and a dismissed note must not flash in first.
  const [dismissed, setDismissed] = useState(true)
  useEffect(() => {
    try { setDismissed(window.localStorage.getItem(DISMISSED_KEY) === '1') } catch { setDismissed(false) }
  }, [])
  if (!live || dismissed || angler !== null) return null
  const dismiss = () => {
    setDismissed(true)
    try { window.localStorage.setItem(DISMISSED_KEY, '1') } catch { /* private mode: hidden for this visit only */ }
  }
  return (
    <section aria-labelledby="ia-note-title" className="flex flex-col gap-3 border-[3px] border-night bg-panel p-4 sm:flex-row sm:items-start sm:gap-4">
      <img src="/games/idle-angler/icon-192.png" alt="" width={48} height={48} className="size-12 shrink-0 [image-rendering:pixelated]" />
      <div className="flex min-w-0 grow flex-col gap-2">
        <div className="flex items-baseline justify-between gap-3">
          <h2 id="ia-note-title" className="font-display text-xl font-bold text-gold-ink">{IDLE_ANGLER_MARKETPLACE_URL ? t.noteListedTitle : t.noteTitle}</h2>
          <button type="button" onClick={dismiss} className="-my-2 inline-flex min-h-11 shrink-0 items-center text-sm text-muted underline underline-offset-4 hover:text-ink">{t.dismiss}</button>
        </div>
        <p className="text-sm leading-relaxed text-muted">{IDLE_ANGLER_MARKETPLACE_URL ? t.noteListedBody : t.noteBody}</p>
        {IDLE_ANGLER_MARKETPLACE_URL ? null : <NotifyMe gameSlug="idle-angler" variant="secondary" />}
        <Link to="/games/idle-angler" className="inline-flex min-h-11 items-center self-start text-sm font-semibold underline underline-offset-4">{t.about('Idle Angler')}</Link>
      </div>
    </section>
  )
}
