import type { BiomeTemplate, ContentCatalog, HeroCounters, HeroState } from './types'

/**
 * Biome helpers and field notes (D133). The Archive and the Parking Garage are difficulty tiers 4 and 5 for monsters,
 * to-do targets, potion drops and gold, but drop the catalog's tier-3 gear: the workbench's ceiling (tiers stop at 3,
 * reinforcement to +3) is its own slice, so a biome names the gear tier it drops apart from its difficulty tier.
 */
export const gearTierOf = (biome: Pick<BiomeTemplate, 'tier' | 'gearTier'>): number => biome.gearTier ?? biome.tier

/** The highest gear tier any biome drops: what "best in slot" means under this catalog. */
export const topGearTier = (content: ContentCatalog): number => Math.max(...content.biomes.map(gearTierOf))

/** What a field note needs from the hero: where it stands and its lifetime counters. */
export type LoreState = Pick<HeroState, 'biomeId'> & { readonly counters: Pick<HeroCounters, 'monsterWins' | 'biomesVisited'> }

/**
 * A floor's note opens once the hero has set foot there: it stands there now, it has arrived there since the counter
 * existed, or it has beaten one of the floor's monsters (which covers arrivals before content v16). The Office is
 * every hero's starting floor, so its note is open from the first tick.
 */
export function biomeNoteOpen(content: ContentCatalog, hero: LoreState, biomeId: string): boolean {
  if (hero.biomeId === biomeId) return true
  if ((hero.counters.biomesVisited?.[biomeId] ?? 0) > 0) return true
  const biome = content.biomes.find((b) => b.id === biomeId)
  return biome !== undefined && biome.monsterIds.some((id) => (hero.counters.monsterWins[id] ?? 0) > 0)
}

/** A monster's note opens with the first victory over it. */
export const monsterNoteOpen = (hero: LoreState, monsterId: string): boolean => (hero.counters.monsterWins[monsterId] ?? 0) > 0

export interface LoreView {
  readonly biomes: readonly {
    readonly id: string
    readonly name: string
    readonly unlockLevel: number
    readonly safe: boolean
    readonly note: string | null
    readonly open: boolean
    readonly monsters: readonly { readonly id: string; readonly name: string; readonly wins: number; readonly note: string | null; readonly open: boolean }[]
  }[]
  /** Notes open out of notes authored, for the page's meter. */
  readonly open: number
  readonly total: number
}

/** Every floor in catalog order with its monsters: the note where it is open, and whether it is; null under a catalog without lore. */
export function loreView(content: ContentCatalog, hero: LoreState): LoreView | null {
  const lore = content.lore
  if (lore === undefined) return null
  let open = 0
  let total = 0
  const biomes = content.biomes.map((biome) => {
    const biomeOpen = biomeNoteOpen(content, hero, biome.id)
    total += 1
    if (biomeOpen) open += 1
    const monsters = biome.monsterIds.map((id) => {
      const monster = content.monsters.find((m) => m.id === id)
      const monsterOpen = monsterNoteOpen(hero, id)
      total += 1
      if (monsterOpen) open += 1
      return { id, name: monster?.name ?? id, wins: hero.counters.monsterWins[id] ?? 0, note: monsterOpen ? (lore.monsters[id] ?? null) : null, open: monsterOpen }
    })
    return { id: biome.id, name: biome.name, unlockLevel: biome.unlockLevel, safe: biome.safe, note: biomeOpen ? (lore.biomes[biome.id] ?? null) : null, open: biomeOpen, monsters }
  })
  return { biomes, open, total }
}

export const LORE_NOTE_MAX = 240

/** Catalog checks: under a catalog with lore, every floor and every monster has one plain note that fits a phone card. */
export function loreProblems(content: ContentCatalog): string[] {
  const lore = content.lore
  if (lore === undefined) return []
  const problems: string[] = []
  const check = (owner: string, note: string | undefined) => {
    if (note === undefined) return problems.push(`${owner} has no field note`)
    const length = [...note].length
    if (length < 20 || length > LORE_NOTE_MAX) problems.push(`${owner} field note must be 20 to ${LORE_NOTE_MAX} characters`)
    if (/\{\w+\}/.test(note)) problems.push(`${owner} field note uses a placeholder`)
  }
  for (const biome of content.biomes) check(`biome ${biome.id}`, lore.biomes[biome.id])
  for (const monster of content.monsters) check(`monster ${monster.id}`, lore.monsters[monster.id])
  for (const id of Object.keys(lore.biomes)) if (!content.biomes.some((b) => b.id === id)) problems.push(`field note for unknown biome ${id}`)
  for (const id of Object.keys(lore.monsters)) if (!content.monsters.some((m) => m.id === id)) problems.push(`field note for unknown monster ${id}`)
  return problems
}
