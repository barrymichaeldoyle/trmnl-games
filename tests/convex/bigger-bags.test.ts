// @vitest-environment edge-runtime
import { convexTest } from 'convex-test'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { api } from '@trmnl-games/backend/api'
import type { Id } from '@trmnl-games/backend/data-model'
import { contentV1 } from '@trmnl-games/desk-crawler/content/v1'
import { BATCH_ITEMS } from '@trmnl-games/desk-crawler/sim/core/limits'
import { starterKit } from '@trmnl-games/desk-crawler/sim/core/starter'
import schema from '../../apps/backend/convex/schema'
import { seedHero, seedWorld, type T } from './helpers'

const modules = import.meta.glob('../../apps/backend/convex/**/*.ts')
const SLOT = Date.UTC(2026, 9, 13, 10, 0, 2)
let op = 0
const opId = () => `bigbag-${String(++op).padStart(6, '0')}`
const as = (t: T, alias: string) => t.withIdentity({ issuer: 'issuer', subject: alias })

async function errorCode(promise: Promise<unknown>): Promise<string | undefined> {
  try {
    await promise
    return undefined
  } catch (error) {
    return (error as { data?: { code?: string } }).data?.code
  }
}

async function addGear(t: T, heroId: Id<'heroes'>, count: number): Promise<Id<'items'>[]> {
  return await t.run(async (ctx) => {
    const ids: Id<'items'>[] = []
    for (let i = 0; i < count; i += 1) ids.push(await ctx.db.insert('items', { ...starterKit(contentV1).weapon, heroId, createdAt: Date.now() }))
    return ids
  })
}

describe('bigger bags (D146, content v22)', () => {
  let t: T
  beforeEach(async () => {
    vi.useFakeTimers()
    vi.setSystemTime(SLOT)
    t = convexTest(schema, modules)
    await seedWorld(t, { activeContentVersion: 'v22', currentTick: 1, lastPublishedAt: SLOT - 30 * 60_000 })
  })
  afterEach(() => vi.useRealTimers())

  it('sells the three new tiers in order above the Rolling Suitcase', async () => {
    const heroId = await seedHero(t, { gold: 34_000, bagCapacity: 20 }, 'Ana')
    const user = as(t, 'Ana')
    expect((await user.query(api.inventory.mine, {})).ladder).toMatchObject({ name: 'Rolling Suitcase', next: { id: 'gym_duffel', capacity: 24, price: 4000, buyable: true, lockedUntilLevel: null } })
    expect(await errorCode(user.mutation(api.inventory.buyBag, { operationId: opId(), tierId: 'steamer_trunk' }))).toBe('BAG_UNAVAILABLE')
    expect(await user.mutation(api.inventory.buyBag, { operationId: opId(), tierId: 'gym_duffel' })).toMatchObject({ changed: true, gold: -4000, count: 24 })
    expect(await user.mutation(api.inventory.buyBag, { operationId: opId(), tierId: 'steamer_trunk' })).toMatchObject({ changed: true, gold: -10000, count: 28 })
    expect(await user.mutation(api.inventory.buyBag, { operationId: opId(), tierId: 'stationery_cupboard' })).toMatchObject({ changed: true, gold: -20000, count: 32 })
    expect(await t.run(async (ctx) => await ctx.db.get(heroId))).toMatchObject({ bagCapacity: 32, gold: 0 })
    expect((await user.query(api.inventory.mine, {})).ladder.next).toBeNull()
  })

  it('reads a full 32-slot bag and sells all of it in one intent, but no more', async () => {
    const heroId = await seedHero(t, { bagCapacity: 32 }, 'Ben')
    const ids = await addGear(t, heroId, BATCH_ITEMS + 1)
    const user = as(t, 'Ben')
    const view = await user.query(api.inventory.mine, {})
    expect(view).toMatchObject({ capacity: 32, used: BATCH_ITEMS + 1 })
    expect(await errorCode(user.mutation(api.inventory.sellMany, { operationId: opId(), itemIds: ids }))).toBe('INVALID_INPUT')
    expect(await user.mutation(api.inventory.sellMany, { operationId: opId(), itemIds: ids.slice(0, BATCH_ITEMS) })).toMatchObject({ changed: true, count: BATCH_ITEMS })
  })
})
