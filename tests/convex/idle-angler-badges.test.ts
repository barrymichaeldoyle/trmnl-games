// @vitest-environment edge-runtime
import { convexTest } from 'convex-test'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { api } from '@trmnl-games/backend/api'
import schema from '../../apps/backend/convex/schema'
import { BADGES_RELEASED_AT } from '../../apps/backend/convex/idleAngler/badges'
import type { T } from './helpers'
import { seedAngler } from './idleAnglerHelpers'

const modules = import.meta.glob('../../apps/backend/convex/**/*.ts')
const NOW = BADGES_RELEASED_AT + 3 * 3_600_000

describe('Idle Angler new badges (P48 B3)', () => {
  let t: T
  beforeEach(() => {
    vi.useFakeTimers()
    vi.setSystemTime(NOW)
    t = convexTest(schema, modules)
  })
  afterEach(() => vi.useRealTimers())

  const unlock = (anglerId: string, achievementId: string, unlockedAt: number) =>
    t.run(async (ctx) => {
      const angler = (await ctx.db.get(anglerId as never)) as { userId: never }
      await ctx.db.insert('iaAchievements', { userId: angler.userId, anglerId: anglerId as never, achievementId, unlockedAt, tick: 1, catalogVersion: 6 })
    })

  it('shows only what came after the release to an angler with no marker, best first', async () => {
    const anglerId = await seedAngler(t, {}, 'Wren')
    await unlock(anglerId, 'catches_3', BADGES_RELEASED_AT - 1000)
    await unlock(anglerId, 'first_perch', NOW - 2000)
    await unlock(anglerId, 'specimen_perch', NOW - 3000)
    const wren = t.withIdentity({ issuer: 'issuer', subject: 'Wren' })
    const fresh = await wren.query(api.idleAngler.badges.fresh, {})
    // The specimen finishes the perch family, so it leads even though it is older; catches_3 predates the release.
    expect(fresh!.badges.map((b) => b.id)).toEqual(['specimen_perch', 'first_perch'])
    expect(fresh!.newest).toBe(NOW - 2000)
  })

  it('marks seen once, never past what was shown, so a later unlock still celebrates', async () => {
    const anglerId = await seedAngler(t, {}, 'Bram')
    await unlock(anglerId, 'catches_1', NOW - 5000)
    const bram = t.withIdentity({ issuer: 'issuer', subject: 'Bram' })
    const shown = (await bram.query(api.idleAngler.badges.fresh, {}))!.newest
    await unlock(anglerId, 'got_away_1', NOW - 1000)
    expect(await bram.mutation(api.idleAngler.badges.markSeen, { operationId: 'seen-0001', upTo: shown })).toMatchObject({ changed: true })
    expect((await bram.query(api.idleAngler.badges.fresh, {}))!.badges.map((b) => b.id)).toEqual(['got_away_1'])
    // A second tab dismissing the same card changes nothing.
    expect(await bram.mutation(api.idleAngler.badges.markSeen, { operationId: 'seen-0002', upTo: shown })).toMatchObject({ changed: false })
    // A marker in the future is held to now.
    await bram.mutation(api.idleAngler.badges.markSeen, { operationId: 'seen-0003', upTo: NOW + 864e5 })
    expect(await t.run(async (ctx) => (await ctx.db.get(anglerId))!.achievementsSeenAt)).toBe(NOW)
    expect((await bram.query(api.idleAngler.badges.fresh, {}))!.badges).toEqual([])
  })

  it('shows nothing to someone else, or to a visitor', async () => {
    const anglerId = await seedAngler(t, {}, 'Tess')
    await unlock(anglerId, 'catches_1', NOW - 5000)
    await seedAngler(t, {}, 'Mo')
    expect((await t.withIdentity({ issuer: 'issuer', subject: 'Mo' }).query(api.idleAngler.badges.fresh, {}))!.badges).toEqual([])
    expect(await t.query(api.idleAngler.badges.fresh, {})).toBeNull()
  })
})
