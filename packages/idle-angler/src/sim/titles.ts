import type { AnglerState, IdleAnglerCatalog, WaterDef, WaterId } from './types'

/**
 * Idle Angler's progression (2026-10-10): an angler's standing is a title earned by species logged, and a water opens
 * once enough of the previous water's species are in the logbook. Desk Crawler climbs by level; Idle Angler by knowing
 * its fish. Idle Angler has no XP or levels.
 */
export const TITLES = [
  { id: 'newcomer', name: 'Newcomer', species: 0 },
  { id: 'regular', name: 'Regular', species: 4 },
  { id: 'local', name: 'Local', species: 8 },
  { id: 'old_hand', name: 'Old Hand', species: 14 },
  { id: 'specimen_hunter', name: 'Specimen Hunter', species: 20 },
  { id: 'master_angler', name: 'Master Angler', species: 26 },
  // D162 (content v2, 58 species): v1 has 30 species, so these never fire under it.
  { id: 'old_salt', name: 'Old Salt', species: 36 },
  { id: 'lakeside_legend', name: 'Lakeside Legend', species: 46 },
  { id: 'keeper', name: 'Keeper of the Logbook', species: 56 },
] as const

export type Title = (typeof TITLES)[number]

/** Species in the logbook, in all or at one water. */
export function speciesLogged(content: IdleAnglerCatalog, logbook: AnglerState['logbook'], waterId?: WaterId): number {
  return content.species.filter((s) => logbook[s.id] !== undefined && (waterId === undefined || s.water === waterId)).length
}

export function titleFor(species: number): Title {
  return [...TITLES].reverse().find((t) => species >= t.species)!
}

export function nextTitle(species: number): Title | null {
  return TITLES.find((t) => t.species > species) ?? null
}

/**
 * A rank at each water (P45), by the share of that water's species logged: the global title takes 58 species to finish,
 * a water's ranks take its eight to eleven, so the next one is always close. Visitor is where everyone starts; the top
 * rank needs every species there, the season visitor and the epic included. Thresholds round up, so 10 species give
 * 3, 5, 8 and 10.
 */
export const WATER_RANKS = [
  { id: 'visitor', name: 'Visitor', share: 0 },
  { id: 'angler', name: 'Angler', share: 0.25 },
  { id: 'expert', name: 'Expert', share: 0.5 },
  { id: 'veteran', name: 'Veteran', share: 0.75 },
  { id: 'master', name: 'Master', share: 1 },
] as const

export type WaterRank = (typeof WATER_RANKS)[number]

/** Species a rank needs at a water with `total` species. */
export const rankThreshold = (rank: WaterRank, total: number): number => Math.ceil(rank.share * total)

/** The rank `logged` of a water's `total` species earns, and the next rank with the species it needs. */
export function waterRankAt(logged: number, total: number): { rank: WaterRank; next: { rank: WaterRank; species: number } | null } {
  const rank = [...WATER_RANKS].reverse().find((r) => logged >= rankThreshold(r, total))!
  const after = WATER_RANKS.find((r) => rankThreshold(r, total) > logged)
  return { rank, next: after ? { rank: after, species: rankThreshold(after, total) } : null }
}

/** The angler's rank at one water. */
export function waterRankFor(content: IdleAnglerCatalog, logbook: AnglerState['logbook'], waterId: WaterId) {
  const logged = speciesLogged(content, logbook, waterId)
  const total = content.species.filter((s) => s.water === waterId).length
  return { logged, total, ...waterRankAt(logged, total) }
}

/** "Expert at the Millpond", as stories and the device write it. */
export const waterRankName = (rank: WaterRank, water: Pick<WaterDef, 'the'>) => `${rank.name} at ${water.the}`

/**
 * Whether the logbook opens a water: it has no requirement, the angler is there or has logged a fish there (so an
 * angler who reached it under the old level rule keeps it), or enough of the previous water's species are logged.
 */
export function waterKnown(content: IdleAnglerCatalog, angler: Pick<AnglerState, 'logbook' | 'waterId'>, water: WaterDef): boolean {
  if (water.opensAfter === undefined || angler.waterId === water.id) return true
  if (speciesLogged(content, angler.logbook, water.id) > 0) return true
  return speciesLogged(content, angler.logbook, water.opensAfter.water) >= water.opensAfter.species
}
