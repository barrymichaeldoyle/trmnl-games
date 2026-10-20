// @vitest-environment edge-runtime
import { convexTest } from 'convex-test'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { api } from '@trmnl-games/backend/api'
import { contentV1 } from '@trmnl-games/little-plot/content'
import { kindOf, pointsAtStage, type PlotState } from '@trmnl-games/little-plot/sim'
import schema from '../../apps/backend/convex/schema'
import type { T } from './helpers'
import { nextLittlePlotTick, plotOf, runLittlePlotTick, seedPlot } from './littlePlotHelpers'

const modules = import.meta.glob('../../apps/backend/convex/**/*.ts')
const as = (t: T, alias: string) => t.withIdentity({ issuer: 'issuer', subject: alias })

describe('Little Plot tick on the shared engine (D206, G2)', () => {
  let t: T
  beforeEach(() => {
    vi.useFakeTimers()
    // 10:12 UTC on a Monday: a Little Plot slot, by day, in a spring week of the shared year.
    vi.setSystemTime(Date.UTC(2026, 9, 19, 10, 12, 3))
    t = convexTest(schema, modules)
  })
  afterEach(() => vi.useRealTimers())

  it('ticks on its own twelve-past slots and runs an empty world cleanly', async () => {
    const runId = await runLittlePlotTick(t)
    const run = await t.run(async (ctx) => await ctx.db.get(runId!))
    expect(run).toMatchObject({ tick: 1, state: 'completed', wallSlot: Date.UTC(2026, 9, 19, 10, 12), processed: 0, ripenings: 0 })
    expect(await runLittlePlotTick(t)).toBeNull()
  })

  it('grows the starters every tick, logs the stages and ripens a radish within its grow time', async () => {
    const plotId = await seedPlot(t)
    for (let i = 0; i < 24; i += 1) await nextLittlePlotTick(t)
    const plot = await plotOf(t, plotId)
    const logs = await t.run(async (ctx) => await ctx.db.query('lpTickLogs').withIndex('by_plotId_and_at_and_sequence', (q) => q.eq('plotId', plotId)).collect())
    expect(plot.lastTick).toBe(24)
    expect(plot.plot.ticks).toBe(24)
    expect(plot.plot.catalogue.radish).toBeDefined()
    expect(plot.level).toBeGreaterThanOrEqual(1)
    expect(logs.some((l) => l.kind === 'stage')).toBe(true)
    expect(logs.some((l) => l.kind === 'ripe')).toBe(true)
    expect(logs.map((l) => l.sequence)).toEqual(logs.map((_, i) => i + 2))
    // The pool row follows the plot.
    const pool = await t.run(async (ctx) => await ctx.db.query('lpGnomePool').withIndex('by_plotId', (q) => q.eq('plotId', plotId)).unique())
    expect(pool).toMatchObject({ eligible: true, cohortKey: '1-3' })
  })

  it('publishes hourly XP boards and rarity, and a paused plot is dormant between publications', async () => {
    const grower = await seedPlot(t, {}, 'Wren')
    const sleeper = await seedPlot(t, { status: 'paused' }, 'Moss')
    // 10:27, 10:42, 10:57: the last slot of the hour for a twelve-past world publishes.
    for (let i = 0; i < 3; i += 1) await nextLittlePlotTick(t)
    const sets = await t.run(async (ctx) => ({
      published: await ctx.db.query('lpLeaderboardPublications').withIndex('by_state', (q) => q.eq('state', 'published')).collect(),
      ranks: await ctx.db.query('lpRanks').collect(),
      stats: await ctx.db.query('lpAchievementStats').collect(),
      runs: await ctx.db.query('lpSimulationRuns').collect(),
    }))
    // The first run publishes (nothing published yet), and so does the hour's last slot.
    expect(sets.published.length).toBeGreaterThanOrEqual(1)
    expect(sets.stats.length).toBe(sets.published.length)
    const latest = sets.published.sort((a, b) => b.scoreAt - a.scoreAt)[0]!
    expect(sets.ranks.filter((r) => r.board === 'overall' && r.publicationId === latest._id).map((r) => r.heroId).sort()).toEqual([grower, sleeper].sort())
    // A paused plot is skipped as dormant on the two runs that do not publish.
    expect(sets.runs.filter((r) => !r.publishes).every((r) => r.skippedDormant === 1)).toBe(true)
    const view = await as(t, 'Wren').query(api.littlePlot.leaderboard.view, { board: 'overall' })
    expect(view.published).toBe(true)
    expect(view.entries.length).toBe(2)
  })

  it('moves one spare seed between gardens through the ledger when a gnome calls, and never destroys a seed', async () => {
    // Two public plots in the same level group at night; the visitor's draw is forced through the content's permille.
    const night = Date.UTC(2026, 9, 19, 23, 12, 3)
    vi.setSystemTime(night)
    const a = await seedPlot(t, { tin: { marigold: 6, lettuce: 6 } }, 'Ana')
    const b = await seedPlot(t, { tin: { daisy: 6 } }, 'Bea')
    const seedsBefore = async () => {
      const [pa, pb] = [await plotOf(t, a), await plotOf(t, b)]
      const sum = (p: typeof pa) => Object.values(p.plot.tin).reduce((s, n) => s + n, 0)
      return { a: sum(pa), b: sum(pb), total: sum(pa) + sum(pb) }
    }
    const before = await seedsBefore()
    // Only visits move seeds in this test: the pests, which take a seed for good, are switched off.
    const basePermille = { ...contentV1.pestRule.basePermille }
    ;(contentV1.visitor as { permille: number }).permille = 1000
    ;(contentV1.pestRule as { basePermille: Record<string, number> }).basePermille = { dawn: 0, day: 0, dusk: 0, night: 0 }
    try {
      // Pool rows exist after the first tick; visits can happen from the second.
      for (let i = 0; i < 12; i += 1) await nextLittlePlotTick(t)
    } finally {
      ;(contentV1.visitor as { permille: number }).permille = 10
      ;(contentV1.pestRule as { basePermille: Record<string, number> }).basePermille = basePermille
    }
    const visits = await t.run(async (ctx) => await ctx.db.query('lpVisits').collect())
    expect(visits.length).toBeGreaterThan(0)
    const after = await seedsBefore()
    // Rows still pending hold seeds in flight; applied ones have moved them. Nothing is lost either way.
    const inFlight = visits.filter((v) => v.state === 'pending' && v.effect === 'gain').length
    expect(after.total + inFlight).toBe(before.total)
    const logs = await t.run(async (ctx) => await ctx.db.query('lpTickLogs').collect())
    expect(logs.some((l) => l.kind === 'visit')).toBe(true)
    expect(logs.some((l) => l.kind === 'visit' && (l.summary.includes('[[Bea]]') || l.summary.includes('[[Ana]]')))).toBe(true)
  })

  it('queues the beds-ripe alert when half the beds ripen and the player turned it on', async () => {
    const radish = kindOf(contentV1, 'radish')
    const nearly: Partial<PlotState> = { beds: [{ kindId: 'radish', points: pointsAtStage(radish, 'ripe') - 1, sownTick: 0 }, { kindId: 'radish', points: pointsAtStage(radish, 'ripe') - 1, sownTick: 0 }, { kindId: 'lettuce', points: 0, sownTick: 0 }, { kindId: 'lettuce', points: 0, sownTick: 0 }] }
    const plotId = await seedPlot(t, nearly, 'Fern')
    await t.run(async (ctx) => {
      const plot = (await ctx.db.get(plotId))!
      await ctx.db.patch(plot.userId, { alerts: { asleep: false, merchant: false, bedsRipe: true, newSeed: true, quietStart: 21, quietEnd: 8 } })
    })
    await nextLittlePlotTick(t)
    const outbox = await t.run(async (ctx) => await ctx.db.query('alertOutbox').collect())
    expect(outbox.some((row) => row.kind === 'beds_ripe' && row.plotId === plotId)).toBe(true)
  })
})
