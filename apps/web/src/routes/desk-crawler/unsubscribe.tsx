import { createFileRoute } from '@tanstack/react-router'
import { api } from '@trmnl-games/backend/api'
import { useMutation } from 'convex/react'
import { useState } from 'react'
import { useT } from '../../lib/i18n'
import { ProsePage } from '../../lib/prose'
import { seo } from '../../lib/seo'
import { Button, ErrorNote } from '../../lib/ui'
import { pagesMessages } from '../../i18n/pages'

export const Route = createFileRoute('/desk-crawler/unsubscribe')({
  headers: () => ({ 'Cache-Control': 'no-store', 'Referrer-Policy': 'no-referrer', 'X-Robots-Tag': 'noindex' }),
  head: () => seo({ title: 'Emails', index: false }),
  validateSearch: (search: Record<string, unknown>): { u?: string; t?: string } => ({
    ...(typeof search.u === 'string' ? { u: search.u } : {}),
    ...(typeof search.t === 'string' ? { t: search.t } : {}),
  }),
  component: Unsubscribe,
})

/**
 * Two links land here. The hero reminder's stop link (D198) carries the account and its token, and stops reminders
 * only when the button is pressed, so a mail scanner opening the link changes nothing. The launch email's link (D105)
 * carries neither: that list was deleted when the one email went out, so there is nothing left to remove.
 */
function Unsubscribe() {
  const { u, t: token } = Route.useSearch()
  if (u && token) return <StopReminders userId={u} token={token} />
  return (
    <ProsePage title="Launch list">
      <p role="status">You’re off the list. The launch email was the only one we sent, and every address on the list has been deleted.</p>
    </ProsePage>
  )
}

function StopReminders({ userId, token }: { userId: string; token: string }) {
  const t = useT(pagesMessages)
  const stop = useMutation(api.heroReminder.stop)
  const [state, setState] = useState<'idle' | 'pending' | 'done' | 'invalid'>('idle')
  return (
    <ProsePage title={t.stopTitle}>
      {state === 'done' ? (
        <p role="status">{t.stopDone}</p>
      ) : (
        <>
          <p>{t.stopIntro}</p>
          <Button
            pending={state === 'pending'}
            onClick={() => {
              setState('pending')
              void stop({ userId, token }).then((ok) => setState(ok ? 'done' : 'invalid'), () => setState('invalid'))
            }}
          >
            {t.stopButton}
          </Button>
          <ErrorNote message={state === 'invalid' ? t.stopInvalid : null} />
        </>
      )}
    </ProsePage>
  )
}
