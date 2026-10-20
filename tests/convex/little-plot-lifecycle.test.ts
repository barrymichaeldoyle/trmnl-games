// @vitest-environment edge-runtime
import { convexTest } from 'convex-test'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { api, internal } from '@trmnl-games/backend/api'
import schema from '../../apps/backend/convex/schema'
import { sha256Hex } from '../../apps/backend/convex/lib/hash'
import { seedWorld, type T } from './helpers'
import { nextLittlePlotTick, runLittlePlotTick } from './littlePlotHelpers'

const modules = import.meta.glob('../../apps/backend/convex/**/*.ts')
const UUID = 'dddddddd-4444-4aed-8464-bad68368e97c'

describe('Little Plot lifecycle and deletion (D206, G2)', () => {
  let t: T
  beforeEach(async () => {
    vi.useFakeTimers()
    vi.setSystemTime(Date.UTC(2026, 9, 19, 10, 12, 3))
    vi.stubEnv('CLERK_SECRET_KEY', 'sk_test_fake')
    vi.stubGlobal('fetch', vi.fn(async () => new Response(null, { status: 200 })))
    t = convexTest(schema, modules)
    await seedWorld(t)
    // Hidden games install for admins only (D115); the lifecycle under test is the live one.
    await t.mutation(internal.platform.setGameStatusInternal, { slug: 'little-plot', status: 'live' })
  })
  afterEach(() => {
    vi.useRealTimers()
    vi.unstubAllEnvs()
    vi.unstubAllGlobals()
  })

  it('prepares a pending plot at install, activates it on the saved callback, and ticks it from then on', async () => {
    await t.mutation(internal.trmnl.linkInstall, { gameSlug: 'little-plot', tokenIdentifier: 'issuer|Ana', tokenHash: sha256Hex('lp-token-ana'), publicAlias: 'Ana', timezone: 'UTC' })
    const pending = await t.run(async (ctx) => await ctx.db.query('plots').first())
    expect(pending).toMatchObject({ activationState: 'pending_trmnl' })
    expect(pending!.plot.beds.map((b) => b.kindId)).toEqual(['marigold', 'lettuce', 'radish', 'nasturtium'])
    const logs = await t.run(async (ctx) => await ctx.db.query('lpTickLogs').collect())
    expect(logs[0]!.summary).toContain("You've been given a little plot")
    // Pending: the tick leaves it alone.
    await runLittlePlotTick(t)
    expect((await t.run(async (ctx) => await ctx.db.query('plots').first()))!.lastTick).toBe(0)
    await t.mutation(internal.trmnl.confirmInstance, { gameSlug: 'little-plot', tokenHash: sha256Hex('lp-token-ana'), uuid: UUID, confirmedBy: 'success_callback' })
    const active = await t.run(async (ctx) => await ctx.db.query('plots').first())
    expect(active).toMatchObject({ activationState: 'active' })
    await nextLittlePlotTick(t)
    expect((await t.run(async (ctx) => await ctx.db.query('plots').first()))!.lastTick).toBe(2)
    // The companion view and the shared profile see the plot.
    const me = t.withIdentity({ issuer: 'issuer', subject: 'Ana' })
    const view = await me.query(api.littlePlot.plots.view, {})
    expect(view.plot.activationState).toBe('active')
    expect(view.plot.beds.length).toBe(4)
    // The game is live in this test, so the shared profile lists the plot: the catalogue count and the plot itself.
    const profile = await t.query(api.platformProfile.view, { alias: 'Ana' })
    expect(profile.games.map((g: { slug: string }) => g.slug)).toEqual(['little-plot'])
    expect(profile.games[0].plot.beds.length).toBe(4)
  })

  it('deletes Little Plot progress on its own, leaving the account, and the screen route answers not-found after', async () => {
    await t.mutation(internal.trmnl.linkInstall, { gameSlug: 'little-plot', tokenIdentifier: 'issuer|Ana', tokenHash: sha256Hex('lp-token-ana'), publicAlias: 'Ana', timezone: 'UTC' })
    await t.mutation(internal.trmnl.confirmInstance, { gameSlug: 'little-plot', tokenHash: sha256Hex('lp-token-ana'), uuid: UUID, confirmedBy: 'success_callback' })
    for (let i = 0; i < 5; i += 1) await nextLittlePlotTick(t)
    const me = t.withIdentity({ issuer: 'issuer', subject: 'Ana' })
    expect(await me.mutation(api.deletion.requestGameDeletion, { operationId: 'lp-delete-0001', confirm: 'DELETE', gameSlug: 'little-plot' })).toMatchObject({ changed: true })
    await t.finishAllScheduledFunctions(vi.runAllTimers)
    const left = await t.run(async (ctx) => ({
      plots: await ctx.db.query('plots').collect(),
      logs: await ctx.db.query('lpTickLogs').collect(),
      pool: await ctx.db.query('lpGnomePool').collect(),
      windows: await ctx.db.query('lpScoreWindows').collect(),
      profile: await ctx.db.query('littlePlotProfiles').first(),
      users: await ctx.db.query('users').collect(),
      grants: await ctx.db.query('trmnlGrants').collect(),
    }))
    expect(left.plots).toEqual([])
    expect(left.logs).toEqual([])
    expect(left.pool).toEqual([])
    expect(left.windows).toEqual([])
    expect(left.profile).toMatchObject({ state: 'active' })
    expect(left.profile!.plotId).toBeUndefined()
    expect(left.users.length).toBe(1)
    expect(left.grants.every((g) => g.state !== 'active')).toBe(true)
  })
})
