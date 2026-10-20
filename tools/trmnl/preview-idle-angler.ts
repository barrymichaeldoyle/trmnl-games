/**
 * Idle Angler layout previews (idle-angler.md "Device", S3): every device state through the real payload builder and
 * templates, in the pinned framework shell, for OG, X and BWRY in both orientations. `--inline-art` draws scenes and
 * codes locally. Files are written as `.previews/ia-<state>--<device>[-portrait]--<layout>.html` for `pnpm sweep:trmnl`.
 *   pnpm tsx tools/trmnl/preview-idle-angler.ts --inline-art
 */
import { mkdirSync, writeFileSync } from 'node:fs'
import { Liquid } from 'liquidjs'
import { isLocale } from '@trmnl-games/platform'
import { buildPayload } from '@trmnl-games/idle-angler/payload'
import { flyQrBase, renderIdleAnglerArt } from '@trmnl-games/idle-angler/art/route'
import { screenMarkup } from '@trmnl-games/idle-angler/templates/screen'
import { previewScenarios } from '@trmnl-games/idle-angler/templates/previewScenarios'
import { isPreviewTheme, PREVIEW_DEVICES, PREVIEW_LAYOUTS, previewDocument, type PreviewDevice, type PreviewLayout, type PreviewTheme } from '@trmnl-games/desk-crawler/templates/preview'

const LOCAL = 'https://local-art.invalid'
const inline = process.argv.includes('--inline-art')
const cache = new Map<string, string>()
const withArt = (html: string) =>
  inline
    ? html.replace(/https:\/\/local-art\.invalid(\/art\/ia\/[^"'\s)]+\.png)/g, (_m, path: string) => {
        let uri = cache.get(path)
        if (uri === undefined) {
          const art = renderIdleAnglerArt(path, 'https://trmnlgames.com')
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
// `--theme dark|white-and-red|black-and-yellow` renders under that TRMNL theme, as pages named `<theme>.ia-<state>--…`.
const themeArg = process.argv.includes('--theme') ? process.argv[process.argv.indexOf('--theme') + 1] : undefined
const theme: PreviewTheme | undefined = isPreviewTheme(themeArg) ? themeArg : undefined
// D200: `--locale fr` renders the screens in that language, as pages named `ia-<state>--…` prefixed with `fr.`.
const localeArg = process.argv.includes('--locale') ? process.argv[process.argv.indexOf('--locale') + 1] : undefined
const locale = isLocale(localeArg) ? localeArg : undefined
for (const [name, input] of Object.entries(previewScenarios(LOCAL))) {
  if (filter && !name.includes(filter)) continue
  const payload = buildPayload({ ...input, ...(locale ? { locale } : {}) })
  for (const layout of Object.keys(PREVIEW_LAYOUTS) as PreviewLayout[]) {
    // The weekly fly code sits in the title bar on every fishing screen (it is the longest title-bar text).
    // `--no-fly` renders listing images without a code.
    const flyCode = !process.argv.includes('--no-fly') && (payload.status === 'fishing' || payload.status === 'paused' || payload.status === 'travelling') ? '482 917' : null
    // D180: the screen route's fly QR beside the code.
    const flyQr = flyCode ? flyQrBase(flyCode) : null
    // Template v15: the screen route passes the owner's UTC offset (seconds) for the stories' times; the previews use an hour ahead.
    const inner = withArt(await liquid.parseAndRender(screenMarkup[layout], { ...payload, fly_code: flyCode, fly_qr_base: flyQr ? `${LOCAL}${flyQr}` : '', utc_offset: 3600 }))
    for (const device of Object.keys(PREVIEW_DEVICES) as PreviewDevice[]) {
      for (const portrait of [false, true]) {
        const file = `.previews/${locale ? `${locale}.` : ''}${theme ? `${theme}.` : ''}ia-${name}--${device}${portrait ? '-portrait' : ''}--${layout}.html`
        writeFileSync(file, previewDocument(inner, device, layout, `Idle Angler · ${name} · ${device}${portrait ? ' portrait' : ''} · ${PREVIEW_LAYOUTS[layout].label}`, { portrait, theme }))
        written += 1
      }
    }
  }
}
console.log(`wrote ${written} Idle Angler previews to .previews/`)
