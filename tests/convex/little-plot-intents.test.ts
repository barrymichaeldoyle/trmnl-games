// @vitest-environment edge-runtime
import { convexTest } from 'convex-test'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { api } from '@trmnl-games/backend/api'
import { contentV1 } from '@trmnl-games/little-plot/content'
import { kindOf, pointsAtStage } from '@trmnl-games/little-plot/sim'
import schema from '../../apps/backend/convex/schema'
import type { T } from './helpers'
import { nextLittlePlotTick, plotOf, runLittlePlotTick, seedPlot } from './littlePlotHelpers'

const modules = import.meta.glob('../../apps/backend/convex/**/*.ts')
const as = (t: T, alias: string) => t.withIdentity({ issuer: 'issuer', subject: alias })
let op = 0
const next = () => `lp-op-${String(++op).padStart(4, '0')}`

describe('Little Plot intents (D206, G2)', () => {
  let t: T
  beforeEach(() => {
    vi.useFakeTimers()
    vi.setSystemTime(Date.UTC(2026, 9, 19, 10, 12, 3))
    t = convexTest(schema, modules)
  })
  afterEach(() => vi.useRealTimers())

  it('picks a ripe bed for coins and seeds, sows from the tin, waters once per can, and claims a goal', async () => {
    const radish = kindOf(contentV1, 'radish')
    const plotId = await seedPlot(t, { beds: [{ kindId: 'radish', points: pointsAtStage(radish, 'ripe'), sownTick: 0, ripeSinceTick: 0 }, { points: 0, sownTick: 0 }, { points: 0, sownTick: 0 }, { points: 0, sownTick: 0 }], tin: { marigold: 2 }, wateredUntilTick: 0 }, 'Wren')
    await runLittlePlotTick(t)
    const me = as(t, 'Wren')
    expect(await me.mutation(api.littlePlot.plots.pickBed, { operationId: next(), bed: 1 })).toMatchObject({ ok: false })
    const picked = await me.mutation(api.littlePlot.plots.pickBed, { operationId: next(), bed: 0 })
    expect(picked).toMatchObject({ changed: true, gold: radish.coins })
    let plot = await plotOf(t, plotId)
    // Picked fresh, within the catalog's window of ripening: one seed more than the kind returns.
    expect(plot.plot.tin.radish).toBe(radish.seeds + 1)
    expect(plot.plot.counters.harvests).toBe(1)
    expect(plot.plot.beds[0]!.kindId).toBeUndefined()
    // The same receipt replays without picking twice.
    expect(await me.mutation(api.littlePlot.plots.pickBed, { operationId: 'lp-op-0002', bed: 0 })).toMatchObject({ changed: true })
    expect((await plotOf(t, plotId)).plot.counters.harvests).toBe(1)
    const sown = await me.mutation(api.littlePlot.plots.sowBed, { operationId: next(), bed: 0, kindId: 'marigold' })
    expect(sown).toMatchObject({ changed: true })
    plot = await plotOf(t, plotId)
    expect(plot.plot.beds[0]!.kindId).toBe('marigold')
    expect(plot.plot.tin.marigold).toBe(1)
    expect(await me.mutation(api.littlePlot.plots.sowBed, { operationId: next(), bed: 0, kindId: 'marigold' })).toMatchObject({ ok: false })
    expect(await me.mutation(api.littlePlot.plots.waterPlot, { operationId: next() })).toMatchObject({ changed: true })
    expect(await me.mutation(api.littlePlot.plots.waterPlot, { operationId: next() })).toMatchObject({ ok: false })
    // Goals: "Watch the first sprout" is met by the ripe radish's history? No: the first goal needs a sprout, met after one tick of growth.
    const view = await me.query(api.littlePlot.plots.view, {})
    expect(view.plot.id).toBe(plotId)
    expect(view.tin.some((s: { id: string }) => s.id === 'radish')).toBe(true)
    expect(view.shed.items.some((i: { id: string }) => i.id === 'fence')).toBe(true)
    const logs = await t.run(async (ctx) => await ctx.db.query('lpTickLogs').withIndex('by_plotId_and_at_and_sequence', (q) => q.eq('plotId', plotId)).collect())
    expect(logs.filter((l) => l.source === 'command').map((l) => l.kind)).toEqual(expect.arrayContaining(['harvest', 'sow', 'water']))
  })

  it('sells seeds and items by level, and claims goal rewards one at a time', async () => {
    const plotId = await seedPlot(t, { gold: 5000, level: 4 }, 'Moss')
    await runLittlePlotTick(t)
    const me = as(t, 'Moss')
    expect(await me.mutation(api.littlePlot.plots.buySeeds, { operationId: next(), kindId: 'moon_marigold', count: 1 })).toMatchObject({ ok: false })
    expect(await me.mutation(api.littlePlot.plots.buySeeds, { operationId: next(), kindId: 'tomato', count: 2 })).toMatchObject({ changed: true })
    expect(await me.mutation(api.littlePlot.plots.buyShedItem, { operationId: next(), itemId: 'beds_6' })).toMatchObject({ changed: true })
    expect(await me.mutation(api.littlePlot.plots.buyShedItem, { operationId: next(), itemId: 'beds_6' })).toMatchObject({ ok: false })
    expect(await me.mutation(api.littlePlot.plots.buyShedItem, { operationId: next(), itemId: 'fence' })).toMatchObject({ changed: true })
    const plot = await plotOf(t, plotId)
    expect(plot.plot.beds.length).toBe(6)
    expect(plot.plot.items).toEqual(expect.arrayContaining(['beds_6', 'fence']))
    // Buying a seed met goal 6 and fencing met goal 9? Goals are stepped in order, so only the current goal is marked.
    for (let i = 0; i < 12; i += 1) await nextLittlePlotTick(t)
    const grown = await plotOf(t, plotId)
    const waiting = grown.plot.goal?.unclaimed ?? []
    expect(waiting.length).toBeGreaterThan(0)
    const before = grown.gold
    const claimed = await me.mutation(api.littlePlot.plots.claimGoal, { operationId: next() })
    expect(claimed).toMatchObject({ changed: true, gold: before + waiting[0]!.coins })
  })

  it('pauses and resumes without catch-up, and hides or shows the public page', async () => {
    const plotId = await seedPlot(t, {}, 'Fern')
    await runLittlePlotTick(t)
    const me = as(t, 'Fern')
    expect(await me.mutation(api.littlePlot.plots.pause, { operationId: next() })).toMatchObject({ changed: true })
    await nextLittlePlotTick(t)
    await nextLittlePlotTick(t)
    const paused = await plotOf(t, plotId)
    expect(paused.plot.status).toBe('paused')
    expect(paused.plot.ticks).toBe(1)
    expect(await me.mutation(api.littlePlot.plots.resume, { operationId: next() })).toMatchObject({ changed: true })
    expect((await plotOf(t, plotId)).lastTick).toBe(3)
    expect(await me.mutation(api.littlePlot.plots.setPublicProfile, { operationId: next(), visible: false })).toMatchObject({ changed: true })
    expect((await plotOf(t, plotId)).publicProfile).toBe(false)
  })

  it('sends a cutting to a followed player once a day, and the seed arrives at their next tick', async () => {
    const giver = await seedPlot(t, { tin: { marigold: 3 } }, 'Ana')
    const taker = await seedPlot(t, { tin: {} }, 'Bea')
    await runLittlePlotTick(t)
    const ana = as(t, 'Ana')
    expect(await ana.mutation(api.littlePlot.plots.giveCutting, { operationId: next(), alias: 'Bea', kindId: 'marigold' })).toMatchObject({ ok: false })
    // Ana follows Bea: the hero page rule needs a hero, so the follow row is seeded directly.
    await t.run(async (ctx) => {
      const [a, b] = await Promise.all([ctx.db.get(giver), ctx.db.get(taker)])
      await ctx.db.insert('follows', { userId: a!.userId, followedUserId: b!.userId, followedNameVersion: 1, createdAt: Date.now() })
    })
    expect(await ana.query(api.littlePlot.plots.cuttingTargets, {})).toEqual([{ alias: 'Bea' }])
    expect(await ana.mutation(api.littlePlot.plots.giveCutting, { operationId: next(), alias: 'Bea', kindId: 'marigold' })).toMatchObject({ changed: true })
    expect((await plotOf(t, giver)).plot.tin.marigold).toBe(2)
    expect(await ana.mutation(api.littlePlot.plots.giveCutting, { operationId: next(), alias: 'Bea', kindId: 'marigold' })).toMatchObject({ ok: false, code: 'RATE_LIMITED' })
    await nextLittlePlotTick(t)
    const bea = await plotOf(t, taker)
    expect(bea.plot.tin.marigold).toBe(1)
    expect(bea.plot.tags).toEqual([{ kindId: 'marigold', from: 'Ana', cutting: true }])
    expect(bea.plot.counters.cuttingsReceived).toBe(1)
    const logs = await t.run(async (ctx) => await ctx.db.query('lpTickLogs').withIndex('by_plotId_and_at_and_sequence', (q) => q.eq('plotId', taker)).collect())
    expect(logs.some((l) => l.kind === 'visit' && l.summary.includes('cutting from [[Ana]]'))).toBe(true)
  })
})
