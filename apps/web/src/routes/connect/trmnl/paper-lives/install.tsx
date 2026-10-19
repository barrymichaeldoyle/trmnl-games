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

type Search = { code?: string; installation_callback_url?: string; invalid?: boolean }

/**
 * Paper Lives' TRMNL install landing (D159), Idle Angler's flow: only a public name, since the game names each
 * character itself (renamed in the first year). Not-found until the game is live, except for admins; Convex refuses non-admin links too.
 */
export const Route = createFileRoute('/connect/trmnl/paper-lives/install')({
  validateSearch: (search: Record<string, unknown>): Search => ({
    ...(typeof search.code === 'string' ? { code: search.code } : {}),
    ...(typeof search.installation_callback_url === 'string' ? { installation_callback_url: search.installation_callback_url } : {}),
    ...(search.invalid === true || search.invalid === 'true' ? { invalid: true } : {}),
  }),
  beforeLoad: async ({ search }) => {
    if (search.code !== undefined || search.installation_callback_url !== undefined) {
      const result = await captureInstall({ data: { gameSlug: 'paper-lives', code: search.code ?? '', callback: search.installation_callback_url ?? '' } })
      throw redirect({ to: '/connect/trmnl/paper-lives/install', search: result.ok ? {} : { invalid: true }, replace: true })
    }
  },
  loader: async ({ context }) => {
    await requireOpenGame(context, 'paper-lives')
    return await getPendingInstall({ data: { gameSlug: 'paper-lives' } })
  },
  head: () => {
    const head = seo({ title: 'Connect TRMNL', index: false })
    return { ...head, meta: [...head.meta, { name: 'referrer', content: 'no-referrer' }] }
  },
  component: InstallPage,
})

function InstallPage() {
  const { pending } = Route.useLoaderData()
  const { invalid } = Route.useSearch()
  if (!pending) {
    return (
      <Page>
        <h1 className="font-display text-3xl font-bold">Connect TRMNL</h1>
        {invalid ? <p role="alert">That installation link was not valid.</p> : null}
        <p>Start from the Paper Lives plugin in your TRMNL account and choose Install. TRMNL will bring you back here.</p>
        <Link to="/help/paper-lives" className="inline-flex min-h-11 items-center underline underline-offset-4">Help with setup</Link>
      </Page>
    )
  }
  return (
    <Page>
      <h1 className="font-display text-3xl font-bold">Connect TRMNL to Paper Lives</h1>
      <Show when="signed-out">
        <p>Sign in or create your TRMNL Games account to continue.</p>
        <SignIn routing="hash" forceRedirectUrl="/connect/trmnl/paper-lives/install" signUpForceRedirectUrl="/connect/trmnl/paper-lives/install" />
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
  if (me === undefined) return <LoadingState label="Loading your account…" />
  const needsProfile = !me?.user

  async function onSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()
    if (inFlight.current) return
    if (!navigator.onLine) { setError('You are offline. Reconnect to continue setup.'); return }
    inFlight.current = true
    setSubmitting(true)
    setError(null)
    const form = new FormData(event.currentTarget)
    captureAnalytics('installation submitted', { game: 'paper-lives', needs_profile: needsProfile })
    try {
      const result = await finishInstall({ data: { gameSlug: 'paper-lives', analyticsConsent: readAnalyticsConsent() === 'allowed', ...(needsProfile ? { publicAlias: String(form.get('publicAlias') ?? '') } : {}) } })
      if (result.ok) { window.location.assign(result.callbackUrl); return }
      captureAnalytics('installation failed', { game: 'paper-lives', error_code: result.code })
      setError(result.message)
    } catch (caught) {
      captureAnalytics('installation failed', { game: 'paper-lives', error_code: 'NETWORK_OR_SERVER_ERROR' })
      reportError(caught, 'installation')
      setError('We couldn’t finish connecting. Check your connection and try again.')
    } finally { inFlight.current = false; setSubmitting(false) }
  }

  return (
    <form onSubmit={onSubmit} data-analytics-private className="flex flex-col gap-4">
      {needsProfile ? (
        <>
          <p className="border-y border-edge py-3 text-sm">This sign-in has no TRMNL Games account yet, so connecting creates one. If you already play another game, switch account and sign in the way you did before.</p>
          <NameField label="Public name" note="Your name on Paper Lives' boards and TRMNL screens. No contact details." rule={ALIAS_RULE} noun="public name" name="publicAlias" value={alias} onChange={setAlias} disabled={submitting} />
        </>
      ) : (
        <p>Signed in as <strong>{me?.user?.publicAlias}</strong>. Your lives go on the boards under this name.</p>
      )}
      <SwitchAccount returnTo="/connect/trmnl/paper-lives/install" />
      {error ? <p role="alert" className="font-semibold text-hp-ink">{error}</p> : null}
      <Button type="submit" pending={submitting} busyLabel="Connecting…">Connect TRMNL</Button>
      <p className="text-sm text-muted">Next, TRMNL will ask you to save the plugin. Once you do, your first baby will be born within fifteen minutes.</p>
    </form>
  )
}

function Page({ children }: { children: React.ReactNode }) {
  return <main id="main" className="mx-auto flex max-w-lg flex-col gap-4 px-4 py-12">{children}</main>
}
