import type { Id } from '@trmnl-games/backend/data-model'
import { contentV1 } from '@trmnl-games/pixel-wars/content'
import { zeroCounters, type FactionId } from '@trmnl-games/pixel-wars/sim'
import { vi } from 'vitest'
import { internal } from '@trmnl-games/backend/api'
import type { T } from './helpers'
import { PIXEL_WARS_RUNTIME } from '../../apps/backend/convex/pixelWars/runtime'
import { placeDesk } from '../../apps/backend/convex/pixelWars/maps'
import { readEngineWorld } from '../../apps/backend/convex/lib/engine/world'
import { typedTables } from '../../apps/backend/convex/lib/engine/runtime'

let counter = 0

/** An activated desk with a profile and an owner, on the global map in `faction` (0 leaves it unplaced), ready for the next tick. */
export async function seedDesk(t: T, faction: FactionId | 0 = 1, alias = `Desk${++counter}`, overrides: Record<string, unknown> = {}, invitedBy?: Id<'desks'>): Promise<Id<'desks'>> {
  await ensureSeededWorld(t)
  return await t.run(async (ctx) => {
    const now = Date.now() - 60_000
    const existing = await ctx.db.query('users').withIndex('by_tokenIdentifier', (q) => q.eq('tokenIdentifier', `issuer|${alias}`)).unique()
    const userId = existing?._id ?? (await ctx.db.insert('users', { tokenIdentifier: `issuer|${alias}`, publicAlias: alias, normalizedAlias: alias.toLowerCase(), timezone: 'UTC', state: 'active', createdAt: now, publicNameVersion: 1, trmnlUtcOffset: 0 }))
    const deskId = await ctx.db.insert('desks', {
      userId,
      createdAt: now - counter,
      isActive: true,
      activationState: 'active',
      activatedAt: now - counter,
      faction: 0,
      level: 1,
      xp: 0,
      lifetimeXp: 0,
      lastLevelUpTick: 0,
      scoreHourXp: 0,
      counters: zeroCounters(),
      week: { painted: 0, flipped: 0, desksTaken: 0, liberated: 0, lost: 0, fell: 0, refunded: 0 },
      goal: { rung: 0 },
      well: { drops: contentV1.wellCap, tick: 0 },
      seasonWeek: 0,
      inviteCode: `code${alias.toLowerCase()}`,
      ...(invitedBy === undefined ? {} : { invitedBy }),
      eligibleFromTick: 1,
      lastTick: 0,
      lastProgressTick: 0,
      logSequence: 1,
      simulationState: 'healthy',
      ...overrides,
    })
    await ctx.db.insert('pixelWarsProfiles', { userId, state: 'active', deskId, createdAt: now })
    if (faction !== 0) await placeDesk(ctx, (await ctx.db.get(deskId))!, faction, Date.now())
    return deskId
  })
}

export async function runPixelWarsTick(t: T) {
  await ensureSeededWorld(t)
  const runId = await t.mutation(internal.pixelWars.tick.startTick, {})
  await t.finishAllScheduledFunctions(vi.runAllTimers)
  return runId
}

/** Advance the clock one slot (15 minutes) and run the tick. */
export async function nextPixelWarsTick(t: T) {
  vi.advanceTimersByTime(15 * 60_000)
  return await runPixelWarsTick(t)
}

export const deskOf = async (t: T, id: Id<'desks'>) => (await t.run(async (ctx) => await ctx.db.get(id)))!
export const globalMap = async (t: T) => (await t.run(async (ctx) => await ctx.db.query('pwMaps').withIndex('by_kind', (q) => q.eq('kind', 'global')).unique()))!

async function ensureSeededWorld(t: T) {
  await t.run(async (ctx) => {
    if (await readEngineWorld(ctx, PIXEL_WARS_RUNTIME)) return
    await ctx.db.insert(typedTables(PIXEL_WARS_RUNTIME).world, {
      key: 'world',
      currentTick: 0,
      activeContentVersion: PIXEL_WARS_RUNTIME.initialContentVersion,
      activeSimulationVersion: PIXEL_WARS_RUNTIME.simulationVersion,
      worldSeed: '5eed5eed5eed5eed5eed5eed5eed5eed',
      ticksPaused: false,
      maintenanceMode: false,
      createdAt: Date.now(),
      schemaVersion: 1,
    })
  })
}
