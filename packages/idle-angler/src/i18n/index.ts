import type { Locale } from '@trmnl-games/platform'
import { ACHIEVEMENTS, ACHIEVEMENT_BY_ID } from '../content/achievements'
import { FLIES } from '../content/flies'
import { contentV5 } from '../content/v5'
import { BAND_PHRASE } from '../sim/conditions'
import { formatWeight } from '../sim/progress'
import { TITLES } from '../sim/titles'
import type { BaitClass, Season, TimeBand, WaterId, Weather } from '../sim/types'
import { de } from './de'
import { en } from './en'
import { es } from './es'
import { fr } from './fr'
import { it } from './it'
import { nl } from './nl'
import { pl } from './pl'
import { pt } from './pt'
import type { BaitName, FishName, IaLanguage, WaterName } from './types'

export type { IaLanguage } from './types'

/** D200: every language Idle Angler speaks, English first. */
export const IA_LANGUAGES: Readonly<Record<Locale, IaLanguage>> = { en, fr, de, es, it, pt, pl, nl }

const content = contentV5
const escape = (text: string) => text.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')
/** Longest first, so "Conger Eel" wins over "Eel". */
const alternation = (names: Iterable<string>) => [...new Set(names)].sort((a, b) => b.length - a.length).map(escape).join('|')
const invert = <K extends string>(record: Readonly<Record<K, string>>): Map<string, K> => new Map(Object.entries(record).map(([key, value]) => [value as string, key as K]))

// English names back to their ids.
const SPECIES_BY_NAME = new Map(content.species.map((s) => [s.name, s.id]))
const WATER_BY_NAME = new Map(content.waters.map((w) => [w.name, w.id]))
const WATER_BY_THE = new Map(content.waters.map((w) => [w.the, w.id]))
const BAIT_BY_THE = new Map(content.baits.map((b) => [b.the, b.class]))
const BAIT_BY_LOWER = new Map(content.baits.map((b) => [b.name.toLowerCase(), b.class]))
const BAIT_BY_NAME = new Map(content.baits.map((b) => [b.name, b.class]))
const ROD_BY_NAME = invert(en.rods)
const COOLER_BY_NAME = invert(en.coolers)
const ACCESS_BY_NAME = invert(en.access)
const TITLE_BY_NAME = new Map<string, string>(TITLES.map((t) => [t.name, t.id]))
const FLY_BY_NAME = new Map(FLIES.map((f) => [f.name, f.id]))
const GOAL_BY_TITLE = new Map(content.goals!.map((g) => [g.title, g.id]))
const ACHIEVEMENT_BY_NAME = new Map(ACHIEVEMENTS.map((a) => [a.name, a.id]))
const BAND_BY_PHRASE = invert(BAND_PHRASE)
/** The slate's time words (orders.ts `BAND_WORDS`). */
const ORDER_BAND = new Map<string, TimeBand>([['dawn', 'dawn'], ['the day', 'day'], ['dusk', 'dusk'], ['night', 'night']])
const COUNT = new Map([['No', 0], ['One', 1], ['Two', 2], ['Three', 3], ['A', 1], ['An', 1], ['a', 1]])
const PLACES = ['Gold', 'Silver', 'Bronze'] as const

const W = '(\\d+(?:\\.\\d)? (?:kg|g))'
const SPECIES = `(${alternation(SPECIES_BY_NAME.keys())})`
const WATER_NAME = `(${alternation(WATER_BY_NAME.keys())})`
const WATER_THE = `(${alternation(WATER_BY_THE.keys())})`
const BAIT_THE = `(${alternation([...BAIT_BY_THE.keys(), 'a bare hook'])})`
const BAIT_LOWER = `(${alternation(BAIT_BY_LOWER.keys())})`
const BAND = `(${alternation(BAND_BY_PHRASE.keys())})`
const TAIL = `((?: A new personal best\\.)|(?: First ${SPECIES} in the logbook\\.))?`
const GOAL = `(${alternation(GOAL_BY_TITLE.keys())}|Log \\d+ species)`
const COUNT_WORD = '(No|One|Two|Three|\\d+)'
const re = (source: string) => new RegExp(`^${source}$`)

export interface AnglerWords {
  readonly locale: Locale
  readonly lang: IaLanguage
  /** A fish by id or English name, as a label. */
  species(idOrName: string): string
  fish(idOrName: string): FishName
  water(idOrName: string): string
  waterName(idOrName: string): WaterName
  bait(classOrName: string): string
  rod(name: string): string
  cooler(name: string): string
  pass(idOrName: string): string
  title(idOrName: string): string
  fly(idOrName: string): string
  season(id: Season | string): string
  band(id: TimeBand | string): string
  weather(id: Weather | string): string
  rarity(id: string): string
  /** A goal by id or English title, or a line past the ladder ("Log 27 species"). */
  goal(idOrTitle: string): string
  achievement(id: string): { name: string; blurb: string; family: string; category: string }
  /** An achievement by its English name, as stored on a log line. */
  achievementName(english: string): string
  /** "1.9 kg" or "410 g" in the language's decimal. */
  weight(grams: number): string
  number(value: number): string
  /** A stored story line in this language; English when it matches nothing. */
  story(summary: string): string
  /** A story parsed and told again even in English, so tests can hold every English line to a round trip. */
  retell(summary: string): string
  /** Any other English line the backend sends (the slate, hints, run lines, unlock names); English when unmatched. */
  text(english: string): string
}

const cache = new Map<Locale, AnglerWords>()

/** D200: Idle Angler's words in one language. */
export function anglerWords(locale: Locale): AnglerWords {
  const cached = cache.get(locale)
  if (cached) return cached
  const lang = IA_LANGUAGES[locale]
  const decimal = (english: string) => (locale === 'en' ? english : english.replace(/(\d)\.(\d)/, '$1,$2'))
  const fishOf = (idOrName: string): FishName => lang.species[SPECIES_BY_NAME.get(idOrName) ?? idOrName] ?? { name: idOrName, a: idOrName }
  const waterOf = (idOrName: string): WaterName => lang.waters[(WATER_BY_NAME.get(idOrName) ?? WATER_BY_THE.get(idOrName) ?? idOrName) as WaterId] ?? { name: idOrName, at: idOrName, to: idOrName, the: idOrName }
  const baitOf = (cls: BaitClass | undefined): BaitName => (cls ? lang.baits[cls] : lang.bareHook)
  const goalOf = (title: string) => {
    const id = GOAL_BY_TITLE.get(title) ?? title
    if (lang.goals[id]) return lang.goals[id]!
    const past = /^Log (\d+) species$/.exec(title)
    return past ? lang.tell.logSpecies(Number(past[1])) : title
  }
  const achievementName = (english: string) => {
    const id = ACHIEVEMENT_BY_NAME.get(english)
    return id ? achievementOf(id).name : english
  }
  const achievementOf = (id: string) => {
    const def = ACHIEVEMENT_BY_ID.get(id)
    if (!def) return { name: id, blurb: '', family: id, category: '' }
    const category = lang.achievementCategories[def.category]
    if (def.category === 'Species') {
      const speciesId = def.family.replace(/^species_/, '')
      const fish = fishOf(speciesId)
      const kg = decimal(/over (\d+(?:\.\d)?) kg/.exec(def.blurb)?.[1] ?? '')
      const [name, blurb] = def.tier === 1 ? lang.speciesAchievement.first(fish) : lang.speciesAchievement.specimen(fish, kg)
      return { name, blurb, family: fish.name, category }
    }
    const [name, blurb] = lang.achievements[id] ?? [def.name, def.blurb]
    return { name, blurb, family: lang.achievementFamilies[def.family] ?? def.familyName, category }
  }
  const join = (items: readonly string[]) => items.join(` ${lang.orders.or} `)

  /** Each English line shape, read back into parts and told in this language. */
  const STORIES: ReadonlyArray<readonly [RegExp, (m: RegExpExecArray) => string]> = [
    [re(`(?:A|An) ${W} ${SPECIES} took ${BAIT_THE} ${BAND}\\.${TAIL}`), (m) => lang.tell.caught(fishOf(m[2]!), decimal(m[1]!), baitOf(BAIT_BY_THE.get(m[3]!)), lang.bands[BAND_BY_PHRASE.get(m[4]!)!].phrase) + tail(m[5], m[6])],
    [re(`Cooler full\\. Released (?:a|an) ${W} ${SPECIES}\\.${TAIL}`), (m) => lang.tell.released(fishOf(m[2]!), decimal(m[1]!)) + tail(m[3], m[4])],
    [re(`Something heavy took ${BAIT_THE} and kept going\\.`), (m) => lang.tell.gotAway(baitOf(BAIT_BY_THE.get(m[1]!)))],
    [re(`The ${BAIT_LOWER} ran out\\. Fishing a bare hook\\.`), (m) => lang.tell.baitOut(baitOf(BAIT_BY_LOWER.get(m[1]!)))],
    [re(`Now a (${alternation(TITLE_BY_NAME.keys())}), with (\\d+) species in the logbook\\.`), (m) => lang.tell.newTitle(lang.titles[TITLE_BY_NAME.get(m[1]!)!]!, Number(m[2]))],
    [re(`(\\d+) ${WATER_NAME} species logged\\. ${WATER_NAME} is open(?: with the (${alternation(ACCESS_BY_NAME.keys())}))?\\.`), (m) => lang.tell.waterOpen(Number(m[1]), waterOf(m[2]!), waterOf(m[3]!), m[4] ? lang.access[ACCESS_BY_NAME.get(m[4])!]! : null)],
    [re(`You set up on the bank at ${WATER_THE}\\.`), (m) => lang.tell.settledAt(waterOf(m[1]!))],
    [re(`Goal reached: ${GOAL}\\. Next: ${GOAL}\\.`), (m) => lang.tell.goalReached(goalOf(m[1]!), goalOf(m[2]!))],
    [re(`Achievement: (.+)`), (m) => lang.tell.achievement(achievementName(m[1]!))],
    [re(`(\\d+) achievements: (.+)`), (m) => lang.tell.achievements(Number(m[1]), m[2]!.split(', ').map(achievementName).join(', '))],
    [re(`Entered the ${SPECIES} Open at ${WATER_THE} with ${W}\\.`), (m) => lang.tell.enteredOpen(fishOf(m[1]!), waterOf(m[2]!), decimal(m[3]!))],
    [re(`(Gold|Silver|Bronze) in the ${SPECIES} Open at ${WATER_THE} with ${W}\\. (\\d+) coins\\.`), (m) => lang.tell.medal(PLACES.indexOf(m[1] as (typeof PLACES)[number]) as 0 | 1 | 2, fishOf(m[2]!), waterOf(m[3]!), decimal(m[4]!), Number(m[5]))],
    [re(`Sold (\\d+) fish for (\\d+) coins\\.`), (m) => lang.tell.sold(Number(m[1]), Number(m[2]))],
    [re(`Bought the (${alternation([...ROD_BY_NAME.keys(), ...COOLER_BY_NAME.keys(), ...ACCESS_BY_NAME.keys()])})\\.`), (m) => lang.tell.bought(lang.rods[ROD_BY_NAME.get(m[1]!) ?? ''] ?? lang.coolers[COOLER_BY_NAME.get(m[1]!) ?? ''] ?? lang.access[ACCESS_BY_NAME.get(m[1]!) ?? '']!)],
    [re(`Bought (\\d+) tubs? of ${BAIT_LOWER}\\.`), (m) => lang.tell.boughtBait(Number(m[1]), baitOf(BAIT_BY_LOWER.get(m[2]!)))],
    [re(`Put ${BAIT_LOWER} on the hook\\.`), (m) => lang.tell.baitOnHook(baitOf(BAIT_BY_LOWER.get(m[1]!)))],
    [re(`Packing up for ${WATER_THE}\\.`), (m) => lang.tell.packingUp(waterOf(m[1]!))],
    [re(`Claimed (\\d+) coins for a goal: ${GOAL}\\.`), (m) => lang.tell.claimed(Number(m[1]), goalOf(m[2]!))],
    [re(`Handed (a|\\d+) ((?:${SPECIES.slice(1, -1)})(?: and (?:${SPECIES.slice(1, -1)}))*) to the fishmonger for (\\d+) coins\\.`), (m) => lang.tell.handedOver(m[1] === 'a' ? 1 : Number(m[1]), m[2]!.split(' and ').map(fishOf), Number(m[m.length - 1]))],
    [re(`A ${W} ${SPECIES} goes in the deadbait box\\.`), (m) => lang.tell.toDeadbait(fishOf(m[2]!), decimal(m[1]!))],
    [re(`The ${W} ${SPECIES} goes up on the wall\\.`), (m) => lang.tell.mounted(fishOf(m[2]!), decimal(m[1]!))],
    [re(`The wall now has (\\d+) pegs\\.`), (m) => lang.tell.pegs(Number(m[1]))],
    [re(`Booked a charter for (\\d+) casts\\.`), (m) => lang.tell.charter(Number(m[1]))],
  ]
  const tail = (personalBest: string | undefined, first: string | undefined) => (personalBest?.includes('personal best') ? ` ${lang.tell.personalBest}` : first ? ` ${lang.tell.newSpecies(fishOf(first))}` : '')
  const FIXED: Readonly<Record<string, string>> = { [en.tell.swapOrder]: lang.tell.swapOrder, [en.tell.paused]: lang.tell.paused, [en.tell.resumed]: lang.tell.resumed }

  /** The slate, its hints and other lines the backend builds. */
  const TEXTS: ReadonlyArray<readonly [RegExp, (m: RegExpExecArray) => string]> = [
    [re(`${COUNT_WORD} ${SPECIES}`), (m) => lang.orders.species(COUNT.get(m[1]!) ?? Number(m[1]), fishOf(m[2]!))],
    [re(`${COUNT_WORD} fish over ${W}`), (m) => lang.orders.weight(COUNT.get(m[1]!) ?? Number(m[1]), decimal(m[2]!))],
    [re(`${COUNT_WORD} fish from ${WATER_NAME}`), (m) => lang.orders.water(COUNT.get(m[1]!) ?? Number(m[1]), waterOf(m[2]!))],
    [re(`${COUNT_WORD} fish caught at ((?:dawn|the day|dusk|night)(?: or (?:dawn|the day|dusk|night))*)`), (m) => lang.orders.time(COUNT.get(m[1]!) ?? Number(m[1]), join(m[2]!.split(' or ').map((b) => lang.bands[ORDER_BAND.get(b)!].name)))],
    [re(`(A|An|No|One|Two|Three|\\d+) (common|uncommon|rare|epic) fish`), (m) => lang.orders.rarity(COUNT.get(m[1]!) ?? Number(m[1]), lang.rarity[m[2] as 'common'])],
    [
      re(`${WATER_NAME}, on ((?:${BAIT_LOWER.slice(1, -1)})(?: or (?:${BAIT_LOWER.slice(1, -1)}))*)(?:, at ((?:dawn|the day|dusk|night)(?: or (?:dawn|the day|dusk|night))*))?(?:, in ((?:clear|overcast|rain|wind|fog)(?: or (?:clear|overcast|rain|wind|fog))*) weather)?`),
      (m) => lang.orders.hint(waterOf(m[1]!), join(m[2]!.split(' or ').map((b) => lang.baits[BAIT_BY_LOWER.get(b)!].name)), m[3] ? join(m[3].split(' or ').map((b) => lang.bands[ORDER_BAND.get(b)!].name)) : null, m[4] ? join(m[4].split(' or ').map((w) => lang.weather[w as Weather])) : null),
    ],
  ]

  const retell = (summary: string): string => {
    const fixed = lang.lines[summary] ?? FIXED[summary]
    if (fixed !== undefined) return fixed
    for (const [pattern, tell] of STORIES) {
      const match = pattern.exec(summary)
      if (match) return tell(match)
    }
    return summary
  }
  const story = (summary: string): string => (locale === 'en' ? summary : retell(summary))

  const words: AnglerWords = {
    locale,
    lang,
    species: (idOrName) => fishOf(idOrName).name,
    fish: fishOf,
    water: (idOrName) => waterOf(idOrName).name,
    waterName: waterOf,
    bait: (classOrName) => lang.baits[(BAIT_BY_NAME.get(classOrName) ?? classOrName) as BaitClass]?.name ?? classOrName,
    rod: (name) => lang.rods[ROD_BY_NAME.get(name) ?? name] ?? name,
    cooler: (name) => lang.coolers[COOLER_BY_NAME.get(name) ?? name] ?? name,
    pass: (idOrName) => lang.access[ACCESS_BY_NAME.get(idOrName) ?? idOrName] ?? idOrName,
    title: (idOrName) => lang.titles[TITLE_BY_NAME.get(idOrName) ?? idOrName] ?? idOrName,
    fly: (idOrName) => lang.flies[FLY_BY_NAME.get(idOrName) ?? idOrName] ?? idOrName,
    season: (id) => lang.seasons[id as Season] ?? id,
    band: (id) => lang.bands[id as TimeBand]?.name ?? id,
    weather: (id) => lang.weather[id as Weather] ?? id,
    rarity: (id) => lang.rarity[id as 'common'] ?? id,
    goal: goalOf,
    achievement: achievementOf,
    achievementName,
    weight: (grams) => decimal(formatWeight(grams)),
    number: (value) => value.toLocaleString(locale === 'en' ? 'en-GB' : locale === 'pt' ? 'pt-BR' : locale),
    story,
    retell,
    text: (english) => {
      if (locale === 'en') return english
      const fixed = lang.lines[english]
      if (fixed !== undefined) return fixed
      if (GOAL_BY_TITLE.has(english) || /^Log \d+ species$/.test(english)) return goalOf(english)
      for (const [pattern, tell] of TEXTS) {
        const match = pattern.exec(english)
        if (match) return tell(match)
      }
      return story(english)
    },
  }
  cache.set(locale, words)
  return words
}
