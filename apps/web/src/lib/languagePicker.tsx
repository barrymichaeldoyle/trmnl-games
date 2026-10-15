import { useAuth } from '@clerk/tanstack-react-start'
import { useMutation } from 'convex/react'
import { api } from '@trmnl-games/backend/api'
import { LANGUAGES_LIVE, LOCALES, LOCALE_NAMES, isLocale } from '@trmnl-games/platform'
import { useId, useState } from 'react'
import { defineMessages, useLocale, useT, writeLocaleCookie } from './i18n'

const messages = defineMessages({
  en: { label: 'Language' },
  fr: { label: 'Langue' },
  de: { label: 'Sprache' },
})

/**
 * D169: the language picker in the footers. The choice is remembered in this browser and, for a signed-in player, on
 * their account, which their TRMNL screens follow too; the page then reloads so the server renders the new language.
 */
export function LanguagePicker({ className = '' }: { className?: string }) {
  const t = useT(messages)
  const locale = useLocale()
  const id = useId()
  const { isSignedIn } = useAuth()
  const save = useMutation(api.users.setLanguage)
  const [busy, setBusy] = useState(false)
  if (!LANGUAGES_LIVE) return null
  return (
    <div className={`flex items-center gap-2 ${className}`}>
      <label htmlFor={id} className="text-muted">{t.label}</label>
      <select
        id={id}
        value={locale}
        disabled={busy}
        onChange={async (event) => {
          const next = event.target.value
          if (!isLocale(next) || next === locale) return
          setBusy(true)
          writeLocaleCookie(next)
          if (isSignedIn) await save({ language: next }).catch(() => {})
          window.location.reload()
        }}
        className="pixel-select min-h-11 border-2 border-edge pr-9 pl-3 text-base"
      >
        {LOCALES.map((option) => <option key={option} value={option} lang={option}>{LOCALE_NAMES[option]}</option>)}
      </select>
    </div>
  )
}
