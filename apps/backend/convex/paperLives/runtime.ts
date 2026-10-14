import { ACTIVE_CONTENT, catalogs, type CatalogId } from '@trmnl-games/paper-lives/content'
import { SIMULATION_VERSION, type PaperLivesCatalog } from '@trmnl-games/paper-lives/sim'
import { SEED_VERSION } from '@trmnl-games/engine/seed'
import { makeSchedule } from '@trmnl-games/engine/schedule'
import { internal } from '../_generated/api'
import type { EngineRuntime } from '../lib/engine/runtime'
import { PAPER_LIVES_TABLES } from '../lib/engine/tables'

/** Paper Lives ticks ten minutes into each quarter-hour, so the three worlds never share a slot (paper-lives.md "Architecture"). */
export const PAPER_LIVES_SCHEDULE = makeSchedule(10 * 60_000)

type Refs = EngineRuntime<PaperLivesCatalog>['refs']

/** Paper Lives' binding to the shared engine. Its function references take `pl` ids; the engine types them as Desk Crawler's. */
export const PAPER_LIVES_RUNTIME: EngineRuntime<PaperLivesCatalog> = {
  slug: 'paper-lives',
  tables: PAPER_LIVES_TABLES,
  schedule: PAPER_LIVES_SCHEDULE,
  simulationVersion: SIMULATION_VERSION,
  seedVersion: SEED_VERSION,
  runCounters: ['events', 'years', 'deaths'],
  initialContentVersion: ACTIVE_CONTENT,
  content: (version) => catalogs[version as CatalogId],
  refs: {
    simulateBatch: internal.paperLives.tick.simulateBatch as unknown as Refs['simulateBatch'],
    buildBatch: internal.paperLives.publication.buildBatch as unknown as Refs['buildBatch'],
    cleanupPublication: internal.paperLives.publication.cleanupPublication as unknown as Refs['cleanupPublication'],
  },
}
