import type { PaperLivesCatalog } from '../../sim/types'
import { contentV2 } from '../v2'
import { packAmbient, packDecisions } from './decisions'
import { packEvents } from './events'

/**
 * Paper Lives content v3 (2026-10-14), the first content pack: v2 plus about 190 events, 30 decisions and 30 quiet
 * lines, most of them for adult and senior life where years are many and repeats were highest.
 *
 * It also changes when a year's events happen (Barry: Age up felt like it might cost the year its stories). In v1 and
 * v2 about two events fell inside the year's two-hour minimum and one more trickled in afterwards, so ageing up at
 * the minimum gave up a third of the year. In v3 every event happens inside the minimum and the rest of the year is
 * quiet lines only, so Age up skips nothing but the quiet.
 */
export const contentV3: PaperLivesCatalog = {
  ...contentV2,
  version: 3,
  events: [...contentV2.events, ...packEvents],
  // Thirty more small decisions make the draw a third bigger, so major ones weigh twice as much as the rest
  // and families, homes and wills come up about as often as before.
  decisions: [...contentV2.decisions, ...packDecisions].map((d) => ({ ...d, weight: (d.weight ?? 1) * (d.major ? 2 : 1) })),
  ambient: [...contentV2.ambient, ...packAmbient],
  tuning: {
    ...contentV2.tuning,
    eventPercent: { child: 36, teen: 36, young: 36, adult: 35, senior: 33 },
    yearEndEventPercent: 0,
  },
}
