import { describe, expect, it } from 'vitest'
import { catalogs } from '@trmnl-games/desk-crawler/content'
import { validateCatalog } from '@trmnl-games/desk-crawler/content/validate'
import { applyItemChanges } from '@trmnl-games/desk-crawler/sim/core/apply'
import { milestoneUpgrade, nextEarlyTier } from '@trmnl-games/desk-crawler/sim/core/bag'
import { nextEarlyPouchTier, pouchMilestoneUpgrade } from '@trmnl-games/desk-crawler/sim/core/pouch'
import { simulateHero, SIMULATION_VERSION } from '@trmnl-games/desk-crawler/sim/core/simulate'
import { maxHp } from '@trmnl-games/desk-crawler/sim/core/stats'
import type { ContentCatalog, HeroState, ItemSnapshot, SimulationResult, StreamSeeds } from '@trmnl-games/desk-crawler/sim/core/types'
import { baseState, seeds } from './helpers'

const v9 = catalogs.v9
const v10 = catalogs.v10
/** 2026-10-11 00:00 UTC is tick 0; both catalogs carry the to-do list, which needs the quest stream and the wall clock. */
const EPOCH = Date.UTC(2026, 9, 11)
const withQuest = (n: number): StreamSeeds => ({ ...seeds(n), quest: (n * 1597334677 + 11) >>> 0 })

const tick = (hero: HeroState, inventory: ItemSnapshot[], content: ContentCatalog, seed = 1, at = 10): SimulationResult =>
  simulateHero({ hero, inventory, tick: at, content, simulationVersion: SIMULATION_VERSION, streams: withQuest(seed), tickAt: EPOCH + at * 15 * 60 * 1000 })

const first = (hero: HeroState, inventory: ItemSnapshot[], content: ContentCatalog, predicate: (r: SimulationResult) => boolean, limit = 3000) => {
  for (let seed = 0; seed < limit; seed += 1) {
    const result = tick(hero, inventory, content, seed)
    if (predicate(result)) return { seed, result }
  }
  return undefined
}

/** A mid-game hero whose next bag and pouch are both shop tiers under v10 and both findable under v9. */
const midGame = () => baseState({ level: 5, hp: maxHp(5), biomeId: 'server_room', bagCapacity: 13, potionCap: 20 })

describe('gold-only ladders (D122, content v10)', () => {
  it('is a valid catalog whose shop tiers have rising prices and no milestones above the Tote Bag', () => {
    expect(validateCatalog(v10)).toEqual([])
    const [paper, tote, ...shop] = v10.bagLadder.tiers
    expect(paper!.milestone).toBeUndefined()
    expect(tote!.milestone).toEqual({ ticksExplored: 6 })
    expect(shop.map((tier) => tier.milestone)).toEqual([undefined, undefined, undefined])
    expect(shop.map((tier) => tier.price)).toEqual([...shop.map((tier) => tier.price)].sort((a, b) => a! - b!))
    expect(v10.potionPouch!.tiers.slice(1).every((tier) => tier.milestone === undefined && tier.price !== undefined)).toBe(true)
    expect(v10.bagLadder.findPermille).toBe(0)
    expect(v10.potionPouch!.findPermille).toBe(0)
    expect(v10.merchant?.ladderDiscountPct).toBe(25)
  })

  it('rejects a milestone after a shop tier, a shop price that does not rise, and an out-of-range discount', () => {
    const tiers = v10.bagLadder.tiers
    const lateMilestone: ContentCatalog = { ...v10, bagLadder: { ...v10.bagLadder, tiers: tiers.map((tier, i) => (i === 3 ? { ...tier, milestone: { level: 8 } } : tier)) } }
    expect(validateCatalog(lateMilestone)).toContain('bag messenger_bag has a milestone after a shop tier')
    const flatPrice: ContentCatalog = { ...v10, bagLadder: { ...v10.bagLadder, tiers: tiers.map((tier, i) => (i === 3 ? { ...tier, price: 100 } : tier)) } }
    expect(validateCatalog(flatPrice)).toContain('bag messenger_bag must cost more than the previous tier')
    const pouchTiers = v10.potionPouch!.tiers
    const latePouch: ContentCatalog = { ...v10, potionPouch: { ...v10.potionPouch!, tiers: pouchTiers.map((tier, i) => (i === 2 ? { ...tier, milestone: { level: 10 } } : tier)) } }
    expect(validateCatalog(latePouch)).toContain('pouch cooler_bag has a milestone after a shop tier')
    expect(validateCatalog({ ...v10, merchant: { ...v10.merchant!, ladderDiscountPct: 80 } })).toContain('merchant ladder discount must be a whole percentage from 1 to 50')
  })

  it('never finds a bag or a pouch, where v9 finds both', () => {
    const { hero, inventory } = midGame()
    const isFind = (r: SimulationResult) => r.event?.detail.outcome.variant === 'loot' && (r.event.detail.outcome.found === 'bag' || r.event.detail.outcome.found === 'pouch')
    expect(first(hero, inventory, v9, isFind)).toBeDefined()
    expect(first(hero, inventory, v10, isFind)).toBeUndefined()
    for (let seed = 0; seed < 3000; seed += 1) {
      const result = tick(hero, inventory, v10, seed)
      expect(result.metrics.bagUpgrades).toBe(0)
      expect(result.metrics.pouchUpgrades).toBe(0)
    }
  })

  it('grants no level milestone: a high-level hero keeps a small bag and pouch until it buys', () => {
    const base = baseState().hero
    const veteran: HeroState = { ...base, level: 14, bagCapacity: 10, potionCap: 20, counters: { ...base.counters, ticksExplored: 500 } }
    expect(milestoneUpgrade(v10, veteran)).toBeUndefined()
    expect(pouchMilestoneUpgrade(v10, veteran)).toBeUndefined()
    // v9 would hand the same hero the Rolling Suitcase and the Vending Cart at once.
    expect(milestoneUpgrade(v9, veteran)?.id).toBe('rolling_suitcase')
    expect(pouchMilestoneUpgrade(v9, veteran)?.id).toBe('vending_cart')
  })

  it('still guarantees the Tote Bag on the sixth adventure', () => {
    const { inventory } = baseState()
    for (let heroIndex = 0; heroIndex < 50; heroIndex += 1) {
      let { hero } = baseState()
      let bag = inventory
      let n = 0
      let reached = false
      for (let at = 1; at <= 40 && !reached; at += 1) {
        const result = tick(hero, bag, v10, heroIndex * 1000 + at, at)
        ;({ hero, inventory: bag } = applyItemChanges(result.nextHero, bag, result.itemChanges, () => `n${String(n++).padStart(6, '0')}`))
        if (hero.counters.ticksExplored >= 6) {
          expect(hero.bagCapacity).toBe(10)
          reached = true
        } else expect(hero.bagCapacity).toBe(6)
      }
      expect(reached).toBe(true)
    }
  })

  it('sells every shop tier in order to any hero with the gold, and nothing past the top', () => {
    const hero = baseState({ level: 1 }).hero
    expect(nextEarlyTier(v10, { ...hero, bagCapacity: 10 })?.id).toBe('laptop_backpack')
    expect(nextEarlyTier(v10, { ...hero, bagCapacity: 13 })?.id).toBe('messenger_bag')
    expect(nextEarlyTier(v10, { ...hero, bagCapacity: 16 })?.id).toBe('rolling_suitcase')
    expect(nextEarlyTier(v10, { ...hero, bagCapacity: 20 })).toBeUndefined()
    // The Tote Bag is the one milestone tier and still comes first.
    expect(nextEarlyTier(v10, { ...hero, bagCapacity: 6 })?.id).toBe('tote_bag')
    expect(nextEarlyPouchTier(v10, { level: 1, potionCap: 20 })?.id).toBe('lunchbox')
    expect(nextEarlyPouchTier(v10, { level: 1, potionCap: 30 })?.id).toBe('cooler_bag')
    expect(nextEarlyPouchTier(v10, { level: 1, potionCap: 40 })?.id).toBe('vending_cart')
    expect(nextEarlyPouchTier(v10, { level: 1, potionCap: 60 })).toBeUndefined()
    // v9's one-ahead rule is untouched: a level-1 hero on a Tote Bag may not buy the Messenger Bag.
    expect(nextEarlyTier(v9, { ...hero, bagCapacity: 13 })).toBeUndefined()
    expect(nextEarlyPouchTier(v9, { level: 1, potionCap: 30 })).toBeUndefined()
  })

  it('has the merchant sell the next bag and pouch at 25% off the Bag page price', () => {
    const { hero, inventory } = midGame()
    const found = first(hero, inventory, v10, (r) => r.event?.kind === 'merchant')
    expect(found).toBeDefined()
    const offers = found!.result.nextHero.merchant!.offers
    expect(offers.find((offer) => offer.id === 'bag')).toMatchObject({ tierId: 'messenger_bag', price: 225 })
    expect(offers.find((offer) => offer.id === 'pouch')).toMatchObject({ tierId: 'lunchbox', price: 90 })
    // The same seed under v9 charges the full ladder price.
    const old = tick(hero, inventory, v9, found!.seed).nextHero.merchant!.offers
    expect(old.find((offer) => offer.id === 'bag')).toMatchObject({ price: 600 })
    expect(old.find((offer) => offer.id === 'pouch')).toMatchObject({ price: 120 })
  })

  it('plays every other tick exactly as v9 does, seed by seed', () => {
    // At the top of both ladders nothing can be found or granted under either catalog, so the two must agree.
    const states = [
      baseState({ level: 5, hp: maxHp(5), biomeId: 'server_room', bagCapacity: 20, potionCap: 60 }),
      baseState({ level: 9, hp: 40, biomeId: 'cafeteria_depths', bagCapacity: 20, potionCap: 60 }),
      baseState({ status: 'resting', hp: 10, bagCapacity: 20, potionCap: 60 }),
    ]
    for (const { hero, inventory } of states) {
      for (let seed = 0; seed < 300; seed += 1) {
        const old = tick(hero, inventory, v9, seed, 50)
        const next = tick(hero, inventory, v10, seed, 50)
        const stamp = (r: SimulationResult) => r.itemChanges.map((change) => (change.type === 'create' ? { ...change, item: { ...change.item, contentVersion: 'x' } } : change))
        expect(stamp(next)).toEqual(stamp(old))
        expect(next.nextHero).toEqual(old.nextHero)
        // v10 adds full-health rest lines, so that one story may read differently; everything it reports is the same.
        const quietRest = next.event?.kind === 'rest' && next.event.deltas.hp === 0
        if (quietRest) expect(v10.narrative.shared.restFull).toContain(next.event?.summary)
        else expect(next.event?.summary).toBe(old.event?.summary)
        expect(next.event?.deltas).toEqual(old.event?.deltas)
        expect({ ...next.event?.detail, contentVersion: 'x' }).toEqual(old.event === undefined ? { contentVersion: 'x' } : { ...old.event.detail, contentVersion: 'x' })
      }
    }
  })
})
