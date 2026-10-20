import type { Season, SeasonsRule } from '@trmnl-games/engine/calendar'

/**
 * Little Plot pure-core types (little-plot.md "Rules", P46). Growth is counted in hundredths of a point, every
 * multiplier is a whole percent and every price a whole coin, so the core never depends on float rounding beyond the
 * PRNG's own documented draws.
 */

export type { Season, SeasonsRule }
export type Rarity = 'common' | 'uncommon' | 'rare' | 'epic'
export type Group = 'flower' | 'vegetable' | 'herb'
/** The Millpond's conditions (Idle Angler's table has no wind there); the adapter maps anything else to clear. */
export type Weather = 'clear' | 'overcast' | 'rain' | 'fog'
export type TimeBand = 'dawn' | 'day' | 'dusk' | 'night'
export type Stage = 'sown' | 'sprout' | 'leaf' | 'bud' | 'ripe'
export const STAGES: readonly Stage[] = ['sown', 'sprout', 'leaf', 'bud', 'ripe']
export type PestId = 'slugs' | 'aphids' | 'birds' | 'fox' | 'gnome' | 'heron'
export type ItemGroup = 'tool' | 'bed' | 'defence' | 'structure' | 'ornament'
export type StreamName = 'growth' | 'cross' | 'pest' | 'visitor' | 'trap' | 'narrative'
export type StreamSeeds = Readonly<Record<StreamName, number>>
/** How a kind's seed is first had, for the catalogue's hint and the shed. */
export type Source = 'shed' | 'cross' | 'trap' | 'frost'

export interface KindDef {
  readonly id: string
  readonly name: string
  readonly group: Group
  readonly rarity: Rarity
  /** Ticks from sown to ripe before multipliers; a stage is a quarter of it. */
  readonly growTicks: number
  readonly xp: number
  /** Coins at harvest. */
  readonly coins: number
  /** Seeds of its own kind returned at harvest. */
  readonly seeds: number
  /** Seasons it may be sown in without the out-of-season slowdown; absent means any. */
  readonly sowSeasons?: readonly Season[]
  /** Grows through a winter frost. */
  readonly hardy?: true
  /** Ripens only at night (or in fog at dawn and dusk). */
  readonly night?: true
  /** Ripens only in these seasons unless in the greenhouse; the bed waits at bud otherwise. */
  readonly ripenIn?: readonly Season[]
  /** A cross: its two parents, which must sit side by side. */
  readonly parents?: readonly [string, string]
  /** An epic cross that also needs this structure on the plot. */
  readonly needs?: string
  readonly source: Source
  /** A line of its own for the moment it ripens, after the stage line. */
  readonly note?: string
  /** The riddle shown in the catalogue before a parent is known. */
  readonly hint?: string
}

export interface PestDef {
  readonly id: PestId
  readonly name: string
}

/** Pest draw weights per band, and the base chance per band in permille. */
export interface PestRule {
  readonly basePermille: Readonly<Record<TimeBand, number>>
  readonly table: Readonly<Record<TimeBand, ReadonlyArray<readonly [PestId, number]>>>
  /** The product of defence multipliers never falls below this percent. */
  readonly floorPercent: number
  /** Added to the night base chance per bed past six. */
  readonly gnomePerBedPermille: number
  /** Weight multipliers from the weather and the season, whole percents. */
  readonly overcastSlugsPercent: number
  readonly rainBirdsPercent: number
  readonly fogGnomePercent: number
  readonly summerAphidsPercent: number
  /** Ticks an aphid-slowed bed grows at half speed. */
  readonly aphidTicks: number
  /** Ticks the frogs are away after the heron. */
  readonly heronTicks: number
}

export interface VisitorRule {
  /** Chance per night tick that another garden's gnome calls, in permille, before defences. */
  readonly permille: number
  readonly floorPercent: number
}

export interface ItemEffects {
  /** Pest chance multipliers, whole percents (copper tape: slugs 20). */
  readonly pests?: Readonly<Partial<Record<PestId, number>>>
  /** The other garden's gnome, whole percent. */
  readonly visitor?: number
  /** Only at night (the lantern). */
  readonly nightOnly?: true
  /** Growth on every bed, whole percent (compost 110). */
  readonly growthPercent?: number
  /** Ticks one watering lasts (cans and hoses). */
  readonly waterTicks?: number
  /** The plot's new size. */
  readonly beds?: { readonly rows: number; readonly cols: number }
  /** Cross chance multiplier, whole percent (beehive 200). */
  readonly crossPercent?: number
  /** One random common seed a day (bird table). */
  readonly dailySeed?: true
  /** Chance a gnome is caught instead, whole percent (the trap). */
  readonly trapPercent?: number
  /** Beds that ignore season and frost. */
  readonly greenhouseBeds?: number
  /** Sows a whole row from one tap (the trowel). */
  readonly rowSowing?: true
  /** Lasts one season, then needs buying again (ladybirds). */
  readonly lasts?: 'season'
}

export interface ItemDef {
  readonly id: string
  readonly name: string
  readonly group: ItemGroup
  readonly price: number
  readonly effects: ItemEffects
  /** Another item that must be owned first (the second greenhouse needs the 3 × 4 plot). */
  readonly requires?: string
  /** Level the shed shows it from. */
  readonly level?: number
  readonly blurb: string
}

export type GoalPredicate =
  | { readonly kind: 'counter'; readonly counter: keyof PlotCounters; readonly at: number }
  | { readonly kind: 'kinds'; readonly at: number }
  | { readonly kind: 'item'; readonly id: string }
  | { readonly kind: 'beds'; readonly at: number }
  | { readonly kind: 'stage'; readonly stage: Stage }
  | { readonly kind: 'adjacent'; readonly pair: readonly [string, string] }
  | { readonly kind: 'seasons'; readonly at: number }
  | { readonly kind: 'boughtSeed' }

export type GoalGuarantee = 'ripe' | 'cross' | 'trap'

export interface GoalDef {
  readonly id: string
  readonly title: string
  readonly predicate: GoalPredicate
  readonly coins: number
  readonly page?: 'plot' | 'tin' | 'shed' | 'catalogue'
  /** D128's once-per-rung guarantee: `ripe` forces the first ripening after `afterTicks` on the goal; `cross` makes the first adjacent pair cross; `trap` catches the first gnome. */
  readonly guarantee?: { readonly kind: GoalGuarantee; readonly afterTicks?: number }
}

export interface UnclaimedGoal {
  readonly id: string
  readonly coins: number
}

/** Level at which each shed shelf opens. */
export interface Unlocks {
  readonly seeds: number
  readonly uncommonSeeds: number
  readonly defences: number
  readonly structures: number
}

export interface LittlePlotCatalog {
  readonly contentVersion: string
  readonly kinds: readonly KindDef[]
  readonly items: readonly ItemDef[]
  readonly pests: readonly PestDef[]
  readonly pestRule: PestRule
  readonly visitor: VisitorRule
  readonly goals: readonly GoalDef[]
  readonly unlocks: Unlocks
  readonly seasons: SeasonsRule
  /** Growth multipliers, whole percents. */
  readonly seasonGrowthPercent: Readonly<Record<Season, number>>
  readonly weatherGrowthPercent: Readonly<Record<Weather, number>>
  readonly wateredPercent: number
  readonly outOfSeasonPercent: number
  /** Coins at harvest in autumn, whole percent. */
  readonly autumnCoinsPercent: number
  /** A ripe bed left this long goes to seed and resows itself. */
  readonly ripeToSeedTicks: number
  /** One volunteer in this many resows a different common ("the wind"). */
  readonly windPercent: number
  /** Most seeds of one kind the tin holds. */
  readonly tinCap: number
  /** Tags the tin remembers on seeds from other gardens. */
  readonly tagCap: number
  /** Cross chance and its cap after the beehive, whole percents. */
  readonly crossPercent: number
  readonly crossCapPercent: number
  /** A plant picked within this many ticks of ripening returns one more seed. */
  readonly freshTicks: number
  /** XP the first ripening of a kind pays, whole percent. */
  readonly firstXpPercent: number
  /** Seed prices in the shed by rarity (rare and epic are never sold). */
  readonly seedPrice: Readonly<Record<'common' | 'uncommon', number>>
  /** Local-hour boundaries: dawn starts, day starts, dusk starts, night starts. */
  readonly bands: { readonly dawn: number; readonly day: number; readonly dusk: number; readonly night: number }
  readonly ambientEvery: number
  readonly ambient: readonly string[]
  /** Lines by stage, with {name} for the plant. */
  readonly stageLines: Readonly<Record<Exclude<Stage, 'sown'>, readonly string[]>>
  /** Lines by pest effect, with {name} and {seed}. */
  readonly pestLines: Readonly<Record<PestEffect, readonly string[]>>
  /** The deterred line per defence item, with {item}. */
  readonly deterredLines: readonly string[]
}

export type PestEffect = 'slugs' | 'aphids' | 'birds_tin' | 'fox' | 'gnome_seed' | 'gnome_move' | 'gnome_turn' | 'gnome_caught' | 'heron' | 'frost_rose'

export interface Bed {
  readonly kindId?: string
  /** Growth in hundredths of a point since sowing; the stage follows from it. */
  readonly points: number
  readonly sownTick: number
  readonly ripeSinceTick?: number
  /** The cross set at ripening, whose seed the harvest returns. */
  readonly crossedKindId?: string
  readonly slowUntilTick?: number
  /** A bed that resowed itself: it never crosses. */
  readonly volunteer?: true
  /** Under glass: ignores season, frost and the ripening window. */
  readonly greenhouse?: true
}

export interface CatalogueEntry {
  readonly count: number
  /** Most coins one harvest paid. */
  readonly best: number
  readonly firstTick: number
}

export interface SeedTag {
  readonly kindId: string
  readonly from: string
  /** A cutting a friend sent rather than a gnome's haul. */
  readonly cutting?: true
}

export interface PlotCounters {
  readonly ripenings: number
  readonly harvests: number
  readonly sowings: number
  readonly waterings: number
  readonly crossesFound: number
  readonly epicsFound: number
  readonly gnomesCaught: number
  readonly pestsDeterred: number
  readonly pestEvents: number
  readonly nightRipenings: number
  readonly rainWateredTicks: number
  readonly goldEarned: number
  readonly volunteers: number
  readonly windSeeds: number
  readonly seedsLost: number
  readonly seedsFound: number
  readonly gnomesHosted: number
  readonly cuttingsSent: number
  readonly cuttingsReceived: number
  readonly greenhouseRareRipenings: number
  readonly goalsReached: number
  readonly itemsBought: number
  readonly seedsBought: number
  /** Bit per season (spring 1, summer 2, autumn 4, winter 8) with a ripening. */
  readonly seasonsGrown: number
}

export type PlotStatus = 'growing' | 'paused'

export interface PlotState {
  readonly level: number
  readonly xp: number
  readonly lifetimeXp: number
  readonly gold: number
  readonly status: PlotStatus
  readonly rows: number
  readonly cols: number
  readonly beds: readonly Bed[]
  readonly tin: Readonly<Record<string, number>>
  readonly tags: readonly SeedTag[]
  readonly items: readonly string[]
  readonly wateredUntilTick: number
  readonly ladybirdsUntilTick?: number
  readonly heronUntilTick?: number
  /** The season week the heron last came, so it comes once a season at most. */
  readonly heronWeek?: number
  /** The UTC day the bird table last dropped a seed. */
  readonly birdTableDay?: number
  /** The season week a frost last left a seed, so the frost gives at most one a week. */
  readonly frostWeek?: number
  readonly catalogue: Readonly<Record<string, CatalogueEntry>>
  readonly counters: PlotCounters
  readonly quietTicks: number
  readonly goal?: { readonly rung: number; readonly ticksAtStart: number; readonly used?: true; readonly unclaimed?: readonly UnclaimedGoal[] }
  /** Ticks evaluated, for the goal guarantees. */
  readonly ticks: number
}

export type EventKind = 'stage' | 'ripe' | 'seeded' | 'pest' | 'deterred' | 'cross' | 'ambient' | 'goal' | 'level' | 'visit' | 'system' | 'frost' | 'heron' | 'harvest' | 'sow' | 'water' | 'shop' | 'cutting' | 'achievement'

export interface EventDetail {
  readonly bed?: number
  readonly kindId?: string
  readonly childKindId?: string
  readonly stage?: Stage
  readonly pest?: PestId
  readonly effect?: PestEffect
  readonly item?: string
  readonly coins?: number
  readonly xp?: number
  readonly level?: number
  readonly goalId?: string
  readonly first?: true
  readonly season?: Season
  readonly weather?: Weather
  readonly band?: TimeBand
}

export interface TickEvent {
  readonly kind: EventKind
  readonly summary: string
  readonly detail: EventDetail
}

export interface Conditions {
  readonly band: TimeBand
  readonly weather: Weather
  readonly season: Season
  /** A winter night under a clear sky. */
  readonly frost: boolean
  readonly week: number
  readonly day: number
}

export interface TickInput {
  readonly plot: PlotState
  readonly tick: number
  /** The run's wall slot, epoch milliseconds (never the clock). */
  readonly tickAt: number
  readonly utcOffsetSeconds?: number
  /** The Millpond's weather for the tick's block, from Idle Angler's forecast. */
  readonly weather: Weather
  readonly content: LittlePlotCatalog
  readonly streams: StreamSeeds
}

/** What the adapter does with another garden: the pure core only rolls the dice. */
export interface VisitPlan {
  /** 0 to 99: the trap catches the gnome when this is under the trap's percent. */
  readonly trapRoll: number
  /** Picks the pool row and the seed, so two plots with the same seeds behave the same. */
  readonly pick: number
}

export interface TickResult {
  readonly plot: PlotState
  readonly events: readonly TickEvent[]
  readonly conditions: Conditions
  readonly xpEarned: number
  readonly levelUps: number
  /** Set when the night draw brought another garden's gnome through the defences. */
  readonly visit?: VisitPlan
  readonly disposition: 'grew' | 'paused'
}

export type ActionResult = { readonly ok: true; readonly plot: PlotState; readonly events: readonly TickEvent[] } | { readonly ok: false; readonly reason: string }
