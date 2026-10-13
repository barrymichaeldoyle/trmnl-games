/**
 * Public alias and hero-name rules (gameplay.md), shared so the server and the web forms agree. MVP allowlist suits
 * the TRMNL device fonts; broaden only after glyph evidence. Liquid/HTML delimiters are not in the allowlist, and
 * render paths escape text anyway.
 */
const ALLOWED = /^[A-Za-z0-9 ._'-]+$/
const ALLOWED_CHARACTER = /[A-Za-z0-9 ._'-]/

export interface NameRule {
  readonly min: number
  readonly max: number
}

export const ALIAS_RULE: NameRule = { min: 2, max: 20 }
export const HERO_NAME_RULE: NameRule = { min: 2, max: 16 }

/** What the rule allows, in the words the forms and the server use. */
export const NAME_CHARACTERS = "letters A-Z, numbers, spaces and . _ ' -"

export type NameResult = { ok: true; value: string } | { ok: false; reason: string }

/** Trims and collapses whitespace the way the server stores the name. */
export const cleanName = (raw: string): string => raw.normalize('NFC').trim().replace(/\s+/g, ' ')

export function validateName(raw: string, rule: NameRule): NameResult {
  const value = cleanName(raw)
  const length = [...value].length
  if (length < rule.min || length > rule.max) return { ok: false, reason: `Use ${rule.min}-${rule.max} characters.` }
  if (!ALLOWED.test(value)) return { ok: false, reason: "Use letters, numbers, spaces and . _ ' - only." }
  return { ok: true, value }
}

/** The distinct characters a name may not use, in the order typed. */
export function disallowedCharacters(raw: string): string[] {
  return [...new Set([...cleanName(raw)].filter((character) => !ALLOWED_CHARACTER.test(character)))]
}
