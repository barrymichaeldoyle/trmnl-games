import { convexQuery } from '@convex-dev/react-query'
import { useQuery } from '@tanstack/react-query'
import { Link, createFileRoute } from '@tanstack/react-router'
import { useState } from 'react'
import { api } from '@trmnl-games/backend/api'
import { useIntent } from '../../../lib/intent'
import { preload } from '../../../lib/preload'
import type { Dock } from '../../../lib/idleAngler'
import { ActionFeedback, Button, Card, LoadingState, NoticeBar, useNotice } from '../../../lib/ui'
import { AlertsCard, type AlertKindCopy } from '../desk-crawler/-alerts'
import { ConfirmSheet, Consequences } from '../desk-crawler/-confirm'
import { seo } from '../../../lib/seo'

/** The More tab: links to rankings, achievements and help, then settings (pause, public profile, alerts, deleting Idle Angler progress alone). */
export const Route = createFileRoute('/app/idle-angler/settings')({
  head: () => seo({ title: 'More · Idle Angler', index: false }),
  loader: ({ context }) => preload(context, convexQuery(api.idleAngler.anglers.dock, {}), convexQuery(api.connections.mine, { gameSlug: 'idle-angler' })),
  component: SettingsPage,
})

const IDLE_ANGLER_ALERTS: readonly AlertKindCopy[] = [
  { id: 'coolerFull', name: 'Cooler full', blurb: 'Your cooler is full and new catches are released. Sent 30 minutes after it fills.' },
  { id: 'baitOut', name: 'Out of bait', blurb: 'Your angler used up the bait they were fishing with and is on a bare hook.' },
]

const MORE_LINKS = [
  { to: '/app/idle-angler/rankings', label: 'Rankings', blurb: 'The heaviest fish at each water, this week and all time.' },
  { to: '/app/idle-angler/achievements', label: 'Achievements', blurb: 'Every tier you have earned and what comes next.' },
  { to: '/help/idle-angler', label: 'How Idle Angler works', blurb: 'Bait, weather, waters and the cooler.' },
] as const

function SettingsPage() {
  const { notice, notify, dismiss } = useNotice()
  const { data } = useQuery(convexQuery(api.idleAngler.anglers.dock, {}))
  const dock = data as Dock | undefined
  const pause = useIntent(api.idleAngler.anglers.pause)
  const resume = useIntent(api.idleAngler.anglers.resume)
  const profile = useIntent(api.idleAngler.anglers.setPublicProfile)
  const deletion = useIntent(api.deletion.requestGameDeletion)
  const [confirm, setConfirm] = useState('')
  const [askingPause, setAskingPause] = useState(false)
  const angler = dock?.angler
  if (!angler) return null
  const active = angler.activationState === 'active'
  return (
    <>
      <h1 className="font-display text-3xl font-bold">More</h1>
      <Card>
        <ul className="flex flex-col">
          {MORE_LINKS.map((link) => (
            <li key={link.to} className="border-b border-rule last:border-b-0">
              <Link to={link.to} className="flex min-h-12 flex-col justify-center py-2">
                <span className="font-semibold underline underline-offset-4">{link.label}</span>
                <span className="text-sm text-muted">{link.blurb}</span>
              </Link>
            </li>
          ))}
        </ul>
      </Card>
      <h2 className="font-display text-2xl font-bold">Settings</h2>
      {active ? (
        <Card title="Fishing">
          <p>{angler.status === 'paused' ? 'Fishing is paused. Your angler catches nothing until you resume, and keeps everything they have.' : 'Your angler casts every fifteen minutes, day and night.'}</p>
          <div className="mt-3">
            {angler.status === 'paused'
              ? <Button pending={resume.pending} onClick={() => void resume.run({}, 'Fishing resumed.')}>Resume fishing</Button>
              : <Button variant="secondary" disabled={pause.pending} onClick={() => setAskingPause(true)}>Pause fishing</Button>}
          </div>
          <ActionFeedback error={pause.error ?? resume.error} message={pause.message ?? resume.message} />
        </Card>
      ) : null}
      {active ? (
        <Card title="Public profile">
          <p>{angler.publicProfile ? 'Your Idle Angler title, achievements and logbook count show on your public profile.' : 'Idle Angler is hidden from your public profile.'} Leaderboards always show your public name.</p>
          <div className="mt-3">
            {/* D144: shown by default; hiding stays available but quiet. */}
            <Button variant={angler.publicProfile ? 'quiet' : 'secondary'} pending={profile.pending} onClick={() => void profile.run({ visible: !angler.publicProfile }, angler.publicProfile ? 'Idle Angler is hidden from your profile.' : 'Idle Angler now shows on your profile.')}>
              {angler.publicProfile ? 'Hide from my profile' : 'Show on my profile'}
            </Button>
          </div>
          {angler.publicProfile ? <p className="mt-3 text-sm"><Link to="/profile/$alias" params={{ alias: angler.alias }} className="underline underline-offset-4">Open your public profile</Link></p> : null}
          <ActionFeedback error={profile.error} message={profile.message} />
        </Card>
      ) : null}
      {active ? <AlertsCard notify={notify} kinds={IDLE_ANGLER_ALERTS} intro="Get a nudge on this phone when your angler needs you." quietNote="During quiet hours, cooler alerts wait until morning and out-of-bait alerts are skipped." /> : null}
      <Installations notify={notify} />
      {/* As Desk Crawler's: the destructive action folded away, so it is never the page's loudest card. */}
      <details className="border-t-2 border-hp pt-4">
        <summary className="min-h-11 cursor-pointer font-semibold text-hp-ink">Delete Idle Angler progress</summary>
        <p>This removes your angler, cooler, logbook and Idle Angler connections. Your TRMNL Games account and your other games stay. It cannot be undone.</p>
        <label className="mt-3 flex flex-col gap-1">
          <span className="text-sm font-semibold">Type DELETE to confirm</span>
          <input value={confirm} onChange={(event) => setConfirm(event.target.value)} className="min-h-11 border-2 border-edge bg-ground px-3 text-base" autoComplete="off" autoCapitalize="characters" spellCheck={false} disabled={deletion.pending} />
        </label>
        <div className="mt-3">
          <Button variant="danger" disabled={confirm !== 'DELETE'} pending={deletion.pending} busyLabel="Removing…" onClick={() => void deletion.run({ confirm: 'DELETE', gameSlug: 'idle-angler' }, 'Removing Idle Angler progress.')}>Delete Idle Angler progress</Button>
        </div>
        <ActionFeedback error={deletion.error} message={deletion.message} />
      </details>
      <p className="text-sm"><Link to="/account" className="underline underline-offset-4">Account settings</Link> cover your public name, analytics and deleting your whole account.</p>
      <ConfirmSheet
        open={askingPause}
        title="Pause fishing?"
        confirmLabel="Pause fishing"
        busyLabel="Pausing…"
        cancelLabel="Keep fishing"
        pending={pause.pending}
        onClose={() => setAskingPause(false)}
        onConfirm={async () => {
          if (pause.pending) return
          await pause.run({}, 'Fishing paused.')
          setAskingPause(false)
        }}
      >
        <Consequences>
          <li>No casts until you resume, and missed casts aren't made up.</li>
          <li>Your fish stay on the boards, but you can't add to this week's while paused.</li>
          <li>Your cooler, bait and coins stay as they are. Resume any time.</li>
        </Consequences>
      </ConfirmSheet>
      <NoticeBar notice={notice} onDismiss={dismiss} />
    </>
  )
}

/** The account's Idle Angler installations, each with Disconnect (Desk Crawler's card, D115's per-game connections). */
function Installations({ notify }: { notify: (feedback: { error: string | null; message: string | null }) => void }) {
  const { data: connections } = useQuery(convexQuery(api.connections.mine, { gameSlug: 'idle-angler' }))
  const disconnect = useIntent(api.connections.disconnect, { onFeedback: notify })
  const [disconnectId, setDisconnectId] = useState<string | null>(null)
  const chosen = connections?.find((connection) => connection.id === disconnectId)
  return (
    <Card title="TRMNL installations" icon="plug">
      <p className="mb-3 text-sm text-muted">TRMNL plugin installations showing your angler.</p>
      {connections === undefined ? <LoadingState label="Loading installations…" /> : connections.length > 0 ? (
        <ul className="flex flex-col divide-y divide-rule">
          {connections.map((c) => (
            <li key={c.id} className="flex items-center justify-between gap-2 py-2">
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
        <p>No installations connected. Install Idle Angler again from TRMNL to connect one.</p>
      )}
      {chosen ? <div className="mt-4 border-t border-rule pt-4">
        <p className="font-semibold">Disconnect installation {chosen.uuid.slice(0, 8)}?</p>
        <p className="mt-2 text-sm">New screens stop for this installation and your angler keeps fishing. TRMNL keeps the last image until you remove the plugin from its playlist.</p>
        <div className="mt-3 flex flex-wrap gap-2">
          <Button variant="secondary" pending={disconnect.pending} busyLabel="Disconnecting…" onClick={async () => { if (await disconnect.run({ gameSlug: 'idle-angler', instanceId: chosen.id }, 'Installation disconnected.')) setDisconnectId(null) }}>Confirm disconnect</Button>
          <Button allowOffline variant="quiet" disabled={disconnect.pending} onClick={() => setDisconnectId(null)}>Cancel</Button>
        </div>
      </div> : null}
    </Card>
  )
}
