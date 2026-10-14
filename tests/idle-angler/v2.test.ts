import { describe, expect, it } from 'vitest'
import { contentV1, contentV2 } from '@trmnl-games/idle-angler/content'
import {
  bitePermille,
  candidates,
  catchMatches,
  entersOpen,
  evaluateGoal,
  fillOrder,
  openPeriod,
  openTarget,
  orderDay,
  refillOrders,
  runAt,
  seasonAt,
  simulateAngler,
  starterAngler,
  swapOrder,
  unlocked,
  waterOf,
  type AnglerState,
  type CastInput,
  type CatchRecord,
  type Order,
  type StreamSeeds,
} from '@trmnl-games/idle-angler/sim'
import { drawGrams } from '@trmnl-games/idle-angler/sim/simulate'
import { baitFromCatch, buyCharter, buyPegs, buyRod, mountFish, travel } from '@trmnl-games/idle-angler/sim/shop'
import { deriveAnglerSeeds, forecast } from '@trmnl-games/idle-angler/sim/seed'
import { createRng } from '@trmnl-games/engine/rng'
import { allSatisfied } from '@trmnl-games/idle-angler/content/achievements'
import { runCohort, runHarness } from '../../tools/balance/idle-angler-v2'

const content = contentV2
/** Monday 19 Oct 2026, the start of a spring week under v2. */
const SPRING = Date.UTC(2026, 9, 19, 12, 0)
const WEEK = 7 * 86_400_000
const SUMMER = SPRING + WEEK
const AUTUMN = SPRING + 2 * WEEK
const WINTER = SPRING + 3 * WEEK

const logbookOf = (ids: readonly string[]) => Object.fromEntries(ids.map((id) => [id, { count: 1, bestGrams: 100, firstTick: 1 }]))
const MILLPOND_FOUR = ['minnow', 'roach', 'rudd', 'perch']
const RICH: Partial<AnglerState> = { rodTier: 5, coolerTier: 4, gold: 50_000, access: ['waders', 'pier_permit', 'rowing_boat', 'ice_auger'] }

function input(overrides: Partial<CastInput> = {}, angler: Partial<AnglerState> = {}): CastInput {
  return { angler: { ...starterAngler(content, 0), ...angler }, coolerCount: 0, tick: 10, tickAt: SPRING, weather: 'clear', content, streams: deriveAnglerSeeds('seed', 'angler', 10, 1), ...overrides }
}

function seedsWhere(predicate: (streams: StreamSeeds) => boolean): StreamSeeds {
  for (let tick = 1; tick < 20_000; tick += 1) {
    const streams = deriveAnglerSeeds('seed', 'angler', tick, 1)
    if (predicate(streams)) return streams
  }
  throw new Error('no seed found')
}

describe('seasons and runs (D162)', () => {
  it('turns one season a week from Monday 00:00 UTC, and has none under v1', () => {
    expect([SPRING, SUMMER, AUTUMN, WINTER, WINTER + WEEK].map((at) => seasonAt(content, at))).toEqual(['spring', 'summer', 'autumn', 'winter', 'spring'])
    expect(seasonAt(content, Date.UTC(2026, 9, 25, 23, 59))).toBe('spring')
    expect(seasonAt(content, Date.UTC(2026, 9, 26, 0, 0))).toBe('summer')
    expect(seasonAt(contentV1, SPRING)).toBeUndefined()
  })

  it('runs Monday to Thursday of its season at its water only', () => {
    expect(runAt(content, 'harbour_pier', SUMMER)?.id).toBe('mackerel_run')
    expect(runAt(content, 'harbour_pier', SUMMER + 3 * 86_400_000)?.id).toBe('mackerel_run')
    expect(runAt(content, 'harbour_pier', SUMMER + 4 * 86_400_000)).toBeUndefined()
    expect(runAt(content, 'millpond', SUMMER)).toBeUndefined()
  })

  it('keeps the v1 forecast unchanged and reads the seasonal table under v2', () => {
    const pond = waterOf(contentV1, 'millpond')
    expect(forecast('w', pond, SPRING)).toBe(forecast('w', pond, SPRING, contentV1))
    const weathers = new Set(Array.from({ length: 300 }, (_, block) => forecast('w', waterOf(content, 'harbour_pier'), WINTER + (block % 28) * 6 * 3_600_000 + Math.floor(block / 28) * 4 * WEEK, content)))
    expect(weathers.has('wind')).toBe(true)
  })

  it('scales the bite by season and lets only in-season fish bite', () => {
    const pond = waterOf(content, 'millpond')
    expect(bitePermille(content, pond, 1, 'worms', { band: 'day', weather: 'clear', season: 'winter' })).toBeLessThan(bitePermille(content, pond, 1, 'worms', { band: 'day', weather: 'clear', season: 'spring' }))
    const river = waterOf(content, 'river_bend')
    const ids = (season: 'summer' | 'winter') => candidates(content, river, 'spinner', { band: 'night', weather: 'clear', season }).map(([s]) => s.id)
    expect(ids('summer')).toContain('sea_trout')
    expect(ids('winter')).not.toContain('sea_trout')
  })

  it('lifts the salmon run over the rain rule and multiplies its draw weight', () => {
    const river = waterOf(content, 'river_bend')
    const conditions = { band: 'dawn', weather: 'clear', season: 'autumn', run: 'salmon_run' } as const
    const salmon = candidates(content, river, 'spinner', conditions).find(([s]) => s.id === 'salmon')
    expect(salmon?.[1]).toBe(40)
    expect(candidates(content, river, 'spinner', { band: 'dawn', weather: 'clear', season: 'autumn' }).some(([s]) => s.id === 'salmon')).toBe(false)
  })

  it('announces a run once on its first cast at the water', () => {
    const at = { tickAt: SUMMER, weather: 'clear' as const }
    const first = simulateAngler(input(at, { ...RICH, waterId: 'harbour_pier', baitOnHook: 'ragworm', bait: { ragworm: 20 }, logbook: logbookOf(MILLPOND_FOUR) }))
    expect([first.event, ...(first.extraEvents ?? [])].some((e) => e?.kind === 'run')).toBe(true)
    const second = simulateAngler(input({ ...at, tickAt: SUMMER + 15 * 60_000, tick: 11, streams: deriveAnglerSeeds('seed', 'angler', 11, 1) }, first.angler))
    expect([second.event, ...(second.extraEvents ?? [])].some((e) => e?.kind === 'run')).toBe(false)
  })
})

describe('deadbait, the charter and Frozen Tarn', () => {
  it('draws deadbait weights evenly across the range rather than skewed low', () => {
    const pike = content.species.find((s) => s.id === 'pike')!
    const mean = (bait?: 'deadbait') => Array.from({ length: 400 }, (_, i) => drawGrams(createRng(i + 1), pike, bait)).reduce((a, b) => a + b, 0) / 400
    expect(mean('deadbait')).toBeGreaterThan(mean() * 1.3)
    expect(bitePermille(content, waterOf(content, 'river_bend'), 1, 'deadbait', { band: 'day', weather: 'clear', season: 'spring' })).toBeGreaterThan(bitePermille(content, waterOf(content, 'river_bend'), 1, 'worms', { band: 'day', weather: 'clear', season: 'spring' }))
  })

  it('turns a small fish into deadbait only once unlocked, only for bait fish, and up to the cap', () => {
    const locked = { ...starterAngler(content, 0), logbook: logbookOf(MILLPOND_FOUR) }
    expect(baitFromCatch(content, locked, { speciesId: 'roach' })).toEqual({ ok: false, code: 'LOCKED' })
    const open = { ...locked, logbook: logbookOf([...MILLPOND_FOUR, 'bream', 'tench', 'crucian_carp', 'eel', 'gudgeon', 'dace']) }
    expect(baitFromCatch(content, open, { speciesId: 'perch' })).toEqual({ ok: false, code: 'NOT_BAIT_FISH' })
    const used = baitFromCatch(content, open, { speciesId: 'roach' })
    expect(used).toMatchObject({ ok: true, angler: { bait: { deadbait: 3 }, counters: { deadbaitUsed: 1 } } })
    expect(baitFromCatch(content, { ...open, bait: { deadbait: 22 } }, { speciesId: 'roach' })).toEqual({ ok: false, code: 'BAIT_FULL' })
  })

  it('books one ticket at a time, spends a cast each evaluation at sea, and sails back when it runs out', () => {
    const pierSix = ['sand_eel', 'whiting', 'mackerel', 'pollock', 'flounder', 'wrasse']
    const angler: AnglerState = { ...starterAngler(content, 0), ...RICH, waterId: 'harbour_pier', logbook: logbookOf(pierSix) }
    const booked = buyCharter(content, angler)
    expect(booked).toMatchObject({ ok: true, spent: 550, angler: { charterCasts: 96, counters: { charters: 1 } } })
    if (!booked.ok) throw new Error('unreachable')
    expect(buyCharter(content, booked.angler)).toEqual({ ok: false, code: 'TICKET_HELD' })
    expect(travel(content, { ...angler, charterCasts: 0 }, 'deep_sea', SPRING)).toEqual({ ok: false, code: 'NO_TICKET' })
    const atSea = simulateAngler(input({}, { ...booked.angler, waterId: 'deep_sea', baitOnHook: 'strip', bait: { strip: 24 }, charterCasts: 1 }))
    expect(atSea.angler.charterCasts).toBe(0)
    const back = simulateAngler(input({ tick: 11, streams: deriveAnglerSeeds('seed', 'angler', 11, 1) }, atSea.angler))
    expect(back.disposition).toBe('travelled')
    expect(back.angler.waterId).toBe('harbour_pier')
    expect(back.event?.summary).toBe('The charter ties up. You walk back along the Harbour Pier.')
  })

  it('opens Frozen Tarn in winter only and walks the angler back to Heron Lake when the ice goes out', () => {
    const lake = ['bleak', 'ide', 'silver_bream', 'mirror_carp', 'leather_carp']
    const angler: AnglerState = { ...starterAngler(content, 0), ...RICH, waterId: 'heron_lake', logbook: logbookOf(lake) }
    expect(travel(content, angler, 'frozen_tarn', SPRING)).toEqual({ ok: false, code: 'CLOSED' })
    expect(travel(content, angler, 'frozen_tarn', WINTER)).toMatchObject({ ok: true })
    const thaw = simulateAngler(input({ tickAt: SPRING }, { ...angler, waterId: 'frozen_tarn' }))
    expect(thaw.angler.waterId).toBe('heron_lake')
    expect(thaw.event?.summary).toBe('The ice is going out. You walk back to Heron Lake.')
  })
})

describe('fishmonger orders', () => {
  const four: AnglerState = { ...starterAngler(content, 0), logbook: logbookOf(MILLPOND_FOUR) }

  it('fills the slate once a refill day, only once unlocked, never with a seasonal fish and at most one teaching order', () => {
    const day = orderDay(content, SPRING, 0)
    expect(refillOrders(content, { ...four, logbook: logbookOf(['minnow']) }, day, 7).orders).toBeUndefined()
    for (let seed = 1; seed < 60; seed += 1) {
      const filled = refillOrders(content, four, day, seed)
      expect(filled.orders?.length).toBe(3)
      expect(filled.orders!.filter((o) => o.kind === 'teaching').length).toBeLessThanOrEqual(1)
      for (const order of filled.orders!) if (order.speciesId) expect(content.species.find((s) => s.id === order.speciesId)!.seasons).toBeUndefined()
      expect(refillOrders(content, filled, day, seed + 1)).toBe(filled)
    }
  })

  it('refills at the owner\'s 07:00', () => {
    const before = orderDay(content, Date.UTC(2026, 9, 19, 4, 59), 7200)
    const after = orderDay(content, Date.UTC(2026, 9, 19, 5, 0), 7200)
    expect(after).toBe(before + 1)
  })

  it('pays one and a half times the value plus the bonus for exactly the right fish, and empties the slot', () => {
    const order: Order = { id: 'o1', kind: 'species', speciesId: 'roach', count: 2, bonus: 20 }
    const roach = (value: number): CatchRecord => ({ speciesId: 'roach', grams: 200, value, caughtTick: 1, band: 'day' })
    const angler = { ...four, orders: [order] }
    expect(fillOrder(content, angler, 'o1', [roach(10)])).toEqual({ ok: false, code: 'WRONG_COUNT' })
    expect(fillOrder(content, angler, 'o1', [roach(10), { ...roach(10), speciesId: 'rudd' }])).toEqual({ ok: false, code: 'WRONG_FISH' })
    const filled = fillOrder(content, angler, 'o1', [roach(10), roach(14)])
    expect(filled).toMatchObject({ ok: true, earned: 56, angler: { gold: 56, orders: [], counters: { ordersFilled: 1, fishSold: 2 } } })
    expect(catchMatches(content, { id: 't', kind: 'time', bands: ['night'], count: 2, bonus: 30 }, { speciesId: 'roach', grams: 1, band: 'night' })).toBe(true)
  })

  it('swaps one order a day', () => {
    const day = orderDay(content, SPRING, 0)
    const slate = refillOrders(content, four, day, 3)
    const swapped = swapOrder(content, slate, slate.orders![0]!.id, day, 99)
    expect(swapped.ok).toBe(true)
    if (!swapped.ok) throw new Error('unreachable')
    expect(swapped.angler.orders![0]).not.toEqual(slate.orders![0])
    expect(swapOrder(content, swapped.angler, swapped.angler.orders![1]!.id, day, 100)).toEqual({ ok: false, code: 'SWAPPED_TODAY' })
  })
})

describe('goals and unlocks', () => {
  it('backfills silently, then pays a met goal once and names the next', () => {
    const fresh = starterAngler(content, 0)
    const backfilled = evaluateGoal(content, fresh)
    expect(backfilled.event).toBeUndefined()
    expect(backfilled.angler.goal).toEqual({ rung: 0, castsAtStart: 0 })
    const caught = { ...backfilled.angler, counters: { ...backfilled.angler.counters, fishCaught: 1 } }
    const reached = evaluateGoal(content, caught)
    expect(reached.event?.summary).toBe('Goal reached: Land your first fish. Next: Sell a fish.')
    expect(reached.angler).toMatchObject({ gold: 10, goal: { rung: 1 }, counters: { goalsReached: 1 } })
    expect(evaluateGoal(content, reached.angler).event).toBeUndefined()
  })

  it('forces a bite once the first goal has waited eight casts', () => {
    const quiet = seedsWhere((s) => createRng(s.bite).int(1, 1000) > 400)
    const waited = { ...starterAngler(content, 0), goal: { rung: 0, castsAtStart: 0 }, counters: { ...starterAngler(content, 0).counters, casts: 8 } }
    expect(simulateAngler(input({ streams: quiet }, waited)).metrics.landed + simulateAngler(input({ streams: quiet }, waited)).metrics.gotAway).toBe(1)
    const early = { ...waited, counters: { ...waited.counters, casts: 3 } }
    expect(simulateAngler(input({ streams: quiet }, early)).metrics.landed).toBe(0)
  })

  it('gates upgrades behind two species and announces orders with the fourth', () => {
    expect(buyRod(content, { ...starterAngler(content, 0), gold: 999 })).toEqual({ ok: false, code: 'LOCKED' })
    expect(buyRod(contentV1, { ...starterAngler(contentV1, 0), gold: 999 }).ok).toBe(true)
    expect(unlocked(content, { logbook: logbookOf(MILLPOND_FOUR) }, 'orders')).toBe(true)
    const three = { ...starterAngler(content, 0), logbook: logbookOf(['minnow', 'roach', 'perch']), goal: { rung: 4, castsAtStart: 0 } }
    const bite = seedsWhere((s) => {
      const r = simulateAngler(input({ streams: s, tickAt: SPRING }, { ...three, baitOnHook: 'bread', bait: { bread: 12 } }))
      return r.event?.detail.speciesId === 'rudd'
    })
    const result = simulateAngler(input({ streams: bite, tickAt: SPRING }, { ...three, baitOnHook: 'bread', bait: { bread: 12 } }))
    expect(result.extraEvents?.map((e) => e.summary)).toContain('Unlocked: fishmonger orders. Three are on the slate.')
  })
})

describe('the trophy wall and the Opens', () => {
  const eight: AnglerState = { ...starterAngler(content, 0), gold: 5000, logbook: logbookOf([...MILLPOND_FOUR, 'bream', 'tench', 'crucian_carp', 'eel']) }

  it('mounts a fish of at least 60% of its maximum for its value plus 100, up to the pegs', () => {
    const tench = { speciesId: 'tench', grams: 2000, value: 58 }
    expect(mountFish(content, eight, { ...tench, grams: 1000 }, 0)).toEqual({ ok: false, code: 'TOO_SMALL' })
    expect(mountFish(content, eight, tench, 0)).toMatchObject({ ok: true, spent: 158, angler: { gold: 4842, counters: { trophiesMounted: 1 } } })
    expect(mountFish(content, eight, tench, 6)).toEqual({ ok: false, code: 'WALL_FULL' })
    expect(buyPegs(content, eight)).toMatchObject({ ok: true, spent: 800, angler: { pegs: 12 } })
  })

  it('names a weekend period, a target per water, and none at Frozen Tarn outside winter', () => {
    const saturday = Date.UTC(2026, 9, 24, 10, 0)
    expect(openPeriod(saturday)).toBe('o2026-10-24')
    expect(openPeriod(SPRING)).toBe('o2026-10-24')
    const target = openTarget(content, 'millpond', saturday)!
    expect(entersOpen(content, 'millpond', target.id, saturday)).toBe(true)
    expect(entersOpen(content, 'millpond', target.id, SPRING)).toBe(false)
    expect(openTarget(content, 'frozen_tarn', saturday)).toBeUndefined()
    expect(openTarget(content, 'frozen_tarn', WINTER + 5 * 86_400_000)).toBeDefined()
  })
})

describe('achievements v5', () => {
  it('earns the Rosettes tiers from Opens entered at three and at every water', () => {
    const state = (openWaters: number) => ({ rodTier: 1, counters: { ...starterAngler(content, 0).counters, openWaters }, logbook: {}, flies: 0 })
    const ids = (openWaters: number) => allSatisfied(state(openWaters), content).map((a) => a.id).filter((id) => id.startsWith('rosettes'))
    expect(ids(0b000011)).toEqual([])
    expect(ids(0b010101)).toEqual(['rosettes_1'])
    expect(ids(0b111111)).toEqual(['rosettes_1', 'rosettes_2'])
  })
})

describe('the v2 harness', () => {
  it('is deterministic and keeps coins and bait in bounds', { timeout: 60_000 }, () => {
    const a = runCohort({ name: 'daily', everyDays: 1 }, 3, 10)
    const b = runCohort({ name: 'daily', everyDays: 1 }, 3, 10)
    expect(a.map((r) => r.angler)).toEqual(b.map((r) => r.angler))
    for (const run of a) {
      expect(run.angler.gold).toBeGreaterThanOrEqual(0)
      for (const units of Object.values(run.angler.bait)) expect(units).toBeGreaterThanOrEqual(0)
    }
  })

  it('reports every gate with a value', { timeout: 60_000 }, () => {
    const report = runHarness(4, 21)
    expect(report.gates.length).toBeGreaterThanOrEqual(15)
    expect(report.gates.filter((g) => g.name.startsWith('Millpond')).every((g) => g.value !== null)).toBe(true)
  })
})
