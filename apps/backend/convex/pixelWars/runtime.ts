import { ACTIVE_CONTENT, catalogs, type CatalogId } from '@trmnl-games/pixel-wars/content'
import { SIMULATION_VERSION, type PixelWarsCatalog } from '@trmnl-games/pixel-wars/sim'
import { SEED_VERSION } from '@trmnl-games/engine/seed'
import { makeSchedule } from '@trmnl-games/engine/schedule'
import { internal } from '../_generated/api'
import type { EngineRuntime } from '../lib/engine/runtime'
import { PIXEL_WARS_TABLES } from '../lib/engine/tables'

/** Pixel Wars ticks three minutes into each quarter-hour, the free slot after the other four worlds (pixel-wars.md "Architecture"). */
export const PIXEL_WARS_SCHEDULE = makeSchedule(3 * 60_000)

type Refs = EngineRuntime<PixelWarsCatalog>['refs']

/** Pixel Wars' binding to the shared engine. Its function references take `pw` ids; the engine types them as Desk Crawler's. */
export const PIXEL_WARS_RUNTIME: EngineRuntime<PixelWarsCatalog> = {
  slug: 'pixel-wars',
  tables: PIXEL_WARS_TABLES,
  schedule: PIXEL_WARS_SCHEDULE,
  simulationVersion: SIMULATION_VERSION,
  seedVersion: SEED_VERSION,
  runCounters: ['orders', 'flips', 'desksTaken'],
  initialContentVersion: catalogs[ACTIVE_CONTENT].contentVersion,
  content: (version) => catalogs[version as CatalogId],
  refs: {
    simulateBatch: internal.pixelWars.tick.simulateBatch as unknown as Refs['simulateBatch'],
    buildBatch: internal.pixelWars.leaderboard.buildBatch as unknown as Refs['buildBatch'],
    cleanupPublication: internal.pixelWars.leaderboard.cleanupPublication as unknown as Refs['cleanupPublication'],
  },
}
