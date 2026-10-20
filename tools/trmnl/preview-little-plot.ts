/**
 * Little Plot layout previews (little-plot.md "Device", G3): every device state through the real payload builder and
 * templates, in the pinned framework shell, for OG, X and BWRY in both orientations. `--inline-art` draws scenes and
 * codes locally. Files are written as `.previews/lp-<state>--<device>[-portrait]--<layout>.html` for `pnpm sweep:trmnl`.
 *   pnpm preview:little-plot
 */
import { mkdirSync, writeFileSync } from 'node:fs'
import { Liquid } from 'liquidjs'
import { buildPayload } from '@trmnl-games/little-plot/lib/payload'
import { flowerQrBase, renderLittlePlotArt } from '@trmnl-games/little-plot/art/route'
import { screenMarkup } from '@trmnl-games/little-plot/templates/screen'
import { previewScenarios } from '@trmnl-games/little-plot/templates/previewScenarios'
import { isPreviewTheme, PREVIEW_DEVICES, PREVIEW_LAYOUTS, previewDocument, type PreviewDevice, type PreviewLayout, type PreviewTheme } from '@trmnl-games/desk-crawler/templates/preview'

const LOCAL = 'https://local-art.invalid'
const inline = process.argv.includes('--inline-art')
const cache = new Map<string, string>()
const withArt = (html: string) =>
  inline
    ? html.replace(/https:\/\/local-art\.invalid(\/art\/lp\/[^"'\s)]+\.png)/g, (_m, path: string) => {
        let uri = cache.get(path)
        if (uri === undefined) {
          const art = renderLittlePlotArt(path, 'https://trmnlgames.com')
          uri = art ? `data:image/png;base64,${Buffer.from(art.png).toString('base64')}` : `${LOCAL}${path}`
          cache.set(path, uri)
        }
        return uri
      })
    : html
const liquid = new Liquid({ timezoneOffset: 0 })
mkdirSync('.previews', { recursive: true })
let written = 0
const filter = process.argv.includes('--filter') ? process.argv[process.argv.indexOf('--filter') + 1] : null
const themeArg = process.argv.includes('--theme') ? process.argv[process.argv.indexOf('--theme') + 1] : undefined
const theme: PreviewTheme | undefined = isPreviewTheme(themeArg) ? themeArg : undefined
for (const [name, input] of Object.entries(previewScenarios(LOCAL))) {
  if (filter && !name.includes(filter)) continue
  const payload = buildPayload(input)
  for (const layout of Object.keys(PREVIEW_LAYOUTS) as PreviewLayout[]) {
    // The weekly flower code sits in the title bar on every growing screen; `--no-flower` renders without one.
    const flowerCode = !process.argv.includes('--no-flower') && (payload.status === 'growing' || payload.status === 'paused') ? '482 917' : null
    const flowerQr = flowerCode ? flowerQrBase(flowerCode) : null
    const inner = withArt(await liquid.parseAndRender(screenMarkup[layout], { ...payload, flower_code: flowerCode, flower_qr_base: flowerQr ? `${LOCAL}${flowerQr}` : '', utc_offset: 3600 }))
    for (const device of Object.keys(PREVIEW_DEVICES) as PreviewDevice[]) {
      for (const portrait of [false, true]) {
        const file = `.previews/${theme ? `${theme}.` : ''}lp-${name}--${device}${portrait ? '-portrait' : ''}--${layout}.html`
        writeFileSync(file, previewDocument(inner, device, layout, `Little Plot · ${name} · ${device}${portrait ? ' portrait' : ''} · ${PREVIEW_LAYOUTS[layout].label}`, { portrait, theme }))
        written += 1
      }
    }
  }
}
console.log(`wrote ${written} Little Plot previews to .previews/`)
