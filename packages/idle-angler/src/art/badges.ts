import type { Canvas } from '@trmnl-games/engine/art/canvas'
import { badgeCanvas as drawBadge, badgeLayers as medallion, frameForTier as frameOf, showcase, type BadgeFrame, type BadgeLayers } from '@trmnl-games/engine/art/badge'
import { ACHIEVEMENTS, ACHIEVEMENT_BY_ID } from '../content/achievements'
import { FISH_TRAITS, fishSprite } from './fish'

/**
 * Achievement badges (P48, idle-angler-badges.md): one 16x16 1-bit picture per achievement family, set in a 32x32
 * medallion whose frame shows the tier. Species families draw their fish from `fish.ts` instead of a picture, so a new
 * species needs no badge art. The medallion itself is the engine's (`art/badge.ts`), shared with Desk Crawler; one
 * source draws the companion (painted, `badgeLayers`) and the device (1-bit PNG, `badgeCanvas`). Rows use the engine's grid characters; '.' in the pictures below is read as transparent.
 */
export const BADGE_SIZE = 32
export { BADGE_FRAMES, type BadgeFrame } from '@trmnl-games/engine/art/badge'

const picture = (rows: readonly string[]): readonly string[] => rows.map((row) => row.replaceAll('.', ' '))

export const BADGE_PICTURES = {
  /** A float, tip up, over rings in the water. */
  catches: picture([
    '.......##.......',
    '.......##.......',
    '.......##.......',
    '......####......',
    '.....##..##.....',
    '....##....##....',
    '....########....',
    '....########....',
    '....########....',
    '.....######.....',
    '......####......',
    '.......##.......',
    '...#########....',
    '.##.........##..',
    '................',
    '....#######.....',
  ]),
  /** A fish too big for the badge, measured under it. */
  big_ones: picture([
    '................',
    '................',
    '....#######.....',
    '..##########..#.',
    '.##.#########.##',
    '##############..',
    '##############..',
    '.############.##',
    '..##########..#.',
    '....#######.....',
    '................',
    '#..............#',
    '################',
    '#..............#',
    '................',
    '................',
  ]),
  /** A fish with a sparkle over it. */
  rare_catches: picture([
    '...........#....',
    '...........#....',
    '.........#####..',
    '...........#....',
    '...........#....',
    '................',
    '...######.......',
    '..########...##.',
    '.###.######.###.',
    '.###########.#..',
    '..##########....',
    '..#########.##..',
    '...######...###.',
    '.............##.',
    '................',
    '................',
  ]),
  /** A fish wearing a crown. */
  epic_catches: picture([
    '..#..#..#.......',
    '..##.##.##......',
    '..########......',
    '..########......',
    '................',
    '..########...##.',
    '.###.######.###.',
    '.###########.#..',
    '..##########....',
    '..#########.##..',
    '...######...###.',
    '.............##.',
    '................',
    '................',
    '................',
    '................',
  ]),
  /** A tail flicking out of the water. */
  got_away: picture([
    '................',
    '.##..........##.',
    '.###........###.',
    '..###......###..',
    '...###....###...',
    '....########....',
    '.....######.....',
    '......####......',
    '.......##.......',
    '.......##.......',
    '.....######.....',
    '..###......###..',
    '##............##',
    '................',
    '....########....',
    '................',
  ]),
  /** The hissing lamp. */
  night_fishing: picture([
    '......####......',
    '.....#....#.....',
    '.....######.....',
    '....########....',
    '....#......#....',
    '....#.#..#.#....',
    '....#..##..#....',
    '....#.####.#....',
    '....#.####.#....',
    '....#..##..#....',
    '....#......#....',
    '....########....',
    '.....######.....',
    '................',
    '#..#..#..#..#..#',
    '.##..##..##..##.',
  ]),
  /** A fish slipping head first back into the water. */
  released: picture([
    '.....#....#.....',
    '.....##..##.....',
    '......####......',
    '.......##.......',
    '......####......',
    '.....######.....',
    '.....######.....',
    '.....######.....',
    '.....##.###.....',
    '......####......',
    '.......##.......',
    '..###......###..',
    '.#...######...#.',
    '................',
    '...##########...',
    '................',
  ]),
  /** The open book with a pencil. */
  logbook: picture([
    '.............##.',
    '............###.',
    '...........###..',
    '.##......####...',
    '#..##..##.##....',
    '#....##..##.....',
    '#.##.##.#.#.....',
    '#....##...##....',
    '#.##.##.##.#....',
    '#....##....#....',
    '#.##.##.##.#....',
    '#....##....#....',
    '#...####...#....',
    '####....####....',
    '................',
    '................',
  ]),
  /** A folded map under a pin. */
  waters: picture([
    '.....####.......',
    '....#....#......',
    '....#.##.#......',
    '....#....#......',
    '.....#..#.......',
    '......##........',
    '#####.#..#######',
    '#..#.....#....##',
    '#..#####.#....##',
    '#...#..#.#....##',
    '#...#..#.###..##',
    '##..#....#.#..##',
    '##..#....#....##',
    '##..#....#....##',
    '################',
    '................',
  ]),
  /** A rod and reel, the line hanging from its tip. */
  rods: picture([
    '..............#.',
    '.............#.#',
    '............#..#',
    '...........#...#',
    '..........#....#',
    '.........#.....#',
    '........##.....#',
    '.......##......#',
    '......##......##',
    '..##.##.......#.',
    '.#..###.......#.',
    '.#..##..........',
    '..###...........',
    '..##............',
    '.##.............',
    '##..............',
  ]),
  /** A stack of coins. */
  gold_earned: picture([
    '................',
    '.....######.....',
    '....#......#....',
    '....########....',
    '....#......#....',
    '....########....',
    '..######...#....',
    '.#......#..#....',
    '.########.##....',
    '.#......#.##....',
    '.########.######',
    '.#......##......',
    '.#########.....#',
    '.#......#######.',
    '.########.......',
    '................',
  ]),
  /** A fish with a price tag. */
  sales: picture([
    '..........####..',
    '.........#....#.',
    '........#..##.#.',
    '........#.....#.',
    '.........#...#..',
    '..........#.#...',
    '...........#....',
    '...........#....',
    '...######..#..##',
    '..########.#.##.',
    '.###.##########.',
    '.##############.',
    '..##########.##.',
    '...######.....##',
    '................',
    '................',
  ]),
  /** A tied fly: hackle, wing and the hook under it. */
  flies: picture([
    '................',
    '.........###....',
    '........#####...',
    '.......######...',
    '......######....',
    '.....#####......',
    '..#.#####.#.....',
    '...######.......',
    '.#.#####.#......',
    '..#####.........',
    '...##...........',
    '...#............',
    '...#.......#....',
    '...#......##....',
    '....#....#.#....',
    '.....####.......',
  ]),
  /** The fishmonger's slate on its easel. */
  orders: picture([
    '................',
    '################',
    '#..............#',
    '#.####..##.#...#',
    '#..............#',
    '#.##.###.###...#',
    '#..............#',
    '#.###.##..##...#',
    '#..............#',
    '#.##..####.....#',
    '#..............#',
    '################',
    '...#........#...',
    '..#..........#..',
    '.#............#.',
    '................',
  ]),
  /** A small fish on a big hook. */
  deadbait: picture([
    '..........##....',
    '.........#..#...',
    '..........##....',
    '...........#....',
    '...........#....',
    '...######..#....',
    '..########.#.#..',
    '.##.#########...',
    '.############...',
    '..########.#.#..',
    '...######..#....',
    '...........#....',
    '..#........#....',
    '..##......#.....',
    '...#######......',
    '................',
  ]),
  /** A fish mounted on its plaque. */
  trophies: picture([
    '.......##.......',
    '......#..#......',
    '..############..',
    '.#............#.',
    '#..............#',
    '#...######...#.#',
    '#..########.##.#',
    '#.###.#######..#',
    '#.###########..#',
    '#..#########.#.#',
    '#...######....##',
    '#..............#',
    '.#............#.',
    '..############..',
    '................',
    '................',
  ]),
  /** A rosette with its two tails. */
  opens: picture([
    '.....######.....',
    '...##......##...',
    '..#..######..#..',
    '.#..#......#..#.',
    '.#.#..####..#.#.',
    '.#.#.#....#.#.#.',
    '.#.#.#....#.#.#.',
    '.#.#..####..#.#.',
    '.#..#......#..#.',
    '..#..######..#..',
    '...##......##...',
    '....##.##.##....',
    '....#.#..#.#....',
    '...#..#..#..#...',
    '...#.#....#.#...',
    '...##......##...',
  ]),
  /** A medal on its ribbon. */
  medals: picture([
    '..###......###..',
    '..#..#....#..#..',
    '...#..#..#..#...',
    '....#..##..#....',
    '.....#....#.....',
    '......####......',
    '.....######.....',
    '....##....##....',
    '...##..##..##...',
    '...#..####..#...',
    '...#..####..#...',
    '...##..##..##...',
    '....##....##....',
    '.....######.....',
    '................',
    '................',
  ]),
  /** A wall calendar on its rings, a fish on the page. */
  seasons: picture([
    '...#...#...#....',
    '.##############.',
    '.#.#...#...#..#.',
    '.#############..',
    '.#............#.',
    '.#.##.##.##.#.#.',
    '.#............#.',
    '.#...######...#.',
    '.#..########.##.',
    '.#.##.#######.#.',
    '.#..########.##.',
    '.#...######...#.',
    '.#............#.',
    '.#.##.##.##.#.#.',
    '.##############.',
    '................',
  ]),
  /** Three fish running upstream in a line. */
  runs: picture([
    '..........####..',
    '.......#.######.',
    '.......####.###.',
    '.......#.######.',
    '..........####..',
    '................',
    '......####......',
    '...#.######.....',
    '...####.###.....',
    '...#.######.....',
    '......####......',
    '................',
    '..####..........',
    '#.######........',
    '####.###........',
    '#.######........',
  ]),
  /** Two rosettes hung on a line. */
  rosettes: picture([
    '################',
    '...#........#...',
    '.#####....#####.',
    '#.....#..#.....#',
    '#.###.#..#.###.#',
    '#.#.#.#..#.#.#.#',
    '#.###.#..#.###.#',
    '#.....#..#.....#',
    '.#####....#####.',
    '.#.#.......#.#..',
    '.#.#.......#.#..',
    '.#.#.......#.#..',
    '#..#......#..#..',
    '................',
    '................',
    '................',
  ]),
  /** The map pin, crowned. */
  mastered: picture([
    '....#..##..#....',
    '....########....',
    '....########....',
    '................',
    '.....######.....',
    '....##....##....',
    '...##..##..##...',
    '...#..####..#...',
    '...##..##..##...',
    '....##....##....',
    '.....##..##.....',
    '......####......',
    '.......##.......',
    '................',
    '................',
    '................',
  ]),
} as const satisfies Record<string, readonly string[]>

/** Species whose sprite does not read at badge size, drawn by hand: the ray from above, spots and eyes on its back. */
const SPECIES_PICTURES: Readonly<Record<string, readonly string[]>> = {
  thornback_ray: picture([
    '.......##.......',
    '......#ww#......',
    '.....#wwww#.....',
    '....#w#ww#w#....',
    '...#wwwwwwww#...',
    '..#ww#wwww#ww#..',
    '.#wwwwwwwwwwww#.',
    '#wwww#wwww#wwww#',
    '.#wwwwwwwwwwww#.',
    '..##ww#ww#ww##..',
    '....##wwww##....',
    '......#ww#......',
    '.......##.......',
    '.......#........',
    '........#.......',
    '.......#........',
  ]),
}

export type BadgePictureId = keyof typeof BADGE_PICTURES

/** Whether a family has a picture or is a species family (`species_<id>`) drawn from its fish. */
export const speciesOfFamily = (family: string): string | null => (family.startsWith('species_') ? family.slice('species_'.length) : null)

/** A fish's size in the medallion: flatfish are drawn from above, so they get the height. */
function speciesSize(species: string): [number, number] {
  const body = FISH_TRAITS[species]?.body
  return body === 'flat' ? [20, 13] : body === 'eel' ? [22, 9] : [20, 10]
}

/**
 * The medallion's layers for a family (the shared `badgeLayers` at 32 pixels): its picture, or its fish. On the device
 * (`cutout`) the top tier cuts a picture out of its solid disc and gives a fish a paper window, since a cut-out fish
 * reads as noise at 2x; the companion keeps the art as it is.
 */
export function badgeLayers(family: string, frame: BadgeFrame, cutout = true): BadgeLayers {
  const species = speciesOfFamily(family)
  const art: readonly string[] = species ? (SPECIES_PICTURES[species] ?? fishSprite(species, ...speciesSize(species)).rows) : ((BADGE_PICTURES as Record<string, readonly string[]>)[family] ?? [])
  return medallion(BADGE_SIZE, art, frame, { cutout, creature: species !== null })
}

/** The 1-bit medallion for the device. */
export const badgeCanvas = (family: string, frame: BadgeFrame): Canvas => drawBadge(badgeLayers(family, frame))

/** Whether a family id has a badge: a picture, or a species with a fish sprite. */
export const hasBadge = (family: string): boolean => {
  const species = speciesOfFamily(family)
  return species ? species in FISH_TRAITS : family in BADGE_PICTURES
}

/** How many tiers each family has in the current catalog. */
const TIER_COUNTS: ReadonlyMap<string, number> = ACHIEVEMENTS.reduce((counts, a) => counts.set(a.family, Math.max(counts.get(a.family) ?? 0, a.tier)), new Map<string, number>())

/**
 * Which frame a family's tier wears: the family's last tier always wears the top frame, so a finished family looks
 * finished whether it has one tier or seven, and the tiers before it climb copper, silver, gold and sky. A species'
 * first catch is the ring and its specimen the top frame by the same rule.
 */
export const frameForTier = (family: string, tier: number): BadgeFrame => frameOf(tier, TIER_COUNTS.get(family) ?? 5)

/**
 * The badges a public profile shows (P48): each family's highest earned tier, finished families first, then the rarest
 * (`counts` holders out of the publication's players), then the higher tier.
 */
export function showcaseBadges(unlocked: readonly string[], counts: Readonly<Record<string, number>> | null = null): Array<{ family: string; tier: number; id: string }> {
  const earned = unlocked.flatMap((id) => {
    const def = ACHIEVEMENT_BY_ID.get(id)
    return def ? [{ family: def.family, tier: def.tier, id }] : []
  })
  return showcase(earned, (b) => frameForTier(b.family, b.tier), counts)
}
