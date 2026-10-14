/**
 * The photo album's weeks (paper-lives.md "Staying on the TRMNL"): Monday 00:00 UTC, the calendar of Desk Crawler's
 * keepsakes and Idle Angler's flies (D46), so every game's code turns over at the same moment.
 */
const MONDAY_EPOCH = Date.UTC(1970, 0, 5)
export const WEEK_MS = 7 * 24 * 60 * 60 * 1000
export const photoWeek = (now: number) => Math.floor((now - MONDAY_EPOCH) / WEEK_MS)
export const photoWeekStartsAt = (week: number) => MONDAY_EPOCH + week * WEEK_MS
