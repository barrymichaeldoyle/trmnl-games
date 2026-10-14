import type { Pronouns } from './types'

/**
 * Line slots (paper-lives.md "Content"). Character pronouns come from the life;
 * people and pets are always named, so no line needs a pronoun for anyone else.
 */
const PRONOUNS: Readonly<Record<Pronouns, Readonly<Record<string, string>>>> = {
  they: { they: 'they', them: 'them', their: 'their', theirs: 'theirs', themself: 'themself', was: 'were', has: 'have', is: 'are' },
  she: { they: 'she', them: 'her', their: 'her', theirs: 'hers', themself: 'herself', was: 'was', has: 'has', is: 'is' },
  he: { they: 'he', them: 'him', their: 'his', theirs: 'his', themself: 'himself', was: 'was', has: 'has', is: 'is' },
}

export const PRONOUN_SLOTS = Object.keys(PRONOUNS.they)
/** Every slot a content line may use. */
export const VALUE_SLOTS = ['first', 'last', 'age', 'season', 'person', 'pet', 'petKind', 'hobby', 'job', 'house', 'trait', 'weekday', 'parent'] as const
export type SlotValues = Partial<Record<(typeof VALUE_SLOTS)[number], string | number>>

const capital = (s: string) => s.charAt(0).toUpperCase() + s.slice(1)

/** Fill `{slot}` and `{Slot}` (capitalised) markers. Unknown slots throw, so the validator catches them. */
export function fill(line: string, pronouns: Pronouns, values: SlotValues): string {
  return line.replace(/\{(\w+)\}/g, (_, raw: string) => {
    const key = raw.charAt(0).toLowerCase() + raw.slice(1)
    const upper = raw !== key
    const value = PRONOUNS[pronouns][key] ?? (key in values ? String(values[key as keyof SlotValues]) : undefined)
    if (value === undefined) throw new Error(`unfilled slot {${raw}} in "${line}"`)
    return upper ? capital(value) : value
  })
}

/** Slot names used by a line, lowercased. */
export function slotsOf(line: string): string[] {
  return [...line.matchAll(/\{(\w+)\}/g)].map((m) => m[1]!.charAt(0).toLowerCase() + m[1]!.slice(1))
}
