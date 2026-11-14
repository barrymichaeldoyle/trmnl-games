// @vitest-environment edge-runtime
import { convexTest } from 'convex-test'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { api } from '@trmnl-games/backend/api'
import schema from '../../apps/backend/convex/schema'
import { BADGES_RELEASED_AT } from '../../apps/backend/convex/badges'
import type { T } from './helpers'
import { seedHero } from './helpers'

const modules = import.meta.glob('../../apps/backend/convex/**/*.ts')
const NOW = BADGES_RELEASED_AT + 3 * 3_600_000

describe('Desk Crawler new badges (P49 C3)', () => {
  let t: T
  beforeEach(() => {
    vi.useFakeTimers()
    vi.setSystemTime(NOW)
    t = convexTest(schema, modules)
  })
  afterEach(() => vi.useRealTimers())

  const unlock = (heroId: string, achievementId: string, unlockedAt: number) =>
    t.run(async (ctx) => {
      const hero = (await ctx.db.get(heroId as never)) as { userId: never }
      await ctx.db.insert('heroAchievements', { userId: hero.userId, heroId: heroId as never, achievementId, unlockedAt, tick: 1, catalogVersion: 14 })
    })

  it('shows only what came after the release to a hero with no marker, best first', async () => {
    const heroId = await seedHero(t, {}, 'Wren')
    await unlock(heroId, 'adventures_2', BADGES_RELEASED_AT - 1000)
    await unlock(heroId, 'adventures_1', NOW - 2000)
    await unlock(heroId, 'office_census', NOW - 3000)
    const wren = t.withIdentity({ issuer: 'issuer', subject: 'Wren' })
    const fresh = await wren.query(api.badges.fresh, {})
    // Office Census is a one-tier family, finished, so it leads though older; adventures_2 predates the release.
    expect(fresh!.badges.map((b) => b.id)).toEqual(['office_census', 'adventures_1'])
    expect(fresh!.newest).toBe(NOW - 2000)
  })

  it('marks seen once, never past what was shown, so a later unlock still celebrates', async () => {
    const heroId = await seedHero(t, {}, 'Bram')
    await unlock(heroId, 'gold_1', NOW - 5000)
    const bram = t.withIdentity({ issuer: 'issuer', subject: 'Bram' })
    const shown = (await bram.query(api.badges.fresh, {}))!.newest
    await unlock(heroId, 'levels_1', NOW - 1000)
    expect(await bram.mutation(api.badges.markSeen, { operationId: 'seen-0001', upTo: shown })).toMatchObject({ changed: true })
    expect((await bram.query(api.badges.fresh, {}))!.badges.map((b) => b.id)).toEqual(['levels_1'])
    // A second tab dismissing the same card changes nothing.
    expect(await bram.mutation(api.badges.markSeen, { operationId: 'seen-0002', upTo: shown })).toMatchObject({ changed: false })
    // A marker in the future is held to now.
    await bram.mutation(api.badges.markSeen, { operationId: 'seen-0003', upTo: NOW + 864e5 })
    expect(await t.run(async (ctx) => (await ctx.db.get(heroId))!.achievementsSeenAt)).toBe(NOW)
    expect((await bram.query(api.badges.fresh, {}))!.badges).toEqual([])
  })

  it('shows nothing to someone else, or to a visitor', async () => {
    const heroId = await seedHero(t, {}, 'Tess')
    await unlock(heroId, 'gold_1', NOW - 5000)
    await seedHero(t, {}, 'Mo')
    expect((await t.withIdentity({ issuer: 'issuer', subject: 'Mo' }).query(api.badges.fresh, {}))!.badges).toEqual([])
    expect(await t.query(api.badges.fresh, {})).toBeNull()
  })
})
