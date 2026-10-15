import { DEFAULT_LOCALE, INTL_TAG, isLocale, type Locale } from '@trmnl-games/platform'
import { createContext, useContext, type ReactNode } from 'react'

/**
 * D169: the companion's languages. Each page keeps its copy in a catalog beside it (`src/i18n/`), with English as the
 * source and every other locale typed against it, so a missing translation fails the typecheck rather than showing
 * English. The locale comes from the `tg_locale` cookie, else the browser's Accept-Language (`resolveLocale`), and the
 * server renders `<html lang>` with it, which the browser then reads back on client navigation.
 */
export const LOCALE_COOKIE = 'tg_locale'
const LOCALE_COOKIE_MAX_AGE = 60 * 60 * 24 * 365

const LocaleContext = createContext<Locale>(DEFAULT_LOCALE)

export function LocaleProvider({ locale, children }: { locale: Locale; children: ReactNode }) {
  return <LocaleContext.Provider value={locale}>{children}</LocaleContext.Provider>
}

export const useLocale = (): Locale => useContext(LocaleContext)

/** A page's copy in every locale; `fr` and `de` must match English's shape, function signatures included. */
export type Catalog<T> = Readonly<Record<Locale, T>>
export const defineMessages = <T,>(catalog: { en: T; fr: NoInfer<T>; de: NoInfer<T> }): Catalog<T> => catalog

/** The current locale's copy from a catalog. */
export const useT = <T,>(catalog: Catalog<T>): T => catalog[useContext(LocaleContext)]

/** Outside React (route heads, analytics labels): the copy for a known locale. */
export const messagesFor = <T,>(catalog: Catalog<T>, locale: Locale): T => catalog[locale]

/** The locale the browser's page was rendered in, for code that runs outside React on the client. */
export function documentLocale(): Locale {
  if (typeof document === 'undefined') return DEFAULT_LOCALE
  const lang = document.documentElement.lang
  return isLocale(lang) ? lang : DEFAULT_LOCALE
}

/** Remember a choice in this browser; `null` forgets it so the browser's language applies again. */
export function writeLocaleCookie(locale: Locale | null) {
  document.cookie = locale === null
    ? `${LOCALE_COOKIE}=; Path=/; Max-Age=0; SameSite=Lax`
    : `${LOCALE_COOKIE}=${locale}; Path=/; Max-Age=${LOCALE_COOKIE_MAX_AGE}; SameSite=Lax${location.protocol === 'https:' ? '; Secure' : ''}`
}

export function readLocaleCookie(): Locale | null {
  if (typeof document === 'undefined') return null
  const value = document.cookie.split('; ').find((part) => part.startsWith(`${LOCALE_COOKIE}=`))?.slice(LOCALE_COOKIE.length + 1)
  return isLocale(value) ? value : null
}

/** A date in the reader's language ("16 October", "16 octobre", "16. Oktober"). */
export const formatDate = (locale: Locale, at: number | Date, options: Intl.DateTimeFormatOptions) => new Date(at).toLocaleDateString(INTL_TAG[locale], options)

