import { convexQuery } from '@convex-dev/react-query'
import { INTL_TAG } from '@trmnl-games/platform'
import { useQuery } from '@tanstack/react-query'
import { useMutation } from 'convex/react'
import { ConvexError } from 'convex/values'
import { Link, useNavigate } from '@tanstack/react-router'
import { useEffect, useRef, useState, type FormEvent } from 'react'
import { api } from '@trmnl-games/backend/api'
import { DESK_KEEPSAKES, EASTER_EGG_KEEPSAKE, KEEPSAKES_OPEN_AT, keepsakesOpen, keepsakeShelf, keepsakeWeek, LETTER_CODES_UNTIL } from '@trmnl-games/desk-crawler/content/keepsakes'
import { errorMessage, isRefusal } from '../../../lib/intent'
import { useOnline } from '../../../lib/network'
import { Submission } from '../../../lib/submission'
import { ActionFeedback, BUTTON_SECONDARY, Button, LINK_BUTTON } from '../../../lib/ui'
import { Glyph } from '../../../lib/glyphs'
import { LocalTime } from '../../../lib/localTime'
import { formatNumber, useLocale, useT } from '../../../lib/i18n'
import { useContent } from '../../../lib/useContent'
import { dcCareerMessages } from '../../../i18n/dcCareer'

const arrivesAt = (tag: string) => (date: Date) => date.toLocaleString(tag, { weekday: 'long', hour: 'numeric', minute: '2-digit' })
const opensOn = (tag: string) => (date: Date) => date.toLocaleString(tag, { weekday: 'long', day: 'numeric', month: 'long', hour: 'numeric', minute: '2-digit' })

function KeepsakeIcon({ pixels }: { pixels: readonly string[] }) {
  const path = pixels.flatMap((row, y) => [...row.matchAll(/#+/g)].map((run) => `M${run.index} ${y}h${run[0].length}v1h-${run[0].length}z`)).join('')
  return <svg viewBox="0 0 8 8" width="32" height="32" fill="currentColor" shapeRendering="crispEdges" aria-hidden="true" className="shrink-0"><path d={path} /></svg>
}

/**
 * The weekly claim: the owner's collection plus the code form's state, shared
 * by the settings shelf and the home page's callout so both behave the same.
 */
function useKeepsakeClaim() {
  const { data: collection } = useQuery(convexQuery(api.keepsakes.mine, {}))
  const mutate = useMutation(api.keepsakes.claim)
  const online = useOnline()
  const submission = useRef(new Submission())
  const inFlight = useRef(false)
  const [code, setCode] = useState('')
  const [pending, setPending] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [message, setMessage] = useState<string | null>(null)
  const [earned, setEarned] = useState<(typeof DESK_KEEPSAKES)[number] | typeof EASTER_EGG_KEEPSAKE | null>(null)
  const [now, setNow] = useState(() => Date.now())
  const t = useT(dcCareerMessages)
  useEffect(() => {
    const timer = window.setInterval(() => setNow(Date.now()), 60_000)
    return () => window.clearInterval(timer)
  }, [])
  const collectedThisWeek = collection?.lastClaimWeek != null && collection.lastClaimWeek >= keepsakeWeek(now)
  const next = DESK_KEEPSAKES[(collection?.totalCollected ?? 0) % DESK_KEEPSAKES.length]!
  const open = keepsakesOpen(now)

  function edit(value: string) { setCode(value); setError(null); setMessage(null) }

  async function claim(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()
    await submit(code)
  }

  async function submit(value: string) {
    if (inFlight.current) return
    setError(null)
    setMessage(null)
    if (!online) { setError(t.offline); return }
    const normalized = value.trim().toUpperCase().replace(/[\s-]/g, '')
    const letterCode = Date.now() < LETTER_CODES_UNTIL && /^[A-HJ-NP-Z2-9]{8}$/.test(normalized)
    if (!/^\d{6}$/.test(normalized) && !letterCode) { setError(t.enterSixDigits); return }
    inFlight.current = true
    setPending(true)
    try {
      await submission.current.run({ code: normalized }, async (input) => {
        const result = await mutate(input)
        if (isRefusal(result)) { setError(result.message); return }
        // D140: the sample screen's code finds the hidden Easter Egg once; the server decides, so a real matching code still collects.
        if (result.outcome === 'easter_egg' && result.changed) {
          setEarned(EASTER_EGG_KEEPSAKE)
          setMessage(t.eggCollected)
          setCode('')
        } else if (result.outcome === 'easter_egg') setMessage(t.eggAlready)
        else if (result.outcome === 'invalid_code') setError(t.invalidCode)
        else if (result.outcome === 'already_claimed') setMessage(t.alreadyClaimed)
        else {
          const item = DESK_KEEPSAKES[(result.totalCollected - 1) % DESK_KEEPSAKES.length]!
          setEarned(item)
          setMessage(t.collected(item.name))
          setCode('')
        }
      }, (caught) => caught instanceof ConvexError)
    } catch (caught) { setError(errorMessage(caught)) }
    finally { inFlight.current = false; setPending(false) }
  }

  return { collection, collectedThisWeek, open, next, code, edit, claim, submit, pending, error, message, earned }
}

type KeepsakeClaim = ReturnType<typeof useKeepsakeClaim>

function KeepsakeCodeForm({ form, inputId }: { form: KeepsakeClaim; inputId: string }) {
  const t = useT(dcCareerMessages)
  const connected = form.collection?.connected ?? false
  return <form onSubmit={form.claim} className="flex flex-wrap items-end gap-3">
    <div className="flex min-w-0 flex-col gap-1">
      <label htmlFor={inputId} className="text-sm font-semibold">{t.codeLabel}</label>
      <input id={inputId} type="text" inputMode="numeric" value={form.code} onChange={(event) => form.edit(event.target.value)} placeholder="123 456" maxLength={10} autoComplete="one-time-code" spellCheck={false} disabled={form.pending || !connected} aria-describedby={`${inputId}-help`} aria-invalid={form.error ? true : undefined} className="min-h-11 w-48 border-2 border-edge bg-ground px-3 text-base tabular-nums tracking-widest" />
    </div>
    <Button type="submit" pending={form.pending} busyLabel={t.collecting} disabled={!connected || !form.code.trim()}>{t.collect}</Button>
  </form>
}

/**
 * The home page's nudge while this week's keepsake is unclaimed: the design
 * waiting for the owner, a pointer to the code on their TRMNL and the claim
 * form itself, so the trip to the device pays off without a detour to
 * Settings. Hidden when there is nothing to collect or no connection to show
 * a code; stays to confirm a claim made from it until the next visit.
 * D180: `scanned` is a code from the screen's keepsake QR. Once the collection loads it is entered and sent once, the
 * address drops it (so a reload or the history never sends it again), and the callout stays to show how it went.
 */
export function KeepsakeCallout({ scanned }: { scanned?: string }) {
  const form = useKeepsakeClaim()
  const { collection, next, earned } = form
  // Closed by default on every screen: the game screen stays in the first viewport and the code is two taps away.
  const [open, setOpen] = useState(false)
  const [fromScan, setFromScan] = useState(false)
  const sent = useRef(false)
  const navigate = useNavigate()
  const t = useT(dcCareerMessages)
  const c = useContent()
  const ready = collection !== undefined && collection !== null
  useEffect(() => {
    if (!scanned || sent.current || !ready) return
    sent.current = true
    void navigate({ to: '/app/desk-crawler', search: {}, replace: true })
    if (!collection.connected || !form.open) return
    setFromScan(true)
    setOpen(true)
    form.edit(scanned)
    void form.submit(scanned)
  }, [scanned, ready, collection, form, navigate])
  if (!collection?.connected || !form.open) return null
  if (form.collectedThisWeek && !earned && !(fromScan && (form.message || form.error || form.pending))) return null
  const shown = earned ?? next
  return <section aria-labelledby="keepsake-callout-title" className="flex min-w-0 flex-col border-[3px] border-night bg-panel outline-4 outline-gold">
    {/* The title keeps at least a word's width: where the button no longer fits beside it, the button takes its own full row. */}
    <div className="flex flex-wrap items-center gap-3 p-3 sm:gap-4 sm:px-4">
      <div className="grid size-12 shrink-0 place-items-center border-[3px] border-night bg-night text-gold-ink [&>svg]:size-8">
        <KeepsakeIcon pixels={shown.pixels} />
      </div>
      <div className="min-w-0 flex-[999_1_9rem]">
        <p className="hud text-hud-sm whitespace-nowrap text-gold-ink">{earned ? t.collectedTag : t.thisWeek}</p>
        <h2 id="keepsake-callout-title" className="mt-0.5 font-display text-lg leading-tight font-bold sm:text-2xl">{earned ? t.onShelf(earned.name) : t.codeReady}</h2>
      </div>
      {earned
        ? <Link to="/app/desk-crawler/keepsakes" className={`${LINK_BUTTON} ${BUTTON_SECONDARY} grow justify-center whitespace-nowrap sm:grow-0`}>{t.shelf}</Link>
        : <Button allowOffline variant={open ? 'secondary' : 'primary'} className="grow whitespace-nowrap sm:grow-0" aria-expanded={open} aria-controls="keepsake-callout-form" onClick={() => setOpen((value) => !value)}>{open ? t.later : t.enterCode}</Button>}
    </div>
    {open && !earned ? (
      <div id="keepsake-callout-form" className="flex flex-col gap-3 border-t-[3px] border-night p-3 sm:px-4">
        <p className="max-w-prose text-sm">{t.enterToAddBefore}<strong>{c.text(next.name)}</strong>{t.enterToAddAfter}{c.text(next.description)}</p>
        <KeepsakeCodeForm form={form} inputId="keepsake-callout-code" />
        <p id="keepsake-callout-code-help" className="text-sm text-muted">{t.onlyTrmnl}</p>
        <ActionFeedback error={form.error} message={form.message} />
      </div>
    ) : null}
  </section>
}

/** The keepsakes page's content (D46): the next design, the code form and the shelf. Its heading is the page's h1. */
export function DeskKeepsakes() {
  const form = useKeepsakeClaim()
  const { collection, collectedThisWeek, open, next, error, message } = form
  const t = useT(dcCareerMessages)
  const c = useContent()
  const locale = useLocale()

  return <section id="desk-keepsakes" aria-labelledby="keepsakes-title" className="window min-w-0 scroll-mt-20 px-3 pt-3 pb-4 min-[375px]:px-4 sm:px-5">
    <div className="flex flex-wrap items-baseline justify-between gap-2">
      <h1 id="keepsakes-title" className="flex items-center gap-3 font-display text-3xl font-bold"><Glyph name="keepsake" size={24} className="text-gold-ink" />{t.keepsakesTitle}</h1>
      {collection ? <p className="text-sm tabular-nums">{t.countCollected(formatNumber(locale, collection.totalCollected))}</p> : null}
    </div>
    <p className="mt-3 max-w-prose text-sm text-muted">{t.weekly}</p>
    {!collection ? <p role="status" className="mt-4 text-sm">{t.loadingCollection}</p> : <>
      <div className="my-5 flex items-center gap-4">
        <KeepsakeIcon pixels={next.pixels} />
        <div><p className="font-semibold">{collectedThisWeek ? t.comingNext : t.nextKeepsake}{c.text(next.name)}</p><p className="mt-1 text-sm text-muted">{c.text(next.description)}</p></div>
      </div>
      {!open ? <p className="text-sm font-semibold">{t.startBefore}<LocalTime at={KEEPSAKES_OPEN_AT} format={opensOn(INTL_TAG[locale])} />{t.startAfter}</p> : collectedThisWeek ? <p className="text-sm font-semibold">{t.collectedWeek}{collection.nextAvailableAt ? <>{t.nextArrivesBefore}<LocalTime at={collection.nextAvailableAt} format={arrivesAt(INTL_TAG[locale])} />{t.nextArrivesAfter}</> : t.nextWeek}</p> : <KeepsakeCodeForm form={form} inputId="keepsake-code" />}
      <p id="keepsake-code-help" className="mt-3 max-w-prose text-sm text-muted">{collection.connected ? t.codeSits : t.reconnect}</p>
      <ActionFeedback error={error} message={message} />
      <ul aria-label={t.shelfLabel} className="mt-5 grid grid-cols-1 gap-x-6 gap-y-4 min-[480px]:grid-cols-2 sm:grid-cols-3 sm:gap-y-5">
        {/* Collected designs sit in a solid night tile in gold; the rest are dark silhouettes in a dashed edge, still to earn. */}
        {keepsakeShelf(collection.totalCollected).map((item) => <li key={item.id} className={`flex items-center gap-3 ${item.count ? '' : 'text-muted'}`}>
          <span aria-hidden="true" className={`grid size-12 shrink-0 place-items-center border-[3px] bg-night ${item.count ? 'border-night text-gold-ink' : 'border-dashed border-faint text-raised'}`}><KeepsakeIcon pixels={item.pixels} /></span>
          <div className="min-w-0"><p className="text-sm font-semibold">{c.text(item.name)}</p><p className="mt-0.5 text-sm tabular-nums">{item.count ? t.countCollected(formatNumber(locale, item.count)) : t.notCollected}</p></div>
        </li>)}
        {/* D140: the hidden keepsake joins the shelf only once found, outside the weekly set and its count. */}
        {collection.easterEgg ? <li className="flex items-center gap-3">
          <span aria-hidden="true" className="grid size-12 shrink-0 place-items-center border-[3px] border-night bg-night text-gold-ink"><KeepsakeIcon pixels={EASTER_EGG_KEEPSAKE.pixels} /></span>
          <div className="min-w-0"><p className="text-sm font-semibold">{c.text(EASTER_EGG_KEEPSAKE.name)}</p><p className="mt-0.5 text-sm">{c.text(EASTER_EGG_KEEPSAKE.description)}</p></div>
        </li> : null}
      </ul>
      <p className="mt-5 max-w-prose text-sm text-muted">{t.noChange}</p>
    </>}
  </section>
}
