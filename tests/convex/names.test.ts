// @vitest-environment edge-runtime
import { convexTest } from 'convex-test'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { api } from '@trmnl-games/backend/api'
import type { Id } from '@trmnl-games/backend/data-model'
import schema from '../../apps/backend/convex/schema'
import { seedHero, seedWorld, type T } from './helpers'

const modules = import.meta.glob('../../apps/backend/convex/**/*.ts')
const SLOT = Date.UTC(2026, 9, 13, 10, 0, 2)
const DAY = 24 * 60 * 60 * 1000
let op = 0
const opId = () => `name-${String(++op).padStart(6, '0')}`
const as = (t: T, alias: string) => t.withIdentity({ issuer: 'issuer', subject: alias })

async function errorCode(promise: Promise<unknown>): Promise<string | undefined> {
  try {
    await promise
    return undefined
  } catch (error) {
    return (error as { data?: { code?: string } }).data?.code
  }
}

const heroDoc = (t: T, heroId: Id<'heroes'>) => t.run(async (ctx) => await ctx.db.get(heroId))
const userOf = (t: T, heroId: Id<'heroes'>) => t.run(async (ctx) => await ctx.db.get((await ctx.db.get(heroId))!.userId))

describe('name tags and public names (D142)', () => {
  let t: T
  beforeEach(async () => {
    vi.useFakeTimers()
    vi.setSystemTime(SLOT)
    t = convexTest(schema, modules)
    await seedWorld(t, { activeContentVersion: 'v1', lastPublishedAt: SLOT - 30 * 60_000 })
  })
  afterEach(() => vi.useRealTimers())

  it('sells one name tag a day for 200 gold and renames the current hero', async () => {
    const heroId = await seedHero(t, { gold: 450 }, 'Ana')
    const ana = as(t, 'Ana')
    expect((await ana.query(api.inventory.mine, {})).nameTag).toEqual({ price: 200, inStockAt: null })

    expect(await ana.mutation(api.inventory.buyNameTag, { operationId: opId(), name: '  Grimble  ' })).toMatchObject({ changed: true, gold: -200 })
    expect(await heroDoc(t, heroId)).toMatchObject({ name: 'Grimble', gold: 250 })
    const log = await t.run(async (ctx) => await ctx.db.query('tickLogs').withIndex('by_heroId_and_at_and_sequence', (q) => q.eq('heroId', heroId)).order('desc').first())
    expect(log).toMatchObject({ summary: 'Pinned on a new name tag: "Hi, my name is [[Grimble]]."', deltas: { gold: -200 }, detail: { operation: 'name_tag' } })
    // The public name is a different name and stays as it was.
    expect(await userOf(t, heroId)).toMatchObject({ publicAlias: 'Ana', publicNameVersion: 1 })
    expect((await ana.query(api.inventory.mine, {})).nameTag).toEqual({ price: 200, inStockAt: SLOT + DAY })

    expect(await errorCode(ana.mutation(api.inventory.buyNameTag, { operationId: opId(), name: 'Again' }))).toBe('NAME_TAG_SOLD_OUT')
    vi.setSystemTime(SLOT + DAY)
    await ana.mutation(api.inventory.buyNameTag, { operationId: opId(), name: 'Again' })
    expect(await heroDoc(t, heroId)).toMatchObject({ name: 'Again', gold: 50 })
  })

  it('refuses a name tag without the gold, with a bad name or with the same name, and keeps the day open', async () => {
    const heroId = await seedHero(t, { gold: 199 }, 'Bo')
    const bo = as(t, 'Bo')
    expect(await errorCode(bo.mutation(api.inventory.buyNameTag, { operationId: opId(), name: 'Grimble' }))).toBe('NOT_ENOUGH_GOLD')
    await t.run(async (ctx) => await ctx.db.patch(heroId, { gold: 500 }))
    expect(await errorCode(bo.mutation(api.inventory.buyNameTag, { operationId: opId(), name: '<b>' }))).toBe('INVALID_INPUT')
    expect(await errorCode(bo.mutation(api.inventory.buyNameTag, { operationId: opId(), name: 'Baz' }))).toBe('INVALID_INPUT')
    expect(await heroDoc(t, heroId)).toMatchObject({ name: 'Baz', gold: 500 })
    expect((await bo.query(api.inventory.mine, {})).nameTag.inStockAt).toBeNull()
  })

  it('changes the public name free once every 7 days and holds the old name from other players', async () => {
    const heroId = await seedHero(t, {}, 'Cy')
    await seedHero(t, {}, 'Taken')
    const other = await seedHero(t, {}, 'Dee')
    const cy = as(t, 'Cy')
    expect(await errorCode(cy.mutation(api.users.changePublicName, { operationId: opId(), publicAlias: 'taken' }))).toBe('ALIAS_TAKEN')

    await cy.mutation(api.users.changePublicName, { operationId: opId(), publicAlias: 'Cyrus' })
    expect(await userOf(t, heroId)).toMatchObject({ publicAlias: 'Cyrus', normalizedAlias: 'cyrus', publicNameVersion: 2, publicNameChangedAt: SLOT, heldAlias: { normalized: 'cy', until: SLOT + 7 * DAY } })
    expect(await heroDoc(t, heroId)).toMatchObject({ name: 'Baz' })
    expect((await cy.query(api.users.me, {}))?.user?.publicNameChangeAt).toBe(SLOT + 7 * DAY)
    expect(await errorCode(cy.mutation(api.users.changePublicName, { operationId: opId(), publicAlias: 'Cyrano' }))).toBe('NAME_CHANGE_LIMIT')

    // Another player cannot take the name Cy gave up until the hold ends.
    const dee = as(t, 'Dee')
    expect(await errorCode(dee.mutation(api.users.changePublicName, { operationId: opId(), publicAlias: 'CY' }))).toBe('ALIAS_TAKEN')
    vi.setSystemTime(SLOT + 7 * DAY)
    await dee.mutation(api.users.changePublicName, { operationId: opId(), publicAlias: 'CY' })
    expect(await userOf(t, other)).toMatchObject({ publicAlias: 'CY', heldAlias: { normalized: 'dee' } })
    await cy.mutation(api.users.changePublicName, { operationId: opId(), publicAlias: 'Cyrano' })
    expect(await userOf(t, heroId)).toMatchObject({ publicAlias: 'Cyrano', heldAlias: { normalized: 'cyrus' } })
  })

  it('leaves a name under repair to the repair notice', async () => {
    const heroId = await seedHero(t, {}, 'Ed')
    await t.run(async (ctx) => await ctx.db.patch((await ctx.db.get(heroId))!.userId, { nameRepairRequired: true }))
    expect(await errorCode(as(t, 'Ed').mutation(api.users.changePublicName, { operationId: opId(), publicAlias: 'Edna' }))).toBe('INVALID_STATE')
  })
})
