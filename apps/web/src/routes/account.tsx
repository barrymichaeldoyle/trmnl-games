import { convexQuery } from '@convex-dev/react-query'
import { useQuery } from '@tanstack/react-query'
import { Link, createFileRoute } from '@tanstack/react-router'
import { useEffect, useRef, useState } from 'react'
import { useAction } from 'convex/react'
import { api } from '@trmnl-games/backend/api'
import { AuthShell } from '../lib/platformShell'
import { errorMessage, useIntent } from '../lib/intent'
import { Button, ErrorNote } from '../lib/ui'
import { seo } from '../lib/seo'
import { preload } from '../lib/preload'

export const Route = createFileRoute('/account')({ head: () => seo({ title: 'Account', index: false }), loader: ({ context }) => preload(context, convexQuery(api.users.me, {})), component: () => <AuthShell><Account /></AuthShell> })

function Account() {
  const { data: me, isPending } = useQuery(convexQuery(api.users.me, {}))
  const { data: emailStatus } = useQuery(convexQuery(api.deletion.deletionEmailStatus, {}))
  const requestEmail = useAction(api.deletion.requestDeletionEmail)
  const [pending, setPending] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [now, setNow] = useState(Date.now)
  const inFlight = useRef(false)
  useEffect(() => {
    if (!emailStatus) return
    const timer = window.setTimeout(() => setNow(Date.now()), Math.max(0, emailStatus.expiresAt - Date.now()) + 10)
    return () => window.clearTimeout(timer)
  }, [emailStatus])
  const activeRequest = emailStatus && emailStatus.expiresAt > now
  async function sendLink() {
    if (inFlight.current || activeRequest) return
    if (!navigator.onLine) { setError('You are offline. Reconnect to request the email.'); return }
    inFlight.current = true
    setPending(true)
    setError(null)
    try { await requestEmail({}); setNow(Date.now()) }
    catch (caught) { setError(errorMessage(caught)) }
    finally { inFlight.current = false; setPending(false) }
  }
  return (
    <main id="main" className="mx-auto flex w-full max-w-3xl flex-col gap-6 px-4 py-8">
      <h1 className="font-display text-3xl font-bold">Account</h1>
      {isPending ? <p role="status">Loading your account…</p> : (
        <>
          <div className="flex flex-col gap-3">
            {me?.user ? <p>Playing as <strong>{me.user.publicAlias}</strong> across TRMNL Games.</p> : <p>You pick a public name when you connect your first game from TRMNL.</p>}
            <p className="text-sm text-muted">Manage your sign-in methods from the profile button above.</p>
          </div>
          {me?.user && !me.user.nameRepairRequired ? <PublicNameForm current={me.user.publicAlias} changeAt={me.user.publicNameChangeAt} /> : null}
          <nav aria-label="Account" className="flex flex-wrap gap-x-5 gap-y-1 text-sm">
            <Link to="/privacy" className="inline-flex min-h-11 items-center underline underline-offset-4">Privacy policy</Link>
            <Link to="/app/desk-crawler/settings" className="inline-flex min-h-11 items-center underline underline-offset-4">Desk Crawler settings</Link>
          </nav>
          {me ? (
            <details data-analytics-private className="border-t-2 border-hp pt-4">
              <summary className="min-h-11 cursor-pointer font-semibold text-hp-ink">Delete TRMNL Games account…</summary>
              <p>We first send a confirmation link to your verified primary email. Sign in from that link and type DELETE on the final confirmation page. This permanently removes your progress and connections from every game and deletes your sign-in. To remove only Desk Crawler progress, use <Link to="/app/desk-crawler/settings" className="underline underline-offset-4">Desk Crawler settings</Link>.</p>
              <p className="mt-3 text-sm">Your account stays active until you confirm. The link expires after 30 minutes; we send one email per request, even if you click again.</p>
              {activeRequest ? <p role="status" className="mt-3">{emailStatus.state === 'pending' ? `Sending a link to ${emailStatus.email}…` : emailStatus.state === 'sent' ? `Check ${emailStatus.email} for your confirmation link.` : emailStatus.state === 'failed' ? 'We couldn’t deliver the email. Your account is still active. Contact support, or request a new link after this one expires.' : 'Account deletion is underway.'}</p> : emailStatus ? <p className="mt-3">Your previous link expired. You can request a new one.</p> : null}
              <Button className="mt-4" variant="danger" pending={pending} busyLabel="Requesting email…" disabled={Boolean(activeRequest) || emailStatus === undefined} onClick={sendLink}>Email me a deletion link</Button>
              <ErrorNote message={error} />
            </details>
          ) : null}
        </>
      )}
    </main>
  )
}

const longDate = (at: number) => new Date(at).toLocaleDateString(undefined, { day: 'numeric', month: 'long' })

/**
 * D142: change the public name shared by every game, free once every 7 days. Hero names are separate and change with
 * a name tag in each game.
 */
function PublicNameForm({ current, changeAt }: { current: string; changeAt: number | null }) {
  const [name, setName] = useState('')
  const [now] = useState(Date.now)
  const change = useIntent(api.users.changePublicName)
  const open = changeAt === null || changeAt <= now
  const valid = name.trim().length >= 2 && name.trim() !== current
  return (
    <details className="border-t-2 border-faint pt-4">
      <summary className="min-h-11 cursor-pointer font-semibold">Change public name…</summary>
      <p>Your public name is how other players see you in every game: on leaderboards, raids, meetings and your public pages. Your heroes keep their own names.</p>
      {open ? (
        <form className="mt-3 flex flex-col gap-2" onSubmit={async (event) => { event.preventDefault(); if (valid && await change.run({ publicAlias: name.trim() }, `You are now ${name.trim()}.`)) setName('') }}>
          <label className="flex flex-col gap-1 text-sm">
            <span className="font-semibold">New public name</span>
            <input value={name} onChange={(event) => setName(event.target.value)} minLength={2} maxLength={20} required autoComplete="off" disabled={change.pending} className="min-h-11 border-2 border-edge bg-ground px-3 text-base" />
          </label>
          <ul className="flex list-disc flex-col gap-1 pl-5 text-sm">
            <li>Free, once every 7 days.</li>
            <li>Links to your old public pages stop working, and nobody else can take {current} for 7 days.</li>
            <li>Other players' logs show "Hidden player" where they met your old name.</li>
          </ul>
          <Button type="submit" className="self-start" pending={change.pending} busyLabel="Changing…" disabled={!valid}>Change to {name.trim() || 'new name'}</Button>
        </form>
      ) : <p className="mt-3 text-sm">You changed it recently. You can change it again on {longDate(changeAt)}.</p>}
      <ErrorNote message={change.error ?? null} />
      {change.message ? <p role="status" className="mt-2 text-sm">{change.message}</p> : null}
    </details>
  )
}
