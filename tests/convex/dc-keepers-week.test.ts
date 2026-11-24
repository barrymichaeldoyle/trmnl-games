// @vitest-environment edge-runtime
import { convexTest } from 'convex-test'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { api } from '@trmnl-games/backend/api'
import type { Id } from '@trmnl-games/backend/data-model'
import schema from '../../apps/backend/convex/schema'
import { contentV1 } from '@trmnl-games/desk-crawler/content/v1'
import { starterKit } from '@trmnl-games/desk-crawler/sim/core/starter'
import { keepsakeWeek } from '@trmnl-games/engine/calendar'
import { runTick, seedHero, seedWorld, world, type T } from './helpers'

const modules = import.meta.glob('../../apps/backend/convex/**/*.ts')
let op = 0
const opId = () => `kw-${String(++op).padStart(6, '0')}`
const as = (t: T, alias: string) => t.withIdentity({ issuer: 'issuer', subject: alias })

/** A starter weapon with the given attack and level requirement, in the hero's bag. */
async function addWeapon(t: T, heroId: Id<'heroes'>, attack: number, requiredLevel = 1): Promise<Id<'items'>> {
  return await t.run(async (ctx) => await ctx.db.insert('items', { ...starterKit(contentV1).weapon, attack, requiredLevel, saleValue: attack, heroId, createdAt: Date.now() }))
}

type Gear = { id: Id<'items'>; keeper: boolean }
type Bag = { gear: Gear[]; upgrades: { id: Id<'items'>; kind: string; delta: number }[]; keepPlan: { sell: { id: Id<'items'> }[] } | null }

describe('D248: spares that beat the worn piece', () => {
  let t: T
  beforeEach(async () => {
    vi.useFakeTimers()
    vi.setSystemTime(Date.UTC(2026, 9, 3, 10, 0, 2))
    t = convexTest(schema, modules)
    await seedWorld(t, { lastPublishedAt: Date.now() - 30 * 60_000 })
  })
  afterEach(() => vi.useRealTimers())

  it('marks the strongest spare and the strongest wearable one, and offers the wearable one to equip', async () => {
    const heroId = await seedHero(t, { level: 4, hp: 136 }, 'Ana')
    const worn = await t.run(async (ctx) => (await ctx.db.get((await ctx.db.get(heroId))!.weaponId!))!)
    const weaker = await addWeapon(t, heroId, worn.attack - 1)
    const better = await addWeapon(t, heroId, worn.attack + 2)
    const best = await addWeapon(t, heroId, worn.attack + 3)
    const later = await addWeapon(t, heroId, worn.attack + 9, 10)
    const bag = (await as(t, 'Ana').query(api.inventory.mine, {})) as Bag
    const keepers = new Set(bag.gear.filter((item) => item.keeper).map((item) => item.id))
    expect(keepers).toEqual(new Set([best, later]))
    expect(keepers.has(better) || keepers.has(weaker)).toBe(false)
    expect(bag.upgrades).toEqual([expect.objectContaining({ id: best, kind: 'weapon', delta: 3 })])
  })

  it('equips the offered pieces in one step and refuses a stale offer', async () => {
    const heroId = await seedHero(t, { level: 4, hp: 136 }, 'Ana')
    const worn = await t.run(async (ctx) => (await ctx.db.get((await ctx.db.get(heroId))!.weaponId!))!)
    const best = await addWeapon(t, heroId, worn.attack + 3)
    const user = as(t, 'Ana')
    expect(await user.mutation(api.inventory.equipBest, { operationId: opId(), itemIds: [best] })).toMatchObject({ changed: true, count: 1 })
    expect((await t.run(async (ctx) => await ctx.db.get(heroId)))?.weaponId).toBe(best)
    // The old weapon is now the weaker spare: it is no upgrade, so asking for it is refused.
    const stale = await user.mutation(api.inventory.equipBest, { operationId: opId(), itemIds: [worn._id] })
    expect(stale).toMatchObject({ ok: false, code: 'INVALID_STATE' })
    expect(((await user.query(api.inventory.mine, {})) as Bag).upgrades).toEqual([])
  })

  it('sells keepers last when a held find needs room', async () => {
    const heroId = await seedHero(t, { level: 4, hp: 136, status: 'exploring' }, 'Ana')
    const worn = await t.run(async (ctx) => (await ctx.db.get((await ctx.db.get(heroId))!.weaponId!))!)
    // The keeper is the cheapest piece by sale value, so before D248 it would have gone first.
    const keeper = await t.run(async (ctx) => await ctx.db.insert('items', { ...starterKit(contentV1).weapon, attack: worn.attack + 5, saleValue: 0, heroId, createdAt: Date.now() }))
    const capacity = (await t.run(async (ctx) => await ctx.db.get(heroId)))!.bagCapacity
    const fillers: Id<'items'>[] = []
    for (let i = 0; i < capacity; i += 1) fillers.push(await addWeapon(t, heroId, 1))
    await t.run(async (ctx) => await ctx.db.patch(heroId, { heldItemId: fillers.at(-1)! }))
    const plan = ((await as(t, 'Ana').query(api.inventory.mine, {})) as Bag).keepPlan
    expect(plan?.sell.length).toBeGreaterThan(0)
    expect(plan?.sell.map((item) => item.id)).not.toContain(keeper)
  })
})

describe('D249: last week on the Hero page', () => {
  let t: T
  const SUNDAY = Date.UTC(2026, 10, 22, 23, 45, 1)
  const MONDAY = Date.UTC(2026, 10, 23, 0, 45, 1)
  beforeEach(() => {
    vi.useFakeTimers()
    vi.setSystemTime(SUNDAY)
    t = convexTest(schema, modules)
  })
  afterEach(() => vi.useRealTimers())

  it('freezes the week’s final ranks when Monday publishes, shows them once and closes on Nice', async () => {
    await seedWorld(t, { lastPublishedAt: SUNDAY - 3_600_000 - 1000 })
    const heroId = await seedHero(t, {}, 'Ana')
    await seedHero(t, {}, 'Ben')
    await runTick(t)
    // Give Sunday's set a score as the week's XP would, so the hero has a week to report.
    const sunday = (await world(t))!.publishedPublicationId!
    await t.run(async (ctx) => {
      for (const row of await ctx.db.query('heroRanks').withIndex('by_publicationId', (q) => q.eq('publicationId', sunday)).collect()) {
        if (row.board === 'recent_7d') await ctx.db.patch(row._id, { score: row.heroId === heroId ? 900 : 400, rank: row.heroId === heroId ? 1 : 2 })
      }
    })
    vi.setSystemTime(MONDAY)
    await runTick(t)
    const week = keepsakeWeek(SUNDAY)
    const rows = await t.run(async (ctx) => await ctx.db.query('heroWeekResults').collect())
    expect(rows).toHaveLength(2)
    expect(rows.find((row) => row.heroId === heroId)).toMatchObject({ week, rank: 1, totalPlayers: 2, xp: 900 })

    const user = as(t, 'Ana')
    expect(await user.query(api.weekResults.mine, {})).toMatchObject({ week, rank: 1, of: 2, xp: 900, moved: null })
    expect(await user.mutation(api.weekResults.see, { operationId: opId(), week })).toMatchObject({ changed: true })
    expect(await user.query(api.weekResults.mine, {})).toBeNull()

    // A later publication in the same week freezes nothing new.
    vi.setSystemTime(MONDAY + 3_600_000)
    await runTick(t)
    expect(await t.run(async (ctx) => (await ctx.db.query('heroWeekResults').collect()).length)).toBe(2)
  })
})
