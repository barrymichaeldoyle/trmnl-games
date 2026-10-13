// @vitest-environment edge-runtime
import { convexTest } from 'convex-test'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { api, internal } from '@trmnl-games/backend/api'
import type { Id } from '@trmnl-games/backend/data-model'
import schema from '../../apps/backend/convex/schema'
import { contentV21 } from '@trmnl-games/desk-crawler/content/v21'
import type { ContentCatalog, LostPropertyRule, MeetingRule, RaidRule, SimulationResult } from '@trmnl-games/desk-crawler/sim/core/types'
import { settleLostProperty } from '../../apps/backend/convex/lib/lostProperty'
import { SLOT_MS } from '../../apps/backend/convex/sim/runs/tick'
import { runTick, seedHero, seedWorld, type T } from './helpers'

const modules = import.meta.glob('../../apps/backend/convex/**/*.ts')
const SLOT = Date.UTC(2026, 9, 14, 10, 0, 2)
const original = { lostProperty: contentV21.lostProperty!, raids: contentV21.raids!, meetings: contentV21.meetings!, constants: contentV21.constants }
const mutable = contentV21 as { -readonly [K in keyof ContentCatalog]: ContentCatalog[K] }
/** Every exploring tick looks, nobody raids or meets, and every loot find is gear, so a find needs no seed search. */
function rig() {
  mutable.lostProperty = { ...original.lostProperty, lookPermille: 1000 } satisfies LostPropertyRule
  mutable.raids = { ...original.raids, launchPermille: { cautious: 0, balanced: 0, bold: 0 } } satisfies RaidRule
  mutable.meetings = { ...original.meetings, launchPermille: 0 } satisfies MeetingRule
  mutable.constants = { ...original.constants, lootWeights: { ...original.constants.lootWeights, gear: 100, potion: 0, gold: 0, merchant: 0, event: 0 } }
}
function unrig() {
  Object.assign(mutable, original)
}

const all = (t: T) =>
  t.run(async (ctx) => ({
    spares: await ctx.db.query('lostProperty').collect(),
    items: await ctx.db.query('items').collect(),
    heroes: await ctx.db.query('heroes').collect(),
  }))

async function tickAt(t: T, slot: number) {
  vi.setSystemTime(SLOT + slot * SLOT_MS)
  return await runTick(t)
}

/** The Office, where nobody is knocked out, so the finder never wanders off the spare's floor in a test. */
const finder = { level: 9, hp: 100, gold: 400, biomeId: 'office_cubicles', bagCapacity: 20 }
const owner = { level: 9, hp: 100, gold: 400, biomeId: 'office_cubicles' }

async function lay(t: T, ownerHeroId: Id<'heroes'>, overrides: Record<string, unknown> = {}) {
  await t.run(async (ctx) => {
    const hero = (await ctx.db.get(ownerHeroId))!
    await ctx.db.insert('lostProperty', {
      ownerHeroId,
      ownerUserId: hero.userId,
      biomeId: 'office_cubicles',
      shard: 7,
      templateId: 'spork_halberd',
      kind: 'weapon',
      rarity: 'rare',
      affixId: 'lucky',
      name: 'Spork Halberd',
      contentVersion: 'v21',
      droppedTick: 5,
      state: 'lying',
      ...overrides,
    })
  })
}

/** Tick until the finder picks the spare up, at most 40 ticks; returns the slot after the find. */
async function untilFound(t: T): Promise<number> {
  for (let slot = 0; slot < 40; slot += 1) {
    await tickAt(t, slot)
    if ((await all(t)).items.some((item) => item.relicUserId !== undefined)) return slot + 1
  }
  throw new Error('no spare found in 40 ticks')
}

describe('lost property backend (D145 L2)', () => {
  let t: T
  beforeEach(async () => {
    vi.useFakeTimers()
    vi.setSystemTime(SLOT)
    t = convexTest(schema, modules)
    rig()
  })
  afterEach(() => {
    unrig()
    vi.useRealTimers()
  })

  it('reads nothing under v20: a lying spare stays put', async () => {
    await seedWorld(t, { activeContentVersion: 'v20', currentTick: 10, lastPublishedAt: SLOT - 30 * 60_000 })
    await seedHero(t, finder, 'Ana')
    const bo = await seedHero(t, owner, 'Bo')
    await lay(t, bo)
    for (let slot = 0; slot < 6; slot += 1) await tickAt(t, slot)
    const state = await all(t)
    expect(state.spares.map((row) => row.state)).toEqual(['lying'])
    expect(state.items.some((item) => item.relicUserId !== undefined)).toBe(false)
  })

  it('a finder takes the spare as its gear find with the owner’s name on it, and the owner hears once', async () => {
    await seedWorld(t, { activeContentVersion: 'v21', currentTick: 10, lastPublishedAt: SLOT - 30 * 60_000 })
    const ana = await seedHero(t, finder, 'Ana')
    const bo = await seedHero(t, owner, 'Bo')
    await lay(t, bo)
    const next = await untilFound(t)
    let state = await all(t)
    // Bo may already have heard in the same run, which deletes the row; otherwise it waits marked with its finder.
    for (const row of state.spares) expect(row).toMatchObject({ state: 'found', finderHeroId: ana, finderName: 'Ana', finderNameVersion: 1, finderClass: 'warrior' })
    const spare = state.items.filter((item) => item.relicUserId !== undefined)
    expect(spare).toHaveLength(1)
    expect(spare[0]).toMatchObject({ heroId: ana, templateId: 'spork_halberd', rarity: 'rare', affixId: 'lucky', relicName: 'Bo', relicNameVersion: 1 })
    expect(state.heroes.find((hero) => hero._id === ana)!.counters.lostPropertyFound).toBe(1)
    const found = await t.run(async (ctx) => (await ctx.db.query('tickLogs').collect()).filter((log) => log.heroId === ana && 'outcome' in log.detail && log.detail.outcome.variant === 'loot' && log.detail.outcome.spare !== undefined))
    expect(found).toHaveLength(1)
    expect(found[0]!.detail).toMatchObject({ outcome: { spare: { rivalName: 'Bo', rivalUserId: expect.any(String), rivalNameVersion: 1 } } })
    expect(found[0]!.summary).toContain('[[Bo]]')
    // Bo hears at its next evaluation, and the row is gone.
    await tickAt(t, next)
    await tickAt(t, next + 1)
    state = await all(t)
    expect(state.spares).toEqual([])
    const told = await t.run(async (ctx) => (await ctx.db.query('tickLogs').collect()).filter((log) => log.heroId === bo && log.kind === 'lost_property'))
    expect(told).toHaveLength(1)
    expect(told[0]!.summary).toMatch(/\[\[Ana\]\].*Spork Halberd.*Office Cubicles/)
    expect(told[0]!.detail).toMatchObject({ outcome: { variant: 'lost_property', rivalUserId: expect.any(String), rivalNameVersion: 1 } })
  })

  it('never finds a spare the same account dropped', async () => {
    await seedWorld(t, { activeContentVersion: 'v21', currentTick: 10, lastPublishedAt: SLOT - 30 * 60_000 })
    const ana = await seedHero(t, finder, 'Ana')
    await lay(t, ana)
    for (let slot = 0; slot < 12; slot += 1) await tickAt(t, slot)
    expect((await all(t)).spares.map((row) => row.state)).toEqual(['lying'])
  })

  it('commits nothing twice when a duplicate batch worker replays the finding run', async () => {
    await seedWorld(t, { activeContentVersion: 'v21', currentTick: 10, lastPublishedAt: SLOT - 30 * 60_000 })
    await seedHero(t, finder, 'Ana')
    const bo = await seedHero(t, owner, 'Bo')
    await lay(t, bo)
    let runId: Id<'simulationRuns'> | null = null
    for (let slot = 0; slot < 40 && !(await all(t)).items.some((item) => item.relicUserId !== undefined); slot += 1) runId = (await tickAt(t, slot)) as Id<'simulationRuns'> | null
    const before = await all(t)
    await t.mutation(internal.sim.runs.tick.simulateBatch, { runId: runId!, expectedSequence: 0 })
    await t.finishAllScheduledFunctions(vi.runAllTimers)
    const after = await all(t)
    expect(after.spares).toEqual(before.spares)
    expect(after.items.length).toBe(before.items.length)
    expect(after.heroes.map((hero) => hero.counters)).toEqual(before.heroes.map((hero) => hero.counters))
  })

  it('a knockout writes the hero’s row, replaces a lying one, and leaves a found one for its notice', async () => {
    await seedWorld(t, { activeContentVersion: 'v21', currentTick: 10, lastPublishedAt: SLOT - 30 * 60_000 })
    const bo = await seedHero(t, owner, 'Bo')
    const drop = (templateId: string, tick: number) => ({ spareDropped: { templateId, kind: 'weapon' as const, rarity: 'common' as const, name: templateId, biomeId: 'cafeteria_depths', tick, shard: 99 } }) as unknown as SimulationResult
    const settle = (result: SimulationResult) =>
      t.run(async (ctx) => {
        const hero = (await ctx.db.get(bo))!
        const user = (await ctx.db.get(hero.userId))!
        const own = await ctx.db.query('lostProperty').withIndex('by_ownerHeroId', (q) => q.eq('ownerHeroId', bo)).first()
        await settleLostProperty(ctx, { hero, owner: user, result, pick: undefined, own, contentVersion: 'v21', tick: 0 })
      })
    await settle(drop('ladle_of_ruin', 20))
    expect((await all(t)).spares.map((row) => [row.templateId, row.state, row.biomeId])).toEqual([['ladle_of_ruin', 'lying', 'cafeteria_depths']])
    await settle(drop('spork_halberd', 30))
    expect((await all(t)).spares.map((row) => [row.templateId, row.droppedTick])).toEqual([['spork_halberd', 30]])
    await t.run(async (ctx) => {
      const row = (await ctx.db.query('lostProperty').first())!
      await ctx.db.patch(row._id, { state: 'found' })
    })
    await settle(drop('mop_of_doom', 40))
    expect((await all(t)).spares.map((row) => [row.templateId, row.state])).toEqual([['spork_halberd', 'found']])
  })

  it('shows held spares in the bag and on the public page with masked names, and the owner’s card', async () => {
    await seedWorld(t, { activeContentVersion: 'v21', currentTick: 10, lastPublishedAt: SLOT - 30 * 60_000 })
    await seedHero(t, finder, 'Ana')
    // Paused, so the notice waits and the card shows who found it.
    const bo = await seedHero(t, { ...owner, status: 'paused', pausedFromStatus: 'exploring' }, 'Bo')
    await lay(t, bo)
    await untilFound(t)
    const asAna = t.withIdentity({ issuer: 'issuer', subject: 'Ana' })
    const asBo = t.withIdentity({ issuer: 'issuer', subject: 'Bo' })
    const bag = await asAna.query(api.inventory.mine, {})
    const labelled = (bag.gear as Array<{ spareOf: { ownerName: string; profile: boolean } | null }>).filter((item) => item.spareOf !== null)
    expect(labelled.map((item) => item.spareOf)).toEqual([{ ownerName: 'Bo', profile: true }])
    expect(await asAna.query(api.lostProperty.mine, {})).toMatchObject({ enabled: true, mySpare: null, held: [{ name: 'Spork Halberd', rarity: 'rare', ownerName: 'Bo' }], total: 1 })
    expect(await asBo.query(api.lostProperty.mine, {})).toMatchObject({ mySpare: { name: 'Spork Halberd', floor: 'Office Cubicles', found: true, finderName: 'Ana' }, held: [] })
    const page = await t.query(api.profiles.view, { alias: 'Ana' })
    expect(page.lostProperty).toEqual([{ name: 'Spork Halberd', rarity: 'rare', kind: 'weapon', ownerName: 'Bo', profile: true }])
    await t.run(async (ctx) => {
      const user = await ctx.db.query('users').withIndex('by_normalizedAlias', (q) => q.eq('normalizedAlias', 'bo')).unique()
      await ctx.db.patch(user!._id, { publicAlias: 'Robert', normalizedAlias: 'robert', publicNameVersion: 2 })
    })
    expect((await t.query(api.profiles.view, { alias: 'Ana' })).lostProperty[0].ownerName).toBe('Hidden player')
    const log = (await asAna.query(api.heroes.recentLog, { paginationOpts: { numItems: 40, cursor: null } })).page as Array<{ kind: string; summary: string }>
    expect(log.some((entry) => entry.summary.includes('[[Hidden player]]'))).toBe(true)
  })

  it('game deletion removes the owner’s row and takes its name off the finder’s item, which stays', async () => {
    await seedWorld(t, { activeContentVersion: 'v21', currentTick: 10, lastPublishedAt: SLOT - 30 * 60_000 })
    const ana = await seedHero(t, finder, 'Ana')
    const bo = await seedHero(t, owner, 'Bo')
    await lay(t, bo)
    await untilFound(t)
    const before = (await all(t)).items.filter((item) => item.heroId === ana).length
    await t.withIdentity({ issuer: 'issuer', subject: 'Bo' }).mutation(api.deletion.requestGameDeletion, { operationId: 'game-delete-spares', confirm: 'DELETE' })
    await t.finishAllScheduledFunctions(vi.runAllTimers)
    const after = await all(t)
    expect(after.spares).toEqual([])
    const anaItems = after.items.filter((item) => item.heroId === ana)
    expect(anaItems.length).toBe(before)
    expect(anaItems.some((item) => item.templateId === 'spork_halberd' && item.relicUserId === undefined && item.relicName === undefined)).toBe(true)
  })
})
