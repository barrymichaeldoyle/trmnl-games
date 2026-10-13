/**
 * A review sheet of scenes (D139, D141): one row per scene, 1-bit as the device draws it on the left and the
 * companion's painted scene on the right, each at three times the stage.
 */
import { encodePngIndexed } from '@trmnl-games/desk-crawler/art/png'
import { composeScene, STAGE_HEIGHT, STAGE_WIDTH, type BiomeArt, type Subject } from '@trmnl-games/desk-crawler/art/scene'
import { paintedScene } from '@trmnl-games/desk-crawler/art/sceneColour'
import type { OccasionArt } from '@trmnl-games/desk-crawler/art/occasions'
import type { HeroPose } from '@trmnl-games/desk-crawler/art/hero'
import type { SceneTime } from '@trmnl-games/desk-crawler/art/sceneTime'

const SCALE = 3
const GAP = 4

export function sheet(rows: ReadonlyArray<readonly [BiomeArt, HeroPose, Subject, SceneTime, OccasionArt | undefined]>): Uint8Array {
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
