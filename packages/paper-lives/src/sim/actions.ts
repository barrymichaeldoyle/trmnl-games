import { decisionOf, optionOf, optionOpen } from './simulate'
import type { LifeState, PaperLivesCatalog, Pronouns } from './types'

/**
 * The player's intents as pure state changes (paper-lives.md "Decisions" and "Architecture"). The backend
 * wraps each in the common intent contract; name moderation is the platform's (HERO_NAME_RULE).
 */
export type ActionResult = { ok: true; life: LifeState } | { ok: false; code: string; reason: string }

const fail = (code: string, reason: string): ActionResult => ({ ok: false, code, reason })

/** Record a choice; it resolves at the boundary. Choosing again before then replaces it. */
export function choose(life: LifeState, content: PaperLivesCatalog, decisionId: string, optionId: string): ActionResult {
  if (life.status !== 'living') return fail('NOT_LIVING', 'This life is not living.')
  const pending = life.year.pending
  if (!pending || pending.decisionId !== decisionId) return fail('NO_DECISION', 'That decision is no longer open.')
  const def = decisionOf(content, decisionId)
  if (!def.options.some((o) => o.id === optionId)) return fail('UNKNOWN_OPTION', 'That option does not exist.')
  const option = optionOf(def, optionId)
  if (!optionOpen(life, option)) return fail('OPTION_GATED', option.gateReason ?? 'That option is not open.')
  return { ok: true, life: { ...life, year: { ...life.year, pending: { ...pending, chosen: optionId } } } }
}

/**
 * Queue the year's end: it comes at the first tick on or after the minimum, so asking early never
 * shortens a year (L1 change: queueable at any time, not only from the minimum). A second ask is a no-op.
 */
export function requestAgeUp(life: LifeState): ActionResult {
  if (life.status !== 'living') return fail('NOT_LIVING', 'This life is not living.')
  if (life.stage === 'infant') return fail('INFANT', 'The first years pass by themselves.')
  return { ok: true, life: life.year.ageUpRequested ? life : { ...life, year: { ...life.year, ageUpRequested: true } } }
}

/**
 * The name and the sex can change while the life is still an infant (ages 0 to 5), before school and before anyone
 * else's story depends on them. The surname too, for a first generation; a child who carries the story on keeps the
 * family name.
 */
export const canSetUp = (life: LifeState) => life.status !== 'ended' && life.stage === 'infant'

export function rename(life: LifeState, first: string, last?: string): ActionResult {
  if (!canSetUp(life)) return fail('TOO_LATE', 'The name is settled once school starts.')
  if (last !== undefined && last !== life.last && life.generation > 1) return fail('FAMILY_NAME', 'The family name carries on from the last life.')
  return { ok: true, life: { ...life, first, ...(last !== undefined ? { last } : {}) } }
}

/** A girl or a boy (she or he). `they` was the default before content v5 and can no longer be chosen. */
export function setPronouns(life: LifeState, pronouns: Pronouns): ActionResult {
  if (!canSetUp(life)) return fail('TOO_LATE', 'This is settled once school starts.')
  if (pronouns === 'they') return fail('CHOOSE_SEX', 'Choose a girl or a boy.')
  return { ok: true, life: { ...life, pronouns } }
}

export function pause(life: LifeState): ActionResult {
  if (life.status !== 'living') return fail('NOT_LIVING', 'Only a living life can pause.')
  return { ok: true, life: { ...life, status: 'paused' } }
}

export function resume(life: LifeState): ActionResult {
  if (life.status !== 'paused') return fail('NOT_PAUSED', 'This life is not paused.')
  return { ok: true, life: { ...life, status: 'living' } }
}
