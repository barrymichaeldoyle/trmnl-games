/**
 * 1-bit marks for the Little Plot screen (little-plot.md "Device"): the counters (level, coins, ripe beds, seeds, water),
 * the season and the conditions, and one glyph per story kind, in the same 8x8 grid style as the other games' HUD
 * marks. Each row is a string of cells; '#' is ink.
 */
export const LP_MARKS = {
  /** A stacked coin, as in Desk Crawler. */
  coin: ['..####..', '.#....#.', '#..##..#', '#.#..#.#', '#.#..#.#', '#..##..#', '.#....#.', '..####..'],
  /** Experience and level-ups: a five-point star. */
  star: ['...##...', '...##...', '########', '.######.', '..####..', '.######.', '.##..##.', '##....##'],
  /** A ripe plant: a flower head on a stem with two leaves. */
  ripe: ['..####..', '.#.##.#.', '..####..', '...##...', '.#.##.#.', '#..##..#', '...##...', '...##...'],
  /** A seed in the tin: a teardrop. */
  seed: ['...##...', '..#..#..', '.#....#.', '.#....#.', '#......#', '#......#', '.#....#.', '..####..'],
  /** Water: a drop. */
  water: ['...#....', '...#....', '..#.#...', '..#.#...', '.#...#..', '.#...#..', '.#...#..', '..###...'],
  /** A pennant on its pole: the current goal and goals reached, apart from the milestones' star. */
  goal: ['##......', '####....', '######..', '########', '######..', '####....', '#.......', '#.......'],
  /** The board: a trophy cup. */
  trophy: ['########', '#.####.#', '#.####.#', '.######.', '..####..', '...##...', '..####..', '.######.'],
  /** A pest: a slug, antennae up. */
  pest: ['.#...#..', '..#.#...', '..###...', '.#####..', '#######.', '########', '.######.', '........'],
  /** A gnome: a pointed hat over a beard. */
  gnome: ['...#....', '..###...', '.#####..', '.#####..', '########', '..#..#..', '.######.', '..####..'],
  /** A cross found: two leaves from one stem, a star above. */
  cross: ['#......#', '.#....#.', '..#..#..', '#..##..#', '.######.', '...##...', '...##...', '...##...'],
  /** The shed: a little house. */
  shed: ['...##...', '..####..', '.######.', '########', '#......#', '#..##..#', '#..##..#', '########'],
  /** Day: a sun with rays. */
  day: ['#..##..#', '.#....#.', '..####..', '#.####.#', '#.####.#', '..####..', '.#....#.', '#..##..#'],
  /** Dawn and dusk: half a sun on the horizon. */
  dawn: ['...##...', '#......#', '.#.##.#.', '..####..', '.######.', '########', '........', '########'],
  dusk: ['........', '.#.##.#.', '..####..', '.######.', '########', '........', '########', '........'],
  /** Night: a crescent moon and a star. */
  night: ['..###..#', '.##.....', '##......', '##....#.', '##......', '##......', '.##...#.', '..####..'],
  /** Weather. */
  clear: ['...##...', '.#....#.', '..####..', '#.####.#', '#.####.#', '..####..', '.#....#.', '...##...'],
  overcast: ['........', '...##...', '.##..##.', '#......#', '#......#', '.######.', '........', '........'],
  rain: ['...##...', '.##..##.', '#......#', '.######.', '........', '.#..#..#', '#..#..#.', '........'],
  fog: ['........', '######..', '........', '..######', '........', '######..', '........', '..######'],
  /** Frost: a snowflake. */
  frost: ['...#....', '.#.#.#..', '..###...', '#######.', '..###...', '.#.#.#..', '...#....', '........'],
  /** Seasons: a leaf for spring and autumn, the sun for summer, the flake for winter. */
  leaf: ['......#.', '....###.', '..####..', '.#####..', '.####...', '####....', '.#......', '#.......'],
  /** Story kinds. A sprout: two leaves out of the soil. */
  stage: ['........', '........', '#.....#.', '.#...#..', '..#.#...', '...#....', '...#....', '########'],
  /** Gone to seed: a dandelion clock. */
  seeded: ['..#.#...', '.#.#.#..', '#.###.#.', '.#####..', '#.###.#.', '.#.#.#..', '...#....', '...#....'],
  /** Wildlife and the weather: a bird in flight. */
  ambient: ['........', '##....##', '#.#..#.#', '...##...', '...##...', '........', '........', '........'],
  /** Something another garden sent or took: a seed with an arrow. */
  visit: ['...##...', '..#..#..', '.#....#.', '.#.##.#.', '#..##..#', '####.###', '.##..##.', '..####..'],
  /** Picked: a trug. */
  harvest: ['..####..', '.#....#.', '#......#', '########', '#.#..#.#', '#.#..#.#', '.######.', '........'],
  /** Achievements: the trophy. */
  achievement: ['########', '#.####.#', '#.####.#', '.######.', '..####..', '...##...', '..####..', '.######.'],
  /** System and service lines: a dot. */
  system: ['........', '........', '...##...', '..####..', '..####..', '...##...', '........', '........'],
} as const
export type LpMark = keyof typeof LP_MARKS

/** The story kinds with their own glyph; any other kind takes `system`. */
export const STORY_GLYPHS = ['ripe', 'stage', 'seeded', 'pest', 'gnome', 'cross', 'ambient', 'visit', 'harvest', 'achievement', 'goal', 'star', 'frost', 'water', 'shed', 'seed', 'system'] as const satisfies readonly LpMark[]

/** The glyph a story kind takes. */
export function glyphFor(kind: string, effect?: string | null): (typeof STORY_GLYPHS)[number] {
  switch (kind) {
    case 'ripe':
      return 'ripe'
    case 'stage':
      return 'stage'
    case 'seeded':
      return 'seeded'
    case 'pest':
      return effect?.startsWith('gnome') ? 'gnome' : 'pest'
    case 'deterred':
      return 'pest'
    case 'cross':
      return 'cross'
    case 'ambient':
      return 'ambient'
    case 'visit':
    case 'cutting':
      return 'visit'
    case 'harvest':
      return 'harvest'
    case 'achievement':
      return 'achievement'
    case 'goal':
      return 'goal'
    case 'level':
      return 'star'
    case 'frost':
    case 'heron':
      return 'frost'
    case 'water':
      return 'water'
    case 'shop':
      return 'shed'
    case 'sow':
      return 'seed'
    default:
      return 'system'
  }
}

const markPath = (rows: readonly string[]) =>
  rows.flatMap((row, y) => [...row.matchAll(/#+/g)].map((run) => `M${run.index} ${y}h${run[0].length}v1h-${run[0].length}z`)).join('')

/** A crisp-edged SVG of one mark at the given size, as a URL-encoded data URI. */
export function markUri(mark: LpMark, width: number, height = width, fill?: string): string {
  const rows = LP_MARKS[mark]
  const svg = `<svg xmlns='http://www.w3.org/2000/svg' width='${width}' height='${height}' viewBox='0 0 ${rows[0].length} ${rows.length}' shape-rendering='crispEdges'><path${fill ? ` fill='${fill}'` : ''} d='${markPath(rows)}'/></svg>`
  return `data:image/svg+xml,${encodeURIComponent(svg)}`
}
