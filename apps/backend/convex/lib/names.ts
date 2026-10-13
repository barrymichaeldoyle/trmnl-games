/** Name rules live in @trmnl-games/platform so the web forms check them before submitting. */
export { ALIAS_RULE, HERO_NAME_RULE, validateName, type NameResult, type NameRule } from '@trmnl-games/platform'

/** Case-insensitive uniqueness key for public aliases. */
export const normalizeAlias = (alias: string): string => alias.normalize('NFC').trim().toLowerCase()

export function validateTimezone(raw: string): string {
  try {
    new Intl.DateTimeFormat('en-US', { timeZone: raw })
    return raw
  } catch {
    return 'UTC'
  }
}
