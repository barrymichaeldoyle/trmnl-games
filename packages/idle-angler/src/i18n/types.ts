import type { BaitClass, Season, TimeBand, WaterId, Weather } from '../sim/types'

/**
 * D200: Idle Angler in another language. The simulator, catalogs and stored log lines stay English; a language is
 * applied when something is shown, as Desk Crawler's dictionaries are (D169, D193). Names are looked up by id, and a
 * stored line is parsed back into its parts (`story.ts`) and told again by the language's line functions, so every
 * line already written translates too. A line that matches nothing stays English.
 *
 * Phrasing avoids agreeing with a fish's grammatical gender wherever it can: a fish appears as `a` (with its
 * indefinite article, "un barbeau", "eine Barbe") or `name` (the bare name, as a label), and sentences are built so
 * neither needs a participle to agree.
 */
export interface FishName {
  /** The bare name as a label or list entry: "Barbeau", "Barbe", "Brzana". */
  readonly name: string
  /** With the indefinite article, lower case, for prose: "un barbeau", "eine Barbe", "brzana". */
  readonly a: string
}

export interface WaterName {
  /** The name as a label: "Étang du moulin". */
  readonly name: string
  /** Where the angler is: "à l'Étang du moulin", "am Mühlteich". */
  readonly at: string
  /** Where the angler heads: "vers l'Étang du moulin", "zum Mühlteich". */
  readonly to: string
  /** As the subject of a sentence: "l'Étang du moulin", "der Mühlteich". */
  readonly the: string
  /** Belonging to it, as in "the Open of" or "three fish from": "de l'Étang du moulin", "vom Mühlteich". */
  readonly of: string
}

export interface BaitName {
  /** The bait as a label: "Asticots". */
  readonly name: string
  /** What a fish took, as the catch line puts it: "aux asticots", "die Maden", "na białe robaki". */
  readonly took: string
}

export type DeviceLabel =
  | 'fly'
  | 'fly_code'
  | 'last_12_hours'
  | 'released'
  | 'newest_catch'
  | 'goal'
  | 'back_soon'
  | 'finish_setup'
  | 'save_plugin'
  | 'ready'

export interface IaLanguage {
  readonly species: Readonly<Record<string, FishName>>
  readonly waters: Readonly<Record<WaterId, WaterName>>
  readonly baits: Readonly<Record<BaitClass, BaitName>>
  /** What a fish took when there was no bait: "à l'hameçon nu". */
  readonly bareHook: BaitName
  readonly rods: Readonly<Record<string, string>>
  readonly coolers: Readonly<Record<string, string>>
  readonly access: Readonly<Record<string, string>>
  readonly titles: Readonly<Record<string, string>>
  /** P45: rank names at a water, by `WATER_RANKS` id, and the label that puts one at a water ("Experte am Mühlteich"). */
  readonly waterRanks: Readonly<Record<string, string>>
  readonly waterRank: (rank: string, water: WaterName) => string
  readonly flies: Readonly<Record<string, string>>
  readonly seasons: Readonly<Record<Season, string>>
  /** Time of day as a label ("Dusk") and in a catch line ("au crépuscule"). */
  readonly bands: Readonly<Record<TimeBand, { readonly name: string; readonly phrase: string }>>
  readonly weather: Readonly<Record<Weather, string>>
  readonly rarity: Readonly<Record<'common' | 'uncommon' | 'rare' | 'epic', string>>
  /** Fixed lines, keyed by their English: scenery, runs, arrivals, unlocks and other whole sentences. */
  readonly lines: Readonly<Record<string, string>>
  /** Goal titles by goal id; a goal past the ladder is `logSpecies(n)`. */
  readonly goals: Readonly<Record<string, string>>
  readonly achievements: Readonly<Record<string, readonly [name: string, blurb: string]>>
  readonly achievementFamilies: Readonly<Record<string, string>>
  readonly achievementCategories: Readonly<Record<'Fishing' | 'Logbook' | 'Trade' | 'Progress' | 'Species', string>>
  /** The two achievements every species has, built from its name. */
  readonly speciesAchievement: {
    readonly first: (fish: FishName) => readonly [name: string, blurb: string]
    readonly specimen: (fish: FishName, kg: string) => readonly [name: string, blurb: string]
  }
  /** Lines built from parts. Weights arrive formatted for the language ("1,9 kg"). */
  readonly tell: {
    readonly caught: (fish: FishName, weight: string, bait: BaitName, band: string) => string
    readonly released: (fish: FishName, weight: string) => string
    readonly gotAway: (bait: BaitName) => string
    readonly personalBest: string
    readonly newSpecies: (fish: FishName) => string
    readonly baitOut: (bait: BaitName) => string
    readonly newTitle: (title: string, species: number) => string
    /** P45: a new rank at a water, its label from `waterRank`. */
    readonly newWaterRank: (label: string, logged: number, total: number) => string
    readonly waterOpen: (logged: number, from: WaterName, water: WaterName, pass: string | null) => string
    readonly settledAt: (water: WaterName) => string
    readonly goalReached: (goal: string, next: string) => string
    readonly logSpecies: (n: number) => string
    readonly achievement: (name: string) => string
    readonly achievements: (n: number, names: string) => string
    readonly enteredOpen: (fish: FishName, water: WaterName, weight: string) => string
    readonly medal: (place: 0 | 1 | 2, fish: FishName, water: WaterName, weight: string, prize: number) => string
    readonly sold: (n: number, coins: number) => string
    readonly bought: (item: string) => string
    readonly boughtBait: (tubs: number, bait: BaitName) => string
    readonly baitOnHook: (bait: BaitName) => string
    readonly packingUp: (water: WaterName) => string
    readonly claimed: (coins: number, goal: string) => string
    readonly handedOver: (count: number, fish: readonly FishName[], coins: number) => string
    readonly swapOrder: string
    readonly toDeadbait: (fish: FishName, weight: string) => string
    readonly mounted: (fish: FishName, weight: string) => string
    readonly pegs: (n: number) => string
    readonly charter: (casts: number) => string
    readonly paused: string
    readonly resumed: string
  }
  /** The fishmonger's slate and its hints. */
  readonly orders: {
    readonly species: (count: number, fish: FishName) => string
    readonly weight: (count: number, weight: string) => string
    readonly water: (count: number, water: WaterName) => string
    readonly time: (count: number, bands: string) => string
    readonly rarity: (count: number, rarity: string) => string
    readonly or: string
    readonly hint: (water: WaterName, baits: string, bands: string | null, weather: string | null) => string
  }
  /** What the TRMNL screen says outside the stories. */
  readonly device: {
    readonly casting: (water: WaterName) => string
    readonly heading: (water: WaterName) => string
    readonly paused: string
    readonly notSetUp: string
    readonly waitingForSave: string
    readonly maintenance: string
    readonly signIn: string
    readonly serviceCheck: string
    readonly delayed: string
    readonly coolerFull: string
    readonly outOf: (bait: string) => string
    readonly bareHook: string
    readonly goalWaiting: (count: number, coins: number) => string
    readonly fish: (n: number) => string
    readonly best: (weight: string, fish: string) => string
    readonly gotAway: (n: number) => string
    readonly thisWeek: string
    readonly noFishYet: string
    readonly yourBest: (weight: string) => string
    readonly rankBest: (rank: number, weight: string) => string
    readonly labels: Readonly<Record<DeviceLabel, string>>
  }
}
