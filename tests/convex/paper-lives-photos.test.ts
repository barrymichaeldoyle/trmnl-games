// @vitest-environment edge-runtime
import { convexTest } from 'convex-test'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { api, internal } from '@trmnl-games/backend/api'
import { photoWeek } from '@trmnl-games/paper-lives/content/photos'
import schema from '../../apps/backend/convex/schema'
import { sha256Hex } from '../../apps/backend/convex/lib/hash'
import { photoCode } from '../../apps/backend/convex/lib/keepsakes'
import { seedWorld, type T } from './helpers'
import { runPaperLivesTick } from './paperLivesHelpers'

const modules = import.meta.glob('../../apps/backend/convex/**/*.ts')
const UUID = 'eeeeeeee-1111-4aed-8464-bad68368e97c'
const TOKEN = 'photo-token-ana'

describe('Paper Lives photos (D159, L6)', () => {
  let t: T
  beforeEach(async () => {
    vi.useFakeTimers()
    vi.setSystemTime(Date.UTC(2026, 10, 4, 10, 10, 3))
    t = convexTest(schema, modules)
    await seedWorld(t)
    await runPaperLivesTick(t)
    await t.mutation(internal.platform.setGameStatusInternal, { slug: 'paper-lives', status: 'live' })
    await t.mutation(internal.trmnl.linkInstall, { gameSlug: 'paper-lives', tokenIdentifier: 'issuer|Ana', tokenHash: sha256Hex(TOKEN), publicAlias: 'Ana', timezone: 'UTC' })
    await t.mutation(internal.trmnl.confirmInstance, { gameSlug: 'paper-lives', tokenHash: sha256Hex(TOKEN), uuid: UUID, confirmedBy: 'success_callback' })
  })
  afterEach(() => vi.useRealTimers())

  const ana = () => t.withIdentity({ issuer: 'issuer', subject: 'Ana' })
  const userId = async () => (await t.run(async (ctx) => await ctx.db.query('users').first()))!._id
  const screen = async () => (await (await t.fetch('/trmnl/paper-lives/v1/screen', { method: 'POST', headers: { Authorization: `Bearer ${TOKEN}`, 'Content-Type': 'application/x-www-form-urlencoded' }, body: new URLSearchParams({ user_uuid: UUID }).toString() })).json()).merge_variables

  it('shows the weekly code on the device only, and takes one photo a week for it', async () => {
    const code = photoCode(sha256Hex(TOKEN), await userId(), photoWeek(Date.now()))
    expect((await screen()).photo_code).toBe(code)
    expect(JSON.stringify(await ana().query(api.paperLives.photos.mine, {}))).not.toContain(code.replace(' ', ''))
    expect(await ana().mutation(api.paperLives.photos.claim, { operationId: 'photo-00001', code })).toMatchObject({ outcome: 'claimed', totalCollected: 1 })
    expect(await ana().mutation(api.paperLives.photos.claim, { operationId: 'photo-00002', code })).toMatchObject({ outcome: 'already_claimed', totalCollected: 1 })
    expect((await screen()).photo_code).toBeNull()
    const mine = await ana().query(api.paperLives.photos.mine, {})
    expect(mine).toMatchObject({ totalCollected: 1, claimedThisWeek: true, living: true })
    expect(mine.photos).toHaveLength(1)
    expect(mine.photos[0]).toMatchObject({ age: 0, portrait: { stage: 'infant', frame: false } })
    // The Photos family starts, and the photo writes nothing into the life.
    expect((await t.run(async (ctx) => await ctx.db.query('plAchievements').collect())).map((r) => r.achievementId)).toContain('photos_1')
    const profile = await t.run(async (ctx) => await ctx.db.query('paperLivesProfiles').first())
    expect(profile).toMatchObject({ photosClaimed: 1, lastPhotoWeek: photoWeek(Date.now()) })
    expect(profile!.career?.photosClaimed).toBeUndefined()
  })

  it("accepts last week's code from a slow screen and limits wrong guesses", async () => {
    const lastWeek = photoCode(sha256Hex(TOKEN), await userId(), photoWeek(Date.now()) - 1)
    for (let i = 0; i < 10; i += 1) expect((await ana().mutation(api.paperLives.photos.claim, { operationId: `miss-${String(i).padStart(5, '0')}`, code: '000000' })).outcome).toBe('invalid_code')
    await expect(ana().mutation(api.paperLives.photos.claim, { operationId: 'miss-final1', code: lastWeek })).rejects.toThrow(/Too many/)
    vi.advanceTimersByTime(24 * 3_600_000)
    expect((await ana().mutation(api.paperLives.photos.claim, { operationId: 'photo-late1', code: photoCode(sha256Hex(TOKEN), await userId(), photoWeek(Date.now()) - 1) })).outcome).toBe('claimed')
  })

  it('refuses a photo with no one in it and shows none on a memorial', async () => {
    const code = photoCode(sha256Hex(TOKEN), await userId(), photoWeek(Date.now()))
    await t.run(async (ctx) => { const life = (await ctx.db.query('lives').first())!; await ctx.db.patch(life._id, { life: { ...life.life, status: 'ended' } }) })
    expect((await screen()).photo_code).toBeNull()
    await expect(ana().mutation(api.paperLives.photos.claim, { operationId: 'photo-ended', code })).rejects.toThrow(/Begin the next life/)
  })
})
