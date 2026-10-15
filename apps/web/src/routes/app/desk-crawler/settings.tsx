import { convexQuery } from '@convex-dev/react-query'
import { ConfirmSheet, PauseConsequences } from './-confirm'
import { useQuery } from '@tanstack/react-query'
import { createFileRoute, Link } from '@tanstack/react-router'
import { useEffect, useState } from 'react'
import { api } from '@trmnl-games/backend/api'
import { useIntent } from '../../../lib/intent'
import { captureAnalytics } from '../../../lib/analytics'
import { seo } from '../../../lib/seo'
import { messagesFor, useT } from '../../../lib/i18n'
import { dcMoreMessages } from '../../../i18n/dcMore'
import { Button, Card, LoadingState, NoticeBar, useFocusWithin, useNotice } from '../../../lib/ui'
import { preload } from '../../../lib/preload'
import { AlertsCard } from './-alerts'
import { MoreLinks } from './-moreLinks'

/** The More tab (D124): the pages that are not play (achievements, keepsakes, the device) above the settings. */
export const Route = createFileRoute('/app/desk-crawler/settings')({ head: ({ match: { context: { locale } } }) => seo({ title: messagesFor(dcMoreMessages, locale).title, index: false, locale }), loader: ({ context }) => preload(context, convexQuery(api.users.me, {}), convexQuery(api.heroes.mine, {}), convexQuery(api.connections.mine, {}), convexQuery(api.alerts.mine, {})), component: Settings })

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
  const t = useT(dcMoreMessages)
  if (!me?.user || !hero) return <LoadingState label={t.loadingSettings} />
  const healthy = hero.simulationState !== 'quarantined'
  return (
    <>
      <h1 className="font-display text-3xl font-bold">{t.title}</h1>
      <MoreLinks />
      <header>
        <h2 className="font-display text-2xl font-bold">{t.settings}</h2>
        <p className="mt-2">{t.playingAs}<strong>{me.user.publicAlias}</strong>{t.aliasExplainer}<Link to="/account" className="underline underline-offset-4">{t.changeFromAccount}</Link>{t.renameWithTag}</p>
      </header>
      <Card title={t.adventures} icon="travel"><div ref={adventures}>
        {hero.activationState !== 'active' ? (
          <p>{t.heroReady}</p>
        ) : hero.status === 'paused' ? (
          <>
            <p>{t.paused}</p>
            <Button className="mt-3" icon="play" pending={resume.pending} busyLabel={t.resuming} disabled={!healthy || pause.pending} onClick={() => resume.run({}, t.resumed)}>
              {t.resumeAdventures}
            </Button>
          </>
        ) : hero.status === 'sleeping' ? (
          <p>{t.stoppedFullBag}<Link to="/app/desk-crawler/inventory" className="underline underline-offset-4">{t.makeRoom}</Link>.</p>
        ) : (
          <>
            <p>{t.pausingStops}</p>
            <Button className="mt-3" icon="pause" variant="secondary" pending={pause.pending} busyLabel={t.pausing} disabled={!healthy || resume.pending || (hero.status !== 'exploring' && hero.status !== 'resting')} onClick={() => setAskPause(true)}>
              {t.pauseAdventures}
            </Button>
            <ConfirmSheet open={askPause} title={t.pauseTitle} confirmLabel={t.pause} busyLabel={t.pausing} cancelLabel={t.keepAdventuring} pending={pause.pending} disabled={!healthy} onClose={() => setAskPause(false)} onConfirm={async () => { if (await pause.run({}, t.pausedDone)) setAskPause(false) }}>
              <PauseConsequences />
            </ConfirmSheet>
          </>
        )}
        {hero.status === 'dead' || hero.status === 'travelling' ? <p className="mt-2 text-sm text-muted">{t.pauseAfter(hero.status === 'dead')}</p> : null}
        {!healthy ? <p className="mt-2 text-sm">{t.serviceCheck}</p> : null}
      </div></Card>
      <Card title={t.publicProfile} icon="eye"><div ref={sharing}>
        {hero.activationState !== 'active' ? (
          <p>{t.pageOnceStarted}</p>
        ) : hero.publicProfile ? (
          <>
            <p>{t.pagePublic}</p>
            <p className="mt-2 break-all"><Link to="/desk-crawler/heroes/$alias" params={{ alias: me.user.publicAlias }} className="underline underline-offset-4">trmnlgames.com/desk-crawler/heroes/{encodeURIComponent(me.user.publicAlias)}</Link></p>
            <div className="mt-3 flex flex-wrap gap-2">
              <ShareHeroLink alias={me.user.publicAlias} heroName={hero.name} notify={notify} />
            </div>
            {/* D144: public by default; hiding stays available but quiet. */}
            <Button className="mt-3 -ml-3 min-[375px]:-ml-4" variant="quiet" pending={profile.pending} busyLabel={t.hiding} onClick={() => profile.run({ visible: false }, t.hidden)}>{t.hidePage}</Button>
          </>
        ) : (
          <>
            <p>{t.pageHidden}</p>
            <Button className="mt-3" variant="secondary" pending={profile.pending} busyLabel={t.showing} onClick={() => profile.run({ visible: true }, t.shown)}>{t.showPage}</Button>
          </>
        )}
      </div></Card>
      {hero.activationState === 'active' ? <AlertsCard notify={notify} /> : null}
      <Card title={t.installations} icon="plug">
        <p className="mb-3 text-sm text-muted">{t.installationsBlurb}</p>
        {connections === undefined ? <LoadingState label={t.loadingInstallations} /> : connections.length > 0 ? (
          <ul className="flex flex-col divide-y divide-rule">
            {connections.map((c) => (
              <li key={c.id} className="flex items-center justify-between gap-2 py-2">
                {/* Name over status, beside a button that keeps its width: inline, the status ran under the button on phones. */}
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
        {disconnectId ? <div className="mt-4 border-t border-rule pt-4">
          <p className="font-semibold">{t.disconnectTitle(connections?.find((connection) => connection.id === disconnectId)?.uuid.slice(0, 8) ?? '')}</p>
          <p className="mt-2 text-sm">{t.disconnectBody}</p>
          <div className="mt-3 flex flex-wrap gap-2">
            <Button variant="secondary" pending={disconnect.pending} busyLabel={t.disconnecting} onClick={async () => { const connection = connections?.find((entry) => entry.id === disconnectId); if (connection && await disconnect.run({ instanceId: connection.id }, t.disconnectedDone)) setDisconnectId(null) }}>{t.confirmDisconnect}</Button>
            <Button allowOffline variant="quiet" disabled={disconnect.pending} onClick={() => setDisconnectId(null)}>{t.cancel}</Button>
          </div>
        </div> : null}
      </Card>
      <details className="border-t-2 border-hp pt-4">
        <summary className="min-h-11 cursor-pointer font-semibold text-hp-ink">{t.deleteSummary}</summary>
        <p>{t.deleteBody}</p>
        <label className="mt-3 flex flex-col gap-1 text-sm">
          <span className="font-semibold">{t.typeDelete}</span>
          <input value={confirmText} onChange={(e) => setConfirmText(e.target.value)} className="min-h-11 border-2 border-edge bg-ground px-3 text-base" autoComplete="off" autoCapitalize="characters" spellCheck={false} disabled={deletion.pending} />
        </label>
        <Button
          className="mt-3"
          variant="danger"
          pending={deletion.pending}
          busyLabel={t.removingProgress}
          disabled={confirmText !== 'DELETE' || deletion.pending}
          onClick={async () => {
            await deletion.run({ confirm: 'DELETE' })
          }}
        >
          {t.deleteProgress}
        </Button>
        <p className="mt-4 text-sm">{t.deleteEverything}<Link to="/account" className="underline underline-offset-4">{t.account}</Link>.</p>
      </details>
      <nav aria-label={t.help} className="flex flex-wrap gap-x-5 gap-y-1 text-sm">
        <Link to="/support" className="inline-flex min-h-11 items-center underline underline-offset-4">{t.contactSupport}</Link>
        <Link to="/feedback" search={{ from: '/app/desk-crawler/settings' }} className="inline-flex min-h-11 items-center underline underline-offset-4">{t.sendFeedback}</Link>
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
  const t = useT(dcMoreMessages)
  useEffect(() => setCanShare(typeof navigator.share === 'function'), [])
  const url = () => `${window.location.origin}/desk-crawler/heroes/${encodeURIComponent(alias)}`
  const share = async () => {
    try {
      await navigator.share({ title: t.shareTitle(heroName), url: url() })
      captureAnalytics('profile shared', { method: 'share' })
    } catch (error) {
      if ((error as Error).name !== 'AbortError') notify({ error: t.shareFailed, message: null })
    }
  }
  const copy = async () => {
    try {
      await navigator.clipboard.writeText(url())
      captureAnalytics('profile shared', { method: 'copy' })
      notify({ error: null, message: t.linkCopied })
    } catch {
      notify({ error: t.copyFailed, message: null })
    }
  }
  return (
    <>
      {canShare ? <Button icon="share" onClick={share}>{t.share}</Button> : null}
      <Button variant={canShare ? 'secondary' : 'primary'} onClick={copy}>{t.copyLink}</Button>
    </>
  )
}
