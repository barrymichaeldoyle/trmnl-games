import type { AnglerCounters, IdleAnglerCatalog } from '../sim/types'
import { contentV2 } from './v2'

/**
 * Idle Angler achievements (idle-angler.md "Achievements"), versioned like the content catalog: a release appends
 * families under a new version and never edits an existing id. Every predicate reads bounded angler state, so a
 * new achievement is earned retroactively at the next evaluation.
 */
/**
 * v2 (S6) appends the Flies family; v3 retires the Levels family with XP and levels (titles replace them); v4 (D162)
 * appends the full game's families, higher tiers for waters, rods, the logbook and epics, and the new species' tiers;
 * v5 appends Rosettes, an Open entered at each water.
 */
export const ACHIEVEMENTS_VERSION = 5

export type AchievementCategory = 'Fishing' | 'Logbook' | 'Trade' | 'Progress' | 'Species'

export type Predicate =
  | { readonly kind: 'counter'; readonly counter: keyof AnglerCounters; readonly atLeast: number }
  | { readonly kind: 'rod'; readonly atLeast: number }
  | { readonly kind: 'logbook'; readonly atLeast: number }
  | { readonly kind: 'waters'; readonly atLeast: number }
  | { readonly kind: 'first'; readonly speciesId: string }
  | { readonly kind: 'specimen'; readonly speciesId: string; readonly grams: number }
  | { readonly kind: 'flies'; readonly atLeast: number }
  /** v4: set bits in a bit-set counter (seasons or runs fished). */
  | { readonly kind: 'bits'; readonly counter: 'seasonsFished' | 'runsFished' | 'openWaters'; readonly atLeast: number }

export interface AchievementDef {
  readonly id: string
  readonly family: string
  readonly familyName: string
  readonly category: AchievementCategory
  readonly tier: number
  readonly name: string
  readonly blurb: string
  readonly predicate: Predicate
}

type Tier = readonly [atLeast: number, name: string, blurb: string]

function family(id: string, familyName: string, category: AchievementCategory, make: (atLeast: number) => Predicate, tiers: readonly Tier[]): AchievementDef[] {
  return tiers.map(([atLeast, name, blurb], index) => ({ id: `${id}_${index + 1}`, family: id, familyName, category, tier: index + 1, name, blurb, predicate: make(atLeast) }))
}

const counter = (name: keyof AnglerCounters) => (atLeast: number): Predicate => ({ kind: 'counter', counter: name, atLeast })

const FAMILIES: AchievementDef[] = [
  ...family('catches', 'Catches', 'Fishing', counter('fishCaught'), [
    [1, 'First Bite', 'Something on the end of the line.'],
    [10, 'Tight Lines', 'Ten fish on the float.'],
    [100, 'Regular on the Bank', 'A hundred fish from the bank.'],
    [1000, 'Old Hand', 'You can tie a knot in the dark.'],
    [10000, 'Legend of the Water', 'They name a swim after you.'],
  ]),
  ...family('big_ones', 'Big ones', 'Fishing', counter('heaviestGrams'), [
    [1000, 'A Kilo Fish', 'Two hands to hold it.'],
    [5000, 'Heavyweight', 'The rod hoops over.'],
    [10000, 'Net Bender', 'A new landing net is on the list.'],
    [20000, 'Monster of the Deep', 'Nobody at the pub believes you.'],
  ]),
  ...family('rare_catches', 'Rare catches', 'Fishing', counter('rareCaught'), [
    [1, 'Something Special', 'Not a fish you see every day.'],
    [10, 'Rare Form', 'Ten rare fish landed.'],
    [100, 'Collector', 'A hundred rare fish in the net.'],
  ]),
  ...family('epic_catches', 'Epic catches', 'Fishing', counter('epicCaught'), [
    [1, 'Once in a Season', 'The right bait, hour and weather, all at once.'],
    [3, 'Fisher of Legends', 'Three epic fish landed.'],
  ]),
  ...family('got_away', 'Got away', 'Fishing', counter('gotAway'), [
    [1, 'The One That Got Away', 'The line went slack.'],
    [10, 'Snapped Again', 'Ten fish lost to a snapped line.'],
    [50, 'Tall Tales', 'Fifty lost to a snapped line.'],
  ]),
  ...family('night_fishing', 'Night fishing', 'Fishing', counter('nightCatches'), [
    [1, 'After Dark', 'The lamp hisses. Something bites.'],
    [25, 'Night Owl', 'The flask is always full.'],
    [250, 'Moonlighter', 'Two hundred and fifty fish after dark.'],
  ]),
  ...family('released', 'Released', 'Fishing', counter('released'), [
    [1, 'Catch and Release', 'Back you go.'],
    [25, 'Gentle Hands', 'Wet hands, quick release.'],
    [250, 'Friend of the Fish', 'They might be the same ones.'],
  ]),
  ...family('logbook', 'Logbook', 'Logbook', (n) => ({ kind: 'logbook', atLeast: n }), [
    [5, 'Five in the Book', 'The pages start to fill.'],
    [10, 'Naturalist', 'You know a rudd from a roach.'],
    [20, 'Field Guide', 'Other anglers ask you what they caught.'],
    [30, 'Thirty in the Book', 'Thirty species in the logbook.'],
  ]),
  ...family('waters', 'Waters', 'Progress', (n) => ({ kind: 'waters', atLeast: n }), [
    [2, 'Down to the River', 'Waders on, into the current.'],
    [3, 'Salt Water', 'Fishing off the Harbour Pier.'],
  ]),
  ...family('rods', 'Rods', 'Progress', (n) => ({ kind: 'rod', atLeast: n }), [
    [2, 'Fibreglass', 'Lighter and stronger than the old cane.'],
    [3, 'Carbon Fibre', 'You can feel every nibble.'],
    [4, 'Beachcaster', 'Built for the biggest fish in the sea.'],
  ]),
  ...family('gold_earned', 'Coins earned', 'Trade', counter('goldEarned'), [
    [100, 'Pocket Money', 'Enough for a tub of worms or four.'],
    [1000, 'Market Stall', 'The fishmonger saves you a spot.'],
    [10000, 'Fishmonger', 'A van with your name on it.'],
    [100000, 'Fish Baron', 'A hundred thousand coins from fish.'],
  ]),
  ...family('sales', 'Sales', 'Trade', counter('fishSold'), [
    [1, 'First Sale', 'Fresh today.'],
    [25, 'Regular Supplier', 'They know your cooler.'],
    [250, 'Wholesale', 'Restaurants call ahead.'],
    [1000, 'Fish Market', 'A thousand fish sold.'],
  ]),
]

/** Two tiers per species: the first one caught, and a specimen over three quarters of the species' largest size. */
const SPECIES: AchievementDef[] = contentV2.species.flatMap((s) => [
  { id: `first_${s.id}`, family: `species_${s.id}`, familyName: s.name, category: 'Species' as const, tier: 1, name: `First ${s.name}`, blurb: `A ${s.name} in the logbook.`, predicate: { kind: 'first' as const, speciesId: s.id } },
  { id: `specimen_${s.id}`, family: `species_${s.id}`, familyName: s.name, category: 'Species' as const, tier: 2, name: `Specimen ${s.name}`, blurb: `A ${s.name} over ${Math.round(((s.maxGrams * 0.75) / 1000) * 10) / 10} kg.`, predicate: { kind: 'specimen' as const, speciesId: s.id, grams: Math.ceil(s.maxGrams * 0.75) } },
])

/** Version 2: the fly box (S6). Two full boxes is the top tier. */
const FLIES: AchievementDef[] = family('flies', 'Flies', 'Logbook', (n) => ({ kind: 'flies', atLeast: n }), [
  [1, 'First Fly', 'Pinned to your hat for luck.'],
  [6, 'Half a Box', 'Six patterns, all tied by hand.'],
  [12, 'Full Fly Box', 'Every pattern in its own little slot.'],
  [24, 'Second Box', 'One for the hat, one for the jacket.'],
])

/** A higher tier appended to an existing family under v4, with the id the family's next index would take. */
const more = (familyId: string, familyName: string, category: AchievementCategory, from: number, make: (atLeast: number) => Predicate, tiers: readonly Tier[]): AchievementDef[] =>
  tiers.map(([atLeast, name, blurb], index) => ({ id: `${familyId}_${from + index}`, family: familyId, familyName, category, tier: from + index, name, blurb, predicate: make(atLeast) }))
const bits = (name: 'seasonsFished' | 'runsFished' | 'openWaters') => (atLeast: number): Predicate => ({ kind: 'bits', counter: name, atLeast })

/** Version 4 (D162): the full game. */
const FULL: AchievementDef[] = [
  ...more('epic_catches', 'Epic catches', 'Fishing', 3, counter('epicCaught'), [[6, 'Every Epic', 'Golden, silver, spotted, ghostly, flat and gold again.']]),
  ...more('logbook', 'Logbook', 'Logbook', 5, (n) => ({ kind: 'logbook', atLeast: n }), [
    [40, 'Forty in the Book', 'You need a second notebook.'],
    [50, 'Fifty in the Book', 'The pages are soft from turning.'],
    [58, 'Every Fish in the Book', 'Every species at every water.'],
  ]),
  ...more('waters', 'Waters', 'Progress', 3, (n) => ({ kind: 'waters', atLeast: n }), [
    [4, 'Out in the Boat', 'Oars in the rowlocks on Heron Lake.'],
    [5, 'Off Shore', 'Out past the harbour wall.'],
    [6, 'Through the Ice', 'A hole cut in Frozen Tarn.'],
  ]),
  ...more('rods', 'Rods', 'Progress', 4, (n) => ({ kind: 'rod', atLeast: n }), [[5, 'Boat Rod', 'Short, stiff and made for monsters.']]),
  ...family('orders', 'Orders', 'Trade', counter('ordersFilled'), [
    [1, 'First Order', 'The fishmonger nods.'],
    [10, 'On the Slate', 'Your name chalked up every morning.'],
    [50, 'Trusted Supplier', 'The best fish go to you first.'],
    [250, 'Fishmonger\'s Friend', 'Two hundred and fifty orders filled.'],
  ]),
  ...family('deadbait', 'Deadbait', 'Fishing', counter('deadbaitCatches'), [
    [1, 'Bait and Wait', 'A predator on a small fish.'],
    [25, 'Pike Angler', 'Twenty-five fish on deadbait.'],
    [250, 'Apex Hunter', 'Two hundred and fifty on deadbait.'],
  ]),
  ...family('trophies', 'Trophies', 'Logbook', counter('trophiesMounted'), [
    [1, 'On the Wall', 'Glass eyes, proud fins.'],
    [6, 'A Full Wall', 'Six pegs, six fish.'],
    [24, 'The Trophy Room', 'Twenty-four fish mounted.'],
  ]),
  ...family('opens', 'Opens', 'Progress', counter('opensEntered'), [
    [1, 'Entered', 'A rosette for taking part.'],
    [10, 'Weekend Regular', 'Ten Opens fished.'],
    [52, 'Every Weekend', 'Fifty-two Opens fished.'],
  ]),
  ...family('medals', 'Medals', 'Progress', counter('medals'), [
    [1, 'On the Podium', 'A medal from a weekend Open.'],
    [5, 'Medal Collector', 'Five medals on the shelf.'],
    [25, 'Champion of the Waters', 'Twenty-five medals won.'],
  ]),
  ...family('seasons', 'Seasons', 'Fishing', bits('seasonsFished'), [[4, 'All Year Round', 'A fish in every season.']]),
  ...family('runs', 'Runs', 'Fishing', bits('runsFished'), [[4, 'Right Place, Right Week', 'A fish from every run.']]),
  // v5: a rosette from each water's weekend Open.
  ...family('rosettes', 'Rosettes', 'Progress', bits('openWaters'), [
    [3, 'Rosettes on the Line', 'Opens entered at three waters.'],
    [6, 'A Rosette from Every Water', 'An Open entered at every water, the ice and the open sea included.'],
  ]),
]

export const ACHIEVEMENTS: readonly AchievementDef[] = [...FAMILIES, ...SPECIES, ...FLIES, ...FULL]
export const ACHIEVEMENT_BY_ID: ReadonlyMap<string, AchievementDef> = new Map(ACHIEVEMENTS.map((a) => [a.id, a]))

/** The bounded state predicates read. */
export interface AchievementState {
  readonly rodTier: number
  readonly counters: AnglerCounters
  readonly logbook: Readonly<Record<string, { readonly count: number; readonly bestGrams: number }>>
  /** Flies collected from the device's weekly code; zero until the owner claims one. */
  readonly flies: number
}

export function measure(predicate: Predicate, state: AchievementState, content: IdleAnglerCatalog): { value: number; target: number } {
  switch (predicate.kind) {
    case 'counter':
      return { value: state.counters[predicate.counter] ?? 0, target: predicate.atLeast }
    case 'rod':
      return { value: state.rodTier, target: predicate.atLeast }
    case 'logbook':
      return { value: Object.keys(state.logbook).length, target: predicate.atLeast }
    case 'waters': {
      const waters = new Set(Object.keys(state.logbook).map((id) => content.species.find((s) => s.id === id)?.water).filter(Boolean))
      return { value: waters.size, target: predicate.atLeast }
    }
    case 'first':
      return { value: state.logbook[predicate.speciesId] ? 1 : 0, target: 1 }
    case 'specimen':
      return { value: state.logbook[predicate.speciesId]?.bestGrams ?? 0, target: predicate.grams }
    case 'flies':
      return { value: state.flies, target: predicate.atLeast }
    case 'bits': {
      let n = 0
      for (let b = state.counters[predicate.counter] ?? 0; b > 0; b >>= 1) n += b & 1
      return { value: n, target: predicate.atLeast }
    }
  }
}

export const satisfied = (def: AchievementDef, state: AchievementState, content: IdleAnglerCatalog) => {
  const { value, target } = measure(def.predicate, state, content)
  return value >= target
}

/** Achievements `after` satisfies that `before` did not. */
export function newlyUnlocked(before: AchievementState, after: AchievementState, content: IdleAnglerCatalog): AchievementDef[] {
  return ACHIEVEMENTS.filter((def) => satisfied(def, after, content) && !satisfied(def, before, content))
}

/** Every achievement the state satisfies, for an angler behind the catalog version. */
export function allSatisfied(state: AchievementState, content: IdleAnglerCatalog): AchievementDef[] {
  return ACHIEVEMENTS.filter((def) => satisfied(def, state, content))
}

export const needsFullPass = (evaluated: number | undefined) => (evaluated ?? 0) < ACHIEVEMENTS_VERSION

/** Each family's highest earned tier and progress to the next, for the companion. */
export function familyProgress(state: AchievementState, content: IdleAnglerCatalog, unlocked: ReadonlySet<string>) {
  const families = new Map<string, AchievementDef[]>()
  for (const def of ACHIEVEMENTS) families.set(def.family, [...(families.get(def.family) ?? []), def])
  return [...families.entries()].map(([id, tiers]) => {
    const earned = [...tiers].reverse().find((t) => unlocked.has(t.id)) ?? null
    const next = tiers.find((t) => !unlocked.has(t.id)) ?? null
    const goal = next ?? tiers.at(-1)!
    const { value, target } = measure(goal.predicate, state, content)
    return { family: id, name: tiers[0]!.familyName, category: tiers[0]!.category, tiers: tiers.length, earned, next, value, target }
  })
}
