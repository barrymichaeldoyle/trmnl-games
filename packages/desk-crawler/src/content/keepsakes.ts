/** Cosmetic desk souvenirs. Order is permanent: append new entries, never reorder earned ones. */
export const DESK_KEEPSAKES = [
  { id: 'stapler', name: 'Heroic Stapler', description: 'Kept every report in one piece.', pixels: ['........', '.#####..', '.#...##.', '..#####.', '......#.', '.######.', '.######.', '........'] },
  { id: 'mug', name: 'Survivor’s Mug', description: 'Stained brown inside and still in use.', pixels: ['........', '.#####..', '.#...###', '.#...#.#', '.#...###', '.#...#..', '..###...', '........'] },
  { id: 'disk', name: 'Ancient Save Disk', description: 'Holds one spreadsheet from 1994.', pixels: ['.######.', '.#..#.#.', '.#..#.#.', '.######.', '.#....#.', '.#.##.#.', '.######.', '........'] },
  { id: 'plant', name: 'Unkillable Fern', description: 'Nobody waters it, and it keeps growing.', pixels: ['...#....', '.#.#.#..', '..###...', '.#.##.#.', '..###...', '..###...', '..#.#...', '...#....'] },
  { id: 'key', name: 'Mystery Cabinet Key', description: 'Nobody remembers which cabinet it opens.', pixels: ['..###...', '.#...#..', '.#.#.#..', '..###...', '...#....', '...###..', '...#....', '...##...'] },
  { id: 'duck', name: 'Debugging Duck', description: 'Explain the bug to it and you will spot the fix.', pixels: ['....##..', '...####.', '...#.###', '.#####..', '#######.', '#######.', '.#####..', '........'] },
  { id: 'clock', name: 'Five O’Clock Clock', description: 'Stuck at five past five.', pixels: ['..####..', '.#....#.', '#..#...#', '#..#...#', '#..###.#', '#......#', '.#....#.', '..####..'] },
  { id: 'badge', name: 'Very Important Badge', description: 'Access granted to the biscuit cupboard.', pixels: ['..#..#..', '..#..#..', '..####..', '.######.', '.#....#.', '.#.##.#.', '.#....#.', '.######.'] },
  { id: 'lamp', name: 'Late Shift Lamp', description: 'For the evenings the report runs late.', pixels: ['..####..', '.######.', '########', '...#....', '...#....', '...#....', '..####..', '.######.'] },
  { id: 'tape', name: 'Legendary Sticky Tape', description: 'Holding up three things that should be screwed down.', pixels: ['..####..', '.######.', '###..###', '###..###', '.######.', '..#####.', '......#.', '.....##.'] },
  { id: 'pager', name: 'On-Call Relic', description: 'It has not beeped since 2003.', pixels: ['........', '.######.', '.#....#.', '.#.##.#.', '.#....#.', '.######.', '..#..#..', '........'] },
  { id: 'trophy', name: 'Employee of the Quest', description: 'Your name, spelt slightly wrong.', pixels: ['.######.', '##....##', '#.#..#.#', '.######.', '..####..', '...##...', '..####..', '.######.'] },
] as const

/**
 * The keepsake code on the public sample screen and in previews; never a weekly code (D137). Entered in the companion, it
 * finds the hidden Easter Egg keepsake (D140) unless it happens to be the player's own code that week, which collects.
 */
export const SAMPLE_KEEPSAKE_CODE = '482 917'
/** The hidden keepsake for entering the sample code (D140): once per account, outside the weekly set and its counts. */
export const EASTER_EGG_KEEPSAKE = { id: 'easter_egg', name: 'Easter Egg', description: 'Hatched from a code that was never meant to work.', pixels: ['...##...', '..####..', '.######.', '.#.##.#.', '#.#..#.#', '########', '.######.', '..####..'] } as const
export const KEEPSAKE_WEEK_MS = 7 * 24 * 60 * 60 * 1000
/** Monday 00:00 UTC; the client never chooses the award period. */
const MONDAY_EPOCH = Date.UTC(1970, 0, 5)
/** Last moment a pre-D73 letter code still collects, so screens rendered before the six-digit switch keep their grace week. */
export const LETTER_CODES_UNTIL = Date.UTC(2026, 9, 19)
export const keepsakeWeek = (now: number) => Math.floor((now - MONDAY_EPOCH) / KEEPSAKE_WEEK_MS)
export const keepsakeWeekStartsAt = (week: number) => MONDAY_EPOCH + week * KEEPSAKE_WEEK_MS
/**
 * D148: weekly keepsakes open on the Monday after the public-launch reset, so the first code is an unlock of its own.
 * Before it no code is shown or accepted; the Easter Egg still hatches from the sample code.
 */
export const KEEPSAKES_OPEN_AT = Date.UTC(2026, 9, 19)
export const keepsakesOpen = (now: number) => now >= KEEPSAKES_OPEN_AT

/** A fixed-size shelf derived from one lifetime count: no growing document or history scan. */
export const keepsakeShelf = (totalCollected: number) => DESK_KEEPSAKES.map((item, index) => ({
  ...item,
  count: Math.max(0, Math.floor((totalCollected + DESK_KEEPSAKES.length - 1 - index) / DESK_KEEPSAKES.length)),
}))
