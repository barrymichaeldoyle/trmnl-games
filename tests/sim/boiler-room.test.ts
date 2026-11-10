import { describe, expect, it } from 'vitest'
import { catalogs } from '@trmnl-games/desk-crawler/content'
import { ACHIEVEMENT_FAMILIES, ACHIEVEMENTS, ACHIEVEMENTS_VERSION } from '@trmnl-games/desk-crawler/content/achievements'
import { validateCatalog } from '@trmnl-games/desk-crawler/content/validate'
import { gearTierOf, loreProblems, topGearTier } from '@trmnl-games/desk-crawler/sim/core/biomes'
import { liveRung, measureRung, remapRung } from '@trmnl-games/desk-crawler/sim/core/career'
import { simulateHero, SIMULATION_VERSION } from '@trmnl-games/desk-crawler/sim/core/simulate'
import { starterHero, starterKit } from '@trmnl-games/desk-crawler/sim/core/starter'
import { cumulativeXpToReach, maxHp } from '@trmnl-games/desk-crawler/sim/core/stats'
import type { ContentCatalog, HeroState, ItemSnapshot, StreamSeeds } from '@trmnl-games/desk-crawler/sim/core/types'
import { applyStep, itemProblems, nextStep, workbenchSuffix } from '@trmnl-games/desk-crawler/sim/core/workbench'
import { seeds, withId } from './helpers'

const v29 = catalogs.v29
const v30 = catalogs.v30
const EPOCH = Date.UTC(2026, 10, 10)
const QUARTER = 15 * 60 * 1000
const allStreams = (n: number): StreamSeeds => ({ ...seeds(n), quest: (n * 1597334677 + 11) >>> 0, raid: (n * 2246822519 + 7) >>> 0 })

/** A hero at `level` in `biomeId`, wearing the common tier-3 pair, with a pouch of healing potions. */
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

const ids = (content: ContentCatalog) => content.career!.rungs.map((r) => r.id)
const index = (content: ContentCatalog, id: string) => ids(content).indexOf(id)
const unmet = (open: string[]) => (rung: { id: string }) => open.includes(rung.id)

describe('the Boiler Room (D228, content v30)', () => {
  it('is a valid catalog of six floors, twenty-four monsters and a fourth gear tier the new floor drops', () => {
    expect(validateCatalog(v30)).toEqual([])
    expect(loreProblems(v30)).toEqual([])
    expect(v30.biomes.map((b) => [b.id, b.unlockLevel, b.tier, gearTierOf(b)])).toEqual([
      ['office_cubicles', 1, 1, 1],
      ['server_room', 4, 2, 2],
      ['cafeteria_depths', 8, 3, 3],
      ['archive', 12, 4, 3],
      ['parking_garage', 16, 5, 3],
      ['boiler_room', 20, 6, 4],
    ])
    expect(v30.monsters).toHaveLength(24)
    expect(topGearTier(v30)).toBe(4)
    expect(topGearTier(v29)).toBe(3)
    expect(v30.gearTiers[4]).toEqual({ weaponAttack: 18, armorDefense: 14, requiredLevel: 20, saleValue: 48 })
    expect(v30.gearTemplates.filter((t) => t.tier === 4).map((t) => t.id)).toEqual(['pipe_wrench', 'furnace_poker', 'boiler_suit', 'fire_blanket_cloak'])
    const boiler = v30.biomes[5]!
    for (const id of boiler.monsterIds) {
      expect(v30.todo!.monsterPlurals[id]).toBeDefined()
      expect(v30.narrative.monsters[id]?.victory.length).toBeGreaterThanOrEqual(2)
      expect(v30.lore!.monsters[id]).toBeDefined()
    }
    expect(v30.lore!.biomes.boiler_room).toBeDefined()
    // The Garage's potion share (D222), its own potion weights, to-do pay and dug-in lines.
    expect(boiler.lootWeights).toEqual({ ...v29.constants.lootWeights, potion: 35, gold: v29.constants.lootWeights.gold - 15 })
    expect(v30.potions!.dropWeightsByTier[6]).toEqual({ minor: 0, healing: 25, major: 75 })
    expect(v30.todo!.rewardByTier[6]).toBe(60)
    expect(v30.standoff!.narrative.dugIn.boiler_room).toHaveLength(3)
    expect(v30.standoff!.narrative.won.boiler_room).toHaveLength(3)
    // The ladder: one rung before the +3 goal at the end, and "Reach level 20" names the floor; nothing else moves.
    expect(ids(v30)).toEqual(ids(v29).flatMap((id) => (id === 'reinforce_3' ? ['boiler_win', 'reinforce_3'] : [id])))
    expect(v30.career!.rungs[index(v30, 'level_20')]!.blurb).toBe('The Boiler Room opens at level 20.')
    expect(v30.career!.rungs[index(v30, 'boiler_win')]!.predicate).toEqual({ kind: 'biomeWin', biomeId: 'boiler_room' })
  })

  it('drops tier-4 gear at required level 20 and tier-6 potions in the Boiler Room, and nothing below it changes', () => {
    const { hero: h, inventory } = hero(v30, 20, 'boiler_room')
    let gear = 0
    const potions: Record<string, number> = {}
    for (let seed = 1; seed <= 400; seed += 1) {
      const result = run(h, inventory, seed, seed, v30)
      for (const change of result.itemChanges) {
        if (change.type === 'potion_increment') potions.healing_potion = (potions.healing_potion ?? 0) + 1
        if (change.type !== 'create') continue
        if (change.item.kind === 'weapon' || change.item.kind === 'armor') {
          gear += 1
          expect(v30.gearTemplates.find((t) => t.id === change.item.templateId)?.tier).toBe(4)
          expect(change.item.requiredLevel).toBe(20)
        }
        if (change.item.kind === 'potion') potions[change.item.templateId] = (potions[change.item.templateId] ?? 0) + 1
      }
      if (result.event?.detail.outcome.variant === 'combat') expect(v30.biomes[5]!.monsterIds).toContain(result.event.detail.outcome.monsterId)
    }
    expect(gear).toBeGreaterThan(5)
    expect(potions.major_potion ?? 0).toBeGreaterThan(potions.healing_potion!)
    expect(potions.minor_potion ?? 0).toBe(0)
    // A level-18 hero in the Garage sees nothing new: the same stories and changes under v29 and v30 for 300 ticks.
    let a = hero(v29, 18, 'parking_garage')
    let b = hero(v30, 18, 'parking_garage')
    for (let tick = 1; tick <= 300; tick += 1) {
      const ra = run(a.hero, a.inventory, tick, tick, v29)
      const rb = run(b.hero, b.inventory, tick, tick, v30)
      // Level 20 is where the floors differ: v30 announces the Boiler Room.
      if (ra.nextHero.level >= 20) break
      expect(rb.event?.summary).toBe(ra.event?.summary)
      expect(rb.itemChanges).toEqual(ra.itemChanges.map((change) => (change.type === 'create' ? { ...change, item: { ...change.item, contentVersion: 'v30' } } : change)))
      expect(rb.nextHero).toEqual(ra.nextHero)
      a = { hero: ra.nextHero, inventory: a.inventory }
      b = { hero: rb.nextHero, inventory: b.inventory }
    }
    expect(a.hero.level).toBeGreaterThan(18)
  })

  it('offers Mk IV only from level 20, reinforces Mk III below it, and carries reinforcement up with the tier', () => {
    const mk3 = (reinforced: number): ItemSnapshot => {
      const base: ItemSnapshot = { id: 'w', templateId: 'spork_halberd', contentVersion: 'v30', kind: 'weapon', name: 'Spork Halberd', rarity: 'common', requiredLevel: 8, attack: 13, defense: 0, saleValue: 24, quantity: 1, tier: 3, reinforced: 0 }
      return { ...base, attack: 13 + reinforced, reinforced }
    }
    // Without a level the catalog's own order holds: the tier step comes first.
    expect(nextStep(v30, mk3(0))).toMatchObject({ kind: 'tier', toTier: 4, gold: 2500 })
    // At level 12 the hero cannot equip Mk IV, so the piece reinforces at Mk III as it did under v29.
    expect(nextStep(v30, mk3(0), 12)).toMatchObject({ kind: 'reinforce', to: 1 })
    expect(nextStep(v30, mk3(2), 19)).toMatchObject({ kind: 'reinforce', to: 3 })
    expect(nextStep(v30, mk3(3), 19)).toBeUndefined()
    expect(nextStep(v29, mk3(3), 19)).toBeUndefined()
    // From level 20 the tier step is next, and it keeps the reinforcement: Mk III +3 becomes Mk IV +3.
    const step = nextStep(v30, mk3(3), 20)!
    expect(step).toMatchObject({ kind: 'tier', toTier: 4 })
    const raised = applyStep(v30, mk3(3), step)
    expect(raised).toMatchObject({ tier: 4, reinforced: 3, attack: 18 + 1 + 3, requiredLevel: 20, saleValue: 48 })
    expect(workbenchSuffix(v30, raised)).toBe('Mk IV +3')
    expect(itemProblems(v30, raised)).toBeUndefined()
    expect(nextStep(v30, raised, 26)).toBeUndefined()
    // A Mk III +1 raised at level 20 continues reinforcing at Mk IV.
    const partly = applyStep(v30, mk3(1), nextStep(v30, mk3(1), 20)!)
    expect(nextStep(v30, partly, 20)).toMatchObject({ kind: 'reinforce', to: 2 })
    // Gear reinforced under v29 is still whole under v30.
    expect(itemProblems(v30, mk3(3))).toBeUndefined()
    // Below the reinforcing tier the next tier is the step whatever the level: a level-1 Letter Opener waits for Mk II.
    const tier1: ItemSnapshot = { id: 'l', templateId: 'letter_opener', contentVersion: 'v30', kind: 'weapon', name: 'Letter Opener', rarity: 'common', requiredLevel: 1, attack: 3, defense: 0, saleValue: 5, quantity: 1 }
    expect(nextStep(v30, tier1, 1)).toMatchObject({ kind: 'tier', toTier: 2 })
    expect(v30.workbench!.reinforceFromTier).toBe(3)
    expect(validateCatalog({ ...v30, workbench: { ...v30.workbench!, reinforceFromTier: 7 } })).toContain('reinforcing from unknown tier 7')
  })

  it('remaps the ladder by id: a hero on +3 or past the end meets the Boiler Room goal first, one below it keeps its goal', () => {
    const from = v29.career!
    const to = v30.career!
    // Waiting on level 24 (level 20 to 23): the level goal stays; the Boiler Room goal follows it.
    expect(remapRung(from, to, index(v29, 'level_24'), unmet(['level_24', 'boiler_win']))).toBe(index(v30, 'level_24'))
    expect(index(v30, 'boiler_win')).toBe(index(v30, 'level_24') + 1)
    // Below level 20 the pointer keeps its own goal.
    expect(remapRung(from, to, index(v29, 'level_20'), unmet(['level_20', 'boiler_win', 'level_24']))).toBe(index(v30, 'level_20'))
    for (const id of ['first_win', 'level_12', 'gym_duffel']) expect(remapRung(from, to, index(v29, id), unmet([id, 'boiler_win']))).toBe(index(v30, id))
    // On +3 at the end with no Boiler Room win yet: the inserted goal right before it comes first (D135).
    expect(remapRung(from, to, index(v29, 'reinforce_3'), unmet(['reinforce_3', 'boiler_win']))).toBe(index(v30, 'boiler_win'))
    // On +3 with a Boiler Room win already (the floor opened before the switch): +3 stays, the new goal skipped unpaid.
    expect(remapRung(from, to, index(v29, 'reinforce_3'), unmet(['reinforce_3']))).toBe(index(v30, 'reinforce_3'))
    // A hero that finished the v29 ladder lands on the inserted goal when it has not met it, else stays finished.
    expect(remapRung(from, to, from.rungs.length, unmet(['boiler_win']))).toBe(index(v30, 'boiler_win'))
    expect(remapRung(from, to, from.rungs.length, unmet([]))).toBe(to.rungs.length)
    expect(remapRung(from, to, from.rungs.length)).toBe(to.rungs.length)
    expect(liveRung(to, to.rungs.length, [])).toBe(to.rungs.length)
    // Rolling back, a hero on the inserted goal lands on +3.
    expect(remapRung(to, from, index(v30, 'boiler_win'))).toBe(index(v29, 'reinforce_3'))
  })

  it('counts a win on a deeper floor for a floor-win goal, so a hero that skipped the Garage is not held on it', () => {
    const fresh = starterHero('hero1', v30, 0)
    const wins = (monsterWins: Record<string, number>): HeroState => ({ ...fresh, counters: { ...fresh.counters, monsterWins } })
    const garageWin = v30.career!.rungs.find((r) => r.id === 'garage_win')!.predicate
    const boilerWin = v30.career!.rungs.find((r) => r.id === 'boiler_win')!.predicate
    expect(measureRung(garageWin, fresh, v30)).toEqual({ value: 0, target: 1 })
    expect(measureRung(garageWin, wins({ caretaker: 1 }), v30)).toEqual({ value: 1, target: 1 })
    expect(measureRung(garageWin, wins({ ghost_car: 2, caretaker: 1 }), v30)).toEqual({ value: 3, target: 1 })
    // A shallower floor's win does not count, and the Office never does.
    expect(measureRung(boilerWin, wins({ ghost_car: 2, paper_imp: 5 }), v30)).toEqual({ value: 0, target: 1 })
    expect(measureRung(v30.career!.rungs.find((r) => r.id === 'archive_win')!.predicate, wins({ ghost_car: 1 }), v30)).toEqual({ value: 1, target: 1 })
  })

  it('appends four monster families, a floor set piece and a long-service levels family as catalog version 14', () => {
    expect(ACHIEVEMENTS_VERSION).toBe(14)
    const families = ACHIEVEMENT_FAMILIES.map((f) => f.id)
    const at = families.indexOf('slay_pipe_python')
    expect(families.slice(at, at + 6)).toEqual(['slay_pipe_python', 'slay_fuse_box_fiend', 'slay_furnace_hound', 'slay_caretaker', 'floor_cleared_6', 'long_service'])
    expect(ACHIEVEMENTS.find((a) => a.id === 'floor_cleared_6')?.predicate).toEqual({ kind: 'biomeMonsters', biomeId: 'boiler_room', atLeast: 25 })
    expect(ACHIEVEMENTS.filter((a) => a.family === 'long_service').map((a) => (a.predicate.kind === 'level' ? a.predicate.atLeast : -1))).toEqual([24, 28, 32, 40, 50])
    for (const id of v30.biomes[5]!.monsterIds) expect(ACHIEVEMENT_FAMILIES.find((f) => f.id === `slay_${id}`)?.category).toBe('Boiler Room monster')
  })
})
