/**
 * The shared week (D46, D162, D202): Monday 00:00 UTC, the calendar the keepsake codes, Idle Angler's seasons and
 * Opens, Paper Lives' weekly boards and Desk Crawler's This week board all turn on. One clock for every game.
 */
const MONDAY_EPOCH = Date.UTC(1970, 0, 5)
export const DAY_MS = 86_400_000
export const WEEK_MS = 7 * DAY_MS

/** The week number of a moment, counted from the first Monday of 1970. */
export const keepsakeWeek = (now: number): number => Math.floor((now - MONDAY_EPOCH) / WEEK_MS)
/** Monday 00:00 UTC of a week number. */
export const keepsakeWeekStartsAt = (week: number): number => MONDAY_EPOCH + week * WEEK_MS
/** Monday 00:00 UTC after the week holding `at`. */
export const weekEndsAt = (at: number): number => keepsakeWeekStartsAt(keepsakeWeek(at) + 1)
/** UTC weekday, Monday 0 to Sunday 6. */
export const weekday = (at: number): number => (new Date(at).getUTCDay() + 6) % 7

export type Season = 'spring' | 'summer' | 'autumn' | 'winter'
export const SEASONS: readonly [Season, Season, Season, Season] = ['spring', 'summer', 'autumn', 'winter']
export const SEASON_BIT: Readonly<Record<Season, number>> = { spring: 1, summer: 2, autumn: 4, winter: 8 }

/**
 * The world's season on the shared four-week year: one season a week, the week number plus the rule's offset,
 * modulo four, in the rule's order. Idle Angler's rule (content v2, offset 1) and Little Plot's are the same
 * constants, so a frost at the Tarn is a frost on the plot.
 */
export interface SeasonsRule {
  readonly order: readonly [Season, Season, Season, Season]
  readonly offsetWeeks: number
}

export function seasonOfWeek(rule: SeasonsRule, at: number): Season {
  return rule.order[(((keepsakeWeek(at) + rule.offsetWeeks) % 4) + 4) % 4]!
}
