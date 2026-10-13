/**
 * 1-bit 8x8 glyphs for log kinds, drawn in the same grid as the device art.
 * Each row is eight cells; '#' is ink. Shared by the companion log and the device screen.
 */
export const GLYPHS: Record<string, readonly string[]> = {
  combat: ['......##', '.....###', '....###.', '#..###..', '.####...', '..##....', '.#.##...', '#...#...'],
  loot: ['........', '.######.', '#......#', '########', '#..##..#', '#......#', '########', '........'],
  trap: ['........', '#.#.#.#.', '#.#.#.#.', '########', '#......#', '########', '........', '........'],
  rest: ['....###.', '......#.', '.....#..', '....###.', '###.....', '..#.....', '.#......', '###.....'],
  travel: ['........', '....#...', '....##..', '#######.', '#######.', '....##..', '....#...', '........'],
  death: ['.######.', '########', '#..##..#', '#..##..#', '########', '.##..##.', '.######.', '.#.##.#.'],
  revive: ['...##...', '...##...', '.######.', '.######.', '...##...', '...##...', '...##...', '...##...'],
  levelup: ['...##...', '..####..', '.######.', '########', '...##...', '...##...', '...##...', '...##...'],
  achievement: ['...##...', '..####..', '.#.##.#.', '########', '.######.', '..####..', '.##..##.', '.#....#.'],
  choice: ['..####..', '.#....#.', '......#.', '.....#..', '....#...', '....#...', '........', '....#...'],
  merchant: ['........', '.######.', '#.#..#.#', '########', '.#....#.', '.######.', '..#..#..', '.##..##.'],
  /** D110: a burglar's eye mask. */
  raid: ['........', '........', '.######.', '########', '#..##..#', '########', '.##..##.', '........'],
  /** D141: a meeting with a coworker: a steaming mug. Companion only; the device draws meetings with the system glyph. */
  meeting: ['..#..#..', '.#..#...', '........', '######..', '#....###', '#....#.#', '#....###', '.####...'],
  /** D145: lost property: a name badge. Companion only; the device draws the owner's notice with the system glyph. */
  lost_property: ['..####..', '.#....#.', '########', '#......#', '#.####.#', '#......#', '#.##...#', '########'],
  /** D112: a to-do task ticked off, and the stand-up's new tasks: a checkbox with its tick. */
  todo: ['########', '#......#', '#.....##', '#....#.#', '##..#..#', '#.##...#', '#......#', '########'],
  /** P35: a career rung reached or a feature unlocked: the ladder. */
  career: ['##....##', '########', '##....##', '##....##', '########', '##....##', '##....##', '########'],
  /** D129: the workbench materials: a paperclip (Scrap), a screwdriver (Parts) and a circuit board (Components). */
  scrap: ['..####..', '.#....#.', '.#.##.#.', '.#.#..#.', '.#.#.##.', '.#.#....', '.#.#....', '..##....'],
  parts: ['......##', '.....###', '....###.', '...###..', '..###...', '.###....', '###.....', '##......'],
  components: ['########', '#.#..#.#', '#..##..#', '#.####.#', '#.####.#', '#..##..#', '#.#..#.#', '########'],
  /** D112: an open to-do task in the companion: the empty checkbox. */
  todoOpen: ['########', '#......#', '#......#', '#......#', '#......#', '#......#', '#......#', '########'],
  system: ['..####..', '.#....#.', '#..##..#', '#.#..#.#', '#.#..#.#', '#..##..#', '.#....#.', '..####..'],
}

export const glyphRows = (kind: string): readonly string[] => GLYPHS[kind] ?? GLYPHS.system!

/** A standalone crisp-edged SVG for one glyph at `size` px. */
export function glyphSvg(kind: string, size: number): string {
  const rects = glyphRows(kind)
    .flatMap((row, y) => [...row].map((cell, x) => (cell === '#' ? `<rect x="${x}" y="${y}" width="1" height="1"/>` : '')))
    .join('')
  return `<svg xmlns="http://www.w3.org/2000/svg" width="${size}" height="${size}" viewBox="0 0 8 8" shape-rendering="crispEdges" fill="black">${rects}</svg>`
}
