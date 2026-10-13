/**
 * Render the lost-property scenes for review (D145): pnpm tsx tools/art/lostProperty.ts <outDir>
 * The finder's spare coming out of the box, and the owner's notice with the finder beside it, on each floor that can
 * hold a spare, by day and night and on a hat-wearing occasion; 1-bit as the device draws it on the left and the
 * companion's painted scene on the right.
 */
import { mkdirSync, writeFileSync } from 'node:fs'
import { sheet } from './reviewSheet'

const out = process.argv[2] ?? '.previews/lost-property'
mkdirSync(out, { recursive: true })
writeFileSync(
  `${out}/found.png`,
  sheet([
    ['server_room', 'idle', { kind: 'prop', id: 'lost_property' }, 'day', undefined],
    ['cafeteria_depths', 'rogue_idle', { kind: 'prop', id: 'lost_property' }, 'night', undefined],
    ['archive', 'idle', { kind: 'prop', id: 'lost_property' }, 'day', 'christmas'],
  ]),
)
writeFileSync(
  `${out}/told.png`,
  sheet([
    ['office_cubicles', 'idle', { kind: 'coworker', heroClass: 'rogue', prop: 'lost_property' }, 'day', undefined],
    ['parking_garage', 'rogue_idle', { kind: 'coworker', heroClass: 'warrior', prop: 'lost_property' }, 'night', undefined],
    ['office_cubicles', 'idle', { kind: 'coworker', heroClass: 'warrior', prop: 'lost_property' }, 'day', 'halloween'],
  ]),
)
