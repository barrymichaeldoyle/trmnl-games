// @vitest-environment edge-runtime
import { convexTest } from 'convex-test'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { api } from '@trmnl-games/backend/api'
import type { Id } from '@trmnl-games/backend/data-model'
import schema from '../../apps/backend/convex/schema'
import { runTick, seedHero, seedWorld, type T } from './helpers'

const modules = import.meta.glob('../../apps/backend/convex/**/*.ts')
const SLOT = Date.UTC(2026, 9, 11, 10, 0, 2)
let op = 0
const opId = () => `gold-${String(++op).padStart(6, '0')}`
const as = (t: T, alias: string) => t.withIdentity({ issuer: 'issuer', subject: alias })

async function errorCode(promise: Promise<unknown>): Promise<string | undefined> {
  try {
    await promise
    return undefined
  } catch (error) {
    return (error as { data?: { code?: string } }).data?.code
  }
}

const heroDoc = (t: T, heroId: Id<'heroes'>) => t.run(async (ctx) => await ctx.db.get(heroId))

describe('gold-only ladders (D122, content v10)', () => {
  let t: T
  beforeEach(async () => {
    vi.useFakeTimers()
    vi.setSystemTime(SLOT)
    t = convexTest(schema, modules)
    await seedWorld(t, { activeContentVersion: 'v10', currentTick: 1, lastPublishedAt: SLOT - 30 * 60_000 })
  })
  afterEach(() => vi.useRealTimers())

  it('sells every bag in order to a level-1 hero with the gold, naming the merchant discount', async () => {
    const heroId = await seedHero(t, { gold: 2000, bagCapacity: 10 }, 'Ana')
    const user = as(t, 'Ana')
    const view = await user.query(api.inventory.mine, {})
    expect(view.ladder).toMatchObject({ name: 'Tote Bag', findable: false, merchantDiscountPct: 25, next: { id: 'laptop_backpack', price: 100, buyable: true, lockedUntilLevel: null, milestoneLevel: null, milestoneAdventures: null } })
    // Out of order is refused; in order each rung opens the next at once.
    expect(await errorCode(user.mutation(api.inventory.buyBag, { operationId: opId(), tierId: 'messenger_bag' }))).toBe('BAG_UNAVAILABLE')
    expect(await user.mutation(api.inventory.buyBag, { operationId: opId(), tierId: 'laptop_backpack' })).toMatchObject({ changed: true, gold: -100, count: 13 })
    expect((await user.query(api.inventory.mine, {})).ladder.next).toMatchObject({ id: 'messenger_bag', buyable: true })
    expect(await user.mutation(api.inventory.buyBag, { operationId: opId(), tierId: 'messenger_bag' })).toMatchObject({ changed: true, gold: -300, count: 16 })
    expect(await user.mutation(api.inventory.buyBag, { operationId: opId(), tierId: 'rolling_suitcase' })).toMatchObject({ changed: true, gold: -1500, count: 20 })
    expect(await heroDoc(t, heroId)).toMatchObject({ bagCapacity: 20, gold: 100 })
    expect((await user.query(api.inventory.mine, {})).ladder.next).toBeNull()
  })

  it('sells every pouch in order too, and refuses one the hero cannot afford', async () => {
    const heroId = await seedHero(t, { gold: 500 }, 'Ben')
    const user = as(t, 'Ben')
    expect((await user.query(api.inventory.mine, {})).pouch).toMatchObject({ name: 'Thermos', cap: 20, findable: false, merchantDiscountPct: 25, next: { id: 'lunchbox', price: 120, buyable: true, lockedUntilLevel: null, milestoneLevel: null } })
    expect(await user.mutation(api.inventory.buyPouch, { operationId: opId(), tierId: 'lunchbox' })).toMatchObject({ changed: true, gold: -120, count: 30 })
    expect((await user.query(api.inventory.mine, {})).pouch.next).toMatchObject({ id: 'cooler_bag', price: 450, buyable: true })
    expect(await errorCode(user.mutation(api.inventory.buyPouch, { operationId: opId(), tierId: 'cooler_bag' }))).toBe('NOT_ENOUGH_GOLD')
    expect(await heroDoc(t, heroId)).toMatchObject({ potionCap: 30, gold: 380 })
  })

  it('hands a high-level hero nothing for free on a tick', async () => {
    const heroId = await seedHero(t, { level: 14, bagCapacity: 10, potionCap: 20 }, 'Cal')
    await runTick(t)
    expect(await heroDoc(t, heroId)).toMatchObject({ bagCapacity: 10, potionCap: 20 })
  })
})
