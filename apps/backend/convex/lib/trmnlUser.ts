import { LANGUAGES_LIVE, localeFromTag, type Locale } from '@trmnl-games/platform'
import type { Doc } from '../_generated/dataModel'

/** BCP 47-shaped: a 2 or 3 letter language, then up to two script/region/variant subtags. */
const LOCALE = /^[a-z]{2,3}(?:-[a-z0-9]{2,8}){0,2}$/i

/**
 * D168: TRMNL's `trmnl[user][locale]` (seen as `en`, `fr-FR`), normalized to hyphens and canonical case (`pt-BR`);
 * null for anything else, which never clears the stored value.
 */
export function parseTrmnlLocale(value: string | null): string | null {
  if (value === null) return null
  const locale = value.trim().replaceAll('_', '-')
  if (locale.length > 35 || !LOCALE.test(locale)) return null
  const [language, ...rest] = locale.split('-')
  return [language!.toLowerCase(), ...rest.map((tag) => (tag.length === 2 ? tag.toUpperCase() : tag.length === 4 ? tag[0]!.toUpperCase() + tag.slice(1).toLowerCase() : tag.toLowerCase()))].join('-')
}

/** Whether a screen request carries an offset (P31) or locale (D168) that differs from the owner's stored one. */
export function trmnlUserChanged(user: Doc<'users'>, utcOffset: number | null | undefined, locale: string | null | undefined): boolean {
  return (utcOffset !== undefined && utcOffset !== null && utcOffset !== user.trmnlUtcOffset) || (locale !== undefined && locale !== null && locale !== user.trmnlLocale)
}

/** D169: the language an owner's screens and alerts use: their companion choice, else their TRMNL's, else English. */
export function ownerLocale(user: Pick<Doc<'users'>, 'language' | 'trmnlLocale'>): Locale {
  return user.language ?? localeFromTag(user.trmnlLocale) ?? 'en'
}

/** The owner's language on the TRMNL screen: English until languages roll out (`LANGUAGES_LIVE`). */
export const deviceLocale = (user: Pick<Doc<'users'>, 'language' | 'trmnlLocale'>): Locale => (LANGUAGES_LIVE ? ownerLocale(user) : 'en')
