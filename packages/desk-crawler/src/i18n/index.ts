import type { Locale } from '@trmnl-games/platform'
import { translatorFor, englishTranslator, type ContentDictionary, type ContentTranslator } from './core'
import { fr } from './fr'
import { de } from './de'
import { es } from './es'
import { it } from './it'
import { pt } from './pt'
import { pl } from './pl'
import { nl } from './nl'

export { agreesWithHero } from './core'
export type { ContentDictionary, ContentTranslator, DeDictionary, EsDictionary, FrDictionary, ItDictionary, NlDictionary, NounEntry, PlDictionary, PtDictionary, StoryContext } from './core'

/**
 * D169: every content dictionary loaded up front, for code that translates synchronously and whose bundle size does
 * not matter: the backend (device screens, alerts, emails), tools and tests. The browser uses `./lazy` instead, which
 * fetches one locale's dictionary when a page needs it.
 */
const DICTIONARIES: Readonly<Record<Exclude<Locale, 'en'>, ContentDictionary<unknown>>> = { fr, de, es, it, pt, pl, nl }

const cache = new Map<Locale, ContentTranslator>()

/** The translator for a locale; English passes everything through. Built once per locale and reused. */
export function contentTranslator(locale: Locale): ContentTranslator {
  if (locale === 'en') return englishTranslator
  let translator = cache.get(locale)
  if (translator === undefined) {
    translator = translatorFor(locale, DICTIONARIES[locale])
    cache.set(locale, translator)
  }
  return translator
}
