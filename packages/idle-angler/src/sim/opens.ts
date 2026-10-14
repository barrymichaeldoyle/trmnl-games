import { keepsakeWeek, keepsakeWeekStartsAt } from '../content/week'
import { seasonAt, waterOpenIn, weekday } from './seasons'
import type { IdleAnglerCatalog, SpeciesDef, WaterId } from './types'

/**
 * Weekend Opens (D162, idle-angler-full.md "Weekend Opens"): every open water holds one every weekend, Saturday 00:00
 * to Sunday 23:59 UTC, for its heaviest fish of one species named by a fixed weekly rotation. Entry is automatic: land
 * the target there in the window. The board is the D116 record table under an `o` period, so this module only names
 * the week, the window and the target; nothing here is a draw.
 */

const DAY_MS = 86_400_000

export const isOpenWindow = (at: number): boolean => weekday(at) >= 5

/** "o2026-10-17": the Saturday of the week, the board period of that weekend's Opens. */
export function openPeriod(at: number): string {
  const saturday = keepsakeWeekStartsAt(keepsakeWeek(at)) + 5 * DAY_MS
  return `o${new Date(saturday).toISOString().slice(0, 10)}`
}

/** The week's target at a water, or undefined when the water holds no Open that week (Frozen Tarn outside winter). */
export function openTarget(content: IdleAnglerCatalog, waterId: WaterId, at: number): SpeciesDef | undefined {
  const rotation = content.opens?.rotation[waterId]
  const water = content.waters.find((w) => w.id === waterId)
  if (!rotation || rotation.length === 0 || !water) return undefined
  const saturday = keepsakeWeekStartsAt(keepsakeWeek(at)) + 5 * DAY_MS
  if (!waterOpenIn(water, seasonAt(content, saturday))) return undefined
  const id = rotation[keepsakeWeek(at) % rotation.length]!
  return content.species.find((s) => s.id === id)
}

/** Whether a landed fish enters that weekend's Open at its water. */
export function entersOpen(content: IdleAnglerCatalog, waterId: WaterId, speciesId: string, at: number): boolean {
  return isOpenWindow(at) && openTarget(content, waterId, at)?.id === speciesId
}

/** Monday 00:10 UTC after an Open's weekend: when its medals are awarded. */
export function openClosesAt(period: string): number {
  return Date.parse(`${period.slice(1)}T00:00:00Z`) + 2 * DAY_MS + 10 * 60_000
}
