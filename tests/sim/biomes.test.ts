import { describe, expect, it } from 'vitest'
import { catalogs } from '@trmnl-games/desk-crawler/content'
import { ACHIEVEMENT_FAMILIES, ACHIEVEMENTS, ACHIEVEMENTS_VERSION } from '@trmnl-games/desk-crawler/content/achievements'
import { validateCatalog } from '@trmnl-games/desk-crawler/content/validate'
import { biomeNoteOpen, gearTierOf, loreProblems, loreView, monsterNoteOpen, topGearTier } from '@trmnl-games/desk-crawler/sim/core/biomes'
import { measureRung } from '@trmnl-games/desk-crawler/sim/core/career'
import { assertHeroInvariants } from '@trmnl-games/desk-crawler/sim/core/invariants'
import { simulateHero, SIMULATION_VERSION } from '@trmnl-games/desk-crawler/sim/core/simulate'
import { starterHero, starterKit, withCounterDefaults, zeroCounters } from '@trmnl-games/desk-crawler/sim/core/starter'
import { cumulativeXpToReach, maxHp } from '@trmnl-games/desk-crawler/sim/core/stats'
import type { ContentCatalog, HeroState, ItemSnapshot, StreamSeeds } from '@trmnl-games/desk-crawler/sim/core/types'
import { seeds, withId } from './helpers'

const v15 = catalogs.v15
const v16 = catalogs.v16
const EPOCH = Date.UTC(2026, 9, 12)
const QUARTER = 15 * 60 * 1000
const allStreams = (n: number): StreamSeeds => ({ ...seeds(n), quest: (n * 1597334677 + 11) >>> 0, raid: (n * 2246822519 + 7) >>> 0 })

/** A hero at `level` in `biomeId`, wearing the tier-3 pair, with a pouch of healing potions. */
function hero(content: ContentCatalog, level: number, biomeId: string, overrides: Partial<HeroState> = {}): { hero: HeroState; inventory: ItemSnapshot[] } {
  const kit = starterKit(content)
  const tier3 = (templateId: string, kind: 'weapon' | 'armor', id: string): ItemSnapshot => {
    const stats = content.gearTiers[3]!
    return { id, templateId, contentVersion: content.contentVersion, kind, name: content.gearTemplates.find((t) => t.id === templateId)!.name, rarity: 'common', requiredLevel: stats.requiredLevel, attack: kind === 'weapon' ? stats.weaponAttack : 0, defense: kind === 'armor' ? stats.armorDefense : 0, saleValue: stats.saleValue, quantity: 1 }
  }
  const inventory = [tier3('spork_halberd', 'weapon', 'i000'), tier3('oven_mitt_plate', 'armor', 'i001'), withId({ ...kit.potions, quantity: 10 }, 'i999')]
  const base = starterHero('hero1', content, 0)
  return { hero: { ...base, level, hp: maxHp(level), lifetimeXp: cumulativeXpToReach(level), biomeId, weaponId: 'i000', armorId: 'i001', gold: 500, ...overrides }, inventory }
}

const run = (h: HeroState, inventory: readonly ItemSnapshot[], tick: number, seed: number, content: ContentCatalog) =>
  simulateHero({ hero: h, inventory, tick, content, simulationVersion: SIMULATION_VERSION, streams: allStreams(seed), tickAt: EPOCH + tick * QUARTER })

describe('the Archive and the Parking Garage (D133)', () => {
  it('is a valid catalog of five floors and twenty monsters that drop tier-3 gear', () => {
    expect(validateCatalog(v16)).toEqual([])
    expect(validateCatalog(v15)).toEqual([])
    expect(v15.biomes).toHaveLength(3)
    expect(v16.biomes.map((b) => [b.id, b.unlockLevel, b.tier, gearTierOf(b)])).toEqual([
      ['office_cubicles', 1, 1, 1],
      ['server_room', 4, 2, 2],
      ['cafeteria_depths', 8, 3, 3],
      ['archive', 12, 4, 3],
      ['parking_garage', 16, 5, 3],
    ])
    expect(v16.monsters).toHaveLength(20)
    expect(topGearTier(v16)).toBe(3)
    expect(topGearTier(v15)).toBe(3)
    // Every new monster has a plural for the to-do list, a signature line and a field note.
    for (const biome of v16.biomes.slice(3)) {
      for (const id of biome.monsterIds) {
        expect(v16.todo!.monsterPlurals[id]).toBeDefined()
        expect(v16.narrative.monsters[id]?.victory.length).toBeGreaterThanOrEqual(2)
        expect(v16.lore!.monsters[id]).toBeDefined()
      }
      expect(v16.lore!.biomes[biome.id]).toBeDefined()
    }
    // Potion drops and to-do pay exist for the new tiers, and the ladder gained its two rungs at the end.
    expect(v16.potions!.dropWeightsByTier[4]).toEqual({ minor: 5, healing: 45, major: 50 })
    expect(v16.potions!.dropWeightsByTier[5]).toEqual({ minor: 0, healing: 35, major: 65 })
    expect(v16.todo!.rewardByTier[4]).toBe(40)
    expect(v16.todo!.rewardByTier[5]).toBe(50)
    expect(v16.career!.rungs.slice(0, v15.career!.rungs.length)).toEqual(v15.career!.rungs)
    expect(v16.career!.rungs.slice(-2).map((r) => r.id)).toEqual(['archive_win', 'garage_win'])
  })

  it('rejects a gear tier above the biome tier, an unknown gear tier and missing or oversized field notes', () => {
    const archive = v16.biomes.find((b) => b.id === 'archive')!
    const patched = (biome: Partial<typeof archive>): ContentCatalog => ({ ...v16, biomes: v16.biomes.map((b) => (b.id === 'archive' ? { ...b, ...biome } : b)) })
    expect(validateCatalog(patched({ gearTier: 5 }))).toContain('biome archive gear tier must be a gear tier at or below its own')
    expect(validateCatalog(patched({ gearTier: 9 }))).toContain('biome archive gear tier must be a gear tier at or below its own')
    const { auditor: _a, ...withoutAuditor } = v16.lore!.monsters
    expect(loreProblems({ ...v16, lore: { ...v16.lore!, monsters: withoutAuditor } })).toContain('monster auditor has no field note')
    expect(loreProblems({ ...v16, lore: { ...v16.lore!, biomes: { ...v16.lore!.biomes, archive: 'x'.repeat(300) } } })).toContain('biome archive field note must be 20 to 240 characters')
    expect(loreProblems({ ...v16, lore: { ...v16.lore!, biomes: { ...v16.lore!.biomes, archive: 'Where the {monster} lives, under the stairs.' } } })).toContain('biome archive field note uses a placeholder')
    expect(loreProblems({ ...v16, lore: { ...v16.lore!, biomes: { ...v16.lore!.biomes, rooftop: 'A roof. Pigeons. Nothing to see yet.' } } })).toContain('field note for unknown biome rooftop')
    expect(loreProblems(v15)).toEqual([])
  })

  it('drops tier-3 gear and tier-4 potions in the Archive', () => {
    const { hero: h, inventory } = hero(v16, 12, 'archive')
    let gear = 0
    const potions: Record<string, number> = {}
    for (let seed = 1; seed <= 400; seed += 1) {
      const result = run(h, inventory, seed, seed, v16)
      for (const change of result.itemChanges) {
        // The held healing row (i999) takes healing finds as increments; other strengths create their row.
        if (change.type === 'potion_increment') potions.healing_potion = (potions.healing_potion ?? 0) + 1
        if (change.type !== 'create') continue
        if (change.item.kind === 'weapon' || change.item.kind === 'armor') {
          gear += 1
          expect(v16.gearTemplates.find((t) => t.id === change.item.templateId)?.tier).toBe(3)
          expect(change.item.requiredLevel).toBe(8)
        }
        if (change.item.kind === 'potion') potions[change.item.templateId] = (potions[change.item.templateId] ?? 0) + 1
      }
      if (result.event?.detail.outcome.variant === 'combat') expect(v16.biomes[3]!.monsterIds).toContain(result.event.detail.outcome.monsterId)
    }
    expect(gear).toBeGreaterThan(5)
    // Tier-4 weights: 5 / 45 / 50, so majors lead and minors are rare.
    expect(potions.major_potion ?? 0).toBeGreaterThan(potions.healing_potion! / 2)
    expect(potions.minor_potion ?? 0).toBeLessThan(potions.healing_potion!)
  })

  it('counts arrivals per floor, keeps the counter valid, and replays v15 heroes unchanged below level 12', () => {
    const { hero: h, inventory } = hero(v16, 12, 'cafeteria_depths', { status: 'travelling', targetBiomeId: 'archive', arriveAtTick: 5 })
    const arrived = run(h, inventory, 5, 1, v16)
    expect(arrived.disposition).toBe('arrived')
    expect(arrived.nextHero.biomeId).toBe('archive')
    expect(arrived.nextHero.counters.trips).toBe(1)
    expect(arrived.nextHero.counters.biomesVisited).toEqual({ archive: 1 })
    expect(arrived.event?.summary).toMatch(/Archive/)
    const again = run({ ...arrived.nextHero, status: 'travelling', targetBiomeId: 'cafeteria_depths', arriveAtTick: 6 }, inventory, 6, 2, v16)
    expect(again.nextHero.counters.biomesVisited).toEqual({ archive: 1, cafeteria_depths: 1 })
    // The adapter rebuilds counters through withCounterDefaults before every tick: the record must survive it.
    expect(withCounterDefaults({ ...arrived.nextHero.counters }).biomesVisited).toEqual({ archive: 1 })
    expect(withCounterDefaults(zeroCounters()).biomesVisited).toBeUndefined()
    expect(() => assertHeroInvariants({ ...h, counters: { ...h.counters, biomesVisited: { moon_base: 1 } } }, inventory, v16)).toThrow(/unknown biome moon_base/)
    expect(() => assertHeroInvariants({ ...h, counters: { ...h.counters, biomesVisited: { archive: -1 } } }, inventory, v16)).toThrow(/invalid/)
    // A level-9 hero in the Cafeteria sees nothing new: the same stories and changes under v15 and v16 for 300 ticks.
    let a = hero(v15, 9, 'cafeteria_depths')
    let b = hero(v16, 9, 'cafeteria_depths')
    for (let tick = 1; tick <= 300; tick += 1) {
      const ra = run(a.hero, a.inventory, tick, tick, v15)
      const rb = run(b.hero, b.inventory, tick, tick, v16)
      expect(rb.event?.summary).toBe(ra.event?.summary)
      expect(rb.itemChanges).toEqual(ra.itemChanges.map((change) => (change.type === 'create' ? { ...change, item: { ...change.item, contentVersion: 'v16' } } : change)))
      expect({ ...rb.nextHero, counters: { ...rb.nextHero.counters, biomesVisited: undefined } }).toEqual({ ...ra.nextHero, counters: { ...ra.nextHero.counters, biomesVisited: undefined } })
      a = { hero: ra.nextHero, inventory: a.inventory }
      b = { hero: rb.nextHero, inventory: b.inventory }
    }
  })

  it('opens a floor note on arrival, presence or a win there, and a monster note on the first win', () => {
    const fresh = starterHero('hero1', v16, 0)
    expect(biomeNoteOpen(v16, fresh, 'office_cubicles')).toBe(true)
    expect(biomeNoteOpen(v16, fresh, 'server_room')).toBe(false)
    expect(monsterNoteOpen(fresh, 'paper_imp')).toBe(false)
    const veteran: HeroState = { ...fresh, biomeId: 'cafeteria_depths', counters: { ...zeroCounters(), monsterWins: { cable_serpent: 3 }, biomesVisited: { archive: 1 } } }
    expect(biomeNoteOpen(v16, veteran, 'office_cubicles')).toBe(false)
    expect(biomeNoteOpen(v16, veteran, 'server_room')).toBe(true)
    expect(biomeNoteOpen(v16, veteran, 'cafeteria_depths')).toBe(true)
    expect(biomeNoteOpen(v16, veteran, 'archive')).toBe(true)
    expect(biomeNoteOpen(v16, veteran, 'parking_garage')).toBe(false)
    const view = loreView(v16, veteran)!
    expect(view.total).toBe(25)
    expect(view.open).toBe(3 + 1)
    expect(view.biomes.map((b) => [b.id, b.open, b.note !== null])).toEqual([
      ['office_cubicles', false, false],
      ['server_room', true, true],
      ['cafeteria_depths', true, true],
      ['archive', true, true],
      ['parking_garage', false, false],
    ])
    const serverRoom = view.biomes[1]!
    expect(serverRoom.monsters.map((m) => [m.id, m.open, m.wins])).toEqual([['cable_serpent', true, 3], ['overheated_rack', false, 0], ['firewall_gremlin', false, 0], ['legacy_mainframe', false, 0]])
    expect(serverRoom.monsters[0]!.note).toBe(v16.lore!.monsters.cable_serpent)
    expect(serverRoom.monsters[1]!.note).toBeNull()
    expect(loreView(v15, veteran)).toBeNull()
  })

  it('appends two ladder rungs that count a win on the new floors, and appends the achievement catalog', () => {
    const fresh = starterHero('hero1', v16, 0)
    const archiveWin = v16.career!.rungs.find((r) => r.id === 'archive_win')!
    expect(measureRung(archiveWin.predicate, fresh, v16)).toEqual({ value: 0, target: 1 })
    expect(measureRung(archiveWin.predicate, { ...fresh, counters: { ...fresh.counters, monsterWins: { shelf_lurker: 2 } } }, v16)).toEqual({ value: 2, target: 1 })
    expect(ACHIEVEMENTS_VERSION).toBe(7)
    const families = ACHIEVEMENT_FAMILIES.map((f) => f.id)
    for (const id of ['box_file_beetle', 'shelf_lurker', 'microfilm_phantom', 'auditor', 'trolley_swarm', 'oil_slick', 'barrier_golem', 'ghost_car']) expect(families).toContain(`slay_${id}`)
    expect(families.slice(-10)).toEqual(['slay_box_file_beetle', 'slay_shelf_lurker', 'slay_microfilm_phantom', 'slay_auditor', 'slay_trolley_swarm', 'slay_oil_slick', 'slay_barrier_golem', 'slay_ghost_car', 'floor_cleared_4', 'floor_cleared_5'])
    expect(ACHIEVEMENTS.find((a) => a.id === 'floor_cleared_5')?.predicate).toEqual({ kind: 'biomeMonsters', biomeId: 'parking_garage', atLeast: 25 })
    expect(new Set(ACHIEVEMENTS.map((a) => a.id)).size).toBe(ACHIEVEMENTS.length)
    // Every floor's monster families share the shelf category the companion lists.
    for (const biome of v16.biomes) for (const id of biome.monsterIds) expect(ACHIEVEMENT_FAMILIES.find((f) => f.id === `slay_${id}`)?.category).toBe(`${biome.name} monster`)
  })
})
