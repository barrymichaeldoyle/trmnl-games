import { createRng, pickWeighted } from './rng'
import { deriveSharedSeed } from './seed'

/**
 * The shared forecast (idle-angler.md "Weather and the shared forecast", D162): one weighted draw per scope per
 * six-hour UTC block, hashed on the world seed, so everyone at one water, or one garden by that water, sees the same
 * sky. Lifted out of Idle Angler for Little Plot (P46), whose plot sits by the Millpond and reads the same function
 * with Idle Angler's world seed. Pure: the caller passes the moment in.
 */
const HOUR_MS = 3_600_000
export const FORECAST_BLOCK_MS = 6 * HOUR_MS

/** The forecast block a moment belongs to. */
export const forecastBlock = (at: number): number => Math.floor(at / FORECAST_BLOCK_MS)

/** The block's start, so a season can be read for the block rather than the moment. */
export const forecastBlockStart = (at: number): number => forecastBlock(at) * FORECAST_BLOCK_MS

/** The seed every draw at this scope shares for the block holding `at`. */
export const forecastSeed = (worldSeed: string, scopeId: string, at: number): number => deriveSharedSeed(worldSeed, scopeId, forecastBlock(at))

/** One weighted draw from the table with the block's shared seed: the same answer for every caller. */
export function drawForecast<W>(worldSeed: string, scopeId: string, at: number, table: ReadonlyArray<readonly [W, number]>): W {
  return pickWeighted(createRng(forecastSeed(worldSeed, scopeId, at)), table)
}
