import { convexQuery } from '@convex-dev/react-query'
import { useQuery } from '@tanstack/react-query'
import { Link, useLocation } from '@tanstack/react-router'
import { useEffect, useRef, useState } from 'react'
import { api } from '@trmnl-games/backend/api'
import { captureAnalytics } from '../../../lib/analytics'
import { useIntent } from '../../../lib/intent'
import { currentSubscription, deviceLabel, endpointFingerprint, pushSupport, subscribePush, type PushSupport } from '../../../lib/push'
import { Button, Card, LoadingState } from '../../../lib/ui'
import { useT } from '../../../lib/i18n'
import { dcMoreMessages } from '../../../i18n/dcMore'

/** The switches a game's card owns (D115: each game shows its own kinds; devices and quiet hours are shared). */
const SWITCHES = ['asleep', 'merchant', 'coolerFull', 'baitOut', 'majorDecision', 'lifeEnded', 'newArrival'] as const
type KindId = (typeof SWITCHES)[number]
type Prefs = Partial<Record<KindId, boolean>> & { quietStart: number; quietEnd: number }
export type AlertKindCopy = { readonly id: KindId; readonly name: string; readonly blurb: string }

type Notify = (feedback: { error: string | null; message: string | null }) => void

const HOURS = Array.from({ length: 24 }, (_, hour) => hour)
const clock = (hour: number) => `${String(hour).padStart(2, '0')}:00`

/**
 * Settings → Alerts (P33): off by default, the browser prompt only after a tap, a device list and two switches with
 * quiet hours. The device remains the surface that always works, and the card says so. Desk Crawler's two kinds
 * (alerts.md) are the default, each saying what it is and how often it can arrive.
 */
export function AlertsCard({ notify, kinds: given, intro: givenIntro, quietNote: givenNote }: { notify: Notify; kinds?: readonly AlertKindCopy[]; intro?: string; quietNote?: string }) {
  const t = useT(dcMoreMessages)
  const kinds: readonly AlertKindCopy[] = given ?? [{ id: 'asleep', ...t.kinds.asleep }, { id: 'merchant', ...t.kinds.merchant }]
  const intro = givenIntro ?? t.intro
  const quietNote = givenNote ?? t.quietNote
  const { data: alerts } = useQuery(convexQuery(api.alerts.mine, {}))
  const subscribe = useIntent(api.alerts.subscribe, { onFeedback: notify })
  const save = useIntent(api.alerts.setPreferences, {
    onFeedback: notify,
    optimisticUpdate: (store, args) => {
      const current = store.getQuery(api.alerts.mine, {})
      const changed = Object.fromEntries(SWITCHES.flatMap((id) => (args[id] === undefined ? [] : [[id, args[id]]])))
      if (current) store.setQuery(api.alerts.mine, {}, { ...current, ...changed, quietStart: args.quietStart, quietEnd: args.quietEnd, offReason: null })
    },
  })
  // Removing a device drops it from the list on the tap; the last one turns every kind off, as the server does.
  const remove = useIntent(api.alerts.removeDevice, {
    onFeedback: notify,
    optimisticUpdate: (store, { deviceId }) => {
      const current = store.getQuery(api.alerts.mine, {})
      if (!current) return
      const devices = current.devices.filter((device) => device.id !== deviceId)
      store.setQuery(api.alerts.mine, {}, { ...current, devices, ...(devices.length === 0 ? Object.fromEntries(SWITCHES.map((id) => [id, false])) : {}) })
    },
  })
  // Switches and quiet hours show the player's choice at once (the draft) and save in order, latest wins;
  // a failed save drops the draft, so the card falls back to what the server holds.
  const [draft, setDraft] = useState<Prefs | null>(null)
  const queued = useRef<{ prefs: Prefs; message: string } | null>(null)
  const saving = useRef(false)
  // Browser capabilities are known only after hydration; the server render shows no button.
  const [support, setSupport] = useState<PushSupport>('checking')
  const [thisFingerprint, setThisFingerprint] = useState<string | null>(null)
  const [asking, setAsking] = useState(false)
  const deviceCount = alerts?.devices.length ?? 0
  useEffect(() => {
    setSupport(pushSupport())
    currentSubscription()
      .then((subscription) => (subscription ? endpointFingerprint(subscription.endpoint) : null))
      .then(setThisFingerprint)
      .catch(() => setThisFingerprint(null))
  }, [deviceCount])

  if (alerts === undefined) return <Card title={t.alerts} icon="bell"><LoadingState label={t.loadingAlerts} /></Card>
  if (alerts === null) return null
  const timezone = (typeof Intl !== 'undefined' && Intl.DateTimeFormat().resolvedOptions().timeZone) || alerts.timezone
  const thisDevice = alerts.devices.find((device) => device.fingerprint === thisFingerprint)
  const busy = subscribe.pending || remove.pending || asking
  // Only this card's switches travel with a save, so the other game's stay as stored.
  const shown: Prefs = draft ?? { ...Object.fromEntries(kinds.map((kind) => [kind.id, alerts[kind.id]])), quietStart: alerts.quietStart, quietEnd: alerts.quietEnd }

  const update = async (patch: Partial<Prefs>, message: string) => {
    const next = { ...shown, ...patch }
    if (next.quietStart === next.quietEnd) {
      notify({ error: t.quietSame, message: null })
      return
    }
    setDraft(next)
    queued.current = { prefs: next, message }
    if (saving.current) return
    saving.current = true
    while (queued.current) {
      const { prefs, message: saved } = queued.current
      queued.current = null
      const ok = await save.run({ ...prefs, timezone }, saved)
      if (!ok) {
        queued.current = null
        break
      }
      captureAnalytics('alerts changed', Object.fromEntries(kinds.map((kind) => [kind.id, prefs[kind.id] === true])))
    }
    saving.current = false
    // The query already holds the saved values when the save resolves, so the draft can go.
    setDraft(null)
  }

  const allow = async () => {
    if (!alerts.vapidPublicKey) return
    setAsking(true)
    const result = await subscribePush(alerts.vapidPublicKey).catch(() => 'failed' as const)
    setAsking(false)
    if (result === 'denied') {
      setSupport('denied')
      notify({ error: t.blocked, message: null })
      return
    }
    if (result === 'failed') {
      notify({ error: t.setupFailed, message: null })
      return
    }
    if (await subscribe.run({ ...result, label: deviceLabel() }, t.deviceReady)) setThisFingerprint(await endpointFingerprint(result.endpoint))
  }

  return (
    <Card title={t.alerts} icon="bell"><div id="alerts" className="flex flex-col gap-3">
      <p>{intro}{t.offByDefault}</p>
      {alerts.offReason === 'no_devices' ? <p className="text-sm font-semibold">{t.offNoDevices}</p> : null}
      {thisDevice ? null : !alerts.vapidPublicKey ? (
        <p className="text-sm text-muted">{t.notAvailable}</p>
      ) : support === 'ios-install' ? (
        <p className="text-sm">{t.iosBefore}<strong>{t.iosStrong}</strong>{t.iosAfter}</p>
      ) : support === 'unsupported' ? (
        <p className="text-sm">{t.unsupported}</p>
      ) : support === 'denied' ? (
        <p className="text-sm">{t.blockedHere}</p>
      ) : support === 'ready' ? (
        <Button className="self-start" icon="bell" pending={asking || subscribe.pending} busyLabel={t.allowing} disabled={busy} onClick={allow}>{t.allowDevice}</Button>
      ) : null}
      {deviceCount > 0 ? (
        <>
          <fieldset className="flex flex-col gap-2">
            <legend className="sr-only">{t.alertKinds}</legend>
            {kinds.map((kind) => (
              <label key={kind.id} className="flex min-h-11 cursor-pointer items-start gap-3 py-1">
                <input type="checkbox" className="mt-1 size-6 shrink-0 accent-gold" checked={shown[kind.id] === true} onChange={(event) => update({ [kind.id]: event.target.checked }, event.target.checked ? t.kindOn(kind.name) : t.kindOff(kind.name))} />
                <span><strong>{kind.name}</strong><span className="block text-sm">{kind.blurb}</span></span>
              </label>
            ))}
          </fieldset>
          <div className="flex flex-col gap-2">
            <p className="font-semibold">{t.quietHours}</p>
            <div className="flex flex-wrap gap-3">
              {(['quietStart', 'quietEnd'] as const).map((field) => (
                <label key={field} className="flex items-center gap-2 text-sm">
                  <span>{field === 'quietStart' ? t.from : t.until}</span>
                  <select value={shown[field]} onChange={(event) => update({ [field]: Number(event.target.value) }, t.quietSaved)} className="pixel-select min-h-11 border-2 border-edge pr-9 pl-3 text-base">
                    {HOURS.map((hour) => <option key={hour} value={hour}>{clock(hour)}</option>)}
                  </select>
                </label>
              ))}
            </div>
            <p className="text-sm text-muted">{t.inZone(timezone)}{quietNote}</p>
          </div>
          <div>
            <p className="font-semibold">{t.devices}</p>
            <ul className="flex flex-col divide-y divide-rule">
              {alerts.devices.map((device) => (
                <li key={device.id} className="flex items-center justify-between gap-2 py-2">
                  <span className="min-w-0">{t.deviceLabel(device.label)}{device.id === thisDevice?.id ? <span className="ml-2 text-sm text-muted">{t.thisDevice}</span> : null}</span>
                  <Button variant="secondary" disabled={busy} onClick={() => remove.run({ deviceId: device.id }, alerts.devices.length === 1 ? t.deviceRemovedOff : t.deviceRemoved)}>{t.remove}</Button>
                </li>
              ))}
            </ul>
          </div>
        </>
      ) : null}
    </div></Card>
  )
}

/** The single quiet way in besides Settings (alerts.md): under the bag-full state, only while the nap alert is off. */
export function AlertNudge() {
  const { data: alerts } = useQuery(convexQuery(api.alerts.mine, {}))
  const t = useT(dcMoreMessages)
  if (!alerts || alerts.asleep || !alerts.vapidPublicKey) return null
  return <p className="text-sm">{t.nudge}<Link to="/app/desk-crawler/settings" hash="alerts" className="underline underline-offset-4">{t.turnOnAlerts}</Link></p>
}

const OPENED_KINDS = new Set(['asleep', 'merchant', 'cooler_full', 'bait_out', 'major_decision', 'life_ended', 'new_arrival'])

/** `alert opened` with the kind from the alert's link parameter, once, then the parameter leaves the address bar. */
export function useAlertOpened(ready: boolean) {
  const location = useLocation()
  useEffect(() => {
    if (!ready) return
    const params = new URLSearchParams(window.location.search)
    const kind = params.get('alert')
    // D115: Idle Angler's alert links carry cooler_full and bait_out; D159: Paper Lives' carry its three.
    if (kind === null || !OPENED_KINDS.has(kind)) return
    captureAnalytics('alert opened', { kind })
    params.delete('alert')
    const query = params.toString()
    window.history.replaceState(window.history.state, '', `${window.location.pathname}${query ? `?${query}` : ''}${window.location.hash}`)
  }, [location.pathname, ready])
}
