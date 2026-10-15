import { Show, SignIn } from '@clerk/tanstack-react-start'
import { convexQuery } from '@convex-dev/react-query'
import { useQuery } from '@tanstack/react-query'
import { Link, createFileRoute, redirect, useNavigate } from '@tanstack/react-router'
import { api } from '@trmnl-games/backend/api'
import { useEffect, useState } from 'react'
import type { Id } from '@trmnl-games/backend/data-model'
import { seo } from '../../../../lib/seo'
import { SwitchAccount } from '../../../../lib/switchAccount'
import { useIntent } from '../../../../lib/intent'
import { ActionFeedback, BUTTON_PRIMARY, BUTTON_SECONDARY, Button, Card, LINK_BUTTON, LoadingState } from '../../../../lib/ui'
import { captureManagement, getManagedInstance } from '../../../../server/manageFns'
import { useAnalyticsView } from '../../../../lib/analyticsProvider'
import { messagesFor, useT } from '../../../../lib/i18n'
import { manageMessages } from '../../../../i18n/manage'

type Search = { uuid?: string; jwt?: string; invalid?: boolean }

export const Route = createFileRoute('/connect/trmnl/desk-crawler/manage')({
  validateSearch: (search: Record<string, unknown>): Search => ({
    ...(typeof search.uuid === 'string' ? { uuid: search.uuid } : {}),
    ...(typeof search.jwt === 'string' ? { jwt: search.jwt } : {}),
    ...(search.invalid === true || search.invalid === 'true' ? { invalid: true } : {}),
  }),
  beforeLoad: async ({ search }) => {
    if (search.jwt !== undefined || search.uuid !== undefined) {
      // Verify immediately (the TRMNL token lives two minutes), then drop it from the URL.
      const result = await captureManagement({ data: { gameSlug: 'desk-crawler', uuid: search.uuid ?? '', jwt: search.jwt ?? '' } })
      throw redirect({ to: '/connect/trmnl/desk-crawler/manage', search: result.ok ? {} : { invalid: true }, replace: true })
    }
  },
  loader: async () => await getManagedInstance({ data: { gameSlug: 'desk-crawler' } }),
  head: ({ match: { context: { locale } } }) => {
    const head = seo({ title: messagesFor(manageMessages, locale).title, index: false, locale })
    return { ...head, meta: [...head.meta, { name: 'referrer', content: 'no-referrer' }] }
  },
  component: ManagePage,
})

function ManagePage() {
  const { uuid } = Route.useLoaderData()
  const { invalid } = Route.useSearch()
  const t = useT(manageMessages)
  useAnalyticsView('management opened', { valid_handoff: uuid !== null, invalid_link: invalid ?? false })
  return (
    <main id="main" className="mx-auto flex max-w-lg flex-col gap-4 px-4 py-12">
      <h1 className="font-display text-3xl font-bold">{t.heading('Desk Crawler')}</h1>
      {uuid === null ? (
        <Card>
          {invalid ? <p role="alert">{t.expired}</p> : null}
          <p>{t.openFromSettings('Desk Crawler')}</p>
        </Card>
      ) : (
        <>
          <Show when="signed-out">
            <p>{t.signInWith}</p>
            <SignIn routing="hash" forceRedirectUrl="/connect/trmnl/desk-crawler/manage" signUpForceRedirectUrl="/connect/trmnl/desk-crawler/manage" />
          </Show>
          <Show when="signed-in">
            <Connection uuid={uuid} />
          </Show>
        </>
      )}
    </main>
  )
}

function Connection({ uuid }: { uuid: string }) {
  const { data } = useQuery(convexQuery(api.connections.forManagement, { uuid }))
  const { data: reconnect } = useQuery(convexQuery(api.trmnl.reconnectionStatus, {}))
  const [now, setNow] = useState(Date.now)
  useEffect(() => {
    if (!reconnect) return
    const expires = Math.min(reconnect.expiresAt, reconnect.proofExpiresAt ?? reconnect.expiresAt)
    const timer = window.setTimeout(() => setNow(Date.now()), Math.max(0, expires - Date.now()) + 10)
    setNow(Date.now())
    return () => window.clearTimeout(timer)
  }, [reconnect])
  const disconnect = useIntent(api.connections.disconnect)
  const [confirming, setConfirming] = useState(false)
  const t = useT(manageMessages)
  useAnalyticsView('management account mismatch', {}, reconnect === null && data !== undefined && (data === null || !data.owned))
  if (data === undefined || reconnect === undefined) return <LoadingState label={t.checking} />
  if (reconnect) {
    if (reconnect.expiresAt <= now) return <Card title={t.reconnectExpired}><p>{t.startInstallAgain('Desk Crawler')}</p></Card>
    if (!reconnect.verified || reconnect.verifiedUuid !== uuid || !reconnect.proofExpiresAt || reconnect.proofExpiresAt <= now) return <Card title={t.verifyTitle}><p>{t.verifyBody}</p></Card>
    return <Reconnect attemptId={reconnect.id} publicAlias={reconnect.publicAlias} heroName={reconnect.heroName} />
  }
  if (data === null || !data.owned) {
    return (
      <Card title={data === null ? t.notConnected : t.differentAccount}>
        <p>{data === null ? t.notConnectedBody : t.differentBody}</p>
        <div className="mt-3">
          <SwitchAccount returnTo="/connect/trmnl/desk-crawler/manage" />
        </div>
      </Card>
    )
  }
  const { instance, heroName } = data
  const settingsUrl = instance.pluginSettingId ? `https://trmnl.com/plugin_settings/${encodeURIComponent(instance.pluginSettingId)}/edit` : null
  return (
    <Card title={t.thisInstallation}>
      {instance.state === 'active' ? (
        <p>
          {t.showingBefore}<strong>{heroName ?? t.yourHero}</strong>{t.showingAfter}
        </p>
      ) : (
        <p>{t.disconnected('Desk Crawler')}</p>
      )}
      <div className="mt-4 flex flex-wrap gap-2">
        <Link to="/app/desk-crawler" className={`${LINK_BUTTON} ${BUTTON_PRIMARY}`}>
          {t.openCompanion}
        </Link>
        {settingsUrl ? (
          <a href={settingsUrl} className={`${LINK_BUTTON} ${BUTTON_SECONDARY}`}>
            {t.backToTrmnl}
          </a>
        ) : null}
        {settingsUrl ? (
          <a href={`${settingsUrl}?force_refresh=true`} className={`${LINK_BUTTON} ${BUTTON_SECONDARY}`}>
            {t.refreshPreview}
          </a>
        ) : null}
        {instance.state === 'active' ? (
          <Button variant="quiet" disabled={disconnect.pending} onClick={() => setConfirming(true)}>
            {t.disconnect}
          </Button>
        ) : null}
      </div>
      {confirming && instance.state === 'active' ? <div className="mt-4 border-t border-rule pt-4"><p className="font-semibold">{t.disconnectQuestion}</p><p className="mt-2 text-sm">{t.disconnectBody}</p><div className="mt-3 flex flex-wrap gap-2"><Button variant="secondary" pending={disconnect.pending} busyLabel={t.disconnecting} onClick={async () => { if (await disconnect.run({ instanceId: instance.id }, t.disconnected2)) setConfirming(false) }}>{t.confirmDisconnect}</Button><Button variant="quiet" disabled={disconnect.pending} onClick={() => setConfirming(false)}>{t.cancel}</Button></div></div> : null}
      <ActionFeedback {...disconnect} />
    </Card>
  )
}

function Reconnect({ attemptId, publicAlias, heroName }: { attemptId: Id<'trmnlReconnectAttempts'>; publicAlias: string; heroName: string }) {
  const connect = useIntent(api.trmnl.completeReconnection)
  const navigate = useNavigate()
  const t = useT(manageMessages)
  async function confirm() {
    const result = await connect.run({ attemptId, confirm: 'CONNECT' })
    if (result) await navigate({ to: '/app/desk-crawler', replace: true })
  }
  return <div data-analytics-private><Card title={t.confirmTitle}>
    <p>{t.verifiedBefore}<strong>{publicAlias}</strong>{t.verifiedMiddle}<strong>{heroName}</strong>{t.verifiedAfter}</p>
    <p className="mt-3">{t.deletedStays}</p>
    <div className="mt-4 flex flex-col gap-3">
      <Button onClick={confirm} pending={connect.pending} busyLabel={t.connecting}>{t.confirmConnect}</Button>
      <ActionFeedback error={connect.error} message={connect.message} />
      <SwitchAccount returnTo="/connect/trmnl/desk-crawler/manage" />
    </div>
  </Card></div>
}
