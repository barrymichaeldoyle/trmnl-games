import { describe, expect, it } from 'vitest'
import { contentV20 } from '@trmnl-games/desk-crawler/content/v20'
import { contentV21 } from '@trmnl-games/desk-crawler/content/v21'
import { validateCatalog } from '@trmnl-games/desk-crawler/content/validate'
import { planFind, spareItem } from '@trmnl-games/desk-crawler/sim/core/lostProperty'
import { simulateHero, SIMULATION_VERSION } from '@trmnl-games/desk-crawler/sim/core/simulate'
import { heroMaxHp } from '@trmnl-games/desk-crawler/sim/core/stats'
import { starterHero, starterKit } from '@trmnl-games/desk-crawler/sim/core/starter'
import type { ContentCatalog, HeroState, IncomingFound, ItemSnapshot, LostSpare, SimulationInput, SimulationResult, StreamSeeds } from '@trmnl-games/desk-crawler/sim/core/types'
import { seeds, withId } from './helpers'

const streams = (n: number): StreamSeeds => ({
  ...seeds(n),
  raid: (n * 2891336453 + 7) >>> 0,
  quest: (n * 1597334677 + 11) >>> 0,
  meeting: (n * 3812015801 + 13) >>> 0,
  graveyard: (n * 2246822507 + 17) >>> 0,
})
const spare: LostSpare = { ownerHeroId: 'owner', ownerName: 'Baz', templateId: 'spork_halberd', kind: 'weapon', rarity: 'rare', affixId: 'lucky' }
const found = (overrides: Partial<IncomingFound> = {}): IncomingFound => ({ finderHeroId: 'finder', finderName: 'Quill', finderClass: 'rogue', templateId: 'spork_halberd', name: 'Spork Halberd', biomeId: 'cafeteria_depths', foundTick: 490, ...overrides })

function setup(content: ContentCatalog, overrides: Partial<HeroState> = {}, potions = 3): { hero: HeroState; inventory: ItemSnapshot[] } {
  const kit = starterKit(content)
  const inventory = [withId(kit.weapon, 'i000'), withId(kit.armor, 'i001'), ...(potions > 0 ? [withId({ ...kit.potions, quantity: potions }, 'i999')] : [])]
  const base: HeroState = { ...starterHero('hero1', content, 0), weaponId: 'i000', armorId: 'i001', level: 8, biomeId: 'server_room', gold: 400, bagCapacity: 13, potionCap: 20, ...overrides }
  return { hero: { ...base, hp: overrides.hp ?? heroMaxHp(content, base) }, inventory }
}

const tick = (content: ContentCatalog, hero: HeroState, inventory: ItemSnapshot[], seed: number, extra: Partial<SimulationInput> = {}): SimulationResult =>
  simulateHero({ hero, inventory, tick: 500, content, simulationVersion: SIMULATION_VERSION, streams: streams(seed), tickAt: Date.parse('2026-10-14T12:00:00Z'), ...extra })

/** Seeds where the look hits and the tick's ordinary encounter is a loot gear find. */
function findSeeds(count: number): number[] {
  const { hero, inventory } = setup(contentV21)
  const out: number[] = []
  for (let seed = 0; out.length < count && seed < 50_000; seed += 1) {
    if (planFind(streams(seed), contentV21) === undefined) continue
    const plain = tick(contentV21, hero, inventory, seed)
    const outcome = plain.event?.detail.outcome
    if (outcome?.variant === 'loot' && outcome.found === 'gear') out.push(seed)
  }
  return out
}

/** Seeds where a hero at 1 HP with no potions is knocked out in the Cafeteria. */
function lowHero(extra: Partial<HeroState> = {}): { hero: HeroState; inventory: ItemSnapshot[] } {
  const full = setup(contentV21, { biomeId: 'cafeteria_depths', stance: 'bold', ...extra }, 0)
  // Just above the bold stance's rest line, so the hero fights on and can be knocked out.
  return { ...full, hero: { ...full.hero, hp: Math.ceil((heroMaxHp(contentV21, full.hero) * 20) / 100) } }
}

function knockoutSeeds(count: number, extra: Partial<HeroState> = {}): number[] {
  const { hero, inventory } = lowHero(extra)
  const out: number[] = []
  for (let seed = 0; out.length < count && seed < 20_000; seed += 1) {
    if (tick(contentV21, hero, inventory, seed).event?.kind === 'death') out.push(seed)
  }
  return out
}

describe('lost property (D145)', () => {
  it('validates v21', () => {
    expect(validateCatalog(contentV21)).toEqual([])
  })

  it('leaves v20 untouched by a graveyard seed, a lying spare or a found notice', () => {
    const { hero, inventory } = setup(contentV20)
    for (let seed = 0; seed < 400; seed += 1) {
      const { graveyard: _, ...plain } = streams(seed)
      const without = simulateHero({ hero, inventory, tick: 500, content: contentV20, simulationVersion: SIMULATION_VERSION, streams: plain, tickAt: Date.parse('2026-10-14T12:00:00Z') })
      expect(tick(contentV20, hero, inventory, seed, { lostSpare: spare, incomingFound: found() })).toEqual(without)
    }
  })

  it('looks at about the catalog rate', () => {
    let looks = 0
    for (let seed = 0; seed < 10_000; seed += 1) if (planFind(streams(seed), contentV21) !== undefined) looks += 1
    expect(looks).toBeGreaterThan(900)
    expect(looks).toBeLessThan(1100)
  })

  it('a spare takes the place of a loot gear find, rebuilt at base stats, and every other number stays the same', () => {
    const { hero, inventory } = setup(contentV21)
    const seedsFound = findSeeds(12)
    expect(seedsFound.length).toBe(12)
    const expected = spareItem(contentV21, spare)!
    for (const seed of seedsFound) {
      const plain = tick(contentV21, hero, inventory, seed)
      const result = tick(contentV21, hero, inventory, seed, { lostSpare: spare })
      expect(result.spareFound).toEqual({ ownerHeroId: 'owner' })
      expect(result.itemChanges).toEqual([{ type: 'create', destination: 'bag', item: expected, spare: true }])
      const outcome = result.event!.detail.outcome
      expect(outcome).toMatchObject({ variant: 'loot', found: 'gear', templateId: 'spork_halberd', rarity: 'rare', spare: { rivalHeroId: 'owner', rivalName: 'Baz' } })
      expect(result.event!.summary).toContain('Baz')
      expect(result.event!.deltas).toEqual(plain.event!.deltas)
      // A rare spare counts as a rare find, as any rare find does.
      expect(result.nextHero).toEqual({ ...plain.nextHero, counters: { ...plain.nextHero.counters, lostPropertyFound: 1, rareFinds: result.nextHero.counters.rareFinds } })
      expect(result.nextHero.counters.rareFinds).toBe(hero.counters.rareFinds + 1)
    }
    // Stats come from the template's tier and the rarity; the affix stays.
    expect(expected).toMatchObject({ attack: 12 + 1 + 4, defense: 0, requiredLevel: 8, affixId: 'lucky', contentVersion: 'v21' })
    // An affix the catalog does not know, or one on a rarity that carries none, is dropped.
    expect(spareItem(contentV21, { ...spare, affixId: 'gone' })!.affixId).toBeUndefined()
    expect(spareItem(contentV21, { ...spare, rarity: 'common' })!.affixId).toBeUndefined()
  })

  it('ignores the spare when the look missed, the tick found something else, or it is the hero’s own', () => {
    const { hero, inventory } = setup(contentV21)
    for (let seed = 0; seed < 1500; seed += 1) {
      const plain = tick(contentV21, hero, inventory, seed)
      const result = tick(contentV21, hero, inventory, seed, { lostSpare: spare })
      if (result.spareFound !== undefined) continue
      expect(result).toEqual(plain)
    }
    const [seed] = findSeeds(1)
    expect(tick(contentV21, hero, inventory, seed!, { lostSpare: { ...spare, ownerHeroId: hero.id } }).spareFound).toBeUndefined()
    expect(tick(contentV21, hero, inventory, seed!, { lostSpare: { ...spare, templateId: 'no_such_thing' } }).spareFound).toBeUndefined()
  })

  it('keeps the spare out of career guarantees: a forced gear find stays fresh', () => {
    const rung = contentV21.career!.rungs.findIndex((r) => r.id === 'equip_find')
    const { hero, inventory } = setup(contentV21)
    // Armed twelve explored ticks ago with no find since, so the gear guarantee is due this tick.
    const due: HeroState = { ...hero, counters: { ...hero.counters, ticksExplored: 30 }, career: { rung, startedTick: 0, armedAt: 18, armedCount: hero.counters.itemsFound, reached: [] } }
    let forced = 0
    for (let seed = 0; forced < 20 && seed < 5000; seed += 1) {
      if (planFind(streams(seed), contentV21) === undefined) continue
      const result = tick(contentV21, due, inventory, seed, { lostSpare: spare })
      if (result.metrics.guarantees !== 1) continue
      forced += 1
      expect(result.spareFound).toBeUndefined()
      expect(result.itemChanges.some((change) => change.type === 'create' && change.spare === undefined && change.item.kind !== 'potion')).toBe(true)
    }
    expect(forced).toBe(20)
  })

  it('a knockout drops a spare of an equipped item on that floor, and the hero keeps its gear', () => {
    const { hero, inventory } = lowHero()
    const ids = new Set<string>()
    const deaths = knockoutSeeds(20)
    expect(deaths.length).toBeGreaterThan(5)
    for (const seed of deaths) {
      const result = tick(contentV21, hero, inventory, seed)
      const drop = result.spareDropped!
      const source = inventory.find((item) => item.templateId === drop.templateId)!
      expect([hero.weaponId, hero.armorId]).toContain(source.id)
      ids.add(source.id)
      expect(drop).toMatchObject({ kind: source.kind, rarity: source.rarity, name: source.name, biomeId: 'cafeteria_depths', tick: 500 })
      expect(result.nextHero.weaponId).toBe(hero.weaponId)
      expect(result.nextHero.armorId).toBe(hero.armorId)
      expect(result.itemChanges).toEqual([])
      expect(result.metrics.sparesDropped).toBe(1)
    }
    // Both slots drop over enough knockouts.
    expect(ids.size).toBe(2)
  })

  it('drops nothing with no gear equipped, in the Office, or while a found notice waits', () => {
    const [seed] = knockoutSeeds(1)
    const { hero: worn, inventory } = lowHero()
    const { weaponId: _w, armorId: _a, ...hero } = worn
    const bare = tick(contentV21, hero, inventory, seed!)
    expect(bare.event?.kind).toBe('death')
    expect(bare.spareDropped).toBeUndefined()
    // An Office knockout is a rescue.
    const office = setup(contentV21, { biomeId: 'office_cubicles', hp: 1 }, 0)
    for (let s = 0; s < 300; s += 1) expect(tick(contentV21, office.hero, office.inventory, s).spareDropped).toBeUndefined()
    // A lethal incoming raid lands before the notice, and the notice holds the next spare back.
    const target = lowHero()
    const raid = { raiderHeroId: 'raider', raiderName: 'Ada', tick: 499, raiderWon: true, gold: 10, targetHpPct: 50 }
    const raided = tick(contentV21, target.hero, target.inventory, seed!, { incomingRaid: raid, incomingFound: found() })
    expect(raided.event?.kind).toBe('death')
    expect(raided.foundApplied).toBeUndefined()
    expect(raided.spareDropped).toBeUndefined()
    const raidedAlone = tick(contentV21, target.hero, target.inventory, seed!, { incomingRaid: raid })
    expect(raidedAlone.spareDropped).toBeDefined()
  })

  it('tells the owner who found its spare, as the tick’s whole event, and holds the notice while it cannot hear', () => {
    const { hero, inventory } = setup(contentV21)
    const result = tick(contentV21, hero, inventory, 3, { incomingFound: found() })
    expect(result.foundApplied).toBe(true)
    expect(result.event!.kind).toBe('lost_property')
    expect(result.event!.detail.outcome).toEqual({ variant: 'lost_property', rivalHeroId: 'finder', rivalName: 'Quill', rivalClass: 'rogue', templateId: 'spork_halberd', biomeId: 'cafeteria_depths', foundTick: 490 })
    expect(result.event!.summary).toMatch(/Quill.*Spork Halberd/)
    expect(result.event!.deltas).toEqual({ xpEarned: 0, gold: 0, hp: 0 })
    expect(result.itemChanges).toEqual([])
    const dead = setup(contentV21, { status: 'dead', hp: 0, reviveAtTick: 600 })
    expect(tick(contentV21, dead.hero, dead.inventory, 3, { incomingFound: found() }).foundApplied).toBeUndefined()
    // A meeting waiting lands first.
    const meeting = { starterHeroId: 'rival', starterName: 'Ada', starterClass: 'warrior' as const, tick: 499, kindId: 'coffee_run' }
    const both = tick(contentV21, hero, inventory, 3, { incomingFound: found(), incomingMeeting: meeting })
    expect(both.meetingApplied).toBe(true)
    expect(both.foundApplied).toBeUndefined()
  })

  it('fits every short line beside the longest name and item', () => {
    const lines = contentV21.lostProperty!.narrative
    const longest = contentV21.gearTemplates.reduce((a, t) => (t.name.length > a.length ? t.name : a), '')
    for (const line of [lines.foundCompact, lines.returnedCompact]) {
      expect(line.replace('{rival}', 'W'.repeat(20)).replace('{item}', longest).length).toBeLessThanOrEqual(contentV21.constants.summaryMaxCodePoints)
    }
  })
})
