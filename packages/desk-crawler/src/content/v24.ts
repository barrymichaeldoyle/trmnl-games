import type { ContentCatalog, StandoffRule } from '../sim/core/types'
import { contentV23 } from './v23'

/*
 * Content catalog v24 (D163): dug-in elites (P42). From level 12, on the
 * Cafeteria Depths or deeper, about one elite in eight digs in: its HP carries
 * over from tick to tick and the hero comes back to it, six rounds a tick. It
 * hits hard, and the hero fights on to half its stance's rest line before it
 * steps back, so a standoff can end in a knockout. The fall pays the elite's XP
 * and gold many times over and a rare or epic find from the floor. It leaves
 * after four hours, on a knockout, on travel or when the player walks away.
 * Tuned by tools/balance/standoffs.ts to about four wins in five.
 * Everything else is v23.
 */
const standoff: StandoffRule = {
  digInPct: 12,
  minLevel: 12,
  minBiomeTier: 3,
  hpMultiplierPct: 1000,
  attackPct: 180,
  stepBackPct: 50,
  durationTicks: 16,
  xpMultiplier: 12,
  goldMultiplier: 8,
  narrative: {
    dugIn: {
      cafeteria_depths: ['An elite {monster} has dug in behind the dishwasher.', 'An elite {monster} has dug in under the salad bar.', 'An elite {monster} has dug in inside the walk-in fridge.'],
      archive: ['An elite {monster} has dug in behind the filing cabinets.', 'An elite {monster} has dug in among the box files.', 'An elite {monster} has dug in at the end of the rolling shelves.'],
      parking_garage: ['An elite {monster} has dug in behind the ticket barrier.', 'An elite {monster} has dug in beside the pay machine.', 'An elite {monster} has dug in on the bottom level.'],
    },
    won: {
      cafeteria_depths: ['The elite {monster} is in the bin for good.', 'Scraped the elite {monster} off the floor at last.', 'The elite {monster} is cleared away for good.'],
      archive: ['The elite {monster} is filed for good.', 'Shelved the elite {monster} at last.', 'The elite {monster} is archived for good.'],
      parking_garage: ['The elite {monster} is towed away at last.', 'Clamped the elite {monster} for good.', 'The elite {monster} has left the car park for good.'],
    },
    fighting: ['Still at the elite {monster}.', 'Back at the elite {monster}.', 'Another round with the elite {monster}.'],
    slipped: ['The elite {monster} slipped away.', 'The elite {monster} packed up and left.', 'The elite {monster} gave up and left.'],
    dugInCompact: 'An elite {monster} dug in.',
    fightingCompact: 'Still at the elite {monster}.',
    wonCompact: 'Beat the elite {monster}.',
    slippedCompact: 'The elite {monster} left.',
    waiting: 'The elite {monster} is waiting.',
  },
}

export const contentV24: ContentCatalog = {
  ...contentV23,
  contentVersion: 'v24',
  standoff,
  career: {
    rungs: [
      ...contentV23.career!.rungs,
      { id: 'first_standoff', title: 'Beat an elite that dug in', blurb: 'From level 12, on the Cafeteria Depths or deeper, an elite sometimes digs in and takes a few adventures to beat.', predicate: { kind: 'counter', counter: 'standoffsWon', atLeast: 1 }, gold: 200 },
    ],
  },
}
