import type { ContentCatalog, Modifiers, OccasionDateRule, OccasionRule, RaidMishapRule } from './types'

/**
 * The office calendar (D139). Pure: an occasion is live when the hero's local date, from the tick's wall slot and
 * the owner's last TRMNL offset, falls inside one of its occurrences. Catalog order decides between overlapping
 * occasions, so at most one is ever live.
 */

const DAY_MS = 24 * 60 * 60 * 1000
/** The tick schedule's quarter-hour (D42), for inputs without a wall slot. */
const TICK_MS = 15 * 60 * 1000

export interface LiveOccasion {
  readonly rule: OccasionRule
  /** `<id>@<start date>`: one occurrence, so an announcement or a gift happens once in it. */
  readonly key: string
}

/** Days since 1970-01-01 for a calendar date (month 1 to 12). */
const dayNumber = (year: number, month: number, day: number): number => Date.UTC(year, month - 1, day) / DAY_MS

const isoOf = (dayNum: number): string => new Date(dayNum * DAY_MS).toISOString().slice(0, 10)

/** Easter Sunday (Gregorian, anonymous algorithm) as a day number. */
export function easterDay(year: number): number {
  const a = year % 19
  const b = Math.floor(year / 100)
  const c = year % 100
  const d = Math.floor(b / 4)
  const e = b % 4
  const f = Math.floor((b + 8) / 25)
  const g = Math.floor((b - f + 1) / 3)
  const h = (19 * a + b - d - g + 15) % 30
  const i = Math.floor(c / 4)
  const k = c % 4
  const l = (32 + 2 * e + 2 * i - h - k) % 7
  const m = Math.floor((a + 11 * h + 22 * l) / 451)
  const month = Math.floor((h + l - 7 * m + 114) / 31)
  const day = ((h + l - 7 * m + 114) % 31) + 1
  return dayNumber(year, month, day)
}

/** Every start date (as day numbers) a rule has in one calendar year. */
export function occasionStarts(rule: OccasionDateRule, year: number): number[] {
  switch (rule.kind) {
    case 'fixed':
      // A 29 February rule only exists in leap years; Date.UTC would roll it into March.
      return new Date(dayNumber(year, rule.month, rule.day) * DAY_MS).getUTCMonth() + 1 === rule.month ? [dayNumber(year, rule.month, rule.day)] : []
    case 'nth_weekday': {
      const first = dayNumber(year, rule.month, 1)
      const firstWeekday = new Date(first * DAY_MS).getUTCDay()
      return [first + ((rule.weekday - firstWeekday + 7) % 7) + 7 * (rule.nth - 1) + (rule.offsetDays ?? 0)]
    }
    case 'friday_13th': {
      const starts: number[] = []
      for (let month = 1; month <= 12; month += 1) {
        const day = dayNumber(year, month, 13)
        if (new Date(day * DAY_MS).getUTCDay() === 5) starts.push(day)
      }
      return starts
    }
    case 'easter':
      return [easterDay(year) + rule.offsetDays]
    case 'table':
      return rule.dates.filter((date) => Number(date.slice(0, 4)) === year).map((date) => Date.parse(`${date}T00:00:00Z`) / DAY_MS)
  }
}

/** The local day number at `at` for an offset in seconds east of UTC; a missing or invalid offset reads UTC (D106). */
export function localDay(at: number, utcOffsetSeconds: number | undefined): number {
  const offset = utcOffsetSeconds !== undefined && Number.isInteger(utcOffsetSeconds) && Math.abs(utcOffsetSeconds) <= 14 * 3600 ? utcOffsetSeconds : 0
  return Math.floor((at + offset * 1000) / DAY_MS)
}

/** The occurrence of `rule` covering a local day, or undefined. Checks the year before too, for one that runs past New Year. */
function occurrenceOn(rule: OccasionRule, day: number): number | undefined {
  const year = new Date(day * DAY_MS).getUTCFullYear()
  for (const y of [year - 1, year]) {
    for (const start of occasionStarts(rule.date, y)) if (day >= start && day < start + rule.days) return start
  }
  return undefined
}

/** The occasion live on a local day, first in catalog order; undefined without occasions or on an ordinary day. */
export function occasionOnDay(content: ContentCatalog, day: number): LiveOccasion | undefined {
  for (const rule of content.occasions ?? []) {
    const start = occurrenceOn(rule, day)
    if (start !== undefined) return { rule, key: `${rule.id}@${isoOf(start)}` }
  }
  return undefined
}

export function occasionAt(content: ContentCatalog, at: number, utcOffsetSeconds: number | undefined): LiveOccasion | undefined {
  return content.occasions === undefined ? undefined : occasionOnDay(content, localDay(at, utcOffsetSeconds))
}

/** The occasion live for a simulation input: its wall slot, or `tick` quarter-hours after the epoch, in the owner's offset. */
export function occasionForTick(content: ContentCatalog, tick: number, tickAt: number | undefined, utcOffsetSeconds: number | undefined): LiveOccasion | undefined {
  return occasionAt(content, tickAt ?? tick * TICK_MS, utcOffsetSeconds)
}

/** The live occasion's modifiers, for `activeModifiers`. */
export const occasionModifiers = (live: LiveOccasion | undefined): Modifiers | undefined => live?.rule.effect?.modifiers

/** Catalog checks (D139): unique ids, sane lengths and shares, one effect each, and dates that resolve. */
export function occasionProblems(content: ContentCatalog): string[] {
  const problems: string[] = []
  const max = content.constants.summaryMaxCodePoints
  const ids = new Set<string>()
  for (const rule of content.occasions ?? []) {
    if (ids.has(rule.id)) problems.push(`occasion ${rule.id} is listed twice`)
    ids.add(rule.id)
    if (!Number.isSafeInteger(rule.days) || rule.days < 1 || rule.days > 7) problems.push(`occasion ${rule.id} must run 1 to 7 days`)
    if (rule.lines.length === 0 || rule.lines.some((line) => [...line].length > max || line.includes('{'))) problems.push(`occasion ${rule.id} needs announcement lines without placeholders that fit ${max} code points`)
    const effect = rule.effect ?? {}
    const kinds = [effect.modifiers, effect.merchantPricePct ?? effect.merchantWeightPct, effect.gift, effect.raidMishap].filter((kind) => kind !== undefined)
    if (kinds.length > 1) problems.push(`occasion ${rule.id} has more than one effect`)
    if ((kinds.length === 0) !== (rule.effectLabel === undefined)) problems.push(`occasion ${rule.id} needs an effect label exactly when it has an effect`)
    for (const [name, value] of Object.entries(effect.modifiers ?? {})) if (!Number.isSafeInteger(value) || Math.abs(value) > 50) problems.push(`occasion ${rule.id} ${name} must be a whole share within ±50`)
    if (effect.merchantPricePct !== undefined && (effect.merchantPricePct < 10 || effect.merchantPricePct > 100)) problems.push(`occasion ${rule.id} merchant price must be 10 to 100%`)
    if (effect.merchantWeightPct !== undefined && (effect.merchantWeightPct < 100 || effect.merchantWeightPct > 300)) problems.push(`occasion ${rule.id} merchant odds must be 100 to 300%`)
    if (effect.gift !== undefined && (effect.gift.lines.length === 0 || effect.gift.lines.some((line) => [...line].length > max))) problems.push(`occasion ${rule.id} needs gift lines that fit`)
    const mishap = effect.raidMishap
    if (mishap !== undefined) {
      if (content.raids === undefined) problems.push(`occasion ${rule.id} has a raid mishap without raid rules`)
      if (mishap.launchPct < 100 || mishap.launchPct > 300) problems.push(`occasion ${rule.id} mishap launch share must be 100 to 300%`)
      if (mishap.hpPct < 1 || mishap.hpPct > 50 || mishap.goldLossPct < 0 || mishap.goldLossPct > 20) problems.push(`occasion ${rule.id} mishap losses out of range`)
      if ([...mishap.raider, ...mishap.target].some((line) => !line.includes('{rival}')) || mishap.raider.length === 0 || mishap.target.length === 0) problems.push(`occasion ${rule.id} mishap lines must name {rival}`)
    }
    const date = rule.date
    if (date.kind === 'table') {
      if (date.dates.some((iso, i) => !/^\d{4}-\d{2}-\d{2}$/.test(iso) || Number.isNaN(Date.parse(`${iso}T00:00:00Z`)) || (i > 0 && iso <= date.dates[i - 1]!))) problems.push(`occasion ${rule.id} table dates must be ISO dates in order`)
    } else if (!(date.kind === 'fixed' && date.month === 2 && date.day === 29)) {
      for (let year = 2026; year <= 2036; year += 1) if (occasionStarts(date, year).length === 0) problems.push(`occasion ${rule.id} has no date in ${year}`)
    }
  }
  return problems
}

/** The raid launch share for the live occasion: Friday the 13th's, else 100. Shared by the core and the adapter. */
export const raidLaunchPct = (live: LiveOccasion | undefined): number => live?.rule.effect?.raidMishap?.launchPct ?? 100

/** The catalog's raid mishap rule, for a target applying a ledger mishap after its day has passed. */
export const mishapRule = (content: ContentCatalog): RaidMishapRule | undefined => content.occasions?.find((rule) => rule.effect?.raidMishap !== undefined)?.effect?.raidMishap

/** The local day an occurrence key starts on (`<id>@<YYYY-MM-DD>`). */
const startDayOf = (key: string): number => Date.parse(`${key.slice(key.indexOf('@') + 1)}T00:00:00Z`) / DAY_MS

/**
 * For the companion (D139): the occasion live on a local day with the days it has left, and the next one to start
 * after today, within a year.
 */
export function occasionCalendar(content: ContentCatalog, day: number): { live?: { rule: OccasionRule; daysLeft: number }; next?: { rule: OccasionRule; inDays: number } } {
  if (content.occasions === undefined) return {}
  const today = occasionOnDay(content, day)
  const live = today === undefined ? undefined : { rule: today.rule, daysLeft: startDayOf(today.key) + today.rule.days - day }
  for (let ahead = 1; ahead <= 400; ahead += 1) {
    const found = occasionOnDay(content, day + ahead)
    if (found !== undefined && startDayOf(found.key) === day + ahead) return { ...(live === undefined ? {} : { live }), next: { rule: found.rule, inDays: ahead } }
  }
  return live === undefined ? {} : { live }
}
