/**
 * Draws Desk Crawler's achievement badges (P49) for review: one strip per family (its first tier and its last in the
 * companion's colours, then the last as the device's 1-bit art), plus the locked "?", into a directory with an index
 * listing the families in catalog order.
 * `pnpm tsx tools/art/deskCrawlerBadges.ts <outDir> [scale] [background]`, background a hex colour (the page's dark
 * ground by default).
 */
import { mkdirSync, writeFileSync } from 'node:fs'
import { inked } from '@trmnl-games/engine/art/canvas'
import { encodePngIndexed } from '@trmnl-games/engine/art/png'
import { BADGE_TONES } from '@trmnl-games/engine/art/badge'
import { ACHIEVEMENTS, ACHIEVEMENT_FAMILIES } from '@trmnl-games/desk-crawler/content/achievements'
import { BADGE_SIZE, badgeCanvas, badgeColourLayers, frameForTier, type BadgeFrame } from '@trmnl-games/desk-crawler/art/badges'

const out = process.argv[2] ?? 'dc-badges'
const scale = Number(process.argv[3] ?? 2)
const ground = process.argv[4] ?? '#221d44'
mkdirSync(out, { recursive: true })
const step = BADGE_SIZE + 6

function strip(cells: ReadonlyArray<{ family: string; frame: BadgeFrame; device?: boolean }>): Uint8Array {
  const width = step * cells.length * scale
  const height = step * scale
  const palette: Array<[number, number, number]> = []
  const indexOf = new Map<string, number>()
  const colour = (hex: string) => {
    if (!indexOf.has(hex)) {
      indexOf.set(hex, palette.length)
      palette.push([parseInt(hex.slice(1, 3), 16), parseInt(hex.slice(3, 5), 16), parseInt(hex.slice(5, 7), 16)])
    }
    return indexOf.get(hex)!
  }
  const image = new Uint8Array(width * height).fill(colour(ground))
  const dot = (x: number, y: number, hex: string) => {
    for (let dy = 0; dy < scale; dy += 1) for (let dx = 0; dx < scale; dx += 1) image[(y * scale + dy) * width + x * scale + dx] = colour(hex)
  }
  cells.forEach(({ family, frame, device }, i) => {
    const left = i * step + 3
    if (device) {
      const canvas = badgeCanvas(family, frame)
      for (let y = -2; y < BADGE_SIZE + 2; y += 1) for (let x = -2; x < BADGE_SIZE + 2; x += 1) dot(left + x, 3 + y, '#ffffff')
      for (let y = 0; y < BADGE_SIZE; y += 1) for (let x = 0; x < BADGE_SIZE; x += 1) if (canvas.ink[y * BADGE_SIZE + x]) dot(left + x, 3 + y, '#000000')
      return
    }
    for (const { sprite, tones } of badgeColourLayers(family, frame)) {
      sprite.rows.forEach((cellsRow, y) => [...cellsRow].forEach((ch, x) => {
        const black = inked(ch, x, y)
        if (black === null) return
        const hex = ch === '#' ? (tones.ink ?? BADGE_TONES.ink) : ch === 'w' ? tones.paper : tones.shade ? tones.shade[black ? 0 : 1] : black ? tones.ink : tones.paper
        if (hex) dot(left + x, 3 + y, hex)
      }))
    }
  })
  return encodePngIndexed(width, height, image, palette)
}

const families = [...new Map(ACHIEVEMENTS.map((a) => [a.family, a])).values()]
const index: Array<{ family: string; name: string; tiers: number; file: string }> = []
for (const first of families) {
  const tiers = Math.max(...ACHIEVEMENTS.filter((a) => a.family === first.family).map((a) => a.tier))
  const firstFrame = frameForTier(first.family, 1)
  const cells = firstFrame === 5 ? [{ family: first.family, frame: 5 as BadgeFrame }, { family: first.family, frame: 5 as BadgeFrame, device: true }] : [{ family: first.family, frame: firstFrame }, { family: first.family, frame: 5 as BadgeFrame }, { family: first.family, frame: 5 as BadgeFrame, device: true }]
  const file = `${first.family}.png`
  writeFileSync(`${out}/${file}`, strip(cells))
  index.push({ family: first.family, name: ACHIEVEMENT_FAMILIES.find((f) => f.id === first.family)?.name ?? first.family, tiers, file })
}
writeFileSync(`${out}/locked.png`, strip([{ family: 'gold', frame: 0 }, { family: 'gold', frame: 0, device: true }]))
writeFileSync(`${out}/index.json`, JSON.stringify(index, null, 1))
console.log(`wrote ${index.length} families to ${out}`)
