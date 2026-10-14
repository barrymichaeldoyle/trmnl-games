/**
 * Paper Lives layout previews (paper-lives.md "Device", L3): every device state through the real payload builder and
 * templates, in the pinned framework shell, for OG, X and BWRY in both orientations. `--inline-art` draws portraits
 * and codes locally. Files are written as `.previews/pl-<state>--<device>[-portrait]--<layout>.html` for `pnpm sweep:trmnl`.
 *   pnpm preview:paper-lives
 */
import { mkdirSync, writeFileSync } from 'node:fs'
import { Liquid } from 'liquidjs'
import { buildPayload } from '@trmnl-games/paper-lives/payload'
import { renderPaperLivesArt } from '@trmnl-games/paper-lives/art/route'
import { screenMarkup } from '@trmnl-games/paper-lives/templates/screen'
import { previewScenarios } from '@trmnl-games/paper-lives/templates/previewScenarios'
import { PREVIEW_DEVICES, PREVIEW_LAYOUTS, previewDocument, type PreviewDevice, type PreviewLayout } from '@trmnl-games/desk-crawler/templates/preview'

const LOCAL = 'https://local-art.invalid'
const inline = process.argv.includes('--inline-art')
const cache = new Map<string, string>()
const withArt = (html: string) =>
  inline
    ? html.replace(/https:\/\/local-art\.invalid(\/art\/pl\/[^"'\s)]+\.png)/g, (_m, path: string) => {
        let uri = cache.get(path)
        if (uri === undefined) {
          const art = renderPaperLivesArt(path, 'https://trmnlgames.com')
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
for (const [name, { utcOffset, ...input }] of Object.entries(previewScenarios(LOCAL))) {
  if (filter && !name.includes(filter)) continue
  const payload = buildPayload(input)
  for (const layout of Object.keys(PREVIEW_LAYOUTS) as PreviewLayout[]) {
    const inner = withArt(await liquid.parseAndRender(screenMarkup[layout], { ...payload, utc_offset: utcOffset }))
    for (const device of Object.keys(PREVIEW_DEVICES) as PreviewDevice[]) {
      for (const portrait of [false, true]) {
        const file = `.previews/pl-${name}--${device}${portrait ? '-portrait' : ''}--${layout}.html`
        writeFileSync(file, previewDocument(inner, device, layout, `Paper Lives · ${name} · ${device}${portrait ? ' portrait' : ''} · ${PREVIEW_LAYOUTS[layout].label}`, { portrait }))
        written += 1
      }
    }
  }
}
console.log(`wrote ${written} Paper Lives previews to .previews/`)
