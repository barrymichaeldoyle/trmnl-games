import { deriveNamedSeeds } from '@trmnl-games/engine/seed'
import { drawForecast, forecastBlockStart } from '@trmnl-games/engine/forecast'
import { seasonAt, weatherTable } from './seasons'
import type { IdleAnglerCatalog, StreamName, StreamSeeds, WaterDef, WaterId, Weather } from './types'

export const STREAMS: readonly StreamName[] = ['bite', 'species', 'size', 'narrative', 'orders']

/** Per-angler stream seeds (seed v1, the engine's hash). Each stream hashes on its own, so `orders` moves no other. */
export function deriveAnglerSeeds(worldSeed: string, anglerId: string, tick: number, simulationVersion: number): StreamSeeds {
  return deriveNamedSeeds(worldSeed, anglerId, tick, simulationVersion, STREAMS)
}

/**
 * The shared forecast: one weather per water per six-hour UTC block, the same for every angler. Under content v2 the
 * world's season picks the water's table (D162); the hash is unchanged, so v1 forecasts replay.
 */
export function forecast(worldSeed: string, water: WaterDef, at: number, content?: Pick<IdleAnglerCatalog, 'seasons'>): Weather {
  const season = content ? seasonAt(content, forecastBlockStart(at)) : undefined
  return drawForecast(worldSeed, water.id, at, weatherTable(water, season))
}

export function forecastFor(worldSeed: string, content: IdleAnglerCatalog, waterId: WaterId, at: number): Weather {
  const water = content.waters.find((w) => w.id === waterId)
  if (!water) throw new Error(`unknown water ${waterId}`)
  return forecast(worldSeed, water, at, content)
}
