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
import { useT } from '../../../lib/i18n'
import { iaMore } from '../../../i18n/iaMore'
import { iaCommon } from '../../../i18n/ia'
import { useAngler } from '../../../lib/idleAngler'

/** The More tab: links to rankings, achievements and help, then settings (pause, public profile, alerts, deleting Idle Angler progress alone). */
export const Route = createFileRoute('/app/idle-angler/settings')({
  head: () => seo({ title: 'More · Idle Angler', index: false }),
  loader: ({ context }) => preload(context, convexQuery(api.idleAngler.anglers.dock, {}), convexQuery(api.connections.mine, { gameSlug: 'idle-angler' })),
  component: SettingsPage,
})

const MORE_LINKS = [
  { to: '/app/idle-angler/rankings', key: 'rankings' },
  { to: '/app/idle-angler/achievements', key: 'achievements' },
  { to: '/help/idle-angler', key: 'help' },
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
  const t = useT(iaMore)
  const words = useAngler()
  const alertKinds: readonly AlertKindCopy[] = [{ id: 'coolerFull', name: t.alertCooler, blurb: t.alertCoolerBlurb }, { id: 'baitOut', name: t.alertBait, blurb: t.alertBaitBlurb }]
  const angler = dock?.angler
  if (!angler) return null
  const active = angler.activationState === 'active'
  return (
    <>
      <h1 className="font-display text-3xl font-bold">{t.title}</h1>
      <Card>
        <ul className="flex flex-col">
          {MORE_LINKS.map((link) => (
            <li key={link.to} className="border-b border-rule last:border-b-0">
              <Link to={link.to} className="flex min-h-12 flex-col justify-center py-2">
                <span className="font-semibold underline underline-offset-4">{t.links[link.key].label}</span>
                <span className="text-sm text-muted">{t.links[link.key].blurb}</span>
              </Link>
            </li>
          ))}
        </ul>
      </Card>
      <h2 className="font-display text-2xl font-bold">{t.settings}</h2>
      {active ? (
        <Card title={t.fishing}>
          <p>{angler.status === 'paused' ? t.pausedBody : t.fishingBody}</p>
          <div className="mt-3">
            {angler.status === 'paused'
              ? <Button pending={resume.pending} onClick={() => void resume.run({}, t.resumed)}>{t.resume}</Button>
              : <Button variant="secondary" disabled={pause.pending} onClick={() => setAskingPause(true)}>{t.pause}</Button>}
          </div>
          <ActionFeedback error={pause.error ?? resume.error} message={pause.message ?? resume.message} />
        </Card>
      ) : null}
      {active ? (
        <Card title={t.publicProfile}>
          <p>{angler.publicProfile ? t.profileShown : t.profileHidden} {t.leaderboards}</p>
          <div className="mt-3">
            {/* D144: shown by default; hiding stays available but quiet. */}
            <Button variant={angler.publicProfile ? 'quiet' : 'secondary'} pending={profile.pending} onClick={() => void profile.run({ visible: !angler.publicProfile }, angler.publicProfile ? t.hidden : t.shown)}>
              {angler.publicProfile ? t.hide : t.show}
            </Button>
          </div>
          {angler.publicProfile ? <p className="mt-3 text-sm"><Link to="/profile/$alias" params={{ alias: angler.alias }} className="underline underline-offset-4">{t.openProfile}</Link></p> : null}
          <ActionFeedback error={profile.error} message={profile.message} />
        </Card>
      ) : null}
      {active ? <AlertsCard notify={notify} kinds={alertKinds} intro={t.alertsIntro} quietNote={t.alertsQuiet} /> : null}
      <Installations notify={notify} />
      {/* As Desk Crawler's: the destructive action folded away, so it is never the page's loudest card. */}
      <details className="border-t-2 border-hp pt-4">
        <summary className="min-h-11 cursor-pointer font-semibold text-hp-ink">{t.deleteTitle}</summary>
        <p>{t.deleteBody}</p>
        <label className="mt-3 flex flex-col gap-1">
          <span className="text-sm font-semibold">{t.typeDelete}</span>
          <input value={confirm} onChange={(event) => setConfirm(event.target.value)} className="min-h-11 border-2 border-edge bg-ground px-3 text-base" autoComplete="off" autoCapitalize="characters" spellCheck={false} disabled={deletion.pending} />
        </label>
        <div className="mt-3">
          <Button variant="danger" disabled={confirm !== 'DELETE'} pending={deletion.pending} busyLabel={t.removing} onClick={() => void deletion.run({ confirm: 'DELETE', gameSlug: 'idle-angler' }, t.removingDone)}>{t.deleteTitle}</Button>
        </div>
        <ActionFeedback error={deletion.error} message={deletion.message} />
      </details>
      <p className="text-sm"><Link to="/account" className="underline underline-offset-4">{t.accountSettings}</Link>{t.accountCovers}</p>
      <ConfirmSheet
        open={askingPause}
        title={t.pauseTitle}
        confirmLabel={t.pause}
        busyLabel={t.pausing}
        cancelLabel={t.keepFishing}
        pending={pause.pending}
        onClose={() => setAskingPause(false)}
        onConfirm={async () => {
          if (pause.pending) return
          await pause.run({}, t.pausedDone)
          setAskingPause(false)
        }}
      >
        <Consequences>
          <li>{t.pause1}</li>
          <li>{t.pause2}</li>
          <li>{t.pause3}</li>
        </Consequences>
      </ConfirmSheet>
      <NoticeBar notice={notice} onDismiss={dismiss} />
    </>
  )
}

/** The account's Idle Angler installations, each with Disconnect (Desk Crawler's card, D115's per-game connections). */
function Installations({ notify }: { notify: (feedback: { error: string | null; message: string | null }) => void }) {
  const { data: connections } = useQuery(convexQuery(api.connections.mine, { gameSlug: 'idle-angler' }))
  const t = useT(iaMore)
  const common = useT(iaCommon)
  const disconnect = useIntent(api.connections.disconnect, { onFeedback: notify })
  const [disconnectId, setDisconnectId] = useState<string | null>(null)
  const chosen = connections?.find((connection) => connection.id === disconnectId)
  return (
    <Card title={t.installations} icon="plug">
      <p className="mb-3 text-sm text-muted">{t.installationsBlurb}</p>
      {connections === undefined ? <LoadingState label={t.loadingInstallations} /> : connections.length > 0 ? (
        <ul className="flex flex-col divide-y divide-rule">
          {connections.map((c) => (
            <li key={c.id} className="flex items-center justify-between gap-2 py-2">
              <span className="flex min-w-0 flex-col">
                <span className="font-semibold">{t.installation(c.uuid.slice(0, 8))}</span>
                <span className="text-sm text-muted">{c.state === 'active' ? t.connected : c.state === 'uninstalled' ? t.uninstalled : t.disconnected}</span>
              </span>
              {c.state === 'active' ? (
                <Button allowOffline icon="plug" variant="secondary" className="shrink-0" disabled={disconnect.pending} onClick={() => { disconnect.clearFeedback(); setDisconnectId(c.id) }}>
                  {t.disconnect}
                </Button>
              ) : null}
            </li>
          ))}
        </ul>
      ) : (
        <p>{t.noInstallations}</p>
      )}
      {chosen ? <div className="mt-4 border-t border-rule pt-4">
        <p className="font-semibold">{t.disconnectTitle(chosen.uuid.slice(0, 8))}</p>
        <p className="mt-2 text-sm">{t.disconnectBody}</p>
        <div className="mt-3 flex flex-wrap gap-2">
          <Button variant="secondary" pending={disconnect.pending} busyLabel={t.disconnecting} onClick={async () => { if (await disconnect.run({ gameSlug: 'idle-angler', instanceId: chosen.id }, t.disconnectedDone)) setDisconnectId(null) }}>{t.confirmDisconnect}</Button>
          <Button allowOffline variant="quiet" disabled={disconnect.pending} onClick={() => setDisconnectId(null)}>{common.cancel}</Button>
        </div>
      </div> : null}
    </Card>
  )
}
