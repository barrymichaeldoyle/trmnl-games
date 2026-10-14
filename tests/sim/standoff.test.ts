import { describe, expect, it } from 'vitest'
import { contentV23 } from '@trmnl-games/desk-crawler/content/v23'
import { contentV24 } from '@trmnl-games/desk-crawler/content/v24'
import { validateCatalog } from '@trmnl-games/desk-crawler/content/validate'
import { simulateHero, SIMULATION_VERSION } from '@trmnl-games/desk-crawler/sim/core/simulate'
import { heroMaxHp } from '@trmnl-games/desk-crawler/sim/core/stats'
import { starterHero, starterKit } from '@trmnl-games/desk-crawler/sim/core/starter'
import type { ContentCatalog, HeroState, ItemSnapshot, SimulationResult, Standoff, StreamSeeds } from '@trmnl-games/desk-crawler/sim/core/types'
import { seeds, withId } from './helpers'

const streams = (n: number): StreamSeeds => ({
  ...seeds(n),
  raid: (n * 2891336453 + 7) >>> 0,
  quest: (n * 1597334677 + 11) >>> 0,
  meeting: (n * 3812015801 + 13) >>> 0,
  graveyard: (n * 2246822507 + 17) >>> 0,
})

/** A level-14 hero in the Archive with tier-3 gear, so its fights are long but winnable. */
function setup(content: ContentCatalog, overrides: Partial<HeroState> = {}, potions = 3): { hero: HeroState; inventory: ItemSnapshot[] } {
  const kit = starterKit(content)
  const tier = content.gearTiers[3]!
  const inventory = [withId({ ...kit.weapon, attack: tier.weaponAttack, requiredLevel: tier.requiredLevel }, 'i000'), withId({ ...kit.armor, defense: tier.armorDefense, requiredLevel: tier.requiredLevel }, 'i001'), ...(potions > 0 ? [withId({ ...kit.potions, quantity: potions }, 'i999')] : [])]
  const base: HeroState = { ...starterHero('hero1', content, 0), weaponId: 'i000', armorId: 'i001', level: 14, biomeId: 'archive', gold: 400, bagCapacity: 24, potionCap: 20, ...overrides }
  return { hero: { ...base, hp: overrides.hp ?? heroMaxHp(content, base) }, inventory }
}

const at = (content: ContentCatalog, hero: HeroState, inventory: ItemSnapshot[], seed: number, tick = 500): SimulationResult =>
  simulateHero({ hero, inventory, tick, content, simulationVersion: SIMULATION_VERSION, streams: streams(seed), tickAt: Date.parse('2026-10-14T12:00:00Z') + (tick - 500) * 900_000 })

const auditor = (overrides: Partial<Standoff> = {}): Standoff => ({ monsterId: 'auditor', biomeId: 'archive', hp: 600, maxHp: 870, startedTick: 490, untilTick: 514, ...overrides })

/** Seeds whose tick digs an elite in for the default hero. */
function dugInSeeds(count: number): number[] {
  const { hero, inventory } = setup(contentV24)
  const out: number[] = []
  for (let seed = 0; out.length < count && seed < 60_000; seed += 1) {
    const outcome = at(contentV24, hero, inventory, seed).event?.detail.outcome
    if (outcome?.variant === 'combat' && outcome.standoff === 'dug_in') out.push(seed)
  }
  return out
}

/** Strip the catalog version, the one field a v24 tick changes when no standoff is involved. */
const unversioned = (result: SimulationResult) => JSON.parse(JSON.stringify(result).replaceAll('"v24"', '"v23"')) as SimulationResult

describe('dug-in elites (D163)', () => {
  it('validates v24', () => {
    expect(validateCatalog(contentV24)).toEqual([])
  })

  it('plays a hero below level 12 exactly as v23 does', () => {
    const { hero, inventory } = setup(contentV24, { level: 9, biomeId: 'cafeteria_depths' })
    for (let seed = 0; seed < 3000; seed += 1) {
      expect(unversioned(at(contentV24, hero, inventory, seed))).toEqual(at(contentV23, hero, inventory, seed))
    }
  })

  it('never digs in above tier 3 floors or in the Office', () => {
    for (const biomeId of ['office_cubicles', 'server_room']) {
      const { hero, inventory } = setup(contentV24, { biomeId })
      for (let seed = 0; seed < 4000; seed += 1) {
        const result = at(contentV24, hero, inventory, seed)
        expect(result.nextHero.standoff).toBeUndefined()
        expect(result.metrics.standoffStarts).toBe(0)
      }
    }
  })

  it('digs in on about the catalog share of elite combats', { timeout: 30_000 }, () => {
    const { hero, inventory } = setup(contentV24)
    let elites = 0
    let dugIn = 0
    for (let seed = 0; seed < 60_000; seed += 1) {
      const outcome = at(contentV24, hero, inventory, seed).event?.detail.outcome
      if (outcome?.variant !== 'combat' || !outcome.elite) continue
      elites += 1
      if (outcome.standoff === 'dug_in' || (outcome.standoff === 'won' && outcome.monsterHpStart === outcome.monsterHpMax)) dugIn += 1
    }
    expect(elites).toBeGreaterThan(500)
    expect(dugIn / elites).toBeGreaterThan(0.08)
    expect(dugIn / elites).toBeLessThan(0.16)
  })

  it('saves the elite with its HP, a six-hour clock and no retreat cost', () => {
    const [seed] = dugInSeeds(1)
    const { hero, inventory } = setup(contentV24)
    const result = at(contentV24, hero, inventory, seed!)
    const standoff = result.nextHero.standoff!
    const outcome = result.event!.detail.outcome
    if (outcome.variant !== 'combat') throw new Error('expected combat')
    expect(standoff).toMatchObject({ biomeId: 'archive', hp: outcome.monsterHpEnd, maxHp: outcome.monsterHpMax, startedTick: 500, untilTick: 524 })
    expect(standoff.hp).toBeGreaterThan(0)
    expect(result.nextHero.gold).toBe(hero.gold)
    expect(result.nextHero.counters.retreats).toBe(hero.counters.retreats)
    expect(result.metrics.standoffStarts).toBe(1)
    expect(result.event!.summary).toMatch(/dug in.*Down to \d+%\./)
  })

  it('fights on from the saved HP until it falls, paying the fall once with a rare or better find', () => {
    let { hero, inventory } = setup(contentV24)
    hero = { ...hero, standoff: auditor({ startedTick: 500, untilTick: 524 }) }
    let tick = 500
    let won: SimulationResult | undefined
    while (tick < 524 && won === undefined) {
      const before = hero.standoff
      const result = at(contentV24, hero, inventory, tick * 7, tick)
      const outcome = result.event?.detail.outcome
      if (outcome?.variant === 'combat') {
        expect(outcome.monsterHpStart).toBe(before!.hp)
        expect(['fighting', 'won']).toContain(outcome.standoff)
        if (outcome.standoff === 'won') won = result
      }
      expect(result.metrics.encounter === 'none' || result.metrics.encounter === 'combat').toBe(true)
      hero = { ...result.nextHero, hp: heroMaxHp(contentV24, result.nextHero) }
      tick += 1
    }
    expect(won).toBeDefined()
    expect(won!.nextHero.standoff).toBeUndefined()
    expect(won!.nextHero.counters.standoffsWon).toBe(1)
    expect(won!.metrics.standoffWins).toBe(1)
    const created = won!.itemChanges.filter((change) => change.type === 'create' && change.item.kind !== 'potion')
    expect(created).toHaveLength(1)
    expect(['rare', 'epic']).toContain(created[0]!.type === 'create' ? created[0]!.item.rarity : '')
    // The next tick is an ordinary one: nothing pays twice.
    const after = at(contentV24, won!.nextHero, inventory, 99, tick)
    expect(after.nextHero.counters.standoffsWon).toBe(1)
  })

  it('ends with a knockout and keeps the ordinary knockout cost', () => {
    const { hero, inventory } = setup(contentV24)
    const low = { ...hero, hp: 1, standoff: auditor() }
    const raid = { raiderHeroId: 'other', raiderName: 'Quill', tick: 499, raiderWon: true, gold: 10, targetHpPct: 50 }
    const result = simulateHero({ hero: low, inventory, tick: 500, content: contentV24, simulationVersion: SIMULATION_VERSION, streams: streams(1), tickAt: Date.parse('2026-10-14T12:00:00Z'), incomingRaid: raid })
    expect(result.event?.kind).toBe('death')
    expect(result.nextHero.standoff).toBeUndefined()
    expect(result.metrics.standoffEnds).toBe(1)
    expect(result.nextHero.gold).toBeLessThan(low.gold)
  })

  it('steps back below the stance\'s rest line instead of fighting on', () => {
    const { hero, inventory } = setup(contentV24, { stance: 'bold' }, 0)
    const max = heroMaxHp(contentV24, hero)
    const low = { ...hero, hp: Math.ceil((max * 21) / 100), standoff: auditor({ hp: 870 }) }
    for (let seed = 0; seed < 400; seed += 1) {
      const result = at(contentV24, low, inventory, seed)
      const outcome = result.event?.detail.outcome
      if (outcome?.variant !== 'combat') continue
      expect(outcome.rounds.length).toBeLessThan(6)
      if (result.event?.kind !== 'death') expect(result.nextHero.standoff?.hp).toBe(outcome.monsterHpEnd)
    }
  })

  it('says the elite slipped away when its clock runs out while exploring', () => {
    const { hero, inventory } = setup(contentV24)
    const result = at(contentV24, { ...hero, standoff: auditor({ untilTick: 500 }) }, inventory, 1)
    expect(result.nextHero.standoff).toBeUndefined()
    expect(result.event?.detail.outcome).toEqual({ variant: 'standoff_left', monsterId: 'auditor', startedTick: 490 })
    expect(result.event?.summary).toContain('Auditor')
    expect(result.metrics.standoffEnds).toBe(1)
  })

  it('drops an expired elite quietly while resting, and notes a waiting one on a rest line', () => {
    const { hero, inventory } = setup(contentV24)
    const resting = { ...hero, status: 'resting' as const, hp: 1 }
    const expired = at(contentV24, { ...resting, standoff: auditor({ untilTick: 500 }) }, inventory, 1)
    expect(expired.nextHero.standoff).toBeUndefined()
    expect(expired.event?.summary).not.toContain('waiting')
    const waiting = at(contentV24, { ...resting, standoff: auditor() }, inventory, 1)
    expect(waiting.nextHero.standoff).toEqual(auditor())
    expect(waiting.event?.summary).toContain('is waiting.')
  })

  it('drops a standoff a catalog cannot fight without a word, and plays the tick as usual', () => {
    const { hero, inventory } = setup(contentV23)
    for (let seed = 0; seed < 200; seed += 1) {
      const result = at(contentV23, { ...hero, standoff: auditor() }, inventory, seed)
      expect(result.nextHero.standoff).toBeUndefined()
      expect(result).toEqual({ ...at(contentV23, hero, inventory, seed), metrics: { ...result.metrics } })
      expect(result.metrics.standoffEnds).toBe(1)
    }
  })

  it('takes no raid, meeting or guarantee while dug in', () => {
    const { hero, inventory } = setup(contentV24)
    for (let seed = 0; seed < 300; seed += 1) {
      const result = simulateHero({ hero: { ...hero, standoff: auditor() }, inventory, tick: 500, content: contentV24, simulationVersion: SIMULATION_VERSION, streams: streams(seed), tickAt: Date.parse('2026-10-14T12:00:00Z'), raidTarget: { heroId: 'other', name: 'Quill', gold: 500 } })
      expect(result.raidLaunch).toBeUndefined()
      expect(result.meetingLaunch).toBeUndefined()
      expect(result.metrics.guarantees).toBe(0)
    }
  })
})
