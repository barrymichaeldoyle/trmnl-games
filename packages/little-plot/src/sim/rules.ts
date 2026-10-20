import { SEASON_BIT, keepsakeWeek, seasonOfWeek } from '@trmnl-games/engine/calendar'
import type { Bed, Conditions, ItemDef, KindDef, LittlePlotCatalog, PestId, PlotState, Season, Stage, TimeBand, Weather } from './types'
import { STAGES } from './types'

/** Shared rules of the plot: conditions, the stage maths, the items' effects and the catalog lookups. */

export class LittlePlotInvariantError extends Error {
  constructor(
    readonly code: string,
    message: string,
  ) {
    super(message)
  }
}

export function kindOf(content: LittlePlotCatalog, id: string): KindDef {
  const kind = content.kinds.find((k) => k.id === id)
  if (!kind) throw new LittlePlotInvariantError('UNKNOWN_KIND', `unknown kind ${id}`)
  return kind
}

export function itemOf(content: LittlePlotCatalog, id: string): ItemDef {
  const item = content.items.find((i) => i.id === id)
  if (!item) throw new LittlePlotInvariantError('UNKNOWN_ITEM', `unknown item ${id}`)
  return item
}

export const hasItem = (plot: Pick<PlotState, 'items'>, id: string): boolean => plot.items.includes(id)

export const ownedItems = (content: LittlePlotCatalog, plot: Pick<PlotState, 'items'>): ItemDef[] => plot.items.map((id) => itemOf(content, id))

export const DAY_MS = 86_400_000

/** Local hour (0 to 23) for a wall slot and an optional UTC offset in seconds. */
export function localHour(at: number, utcOffsetSeconds: number | undefined): number {
  return new Date(at + (utcOffsetSeconds ?? 0) * 1000).getUTCHours()
}

export function timeBand(hour: number, content: Pick<LittlePlotCatalog, 'bands'>): TimeBand {
  const { dawn, day, dusk, night } = content.bands
  if (hour >= dawn && hour < day) return 'dawn'
  if (hour >= day && hour < dusk) return 'day'
  if (hour >= dusk && hour < night) return 'dusk'
  return 'night'
}

export const seasonAt = (content: Pick<LittlePlotCatalog, 'seasons'>, at: number): Season => seasonOfWeek(content.seasons, at)

export function conditionsAt(content: LittlePlotCatalog, tickAt: number, utcOffsetSeconds: number | undefined, weather: Weather): Conditions {
  const band = timeBand(localHour(tickAt, utcOffsetSeconds), content)
  const season = seasonAt(content, tickAt)
  return { band, weather, season, frost: season === 'winter' && weather === 'clear' && band === 'night', week: keepsakeWeek(tickAt), day: Math.floor(tickAt / DAY_MS) }
}

/** Bands a night-blooming plant treats as night: fog makes dawn and dusk read as night too. */
export const isNightish = (c: Pick<Conditions, 'band' | 'weather'>): boolean => c.band === 'night' || (c.weather === 'fog' && (c.band === 'dawn' || c.band === 'dusk'))

/** Points per stage in hundredths: a stage is a quarter of the kind's grow time. */
export const stagePoints = (kind: Pick<KindDef, 'growTicks'>): number => kind.growTicks * 25

export function stageOf(bed: Bed, kind: Pick<KindDef, 'growTicks'>): Stage {
  if (bed.kindId === undefined) return 'sown'
  return STAGES[Math.min(4, Math.floor(bed.points / stagePoints(kind)))]!
}

export const stageIndex = (stage: Stage): number => STAGES.indexOf(stage)

/** The points a stage starts at. */
export const pointsAtStage = (kind: Pick<KindDef, 'growTicks'>, stage: Stage): number => stageIndex(stage) * stagePoints(kind)

/** The plot's total pest multiplier for one pest, whole percent, floored by the rule. */
export function pestPercent(content: LittlePlotCatalog, plot: PlotState, pest: PestId, conditions: Conditions, tick: number): number {
  let percent = 100
  for (const item of ownedItems(content, plot)) {
    const factor = item.effects.pests?.[pest]
    if (factor === undefined) continue
    if (item.effects.nightOnly && conditions.band !== 'night' && conditions.band !== 'dusk') continue
    if (item.effects.lasts === 'season' && (plot.ladybirdsUntilTick ?? 0) < tick) continue
    // The pond's frogs are away for a day after the heron.
    if (item.id === 'pond' && (plot.heronUntilTick ?? 0) >= tick) continue
    percent = Math.round((percent * factor) / 100)
  }
  return Math.max(content.pestRule.floorPercent, percent)
}

/** The visiting gnome's multiplier from the owned defences, whole percent. */
export function visitorPercent(content: LittlePlotCatalog, plot: PlotState): number {
  let percent = 100
  for (const item of ownedItems(content, plot)) if (item.effects.visitor !== undefined) percent = Math.round((percent * item.effects.visitor) / 100)
  return Math.max(content.visitor.floorPercent, percent)
}

/** The best trap owned, as a catch percent; 0 without one. */
export function trapPercent(content: LittlePlotCatalog, plot: Pick<PlotState, 'items'>): number {
  return Math.max(0, ...ownedItems(content, plot).map((i) => i.effects.trapPercent ?? 0))
}

/** How long one watering lasts with the best can owned. */
export function waterTicks(content: LittlePlotCatalog, plot: Pick<PlotState, 'items'>): number {
  return Math.max(16, ...ownedItems(content, plot).map((i) => i.effects.waterTicks ?? 0))
}

export function growthStructurePercent(content: LittlePlotCatalog, plot: Pick<PlotState, 'items'>): number {
  let percent = 100
  for (const item of ownedItems(content, plot)) if (item.effects.growthPercent !== undefined) percent = Math.round((percent * item.effects.growthPercent) / 100)
  return percent
}

export function crossPercent(content: LittlePlotCatalog, plot: Pick<PlotState, 'items'>): number {
  let percent = content.crossPercent
  for (const item of ownedItems(content, plot)) if (item.effects.crossPercent !== undefined) percent = Math.round((percent * item.effects.crossPercent) / 100)
  return Math.min(content.crossCapPercent, percent)
}

export function greenhouseBeds(content: LittlePlotCatalog, plot: Pick<PlotState, 'items'>): number {
  return ownedItems(content, plot).reduce((sum, i) => sum + (i.effects.greenhouseBeds ?? 0), 0)
}

/** The four orthogonal neighbours of a bed, as indexes. */
export function neighbours(plot: Pick<PlotState, 'rows' | 'cols'>, index: number): number[] {
  const row = Math.floor(index / plot.cols)
  const col = index % plot.cols
  const out: number[] = []
  if (row > 0) out.push(index - plot.cols)
  if (row < plot.rows - 1) out.push(index + plot.cols)
  if (col > 0) out.push(index - 1)
  if (col < plot.cols - 1) out.push(index + 1)
  return out
}

/** The kinds that cross from these two parents, in catalog order. */
export function childrenOf(content: LittlePlotCatalog, a: string, b: string): KindDef[] {
  return content.kinds.filter((k) => k.parents !== undefined && ((k.parents[0] === a && k.parents[1] === b) || (k.parents[0] === b && k.parents[1] === a)))
}

export const seasonBit = (season: Season): number => SEASON_BIT[season]

export const kindsGrown = (plot: Pick<PlotState, 'catalogue'>): number => Object.keys(plot.catalogue).length

export const emptyBeds = (plot: Pick<PlotState, 'beds'>): number[] => plot.beds.flatMap((bed, i) => (bed.kindId === undefined ? [i] : []))

/** The hint the catalogue shows for an ungrown cross: the riddle, one parent, or both. */
export function crossHint(content: LittlePlotCatalog, plot: Pick<PlotState, 'catalogue'>, kind: KindDef): { known: 0 | 1 | 2; parents: string[] } {
  if (!kind.parents) return { known: 0, parents: [] }
  const known = kind.parents.filter((p) => plot.catalogue[p] !== undefined)
  return { known: known.length as 0 | 1 | 2, parents: known }
}
