import type { PlotState, TickEvent } from '@trmnl-games/little-plot/sim'
import type { Doc } from '../_generated/dataModel'

/** Stored plot to the pure core's state. */
export function toPlotState(doc: Doc<'plots'>): PlotState {
  return doc.plot as PlotState
}

/** The pure core's state back to the stored field; absent optionals stay absent, so a cleared marker clears. */
export function fromPlotState(state: PlotState): Doc<'plots'>['plot'] {
  return JSON.parse(JSON.stringify(state)) as Doc<'plots'>['plot']
}

/** The top-level fields ranking and the companion read without opening the state. */
export function mirrored(state: PlotState): Pick<Doc<'plots'>, 'level' | 'xp' | 'gold'> {
  return { level: state.level, xp: state.xp, gold: state.gold }
}

/** A core event as a stored log detail. */
export function storedDetail(event: TickEvent): Doc<'lpTickLogs'>['detail'] {
  const d = event.detail
  return {
    v: 1,
    ...(d.bed === undefined ? {} : { bed: d.bed }),
    ...(d.kindId === undefined ? {} : { kindId: d.kindId }),
    ...(d.childKindId === undefined ? {} : { childKindId: d.childKindId }),
    ...(d.stage === undefined ? {} : { stage: d.stage }),
    ...(d.pest === undefined ? {} : { pest: d.pest }),
    ...(d.effect === undefined ? {} : { effect: d.effect }),
    ...(d.item === undefined ? {} : { item: d.item }),
    ...(d.coins === undefined ? {} : { coins: d.coins }),
    ...(d.xp === undefined ? {} : { xp: d.xp }),
    ...(d.level === undefined ? {} : { level: d.level }),
    ...(d.goalId === undefined ? {} : { goalId: d.goalId }),
    ...(d.first ? { first: true as const } : {}),
    ...(d.season === undefined ? {} : { season: d.season }),
    ...(d.weather === undefined ? {} : { weather: d.weather }),
    ...(d.band === undefined ? {} : { band: d.band }),
  }
}
