import { readdirSync, readFileSync, statSync } from 'node:fs'
import { dirname, join, resolve } from 'node:path'
import { describe, expect, it } from 'vitest'
import { contentNeededAt } from '../../apps/web/src/lib/content'

/**
 * D169: a page that shows game content in another language must be on the client entry's list (lib/content), or it
 * hydrates in English and then re-renders translated. This finds every route whose module reaches the lazy content
 * translator through relative imports and checks its path against that list. Server messages (lib/intent) are the one
 * use that waits for a later message, so they do not count.
 */
const SRC = resolve(__dirname, '../../apps/web/src')
const LAZY = '@trmnl-games/desk-crawler/i18n/lazy'
const BOUNDARIES = new Set([join(SRC, 'lib/content.ts'), join(SRC, 'i18n/serverMessages.ts')])

function walk(dir: string): string[] {
  return readdirSync(dir).flatMap((name) => {
    const path = join(dir, name)
    return statSync(path).isDirectory() ? walk(path) : /\.(ts|tsx)$/.test(name) ? [path] : []
  })
}

const resolveImport = (from: string, spec: string): string | null => {
  if (!spec.startsWith('.')) return null
  const base = resolve(dirname(from), spec)
  for (const candidate of [base, `${base}.ts`, `${base}.tsx`, join(base, 'index.ts'), join(base, 'index.tsx')]) {
    try { if (statSync(candidate).isFile()) return candidate } catch { /* next */ }
  }
  return null
}

const importsOf = (file: string): string[] => [...readFileSync(file, 'utf8').matchAll(/from '([^']+)'/g)].map((m) => m[1]!)

/** The route a file under routes/ serves, in the shape contentNeededAt sees: params as "x", index as its folder. */
function routeOf(file: string): string | null {
  const rel = file.slice(join(SRC, 'routes').length + 1).replace(/\.tsx?$/, '')
  if (rel.split('/').at(-1)!.startsWith('-') || rel === '__root') return null
  return '/' + rel.split('/').map((part) => part.replace(/_$/, '')).filter((part) => part !== 'index' && !part.startsWith('_')).join('/').replace(/\./g, '/').replace(/\$\w+/g, 'x')
}

describe('content pages', () => {
  const files = walk(SRC)
  const dependents = new Map<string, string[]>()
  for (const file of files) {
    for (const spec of importsOf(file)) {
      const target = resolveImport(file, spec)
      if (target) dependents.set(target, [...(dependents.get(target) ?? []), file])
    }
  }
  const reaches = new Set(files.filter((file) => !BOUNDARIES.has(file) && importsOf(file).includes(LAZY)))
  for (const file of [...reaches]) for (const dependent of dependents.get(file) ?? []) if (!BOUNDARIES.has(dependent) && !reaches.has(dependent)) reaches.add(dependent)
  const routes = files.filter((file) => file.startsWith(join(SRC, 'routes')) && reaches.has(file)).map(routeOf).filter((route): route is string => route !== null)

  it('finds the companion and the public hero pages', () => {
    expect(routes).toContain('/app/desk-crawler')
    expect(routes).toContain('/desk-crawler/heroes/x')
  })

  it('lists every route that renders game content on the client entry', () => {
    const missing = routes.filter((route) => !contentNeededAt(route))
    expect(missing).toEqual([])
  })

  it('leaves pages without game content to hydrate at once', () => {
    expect(contentNeededAt('/')).toBe(false)
    expect(contentNeededAt('/app/idle-angler')).toBe(false)
    expect(contentNeededAt('/help/desk-crawler')).toBe(false)
  })
})
