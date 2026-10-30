/**
 * Where a scanned code lands (D180, D217, D218): a keepsake QR on the keepsakes page, a fly QR on the logbook, each with
 * its six digits in the address. Plain functions, apart from the routes that use them, so they are tested without the
 * router or the backend's types (tests/web/scan-landing.test.ts).
 */

/** Six digits from an address value; a number that lost its leading zeros gets them back. */
export function sixDigits(value: unknown): string | null {
  if (typeof value === 'string') return /^\d{6}$/.test(value) ? value : null
  return typeof value === 'number' && Number.isInteger(value) && value >= 0 && value < 1e6 ? String(value).padStart(6, '0') : null
}

/** A route's `validateSearch` that keeps only a six-digit `key`. */
export const codeSearch =
  <K extends string>(key: K) =>
  (search: Record<string, unknown>): Partial<Record<K, string>> => {
    const code = sixDigits(search[key])
    return code === null ? {} : ({ [key]: code } as Partial<Record<K, string>>)
  }

/** `/k/<code>`: the keepsakes page with the digits, or the hero page for anything else. */
export function keepsakeLink(raw: string) {
  const digits = raw.replace(/\D/g, '')
  return /^\d{6}$/.test(digits) ? ({ to: '/app/desk-crawler/keepsakes', search: { keepsake: digits } } as const) : ({ to: '/app/desk-crawler' } as const)
}

/** `/f/<code>`: the logbook, with the digits when there are six. */
export function flyLink(raw: string) {
  const digits = raw.replace(/\D/g, '')
  return { to: '/app/idle-angler/logbook', search: /^\d{6}$/.test(digits) ? { fly: digits } : {} } as const
}

/** The hero page passes an old `?keepsake=` on to the keepsakes page (a sign-in that returns there still lands). */
export const heroKeepsake = (search: { keepsake?: string }) => (search.keepsake ? ({ to: '/app/desk-crawler/keepsakes', search: { keepsake: search.keepsake } } as const) : null)
