/**
 * Idle Angler's six waters for its game page (D210), as Desk Crawler's floors are drawn for its own: the companion's
 * painted scene over its stepped sky and water bands, one 152x40 PNG per water at 1x, scaled up pixelated by the page.
 * `pnpm tsx tools/art/idleAnglerWaters.ts` writes them to apps/web/public/games/idle-angler/waters/.
 */
import { mkdirSync, writeFileSync } from 'node:fs'
import { encodePngIndexed } from '@trmnl-games/engine/art/png'
import { paintedScene, sceneSteps } from '@trmnl-games/idle-angler/art/sceneColour'
import { STAGE_HEIGHT, STAGE_WIDTH, type SceneKey } from '@trmnl-games/idle-angler/art/scene'

const OUT = 'apps/web/public/games/idle-angler/waters'

/** Each water at a moment that sells it, holding a fish it is known for. */
export const WATER_SCENES: readonly SceneKey[] = [
  { water: 'millpond', band: 'dawn', weather: 'clear', season: 'spring', pose: 'holding', fish: 'perch' },
  { water: 'river_bend', band: 'dusk', weather: 'overcast', season: 'autumn', pose: 'holding', fish: 'barbel' },
  { water: 'harbour_pier', band: 'day', weather: 'wind', season: 'summer', pose: 'holding', fish: 'mackerel' },
  { water: 'heron_lake', band: 'night', weather: 'clear', season: 'summer', pose: 'holding', fish: 'wels_catfish' },
  { water: 'deep_sea', band: 'day', weather: 'clear', season: 'summer', pose: 'holding', fish: 'blue_shark' },
  { water: 'frozen_tarn', band: 'dawn', weather: 'clear', season: 'winter', pose: 'holding', fish: 'golden_char' },
]

mkdirSync(OUT, { recursive: true })
for (const key of WATER_SCENES) {
  const steps = sceneSteps(key)
  const rowColour = [...steps.sky, ...steps.water].flatMap((step) => Array<string>(step.rows).fill(step.colour))
  const grid = paintedScene(key)
  const colours = new Map<string, number>()
  const index = new Uint8Array(STAGE_WIDTH * STAGE_HEIGHT)
  grid.forEach((row, y) =>
    row.forEach((painted, x) => {
      const hex = painted ?? rowColour[y]!
      if (!colours.has(hex)) colours.set(hex, colours.size)
      index[y * STAGE_WIDTH + x] = colours.get(hex)!
    }),
  )
  const palette = [...colours.keys()].map((hex) => [1, 3, 5].map((i) => parseInt(hex.slice(i, i + 2), 16)) as [number, number, number])
  writeFileSync(`${OUT}/${key.water}.png`, encodePngIndexed(STAGE_WIDTH, STAGE_HEIGHT, index, palette))
  console.log('wrote', `${OUT}/${key.water}.png`, colours.size, 'colours')
}
