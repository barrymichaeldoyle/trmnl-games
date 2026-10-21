import { convexQuery } from '@convex-dev/react-query'
import { useQuery } from '@tanstack/react-query'
import { Link, createFileRoute } from '@tanstack/react-router'
import { useEffect, useRef, useState } from 'react'
import { useAction } from 'convex/react'
import { api } from '@trmnl-games/backend/api'
import { ALIAS_RULE } from '@trmnl-games/platform'
import { AuthShell } from '../lib/platformShell'
import { errorMessage, useIntent } from '../lib/intent'
import { NameField, nameProblem } from '../lib/nameField'
import { Button, ErrorNote } from '../lib/ui'
import { seo } from '../lib/seo'
import { preload } from '../lib/preload'
import { formatDate, messagesFor, useLocale, useT, writeLocaleCookie } from '../lib/i18n'
import { headMessages } from '../i18n/heads'
import { accountMessages } from '../i18n/account'
import { LOCALES, LOCALE_NAMES, LANGUAGES_LIVE, isLocale, type Locale } from '@trmnl-games/platform'
import { useMutation } from 'convex/react'

export const Route = createFileRoute('/account')({ head: ({ match: { context: { locale } } }) => seo({ title: messagesFor(headMessages, locale).account, index: false, locale }), loader: ({ context }) => preload(context, convexQuery(api.users.me, {})), component: () => <AuthShell><Account /></AuthShell> })

function Account() {
  const { data: me, isPending } = useQuery(convexQuery(api.users.me, {}))
  const { data: emailStatus } = useQuery(convexQuery(api.deletion.deletionEmailStatus, {}))
  const requestEmail = useAction(api.deletion.requestDeletionEmail)
  const [pending, setPending] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [now, setNow] = useState(Date.now)
  const inFlight = useRef(false)
  const t = useT(accountMessages)
  const pageLocale = useLocale()
  useEffect(() => {
    if (!emailStatus) return
    const timer = window.setTimeout(() => setNow(Date.now()), Math.max(0, emailStatus.expiresAt - Date.now()) + 10)
    return () => window.clearTimeout(timer)
  }, [emailStatus])
  const activeRequest = emailStatus && emailStatus.expiresAt > now
  async function sendLink() {
    if (inFlight.current || activeRequest) return
    if (!navigator.onLine) { setError(t.offline); return }
    inFlight.current = true
    setPending(true)
    setError(null)
    try { await requestEmail({ locale: pageLocale }); setNow(Date.now()) }
    catch (caught) { setError(errorMessage(caught)) }
    finally { inFlight.current = false; setPending(false) }
  }
  return (
    <main id="main" className="mx-auto flex w-full max-w-3xl flex-col gap-6 px-4 py-8">
      <h1 className="font-display text-3xl font-bold">{t.title}</h1>
      {isPending ? <p role="status">{t.loading}</p> : (
        <>
          <div className="flex flex-col gap-3">
            {me?.user ? <p>{t.playingAsBefore}<strong>{me.user.publicAlias}</strong>{t.playingAsAfter}</p> : <p>{t.pickName}</p>}
            <p className="text-sm text-muted">{t.signInMethods}</p>
          </div>
          {me?.user && !me.user.nameRepairRequired ? <PublicNameForm current={me.user.publicAlias} changeAt={me.user.publicNameChangeAt} /> : null}
          {me?.user && LANGUAGES_LIVE ? <LanguageSetting saved={me.user.language} /> : null}
          <nav aria-label={t.nav} className="flex flex-wrap gap-x-5 gap-y-1 text-sm">
            <Link to="/privacy" className="inline-flex min-h-11 items-center underline underline-offset-4">{t.privacyPolicy}</Link>
            <Link to="/app/desk-crawler/settings" className="inline-flex min-h-11 items-center underline underline-offset-4">{t.deskCrawlerSettings}</Link>
          </nav>
          {me ? (
            <details data-analytics-private className="border-t-2 border-hp pt-4">
              <summary className="min-h-11 cursor-pointer font-semibold text-hp-ink">{t.deleteSummary}</summary>
              <p>{t.deleteBodyBefore}<Link to="/app/desk-crawler/settings" className="underline underline-offset-4">{t.deskCrawlerSettings}</Link>{t.deleteBodyAfter}</p>
              <p className="mt-3 text-sm">{t.staysActive}</p>
              {activeRequest ? <p role="status" className="mt-3">{emailStatus.state === 'pending' ? t.sendingTo(emailStatus.email) : emailStatus.state === 'sent' ? t.checkEmail(emailStatus.email) : emailStatus.state === 'failed' ? t.deliveryFailed : t.deletionUnderway}</p> : emailStatus ? <p className="mt-3">{t.previousExpired}</p> : null}
              <Button className="mt-4" variant="danger" pending={pending} busyLabel={t.requestingEmail} disabled={Boolean(activeRequest) || emailStatus === undefined} onClick={sendLink}>{t.emailDeletionLink}</Button>
              <ErrorNote message={error} />
            </details>
          ) : null}
        </>
      )}
    </main>
  )
}


/**
 * D142: change the public name shared by every game, free once every 7 days. Hero names are separate and change with
 * a name tag in each game.
 */
function PublicNameForm({ current, changeAt }: { current: string; changeAt: number | null }) {
  const [name, setName] = useState('')
  const [now] = useState(Date.now)
  const change = useIntent(api.users.changePublicName)
  const t = useT(accountMessages)
  const locale = useLocale()
  const open = changeAt === null || changeAt <= now
  const valid = nameProblem(name, ALIAS_RULE, 'public name') === null && name.trim() !== current
  return (
    <details className="border-t-2 border-faint pt-4">
      <summary className="min-h-11 cursor-pointer font-semibold">{t.changeNameSummary}</summary>
      <p>{t.changeNameBody}</p>
      {open ? (
        <form className="mt-3 flex flex-col gap-2" onSubmit={async (event) => { event.preventDefault(); if (valid && await change.run({ publicAlias: name.trim() }, t.nowNamed(name.trim()))) setName('') }}>
          <NameField label={t.newPublicName} small rule={ALIAS_RULE} noun="public name" value={name} onChange={setName} disabled={change.pending} />
          <ul className="flex list-disc flex-col gap-1 pl-5 text-sm">
            <li>{t.freeWeekly}</li>
            <li>{t.oldLinks(current)}</li>
            <li>{t.hiddenPlayer}</li>
          </ul>
          <Button type="submit" className="self-start" pending={change.pending} busyLabel={t.changing} disabled={!valid}>{t.changeTo(name.trim() || t.newName)}</Button>
        </form>
      ) : <p className="mt-3 text-sm">{t.changedRecently(formatDate(locale, changeAt, { day: 'numeric', month: 'long' }))}</p>}
      <ErrorNote message={change.error ?? null} />
      {change.message ? <p role="status" className="mt-2 text-sm">{change.message}</p> : null}
    </details>
  )
}

/**
 * D169: the account's language, for the companion and the TRMNL screens. Automatic clears the choice: the companion
 * follows the browser and the screen the TRMNL account. The page reloads so the server renders the new language.
 */
function LanguageSetting({ saved }: { saved: Locale | null }) {
  const t = useT(accountMessages)
  const save = useMutation(api.users.setLanguage)
  const [pending, setPending] = useState(false)
  return (
    <section aria-labelledby="language-title" className="flex flex-col gap-2 border-t-2 border-faint pt-4">
      <h2 id="language-title" className="font-semibold">{t.languageTitle}</h2>
      <p className="text-sm text-muted">{t.languageBody}</p>
      <select
        aria-labelledby="language-title"
        value={saved ?? 'auto'}
        disabled={pending}
        onChange={async (event) => {
          const value = event.target.value
          const next = isLocale(value) ? value : null
          setPending(true)
          try { await save({ language: next }) } catch { setPending(false); return }
          writeLocaleCookie(next)
          window.location.reload()
        }}
        className="pixel-select min-h-11 self-start border-2 border-edge pr-9 pl-3 text-base"
      >
        <option value="auto">{t.automatic}</option>
        {LOCALES.map((option) => <option key={option} value={option} lang={option}>{LOCALE_NAMES[option]}</option>)}
      </select>
    </section>
  )
}
