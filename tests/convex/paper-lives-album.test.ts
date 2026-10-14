// @vitest-environment edge-runtime
import { convexTest } from 'convex-test'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { api, internal } from '@trmnl-games/backend/api'
import schema from '../../apps/backend/convex/schema'
import type { T } from './helpers'
import { lifeOf, nextPaperLivesTick, seedLife } from './paperLivesHelpers'

const modules = import.meta.glob('../../apps/backend/convex/**/*.ts')

describe('Paper Lives album, boards and profile (D159, L5)', () => {
  let t: T
  beforeEach(() => {
    vi.useFakeTimers()
    vi.setSystemTime(Date.UTC(2026, 10, 2, 6, 10, 3))
    t = convexTest(schema, modules)
  })
  afterEach(() => vi.useRealTimers())

  const as = (alias: string) => t.withIdentity({ issuer: 'issuer', subject: alias })
  const old = { age: 100, stage: 'senior' as const, stats: { health: 0, happiness: 60, smarts: 50, charm: 50 }, people: [{ id: 'c1', name: 'Ada', role: 'child' as const, bornAt: 30, metAt: 30, relationship: 80, alive: true, history: [] }] }
  const toEnd = async (lifeId: Parameters<typeof lifeOf>[1]) => {
    for (let i = 0; i < 400 && (await lifeOf(t, lifeId)).life.status !== 'ended'; i += 1) await nextPaperLivesTick(t)
  }

  it('lists finished lives and the family tree, and follows other players’ current lives', async () => {
    const lifeId = await seedLife(t, old, 'Ana')
    await toEnd(lifeId)
    await as('Ana').mutation(api.paperLives.lives.begin, { operationId: 'operation-begin-1', kind: 'child' })
    await t.run(async (ctx) => {
      const life = (await ctx.db.get(lifeId))!
      await ctx.db.patch(lifeId, { life: { ...life.life, age: 100, stage: 'senior', stats: { ...life.life.stats, health: 0 }, people: [] } })
    })
    await toEnd(lifeId)
    const friendLife = await seedLife(t, { age: 40, stage: 'adult', job: 'teacher' }, 'Bo')
    await t.run(async (ctx) => {
      const ana = (await ctx.db.query('users').withIndex('by_tokenIdentifier', (q) => q.eq('tokenIdentifier', 'issuer|Ana')).unique())!
      const bo = (await ctx.db.get((await ctx.db.get(friendLife))!.userId))!
      await ctx.db.insert('follows', { userId: ana._id, followedUserId: bo._id, followedNameVersion: bo.publicNameVersion, createdAt: Date.now() })
    })
    // Hidden: the Following card shows nobody to non-admins.
    expect((await as('Ana').query(api.paperLives.album.view, {})).following).toEqual([])
    await t.mutation(internal.platform.setGameStatusInternal, { slug: 'paper-lives', status: 'live' })
    const album = await as('Ana').query(api.paperLives.album.view, {})
    expect(album.lives.map((l: { ordinal: number }) => l.ordinal)).toEqual([2, 1])
    expect(album.lives[0]).toMatchObject({ parentOrdinal: 1, generation: 2 })
    expect(album.tree.map((r: { ordinal: number; depth: number }) => [r.ordinal, r.depth])).toEqual([[1, 0], [2, 1]])
    expect(album.following).toEqual([{ alias: 'Bo', name: expect.any(String), age: 40, job: 'Teacher', status: 'living' }])
  }, 60_000)

  it('ranks each player’s best finished life and shows Paper Lives on the public profile once live', async () => {
    const ana = await seedLife(t, old, 'Ana')
    const bo = await seedLife(t, { ...old, gold: 50_000, counters: { yearsLived: 94, decisionsChosen: 0, decisionsDefaulted: 0, remarkableEvents: 0, jobsHeld: 0, marriages: 0, childrenRaised: 0, grandchildren: 0, housesOwned: 0, petsKept: 0, hobbiesTaken: 0, peakMoney: 90_000 } }, 'Bo')
    await toEnd(ana)
    await toEnd(bo)
    const fortunes = await as('Ana').query(api.paperLives.album.board, { board: 'fortune', period: 'all' })
    expect(fortunes.entries[0]).toMatchObject({ rank: 1, name: 'Bo', value: 90_000, own: false })
    expect(fortunes.own).toMatchObject({ rank: 2 })
    expect(await t.query(api.platformProfile.view, { alias: 'Ana' })).toBeNull()
    await t.mutation(internal.platform.setGameStatusInternal, { slug: 'paper-lives', status: 'live' })
    const profile = await t.query(api.platformProfile.view, { alias: 'Ana' })
    expect(profile.games).toMatchObject([{ slug: 'paper-lives', life: { status: 'ended', lives: 1, album: [{ ordinal: 1 }] } }])
  }, 60_000)
})
