/** Render sample scenes for review: pnpm tsx tools/art/scenes.ts <outDir> */
import { mkdirSync, writeFileSync } from 'node:fs'
import { encodePng1Bit } from '@trmnl-games/desk-crawler/art/png'
import { composeScene, FULL_SCALE, type Subject } from '@trmnl-games/desk-crawler/art/scene'

const out = process.argv[2] ?? 'scenes'
mkdirSync(out, { recursive: true })
const samples: Array<[string, Parameters<typeof composeScene>[0], Parameters<typeof composeScene>[1], Subject]> = [
  ['office-fight', 'office_cubicles', 'fight', { kind: 'monster', id: 'paper_imp', elite: false }],
  ['server-elite', 'server_room', 'fight', { kind: 'monster', id: 'cable_serpent', elite: true }],
  ['cafe-chest', 'cafeteria_depths', 'idle', { kind: 'prop', id: 'gold' }],
  ['office-rest', 'office_cubicles', 'rest', { kind: 'prop', id: 'campfire' }],
  ['server-ko', 'server_room', 'knocked_out', { kind: 'monster', id: 'legacy_mainframe', elite: false }],
  ['cafe-sleep', 'cafeteria_depths', 'sleep', { kind: 'prop', id: 'full_bag' }],
  ['archive-fight', 'archive', 'fight', { kind: 'monster', id: 'auditor', elite: false }],
  ['archive-beetle', 'archive', 'fight', { kind: 'monster', id: 'box_file_beetle', elite: true }],
  ['archive-lurker', 'archive', 'fight', { kind: 'monster', id: 'shelf_lurker', elite: false }],
  ['archive-phantom', 'archive', 'idle', { kind: 'monster', id: 'microfilm_phantom', elite: false }],
  ['garage-fight', 'parking_garage', 'fight', { kind: 'monster', id: 'ghost_car', elite: false }],
  ['garage-trolleys', 'parking_garage', 'fight', { kind: 'monster', id: 'trolley_swarm', elite: false }],
  ['garage-slick', 'parking_garage', 'fight', { kind: 'monster', id: 'oil_slick', elite: true }],
  ['garage-barrier', 'parking_garage', 'knocked_out', { kind: 'monster', id: 'barrier_golem', elite: false }],
]
for (const [name, biome, pose, subject] of samples) {
  const { width, height, ink } = composeScene(biome, pose, subject).scaled(FULL_SCALE)
  writeFileSync(`${out}/${name}.png`, encodePng1Bit(width, height, ink))
}
for (const time of ['day', 'night'] as const) {
  const { width, height, ink } = composeScene('office_cubicles', 'idle', { kind: 'prop', id: 'chest' }, time).scaled(FULL_SCALE)
  writeFileSync(`${out}/office-${time}.png`, encodePng1Bit(width, height, ink))
}
console.log(`wrote ${samples.length + 2} scenes to ${out}`)
