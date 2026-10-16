// @vitest-environment edge-runtime
import { convexTest } from 'convex-test'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { api, internal } from '@trmnl-games/backend/api'
import { sha256Hex } from '../../apps/backend/convex/lib/hash'
import type { Id } from '@trmnl-games/backend/data-model'
import schema from '../../apps/backend/convex/schema'
import { seedHero, seedWorld, type T } from './helpers'

const modules = import.meta.glob('../../apps/backend/convex/**/*.ts')
const SLOT = Date.UTC(2026, 9, 13, 10, 0, 2)
let op = 0
const opId = () => `gender-${String(++op).padStart(6, '0')}`
const as = (t: T, alias: string) => t.withIdentity({ issuer: 'issuer', subject: alias })

async function errorCode(promise: Promise<unknown>): Promise<string | undefined> {
  try {
    const result = await promise
    if (typeof result === 'object' && result !== null && 'ok' in result && (result as { ok: unknown }).ok === false && 'code' in result) return String((result as { code: unknown }).code)
    return undefined
  } catch (error) {
    return (error as { data?: { code?: string } }).data?.code
  }
}

const heroDoc = (t: T, heroId: Id<'heroes'>) => t.run(async (ctx) => await ctx.db.get(heroId))

describe('hero gender (D149)', () => {
  let t: T
  beforeEach(async () => {
    vi.useFakeTimers()
    vi.setSystemTime(SLOT)
    t = convexTest(schema, modules)
    await seedWorld(t, { activeContentVersion: 'v1', lastPublishedAt: SLOT - 30 * 60_000 })
  })
  afterEach(() => vi.useRealTimers())

  it('sells a makeover for 200 gold, any number of times, and changes only the look', async () => {
    const heroId = await seedHero(t, { gold: 450 }, 'Ana')
    const ana = as(t, 'Ana')
    expect((await ana.query(api.inventory.mine, {})).makeover).toEqual({ price: 200, gender: 'male' })
    expect((await ana.query(api.heroes.mine, {}))!.scenePath).toContain('/idle/')

    expect(await errorCode(ana.mutation(api.inventory.buyMakeover, { operationId: opId(), gender: 'male' }))).toBe('INVALID_INPUT')
    const before = (await heroDoc(t, heroId))!
    expect(await ana.mutation(api.inventory.buyMakeover, { operationId: opId(), gender: 'female' })).toMatchObject({ changed: true, gold: -200 })
    const after = (await heroDoc(t, heroId))!
    expect(after).toMatchObject({ gender: 'female', gold: 250, level: before.level, name: before.name, hp: before.hp })
    expect((await ana.query(api.inventory.mine, {})).makeover).toEqual({ price: 200, gender: 'female' })
    expect((await ana.query(api.heroes.mine, {}))!.scenePath).toContain('/female_idle/')
    const log = await t.run(async (ctx) => await ctx.db.query('tickLogs').withIndex('by_heroId_and_at_and_sequence', (q) => q.eq('heroId', heroId)).order('desc').first())
    expect(log).toMatchObject({ summary: 'Booked a makeover. [[Baz]] is back at the desk with a new look.', deltas: { gold: -200 }, detail: { operation: 'makeover' } })

    // Straight back again: no daily stock, and male clears the field.
    await ana.mutation(api.inventory.buyMakeover, { operationId: opId(), gender: 'male' })
    expect(await heroDoc(t, heroId)).toMatchObject({ gold: 50 })
    expect((await heroDoc(t, heroId))!.gender).toBeUndefined()
    expect(await errorCode(ana.mutation(api.inventory.buyMakeover, { operationId: opId(), gender: 'female' }))).toBe('NOT_ENOUGH_GOLD')
    expect((await heroDoc(t, heroId))!.gender).toBeUndefined()
  })

  it('recruits a hero in the chosen look, and the original look when none is given', { timeout: 30_000 }, async () => {
    await t.run(async (ctx) => { const world = (await ctx.db.query('worldState').first())!; await ctx.db.patch(world._id, { activeContentVersion: 'v18' }) })
    await seedHero(t, { level: 6 }, 'Ed')
    const ed = as(t, 'Ed')
    await ed.mutation(api.roster.recruit, { operationId: opId(), heroClass: 'rogue', name: 'Vex', gender: 'female' })
    const rogue = await t.run(async (ctx) => await ctx.db.query('heroes').filter((q) => q.eq(q.field('name'), 'Vex')).unique())
    expect(rogue).toMatchObject({ class: 'rogue', gender: 'female', isActive: true })
    expect((await ed.query(api.heroes.mine, {}))!.scenePath).toContain('/female_rogue_idle/')
  })

  it('creates the first hero in the look chosen on the setup form', async () => {
    const link = (alias: string, heroGender?: 'male' | 'female') => t.mutation(internal.trmnl.linkInstall, { tokenIdentifier: `issuer|${alias}`, tokenHash: sha256Hex(`tok-${alias}`), publicAlias: alias, heroName: 'Steve', ...(heroGender ? { heroGender } : {}), timezone: 'UTC' })
    await link('Fi', 'female')
    await link('Gus', 'male')
    await link('Hal')
    const heroes = await t.run(async (ctx) => await ctx.db.query('heroes').collect())
    expect(heroes.map((hero) => hero.gender)).toEqual(['female', undefined, undefined])
  })

  it('shows the hero in its look on the public page', async () => {
    await seedHero(t, { gender: 'female' }, 'Bo')
    expect((await t.query(api.profiles.view, { alias: 'Bo' }))!.scenePath).toContain('/female_idle/')
  })

  it('draws the other hero of a meeting in its current look', async () => {
    const heroId = await seedHero(t, {}, 'Cy')
    const rivalId = await seedHero(t, { class: 'rogue', gender: 'female', name: 'Vex' }, 'Di')
    await t.run(async (ctx) => {
      await ctx.db.insert('tickLogs', {
        heroId,
        source: 'tick',
        sequence: 2,
        at: SLOT - 1000,
        kind: 'meeting',
        summary: '[[Vex]] gave you a pep talk at the whiteboard.',
        detail: { v: 1, simulationVersion: 1, contentVersion: 'v20', disposition: 'advanced', potionsUsed: 0, levelsGained: 0, goldPenalty: 0, heldFind: false, outcome: { variant: 'meeting', role: 'starter', rivalHeroId: rivalId, rivalName: 'Vex', rivalClass: 'rogue', kindId: 'pep_talk', meetingTick: 1 } },
        deltas: { xpEarned: 0, gold: 0, hp: 0 },
      })
    })
    const cy = as(t, 'Cy')
    expect((await cy.query(api.heroes.mine, {}))!.scenePath).toContain('/idle/coworker-female_rogue-whiteboard/')
    await t.run(async (ctx) => await ctx.db.patch(rivalId, { gender: undefined }))
    expect((await cy.query(api.heroes.mine, {}))!.scenePath).toContain('/idle/coworker-rogue-whiteboard/')
  })
})
