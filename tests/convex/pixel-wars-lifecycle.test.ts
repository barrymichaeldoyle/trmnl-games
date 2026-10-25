// @vitest-environment edge-runtime
import { convexTest } from 'convex-test'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { api, internal } from '@trmnl-games/backend/api'
import schema from '../../apps/backend/convex/schema'
import { sha256Hex } from '../../apps/backend/convex/lib/hash'
import { seedWorld, type T } from './helpers'
import { globalMap, nextPixelWarsTick, runPixelWarsTick, seedDesk } from './pixelWarsHelpers'

const modules = import.meta.glob('../../apps/backend/convex/**/*.ts')
const UUID = 'eeeeeeee-4444-4aed-8464-bad68368e97c'
let op = 0
const next = () => `pw-life-${String(++op).padStart(4, '0')}`

describe('Pixel Wars lifecycle and deletion (D214, W2)', () => {
  let t: T
  beforeEach(async () => {
    vi.useFakeTimers()
    vi.setSystemTime(Date.UTC(2026, 9, 19, 10, 3, 3))
    vi.stubEnv('CLERK_SECRET_KEY', 'sk_test_fake')
    vi.stubGlobal('fetch', vi.fn(async () => new Response(null, { status: 200 })))
    t = convexTest(schema, modules)
    await seedWorld(t)
    await t.mutation(internal.platform.setGameStatusInternal, { slug: 'pixel-wars', status: 'live' })
  })
  afterEach(() => {
    vi.useRealTimers()
    vi.unstubAllEnvs()
    vi.unstubAllGlobals()
  })

  it('prepares a pending desk at install, places it when a side is chosen after activation, and ticks it from then on', async () => {
    await t.mutation(internal.trmnl.linkInstall, { gameSlug: 'pixel-wars', tokenIdentifier: 'issuer|Ana', tokenHash: sha256Hex('pw-token-ana'), publicAlias: 'Ana', timezone: 'UTC' })
    const pending = await t.run(async (ctx) => await ctx.db.query('desks').first())
    expect(pending).toMatchObject({ activationState: 'pending_trmnl', faction: 0 })
    expect(pending!.seat).toBeUndefined()
    const me = t.withIdentity({ issuer: 'issuer', subject: 'Ana' })
    // Before a side is chosen the view offers all four, open.
    const before = await me.query(api.pixelWars.desks.view, {})
    expect(before.desk.placed).toBe(false)
    expect(before.open.every((o: { open: boolean }) => o.open)).toBe(true)
    // Pending: the tick leaves it alone, and no orders can be placed.
    await runPixelWarsTick(t)
    expect((await t.run(async (ctx) => await ctx.db.query('desks').first()))!.lastTick).toBe(0)
    expect(await me.mutation(api.pixelWars.desks.queueOrder, { operationId: next(), x: 1, y: 0, kind: 'paint', drops: 1 })).toMatchObject({ ok: false, code: 'TRMNL_REQUIRED' })
    await t.mutation(internal.trmnl.confirmInstance, { gameSlug: 'pixel-wars', tokenHash: sha256Hex('pw-token-ana'), uuid: UUID, confirmedBy: 'success_callback' })
    expect(await t.run(async (ctx) => await ctx.db.query('desks').first())).toMatchObject({ activationState: 'active', faction: 0 })
    // Choosing a side puts the desk on the map at once.
    expect(await me.mutation(api.pixelWars.desks.chooseFaction, { operationId: next(), faction: 3 })).toMatchObject({ changed: true })
    const placed = await t.run(async (ctx) => await ctx.db.query('desks').first())
    expect(placed).toMatchObject({ faction: 3, seat: 1 })
    expect((await globalMap(t)).seats).toEqual([{ x: 0, y: 0, f: 3 }])
    expect(await me.mutation(api.pixelWars.desks.chooseFaction, { operationId: next(), faction: 2 })).toMatchObject({ ok: false })
    await nextPixelWarsTick(t)
    expect((await t.run(async (ctx) => await ctx.db.query('desks').first()))!.lastTick).toBe(2)
    const view = await me.query(api.pixelWars.desks.view, {})
    expect(view.desk.placed).toBe(true)
    expect(view.map.cells.length).toBe(9 * 2)
    // The game is live in this test, so the shared profile lists the desk.
    const profile = await t.query(api.platformProfile.view, { alias: 'Ana' })
    expect(profile.games.map((g: { slug: string }) => g.slug)).toEqual(['pixel-wars'])
    expect(profile.games[0].war.faction).toBe('Dots')
  })

  it('places an invited desk beside its inviter in the inviter’s faction, even a full one', async () => {
    await seedDesk(t, 1, 'Ana')
    await seedDesk(t, 1, 'Bo')
    await seedDesk(t, 1, 'Cy')
    const ana = await t.run(async (ctx) => (await ctx.db.query('desks').first())!)
    await t.mutation(internal.trmnl.linkInstall, { gameSlug: 'pixel-wars', tokenIdentifier: 'issuer|Dee', tokenHash: sha256Hex('pw-token-dee'), publicAlias: 'Dee', timezone: 'UTC' })
    await t.mutation(internal.trmnl.confirmInstance, { gameSlug: 'pixel-wars', tokenHash: sha256Hex('pw-token-dee'), uuid: UUID, confirmedBy: 'success_callback' })
    const dee = t.withIdentity({ issuer: 'issuer', subject: 'Dee' })
    // Ink holds every desk, so it is closed to choosers; the invite joins it anyway and lands beside Ana.
    expect(await dee.mutation(api.pixelWars.desks.chooseFaction, { operationId: next(), faction: 1 })).toMatchObject({ ok: false, message: expect.stringContaining('full') })
    expect(await dee.mutation(api.pixelWars.desks.chooseFaction, { operationId: next(), faction: 2, invite: ana.inviteCode })).toMatchObject({ changed: true })
    const map = await globalMap(t)
    const placed = map.seats[3]!
    expect(placed.f).toBe(1)
    expect(Math.max(Math.abs(placed.x - ana.seat!), Math.abs(placed.y))).toBeLessThanOrEqual(3)
    expect((await t.run(async (ctx) => (await ctx.db.get(ana._id))!)).counters.invitesPlaced).toBe(1)
  })

  it('deletes Pixel Wars progress on its own, leaving the account and the seat as cleared ground', async () => {
    await t.mutation(internal.trmnl.linkInstall, { gameSlug: 'pixel-wars', tokenIdentifier: 'issuer|Ana', tokenHash: sha256Hex('pw-token-ana'), publicAlias: 'Ana', timezone: 'UTC' })
    await t.mutation(internal.trmnl.confirmInstance, { gameSlug: 'pixel-wars', tokenHash: sha256Hex('pw-token-ana'), uuid: UUID, confirmedBy: 'success_callback' })
    const me = t.withIdentity({ issuer: 'issuer', subject: 'Ana' })
    await me.mutation(api.pixelWars.desks.chooseFaction, { operationId: next(), faction: 1 })
    await me.mutation(api.pixelWars.desks.queueOrder, { operationId: next(), x: 1, y: 0, kind: 'paint', drops: 2 })
    for (let i = 0; i < 3; i += 1) await nextPixelWarsTick(t)
    expect(await me.mutation(api.deletion.requestGameDeletion, { operationId: next(), confirm: 'DELETE', gameSlug: 'pixel-wars' })).toMatchObject({ changed: true })
    await t.finishAllScheduledFunctions(vi.runAllTimers)
    const left = await t.run(async (ctx) => ({
      desks: await ctx.db.query('desks').collect(),
      logs: await ctx.db.query('pwTickLogs').collect(),
      scores: await ctx.db.query('pwScoreWindows').collect(),
      achievements: await ctx.db.query('pwAchievements').collect(),
      user: await ctx.db.query('users').first(),
      profile: await ctx.db.query('pixelWarsProfiles').first(),
      map: await ctx.db.query('pwMaps').first(),
    }))
    expect(left.desks).toEqual([])
    expect(left.logs).toEqual([])
    expect(left.scores).toEqual([])
    expect(left.achievements).toEqual([])
    expect(left.user?.state).toBe('active')
    expect(left.profile).toMatchObject({ state: 'active' })
    expect(left.profile?.deskId).toBeUndefined()
    expect(left.map?.seats).toEqual([{ x: 0, y: 0, f: 0 }])
    expect(await me.query(api.pixelWars.desks.view, {})).toMatchObject({ desk: null })
  })
})
