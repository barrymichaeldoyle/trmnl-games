import { deriveNamedSeeds } from '@trmnl-games/engine/seed'
import type { StreamName, StreamSeeds } from './types'

export const STREAMS: readonly StreamName[] = ['birth', 'event', 'decision', 'people', 'mortality', 'narrative']

/** Per-life stream seeds (seed v1, the engine's hash). Lives outside the pure core. */
export function deriveLifeSeeds(worldSeed: string, lifeId: string, tick: number, simulationVersion: number): StreamSeeds {
  return deriveNamedSeeds(worldSeed, lifeId, tick, simulationVersion, STREAMS)
}
