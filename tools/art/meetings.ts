/**
 * Render every meeting scene for review (D141): pnpm tsx tools/art/meetings.ts <outDir>
 * One sheet per meeting prop with both classes as the coworker, on an ordinary day and on a hat-wearing occasion,
 * 1-bit as the device draws it on the left and the companion's painted scene on the right.
 */
import { mkdirSync, writeFileSync } from 'node:fs'
import { MEETING_PROPS } from '@trmnl-games/desk-crawler/art/props'
import type { BiomeArt } from '@trmnl-games/desk-crawler/art/scene'
import { sheet } from './reviewSheet'

const out = process.argv[2] ?? '.previews/meetings'
mkdirSync(out, { recursive: true })
const floors: readonly BiomeArt[] = ['office_cubicles', 'server_room', 'cafeteria_depths', 'archive', 'parking_garage']

Object.entries(MEETING_PROPS).forEach(([kind, prop], i) => {
  const floor = floors[i % floors.length]!
  writeFileSync(
    `${out}/${kind}.png`,
    sheet([
      [floor, 'idle', { kind: 'coworker', heroClass: 'warrior', prop }, 'day', undefined],
      [floor, 'rogue_idle', { kind: 'coworker', heroClass: 'rogue', prop }, 'night', undefined],
      ['office_cubicles', 'idle', { kind: 'coworker', heroClass: 'rogue', prop }, 'day', 'christmas'],
      ['office_cubicles', 'rogue_idle', { kind: 'coworker', heroClass: 'warrior', prop }, 'night', 'halloween'],
    ]),
  )
})
