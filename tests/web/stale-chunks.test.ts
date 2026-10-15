import { describe, expect, it } from 'vitest'
import { isStaleChunkError } from '../../apps/web/src/lib/staleChunks'

describe('stale chunk errors', () => {
  it('recognises a missing route chunk in each browser', () => {
    expect(isStaleChunkError(new TypeError('Failed to fetch dynamically imported module: https://trmnlgames.com/assets/inventory-CsZo3ZX3.js'))).toBe(true)
    expect(isStaleChunkError(new TypeError('error loading dynamically imported module: https://trmnlgames.com/assets/a.js'))).toBe(true)
    expect(isStaleChunkError(new TypeError('Importing a module script failed.'))).toBe(true)
    expect(isStaleChunkError(new Error('Unable to preload CSS for https://trmnlgames.com/assets/a.css'))).toBe(true)
  })

  it('leaves other page errors to the usual report', () => {
    expect(isStaleChunkError(new TypeError("undefined is not an object (evaluating 'e[t??`default`]')"))).toBe(false)
    expect(isStaleChunkError(new Error('Failed to fetch'))).toBe(false)
    expect(isStaleChunkError('Failed to fetch dynamically imported module')).toBe(false)
    expect(isStaleChunkError(undefined)).toBe(false)
  })
})
