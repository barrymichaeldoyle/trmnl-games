import { INTL_TAG, type Locale } from '@trmnl-games/platform'
import { ADJECTIVES_FIRST, agreement, AGREEMENT_FORMS, DEFAULT_GENDER, renderPhrase, type DeAdjective, type FrAdjective, type Gender, type GrammarLocale, type NlAdjective, type NounPhrase, type PlAdjective, type RomanceAdjective } from './grammar'

/**
 * D169: Desk Crawler's content in other languages. Catalogs, stored logs and item rows hold English, and they stay
 * English: the simulator and every stored summary are unchanged. Translation happens when something is shown, keyed by
 * the English text itself, so one dictionary covers every catalog version and every log already written.
 *
 * - `nouns` are names that take articles (monsters, areas, gear, bags): the localized head, its gender and, for the
 *   to-do list's counted monsters, the English plural mapped to a plural entry.
 * - `adjectives` are the rarity and affix words that build item names.
 * - `text` is everything else. An entry with `{vars}` is a template: a stored English line that matches its English
 *   side is refilled into the localized side, where a name can ask for an article form (`{un:monster}`,
 *   `{einen:item}`, `{im:destination}`) and a compound prefix (`{ein:monster|Elite-}`). A localized template may leave
 *   out the numbers the English carried (`+{xp} XP`), because the displays show those as chips.
 *
 * Anything that does not match stays English rather than coming out half translated.
 *
 * This module holds the translator itself and no dictionary. `./index` loads every dictionary up front for the backend,
 * tools and tests; `./lazy` loads one locale's dictionary on demand for the browser, which otherwise shipped all seven
 * (800 KB) to every reader.
 */
export type NounEntry = readonly [head: string, gender: Gender]
export interface ContentDictionary<A> {
  readonly nouns: Readonly<Record<string, NounEntry>>
  readonly adjectives: Readonly<Record<string, A>>
  readonly text: Readonly<Record<string, string>>
}
export type FrDictionary = ContentDictionary<FrAdjective>
export type DeDictionary = ContentDictionary<DeAdjective>
/** D193: Spanish, Italian and Portuguese adjectives as [masculine, feminine]; Dutch as [base, inflected]; Polish by gender. */
export type EsDictionary = ContentDictionary<RomanceAdjective>
export type ItDictionary = ContentDictionary<RomanceAdjective>
export type PtDictionary = ContentDictionary<RomanceAdjective>
export type NlDictionary = ContentDictionary<NlAdjective>
export type PlDictionary = ContentDictionary<PlAdjective>

export interface ContentTranslator {
  readonly locale: Locale
  /** A catalog line, label or template-built line ("Defeat 3 Paper Imps"); English when there is no translation. */
  text(english: string, context?: StoryContext): string
  /** A name on its own (a list row, a heading): the bare French name or the German nominative, without an article. */
  name(english: string): string
  /** A name with an article form, for prose: `nameWith('Server Room', 'le')` is "la Salle des serveurs"; `prefix` joins the head ("Elite-"). */
  nameWith(english: string, form: string, prefix?: string): string
  /** A stored log summary, as the displays show it (without the numbers the chips carry); null when unmatched. */
  story(summary: string, context?: StoryContext): string | null
  /** A whole number in the locale's grouping. */
  number(value: number): string
}

/** What a sentence needs to know about its own hero: French participles agree with them ("Coincée"). */
export interface StoryContext {
  readonly heroGender?: 'male' | 'female'
  /** Set while filling a line when an inner phrase had no translation. */
  missed?: boolean
}

const NUMBER_VARS = new Set(['xp', 'gold', 'damage', 'heal', 'ticks', 'capacity', 'target', 'hours', 'count', 'cap', 'level', 'pct', 'to', 'n', 'quantity', 'needed', 'made', 'price', 'coins'])
const NAME_VARS = new Set(['monster', 'monsters', 'biome', 'destination', 'item', 'potion', 'potions', 'area', 'tier', 'bag', 'pouch', 'material'])
const RAW_VARS = new Set(['rival', 'name', 'hero'])
/** Lists inside one line: the to-do labels a stand-up names, and the materials a salvage paid. */
const LIST_VARS = new Set(['tasks', 'materials'])

type Token = { kind: 'literal'; text: string } | { kind: 'var'; name: string; form?: string; prefix?: string }

function tokenize(template: string): Token[] {
  const tokens: Token[] = []
  let last = 0
  for (const match of template.matchAll(/\{(?:(\w+):)?(\w+)(?:\|([^}]*))?\}/g)) {
    if (match.index > last) tokens.push({ kind: 'literal', text: template.slice(last, match.index) })
    tokens.push({ kind: 'var', name: match[2]!, ...(match[1] === undefined ? {} : { form: match[1] }), ...(match[3] === undefined ? {} : { prefix: match[3] }) })
    last = match.index + match[0].length
  }
  if (last < template.length) tokens.push({ kind: 'literal', text: template.slice(last) })
  return tokens
}

const escape = (text: string) => text.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')

/** The regex an English template's filled lines match; "a {name}" also matches the "an" that fill() writes. */
function englishPattern(template: string): { source: string; vars: string[] } {
  const vars: string[] = []
  let source = ''
  const tokens = tokenize(template)
  tokens.forEach((token, index) => {
    if (token.kind === 'literal') {
      const next = tokens[index + 1]
      const articled = next?.kind === 'var' ? token.text.match(/(^|\s)([Aa]) $/) : null
      source += articled ? `${escape(token.text.slice(0, -2))}${articled[2]}n? ` : escape(token.text)
      return
    }
    vars.push(token.name)
    // A list runs to the line's last full stop and a closing variable to the end; any other text stays inside its own
    // sentence, so a template that opens with a variable cannot swallow the sentences before it.
    const last = index === tokens.length - 1
    source += NUMBER_VARS.has(token.name) ? '(-?[\\d,]+)'
      : NAME_VARS.has(token.name) || RAW_VARS.has(token.name) ? '(\\[\\[(?:(?!\\]\\]).)+\\]\\]|[^\\[\\].!?:]+?)'
      : LIST_VARS.has(token.name) ? '(.+)'
      : last ? '(.+)' : '((?:\\[\\[(?:(?!\\]\\]).)+\\]\\]|[^.!?])+?)'
  })
  return { source, vars }
}

interface CompiledTemplate {
  readonly english: string
  readonly localized: string
  readonly vars: readonly string[]
  readonly regex: RegExp
  /** The first literal character, lowercased, or '' when the template opens with a variable. */
  readonly lead: string
  /** How much of the English is literal text: of two matches of the same length, the more specific one wins. */
  readonly literal: number
}

const ITEM_SUFFIX = /(?: (Mk [IVX]+))?(?: (\+\d+))?$/
const RARITIES = ['Common', 'Uncommon', 'Rare', 'Epic', 'Legendary']

export function translatorFor(locale: GrammarLocale & Locale, dictionary: ContentDictionary<unknown>): ContentTranslator {
  const tag = INTL_TAG[locale]
  const numbers = new Intl.NumberFormat(tag, { maximumFractionDigits: 0 })
  const nounsLower = new Map(Object.entries(dictionary.nouns).map(([english, entry]) => [english.toLowerCase(), entry] as const))
  const templates: CompiledTemplate[] = []
  const plain = new Map<string, string>()
  for (const [english, localized] of Object.entries(dictionary.text)) {
    if (!english.includes('{')) { plain.set(english, localized); continue }
    const { source, vars } = englishPattern(english)
    templates.push({ english, localized, vars, regex: new RegExp(source, 'y'), lead: /^[^{]/.test(english) ? english[0]!.toLowerCase() : '', literal: english.replace(/\{[^}]*\}/g, '').length })
  }
  // Plain lines also serve as segments of a composed summary ("Decided by itself.").
  const plainSegments = [...plain.entries()].map(([english, localized]) => ({ english, localized }))

  /** The noun phrase for an English name: a plain noun, else an item built from affix, rarity and gear words. */
  function phraseOf(english: string): NounPhrase | null {
    const exact = dictionary.nouns[english] ?? nounsLower.get(english.toLowerCase())
    const lowerStart = /^[a-z]/.test(english)
    // Only German keeps a capital on a noun inside a sentence.
    if (exact) return { head: locale !== 'de' && lowerStart ? exact[0].charAt(0).toLowerCase() + exact[0].slice(1) : exact[0], gender: exact[1] }
    const suffixMatch = english.match(ITEM_SUFFIX)
    const suffix = [suffixMatch?.[1], suffixMatch?.[2]].filter(Boolean).join(' ')
    let rest = suffix ? english.slice(0, english.length - (suffixMatch?.[0].length ?? 0)) : english
    const words: unknown[] = []
    const take = (candidates: readonly string[]) => {
      const found = candidates.find((word) => rest.startsWith(`${word} `))
      if (found === undefined) return undefined
      rest = rest.slice(found.length + 1)
      return dictionary.adjectives[found]
    }
    const affix = take(Object.keys(dictionary.adjectives).filter((word) => !RARITIES.includes(word)))
    const rarity = take(RARITIES.filter((word) => word in dictionary.adjectives))
    const base = dictionary.nouns[rest]
    if (base === undefined || (affix === undefined && rarity === undefined && !suffix)) return null
    if (affix !== undefined) words.push(affix)
    if (rarity !== undefined) words.push(rarity)
    const head = base[0]
    // French, Spanish, Italian and Portuguese read noun, rarity, affix ("Masse-clavier rare vampirique"); German, Dutch
    // and Polish read affix, rarity, noun.
    const ordered = ADJECTIVES_FIRST[locale] ? words : [...(rarity === undefined ? [] : [rarity]), ...(affix === undefined ? [] : [affix])]
    return { head, gender: base[1], [locale]: ordered, ...(suffix ? { suffix } : {}) } as NounPhrase
  }

  function fillVar(token: Extract<Token, { kind: 'var' }>, value: string | undefined, context: StoryContext): string {
    // An agreement ending (`{e:hero}` in French, `{o:monster}` in Spanish, `{a:hero}` in Polish): the ending for the
    // hero's gender, or for the name's.
    if (token.form !== undefined && AGREEMENT_FORMS[locale].includes(token.form)) {
      if (token.name === 'hero') return agreement(locale, token.form, context.heroGender === 'female' ? 'f' : 'm')
      const phrase = value === undefined ? null : phraseOf(value.replace(/^\[\[|\]\]$/g, ''))
      return agreement(locale, token.form, phrase?.gender ?? DEFAULT_GENDER[locale])
    }
    if (value === undefined) return ''
    if (NUMBER_VARS.has(token.name)) {
      const parsed = Number(value.replace(/,/g, ''))
      return Number.isFinite(parsed) ? numbers.format(parsed) : value
    }
    const bold = value.startsWith('[[') && value.endsWith(']]')
    const bare = bold ? value.slice(2, -2) : value
    if (RAW_VARS.has(token.name)) return value
    if (NAME_VARS.has(token.name)) {
      const phrase = phraseOf(bare)
      if (phrase) return renderPhrase(locale, phrase, token.form, bold, token.prefix)
      // An unknown name (an item from a newer catalog) keeps its English text, with a neutral article.
      return renderPhrase(locale, { head: bare, gender: DEFAULT_GENDER[locale] }, token.form, bold, token.prefix)
    }
    if (LIST_VARS.has(token.name)) return listOf(token.name, bare, context)
    const inner = translateText(bare, context)
    // An inner line with no translation would leave English inside the sentence: the whole line stays English instead.
    if (inner === bare && !plain.has(bare)) context.missed = true
    return bold ? `[[${inner}]]` : inner
  }

  /** "Defeat 4 [[Paper Imps]]. Win 3 fights" item by item; "3 Scrap, 2 Parts and 1 Components" as counted nouns. */
  function listOf(name: string, value: string, context: StoryContext): string {
    if (name === 'tasks') return value.split('. ').map((label) => {
      const shown = translateText(label, context)
      if (shown === label && !plain.has(label)) context.missed = true
      return shown
    }).join('. ')
    const parts = value.split(/, | and /).map((part) => {
      const match = part.match(/^(\d+) (.+)$/)
      if (!match) return translateText(part, context)
      const phrase = phraseOf(match[2]!)
      const shown = phrase ? renderPhrase(locale, phrase, undefined, false) : match[2]!
      // Counts read in lowercase ("3 débris"); German nouns keep their capital.
      return `${numbers.format(Number(match[1]))} ${locale === 'de' ? shown : shown.toLowerCase()}`
    })
    return new Intl.ListFormat(tag, { style: 'long', type: 'conjunction' }).format(parts)
  }

  function fillTemplate(template: CompiledTemplate, captures: readonly (string | undefined)[], context: StoryContext): string {
    const values = new Map(template.vars.map((name, index) => [name, captures[index]] as const))
    return tokenize(template.localized).map((token) => (token.kind === 'literal' ? token.text : fillVar(token, values.get(token.name), context))).join('')
  }

  /** The longest template or plain line matching at `start` and ending at a sentence boundary. */
  function segmentAt(text: string, start: number, context: StoryContext): { end: number; output: string } | null {
    // Each candidate fills with its own miss flag: only the chosen one's counts.
    let best: { end: number; output: string; missed: boolean; literal: number } | null = null
    const lead = text[start]?.toLowerCase() ?? ''
    for (const template of templates) {
      if (template.lead !== '' && template.lead !== lead) continue
      template.regex.lastIndex = start
      const match = template.regex.exec(text)
      if (!match) continue
      const end = start + match[0].length
      if (end !== text.length && text[end] !== ' ') continue
      if (best && end < best.end) continue
      const candidate: StoryContext = { ...context, missed: false }
      const output = fillTemplate(template, match.slice(1), candidate)
      const missed = candidate.missed === true
      // Longest first; of equal length, the one that translates fully, then the more specific template.
      if (best && end === best.end && (missed && !best.missed || missed === best.missed && template.literal <= best.literal)) continue
      best = { end, output, missed, literal: template.literal }
    }
    for (const { english, localized } of plainSegments) {
      if (english[0]?.toLowerCase() !== lead || !text.startsWith(english, start)) continue
      const end = start + english.length
      if ((end === text.length || text[end] === ' ') && (!best || end > best.end || end === best.end && best.missed)) best = { end, output: localized, missed: false, literal: english.length }
    }
    if (best?.missed) context.missed = true
    return best
  }

  function translateText(english: string, given: StoryContext = {}): string {
    const exact = plain.get(english)
    if (exact !== undefined) return exact
    const context: StoryContext = { ...given, missed: false }
    const segment = segmentAt(english, 0, context)
    return segment && segment.end === english.length && !context.missed ? segment.output : english
  }

  function story(summary: string, given: StoryContext = {}): string | null {
    const exact = plain.get(summary)
    if (exact !== undefined) return exact
    const context: StoryContext = { ...given, missed: false }
    const parts: string[] = []
    let at = 0
    while (at < summary.length) {
      const segment = segmentAt(summary, at, context)
      if (!segment) return null
      // A localized line can be empty: it drops a numbers-only consequence ("Lost 12 gold.") the chips already show.
      if (segment.output !== '') parts.push(segment.output)
      at = segment.end
      while (summary[at] === ' ') at += 1
    }
    return context.missed ? null : parts.join(' ')
  }

  return {
    locale,
    text: translateText,
    name: (english) => {
      const phrase = phraseOf(english)
      return phrase ? renderPhrase(locale, phrase, undefined, false) : translateText(english)
    },
    nameWith: (english, form, prefix) => {
      const phrase = phraseOf(english)
      return phrase ? renderPhrase(locale, phrase, form, false, prefix) : english
    },
    story,
    number: (value) => numbers.format(value),
  }
}

const englishNumbers = new Intl.NumberFormat(INTL_TAG.en, { maximumFractionDigits: 0 })
/** English passes everything through: the catalogs and stored lines are already English. */
export const englishTranslator: ContentTranslator = { locale: 'en', text: (text) => text, name: (name) => name, nameWith: (name) => name, story: () => null, number: (value) => englishNumbers.format(value) }

/** Whether the locale's lines agree with the hero's gender (French, Spanish, Italian, Portuguese and Polish do). */
export const agreesWithHero = (locale: Locale): boolean => locale !== 'en' && AGREEMENT_FORMS[locale].length > 0
