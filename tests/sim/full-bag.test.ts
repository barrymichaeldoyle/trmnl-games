import { describe, expect, it } from 'vitest'
import { catalogs } from '@trmnl-games/desk-crawler/content'
import { validateCatalog } from '@trmnl-games/desk-crawler/content/validate'
import { applyItemChanges } from '@trmnl-games/desk-crawler/sim/core/apply'
import { currentRung, reachSatisfiedRung } from '@trmnl-games/desk-crawler/sim/core/career'
import { simulateHero, SIMULATION_VERSION } from '@trmnl-games/desk-crawler/sim/core/simulate'
import { starterHero, starterKit } from '@trmnl-games/desk-crawler/sim/core/starter'
import type { HeroState, ItemSnapshot, SimulationResult } from '@trmnl-games/desk-crawler/sim/core/types'
import { seeds, withId } from './helpers'

const v26 = catalogs.v26

/** A v26 starter with its kit equipped and `gear` gear rows owned in all (the two equipped included). */
function state(gear: number, overrides: Partial<HeroState> = {}): { hero: HeroState; inventory: ItemSnapshot[] } {
  const kit = starterKit(v26)
  const inventory: ItemSnapshot[] = [withId(kit.weapon, 'i000'), withId(kit.armor, 'i001'), withId({ ...kit.potions, quantity: 3 }, 'i999')]
  for (let i = 2; i < gear; i += 1) inventory.push(withId(kit.weapon, `i${String(i).padStart(3, '0')}`))
  inventory.sort((a, b) => (a.id < b.id ? -1 : 1))
  return { hero: { ...starterHero('hero1', v26, 0), weaponId: 'i000', armorId: 'i001', ...overrides }, inventory }
}

const run = (hero: HeroState, inventory: ItemSnapshot[], seed: number, tick = 10): SimulationResult =>
  simulateHero({ hero, inventory, tick, content: v26, simulationVersion: SIMULATION_VERSION, streams: { ...seeds(seed), quest: (seed * 1597334677 + 11) >>> 0, raid: (seed * 2971215073 + 5) >>> 0, meeting: (seed * 433494437 + 7) >>> 0, graveyard: (seed * 1836311903 + 9) >>> 0 } })

function findSeed(hero: HeroState, inventory: ItemSnapshot[], predicate: (result: SimulationResult) => boolean): SimulationResult {
  for (let seed = 0; seed < 20_000; seed += 1) {
    const result = run(hero, inventory, seed)
    if (predicate(result)) return result
  }
  throw new Error('no seed satisfied the predicate')
}

const foundGear = (result: SimulationResult) => result.event?.detail.outcome.variant === 'loot' && result.event.detail.outcome.found === 'gear'

describe('a full bag never stops the hero (D189, content v26)', () => {
  it('is a valid catalog with the rule on', () => {
    expect(validateCatalog(v26)).toEqual([])
    expect(v26.keepGoingWhenFull).toBe(true)
  })

  it('holds the first find that does not fit and keeps exploring', () => {
    const { hero, inventory } = state(hero0Capacity() + 2)
    const result = findSeed(hero, inventory, (r) => r.metrics.heldFinds === 1)
    expect(result.nextHero.status).toBe('exploring')
    expect(result.disposition).not.toBe('inventory_sleep_started')
    expect(result.metrics.sleepStarts).toBe(0)
    expect(result.itemChanges).toContainEqual(expect.objectContaining({ type: 'create', destination: 'held' }))
    expect(result.event?.summary).toMatch(/Bag full\. Holding it until you make room\./)
  })

  it('leaves a later find behind while one is held, and keeps earning', () => {
    const { hero, inventory } = state(hero0Capacity() + 3, { heldItemId: 'i002' })
    const result = findSeed(hero, inventory, foundGear)
    expect(result.nextHero.status).toBe('exploring')
    expect(result.itemChanges.filter((change) => change.type === 'create' && change.destination !== 'potion_stack')).toEqual([])
    expect(result.metrics.heldFinds).toBe(0)
    expect(result.event?.summary).toMatch(/Bag full, so it stayed behind\./)
    expect(result.event?.detail.outcome).toMatchObject({ variant: 'loot', found: 'gear', destination: 'left' })
    expect(result.nextHero.heldItemId).toBe('i002')
    // Combat keeps paying while the bag is full.
    const win = findSeed(hero, inventory, (r) => r.metrics.encounter === 'combat' && r.event!.deltas.xpEarned > 0)
    expect(win.nextHero.lifetimeXp).toBeGreaterThan(hero.lifetimeXp)
  })

  it('puts a find in the bag again once the player has made room', () => {
    const { hero, inventory } = state(hero0Capacity() + 1)
    const result = findSeed(hero, inventory, foundGear)
    expect(result.itemChanges).toContainEqual(expect.objectContaining({ type: 'create', destination: 'bag' }))
    let n = 0
    const applied = applyItemChanges(result.nextHero, inventory, result.itemChanges, () => `z${n++}`)
    expect(applied.hero.heldItemId).toBeUndefined()
  })

  it('wakes a hero left asleep on a full bag by an older catalog, held find and all', () => {
    const { hero, inventory } = state(hero0Capacity() + 3, { status: 'sleeping', heldItemId: 'i002' })
    const result = run(hero, inventory, 1)
    expect(result.metrics.wakes).toBe(1)
    expect(result.nextHero.status).not.toBe('sleeping')
    expect(result.nextHero.heldItemId).toBe('i002')
  })

  it('sends a sleeper with a pending destination on its way', () => {
    const { hero, inventory } = state(hero0Capacity() + 3, { status: 'sleeping', heldItemId: 'i002', level: 4, targetBiomeId: 'server_room', wakeAtTick: 99 })
    const result = run(hero, inventory, 1)
    expect(result.nextHero.status).toBe('travelling')
    expect(result.nextHero.wakeAtTick).toBeUndefined()
  })
})

describe('"Switch to Bold" is retired (D190, content v26)', () => {
  const rungs = v26.career!.rungs
  const at = (id: string) => rungs.findIndex((rung) => rung.id === id)

  it('keeps the rung in place but retired', () => {
    expect(rungs[at('go_bold')]).toMatchObject({ id: 'go_bold', retired: true })
    expect(rungs.map((rung) => rung.id)).toEqual(catalogs.v25.career!.rungs.map((rung) => rung.id))
  })

  it('moves a hero waiting on it to the raid goal without gold', () => {
    const { hero } = state(2, { level: 7, career: { rung: at('go_bold'), startedTick: 0, reached: [] } })
    expect(currentRung(v26, hero)?.id).toBe('first_raid')
    const settled = reachSatisfiedRung(hero, v26, 10)
    expect(settled.reached).toBeUndefined()
    expect(settled.hero.career?.rung).toBe(at('first_raid'))
    expect(settled.hero.career?.unclaimed).toBeUndefined()
  })
})

function hero0Capacity(): number {
  return starterHero('hero1', v26, 0).bagCapacity
}
