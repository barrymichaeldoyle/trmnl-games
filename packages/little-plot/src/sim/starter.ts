import type { LittlePlotCatalog, PlotCounters, PlotState } from './types'

export const zeroCounters = (): PlotCounters => ({
  ripenings: 0,
  harvests: 0,
  sowings: 0,
  waterings: 0,
  crossesFound: 0,
  epicsFound: 0,
  gnomesCaught: 0,
  pestsDeterred: 0,
  pestEvents: 0,
  nightRipenings: 0,
  rainWateredTicks: 0,
  goldEarned: 0,
  volunteers: 0,
  windSeeds: 0,
  seedsLost: 0,
  seedsFound: 0,
  gnomesHosted: 0,
  cuttingsSent: 0,
  cuttingsReceived: 0,
  greenhouseRareRipenings: 0,
  goalsReached: 0,
  itemsBought: 0,
  seedsBought: 0,
  seasonsGrown: 0,
})

/** The four starters, one per bed, in the order they are sown. */
export const STARTER_KINDS = ['marigold', 'lettuce', 'radish', 'nasturtium'] as const

/**
 * A new plot (little-plot.md "The plot and its starting state"): four beds in a 2 × 2 grid, the four starters sown, two
 * seeds of each in the tin, a tin can, freshly watered, on the first goal.
 */
export function starterPlot(content: LittlePlotCatalog, tick: number): PlotState {
  return {
    level: 1,
    xp: 0,
    lifetimeXp: 0,
    gold: 0,
    status: 'growing',
    rows: 2,
    cols: 2,
    beds: STARTER_KINDS.map((kindId) => ({ kindId, points: 0, sownTick: tick })),
    tin: Object.fromEntries(STARTER_KINDS.map((id) => [id, 2])),
    tags: [],
    items: ['tin_can'],
    wateredUntilTick: tick + 16,
    catalogue: {},
    counters: zeroCounters(),
    quietTicks: 0,
    ticks: 0,
    ...(content.goals.length > 0 ? { goal: { rung: 0, ticksAtStart: 0 } } : {}),
  }
}

export const FIRST_LOG = "You've been given a little plot. Four beds, a tin can and a packet of seeds."
