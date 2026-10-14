// @vitest-environment edge-runtime
import { convexTest } from 'convex-test'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { internal } from '@trmnl-games/backend/api'
import schema from '../../apps/backend/convex/schema'
import { INSTALL_ATTEMPT_MS } from '../../apps/backend/convex/trmnl'
import { seedHero, seedWorld, type T } from './helpers'

const modules = import.meta.glob('../../apps/backend/convex/**/*.ts')
const NOW = Date.UTC(2026, 9, 13, 18)
const HOUR = 3_600_000

describe('install summary', () => {
  let t: T
  beforeEach(async () => {
    vi.useFakeTimers()
    vi.setSystemTime(NOW)
    t = convexTest(schema, modules)
    await seedWorld(t)
  })
  afterEach(() => { vi.useRealTimers() })

  it('counts connects by game and outcome inside the window only', async () => {
    const heroId = await seedHero(t)
    await t.run(async (ctx) => {
      const userId = (await ctx.db.get(heroId))!.userId
      const grantId = await ctx.db.insert('trmnlGrants', { userId, tokenHash: 'h', state: 'active', createdAt: NOW })
      const attempt = (createdAt: number, state: 'pending' | 'completed' | 'expired', gameSlug?: 'idle-angler') =>
        ctx.db.insert('trmnlInstallAttempts', { userId, grantId, state, createdAt, expiresAt: createdAt + INSTALL_ATTEMPT_MS, ...(gameSlug ? { gameSlug } : {}) })
      await attempt(NOW - 2 * HOUR, 'completed')
      await attempt(NOW - 3 * HOUR, 'pending') // window closed without a Save
      await attempt(NOW - 4 * HOUR, 'expired') // replaced by a later connect
      await attempt(NOW - 5 * 60_000, 'pending') // still inside its window
      await attempt(NOW - HOUR, 'completed', 'idle-angler')
      await attempt(NOW - 30 * HOUR, 'completed') // outside the window
    })
    const summary = await t.query(internal.trmnl.installSummary, {})
    expect(summary).toEqual(expect.arrayContaining([
      { game: 'desk-crawler', connected: 4, saved: 1, waiting: 1, notSaved: 2, players: 1 },
      { game: 'idle-angler', connected: 1, saved: 1, waiting: 0, notSaved: 0, players: 1 },
    ]))
    expect(summary).toHaveLength(2)
    expect(await t.query(internal.trmnl.installSummary, { hours: 48 })).toContainEqual({ game: 'desk-crawler', connected: 5, saved: 2, waiting: 1, notSaved: 2, players: 1 })
  })
})
