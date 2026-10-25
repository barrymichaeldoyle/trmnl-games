import { PATTERNS, patternInk } from './render'
import type { Pattern } from '../sim/types'

/**
 * 1-bit marks for the Pixel Wars screen (pixel-wars.md "Device"): the well, the desk, the bell, the shield, the board
 * and one glyph per story kind, in the same 8x8 grid style as the other games' HUD marks. Each row is a string of
 * cells; '#' is ink.
 */
export const PW_MARKS = {
  /** The well: a drop. */
  drop: ['...#....', '...#....', '..#.#...', '..#.#...', '.#...#..', '.#...#..', '.#...#..', '..###...'],
  /** A desk: a table seen from the side. */
  desk: ['........', '########', '#......#', '#.####.#', '#......#', '#......#', '#......#', '........'],
  /** The bell. */
  bell: ['...##...', '..####..', '.######.', '.######.', '.######.', '########', '...##...', '........'],
  /** The night shield: a crescent. */
  shield: ['..###..#', '.##.....', '##......', '##....#.', '##......', '##......', '.##...#.', '..####..'],
  /** Levels and XP: a star. */
  star: ['...##...', '...##...', '########', '.######.', '..####..', '.######.', '.##..##.', '##....##'],
  /** The current goal: a pennant. */
  goal: ['##......', '####....', '######..', '########', '######..', '####....', '#.......', '#.......'],
  /** The board and achievements: a trophy. */
  trophy: ['########', '#.####.#', '#.####.#', '.######.', '..####..', '...##...', '..####..', '.######.'],
  /** A desk that fell: the table on its side. */
  fell: ['#......#', '.#....#.', '..#..#..', '...##...', '...##...', '..#..#..', '.#....#.', '#......#'],
  /** A desk back home: a tick. */
  recovered: ['........', '.......#', '......##', '.....##.', '#...##..', '##.##...', '.###....', '..#.....'],
  /** Taken: a hand. */
  taken: ['..#.#...', '.##.##..', '.#####..', '.#####..', '######..', '.#####..', '..###...', '...#....'],
  /** Cells painted or taken: a brush. */
  flips: ['......##', '.....###', '....###.', '...###..', '..###...', '.###....', '####....', '##......'],
  /** Drops returned: an arrow back. */
  refund: ['........', '..#.....', '.##.....', '########', '.##....#', '..#....#', '.......#', '....####'],
  /** A rosette: last week's winners. */
  rosette: ['..####..', '.#....#.', '#..##..#', '#..##..#', '.#....#.', '..####..', '..#..#..', '.#....#.'],
  /** System and service lines: a dot. */
  system: ['........', '........', '...##...', '..####..', '..####..', '...##...', '........', '........'],
} as const
export type PwMark = keyof typeof PW_MARKS

export const STORY_GLYPHS = ['fell', 'recovered', 'taken', 'flips', 'refund', 'bell', 'goal', 'star', 'trophy', 'desk', 'system'] as const satisfies readonly PwMark[]

export function glyphFor(kind: string): (typeof STORY_GLYPHS)[number] {
  switch (kind) {
    case 'fell':
      return 'fell'
    case 'recovered':
      return 'recovered'
    case 'taken':
      return 'taken'
    case 'flips':
    case 'order':
      return 'flips'
    case 'refund':
      return 'refund'
    case 'bell':
      return 'bell'
    case 'goal':
      return 'goal'
    case 'level':
      return 'star'
    case 'achievement':
      return 'trophy'
    case 'faction':
    case 'cleared':
      return 'desk'
    default:
      return 'system'
  }
}

const markPath = (rows: readonly string[]) =>
  rows.flatMap((row, y) => [...row.matchAll(/#+/g)].map((run) => `M${run.index} ${y}h${run[0].length}v1h-${run[0].length}z`)).join('')

/** A crisp-edged SVG of one mark at the given size, as a URL-encoded data URI. */
export function markUri(mark: PwMark, width: number, height = width, fill?: string): string {
  const rows = PW_MARKS[mark]
  const svg = `<svg xmlns='http://www.w3.org/2000/svg' width='${width}' height='${height}' viewBox='0 0 ${rows[0].length} ${rows.length}' shape-rendering='crispEdges'><path${fill ? ` fill='${fill}'` : ''} d='${markPath(rows)}'/></svg>`
  return `data:image/svg+xml,${encodeURIComponent(svg)}`
}

/** A faction swatch: its pattern at full ink inside a one-pixel frame, as an SVG data URI of `cells` pixels a side (drawn at any size, crisp). */
export function swatchUri(pattern: Pattern, cells = 16, fill?: string): string {
  const runs: string[] = []
  for (let y = 0; y < cells; y += 1) {
    let start = -1
    for (let x = 0; x <= cells; x += 1) {
      const on = x < cells && (x === 0 || y === 0 || x === cells - 1 || y === cells - 1 || patternInk(pattern, 3, x, y))
      if (on && start < 0) start = x
      if (!on && start >= 0) {
        runs.push(`M${start} ${y}h${x - start}v1h-${x - start}z`)
        start = -1
      }
    }
  }
  const svg = `<svg xmlns='http://www.w3.org/2000/svg' width='${cells}' height='${cells}' viewBox='0 0 ${cells} ${cells}' shape-rendering='crispEdges'><path${fill ? ` fill='${fill}'` : ''} d='${runs.join('')}'/></svg>`
  return `data:image/svg+xml,${encodeURIComponent(svg)}`
}

export const SWATCHES: Readonly<Record<Pattern, string>> = Object.fromEntries(PATTERNS.map((p) => [p, swatchUri(p)])) as Record<Pattern, string>
