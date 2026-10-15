/**
 * Paper Lives core types (paper-lives.md "Rules"). Content is data; the core in
 * simulate.ts reads it and never hard-codes a line a player sees.
 */

export type Stage = 'infant' | 'child' | 'teen' | 'young' | 'adult' | 'senior'
export type Season = 'spring' | 'summer' | 'autumn' | 'winter'
export type StatId = 'health' | 'happiness' | 'smarts' | 'charm'
export type Rarity = 'common' | 'uncommon' | 'rare' | 'remarkable'
export type Pronouns = 'they' | 'she' | 'he'
export type Role = 'parent' | 'sibling' | 'partner' | 'former_partner' | 'child' | 'grandchild' | 'friend' | 'colleague'
export type PartnerStep = 'dating' | 'engaged' | 'married'
export type Home = 'family' | 'renting' | 'owned'
/** `school` from 6; the education decision at 18 sets one of the last three; `university` lasts three years then reads as `degree`. */
export type Education = 'none' | 'school' | 'university' | 'degree' | 'trade' | 'work'
export type LifeStatus = 'living' | 'paused' | 'ended'
export type MoneyBand = 'debt' | 'low' | 'comfortable' | 'wealthy'
export type StatBand = 'low' | 'mid' | 'high'
export type WillKind = 'split' | 'one_child' | 'partner' | 'cause'
export type StreamName = 'birth' | 'event' | 'decision' | 'people' | 'mortality' | 'narrative'
export type StreamSeeds = Readonly<Record<StreamName, number>>
/** Story glyph on the device and in the companion (paper-lives.md "Art"). */
export type Glyph = 'family' | 'work' | 'money' | 'health' | 'heart' | 'paw' | 'star' | 'candle' | 'ring' | 'house' | 'pram' | 'book' | 'none'

export type Stats = Readonly<Record<StatId, number>>

/** The one drift a trait tilts (paper-lives.md "The life and its starting state"). */
export type TraitTilt =
  | { readonly kind: 'stat'; readonly stat: StatId; readonly perYear: number; readonly untilAge: number }
  /** Scales the yearly health decline, percent. */
  | { readonly kind: 'health'; readonly percent: number }
  | { readonly kind: 'cost'; readonly percent: number }
  | { readonly kind: 'income'; readonly percent: number }
  /** Scales the yearly drift of relationship meters toward 50, percent. */
  | { readonly kind: 'relationshipDrift'; readonly percent: number }
  /** Scales mortality between these ages, percent. */
  | { readonly kind: 'mortality'; readonly percent: number; readonly fromAge: number; readonly untilAge: number }
  /** Moves the happiness target. */
  | { readonly kind: 'happiness'; readonly target: number }
  /** Scales the chance of meeting someone, percent. */
  | { readonly kind: 'meet'; readonly percent: number }

export interface TraitDef {
  readonly id: string
  readonly name: string
  /** One plain sentence for the help page and the companion. */
  readonly blurb: string
  /** The infant-years line that reveals it. */
  readonly reveal: string
  readonly tilt: TraitTilt
}

export interface HobbyDef {
  readonly id: string
  readonly name: string
  /** "drawing" in "took up drawing". */
  readonly noun: string
}

export interface PetKindDef {
  readonly id: string
  readonly name: string
  /** Lifespan band in years, drawn when the pet arrives. */
  readonly lifespan: readonly [number, number]
}

export interface JobDef {
  readonly id: string
  readonly name: string
  /** 1 (paper round) to 5 (surgeon). */
  readonly tier: number
  /** Yearly income band; the job's income is drawn inside it when the job starts. */
  readonly income: readonly [number, number]
  /** Stat floor for an offer. */
  readonly floor?: { readonly stat: 'smarts' | 'charm'; readonly min: number }
  /** Stages the job is offered in. */
  readonly stages: readonly Stage[]
  /** A trait that lowers the floor by 15. */
  readonly easedBy?: string
  /** Content v3: the training the job needs (absent: any). */
  readonly needs?: readonly Education[]
  /** Lines when the job starts ("Started as a barista at the station cafe."), one is drawn. */
  readonly startLines: readonly string[]
}

/** Conditions an event, decision or option gate reads. Every listed field must hold. */
export interface When {
  readonly minAge?: number
  readonly maxAge?: number
  /** Any of these traits. */
  readonly traits?: readonly string[]
  /** None of these traits. */
  readonly notTraits?: readonly string[]
  readonly partner?: boolean | PartnerStep
  /** Years the partner has been at the current step (married for this long). */
  readonly partnerYears?: number
  readonly job?: boolean
  readonly retired?: boolean
  readonly education?: readonly Education[]
  readonly parentAlive?: boolean
  readonly hasChildren?: boolean
  readonly hasGrandchildren?: boolean
  /** true: any pet; a list: one of these kinds. false: no pet. */
  readonly pet?: boolean | readonly string[]
  readonly hobby?: boolean | readonly string[]
  readonly home?: readonly Home[]
  readonly money?: readonly MoneyBand[]
  readonly minGold?: number
  readonly stat?: { readonly id: StatId; readonly min?: number; readonly max?: number }
  readonly seasons?: readonly Season[]
  readonly flags?: readonly string[]
  readonly notFlags?: readonly string[]
  /** The event names a living person of this role, drawn from the `people` stream. */
  readonly person?: Role
  /** Age range of that person. */
  readonly personMinAge?: number
  readonly personMaxAge?: number
  /** Relationship range of that person. */
  /** Years the character has known that person. */
  readonly personKnownYears?: number
  readonly personMinRelationship?: number
  readonly personMaxRelationship?: number
  readonly will?: boolean
}

export interface Effects {
  readonly stats?: Partial<Record<StatId, number>>
  readonly gold?: number
  /** Relationship change for the named person (needs `when.person`), or for everyone of a role. */
  readonly relationship?: number
  readonly roleRelationship?: { readonly role: Role; readonly delta: number }
  /** A new person: a friend or colleague, a partner (dating), or a child. */
  readonly addPerson?: 'friend' | 'colleague' | 'partner' | 'child'
  /** Moves the current partner along (or ends it). */
  readonly partner?: PartnerStep | 'separate'
  readonly education?: Education
  /** `offer` runs the job offer now; `lose` ends the job; `promote` raises income by a fifth; `retire` retires. */
  readonly job?: 'offer' | 'lose' | 'promote' | 'retire' | 'change'
  /** Opens one more job tier (night school). */
  readonly tierBonus?: number
  readonly home?: Home
  /** Buys a house of this band, paying its price less the sale of the one owned. */
  readonly house?: number
  /** Sells the house for the flat (band 1) and keeps the difference. */
  readonly downsize?: boolean
  readonly hobby?: string | 'drop'
  readonly pet?: string | 'lose'
  readonly flag?: string
  readonly will?: WillKind
  /** The last health event's cause tag, read when choosing a cause of death. */
  readonly ailment?: string
}

export interface EventDef {
  readonly id: string
  readonly stage: Stage | readonly Stage[]
  readonly rarity: Rarity
  readonly glyph: Glyph
  readonly when?: When
  readonly effects?: Effects
  /** Story line, under 90 code points once filled. */
  readonly line: string
  /** Short noun phrase for the year's recap ("a cold"). */
  readonly note: string
  /** The event offers this decision when none is open. */
  readonly opens?: string
  /** Pet and hobby events are counted for the content mix. */
  readonly kind?: 'pet' | 'hobby'
  /** Weight inside its rarity tier (default 1). */
  readonly weight?: number
  /** Content v4: pays off an earlier choice (its `when.flags`), so it is drawn first while unseen (`followUpPercent`). */
  readonly followUp?: boolean
}

export interface OptionDef {
  readonly id: string
  readonly label: string
  /** Shown greyed with the reason when the gate does not hold. */
  readonly gate?: When
  readonly gateReason?: string
  readonly effects?: Effects
  readonly line: string
  readonly note: string
}

export interface DecisionDef {
  readonly id: string
  readonly stage: Stage | readonly Stage[]
  readonly rarity: Rarity
  readonly major: boolean
  readonly glyph: Glyph
  readonly when?: When
  readonly prompt: string
  readonly options: readonly OptionDef[]
  /** The gentle option a year closes with when nothing was chosen. Never gated. */
  readonly default: string
  /** Offered again in later years until a flag says it is done (the will, night school). */
  readonly recurring?: boolean
  /** Weight inside its rarity tier (default 1); the will and retirement use it to come up soon after 60. */
  readonly weight?: number
  /** Only offered when an event opens it, never drawn at a year's start. */
  readonly eventOnly?: boolean
  /** Offered whenever eligible at a year's start, ahead of the draw (education at 18, night school at 30). */
  readonly forced?: boolean
}

export interface AmbientDef {
  readonly stage: Stage
  readonly season?: Season
  readonly trait?: string
  /** Lines for the year's end (past the minimum), drawn with no season. */
  readonly yearEnd?: boolean
  readonly line: string
}

export interface CauseDef {
  readonly id: string
  readonly minAge: number
  readonly maxAge?: number
  /** Chosen when the last ailment matches. */
  readonly ailment?: string
  readonly remarkable?: boolean
  readonly weight: number
  /** The death line ("Died in {their} sleep at {age}."). */
  readonly line: string
  /** Short phrase for the record ("in their sleep"). */
  readonly phrase: string
}

export interface EpitaphDef {
  /** Needs every flag of the life summary listed (job, children, house, pet, hobby, remarkable). */
  readonly needs: readonly ('job' | 'children' | 'house' | 'pet' | 'hobby' | 'remarkable' | 'partner' | 'long')[]
  readonly line: string
}

/** Lines the core writes from its own checks rather than from the event tables. Each list is drawn from. */
export interface SystemLines {
  /** The age-0 stat reveal, keyed by the highest stat. */
  readonly born: Readonly<Record<StatId, readonly string[]>>
  readonly stage: Readonly<Record<Exclude<Stage, 'infant'>, readonly string[]>>
  readonly examGood: readonly string[]
  readonly examPoor: readonly string[]
  readonly universityDone: readonly string[]
  readonly unemployed: readonly string[]
  readonly tightYear: readonly string[]
  readonly debtCleared: readonly string[]
  readonly meet: readonly string[]
  readonly proposal: readonly string[]
  readonly wedding: readonly string[]
  readonly fallingOut: readonly string[]
  readonly reconcile: readonly string[]
  readonly separation: readonly string[]
  readonly childBorn: readonly string[]
  readonly grandchild: readonly string[]
  readonly parentDied: readonly string[]
  readonly siblingDied: readonly string[]
  readonly partnerDied: readonly string[]
  readonly friendDied: readonly string[]
  readonly petDied: readonly string[]
  readonly petArrived: readonly string[]
  readonly hobbyTaken: readonly string[]
  readonly retiredAuto: readonly string[]
  readonly quietYear: readonly string[]
  readonly firstLog: string
  /** The first line of a child's life that takes up the story ("{first} takes up the story at {age}."). */
  readonly continues: readonly string[]
}

export interface PaperLivesCatalog {
  readonly version: number
  readonly traits: readonly TraitDef[]
  readonly hobbies: readonly HobbyDef[]
  readonly pets: readonly PetKindDef[]
  readonly jobs: readonly JobDef[]
  readonly events: readonly EventDef[]
  readonly decisions: readonly DecisionDef[]
  readonly ambient: readonly AmbientDef[]
  readonly causes: readonly CauseDef[]
  readonly epitaphs: readonly EpitaphDef[]
  readonly lines: SystemLines
  /** `female` and `male` (content v2) sort some first names so the companion can say mother or father; the rest are either. */
  readonly names: { readonly first: readonly string[]; readonly last: readonly string[]; readonly pets: readonly string[]; readonly female?: readonly string[]; readonly male?: readonly string[] }
  /** House bands: price and name ("a flat"). */
  readonly houses: readonly { readonly band: number; readonly name: string; readonly price: number }[]
  readonly rarityWeights: Readonly<Record<Rarity, number>>
  readonly tuning: Tuning
}

/** Every number the harness tunes (paper-lives.md "Work slices", L1). */
export interface Tuning {
  /** Content v2: nobody is engaged before this age (v1 has no floor, so teenagers could marry at 18). */
  readonly proposalMinAge?: number
  /** Content v2: a decision an event opens is about the person the event named (v1 drew again). */
  readonly openedKeepsPerson?: boolean
  /** Content v3: the most events a year holds (v1 and v2 had no cap, so a busy year could run to six or seven). */
  readonly maxEventsPerYear?: number
  /** Content v3: the job held longest, for the epitaph and the record, is a grown-up one when there was one. */
  readonly adultJobsFirst?: boolean
  readonly minYearTicks: number
  readonly closeYearTicks: number
  /** Event chance per tick, percent, inside the minimum. */
  readonly eventPercent: Readonly<Record<Exclude<Stage, 'infant'>, number>>
  /** Event chance per tick past the minimum (the year's end). */
  readonly yearEndEventPercent: number
  /** Every Nth quiet tick writes an ambient line. */
  readonly ambientEvery: number
  /** Percent of years that open with a decision. */
  readonly decisionPercent: number
  /** Content v4: a stage's own percent of years that open with a decision, in place of `decisionPercent`. */
  readonly decisionPercentByStage?: Readonly<Partial<Record<Exclude<Stage, 'infant'>, number>>>
  /**
   * Content v4: when an event is drawn and an unseen follow-up (`EventDef.followUp`) fits, the draw takes a follow-up
   * this percent of the time, so an earlier choice pays off within a year or two rather than by luck.
   */
  readonly followUpPercent?: number
  /** Mortality per thousand a year at these ages, interpolated linearly between points. */
  readonly mortality: readonly (readonly [number, number])[]
  /** Extra mortality per thousand for each health point under 30. */
  readonly lowHealthPermille: number
  /**
   * Health drifts a quarter of the way each year toward a target that starts at `healthTarget` and falls
   * by these amounts a year from each age: [fromAge, decline]. Illness knocks health below the target and
   * it recovers; age lowers the target (Hardy slows the fall, Delicate speeds it).
   */
  readonly healthDrift: readonly (readonly [number, number])[]
  readonly healthTarget: number
  readonly livingCost: Readonly<Record<Exclude<Stage, 'infant'>, number>>
  readonly rent: number
  readonly upkeep: number
  readonly familyHomeCost: number
  readonly debtFloor: number
  readonly pensionDivisor: number
  /** Percent a year that a single adult (18 to 45) meets someone. */
  readonly meetPercent: number
  readonly proposalPercent: number
  readonly separationPercent: number
  /** Percent a year that a child arrives for a couple open to it (the `family_open` flag), 22 to 44. */
  readonly childPercent: number
  readonly grandchildPercent: number
  readonly jobOfferPercent: number
  readonly maxPeople: number
  readonly maxChildren: number
  readonly maxGrandchildren: number
  readonly maxFlags: number
}

export interface Person {
  readonly id: string
  readonly name: string
  readonly role: Role
  /** The character's age when this person was born (negative for anyone older). The person's age is `life.age - bornAt`. */
  readonly bornAt: number
  /** The character's age when this person came into the story (0 for the family at birth). */
  readonly metAt: number
  readonly relationship: number
  readonly alive: boolean
  readonly step?: PartnerStep
  /** Years the partner has been at the current step. */
  readonly stepYears?: number
  /** A grandchild's parent (one of the character's children). */
  readonly parentId?: string
  /** Set where the story knows it (a parent who was the previous character); otherwise read from the name. */
  readonly gender?: 'female' | 'male'
  /** Up to four lines of their own history. */
  readonly history: readonly string[]
}

export interface Pet {
  readonly kind: string
  readonly name: string
  readonly bornAt: number
  readonly lifespan: number
  readonly relationship: number
}

export interface PendingDecision {
  readonly decisionId: string
  readonly chosen?: string
  /** A person the decision is about, fixed when it is offered. */
  readonly personId?: string
}

export interface YearState {
  readonly elapsed: number
  readonly quietTicks: number
  readonly ageUpRequested: boolean
  readonly pending?: PendingDecision
  /** Recap notes gathered through the year, in order. */
  readonly notes: readonly string[]
  /** Story lines written this year (the harness's lines-a-year gate). */
  readonly lines: number
  /** Ambient lines written this year, so the year walks its pool without repeats. */
  readonly ambient?: number
}

export interface LifeCounters {
  readonly yearsLived: number
  readonly decisionsChosen: number
  readonly decisionsDefaulted: number
  readonly remarkableEvents: number
  readonly jobsHeld: number
  readonly marriages: number
  readonly childrenRaised: number
  readonly grandchildren: number
  readonly housesOwned: number
  readonly petsKept: number
  readonly hobbiesTaken: number
  readonly peakMoney: number
}

export interface LifeState {
  readonly first: string
  readonly last: string
  readonly pronouns: Pronouns
  readonly traits: readonly [string, string]
  readonly generation: number
  readonly age: number
  readonly stage: Stage
  readonly status: LifeStatus
  readonly stats: Stats
  /** Money (the `gold` field, as the other games). */
  readonly gold: number
  readonly education: Education
  readonly tierBonus: number
  readonly job?: string
  readonly jobSince?: number
  readonly income: number
  /** Years in each job held, for the epitaph's job held longest. */
  readonly jobYears: Readonly<Record<string, number>>
  readonly retired: boolean
  readonly pension: number
  readonly home: Home
  readonly house?: number
  readonly hobby?: string
  /** Every hobby this life has taken up, for the account's Pastimes. */
  readonly hobbiesHad?: readonly string[]
  readonly pet?: Pet
  /** The character's age when the last pet died; a new one can follow a year later. */
  readonly petLostAt?: number
  readonly people: readonly Person[]
  readonly flags: readonly string[]
  /** Event and decision ids already seen in this life; pools skip them. */
  readonly seen: readonly string[]
  readonly year: YearState
  readonly recap?: string
  readonly will?: WillKind
  readonly ailment?: string
  readonly nextPersonId: number
  readonly counters: LifeCounters
  /** Up to sixteen highlight lines (major decisions and remarkable events), newest last. */
  readonly highlights: readonly string[]
  readonly death?: { readonly cause: string; readonly line: string; readonly epitaph: string }
}

/** What a story line's effect changed: stat points and money, as written on the line (template v7). */
export interface LineChanges {
  readonly stats?: Partial<Record<StatId, number>>
  readonly gold?: number
}

export interface LifeEvent {
  readonly kind: 'event' | 'ambient' | 'decision_offered' | 'decision_resolved' | 'check' | 'stage' | 'recap' | 'death' | 'infant'
  readonly glyph: Glyph
  /** The age the line is marked with. */
  readonly age: number
  readonly summary: string
  readonly remarkable?: boolean
  readonly major?: boolean
  /** The stats and money this line's effect moved; absent when it moved none. */
  readonly changes?: LineChanges
}

export interface TickInput {
  readonly life: LifeState
  readonly content: PaperLivesCatalog
  readonly streams: StreamSeeds
}

export interface TickResult {
  readonly life: LifeState
  readonly events: readonly LifeEvent[]
  readonly disposition: 'idle' | 'year' | 'boundary' | 'died'
  /** Set when the life ended on this tick. */
  readonly record?: LifeRecord
}

export interface Bequest {
  readonly personId: string
  readonly gold: number
  readonly house: boolean
}

/** A living child or grandchild at the death, for `begin('child')`. */
export interface Heir {
  readonly id: string
  readonly name: string
  readonly role: 'child' | 'grandchild'
  readonly age: number
  readonly relationship: number
  readonly parentId?: string
}

export interface LifeRecord {
  readonly first: string
  readonly last: string
  readonly pronouns: Pronouns
  readonly traits: readonly [string, string]
  readonly generation: number
  readonly age: number
  readonly cause: string
  readonly epitaph: string
  readonly finalStats: Stats
  readonly peakMoney: number
  readonly finalGold: number
  readonly longestJob?: string
  readonly hobby?: string
  readonly counters: LifeCounters
  readonly house?: number
  readonly will?: WillKind
  readonly bequests: readonly Bequest[]
  readonly highlights: readonly string[]
  /** Living children and grandchildren at death, for `begin('child')`. */
  readonly heirs: readonly Heir[]
  readonly partner?: { readonly name: string; readonly age: number; readonly relationship: number }
}
