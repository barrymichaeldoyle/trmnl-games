import type { CatalogueEntry, LittlePlotCatalog, PlotCounters } from '../sim/types'
import { contentV1 } from './v1'

/**
 * Little Plot achievements (little-plot.md "Achievements"), versioned like the content catalog: a release appends
 * families under a new version and never edits an existing id. Every predicate reads bounded plot state, so a new
 * achievement is earned retroactively at the next evaluation.
 */
export const ACHIEVEMENTS_VERSION = 1

export type AchievementCategory = 'Growing' | 'Catalogue' | 'Garden' | 'Visitors' | 'Kinds'

export type Predicate =
  | { readonly kind: 'counter'; readonly counter: keyof PlotCounters; readonly atLeast: number }
  | { readonly kind: 'kinds'; readonly atLeast: number }
  | { readonly kind: 'beds'; readonly atLeast: number }
  | { readonly kind: 'level'; readonly atLeast: number }
  | { readonly kind: 'bits'; readonly counter: 'seasonsGrown'; readonly atLeast: number }
  | { readonly kind: 'flowers'; readonly atLeast: number }
  | { readonly kind: 'grown'; readonly kindId: string; readonly atLeast: number }

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

export interface AchievementState {
  readonly counters: PlotCounters
  readonly catalogue: Readonly<Record<string, CatalogueEntry>>
  readonly level: number
  readonly beds: number
  readonly flowers: number
}

type Tier = readonly [atLeast: number, name: string, blurb: string]

function family(id: string, familyName: string, category: AchievementCategory, make: (atLeast: number) => Predicate, tiers: readonly Tier[]): AchievementDef[] {
  return tiers.map(([atLeast, name, blurb], index) => ({ id: `${id}_${index + 1}`, family: id, familyName, category, tier: index + 1, name, blurb, predicate: make(atLeast) }))
}

const counter = (name: keyof PlotCounters) => (atLeast: number): Predicate => ({ kind: 'counter', counter: name, atLeast })
const popcount = (bits: number) => {
  let n = 0
  for (let b = bits; b > 0; b >>= 1) n += b & 1
  return n
}

const FAMILIES: AchievementDef[] = [
  ...family('harvests', 'Harvests', 'Growing', counter('harvests'), [
    [1, 'First Pick', 'Something off your own plot.'],
    [10, 'Trug Full', 'Ten plants picked.'],
    [100, 'Market Garden', 'A hundred plants picked.'],
    [1000, 'Old Hands', 'A thousand picked. The knees know.'],
  ]),
  ...family('catalogue', 'Catalogue', 'Catalogue', (n) => ({ kind: 'kinds', atLeast: n }), [
    [4, 'The Starters', 'All four of the first packet.'],
    [10, 'Ten in the Book', 'Ten kinds grown.'],
    [20, 'Keen Gardener', 'Twenty kinds grown.'],
    [30, 'Plantswoman', 'Thirty kinds grown.'],
    [36, 'The Whole Catalogue', 'Every kind there is, for now.'],
  ]),
  ...family('crosses', 'Crosses', 'Catalogue', counter('crossesFound'), [
    [1, 'Something New', 'A seed nobody sold you.'],
    [5, 'Breeder', 'Five crosses found.'],
    [15, 'Hybridist', 'Fifteen crosses found.'],
  ]),
  ...family('epics', 'Epics', 'Catalogue', counter('epicsFound'), [
    [1, 'Once in a Garden', 'An epic plant, grown from two rares.'],
    [4, 'All Four', 'Every epic in the catalogue.'],
  ]),
  ...family('gnomes_caught', 'Gnomes caught', 'Visitors', counter('gnomesCaught'), [
    [1, 'Got One', 'A furious gnome in the trap.'],
    [10, 'Gnome Warden', 'Ten gnomes caught and let go.'],
    [50, 'They Know Your Name', 'Fifty gnomes caught.'],
  ]),
  ...family('seen_off', 'Seen off', 'Visitors', counter('pestsDeterred'), [
    [10, 'Good Fence', 'Ten pests turned back.'],
    [100, 'Fortress', 'A hundred turned back.'],
    [1000, 'Nothing Gets In', 'A thousand turned back.'],
  ]),
  ...family('night_garden', 'Night garden', 'Growing', counter('nightRipenings'), [
    [1, 'After Dark', 'Something ripened in the night.'],
    [25, 'Moth Hour', 'Twenty-five night ripenings.'],
    [250, 'Night Shift', 'Two hundred and fifty.'],
  ]),
  ...family('rain', 'Rain', 'Growing', counter('rainWateredTicks'), [
    [100, 'Free Water', 'A hundred rainy quarter-hours.'],
    [1000, 'Wet Summer', 'A thousand.'],
  ]),
  ...family('gold_earned', 'Coins earned', 'Garden', counter('goldEarned'), [
    [100, 'Pocket Money', 'Enough for a packet of seeds.'],
    [1000, 'Stall at the Gate', 'A thousand coins from the plot.'],
    [10000, 'Nursery', 'Ten thousand coins.'],
    [100000, 'Estate', 'A hundred thousand coins.'],
  ]),
  ...family('waterings', 'Waterings', 'Growing', counter('waterings'), [
    [1, 'Tin Can', 'First time round with the can.'],
    [25, 'Regular', 'Twenty-five waterings.'],
    [250, 'Hose Reel', 'Two hundred and fifty.'],
  ]),
  ...family('levels', 'Levels', 'Garden', (n) => ({ kind: 'level', atLeast: n }), [
    [4, 'Level 4', 'The shed is open.'],
    [8, 'Level 8', 'A proper plot.'],
    [12, 'Level 12', 'The neighbours ask for cuttings.'],
    [16, 'Level 16', 'Your plot is on the map.'],
    [20, 'Level 20', 'Open gardens, by appointment.'],
  ]),
  ...family('beds', 'Beds', 'Garden', (n) => ({ kind: 'beds', atLeast: n }), [
    [6, 'Six Beds', 'Room for a pair or two.'],
    [9, 'Nine Beds', 'Three rows.'],
    [12, 'Twelve Beds', 'The biggest plot there is.'],
  ]),
  ...family('seasons', 'Seasons', 'Growing', (n) => ({ kind: 'bits', counter: 'seasonsGrown', atLeast: n }), [[4, 'A Full Year', 'Something ripened in every season.']]),
  ...family('visitors', 'Visitors', 'Visitors', counter('gnomesHosted'), [
    [1, 'A Gnome From Next Door', "Another garden's gnome came by."],
    [10, 'On the Gnome Map', 'Ten visits, either way.'],
    [100, 'Gnome Crossroads', 'A hundred visits.'],
  ]),
  ...family('cuttings', 'Cuttings', 'Visitors', counter('cuttingsSent'), [
    [1, 'Here, Have One', 'A seed sent to a friend.'],
    [10, 'Generous', 'Ten cuttings sent.'],
  ]),
  ...family('flowers', 'Pressed flowers', 'Garden', (n) => ({ kind: 'flowers', atLeast: n }), [
    [1, 'First Pressing', 'A flower from the device, pressed flat.'],
    [6, 'Half a Book', 'Six pressed flowers.'],
    [12, 'A Book of Flowers', 'Twelve pressed flowers.'],
    [24, 'The Whole Set', 'Every pressed flower there is.'],
  ]),
]

/** Two tiers per kind: the first one grown, and ten grown. In catalog order, so rarer kinds come last. */
const KINDS: AchievementDef[] = contentV1.kinds.flatMap((k) => [
  { id: `first_${k.id}`, family: `kind_${k.id}`, familyName: k.name, category: 'Kinds' as const, tier: 1, name: `First ${k.name}`, blurb: `A ${k.name} in the catalogue.`, predicate: { kind: 'grown' as const, kindId: k.id, atLeast: 1 } },
  { id: `ten_${k.id}`, family: `kind_${k.id}`, familyName: k.name, category: 'Kinds' as const, tier: 2, name: `Ten ${k.name}`, blurb: `Ten ${k.name} grown.`, predicate: { kind: 'grown' as const, kindId: k.id, atLeast: 10 } },
])

export const ACHIEVEMENTS: readonly AchievementDef[] = [...FAMILIES, ...KINDS]

export function satisfied(state: AchievementState, p: Predicate): boolean {
  switch (p.kind) {
    case 'counter':
      return (state.counters[p.counter] ?? 0) >= p.atLeast
    case 'kinds':
      return Object.keys(state.catalogue).length >= p.atLeast
    case 'beds':
      return state.beds >= p.atLeast
    case 'level':
      return state.level >= p.atLeast
    case 'bits':
      return popcount(state.counters[p.counter]) >= p.atLeast
    case 'flowers':
      return state.flowers >= p.atLeast
    case 'grown':
      return (state.catalogue[p.kindId]?.count ?? 0) >= p.atLeast
  }
}

export const allSatisfied = (state: AchievementState): AchievementDef[] => ACHIEVEMENTS.filter((def) => satisfied(state, def.predicate))

export function newlyUnlocked(before: AchievementState, after: AchievementState): AchievementDef[] {
  return ACHIEVEMENTS.filter((def) => !satisfied(before, def.predicate) && satisfied(after, def.predicate))
}

/** A plot evaluated under an older catalog version gets one full pass. */
export const needsFullPass = (version: number | undefined): boolean => version === undefined || version < ACHIEVEMENTS_VERSION

export interface FamilyProgress {
  readonly family: string
  readonly name: string
  readonly category: AchievementCategory
  readonly tiers: number
  readonly earned: AchievementDef | null
  readonly next: AchievementDef | null
  readonly value: number
  readonly target: number | null
}

function valueOf(state: AchievementState, p: Predicate): number {
  switch (p.kind) {
    case 'counter':
      return state.counters[p.counter] ?? 0
    case 'kinds':
      return Object.keys(state.catalogue).length
    case 'beds':
      return state.beds
    case 'level':
      return state.level
    case 'bits':
      return popcount(state.counters[p.counter])
    case 'flowers':
      return state.flowers
    case 'grown':
      return state.catalogue[p.kindId]?.count ?? 0
  }
}

export function familyProgress(state: AchievementState, unlocked: ReadonlySet<string>, content: LittlePlotCatalog = contentV1): FamilyProgress[] {
  const families = new Map<string, AchievementDef[]>()
  for (const def of ACHIEVEMENTS) families.set(def.family, [...(families.get(def.family) ?? []), def])
  return [...families.entries()].map(([familyId, defs]) => {
    const earned = [...defs].reverse().find((d) => unlocked.has(d.id)) ?? null
    const next = defs.find((d) => !unlocked.has(d.id)) ?? null
    const first = defs[0]!
    const name = first.category === 'Kinds' ? (content.kinds.find((k) => `kind_${k.id}` === familyId)?.name ?? first.familyName) : first.familyName
    return { family: familyId, name, category: first.category, tiers: defs.length, earned, next, value: valueOf(state, (next ?? first).predicate), target: next ? next.predicate.atLeast : null }
  })
}
