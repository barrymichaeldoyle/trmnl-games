import { convexQuery } from '@convex-dev/react-query'
import { useQuery } from '@tanstack/react-query'
import { Link, createFileRoute } from '@tanstack/react-router'
import { useState } from 'react'
import { api } from '@trmnl-games/backend/api'
import { useIntent } from '../../../lib/intent'
import { preload } from '../../../lib/preload'
import { seo } from '../../../lib/seo'
import { ActionFeedback, Button, Card, LoadingState, NoticeBar, useNotice } from '../../../lib/ui'
import { AlertsCard, type AlertKindCopy } from '../desk-crawler/-alerts'
import { ConfirmSheet, Consequences } from '../desk-crawler/-confirm'
import type { PlotView } from '../../../lib/littlePlot'
import { KindName } from './-shared'

/** The More tab: rankings, achievements and help, cuttings to friends, the pressed flowers, then settings (pause, public page, alerts, installations, deleting Little Plot progress alone). */
export const Route = createFileRoute('/app/little-plot/settings')({
  head: () => seo({ title: 'More · Little Plot', index: false }),
  loader: ({ context }) => preload(context, convexQuery(api.littlePlot.plots.view, {}), convexQuery(api.connections.mine, { gameSlug: 'little-plot' }), convexQuery(api.littlePlot.flowers.mine, {}), convexQuery(api.littlePlot.plots.cuttingTargets, {})),
  component: SettingsPage,
})

const MORE_LINKS = [
  { to: '/app/little-plot/rankings', label: 'Rankings', blurb: 'Today, this week and lifetime, by level group.' },
  { to: '/app/little-plot/achievements', label: 'Achievements', blurb: 'Harvests, crosses, gnomes caught and every kind grown.' },
  { to: '/help/little-plot', label: 'Help', blurb: 'How the plot grows, what pests do and how crosses work.' },
] as const

const ALERT_KINDS: readonly AlertKindCopy[] = [
  { id: 'bedsRipe', name: 'Beds ripe', blurb: 'When half your beds are ripe at once. Held for half an hour.' },
  { id: 'newSeed', name: 'A new seed', blurb: 'When a seed of a kind you have never grown lands in the tin.' },
]

type Flowers = { totalCollected: number; claimedThisWeek: boolean; connected: boolean; newest: string | null; book: Array<{ id: string; name: string; count: number }> } | null

function SettingsPage() {
  const { notice, notify, dismiss } = useNotice()
  const { data } = useQuery(convexQuery(api.littlePlot.plots.view, {}))
  const view = data as PlotView | undefined
  const pause = useIntent(api.littlePlot.plots.pause)
  const resume = useIntent(api.littlePlot.plots.resume)
  const profile = useIntent(api.littlePlot.plots.setPublicProfile)
  const deletion = useIntent(api.deletion.requestGameDeletion)
  const [confirm, setConfirm] = useState('')
  const [askingPause, setAskingPause] = useState(false)
  const plot = view?.plot
  if (!view || !plot) return null
  const active = plot.activationState === 'active'
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
      {active ? <CuttingsCard view={view} notify={notify} /> : null}
      {active ? <FlowersCard notify={notify} /> : null}
      <h2 className="font-display text-2xl font-bold">Settings</h2>
      {active ? (
        <Card title="Growing">
          <p>{plot.status === 'paused' ? 'The plot is paused: nothing grows, nothing visits and nothing is lost.' : 'The plot grows on its own, every quarter of an hour.'}</p>
          <div className="mt-3">
            {plot.status === 'paused'
              ? <Button pending={resume.pending} onClick={() => void resume.run({}, 'The plot is growing again.')}>Resume</Button>
              : <Button variant="secondary" disabled={pause.pending} onClick={() => setAskingPause(true)}>Pause</Button>}
          </div>
          <ActionFeedback error={pause.error ?? resume.error} message={pause.message ?? resume.message} />
        </Card>
      ) : null}
      {active ? (
        <Card title="Public page">
          <p>{plot.publicProfile ? 'Your plot shows on your public profile and in the gnome pool: other players’ gnomes can call, and yours can call on theirs.' : 'Your plot is hidden from your public profile and out of the gnome pool, so no gnome calls either way.'}</p>
          <div className="mt-3">
            <Button variant={plot.publicProfile ? 'quiet' : 'secondary'} pending={profile.pending} onClick={() => void profile.run({ visible: !plot.publicProfile }, plot.publicProfile ? 'Hidden.' : 'Shown.')}>
              {plot.publicProfile ? 'Hide my plot' : 'Show my plot'}
            </Button>
          </div>
          <ActionFeedback error={profile.error} message={profile.message} />
        </Card>
      ) : null}
      {active ? <AlertsCard notify={notify} kinds={ALERT_KINDS} intro="A push when half the beds are ripe, or a seed you have never grown turns up." quietNote="Nothing is sent in quiet hours; a ripe alert waits until morning, a new seed is dropped." /> : null}
      <Installations notify={notify} />
      <details className="border-t-2 border-hp pt-4">
        <summary className="min-h-11 cursor-pointer font-semibold text-hp-ink">Delete Little Plot progress</summary>
        <p>Your plot, tin, catalogue, achievements and pressed flowers go. Your account and your other games stay.</p>
        <label className="mt-3 flex flex-col gap-1">
          <span className="text-sm font-semibold">Type DELETE to confirm</span>
          <input value={confirm} onChange={(event) => setConfirm(event.target.value)} className="min-h-11 border-2 border-edge bg-ground px-3 text-base" autoComplete="off" autoCapitalize="characters" spellCheck={false} disabled={deletion.pending} />
        </label>
        <div className="mt-3">
          <Button variant="danger" disabled={confirm !== 'DELETE'} pending={deletion.pending} busyLabel="Removing…" onClick={() => void deletion.run({ confirm: 'DELETE', gameSlug: 'little-plot' }, 'Deleting your Little Plot progress.')}>Delete Little Plot progress</Button>
        </div>
        <ActionFeedback error={deletion.error} message={deletion.message} />
      </details>
      <p className="text-sm"><Link to="/account" className="underline underline-offset-4">Account settings</Link> cover your name, language and the whole account.</p>
      <ConfirmSheet open={askingPause} title="Pause the plot?" confirmLabel="Pause" busyLabel="Pausing…" cancelLabel="Keep growing" pending={pause.pending} onClose={() => setAskingPause(false)} onConfirm={async () => { if (pause.pending) return; await pause.run({}, 'Paused.'); setAskingPause(false) }}>
        <Consequences>
          <li>Nothing grows and nothing ripens.</li>
          <li>No pests and no gnomes, yours or anyone’s.</li>
          <li>Resume any time; the next tick is the first that counts.</li>
        </Consequences>
      </ConfirmSheet>
      <NoticeBar notice={notice} onDismiss={dismiss} />
    </>
  )
}

/** Send one seed a day to a followed player with a public plot. */
function CuttingsCard({ view, notify }: { view: PlotView; notify: (feedback: { error: string | null; message: string | null }) => void }) {
  const { data: targets } = useQuery(convexQuery(api.littlePlot.plots.cuttingTargets, {}))
  const give = useIntent(api.littlePlot.plots.giveCutting, { onFeedback: notify })
  const [alias, setAlias] = useState('')
  const [kindId, setKindId] = useState('')
  const seeds = view.tin.filter((s) => s.count > 0)
  const list = (targets ?? []) as Array<{ alias: string }>
  return (
    <Card title="Send a cutting">
      <p className="mb-3 text-sm text-muted">One seed a day, any kind, to a player you follow whose plot is public. It lands in their tin with your name on it at their next tick.</p>
      {list.length === 0 ? <p className="text-sm text-muted">Follow a player from their hero page under Desk Crawler, and they appear here once their plot is public.</p> : seeds.length === 0 ? <p className="text-sm text-muted">The tin is empty.</p> : (
        <div className="flex flex-col gap-3 sm:flex-row sm:items-end">
          <label className="flex flex-1 flex-col gap-1 text-sm"><span className="font-semibold">To</span><select value={alias} onChange={(e) => setAlias(e.target.value)} className="min-h-11 border-2 border-edge bg-ground px-2"><option value="">Choose a player</option>{list.map((t) => <option key={t.alias} value={t.alias}>{t.alias}</option>)}</select></label>
          <label className="flex flex-1 flex-col gap-1 text-sm"><span className="font-semibold">Seed</span><select value={kindId} onChange={(e) => setKindId(e.target.value)} className="min-h-11 border-2 border-edge bg-ground px-2"><option value="">Choose a seed</option>{seeds.map((s) => <option key={s.id} value={s.id}>{s.name} × {s.count}</option>)}</select></label>
          <Button variant="secondary" disabled={!alias || !kindId || give.pending} pending={give.pending} busyLabel="Sending…" onClick={() => void give.run({ alias, kindId }, 'Sent.')}>Send</Button>
        </div>
      )}
      {seeds.length > 0 && kindId ? <p className="mt-2 text-xs text-muted">Sending <KindName name={seeds.find((s) => s.id === kindId)?.name ?? ''} rarity={seeds.find((s) => s.id === kindId)?.rarity ?? 'common'} /></p> : null}
    </Card>
  )
}

/** The pressed flowers (D46's shape): the weekly code from the device, one flower a week, and the book so far. */
function FlowersCard({ notify }: { notify: (feedback: { error: string | null; message: string | null }) => void }) {
  const { data } = useQuery(convexQuery(api.littlePlot.flowers.mine, {}))
  const claim = useIntent(api.littlePlot.flowers.claim, { onFeedback: notify })
  const [code, setCode] = useState('')
  const flowers = data as Flowers | undefined
  if (!flowers) return null
  const pressed = flowers.book.filter((f) => f.count > 0)
  return (
    <Card title="Pressed flowers">
      <p className="mb-3 text-sm text-muted">Your TRMNL shows a six-digit code each week. Enter it here to press one flower: {flowers.totalCollected} so far{pressed.length ? `, newest ${pressed[pressed.length - 1]?.name ?? ''}` : ''}. Cosmetic only; the newest hangs in the shed window on the device.</p>
      {flowers.claimedThisWeek ? <p className="text-sm font-semibold text-xp-ink">This week’s flower is pressed. The next code comes on Monday.</p> : !flowers.connected ? <p className="text-sm text-muted">Connect a TRMNL to press flowers.</p> : (
        <div className="flex flex-col gap-2 sm:flex-row sm:items-end">
          <label className="flex flex-col gap-1 text-sm"><span className="font-semibold">Flower code</span><input value={code} onChange={(e) => setCode(e.target.value)} inputMode="numeric" placeholder="482 917" className="min-h-11 border-2 border-edge bg-ground px-3 text-base" /></label>
          <Button variant="secondary" disabled={code.replace(/\D/g, '').length !== 6 || claim.pending} pending={claim.pending} busyLabel="Pressing…" onClick={async () => { if (await claim.run({ code }, 'Pressed.')) setCode('') }}>Press</Button>
        </div>
      )}
      {pressed.length > 0 ? <ul className="mt-3 flex flex-wrap gap-2 text-sm">{pressed.map((f) => <li key={f.id} className="border border-rule px-2 py-1">{f.name}{f.count > 1 ? ` × ${f.count}` : ''}</li>)}</ul> : null}
    </Card>
  )
}

/** The account's Little Plot installations, each with Disconnect. */
function Installations({ notify }: { notify: (feedback: { error: string | null; message: string | null }) => void }) {
  const { data: connections } = useQuery(convexQuery(api.connections.mine, { gameSlug: 'little-plot' }))
  const disconnect = useIntent(api.connections.disconnect, { onFeedback: notify })
  const [disconnectId, setDisconnectId] = useState<string | null>(null)
  const chosen = connections?.find((connection) => connection.id === disconnectId)
  return (
    <Card title="Installations" icon="plug">
      <p className="mb-3 text-sm text-muted">The TRMNL plugins connected to this account for Little Plot.</p>
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
        <p className="mt-2 text-sm">The screen stops updating until you connect it again. Your plot stays.</p>
        <div className="mt-3 flex flex-wrap gap-2">
          <Button variant="secondary" pending={disconnect.pending} busyLabel="Disconnecting…" onClick={async () => { if (await disconnect.run({ gameSlug: 'little-plot', instanceId: chosen.id }, 'Disconnected.')) setDisconnectId(null) }}>Disconnect</Button>
          <Button allowOffline variant="quiet" disabled={disconnect.pending} onClick={() => setDisconnectId(null)}>Cancel</Button>
        </div>
      </div> : null}
    </Card>
  )
}
