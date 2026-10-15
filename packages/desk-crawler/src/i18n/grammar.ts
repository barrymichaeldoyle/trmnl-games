/**
 * D169: just enough French and German grammar to put a translated name into a translated sentence. A noun phrase is a
 * head noun with its gender and any adjectives; templates ask for it with an article form (`{un:monster}`,
 * `{einen:item}`), and the phrase comes back with the right article, elision and adjective endings. The name itself
 * keeps the bold marks the English summary gave it; the article stays outside them.
 */

export type Gender = 'm' | 'f' | 'n' | 'pl'

/** A French adjective as [masculine, feminine]; plural adds an s (none of ours are irregular). */
export type FrAdjective = readonly [string, string]
/** A German adjective's stem ("selten", "vampirisch"); endings come from the case and the article. */
export type DeAdjective = string

export interface NounPhrase {
  readonly head: string
  readonly gender: Gender
  /** French adjectives follow the noun, German ones come before it; both in reading order. */
  readonly fr?: readonly FrAdjective[]
  readonly de?: readonly DeAdjective[]
  /** French: the noun starts with an aspirate h, which blocks elision ("le hamac"). */
  readonly aspirate?: boolean
  /** Kept verbatim after the adjectives: the workbench's "Mk II +3". */
  readonly suffix?: string
}

const capitalize = (text: string) => text.charAt(0).toUpperCase() + text.slice(1)

// ----------------------------------------------------------------------------------------------------------- French

const FR_VOWEL = /^[aeiouyhàâäéèêëîïôöùûüœæ]/i

/** French article forms: what the template writes, and the article for masculine, feminine, plural and elided. */
const FR_ARTICLES: Readonly<Record<string, readonly [string, string, string, string]>> = {
  le: ['le ', 'la ', 'les ', 'l’'],
  un: ['un ', 'une ', 'des ', ''],
  du: ['du ', 'de la ', 'des ', 'de l’'],
  au: ['au ', 'à la ', 'aux ', 'à l’'],
  de: ['de ', 'de ', 'de ', 'd’'],
  ce: ['ce ', 'cette ', 'ces ', 'cet '],
  son: ['son ', 'sa ', 'ses ', 'son '],
  votre: ['votre ', 'votre ', 'vos ', 'votre '],
}

function frBody(phrase: NounPhrase): string {
  const plural = phrase.gender === 'pl'
  const feminine = phrase.gender === 'f'
  const adjectives = (phrase.fr ?? []).map(([m, f]) => {
    const form = feminine ? f : m
    return plural && !/[sx]$/.test(form) ? `${form}s` : form
  })
  return [phrase.head, ...adjectives, ...(phrase.suffix ? [phrase.suffix] : [])].join(' ')
}

function frArticle(form: string, phrase: NounPhrase): string {
  const set = FR_ARTICLES[form]
  if (set === undefined) return ''
  const [m, f, pl, elided] = set
  if (phrase.gender === 'pl') return pl
  const feminine = phrase.gender === 'f'
  // Before a vowel "le" and "de" elide, "ce" becomes "cet" (masculine) and "son" stays "son" even for a feminine noun;
  // "un"/"une" never change.
  if (!phrase.aspirate && FR_VOWEL.test(phrase.head) && form !== 'un') return form === 'ce' && feminine ? f : elided
  return feminine ? f : m
}

// ----------------------------------------------------------------------------------------------------------- German

type Case = 'nom' | 'acc' | 'dat'
type Declension = 'strong' | 'weak' | 'mixed'

/** German article forms: the case, the declension the adjectives take after it, and the article by gender. */
const DE_ARTICLES: Readonly<Record<string, { case: Case; declension: Declension; article: Readonly<Record<Gender, string>> }>> = {
  der: { case: 'nom', declension: 'weak', article: { m: 'der ', f: 'die ', n: 'das ', pl: 'die ' } },
  den: { case: 'acc', declension: 'weak', article: { m: 'den ', f: 'die ', n: 'das ', pl: 'die ' } },
  dem: { case: 'dat', declension: 'weak', article: { m: 'dem ', f: 'der ', n: 'dem ', pl: 'den ' } },
  ein: { case: 'nom', declension: 'mixed', article: { m: 'ein ', f: 'eine ', n: 'ein ', pl: '' } },
  einen: { case: 'acc', declension: 'mixed', article: { m: 'einen ', f: 'eine ', n: 'ein ', pl: '' } },
  einem: { case: 'dat', declension: 'mixed', article: { m: 'einem ', f: 'einer ', n: 'einem ', pl: '' } },
  im: { case: 'dat', declension: 'weak', article: { m: 'im ', f: 'in der ', n: 'im ', pl: 'in den ' } },
  ins: { case: 'acc', declension: 'weak', article: { m: 'in den ', f: 'in die ', n: 'ins ', pl: 'in die ' } },
  zum: { case: 'dat', declension: 'weak', article: { m: 'zum ', f: 'zur ', n: 'zum ', pl: 'zu den ' } },
  vom: { case: 'dat', declension: 'weak', article: { m: 'vom ', f: 'von der ', n: 'vom ', pl: 'von den ' } },
  dein: { case: 'nom', declension: 'mixed', article: { m: 'dein ', f: 'deine ', n: 'dein ', pl: 'deine ' } },
  deinen: { case: 'acc', declension: 'mixed', article: { m: 'deinen ', f: 'deine ', n: 'dein ', pl: 'deine ' } },
  deinem: { case: 'dat', declension: 'mixed', article: { m: 'deinem ', f: 'deiner ', n: 'deinem ', pl: 'deinen ' } },
  kein: { case: 'nom', declension: 'mixed', article: { m: 'kein ', f: 'keine ', n: 'kein ', pl: 'keine ' } },
  nom: { case: 'nom', declension: 'strong', article: { m: '', f: '', n: '', pl: '' } },
  acc: { case: 'acc', declension: 'strong', article: { m: '', f: '', n: '', pl: '' } },
  dat: { case: 'dat', declension: 'strong', article: { m: '', f: '', n: '', pl: '' } },
}

const DE_ENDINGS: Readonly<Record<Declension, Readonly<Record<Case, Readonly<Record<Gender, string>>>>>> = {
  strong: { nom: { m: 'er', f: 'e', n: 'es', pl: 'e' }, acc: { m: 'en', f: 'e', n: 'es', pl: 'e' }, dat: { m: 'em', f: 'er', n: 'em', pl: 'en' } },
  weak: { nom: { m: 'e', f: 'e', n: 'e', pl: 'en' }, acc: { m: 'en', f: 'e', n: 'e', pl: 'en' }, dat: { m: 'en', f: 'en', n: 'en', pl: 'en' } },
  mixed: { nom: { m: 'er', f: 'e', n: 'es', pl: 'en' }, acc: { m: 'en', f: 'e', n: 'es', pl: 'en' }, dat: { m: 'en', f: 'en', n: 'en', pl: 'en' } },
}

/** A German plural after no article declines strong ("seltene Tassen"), even after "kein"-less forms like "ein". */
function deBody(phrase: NounPhrase, form: string): string {
  const spec = DE_ARTICLES[form] ?? DE_ARTICLES.nom!
  const declension: Declension = phrase.gender === 'pl' && spec.article.pl === '' ? 'strong' : spec.declension
  const ending = DE_ENDINGS[declension][spec.case][phrase.gender]
  const adjectives = (phrase.de ?? []).map((stem) => `${stem}${ending}`)
  return [...adjectives, phrase.head, ...(phrase.suffix ? [phrase.suffix] : [])].join(' ')
}

// ---------------------------------------------------------------------------------------------------------- shared

export type GrammarLocale = 'fr' | 'de'

/**
 * A noun phrase for a template slot. `form` is the article form the template wrote (lowercase, or capitalized to start
 * a sentence); `bold` wraps the name, not the article, in the summary's marks; `prefix` joins the head as a compound
 * ("Elite-" in German). With no form the phrase stands alone: French bare, German strong nominative, and a German
 * name that opens the phrase keeps its capital either way.
 */
export function renderPhrase(locale: GrammarLocale, phrase: NounPhrase, form: string | undefined, bold: boolean, prefix = ''): string {
  const lower = form?.toLowerCase()
  const withPrefix = prefix ? { ...phrase, head: `${prefix}${phrase.head}` } : phrase
  if (locale === 'fr') {
    const body = frBody(withPrefix)
    const article = lower === undefined ? '' : frArticle(lower, withPrefix)
    const text = `${article}${bold ? `[[${body}]]` : body}`
    return form !== undefined && form !== lower ? capitalize(text) : text
  }
  const body = deBody(withPrefix, lower ?? 'nom')
  // German adjectives are lowercase inside a sentence, but a phrase standing alone (a label) starts with a capital.
  const shown = lower === undefined || DE_ARTICLES[lower]?.article[withPrefix.gender] === '' ? capitalize(body) : body
  const article = lower === undefined ? '' : DE_ARTICLES[lower]?.article[withPrefix.gender] ?? ''
  const text = `${article}${bold ? `[[${shown}]]` : shown}`
  return form !== undefined && form !== lower ? capitalize(text) : text
}

/** The article forms each language's templates may use, for validation. */
export const ARTICLE_FORMS: Readonly<Record<GrammarLocale, readonly string[]>> = {
  fr: Object.keys(FR_ARTICLES),
  de: Object.keys(DE_ARTICLES),
}
