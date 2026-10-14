import type { LifeState } from '@trmnl-games/paper-lives/sim'
import type { Doc } from '../_generated/dataModel'

/** Stored life to the pure core's state. Traits are stored as a plain array of the two ids. */
export function toLifeState(doc: Doc<'lives'>): LifeState {
  const { traits, ...rest } = doc.life
  return { ...rest, traits: [traits[0]!, traits[1]!] } as LifeState
}

/** The pure core's state back to the stored field. Absent optionals stay absent, so a cleared job or pet clears. */
export function fromLifeState(state: LifeState): Doc<'lives'>['life'] {
  return JSON.parse(JSON.stringify({ ...state, traits: [...state.traits] })) as Doc<'lives'>['life']
}
