import type { Locale } from '@trmnl-games/platform'
import { translatorFor, englishTranslator, type ContentDictionary, type ContentTranslator } from './core'

export { agreesWithHero } from './core'
export type { ContentTranslator, StoryContext } from './core'

/**
 * The browser's translator: one locale's dictionary, fetched on demand. The seven dictionaries are 800 KB of source
 * (280 KB gzipped) and `./index` shipped all of them to every companion page in every language, English included.
 * Here a page's route loader (and the client entry, before hydration) awaits `loadContent(locale)`, after which
 * `contentTranslator(locale)` translates as `./index` does. A translator taken before its dictionary arrived is not
 * stale: it reads the loaded dictionary at every call, so the catalogs can build their translators at module scope.
 */
type Dictionary = ContentDictionary<unknown>
const LOADERS: Readonly<Record<Exclude<Locale, 'en'>, () => Promise<Dictionary>>> = {
  fr: () => import('./fr').then((m) => m.fr),
  de: () => import('./de').then((m) => m.de),
  es: () => import('./es').then((m) => m.es),
  it: () => import('./it').then((m) => m.it),
  pt: () => import('./pt').then((m) => m.pt),
  pl: () => import('./pl').then((m) => m.pl),
  nl: () => import('./nl').then((m) => m.nl),
}

const loaded = new Map<Locale, ContentTranslator>()
const loading = new Map<Locale, Promise<void>>()
const handles = new Map<Locale, ContentTranslator>()

/** Fetch and build the locale's translator; resolved at once for English and for a locale already loaded. */
export function loadContent(locale: Locale): Promise<void> {
  if (locale === 'en' || loaded.has(locale)) return Promise.resolve()
  let pending = loading.get(locale)
  if (pending === undefined) {
    pending = LOADERS[locale]().then((dictionary) => { loaded.set(locale, translatorFor(locale, dictionary)) }).finally(() => loading.delete(locale))
    loading.set(locale, pending)
  }
  return pending
}

/** Whether `contentTranslator(locale)` translates yet; false shows English until `loadContent` resolves. */
export const contentLoaded = (locale: Locale): boolean => locale === 'en' || loaded.has(locale)

const current = (locale: Locale): ContentTranslator => loaded.get(locale) ?? englishTranslator

/** The translator for a locale, reading the dictionary loaded so far at every call; English passes everything through. */
export function contentTranslator(locale: Locale): ContentTranslator {
  if (locale === 'en') return englishTranslator
  let handle = handles.get(locale)
  if (handle === undefined) {
    handle = {
      locale,
      text: (english, context) => current(locale).text(english, context),
      name: (english) => current(locale).name(english),
      nameWith: (english, form, prefix) => current(locale).nameWith(english, form, prefix),
      story: (summary, context) => current(locale).story(summary, context),
      number: (value) => current(locale).number(value),
    }
    handles.set(locale, handle)
  }
  return handle
}
