/**
 * Pixel Wars layout previews (pixel-wars.md "Device", W3): every device state through the real payload builder and
 * templates, in the pinned framework shell, for OG, X and BWRY in both orientations. `--inline-art` draws the map
 * windows and codes locally from the scenarios' maps. Files are written as `.previews/pw-<state>--<device>[-portrait]--<layout>.html`
 * for `pnpm sweep:trmnl`.
 *   pnpm preview:pixel-wars [--filter <state>] [--theme dark]
 */
import { mkdirSync, writeFileSync } from 'node:fs'
import { Liquid } from 'liquidjs'
import { buildPayload } from '@trmnl-games/pixel-wars/lib/payload'
import { parseArtPath, renderMapPng, renderQrPng } from '@trmnl-games/pixel-wars/art/route'
import { contentV1 } from '@trmnl-games/pixel-wars/content'
import { screenMarkup } from '@trmnl-games/pixel-wars/templates/screen'
import { previewScenarios } from '@trmnl-games/pixel-wars/templates/previewScenarios'
import { isPreviewTheme, PREVIEW_DEVICES, PREVIEW_LAYOUTS, previewDocument, type PreviewDevice, type PreviewLayout, type PreviewTheme } from '@trmnl-games/desk-crawler/templates/preview'

const LOCAL = 'https://local-art.invalid'
const inline = process.argv.includes('--inline-art')
const scenarios = previewScenarios(LOCAL)
const sources = new Map(Object.values(scenarios).filter((s) => s.map).map((s) => [s.map!.id, { ...s.map!.source, own: s.desk?.cell ?? null }]))
const cache = new Map<string, string>()
const withArt = (html: string) =>
  inline
    ? html.replace(/https:\/\/local-art\.invalid(\/art\/pw\/[^"'\s)]+\.png)/g, (_m, path: string) => {
        let uri = cache.get(path)
        if (uri === undefined) {
          const parsed = parseArtPath(path)
          let png: Uint8Array | null = null
          if (parsed?.kind === 'qr') png = renderQrPng(parsed.target, parsed.scale, 'https://trmnlgames.com')
          else if (parsed?.kind === 'map') {
            const source = sources.get(parsed.mapId)
            if (source) png = renderMapPng(source, parsed.window, contentV1, parsed.seat > 0 && source.own ? source.own : undefined)
          }
          uri = png ? `data:image/png;base64,${Buffer.from(png).toString('base64')}` : `${LOCAL}${path}`
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
for (const [name, input] of Object.entries(scenarios)) {
  if (filter && !name.includes(filter)) continue
  const payload = buildPayload(input)
  for (const layout of Object.keys(PREVIEW_LAYOUTS) as PreviewLayout[]) {
    const inner = withArt(await liquid.parseAndRender(screenMarkup[layout], { ...payload, utc_offset: 3600 }))
    for (const device of Object.keys(PREVIEW_DEVICES) as PreviewDevice[]) {
      for (const portrait of [false, true]) {
        const file = `.previews/${theme ? `${theme}.` : ''}pw-${name}--${device}${portrait ? '-portrait' : ''}--${layout}.html`
        writeFileSync(file, previewDocument(inner, device, layout, `Pixel Wars · ${name} · ${device}${portrait ? ' portrait' : ''} · ${PREVIEW_LAYOUTS[layout].label}`, { portrait, theme }))
        written += 1
      }
    }
  }
}
console.log(`wrote ${written} Pixel Wars previews to .previews/`)
