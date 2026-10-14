/**
 * Draws Idle Angler scenes for review: `pnpm tsx tools/art/idleAnglerScenes.ts <out.png> [scale] [width]`. One row per
 * water, columns across poses, bands and weather; `width` composes every cell on a stage of that width (D125).
 */
import { writeFileSync } from 'node:fs'
import { Canvas } from '@trmnl-games/engine/art/canvas'
import { encodePng1Bit } from '@trmnl-games/engine/art/png'
import { clampStageWidth, composeScene, STAGE_HEIGHT, STAGE_WIDTH, type SceneKey } from '@trmnl-games/idle-angler/art/scene'

const out = process.argv[2] ?? 'scenes.png'
const scale = Number(process.argv[3] ?? 2)
const width = process.argv[4] ? clampStageWidth(Number(process.argv[4])) : STAGE_WIDTH
const cells: SceneKey[][] = [
  [{ water: 'millpond', band: 'day', weather: 'clear', pose: 'waiting', fish: null }, { water: 'millpond', band: 'dawn', weather: 'clear', pose: 'holding', fish: 'golden_carp' }, { water: 'millpond', band: 'night', weather: 'fog', pose: 'reeling', fish: null }],
  [{ water: 'river_bend', band: 'dusk', weather: 'rain', pose: 'holding', fish: 'salmon' }, { water: 'river_bend', band: 'day', weather: 'overcast', pose: 'casting', fish: null }, { water: 'river_bend', band: 'night', weather: 'clear', pose: 'paused', fish: null }],
  [{ water: 'harbour_pier', band: 'day', weather: 'wind', pose: 'waiting', fish: null }, { water: 'harbour_pier', band: 'night', weather: 'overcast', pose: 'holding', fish: 'thornback_ray' }, { water: 'harbour_pier', band: 'dawn', weather: 'fog', pose: 'holding', fish: 'mackerel' }],
]
const pad = 4
const sheet = new Canvas(cells[0]!.length * (width + pad) + pad, cells.length * (STAGE_HEIGHT + pad) + pad)
cells.forEach((row, r) =>
  row.forEach((key, i) => {
    const scene = composeScene(key, new Canvas(width, STAGE_HEIGHT))
    const left = pad + i * (width + pad)
    const top = pad + r * (STAGE_HEIGHT + pad)
    for (let y = 0; y < STAGE_HEIGHT; y += 1) for (let x = 0; x < width; x += 1) sheet.set(left + x, top + y, scene.ink[y * width + x] === 1)
    sheet.rect(left - 1, top - 1, width + 2, 1, '#')
    sheet.rect(left - 1, top + STAGE_HEIGHT, width + 2, 1, '#')
  }),
)
const { width: w, height: h, ink } = sheet.scaled(scale)
writeFileSync(out, encodePng1Bit(w, h, ink))
console.log(`wrote ${out} (${w}x${h})`)
