// @vitest-environment edge-runtime
import { convexTest } from 'convex-test'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { api, internal } from '@trmnl-games/backend/api'
import type { Id } from '@trmnl-games/backend/data-model'
import schema from '../../apps/backend/convex/schema'
import { recordCatch } from '../../apps/backend/convex/idleAngler/records'
import { purgeAngler } from '../../apps/backend/convex/idleAngler/purge'
import type { T } from './helpers'
import { nextIdleAnglerTick, runIdleAnglerTick, seedAngler } from './idleAnglerHelpers'

const modules = import.meta.glob('../../apps/backend/convex/**/*.ts')
const seedCounters = async () => (await import('@trmnl-games/idle-angler/sim')).zeroCounters()
const logbookOf = (ids: readonly string[]) => Object.fromEntries(ids.map((id) => [id, { count: 1, bestGrams: 100, firstTick: 1 }]))
const MILLPOND_EIGHT = ['minnow', 'roach', 'rudd', 'perch', 'bream', 'tench', 'crucian_carp', 'eel']
const TEN = [...MILLPOND_EIGHT, 'gudgeon', 'dace']
const PIER_SIX = ['sand_eel', 'whiting', 'mackerel', 'pollock', 'flounder', 'wrasse']

describe('Idle Angler, the full game (D162, F2)', () => {
  let t: T
  beforeEach(async () => {
    vi.useFakeTimers()
    // Monday 19 Oct 2026, a spring week under content v2.
    vi.setSystemTime(Date.UTC(2026, 9, 19, 6, 5, 3))
    t = convexTest(schema, modules)
    await runIdleAnglerTick(t)
    await t.mutation(internal.idleAngler.operations.setActiveContentVersion, { contentVersion: 'v2' })
  })
  afterEach(() => vi.useRealTimers())

  const as = (alias: string) => t.withIdentity({ issuer: 'issuer', subject: alias })
  const angler = async (id: Id<'anglers'>) => (await t.run(async (ctx) => await ctx.db.get(id)))!
  const addFish = async (anglerId: Id<'anglers'>, fish: Array<[string, number, number]>) =>
    await t.run(async (ctx) => {
      const ids = []
      for (const [speciesId, grams, value] of fish) ids.push(await ctx.db.insert('catches', { anglerId, speciesId, grams, value, caughtTick: 1, contentVersion: 'v2', createdAt: Date.now(), band: 'day' }))
      return ids
    })

  it('puts three orders on the slate once orders unlock, and the Dock shows them with the fish that fit', async () => {
    const id = await seedAngler(t, { logbook: logbookOf(['minnow', 'roach', 'rudd', 'perch']) }, 'Pat')
    await nextIdleAnglerTick(t)
    expect((await angler(id)).orders).toHaveLength(3)
    const dock = await as('Pat').query(api.idleAngler.anglers.dock, {})
    expect(dock.full.orders).toHaveLength(3)
    expect(dock.full.features).toMatchObject({ orders: true, trophies: false, deadbait: false })
    expect(dock.full.season).toMatchObject({ id: 'spring', name: 'Spring' })
  })

  it('lists owned passes and the ones on sale, with no name or price for later passes (issue #7)', async () => {
    await seedAngler(t, { access: ['waders'], logbook: logbookOf(MILLPOND_EIGHT) }, 'Pat')
    const dock = await as('Pat').query(api.idleAngler.anglers.dock, {})
    expect(dock.shop.access.map((a: { id: string; owned: boolean }) => [a.id, a.owned])).toEqual([['waders', true], ['pier_permit', false], ['rowing_boat', false]])
    expect(dock.shop.moreAccess).toBe(true)
    expect(JSON.stringify(dock.shop)).not.toMatch(/ice_auger|Ice Auger|3500/)
  })

  it('marks a companion goal off at once: selling a fish on the "Sell a fish" goal pays it and names the next', async () => {
    const id = await seedAngler(t, { goal: { rung: 1, castsAtStart: 0 }, counters: { ...(await seedCounters()), fishCaught: 1 } }, 'Pat')
    const [fish] = await addFish(id, [['roach', 200, 10]])
    await as('Pat').mutation(api.idleAngler.anglers.sellCatches, { operationId: 'sell-goal-1', catchIds: [fish!] })
    const after = await angler(id)
    expect(after).toMatchObject({ gold: 20, goal: { rung: 2 }, counters: { goalsReached: 1, fishSold: 1 } })
    const lines = await t.run(async (ctx) => await ctx.db.query('iaTickLogs').withIndex('by_anglerId_and_at_and_sequence', (q) => q.eq('anglerId', id)).collect())
    expect(lines.map((l) => l.summary)).toContain('Goal reached: Sell a fish. Next: Buy a tub of bread.')
  })

  it('holds a reached goal\'s coins for the Claim button under content v3, then pays them once', async () => {
    await t.mutation(internal.idleAngler.operations.setActiveContentVersion, { contentVersion: 'v3' })
    const id = await seedAngler(t, { goal: { rung: 1, castsAtStart: 0 }, counters: { ...(await seedCounters()), fishCaught: 1 } }, 'Pat')
    const [fish] = await addFish(id, [['roach', 200, 10]])
    await as('Pat').mutation(api.idleAngler.anglers.sellCatches, { operationId: 'sell-goal-v3', catchIds: [fish!] })
    expect(await angler(id)).toMatchObject({ gold: 10, goal: { rung: 2, unclaimed: [{ id: 'first_sale', coins: 10 }] } })
    const dock = await as('Pat').query(api.idleAngler.anglers.dock, {})
    expect(dock.full.goal.unclaimed).toEqual([{ id: 'first_sale', title: 'Sell a fish', coins: 10 }])
    const claimed = await as('Pat').mutation(api.idleAngler.full.claimGoal, { operationId: 'claim-goal-1' })
    expect(claimed).toMatchObject({ changed: true, gold: 20 })
    expect(await as('Pat').mutation(api.idleAngler.full.claimGoal, { operationId: 'claim-goal-1' })).toEqual(claimed)
    expect(await angler(id)).toMatchObject({ gold: 20, goal: { rung: 2 } })
    expect(await as('Pat').mutation(api.idleAngler.full.claimGoal, { operationId: 'claim-goal-2' })).toMatchObject({ ok: false, message: expect.stringMatching(/No goal reward/) })
  })

  it('pays an order once for exactly the right fish, the receipt answering a retry', async () => {
    const id = await seedAngler(t, { logbook: logbookOf(['minnow', 'roach', 'rudd', 'perch']), orders: [{ id: 'o1', kind: 'species', speciesId: 'roach', count: 2, bonus: 20 }] }, 'Pat')
    const [a, b, c] = await addFish(id, [['roach', 200, 10], ['roach', 300, 14], ['perch', 400, 18]])
    expect(await as('Pat').mutation(api.idleAngler.full.handOverOrder, { operationId: 'order-0001', orderId: 'o1', catchIds: [a!, c!] })).toMatchObject({ ok: false, message: expect.stringMatching(/do not fit/) })
    const first = await as('Pat').mutation(api.idleAngler.full.handOverOrder, { operationId: 'order-0002', orderId: 'o1', catchIds: [a!, b!] })
    expect(first).toMatchObject({ changed: true, gold: 56, count: 2 })
    expect(await as('Pat').mutation(api.idleAngler.full.handOverOrder, { operationId: 'order-0002', orderId: 'o1', catchIds: [a!, b!] })).toEqual(first)
    expect(await angler(id)).toMatchObject({ gold: 56, orders: [], counters: { ordersFilled: 1 } })
    expect(await as('Pat').mutation(api.idleAngler.full.handOverOrder, { operationId: 'order-0003', orderId: 'o1', catchIds: [c!] })).toMatchObject({ ok: false })
  })

  it('swaps one order a day', async () => {
    const id = await seedAngler(t, { logbook: logbookOf(['minnow', 'roach', 'rudd', 'perch']) }, 'Pat')
    await nextIdleAnglerTick(t)
    const orders = (await angler(id)).orders!
    await as('Pat').mutation(api.idleAngler.full.swapFishmongerOrder, { operationId: 'swap-00001', orderId: orders[0]!.id })
    expect((await angler(id)).orders![0]).not.toEqual(orders[0])
    expect(await as('Pat').mutation(api.idleAngler.full.swapFishmongerOrder, { operationId: 'swap-00002', orderId: orders[1]!.id })).toMatchObject({ ok: false, message: expect.stringMatching(/swapped an order today/) })
  })

  it('turns a small fish into deadbait and refuses a big one', async () => {
    const id = await seedAngler(t, { logbook: logbookOf(TEN) }, 'Pat')
    const [roach, perch] = await addFish(id, [['roach', 120, 10], ['perch', 400, 18]])
    expect(await as('Pat').mutation(api.idleAngler.full.useAsBait, { operationId: 'bait-00001', catchId: perch! })).toMatchObject({ ok: false, message: expect.stringMatching(/small fish/) })
    await as('Pat').mutation(api.idleAngler.full.useAsBait, { operationId: 'bait-00002', catchId: roach! })
    expect((await angler(id)).bait).toMatchObject({ deadbait: 3 })
    expect(await t.run(async (ctx) => await ctx.db.get(roach!))).toBeNull()
  })

  it('mounts a big fish on a peg, shows it on the wall, and takes it down', async () => {
    const id = await seedAngler(t, { logbook: logbookOf(MILLPOND_EIGHT), gold: 500 }, 'Pat')
    const [tench, small] = await addFish(id, [['tench', 2000, 58], ['tench', 600, 40]])
    expect(await as('Pat').mutation(api.idleAngler.full.mountCatch, { operationId: 'mount-0001', catchId: small! })).toMatchObject({ ok: false, message: expect.stringMatching(/too small/) })
    expect(await as('Pat').mutation(api.idleAngler.full.mountCatch, { operationId: 'mount-0002', catchId: tench! })).toMatchObject({ gold: 342 })
    const wall = await as('Pat').query(api.idleAngler.full.trophies, {})
    expect(wall).toMatchObject({ pegs: 6, wall: [{ name: 'Tench', grams: 2000, peg: 0 }], medals: [] })
    // D167: the Dock counts free pegs, so the cooler offers Mount only while one is free.
    expect((await as('Pat').query(api.idleAngler.anglers.dock, {})).full.pegs).toMatchObject({ pegs: 6, free: 5 })
    await as('Pat').mutation(api.idleAngler.full.takeDownTrophy, { operationId: 'down-00001', trophyId: wall.wall[0].id })
    expect((await as('Pat').query(api.idleAngler.full.trophies, {})).wall).toEqual([])
  })

  it('points the mount goal at the wall until a cooler fish is big enough, and shows trophy weights (issue #6)', async () => {
    const id = await seedAngler(t, { logbook: logbookOf(MILLPOND_EIGHT), goal: { rung: 13, castsAtStart: 0 } }, 'Pat')
    const before = (await as('Pat').query(api.idleAngler.anglers.dock, {})).full
    expect(before.goal).toMatchObject({ line: 'Mount a fish on the wall', page: 'log', hint: "Catch a fish at 60% of its species' top weight, then mount it from the Cooler." })
    expect(before.trophies).toEqual({ minPercent: 60, fee: 100 })
    await addFish(id, [['tench', 1800, 58]])
    expect((await as('Pat').query(api.idleAngler.anglers.dock, {})).full.goal.page).toBe('cooler')
    const tench = (await as('Pat').query(api.idleAngler.anglers.logbook, {})).flatMap((w: { species: Array<{ id: string }> }) => w.species).find((s: { id: string }) => s.id === 'tench')
    expect(tench).toMatchObject({ maxGrams: 3000, trophyGrams: 1800 })
  })

  it('takes the angler out on a charter, spends the ticket and sails back to the Pier', async () => {
    const id = await seedAngler(t, { logbook: logbookOf(PIER_SIX), gold: 1000, waterId: 'harbour_pier', access: ['waders', 'pier_permit'], rodTier: 4, baitOnHook: 'strip', bait: { strip: 48 } }, 'Pat')
    expect(await as('Pat').mutation(api.idleAngler.anglers.travelTo, { operationId: 'sea-000001', waterId: 'deep_sea' })).toMatchObject({ ok: false, message: expect.stringMatching(/charter ticket/) })
    expect(await as('Pat').mutation(api.idleAngler.full.buyCharterTicket, { operationId: 'sea-000002' })).toMatchObject({ gold: 450 })
    await as('Pat').mutation(api.idleAngler.anglers.travelTo, { operationId: 'sea-000003', waterId: 'deep_sea' })
    await nextIdleAnglerTick(t)
    expect(await angler(id)).toMatchObject({ waterId: 'deep_sea', charterCasts: 96 })
    await t.run(async (ctx) => await ctx.db.patch(id, { charterCasts: 1 }))
    await nextIdleAnglerTick(t)
    expect((await angler(id)).charterCasts).toBe(0)
    await nextIdleAnglerTick(t)
    expect((await angler(id)).waterId).toBe('harbour_pier')
  })

  it('counts a first Open entry once and awards the weekend medals once', async () => {
    const ids = [await seedAngler(t, {}, 'Ana'), await seedAngler(t, {}, 'Bo'), await seedAngler(t, {}, 'Cy'), await seedAngler(t, {}, 'Di')]
    const saturday = Date.UTC(2026, 9, 24, 12, 0)
    const entries = await t.run(async (ctx) => {
      const out = []
      for (const [i, id] of ids.entries()) {
        const doc = (await ctx.db.get(id))!
        out.push((await recordCatch(ctx, doc, { waterId: 'millpond', speciesId: 'perch', grams: 300 + i * 100 }, saturday + i, true)).firstOpenEntry)
      }
      out.push((await recordCatch(ctx, (await ctx.db.get(ids[0]!))!, { waterId: 'millpond', speciesId: 'perch', grams: 250 }, saturday + 9, true)).firstOpenEntry)
      return out
    })
    expect(entries).toEqual([true, true, true, true, false])
    vi.setSystemTime(Date.UTC(2026, 9, 26, 0, 10))
    await t.mutation(internal.idleAngler.full.closeOpens, {})
    await t.mutation(internal.idleAngler.full.closeOpens, {})
    const after = await Promise.all(ids.map(angler))
    expect(after.map((a) => a.counters.medals ?? 0)).toEqual([0, 1, 1, 1])
    expect(after.map((a) => a.gold)).toEqual([0, 150, 300, 500])
    const medals = await t.run(async (ctx) => await ctx.db.query('iaTrophies').collect())
    expect(medals.map((m) => m.place).sort()).toEqual([1, 2, 3])
  })

  it('purges the wall and the shelf with the angler', async () => {
    const id = await seedAngler(t, {}, 'Pat')
    await t.run(async (ctx) => {
      const doc = (await ctx.db.get(id))!
      await ctx.db.insert('iaTrophies', { anglerId: id, userId: doc.userId, kind: 'fish', speciesId: 'tench', grams: 2000, water: 'millpond', at: 1, peg: 0 })
      await ctx.db.insert('iaTrophies', { anglerId: id, userId: doc.userId, kind: 'medal', speciesId: 'perch', grams: 600, water: 'millpond', at: 1, place: 1, periodKey: 'o2026-10-24' })
      while ((await purgeAngler(ctx, id, 50)) > 0);
    })
    expect(await t.run(async (ctx) => await ctx.db.query('iaTrophies').collect())).toEqual([])
  })
})
