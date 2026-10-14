import type { PaperLivesCatalog } from '../../sim/types'
import { ambient } from './ambient'
import { childDecisions, teenDecisions, youngDecisions } from './decisions-early'
import { adultDecisions, seniorDecisions } from './decisions-later'
import { childEvents, infantEvents } from './events-early'
import { adultEvents } from './events-adult'
import { seniorEvents } from './events-senior'
import { teenEvents } from './events-teen'
import { youngEvents } from './events-young'
import { jobs } from './jobs'
import { traits } from './traits'
import { causes, epitaphs, hobbies, houses, lines, names, pets, tuning } from './world'

/** Paper Lives content v1 (paper-lives.md "Content"). Ids are stable; later versions append. */
export const contentV1: PaperLivesCatalog = {
  version: 1,
  traits,
  hobbies,
  pets,
  jobs,
  events: [...infantEvents, ...childEvents, ...teenEvents, ...youngEvents, ...adultEvents, ...seniorEvents],
  decisions: [...childDecisions, ...teenDecisions, ...youngDecisions, ...adultDecisions, ...seniorDecisions],
  ambient,
  causes,
  epitaphs,
  lines,
  names,
  houses,
  rarityWeights: { common: 700, uncommon: 230, rare: 60, remarkable: 10 },
  tuning,
}
