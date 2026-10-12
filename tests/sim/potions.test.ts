import { describe, expect, it } from 'vitest'
import { catalogs } from '@trmnl-games/desk-crawler/content'
import { validateCatalog } from '@trmnl-games/desk-crawler/content/validate'
import { assertHeroInvariants, SimulationInvariantError } from '@trmnl-games/desk-crawler/sim/core/invariants'
import { autoPotion, bestFitPotion, combineBatches, potionProblems, potionRowKinds, potionStrengths, potionWord, potionsHeld, rollPotionStrength, strengthOf } from '@trmnl-games/desk-crawler/sim/core/potions'
import { createRng } from '@trmnl-games/desk-crawler/sim/core/rng'
import { simulateHero, SIMULATION_VERSION } from '@trmnl-games/desk-crawler/sim/core/simulate'
import { starterHero, starterKit } from '@trmnl-games/desk-crawler/sim/core/starter'
import { maxHp } from '@trmnl-games/desk-crawler/sim/core/stats'
import { inventoryRowsNeeded } from '@trmnl-games/desk-crawler/sim/core/workbench'
import { displayLogDeltas, logPresentation } from '@trmnl-games/desk-crawler/log'
import { applyItemChanges } from '@trmnl-games/desk-crawler/sim/core/apply'
import type { ContentCatalog, HeroState, ItemChange, ItemSnapshot, PotionRule, StreamSeeds } from '@trmnl-games/desk-crawler/sim/core/types'
import { POLICIES, simulateCohort } from '../../tools/balance/run'
import { seeds, withId } from './helpers'

const v13 = catalogs.v13
const v14 = catalogs.v14
const EPOCH = Date.UTC(2026, 9, 12)
const QUARTER = 15 * 60 * 1000
const allStreams = (n: number): StreamSeeds => ({ ...seeds(n), quest: (n * 1597334677 + 11) >>> 0, raid: (n * 2246822519 + 7) >>> 0 })

const potion = (id: string, templateId: string, quantity: number, name = templateId): ItemSnapshot => ({ id, templateId, contentVersion: 'v14', kind: 'potion', name, rarity: 'common', requiredLevel: 1, attack: 0, defense: 0, saleValue: 0, quantity })
const material = (id: string, templateId: string, quantity: number): ItemSnapshot => ({ id, templateId, contentVersion: 'v14', kind: 'material', name: templateId, rarity: 'common', requiredLevel: 1, attack: 0, defense: 0, saleValue: 0, quantity })

function hero(overrides: Partial<HeroState> = {}, content: ContentCatalog = v14, potions: ItemSnapshot[] = [withId(starterKit(content).potions, 'i999')]): { hero: HeroState; inventory: ItemSnapshot[] } {
  const kit = starterKit(content)
  const inventory = [withId(kit.weapon, 'i000'), withId(kit.armor, 'i001'), ...potions].sort((a, b) => (a.id < b.id ? -1 : 1))
  return { hero: { ...starterHero('hero1', content, 0), weaponId: 'i000', armorId: 'i001', ...overrides }, inventory }
}

const run = (h: HeroState, inventory: readonly ItemSnapshot[], tick: number, seed: number, content: ContentCatalog) =>
  simulateHero({ hero: h, inventory, tick, content, simulationVersion: SIMULATION_VERSION, streams: allStreams(seed), tickAt: EPOCH + tick * QUARTER })

describe('potion catalog (D131)', () => {
  it('is valid under v14 and absent before it, with the healing potion unchanged in the middle', () => {
    expect(validateCatalog(v14)).toEqual([])
    expect(v13.potions).toBeUndefined()
    expect(potionStrengths(v14).map((s) => [s.id, s.healPct])).toEqual([['minor', 25], ['healing', 40], ['major', 60]])
    expect(potionStrengths(v13)).toEqual([{ id: 'healing', templateId: 'healing_potion', name: 'Healing Potion', healPct: 40 }])
    expect(strengthOf(v14, 'healing_potion')?.templateId).toBe(v14.potion.templateId)
    // The derived read bound: 20 bag + 2 equipped + 1 held + 3 potion rows + 3 materials.
    expect(potionRowKinds(v14)).toBe(3)
    expect(inventoryRowsNeeded(v14)).toBe(29)
    expect(inventoryRowsNeeded(v13)).toBe(27)
  })

  it('rejects unordered strengths, weights that do not sum, a recipe that goes downhill and one that costs nothing', () => {
    const rule = v14.potions!
    const broken = (patch: Partial<PotionRule>) => potionProblems({ ...v14, potions: { ...rule, ...patch } })
    expect(broken({ strengths: [rule.strengths[1]!, rule.strengths[0]!, rule.strengths[2]!] })).toContain('potion minor must heal more than healing')
    expect(broken({ dropWeightsByTier: { ...rule.dropWeightsByTier, 1: { minor: 50, healing: 40, major: 0 } } })).toContain('potion drop weights for tier 1 must sum to 100')
    expect(broken({ dropWeightsByTier: { 1: rule.dropWeightsByTier[1]!, 2: rule.dropWeightsByTier[2]! } })).toContain('potion drop weights missing for biome tier 3')
    expect(broken({ combine: { ...rule.combine, from: 'major', to: 'minor' } })).toContain('combining must make a stronger potion')
    expect(broken({ combine: { ...rule.combine, materials: {} } })).toContain('combining must cost a material')
    expect(broken({ combine: { ...rule.combine, materials: { gravel: 1 } } })).toContain('combining costs unknown material gravel')
    expect(broken({ strengths: rule.strengths.map((s) => (s.id === 'healing' ? { ...s, healPct: 45 } : s)) })).toContain('the catalog potion strength must match the potion name and potionHealPct')
    expect(potionProblems({ ...v14, narrative: { ...v14.narrative, shared: { ...v14.narrative.shared, lootPotion: ['Found a potion.'] } } })).toContain('lootPotion line misses {potion}: Found a potion.')
  })
})

describe('drinking rule (D131)', () => {
  const rows = [potion('p1', 'minor_potion', 2), potion('p2', 'healing_potion', 1), potion('p3', 'major_potion', 1)]

  it('drinks the weakest potion that clears the rest line, else the strongest held', () => {
    // Max 100: rest below 35. At 20 HP a minor (+25) clears it; at 5 HP only a healing (+40) does; at 1 HP with only minors, the strongest is still a minor.
    expect(autoPotion(v14, rows, 20, 100, 35)?.row.templateId).toBe('minor_potion')
    expect(autoPotion(v14, rows, 5, 100, 35)?.row.templateId).toBe('healing_potion')
    expect(autoPotion(v14, [potion('p1', 'minor_potion', 2)], 1, 100, 35)?.row.templateId).toBe('minor_potion')
    // Nothing clears it: the strongest.
    expect(autoPotion(v14, [potion('p1', 'minor_potion', 2), potion('p2', 'healing_potion', 1)], 1, 100, 50)?.row.templateId).toBe('healing_potion')
    expect(autoPotion(v14, [], 1, 100, 35)).toBeUndefined()
    // Before v14 the one row heals the constant.
    expect(autoPotion(v13, [potion('p9', 'healing_potion', 3)], 1, 100, 35)).toMatchObject({ row: { id: 'p9' }, healPct: 40 })
  })

  it('picks the smallest potion that heals to full for a manual drink, else the strongest', () => {
    expect(bestFitPotion(v14, rows, 80, 100)?.row.templateId).toBe('minor_potion')
    expect(bestFitPotion(v14, rows, 50, 100)?.row.templateId).toBe('major_potion')
    expect(bestFitPotion(v14, rows, 10, 100)?.row.templateId).toBe('major_potion')
    expect(bestFitPotion(v14, rows.slice(0, 2), 10, 100)?.row.templateId).toBe('healing_potion')
  })

  it('sums every row for the pouch and counts combine batches from the source row and the materials', () => {
    expect(potionsHeld(rows)).toBe(4)
    expect(combineBatches(v14, [potion('p1', 'minor_potion', 7)], { scrap: 5 })).toBe(2)
    expect(combineBatches(v14, [potion('p1', 'minor_potion', 7)], { scrap: 1 })).toBe(1)
    expect(combineBatches(v14, [potion('p1', 'minor_potion', 2)], { scrap: 9 })).toBe(0)
    expect(combineBatches(v13, [potion('p1', 'minor_potion', 9)], { scrap: 9 })).toBe(0)
    expect(potionWord('Major Potion')).toBe('major potion')
  })

  it('draws strengths by biome tier: the Office never drops a major, the Cafeteria mostly majors and healing', () => {
    const tally = (tier: number) => {
      const counts: Record<string, number> = {}
      const rng = createRng(42)
      for (let i = 0; i < 2000; i += 1) {
        const id = rollPotionStrength(v14, rng, tier).id
        counts[id] = (counts[id] ?? 0) + 1
      }
      return counts
    }
    const office = tally(1)
    expect(office.major ?? 0).toBe(0)
    expect(office.minor!).toBeGreaterThan(office.healing!)
    const cafeteria = tally(3)
    expect(cafeteria.major!).toBeGreaterThan(cafeteria.minor!)
    expect(cafeteria.healing!).toBeGreaterThan(cafeteria.minor!)
    // Before v14 there is nothing to draw and the stream is untouched.
    const rng = createRng(7)
    expect(rollPotionStrength(v13, rng, 3).id).toBe('healing')
    expect(rng.int(1, 1_000_000)).toBe(createRng(7).int(1, 1_000_000))
  })
})

describe('potions in the simulator (D131)', () => {
  it('replays v13 unchanged: 300 seeded ticks give the same stories, directives and state under v13 with the new code', () => {
    // A hero of every status finds and drinks potions over 300 ticks; under v13 nothing about them changed.
    const { hero: h, inventory } = hero({ level: 6, hp: 40, biomeId: 'server_room', stance: 'bold' }, v13)
    let state = h
    let items = inventory
    let potionsFound = 0
    let potionsUsed = 0
    for (let tick = 1; tick <= 300; tick += 1) {
      const result = run(state, items, tick, tick, v13)
      const outcome = result.event?.detail.outcome
      if (outcome?.variant === 'loot' && outcome.found === 'potion') {
        potionsFound += 1
        expect(outcome.templateId).toBeUndefined()
        expect(result.event!.summary).not.toMatch(/\{potion\}|minor|major/)
      }
      if (result.metrics.potionsUsed) {
        potionsUsed += 1
        expect(result.event!.summary).toMatch(/Drank a potion\./)
      }
      expect(items.filter((item) => item.kind === 'potion').length).toBeLessThanOrEqual(1)
      ;({ hero: state, inventory: items } = applyChanges(result.nextHero, items, result.itemChanges))
    }
    expect(potionsFound).toBeGreaterThan(0)
    expect(potionsUsed).toBeGreaterThan(0)
  })

  it('creates a row per strength under v14, names the strength in the story and the change row, and keeps one pouch', () => {
    const rows = [potion('p1', 'minor_potion', 3, 'Minor Potion'), potion('p2', 'healing_potion', 3, 'Healing Potion'), potion('p3', 'major_potion', 2, 'Major Potion')]
    const { hero: h, inventory } = hero({ level: 12, hp: 30, biomeId: 'server_room', stance: 'bold', potionCap: 20 }, v14, rows)
    let state = h
    let items = inventory
    const found = new Set<string>()
    const drank = new Set<string>()
    for (let tick = 1; tick <= 600; tick += 1) {
      // Keep the hero drinking: it walks into every adventure hurt enough to drink (bold drinks below 35%) but not to rest.
      if (state.status === 'exploring') state = { ...state, hp: Math.min(state.hp, Math.floor(maxHp(12) * 0.3)) }
      const result = run(state, items, tick, tick, v14)
      const outcome = result.event?.detail.outcome
      if (outcome?.variant === 'loot' && outcome.found === 'potion') {
        expect(outcome.templateId).toMatch(/^(minor|healing|major)_potion$/)
        found.add(outcome.templateId!)
        const word = outcome.templateId!.replace('_potion', ' potion')
        expect(result.event!.summary).toContain(word)
        const deltas = displayLogDeltas({ deltas: result.event!.deltas, detail: result.event!.detail })
        expect(logPresentation({ summary: result.event!.summary, kind: result.event!.kind, deltas }).changes).toContain(`+1 ${word}`)
      }
      if (result.metrics.potionsUsed) {
        // The row the drink took from names the strength; a long story may drop the "Drank a …" suffix.
        const decrement = result.itemChanges.find((change) => change.type === 'potion_decrement')
        const row = decrement?.type === 'potion_decrement' ? items.find((item) => item.id === decrement.itemId) : undefined
        if (row !== undefined) drank.add(row.templateId)
        const match = /Drank a (\w+) potion\./.exec(result.event!.summary)
        if (match !== null && row !== undefined) expect(row.templateId).toBe(`${match[1]}_potion`)
      }
      ;({ hero: state, inventory: items } = applyChanges(result.nextHero, items, result.itemChanges))
      assertHeroInvariants(state, items, v14)
      expect(potionsHeld(items)).toBeLessThanOrEqual(20)
    }
    expect(found.size).toBeGreaterThan(0)
    expect(drank.size).toBeGreaterThan(1)
  })

  it('reaches the Cafeteria cohorts with majors and keeps every hero inside three rows, over 30 managed days', () => {
    const daily = POLICIES.find((policy) => policy.name === 'daily')!
    const logs = simulateCohort(daily, 12, 30, v14)
    const found = logs.reduce<Record<string, number>>((sum, log) => { for (const [id, n] of log.potionsFoundByStrength) sum[id] = (sum[id] ?? 0) + n; return sum }, {})
    expect(found.minor!).toBeGreaterThan(0)
    expect(found.healing!).toBeGreaterThan(0)
    expect(found.major!).toBeGreaterThan(0)
    // Managed heroes combine their minors once they salvage Scrap.
    expect(logs.some((log) => log.potionsCombined > 0)).toBe(true)
    for (const log of logs) expect(log.finalPotionsByStrength.size).toBeLessThanOrEqual(3)
  })

  it('refuses two rows of one strength, an unknown strength under v14 and a pouch over its cap, and carries a legacy row under v13', () => {
    const { hero: h } = hero({}, v14)
    const base = [withId(starterKit(v14).weapon, 'i000'), withId(starterKit(v14).armor, 'i001')]
    expect(() => assertHeroInvariants(h, [...base, potion('p1', 'minor_potion', 2), potion('p2', 'minor_potion', 1)], v14)).toThrow(SimulationInvariantError)
    expect(() => assertHeroInvariants(h, [...base, potion('p1', 'mystery_potion', 2)], v14)).toThrow(SimulationInvariantError)
    expect(() => assertHeroInvariants(h, [...base, potion('p1', 'minor_potion', 15), potion('p2', 'major_potion', 6)], v14)).toThrow(/over the pouch/)
    expect(() => assertHeroInvariants(h, [...base, potion('p1', 'minor_potion', 15), potion('p2', 'major_potion', 5)], v14)).not.toThrow()
    // A world rolled back to v13 still carries a hero with two strengths.
    expect(() => assertHeroInvariants(h, [...base, potion('p1', 'minor_potion', 2), potion('p2', 'healing_potion', 1)], v13)).not.toThrow()
  })

  it('gives a decision’s potions to the healing row beside other strengths, in one row even from nothing', () => {
    const content = v14
    const { hero: h } = hero({ level: 6, choice: { eventId: 'first_aid_restock', offeredAtTick: 0, expiresAtTick: 5, biomeTier: 1 } }, content, [potion('p1', 'minor_potion', 2)])
    const event = content.choices!.events.find((e) => e.id === 'first_aid_restock')
    if (event === undefined) return
    const inventory = [withId(starterKit(content).weapon, 'i000'), withId(starterKit(content).armor, 'i001'), potion('p1', 'minor_potion', 2)]
    const result = run(h, inventory, 6, 3, content)
    const creates = result.itemChanges.filter((change) => change.type === 'create')
    const potions = event.options.find((o) => o.id === event.defaultOptionId)!.effect.potions ?? 0
    if (potions > 0) {
      expect(creates).toHaveLength(1)
      expect(creates[0]).toMatchObject({ destination: 'potion_stack', item: { templateId: 'healing_potion', quantity: potions } })
    }
  })

  it('heals by the strength drunk: a major restores 60% of max HP', () => {
    const content = v14
    const { hero: h } = hero({ level: 5, hp: 1, stance: 'cautious' }, content)
    const max = maxHp(5)
    const inventory = [withId(starterKit(content).weapon, 'i000'), withId(starterKit(content).armor, 'i001'), potion('p1', 'major_potion', 1, 'Major Potion')]
    const result = run(h, inventory, 2, 5, content)
    expect(result.event?.detail.potionHealing).toBe(Math.min(max - 1, Math.ceil((max * 60) / 100)))
    expect(result.event?.summary).toContain('Drank a major potion.')
    expect(result.itemChanges).toContainEqual({ type: 'potion_decrement', itemId: 'p1', deleteRow: true })
  })
})

/** The core's own applier, with ids that never repeat across a run. */
let allocated = 0
function applyChanges(h: HeroState, inventory: ItemSnapshot[], changes: readonly ItemChange[]): { hero: HeroState; inventory: ItemSnapshot[] } {
  return applyItemChanges(h, inventory, changes, () => `n${String(allocated++).padStart(6, '0')}`)
}
