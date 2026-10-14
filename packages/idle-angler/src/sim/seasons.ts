import { keepsakeWeek } from '../content/week'
import type { IdleAnglerCatalog, RunDef, Season, WaterDef, Weather } from './types'

/**
 * The world's season (D162, idle-angler-full.md "Seasons and runs"): one season a week on a four-week fishing year,
 * shared by every angler and counted on the fly code's week (Monday 00:00 UTC). Pure functions of the UTC time.
 */
const DAY_MS = 86_400_000
export const SEASON_BIT: Readonly<Record<Season, number>> = { spring: 1, summer: 2, autumn: 4, winter: 8 }

export function seasonAt(content: Pick<IdleAnglerCatalog, 'seasons'>, at: number): Season | undefined {
  const rule = content.seasons
  if (!rule) return undefined
  return rule.order[(((keepsakeWeek(at) + rule.offsetWeeks) % 4) + 4) % 4]!
}

/** Monday 00:00 UTC of the week the moment falls in, and the next one: when the season changes. */
export const seasonEndsAt = (at: number): number => Date.UTC(1970, 0, 5) + (keepsakeWeek(at) + 1) * 7 * DAY_MS

/** UTC weekday, Monday 0 to Sunday 6. */
export const weekday = (at: number): number => (new Date(at).getUTCDay() + 6) % 7

/** The run on at a water at this moment: its season's week, Monday to Thursday UTC. */
export function runAt(content: IdleAnglerCatalog, waterId: string, at: number): RunDef | undefined {
  const season = seasonAt(content, at)
  if (!season || !content.runs || weekday(at) > 3) return undefined
  return content.runs.find((run) => run.season === season && run.water === waterId)
}

/** The run on anywhere this moment, for the Dock's banner. */
export function runsAt(content: IdleAnglerCatalog, at: number): readonly RunDef[] {
  const season = seasonAt(content, at)
  if (!season || !content.runs || weekday(at) > 3) return []
  return content.runs.filter((run) => run.season === season)
}

/** Forecast weights for the season: the water's seasonal table, or its year-round one. */
export function weatherTable(water: WaterDef, season: Season | undefined): ReadonlyArray<readonly [Weather, number]> {
  return (season && water.seasonWeather?.[season]) || water.weather
}

/** Whether the season lets the water be fished at all (Frozen Tarn opens in winter only). */
export function waterOpenIn(water: WaterDef, season: Season | undefined): boolean {
  return water.openIn === undefined || (season !== undefined && water.openIn.includes(season))
}

export const SEASON_NAME: Readonly<Record<Season, string>> = { spring: 'Spring', summer: 'Summer', autumn: 'Autumn', winter: 'Winter' }
