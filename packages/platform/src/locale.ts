/**
 * D169, D192: the languages TRMNL Games speaks. English is the source; every other locale is a full translation, and a
 * missing preference falls back to English.
 */
export const LOCALES = ['en', 'fr', 'de', 'es', 'it', 'pt', 'pl', 'nl'] as const
export type Locale = (typeof LOCALES)[number]
export const DEFAULT_LOCALE: Locale = 'en'

/**
 * D169 rollout switch, on since 2026-10-15. Off, only an explicit `tg_locale` cookie changes the companion's language,
 * the picker hides, browsers' languages are ignored and TRMNL screens and alerts stay English.
 */
export const LANGUAGES_LIVE: boolean = true

/** Each language named in itself, for the picker. */
export const LOCALE_NAMES: Readonly<Record<Locale, string>> = { en: 'English', fr: 'Français', de: 'Deutsch', es: 'Español', it: 'Italiano', pt: 'Português', pl: 'Polski', nl: 'Nederlands' }

/** The tag `Intl` formats numbers and dates with: British English matches the site's existing day-month dates. */
export const INTL_TAG: Readonly<Record<Locale, string>> = { en: 'en-GB', fr: 'fr-FR', de: 'de-DE', es: 'es-ES', it: 'it-IT', pt: 'pt-BR', pl: 'pl-PL', nl: 'nl-NL' }

export const isLocale = (value: unknown): value is Locale => typeof value === 'string' && (LOCALES as readonly string[]).includes(value)

/** A BCP 47 tag's language when we speak it (`fr-CA` and `fr` are French), else null. */
export function localeFromTag(tag: string | null | undefined): Locale | null {
  const language = tag?.trim().split(/[-_]/)[0]?.toLowerCase()
  return isLocale(language) ? language : null
}

/** The best language an `Accept-Language` header asks for, by its q weights; English when it names none we speak. */
export function localeFromAcceptLanguage(header: string | null | undefined): Locale {
  const ranked = (header ?? '')
    .split(',')
    .map((part, index) => {
      const [tag, ...params] = part.trim().split(';')
      const q = params.map((p) => p.trim()).find((p) => p.startsWith('q='))
      const weight = q === undefined ? 1 : Number(q.slice(2))
      return { locale: localeFromTag(tag), weight: Number.isFinite(weight) ? weight : 0, index }
    })
    .filter((entry): entry is { locale: Locale; weight: number; index: number } => entry.locale !== null && entry.weight > 0)
    .sort((a, b) => b.weight - a.weight || a.index - b.index)
  return ranked[0]?.locale ?? DEFAULT_LOCALE
}
