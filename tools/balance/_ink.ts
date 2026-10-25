import { previewScenarios } from '@trmnl-games/pixel-wars/templates/previewScenarios'
import { fitWindow, renderWindow } from '@trmnl-games/pixel-wars/art/render'
import { contentV1 } from '@trmnl-games/pixel-wars/content'
import { shares, cellFaction } from '@trmnl-games/pixel-wars/sim'
const s = previewScenarios('x').playing!
const src = s.map!.source
const w = fitWindow(src, 760, 290, s.desk!.cell!)
const c = renderWindow(src, w, (f) => contentV1.factions[f - 1]!.pattern, s.desk!.cell!)
let on = 0
for (const b of c.ink) on += b
console.log('window', w, 'size', c.width, c.height, 'black', on, 'of', c.ink.length)
const held = Array.from(src.cells).filter((b) => cellFaction(b) !== 0).length
console.log('held cells', held, 'of', src.cells.length, shares({ ...src, painters: new Uint16Array(0), seats: [] } as never, contentV1).map((r) => r.percent))
