import type { DecisionDef, PaperLivesCatalog } from '../../sim/types'
import { contentV3 } from '../v3'
import { followUps, newDecisions, OPTION_FLAGS, OPTION_LINES } from './followups'

/**
 * Paper Lives content v4 (2026-10-15): choices that come back. Barry found a life dry, especially as a child. Before
 * v4, only ten options in the game left a flag behind, and five events read one, so what a child chose was forgotten
 * as soon as the year ended. Now:
 *
 * - Every childhood and teen option that does something leaves a flag (`OPTION_FLAGS`), and fifty-six follow-up
 *   events pay those flags off in later years: the art club painting goes up in the library, and the sweets bring a
 *   filling. A follow-up is drawn first while unseen, 60% of the time (`followUpPercent`), so it lands within a year
 *   or two rather than by luck.
 * - Eight more childhood and six more teen decisions, each with a follow-up, and childhood years open with a decision
 *   85% of the time (teens 80%) instead of two years in three.
 * - The toy shop sale is offered only to a child who saved, so the jar is what buys the kite.
 * - A few default lines that read as nothing happening say something.
 * - Two trait nudges for the harness's 5% to 25% gate: Tidy softens health losses to 70% (was 75%), and Lucky's
 *   risk before 80 is 62% of the usual (was 60%), which v3 already overshot.
 */
function withPayoffs(d: DecisionDef): DecisionDef {
  const flags = OPTION_FLAGS[d.id]
  const lines = OPTION_LINES[d.id]
  const options = flags || lines ? d.options.map((o) => ({ ...o, ...(lines?.[o.id] ? { line: lines[o.id]! } : {}), ...(flags?.[o.id] ? { effects: { ...o.effects, flag: flags[o.id]! } } : {}) })) : d.options
  const when = d.id === 'ch3_toy_sale' ? { ...d.when, flags: ['v4_saved_jar'] } : d.when
  return { ...d, options, ...(when ? { when } : {}) }
}

export const contentV4: PaperLivesCatalog = {
  ...contentV3,
  version: 4,
  events: [...contentV3.events, ...followUps],
  // The harness's trait gate wants every trait to move an outcome by 5% to 25%. Childhood's extra health thinned Tidy's
  // edge at 60 to the floor, and Lucky already sat just over the ceiling in v3 (25.2% more years past 70 over 2,700 lives).
  traits: contentV3.traits.map((t) => (t.id === 'tidy' ? { ...t, tilt: { kind: 'health', percent: 70 } } : t.id === 'lucky' ? { ...t, tilt: { kind: 'mortality', percent: 62, fromAge: 0, untilAge: 80 } } : t)),
  decisions: [...contentV3.decisions.map(withPayoffs), ...newDecisions],
  tuning: {
    ...contentV3.tuning,
    followUpPercent: 60,
    decisionPercentByStage: { child: 85, teen: 80 },
  },
}
