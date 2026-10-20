import { createFileRoute } from '@tanstack/react-router'
import { api } from '@trmnl-games/backend/api'
import { useMutation } from 'convex/react'
import { useState } from 'react'
import { launchListMessages } from '../../i18n/launchList'
import { messagesFor, useT } from '../../lib/i18n'
import { ProsePage } from '../../lib/prose'
import { seo } from '../../lib/seo'
import { Button, ErrorNote } from '../../lib/ui'

/**
 * D201: the launch email's unsubscribe link. It removes the row only when the button is pressed, so a mail scanner
 * opening the link changes nothing; a link with no id or token just says the address is off the list.
 */
export const Route = createFileRoute('/launch-list/unsubscribe')({
  headers: () => ({ 'Cache-Control': 'no-store', 'Referrer-Policy': 'no-referrer', 'X-Robots-Tag': 'noindex' }),
  head: ({ match: { context: { locale } } }) => seo({ title: messagesFor(launchListMessages, locale).unsubscribeTitle, index: false, locale }),
  validateSearch: (search: Record<string, unknown>): { id?: string; token?: string } => ({
    ...(typeof search.id === 'string' ? { id: search.id } : {}),
    ...(typeof search.token === 'string' ? { token: search.token } : {}),
  }),
  component: Unsubscribe,
})

function Unsubscribe() {
  const t = useT(launchListMessages)
  const { id, token } = Route.useSearch()
  const leave = useMutation(api.launchList.leave)
  const [state, setState] = useState<'idle' | 'pending' | 'done' | 'invalid'>(id && token ? 'idle' : 'done')
  return (
    <ProsePage title={t.unsubscribeTitle}>
      {state === 'done' ? (
        <p role="status">{t.unsubscribed}</p>
      ) : (
        <>
          <p>{t.unsubscribeIntro}</p>
          <Button
            pending={state === 'pending'}
            onClick={() => {
              setState('pending')
              void leave({ id: id ?? '', token: token ?? '' }).then((ok) => setState(ok ? 'done' : 'invalid'), () => setState('invalid'))
            }}
          >
            {t.unsubscribe}
          </Button>
          <ErrorNote message={state === 'invalid' ? t.invalid : null} />
        </>
      )}
    </ProsePage>
  )
}
