/**
 * Idle Angler pure-core types (idle-angler.md "Rules"). Weights are whole grams and
 * every multiplier is a whole percent, so the core never depends on float
 * rounding beyond the PRNG's own documented draws.
 */

export type WaterId = 'millpond' | 'river_bend' | 'harbour_pier' | 'heron_lake' | 'deep_sea' | 'frozen_tarn'
export type BaitClass = 'worms' | 'bread' | 'maggots' | 'spinner' | 'ragworm' | 'strip' | 'boilies' | 'deadbait'
export type TimeBand = 'dawn' | 'day' | 'dusk' | 'night'
export type Weather = 'clear' | 'overcast' | 'rain' | 'wind' | 'fog'
export type Rarity = 'common' | 'uncommon' | 'rare' | 'epic'
export type AccessId = 'waders' | 'pier_permit' | 'rowing_boat' | 'ice_auger'
/** D162: the world's season, one a week on a four-week fishing year (idle-angler-full.md "Seasons and runs"). */
export type Season = 'spring' | 'summer' | 'autumn' | 'winter'
export type StreamName = 'bite' | 'species' | 'size' | 'narrative' | 'orders'
/** `orders` (content v2) draws only at an order refill; v1 never reads it. */
export type StreamSeeds = Readonly<Record<Exclude<StreamName, 'orders'>, number>> & { readonly orders?: number }

export interface SpeciesDef {
  readonly id: string
  readonly name: string
  readonly water: WaterId
  readonly rarity: Rarity
  /** Draw weight overriding the rarity's, for a species whose window is unusually wide or narrow. */
  readonly weight?: number
  readonly minGrams: number
  readonly maxGrams: number
  /** Bait classes the species takes; `anyBait` also takes a bare hook. */
  readonly baits: readonly BaitClass[]
  readonly anyBait?: true
  /** Time bands the species feeds in; absent means always. */
  readonly times?: readonly TimeBand[]
  /** Weather the species needs; absent means any. */
  readonly weather?: readonly Weather[]
  /** Base sale price in gold; a fish sells for between this and double it by weight. */
  readonly price: number
  /** v2: seasons the species feeds in; absent means every season. */
  readonly seasons?: readonly Season[]
  /** v2: a small fish that can go back on the hook as deadbait. */
  readonly baitFish?: true
}

export interface WaterDef {
  readonly id: WaterId
  readonly name: string
  /** Short name for device lines ("the Millpond"). */
  readonly the: string
  /** Species of another water the logbook needs before this one opens; absent for the starting water. */
  readonly opensAfter?: { readonly water: WaterId; readonly species: number }
  readonly access?: AccessId
  /** Chance a cast gets a bite before multipliers, in permille. */
  readonly biteBasePermille: number
  readonly baits: readonly BaitClass[]
  /** Six-hour forecast weights. */
  readonly weather: ReadonlyArray<readonly [Weather, number]>
  readonly timePercent: Readonly<Record<TimeBand, number>>
  readonly weatherPercent: Readonly<Record<Weather, number>>
  /** v2: bite chance by the world's season, a whole percent; absent means 100 in every season. */
  readonly seasonPercent?: Readonly<Record<Season, number>>
  /** v2: the six-hour forecast weights by season, replacing `weather` in that season. */
  readonly seasonWeather?: Readonly<Partial<Record<Season, ReadonlyArray<readonly [Weather, number]>>>>
  /** v2: the only seasons the water can be fished (Frozen Tarn); an angler there when it closes walks to `returnsTo`. */
  readonly openIn?: readonly Season[]
  /** v2: where the angler goes when the water closes or a charter ticket runs out. */
  readonly returnsTo?: WaterId
  /** v2: the water is fished on a charter ticket's casts rather than a permanent access item. */
  readonly charter?: true
  /** v2: the story line on arriving, replacing the bank line. */
  readonly arrival?: string
}

export interface RodDef {
  readonly tier: number
  readonly id: string
  readonly name: string
  readonly limitGrams: number
  /** Added to the bite chance as a percent of itself. */
  readonly biteBonusPercent: number
  readonly price: number
}

export interface BaitDef {
  readonly class: BaitClass
  readonly name: string
  /** As it reads in a story: "took the bread". */
  readonly the: string
  /** Bites one tub lasts (a bite uses one unit). */
  readonly castsPerTub: number
  readonly price: number
}

export interface CoolerDef {
  readonly tier: number
  readonly id: string
  readonly name: string
  readonly capacity: number
  readonly price: number
}

export interface AccessDef {
  readonly id: AccessId
  readonly name: string
  readonly water: WaterId
  readonly price: number
}

export interface IdleAnglerCatalog {
  readonly contentVersion: string
  readonly waters: readonly WaterDef[]
  readonly species: readonly SpeciesDef[]
  readonly rods: readonly RodDef[]
  readonly baits: readonly BaitDef[]
  readonly coolers: readonly CoolerDef[]
  readonly access: readonly AccessDef[]
  /** Draw weight per rarity before filtering, per thousand. */
  readonly rarityWeights: Readonly<Record<Rarity, number>>
  /** A bare hook's bite chance as a percent of a baited one. */
  readonly bareHookPercent: number
  /** Most units of one bait an angler may hold (a few days of bites). */
  readonly baitCap: number
  /** A quiet tick writes an ambient line every this many quiet ticks. */
  readonly ambientEvery: number
  /** Ambient lines per water. */
  readonly ambient: Readonly<Partial<Record<WaterId, readonly string[]>>>
  /** Local-hour boundaries: dawn starts, day starts, dusk starts, night starts. */
  readonly bands: { readonly dawn: number; readonly day: number; readonly dusk: number; readonly night: number }
  /** v2 (D162): the rules below exist only in content v2 and later; v1 has none and replays unchanged. */
  readonly seasons?: SeasonsRule
  readonly runs?: readonly RunDef[]
  readonly deadbait?: DeadbaitRule
  readonly charterTicket?: CharterRule
  readonly orders?: OrdersRule
  readonly goals?: readonly GoalDef[]
  /** v3: a reached goal sets its coins aside for the Claim button instead of paying them on the spot (Desk Crawler's D129). */
  readonly claimGoals?: boolean
  /** v4 (issue #8): a reached goal moves the pointer one goal on, so a later goal already met is reached, logged and claimable at the next evaluation instead of passed over unpaid. */
  readonly stepGoals?: boolean
  /** v5 (D199): a new angler starts on the first goal rather than waiting for its first evaluation to backfill one, so that goal's guarantee and reward apply from the first cast. */
  readonly starterGoal?: boolean
  /** v6 (P45): a species that lifts the angler's rank at its water (titles.ts `WATER_RANKS`) writes a milestone story. */
  readonly waterRanks?: boolean
  /** Species logged at which each feature opens. */
  readonly unlocks?: Readonly<Record<FeatureId, number>>
  readonly opens?: OpensRule
  readonly trophies?: TrophiesRule
  /** Most units of a bait class held, where it differs from `baitCap` (deadbait). */
  readonly baitCaps?: Readonly<Partial<Record<BaitClass, number>>>
}

/** The fishing year: the fly code's week (Monday 00:00 UTC) plus `offsetWeeks`, modulo four, in `order`. */
export interface SeasonsRule {
  readonly order: readonly [Season, Season, Season, Season]
  readonly offsetWeeks: number
}

/** A run: four days (Monday to Thursday UTC) of its season when one species is in at one water. */
export interface RunDef {
  readonly id: string
  readonly season: Season
  readonly water: WaterId
  readonly species: string
  /** Draw weight multiplier while the run is on. */
  readonly weightPercent: number
  /** The run lifts the species' weather requirement (the salmon run needs no rain). */
  readonly anyWeather?: true
  /** First line of the run, written on its first cast at the water. */
  readonly line: string
}

export interface DeadbaitRule {
  readonly unitsPerFish: number
  /** Bite chance with deadbait on, as a percent of a matched bait's. */
  readonly bitePercent: number
}

export interface CharterRule {
  readonly water: WaterId
  readonly price: number
  readonly casts: number
}

export type FeatureId = 'shop_upgrades' | 'orders' | 'trophies' | 'opens' | 'deadbait'

export type OrderKind = 'species' | 'weight' | 'water' | 'time' | 'rarity' | 'teaching'

export interface OrdersRule {
  readonly slots: number
  /** Local hour of the daily refill (the D112 stand-up). */
  readonly refillHour: number
  /** Reward = round(value × multiplierPercent ÷ 100) + the kind's bonus. */
  readonly multiplierPercent: number
  readonly bonus: Readonly<Record<OrderKind, number>>
  /** Draw weight of each kind at a refill; teaching only while no teaching order is on the slate. */
  readonly weights: Readonly<Record<OrderKind, number>>
}

export interface Order {
  readonly id: string
  readonly kind: OrderKind
  readonly count: number
  readonly bonus: number
  readonly speciesId?: string
  readonly water?: WaterId
  readonly minGrams?: number
  readonly bands?: readonly TimeBand[]
  readonly rarity?: Rarity
}

export type GoalPredicate =
  | { readonly kind: 'counter'; readonly counter: keyof AnglerCounters; readonly at: number }
  | { readonly kind: 'species'; readonly at: number; readonly water?: WaterId }
  | { readonly kind: 'rod'; readonly at: number }
  | { readonly kind: 'cooler'; readonly at: number }
  | { readonly kind: 'access'; readonly id: AccessId }
  | { readonly kind: 'fished'; readonly water: WaterId }
  | { readonly kind: 'bought'; readonly bait: BaitClass }
  | { readonly kind: 'logged'; readonly anyOf: readonly string[] }
  | { readonly kind: 'seasons'; readonly at: number }

/** A reached goal's coins waiting for the Claim button (v3). */
export interface UnclaimedGoal {
  readonly id: string
  readonly coins: number
}

export interface GoalDef {
  readonly id: string
  readonly title: string
  readonly predicate: GoalPredicate
  readonly coins: number
  /** The companion page the player uses for it, for the Dock's link. */
  readonly page?: 'cooler' | 'shop' | 'dock' | 'log'
  /** D128's pity rule: a bite is forced once this many casts pass on the goal, with `bait` on the hook if named. */
  readonly guarantee?: { readonly casts: number; readonly bait?: BaitClass }
}

export interface OpensRule {
  /** Target species per water, one per week in turn. */
  readonly rotation: Readonly<Partial<Record<WaterId, readonly string[]>>>
  readonly prizes: readonly [number, number, number]
}

export interface TrophiesRule {
  /** A fish at least this percent of its species' maximum can be mounted. */
  readonly minPercent: number
  /** Mounting costs the fish's value plus this. */
  readonly fee: number
  /** Pegs on the wall by step, and the price of each step after the first. */
  readonly pegs: readonly number[]
  readonly pegPrices: readonly number[]
}

export interface LogbookEntry {
  readonly count: number
  readonly bestGrams: number
  readonly firstTick: number
}

export interface AnglerCounters {
  readonly casts: number
  readonly bites: number
  readonly fishCaught: number
  readonly released: number
  readonly gotAway: number
  readonly rareCaught: number
  readonly epicCaught: number
  readonly nightCatches: number
  readonly heaviestGrams: number
  readonly goldEarned: number
  readonly fishSold: number
  readonly trips: number
  readonly baitRunOuts: number
  /** v2 counters, absent until the first one counts. */
  readonly ordersFilled?: number
  readonly deadbaitUsed?: number
  readonly deadbaitCatches?: number
  readonly trophiesMounted?: number
  readonly opensEntered?: number
  readonly medals?: number
  readonly charters?: number
  readonly breadCatches?: number
  readonly dawnDuskCatches?: number
  readonly rainCatches?: number
  readonly goalsReached?: number
  /** Bit per season (spring 1, summer 2, autumn 4, winter 8) with a fish landed. */
  readonly seasonsFished?: number
  /** Bit per run, in catalog order, with its species landed during it. */
  readonly runsFished?: number
  /** Bit per water, in catalog order, with an Open entered there (a rosette from it). */
  readonly openWaters?: number
}

export type AnglerStatus = 'fishing' | 'paused'

export interface AnglerState {
  readonly gold: number
  readonly status: AnglerStatus
  readonly waterId: WaterId
  /** Set by the travel intent; the next evaluation moves there instead of casting. */
  readonly travelTo?: WaterId
  readonly rodTier: number
  readonly coolerTier: number
  readonly baitOnHook?: BaitClass
  readonly bait: Readonly<Partial<Record<BaitClass, number>>>
  readonly access: readonly AccessId[]
  readonly logbook: Readonly<Record<string, LogbookEntry>>
  readonly counters: AnglerCounters
  /** Quiet ticks since the last bite or ambient line. */
  readonly quietTicks: number
  /** v2: the current goal (D128 shape) and the casts counter when it started, for its guarantee. */
  readonly goal?: { readonly rung: number; readonly castsAtStart: number; unclaimed?: UnclaimedGoal[] }
  /** v2: the fishmonger's slate, the refill day it was last filled for, and the day of the last swap. */
  readonly orders?: readonly Order[]
  readonly ordersDay?: number
  readonly swapDay?: number
  /** v2: casts left on a charter ticket. */
  readonly charterCasts?: number
  /** v2: pegs on the trophy wall. */
  readonly pegs?: number
  /** v2: the last run whose first line was written, so a run announces itself once. */
  readonly runSeen?: string
}

export interface CatchRecord {
  readonly speciesId: string
  readonly grams: number
  readonly value: number
  readonly caughtTick: number
  /** v2: when and how it was caught, for orders. */
  readonly band?: TimeBand
  readonly weather?: Weather
  readonly season?: Season
}

export type EventKind = 'catch' | 'release' | 'got_away' | 'ambient' | 'travel' | 'bait_out' | 'milestone' | 'system' | 'goal' | 'run'

export interface EventDetail {
  readonly speciesId?: string
  readonly grams?: number
  readonly value?: number
  readonly record?: boolean
  readonly firstOfSpecies?: boolean
  readonly waterId?: WaterId
  readonly bait?: BaitClass
  readonly weather?: Weather
  readonly band?: TimeBand
  readonly season?: Season
  readonly goalId?: string
  readonly runId?: string
}

export interface TickEvent {
  readonly kind: EventKind
  readonly summary: string
  readonly detail: EventDetail
  readonly deltas: { readonly gold: number }
}

export interface Conditions {
  readonly band: TimeBand
  readonly weather: Weather
  /** v2: the world's season and the run on at this water, if any. */
  readonly season?: Season
  readonly run?: string
}

export interface CastInput {
  readonly angler: AnglerState
  /** Fish already in the cooler. */
  readonly coolerCount: number
  readonly tick: number
  /** The run's wall slot, epoch milliseconds (never the clock). */
  readonly tickAt: number
  /** The owner's last TRMNL UTC offset; UTC without one (D106). */
  readonly utcOffsetSeconds?: number
  /** This water's weather for the tick's six-hour block, from the shared forecast. */
  readonly weather: Weather
  readonly content: IdleAnglerCatalog
  readonly streams: StreamSeeds
}

export interface CastMetrics {
  readonly landed: number
  readonly released: number
  readonly gotAway: number
}

export interface CastResult {
  readonly angler: AnglerState
  readonly catch?: CatchRecord
  readonly event?: TickEvent
  readonly extraEvents?: readonly TickEvent[]
  readonly conditions: Conditions
  readonly metrics: CastMetrics
  /** `cast` advanced the angler; `travelled` moved it; `paused` did nothing. */
  readonly disposition: 'cast' | 'travelled' | 'paused'
}
