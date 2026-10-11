/** Draws the companion's painted Slow Cast art for review: `pnpm tsx tools/art/slowcastPainted.ts <out.png>`. Nine scenes on their bands, every fish at both sizes, then the flies. */
import { writeFileSync } from 'node:fs'
import { encodePngIndexed } from '@trmnl-games/engine/art/png'
import { paintedScene, sceneBands } from '@trmnl-games/slow-cast/art/sceneColour'
import { STAGE_HEIGHT, STAGE_WIDTH, type SceneKey } from '@trmnl-games/slow-cast/art/scene'
import { fishSprite, FISH_LARGE, FISH_SMALL } from '@trmnl-games/slow-cast/art/fish'
import { fishTones, flyTones, type Tones } from '@trmnl-games/slow-cast/art/tones'
import { contentV1 } from '@trmnl-games/slow-cast/content'
import { FLIES } from '@trmnl-games/slow-cast/content/flies'
import { inked } from '@trmnl-games/engine/art/canvas'

const scale = 3
const cells: SceneKey[] = [
  { water: 'millpond', band: 'day', weather: 'clear', pose: 'waiting', fish: null },
  { water: 'millpond', band: 'dawn', weather: 'clear', pose: 'holding', fish: 'golden_carp', fly: 'red_tag' },
  { water: 'millpond', band: 'night', weather: 'fog', pose: 'reeling', fish: null },
  { water: 'river_bend', band: 'dusk', weather: 'rain', pose: 'holding', fish: 'salmon' },
  { water: 'river_bend', band: 'day', weather: 'overcast', pose: 'casting', fish: null },
  { water: 'river_bend', band: 'night', weather: 'clear', pose: 'paused', fish: null },
  { water: 'harbour_pier', band: 'day', weather: 'wind', pose: 'waiting', fish: null },
  { water: 'harbour_pier', band: 'night', weather: 'overcast', pose: 'holding', fish: 'thornback_ray' },
  { water: 'harbour_pier', band: 'dawn', weather: 'fog', pose: 'holding', fish: 'mackerel' },
]
const pad = 4
const W = STAGE_WIDTH + pad * 2
const H = STAGE_HEIGHT + pad * 2
// Fish strip below: 30 species large + small, 6 per row; flies after.
const fishCols = 6, fishCellW = FISH_LARGE.width + FISH_SMALL.width + 6, fishCellH = FISH_LARGE.height + 4
const fishRows = Math.ceil(contentV1.species.length / fishCols)
const flyRow = FLIES.length * 11
const width = Math.max(W, fishCols * fishCellW, flyRow)
const height = H * cells.length + fishRows * fishCellH + 12 + 4
const colours = new Map<string, number>([['#15122b', 0]])
const index = new Uint8Array(width * height)
const put = (x: number, y: number, hex: string) => {
  if (x < 0 || y < 0 || x >= width || y >= height) return
  if (!colours.has(hex)) colours.set(hex, colours.size)
  index[y * width + x] = colours.get(hex)!
}
cells.forEach((key, i) => {
  const top = i * H
  const bands = sceneBands(key)
  for (let y = 0; y < H; y += 1) for (let x = 0; x < W; x += 1) put(x, top + y, y - pad < 21 ? bands.sky : bands.water)
  const grid = paintedScene(key)
  grid.forEach((row, y) => row.forEach((c, x) => { if (c) put(pad + x, top + pad + y, c) }))
})
const paintSprite = (s: { rows: readonly string[] }, tones: Tones, left: number, top: number) => s.rows.forEach((row, y) => [...row].forEach((ch, x) => {
  const black = inked(ch, x, y)
  if (black === null) return
  const c = ch === '#' ? (tones.ink ?? '#1b1530') : ch === 'w' ? tones.paper : tones.shade ? tones.shade[black ? 0 : 1] : black ? tones.ink : tones.paper
  if (c) put(left + x, top + y, c)
}))
const fishTop = H * cells.length + 4
contentV1.species.forEach((s, i) => {
  const x = (i % fishCols) * fishCellW + 2
  const y = fishTop + Math.floor(i / fishCols) * fishCellH
  paintSprite(fishSprite(s.id, FISH_LARGE.width, FISH_LARGE.height), fishTones(s.id), x, y)
  paintSprite(fishSprite(s.id, FISH_SMALL.width, FISH_SMALL.height), fishTones(s.id), x + FISH_LARGE.width + 3, y + 2)
})
FLIES.forEach((f, i) => paintSprite(f.art, flyTones(f.id), i * 11 + 2, fishTop + fishRows * fishCellH + 4))
// scale up
const out = new Uint8Array(width * scale * height * scale)
for (let y = 0; y < height * scale; y += 1) for (let x = 0; x < width * scale; x += 1) out[y * width * scale + x] = index[Math.floor(y / scale) * width + Math.floor(x / scale)]!
const palette = [...colours.keys()].map((hex) => [1, 3, 5].map((i) => parseInt(hex.slice(i, i + 2), 16)) as [number, number, number])
writeFileSync(process.argv[2]!, encodePngIndexed(width * scale, height * scale, out, palette))
console.log('wrote', process.argv[2], width * scale, height * scale, colours.size, 'colours')
