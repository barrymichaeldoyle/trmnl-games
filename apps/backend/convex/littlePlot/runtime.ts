import { ACTIVE_CONTENT, catalogs, type CatalogId } from '@trmnl-games/little-plot/content'
import { SIMULATION_VERSION, type LittlePlotCatalog } from '@trmnl-games/little-plot/sim'
import { SEED_VERSION } from '@trmnl-games/engine/seed'
import { makeSchedule } from '@trmnl-games/engine/schedule'
import { internal } from '../_generated/api'
import type { EngineRuntime } from '../lib/engine/runtime'
import { LITTLE_PLOT_TABLES } from '../lib/engine/tables'

/** Little Plot ticks twelve minutes into each quarter-hour, the free slot after the other three worlds (little-plot.md "Architecture"). */
export const LITTLE_PLOT_SCHEDULE = makeSchedule(12 * 60_000)

type Refs = EngineRuntime<LittlePlotCatalog>['refs']

/** Little Plot's binding to the shared engine. Its function references take `lp` ids; the engine types them as Desk Crawler's. */
export const LITTLE_PLOT_RUNTIME: EngineRuntime<LittlePlotCatalog> = {
  slug: 'little-plot',
  tables: LITTLE_PLOT_TABLES,
  schedule: LITTLE_PLOT_SCHEDULE,
  simulationVersion: SIMULATION_VERSION,
  seedVersion: SEED_VERSION,
  runCounters: ['ripenings', 'pests', 'visits'],
  initialContentVersion: catalogs[ACTIVE_CONTENT].contentVersion,
  content: (version) => catalogs[version as CatalogId],
  refs: {
    simulateBatch: internal.littlePlot.tick.simulateBatch as unknown as Refs['simulateBatch'],
    buildBatch: internal.littlePlot.leaderboard.buildBatch as unknown as Refs['buildBatch'],
    cleanupPublication: internal.littlePlot.leaderboard.cleanupPublication as unknown as Refs['cleanupPublication'],
  },
}
