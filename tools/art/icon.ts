/** Render a game's 512x512 TRMNL plugin icon (tools/art/gameIcons.ts). pnpm tsx tools/art/icon.ts [desk-crawler|idle-angler] <out.png> */
import { writeFileSync } from 'node:fs'
import { deskCrawlerIcon, idleAnglerIcon } from './gameIcons'

const game = process.argv[2] ?? 'desk-crawler'
const out = process.argv[3] ?? 'icon.png'
const image = (game === 'idle-angler' ? idleAnglerIcon() : deskCrawlerIcon()).scaled(8)
writeFileSync(out, image.png())
console.log(`wrote ${out} ${image.width}x${image.height}`)
