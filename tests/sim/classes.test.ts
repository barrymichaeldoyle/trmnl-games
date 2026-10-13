import { describe, expect, it } from 'vitest'
import { catalogs } from '@trmnl-games/desk-crawler/content'
import { ACHIEVEMENTS } from '@trmnl-games/desk-crawler/content/achievements'
import { validateCatalog } from '@trmnl-games/desk-crawler/content/validate'
import { applyItemChanges } from '@trmnl-games/desk-crawler/sim/core/apply'
import { measure } from '@trmnl-games/desk-crawler/sim/core/achievements'
import { unlocked, unlockLevel } from '@trmnl-games/desk-crawler/sim/core/career'
import { effectiveStats } from '@trmnl-games/desk-crawler/sim/core/modifiers'
import { raidWinChance } from '@trmnl-games/desk-crawler/sim/core/raid'
import { simulateHero, SIMULATION_VERSION } from '@trmnl-games/desk-crawler/sim/core/simulate'
import { starterHero, starterKit } from '@trmnl-games/desk-crawler/sim/core/starter'
import { heroMaxHp, maxHp, xpToLeave } from '@trmnl-games/desk-crawler/sim/core/stats'
import { classPose, heroPoses } from '@trmnl-games/desk-crawler/art/hero'
import { parseScenePath, renderScenePng } from '@trmnl-games/desk-crawler/art/route'
import { sceneFor, scenePath } from '@trmnl-games/desk-crawler/art/sceneKey'
import type { ContentCatalog, HeroClass, HeroState, ItemSnapshot, SimulationResult, StreamSeeds } from '@trmnl-games/desk-crawler/sim/core/types'
import { seeds, withId } from './helpers'

const v17 = catalogs.v17
const v18 = catalogs.v18
const rogue = v18.classes!.rogue
const EPOCH = Date.UTC(2026, 9, 13)
const QUARTER = 15 * 60 * 1000
const allStreams = (n: number): StreamSeeds => ({ ...seeds(n), quest: (n * 1597334677 + 11) >>> 0, raid: (n * 2246822519 + 7) >>> 0 })

function hero(heroClass: HeroClass, overrides: Partial<HeroState> = {}, content: ContentCatalog = v18): { hero: HeroState; inventory: ItemSnapshot[] } {
  const kit = starterKit(content)
  const inventory = [withId(kit.weapon, 'i000'), withId(kit.armor, 'i001'), withId(kit.potions, 'i999')]
  return { hero: { ...starterHero('hero1', content, 0, heroClass), weaponId: 'i000', armorId: 'i001', ...overrides }, inventory }
}

const run = (h: HeroState, inventory: readonly ItemSnapshot[], tick: number, content: ContentCatalog): SimulationResult =>
  simulateHero({ hero: h, inventory, tick, content, simulationVersion: SIMULATION_VERSION, streams: allStreams(tick), tickAt: EPOCH + tick * QUARTER })

describe('classes in the catalog (P37, content v18)', () => {
  it('is valid, keeps the Warrior untouched and opens the roster at level 6', () => {
    expect(validateCatalog(v18)).toEqual([])
    expect(v18.classes!.warrior).toMatchObject({ hpPct: 100, modifiers: {}, raidEdgePct: 0 })
    expect(unlockLevel(v18, 'roster')).toBe(6)
    expect(unlockLevel(v17, 'roster')).toBeUndefined()
    expect(unlocked(v18, 5, 'roster')).toBe(false)
    expect(unlocked(v18, 6, 'roster')).toBe(true)
    // A catalog with no unlocks at all still never opens the roster.
    expect(unlocked(catalogs.v1, 50, 'roster')).toBe(false)
    const patch = (change: object) => validateCatalog({ ...v18, classes: { ...v18.classes!, ...change } })
    expect(patch({ warrior: { ...v18.classes!.warrior, hpPct: 90 } })).toContain('the warrior is the baseline: 100% HP, no modifiers, no raid edge')
    expect(patch({ rogue: { ...rogue, hpPct: 40 } })).toContain('class rogue HP share must be 60 to 140%')
    expect(patch({ rogue: { ...rogue, raidEdgePct: 20 } })).toContain('class rogue raid edge must be within 10 points')
    const { roster: _r, ...noRoster } = v18.unlocks!
    expect(validateCatalog({ ...v18, unlocks: noRoster })).toContain('classes need a roster unlock level')
    expect(validateCatalog({ ...v17, unlocks: { ...v17.unlocks!, roster: 6 } })).toContain('a roster unlock without classes')
  })

  it('replays a Warrior under v18 exactly as under v17: 300 seeded ticks, same stories and state', { timeout: 30_000 }, () => {
    let a = hero('warrior', { level: 9, biomeId: 'cafeteria_depths', stance: 'bold' }, v17)
    let b = hero('warrior', { level: 9, biomeId: 'cafeteria_depths', stance: 'bold' }, v18)
    for (let tick = 1; tick <= 300; tick += 1) {
      const ra = run(a.hero, a.inventory, tick, v17)
      const rb = run(b.hero, b.inventory, tick, v18)
      expect(rb.event?.summary).toBe(ra.event?.summary)
      expect(rb.nextHero).toEqual(ra.nextHero)
      a = applyItemChanges(ra.nextHero, a.inventory, ra.itemChanges, () => `n${tick}`)
      b = applyItemChanges(rb.nextHero, b.inventory, rb.itemChanges.map((change) => (change.type === 'create' ? { ...change, item: { ...change.item, contentVersion: 'v17' } } : change)), () => `n${tick}`)
    }
  })
})

describe('the Rogue in the simulator (P37)', () => {
  it('scales health, attack and defense by its rule, and starts at its own full health', () => {
    const { hero: h, inventory } = hero('rogue', { level: 10 })
    expect(heroMaxHp(v18, h)).toBe(Math.floor((maxHp(10) * rogue.hpPct) / 100))
    expect(starterHero('x', v18, 0, 'rogue').hp).toBe(Math.floor((maxHp(1) * rogue.hpPct) / 100))
    const warrior = effectiveStats(v18, { ...h, class: 'warrior' }, inventory, 0)
    const stats = effectiveStats(v18, h, inventory, 0)
    expect(stats.attack).toBe(Math.max(1, Math.floor((warrior.attack * (100 + (rogue.modifiers.attackPct ?? 0))) / 100)))
    expect(stats.defense).toBe(Math.max(1, Math.floor((warrior.defense * (100 + (rogue.modifiers.defensePct ?? 0))) / 100)))
    expect(stats.modifiers.goldPct).toBe(rogue.modifiers.goldPct)
    // A Warrior-only catalog plays the Rogue untouched (it can only exist once classes do, but the rule is total).
    expect(heroMaxHp(v17, h)).toBe(maxHp(10))
  })

  it('takes more gold from a fight than a Warrior on the same draws', () => {
    let more = 0
    for (let tick = 1; tick <= 200 && more === 0; tick += 1) {
      const w = run(hero('warrior', { level: 5, biomeId: 'server_room' }).hero, hero('warrior').inventory, tick, v18)
      const r = run(hero('rogue', { level: 5, biomeId: 'server_room' }).hero, hero('rogue').inventory, tick, v18)
      const wo = w.event?.detail.outcome
      const ro = r.event?.detail.outcome
      if (wo?.variant === 'combat' && ro?.variant === 'combat' && wo.outcome === 'victory' && ro.outcome === 'victory' && wo.monsterId === ro.monsterId && wo.goldGranted > 0) {
        expect(ro.goldGranted).toBeGreaterThanOrEqual(wo.goldGranted)
        if (ro.goldGranted > wo.goldGranted) more += 1
      }
    }
    expect(more).toBeGreaterThan(0)
  })

  it('adds both classes’ raid edges to the contest, and every pairing stays within 10 to 90%', () => {
    expect(raidWinChance(v18, 'balanced', 'balanced', rogue.raidEdgePct, 0)).toBe(50 + rogue.raidEdgePct)
    expect(raidWinChance(v18, 'balanced', 'balanced', 0, rogue.raidEdgePct)).toBe(50 - rogue.raidEdgePct)
    expect(raidWinChance(v18, 'cautious', 'bold')).toBe(raidWinChance(v17, 'cautious', 'bold'))
  })

  it('announces the roster only when a Warrior reaches level 6, and only under v18', () => {
    const unlockLines = (r: SimulationResult) => (r.extraEvents ?? []).filter((e) => e.detail.outcome.variant === 'career' && e.detail.outcome.phase === 'unlocked' && e.detail.outcome.id === 'roster').map((e) => e.summary)
    const nearly = (heroClass: HeroClass, content: ContentCatalog) => {
      const { hero: h, inventory } = hero(heroClass, { level: 5, xp: 0, biomeId: 'server_room' }, content)
      for (let tick = 1; tick <= 400; tick += 1) {
        const result = run({ ...h, xp: xpToLeave(5) - 1 }, inventory, tick, content)
        if (result.nextHero.level >= 6) return result
      }
      throw new Error('no level-up')
    }
    expect(unlockLines(nearly('warrior', v18))).toEqual(['Unlocked: a second hero.'])
    expect(unlockLines(nearly('rogue', v18))).toEqual([])
    expect(unlockLines(nearly('warrior', v17))).toEqual([])
  })

  it('earns the Rogue families only as a Rogue', () => {
    const state = (heroClass: HeroClass, level: number) => ({ level, bagCapacity: 10, counters: starterHero('x', v18, 0).counters, keepsakeTotal: 0, heroClass })
    const recruit = ACHIEVEMENTS.find((a) => a.id === 'rogue_1')!
    const cutpurse = ACHIEVEMENTS.find((a) => a.id === 'rogue_2')!
    expect(measure(recruit.predicate, state('rogue', 1), v18)).toEqual({ value: 1, target: 1 })
    expect(measure(recruit.predicate, state('warrior', 30), v18)).toEqual({ value: 0, target: 1 })
    expect(measure(cutpurse.predicate, state('rogue', 7), v18)).toEqual({ value: 7, target: 7 })
  })
})

describe('Rogue art (P37)', () => {
  it('draws every pose under the Rogue’s own names and leaves every Warrior path as it was', () => {
    expect(sceneFor('exploring', false, null)).toEqual({ pose: 'idle', subject: { kind: 'none' } })
    expect(sceneFor('exploring', false, null, 'rogue')).toEqual({ pose: 'rogue_idle', subject: { kind: 'none' } })
    expect(sceneFor('dead', false, null, 'rogue').pose).toBe('rogue_knocked_out')
    for (const pose of ['idle', 'fight', 'walk', 'rest', 'sleep', 'knocked_out'] as const) {
      const name = classPose(pose, 'rogue')
      expect(heroPoses[name].height).toBe(heroPoses[pose].height)
      const path = scenePath('office_cubicles', name, { kind: 'none' }, 5)
      expect(parseScenePath(path)?.pose).toBe(name)
      expect(renderScenePng(path)).not.toBeNull()
    }
    // The hood changes the standing poses' ink; lying down, only the companion's colours differ.
    expect(heroPoses.rogue_idle.rows).not.toEqual(heroPoses.idle.rows)
    expect(heroPoses.rogue_rest.rows).not.toEqual(heroPoses.rest.rows)
    expect(scenePath('office_cubicles', 'idle', { kind: 'none' }, 5)).toBe('/art/scene/v4/office_cubicles/day/idle/none/5.png')
  })
})
