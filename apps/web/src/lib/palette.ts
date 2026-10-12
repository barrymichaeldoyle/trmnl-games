/** Game colours by meaning. Every coloured mark also carries a glyph or label, never colour alone. */

/** Log and status glyph colours, keyed by log kind. */
export const KIND_TONE: Record<string, string> = {
  combat: 'text-hp-ink',
  death: 'text-hp-ink',
  loot: 'text-gold-ink',
  levelup: 'text-gold-ink',
  achievement: 'text-gold-ink',
  rest: 'text-xp-ink',
  revive: 'text-xp-ink',
  travel: 'text-sky-ink',
  trap: 'text-rare-ink',
  merchant: 'text-gold-ink',
  choice: 'text-sky-ink',
  raid: 'text-rare-ink',
  todo: 'text-xp-ink',
  career: 'text-gold-ink',
  system: 'text-muted',
}

/** Each biome's world-map tile: Office Cubicles in carpet tan, Server Room in status-LED blue, Cafeteria Depths in ketchup coral, the Archive in old-paper buff, the Parking Garage in concrete grey. */
export const BIOME_SWATCH: Record<string, string> = {
  office_cubicles: 'bg-[#f3d394] text-night',
  server_room: 'bg-sky text-night',
  cafeteria_depths: 'bg-[#f08a6b] text-night',
  archive: 'bg-[#d1b58c] text-night',
  parking_garage: 'bg-[#b8c0cc] text-night',
}

/** Item rarity: name colour plus a gem whose facets grow with rarity. */
export const RARITY_TONE: Record<string, string> = {
  common: 'text-ink',
  uncommon: 'text-xp-ink',
  rare: 'text-rare-ink',
  epic: 'text-gold-ink',
}

/** Log badge fills: the glyph sits in night ink on its game colour. */
export const KIND_BADGE: Record<string, string> = {
  combat: 'bg-hp-ink',
  death: 'bg-hp-ink',
  loot: 'bg-gold',
  levelup: 'bg-gold',
  achievement: 'bg-gold',
  rest: 'bg-xp',
  revive: 'bg-xp',
  travel: 'bg-sky-ink',
  trap: 'bg-rare-ink',
  raid: 'bg-rare-ink',
  todo: 'bg-xp',
  career: 'bg-gold',
  system: 'bg-muted',
}

/**
 * Each biome's game-screen bands (ceiling, upper wall, wall, floor). The hero page's painted scene
 * leaves them showing wherever it is clear (D96); the landing sample multiplies its 1-bit art over them.
 */
export const BIOME_BANDS: Record<string, readonly [string, string, string, string]> = {
  office_cubicles: ['#e7b96f', '#f3d394', '#fbe9c2', '#c98f5a'],
  server_room: ['#5d8fd6', '#78a9e4', '#9fd0f0', '#ffd166'],
  cafeteria_depths: ['#f08a6b', '#f9b394', '#ffd9c2', '#d9534f'],
  archive: ['#b8956a', '#d1b58c', '#efe1c2', '#8a6a44'],
  parking_garage: ['#6b7280', '#8a93a3', '#b8c0cc', '#4b5563'],
}
