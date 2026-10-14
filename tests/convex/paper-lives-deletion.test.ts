// @vitest-environment edge-runtime
import { convexTest } from 'convex-test'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { api, internal } from '@trmnl-games/backend/api'
import schema from '../../apps/backend/convex/schema'
import { sha256Hex } from '../../apps/backend/convex/lib/hash'
import { seedDeletionConfirmation, seedWorld, type T } from './helpers'
import { runIdleAnglerTick } from './idleAnglerHelpers'
import { nextPaperLivesTick, runPaperLivesTick } from './paperLivesHelpers'

const modules = import.meta.glob('../../apps/backend/convex/**/*.ts')
const IA_UUID = 'cccccccc-2222-4aed-8464-bad68368e97c'
const PL_UUID = 'eeeeeeee-3333-4aed-8464-bad68368e97c'

const screen = (t: T, token: string, uuid: string, path: string) =>
  t.fetch(path, { method: 'POST', headers: { Authorization: `Bearer ${token}`, 'Content-Type': 'application/x-www-form-urlencoded' }, body: new URLSearchParams({ user_uuid: uuid }).toString() })

/** Ana plays Idle Angler and Paper Lives; her first life has ended, so there is a record and board rows. */
async function twoGames(t: T) {
  await t.mutation(internal.trmnl.linkInstall, { gameSlug: 'idle-angler', tokenIdentifier: 'issuer|Ana', tokenHash: sha256Hex('ia-token-ana'), publicAlias: 'Ana', timezone: 'UTC' })
  await t.mutation(internal.trmnl.confirmInstance, { gameSlug: 'idle-angler', tokenHash: sha256Hex('ia-token-ana'), uuid: IA_UUID, confirmedBy: 'success_callback' })
  await t.mutation(internal.trmnl.linkInstall, { gameSlug: 'paper-lives', tokenIdentifier: 'issuer|Ana', tokenHash: sha256Hex('pl-token-ana'), publicAlias: 'Ana', timezone: 'UTC' })
  await t.mutation(internal.trmnl.confirmInstance, { gameSlug: 'paper-lives', tokenHash: sha256Hex('pl-token-ana'), uuid: PL_UUID, confirmedBy: 'success_callback' })
  await t.run(async (ctx) => {
    const life = (await ctx.db.query('lives').first())!
    await ctx.db.patch(life._id, { life: { ...life.life, age: 100, stage: 'senior', stats: { ...life.life.stats, health: 0 } } })
  })
  for (let i = 0; i < 400 && (await t.run(async (ctx) => (await ctx.db.query('lives').first())!.life.status)) !== 'ended'; i += 1) await nextPaperLivesTick(t)
}

describe('Paper Lives deletion (D159, L2)', () => {
  let t: T
  beforeEach(async () => {
    vi.useFakeTimers()
    vi.setSystemTime(Date.UTC(2026, 10, 2, 6, 10, 3))
    vi.stubEnv('CLERK_SECRET_KEY', 'sk_test_fake')
    vi.stubGlobal('fetch', vi.fn(async () => new Response(null, { status: 200 })))
    t = convexTest(schema, modules)
    await seedWorld(t)
    await runIdleAnglerTick(t)
    await runPaperLivesTick(t)
    for (const slug of ['idle-angler', 'paper-lives'] as const) await t.mutation(internal.platform.setGameStatusInternal, { slug, status: 'live' })
  })
  afterEach(() => {
    vi.useRealTimers()
    vi.unstubAllGlobals()
    vi.unstubAllEnvs()
  })
  const ana = () => t.withIdentity({ issuer: 'issuer', subject: 'Ana' })

  it('deletes Paper Lives progress alone and leaves Idle Angler playing', async () => {
    await twoGames(t)
    expect(await t.run(async (ctx) => (await ctx.db.query('lifeRecords').collect()).length)).toBe(1)
    await ana().mutation(api.deletion.requestGameDeletion, { operationId: 'del-pl-0001', confirm: 'DELETE', gameSlug: 'paper-lives' })
    // Authority goes at once.
    expect((await screen(t, 'pl-token-ana', PL_UUID, '/trmnl/paper-lives/v1/screen')).status).toBe(404)
    await expect(ana().mutation(api.paperLives.lives.pause, { operationId: 'pause-pl-01' })).rejects.toThrow()
    await t.finishAllScheduledFunctions(vi.runAllTimers)
    const state = await t.run(async (ctx) => ({
      lives: await ctx.db.query('lives').collect(),
      logs: await ctx.db.query('plTickLogs').collect(),
      records: await ctx.db.query('lifeRecords').collect(),
      boards: await ctx.db.query('plLifeBoards').collect(),
      profile: await ctx.db.query('paperLivesProfiles').first(),
      anglers: await ctx.db.query('anglers').collect(),
      grants: (await ctx.db.query('trmnlGrants').collect()).map((g) => g.gameSlug),
      revoked: (await ctx.db.query('revokedTrmnlCredentials').collect()).map((r) => r.tokenHash),
    }))
    expect(state).toMatchObject({ lives: [], logs: [], records: [], boards: [], profile: { state: 'active' }, grants: ['idle-angler'], revoked: [sha256Hex('pl-token-ana')] })
    expect(state.anglers).toHaveLength(1)
    expect((await screen(t, 'ia-token-ana', IA_UUID, '/trmnl/idle-angler/v1/screen')).status).toBe(200)
  })

  it('purges the lives, records and profile with the whole account', async () => {
    await twoGames(t)
    await ana().mutation(api.deletion.requestDeletion, { operationId: 'del-acct-001', confirm: 'DELETE', token: await seedDeletionConfirmation(t, 'Ana') })
    await t.finishAllScheduledFunctions(vi.runAllTimers)
    const left = await t.run(async (ctx) => ({
      users: await ctx.db.query('users').collect(),
      lives: await ctx.db.query('lives').collect(),
      logs: await ctx.db.query('plTickLogs').collect(),
      records: await ctx.db.query('lifeRecords').collect(),
      boards: await ctx.db.query('plLifeBoards').collect(),
      profiles: await ctx.db.query('paperLivesProfiles').collect(),
      anglers: await ctx.db.query('anglers').collect(),
    }))
    expect(left).toEqual({ users: [], lives: [], logs: [], records: [], boards: [], profiles: [], anglers: [] })
  })
})
