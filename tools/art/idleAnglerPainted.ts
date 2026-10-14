/** Draws the companion's painted Idle Angler art for review: `pnpm tsx tools/art/idleAnglerPainted.ts <out.png>`. Nine scenes on their bands, every fish at both sizes, then the flies. */
import { writeFileSync } from 'node:fs'
import { encodePngIndexed } from '@trmnl-games/engine/art/png'
import { paintedScene, sceneBands } from '@trmnl-games/idle-angler/art/sceneColour'
import { STAGE_HEIGHT, STAGE_WIDTH, type SceneKey } from '@trmnl-games/idle-angler/art/scene'
import { fishSprite, FISH_LARGE, FISH_SMALL } from '@trmnl-games/idle-angler/art/fish'
import { fishTones, flyTones, type Tones } from '@trmnl-games/idle-angler/art/tones'
import { contentV2 } from '@trmnl-games/idle-angler/content'
import { FLIES } from '@trmnl-games/idle-angler/content/flies'
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
  // Content v2 (D162): the new waters and the seasons.
  { water: 'heron_lake', band: 'dawn', weather: 'clear', season: 'summer', pose: 'waiting', fish: null },
  { water: 'heron_lake', band: 'night', weather: 'overcast', season: 'autumn', pose: 'holding', fish: 'wels_catfish' },
  { water: 'deep_sea', band: 'day', weather: 'wind', season: 'winter', pose: 'waiting', fish: null },
  { water: 'deep_sea', band: 'dusk', weather: 'clear', season: 'summer', pose: 'holding', fish: 'blue_shark' },
  { water: 'frozen_tarn', band: 'dawn', weather: 'clear', season: 'winter', pose: 'waiting', fish: null },
  { water: 'frozen_tarn', band: 'night', weather: 'fog', season: 'winter', pose: 'holding', fish: 'golden_char' },
  { water: 'millpond', band: 'day', weather: 'clear', season: 'spring', pose: 'waiting', fish: null },
  { water: 'river_bend', band: 'dusk', weather: 'overcast', season: 'autumn', pose: 'casting', fish: null },
]
const pad = 4
const W = STAGE_WIDTH + pad * 2
const H = STAGE_HEIGHT + pad * 2
// Content v2 has 58 species, more colours than one 256-colour palette holds, so the fish go on a sheet of their own.
const fishCols = 6, fishCellW = FISH_LARGE.width + FISH_SMALL.width + 6, fishCellH = FISH_LARGE.height + 4

/** One paletted sheet: a canvas, a colour index and the encoder, scaled up for review. */
function sheet(width: number, height: number) {
  const colours = new Map<string, number>([['#15122b', 0]])
  const index = new Uint8Array(width * height)
  const put = (x: number, y: number, hex: string) => {
    if (x < 0 || y < 0 || x >= width || y >= height) return
    if (!colours.has(hex)) colours.set(hex, colours.size)
    index[y * width + x] = colours.get(hex)!
  }
  const paintSprite = (s: { rows: readonly string[] }, tones: Tones, left: number, top: number) => s.rows.forEach((row, y) => [...row].forEach((ch, x) => {
    const black = inked(ch, x, y)
    if (black === null) return
    const c = ch === '#' ? (tones.ink ?? '#1b1530') : ch === 'w' ? tones.paper : tones.shade ? tones.shade[black ? 0 : 1] : black ? tones.ink : tones.paper
    if (c) put(left + x, top + y, c)
  }))
  const write = (path: string) => {
    if (colours.size > 256) throw new Error(`${path}: ${colours.size} colours do not fit one palette`)
    const out = new Uint8Array(width * scale * height * scale)
    for (let y = 0; y < height * scale; y += 1) for (let x = 0; x < width * scale; x += 1) out[y * width * scale + x] = index[Math.floor(y / scale) * width + Math.floor(x / scale)]!
    const palette = [...colours.keys()].map((hex) => [1, 3, 5].map((i) => parseInt(hex.slice(i, i + 2), 16)) as [number, number, number])
    writeFileSync(path, encodePngIndexed(width * scale, height * scale, out, palette))
    console.log('wrote', path, width * scale, height * scale, colours.size, 'colours')
  }
  return { put, paintSprite, write }
}

// Scenes, then the flies.
const scenes = sheet(Math.max(W, FLIES.length * 11), H * cells.length + 16)
cells.forEach((key, i) => {
  const top = i * H
  const bands = sceneBands(key)
  for (let y = 0; y < H; y += 1) for (let x = 0; x < W; x += 1) scenes.put(x, top + y, y - pad < 21 ? bands.sky : bands.water)
  const grid = paintedScene(key)
  grid.forEach((row, y) => row.forEach((c, x) => { if (c) scenes.put(pad + x, top + pad + y, c) }))
})
FLIES.forEach((f, i) => scenes.paintSprite(f.art, flyTones(f.id), i * 11 + 2, H * cells.length + 4))
scenes.write(process.argv[2]!)

// Every fish, large and small, six to a row.
const fishRows = Math.ceil(contentV2.species.length / fishCols)
const fish = sheet(fishCols * fishCellW, fishRows * fishCellH + 4)
contentV2.species.forEach((s, i) => {
  const x = (i % fishCols) * fishCellW + 2
  const y = 2 + Math.floor(i / fishCols) * fishCellH
  fish.paintSprite(fishSprite(s.id, FISH_LARGE.width, FISH_LARGE.height), fishTones(s.id), x, y)
  fish.paintSprite(fishSprite(s.id, FISH_SMALL.width, FISH_SMALL.height), fishTones(s.id), x + FISH_LARGE.width + 3, y + 2)
})
fish.write(process.argv[2]!.replace(/\.png$/, '-fish.png'))
