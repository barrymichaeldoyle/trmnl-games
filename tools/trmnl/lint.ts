/**
 * Run the pinned official TRMNL linter against the authoritative TS templates: Desk Crawler's, then Idle Angler's.
 * Then check that every static class in the templates exists in the pinned framework's CSS (or is one its JS
 * reads), since the official rules accept made-up classes like `mt--[1px]` or `-mt--2` that silently do nothing.
 */
import { copyFileSync, existsSync, mkdirSync, mkdtempSync, readFileSync, rmSync, writeFileSync } from 'node:fs'
import { tmpdir } from 'node:os'
import { join } from 'node:path'
import { screenMarkup } from '@trmnl-games/desk-crawler/templates/screen'
import { screenMarkup as idleAnglerMarkup } from '@trmnl-games/idle-angler/templates/screen'
import { FRAMEWORK_VERSION } from '@trmnl-games/desk-crawler/templates/preview'
import { bundle, bundleConfig as config, requireBundle, root } from './bundle'

const args = process.argv.slice(2)
if (args.some((arg) => !['--install', '--json'].includes(arg)) || (args.includes('--install') && args.includes('--json'))) {
  console.error('Usage: pnpm lint:trmnl [--json] or pnpm lint:trmnl:setup')
  process.exit(2)
}

if (args.includes('--install')) {
  process.exit(bundle(['install']).status ?? 1)
}
requireBundle()

type Markup = Record<keyof typeof screenMarkup, string>

const layoutsOf = (markup: Markup) => ({
  full: markup.markup,
  half_horizontal: markup.markup_half_horizontal,
  half_vertical: markup.markup_half_vertical,
  quadrant: markup.markup_quadrant,
})

function lintGame(markup: Markup, label: string): number {
  if (!args.includes('--json')) console.log(`${label}:`)
  const dir = mkdtempSync(join(tmpdir(), 'desk-crawler-trmnl-lint-'))
  try {
    mkdirSync(join(dir, 'src'))
    writeFileSync(join(dir, 'src/settings.yml'), `${readFileSync(join(config, 'settings.yml'), 'utf8')}\nframework_version: ${FRAMEWORK_VERSION}\n`)
    copyFileSync(join(config, '.trmnlp.yml'), join(dir, '.trmnlp.yml'))
    for (const [name, text] of Object.entries(layoutsOf(markup))) {
      writeFileSync(join(dir, `src/${name}.liquid`), text)
    }
    return bundle(['exec', 'trmnlp', 'lint', '--dir', dir, '--format', args.includes('--json') ? 'json' : 'text']).status ?? 1
  } finally {
    rmSync(dir, { recursive: true, force: true })
  }
}

/** The pinned framework's CSS or JS, downloaded once into the ignored `.trmnl-lint/` (the CSS is ~19 MB). */
async function frameworkFile(kind: 'css' | 'js'): Promise<string> {
  const path = join(root, `.trmnl-lint/framework/${FRAMEWORK_VERSION}/plugins.${kind}`)
  if (!existsSync(path)) {
    const url = `https://trmnl.com/${kind}/${FRAMEWORK_VERSION}/plugins.${kind}`
    const response = await fetch(url)
    if (!response.ok) throw new Error(`Could not download ${url}: HTTP ${response.status}`)
    mkdirSync(join(path, '..'), { recursive: true })
    writeFileSync(path, await response.text())
  }
  return readFileSync(path, 'utf8')
}

/** Every class name the framework styles, plus the ones its JS toggles or tests. */
async function frameworkClasses(): Promise<Set<string>> {
  const classes = new Set<string>()
  // Class selectors with CSS escapes undone: `.\31 bit\:block` is `1bit:block`, `.w--\[16px\]` is `w--[16px]`.
  for (const [, name = ''] of (await frameworkFile('css')).matchAll(/\.((?:\\[0-9a-fA-F]{1,6} ?|\\.|[\w-])+)/g)) {
    classes.add(name.replace(/\\([0-9a-fA-F]{1,6}) ?|\\(.)/g, (_, hex, char) => (hex ? String.fromCodePoint(parseInt(hex, 16)) : char)))
  }
  for (const [, name = ''] of (await frameworkFile('js')).matchAll(/classList\.\w+\(\s*['"]([\w-]+)/g)) classes.add(name)
  return classes
}

/** Static classes the framework does not define. Liquid tags are dropped and classes built from output tags skipped. */
function unknownClasses(markup: Markup, known: Set<string>): Array<{ layout: string; classes: string[] }> {
  const DYNAMIC = '\u0000'
  return Object.entries(layoutsOf(markup)).flatMap(([layout, text]) => {
    const html = text
      .replace(/\{%-?\s*comment\s*-?%\}[\s\S]*?\{%-?\s*endcomment\s*-?%\}/g, '')
      .replace(/\{\{[\s\S]*?\}\}/g, DYNAMIC)
      .replace(/\{%[\s\S]*?%\}/g, ' ')
    const unknown = new Set<string>()
    for (const [, , value = ''] of html.matchAll(/\sclass=(["'])([\s\S]*?)\1/g)) {
      for (const name of value.split(/\s+/)) if (name && !name.includes(DYNAMIC) && !known.has(name)) unknown.add(name)
    }
    return unknown.size ? [{ layout, classes: [...unknown].sort() }] : []
  })
}

const games: Array<[Markup, string]> = [
  [screenMarkup, 'Desk Crawler'],
  [idleAnglerMarkup, 'Idle Angler'],
]
let failed = games.map(([markup, label]) => lintGame(markup, label)).some((status) => status !== 0)

const known = await frameworkClasses()
// In --json mode stdout carries the official report, so these findings go to stderr.
const report = args.includes('--json') ? console.error : console.log
report(`Framework ${FRAMEWORK_VERSION} classes:`)
for (const [markup, label] of games) {
  const found = unknownClasses(markup, known)
  if (found.length === 0) {
    report(`  ${label}: every class exists.`)
    continue
  }
  failed = true
  report(`  ${label}: classes the framework does not define (they have no effect):`)
  for (const { layout, classes } of found) report(`    ${layout}: ${classes.join(' ')}`)
}
process.exitCode = failed ? 1 : 0
