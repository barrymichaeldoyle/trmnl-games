/**
 * D169, D193: just enough grammar to put a translated name into a translated sentence. A noun phrase is a head noun
 * with its gender and any adjectives; templates ask for it with an article form (`{un:monster}`, `{einen:item}`,
 * `{del:destination}`), and the phrase comes back with the right article, elision, contraction and adjective endings.
 * The name itself keeps the bold marks the English summary gave it; the article stays outside them.
 *
 * - French, Spanish, Italian and Portuguese put adjectives after the noun and agree them by gender and number.
 * - German, Dutch and Polish put them before it: German declines by case and article, Dutch adds an -e except after
 *   "een" (or nothing) with a neuter noun, and Polish agrees in the nominative only (its templates keep names there).
 */

/** `fpl` is a feminine plural, which Spanish, Italian and Portuguese articles tell apart; French and German read it as `pl`. */
export type Gender = 'm' | 'f' | 'n' | 'pl' | 'fpl'

/** A French, Spanish, Italian or Portuguese adjective as [masculine, feminine]; the plural is regular. */
export type FrAdjective = readonly [string, string]
export type RomanceAdjective = FrAdjective
/** A German adjective's stem ("selten", "vampirisch"); endings come from the case and the article. */
export type DeAdjective = string
/** A Dutch adjective as [base, inflected]: "zeldzaam", "zeldzame". */
export type NlAdjective = readonly [string, string]
/** A Polish adjective in the nominative as [masculine, feminine, neuter, plural]. */
export type PlAdjective = readonly [string, string, string, string]

export interface NounPhrase {
  readonly head: string
  readonly gender: Gender
  /** Adjectives in reading order for the language that built the phrase. */
  readonly fr?: readonly FrAdjective[]
  readonly de?: readonly DeAdjective[]
  readonly es?: readonly RomanceAdjective[]
  readonly it?: readonly RomanceAdjective[]
  readonly pt?: readonly RomanceAdjective[]
  readonly nl?: readonly NlAdjective[]
  readonly pl?: readonly PlAdjective[]
  /** French: the noun starts with an aspirate h, which blocks elision ("le hamac"). */
  readonly aspirate?: boolean
  /** Kept verbatim after the adjectives: the workbench's "Mk II +3". */
  readonly suffix?: string
}

const capitalize = (text: string) => text.charAt(0).toUpperCase() + text.slice(1)
const isPlural = (gender: Gender) => gender === 'pl' || gender === 'fpl'
const isFeminine = (gender: Gender) => gender === 'f' || gender === 'fpl'
const withSuffix = (words: string[], phrase: NounPhrase) => [...words, ...(phrase.suffix ? [phrase.suffix] : [])].join(' ')

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
  const plural = isPlural(phrase.gender)
  const feminine = isFeminine(phrase.gender)
  const adjectives = (phrase.fr ?? []).map(([m, f]) => {
    const form = feminine ? f : m
    return plural && !/[sx]$/.test(form) ? `${form}s` : form
  })
  return withSuffix([phrase.head, ...adjectives], phrase)
}

function frArticle(form: string, phrase: NounPhrase): string {
  const set = FR_ARTICLES[form]
  if (set === undefined) return ''
  const [m, f, pl, elided] = set
  if (isPlural(phrase.gender)) return pl
  const feminine = phrase.gender === 'f'
  // Before a vowel "le" and "de" elide, "ce" becomes "cet" (masculine) and "son" stays "son" even for a feminine noun;
  // "un"/"une" never change.
  if (!phrase.aspirate && FR_VOWEL.test(phrase.head) && form !== 'un') return form === 'ce' && feminine ? f : elided
  return feminine ? f : m
}

// ----------------------------------------------------------------------------------------------------------- German

type Case = 'nom' | 'acc' | 'dat'
type Declension = 'strong' | 'weak' | 'mixed'
type DeGender = 'm' | 'f' | 'n' | 'pl'
const deGender = (gender: Gender): DeGender => (gender === 'fpl' ? 'pl' : gender)

/** German article forms: the case, the declension the adjectives take after it, and the article by gender. */
const DE_ARTICLES: Readonly<Record<string, { case: Case; declension: Declension; article: Readonly<Record<DeGender, string>> }>> = {
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

const DE_ENDINGS: Readonly<Record<Declension, Readonly<Record<Case, Readonly<Record<DeGender, string>>>>>> = {
  strong: { nom: { m: 'er', f: 'e', n: 'es', pl: 'e' }, acc: { m: 'en', f: 'e', n: 'es', pl: 'e' }, dat: { m: 'em', f: 'er', n: 'em', pl: 'en' } },
  weak: { nom: { m: 'e', f: 'e', n: 'e', pl: 'en' }, acc: { m: 'en', f: 'e', n: 'e', pl: 'en' }, dat: { m: 'en', f: 'en', n: 'en', pl: 'en' } },
  mixed: { nom: { m: 'er', f: 'e', n: 'es', pl: 'en' }, acc: { m: 'en', f: 'e', n: 'es', pl: 'en' }, dat: { m: 'en', f: 'en', n: 'en', pl: 'en' } },
}

/** A German plural after no article declines strong ("seltene Tassen"), even after "kein"-less forms like "ein". */
function deBody(phrase: NounPhrase, form: string): string {
  const spec = DE_ARTICLES[form] ?? DE_ARTICLES.nom!
  const gender = deGender(phrase.gender)
  const declension: Declension = gender === 'pl' && spec.article.pl === '' ? 'strong' : spec.declension
  const ending = DE_ENDINGS[declension][spec.case][gender]
  const adjectives = (phrase.de ?? []).map((stem) => `${stem}${ending}`)
  return withSuffix([...adjectives, phrase.head], phrase)
}

// ---------------------------------------------------------------------------------------------- Spanish, Portuguese

/** Article forms as [masculine, feminine, masculine plural, feminine plural]. */
type FourForms = readonly [string, string, string, string]
const fourOf = (set: FourForms, gender: Gender) => set[gender === 'fpl' ? 3 : gender === 'pl' ? 2 : gender === 'f' ? 1 : 0]

const ES_ARTICLES: Readonly<Record<string, FourForms>> = {
  el: ['el ', 'la ', 'los ', 'las '],
  un: ['un ', 'una ', 'unos ', 'unas '],
  del: ['del ', 'de la ', 'de los ', 'de las '],
  al: ['al ', 'a la ', 'a los ', 'a las '],
  en: ['en el ', 'en la ', 'en los ', 'en las '],
  este: ['este ', 'esta ', 'estos ', 'estas '],
  su: ['su ', 'su ', 'sus ', 'sus '],
  tu: ['tu ', 'tu ', 'tus ', 'tus '],
}

const PT_ARTICLES: Readonly<Record<string, FourForms>> = {
  o: ['o ', 'a ', 'os ', 'as '],
  um: ['um ', 'uma ', 'uns ', 'umas '],
  do: ['do ', 'da ', 'dos ', 'das '],
  no: ['no ', 'na ', 'nos ', 'nas '],
  ao: ['ao ', 'à ', 'aos ', 'às '],
  pelo: ['pelo ', 'pela ', 'pelos ', 'pelas '],
  num: ['num ', 'numa ', 'nuns ', 'numas '],
  seu: ['seu ', 'sua ', 'seus ', 'suas '],
  este: ['este ', 'esta ', 'estes ', 'estas '],
}

const esPlural = (word: string) => (/[aeiouáéó]$/i.test(word) ? `${word}s` : /z$/.test(word) ? `${word.slice(0, -1)}ces` : `${word}es`)
const ptPlural = (word: string) => (/[aeiouãõ]$/i.test(word) ? `${word}s` : /l$/.test(word) ? `${word.slice(0, -1)}is` : /m$/.test(word) ? `${word.slice(0, -1)}ns` : `${word}es`)

function romanceBody(phrase: NounPhrase, adjectives: readonly RomanceAdjective[], plural: (word: string) => string): string {
  const words = adjectives.map(([m, f]) => {
    const form = isFeminine(phrase.gender) ? f : m
    return isPlural(phrase.gender) ? plural(form) : form
  })
  return withSuffix([phrase.head, ...words], phrase)
}

// ----------------------------------------------------------------------------------------------------------- Italian

/** How an Italian word starts, for the article: a vowel, an "impure" s/z/gn/ps/x/y cluster, or anything else. */
function itOnset(word: string): 'vowel' | 'impure' | 'plain' {
  if (/^[aeiouàèéìòù]/i.test(word)) return 'vowel'
  if (/^(s[^aeiouàèéìòù]|z|gn|ps|pn|x|y)/i.test(word)) return 'impure'
  return 'plain'
}

/** The definite article: il, lo, l', la, i, gli, le. */
function itDefinite(gender: Gender, head: string): string {
  const onset = itOnset(head)
  if (gender === 'fpl') return 'le '
  if (gender === 'pl') return onset === 'plain' ? 'i ' : 'gli '
  if (onset === 'vowel') return 'l’'
  if (gender === 'f') return 'la '
  return onset === 'impure' ? 'lo ' : 'il '
}

/** A preposition joined to the article: del, dello, dell', della, dei, degli, delle (and al, nel, dal, sul). */
function itContracted(prefix: string, gender: Gender, head: string): string {
  const article = itDefinite(gender, head)
  const joined: Readonly<Record<string, string>> = { 'il ': 'l ', 'lo ': 'llo ', 'l’': 'll’', 'la ': 'lla ', 'i ': 'i ', 'gli ': 'gli ', 'le ': 'lle ' }
  return `${prefix}${joined[article]}`
}

const IT_PREPOSITIONS: Readonly<Record<string, string>> = { del: 'de', al: 'a', nel: 'ne', dal: 'da', sul: 'su' }

function itArticle(form: string, phrase: NounPhrase): string {
  const { gender, head } = phrase
  const onset = itOnset(head)
  if (form === 'il') return itDefinite(gender, head)
  if (form in IT_PREPOSITIONS) return itContracted(IT_PREPOSITIONS[form]!, gender, head)
  if (form === 'un') {
    if (gender === 'fpl') return 'delle '
    if (gender === 'pl') return onset === 'plain' ? 'dei ' : 'degli '
    if (gender === 'f') return onset === 'vowel' ? 'un’' : 'una '
    return onset === 'impure' ? 'uno ' : 'un '
  }
  if (form === 'questo') return gender === 'fpl' ? 'queste ' : gender === 'pl' ? 'questi ' : onset === 'vowel' ? 'quest’' : gender === 'f' ? 'questa ' : 'questo '
  if (form === 'tuo') return gender === 'fpl' ? 'le tue ' : gender === 'pl' ? 'i tuoi ' : gender === 'f' ? 'la tua ' : 'il tuo '
  if (form === 'suo') return gender === 'fpl' ? 'le sue ' : gender === 'pl' ? 'i suoi ' : gender === 'f' ? 'la sua ' : 'il suo '
  return ''
}

const IT_FORMS = ['il', 'un', ...Object.keys(IT_PREPOSITIONS), 'questo', 'tuo', 'suo']

function itPlural(word: string, feminine: boolean): string {
  if (feminine) return /ca$/.test(word) ? `${word.slice(0, -1)}he` : /ga$/.test(word) ? `${word.slice(0, -1)}he` : /a$/.test(word) ? `${word.slice(0, -1)}e` : /e$/.test(word) ? `${word.slice(0, -1)}i` : word
  if (/io$/.test(word)) return word.slice(0, -1)
  return /o$|e$/.test(word) ? `${word.slice(0, -1)}i` : word
}

function itBody(phrase: NounPhrase): string {
  const feminine = isFeminine(phrase.gender)
  const words = (phrase.it ?? []).map(([m, f]) => {
    const form = feminine ? f : m
    return isPlural(phrase.gender) ? itPlural(form, feminine) : form
  })
  return withSuffix([phrase.head, ...words], phrase)
}

// ------------------------------------------------------------------------------------------------------------- Dutch

/** Dutch article forms by common gender (de-woord), neuter (het-woord) and plural; '' means none. */
const NL_ARTICLES: Readonly<Record<string, readonly [string, string, string]>> = {
  de: ['de ', 'het ', 'de '],
  een: ['een ', 'een ', ''],
  geen: ['geen ', 'geen ', 'geen '],
  je: ['je ', 'je ', 'je '],
  deze: ['deze ', 'dit ', 'deze '],
  zijn: ['zijn ', 'zijn ', 'zijn '],
  nom: ['', '', ''],
}

function nlArticle(form: string, gender: Gender): string {
  const set = NL_ARTICLES[form] ?? NL_ARTICLES.nom!
  return set[isPlural(gender) ? 2 : gender === 'n' ? 1 : 0]
}

/** An adjective stays bare only before a singular neuter noun after "een", "geen" or no article: "een zeldzaam zwaard". */
function nlBody(phrase: NounPhrase, form: string): string {
  const bare = phrase.gender === 'n' && (form === 'een' || form === 'geen' || form === 'nom')
  const words = (phrase.nl ?? []).map(([base, inflected]) => (bare ? base : inflected))
  return withSuffix([...words, phrase.head], phrase)
}

// ------------------------------------------------------------------------------------------------------------ Polish

function plBody(phrase: NounPhrase): string {
  const index = isPlural(phrase.gender) ? 3 : phrase.gender === 'n' ? 2 : phrase.gender === 'f' ? 1 : 0
  const words = (phrase.pl ?? []).map((forms) => forms[index]!)
  return withSuffix([...words, phrase.head], phrase)
}

// ---------------------------------------------------------------------------------------------------------- shared

export type GrammarLocale = 'fr' | 'de' | 'es' | 'it' | 'pt' | 'pl' | 'nl'

/** Whether the language puts adjectives before the noun (and so reads affix, rarity, noun). */
export const ADJECTIVES_FIRST: Readonly<Record<GrammarLocale, boolean>> = { fr: false, es: false, it: false, pt: false, de: true, nl: true, pl: true }

/** The gender an unknown name takes: German neuter, everything else masculine. */
export const DEFAULT_GENDER: Readonly<Record<GrammarLocale, Gender>> = { fr: 'm', de: 'n', es: 'm', it: 'm', pt: 'm', pl: 'm', nl: 'm' }

/**
 * A noun phrase for a template slot. `form` is the article form the template wrote (lowercase, or capitalized to start
 * a sentence); `bold` wraps the name, not the article, in the summary's marks; `prefix` joins the head as a compound
 * ("Elite-" in German). With no form the phrase stands alone: bare in most languages, German strong nominative, and a
 * German name that opens the phrase keeps its capital either way.
 */
export function renderPhrase(locale: GrammarLocale, phrase: NounPhrase, form: string | undefined, bold: boolean, prefix = ''): string {
  const lower = form?.toLowerCase()
  const withPrefix = prefix ? { ...phrase, head: `${prefix}${phrase.head}` } : phrase
  const finish = (article: string, body: string) => {
    const text = `${article}${bold ? `[[${body}]]` : body}`
    return form !== undefined && form !== lower ? capitalize(text) : text
  }
  switch (locale) {
    case 'fr':
      return finish(lower === undefined ? '' : frArticle(lower, withPrefix), frBody(withPrefix))
    case 'es':
      return finish(lower === undefined || ES_ARTICLES[lower] === undefined ? '' : fourOf(ES_ARTICLES[lower]!, withPrefix.gender), romanceBody(withPrefix, withPrefix.es ?? [], esPlural))
    case 'pt':
      return finish(lower === undefined || PT_ARTICLES[lower] === undefined ? '' : fourOf(PT_ARTICLES[lower]!, withPrefix.gender), romanceBody(withPrefix, withPrefix.pt ?? [], ptPlural))
    case 'it':
      return finish(lower === undefined ? '' : itArticle(lower, withPrefix), itBody(withPrefix))
    case 'nl': {
      // Adjectives come first and are lowercase inside a sentence; a name standing alone (a label) starts with a capital.
      const body = nlBody(withPrefix, lower ?? 'nom')
      return finish(lower === undefined ? '' : nlArticle(lower, withPrefix.gender), lower === undefined ? capitalize(body) : body)
    }
    case 'pl':
      return finish('', capitalize(plBody(withPrefix)))
    case 'de': {
      const body = deBody(withPrefix, lower ?? 'nom')
      const article = lower === undefined ? '' : DE_ARTICLES[lower]?.article[deGender(withPrefix.gender)] ?? ''
      // German adjectives are lowercase inside a sentence, but a phrase standing alone (a label) starts with a capital.
      const shown = lower === undefined || article === '' ? capitalize(body) : body
      return finish(article, shown)
    }
  }
}

/** The article forms each language's templates may use, for validation. */
export const ARTICLE_FORMS: Readonly<Record<GrammarLocale, readonly string[]>> = {
  fr: Object.keys(FR_ARTICLES),
  de: Object.keys(DE_ARTICLES),
  es: Object.keys(ES_ARTICLES),
  pt: Object.keys(PT_ARTICLES),
  it: IT_FORMS,
  nl: Object.keys(NL_ARTICLES),
  pl: ['nom'],
}

/**
 * Agreement endings a template can ask for instead of an article: `{e:hero}` in French, `{o:monster}` in Spanish and
 * Italian, `{oa:monster}` in Portuguese (where `o` is the article), `{a:hero}` and `{y:monster}` in Polish. Each is the
 * ending for the hero's gender or the name's, appended to the word before it ("Coincé{e:hero}", "cansad{o:hero}",
 * "pokonał{a:hero}").
 */
export const AGREEMENT_FORMS: Readonly<Record<GrammarLocale, readonly string[]>> = { fr: ['e'], de: [], es: ['o'], it: ['o'], pt: ['oa'], nl: [], pl: ['a', 'y'] }

export function agreement(locale: GrammarLocale, form: string, gender: Gender): string {
  const feminine = isFeminine(gender)
  const plural = isPlural(gender)
  if (locale === 'fr' && form === 'e') return plural ? (feminine ? 'es' : 's') : feminine ? 'e' : ''
  if ((form === 'o' && locale === 'es') || (form === 'oa' && locale === 'pt')) return plural ? (feminine ? 'as' : 'os') : feminine ? 'a' : 'o'
  if (form === 'o' && locale === 'it') return plural ? (feminine ? 'e' : 'i') : feminine ? 'a' : 'o'
  if (locale === 'pl' && form === 'a') return plural ? 'y' : gender === 'n' ? 'o' : feminine ? 'a' : ''
  if (locale === 'pl' && form === 'y') return plural ? 'e' : gender === 'n' ? 'e' : feminine ? 'a' : 'y'
  return ''
}
