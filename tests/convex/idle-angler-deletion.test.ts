// @vitest-environment edge-runtime
import { convexTest } from 'convex-test'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { api, internal } from '@trmnl-games/backend/api'
import schema from '../../apps/backend/convex/schema'
import { sha256Hex } from '../../apps/backend/convex/lib/hash'
import { seedDeletionConfirmation, seedWorld, type T } from './helpers'
import { nextIdleAnglerTick, runIdleAnglerTick } from './idleAnglerHelpers'

const modules = import.meta.glob('../../apps/backend/convex/**/*.ts')
const DC_UUID = 'dddddddd-1111-4aed-8464-bad68368e97c'
const IA_UUID = 'cccccccc-2222-4aed-8464-bad68368e97c'

const screen = (t: T, token: string, uuid: string, path: string) =>
  t.fetch(path, { method: 'POST', headers: { Authorization: `Bearer ${token}`, 'Content-Type': 'application/x-www-form-urlencoded' }, body: new URLSearchParams({ user_uuid: uuid }).toString() })

/** Ana plays both games, each on its own installation, with a few Idle Angler ticks behind her. */
async function bothGames(t: T) {
  await t.mutation(internal.trmnl.linkInstall, { gameSlug: 'desk-crawler', tokenIdentifier: 'issuer|Ana', tokenHash: sha256Hex('dc-token-ana'), publicAlias: 'Ana', heroName: 'Baz', timezone: 'UTC' })
  await t.mutation(internal.trmnl.confirmInstance, { gameSlug: 'desk-crawler', tokenHash: sha256Hex('dc-token-ana'), uuid: DC_UUID, confirmedBy: 'success_callback' })
  await t.mutation(internal.trmnl.linkInstall, { gameSlug: 'idle-angler', tokenIdentifier: 'issuer|Ana', tokenHash: sha256Hex('ia-token-ana'), publicAlias: 'Ana', timezone: 'UTC' })
  await t.mutation(internal.trmnl.confirmInstance, { gameSlug: 'idle-angler', tokenHash: sha256Hex('ia-token-ana'), uuid: IA_UUID, confirmedBy: 'success_callback' })
  for (let i = 0; i < 6; i += 1) await nextIdleAnglerTick(t)
}

describe('Idle Angler deletion (D115, S2)', () => {
  let t: T
  beforeEach(async () => {
    vi.useFakeTimers()
    vi.setSystemTime(Date.UTC(2026, 10, 2, 6, 5, 3))
    vi.stubEnv('CLERK_SECRET_KEY', 'sk_test_fake')
    vi.stubGlobal('fetch', vi.fn(async () => new Response(null, { status: 200 })))
    t = convexTest(schema, modules)
    await seedWorld(t)
    await runIdleAnglerTick(t)
    // These tests play Idle Angler as an ordinary player, so the game is live.
    await t.mutation(internal.platform.setGameStatusInternal, { slug: 'idle-angler', status: 'live' })
  })
  afterEach(() => {
    vi.useRealTimers()
    vi.unstubAllGlobals()
    vi.unstubAllEnvs()
  })
  const ana = () => t.withIdentity({ issuer: 'issuer', subject: 'Ana' })

  it('deletes Idle Angler progress alone and leaves Desk Crawler playing', async () => {
    await bothGames(t)
    await ana().mutation(api.deletion.requestGameDeletion, { operationId: 'del-ia-0001', confirm: 'DELETE', gameSlug: 'idle-angler' })
    // Authority goes at once.
    expect((await screen(t, 'ia-token-ana', IA_UUID, '/trmnl/idle-angler/v1/screen')).status).toBe(404)
    expect(await ana().mutation(api.idleAngler.anglers.pause, { operationId: 'pause-ia-01' })).toMatchObject({ ok: false })
    await t.finishAllScheduledFunctions(vi.runAllTimers)
    const state = await t.run(async (ctx) => ({
      anglers: await ctx.db.query('anglers').collect(),
      catches: await ctx.db.query('catches').collect(),
      logs: await ctx.db.query('iaTickLogs').collect(),
      records: await ctx.db.query('iaCatchRecords').collect(),
      profile: await ctx.db.query('idleAnglerProfiles').first(),
      heroes: await ctx.db.query('heroes').collect(),
      grants: await ctx.db.query('trmnlGrants').collect(),
      revoked: (await ctx.db.query('revokedTrmnlCredentials').collect()).map((r) => r.tokenHash),
    }))
    expect(state).toMatchObject({ anglers: [], catches: [], logs: [], records: [], profile: { state: 'active' }, revoked: [sha256Hex('ia-token-ana')] })
    expect(state.heroes).toHaveLength(1)
    expect(state.grants.map((g) => g.gameSlug)).toEqual(['desk-crawler'])
    expect((await screen(t, 'dc-token-ana', DC_UUID, '/trmnl/v1/screen')).status).toBe(200)
  })

  it('deletes Desk Crawler progress without cutting off the Idle Angler plugin', async () => {
    await bothGames(t)
    await ana().mutation(api.deletion.requestGameDeletion, { operationId: 'del-dc-0001', confirm: 'DELETE' })
    await t.finishAllScheduledFunctions(vi.runAllTimers)
    const state = await t.run(async (ctx) => ({
      heroes: await ctx.db.query('heroes').collect(),
      anglers: await ctx.db.query('anglers').collect(),
      grants: (await ctx.db.query('trmnlGrants').collect()).map((g) => g.gameSlug),
      instances: (await ctx.db.query('trmnlInstances').collect()).map((i) => i.gameSlug),
    }))
    expect(state).toMatchObject({ heroes: [], grants: ['idle-angler'], instances: ['idle-angler'] })
    expect(state.anglers).toHaveLength(1)
    expect((await screen(t, 'ia-token-ana', IA_UUID, '/trmnl/idle-angler/v1/screen')).status).toBe(200)
  })

  it('purges the angler and its profile with the whole account', async () => {
    await bothGames(t)
    await ana().mutation(api.deletion.requestDeletion, { operationId: 'del-acct-001', confirm: 'DELETE', token: await seedDeletionConfirmation(t, 'Ana') })
    await t.finishAllScheduledFunctions(vi.runAllTimers)
    const left = await t.run(async (ctx) => ({
      users: await ctx.db.query('users').collect(),
      anglers: await ctx.db.query('anglers').collect(),
      catches: await ctx.db.query('catches').collect(),
      logs: await ctx.db.query('iaTickLogs').collect(),
      records: await ctx.db.query('iaCatchRecords').collect(),
      profiles: await ctx.db.query('idleAnglerProfiles').collect(),
      grants: await ctx.db.query('trmnlGrants').collect(),
    }))
    expect(left).toEqual({ users: [], anglers: [], catches: [], logs: [], records: [], profiles: [], grants: [] })
  })
})

describe('Idle Angler alerts across games (D115, S6)', () => {
  it('keeps shared devices when one game is deleted while the other still plays', async () => {
    vi.useFakeTimers()
    vi.setSystemTime(Date.UTC(2026, 10, 2, 6, 5, 3))
    vi.stubEnv('CLERK_SECRET_KEY', 'sk_test_fake')
    vi.stubGlobal('fetch', vi.fn(async () => new Response(null, { status: 200 })))
    const t = convexTest(schema, modules)
    await seedWorld(t)
    await runIdleAnglerTick(t)
    await t.mutation(internal.platform.setGameStatusInternal, { slug: 'idle-angler', status: 'live' })
    await bothGames(t)
    const ana = t.withIdentity({ issuer: 'issuer', subject: 'Ana' })
    await ana.mutation(api.alerts.subscribe, { operationId: 'sub-000001', endpoint: 'https://push.example/ana', p256dh: 'BKey', auth: 'Auth', label: 'Phone' })
    await ana.mutation(api.alerts.setPreferences, { operationId: 'pref-00001', asleep: true, merchant: false, quietStart: 21, quietEnd: 8, timezone: 'UTC' })
    // The Idle Angler card sends only its own switches; Desk Crawler's stay on.
    await ana.mutation(api.alerts.setPreferences, { operationId: 'pref-00002', coolerFull: true, baitOut: true, quietStart: 21, quietEnd: 8, timezone: 'UTC' })
    expect((await t.run(async (ctx) => await ctx.db.query('users').first()))!.alerts).toMatchObject({ asleep: true, merchant: false, coolerFull: true, baitOut: true })
    await ana.mutation(api.deletion.requestGameDeletion, { operationId: 'del-dc-0002', confirm: 'DELETE' })
    await t.finishAllScheduledFunctions(vi.runAllTimers)
    const after = await t.run(async (ctx) => ({ user: await ctx.db.query('users').first(), devices: await ctx.db.query('pushSubscriptions').collect() }))
    expect(after.devices).toHaveLength(1)
    expect(after.user!.alerts).toMatchObject({ asleep: false, merchant: false, coolerFull: true, baitOut: true })
    vi.useRealTimers()
    vi.unstubAllGlobals()
    vi.unstubAllEnvs()
  })
})
