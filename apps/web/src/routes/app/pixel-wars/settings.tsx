import { convexQuery } from '@convex-dev/react-query'
import { useQuery } from '@tanstack/react-query'
import { Link, createFileRoute } from '@tanstack/react-router'
import { useState } from 'react'
import { api } from '@trmnl-games/backend/api'
import { useIntent } from '../../../lib/intent'
import { preload } from '../../../lib/preload'
import { seo } from '../../../lib/seo'
import { ActionFeedback, Button, Card, LoadingState, NoticeBar, useNotice } from '../../../lib/ui'
import type { WarView } from '../../../lib/pixelWars'
import { AlertsCard, type AlertKindCopy } from '../desk-crawler/-alerts'

/** The More tab: rankings, achievements and help, then settings (public page, alerts, installations, deleting Pixel Wars progress alone). */
export const Route = createFileRoute('/app/pixel-wars/settings')({
  head: () => seo({ title: 'More · Pixel Wars', index: false }),
  loader: ({ context }) => preload(context, convexQuery(api.pixelWars.desks.view, {}), convexQuery(api.connections.mine, { gameSlug: 'pixel-wars' })),
  component: SettingsPage,
})

const ALERT_KINDS: readonly AlertKindCopy[] = [
  { id: 'deskTaken', name: 'Desk taken', blurb: 'When another side takes your desk. Held for half an hour, so a quick liberation cancels it.' },
  { id: 'leadLost', name: 'Lead lost', blurb: 'When your side loses the most ground. At most once a day.' },
  { id: 'bell', name: 'The bell', blurb: 'Monday 00:00 UTC: who won the week, and that the map is clean.' },
]

const MORE_LINKS = [
  { to: '/app/pixel-wars/rankings', label: 'Rankings', blurb: 'Today, this week and lifetime, by level group.' },
  { to: '/app/pixel-wars/achievements', label: 'Achievements', blurb: 'Cells painted, desks taken, seasons won.' },
  { to: '/help/pixel-wars', label: 'Help', blurb: 'How orders resolve, how ink fades and what the bell does.' },
] as const

function SettingsPage() {
  const { notice, notify, dismiss } = useNotice()
  const { data } = useQuery(convexQuery(api.pixelWars.desks.view, {}))
  const view = data as WarView | undefined
  const profile = useIntent(api.pixelWars.desks.setPublicProfile)
  const deletion = useIntent(api.deletion.requestGameDeletion)
  const [confirm, setConfirm] = useState('')
  const desk = view?.desk
  if (!view || !desk) return null
  const active = desk.activationState === 'active'
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
        <Card title="Public page">
          <p>{desk.publicProfile ? 'Your side, your week and your desks taken show on your public profile.' : 'Your Pixel Wars standing is hidden from your public profile.'}</p>
          <div className="mt-3">
            <Button variant={desk.publicProfile ? 'quiet' : 'secondary'} pending={profile.pending} onClick={() => void profile.run({ visible: !desk.publicProfile }, desk.publicProfile ? 'Hidden.' : 'Shown.')}>
              {desk.publicProfile ? 'Hide my standing' : 'Show my standing'}
            </Button>
          </div>
          <ActionFeedback error={profile.error} message={profile.message} />
        </Card>
      ) : null}
      {active ? <AlertsCard notify={notify} kinds={ALERT_KINDS} intro="A push when your desk falls, when your side loses the lead, and at the bell." quietNote="Nothing is sent in quiet hours; a fallen desk waits until morning, a lost lead is dropped." /> : null}
      <Installations notify={notify} />
      <details className="border-t-2 border-hp pt-4">
        <summary className="min-h-11 cursor-pointer font-semibold text-hp-ink">Delete Pixel Wars progress</summary>
        <p>Your desk, its stories, queued orders and achievements go; its place on the map stays as empty ground. Your account and your other games stay.</p>
        <label className="mt-3 flex flex-col gap-1">
          <span className="text-sm font-semibold">Type DELETE to confirm</span>
          <input value={confirm} onChange={(event) => setConfirm(event.target.value)} className="min-h-11 border-2 border-edge bg-ground px-3 text-base" autoComplete="off" autoCapitalize="characters" spellCheck={false} disabled={deletion.pending} />
        </label>
        <div className="mt-3">
          <Button variant="danger" disabled={confirm !== 'DELETE'} pending={deletion.pending} busyLabel="Removing…" onClick={() => void deletion.run({ confirm: 'DELETE', gameSlug: 'pixel-wars' }, 'Deleting your Pixel Wars progress.')}>Delete Pixel Wars progress</Button>
        </div>
        <ActionFeedback error={deletion.error} message={deletion.message} />
      </details>
      <p className="text-sm"><Link to="/account" className="underline underline-offset-4">Account settings</Link> cover your name, language and the whole account.</p>
      <NoticeBar notice={notice} onDismiss={dismiss} />
    </>
  )
}

/** The account's Pixel Wars installations, each with Disconnect. */
function Installations({ notify }: { notify: (feedback: { error: string | null; message: string | null }) => void }) {
  const { data: connections } = useQuery(convexQuery(api.connections.mine, { gameSlug: 'pixel-wars' }))
  const disconnect = useIntent(api.connections.disconnect, { onFeedback: notify })
  const [disconnectId, setDisconnectId] = useState<string | null>(null)
  const chosen = connections?.find((connection) => connection.id === disconnectId)
  return (
    <Card title="Installations" icon="plug">
      <p className="mb-3 text-sm text-muted">The TRMNL plugins connected to this account for Pixel Wars. A desk whose screens go quiet for two weeks stands empty until one shows the map again.</p>
      {connections === undefined ? <LoadingState label="Loading installations…" /> : connections.length > 0 ? (
        <ul className="flex flex-col divide-y divide-rule">
          {connections.map((c) => (
            <li key={c.id} className="flex items-center justify-between gap-2 py-2">
              <span className="flex min-w-0 flex-col">
                <span className="font-semibold">Installation {c.uuid.slice(0, 8)}</span>
                <span className="text-sm text-muted">{c.state === 'active' ? 'Connected' : c.state === 'uninstalled' ? 'Uninstalled' : 'Disconnected'}</span>
              </span>
              {c.state === 'active' ? <Button allowOffline icon="plug" variant="secondary" className="shrink-0" disabled={disconnect.pending} onClick={() => { disconnect.clearFeedback(); setDisconnectId(c.id) }}>Disconnect</Button> : null}
            </li>
          ))}
        </ul>
      ) : <p>No installations yet.</p>}
      {chosen ? <div className="mt-4 border-t border-rule pt-4">
        <p className="font-semibold">Disconnect installation {chosen.uuid.slice(0, 8)}?</p>
        <p className="mt-2 text-sm">The screen stops updating until you connect it again. Your desk stays.</p>
        <div className="mt-3 flex flex-wrap gap-2">
          <Button variant="secondary" pending={disconnect.pending} busyLabel="Disconnecting…" onClick={async () => { if (await disconnect.run({ gameSlug: 'pixel-wars', instanceId: chosen.id }, 'Disconnected.')) setDisconnectId(null) }}>Disconnect</Button>
          <Button allowOffline variant="quiet" disabled={disconnect.pending} onClick={() => setDisconnectId(null)}>Cancel</Button>
        </div>
      </div> : null}
    </Card>
  )
}
