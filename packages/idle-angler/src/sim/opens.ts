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

/** A board row the award reads: who landed what, where it sits by weight. */
export interface OpenRow<Angler> {
  readonly anglerId: Angler
  readonly speciesId: string
  readonly grams: number
  readonly at: number
}

export interface OpenAward<Angler> {
  readonly waterId: WaterId
  /** 0 gold, 1 silver, 2 bronze. */
  readonly place: 0 | 1 | 2
  readonly row: OpenRow<Angler>
}

/** A top-three place an angler held on a board but did not take, because their one medal that weekend is elsewhere. */
export interface OpenPass<Angler> {
  readonly anglerId: Angler
  readonly waterId: WaterId
  readonly place: 0 | 1 | 2
  readonly row: OpenRow<Angler>
}

/**
 * D230: one medal an angler a weekend. Each water's boards (heaviest first) become at most three medals, awarded in
 * rounds, every gold first, then the silvers, then the bronzes; at each water the medal goes to the heaviest remaining
 * row whose angler holds no medal yet that weekend. An angler who is first at two waters keeps the one where their fish
 * is the larger share of its species' top weight, the earlier catch on a tie; the other place passes to the next
 * angler. `passes` lists the raw top-three places that moved on, so the cron can tell their holder. Pure: the cron and
 * the Rankings card both run it, so what the card predicts on Sunday is what the shelf shows on Monday.
 */
export function awardOpens<Angler>(content: IdleAnglerCatalog, boards: ReadonlyArray<{ waterId: WaterId; rows: ReadonlyArray<OpenRow<Angler>> }>): { awards: OpenAward<Angler>[]; passes: OpenPass<Angler>[] } {
  const share = (row: OpenRow<Angler>) => row.grams / Math.max(1, content.species.find((s) => s.id === row.speciesId)?.maxGrams ?? row.grams)
  const better = (a: OpenRow<Angler>, b: OpenRow<Angler>) => share(a) - share(b) || b.at - a.at
  const medalled = new Set<Angler>()
  const awards: OpenAward<Angler>[] = []
  for (const place of [0, 1, 2] as const) {
    const open = new Set(boards.map((b) => b.waterId))
    while (open.size > 0) {
      // Each open water's candidate: its heaviest row whose angler is still without a medal.
      const candidates = new Map<Angler, Array<{ waterId: WaterId; row: OpenRow<Angler> }>>()
      for (const board of boards) {
        if (!open.has(board.waterId)) continue
        const row = board.rows.find((r) => !medalled.has(r.anglerId))
        if (!row) {
          open.delete(board.waterId)
          continue
        }
        candidates.set(row.anglerId, [...(candidates.get(row.anglerId) ?? []), { waterId: board.waterId, row }])
      }
      for (const [anglerId, at] of candidates) {
        const kept = at.reduce((best, next) => (better(next.row, best.row) > 0 ? next : best))
        awards.push({ waterId: kept.waterId, place, row: kept.row })
        medalled.add(anglerId)
        open.delete(kept.waterId)
      }
    }
  }
  const passes: OpenPass<Angler>[] = []
  for (const board of boards) {
    for (const [index, row] of board.rows.slice(0, 3).entries()) {
      const place = index as 0 | 1 | 2
      if (!awards.some((a) => a.waterId === board.waterId && a.row.anglerId === row.anglerId)) passes.push({ anglerId: row.anglerId, waterId: board.waterId, place, row })
    }
  }
  return { awards, passes }
}
