// @vitest-environment edge-runtime
import { convexTest } from 'convex-test'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { api } from '@trmnl-games/backend/api'
import { contentV1 } from '@trmnl-games/pixel-wars/content'
import { cellAt, type FactionId } from '@trmnl-games/pixel-wars/sim'
import schema from '../../apps/backend/convex/schema'
import { toMapState } from '../../apps/backend/convex/pixelWars/maps'
import type { T } from './helpers'
import { deskOf, globalMap, nextPixelWarsTick, runPixelWarsTick, seedDesk } from './pixelWarsHelpers'

const modules = import.meta.glob('../../apps/backend/convex/**/*.ts')
const as = (t: T, alias: string) => t.withIdentity({ issuer: 'issuer', subject: alias })
let op = 0
const next = () => `pw-op-${String(++op).padStart(4, '0')}`

describe('Pixel Wars tick on the shared engine (D214, W2)', () => {
  let t: T
  beforeEach(() => {
    vi.useFakeTimers()
    // 10:03 UTC on a Monday: a Pixel Wars slot, by day, so no shield is up for a UTC owner.
    vi.setSystemTime(Date.UTC(2026, 9, 19, 10, 3, 3))
    t = convexTest(schema, modules)
  })
  afterEach(() => vi.useRealTimers())

  it('ticks on its own three-past slots and runs an empty world cleanly', async () => {
    const runId = await runPixelWarsTick(t)
    const run = await t.run(async (ctx) => await ctx.db.get(runId!))
    expect(run).toMatchObject({ tick: 1, state: 'completed', wallSlot: Date.UTC(2026, 9, 19, 10, 3), processed: 0, orders: 0 })
    expect(await runPixelWarsTick(t)).toBeNull()
  })

  it('places desks on the lattice, resolves queued orders once per run and credits the painter', async () => {
    const ana = await seedDesk(t, 1, 'Ana')
    const bea = await seedDesk(t, 2, 'Bea', {}, ana)
    const map = await globalMap(t)
    expect(map.seats.length).toBe(2)
    const [a, b] = map.seats
    expect(Math.max(Math.abs(a!.x - b!.x), Math.abs(a!.y - b!.y))).toBe(3)
    expect((await deskOf(t, ana)).counters.invitesPlaced).toBe(1)
    // Ana paints the ground beside her desk for the next tick.
    const dx = Math.sign(b!.x - a!.x)
    const dy = dx === 0 ? Math.sign(b!.y - a!.y) : 0
    const me = as(t, 'Ana')
    expect(await me.mutation(api.pixelWars.desks.queueOrder, { operationId: next(), x: a!.x + dx, y: a!.y + dy, kind: 'paint', drops: 2 })).toMatchObject({ changed: true })
    // Out of reach: refused before any drop is spent.
    expect(await me.mutation(api.pixelWars.desks.queueOrder, { operationId: next(), x: a!.x + 5, y: a!.y + 5, kind: 'paint', drops: 1 })).toMatchObject({ ok: false })
    expect((await deskOf(t, ana)).well.drops).toBe(contentV1.wellCap - 2)
    await runPixelWarsTick(t)
    const after = await globalMap(t)
    const state = toMapState(after)
    expect(cellAt(state, a!.x + dx, a!.y + dy)).toMatchObject({ faction: 1, ink: 2, painter: 1 })
    const desk = await deskOf(t, ana)
    expect(desk.counters.cellsPainted).toBe(1)
    expect(desk.counters.goalsReached).toBe(1)
    // The first run of a world publishes, so the hour's held cells (desk and the new one) and the full desk pay too.
    expect(desk.lifetimeXp).toBe(contentV1.goals[0]!.xp + 2 * contentV1.xp.heldCellPerHour + contentV1.xp.deskFullHour)
    const snapshot = await t.run(async (ctx) => await ctx.db.query('pwMapTicks').withIndex('by_mapId_and_tick', (q) => q.eq('mapId', after._id).eq('tick', 1)).unique())
    expect(snapshot?.seatEvents['1']).toMatchObject({ painted: 1 })
    expect(snapshot?.lines[0]).toContain('Ink painted 1 cell')
    expect(await t.run(async (ctx) => await ctx.db.query('pwOrders').collect())).toEqual([])
    expect(await t.run(async (ctx) => await ctx.db.query('pwOrderBoards').collect())).toEqual([])
    const view = await me.query(api.pixelWars.desks.view, {})
    expect(view.desk.held).toBe(2)
    expect(view.map.shares.find((s: { faction: number }) => s.faction === 1).cells).toBe(2)
    void bea
  })

  it('takes a desk, tells the owner, and the owner liberates it at triple strength', async () => {
    const ana = await seedDesk(t, 1, 'Ana')
    await seedDesk(t, 2, 'Bea', {}, ana)
    await t.run(async (ctx) => {
      const desk = (await ctx.db.get(ana))!
      await ctx.db.patch(desk.userId, { alerts: { asleep: false, merchant: false, deskTaken: true, leadLost: true, bell: true, quietStart: 21, quietEnd: 8 } })
    })
    const map = await globalMap(t)
    const [a, b] = map.seats
    const step = { x: Math.sign(a!.x - b!.x), y: Math.sign(a!.y - b!.y) }
    const bea = as(t, 'Bea')
    // Bea paints the two cells between the desks, one a tick, then strikes Ana's desk with enough to take it.
    expect(await bea.mutation(api.pixelWars.desks.queueOrder, { operationId: next(), x: b!.x + step.x, y: b!.y + step.y, kind: 'paint', drops: 1 })).toMatchObject({ changed: true })
    await runPixelWarsTick(t)
    expect(await bea.mutation(api.pixelWars.desks.queueOrder, { operationId: next(), x: b!.x + 2 * step.x, y: b!.y + 2 * step.y, kind: 'paint', drops: 1 })).toMatchObject({ changed: true })
    await nextPixelWarsTick(t)
    expect(await bea.mutation(api.pixelWars.desks.queueOrder, { operationId: next(), x: a!.x, y: a!.y, kind: 'strike', drops: contentV1.deskInkCap + 2 })).toMatchObject({ changed: true })
    await nextPixelWarsTick(t)
    const taken = toMapState(await globalMap(t))
    expect(cellAt(taken, a!.x, a!.y)).toMatchObject({ faction: 2, desk: true })
    // Ana turned the desk-taken alert on before the strike landed: one outbox row, held half an hour, naming Hatch.
    const outbox = await t.run(async (ctx) => await ctx.db.query('alertOutbox').collect())
    // (The test owner has no push device, so the sender skips the row once it is due; it was queued with the taker's name.)
    expect(outbox.filter((row) => row.kind === 'desk_taken' && row.deskId === ana)).toMatchObject([{ offerName: 'Hatch', reason: 'no_devices' }])
    const anaDesk = await deskOf(t, ana)
    expect(anaDesk.counters.deskFalls).toBe(1)
    const logs = await t.run(async (ctx) => await ctx.db.query('pwTickLogs').withIndex('by_deskId_and_at_and_sequence', (q) => q.eq('deskId', ana)).collect())
    expect(logs.some((l) => l.kind === 'fell')).toBe(true)
    expect((await bea.query(api.pixelWars.desks.view, {})).desk.counters.desksTaken).toBe(1)
    // Ana liberates with one drop, no adjacency needed.
    const me = as(t, 'Ana')
    expect(await me.mutation(api.pixelWars.desks.queueOrder, { operationId: next(), x: a!.x, y: a!.y, kind: 'liberate', drops: 1 })).toMatchObject({ changed: true })
    await nextPixelWarsTick(t)
    expect(cellAt(toMapState(await globalMap(t)), a!.x, a!.y)?.faction).toBe(1)
    expect((await deskOf(t, ana)).counters.desksLiberated).toBe(1)
  })

  it('publishes hourly XP boards and pays held-cell XP, and an unplaced desk is dormant', async () => {
    const ana = await seedDesk(t, 1, 'Ana')
    const idle = await seedDesk(t, 0, 'Idle')
    // 10:18, 10:33, 10:48: the last slot of the hour for a three-past world publishes.
    for (let i = 0; i < 3; i += 1) await nextPixelWarsTick(t)
    const sets = await t.run(async (ctx) => ({
      published: await ctx.db.query('pwLeaderboardPublications').withIndex('by_state', (q) => q.eq('state', 'published')).collect(),
      ranks: await ctx.db.query('pwRanks').collect(),
      runs: await ctx.db.query('pwSimulationRuns').collect(),
    }))
    expect(sets.published.length).toBeGreaterThanOrEqual(1)
    const latest = sets.published.sort((a, b) => b.scoreAt - a.scoreAt)[0]!
    expect(sets.ranks.filter((r) => r.board === 'overall' && r.publicationId === latest._id).map((r) => r.heroId).sort()).toEqual([ana, idle].sort())
    expect(sets.runs.filter((r) => !r.publishes).every((r) => r.skippedDormant === 1)).toBe(true)
    // Two publications (the world's first run, then the hour's last slot): the held desk cell and the full-desk bonus each time.
    const desk = await deskOf(t, ana)
    expect(sets.published.length).toBe(2)
    expect(desk.lifetimeXp).toBe(2 * (contentV1.xp.heldCellPerHour + contentV1.xp.deskFullHour))
    expect(desk.counters.deskFullHours).toBe(2)
    const view = await as(t, 'Ana').query(api.pixelWars.leaderboard.view, { board: 'overall' })
    expect(view.published).toBe(true)
    expect(view.entries.length).toBe(2)
  })

  it('refuses a strike on a shielded desk, refunds nothing because nothing was taken, and queues at night as a night order', async () => {
    const ana = await seedDesk(t, 1, 'Ana')
    await seedDesk(t, 2, 'Bea', {}, ana)
    const map = await globalMap(t)
    const [a, b] = map.seats
    const step = { x: Math.sign(a!.x - b!.x), y: Math.sign(a!.y - b!.y) }
    const bea = as(t, 'Bea')
    await bea.mutation(api.pixelWars.desks.queueOrder, { operationId: next(), x: b!.x + step.x, y: b!.y + step.y, kind: 'paint', drops: 1 })
    await runPixelWarsTick(t)
    await bea.mutation(api.pixelWars.desks.queueOrder, { operationId: next(), x: b!.x + 2 * step.x, y: b!.y + 2 * step.y, kind: 'paint', drops: 1 })
    await nextPixelWarsTick(t)
    // Midnight for Ana (UTC): her desk is shielded, so the strike is refused at order time.
    vi.setSystemTime(Date.UTC(2026, 9, 20, 0, 3, 3))
    const refused = await bea.mutation(api.pixelWars.desks.queueOrder, { operationId: next(), x: a!.x, y: a!.y, kind: 'strike', drops: 7 })
    expect(refused).toMatchObject({ ok: false, message: expect.stringContaining('night shield') })
    // Ground beside her is not shielded, and an order placed at night counts as a night order.
    const before = (await deskOf(t, ana)).counters.ordersAtNight
    const me = as(t, 'Ana')
    expect(await me.mutation(api.pixelWars.desks.queueOrder, { operationId: next(), x: a!.x + step.x, y: a!.y + step.y, kind: 'paint', drops: 1 })).toMatchObject({ changed: true })
    expect((await deskOf(t, ana)).counters.ordersAtNight).toBe(before + 1)
  })

  it('rings the bell on the first tick of a new week: the standings are kept, the map painted clean, the wells filled', async () => {
    const ana = await seedDesk(t, 1, 'Ana')
    await t.run(async (ctx) => {
      const desk = (await ctx.db.get(ana))!
      await ctx.db.patch(desk.userId, { alerts: { asleep: false, merchant: false, bell: true, quietStart: 21, quietEnd: 8 } })
    })
    const map = await globalMap(t)
    const a = map.seats[0]!
    const me = as(t, 'Ana')
    await me.mutation(api.pixelWars.desks.queueOrder, { operationId: next(), x: a.x + 1, y: a.y, kind: 'paint', drops: 3 })
    await runPixelWarsTick(t)
    expect(cellAt(toMapState(await globalMap(t)), a.x + 1, a.y)?.faction).toBe(1)
    await nextPixelWarsTick(t)
    expect((await deskOf(t, ana)).seasonWeek).toBeGreaterThan(0)
    // Monday 2026-10-26 00:03 UTC: the next week's first slot.
    vi.setSystemTime(Date.UTC(2026, 9, 26, 0, 3, 3))
    await runPixelWarsTick(t)
    const after = await globalMap(t)
    expect(cellAt(toMapState(after), a.x + 1, a.y)?.faction).toBe(0)
    expect(cellAt(toMapState(after), a.x, a.y)).toMatchObject({ faction: 1, ink: contentV1.deskInkCap })
    expect(after.lastWinner).toBe(1 as FactionId)
    const seasons = await t.run(async (ctx) => await ctx.db.query('pwSeasons').collect())
    expect(seasons.length).toBe(1)
    expect(seasons[0]!.winner).toBe(1)
    const desk = await deskOf(t, ana)
    expect(desk.well.drops).toBe(contentV1.wellCap)
    expect(desk.counters.seasonsPlayed).toBe(1)
    // The bell alert names the winner, once for the week.
    const bells = await t.run(async (ctx) => (await ctx.db.query('alertOutbox').collect()).filter((row) => row.kind === 'bell'))
    expect(bells).toMatchObject([{ offerName: 'Ink', deskId: ana }])
    expect(desk.counters.seasonsWon).toBe(1)
    expect(desk.week.painted).toBe(0)
  })
})
