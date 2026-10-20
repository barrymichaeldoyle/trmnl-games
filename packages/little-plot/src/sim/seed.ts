import { deriveNamedSeeds } from '@trmnl-games/engine/seed'
import type { StreamName, StreamSeeds } from './types'

export const STREAMS: readonly StreamName[] = ['growth', 'cross', 'pest', 'visitor', 'trap', 'narrative']

/** Per-plot stream seeds (seed v1, the engine's hash); each stream hashes on its own name. */
export function derivePlotSeeds(worldSeed: string, plotId: string, tick: number, simulationVersion: number): StreamSeeds {
  return deriveNamedSeeds(worldSeed, plotId, tick, simulationVersion, STREAMS)
}
