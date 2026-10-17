import type { DecisionDef, EventDef, OptionDef, PaperLivesCatalog, When } from '../../sim/types'
import { contentV4 } from '../v4'

/**
 * Paper Lives content v5 (2026-10-17): a story that keeps track of itself. Barry read a life where a half marathon at
 * twenty came before a "first 10k" at forty, never learned the character's sex, and met a fiancée for the first time
 * in the engagement line. Now:
 *
 * - Every life is a girl or a boy, with a name to match, and the player can change both while the life is an infant.
 *   Parents are a mother and a father, everyone has a fixed gender, and partners are of the other sex (Barry asked
 *   for that to keep the plugin family friendly). A life from v4, written as `they`, is settled once by its partner
 *   or its name (`settleGender`).
 * - Meeting someone, an engagement, a wedding, a birth and a death are always written at the year's end; the
 *   three-line cap trims only the smaller lines.
 * - A resolved decision is remembered as `decision:option`, and milestones read it: the 5k, 10k, half marathon and
 *   marathon come in order, the driving test before the car, the parent cared for at home or moved to a bungalow,
 *   not both.
 * - Babies come to married couples, so a new partner after a parting never arrives with a baby; separations happen
 *   to couples who have drifted, not to newlyweds.
 * - A system line that names a parent is skipped once both parents have died, and a few lines that contradicted the
 *   year (halls of residence for someone living at home) or repeated each other are rewritten.
 */

/** The running milestones from first to biggest, by the event or `decision:option` that writes them. */
const FIRST_10K = ['tn4_10k', 'yg3_hob_10k']
const BEYOND_10K = ['ad_hob_run', 'ad3_hospice_run:run', 'yg_marathon', 'ad3_hob_half', 'ad_marathon:train']
const BEYOND_HALF = ['ad3_hob_half', 'ad_marathon:train']
const PARENT_CARED_FOR = ['ad_parent_care', 'ad_parent_move_in:move', 'ad3_bungalow']

/** Event conditions added on top of v4's, by id. */
const EVENT_WHEN: Record<string, When> = {
  tn_hob_parkrun: { notSeen: [...FIRST_10K, ...BEYOND_10K] },
  tn4_10k: { notSeen: ['yg3_hob_10k', ...BEYOND_10K] },
  yg3_hob_10k: { notSeen: ['tn4_10k', ...BEYOND_10K] },
  yg_marathon: { notSeen: BEYOND_HALF },
  yg_car: { flags: ['licence'] },
  ad_separation: { person: 'partner', personMaxRelationship: 40 },
  yg_parting: { person: 'partner', personMaxRelationship: 50 },
  ad3_study: { childrenMinAge: 20 },
  ad_parent_care: { notSeen: PARENT_CARED_FOR.filter((id) => id !== 'ad_parent_care') },
  ad3_bungalow: { notSeen: PARENT_CARED_FOR.filter((id) => id !== 'ad3_bungalow') },
  tn3_first_kiss: { notSeen: ['tn_first_love', 'tn_ask_out:ask'] },
}

/** Event lines rewritten, by id. */
const EVENT_LINE: Record<string, string> = {
  // Read as moving out, even for a student who chose to stay at home.
  yg_uni_halls: 'Freshers’ week. A corridor of strangers, then friends.',
  // The same "three tiers, one wobble" as a teenage follow-up.
  ad_hob_bake: 'Baked the cake for a friend’s christening and carried it over on the bus.',
}

/** Decision conditions added on top of v4's, by id. */
const DECISION_WHEN: Record<string, When> = {
  yg_family: { partner: 'married' },
  ad_another: { partner: 'married' },
  yg_flat_share: { partner: false },
  ad_parent_move_in: { notSeen: ['ad_parent_care', 'ad3_bungalow'] },
}

/** Option changes, by decision id and option id. */
const OPTION: Record<string, Record<string, Partial<OptionDef>>> = {
  tn_driving_lessons: { learn: { effects: { gold: -600, stats: { happiness: 3 }, flag: 'licence' } } },
  yg_buy_car: { buy: { gate: { minGold: 2500, flags: ['licence'] }, gateReason: 'Needs a driving licence and 2,500' } },
  // The same castle cake as the garden party event.
  ch4_birthday: { party: { line: 'A birthday party at home, with a treasure hunt round the garden.' } },
}

const events = contentV4.events.map((e): EventDef => {
  const when = EVENT_WHEN[e.id]
  const line = EVENT_LINE[e.id]
  return { ...e, ...(when ? { when: { ...e.when, ...when } } : {}), ...(line ? { line } : {}) }
})

const decisions = contentV4.decisions.map((d): DecisionDef => {
  const when = DECISION_WHEN[d.id]
  const options = OPTION[d.id]
  return {
    ...d,
    ...(when ? { when: { ...d.when, ...when } } : {}),
    ...(options ? { options: d.options.map((o) => (options[o.id] ? { ...o, ...options[o.id] } : o)) } : {}),
  }
})

/**
 * The harness's trait gate (each trait moves an outcome by 5% to 25%) sat at its ceiling for three traits: over
 * 2,700 lives, v5's new draws (a gender for everyone) moved Lucky's years past 70 to 27%, Stubborn's to 27% and
 * Sharp's peak money to 34%, against 18%, 17% and 16% with the same rules and v4's draws. Each is eased toward the
 * middle of the band: Lucky to 65% of the usual risk before 80 (was 62%), Stubborn to 76% after 70 (was 70%), and
 * Sharp to 5% more income (was 10%). All 13 gates pass on v5 over 2,700 lives.
 */
const TRAIT_TILT: Record<string, PaperLivesCatalog['traits'][number]['tilt']> = {
  lucky: { kind: 'mortality', percent: 65, fromAge: 0, untilAge: 80 },
  stubborn: { kind: 'mortality', percent: 76, fromAge: 70, untilAge: 130 },
  sharp: { kind: 'income', percent: 105 },
}

export const contentV5: PaperLivesCatalog = {
  ...contentV4,
  version: 5,
  traits: contentV4.traits.map((t) => (TRAIT_TILT[t.id] ? { ...t, tilt: TRAIT_TILT[t.id]! } : t)),
  events,
  decisions,
  tuning: {
    ...contentV4.tuning,
    gendered: true,
    keepFamilyLines: true,
    livingParentLines: true,
    optionSeen: true,
    childrenNeedMarriage: true,
    // More of v4's childhood flags are kept for life, so a licence or a pair of glasses is not forgotten by sixty.
    maxFlags: 96,
  },
}
