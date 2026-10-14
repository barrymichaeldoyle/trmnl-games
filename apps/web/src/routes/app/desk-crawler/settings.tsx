import { convexQuery } from '@convex-dev/react-query'
import { ConfirmSheet, PauseConsequences } from './-confirm'
import { useQuery } from '@tanstack/react-query'
import { createFileRoute, Link } from '@tanstack/react-router'
import { useEffect, useState } from 'react'
import { api } from '@trmnl-games/backend/api'
import { useIntent } from '../../../lib/intent'
import { captureAnalytics } from '../../../lib/analytics'
import { seo } from '../../../lib/seo'
import { Button, Card, LoadingState, NoticeBar, useFocusWithin, useNotice } from '../../../lib/ui'
import { preload } from '../../../lib/preload'
import { AlertsCard } from './-alerts'
import { MoreLinks } from './-moreLinks'

/** The More tab (D124): the pages that are not play (achievements, keepsakes, the device) above the settings. */
export const Route = createFileRoute('/app/desk-crawler/settings')({ head: () => seo({ title: 'More', index: false }), loader: ({ context }) => preload(context, convexQuery(api.users.me, {}), convexQuery(api.heroes.mine, {}), convexQuery(api.connections.mine, {}), convexQuery(api.alerts.mine, {})), component: Settings })

function Settings() {
  const { data: me } = useQuery(convexQuery(api.users.me, {}))
  const { data: hero } = useQuery(convexQuery(api.heroes.mine, {}))
  // One pinned notice for every command on the page (D98), so the cards hold their shape while an action settles.
  const { notice, notify, dismiss } = useNotice()
  const pause = useIntent(api.heroes.pause, { onFeedback: notify })
  const { data: connections } = useQuery(convexQuery(api.connections.mine, {}))
  const disconnect = useIntent(api.connections.disconnect, { onFeedback: notify })
  const deletion = useIntent(api.deletion.requestGameDeletion, { onFeedback: notify })
  const [confirmText, setConfirmText] = useState('')
  // Pausing slows the hero down, so it asks first (as on the Hero page).
  const [askPause, setAskPause] = useState(false)
  const [disconnectId, setDisconnectId] = useState<string | null>(null)
  const resume = useIntent(api.heroes.resume, { onFeedback: notify })
  // Visibility is a stored preference, so the card flips on the tap and rolls back if the save fails.
  const profile = useIntent(api.heroes.setPublicProfile, {
    onFeedback: notify,
    optimisticUpdate: (store, { visible }) => {
      const current = store.getQuery(api.heroes.mine, {})
      if (current) store.setQuery(api.heroes.mine, {}, { ...current, publicProfile: visible })
    },
  })
  // Pause and Resume swap places when they succeed; focus follows to whichever control takes over.
  const adventures = useFocusWithin<HTMLDivElement>(hero?.status)
  const sharing = useFocusWithin<HTMLDivElement>(hero?.publicProfile)
  if (!me?.user || !hero) return <LoadingState label="Loading settings…" />
  const healthy = hero.simulationState !== 'quarantined'
  return (
    <>
      <h1 className="font-display text-3xl font-bold">More</h1>
      <MoreLinks />
      <header>
        <h2 className="font-display text-2xl font-bold">Settings</h2>
        <p className="mt-2">Playing as <strong>{me.user.publicAlias}</strong>, the name other players see on leaderboards and TRMNL screens. <Link to="/account" className="underline underline-offset-4">Change it from Account</Link>; rename your hero with a name tag from Bag.</p>
      </header>
      <Card title="Adventures" icon="travel"><div ref={adventures}>
        {hero.activationState !== 'active' ? (
          <p>Your hero is ready. Save the Desk Crawler plugin in TRMNL to start adventures.</p>
        ) : hero.status === 'paused' ? (
          <>
            <p>Paused. Nothing is earned until you resume, and there is no catch-up.</p>
            <Button className="mt-3" icon="play" pending={resume.pending} busyLabel="Resuming…" disabled={!healthy || pause.pending} onClick={() => resume.run({}, 'Adventures resumed. Your hero joins the next adventure.')}>
              Resume adventures
            </Button>
          </>
        ) : hero.status === 'sleeping' ? (
          <p>Stopped with a full bag. <Link to="/app/desk-crawler/inventory" className="underline underline-offset-4">Make room and resume</Link>.</p>
        ) : (
          <>
            <p>Pausing stops encounters and rewards until you resume. Recent XP ages out meanwhile, so your rank can drop.</p>
            <Button className="mt-3" icon="pause" variant="secondary" pending={pause.pending} busyLabel="Pausing…" disabled={!healthy || resume.pending || (hero.status !== 'exploring' && hero.status !== 'resting')} onClick={() => setAskPause(true)}>
              Pause adventures
            </Button>
            <ConfirmSheet open={askPause} title="Pause adventures?" confirmLabel="Pause" busyLabel="Pausing…" cancelLabel="Keep adventuring" pending={pause.pending} disabled={!healthy} onClose={() => setAskPause(false)} onConfirm={async () => { if (await pause.run({}, 'Adventures paused.')) setAskPause(false) }}>
              <PauseConsequences />
            </ConfirmSheet>
          </>
        )}
        {hero.status === 'dead' || hero.status === 'travelling' ? <p className="mt-2 text-sm text-muted">You can pause after your hero returns from {hero.status === 'dead' ? 'recovering' : 'travelling'}.</p> : null}
        {!healthy ? <p className="mt-2 text-sm">Paused for a service check.</p> : null}
      </div></Card>
      <Card title="Public profile" icon="eye"><div ref={sharing}>
        {hero.activationState !== 'active' ? (
          <p>Your hero can have a public page once adventures start.</p>
        ) : hero.publicProfile ? (
          <>
            <p>Your hero has a public page. Other players can find it from the rankings, raids and meetings, follow it and name you their rival. It shows your hero's name, level, rank, current floor, lifetime counts and achievements. Gear, gold, the adventure log and your account stay private.</p>
            <p className="mt-2 break-all"><Link to="/desk-crawler/heroes/$alias" params={{ alias: me.user.publicAlias }} className="underline underline-offset-4">trmnlgames.com/desk-crawler/heroes/{encodeURIComponent(me.user.publicAlias)}</Link></p>
            <div className="mt-3 flex flex-wrap gap-2">
              <ShareHeroLink alias={me.user.publicAlias} heroName={hero.name} notify={notify} />
            </div>
            {/* D144: public by default; hiding stays available but quiet. */}
            <Button className="mt-3 -ml-3 min-[375px]:-ml-4" variant="quiet" pending={profile.pending} busyLabel="Hiding…" onClick={() => profile.run({ visible: false }, 'Your hero page is hidden.')}>Hide my hero page</Button>
          </>
        ) : (
          <>
            <p>Your hero page is hidden. Nobody can open it, follow you or name you their rival, and your name in the rankings doesn't link anywhere.</p>
            <Button className="mt-3" variant="secondary" pending={profile.pending} busyLabel="Showing…" onClick={() => profile.run({ visible: true }, 'Your hero page is public.')}>Show my hero page</Button>
          </>
        )}
      </div></Card>
      {hero.activationState === 'active' ? <AlertsCard notify={notify} /> : null}
      <Card title="TRMNL installations" icon="plug">
        <p className="mb-3 text-sm text-muted">TRMNL plugin installations showing your hero.</p>
        {connections === undefined ? <LoadingState label="Loading installations…" /> : connections.length > 0 ? (
          <ul className="flex flex-col divide-y divide-rule">
            {connections.map((c) => (
              <li key={c.id} className="flex items-center justify-between gap-2 py-2">
                {/* Name over status, beside a button that keeps its width: inline, the status ran under the button on phones. */}
                <span className="flex min-w-0 flex-col">
                  <span className="font-semibold">Installation {c.uuid.slice(0, 8)}</span>
                  <span className="text-sm text-muted">{c.state === 'active' ? 'Connected' : c.state === 'uninstalled' ? 'Uninstalled' : 'Disconnected'}</span>
                </span>
                {c.state === 'active' ? (
                  <Button allowOffline icon="plug" variant="secondary" className="shrink-0" disabled={disconnect.pending} onClick={() => { disconnect.clearFeedback(); setDisconnectId(c.id) }}>
                    Disconnect
                  </Button>
                ) : null}
              </li>
            ))}
          </ul>
        ) : (
          <p>No installations connected. Reconnect from the Desk Crawler plugin in TRMNL.</p>
        )}
        {disconnectId ? <div className="mt-4 border-t border-rule pt-4">
          <p className="font-semibold">Disconnect installation {connections?.find((connection) => connection.id === disconnectId)?.uuid.slice(0, 8)}?</p>
          <p className="mt-2 text-sm">New screens stop for this installation. TRMNL keeps the last image until you remove the plugin from its playlist.</p>
          <div className="mt-3 flex flex-wrap gap-2">
            <Button variant="secondary" pending={disconnect.pending} busyLabel="Disconnecting…" onClick={async () => { const connection = connections?.find((entry) => entry.id === disconnectId); if (connection && await disconnect.run({ instanceId: connection.id }, 'Installation disconnected.')) setDisconnectId(null) }}>Confirm disconnect</Button>
            <Button allowOffline variant="quiet" disabled={disconnect.pending} onClick={() => setDisconnectId(null)}>Cancel</Button>
          </div>
        </div> : null}
      </Card>
      <details className="border-t-2 border-hp pt-4">
        <summary className="min-h-11 cursor-pointer font-semibold text-hp-ink">Delete Desk Crawler progress…</summary>
        <p>
          This removes your Desk Crawler hero, items, history and TRMNL connections, and cannot be undone. Your TRMNL Games account and other games stay as they are. Your name leaves the Desk Crawler rankings immediately, backups expire within about a week, and TRMNL keeps its last screen until you remove the plugin.
        </p>
        <label className="mt-3 flex flex-col gap-1 text-sm">
          <span className="font-semibold">Type DELETE to confirm</span>
          <input value={confirmText} onChange={(e) => setConfirmText(e.target.value)} className="min-h-11 border-2 border-edge bg-ground px-3 text-base" autoComplete="off" autoCapitalize="characters" spellCheck={false} disabled={deletion.pending} />
        </label>
        <Button
          className="mt-3"
          variant="danger"
          pending={deletion.pending}
          busyLabel="Removing progress…"
          disabled={confirmText !== 'DELETE' || deletion.pending}
          onClick={async () => {
            await deletion.run({ confirm: 'DELETE' })
          }}
        >
          Delete my Desk Crawler progress
        </Button>
        <p className="mt-4 text-sm">To delete your sign-in and every game, go to <Link to="/account" className="underline underline-offset-4">Account</Link>.</p>
      </details>
      <nav aria-label="Help" className="flex flex-wrap gap-x-5 gap-y-1 text-sm">
        <Link to="/support" className="inline-flex min-h-11 items-center underline underline-offset-4">Contact support</Link>
        <Link to="/feedback" search={{ from: '/app/desk-crawler/settings' }} className="inline-flex min-h-11 items-center underline underline-offset-4">Send feedback</Link>
      </nav>
      <NoticeBar notice={notice} onDismiss={dismiss} />
    </>
  )
}

/**
 * Share the public hero page (D109): the phone's share sheet where the browser has one, and Copy link everywhere.
 * Both report through the page's pinned notice; a cancelled share sheet says nothing.
 */
function ShareHeroLink({ alias, heroName, notify }: { alias: string; heroName: string; notify: (feedback: { error: string | null; message: string | null }) => void }) {
  // Known only in the browser; the server render shows Copy link alone, and Share joins it after hydration.
  const [canShare, setCanShare] = useState(false)
  useEffect(() => setCanShare(typeof navigator.share === 'function'), [])
  const url = () => `${window.location.origin}/desk-crawler/heroes/${encodeURIComponent(alias)}`
  const share = async () => {
    try {
      await navigator.share({ title: `${heroName} in Desk Crawler`, url: url() })
      captureAnalytics('profile shared', { method: 'share' })
    } catch (error) {
      if ((error as Error).name !== 'AbortError') notify({ error: 'Sharing did not work here. Copy the link instead.', message: null })
    }
  }
  const copy = async () => {
    try {
      await navigator.clipboard.writeText(url())
      captureAnalytics('profile shared', { method: 'copy' })
      notify({ error: null, message: 'Link copied.' })
    } catch {
      notify({ error: 'Could not copy the link. Press and hold it above to copy it.', message: null })
    }
  }
  return (
    <>
      {canShare ? <Button icon="share" onClick={share}>Share</Button> : null}
      <Button variant={canShare ? 'secondary' : 'primary'} onClick={copy}>Copy link</Button>
    </>
  )
}
