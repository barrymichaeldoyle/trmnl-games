import { describe, expect, it } from 'vitest'
import { contentV21 } from '@trmnl-games/desk-crawler/content/v21'
import { contentV22 } from '@trmnl-games/desk-crawler/content/v22'
import { validateCatalog } from '@trmnl-games/desk-crawler/content/validate'
import { bagUsed, isBagFull, nextEarlyTier } from '@trmnl-games/desk-crawler/sim/core/bag'
import { currentRung } from '@trmnl-games/desk-crawler/sim/core/career'
import { assertHeroInvariants } from '@trmnl-games/desk-crawler/sim/core/invariants'
import { BATCH_ITEMS, MAX_INVENTORY_ROWS } from '@trmnl-games/desk-crawler/sim/core/limits'
import { simulateHero, SIMULATION_VERSION } from '@trmnl-games/desk-crawler/sim/core/simulate'
import { heroMaxHp } from '@trmnl-games/desk-crawler/sim/core/stats'
import { starterHero, starterKit } from '@trmnl-games/desk-crawler/sim/core/starter'
import { inventoryRowsNeeded } from '@trmnl-games/desk-crawler/sim/core/workbench'
import type { ContentCatalog, HeroState, ItemSnapshot, StreamSeeds } from '@trmnl-games/desk-crawler/sim/core/types'
import { seeds, withId } from './helpers'

const content = contentV22
const streams = (n: number): StreamSeeds => ({
  ...seeds(n),
  raid: (n * 2891336453 + 7) >>> 0,
  quest: (n * 1597334677 + 11) >>> 0,
  meeting: (n * 3812015801 + 13) >>> 0,
  graveyard: (n * 2246822507 + 17) >>> 0,
})

/** A level-20 hero in the Garage with a full bag of `capacity` spares, every potion strength and every material held. */
function veteran(capacity: number, spares = capacity): { hero: HeroState; inventory: ItemSnapshot[] } {
  const kit = starterKit(content)
  const gear = Array.from({ length: spares }, (_, i) => withId(kit.weapon, `g${String(i).padStart(3, '0')}`))
  const potions = content.potions!.strengths.map((s, i) => ({ ...withId({ ...kit.potions, templateId: s.templateId, quantity: 2 }, `p${i}`) }))
  const materials = content.workbench!.materials.map((m, i): ItemSnapshot => ({ id: `m${i}`, templateId: m.id, contentVersion: 'v22', kind: 'material', name: m.name, rarity: 'common', requiredLevel: 1, attack: 0, defense: 0, saleValue: 0, quantity: 5 }))
  const inventory = [withId(kit.weapon, 'i000'), withId(kit.armor, 'i001'), ...gear, ...potions, ...materials].sort((a, b) => (a.id < b.id ? -1 : 1))
  const base: HeroState = { ...starterHero('hero1', content, 0), weaponId: 'i000', armorId: 'i001', level: 20, biomeId: 'parking_garage', gold: 0, bagCapacity: capacity, potionCap: 60 }
  return { hero: { ...base, hp: heroMaxHp(content, base) }, inventory }
}

describe('bigger bags (D146, content v22)', () => {
  it('is a valid catalog with three shop tiers above the Rolling Suitcase', () => {
    expect(validateCatalog(content)).toEqual([])
    expect(content.bagLadder.tiers.slice(0, 5)).toEqual(contentV21.bagLadder.tiers)
    expect(content.bagLadder.tiers.slice(5)).toEqual([
      { id: 'gym_duffel', name: 'Gym Duffel', capacity: 24, price: 4000 },
      { id: 'steamer_trunk', name: 'Steamer Trunk', capacity: 28, price: 10000 },
      { id: 'stationery_cupboard', name: 'Stationery Cupboard', capacity: 32, price: 20000 },
    ])
    expect(content.bagLadder.findPermille).toBe(0)
  })

  it('fits the bounded reads and clears the top bag in one sale', () => {
    expect(inventoryRowsNeeded(content)).toBe(32 + 3 + 3 + 3)
    expect(inventoryRowsNeeded(content)).toBeLessThanOrEqual(MAX_INVENTORY_ROWS)
    expect(BATCH_ITEMS).toBe(32)
    const tooBig: ContentCatalog = { ...content, bagLadder: { ...content.bagLadder, tiers: [...content.bagLadder.tiers, { id: 'skip', name: 'Skip', capacity: 33, price: 40000 }] } }
    expect(validateCatalog(tooBig)).toContain('the top bag holds more than one 32-item sale')
  })

  it('sells the next tier in order at any level once the Rolling Suitcase is bought', () => {
    const hero = (bagCapacity: number) => ({ level: 1, bagCapacity, counters: starterHero('h', content, 0).counters })
    expect(nextEarlyTier(content, hero(20))?.id).toBe('gym_duffel')
    expect(nextEarlyTier(content, hero(24))?.id).toBe('steamer_trunk')
    expect(nextEarlyTier(content, hero(28))?.id).toBe('stationery_cupboard')
    expect(nextEarlyTier(content, hero(32))).toBeUndefined()
    // v21 ends at the Rolling Suitcase.
    expect(nextEarlyTier(contentV21, hero(20))).toBeUndefined()
  })

  it('appends one career rung and stops calling the Rolling Suitcase the biggest bag', () => {
    const before = contentV21.career!.rungs
    const rungs = content.career!.rungs
    expect(rungs.map((r) => r.id)).toEqual([...before.map((r) => r.id), 'gym_duffel'])
    expect(rungs.at(-1)).toMatchObject({ predicate: { kind: 'bag', atLeast: 24 }, companion: true })
    expect(rungs.find((r) => r.id === 'rolling_suitcase')!.blurb).not.toMatch(/biggest/i)
    // A hero who finished the v21 ladder has the new rung as its goal.
    const done = { ...veteran(20, 0).hero, career: { rung: before.length, startedTick: 0, reached: [] } }
    expect(currentRung(content, done)?.id).toBe('gym_duffel')
  })

  it('keeps every invariant with the top bag full, and holds the next find', () => {
    const { hero, inventory } = veteran(32)
    expect(inventory.length).toBe(2 + 32 + 3 + 3)
    expect(() => assertHeroInvariants(hero, inventory, content)).not.toThrow()
    expect(bagUsed(hero, inventory)).toBe(32)
    expect(isBagFull(hero, inventory)).toBe(true)
    let held = 0
    for (let seed = 0; seed < 4000 && held === 0; seed += 1) {
      const result = simulateHero({ hero, inventory, tick: 500, content, simulationVersion: SIMULATION_VERSION, streams: streams(seed), tickAt: Date.parse('2026-10-14T12:00:00Z') })
      if (result.itemChanges.some((change) => change.type === 'create' && change.destination === 'held')) {
        expect(result.disposition).toBe('inventory_sleep_started')
        held += 1
      }
    }
    expect(held).toBe(1)
  })

  it('fails loudly past the row bound', () => {
    const { hero, inventory } = veteran(32, MAX_INVENTORY_ROWS)
    expect(() => assertHeroInvariants(hero, inventory, content)).toThrow(/INVENTORY_SIZE|BAG/)
  })
})
