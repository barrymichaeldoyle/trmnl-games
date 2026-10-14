/**
 * 1-bit marks for the Paper Lives screen (paper-lives.md "Art"): one glyph per story kind (family, work, money,
 * health, heart, paw, star, candle, ring, house, pram, book) and the counters (the four stats, money, the board, the
 * close time and the decision), in the same 8x8 grid style as the other games' marks. '#' is ink.
 */
export const PL_MARKS = {
  /** Two heads side by side. */
  family: ['.##..##.', '#..##..#', '#..##..#', '.##..##.', '........', '.##..##.', '####.###', '####.###'],
  /** A briefcase. */
  work: ['..####..', '..#..#..', '########', '#......#', '########', '#..##..#', '#......#', '########'],
  /** A stacked coin. */
  money: ['..####..', '.#....#.', '#..##..#', '#.#..#.#', '#.#..#.#', '#..##..#', '.#....#.', '..####..'],
  /** A plus, as on a first-aid box. */
  health: ['..####..', '..####..', '########', '########', '########', '########', '..####..', '..####..'],
  /** A heart. */
  heart: ['.##..##.', '########', '########', '########', '.######.', '..####..', '...##...', '........'],
  /** A paw print. */
  paw: ['.#....#.', '.#.##.#.', '...##...', '#......#', '..####..', '.######.', '.######.', '..#..#..'],
  /** A five-point star, for the remarkable. */
  star: ['...##...', '...##...', '########', '.######.', '..####..', '.######.', '.##..##.', '##....##'],
  /** A candle for a death. */
  candle: ['...#....', '..###...', '...#....', '..###...', '..###...', '..###...', '..###...', '.#####..'],
  /** A ring. */
  ring: ['..####..', '...##...', '.######.', '##....##', '#......#', '##....##', '.######.', '........'],
  /** A house. */
  house: ['...##...', '..####..', '.######.', '########', '.#....#.', '.#.##.#.', '.#.##.#.', '.######.'],
  /** A pram. */
  pram: ['.####...', '#....#..', '#.....##', '########', '.######.', '..####..', '.#....#.', '#.#..#.#'],
  /** An open book. */
  book: ['.##..##.', '#..##..#', '#..##..#', '#..##..#', '#..##..#', '#..##..#', '#.####.#', '###..###'],
  /** A quiet line: a dot. */
  none: ['........', '........', '...##...', '..####..', '..####..', '...##...', '........', '........'],

  /** Stats: health a heart outline, happiness a smile, smarts a light bulb, charm a sparkle. */
  statHealth: ['.##..##.', '#..##..#', '#......#', '#......#', '.#....#.', '..#..#..', '...##...', '........'],
  statHappy: ['..####..', '.#....#.', '#.#..#.#', '#......#', '#.#..#.#', '#..##..#', '.#....#.', '..####..'],
  statSmarts: ['..####..', '.#....#.', '#......#', '#......#', '.#....#.', '..####..', '..####..', '...##...'],
  statCharm: ['...#....', '...#....', '.#.#.#..', '..###...', '#######.', '..###...', '.#.#.#..', '...#....'],
  /** The board: a trophy. */
  trophy: ['########', '#.####.#', '#.####.#', '.######.', '..####..', '...##...', '..####..', '.######.'],
  /** The year's close: a clock. */
  clock: ['..####..', '.#....#.', '#..#...#', '#..#...#', '#..####.', '#......#', '.#....#.', '..####..'],
  /** The decision: a speech bubble with a question mark. */
  decision: ['########', '#..##..#', '#.#..#.#', '#....#.#', '#...#..#', '#......#', '####.###', '...##...'],

  /** Stat bar ticks: empty, half and full. */
  tickEmpty: ['#########', '#.......#', '#.......#', '#########'],
  tickHalf: ['#########', '#####...#', '#####...#', '#########'],
  tickFull: ['#########', '#########', '#########', '#########'],
} as const
export type PlMark = keyof typeof PL_MARKS

/** The story glyphs the content uses (`Glyph` in the core). */
export const STORY_GLYPHS = ['family', 'work', 'money', 'health', 'heart', 'paw', 'star', 'candle', 'ring', 'house', 'pram', 'book', 'none'] as const satisfies readonly PlMark[]

const markPath = (rows: readonly string[]) =>
  rows.flatMap((row, y) => [...row.matchAll(/#+/g)].map((run) => `M${run.index} ${y}h${run[0].length}v1h-${run[0].length}z`)).join('')

/** A crisp-edged SVG of one mark at the given size, as a URL-encoded data URI. */
export function markUri(mark: PlMark, width: number, height = width): string {
  const rows = PL_MARKS[mark]
  const svg = `<svg xmlns='http://www.w3.org/2000/svg' width='${width}' height='${height}' viewBox='0 0 ${rows[0].length} ${rows.length}' shape-rendering='crispEdges'><path d='${markPath(rows)}'/></svg>`
  return `data:image/svg+xml,${encodeURIComponent(svg)}`
}
