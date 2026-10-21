import { Show, SignIn } from '@clerk/tanstack-react-start'
import { convexQuery } from '@convex-dev/react-query'
import { useQuery } from '@tanstack/react-query'
import { Link, createFileRoute, redirect } from '@tanstack/react-router'
import { api } from '@trmnl-games/backend/api'
import { useState } from 'react'
import { seo } from '../../../../lib/seo'
import { SwitchAccount } from '../../../../lib/switchAccount'
import { useIntent } from '../../../../lib/intent'
import { ActionFeedback, BUTTON_PRIMARY, BUTTON_SECONDARY, Button, Card, LINK_BUTTON, LoadingState } from '../../../../lib/ui'
import { captureManagement, getManagedInstance } from '../../../../server/manageFns'
import { useAnalyticsView } from '../../../../lib/analyticsProvider'
import { requireOpenGame } from '../../../../lib/gameAccess'
import { messagesFor, useT } from '../../../../lib/i18n'
import { headMessages } from '../../../../i18n/heads'
import { iaConnect } from '../../../../i18n/iaConnect'

type Search = { uuid?: string; jwt?: string; invalid?: boolean }

export const Route = createFileRoute('/connect/trmnl/idle-angler/manage')({
  validateSearch: (search: Record<string, unknown>): Search => ({
    ...(typeof search.uuid === 'string' ? { uuid: search.uuid } : {}),
    ...(typeof search.jwt === 'string' ? { jwt: search.jwt } : {}),
    ...(search.invalid === true || search.invalid === 'true' ? { invalid: true } : {}),
  }),
  beforeLoad: async ({ search }) => {
    if (search.jwt !== undefined || search.uuid !== undefined) {
      // Verify immediately (the TRMNL token lives two minutes), then drop it from the URL.
      const result = await captureManagement({ data: { gameSlug: 'idle-angler', uuid: search.uuid ?? '', jwt: search.jwt ?? '' } })
      throw redirect({ to: '/connect/trmnl/idle-angler/manage', search: result.ok ? {} : { invalid: true }, replace: true })
    }
  },
  loader: async ({ context }) => {
    await requireOpenGame(context, 'idle-angler')
    return await getManagedInstance({ data: { gameSlug: 'idle-angler' } })
  },
  head: ({ match: { context: { locale } } }) => {
    const head = seo({ title: messagesFor(headMessages, locale).iaManage, index: false, locale })
    return { ...head, meta: [...head.meta, { name: 'referrer', content: 'no-referrer' }] }
  },
  component: ManagePage,
})

function ManagePage() {
  const { uuid } = Route.useLoaderData()
  const { invalid } = Route.useSearch()
  const t = useT(iaConnect)
  useAnalyticsView('management opened', { valid_handoff: uuid !== null, invalid_link: invalid ?? false })
  return (
    <main id="main" className="mx-auto flex max-w-lg flex-col gap-4 px-4 py-12">
      <h1 className="font-display text-3xl font-bold">{t.onTrmnl}</h1>
      {uuid === null ? (
        <Card>
          {invalid ? <p role="alert">{t.invalidLink}</p> : null}
          <p>{t.openFrom}</p>
        </Card>
      ) : (
        <>
          <Show when="signed-out">
            <p>{t.signInWith}</p>
            <SignIn routing="hash" forceRedirectUrl="/connect/trmnl/idle-angler/manage" signUpForceRedirectUrl="/connect/trmnl/idle-angler/manage" />
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
  const { data } = useQuery(convexQuery(api.connections.forManagement, { gameSlug: 'idle-angler', uuid }))
  // The verified reconnection flow (D69) is Desk Crawler's: a revoked Idle Angler installation starts again from Install.
  const disconnect = useIntent(api.connections.disconnect)
  const [confirming, setConfirming] = useState(false)
  const t = useT(iaConnect)
  useAnalyticsView('management account mismatch', {}, data !== undefined && (data === null || !data.owned))
  if (data === undefined) return <LoadingState label={t.checking} />
  if (data === null || !data.owned) {
    return (
      <Card title={data === null ? t.notConnected : t.differentAccount}>
        <p>{data === null ? t.notConnectedBody : t.differentBody}</p>
        <div className="mt-3">
          <SwitchAccount returnTo="/connect/trmnl/idle-angler/manage" />
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
          {t.showingBefore}<strong>{heroName ?? t.yourAngler}</strong>{t.showingAfter}
        </p>
      ) : (
        <p>{t.disconnectedBody}</p>
      )}
      <div className="mt-4 flex flex-wrap gap-2">
        <Link to="/app/idle-angler" className={`${LINK_BUTTON} ${BUTTON_PRIMARY}`}>
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
      {confirming && instance.state === 'active' ? <div className="mt-4 border-t border-rule pt-4"><p className="font-semibold">{t.disconnectTitle}</p><p className="mt-2 text-sm">{t.disconnectBody}</p><div className="mt-3 flex flex-wrap gap-2"><Button variant="secondary" pending={disconnect.pending} busyLabel={t.disconnecting} onClick={async () => { if (await disconnect.run({ gameSlug: 'idle-angler', instanceId: instance.id }, t.disconnected)) setConfirming(false) }}>{t.confirmDisconnect}</Button><Button variant="quiet" disabled={disconnect.pending} onClick={() => setConfirming(false)}>{t.cancel}</Button></div></div> : null}
      <ActionFeedback {...disconnect} />
    </Card>
  )
}
