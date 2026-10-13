import { Show, SignIn } from '@clerk/tanstack-react-start'
import { convexQuery } from '@convex-dev/react-query'
import { useQuery } from '@tanstack/react-query'
import { createFileRoute, Link, redirect } from '@tanstack/react-router'
import { useRef, useState, type FormEvent } from 'react'
import { api } from '@trmnl-games/backend/api'
import { ALIAS_RULE, HERO_NAME_RULE } from '@trmnl-games/platform'
import { seo } from '../../../../lib/seo'
import { SwitchAccount } from '../../../../lib/switchAccount'
import { captureInstall, finishInstall, getPendingInstall } from '../../../../server/installFns'
import { BUTTON_PRIMARY, LINK_BUTTON, Button, LoadingState } from '../../../../lib/ui'
import { captureAnalytics, readAnalyticsConsent } from '../../../../lib/analytics'
import { reportError } from '../../../../lib/errorReporting'
import { NameField } from '../../../../lib/nameField'
import { GenderPicker, type HeroGender } from '../../../../lib/genderPicker'
import { useAnalyticsView } from '../../../../lib/analyticsProvider'

type Search = { code?: string; installation_callback_url?: string; invalid?: boolean }

export const Route = createFileRoute('/connect/trmnl/desk-crawler/install')({
  validateSearch: (search: Record<string, unknown>): Search => ({
    ...(typeof search.code === 'string' ? { code: search.code } : {}),
    ...(typeof search.installation_callback_url === 'string' ? { installation_callback_url: search.installation_callback_url } : {}),
    ...(search.invalid === true || search.invalid === 'true' ? { invalid: true } : {}),
  }),
  beforeLoad: async ({ search }) => {
    if (search.code !== undefined || search.installation_callback_url !== undefined) {
      // Move the code into the encrypted cookie, then drop it from the URL before any third-party script loads.
      const result = await captureInstall({ data: { gameSlug: 'desk-crawler', code: search.code ?? '', callback: search.installation_callback_url ?? '' } })
      throw redirect({ to: '/connect/trmnl/desk-crawler/install', search: result.ok ? {} : { invalid: true }, replace: true })
    }
  },
  loader: async () => await getPendingInstall({ data: { gameSlug: 'desk-crawler' } }),
  head: () => {
    const head = seo({ title: 'Connect TRMNL', index: false })
    return { ...head, meta: [...head.meta, { name: 'referrer', content: 'no-referrer' }] }
  },
  component: InstallPage,
})

function InstallPage() {
  const { pending } = Route.useLoaderData()
  const { invalid } = Route.useSearch()
  useAnalyticsView(pending ? 'installation started' : 'setup screen shown', { setup_state: pending ? 'pending_install' : invalid ? 'invalid_install_link' : 'missing_install_link' })

  if (!pending) {
    return (
      <Page>
        <h1 className="font-display text-3xl font-bold">Connect TRMNL</h1>
        {invalid ? <p role="alert">That installation link was not valid.</p> : null}
        <p>Start from the Desk Crawler plugin in your TRMNL account and choose Install. TRMNL will bring you back here.</p>
        <Link to="/help/desk-crawler" className="inline-flex min-h-11 items-center underline underline-offset-4">Help with setup</Link>
      </Page>
    )
  }
  return (
    <Page>
      <h1 className="font-display text-3xl font-bold">Connect TRMNL to Desk Crawler</h1>
      <Show when="signed-out">
        <p>Sign in or create your TRMNL Games account. Next you’ll name your hero, then click Save back in TRMNL to start.</p>
        <SignIn routing="hash" forceRedirectUrl="/connect/trmnl/desk-crawler/install" signUpForceRedirectUrl="/connect/trmnl/desk-crawler/install" />
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
  const [reconnectCallback, setReconnectCallback] = useState<string | null>(null)
  const [alias, setAlias] = useState('')
  const [heroName, setHeroName] = useState('')
  const [heroGender, setHeroGender] = useState<HeroGender>('male')
  const inFlight = useRef(false)
  if (me === undefined) return <LoadingState label="Loading your account…" />
  const needsProfile = !me?.user
  const needsHero = !me?.hero

  async function onSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()
    if (inFlight.current) return
    if (!navigator.onLine) { setError('You are offline. Reconnect to continue setup.'); return }
    inFlight.current = true
    setSubmitting(true)
    setError(null)
    const form = new FormData(event.currentTarget)
    captureAnalytics('installation submitted', { needs_profile: needsProfile, needs_hero: needsHero })
    try {
      const result = await finishInstall({
      data: {
        gameSlug: 'desk-crawler',
        analyticsConsent: readAnalyticsConsent() === 'allowed',
        ...(needsProfile ? { publicAlias: String(form.get('publicAlias') ?? '') } : {}),
        ...(needsHero ? { heroName: String(form.get('heroName') ?? ''), heroGender } : {}),
      },
      })
      if (result.ok) {
        if (result.reconnectionRequired) { setReconnectCallback(result.callbackUrl); return }
        window.location.assign(result.callbackUrl); return
      }
      captureAnalytics('installation failed', { error_code: result.code })
      setError(result.message)
    } catch (caught) {
      captureAnalytics('installation failed', { error_code: 'NETWORK_OR_SERVER_ERROR' })
      reportError(caught, 'installation')
      setError('We couldn’t finish connecting. Check your connection and try again.')
    } finally { inFlight.current = false; setSubmitting(false) }
  }

  if (reconnectCallback) return <section className="flex flex-col gap-4" data-analytics-private>
    <h2 className="font-display text-xl font-bold">One more step to reconnect</h2>
    <p>Save the plugin in TRMNL, then open its settings and choose Configure. We’ll ask you to confirm the connection here.</p>
    <p>Your previously deleted progress stays deleted. This check lets you start again with this installation.</p>
    <a href={reconnectCallback} className={`${LINK_BUTTON} ${BUTTON_PRIMARY}`}>Continue to TRMNL to save</a>
  </section>
  return (
    <form onSubmit={onSubmit} data-analytics-private className="flex flex-col gap-4">
      {needsProfile ? (
        <p className="border-y border-edge py-3 text-sm">
          This sign-in has no TRMNL Games account yet, so connecting creates one. If you already play, switch account and sign in the way you did before.
        </p>
      ) : null}
      {needsProfile ? (
        <NameField label="Your public name" note="This is you, in every TRMNL game. Other players see it on the rankings and in raid stories, so leave out contact details. You can change it once a week." rule={ALIAS_RULE} noun="public name" name="publicAlias" value={alias} onChange={setAlias} disabled={submitting} />
      ) : (
        <p>
          Signed in as <strong>{me?.user?.publicAlias}</strong>, your public name.
        </p>
      )}
      {needsHero ? (
        <>
          <NameField label="Your hero’s name" note="The character on your TRMNL screen. Renaming it later costs 200 gold in the game." rule={HERO_NAME_RULE} noun="hero name" name="heroName" value={heroName} onChange={setHeroName} placeholder="Steve" disabled={submitting} />
          <GenderPicker value={heroGender} onChange={setHeroGender} note="Changes how your hero looks, nothing else." disabled={submitting} />
          <RankingsPreview alias={(needsProfile ? alias : me?.user?.publicAlias ?? '').trim()} hero={heroName.trim()} />
        </>
      ) : (
        <p>
          Your hero <strong>{me?.hero?.name}</strong> will appear on this TRMNL.
        </p>
      )}
      <SwitchAccount returnTo="/connect/trmnl/desk-crawler/install" />
      {error ? (
        <p role="alert" className="font-semibold text-hp-ink">
          {error}
        </p>
      ) : null}
      <Button type="submit" pending={submitting} busyLabel="Connecting…">Connect this TRMNL installation</Button>
      <p className="text-sm text-muted">Next, TRMNL asks you to save the plugin. Saving starts your hero’s adventures.</p>
    </form>
  )
}

/** How the two names sit together on the rankings (leaderboard.tsx): you in bold, your hero underneath. */
function RankingsPreview({ alias, hero }: { alias: string; hero: string }) {
  return (
    <div className="flex flex-col gap-1" aria-hidden="true">
      <p className="text-sm text-muted">On the rankings you’ll look like this:</p>
      <div className="flex min-w-0 items-start gap-3 border-2 border-rule px-3 py-2">
        <span className="w-4 font-bold tabular-nums">1</span>
        <span className="min-w-0 flex-1 [overflow-wrap:anywhere]">
          <span className="block font-semibold">{alias || 'Your public name'}</span>
          <span className="block text-sm text-muted">{hero || 'Steve'}</span>
        </span>
        <span className="shrink-0 text-sm font-semibold text-gold-ink">Level 1</span>
      </div>
    </div>
  )
}

function Page({ children }: { children: React.ReactNode }) {
  return <main id="main" className="mx-auto flex max-w-lg flex-col gap-4 px-4 py-12">{children}</main>
}
