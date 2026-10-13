/**
 * Render every occasion's dressing for review (D139): pnpm tsx tools/art/occasions.ts <outDir> [occasion ...]
 * One sheet per occasion, 1-bit as the device draws it on the left and the companion's painted scene on the right.
 */
import { mkdirSync, writeFileSync } from 'node:fs'
import { encodePngIndexed } from '@trmnl-games/desk-crawler/art/png'
import { composeScene, STAGE_HEIGHT, STAGE_WIDTH, type BiomeArt, type Subject } from '@trmnl-games/desk-crawler/art/scene'
import { paintedScene } from '@trmnl-games/desk-crawler/art/sceneColour'
import { OCCASION_ARTS, type OccasionArt } from '@trmnl-games/desk-crawler/art/occasions'
import type { HeroPose } from '@trmnl-games/desk-crawler/art/hero'
import type { SceneTime } from '@trmnl-games/desk-crawler/art/sceneTime'

const SCALE = 3
const GAP = 4
const out = process.argv[2] ?? '.previews/occasions'
const only = process.argv.slice(3).filter((arg) => arg !== '--contact')
const contact = process.argv.includes('--contact')
mkdirSync(out, { recursive: true })

const shots: Array<[BiomeArt, HeroPose, Subject, SceneTime]> = [
  ['office_cubicles', 'fight', { kind: 'monster', id: 'paper_imp', elite: false }, 'day'],
  ['office_cubicles', 'idle', { kind: 'none' }, 'night'],
  ['server_room', 'rogue_fight', { kind: 'monster', id: 'cable_serpent', elite: false }, 'day'],
  ['cafeteria_depths', 'rest', { kind: 'prop', id: 'campfire' }, 'day'],
  ['archive', 'fight', { kind: 'monster', id: 'auditor', elite: false }, 'day'],
  ['archive', 'rogue_idle', { kind: 'monster', id: 'box_file_beetle', elite: true }, 'day'],
  ['parking_garage', 'sleep', { kind: 'prop', id: 'full_bag' }, 'day'],
  ['parking_garage', 'knocked_out', { kind: 'monster', id: 'ghost_car', elite: false }, 'night'],
]

const CONTACT: typeof shots = [
  ['office_cubicles', 'fight', { kind: 'monster', id: 'stapler_mimic', elite: false }, 'night'],
  ['parking_garage', 'rogue_idle', { kind: 'none' }, 'day'],
]

function sheet(rows: ReadonlyArray<readonly [BiomeArt, HeroPose, Subject, SceneTime, OccasionArt | undefined]>): Uint8Array {
  const cellW = STAGE_WIDTH * SCALE
  const cellH = STAGE_HEIGHT * SCALE
  const width = cellW * 2 + GAP * 3
  const height = rows.length * (cellH + GAP) + GAP
  const colours = new Map<string, number>([['#d0d0d0', 0], ['#000000', 1], ['#ffffff', 2]])
  const index = new Uint8Array(width * height)
  const put = (x: number, y: number, colour: string) => {
    if (!colours.has(colour)) colours.set(colour, colours.size)
    index[y * width + x] = colours.get(colour)!
  }
  rows.forEach(([biome, pose, subject, time, occasion], row) => {
    const top = GAP + row * (cellH + GAP)
    const mono = composeScene(biome, pose, subject, time, undefined, occasion)
    const painted = paintedScene(biome, pose, subject, time, occasion)
    for (let y = 0; y < cellH; y += 1)
      for (let x = 0; x < cellW; x += 1) {
        const sx = Math.floor(x / SCALE)
        const sy = Math.floor(y / SCALE)
        put(GAP + x, top + y, mono.ink[sy * STAGE_WIDTH + sx] ? '#000000' : '#ffffff')
        put(GAP * 2 + cellW + x, top + y, painted[sy]![sx] ?? '#f4efe2')
      }
  })
  const palette = [...colours.keys()].map((hex) => [1, 3, 5].map((i) => parseInt(hex.slice(i, i + 2), 16)) as [number, number, number])
  return encodePngIndexed(width, height, index, palette)
}

if (contact) {
  // Six occasions per sheet, two scenes each, for a quick look at the whole calendar.
  const ids = [...OCCASION_ARTS]
  for (let page = 0; page * 6 < ids.length; page += 1) {
    const rows = ids.slice(page * 6, page * 6 + 6).flatMap((id) => CONTACT.map(([b, p, sub, t]) => [b, p, sub, t, id] as const))
    writeFileSync(`${out}/contact-${page + 1}.png`, sheet(rows))
  }
} else {
  const each = (occasion: OccasionArt | undefined) => sheet(shots.map(([b, p, sub, t]) => [b, p, sub, t, occasion] as const))
  for (const occasion of only.length > 0 ? (only as OccasionArt[]) : [...OCCASION_ARTS]) writeFileSync(`${out}/${occasion}.png`, each(occasion))
  if (only.length === 0) writeFileSync(`${out}/plain.png`, each(undefined))
}
