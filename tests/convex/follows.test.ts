// @vitest-environment edge-runtime
import { convexTest } from 'convex-test'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { api } from '@trmnl-games/backend/api'
import schema from '../../apps/backend/convex/schema'
import { runTick, seedHero, seedWorld, type T } from './helpers'

const modules = import.meta.glob('../../apps/backend/convex/**/*.ts')
const PUBLISH_SLOT = Date.UTC(2026, 9, 3, 10, 45, 1)
const HOUR = 3_600_000

describe('following (D143, rivals removed in D205)', () => {
  let t: T
  let op = 0
  const next = () => `follow-op-${String(++op).padStart(4, '0')}`
  beforeEach(async () => {
    vi.useFakeTimers()
    vi.setSystemTime(PUBLISH_SLOT)
    t = convexTest(schema, modules)
    await seedWorld(t, { lastPublishedAt: PUBLISH_SLOT - HOUR - 1000 })
  })
  afterEach(() => vi.useRealTimers())

  const as = (alias: string) => t.withIdentity({ issuer: 'issuer', subject: alias })
  const publish = (alias: string, visible = true) => as(alias).mutation(api.heroes.setPublicProfile, { operationId: next(), visible })
  const follow = (who: string, alias: string) => as(who).mutation(api.follows.follow, { operationId: next(), alias })
  const list = async (who: string) => (await as(who).query(api.follows.list, {}))!

  it('follows only public pages, never yourself, and fails the same way for hidden and missing names', async () => {
    await seedHero(t, {}, 'Wren')
    await seedHero(t, { publicProfile: false }, 'Moss')
    expect(await follow('Wren', 'Moss')).toMatchObject({ ok: false, message: expect.stringMatching(/hidden, or there is no player/) })
    expect(await follow('Wren', 'Nobody')).toMatchObject({ ok: false, message: expect.stringMatching(/hidden, or there is no player/) })
    await publish('Wren')
    expect(await follow('Wren', 'Wren')).toMatchObject({ ok: false, message: expect.stringMatching(/hidden, or there is no player/) })
    await publish('Moss')
    expect(await follow('Wren', ' moss ')).toMatchObject({ changed: true })
    expect(await follow('Wren', 'Moss')).toMatchObject({ changed: false })
    const { follows } = await list('Wren')
    expect(follows).toHaveLength(1)
    expect(follows[0]).toMatchObject({ state: 'public', name: 'Moss', hero: { name: 'Baz', level: 1, heroClass: 'warrior' } })
  })

  it('shows the page status on a hero page: nothing signed out or on your own, Follow, then Following', async () => {
    await seedHero(t, {}, 'Wren')
    await seedHero(t, {}, 'Moss')
    await publish('Moss')
    await publish('Wren')
    expect(await t.query(api.follows.status, { alias: 'Moss' })).toBeNull()
    expect(await as('Wren').query(api.follows.status, { alias: 'Wren' })).toBeNull()
    expect(await as('Wren').query(api.follows.status, { alias: 'Moss' })).toEqual({ followId: null, full: false })
    await follow('Wren', 'Moss')
    expect(await as('Wren').query(api.follows.status, { alias: 'Moss' })).toMatchObject({ full: false })
    expect((await as('Wren').query(api.follows.status, { alias: 'Moss' }))!.followId).not.toBeNull()
  })

  it('shows a hidden page as private and a renamed player as gone, without the new name', async () => {
    await seedHero(t, {}, 'Wren')
    await seedHero(t, {}, 'Moss')
    await publish('Moss')
    await follow('Wren', 'Moss')
    await publish('Moss', false)
    expect((await list('Wren')).follows[0]).toMatchObject({ state: 'private', name: 'Moss', hero: null })
    await publish('Moss')
    await as('Moss').mutation(api.users.changePublicName, { operationId: next(), publicAlias: 'Lichen' })
    const [row] = (await list('Wren')).follows
    expect(row).toMatchObject({ state: 'gone', name: 'Hidden player', hero: null })
    expect(JSON.stringify(row)).not.toContain('Lichen')
    // Following again under the new name picks the same player up again.
    expect(await follow('Wren', 'Lichen')).toMatchObject({ changed: true })
    expect((await list('Wren')).follows).toMatchObject([{ state: 'public', name: 'Lichen' }])
  })

  it('caps follows at 20 and lets only the owner unfollow', async () => {
    await seedHero(t, {}, 'Wren')
    await seedHero(t, {}, 'Moss')
    for (let i = 0; i < 20; i++) {
      await t.run(async (ctx) => {
        const user = await ctx.db.query('users').withIndex('by_normalizedAlias', (q) => q.eq('normalizedAlias', 'wren')).unique()
        const other = await ctx.db.insert('users', { tokenIdentifier: `issuer|x${i}`, publicAlias: `Extra${i}`, normalizedAlias: `extra${i}`, timezone: 'UTC', state: 'active', createdAt: 0, publicNameVersion: 1 })
        await ctx.db.insert('follows', { userId: user!._id, followedUserId: other, followedNameVersion: 1, createdAt: i })
      })
    }
    await publish('Moss')
    expect(await follow('Wren', 'Moss')).toMatchObject({ ok: false, message: expect.stringMatching(/up to 20/) })
    expect(await as('Wren').query(api.follows.status, { alias: 'Moss' })).toMatchObject({ full: true })
    const { follows } = await list('Wren')
    expect(follows).toHaveLength(20)
    expect(follows.every((row) => row.state === 'gone')).toBe(true)
    expect(await as('Moss').mutation(api.follows.unfollow, { operationId: next(), followId: follows[0]!.id })).toMatchObject({ changed: false })
    expect(await as('Wren').mutation(api.follows.unfollow, { operationId: next(), followId: follows[0]!.id })).toMatchObject({ changed: true })
    expect(await follow('Wren', 'Moss')).toMatchObject({ changed: true })
  })

  it('removes follows both ways when either player deletes Desk Crawler progress', async () => {
    await seedHero(t, {}, 'Wren')
    await seedHero(t, {}, 'Moss')
    await seedHero(t, {}, 'Fern')
    for (const alias of ['Wren', 'Moss', 'Fern']) await publish(alias)
    await follow('Wren', 'Moss')
    await follow('Moss', 'Wren')
    await follow('Fern', 'Moss')
    await as('Moss').mutation(api.deletion.requestGameDeletion, { operationId: next(), confirm: 'DELETE' })
    await t.finishAllScheduledFunctions(vi.runAllTimers)
    expect(await t.run(async (ctx) => await ctx.db.query('follows').collect())).toEqual([])
  })

  it('never lets a query reveal who follows a player', async () => {
    await seedHero(t, {}, 'Wren')
    await seedHero(t, {}, 'Moss')
    await publish('Moss')
    await follow('Wren', 'Moss')
    const mossView = JSON.stringify([await list('Moss'), await t.query(api.profiles.view, { alias: 'Moss' })])
    expect(mossView).not.toContain('Wren')
  })
})

