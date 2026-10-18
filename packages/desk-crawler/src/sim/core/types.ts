/**
 * Pure domain types for the simulator (domain-contracts.md).
 * No Convex, auth, connection or wall-clock types belong here.
 */

export type StreamName = 'encounter' | 'combat' | 'reward' | 'narrative' | 'raid' | 'quest' | 'meeting' | 'graveyard'
/**
 * The `raid` stream (D110) is drawn only under a catalog with raid rules; without its seed no raid can launch.
 * The `quest` stream (P31) is drawn only under a catalog with to-do rules, which require it.
 * The `meeting` stream (D141) is drawn only under a catalog with meeting rules.
 * The `graveyard` stream (D145) is drawn only under a catalog with lost-property rules.
 */
export type StreamSeeds = Readonly<Record<Exclude<StreamName, 'raid' | 'quest' | 'meeting' | 'graveyard'>, number> & { raid?: number; quest?: number; meeting?: number; graveyard?: number }>

export type HeroStatus = 'exploring' | 'resting' | 'travelling' | 'dead' | 'paused' | 'sleeping'
export type EncounterKind = 'combat' | 'loot' | 'trap' | 'rest'
export type GearKind = 'weapon' | 'armor'
/** D129: `material` rows are the workbench's stack rows, outside the bag like potions. */
export type ItemKind = GearKind | 'potion' | 'material'
export type Rarity = 'common' | 'uncommon' | 'rare' | 'epic'
/** How carefully the hero looks after itself between fights (D76). */
export type StanceId = 'cautious' | 'balanced' | 'bold'

/** P37: a hero's class. An account holds at most one hero of each. */
export type HeroClass = 'warrior' | 'rogue'
export type LogKind =
  | 'combat'
  | 'loot'
  | 'trap'
  | 'rest'
  | 'travel'
  | 'death'
  | 'revive'
  | 'levelup'
  | 'achievement'
  | 'merchant'
  | 'choice'
  | 'raid'
  | 'meeting'
  | 'lost_property'
  | 'todo'
  | 'career'
  | 'occasion'
  | 'system'

// ---------------------------------------------------------------- content

export interface Range {
  readonly min: number
  readonly max: number
}

export interface MonsterTemplate {
  readonly id: string
  readonly name: string
  readonly tier: number
  readonly hp: number
  readonly attack: number
  readonly defense: number
  readonly xp: Range
  readonly gold: Range
}

export interface GearTemplate {
  readonly id: string
  readonly kind: GearKind
  readonly tier: number
  readonly name: string
  /** Added to the tier's slot stat (weapon ATK or armor DEF) so same-tier items differ; absent means 0. */
  readonly statOffset?: number
}

export interface GearTierStats {
  readonly weaponAttack: number
  readonly armorDefense: number
  readonly requiredLevel: number
  readonly saleValue: number
}

export interface RarityRule {
  readonly rarity: Rarity
  readonly weight: number
  readonly statBonus: number
  readonly saleMultiplier: number
}

export interface BiomeTemplate {
  readonly id: string
  readonly name: string
  readonly unlockLevel: number
  /** Office Cubicles: lethal damage becomes a rescue instead of death. */
  readonly safe: boolean
  /** Difficulty tier: monsters, to-do targets and rewards, potion drops, merchant and decision gold all key by it. */
  readonly tier: number
  /** D133: the gear tier whose templates drop here; absent means `tier`. The Archive and the Parking Garage drop tier-3 gear. */
  readonly gearTier?: number
  readonly weights: Readonly<Record<EncounterKind, number>>
  /** Ordered list; uniform selection. */
  readonly monsterIds: readonly string[]
  readonly lootGold: Range
  readonly trapDamage: Range
}

/** Placeholders: {monster} {xp} {gold} {damage} {heal} {item} {destination} {ticks} {capacity} */
export interface BiomeNarrative {
  readonly victory: readonly string[]
  readonly lootGold: readonly string[]
  readonly trapHit: readonly string[]
  /** A deliberate callback when this mishap occurs twice consecutively. */
  readonly trapHitCallbacks?: Readonly<Record<string, string>>
  readonly rest: readonly string[]
  readonly eliteVictory: readonly string[]
  readonly jackpot: readonly string[]
  /** Where gear turns up in this biome ({item}), pooled with the shared lines. */
  readonly lootGear: readonly string[]
  /** Arriving in this biome ({destination}), pooled with the shared lines. */
  readonly arrive: readonly string[]
}

/** Signature lines for one monster ({monster}, {xp}, {gold}), pooled with its biome's victories. */
export interface MonsterNarrative {
  readonly victory: readonly string[]
}

export interface SharedNarrative {
  readonly retreat: readonly string[]
  readonly death: readonly string[]
  readonly rescue: readonly string[]
  readonly trapDeath: readonly string[]
  readonly trapRescue: readonly string[]
  readonly restFull: readonly string[]
  readonly trapAvoided: readonly string[]
  readonly lootGear: readonly string[]
  readonly lootPotion: readonly string[]
  readonly potionFullGold: readonly string[]
  readonly restingHeal: readonly string[]
  readonly revive: readonly string[]
  readonly arrive: readonly string[]
  readonly depart: readonly string[]
  /** A level-up that opens a new area ({destination}). */
  readonly unlock: readonly string[]
  /** Finding a bigger bag ({item}, {capacity}). */
  readonly bagFind: readonly string[]
  /** Finding a bigger potion pouch ({item}, {capacity}). */
  readonly pouchFind: readonly string[]
  /** The merchant setting up shop ({ticks} until it leaves). */
  readonly merchant: readonly string[]
}

/** One stance: the sustain thresholds it replaces (D76). The balanced stance mirrors the catalog constants. */
/**
 * P37: what a class changes, applied at the places stats already resolve: its modifiers join the affix and effect
 * totals, its HP share scales maximum HP, and its raid edge adds to its side of every raid contest.
 */
export interface ClassRule {
  readonly id: HeroClass
  readonly name: string
  /** One line for the roster: who the class is. */
  readonly blurb: string
  /** The passive's name and what it does, as the companion shows it. */
  readonly passive: { readonly name: string; readonly blurb: string }
  /** Maximum HP as a share of the level's base (100 leaves it untouched). */
  readonly hpPct: number
  readonly modifiers: Modifiers
  /** Percentage points on the class's side of a raid contest, raiding or defending. */
  readonly raidEdgePct: number
}

export interface StanceRule {
  readonly id: StanceId
  readonly name: string
  readonly blurb: string
  readonly autoPotionBelowPct: number
  readonly restBelowPct: number
  readonly resumeExploringAtPct: number
  /** Victory XP scale: the pace a stance buys with its risk (100 leaves rewards untouched). */
  readonly victoryXpPct: number
}

export interface SimulationConstants {
  readonly potionStackCap: number
  readonly potionHealPct: number
  readonly autoPotionBelowPct: number
  readonly restBelowPct: number
  readonly restingHealPct: number
  readonly resumeExploringAtPct: number
  readonly restEncounterHealPct: number
  readonly maxCombatRounds: number
  readonly damageVariance: Range
  readonly combatGearDropPct: number
  /** `merchant` is the D78 visit; absent before v4. */
  readonly lootWeights: Readonly<{ gear: number; potion: number; gold: number; merchant?: number; event?: number }>
  readonly trapAvoidPct: number
  readonly retreatGoldLossPct: number
  readonly deathGoldLossPct: number
  readonly reviveAfterTicks: number
  readonly reviveHpPct: number
  readonly elite: Readonly<{ chancePct: number; hpMultiplierPct: number; xpMultiplier: number; goldMultiplier: number }>
  readonly jackpot: Readonly<{ chancePct: number; goldMultiplier: number }>
  readonly summaryMaxCodePoints: number
}

/** One rung of the bag ladder (D61). Capacity counts unequipped bag gear only. */
export interface BagTier {
  readonly id: string
  readonly name: string
  readonly capacity: number
  /** Guaranteed once either condition is met; the first tier has none. A later tier without one is a shop tier (D122). */
  readonly milestone?: Readonly<{ ticksExplored?: number; level?: number }>
  /** Gold to buy this tier in the companion; absent for the starting tier. */
  readonly price?: number
}

/** One rung of the potion pouch ladder (D77): the potion stack's cap. */
export interface PouchTier {
  readonly id: string
  readonly name: string
  readonly cap: number
  /** Guaranteed at this level; the first tier has none. A later tier without one is a shop tier (D122). */
  readonly milestone?: Readonly<{ level: number }>
  /** Gold to buy this tier; absent for the starting tier. */
  readonly price?: number
}

/** Per-hero potion cap that grows (D77); absent in catalogs before v4, where `constants.potionStackCap` applies. */
export interface PotionPouch {
  /** Ordered by strictly increasing cap; tiers[0] is a new hero's pouch. */
  readonly tiers: readonly PouchTier[]
  /** Chance per loot encounter, in permille, that an eligible hero finds the next pouch. */
  readonly findPermille: number
}

/** The wandering merchant (D78): a loot encounter that opens bounded offers in the companion for a few ticks. */
export interface MerchantRule {
  /** Gold per potion, scaled by the biome tier. */
  readonly potionPrice: number
  readonly maxPotionsOffered: number
  /** Offers stay open for this many ticks after the visit. */
  readonly staysForTicks: number
  /** D122: the merchant's bag and pouch offers are this much cheaper than the companion's ladder price; absent means full price. */
  readonly ladderDiscountPct?: number
}

export interface MerchantOffer {
  readonly id: 'potions' | 'pouch' | 'bag'
  readonly name: string
  readonly quantity: number
  readonly price: number
  /** The pouch or bag tier this offer grants. */
  readonly tierId?: string
}

export interface MerchantVisit {
  readonly offers: readonly MerchantOffer[]
  readonly expiresAtTick: number
  readonly biomeId: string
}

/**
 * A narrative event choice (D79): a short office situation with two or three options, one of which happens by
 * itself when the player does not answer within the expiry. Effects are authored and deterministic; the hero never
 * earns XP from a choice, so the intent path and the simulator path apply exactly the same thing.
 */
export interface ChoiceEffect {
  /** Gold added (negative spends; a spend the hero cannot afford is clamped to zero). */
  readonly gold?: number
  /** Gold per biome tier, added on top of `gold`. */
  readonly goldPerTier?: number
  /** Percent of maximum HP healed (positive) or lost (negative, never below 1 HP). */
  readonly hpPct?: number
  /** Potions added, within the pouch cap (overflow is lost, never sold). */
  readonly potions?: number
  /** A temporary effect granted (D80). */
  readonly effectId?: string
}

export interface ChoiceOption {
  readonly id: string
  readonly label: string
  /** The story line logged when this option resolves. */
  readonly story: string
  readonly effect: ChoiceEffect
}

export interface EventTemplate {
  readonly id: string
  readonly title: string
  /** The situation, logged when the choice is offered. */
  readonly prompt: string
  readonly options: readonly ChoiceOption[]
  /** The option that resolves by itself at expiry. */
  readonly defaultOptionId: string
}

export interface ChoiceRule {
  readonly events: readonly EventTemplate[]
  /** Ticks a choice stays open; 96 is a day. */
  readonly expiresAfterTicks: number
}

export interface PendingChoice {
  readonly eventId: string
  readonly offeredAtTick: number
  readonly expiresAtTick: number
  readonly biomeTier: number
}

/**
 * Desk raids (D110): heroes raid each other by chance on exploring ticks. Level, gear, affixes and effects play no
 * part in who wins; only the two stances move the 50/50 contest. Gold moves from loser to winner, never created.
 */
export interface RaidRule {
  /** Chance per exploring tick, in permille, that the hero launches a raid. */
  readonly launchPermille: Readonly<Record<StanceId, number>>
  /** Percentage points a stance adds to its own side of the contest, raiding or defending. */
  readonly edgePct: Readonly<Record<StanceId, number>>
  /** The loser's gold loss, a share of its current gold (thrifty takes its points off, D81). */
  readonly goldLossPct: number
  /** HP each side loses, as shares of its maximum HP. */
  readonly loserHpPct: number
  readonly winnerHpPct: number
  /** A target picked in the last this-many ticks cannot be picked again (enforced by the adapter's pool). */
  readonly targetCooldownTicks: number
  /** Placeholder: {rival}; amounts travel as change chips. A knockout adds a fixed "Knocked out for N ticks." */
  readonly narrative: RaidNarrative
}

/** P31: what a to-do task counts, always something the pure core already resolves in a tick. */
export type TodoKind = 'defeat_monster' | 'defeat_any' | 'explore_biome' | 'find_gear' | 'earn_gold' | 'avoid_traps' | 'elite'

/** One task template; the template id is its kind, so no two tasks on a list share one. */
export interface TodoTemplate {
  readonly kind: TodoKind
  /** Placeholders: {target} {monster} {monsters} {biome}. */
  readonly label: string
  /** The label when the target is 1. */
  readonly labelOne: string
  /** Target range by biome tier: the named biome's, or for a biome-free kind the hero's. */
  readonly target: Readonly<Record<number, Range>>
  /** Offered only from this level. */
  readonly minLevel?: number
}

/**
 * P31: the office to-do list. Every hero carries three tasks that progress while it explores and pay gold when
 * done; the 07:00 stand-up refills finished slots only, at least `minRefillGapTicks` after the last refill.
 */
export interface TodoRule {
  /** Ordered; index order is part of the content version. */
  readonly templates: readonly TodoTemplate[]
  /** Gold per finished task by the task's biome tier. */
  readonly rewardByTier: Readonly<Record<number, number>>
  /** Local hour of the morning stand-up (D84's Night recap boundary). */
  readonly refillHour: number
  /** The floor between two refills: 80 ticks is 20 hours. */
  readonly minRefillGapTicks: number
  /** An unfinished task is swapped at the refill that makes this many it has seen. */
  readonly staleAfterRefills: number
  /** Chance in percent that a generated biome task names another unlocked biome, when the list allows one. */
  readonly awayPct: number
  /** Plural monster names for {monsters}. */
  readonly monsterPlurals: Readonly<Record<string, string>>
}

/** P35: features that arrive at a level. Below it a hero behaves as under a catalog without that feature's rules. */
export type UnlockableFeature = 'todo' | 'stances' | 'choices' | 'merchant' | 'raids' | 'meetings' | 'workbench' | 'roster'
/**
 * P37: `roster` is optional, so catalogs before it simply never open the roster; D141: `meetings` likewise. D155:
 * `workbench` is optional the other way round: catalogs before it had salvage and the workbench open from level 1.
 */
export type UnlockRule = Readonly<Record<Exclude<UnlockableFeature, 'roster' | 'meetings' | 'workbench'>, number>> & { readonly roster?: number; readonly meetings?: number; readonly workbench?: number }

/** P35: what a career rung asks for, over the same bounded state achievements read. */
export type CareerPredicate =
  | { readonly kind: 'counter'; readonly counter: NumericCounter; readonly atLeast: number }
  /** Any one of the counters at or above the target. */
  | { readonly kind: 'anyCounter'; readonly counters: readonly NumericCounter[]; readonly atLeast: number }
  | { readonly kind: 'level'; readonly atLeast: number }
  | { readonly kind: 'bag'; readonly atLeast: number }
  /** Potion cap (D77). */
  | { readonly kind: 'pouch'; readonly atLeast: number }
  /** At least one victory over a monster of this biome. */
  | { readonly kind: 'biomeWin'; readonly biomeId: string }
  /** The stance the hero plays by right now (Balanced below the stance unlock). */
  | { readonly kind: 'stance'; readonly stance: StanceId }
  /** D192: the hero has a stance of its own, any of the three, chosen once stances are unlocked. */
  | { readonly kind: 'stanceChosen' }

/** P35: the lucky event a rung guarantees once the hero has explored `withinTicks` ticks on that rung without it. */
export type GuaranteedEvent = 'combat' | 'gear' | 'choice' | 'merchant' | 'elite'
export interface CareerGuarantee {
  readonly event: GuaranteedEvent
  readonly withinTicks: number
  /** Only fires outside the safe biome (an elite in the Office would be a waste of the guarantee). */
  readonly outsideSafe?: boolean
  /** Re-arms after firing instead of standing down, for an event that expires unanswered (a decision); still at most once per bound. */
  readonly repeat?: true
}

export interface CareerRung {
  /** Append-only and never reused, like achievement ids. */
  readonly id: string
  readonly title: string
  readonly blurb: string
  readonly predicate: CareerPredicate
  /** Gold paid when the rung is reached; never XP. */
  readonly gold: number
  /** The rung needs the companion (equip, sell, travel, buy); the device-only player sees it wait. */
  readonly companion?: boolean
  readonly guarantee?: CareerGuarantee
  /** Retired by a later catalog: kept so stored ids stay valid, but the ladder walks past it without pay or a line. */
  readonly retired?: true
  /** A retired rung this one replaces: a hero that reached that one reaches this one without its gold, so nothing pays twice. */
  readonly supersedes?: string
}

/** P35: the career ladder. Every hero has one current rung; rungs are checked in order. */
export interface CareerRule {
  readonly rungs: readonly CareerRung[]
}

export interface RaidNarrative {
  /** The raider won. */
  readonly raidWon: readonly string[]
  /** The raider was caught. */
  readonly raidLost: readonly string[]
  /** The target was raided. */
  readonly raided: readonly string[]
  /** The target caught the raider. */
  readonly repelled: readonly string[]
  /** Either side rescued by Office Cubicles. */
  readonly rescue: readonly string[]
}

/** The hero a raid lands on, as the adapter found it live at pick time. */
export interface RaidTarget {
  readonly heroId: string
  /** Public name shown in the raider's log. */
  readonly name: string
  readonly stance?: StanceId
  readonly gold: number
  /** The target's own thrifty points (D81), so its gold loss is the one it would take at home. */
  readonly goldLossPct?: number
  /** P37: the target's class raid edge, so the contest reads both classes; absent means none. */
  readonly classEdgePct?: number
}

/** A raid this hero launched, for the adapter's ledger; the target applies it at its next evaluation. */
export interface RaidLaunch {
  readonly targetHeroId: string
  readonly tick: number
  readonly raiderWon: boolean
  /** Gold the loser loses and the winner gains. */
  readonly gold: number
  /** The target's HP loss as a share of its maximum HP. */
  readonly targetHpPct: number
  /** D139: a Friday the 13th mishap; `raiderWon` is false and `gold` is the raider's own loss. */
  readonly mishap?: true
}

/**
 * D139: when an occasion falls, as a rule over the local calendar. `fixed` is a month and day; `nth_weekday` the nth
 * weekday of a month (weekday 0 is Sunday) moved by `offsetDays`; `friday_13th` any Friday the 13th; `easter` Easter
 * Sunday moved by `offsetDays`; `table` a list of ISO dates, for calendars that are not computed (Lunar New Year, Diwali).
 */
export type OccasionDateRule =
  | { readonly kind: 'fixed'; readonly month: number; readonly day: number }
  | { readonly kind: 'nth_weekday'; readonly month: number; readonly weekday: number; readonly nth: number; readonly offsetDays?: number }
  | { readonly kind: 'friday_13th' }
  | { readonly kind: 'easter'; readonly offsetDays: number }
  | { readonly kind: 'table'; readonly dates: readonly string[] }

/** D139 Friday the 13th: every raid goes wrong for both sides. */
export interface RaidMishapRule {
  /** Launch chances are scaled by this share for the day (200 doubles them). */
  readonly launchPct: number
  /** What each side loses: a share of maximum HP and of current gold (thrifty takes its points off). The gold goes nowhere. */
  readonly hpPct: number
  readonly goldLossPct: number
  /** Placeholder {rival}: the raider's line and the target's line. */
  readonly raider: readonly string[]
  readonly target: readonly string[]
}

/** D139: at most one effect per occasion. */
export interface OccasionEffect {
  readonly modifiers?: Modifiers
  /** Black Friday: the merchant's prices scaled by this share (50 halves them), and its loot weight by this share. */
  readonly merchantPricePct?: number
  readonly merchantWeightPct?: number
  /** Christmas: the hero's first exploring adventure of the occasion finds gear, once per occurrence. */
  readonly gift?: Readonly<{ lines: readonly string[] }>
  readonly raidMishap?: RaidMishapRule
}

/** D139: one occasion on the office calendar. */
export interface OccasionRule {
  readonly id: string
  readonly name: string
  readonly date: OccasionDateRule
  /** Local calendar days it runs, from its date. */
  readonly days: number
  /** The plain effect as the companion states it ("Merchant prices −50%"); absent for a cosmetic occasion. */
  readonly effectLabel?: string
  readonly effect?: OccasionEffect
  /** The announcement, one per occurrence, the hero's first evaluation inside it. */
  readonly lines: readonly string[]
}

/**
 * Meetings (D141): now and then an exploring hero meets another hero on its floor instead of an encounter. Both get
 * the meeting kind's boon; nothing changes hands and nobody can lose. Stance, class, level and gear play no part.
 */
export interface MeetingRule {
  /** Chance per exploring tick, in permille, that the hero starts a meeting; the same for every stance. */
  readonly launchPermille: number
  /** A hero met or meeting in the last this-many ticks cannot be picked (enforced by the adapter's pool). */
  readonly cooldownTicks: number
  /** Picked uniformly by the stream's fourth draw. Order is part of the content version. */
  readonly kinds: readonly MeetingKind[]
}

export interface MeetingKind {
  readonly id: string
  readonly name: string
  /** The boon both heroes get, an id in `effects`. */
  readonly effectId: string
  /** Placeholder {rival}. The starter's lines, the partner's lines and a short line for both sides. */
  readonly starter: readonly string[]
  readonly partner: readonly string[]
  readonly compact: string
}

/** The hero a meeting is with, as the adapter found it live at pick time. */
export interface MeetingPartner {
  readonly heroId: string
  /** Public name shown in the starter's log. */
  readonly name: string
  readonly class: HeroClass
}

/** A meeting this hero started, for the adapter's ledger; the partner applies it at its next evaluation. */
export interface MeetingLaunch {
  readonly partnerHeroId: string
  readonly tick: number
  readonly kindId: string
}

/** A ledger meeting landing on this hero (the partner side), oldest pending first. */
export interface IncomingMeeting {
  readonly starterHeroId: string
  readonly starterName: string
  readonly starterClass: HeroClass
  readonly tick: number
  readonly kindId: string
}

/**
 * Lost property (D145): a knockout drops a named spare copy of one equipped item on that floor, and another player's
 * hero may find it in place of an ordinary loot gear find. Nothing changes hands: the fallen hero keeps its gear.
 */
export interface LostPropertyRule {
  /** Chance per exploring tick, in permille, that the adapter looks for a spare on the hero's floor. */
  readonly lookPermille: number
  readonly narrative: {
    /** Knockout consequence. Placeholder {item}. */
    readonly dropped: string
    /** The finder's lines and short line. Placeholders {rival} (the owner) and {item}. */
    readonly found: readonly string[]
    readonly foundCompact: string
    /** The owner's notice. Placeholders {rival} (the finder), {item} and {destination} (the floor). */
    readonly returned: readonly string[]
    readonly returnedCompact: string
  }
}

/** What a knockout leaves on the floor: the item's identity, never its stats or workbench state. */
export interface SpareDrop {
  readonly templateId: string
  readonly kind: GearKind
  readonly rarity: Rarity
  readonly affixId?: string
  /** The template name, for the lines. */
  readonly name: string
  readonly biomeId: string
  readonly tick: number
  /** Where it lies among the floor's spares: the graveyard stream's third draw this tick. */
  readonly shard: number
}

/** A lying spare the adapter picked on this hero's floor, when `planFind` asked to look. */
export interface LostSpare {
  readonly ownerHeroId: string
  /** The owner's public name as it can be shown now. */
  readonly ownerName: string
  readonly templateId: string
  readonly kind: GearKind
  readonly rarity: Rarity
  readonly affixId?: string
}

/** A spare of this hero's that someone found, waiting to be told (the owner side). */
export interface IncomingFound {
  readonly finderHeroId: string
  readonly finderName: string
  readonly finderClass: HeroClass
  readonly templateId: string
  /** The template name as dropped. */
  readonly name: string
  readonly biomeId: string
  readonly foundTick: number
}

/** A ledger raid landing on this hero (the target side), oldest pending first. */
export interface IncomingRaid {
  readonly raiderHeroId: string
  readonly raiderName: string
  readonly tick: number
  readonly raiderWon: boolean
  readonly gold: number
  readonly targetHpPct: number
  /** D139: a Friday the 13th mishap; nobody won and the target loses its own share of gold. */
  readonly mishap?: true
}

/**
 * Typed modifiers (D80/D81) that affixes and effects contribute; every field is additive percentage points and
 * absent means zero. The resolver sums them and applies each at one fixed place.
 */
export interface Modifiers {
  readonly attackPct?: number
  readonly defensePct?: number
  readonly xpPct?: number
  readonly goldPct?: number
  /** Trap damage reduced by this share. */
  readonly trapDamagePct?: number
  /** Maximum HP healed after each victory. */
  readonly healOnVictoryPct?: number
  /** Percentage points taken off retreat and knockout gold losses. */
  readonly goldLossPct?: number
}

/** An affix: a named modifier rolled onto rare and epic gear at generation (D81). */
export interface AffixRule {
  readonly id: string
  /** Adjective shown before the rarity: "Vampiric Rare Keyboard Mace". */
  readonly name: string
  readonly blurb: string
  readonly modifiers: Modifiers
}

/** A temporary effect on the hero (D80): a boon or a bane with a duration in ticks. */
export interface EffectRule {
  readonly id: string
  readonly name: string
  readonly blurb: string
  readonly kind: 'boon' | 'bane'
  readonly durationTicks: number
  readonly modifiers: Modifiers
}

export interface ActiveEffect {
  readonly id: string
  /** The effect is gone from this tick on. */
  readonly untilTick: number
}

/** Per-hero bag capacity that grows (D61). */
export interface BagLadder {
  /** Ordered by strictly increasing capacity; tiers[0] is a new hero's bag. */
  readonly tiers: readonly BagTier[]
  /** Chance per loot encounter, in permille, that an eligible hero finds the next bag. */
  readonly findPermille: number
}

/** D129: one material kind, the stack row a rarity band salvages into. */
export interface MaterialTemplate {
  readonly id: string
  readonly name: string
  /** Rarities whose gear yields this material; every rarity in the catalog belongs to exactly one. */
  readonly rarities: readonly Rarity[]
  /** Glyph name shared by the companion and any later device nod. */
  readonly glyph: string
}

/** Materials by id, with the count each costs or yields. */
export type MaterialCount = Readonly<Record<string, number>>

/** One step the workbench can apply to an owned item: the next gear tier, or one more reinforcement on the top tier. */
export type WorkbenchStep =
  | { readonly kind: 'tier'; readonly toTier: number; readonly gold: number; readonly materials: MaterialCount }
  | { readonly kind: 'reinforce'; readonly to: number; readonly gold: number; readonly materials: MaterialCount }

/**
 * D129: salvage and the workbench. Salvage strips bag gear into materials (the item's tier in units of its rarity's
 * material; epic gear yields `epicYieldMultiplier` times that). Steps are applied in catalog order, tier steps first;
 * `affix` is the price of fitting a chosen affix to rare or epic gear. Nothing here is drawn: every step is explicit.
 */
export interface WorkbenchRule {
  readonly materials: readonly MaterialTemplate[]
  readonly epicYieldMultiplier: number
  readonly steps: readonly WorkbenchStep[]
  readonly affix: { readonly gold: number; readonly materials: MaterialCount }
}

/** D131: one potion strength, its own stack row keyed by `templateId`. */
export interface PotionStrength {
  readonly id: string
  readonly templateId: string
  readonly name: string
  /** Percent of maximum HP one drink restores, rounded up. */
  readonly healPct: number
}

/**
 * D131: potion strengths. `strengths` ascend by heal; one of them is `content.potion`, the potion the starter kit,
 * the merchant and decisions hand out. A potion find draws its strength from `dropWeightsByTier` (out of 100 per
 * biome tier, keyed by strength id) on the reward stream. `combine` is the one recipe: `count` of `from` plus
 * `materials` make one `to`. The drinking rule needs no numbers: weakest that clears the drinking line, else strongest.
 */
export interface PotionRule {
  readonly strengths: readonly PotionStrength[]
  readonly dropWeightsByTier: Readonly<Record<number, Readonly<Record<string, number>>>>
  readonly combine: { readonly from: string; readonly count: number; readonly materials: MaterialCount; readonly to: string }
}

/**
 * D133: field notes. One short note per biome and per monster, read in the companion once the hero has been there or
 * beaten it; nothing is drawn, stored or logged, so a catalog without lore changes nothing in play.
 */
export interface LoreRule {
  readonly biomes: Readonly<Record<string, string>>
  readonly monsters: Readonly<Record<string, string>>
}

/**
 * P42 dug-in elites (D163): from `minLevel`, on a floor of `minBiomeTier` or deeper, `digInPct` of ordinary elite
 * draws dig in. The elite's HP carries over between ticks until it falls, the hero is knocked out or travels, the
 * player walks away, or `durationTicks` pass. Lines name only `{monster}`.
 */
export interface StandoffRule {
  readonly digInPct: number
  readonly minLevel: number
  readonly minBiomeTier: number
  /** The dug-in elite's HP as a share of the monster's. */
  readonly hpMultiplierPct: number
  /** Its attack as a share of the monster's: hard enough that a round can knock out a hero above its rest line. */
  readonly attackPct: number
  /** The hero steps back once its HP is below this share of its stance's rest line (100: at the line; 0: never, it fights all six rounds). */
  readonly stepBackPct: number
  readonly durationTicks: number
  readonly xpMultiplier: number
  readonly goldMultiplier: number
  readonly narrative: {
    /** Per floor id: where it dug in, and how it fell. */
    readonly dugIn: Readonly<Record<string, readonly string[]>>
    readonly won: Readonly<Record<string, readonly string[]>>
    /** Every later fight tick. */
    readonly fighting: readonly string[]
    /** The clock ran out. */
    readonly slipped: readonly string[]
    readonly dugInCompact: string
    readonly fightingCompact: string
    readonly wonCompact: string
    readonly slippedCompact: string
    /** A consequence on a rest line while the elite waits. */
    readonly waiting: string
  }
}

/** P42: the elite this hero has dug in against, saved between ticks. */
export interface Standoff {
  readonly monsterId: string
  readonly biomeId: string
  readonly hp: number
  readonly maxHp: number
  readonly startedTick: number
  /** The first tick it is gone: `startedTick + durationTicks`. */
  readonly untilTick: number
}

export interface ContentCatalog {
  readonly contentVersion: string
  readonly constants: SimulationConstants
  /** Ordered; index order is part of the content version. */
  readonly biomes: readonly BiomeTemplate[]
  readonly safeBiomeId: string
  readonly monsters: readonly MonsterTemplate[]
  readonly gearTemplates: readonly GearTemplate[]
  readonly gearTiers: Readonly<Record<number, GearTierStats>>
  readonly rarities: readonly RarityRule[]
  readonly potion: Readonly<{ templateId: string; name: string }>
  readonly bagLadder: BagLadder
  /** Absent in catalogs before v3: every hero then behaves as balanced. */
  readonly stances?: Readonly<Record<StanceId, StanceRule>>
  /** P37: every class's rule; absent means every hero plays as the untouched Warrior. */
  readonly classes?: Readonly<Record<HeroClass, ClassRule>>
  /** Absent before v4 (D77/D78). */
  readonly potionPouch?: PotionPouch
  readonly merchant?: MerchantRule
  /** Absent before v5 (D79). */
  readonly choices?: ChoiceRule
  /** Absent before v6 (D80/D81). */
  readonly affixes?: readonly AffixRule[]
  /** Rarities that roll an affix at generation. */
  readonly affixRarities?: readonly Rarity[]
  readonly effects?: readonly EffectRule[]
  /** Which effect each source grants; a source may be absent. */
  readonly effectSources?: Readonly<{ trapHit?: string; eliteVictory?: string }>
  /** Absent before v7 (D110). */
  readonly raids?: RaidRule
  /** Absent before v20 (D141): no meetings, and no `meeting` draw. */
  readonly meetings?: MeetingRule
  /** Absent before v21 (D145): no spares, and no `graveyard` draw. */
  readonly lostProperty?: LostPropertyRule
  /** Absent before v24 (D163): elites never dig in, and no dig-in draw. */
  readonly standoff?: StandoffRule
  /**
   * D189 (v26): a full bag never stops the hero. The first find that does not fit is held as before, but the hero
   * keeps exploring; while a find is held and the bag is full, later finds stay behind. Absent: the find is held and
   * the hero sleeps until the player makes room (D18/D19). A sleeper under a catalog with this rule wakes next tick.
   */
  readonly keepGoingWhenFull?: true
  /** Absent before v9 (P31): without it a hero has no to-do list and draws nothing from the `quest` stream. */
  readonly todo?: TodoRule
  /** Absent before v12 (P35): every feature is on from level 1. */
  readonly unlocks?: UnlockRule
  /** Absent before v12 (P35): no career ladder, no goal lines, no guarantees. */
  readonly career?: CareerRule
  /** Absent before v13 (D129): no salvage, no materials, no workbench. */
  readonly workbench?: WorkbenchRule
  /** Absent before v14 (D131): one potion, healing `constants.potionHealPct`. */
  readonly potions?: PotionRule
  /** Absent before v16 (D133): no field notes. */
  readonly lore?: LoreRule
  /** Absent before v19 (D139): no occasions. Ordered: when two overlap, the earlier one is live. */
  readonly occasions?: readonly OccasionRule[]
  readonly narrative: Readonly<{ biomes: Readonly<Record<string, BiomeNarrative>>; shared: SharedNarrative; monsters: Readonly<Record<string, MonsterNarrative>> }>
}

// ---------------------------------------------------------------- hero and items

/**
 * Lifetime counters. Every value only grows (D65): achievements are predicates
 * over these, so a counter that exists from launch makes its achievements
 * retroactive by construction. `itemsSold` is written by the sell intents,
 * `potionsUsed` by both the simulator and the drink intent; the rest by ticks.
 */
export interface HeroCounters {
  readonly combatWins: number
  readonly retreats: number
  readonly deaths: number
  readonly rescues: number
  readonly goldEarned: number
  readonly itemsFound: number
  readonly ticksExplored: number
  /** Victories per monster id; keys are limited to the pinned catalog's monsters. */
  readonly monsterWins: Readonly<Record<string, number>>
  readonly eliteWins: number
  readonly jackpots: number
  /** Rare gear found, from loot or combat drops. */
  readonly rareFinds: number
  readonly potionsUsed: number
  readonly trapsAvoided: number
  /** Ticks that healed by resting: resting ticks and rest encounters. */
  readonly restTicks: number
  /** Arrivals in another biome. */
  readonly trips: number
  readonly itemsSold: number
  /** Stance switches made in the companion (D76), written by the intent. */
  readonly stanceChanges: number
  /** Merchant offers bought in the companion (D78), written by the intent. */
  readonly purchases: number
  /** Merchant visits met while exploring (D78). */
  readonly merchantVisits: number
  /** Choices answered in the companion (D79), written by the intent. */
  readonly choicesMade: number
  /** Choices that resolved by their default at expiry (D79). */
  readonly choicesDefaulted: number
  /** Epic gear found (D81). */
  readonly epicFinds: number
  /** Raids launched, raids won as the raider, raids repelled and raids lost as the target (D110). */
  readonly raidsLaunched: number
  readonly raidsWon: number
  readonly raidsRepelled: number
  readonly raidsLost: number
  /** To-do tasks ticked off (P31). */
  readonly tasksCompleted: number
  /** Gear equipped in the companion (P35), written by the equip intent. */
  readonly itemsEquipped: number
  /** Career rungs reached under a catalog with a ladder (P35). */
  readonly careerRungs: number
  /** D129: gear stripped for materials, workbench steps applied (upgrades, reinforcements and affix choices), and the highest reinforcement any item has reached. Written by the intents. */
  readonly itemsSalvaged: number
  readonly gearUpgraded: number
  readonly topReinforcement: number
  /** D131: major potions made by combining, written by the intent. */
  readonly potionsCombined: number
  /** D139: occasions the hero was on duty for, and Friday the 13th raid mishaps from either side. */
  readonly occasionsSeen: number
  readonly raidMishaps: number
  /** D141: meetings from either side, counted when each side applies its own. */
  readonly meetings: number
  /** D145: other players' spares this hero found. */
  readonly lostPropertyFound: number
  /** D163: dug-in elites beaten. */
  readonly standoffsWon: number
  /** D133: arrivals per biome id, written by the simulator from content v16's deploy on; absent on heroes that have not travelled since. */
  readonly biomesVisited?: Readonly<Record<string, number>>
}

/** Counter names that hold one number (everything except the records `monsterWins` and `biomesVisited`). */
export type NumericCounter = Exclude<keyof HeroCounters, 'monsterWins' | 'biomesVisited'>

export interface HeroState {
  readonly id: string
  readonly class: HeroClass
  readonly level: number
  /** XP toward the next level. */
  readonly xp: number
  readonly lifetimeXp: number
  readonly hp: number
  readonly gold: number
  readonly status: HeroStatus
  readonly biomeId: string
  readonly targetBiomeId?: string
  readonly arriveAtTick?: number
  readonly reviveAtTick?: number
  readonly pausedFromStatus?: 'exploring' | 'resting'
  readonly wakeAtTick?: number
  readonly weaponId?: string
  readonly armorId?: string
  readonly heldItemId?: string
  /** Unequipped gear the bag holds; always a ladder tier's capacity (D61). */
  readonly bagCapacity: number
  readonly lastLevelUpTick: number
  readonly counters: HeroCounters
  /** Chosen in the companion; absent means balanced (D76). */
  readonly stance?: StanceId
  /** Potion cap from the pouch ladder (D77); absent means the catalog's `potionStackCap`. */
  readonly potionCap?: number
  /** An open merchant visit (D78); the simulator clears it once it expires. */
  readonly merchant?: MerchantVisit
  /** A pending narrative choice (D79); answered by the intent or resolved by the simulator at expiry. */
  readonly choice?: PendingChoice
  /** Active temporary effects (D80), at most three; expired ones are dropped on the next evaluation. */
  readonly effects?: readonly ActiveEffect[]
  /** P31: the office to-do list; absent until the hero's first evaluation under a catalog with to-do rules. */
  readonly todo?: TodoList
  /** P35: where the hero stands on the career ladder; absent until its first evaluation under a catalog with one. */
  readonly career?: CareerState
  /** D139: the last occurrence the hero was announced (`<id>@<start date>`), and whether its gift was found. */
  readonly occasion?: OccasionMark
  /** D163: a dug-in elite, at most one; cleared by its fall, a knockout, travel, Walk away or its clock. */
  readonly standoff?: Standoff
}

export interface OccasionMark {
  readonly key: string
  readonly gifted?: true
}

/** P35: the hero's place on the career ladder. */
export interface CareerState {
  /** Index of the current rung; the ladder's length once every rung is reached. */
  readonly rung: number
  readonly startedTick: number
  /** `ticksExplored` when the current rung's guarantee was armed; absent while the rung has none, its feature is locked, or it has fired. */
  readonly armedAt?: number
  /** The guaranteed event's count when armed; the guarantee stands down once the event has happened by itself. */
  readonly armedCount?: number
  /** The current rung's guarantee has fired; a guarantee fires once per rung. */
  readonly fired?: true
  /** Rungs reached under the ladder, in order, with the tick and its wall slot when the input carried one; rungs already satisfied when the ladder arrived are not listed. */
  readonly reached: readonly { readonly id: string; readonly tick: number; readonly at?: number }[]
  /** Rewards reached but not yet claimed in the companion (D129): the rung's gold waits here, never expires, and `heroes.claimGoal` pays it. */
  readonly unclaimed?: readonly { readonly id: string; readonly gold: number; readonly tick: number; readonly at?: number }[]
}

/** One to-do task. The biome and monster it names, its target and its reward are fixed when it is written. */
export interface TodoTask {
  /** The template's kind. */
  readonly templateId: TodoKind
  /** The biome an `explore_biome` or `defeat_monster` task names. */
  readonly biomeId?: string
  /** The monster a `defeat_monster` task names. */
  readonly monsterId?: string
  readonly target: number
  /** Never above the target and never down. */
  readonly progress: number
  /** Gold paid when it is ticked off. */
  readonly reward: number
  readonly addedTick: number
  /** Refills this task has seen unfinished while the hero was awake. */
  readonly refillsSeen: number
  /** Set when ticked off; the next refill replaces it. */
  readonly doneTick?: number
}

export interface TodoList {
  /** Exactly three. */
  readonly tasks: readonly TodoTask[]
  readonly lastRefillTick: number
  /**
   * UTC milliseconds of the local 07:00 that began the last refill's stand-up day. The next refill waits for a
   * 07:00 at least 20 hours after it, so a late refill never pushes later mornings back.
   */
  readonly lastStandupAt: number
  /** Set by the swap intent; a swap is used while this is at or after the last refill. */
  readonly swapUsedTick?: number
}

export interface ItemSnapshot {
  readonly id: string
  readonly templateId: string
  readonly contentVersion: string
  readonly kind: ItemKind
  readonly name: string
  readonly rarity: Rarity
  readonly requiredLevel: number
  readonly attack: number
  readonly defense: number
  readonly saleValue: number
  readonly quantity: number
  /** Affix rolled at generation (D81); absent on common and uncommon gear and on gear from earlier catalogs. */
  readonly affixId?: string
  /** D129: the gear tier the workbench raised this item to; absent means its template's tier. */
  readonly tier?: number
  /** D129: reinforcement steps applied on top of the tier (0 to the catalog's cap); absent means 0. */
  readonly reinforced?: number
}

/** A new item before the adapter allocates its database ID. */
export type NewItem = Omit<ItemSnapshot, 'id'>

export type ItemChange =
  | { readonly type: 'potion_decrement'; readonly itemId: string; readonly deleteRow: boolean }
  | { readonly type: 'potion_increment'; readonly itemId: string }
  /** `spare` (D145): the item is another player's found spare; the adapter labels it with the owner's name. */
  | { readonly type: 'create'; readonly destination: 'bag' | 'held' | 'potion_stack'; readonly item: NewItem; readonly spare?: true }

// ---------------------------------------------------------------- input/output

export interface SimulationInput {
  readonly hero: HeroState
  /** At most `MAX_INVENTORY_ROWS` rows, sorted lexically by ID. */
  readonly inventory: readonly ItemSnapshot[]
  readonly tick: number
  readonly content: ContentCatalog
  readonly simulationVersion: number
  readonly streams: StreamSeeds
  /** Newest first, at most two. Cosmetic history only; never changes game outcomes. */
  readonly recentSummaries?: readonly string[]
  /** D110: the hero the adapter picked for a raid this tick, when `planRaid` asked for one and it was raidable. */
  readonly raidTarget?: RaidTarget
  /** D110: the oldest pending raid against this hero; applied as the tick's event when the hero is exploring or resting. */
  readonly incomingRaid?: IncomingRaid
  /** D141: the hero the adapter picked for a meeting this tick, when no raid target was picked and `planMeeting` asked for one. */
  readonly meetingPartner?: MeetingPartner
  /** D141: the oldest pending meeting with this hero; applied as the tick's event when the hero is exploring or resting and no raid lands. */
  readonly incomingMeeting?: IncomingMeeting
  /** D145: a lying spare on this hero's floor, when `planFind` asked to look; used only if the tick's loot finds gear. */
  readonly lostSpare?: LostSpare
  /** D145: this hero's spare that someone found; told as the tick's event when the hero is exploring or resting and nothing else lands. Its presence also means no new spare drops. */
  readonly incomingFound?: IncomingFound
  /** P31: the tick's wall slot in UTC milliseconds; absent means `tick` quarter-hours after the epoch. */
  readonly tickAt?: number
  /** P31: the owner's last TRMNL UTC offset in seconds; absent means UTC (D106). */
  readonly utcOffsetSeconds?: number
}

export type Disposition =
  | 'advanced'
  | 'rested'
  | 'arrived'
  | 'departed'
  | 'revived'
  | 'waiting_dead'
  | 'waiting_travel'
  | 'paused'
  | 'sleeping'
  | 'inventory_sleep_started'

export type CombatOutcome = 'victory' | 'retreat' | 'death' | 'rescue'

export interface CombatRound {
  readonly heroDamage: number
  readonly monsterDamage: number
}

export type OutcomeDetail =
  | {
      readonly variant: 'combat'
      readonly monsterId: string
      readonly elite: boolean
      readonly monsterHpStart: number
      readonly monsterHpEnd: number
      readonly rounds: readonly CombatRound[]
      readonly outcome: CombatOutcome
      readonly xpGranted: number
      readonly goldGranted: number
      readonly gearDropped: boolean
      /** Adapter annotation from the awarded item; present only when gear dropped. */
      readonly gearRarity?: Rarity
      /** D163: a dug-in elite's tick: the dig-in, a later fight, or the fall. `monsterHpMax` is its full HP. */
      readonly standoff?: 'dug_in' | 'fighting' | 'won'
      readonly monsterHpMax?: number
    }
  | {
      /** D163: a dug-in elite's clock ran out while the hero explored. */
      readonly variant: 'standoff_left'
      readonly monsterId: string
      readonly startedTick: number
    }
  | {
      readonly variant: 'loot'
      readonly found: 'gear' | 'potion' | 'gold' | 'bag' | 'pouch'
      readonly templateId?: string
      readonly rarity?: Rarity
      /** `drawer` is a legacy stored value (D111, removed in D123). `left` (D189): the bag was full and a find was already held, so it stayed behind. */
      readonly destination?: 'bag' | 'held' | 'drawer' | 'left'
      readonly goldGranted: number
      readonly jackpot: boolean
      readonly potionFullFallback: boolean
      /** D145: the find was another player's spare; their hero and public name as shown at the find. */
      readonly spare?: { readonly rivalHeroId: string; readonly rivalName: string }
    }
  | {
      readonly variant: 'trap'
      readonly avoided: boolean
      readonly damage: number
      readonly outcome: 'survived' | 'death' | 'rescue'
    }
  | { readonly variant: 'rest'; readonly healing: number; readonly automatic: boolean; readonly resultingStatus: HeroStatus }
  | { readonly variant: 'travel'; readonly phase: 'depart' | 'arrive'; readonly fromBiomeId: string; readonly toBiomeId: string; readonly arrivalTick: number }
  | { readonly variant: 'revival'; readonly previousBiomeId: string; readonly safeBiomeId: string; readonly hpGranted: number; readonly reviveAtTick: number }
  | { readonly variant: 'merchant'; readonly offers: readonly MerchantOffer[]; readonly expiresAtTick: number }
  | { readonly variant: 'choice'; readonly phase: 'offered' | 'defaulted'; readonly eventId: string; readonly optionId?: string; readonly expiresAtTick: number }
  | {
      readonly variant: 'raid'
      /** This hero's side of the raid. */
      readonly role: 'raider' | 'target'
      readonly rivalHeroId: string
      readonly rivalName: string
      /** Whether this hero came out on top. */
      readonly won: boolean
      /** Gold this hero gained (won) or lost (lost), after the target-side clamp. */
      readonly gold: number
      readonly hpLost: number
      /** The tick the raider launched it. */
      readonly raidTick: number
      readonly outcome: 'survived' | 'death' | 'rescue'
      /** D139: a Friday the 13th mishap; `won` is false for both sides. */
      readonly mishap?: true
    }
  | {
      readonly variant: 'meeting'
      /** This hero's side of the meeting. */
      readonly role: 'starter' | 'partner'
      readonly rivalHeroId: string
      readonly rivalName: string
      /** The other hero's class, so the scene can draw it. */
      readonly rivalClass: HeroClass
      readonly kindId: string
      /** The tick the starter met the partner. */
      readonly meetingTick: number
    }
  | {
      readonly variant: 'lost_property'
      /** The hero that found this hero's spare. */
      readonly rivalHeroId: string
      readonly rivalName: string
      readonly rivalClass: HeroClass
      readonly templateId: string
      readonly biomeId: string
      readonly foundTick: number
    }
  | { readonly variant: 'occasion'; readonly occasionId: string; readonly key: string }
  | {
      readonly variant: 'todo'
      /** `done`: tasks ticked off this tick; `standup`: the tasks the refill wrote. */
      readonly phase: 'done' | 'standup'
      readonly tasks: readonly { readonly templateId: TodoKind; readonly label: string; readonly reward: number }[]
    }
  | {
      readonly variant: 'career'
      /** `reached`: a rung reached (`id` is the rung, `gold` its bonus); `unlocked`: a feature arrived (`id` is the feature). */
      readonly phase: 'reached' | 'unlocked'
      readonly id: string
      readonly title: string
      /** The next rung's title after a reached one, when the ladder goes on. */
      readonly next?: string
      readonly gold: number
    }

export interface LogDetail {
  readonly v: 1
  readonly simulationVersion: number
  readonly contentVersion: string
  readonly disposition: Disposition
  readonly encounterKind?: EncounterKind
  readonly potionsUsed: number
  /** HP the automatic potion restored this tick, so the log can show it apart from net HP. Absent on logs written before 2026-10-07. */
  readonly potionHealing?: number
  readonly levelsGained: number
  readonly goldPenalty: number
  readonly heldFind: boolean
  /** The bag grew this tick (D61). */
  readonly bagUpgrade?: BagUpgrade
  /** The potion pouch grew this tick (D77). */
  readonly pouchUpgrade?: BagUpgrade
  /** An effect this tick granted (D80). */
  readonly effectGained?: string
  readonly outcome: OutcomeDetail
}

export interface BagUpgrade {
  readonly from: number
  readonly to: number
  readonly tierId: string
  readonly source: 'milestone' | 'find'
}

export interface TickEvent {
  readonly kind: LogKind
  readonly summary: string
  readonly detail: LogDetail
  readonly deltas: { readonly xpEarned: number; readonly gold: number; readonly hp: number }
}

export interface TickMetrics {
  readonly encounter: EncounterKind | 'none'
  readonly victories: number
  readonly retreats: number
  readonly deaths: number
  readonly rescues: number
  readonly levelUps: number
  readonly potionsUsed: number
  readonly heldFinds: number
  readonly bagUpgrades: number
  readonly sleepStarts: number
  readonly wakes: number
  readonly elites: number
  readonly jackpots: number
  readonly merchantVisits: number
  readonly pouchUpgrades: number
  readonly choicesOffered: number
  readonly choicesDefaulted: number
  readonly effectsGained: number
  readonly raidsLaunched: number
  readonly raidsApplied: number
  readonly meetingsLaunched: number
  readonly meetingsApplied: number
  readonly sparesDropped: number
  readonly sparesFound: number
  readonly sparesReturned: number
  readonly tasksCompleted: number
  readonly todoRefills: number
  /** P35: a career rung reached, features unlocked, and a guaranteed event forced this tick. */
  readonly careerRungs: number
  readonly unlocks: number
  readonly guarantees: number
  /** D163: an elite dug in, one fell, or one left without falling (clock, knockout or travel). */
  readonly standoffStarts: number
  readonly standoffWins: number
  readonly standoffEnds: number
}

export interface SimulationResult {
  readonly nextHero: HeroState
  readonly itemChanges: readonly ItemChange[]
  readonly event?: TickEvent
  readonly metrics: TickMetrics
  readonly disposition: Disposition
  /** D110: a raid this hero launched; the adapter inserts it in the ledger and marks the target picked. */
  readonly raidLaunch?: RaidLaunch
  /** D110: the incoming raid was applied this tick; the adapter marks the ledger row applied. */
  readonly raidApplied?: boolean
  /** D141: a meeting this hero started; the adapter inserts it in the ledger and stamps both pool rows. */
  readonly meetingLaunch?: MeetingLaunch
  /** D141: the incoming meeting was applied this tick; the adapter marks the ledger row applied. */
  readonly meetingApplied?: boolean
  /** D145: this hero was knocked out and leaves this spare; the adapter writes its lost-property row. */
  readonly spareDropped?: SpareDrop
  /** D145: the tick's gear find is the adapter's `lostSpare`; the adapter marks it found and labels the created item. */
  readonly spareFound?: { readonly ownerHeroId: string }
  /** D145: the owner was told its spare was found; the adapter deletes the row. */
  readonly foundApplied?: boolean
  /** P31/P35: lines logged after `event`, in order: tasks ticked off, the stand-up, features unlocked, a rung reached. Never the tick's only story unless nothing else happened. */
  readonly extraEvents?: readonly TickEvent[]
}
