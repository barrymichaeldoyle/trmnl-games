import { contentV5 } from '../content/v5'
import { FIRST_LOG } from '../sim/starter'

/**
 * D200: every fixed English line Idle Angler writes or sends whole: scenery, runs, arrivals and returns, the first log,
 * unlocks and the Dock's feature names. Each language's `lines` has exactly these keys (tests/idle-angler/i18n.test.ts).
 */
export const FIXED_LINES: readonly string[] = [
  ...Object.values(contentV5.ambient).flat(),
  ...(contentV5.runs ?? []).map((run) => run.line),
  ...contentV5.waters.flatMap((water) => (water.arrival ? [water.arrival] : [])),
  'The ice is going out. You walk back to Heron Lake.',
  'The charter ties up. You walk back along the Harbour Pier.',
  FIRST_LOG,
  'You set up at the end of the Harbour Pier.',
  'Unlocked: rod and cooler upgrades in the tackle shop.',
  'Unlocked: fishmonger orders. Three are on the slate.',
  "Unlocked: the trophy wall. Fish at 60% of their species' top weight can be mounted from the Cooler.",
  'Unlocked: the weekend Opens at every water.',
  'Unlocked: small fish can go back on the hook as deadbait.',
  'Rod and cooler upgrades',
  'Fishmonger orders',
  'Weekend Opens',
  'The trophy wall',
  'Deadbait',
  "Catch a fish at 60% of its species' top weight, then mount it from the Cooler.",
]
