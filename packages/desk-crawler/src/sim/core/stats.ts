import type { ClassRule, ContentCatalog, HeroClass, HeroState, ItemSnapshot } from './types'

/** Shared stat formulas (gameplay.md). Used by the simulator, intents and UI comparisons. */
export const maxHp = (level: number): number => 100 + 12 * (level - 1)
export const baseAttack = (level: number): number => 10 + 2 * (level - 1)
export const baseDefense = (level: number): number => 4 + Math.floor(0.75 * (level - 1))
export { xpToLeave, cumulativeXpToReach, levelGroup } from '@trmnl-games/engine/levels'
import { xpToLeave } from '@trmnl-games/engine/levels'

export const pctOf = (value: number, pct: number): number => Math.ceil((value * pct) / 100)

/** P37: the class's rule under this catalog; undefined for a Warrior-only catalog, which plays every hero untouched. */
export const classRule = (content: Pick<ContentCatalog, 'classes'>, heroClass: HeroClass | undefined): ClassRule | undefined => content.classes?.[heroClass ?? 'warrior']

/** P37: maximum HP for this hero's level and class, floored, so a class at 100% is exactly the level's base. */
export function heroMaxHp(content: Pick<ContentCatalog, 'classes'>, hero: { readonly level: number; readonly class?: HeroClass }): number {
  const pct = classRule(content, hero.class)?.hpPct ?? 100
  return Math.floor((maxHp(hero.level) * pct) / 100)
}

export interface DerivedStats {
  readonly maxHp: number
  readonly attack: number
  readonly defense: number
  readonly xpToNext: number
}

/** Level and gear only; a class's attack and defense shares apply with the other modifiers (`effectiveStats`). */
export function deriveStats(hero: Pick<HeroState, 'level' | 'weaponId' | 'armorId'> & { readonly class?: HeroClass }, inventory: readonly ItemSnapshot[], content: Pick<ContentCatalog, 'classes'> = {}): DerivedStats {
  const weapon = hero.weaponId === undefined ? undefined : inventory.find((item) => item.id === hero.weaponId)
  const armor = hero.armorId === undefined ? undefined : inventory.find((item) => item.id === hero.armorId)
  return {
    maxHp: heroMaxHp(content, hero),
    attack: baseAttack(hero.level) + (weapon?.attack ?? 0),
    defense: baseDefense(hero.level) + (armor?.defense ?? 0),
    xpToNext: xpToLeave(hero.level),
  }
}

export interface LevelResult {
  readonly level: number
  readonly xp: number
  readonly levelsGained: number
  /** Total increase in maximum HP across all levels gained. */
  readonly maxHpGain: number
}

/** Apply granted XP: subtract each threshold, repeat for multiple levels. */
export function applyXp(level: number, xp: number, granted: number): LevelResult {
  let nextLevel = level
  let nextXp = xp + granted
  while (nextXp >= xpToLeave(nextLevel)) {
    nextXp -= xpToLeave(nextLevel)
    nextLevel += 1
  }
  return {
    level: nextLevel,
    xp: nextXp,
    levelsGained: nextLevel - level,
    maxHpGain: maxHp(nextLevel) - maxHp(level),
  }
}


