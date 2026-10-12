import { convexTest } from 'convex-test'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { api } from '@trmnl-games/backend/api'
import type { Id } from '@trmnl-games/backend/data-model'
import { cumulativeXpToReach, maxHp } from '@trmnl-games/desk-crawler/sim/core/stats'
import schema from '../../apps/backend/convex/schema'
import { runTick, seedHero, seedWorld, type T } from './helpers'

const modules = import.meta.glob('../../apps/backend/convex/**/*.ts')
/** 10:00 UTC on 2026-10-12, two seconds into the slot. */
const SLOT = Date.UTC(2026, 9, 12, 10, 0, 2)
const as = (t: T, alias: string) => t.withIdentity({ issuer: 'issuer', subject: alias })
const heroDoc = (t: T, heroId: Id<'heroes'>) => t.run(async (ctx) => (await ctx.db.get(heroId))!)

async function tickAt(t: T, slot: number) {
  vi.setSystemTime(SLOT + slot * 15 * 60_000)
  await runTick(t)
}

describe('the Archive and field notes backend (D133)', () => {
  let t: T
  beforeEach(() => {
    vi.useFakeTimers()
    vi.setSystemTime(SLOT)
    t = convexTest(schema, modules)
  })
  afterEach(() => {
    vi.useRealTimers()
    vi.unstubAllEnvs()
  })

  it('keeps the arrival count across ticks and opens the floor note in heroes.mine', { timeout: 30_000 }, async () => {
    await seedWorld(t, { activeContentVersion: 'v16', currentTick: 10 })
    const heroId = await seedHero(t, { level: 12, xp: 0, lifetimeXp: cumulativeXpToReach(12), hp: maxHp(12), biomeId: 'cafeteria_depths', status: 'travelling', targetBiomeId: 'archive', arriveAtTick: 11 }, 'Ana')
    const before = await as(t, 'Ana').query(api.heroes.mine, {})
    expect(before.biomes.map((b: { id: string; unlocked: boolean }) => [b.id, b.unlocked])).toEqual([['office_cubicles', true], ['server_room', true], ['cafeteria_depths', true], ['archive', true], ['parking_garage', false]])
    expect(before.lore.total).toBe(25)
    expect(before.lore.biomes.find((b: { id: string }) => b.id === 'archive').open).toBe(false)
    await tickAt(t, 0)
    let hero = await heroDoc(t, heroId)
    expect(hero.biomeId).toBe('archive')
    expect(hero.counters.biomesVisited).toEqual({ archive: 1 })
    // Three more ticks on the floor: the record survives the adapter's counter defaults on every evaluation.
    for (let slot = 1; slot <= 3; slot += 1) await tickAt(t, slot)
    hero = await heroDoc(t, heroId)
    expect(hero.counters.biomesVisited).toEqual({ archive: 1 })
    const after = await as(t, 'Ana').query(api.heroes.mine, {})
    const archive = after.lore.biomes.find((b: { id: string }) => b.id === 'archive')
    expect(archive.open).toBe(true)
    expect(archive.note).toMatch(/RECORDS/)
    expect(archive.monsters).toHaveLength(4)
    // Seeded straight into the Cafeteria with no wins, so only the Archive is open: a real hero has Office wins from level 1.
    expect(after.lore.biomes.find((b: { id: string }) => b.id === 'office_cubicles').open).toBe(false)
  })
})
