import { describe, expect, it } from 'vitest'
import { codeSearch, flyLink, heroKeepsake, keepsakeLink, sixDigits } from '../../apps/web/src/lib/scanCodes'

/**
 * D217/D218: where a scanned code lands. The rest of the landing (sent once, the address dropped, confetti and the New
 * tile) runs in a browser: `node tools/review/scan-landing.mjs` against the companion fixtures harness.
 */
describe('scanned codes land where they are seen (D217, D218)', () => {
  it('sends a keepsake QR to the keepsakes page with its six digits', () => {
    expect(keepsakeLink('482-917')).toEqual({ to: '/app/desk-crawler/keepsakes', search: { keepsake: '482917' } })
    // Anything but six digits just opens the hero page.
    expect(keepsakeLink('48')).toEqual({ to: '/app/desk-crawler' })
  })

  it('passes an old hero-page code on to the keepsakes page, and leaves the hero page alone otherwise', () => {
    expect(heroKeepsake({ keepsake: '012345' })).toEqual({ to: '/app/desk-crawler/keepsakes', search: { keepsake: '012345' } })
    expect(heroKeepsake({})).toBeNull()
  })

  it('sends a fly QR to the logbook with its six digits', () => {
    expect(flyLink('654 321')).toEqual({ to: '/app/idle-angler/logbook', search: { fly: '654321' } })
    expect(flyLink('nope')).toEqual({ to: '/app/idle-angler/logbook', search: {} })
  })

  it('reads only six digits from an address, restoring a number that lost its leading zeros', () => {
    expect(sixDigits('123456')).toBe('123456')
    expect(sixDigits(12345)).toBe('012345')
    for (const bad of ['12345', '1234567', 'abcdef', 1e6, -1, 1.5, null, undefined]) expect(sixDigits(bad)).toBeNull()
    expect(codeSearch('fly')({ fly: 42, other: 'x' })).toEqual({ fly: '000042' })
    expect(codeSearch('keepsake')({ keepsake: 'abc' })).toEqual({})
  })
})
