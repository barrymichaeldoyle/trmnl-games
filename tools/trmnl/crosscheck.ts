/**
 * Cross-checks the preview's Liquid engine (liquidjs) against Ruby Liquid with
 * TRMNL's filters, as built by the pinned `trmnlp`. Every preview fixture set is
 * rendered by both engines from the same context and the markup must match
 * exactly. Ruby runs with strict filters, so a filter liquidjs knows but TRMNL
 * lacks fails here instead of silently passing through on TRMNL. Neither engine
 * replaces the live TRMNL render check. Idle Angler's templates are checked the same way over its preview scenarios
 * (D115, template v2).  Usage: pnpm crosscheck:trmnl
 */
import { mkdirSync, mkdtempSync, readFileSync, rmSync, writeFileSync } from 'node:fs'
import { tmpdir } from 'node:os'
import { join } from 'node:path'
import { spawnSync } from 'node:child_process'
import { Liquid } from 'liquidjs'
import { screenMarkup } from '@trmnl-games/desk-crawler/templates/screen'
import { screenMarkup as idleAnglerMarkup } from '@trmnl-games/idle-angler/templates/screen'
import { previewScenarios } from '@trmnl-games/idle-angler/templates/previewScenarios'
import { buildPayload } from '@trmnl-games/idle-angler/payload'
import { screenMarkup as paperLivesMarkup } from '@trmnl-games/paper-lives/templates/screen'
import { previewScenarios as paperLivesScenarios } from '@trmnl-games/paper-lives/templates/previewScenarios'
import { buildPayload as buildPaperLivesPayload } from '@trmnl-games/paper-lives/payload'
import type { PreviewLayout } from '@trmnl-games/desk-crawler/templates/preview'
import { bundle, requireBundle, root } from './bundle'

/** Preview flag sets that together cover every fixture state, with and without a keepsake code, and in every other language (D169, D192). */
const FIXTURE_SETS = [['--recap'], ['--recap', '--keepsakes'], ['--potion-finds'], ['--no-effect'], ['--marketing'], ['--recap', '--locale', 'fr'], ['--recap', '--keepsakes', '--locale', 'de'], ['--recap', '--locale', 'es'], ['--recap', '--keepsakes', '--locale', 'it'], ['--recap', '--locale', 'pt'], ['--recap', '--keepsakes', '--locale', 'pl'], ['--recap', '--locale', 'nl']]

requireBundle()

const dir = mkdtempSync(join(tmpdir(), 'desk-crawler-trmnl-crosscheck-'))
try {
  const cases: Array<{ id: string; layout: PreviewLayout; context: Record<string, unknown> }> = []
  for (const flags of FIXTURE_SETS) {
    const file = join(dir, 'contexts.json')
    const preview = spawnSync('pnpm', ['exec', 'tsx', 'tools/trmnl/preview.ts', ...flags, '--dump-contexts', file], { cwd: root, stdio: ['ignore', 'ignore', 'inherit'] })
    if (preview.status !== 0) throw new Error(`preview ${flags.join(' ')} failed`)
    const dumped = JSON.parse(readFileSync(file, 'utf8')) as Array<{ name: string; layout: PreviewLayout; context: Record<string, unknown> }>
    cases.push(...dumped.map(({ name, layout, context }) => ({ id: `${flags.join(' ')} ${name} ${layout}`, layout, context })))
  }

  // Idle Angler: every preview scenario, with and without the weekly fly code (and its D180 claim QR).
  const idleAnglerCases = Object.entries(previewScenarios('https://local-art.invalid')).flatMap(([name, input]) =>
    [null, '482 917'].flatMap((flyCode) =>
      (Object.keys(idleAnglerMarkup) as PreviewLayout[]).map((layout) => ({ id: `idle-angler ${name}${flyCode ? ' fly' : ''} ${layout}`, layout, context: JSON.parse(JSON.stringify({ ...buildPayload(input), fly_code: flyCode, fly_qr_base: flyCode ? 'https://local-art.invalid/art/ia/qr/v1/fly/482917' : '' })) as Record<string, unknown> })),
    ),
  )

  // Paper Lives: every preview scenario, with its owner's offset for the close time (D42).
  const paperLivesCases = Object.entries(paperLivesScenarios('https://local-art.invalid')).flatMap(([name, { utcOffset, ...input }]) =>
    [null, '482 917'].flatMap((photoCode) =>
      (Object.keys(paperLivesMarkup) as PreviewLayout[]).map((layout) => ({ id: `paper-lives ${name}${photoCode ? ' photo' : ''} ${layout}`, layout, context: JSON.parse(JSON.stringify({ ...buildPaperLivesPayload(input), photo_code: photoCode, utc_offset: utcOffset })) as Record<string, unknown> })),
    ),
  )

  // TRMNL renders in UTC; the preview's liquidjs and the Ruby process both use it.
  const renderRuby = (templates: Record<string, string>, set: typeof cases) => {
    const ruby = bundle(['exec', 'ruby', join(root, 'tools/trmnl/crosscheck.rb')], {
      input: JSON.stringify({ templates, cases: set }),
      stdio: ['pipe', 'pipe', 'inherit'],
      maxBuffer: 256 * 1024 * 1024,
      env: { TZ: 'UTC' },
    })
    if (ruby.status !== 0) throw new Error('Ruby render failed')
    return JSON.parse(ruby.stdout.toString()) as Record<string, string>
  }
  const rubyHtml = { ...renderRuby(screenMarkup, cases), ...renderRuby(idleAnglerMarkup, idleAnglerCases), ...renderRuby(paperLivesMarkup, paperLivesCases) }

  const liquid = new Liquid({ timezoneOffset: 0 })
  const out = join(root, '.previews/crosscheck')
  rmSync(out, { recursive: true, force: true })
  let mismatches = 0
  const allCases = [...cases.map((c) => ({ ...c, templates: screenMarkup as Record<string, string> })), ...idleAnglerCases.map((c) => ({ ...c, templates: idleAnglerMarkup as Record<string, string> })), ...paperLivesCases.map((c) => ({ ...c, templates: paperLivesMarkup as Record<string, string> }))]
  for (const { id, layout, context, templates } of allCases) {
    const js = await liquid.parseAndRender(templates[layout]!, context)
    const rb = rubyHtml[id] ?? 'RUBY ERROR: no output'
    if (js === rb) continue
    mismatches++
    const at = [...js].findIndex((char, i) => char !== rb[i])
    const offset = at < 0 ? Math.min(js.length, rb.length) : at
    console.error(`\n✗ ${id} (first difference at ${offset})`)
    console.error(`  liquidjs: ${JSON.stringify(js.slice(Math.max(0, offset - 80), offset + 80))}`)
    console.error(`  ruby:     ${JSON.stringify(rb.slice(Math.max(0, offset - 80), offset + 80))}`)
    mkdirSync(out, { recursive: true })
    const base = join(out, id.replace(/[^\w]+/g, '_'))
    writeFileSync(`${base}.liquidjs.html`, js)
    writeFileSync(`${base}.ruby.html`, rb)
  }
  console.log(mismatches ? `\n${mismatches} of ${allCases.length} renders differ; full outputs in .previews/crosscheck/` : `${allCases.length} renders identical in liquidjs and Ruby Liquid (trmnlp)`)
  process.exitCode = mismatches ? 1 : 0
} finally {
  rmSync(dir, { recursive: true, force: true })
}
