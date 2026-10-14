// @vitest-environment edge-runtime
import { convexTest } from 'convex-test'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { internal } from '@trmnl-games/backend/api'
import schema from '../../apps/backend/convex/schema'
import { sha256Hex } from '../../apps/backend/convex/lib/hash'
import { seedWorld, type T } from './helpers'
import { nextIdleAnglerTick, runIdleAnglerTick } from './idleAnglerHelpers'

const modules = import.meta.glob('../../apps/backend/convex/**/*.ts')
const DC_UUID = 'dddddddd-1111-4aed-8464-bad68368e97c'
const IA_UUID = 'cccccccc-2222-4aed-8464-bad68368e97c'

const screen = (t: T, token: string, uuid: string, path: string) =>
  t.fetch(path, { method: 'POST', headers: { Authorization: `Bearer ${token}`, 'Content-Type': 'application/x-www-form-urlencoded' }, body: new URLSearchParams({ user_uuid: uuid }).toString() })

describe('Rename to Idle Angler (D158)', () => {
  let t: T
  beforeEach(async () => {
    vi.useFakeTimers()
    vi.setSystemTime(Date.UTC(2026, 10, 2, 6, 5, 3))
    t = convexTest(schema, modules)
    await seedWorld(t)
    await runIdleAnglerTick(t)
    await t.mutation(internal.platform.setGameStatusInternal, { slug: 'idle-angler', status: 'live' })
    await t.mutation(internal.trmnl.linkInstall, { gameSlug: 'desk-crawler', tokenIdentifier: 'issuer|Ana', tokenHash: sha256Hex('dc-token-ana'), publicAlias: 'Ana', heroName: 'Baz', timezone: 'UTC' })
    await t.mutation(internal.trmnl.confirmInstance, { gameSlug: 'desk-crawler', tokenHash: sha256Hex('dc-token-ana'), uuid: DC_UUID, confirmedBy: 'success_callback' })
    await t.mutation(internal.trmnl.linkInstall, { gameSlug: 'idle-angler', tokenIdentifier: 'issuer|Ana', tokenHash: sha256Hex('ia-token-ana'), publicAlias: 'Ana', timezone: 'UTC' })
    await t.mutation(internal.trmnl.confirmInstance, { gameSlug: 'idle-angler', tokenHash: sha256Hex('ia-token-ana'), uuid: IA_UUID, confirmedBy: 'success_callback' })
    for (let i = 0; i < 4; i += 1) await nextIdleAnglerTick(t)
  })
  afterEach(() => {
    vi.useRealTimers()
  })

  it('serves the screen at the old plugin path until the plugin settings change', async () => {
    const response = await screen(t, 'ia-token-ana', IA_UUID, '/trmnl/slow-cast/v1/screen')
    expect(response.status).toBe(200)
    expect(await response.json()).toHaveProperty('merge_variables')
  })

  it('clears the old tables, every angler and the old slug, and leaves Desk Crawler alone', async () => {
    // Rows as the pre-rename deploy left them.
    await t.run(async (ctx) => {
      const user = await ctx.db.query('users').first()
      const runId = await ctx.db.insert('swSimulationRuns', { tick: 1, state: 'completed' })
      await ctx.db.insert('swWorldState', { key: 'world', currentTick: 1 })
      await ctx.db.insert('swTickLogs', { summary: 'You set up on the bank of the Millpond.' })
      await ctx.db.insert('slowCastProfiles', { userId: user!._id, state: 'active' })
      await ctx.db.insert('platformGames', { slug: 'slow-cast', status: 'hidden', updatedAt: 0 })
      await ctx.db.insert('trmnlGrants', { gameSlug: 'slow-cast', userId: user!._id, tokenHash: sha256Hex('old-token'), state: 'active', createdAt: 0 })
      await ctx.db.insert('operationReceipts', { scope: 'slow-cast', userId: user!._id, operationId: 'op', operation: 'slowCast.pause', argumentHash: 'h', result: { changed: true }, createdAt: 0, expiresAt: Date.now() + 60_000 })
      const pending = { state: 'pending' as const, attempts: 0 }
      await ctx.db.insert('operationalIncidents', { incidentKey: 'old', runId, state: 'open', openedAt: 0, alert: pending })
    })
    expect((await t.query(internal.idleAngler.legacyReset.check, {})).length).toBeGreaterThan(5)

    await t.mutation(internal.idleAngler.legacyReset.run, {})
    await t.finishAllScheduledFunctions(vi.runAllTimers)

    expect(await t.query(internal.idleAngler.legacyReset.check, {})).toEqual([])
    const left = await t.run(async (ctx) => ({
      anglers: (await ctx.db.query('anglers').collect()).length,
      revoked: (await ctx.db.query('revokedTrmnlCredentials').collect()).map((row) => row.tokenHash),
      grants: (await ctx.db.query('trmnlGrants').collect()).map((row) => row.gameSlug ?? 'desk-crawler'),
      games: (await ctx.db.query('platformGames').collect()).map((row) => row.slug),
    }))
    expect(left.anglers).toBe(0)
    expect(left.revoked.sort()).toEqual([sha256Hex('ia-token-ana'), sha256Hex('old-token')].sort())
    // An install made after the deploy goes with its angler; the status row under the new slug stays.
    expect(left.grants).toEqual(['desk-crawler'])
    expect(left.games).toEqual(['idle-angler'])
    expect((await screen(t, 'dc-token-ana', DC_UUID, '/trmnl/v1/screen')).status).toBe(200)
  })
})
