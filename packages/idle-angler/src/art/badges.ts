import { Canvas, type Sprite } from '@trmnl-games/engine/art/canvas'
import { FISH_TRAITS, fishSprite } from './fish'

/**
 * Achievement badges (P48, idle-angler-badges.md): one 16x16 1-bit picture per achievement family, set in a 32x32
 * medallion whose frame shows the tier. Species families draw their fish from `fish.ts` instead of a picture, so a new
 * species needs no badge art. One source draws the companion (painted, `badgeLayers`) and the device (1-bit PNG,
 * `badgeSprite`). Rows use the engine's grid characters; '.' in the pictures below is read as transparent.
 */
export const BADGE_SIZE = 32
/** The frames: 0 is locked, 1 to 5 the tiers. */
export const BADGE_FRAMES = [0, 1, 2, 3, 4, 5] as const
export type BadgeFrame = (typeof BADGE_FRAMES)[number]

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
  /** The year: the summer sun and a winter snowflake either side of a line. */
  seasons: picture([
    '..#..#..........',
    '...####.........',
    '.#######........',
    '..######......#.',
    '.#######.....#..',
    '...####.....#...',
    '..#..#.....#....',
    '..........#.....',
    '.........#......',
    '........#.......',
    '.......#..#.#.#.',
    '......#....###..',
    '.....#....#####.',
    '....#......###..',
    '...#......#.#.#.',
    '................',
  ]),
  /** Three fish running upstream in a line. */
  runs: picture([
    '................',
    '.........#####..',
    '.......########.',
    '.......###.###..',
    '.........#####..',
    '................',
    '....#####.......',
    '..########......',
    '..###.###.......',
    '....#####.......',
    '................',
    '.#####..........',
    '########........',
    '###.###.........',
    '.#####..........',
    '................',
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

export type BadgePictureId = keyof typeof BADGE_PICTURES

/** Whether a family has a picture or is a species family (`species_<id>`) drawn from its fish. */
export const speciesOfFamily = (family: string): string | null => (family.startsWith('species_') ? family.slice('species_'.length) : null)

const CENTRE = (BADGE_SIZE - 1) / 2

/** A point on the circle of radius `r` at `angle` degrees (0 at the top, clockwise), rounded to a cell. */
const onCircle = (r: number, angle: number): [number, number] => [Math.round(CENTRE + r * Math.sin((angle * Math.PI) / 180) - 0.5), Math.round(CENTRE - r * Math.cos((angle * Math.PI) / 180) - 0.5)]
const distanceOf = (x: number, y: number) => Math.hypot(x - CENTRE, y - CENTRE)

const toRad = (deg: number) => (deg * Math.PI) / 180
/** A cell's angle from the centre, 0 at the top, clockwise, in degrees. */
const angleOf = (x: number, y: number) => ((Math.atan2(x - CENTRE, CENTRE - y) * 180) / Math.PI + 360) % 360
/** The gap in degrees between two angles. */
const apart = (a: number, b: number) => Math.abs((((a - b) % 360) + 540) % 360 - 180)

/** Whether a cell lies in a leaf: an ellipse on radius 15 at `angle`, tilted toward the top. */
function inLeaf(x: number, y: number, angle: number, side: 1 | -1): boolean {
  const [cx, cy] = [CENTRE + 15 * Math.sin(toRad(angle)), CENTRE - 15 * Math.cos(toRad(angle))]
  const tilt = toRad(angle + 90 * side + 35 * side)
  const [dx, dy] = [x - cx, y - cy]
  const u = dx * Math.sin(tilt) - dy * Math.cos(tilt)
  const v = dx * Math.cos(tilt) + dy * Math.sin(tilt)
  return (u / 2.3) ** 2 + (v / 1.15) ** 2 <= 1
}

/** The frame by tier, as rows: the ring 2 cells thick at radius 11.5 to 13.5, and what each tier adds outside it. */
function frameRows(frame: BadgeFrame): string[] {
  const grid = Array.from({ length: BADGE_SIZE }, () => Array.from({ length: BADGE_SIZE }, () => ' '))
  const put = (x: number, y: number, ch = '#') => {
    if (x >= 0 && y >= 0 && x < BADGE_SIZE && y < BADGE_SIZE) grid[y]![x] = ch
  }
  for (let y = 0; y < BADGE_SIZE; y += 1) {
    for (let x = 0; x < BADGE_SIZE; x += 1) {
      const d = distanceOf(x, y)
      const angle = angleOf(x, y)
      let ink = false
      switch (frame) {
        case 0:
          // Locked: a thin dotted ring.
          ink = d >= 12.5 && d < 13.5 && (x + y) % 2 === 0
          break
        case 1:
          ink = d >= 11.5 && d < 13.5
          break
        case 2:
          // A double ring.
          ink = (d >= 11.5 && d < 13.5) || (d >= 14.5 && d < 15.6)
          break
        case 3: {
          // A thick ring with eight round studs on it.
          const stud = [0, 45, 90, 135, 180, 225, 270, 315].some((a) => Math.hypot(x - (CENTRE + 13.5 * Math.sin(toRad(a))), y - (CENTRE - 13.5 * Math.cos(toRad(a)))) < 1.9)
          ink = (d >= 11.5 && d < 14.2) || stud
          break
        }
        case 4: {
          // The double ring with sixteen rays, tapering outward.
          const ray = d >= 14 && d < 16.6 && Array.from({ length: 16 }, (_, i) => i * 22.5).some((a) => toRad(apart(angle, a)) * d <= (16.6 - d) * 0.75)
          ink = (d >= 11.5 && d < 13.5) || ray
          break
        }
        case 5: {
          // The top tier: the sunburst round a solid disc, the picture cut out of it in paper (`badgeLayers`).
          const ray = d >= 14 && d < 16.6 && Array.from({ length: 16 }, (_, i) => i * 22.5).some((a) => toRad(apart(angle, a)) * d <= (16.6 - d) * 0.75)
          ink = d < 13.5 || ray
          break
        }
      }
      if (ink) put(x, y)
    }
  }
  return grid.map((row) => row.join(''))
}

/**
 * The medallion's layers, each a full-size sprite: the paper disc, the frame and the picture (or the fish). On the
 * device (`cutout`) the top tier cuts the picture out of its solid disc, ink to paper; the companion paints the disc
 * in the tier's colour instead and keeps the picture as it is.
 */
export function badgeLayers(family: string, frame: BadgeFrame, cutout = true): { disc: Sprite; frame: Sprite; picture: Sprite } {
  const disc: string[] = []
  const ring = frameRows(frame)
  for (let y = 0; y < BADGE_SIZE; y += 1) {
    let discRow = ''
    for (let x = 0; x < BADGE_SIZE; x += 1) {
      discRow += distanceOf(x, y) < 12.5 ? 'w' : ' '
    }
    disc.push(discRow)
  }
  const species = speciesOfFamily(family)
  const art: readonly string[] = species ? fishSprite(species, 20, 10).rows : ((BADGE_PICTURES as Record<string, readonly string[]>)[family] ?? [])
  const width = art[0]?.length ?? 0
  const left = Math.floor((BADGE_SIZE - width) / 2)
  const top = Math.floor((BADGE_SIZE - art.length) / 2)
  const rows: string[] = Array.from({ length: BADGE_SIZE }, () => ' '.repeat(BADGE_SIZE))
  art.forEach((row, dy) => {
    // Locked pictures are a checker silhouette: the outline is there, the ink is not.
    const drawn = frame === 0 ? [...row].map((ch) => (ch === ' ' ? ' ' : ':')).join('') : frame === 5 && cutout ? [...row].map((ch) => (ch === '#' ? 'w' : ch === 'w' ? '#' : ch)).join('') : row
    rows[top + dy] = rows[top + dy]!.slice(0, left) + drawn + rows[top + dy]!.slice(left + width)
  })
  const sprite = (r: string[]): Sprite => ({ width: BADGE_SIZE, height: BADGE_SIZE, rows: r })
  return { disc: sprite(disc), frame: sprite(ring), picture: sprite(rows) }
}

/** The 1-bit medallion for the device: paper disc, frame and picture on one canvas. */
export function badgeCanvas(family: string, frame: BadgeFrame): Canvas {
  const { disc, frame: ring, picture: art } = badgeLayers(family, frame)
  const canvas = new Canvas(BADGE_SIZE, BADGE_SIZE)
  canvas.draw(disc, 0, 0)
  canvas.draw(ring, 0, 0)
  canvas.draw(art, 0, 0)
  return canvas
}

/** Whether a family id has a badge: a picture, or a species with a fish sprite. */
export const hasBadge = (family: string): boolean => {
  const species = speciesOfFamily(family)
  return species ? species in FISH_TRAITS : family in BADGE_PICTURES
}

/** Which frame a family's tier wears: a species' first catch is the plain ring and its specimen the laurel. */
export const frameForTier = (family: string, tier: number): BadgeFrame => (speciesOfFamily(family) ? (tier >= 2 ? 5 : tier >= 1 ? 1 : 0) : (Math.max(0, Math.min(5, tier)) as BadgeFrame))
