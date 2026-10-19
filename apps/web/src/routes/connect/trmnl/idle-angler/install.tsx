import { Show, SignIn } from '@clerk/tanstack-react-start'
import { convexQuery } from '@convex-dev/react-query'
import { useQuery } from '@tanstack/react-query'
import { createFileRoute, Link, redirect } from '@tanstack/react-router'
import { useRef, useState, type FormEvent } from 'react'
import { api } from '@trmnl-games/backend/api'
import { ALIAS_RULE } from '@trmnl-games/platform'
import { requireOpenGame } from '../../../../lib/gameAccess'
import { seo } from '../../../../lib/seo'
import { SwitchAccount } from '../../../../lib/switchAccount'
import { captureInstall, finishInstall, getPendingInstall } from '../../../../server/installFns'
import { Button, LoadingState } from '../../../../lib/ui'
import { captureAnalytics, readAnalyticsConsent } from '../../../../lib/analytics'
import { reportError } from '../../../../lib/errorReporting'
import { NameField } from '../../../../lib/nameField'
import { messagesFor, useT } from '../../../../lib/i18n'
import { iaConnect } from '../../../../i18n/iaConnect'

type Search = { code?: string; installation_callback_url?: string; invalid?: boolean }

/**
 * Idle Angler's TRMNL install landing (D115), the Desk Crawler flow without a character name: the angler shows the
 * public name. Not-found until the game is live, except for admins; Convex refuses non-admin links too.
 */
export const Route = createFileRoute('/connect/trmnl/idle-angler/install')({
  validateSearch: (search: Record<string, unknown>): Search => ({
    ...(typeof search.code === 'string' ? { code: search.code } : {}),
    ...(typeof search.installation_callback_url === 'string' ? { installation_callback_url: search.installation_callback_url } : {}),
    ...(search.invalid === true || search.invalid === 'true' ? { invalid: true } : {}),
  }),
  beforeLoad: async ({ search }) => {
    if (search.code !== undefined || search.installation_callback_url !== undefined) {
      const result = await captureInstall({ data: { gameSlug: 'idle-angler', code: search.code ?? '', callback: search.installation_callback_url ?? '' } })
      throw redirect({ to: '/connect/trmnl/idle-angler/install', search: result.ok ? {} : { invalid: true }, replace: true })
    }
  },
  loader: async ({ context }) => {
    await requireOpenGame(context, 'idle-angler')
    return await getPendingInstall({ data: { gameSlug: 'idle-angler' } })
  },
  head: ({ match: { context: { locale } } }) => {
    const head = seo({ title: messagesFor(iaConnect, locale).connectTitle, index: false, locale })
    return { ...head, meta: [...head.meta, { name: 'referrer', content: 'no-referrer' }] }
  },
  component: InstallPage,
})

function InstallPage() {
  const { pending } = Route.useLoaderData()
  const { invalid } = Route.useSearch()
  const t = useT(iaConnect)
  if (!pending) {
    return (
      <Page>
        <h1 className="font-display text-3xl font-bold">{t.connectTitle}</h1>
        {invalid ? <p role="alert">{t.invalidInstall}</p> : null}
        <p>{t.startFrom}</p>
        <Link to="/help/idle-angler" className="inline-flex min-h-11 items-center underline underline-offset-4">{t.setupHelp}</Link>
      </Page>
    )
  }
  return (
    <Page>
      <h1 className="font-display text-3xl font-bold">{t.connectToGame}</h1>
      <Show when="signed-out">
        <p>{t.signInToContinue}</p>
        <SignIn routing="hash" forceRedirectUrl="/connect/trmnl/idle-angler/install" signUpForceRedirectUrl="/connect/trmnl/idle-angler/install" />
      </Show>
      <Show when="signed-in">
        <ConnectForm />
      </Show>
    </Page>
  )
}

function ConnectForm() {
  const { data: me } = useQuery(convexQuery(api.users.me, {}))
  const [submitting, setSubmitting] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [alias, setAlias] = useState('')
  const inFlight = useRef(false)
  const t = useT(iaConnect)
  if (me === undefined) return <LoadingState label={t.loadingAccount} />
  const needsProfile = !me?.user

  async function onSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()
    if (inFlight.current) return
    if (!navigator.onLine) { setError(t.offline); return }
    inFlight.current = true
    setSubmitting(true)
    setError(null)
    const form = new FormData(event.currentTarget)
    captureAnalytics('installation submitted', { game: 'idle-angler', needs_profile: needsProfile })
    try {
      const result = await finishInstall({ data: { gameSlug: 'idle-angler', analyticsConsent: readAnalyticsConsent() === 'allowed', ...(needsProfile ? { publicAlias: String(form.get('publicAlias') ?? '') } : {}) } })
      if (result.ok) { window.location.assign(result.callbackUrl); return }
      captureAnalytics('installation failed', { game: 'idle-angler', error_code: result.code })
      setError(result.message)
    } catch (caught) {
      captureAnalytics('installation failed', { game: 'idle-angler', error_code: 'NETWORK_OR_SERVER_ERROR' })
      reportError(caught, 'installation')
      setError(t.networkError)
    } finally { inFlight.current = false; setSubmitting(false) }
  }

  return (
    <form onSubmit={onSubmit} data-analytics-private className="flex flex-col gap-4">
      {needsProfile ? (
        <>
          <p className="border-y border-edge py-3 text-sm">{t.newAccount}</p>
          <NameField label={t.publicName} note={t.publicNameNote} rule={ALIAS_RULE} noun={t.publicNameNoun} name="publicAlias" value={alias} onChange={setAlias} disabled={submitting} />
        </>
      ) : (
        <p>{t.signedInBefore}<strong>{me?.user?.publicAlias}</strong>{t.signedInAfter}</p>
      )}
      <SwitchAccount returnTo="/connect/trmnl/idle-angler/install" />
      {error ? <p role="alert" className="font-semibold text-hp-ink">{error}</p> : null}
      <Button type="submit" pending={submitting} busyLabel={t.connecting}>{t.connect}</Button>
      <p className="text-sm text-muted">{t.nextSave}</p>
    </form>
  )
}

function Page({ children }: { children: React.ReactNode }) {
  return <main id="main" className="mx-auto flex max-w-lg flex-col gap-4 px-4 py-12">{children}</main>
}
