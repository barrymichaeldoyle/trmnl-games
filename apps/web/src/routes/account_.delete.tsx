import { Show, SignIn, useClerk, useUser } from '@clerk/tanstack-react-start'
import { Link, createFileRoute, redirect } from '@tanstack/react-router'
import { useRef, useState, type FormEvent } from 'react'
import { stopAnalytics } from '../lib/analytics'
import { seo } from '../lib/seo'
import { SwitchAccount } from '../lib/switchAccount'
import { Button } from '../lib/ui'
import { captureDeletionLink, confirmAccountDeletion, pendingDeletionLink } from '../server/deletionFns'
import { documentLocale, messagesFor, useT } from '../lib/i18n'
import { headMessages } from '../i18n/heads'
import { accountMessages } from '../i18n/account'
import { serverMessage } from '../i18n/serverMessages'

export const Route = createFileRoute('/account_/delete')({
  validateSearch: (search: Record<string, unknown>): { token?: string; invalid?: boolean } => ({
    ...(typeof search.token === 'string' ? { token: search.token } : {}),
    ...(search.invalid === true || search.invalid === 'true' ? { invalid: true } : {}),
  }),
  beforeLoad: async ({ search }) => {
    if (search.token !== undefined) {
      const result = await captureDeletionLink({ data: { token: search.token } })
      throw redirect({ to: '/account/delete', search: result.ok ? {} : { invalid: true }, replace: true })
    }
  },
  loader: () => pendingDeletionLink(),
  headers: () => ({ 'Cache-Control': 'no-store', 'Referrer-Policy': 'no-referrer', 'X-Robots-Tag': 'noindex' }),
  head: ({ match: { context: { locale } } }) => {
    const head = seo({ title: messagesFor(headMessages, locale).accountDelete, index: false, locale })
    return { ...head, meta: [...head.meta, { name: 'referrer', content: 'no-referrer' }] }
  },
  component: DeletePage,
})

function DeletePage() {
  const { pending } = Route.useLoaderData()
  const { invalid } = Route.useSearch()
  const t = useT(accountMessages)
  return <main id="main" data-analytics-private className="mx-auto flex max-w-lg flex-col gap-4 px-4 py-12">
    <h1 className="font-display text-3xl font-bold">{t.deleteTitle}</h1>
    {!pending || invalid ? <><p role="alert">{t.linkUnavailable}</p><Link to="/account" className="inline-flex min-h-11 items-center underline underline-offset-4">{t.requestNewLink}</Link></> : <>
      <p>{t.stillActive}</p>
      <Show when="signed-out"><p>{t.signInRequester}</p><SignIn routing="hash" forceRedirectUrl="/account/delete" signUpForceRedirectUrl="/account/delete" /></Show>
      <Show when="signed-in"><DeleteForm /></Show>
    </>}
  </main>
}

function DeleteForm() {
  const clerk = useClerk()
  const { user } = useUser()
  const [confirm, setConfirm] = useState('')
  const [pending, setPending] = useState(false)
  const [started, setStarted] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const inFlight = useRef(false)
  const operationId = useRef<string | null>(null)
  const t = useT(accountMessages)
  if (started) return <p role="status">{t.deletionStarted}</p>
  async function submit(event: FormEvent) {
    event.preventDefault()
    if (confirm !== 'DELETE' || inFlight.current) return
    if (!navigator.onLine) { setError(t.offlineConfirm); return }
    inFlight.current = true
    setPending(true)
    setError(null)
    operationId.current ??= crypto.randomUUID()
    try {
      const result = await confirmAccountDeletion({ data: { operationId: operationId.current, confirm: 'DELETE' } })
      if (!result.ok) { setError(serverMessage(result.message, documentLocale())); return }
      stopAnalytics()
      setStarted(true)
      await clerk.signOut({ redirectUrl: '/' }).catch(() => {})
    } catch { setError(t.couldntConfirm) }
    finally { inFlight.current = false; setPending(false) }
  }
  return <form onSubmit={submit} className="flex flex-col gap-4">
    <p>{t.deletingBefore}<strong>{user?.primaryEmailAddress?.emailAddress}</strong>{t.deletingAfter}</p>
    <p>{t.deleteWarning}</p>
    <SwitchAccount returnTo="/account/delete" />
    <label className="flex flex-col gap-2"><span className="font-semibold">{t.typeDelete}</span><input value={confirm} onChange={(event) => setConfirm(event.target.value)} autoComplete="off" autoCapitalize="characters" spellCheck={false} disabled={pending} className="min-h-11 border-2 border-edge bg-ground px-3 text-base" /></label>
    {error ? <p role="alert">{error}</p> : null}
    <Button type="submit" variant="danger" pending={pending} busyLabel={t.removing} disabled={confirm !== 'DELETE'}>{t.deleteForever}</Button>
    <Link to="/account" className="inline-flex min-h-11 items-center underline underline-offset-4">{t.keepAccount}</Link>
  </form>
}
