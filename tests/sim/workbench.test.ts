import { describe, expect, it } from 'vitest'
import { catalogs } from '@trmnl-games/desk-crawler/content'
import { validateCatalog } from '@trmnl-games/desk-crawler/content/validate'
import { bagUsed, isBagFull } from '@trmnl-games/desk-crawler/sim/core/bag'
import { assertHeroInvariants, SimulationInvariantError } from '@trmnl-games/desk-crawler/sim/core/invariants'
import { simulateHero, SIMULATION_VERSION } from '@trmnl-games/desk-crawler/sim/core/simulate'
import { starterHero, starterKit } from '@trmnl-games/desk-crawler/sim/core/starter'
import { maxHp } from '@trmnl-games/desk-crawler/sim/core/stats'
import { applyStep, gearStats, heldMaterials, inventoryRowsNeeded, itemProblems, itemTier, materialShortfall, nextStep, salvageYield, workbenchSuffix } from '@trmnl-games/desk-crawler/sim/core/workbench'
import type { ContentCatalog, HeroState, ItemSnapshot, StreamSeeds, WorkbenchRule } from '@trmnl-games/desk-crawler/sim/core/types'
import { seeds, withId } from './helpers'

const v12 = catalogs.v12
const v13 = catalogs.v13
const EPOCH = Date.UTC(2026, 9, 12)
const QUARTER = 15 * 60 * 1000
const allStreams = (n: number): StreamSeeds => ({ ...seeds(n), quest: (n * 1597334677 + 11) >>> 0, raid: (n * 2246822519 + 7) >>> 0 })

const gear = (id: string, over: Partial<ItemSnapshot>): ItemSnapshot => ({ id, templateId: 'letter_opener', contentVersion: 'v13', kind: 'weapon', name: 'Letter Opener', rarity: 'common', requiredLevel: 1, attack: 3, defense: 0, saleValue: 5, quantity: 1, ...over })
const material = (id: string, templateId: string, quantity: number): ItemSnapshot => ({ id, templateId, contentVersion: 'v13', kind: 'material', name: templateId, rarity: 'common', requiredLevel: 1, attack: 0, defense: 0, saleValue: 0, quantity })

function hero(overrides: Partial<HeroState> = {}, content: ContentCatalog = v13): { hero: HeroState; inventory: ItemSnapshot[] } {
  const kit = starterKit(content)
  const inventory = [withId(kit.weapon, 'i000'), withId(kit.armor, 'i001'), withId(kit.potions, 'i999')]
  return { hero: { ...starterHero('hero1', content, 0), weaponId: 'i000', armorId: 'i001', ...overrides }, inventory }
}

const run = (h: HeroState, inventory: readonly ItemSnapshot[], tick: number, seed: number, content: ContentCatalog) =>
  simulateHero({ hero: h, inventory, tick, content, simulationVersion: SIMULATION_VERSION, streams: allStreams(seed), tickAt: EPOCH + tick * QUARTER })

describe('workbench catalog (D129)', () => {
  it('is valid under v13 and absent before it, with three rungs appended', () => {
    expect(validateCatalog(v13)).toEqual([])
    expect(v12.workbench).toBeUndefined()
    expect(v13.workbench!.materials.map((m) => m.id)).toEqual(['scrap', 'parts', 'components'])
    expect(v13.career!.rungs).toHaveLength(22)
    expect(v13.career!.rungs.slice(0, 19)).toEqual(v12.career!.rungs)
    expect(v13.career!.rungs.slice(19).map((r) => r.id)).toEqual(['first_salvage', 'first_upgrade', 'reinforce_3'])
    // The derived read bound: 20 bag + 2 equipped + 1 held + 1 potion + 3 materials.
    expect(inventoryRowsNeeded(v13)).toBe(27)
    expect(inventoryRowsNeeded(v12)).toBe(24)
  })

  it('rejects a rarity with no material or two, a tier no step reaches, out-of-order reinforcement and a free step', () => {
    const rules = v13.workbench!
    const broken = (patch: Partial<WorkbenchRule>) => validateCatalog({ ...v13, workbench: { ...rules, ...patch } })
    expect(broken({ materials: rules.materials.slice(0, 2) })).toContain('rarity rare must salvage into exactly one material')
    expect(broken({ materials: [...rules.materials, { id: 'extra', name: 'Extra', rarities: ['common'], glyph: 'scrap' }] })).toContain('rarity common must salvage into exactly one material')
    expect(broken({ steps: rules.steps.filter((s) => s.kind !== 'tier' || s.toTier !== 3) })).toContain('no workbench step reaches tier 3')
    expect(broken({ steps: rules.steps.filter((s) => s.kind !== 'reinforce' || s.to !== 2) })).toContain('reinforce step +3 must follow +2 in order')
    expect(broken({ steps: rules.steps.map((s) => (s.kind === 'reinforce' && s.to === 2 ? { ...s, gold: 1000 } : s)) })).toContain('reinforce step +2 must cost more gold than +1')
    expect(broken({ steps: rules.steps.map((s) => (s.kind === 'tier' && s.toTier === 2 ? { ...s, gold: 0, materials: {} } : s)) })).toContain('tier step to 2 costs nothing')
    expect(broken({ affix: { gold: 0, materials: {} } })).toContain('an affix choice must cost something')
    expect(broken({ steps: rules.steps.map((s) => (s.kind === 'tier' && s.toTier === 2 ? { ...s, materials: { gravel: 1 } } : s)) })).toContain('tier step to 2 costs unknown material gravel')
    // Four more material kinds would take the read past 32 rows with a 20-slot bag.
    const many = Array.from({ length: 6 }, (_, i) => ({ id: `m${i}`, name: `M${i}`, rarities: [] as const, glyph: 'scrap' }))
    expect(broken({ materials: [...rules.materials, ...many] })).toContain('material rows exceed the 32-row inventory read')
  })
})

describe('salvage yields (D129)', () => {
  it('pays the found tier in the rarity band material, epic at three times, and nothing for potions or under v12', () => {
    expect(salvageYield(v13, gear('a', {}))).toEqual({ scrap: 1 })
    expect(salvageYield(v13, gear('a', { templateId: 'spork_halberd', requiredLevel: 8 }))).toEqual({ scrap: 3 })
    expect(salvageYield(v13, gear('a', { templateId: 'cable_cutter', requiredLevel: 4, rarity: 'uncommon' }))).toEqual({ parts: 2 })
    expect(salvageYield(v13, gear('a', { templateId: 'cable_cutter', requiredLevel: 4, rarity: 'rare' }))).toEqual({ components: 2 })
    expect(salvageYield(v13, gear('a', { templateId: 'spork_halberd', requiredLevel: 8, rarity: 'epic' }))).toEqual({ components: 9 })
    expect(salvageYield(v13, { ...starterKit(v13).potions })).toEqual({})
    expect(salvageYield(v12, gear('a', {}))).toEqual({})
  })

  it('never rises with an upgrade: a Letter Opener raised to Mk III still yields one Scrap', () => {
    const raised = gear('a', { tier: 3, requiredLevel: 8, attack: 12 })
    expect(salvageYield(v13, raised)).toEqual({ scrap: 1 })
    expect(itemTier(v13, raised)).toBe(3)
  })

  it('reads an unknown template by its required level', () => {
    expect(itemTier(v13, gear('a', { templateId: 'retired_blade', requiredLevel: 4 }))).toBe(2)
    expect(salvageYield(v13, gear('a', { templateId: 'retired_blade', requiredLevel: 4 }))).toEqual({ scrap: 2 })
  })
})

describe('workbench steps (D129)', () => {
  const rare = gear('r', { templateId: 'ruler_blade', name: 'Ruler Blade', rarity: 'rare', attack: 3 + 1 + 4, saleValue: 20, affixId: 'lucky' })

  it('walks tier 1 → Mk II → Mk III → +1 → +2 → +3 and then stops, recomputing the copied stats each time', () => {
    const steps: ItemSnapshot[] = [rare]
    for (;;) {
      const step = nextStep(v13, steps.at(-1)!)
      if (step === undefined) break
      steps.push(applyStep(v13, steps.at(-1)!, step))
    }
    expect(steps.map((s) => workbenchSuffix(v13, s))).toEqual(['', 'Mk II', 'Mk III', 'Mk III +1', 'Mk III +2', 'Mk III +3'])
    // Ruler Blade: +1 offset; rare: +4; tiers 3 / 7 / 12.
    expect(steps.map((s) => s.attack)).toEqual([8, 12, 17, 18, 19, 20])
    expect(steps.map((s) => s.requiredLevel)).toEqual([1, 4, 8, 8, 8, 8])
    expect(steps.map((s) => s.saleValue)).toEqual([20, 48, 96, 96, 96, 96])
    expect(steps.slice(1).every((s) => s.contentVersion === 'v13' && s.affixId === 'lucky' && s.name === 'Ruler Blade')).toBe(true)
    expect(nextStep(v13, steps.at(-1)!)).toBeUndefined()
  })

  it('names the next step by the item, not by choice', () => {
    expect(nextStep(v13, rare)).toMatchObject({ kind: 'tier', toTier: 2, gold: 150 })
    expect(nextStep(v13, gear('a', { templateId: 'spork_halberd', requiredLevel: 8, attack: 13 }))).toMatchObject({ kind: 'reinforce', to: 1, gold: 1000 })
    expect(nextStep(v13, gear('a', { templateId: 'spork_halberd', requiredLevel: 8, attack: 15, tier: 3, reinforced: 2 }))).toMatchObject({ kind: 'reinforce', to: 3, gold: 8000 })
    expect(nextStep(v12, rare)).toBeUndefined()
  })

  it('computes armor from its own tier stat and applies a template offset', () => {
    expect(gearStats(v13, { templateId: 'anti_static_vest', kind: 'armor', rarity: 'common' }, 2, 0)).toEqual({ attack: 0, defense: 6, requiredLevel: 4, saleValue: 12 })
    expect(gearStats(v13, { templateId: 'anti_static_vest', kind: 'armor', rarity: 'epic' }, 3, 3)).toEqual({ attack: 0, defense: 9 + 1 + 7 + 3, requiredLevel: 8, saleValue: 24 * 8 })
  })

  it('reports what a cost lacks', () => {
    const held = heldMaterials([material('m1', 'scrap', 5), material('m2', 'parts', 4)])
    expect(held).toEqual({ scrap: 5, parts: 4 })
    expect(materialShortfall(held, { scrap: 6, parts: 4 })).toEqual({ scrap: 1 })
    expect(materialShortfall(held, { scrap: 5, parts: 4, components: 1 })).toEqual({ components: 1 })
    expect(materialShortfall(held, { scrap: 5 })).toEqual({})
  })
})

describe('materials in the inventory (D129)', () => {
  it('take no bag slot, and only gear fills a bag', () => {
    const { hero: h, inventory } = hero({ bagCapacity: 6 })
    const rows = [...inventory, material('m1', 'scrap', 40), material('m2', 'components', 2), ...Array.from({ length: 6 }, (_, i) => gear(`g${i}`, {}))].sort((a, b) => (a.id < b.id ? -1 : 1))
    expect(bagUsed(h, rows)).toBe(6)
    expect(isBagFull(h, rows)).toBe(true)
    expect(() => assertHeroInvariants(h, rows, v13)).not.toThrow()
  })

  it('refuses two rows of one material, an empty row, an unknown material, and a mismatched upgraded stat', () => {
    const { hero: h, inventory } = hero()
    const fails = (rows: ItemSnapshot[], code: string, content: ContentCatalog = v13) => {
      try {
        assertHeroInvariants(h, [...inventory, ...rows].sort((a, b) => (a.id < b.id ? -1 : 1)), content)
      } catch (error) {
        expect(error).toBeInstanceOf(SimulationInvariantError)
        expect((error as SimulationInvariantError).code).toBe(code)
        return
      }
      throw new Error('expected a failure')
    }
    fails([material('m1', 'scrap', 1), material('m2', 'scrap', 1)], 'MATERIAL_ROWS')
    fails([material('m1', 'scrap', 0)], 'MATERIAL_QTY')
    fails([material('m1', 'gravel', 1)], 'MATERIAL')
    fails([gear('g1', { tier: 2, requiredLevel: 4, attack: 99 })], 'WORKBENCH')
    fails([gear('g1', { tier: 3, reinforced: 4, requiredLevel: 8, attack: 16 })], 'WORKBENCH')
    expect(itemProblems(v13, gear('g1', { tier: 2, requiredLevel: 4, attack: 7 }))).toBeUndefined()
    // An earlier catalog carries an upgraded item and a material row without judging them.
    expect(itemProblems(v12, gear('g1', { tier: 2, requiredLevel: 4, attack: 99 }))).toBeUndefined()
    expect(() => assertHeroInvariants(h, [...inventory, material('m1', 'scrap', 3)].sort((a, b) => (a.id < b.id ? -1 : 1)), v12)).not.toThrow()
  })
})

describe('v12 replays unchanged under v13 (D129)', () => {
  it('gives identical results for a hero with reinforced gear and material rows, since the simulator reads copied stats', { timeout: 30_000 }, () => {
    const weapon = gear('i000', { templateId: 'spork_halberd', requiredLevel: 8, rarity: 'rare', attack: 12 + 1 + 4 + 3, saleValue: 96, tier: 3, reinforced: 3, affixId: 'lucky' })
    const armor = gear('i001', { templateId: 'apron_of_warding', kind: 'armor', requiredLevel: 8, attack: 0, defense: 9 - 1 + 2 + 2, rarity: 'uncommon', saleValue: 48, tier: 3, reinforced: 2 })
    const { hero: base, inventory: kit } = hero({ level: 9, hp: maxHp(9), biomeId: 'cafeteria_depths', bagCapacity: 20, potionCap: 30, stance: 'bold', gold: 20_000 })
    const inventory = [weapon, armor, kit[2]!, material('m001', 'scrap', 30), material('m002', 'components', 2)].sort((a, b) => (a.id < b.id ? -1 : 1))
    // The rungs the hero stands on differ by catalog only past rung 19; a hero at rung 19 is on the same rung under both.
    const h: HeroState = { ...base, career: { rung: 18, startedTick: 0, reached: [] } }
    for (let seed = 0; seed < 300; seed += 1) {
      const a = run(h, inventory, 100 + seed, seed, v12)
      const b = run(h, inventory, 100 + seed, seed, v13)
      expect(b.event?.summary).toBe(a.event?.summary)
      // A created item records the catalog that made it; everything else about it is the same.
      const stamped = (changes: typeof a.itemChanges) => changes.map((c) => (c.type === 'create' ? { ...c, item: { ...c.item, contentVersion: 'x' } } : c))
      expect(stamped(b.itemChanges)).toEqual(stamped(a.itemChanges))
      expect(b.event?.deltas).toEqual(a.event?.deltas)
      expect({ ...b.nextHero, career: undefined }).toEqual({ ...a.nextHero, career: undefined })
      expect(b.extraEvents?.map((e) => e.summary)).toEqual(a.extraEvents?.map((e) => e.summary))
    }
  })

  it('moves a hero at the end of the v12 ladder onto the first new rung without pay', () => {
    const { hero: base, inventory } = hero({ level: 12, hp: maxHp(12), gold: 500 })
    const h: HeroState = { ...base, counters: { ...base.counters, careerRungs: 19 }, career: { rung: 19, startedTick: 0, reached: [] } }
    const result = run(h, inventory, 50, 1, v13)
    expect(result.nextHero.career?.rung).toBe(19)
    expect(result.nextHero.gold - h.gold).toBe(result.event?.deltas.gold ?? 0)
    expect((result.extraEvents ?? []).filter((e) => e.kind === 'career')).toEqual([])
    // Once the hero has salvaged, the rung pays at the next evaluation.
    const salvaged: HeroState = { ...h, counters: { ...h.counters, itemsSalvaged: 1 } }
    const paid = run(salvaged, inventory, 50, 1, v13)
    expect(paid.nextHero.career?.rung).toBe(20)
    expect((paid.extraEvents ?? []).map((e) => e.summary)).toContain('Goal reached: Salvage a piece of gear. Next: Upgrade a piece of gear.')
  })
})
