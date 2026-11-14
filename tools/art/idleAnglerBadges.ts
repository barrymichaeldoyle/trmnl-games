/**
 * Draws the Idle Angler achievement badges (P48) onto one sheet for review: every family, a few species, each frame in
 * the companion's colours, then tiers 1 and 5 as the device's 1-bit art.
 * `pnpm tsx tools/art/idleAnglerBadges.ts <out.png> [scale] [background]`, background a hex colour (the page's light
 * ground by default; '#0c0a1c' for the dark one).
 */
import { writeFileSync } from 'node:fs'
import { inked } from '@trmnl-games/engine/art/canvas'
import { encodePngIndexed } from '@trmnl-games/engine/art/png'
import { ACHIEVEMENTS } from '@trmnl-games/idle-angler/content/achievements'
import { BADGE_FRAMES, BADGE_PICTURES, BADGE_SIZE, badgeCanvas, speciesOfFamily } from '@trmnl-games/idle-angler/art/badges'
import { badgeColourLayers } from '@trmnl-games/idle-angler/art/badgeColour'
import { INK } from '@trmnl-games/idle-angler/art/tones'

const out = process.argv[2] ?? 'badge-sheet.png'
const scale = Number(process.argv[3] ?? 2)
const ground = process.argv[4] ?? '#f7f5ff'
const families = [...Object.keys(BADGE_PICTURES), 'species_perch', 'species_pike', 'species_golden_carp', 'species_thornback_ray']
const step = BADGE_SIZE + 6
const width = step * 9 * scale
const height = step * families.length * scale

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

families.forEach((family, row) => {
  const top = row * step + 3
  // A species wears only the locked ring, the first catch's ring and the specimen's top frame.
  const tiers = speciesOfFamily(family) ? [0, 1, null, null, null, 2] : BADGE_FRAMES
  tiers.forEach((tier, column) => {
    if (tier === null) return
    const left = column * step + 3
    for (const { sprite, tones } of badgeColourLayers(family, tier)) {
      sprite.rows.forEach((cells, y) => [...cells].forEach((ch, x) => {
        const black = inked(ch, x, y)
        if (black === null) return
        const hex = ch === '#' ? (tones.ink ?? INK) : ch === 'w' ? tones.paper : tones.shade ? tones.shade[black ? 0 : 1] : black ? tones.ink : tones.paper
        if (hex) dot(left + x, top + y, hex)
      }))
    }
  })
  ;([1, 5] as const).forEach((frame, i) => {
    const left = (7 + i) * step + 3
    const canvas = badgeCanvas(family, frame)
    for (let y = -2; y < BADGE_SIZE + 2; y += 1) for (let x = -2; x < BADGE_SIZE + 2; x += 1) dot(left + x, top + y, '#ffffff')
    for (let y = 0; y < BADGE_SIZE; y += 1) for (let x = 0; x < BADGE_SIZE; x += 1) if (canvas.ink[y * BADGE_SIZE + x]) dot(left + x, top + y, '#000000')
  })
})

writeFileSync(out, encodePngIndexed(width, height, image, palette))
const names = families.map((family) => ACHIEVEMENTS.find((a) => a.family === family)?.familyName ?? family)
console.log(`wrote ${out} (${width}x${height}); rows: ${names.join(', ')}`)
