import type { Locale } from '@trmnl-games/platform'
import { markedRuns } from '../sim/core/narrative'
import { contentTranslator } from '../i18n'

/** D169: the words a change chip uses, per language. English is the source the device template also keys its marks on. */
const CHIP_WORDS: Readonly<Record<Locale, { gold: string; hp: string; xp: string; fromPotion: (hp: string) => string; bagSlots: (n: number) => string; pouch: (n: number) => string; offers: (n: number) => string; noEffect: string }>> = {
  en: { gold: 'gold', hp: 'HP', xp: 'XP', fromPotion: (hp) => `${hp} from potion`, bagSlots: (n) => (n === 1 ? 'bag slot' : 'bag slots'), pouch: (n) => `Pouch holds ${n}`, offers: (n) => `${n} ${n === 1 ? 'offer' : 'offers'} open`, noEffect: 'No effect' },
  fr: { gold: 'or', hp: 'PV', xp: 'XP', fromPotion: (hp) => `${hp} grâce à la potion`, bagSlots: (n) => (n === 1 ? 'place de sac' : 'places de sac'), pouch: (n) => `Pochette : ${n}`, offers: (n) => `${n} ${n === 1 ? 'offre ouverte' : 'offres ouvertes'}`, noEffect: 'Aucun effet' },
  de: { gold: 'Gold', hp: 'LP', xp: 'XP', fromPotion: (hp) => `${hp} durch Trank`, bagSlots: (n) => (n === 1 ? 'Taschenplatz' : 'Taschenplätze'), pouch: (n) => `Beutel fasst ${n}`, offers: (n) => `${n} ${n === 1 ? 'Angebot' : 'Angebote'} offen`, noEffect: 'Keine Wirkung' },
  es: { gold: 'oro', hp: 'PV', xp: 'XP', fromPotion: (hp) => `${hp} por la poción`, bagSlots: (n) => (n === 1 ? 'hueco en la bolsa' : 'huecos en la bolsa'), pouch: (n) => `Bolsita: ${n}`, offers: (n) => `${n} ${n === 1 ? 'oferta abierta' : 'ofertas abiertas'}`, noEffect: 'Sin efecto' },
  it: { gold: 'oro', hp: 'PS', xp: 'XP', fromPotion: (hp) => `${hp} dalla pozione`, bagSlots: (n) => (n === 1 ? 'posto nella borsa' : 'posti nella borsa'), pouch: (n) => `Borsello: ${n}`, offers: (n) => `${n} ${n === 1 ? 'offerta aperta' : 'offerte aperte'}`, noEffect: 'Nessun effetto' },
  pt: { gold: 'ouro', hp: 'PV', xp: 'XP', fromPotion: (hp) => `${hp} da poção`, bagSlots: (n) => (n === 1 ? 'espaço na bolsa' : 'espaços na bolsa'), pouch: (n) => `Bolsinha: ${n}`, offers: (n) => `${n} ${n === 1 ? 'oferta aberta' : 'ofertas abertas'}`, noEffect: 'Sem efeito' },
  // Polish nouns take a form for 1, for 2–4 (not 12–14) and for the rest.
  pl: { gold: 'złota', hp: 'PŻ', xp: 'XP', fromPotion: (hp) => `${hp} z mikstury`, bagSlots: (n) => `${n === 1 ? 'miejsce' : n % 10 >= 2 && n % 10 <= 4 && (n % 100 < 12 || n % 100 > 14) ? 'miejsca' : 'miejsc'} w torbie`, pouch: (n) => `Sakiewka: ${n}`, offers: (n) => `Otwarte oferty: ${n}`, noEffect: 'Bez efektu' },
  nl: { gold: 'goud', hp: 'HP', xp: 'XP', fromPotion: (hp) => `${hp} door drankje`, bagSlots: (n) => (n === 1 ? 'tasplek' : 'tasplekken'), pouch: (n) => `Buidel: ${n}`, offers: (n) => `${n} ${n === 1 ? 'aanbieding' : 'aanbiedingen'} open`, noEffect: 'Geen effect' },
}

export interface LogDeltas {
  readonly xpEarned: number
  readonly gold: number
  readonly hp: number
  /** Gross acquisition from the stored loot outcome, derived on read, not net stack change. */
  readonly potionsFound?: number
  /** D131: the found potion's strength as a word ("minor potion"); absent reads as a healing potion. */
  readonly potionFound?: string
  /** Bag slots gained, from the stored bag upgrade (D61). */
  readonly bagSlots?: number
  /** HP a potion restored, shown apart from net HP so the player learns what a potion does. */
  readonly potionHealing?: number
  /** Merchant offers opened by a visit (D78). */
  readonly offers?: number
  /** Potions a merchant purchase added, or a pouch's new cap (D77/D78). */
  readonly potionsBought?: number
  readonly pouchCap?: number
  /** An effect gained (D80), by id; the companion names it from the catalog. */
  readonly effectGained?: string
}

/** Reveal only display changes, never the simulator's internal event detail. */
export function displayLogDeltas(entry: { readonly deltas: LogDeltas; readonly detail: { readonly outcome: { readonly variant: string; readonly found?: string; readonly templateId?: string; readonly potionFullFallback?: boolean; readonly offers?: readonly unknown[] }; readonly bagUpgrade?: { readonly from: number; readonly to: number }; readonly pouchUpgrade?: { readonly from: number; readonly to: number }; readonly potionHealing?: number; readonly effectGained?: string } | { readonly operation: string; readonly bagSlots?: number; readonly potionsBought?: number; readonly effectGained?: string } | { readonly achievementId: string } }): LogDeltas {
  const outcome = 'outcome' in entry.detail ? entry.detail.outcome : null
  const potionFound = outcome?.variant === 'loot' && outcome.found === 'potion' ? potionWordFor(outcome.templateId) : undefined
  const offers = outcome?.variant === 'merchant' ? outcome.offers?.length ?? 0 : 0
  const potionsBought = 'operation' in entry.detail ? entry.detail.potionsBought ?? 0 : 0
  const pouchCap = 'outcome' in entry.detail ? entry.detail.pouchUpgrade?.to ?? 0 : 0
  const effectGained = 'achievementId' in entry.detail ? undefined : entry.detail.effectGained
  const upgrade = 'outcome' in entry.detail ? entry.detail.bagUpgrade : undefined
  const bagSlots = upgrade ? upgrade.to - upgrade.from : 'operation' in entry.detail ? entry.detail.bagSlots ?? 0 : 0
  // A manual drink's whole HP delta is the potion; an automatic drink stores its share beside combat damage.
  const potionHealing = 'outcome' in entry.detail ? entry.detail.potionHealing ?? 0 : 'operation' in entry.detail && entry.detail.operation === 'use_potion' ? Math.max(0, entry.deltas.hp) : 0
  return { ...entry.deltas, potionsFound: outcome?.variant === 'loot' && outcome.found === 'potion' && !outcome.potionFullFallback ? 1 : 0, ...(potionFound === undefined ? {} : { potionFound }), bagSlots, potionHealing, offers, potionsBought, pouchCap, ...(effectGained === undefined ? {} : { effectGained }) }
}

/**
 * D131: the word for a found potion's template. Logs before v14 carry no template and were healing potions; the
 * template ids are catalog content, so the map stays here rather than reading a catalog on every log line.
 */
export function potionWordFor(templateId: string | undefined): string {
  if (templateId === undefined) return 'healing potion'
  const stem = templateId.replace(/_potion$/, '').replace(/_/g, ' ')
  return `${stem} potion`
}

/** The chip a change-free adventure shows ("No effect"), per language, for displays that leave it out. */
export const noEffectChip = (locale: Locale = 'en'): string => CHIP_WORDS[locale].noEffect

export interface PresentationOptions {
  readonly compactGold?: boolean
  /** D169: the reader's language for the story; English when absent. */
  readonly locale?: Locale
  /** The chips' language, when it differs from the story's: the device keys its marks on English units. */
  readonly chipLocale?: Locale
  readonly heroGender?: 'male' | 'female'
}

/**
 * Shared display copy. Persisted, versioned simulator summaries stay replayable: another language translates the
 * stored English summary as it is shown (D169), and falls back to the English narrative where nothing matches.
 */
export function logPresentation(entry: { readonly summary: string; readonly kind: string; readonly deltas?: LogDeltas }, options: PresentationOptions = {}) {
  const locale = options.locale ?? 'en'
  const translated = locale === 'en' ? null : contentTranslator(locale).story(entry.summary, options.heroGender === undefined ? {} : { heroGender: options.heroGender })
  const english = englishPresentation(entry, options)
  return translated === null ? english : { ...english, narrative: translated }
}

function englishPresentation(entry: { readonly summary: string; readonly kind: string; readonly deltas?: LogDeltas }, options: PresentationOptions) {
  if (!entry.deltas || entry.kind === 'achievement') return { narrative: entry.summary, changes: [] as string[] }
  const deltas = entry.deltas
  const chipLocale = options.chipLocale ?? options.locale ?? 'en'
  const words = CHIP_WORDS[chipLocale]
  const t = contentTranslator(chipLocale)
  // English keeps bare digits, as the device's fixed chip columns expect; other languages group thousands their way.
  const signed = (value: number, unit: string) => `${value > 0 ? '+' : '−'}${chipLocale === 'en' ? Math.abs(value) : t.number(Math.abs(value))} ${unit}`
  // D112: to-do labels carry targets ("Earn 50 gold adventuring"), never changes, so they keep every number; a
  // ticked-off line's reward is its gold chip and a stand-up changes nothing, so it stands alone.
  // P35: a goal line's bonus is its gold chip the same way; an unlock changes nothing and stands alone.
  if (entry.kind === 'todo' || entry.kind === 'career') return { narrative: entry.summary, changes: deltas.gold ? [signed(deltas.gold, words.gold)] : [] }
  // Transform only plain runs: numbers/units inside marked item names are names.
  let narrative = markedRuns(entry.summary).map((run) => run.bold ? `[[${run.text}]]` : run.text
    .replace(/[+−-]\d+ (?:XP|gold|HP)(?:,\s*[+−-]\d+ (?:XP|gold|HP))*\.?/g, '')
    .replace(/\b(?:Lost|Dropped) \d+ gold\./g, '')
    .replace(/:\s*\d+ gold\./g, '.')
    .replace(/\bA trap hit for \d+ HP\./g, 'A trap struck.')
    .replace(/\s+(?:for \d+ gold|with \d+ HP)(?=\.)/g, '')
    .replace(/\b\d+ HP\./g, '')
    .replace(/\b\d+ gold\b/g, 'gold')
  ).join('').replace(/\s+/g, ' ').trim()
  if (!narrative) narrative = deltas.gold > 0 ? 'Found gold.' : 'Recovered.'
  // D110: a raid can swing five-figure gold; the device's gold column holds four digits, so it reads "12k" from 10,000.
  const goldChange = (value: number) => (options.compactGold && Math.abs(value) >= 10_000 ? `${value > 0 ? '+' : '−'}${Math.floor(Math.abs(value) / 1000)}k ${words.gold}` : signed(value, words.gold))
  const potionWord = (english: string, count: number) => (chipLocale === 'en' ? `${english}${count === 1 ? '' : 's'}` : t.name(count === 1 ? english : `${english}s`))
  const changes = [
    deltas.xpEarned ? signed(deltas.xpEarned, words.xp) : null,
    deltas.gold ? goldChange(deltas.gold) : null,
    deltas.potionsFound ? signed(deltas.potionsFound, potionWord(deltas.potionFound ?? 'healing potion', deltas.potionsFound)) : null,
    // Net HP stays the single HP figure (D48); the potion chip names the part a potion restored.
    deltas.hp ? signed(deltas.hp, words.hp) : null,
    deltas.potionHealing && deltas.potionHealing !== deltas.hp ? words.fromPotion(signed(deltas.potionHealing, words.hp)) : null,
    deltas.bagSlots ? signed(deltas.bagSlots, words.bagSlots(deltas.bagSlots)) : null,
    deltas.potionsBought ? signed(deltas.potionsBought, potionWord('healing potion', deltas.potionsBought)) : null,
    deltas.pouchCap ? words.pouch(deltas.pouchCap) : null,
    deltas.offers ? words.offers(deltas.offers) : null,
    deltas.effectGained ? t.text(deltas.effectGained.replace(/_/g, ' ').replace(/^./, (c) => c.toUpperCase())) : null,
  ].filter((part): part is string => part !== null)
  // "No effect" explains an adventure that changed nothing (a coffee break at full HP); travel and companion actions
  // (kind `system`) were never meant to change stats, so they stand alone.
  const quiet = entry.kind === 'travel' || entry.kind === 'system' || entry.kind === 'occasion'
  return { narrative, changes: changes.length > 0 || quiet ? changes : [words.noEffect] }
}
