import { ACTIVE_CONTENT, catalogs, type CatalogId } from '@trmnl-games/idle-angler/content'
import { SIMULATION_VERSION } from '@trmnl-games/idle-angler/sim'
import type { IdleAnglerCatalog } from '@trmnl-games/idle-angler/sim'
import { SEED_VERSION } from '@trmnl-games/engine/seed'
import { makeSchedule } from '@trmnl-games/engine/schedule'
import { internal } from '../_generated/api'
import type { EngineRuntime } from '../lib/engine/runtime'
import { IDLE_ANGLER_TABLES } from '../lib/engine/tables'
import { publishWaterPresence } from './presence'

/** Idle Angler ticks five minutes into each quarter-hour, so it never shares a slot with Desk Crawler (idle-angler.md "Architecture"). */
export const IDLE_ANGLER_SCHEDULE = makeSchedule(5 * 60_000)

type Refs = EngineRuntime<IdleAnglerCatalog>['refs']

/** Idle Angler's binding to the shared engine. Its function references take `ia` ids; the engine types them as Desk Crawler's. */
export const IDLE_ANGLER_RUNTIME: EngineRuntime<IdleAnglerCatalog> = {
  slug: 'idle-angler',
  tables: IDLE_ANGLER_TABLES,
  schedule: IDLE_ANGLER_SCHEDULE,
  simulationVersion: SIMULATION_VERSION,
  seedVersion: SEED_VERSION,
  runCounters: ['landed', 'released', 'gotAway'],
  initialContentVersion: catalogs[ACTIVE_CONTENT].contentVersion,
  content: (version) => catalogs[version as CatalogId],
  refs: {
    simulateBatch: internal.idleAngler.tick.simulateBatch as unknown as Refs['simulateBatch'],
    buildBatch: internal.idleAngler.leaderboard.buildBatch as unknown as Refs['buildBatch'],
    cleanupPublication: internal.idleAngler.leaderboard.cleanupPublication as unknown as Refs['cleanupPublication'],
  },
  onCohortWalked: publishWaterPresence,
}
