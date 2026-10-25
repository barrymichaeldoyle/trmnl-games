import type { DeskCounters } from '../sim/types'

/**
 * Pixel Wars achievements (pixel-wars.md "Achievements"), versioned like the content catalog: a release appends
 * families under a new version and never edits an existing id. Every predicate reads bounded desk state.
 */
export const ACHIEVEMENTS_VERSION = 1

export type AchievementCategory = 'Painting' | 'Desks' | 'Seasons' | 'Standing'

export type Predicate = { readonly kind: 'counter'; readonly counter: keyof DeskCounters; readonly atLeast: number } | { readonly kind: 'level'; readonly atLeast: number }

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
  readonly counters: DeskCounters
  readonly level: number
}

type Tier = readonly [atLeast: number, name: string, blurb: string]

function family(id: string, familyName: string, category: AchievementCategory, make: (atLeast: number) => Predicate, tiers: readonly Tier[]): AchievementDef[] {
  return tiers.map(([atLeast, name, blurb], index) => ({ id: `${id}_${index + 1}`, family: id, familyName, category, tier: index + 1, name, blurb, predicate: make(atLeast) }))
}

const counter = (name: keyof DeskCounters) => (atLeast: number): Predicate => ({ kind: 'counter', counter: name, atLeast })

export const ACHIEVEMENTS: readonly AchievementDef[] = [
  ...family('painter', 'Painter', 'Painting', counter('cellsPainted'), [
    [10, 'Wet Ink', 'Ten cells painted.'],
    [100, 'Steady Hand', 'A hundred cells painted.'],
    [1000, 'Roller', 'A thousand cells painted.'],
    [10000, 'The Whole Wall', 'Ten thousand cells painted.'],
  ]),
  ...family('striker', 'Striker', 'Painting', counter('cellsFlipped'), [
    [1, 'First Blood', 'A cell taken from another faction.'],
    [25, 'Skirmisher', 'Twenty-five cells taken.'],
    [250, 'Front Line', 'Two hundred and fifty cells taken.'],
    [2500, 'Campaigner', 'Two and a half thousand cells taken.'],
  ]),
  ...family('desks_taken', 'Desks taken', 'Desks', counter('desksTaken'), [
    [1, 'On Their Screen', 'Your pattern on someone else’s desk.'],
    [10, 'Door to Door', 'Ten desks taken.'],
    [100, 'Landlord', 'A hundred desks taken.'],
  ]),
  ...family('liberator', 'Liberator', 'Desks', counter('desksLiberated'), [
    [1, 'Back Where It Belongs', 'A desk liberated.'],
    [10, 'Cavalry', 'Ten desks liberated.'],
    [50, 'The Relief', 'Fifty desks liberated.'],
  ]),
  ...family('held', 'Held', 'Desks', counter('deskFullHours'), [
    [24, 'A Full Day', 'Your desk full for twenty-four hours.'],
    [168, 'A Full Week', 'A hundred and sixty-eight hours.'],
    [720, 'Immovable', 'Seven hundred and twenty hours.'],
  ]),
  ...family('seasons', 'Seasons', 'Seasons', counter('seasonsPlayed'), [
    [1, 'First Print', 'A season finished.'],
    [4, 'A Month of Wars', 'Four seasons.'],
    [12, 'A Quarter', 'Twelve seasons.'],
    [52, 'The Year', 'Fifty-two seasons.'],
  ]),
  ...family('wins', 'Wins', 'Seasons', counter('seasonsWon'), [
    [1, 'Rosette', 'A season won with your faction.'],
    [3, 'Three Rosettes', 'Three seasons won.'],
    [10, 'Dynasty', 'Ten seasons won.'],
  ]),
  ...family('underdog', 'Underdog', 'Painting', counter('underdogFlips'), [
    [10, 'Punching Up', 'Ten cells taken from the leader while smallest.'],
    [100, 'Giant Killer', 'A hundred.'],
    [1000, 'The Mob', 'A thousand.'],
  ]),
  ...family('recruiter', 'Recruiter', 'Standing', counter('invitesPlaced'), [
    [1, 'A Neighbour', 'A friend’s desk beside yours.'],
    [5, 'The Row', 'Five desks placed by your link.'],
    [25, 'The Office', 'Twenty-five.'],
  ]),
  ...family('night_owl', 'Night owl', 'Standing', counter('ordersAtNight'), [
    [10, 'Late Shift', 'Ten orders resolved in the small hours.'],
    [100, 'Insomniac', 'A hundred.'],
  ]),
  ...family('levels', 'Levels', 'Standing', (n) => ({ kind: 'level', atLeast: n }), [
    [4, 'Level 4', 'Known on the map.'],
    [8, 'Level 8', 'A name people strike.'],
    [12, 'Level 12', 'Veteran.'],
    [16, 'Level 16', 'Warlord.'],
    [20, 'Level 20', 'The map remembers you.'],
  ]),
]

export function satisfied(state: AchievementState, p: Predicate): boolean {
  return p.kind === 'level' ? state.level >= p.atLeast : (state.counters[p.counter] ?? 0) >= p.atLeast
}

export const allSatisfied = (state: AchievementState): AchievementDef[] => ACHIEVEMENTS.filter((def) => satisfied(state, def.predicate))

export function newlyUnlocked(before: AchievementState, after: AchievementState): AchievementDef[] {
  return ACHIEVEMENTS.filter((def) => !satisfied(before, def.predicate) && satisfied(after, def.predicate))
}

/** A desk evaluated under an older catalog version gets one full pass. */
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

const valueOf = (state: AchievementState, p: Predicate): number => (p.kind === 'level' ? state.level : (state.counters[p.counter] ?? 0))

export function familyProgress(state: AchievementState, unlocked: ReadonlySet<string>): FamilyProgress[] {
  const families = new Map<string, AchievementDef[]>()
  for (const def of ACHIEVEMENTS) families.set(def.family, [...(families.get(def.family) ?? []), def])
  return [...families.entries()].map(([familyId, defs]) => {
    const earned = [...defs].reverse().find((d) => unlocked.has(d.id)) ?? null
    const next = defs.find((d) => !unlocked.has(d.id)) ?? null
    const first = defs[0]!
    return { family: familyId, name: first.familyName, category: first.category, tiers: defs.length, earned, next, value: valueOf(state, (next ?? first).predicate), target: next ? next.predicate.atLeast : null }
  })
}
