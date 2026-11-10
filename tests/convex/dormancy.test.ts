import { convexTest } from 'convex-test'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { api, internal } from '@trmnl-games/backend/api'
import type { Id } from '@trmnl-games/backend/data-model'
import schema from '../../apps/backend/convex/schema'
import { sha256Hex } from '../../apps/backend/convex/lib/hash'
import { BACK_LINE, LIE_DOWN_LINE, LIE_DOWN_UNINSTALLED_LINE, QUIET_MS, quietVerdict, UNINSTALLED_QUIET_MS } from '../../apps/backend/convex/dormancy'
import { seedHero, seedWorld, type T } from './helpers'
import { seedAngler } from './idleAnglerHelpers'

// @vitest-environment edge-runtime

const modules = import.meta.glob('../../apps/backend/convex/**/*.ts')
const NOW = Date.UTC(2026, 10, 10, 12)
const DAY = 24 * 3_600_000
const UUID = 'aaaaaaaa-1111-4aed-8464-bad68368e97c'
const TOKEN = 'trmnl-ana-token'

type Slug = 'desk-crawler' | 'idle-angler'
async function installation(t: T, userId: Id<'users'>, served: number | undefined, state: 'active' | 'uninstalled' = 'active', slug: Slug = 'desk-crawler', uuid = UUID, token = TOKEN) {
  return await t.run(async (ctx) => {
    const grantId = await ctx.db.insert('trmnlGrants', { userId, tokenHash: sha256Hex(token), state: 'active', createdAt: NOW - 30 * DAY, ...(slug === 'idle-angler' ? { gameSlug: slug } : {}) })
    return await ctx.db.insert('trmnlInstances', { userId, grantId, uuid, state, confirmedBy: 'success_callback', createdAt: NOW - 30 * DAY, ...(served === undefined ? {} : { lastScreenServedAt: served }), ...(slug === 'idle-angler' ? { gameSlug: slug } : {}) })
  })
}
const ownerOf = async (t: T, heroId: Id<'heroes'>) => await t.run(async (ctx) => (await ctx.db.get(heroId))!.userId)
const hero = async (t: T, heroId: Id<'heroes'>) => (await t.run(async (ctx) => await ctx.db.get(heroId)))!
const lastLine = async (t: T, heroId: Id<'heroes'>) => await t.run(async (ctx) => (await ctx.db.query('tickLogs').withIndex('by_heroId_and_at_and_sequence', (q) => q.eq('heroId', heroId)).order('desc').first())?.summary ?? null)
/** Both games' pages, called directly (the cron's run schedules the next page and game by itself). */
const sweep = async (t: T) => {
  const heroes = await t.mutation(internal.dormancy.sweep, { game: 'desk-crawler' })
  const anglers = await t.mutation(internal.dormancy.sweep, { game: 'idle-angler' })
  expect(anglers.done).toBe(true)
  await t.finishAllScheduledFunctions(vi.runAllTimers)
  return heroes.paused + anglers.paused
}
const screen = async (t: T, path = '/trmnl/v1/screen', token = TOKEN, uuid = UUID) =>
  (await t.fetch(path, { method: 'POST', headers: { Authorization: `Bearer ${token}`, 'Content-Type': 'application/x-www-form-urlencoded' }, body: new URLSearchParams({ user_uuid: uuid }).toString() })).status

describe('quiet owners (D229)', () => {
  let t: T
  beforeEach(async () => {
    vi.useFakeTimers()
    vi.setSystemTime(NOW)
    t = convexTest(schema, modules)
    await seedWorld(t)
  })
  afterEach(() => vi.useRealTimers())

  it('reads quiet from the installations and the owner\'s own visits', () => {
    const active = (served: number | undefined) => ({ state: 'active' as const, createdAt: NOW - 30 * DAY, lastScreenServedAt: served })
    expect(quietVerdict([active(NOW - DAY)], [NOW - 40 * DAY], NOW)).toBe('awake')
    expect(quietVerdict([active(NOW - 20 * DAY)], [NOW - 40 * DAY], NOW)).toBe('quiet')
    expect(quietVerdict([active(NOW - 20 * DAY)], [NOW - 40 * DAY, NOW - 2 * DAY], NOW)).toBe('awake')
    expect(quietVerdict([active(NOW - QUIET_MS + 1)], [], NOW)).toBe('awake')
    expect(quietVerdict([active(NOW - QUIET_MS)], [], NOW)).toBe('quiet')
    // A never-served installation counts from its creation; a fresh install is not quiet.
    expect(quietVerdict([{ state: 'active', createdAt: NOW - DAY }], [NOW - 40 * DAY], NOW)).toBe('awake')
    // Uninstalled everywhere: the shorter wait, from the last screen served before the uninstall.
    expect(quietVerdict([{ state: 'uninstalled', createdAt: NOW - 30 * DAY, lastScreenServedAt: NOW - UNINSTALLED_QUIET_MS }], [NOW - 40 * DAY], NOW)).toBe('uninstalled')
    expect(quietVerdict([{ state: 'uninstalled', createdAt: NOW - 30 * DAY, lastScreenServedAt: NOW - 3 * DAY }], [], NOW)).toBe('awake')
    expect(quietVerdict([], [NOW - 8 * DAY], NOW)).toBe('uninstalled')
    expect(quietVerdict([], [NOW - 6 * DAY], NOW)).toBe('awake')
  })

  it('pauses a hero nobody has watched for two weeks, with the reason and a log line, and leaves the watched alone', async () => {
    const quiet = await seedHero(t, { createdAt: NOW - 30 * DAY, activatedAt: NOW - 30 * DAY }, 'Quiet')
    const watched = await seedHero(t, { createdAt: NOW - 30 * DAY, activatedAt: NOW - 30 * DAY }, 'Watched')
    const visited = await seedHero(t, { createdAt: NOW - 30 * DAY, activatedAt: NOW - 30 * DAY, companionVisitBaseline: { at: NOW - 3 * DAY, level: 1, lifetimeXp: 0, logSequence: 1, counters: (await hero(t, quiet)).counters } }, 'Visited')
    const gone = await seedHero(t, { createdAt: NOW - 30 * DAY, activatedAt: NOW - 30 * DAY }, 'Gone')
    const fresh = await seedHero(t, { createdAt: NOW - DAY, activatedAt: NOW - DAY }, 'Fresh')
    const asleep = await seedHero(t, { createdAt: NOW - 30 * DAY, activatedAt: NOW - 30 * DAY, status: 'sleeping' }, 'Asleep')
    const resting = await seedHero(t, { createdAt: NOW - 30 * DAY, activatedAt: NOW - 30 * DAY, status: 'resting' }, 'Resting')
    await installation(t, await ownerOf(t, quiet), NOW - 20 * DAY, 'active', 'desk-crawler', 'aaaaaaaa-1111-4aed-8464-bad68368e901', 'trmnl-tok-1')
    await installation(t, await ownerOf(t, watched), NOW - 2 * 3_600_000, 'active', 'desk-crawler', 'aaaaaaaa-1111-4aed-8464-bad68368e902', 'trmnl-tok-2')
    await installation(t, await ownerOf(t, visited), NOW - 20 * DAY, 'active', 'desk-crawler', 'aaaaaaaa-1111-4aed-8464-bad68368e903', 'trmnl-tok-3')
    await installation(t, await ownerOf(t, gone), NOW - 8 * DAY, 'uninstalled', 'desk-crawler', 'aaaaaaaa-1111-4aed-8464-bad68368e904', 'trmnl-tok-4')
    await installation(t, await ownerOf(t, asleep), NOW - 20 * DAY, 'active', 'desk-crawler', 'aaaaaaaa-1111-4aed-8464-bad68368e906', 'trmnl-tok-6')
    await installation(t, await ownerOf(t, resting), NOW - 20 * DAY, 'active', 'desk-crawler', 'aaaaaaaa-1111-4aed-8464-bad68368e907', 'trmnl-tok-7')
    expect(await sweep(t)).toBe(3)
    expect(await hero(t, quiet)).toMatchObject({ status: 'paused', pausedFromStatus: 'exploring', pausedReason: 'dormant' })
    expect(await lastLine(t, quiet)).toBe(LIE_DOWN_LINE)
    expect(await hero(t, resting)).toMatchObject({ status: 'paused', pausedFromStatus: 'resting', pausedReason: 'dormant' })
    expect(await hero(t, gone)).toMatchObject({ status: 'paused', pausedReason: 'dormant' })
    expect(await lastLine(t, gone)).toBe(LIE_DOWN_UNINSTALLED_LINE)
    for (const id of [watched, visited, fresh]) expect((await hero(t, id)).status).toBe('exploring')
    expect((await hero(t, asleep)).status).toBe('sleeping')
    // A second sweep changes nothing.
    expect(await sweep(t)).toBe(0)
    // The device says why, in place of "Paused by you"; the companion's hero view carries the reason.
    const quietOwner = t.withIdentity({ issuer: 'issuer', subject: 'Quiet' })
    expect((await quietOwner.query(api.heroes.mine, {}))?.pausedReason).toBe('dormant')
    const preview = await quietOwner.query(api.trmnlPayload.mine, { now: NOW }) as { status_label: string }
    expect(preview.status_label).toBe('Had a lie-down. Adventures resume soon')
  })

  it('gets up on the next screen request or companion visit, and the player\'s own pause stays', async () => {
    const heroId = await seedHero(t, { createdAt: NOW - 30 * DAY, activatedAt: NOW - 30 * DAY }, 'Ana')
    const userId = await ownerOf(t, heroId)
    const instanceId = await installation(t, userId, NOW - 20 * DAY)
    expect(await sweep(t)).toBe(1)
    expect((await hero(t, heroId)).status).toBe('paused')
    // The device polls again: the screen is served, the telemetry stamped and the hero back on its floor.
    expect(await screen(t)).toBe(200)
    await t.finishAllScheduledFunctions(vi.runAllTimers)
    const woken = await hero(t, heroId)
    expect([woken.status, woken.pausedReason, woken.pausedFromStatus]).toEqual(['exploring', undefined, undefined])
    expect(await lastLine(t, heroId)).toBe(BACK_LINE)
    expect(await t.run(async (ctx) => (await ctx.db.get(instanceId))!.lastScreenServedAt)).toBe(NOW)
    // Quiet again, then the companion opens: the visit wakes it before the recap baseline is set.
    await t.run(async (ctx) => { await ctx.db.patch(instanceId, { lastScreenServedAt: NOW - 20 * DAY }) })
    expect(await sweep(t)).toBe(1)
    const owner = t.withIdentity({ issuer: 'issuer', subject: 'Ana' })
    const sequence = (await hero(t, heroId)).logSequence
    expect(await owner.mutation(api.heroes.recordCompanionVisit, { operationId: 'visit-0001', expectedLogSequence: sequence })).toMatchObject({ changed: true })
    expect((await hero(t, heroId)).status).toBe('exploring')
    // The player's own pause carries no reason and is never woken by a screen.
    expect(await owner.mutation(api.heroes.pause, { operationId: 'pause-0001' })).toMatchObject({ changed: true })
    expect((await hero(t, heroId)).pausedReason).toBeUndefined()
    await t.run(async (ctx) => { await ctx.db.patch(instanceId, { lastScreenServedAt: NOW - 2 * DAY }) })
    expect(await screen(t)).toBe(200)
    await t.finishAllScheduledFunctions(vi.runAllTimers)
    expect((await hero(t, heroId)).status).toBe('paused')
    // Resume by hand clears everything either way.
    await t.run(async (ctx) => { await ctx.db.patch(heroId, { pausedReason: 'dormant' }) })
    expect(await owner.mutation(api.heroes.resume, { operationId: 'resume-0001' })).toMatchObject({ changed: true })
    const resumed = await hero(t, heroId)
    expect([resumed.status, resumed.pausedReason]).toEqual(['exploring', undefined])
  })

  it('rests a quiet angler too, and a served Idle Angler screen or a command wakes it', async () => {
    const quietId = await seedAngler(t, { createdAt: NOW - 30 * DAY, activatedAt: NOW - 30 * DAY }, 'Cod')
    const busyId = await seedAngler(t, { createdAt: NOW - 30 * DAY, activatedAt: NOW - 30 * DAY, lastCommandAt: NOW - DAY }, 'Eel')
    const anglerOf = async (id: Id<'anglers'>) => (await t.run(async (ctx) => await ctx.db.get(id)))!
    const quietUser = (await anglerOf(quietId)).userId
    const instanceId = await installation(t, quietUser, NOW - 20 * DAY, 'active', 'idle-angler', 'bbbbbbbb-2222-4aed-8464-bad68368e97c', 'trmnl-cod-token')
    await installation(t, (await anglerOf(busyId)).userId, NOW - 20 * DAY, 'active', 'idle-angler', 'bbbbbbbb-2222-4aed-8464-bad68368e97d', 'trmnl-eel-token')
    // The device route serves a listed game only.
    await t.mutation(internal.platform.setGameStatusInternal, { slug: 'idle-angler', status: 'live' })
    expect(await sweep(t)).toBe(1)
    expect(await anglerOf(quietId)).toMatchObject({ status: 'paused', pausedReason: 'dormant' })
    expect((await anglerOf(busyId)).status).toBe('fishing')
    // Idle Angler's screen now stamps the same telemetry, and the stamp wakes the angler.
    expect(await screen(t, '/trmnl/idle-angler/v1/screen', 'trmnl-cod-token', 'bbbbbbbb-2222-4aed-8464-bad68368e97c')).toBe(200)
    await t.finishAllScheduledFunctions(vi.runAllTimers)
    expect(await t.run(async (ctx) => (await ctx.db.get(instanceId))!.lastScreenServedAt)).toBe(NOW)
    const up = await anglerOf(quietId)
    expect([up.status, up.pausedReason]).toEqual(['fishing', undefined])
    // A command stamps the angler's own sign of life, so the next sweep leaves it fishing.
    await t.run(async (ctx) => { await ctx.db.patch(instanceId, { lastScreenServedAt: NOW - 20 * DAY }) })
    const owner = t.withIdentity({ issuer: 'issuer', subject: 'Cod' })
    await owner.mutation(api.idleAngler.anglers.pause, { operationId: 'ia-pause-0001' })
    await owner.mutation(api.idleAngler.anglers.resume, { operationId: 'ia-resume-0001' })
    expect((await anglerOf(quietId)).lastCommandAt).toBe(NOW)
    expect(await sweep(t)).toBe(0)
  })
})
