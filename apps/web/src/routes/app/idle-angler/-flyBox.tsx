import { convexQuery } from '@convex-dev/react-query'
import { useQuery } from '@tanstack/react-query'
import { useEffect, useRef, useState, type FormEvent } from 'react'
import { Link, useNavigate } from '@tanstack/react-router'
import { api } from '@trmnl-games/backend/api'
import { useIntent } from '../../../lib/intent'
import { Confetti, useBurst } from '../../../lib/confetti'
import { Button, Card } from '../../../lib/ui'
import { FlyIcon } from './-art'
import { LocalTime } from '../../../lib/localTime'
import { formatDate, useLocale, useT } from '../../../lib/i18n'
import { iaLog } from '../../../i18n/iaLog'
import { useAngler } from '../../../lib/idleAngler'

type Box = { totalCollected: number; claimedThisWeek: boolean; nextAvailableAt: number | null; connected: boolean; newest: string | null; box: Array<{ id: string; name: string; count: number; rows: string[] }> } | null

type Notify = (feedback: { error: string | null; message: string | null }) => void


/**
 * The fly box (D115): enter the code your TRMNL shows for one fly a week. Cosmetic; the newest one rides on the angler's hat.
 * D180: `scanned` is a code from the screen's fly QR. Once the box loads it is sent once, the address drops it, and the
 * box scrolls into view while the notice bar says how it went. D217: a fly that lands pops confetti over the box and
 * marks its tile New.
 */
export function FlyBox({ notify, scanned }: { notify: Notify; scanned?: string }) {
  const { data } = useQuery(convexQuery(api.idleAngler.flies.mine, {}))
  const box = data as Box | undefined
  const claim = useIntent(api.idleAngler.flies.claim, { onFeedback: notify })
  const [code, setCode] = useState('')
  const sent = useRef(false)
  const card = useRef<HTMLDivElement>(null)
  const navigate = useNavigate()
  const t = useT(iaLog)
  const words = useAngler()
  const locale = useLocale()
  const weekday = (date: Date) => formatDate(locale, date, { weekday: 'long' })
  // The claim answers with an outcome, so a wrong code or a fly already in the box says so (as Desk Crawler's keepsakes do).
  // A fly that lands bursts confetti over the box and marks its tile New until the page is left.
  const [burst, fire] = useBurst()
  const [landed, setLanded] = useState(false)
  const said = (done: { outcome: 'claimed' | 'already_claimed' | 'invalid_code' }) => {
    if (done.outcome === 'claimed') {
      fire()
      setLanded(true)
    }
    return done.outcome === 'invalid_code' ? { error: t.wrongFlyCode } : done.outcome === 'already_claimed' ? t.flyAlready : t.flyAdded
  }
  useEffect(() => {
    if (!scanned || sent.current || !box) return
    sent.current = true
    void navigate({ to: '/app/idle-angler/logbook', search: {}, replace: true })
    if (!box.connected) return
    card.current?.scrollIntoView({ block: 'start' })
    setCode(scanned)
    void claim.run({ code: scanned }, said).then((ok) => { if (ok) setCode('') })
  }, [scanned, box, claim, navigate])
  if (!box) return null
  const submit = async (event: FormEvent) => {
    event.preventDefault()
    if (await claim.run({ code }, said)) setCode('')
  }
  return (
    <div ref={card} className="relative scroll-mt-20">
    {burst > 0 ? <Confetti key={burst} /> : null}
    <Card title={t.flyBox}>
      <p>{t.flyIntro[0]}<strong>{t.flyIntro[1]}</strong>{t.flyIntro[2]}</p>
      {box.claimedThisWeek ? (
        <p className="mt-3 text-sm font-semibold">{t.flyThisWeek} {box.nextAvailableAt ? <LocalTime at={box.nextAvailableAt} format={weekday} /> : null}.</p>
      ) : box.connected ? (
        <form onSubmit={submit} className="mt-3 flex flex-wrap items-end gap-3">
          <label className="flex flex-col gap-1">
            <span className="text-sm font-semibold">{t.flyCode}</span>
            <input value={code} onChange={(event) => setCode(event.target.value)} inputMode="numeric" autoComplete="off" placeholder="482 917" className="min-h-11 w-36 border-2 border-edge bg-ground px-3 text-base tracking-widest" />
          </label>
          <Button type="submit" disabled={code.replace(/\s/g, '').length !== 6} pending={claim.pending} busyLabel={t.checking}>{t.addFly}</Button>
        </form>
      ) : (
        <p className="mt-3 text-sm text-muted">{t.connectForCode}</p>
      )}
      <ul className="mt-4 grid grid-cols-3 gap-2 min-[400px]:grid-cols-4 sm:grid-cols-6" aria-label={t.fliesCollected(box.totalCollected)}>
        {box.box.map((fly) => {
          const fresh = landed && fly.id === box.newest
          return (
          <li key={fly.id} className={`relative flex flex-col items-center gap-1 border p-2 text-center text-xs ${fly.count > 0 ? 'border-edge' : 'border-rule opacity-40'} ${fresh ? 'outline-4 outline-gold' : ''}`} title={fly.count > 0 ? words.fly(fly.id) : t.notCollected}>
            {fresh ? <span className="label-px absolute -top-2.5 bg-gold px-1 text-night">{t.newFly}</span> : null}
            <FlyIcon id={fly.id} rows={fly.rows} className={fly.count > 0 ? '' : 'grayscale'} />
            <span className="leading-tight [overflow-wrap:normal]">{fly.count > 0 ? words.fly(fly.id) : '?'}{fly.count > 1 ? ` ×${fly.count}` : ''}</span>
          </li>
          )
        })}
      </ul>
    </Card>
    </div>
  )
}

/**
 * The dock's ask for the week's fly code (TRMNL review, 2026-11-07): the screen shows "Fly code 482 917" in its title
 * bar and beside its QR code, and the companion's first page said nothing about it, with the box at the foot of the
 * logbook. While the week's fly is unclaimed on a connected angler, this stands under the dock's title with the same
 * six-digit form; a fly that lands bursts confetti and stays as a line to the box until the page is left.
 */
export function FlyCallout({ notify }: { notify: Notify }) {
  const { data } = useQuery(convexQuery(api.idleAngler.flies.mine, {}))
  const box = data as Box | undefined
  const claim = useIntent(api.idleAngler.flies.claim, { onFeedback: notify })
  const [code, setCode] = useState('')
  const [burst, fire] = useBurst()
  const [landed, setLanded] = useState(false)
  const t = useT(iaLog)
  if (!box?.connected || (box.claimedThisWeek && !landed)) return null
  const submit = async (event: FormEvent) => {
    event.preventDefault()
    const ok = await claim.run({ code }, (done: { outcome: 'claimed' | 'already_claimed' | 'invalid_code' }) => {
      if (done.outcome === 'claimed') {
        fire()
        setLanded(true)
      }
      return done.outcome === 'invalid_code' ? { error: t.wrongFlyCode } : done.outcome === 'already_claimed' ? t.flyAlready : t.flyAdded
    })
    if (ok) setCode('')
  }
  return (
    <section aria-labelledby="fly-callout-title" className="relative flex min-w-0 flex-col gap-3 border-[3px] border-night bg-panel p-3 outline-4 outline-gold sm:px-4">
      {burst > 0 ? <Confetti key={burst} /> : null}
      <div className="min-w-0">
        <p className="hud text-hud-sm whitespace-nowrap text-gold-ink">{t.flyCalloutTag}</p>
        <h2 id="fly-callout-title" className="mt-0.5 font-display text-lg leading-tight font-bold sm:text-2xl">{landed ? t.flyAdded : t.flyCalloutTitle}</h2>
      </div>
      {landed ? (
        <p className="text-sm"><Link to="/app/idle-angler/logbook" className="underline underline-offset-4">{t.flyBoxLink}</Link></p>
      ) : (
        <>
          <p className="max-w-prose text-sm">{t.flyCalloutHelp}</p>
          <form onSubmit={submit} className="flex flex-wrap items-end gap-3">
            <label className="flex flex-col gap-1">
              <span className="text-sm font-semibold">{t.flyCode}</span>
              <input value={code} onChange={(event) => setCode(event.target.value)} inputMode="numeric" autoComplete="off" placeholder="482 917" className="min-h-11 w-36 border-2 border-edge bg-ground px-3 text-base tracking-widest" />
            </label>
            <Button type="submit" disabled={code.replace(/\s/g, '').length !== 6} pending={claim.pending} busyLabel={t.checking}>{t.addFly}</Button>
            <Link to="/app/idle-angler/logbook" className="text-sm underline underline-offset-4">{t.flyBoxLink}</Link>
          </form>
        </>
      )}
    </section>
  )
}
