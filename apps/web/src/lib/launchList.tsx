import { Show } from '@clerk/tanstack-react-start'
import { convexQuery } from '@convex-dev/react-query'
import { useQuery } from '@tanstack/react-query'
import { useMutation } from 'convex/react'
import { useState, type FormEvent } from 'react'
import { api } from '@trmnl-games/backend/api'
import { launchListMessages } from '../i18n/launchList'
import { captureAnalytics } from './analytics'
import { useLocale, useT } from './i18n'
import { errorMessage } from './intent'
import { Button, ErrorNote } from './ui'

type ListedGame = 'idle-angler'

/**
 * D201: Notify me for a game that is coming soon. A signed-in player taps once and nothing is typed, since their
 * address comes from their account at launch; a visitor leaves an email. Either way, one email at launch.
 */
export function NotifyMe({ gameSlug, variant = 'primary' }: { gameSlug: ListedGame; variant?: 'primary' | 'secondary' }) {
  return (
    <>
      <Show when="signed-in"><AccountNotify gameSlug={gameSlug} variant={variant} /></Show>
      <Show when="signed-out"><EmailNotify gameSlug={gameSlug} /></Show>
    </>
  )
}

function AccountNotify({ gameSlug, variant }: { gameSlug: ListedGame; variant: 'primary' | 'secondary' }) {
  const t = useT(launchListMessages)
  const locale = useLocale()
  const { data: onList } = useQuery(convexQuery(api.launchList.mine, { gameSlug }))
  const notify = useMutation(api.launchList.notifyMe)
  const leave = useMutation(api.launchList.leaveMine)
  const [pending, setPending] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const run = async (action: () => Promise<unknown>, event: 'launch list joined' | 'launch list left') => {
    setPending(true)
    setError(null)
    try {
      await action()
      captureAnalytics(event, { game: gameSlug, signed_in: true })
    } catch (caught) {
      setError(errorMessage(caught))
    } finally {
      setPending(false)
    }
  }
  if (onList === undefined) return null
  return (
    <div className="flex flex-col gap-2">
      {onList ? (
        <>
          <p role="status" className="font-semibold">{t.onList}</p>
          <Button variant="quiet" className="self-start" disabled={pending} onClick={() => void run(() => leave({ gameSlug }), 'launch list left')}>{t.leave}</Button>
        </>
      ) : (
        <Button variant={variant} className="self-start" pending={pending} busyLabel={t.adding} onClick={() => void run(() => notify({ gameSlug, locale }), 'launch list joined')}>
          {/* D210: the short label on phones, where the long one wraps in the arcade face. */}
          <span className="sm:hidden">{t.join}</span><span className="max-sm:hidden">{t.notifyMe}</span>
        </Button>
      )}
      <ErrorNote message={error} />
    </div>
  )
}

function EmailNotify({ gameSlug }: { gameSlug: ListedGame }) {
  const t = useT(launchListMessages)
  const locale = useLocale()
  const join = useMutation(api.launchList.join)
  const [email, setEmail] = useState('')
  const [website, setWebsite] = useState('')
  const [state, setState] = useState<'idle' | 'pending' | 'done'>('idle')
  const [error, setError] = useState<string | null>(null)
  if (state === 'done') return <p role="status" className="font-semibold">{t.joined}</p>
  const submit = async (event: FormEvent) => {
    event.preventDefault()
    setState('pending')
    setError(null)
    try {
      await join({ gameSlug, email, locale, ...(website ? { website } : {}) })
      captureAnalytics('launch list joined', { game: gameSlug, signed_in: false })
      setState('done')
    } catch (caught) {
      setError(errorMessage(caught))
      setState('idle')
    }
  }
  return (
    <form onSubmit={submit} data-analytics-private className="flex flex-col gap-2">
      <div className="flex flex-wrap items-end gap-2">
        <label className="flex min-w-0 grow flex-col gap-1 sm:max-w-xs">
          <span className="text-sm font-semibold">{t.emailLabel}</span>
          <input type="email" required value={email} onChange={(e) => setEmail(e.target.value)} autoComplete="email" placeholder={t.emailPlaceholder} className="min-h-11 border-2 border-edge bg-ground px-3 text-base" />
        </label>
        {/* Only bots fill this in; the backend drops what they send. */}
        <input type="text" name="website" value={website} onChange={(e) => setWebsite(e.target.value)} tabIndex={-1} autoComplete="off" aria-hidden="true" className="hidden" />
        <Button type="submit" pending={state === 'pending'} busyLabel={t.adding}>{t.join}</Button>
      </div>
      <p className="text-sm text-muted">{t.emailNote}</p>
      <ErrorNote message={error} />
    </form>
  )
}
