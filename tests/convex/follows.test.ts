// @vitest-environment edge-runtime
import { convexTest } from 'convex-test'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { api } from '@trmnl-games/backend/api'
import schema from '../../apps/backend/convex/schema'
import { runTick, seedHero, seedWorld, type T } from './helpers'
import { contentV7 } from '@trmnl-games/desk-crawler/content/v7'
import type { RaidRule } from '@trmnl-games/desk-crawler/sim/core/types'
import { SLOT_MS } from '../../apps/backend/convex/sim/runs/tick'
import { RIVAL_RAID } from '../../apps/backend/convex/lib/raids'

const modules = import.meta.glob('../../apps/backend/convex/**/*.ts')
const PUBLISH_SLOT = Date.UTC(2026, 9, 3, 10, 45, 1)
const HOUR = 3_600_000
const SLOT = Date.UTC(2026, 9, 3, 10, 0, 2)

describe('friends and rivals (D143)', () => {
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
    await expect(follow('Wren', 'Moss')).rejects.toThrow(/hidden, or there is no player/)
    await expect(follow('Wren', 'Nobody')).rejects.toThrow(/hidden, or there is no player/)
    await publish('Wren')
    await expect(follow('Wren', 'Wren')).rejects.toThrow(/hidden, or there is no player/)
    await publish('Moss')
    expect(await follow('Wren', ' moss ')).toMatchObject({ changed: true })
    expect(await follow('Wren', 'Moss')).toMatchObject({ changed: false })
    const { follows } = await list('Wren')
    expect(follows).toHaveLength(1)
    expect(follows[0]).toMatchObject({ state: 'public', name: 'Moss', rival: false, hero: { name: 'Baz', level: 1, heroClass: 'warrior' } })
  })

  it('shows the page status on a hero page: nothing signed out or on your own, Follow, then Following', async () => {
    await seedHero(t, {}, 'Wren')
    await seedHero(t, {}, 'Moss')
    await publish('Moss')
    await publish('Wren')
    expect(await t.query(api.follows.status, { alias: 'Moss' })).toBeNull()
    expect(await as('Wren').query(api.follows.status, { alias: 'Wren' })).toBeNull()
    expect(await as('Wren').query(api.follows.status, { alias: 'Moss' })).toEqual({ followId: null, rival: false, full: false })
    await follow('Wren', 'Moss')
    expect(await as('Wren').query(api.follows.status, { alias: 'Moss' })).toMatchObject({ rival: false, full: false })
    expect((await as('Wren').query(api.follows.status, { alias: 'Moss' }))!.followId).not.toBeNull()
  })

  it('keeps one rival, first in the list, with the head-to-head ranks from the published set', async () => {
    await seedHero(t, { level: 3 }, 'Wren')
    for (const alias of ['Moss', 'Fern']) {
      await seedHero(t, { level: alias === 'Moss' ? 5 : 2 }, alias)
      await publish(alias)
      await follow('Wren', alias)
    }
    await runTick(t)
    const before = await list('Wren')
    const moss = before.follows.find((row) => row.name === 'Moss')!
    const fern = before.follows.find((row) => row.name === 'Fern')!
    await as('Wren').mutation(api.follows.setRival, { operationId: next(), followId: fern.id })
    await as('Wren').mutation(api.follows.setRival, { operationId: next(), followId: moss.id })
    const after = await list('Wren')
    expect(after.follows.filter((row) => row.rival).map((row) => row.name)).toEqual(['Moss'])
    expect(after.follows[0]!.name).toBe('Moss')
    expect(after.follows[0]!.hero!.rank).toBe(1)
    expect(after.own).toEqual({ level: 3, rank: 2 })
    await as('Wren').mutation(api.follows.setRival, { operationId: next(), followId: null })
    expect((await list('Wren')).follows.some((row) => row.rival)).toBe(false)
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
    await expect(follow('Wren', 'Moss')).rejects.toThrow(/up to 20/)
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

describe('rival raids (D143)', () => {
  let t: T
  let op = 0
  const next = () => `rival-op-${String(++op).padStart(4, '0')}`
  const raidRules = contentV7.raids!
  beforeEach(async () => {
    vi.useFakeTimers()
    vi.setSystemTime(SLOT)
    t = convexTest(schema, modules)
    ;(contentV7 as { raids?: RaidRule }).raids = { ...raidRules, launchPermille: { cautious: 1000, balanced: 1000, bold: 1000 } }
    RIVAL_RAID.pct = 100
    await seedWorld(t, { activeContentVersion: 'v7', currentTick: 10, lastPublishedAt: SLOT - 30 * 60_000 })
  })
  afterEach(() => {
    ;(contentV7 as { raids?: RaidRule }).raids = raidRules
    RIVAL_RAID.pct = 50
    vi.useRealTimers()
  })
  const as = (alias: string) => t.withIdentity({ issuer: 'issuer', subject: alias })
  const tickAt = async (slot: number) => {
    vi.setSystemTime(SLOT + slot * SLOT_MS)
    await runTick(t)
  }

  it('sends the raider after its rival, marks the raid, keeps the head-to-head and tells the rival', async () => {
    // Only Ana raids Di, so Di's target cooldown never comes from someone else and Ana's first raid is a rival roll.
    for (const alias of ['Ana', 'Di']) await seedHero(t, { level: 5, hp: 60, gold: 400 }, alias)
    await as('Di').mutation(api.heroes.setPublicProfile, { operationId: next(), visible: true })
    await as('Ana').mutation(api.heroes.setPublicProfile, { operationId: next(), visible: true })
    await as('Ana').mutation(api.follows.follow, { operationId: next(), alias: 'Di', rival: true })
    for (let slot = 0; slot <= 4; slot += 1) await tickAt(slot)
    const raids = await t.run(async (ctx) => await ctx.db.query('raids').collect())
    const users = await t.run(async (ctx) => await ctx.db.query('users').collect())
    const id = (alias: string) => users.find((user) => user.publicAlias === alias)!._id
    const anas = raids.filter((raid) => raid.raiderUserId === id('Ana'))
    expect(anas.length).toBeGreaterThan(0)
    expect(anas[0]).toMatchObject({ targetUserId: id('Di'), rival: true })
    // Di named no rival, so Di's raids on Ana are unmarked.
    expect(raids.filter((raid) => raid.rival).every((raid) => raid.raiderUserId === id('Ana'))).toBe(true)
    const ana = (await as('Ana').query(api.follows.list, {}))!
    expect(ana.follows[0]!.raids.won + ana.follows[0]!.raids.lost).toBe(anas.filter((raid) => raid.rival).length)
    expect((await as('Ana').query(api.raids.recent, {}))!.raids.some((raid) => raid.rival && raid.profile)).toBe(true)
    // Di is told, and can name Ana back in one step.
    const di = (await as('Di').query(api.follows.list, {}))!
    expect(di.rivalOf).toEqual([{ name: 'Ana', public: true, followed: false }])
    await as('Di').mutation(api.follows.follow, { operationId: next(), alias: 'Ana', rival: true })
    const back = (await as('Di').query(api.follows.list, {}))!
    expect(back.follows).toMatchObject([{ name: 'Ana', rival: true }])
    expect(back.rivalOf).toEqual([{ name: 'Ana', public: true, followed: true }])
  })

  it('falls back to the pool when the rival hid their page, and stops telling a renamed rival', async () => {
    for (const alias of ['Ana', 'Bo', 'Cy']) await seedHero(t, { level: 5, hp: 60, gold: 400 }, alias)
    await as('Bo').mutation(api.heroes.setPublicProfile, { operationId: next(), visible: true })
    await as('Ana').mutation(api.follows.follow, { operationId: next(), alias: 'Bo', rival: true })
    await as('Bo').mutation(api.heroes.setPublicProfile, { operationId: next(), visible: false })
    await tickAt(0)
    await tickAt(1)
    const raids = await t.run(async (ctx) => await ctx.db.query('raids').collect())
    expect(raids.some((raid) => raid.rival)).toBe(false)
    expect((await as('Bo').query(api.follows.list, {}))!.rivalOf).toHaveLength(1)
    await as('Bo').mutation(api.users.changePublicName, { operationId: next(), publicAlias: 'Bramble' })
    expect((await as('Bo').query(api.follows.list, {}))!.rivalOf).toEqual([])
  })
})
