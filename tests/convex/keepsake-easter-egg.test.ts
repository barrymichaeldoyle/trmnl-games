// @vitest-environment edge-runtime
import { convexTest } from 'convex-test'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { api } from '@trmnl-games/backend/api'
import type { Id } from '@trmnl-games/backend/data-model'
import schema from '../../apps/backend/convex/schema'
import { sha256Hex } from '../../apps/backend/convex/lib/hash'
import { keepsakeCode } from '../../apps/backend/convex/lib/keepsakes'
import { KEEPSAKE_MISS_LIMIT } from '../../apps/backend/convex/keepsakes'
import { EASTER_EGG_KEEPSAKE, keepsakeWeek, SAMPLE_KEEPSAKE_CODE } from '@trmnl-games/desk-crawler/content/keepsakes'
import { seedDeletionConfirmation, seedHero, seedWorld, type T } from './helpers'

/** Lets one test give the player a real weekly code equal to the sample code, a one-in-a-million chance otherwise. */
const realCodeIsSample = vi.hoisted(() => ({ on: false }))
vi.mock('../../apps/backend/convex/lib/keepsakes', async (original) => {
  const actual = await original<typeof import('../../apps/backend/convex/lib/keepsakes')>()
  return { ...actual, keepsakeCode: (...args: Parameters<typeof actual.keepsakeCode>) => (realCodeIsSample.on ? '482917' : actual.keepsakeCode(...args)) }
})

const modules = import.meta.glob('../../apps/backend/convex/**/*.ts')
const NOW = Date.UTC(2026, 9, 28, 12)
const TOKEN = 'trmnl-ana-token'
const SAMPLE = SAMPLE_KEEPSAKE_CODE

describe('the hidden Easter Egg keepsake (D140)', () => {
  let t: T
  let heroId: Id<'heroes'>
  let userId: Id<'users'>
  beforeEach(async () => {
    vi.useFakeTimers()
    vi.setSystemTime(NOW)
    realCodeIsSample.on = false
    t = convexTest(schema, modules)
    await seedWorld(t)
    heroId = await seedHero(t, {}, 'Ana')
    userId = await t.run(async (ctx) => {
      const hero = (await ctx.db.get(heroId))!
      const grantId = await ctx.db.insert('trmnlGrants', { userId: hero.userId, tokenHash: sha256Hex(TOKEN), state: 'active', createdAt: Date.now() })
      await ctx.db.insert('trmnlInstances', { userId: hero.userId, grantId, uuid: 'aaaaaaaa-1111-4aed-8464-bad68368e97c', state: 'active', confirmedBy: 'success_callback', createdAt: Date.now() })
      return hero.userId
    })
  })
  afterEach(() => { vi.useRealTimers(); vi.unstubAllEnvs(); vi.unstubAllGlobals() })
  const owner = () => t.withIdentity({ issuer: 'issuer', subject: 'Ana' })
  const weekly = () => keepsakeCode(sha256Hex(TOKEN), userId, keepsakeWeek(Date.now()))
  const misses = () => t.run(async (ctx) => (await ctx.db.query('rateLimitBuckets').collect()).filter((row) => row.key.startsWith('keepsake:')))

  it('finds the egg once, outside the weekly set: no claim used, no collection count and no wrong guess', async () => {
    expect(await owner().mutation(api.keepsakes.claim, { operationId: 'easter-egg-0001', code: SAMPLE })).toMatchObject({ changed: true, outcome: 'easter_egg', totalCollected: 0 })
    expect(await owner().query(api.keepsakes.mine, {})).toMatchObject({ totalCollected: 0, lastClaimWeek: null, nextAvailableAt: null, easterEgg: true })
    expect(await owner().mutation(api.keepsakes.claim, { operationId: 'easter-egg-0002', code: SAMPLE.replace(' ', '') })).toMatchObject({ changed: false, outcome: 'easter_egg', totalCollected: 0 })
    expect(await misses()).toEqual([])
    // The week's real code still collects afterwards, and the achievement counts read only weekly keepsakes.
    expect(await owner().mutation(api.keepsakes.claim, { operationId: 'easter-weekly-0001', code: weekly() })).toMatchObject({ changed: true, outcome: 'claimed', totalCollected: 1 })
    expect(await owner().query(api.keepsakes.mine, {})).toMatchObject({ totalCollected: 1, lastClaimWeek: keepsakeWeek(NOW), easterEgg: true })
    expect(EASTER_EGG_KEEPSAKE.pixels.every((row) => /^[.#]{8}$/.test(row))).toBe(true)
  })

  it('is still found after this week’s claim and past the daily wrong-code limit', async () => {
    await owner().mutation(api.keepsakes.claim, { operationId: 'easter-weekly-0001', code: weekly() })
    expect(await owner().mutation(api.keepsakes.claim, { operationId: 'easter-egg-0001', code: SAMPLE })).toMatchObject({ changed: true, outcome: 'easter_egg', totalCollected: 1 })
    t = convexTest(schema, modules)
    await seedWorld(t)
    heroId = await seedHero(t, {}, 'Ana')
    userId = await t.run(async (ctx) => {
      const hero = (await ctx.db.get(heroId))!
      const grantId = await ctx.db.insert('trmnlGrants', { userId: hero.userId, tokenHash: sha256Hex(TOKEN), state: 'active', createdAt: Date.now() })
      await ctx.db.insert('trmnlInstances', { userId: hero.userId, grantId, uuid: 'aaaaaaaa-1111-4aed-8464-bad68368e97c', state: 'active', confirmedBy: 'success_callback', createdAt: Date.now() })
      return hero.userId
    })
    const wrong = weekly() === '000000' ? '000 001' : '000 000'
    for (let i = 0; i < KEEPSAKE_MISS_LIMIT; i++) await owner().mutation(api.keepsakes.claim, { operationId: `easter-bad-${String(i).padStart(4, '0')}`, code: wrong })
    expect(await owner().mutation(api.keepsakes.claim, { operationId: 'easter-bad-late', code: wrong })).toMatchObject({ ok: false, message: expect.stringMatching(/wrong keepsake codes/) })
    expect(await owner().mutation(api.keepsakes.claim, { operationId: 'easter-egg-limited', code: SAMPLE })).toMatchObject({ changed: true, outcome: 'easter_egg' })
  })

  it('collects the weekly keepsake when the sample code really is this player’s code', async () => {
    realCodeIsSample.on = true
    expect(await owner().mutation(api.keepsakes.claim, { operationId: 'easter-lucky-0001', code: SAMPLE })).toMatchObject({ changed: true, outcome: 'claimed', totalCollected: 1 })
    expect(await owner().query(api.keepsakes.mine, {})).toMatchObject({ easterEgg: false })
    // Once this week is claimed, the same code is the sample code again and finds the egg.
    expect(await owner().mutation(api.keepsakes.claim, { operationId: 'easter-lucky-0002', code: SAMPLE })).toMatchObject({ changed: true, outcome: 'easter_egg', totalCollected: 1 })
  })

  it('goes with the collection when the account is deleted', async () => {
    vi.stubEnv('CLERK_SECRET_KEY', 'sk_test_fake')
    vi.stubGlobal('fetch', vi.fn(async () => new Response(null, { status: 200 })))
    await owner().mutation(api.keepsakes.claim, { operationId: 'easter-egg-0001', code: SAMPLE })
    await owner().mutation(api.deletion.requestDeletion, { operationId: 'easter-delete-0001', confirm: 'DELETE', token: await seedDeletionConfirmation(t, 'Ana') })
    await t.finishAllScheduledFunctions(vi.runAllTimers)
    expect(await t.run(async (ctx) => await ctx.db.query('deskKeepsakes').collect())).toEqual([])
  })
})
