import type { IdleAnglerCatalog, Rarity, SpeciesDef } from '../sim/types'

/** Rarity as a rank, so lists run common to epic. */
export const RARITY_RANK: Readonly<Record<Rarity, number>> = { common: 0, uncommon: 1, rare: 2, epic: 3 }

/**
 * Fish as players read them (issue #10): common first and epic last, in catalog order within a rarity. Only for lists;
 * the catalog arrays keep their order because draws and replays depend on it, and a season visitor appended to an
 * older water would otherwise land after its epic.
 */
export function sortByRarity<S extends Pick<SpeciesDef, 'rarity'>>(species: readonly S[]): S[] {
  return species.map((s, index) => ({ s, index })).sort((a, b) => RARITY_RANK[a.s.rarity] - RARITY_RANK[b.s.rarity] || a.index - b.index).map(({ s }) => s)
}

/** Every species grouped by water in the catalog's water order, each water sorted by rarity, as the logbook lists them. */
export function speciesByWater(content: IdleAnglerCatalog): SpeciesDef[] {
  return content.waters.flatMap((w) => sortByRarity(content.species.filter((s) => s.water === w.id)))
}
