import { defineSchema, defineTable } from 'convex/server'
import { v } from 'convex/values'
import { logDetail, todoKind } from './lib/logDetail'
import { DESK_CRAWLER_TABLES, IDLE_ANGLER_TABLES, LITTLE_PLOT_TABLES, PAPER_LIVES_TABLES, PIXEL_WARS_TABLES, engineTables, rankingTables } from './lib/engine/tables'
import { accessId, anglerCounters, baitClass, logbookEntry, iaLogDetail, iaLogKind, order, season, timeBand, waterId, weather } from './idleAngler/validators'
import { career as plCareer, glyph as plGlyph, lifeBoard, lifeRecordFields, lifeState, lineChanges as plLineChanges, plLogKind, portraitKey as plPortraitKey } from './paperLives/validators'
import { lpLogDetail, lpLogKind, plotState as lpPlotState } from './littlePlot/validators'
import { deskCounters as pwDeskCounters, faction as pwFaction, factionId as pwFactionId, mapEvent as pwMapEvent, orderKind as pwOrderKind, pwLogDetail, pwLogKind, seat as pwSeat, seatEvents as pwSeatEvents, share as pwShare, weekTally as pwWeekTally } from './pixelWars/validators'

/** Desk Crawler's engine tables (world, runs, score windows, leaderboard sets), from the shared factory (S0). */
const deskCrawlerEngine = { ...engineTables(DESK_CRAWLER_TABLES, ['deaths', 'levelUps', 'heldFinds']), ...rankingTables(DESK_CRAWLER_TABLES) }

/** Idle Angler's engine tables, prefixed `ia` so retention and deletion stay per game (idle-angler.md "Data"); no XP boards (D116). */
const idleAnglerEngine = engineTables(IDLE_ANGLER_TABLES, ['landed', 'released', 'gotAway'])

/** Paper Lives' engine tables, prefixed `pl` (paper-lives.md "Data"); no XP boards, its boards are life records. */
const paperLivesEngine = engineTables(PAPER_LIVES_TABLES, ['events', 'years', 'deaths'])
/** Little Plot's engine tables, prefixed `lp` (little-plot.md "Data"); it ranks by XP like Desk Crawler, so it has the ranking tables too. */
const littlePlotEngine = { ...engineTables(LITTLE_PLOT_TABLES, ['ripenings', 'pests', 'visits']), ...rankingTables(LITTLE_PLOT_TABLES) }
/** Pixel Wars' engine tables, prefixed `pw` (pixel-wars.md "Data"); XP boards like Desk Crawler's. */
const pixelWarsEngine = { ...engineTables(PIXEL_WARS_TABLES, ['orders', 'flips', 'desksTaken']), ...rankingTables(PIXEL_WARS_TABLES) }

/**
 * Current-release schema only (data-model.md). Tables arrive with the work
 * package that uses them; future systems use additive migrations.
 */

/** Where a launch-list signup came from: the share link, the signed-out QR pitch, the game page, the home page or a signed-in account. */

/** D169: the languages the games speak (`@trmnl-games/platform` LOCALES). */
export const locale = v.union(v.literal('en'), v.literal('fr'), v.literal('de'), v.literal('es'), v.literal('it'), v.literal('pt'), v.literal('pl'), v.literal('nl'))

export const heroStatus = v.union(
  v.literal('exploring'),
  v.literal('resting'),
  v.literal('travelling'),
  v.literal('dead'),
  v.literal('paused'),
  v.literal('sleeping'),
)

export const rarity = v.union(v.literal('common'), v.literal('uncommon'), v.literal('rare'), v.literal('epic'))
/** D129: `material` rows are the workbench's stack rows, outside the bag like potions. */
export const itemKind = v.union(v.literal('weapon'), v.literal('armor'), v.literal('potion'), v.literal('material'))

/**
 * Lifetime counters (D65): grow-only safe integers; `monsterWins` is keyed by catalog monster id.
 * The nine D65 counters are optional in storage until `achievements.backfillCounters` has visited
 * every hero; every read path normalizes a missing counter to zero (`withCounterDefaults`).
 */
export const heroCounters = v.object({
  combatWins: v.number(),
  retreats: v.number(),
  deaths: v.number(),
  rescues: v.number(),
  goldEarned: v.number(),
  itemsFound: v.number(),
  ticksExplored: v.number(),
  monsterWins: v.optional(v.record(v.string(), v.number())),
  /** D133: arrivals per biome id; written by the simulator from content v16 on. */
  biomesVisited: v.optional(v.record(v.string(), v.number())),
  eliteWins: v.optional(v.number()),
  jackpots: v.optional(v.number()),
  rareFinds: v.optional(v.number()),
  potionsUsed: v.optional(v.number()),
  trapsAvoided: v.optional(v.number()),
  restTicks: v.optional(v.number()),
  trips: v.optional(v.number()),
  itemsSold: v.optional(v.number()),
  /** D76: stance switches made in the companion. */
  stanceChanges: v.optional(v.number()),
  /** D78: merchant offers bought, and merchant visits met. */
  purchases: v.optional(v.number()),
  merchantVisits: v.optional(v.number()),
  /** D79: choices answered in the companion, and choices that defaulted at expiry. */
  choicesMade: v.optional(v.number()),
  choicesDefaulted: v.optional(v.number()),
  /** D81: epic gear found. */
  epicFinds: v.optional(v.number()),
  /** D110: raids launched, won as the raider, repelled and lost as the target. */
  raidsLaunched: v.optional(v.number()),
  raidsWon: v.optional(v.number()),
  raidsRepelled: v.optional(v.number()),
  raidsLost: v.optional(v.number()),
  /** Legacy (D111, removed in D123): gear finds the desk drawer caught. Read by nothing; kept so stored counters validate. */
  drawerFinds: v.optional(v.number()),
  /** P31: to-do tasks ticked off. */
  tasksCompleted: v.optional(v.number()),
  /** P35: gear equipped in the companion, and career rungs reached. */
  itemsEquipped: v.optional(v.number()),
  careerRungs: v.optional(v.number()),
  /** D129: gear salvaged, workbench steps applied, and the highest reinforcement reached. */
  itemsSalvaged: v.optional(v.number()),
  gearUpgraded: v.optional(v.number()),
  topReinforcement: v.optional(v.number()),
  /** D131: major potions made by combining. */
  potionsCombined: v.optional(v.number()),
  /** D139: occasions announced to this hero, and Friday the 13th raid mishaps from either side. */
  occasionsSeen: v.optional(v.number()),
  raidMishaps: v.optional(v.number()),
  /** D141: meetings from either side. */
  meetings: v.optional(v.number()),
  /** D145: other players' spares this hero found. */
  lostPropertyFound: v.optional(v.number()),
  standoffsWon: v.optional(v.number()),
})

/** P35: the hero's place on the career ladder, written by the simulator. */
export const careerState = v.object({
  rung: v.number(),
  startedTick: v.number(),
  armedAt: v.optional(v.number()),
  armedCount: v.optional(v.number()),
  fired: v.optional(v.literal(true)),
  reached: v.array(v.object({ id: v.string(), tick: v.number(), at: v.optional(v.number()) })),
  /** D129: rewards waiting for the companion's Claim button. */
  unclaimed: v.optional(v.array(v.object({ id: v.string(), gold: v.number(), tick: v.number(), at: v.optional(v.number()) }))),
})

/** P31: the office to-do list, three tasks written by the simulator and swapped by `heroes.swapTask`. */
export const todoList = v.object({
  tasks: v.array(
    v.object({
      templateId: todoKind,
      biomeId: v.optional(v.string()),
      monsterId: v.optional(v.string()),
      target: v.number(),
      progress: v.number(),
      reward: v.number(),
      addedTick: v.number(),
      refillsSeen: v.number(),
      doneTick: v.optional(v.number()),
    }),
  ),
  lastRefillTick: v.number(),
  lastStandupAt: v.number(),
  swapUsedTick: v.optional(v.number()),
})

/** D78 merchant offers: at most three, each bought at most once. */
export const merchantOffer = v.object({
  id: v.union(v.literal('potions'), v.literal('pouch'), v.literal('bag')),
  name: v.string(),
  quantity: v.number(),
  price: v.number(),
  tierId: v.optional(v.string()),
})
export const merchantVisit = v.object({ offers: v.array(merchantOffer), expiresAtTick: v.number(), biomeId: v.string() })

/** P33: the two alert kinds; a new kind needs its own decision row (alerts.md). */
export const alertKind = v.union(v.literal('asleep'), v.literal('merchant'), v.literal('cooler_full'), v.literal('bait_out'), v.literal('major_decision'), v.literal('life_ended'), v.literal('new_arrival'), v.literal('beds_ripe'), v.literal('new_seed'), v.literal('desk_taken'), v.literal('lead_lost'), v.literal('bell'))
export const alertPreferences = v.object({
  asleep: v.boolean(),
  merchant: v.boolean(),
  /** D115: Idle Angler's kinds; absent means off. Devices and quiet hours are shared by both games. */
  coolerFull: v.optional(v.boolean()),
  baitOut: v.optional(v.boolean()),
  /** D159: Paper Lives' kinds; absent means off. */
  majorDecision: v.optional(v.boolean()),
  lifeEnded: v.optional(v.boolean()),
  newArrival: v.optional(v.boolean()),
  /** D206: Little Plot's kinds; absent means off. */
  bedsRipe: v.optional(v.boolean()),
  newSeed: v.optional(v.boolean()),
  /** D214: Pixel Wars' kinds; absent means off. */
  deskTaken: v.optional(v.boolean()),
  leadLost: v.optional(v.boolean()),
  bell: v.optional(v.boolean()),
  quietStart: v.number(),
  quietEnd: v.number(),
  /** Set when the last device's subscription went stale and both kinds turned off; Settings says why. */
  offReason: v.optional(v.literal('no_devices')),
})

export const logKind = v.union(
  v.literal('combat'),
  v.literal('loot'),
  v.literal('trap'),
  v.literal('rest'),
  v.literal('travel'),
  v.literal('death'),
  v.literal('revive'),
  v.literal('levelup'),
  v.literal('achievement'),
  v.literal('merchant'),
  v.literal('choice'),
  v.literal('raid'),
  v.literal('meeting'),
  v.literal('lost_property'),
  v.literal('todo'),
  v.literal('career'),
  v.literal('occasion'),
  v.literal('system'),
)

/** Every registered game (packages/platform). Storage accepts any of them; each write path still names its own game. */
export const gameSlug = v.union(v.literal('desk-crawler'), v.literal('idle-angler'), v.literal('paper-lives'), v.literal('little-plot'), v.literal('pixel-wars'))
export const gameStatus = v.union(v.literal('hidden'), v.literal('preview'), v.literal('live'))

/** D149: a hero's look; chosen free at creation, changed later with a makeover. */
export const heroGender = v.union(v.literal('male'), v.literal('female'))

export default defineSchema({
  /**
   * Platform achievement rarity (D115): `current` is the last finished daily tally, `building` the one in progress.
   * `totalPlayers` counts users with at least one active game character.
   */
  platformStats: defineTable({
    key: v.union(v.literal('current'), v.literal('building')),
    counts: v.record(v.string(), v.number()),
    totalPlayers: v.number(),
    cursor: v.optional(v.string()),
    at: v.number(),
  }).index('by_key', ['key']),

  /**
   * Desk Crawler's public office tally (D174): one row, replaced at the end of each tick's hero walk.
   * Heroes who have started, the monsters they have defeated and the gear they have found.
   */
  officeCensus: defineTable({
    key: v.literal('current'),
    heroes: v.number(),
    monstersDefeated: v.number(),
    finds: v.number(),
    asOfTick: v.number(),
    /** Extra lifetime totals (D174). Optional so a row written before them still validates; the page hides a zero. */
    sold: v.optional(v.number()),
    salvaged: v.optional(v.number()),
    potions: v.optional(v.number()),
    upgraded: v.optional(v.number()),
    raids: v.optional(v.number()),
    tasks: v.optional(v.number()),
  }).index('by_key', ['key']),

  /** Server-controlled game lifecycle (idle-angler.md "Architecture"): one row per game once an admin sets its status. */
  platformGames: defineTable({
    slug: gameSlug,
    status: gameStatus,
    updatedAt: v.number(),
  }).index('by_slug', ['slug']),

  worldState: deskCrawlerEngine.world,
  /**
   * Census totals are optional so a run stored before D174 still validates. They are summed across the hero walk
   * and copied to `officeCensus` when the walk finishes; they are not engine counters, which are required on every run.
   */
  simulationRuns: defineTable({
    ...deskCrawlerEngine.runFields,
    censusHeroes: v.optional(v.number()),
    censusMonsters: v.optional(v.number()),
    censusFinds: v.optional(v.number()),
    censusSold: v.optional(v.number()),
    censusSalvaged: v.optional(v.number()),
    censusPotions: v.optional(v.number()),
    censusUpgraded: v.optional(v.number()),
    censusRaids: v.optional(v.number()),
    censusTasks: v.optional(v.number()),
  }).index('by_tick', ['tick']).index('by_state_and_startedAt', ['state', 'startedAt']),
  simulationFailures: deskCrawlerEngine.failures,
  heroScoreWindows: deskCrawlerEngine.scoreWindows,
  rankInputs: deskCrawlerEngine.rankInputs,
  leaderboardPublications: defineTable(deskCrawlerEngine.publicationFields).index('by_runId', ['runId']).index('by_state', ['state']),
  leaderboardGenerations: deskCrawlerEngine.generations,
  heroRanks: deskCrawlerEngine.ranks,
  achievementStats: deskCrawlerEngine.achievementStats,

  iaWorldState: idleAnglerEngine.world,
  iaSimulationRuns: defineTable(idleAnglerEngine.runFields).index('by_tick', ['tick']).index('by_state_and_startedAt', ['state', 'startedAt']),
  iaSimulationFailures: idleAnglerEngine.failures,
  iaLeaderboardPublications: defineTable(idleAnglerEngine.publicationFields).index('by_runId', ['runId']).index('by_state', ['state']),
  iaAchievementStats: idleAnglerEngine.achievementStats,

  /** One per user once they start Idle Angler (D115), like `deskCrawlerProfiles`. */
  idleAnglerProfiles: defineTable({
    userId: v.id('users'),
    state: v.union(v.literal('active'), v.literal('deleting')),
    anglerId: v.optional(v.id('anglers')),
    createdAt: v.number(),
  }).index('by_userId', ['userId']),

  /** The Idle Angler player character. Engine tables call it `heroId` (lib/engine/tables.ts). */
  anglers: defineTable({
    userId: v.id('users'),
    createdAt: v.number(),
    isActive: v.boolean(),
    activationState: v.union(v.literal('pending_trmnl'), v.literal('active')),
    activatedAt: v.optional(v.number()),
    gold: v.number(),
    status: v.union(v.literal('fishing'), v.literal('paused')),
    waterId,
    travelTo: v.optional(waterId),
    rodTier: v.number(),
    coolerTier: v.number(),
    baitOnHook: v.optional(baitClass),
    bait: v.record(v.string(), v.number()),
    access: v.array(accessId),
    logbook: v.record(v.string(), logbookEntry),
    counters: anglerCounters,
    quietTicks: v.number(),
    publicProfile: v.optional(v.boolean()),
    eligibleFromTick: v.number(),
    lastTick: v.number(),
    lastProgressTick: v.number(),
    lastAdvancedAt: v.optional(v.number()),
    logSequence: v.number(),
    simulationState: v.union(v.literal('healthy'), v.literal('quarantined')),
    quarantineReasonCode: v.optional(v.string()),
    achievementsVersion: v.optional(v.number()),
    // D162 (content v2): the goal, the fishmonger's slate, a charter ticket, the wall's pegs and the last run announced.
    goal: v.optional(v.object({ rung: v.number(), castsAtStart: v.number(), unclaimed: v.optional(v.array(v.object({ id: v.string(), coins: v.number() }))) })),
    orders: v.optional(v.array(order)),
    ordersDay: v.optional(v.number()),
    swapDay: v.optional(v.number()),
    charterCasts: v.optional(v.number()),
    pegs: v.optional(v.number()),
    runSeen: v.optional(v.string()),
  })
    .index('by_userId_and_isActive', ['userId', 'isActive'])
    .index('by_createdAt', ['createdAt'])
    .index('by_simulationState', ['simulationState']),

  /** Idle Angler's fly box (D115, the D46 shape): one fly a week from the device's code; cosmetic only. */
  flyBoxes: defineTable({
    userId: v.id('users'),
    totalCollected: v.number(),
    lastClaimWeek: v.number(),
    lastClaimedAt: v.number(),
  }).index('by_userId', ['userId']),

  /** One row per earned Idle Angler achievement, keyed by owner (D65 shape); bounded by the catalog. */
  iaAchievements: defineTable({
    userId: v.id('users'),
    anglerId: v.id('anglers'),
    achievementId: v.string(),
    unlockedAt: v.number(),
    tick: v.number(),
    catalogVersion: v.number(),
  })
    .index('by_userId_and_achievementId', ['userId', 'achievementId'])
    .index('by_userId_and_unlockedAt', ['userId', 'unlockedAt']),

  /** Fish in an angler's cooler, at most the cooler's capacity (24 at the top tier). Sold explicitly. */
  catches: defineTable({
    anglerId: v.id('anglers'),
    speciesId: v.string(),
    grams: v.number(),
    value: v.number(),
    caughtTick: v.number(),
    contentVersion: v.string(),
    createdAt: v.number(),
    /** D162: when and how it was caught, for fishmonger orders (content v2). */
    band: v.optional(timeBand),
    weather: v.optional(weather),
    season: v.optional(season),
  }).index('by_anglerId', ['anglerId']),

  /**
   * Idle Angler boards (2026-10-10): each angler's heaviest fish per water, once for the week (`period` is the Monday,
   * "w2026-10-05", UTC) and once for all time ("all"). A landed fish, kept or released, replaces the row when heavier.
   * `earlierFirst` is minus the catch time, so equal weights rank the earlier catch first.
   */
  iaCatchRecords: defineTable({
    waterId,
    period: v.string(),
    anglerId: v.id('anglers'),
    userId: v.id('users'),
    speciesId: v.string(),
    grams: v.number(),
    at: v.number(),
    earlierFirst: v.number(),
  })
    .index('by_waterId_and_period_and_grams', ['waterId', 'period', 'grams', 'earlierFirst'])
    .index('by_anglerId_and_waterId_and_period', ['anglerId', 'waterId', 'period'])
    .index('by_period', ['period']),

  plWorldState: paperLivesEngine.world,
  plSimulationRuns: defineTable(paperLivesEngine.runFields).index('by_tick', ['tick']).index('by_state_and_startedAt', ['state', 'startedAt']),
  plSimulationFailures: paperLivesEngine.failures,
  plLeaderboardPublications: defineTable(paperLivesEngine.publicationFields).index('by_runId', ['runId']).index('by_state', ['state']),
  plAchievementStats: paperLivesEngine.achievementStats,

  lpWorldState: littlePlotEngine.world,
  lpSimulationRuns: defineTable(littlePlotEngine.runFields).index('by_tick', ['tick']).index('by_state_and_startedAt', ['state', 'startedAt']),
  lpSimulationFailures: littlePlotEngine.failures,
  lpScoreWindows: littlePlotEngine.scoreWindows,
  lpRankInputs: littlePlotEngine.rankInputs,
  lpLeaderboardPublications: defineTable(littlePlotEngine.publicationFields).index('by_runId', ['runId']).index('by_state', ['state']),
  lpLeaderboardGenerations: littlePlotEngine.generations,
  lpRanks: littlePlotEngine.ranks,
  lpAchievementStats: littlePlotEngine.achievementStats,

  pwWorldState: pixelWarsEngine.world,
  pwSimulationRuns: defineTable(pixelWarsEngine.runFields).index('by_tick', ['tick']).index('by_state_and_startedAt', ['state', 'startedAt']),
  pwSimulationFailures: pixelWarsEngine.failures,
  pwScoreWindows: pixelWarsEngine.scoreWindows,
  pwRankInputs: pixelWarsEngine.rankInputs,
  pwLeaderboardPublications: defineTable(pixelWarsEngine.publicationFields).index('by_runId', ['runId']).index('by_state', ['state']),
  pwLeaderboardGenerations: pixelWarsEngine.generations,
  pwRanks: pixelWarsEngine.ranks,
  pwAchievementStats: pixelWarsEngine.achievementStats,

  /** One per user once they start Pixel Wars (D214), like `littlePlotProfiles`. */
  pixelWarsProfiles: defineTable({
    userId: v.id('users'),
    state: v.union(v.literal('active'), v.literal('deleting')),
    deskId: v.optional(v.id('desks')),
    createdAt: v.number(),
  }).index('by_userId', ['userId']),

  /**
   * The Pixel Wars player character (pixel-wars.md "Desks, maps and placement"): one per account, placed on a map
   * once a faction is chosen. Engine tables call it `heroId` (lib/engine/tables.ts). The well accrues lazily from
   * `well.tick`; `faction` 0 means not chosen yet.
   */
  desks: defineTable({
    userId: v.id('users'),
    createdAt: v.number(),
    isActive: v.boolean(),
    activationState: v.union(v.literal('pending_trmnl'), v.literal('active')),
    activatedAt: v.optional(v.number()),
    mapId: v.optional(v.id('pwMaps')),
    seat: v.optional(v.number()),
    faction: pwFaction,
    level: v.number(),
    xp: v.number(),
    lifetimeXp: v.number(),
    lastLevelUpTick: v.number(),
    scoreHourXp: v.number(),
    scoreHour: v.optional(v.number()),
    publicProfile: v.optional(v.boolean()),
    counters: pwDeskCounters,
    week: pwWeekTally,
    goal: v.object({ rung: v.number() }),
    well: v.object({ drops: v.number(), tick: v.number() }),
    /** The keepsake week the desk last saw a bell for, so the first tick of a new week refills and tallies once. */
    seasonWeek: v.number(),
    /** The week a faction switch was last made, one a season. */
    switchedWeek: v.optional(v.number()),
    /** The desk whose link placed this one, and this desk's own link code. */
    invitedBy: v.optional(v.id('desks')),
    inviteCode: v.string(),
    /** Cleared to ground after the owner's screens went silent (pixel-wars.md "Desks, maps and placement"). */
    cleared: v.optional(v.boolean()),
    eligibleFromTick: v.number(),
    lastTick: v.number(),
    lastProgressTick: v.number(),
    lastAdvancedAt: v.optional(v.number()),
    logSequence: v.number(),
    simulationState: v.union(v.literal('healthy'), v.literal('quarantined')),
    quarantineReasonCode: v.optional(v.string()),
    achievementsVersion: v.optional(v.number()),
  })
    .index('by_userId_and_isActive', ['userId', 'isActive'])
    .index('by_createdAt', ['createdAt'])
    .index('by_mapId_and_seat', ['mapId', 'seat'])
    .index('by_inviteCode', ['inviteCode'])
    .index('by_simulationState', ['simulationState']),

  /**
   * A map (pixel-wars.md "Data"): the live cells and painters as bytes, the seats, the cached shares and the season
   * running score. One row, the global map, in the MVP; `kind` and the per-row shape are what offices (v1.1) reuse.
   */
  pwMaps: defineTable({
    kind: v.union(v.literal('global'), v.literal('office')),
    x0: v.number(),
    y0: v.number(),
    cols: v.number(),
    rows: v.number(),
    cells: v.bytes(),
    painters: v.bytes(),
    seats: v.array(pwSeat),
    currentTick: v.number(),
    seasonWeek: v.number(),
    /** Index 1 to 4: the week's cumulative score per faction. */
    seasonScore: v.array(v.number()),
    shares: v.array(pwShare),
    lastLeader: v.optional(pwFactionId),
    leadChanges: v.number(),
    lastWinner: v.optional(pwFactionId),
    createdAt: v.number(),
  }).index('by_kind', ['kind']),

  /** One snapshot per map per tick, the last eight kept: what the device renders and what the per-desk step reads. */
  pwMapTicks: defineTable({
    mapId: v.id('pwMaps'),
    tick: v.number(),
    at: v.number(),
    x0: v.number(),
    y0: v.number(),
    cols: v.number(),
    rows: v.number(),
    cells: v.bytes(),
    painters: v.bytes(),
    shares: v.array(pwShare),
    events: v.array(pwMapEvent),
    /** Keyed by seat number. */
    seatEvents: v.record(v.string(), pwSeatEvents),
    /** Up to three lines for the device, aliases already resolved. */
    lines: v.array(v.string()),
    bell: v.optional(v.boolean()),
    /** The faction that led before this tick and the one leading after, when they differ (for the lead-lost alert). */
    leaderFrom: v.optional(pwFactionId),
    leaderTo: v.optional(pwFactionId),
  })
    .index('by_mapId_and_tick', ['mapId', 'tick'])
    .index('by_at', ['at']),

  /** The orders queued for one map and tick, sharded by seat so a busy quarter-hour never fills one document. */
  pwOrderBoards: defineTable({
    mapId: v.id('pwMaps'),
    tick: v.number(),
    shard: v.number(),
    orders: v.array(v.object({ s: v.number(), x: v.number(), y: v.number(), k: pwOrderKind, d: v.number() })),
  }).index('by_mapId_and_tick_and_shard', ['mapId', 'tick', 'shard']),

  /** A player's own queued orders, for the companion's queue and Cancel; the desk's step deletes its resolved rows. */
  pwOrders: defineTable({
    deskId: v.id('desks'),
    mapId: v.id('pwMaps'),
    tick: v.number(),
    x: v.number(),
    y: v.number(),
    kind: pwOrderKind,
    drops: v.number(),
    createdAt: v.number(),
  })
    .index('by_deskId_and_tick', ['deskId', 'tick'])
    .index('by_createdAt', ['createdAt']),

  /** A finished week: the final map for the print and the standings. */
  pwSeasons: defineTable({
    mapId: v.id('pwMaps'),
    week: v.number(),
    endedAt: v.number(),
    x0: v.number(),
    y0: v.number(),
    cols: v.number(),
    rows: v.number(),
    cells: v.bytes(),
    standings: v.array(v.object({ faction: pwFactionId, score: v.number(), percent: v.number() })),
    winner: pwFactionId,
    desks: v.number(),
  }).index('by_mapId_and_week', ['mapId', 'week']),

  /** One row per earned Pixel Wars achievement, keyed by owner (D65 shape); bounded by the catalog. */
  pwAchievements: defineTable({
    userId: v.id('users'),
    deskId: v.id('desks'),
    achievementId: v.string(),
    unlockedAt: v.number(),
    tick: v.number(),
    catalogVersion: v.number(),
  })
    .index('by_userId_and_achievementId', ['userId', 'achievementId'])
    .index('by_userId_and_unlockedAt', ['userId', 'unlockedAt']),

  /** A desk's story lines: what fell and came back, what it took, the bell, goals and achievements. */
  pwTickLogs: defineTable({
    deskId: v.id('desks'),
    source: v.union(v.literal('tick'), v.literal('command'), v.literal('lifecycle')),
    tick: v.optional(v.number()),
    runId: v.optional(v.id('pwSimulationRuns')),
    sequence: v.number(),
    at: v.number(),
    kind: pwLogKind,
    summary: v.string(),
    detail: pwLogDetail,
  })
    .index('by_deskId_and_at_and_sequence', ['deskId', 'at', 'sequence'])
    .index('by_at', ['at']),

  /** One per user once they start Little Plot (D206), like `idleAnglerProfiles`. The pressed flowers (the D46 shape) live here. */
  littlePlotProfiles: defineTable({
    userId: v.id('users'),
    state: v.union(v.literal('active'), v.literal('deleting')),
    plotId: v.optional(v.id('plots')),
    flowers: v.optional(v.object({ totalCollected: v.number(), lastClaimWeek: v.number(), lastClaimedAt: v.number() })),
    createdAt: v.number(),
  }).index('by_userId', ['userId']),

  /**
   * The Little Plot player character: the pure core's state stored whole in `plot` (littlePlot/validators.ts), with the
   * level, XP and gold mirrored on top for ranking and lists. Engine tables call it `heroId` (lib/engine/tables.ts).
   */
  plots: defineTable({
    userId: v.id('users'),
    createdAt: v.number(),
    isActive: v.boolean(),
    activationState: v.union(v.literal('pending_trmnl'), v.literal('active')),
    activatedAt: v.optional(v.number()),
    plot: lpPlotState,
    level: v.number(),
    xp: v.number(),
    gold: v.number(),
    lastLevelUpTick: v.number(),
    /** D31: XP granted in the current UTC hour, folded into the score window at publication. */
    scoreHourXp: v.number(),
    scoreHour: v.optional(v.number()),
    publicProfile: v.optional(v.boolean()),
    /** The UTC day the last cutting was sent, one a day. */
    lastCuttingDay: v.optional(v.number()),
    eligibleFromTick: v.number(),
    lastTick: v.number(),
    lastProgressTick: v.number(),
    lastAdvancedAt: v.optional(v.number()),
    logSequence: v.number(),
    simulationState: v.union(v.literal('healthy'), v.literal('quarantined')),
    quarantineReasonCode: v.optional(v.string()),
    achievementsVersion: v.optional(v.number()),
  })
    .index('by_userId_and_isActive', ['userId', 'isActive'])
    .index('by_createdAt', ['createdAt'])
    .index('by_simulationState', ['simulationState']),

  /** One row per earned Little Plot achievement, keyed by owner (D65 shape); bounded by the catalog. */
  lpAchievements: defineTable({
    userId: v.id('users'),
    plotId: v.id('plots'),
    achievementId: v.string(),
    unlockedAt: v.number(),
    tick: v.number(),
    catalogVersion: v.number(),
  })
    .index('by_userId_and_achievementId', ['userId', 'achievementId'])
    .index('by_userId_and_unlockedAt', ['userId', 'unlockedAt']),

  /**
   * The gnome pool (little-plot.md "Gnomes from other gardens"), the raid pool's shape: one row per plot at a random
   * shard, in its level group, drawable while its page is public and it is growing. A drawn row moves to a new shard
   * and records when, so nobody is everyone's target.
   */
  lpGnomePool: defineTable({
    plotId: v.id('plots'),
    userId: v.id('users'),
    cohortKey: v.string(),
    eligible: v.boolean(),
    shard: v.number(),
    lastActiveTick: v.number(),
    visitedAtTick: v.optional(v.number()),
  })
    .index('by_plotId', ['plotId'])
    .index('by_cohortKey_and_eligible_and_shard', ['cohortKey', 'eligible', 'shard']),

  /**
   * The seed ledger between gardens: a gnome's haul or a friend's cutting, written by the sending plot's tick or intent
   * and applied by the receiving plot at its next evaluation, so each plot only writes its own document. The applied
   * rows are the week's visit history (at most 30 per plot).
   */
  lpVisits: defineTable({
    plotId: v.id('plots'),
    fromPlotId: v.id('plots'),
    fromUserId: v.id('users'),
    fromName: v.string(),
    fromNameVersion: v.number(),
    kindId: v.optional(v.string()),
    effect: v.union(v.literal('gain'), v.literal('lose'), v.literal('none')),
    cutting: v.optional(v.literal(true)),
    caught: v.optional(v.literal(true)),
    tick: v.number(),
    state: v.union(v.literal('pending'), v.literal('applied'), v.literal('void')),
    appliedTick: v.optional(v.number()),
    createdAt: v.number(),
  })
    .index('by_plotId_and_state_and_tick', ['plotId', 'state', 'tick'])
    .index('by_plotId_and_tick', ['plotId', 'tick']),

  /** A plot's story lines: stages, ripenings, pests, visits, goals and the player's own actions. */
  lpTickLogs: defineTable({
    plotId: v.id('plots'),
    source: v.union(v.literal('tick'), v.literal('command'), v.literal('lifecycle')),
    tick: v.optional(v.number()),
    runId: v.optional(v.id('lpSimulationRuns')),
    sequence: v.number(),
    at: v.number(),
    kind: lpLogKind,
    summary: v.string(),
    detail: lpLogDetail,
  })
    .index('by_plotId_and_at_and_sequence', ['plotId', 'at', 'sequence'])
    .index('by_at', ['at']),

  /** One per user once they start Paper Lives (D159), like `idleAnglerProfiles`. */
  paperLivesProfiles: defineTable({
    userId: v.id('users'),
    state: v.union(v.literal('active'), v.literal('deleting')),
    lifeId: v.optional(v.id('lives')),
    /** The totals of the account's finished lives, for achievements (D159, L5). */
    career: v.optional(plCareer),
    /** L6: photos claimed with the weekly device code, and the week of the newest. */
    photosClaimed: v.optional(v.number()),
    lastPhotoWeek: v.optional(v.number()),
    createdAt: v.number(),
  }).index('by_userId', ['userId']),

  /**
   * L6: a photo claimed with the weekly device code, one per account a week: the character as they were that week,
   * kept with the life it was taken in (by ordinal) after that life ends.
   */
  plPhotos: defineTable({
    userId: v.id('users'),
    lifeId: v.id('lives'),
    ordinal: v.number(),
    week: v.number(),
    takenAt: v.number(),
    name: v.string(),
    age: v.number(),
    petName: v.optional(v.string()),
    portrait: plPortraitKey,
  }).index('by_userId_and_ordinal', ['userId', 'ordinal']),

  /** One row per earned Paper Lives achievement, keyed by owner (D65 shape); bounded by the catalog. */
  plAchievements: defineTable({
    userId: v.id('users'),
    achievementId: v.string(),
    unlockedAt: v.number(),
    tick: v.number(),
    catalogVersion: v.number(),
  })
    .index('by_userId_and_achievementId', ['userId', 'achievementId'])
    .index('by_userId_and_unlockedAt', ['userId', 'unlockedAt']),

  /**
   * The Paper Lives player character: the account's current life, the pure core's state stored whole in `life`
   * (paperLives/validators.ts). An ended life stays the current row until the next life begins in place, so the
   * profile pointer never changes. Engine tables call it `heroId` (lib/engine/tables.ts).
   */
  lives: defineTable({
    userId: v.id('users'),
    createdAt: v.number(),
    isActive: v.boolean(),
    activationState: v.union(v.literal('pending_trmnl'), v.literal('active')),
    activatedAt: v.optional(v.number()),
    life: lifeState,
    /** The account's nth life, from 1. */
    ordinal: v.number(),
    publicProfile: v.optional(v.boolean()),
    eligibleFromTick: v.number(),
    lastTick: v.number(),
    lastProgressTick: v.number(),
    lastAdvancedAt: v.optional(v.number()),
    logSequence: v.number(),
    simulationState: v.union(v.literal('healthy'), v.literal('quarantined')),
    quarantineReasonCode: v.optional(v.string()),
  })
    .index('by_userId_and_isActive', ['userId', 'isActive'])
    .index('by_createdAt', ['createdAt'])
    .index('by_simulationState', ['simulationState']),

  /** Finished lives (paper-lives.md "Data"): one row per life, written once at death; the album and the family tree read them. */
  lifeRecords: defineTable(lifeRecordFields).index('by_userId_and_endedAt', ['userId', 'endedAt']).index('by_userId_and_ordinal', ['userId', 'ordinal']),

  /**
   * Record boards (paper-lives.md "Leaderboards"): each player's best finished life per board, once for the week
   * (`period` is its Monday, "w2026-10-12", UTC) and once for all time ("all"). `value` is the age at death or the peak
   * money; `earlierFirst` is minus the death time, so ties rank the earlier death first. Written at death only.
   */
  plLifeBoards: defineTable({
    board: lifeBoard,
    period: v.string(),
    userId: v.id('users'),
    recordId: v.id('lifeRecords'),
    value: v.number(),
    age: v.number(),
    endedAt: v.number(),
    earlierFirst: v.number(),
  })
    .index('by_board_and_period_and_value', ['board', 'period', 'value', 'earlierFirst'])
    .index('by_userId_and_board_and_period', ['userId', 'board', 'period'])
    .index('by_userId', ['userId']),

  /** A life's story lines: events, decisions, the yearly checks, recaps and the death, marked with the age. */
  plTickLogs: defineTable({
    lifeId: v.id('lives'),
    ordinal: v.number(),
    source: v.union(v.literal('tick'), v.literal('command'), v.literal('lifecycle')),
    tick: v.optional(v.number()),
    runId: v.optional(v.id('plSimulationRuns')),
    sequence: v.number(),
    at: v.number(),
    kind: plLogKind,
    glyph: plGlyph,
    age: v.number(),
    summary: v.string(),
    remarkable: v.optional(v.boolean()),
    major: v.optional(v.boolean()),
    /** The stats and money the line's effect moved (template v7); absent on older lines and lines that moved none. */
    changes: v.optional(plLineChanges),
  })
    .index('by_lifeId_and_at_and_sequence', ['lifeId', 'at', 'sequence'])
    /** One life's whole story, page by page (D182): the row is reused across lives, so the ordinal picks the life. */
    .index('by_lifeId_and_ordinal_and_at_and_sequence', ['lifeId', 'ordinal', 'at', 'sequence'])
    .index('by_at', ['at']),

  /**
   * D162: the trophy wall (mounted fish, at most 24 pegs) and the shelf (Open medals). Rosettes are the angler's
   * `opensEntered` count, not rows, so the shelf grows only by medals.
   */
  iaTrophies: defineTable({
    anglerId: v.id('anglers'),
    userId: v.id('users'),
    kind: v.union(v.literal('fish'), v.literal('medal')),
    speciesId: v.optional(v.string()),
    grams: v.optional(v.number()),
    water: waterId,
    at: v.number(),
    peg: v.optional(v.number()),
    periodKey: v.optional(v.string()),
    place: v.optional(v.number()),
  }).index('by_anglerId_and_kind', ['anglerId', 'kind']),

  /** D162: one row per weekend Open closed, so its medals are awarded once. */
  iaOpenAwards: defineTable({
    period: v.string(),
    waterId,
    awarded: v.number(),
    at: v.number(),
  }).index('by_period_and_waterId', ['period', 'waterId']),

  iaTickLogs: defineTable({
    anglerId: v.id('anglers'),
    source: v.union(v.literal('tick'), v.literal('command'), v.literal('lifecycle')),
    tick: v.optional(v.number()),
    runId: v.optional(v.id('iaSimulationRuns')),
    sequence: v.number(),
    at: v.number(),
    kind: iaLogKind,
    summary: v.string(),
    detail: iaLogDetail,
    deltas: v.object({ gold: v.number() }),
  })
    .index('by_anglerId_and_at_and_sequence', ['anglerId', 'at', 'sequence'])
    .index('by_at', ['at']),

  users: defineTable({
    analyticsConsent: v.optional(v.boolean()),
    tokenIdentifier: v.string(),
    publicAlias: v.string(),
    normalizedAlias: v.string(),
    timezone: v.string(),
    state: v.union(v.literal('active'), v.literal('suspended'), v.literal('deleting')),
    createdAt: v.number(),
    publicNameVersion: v.number(),
    activeHeroId: v.optional(v.id('heroes')),
    deletionRequestedAt: v.optional(v.number()),
    nameRepairRequired: v.optional(v.boolean()),
    /** D142: when the owner last changed their public name themselves; one change per `PUBLIC_NAME_GAP_MS`. */
    publicNameChangedAt: v.optional(v.number()),
    /** D142: the public name given up by the last change, kept off-limits to other players until `until`. */
    heldAlias: v.optional(v.object({ normalized: v.string(), until: v.number() })),
    /** P31: the last UTC offset in seconds a TRMNL screen request sent, written only when it changes; the stand-up and the tick read it. */
    trmnlUtcOffset: v.optional(v.number()),
    /** D168: the last locale a TRMNL screen request sent (`trmnl[user][locale]`, e.g. `fr-FR`), written only when it changes; sizes translation demand. */
    trmnlLocale: v.optional(v.string()),
    /** D169: the language the owner picked in the companion; absent follows the browser there and `trmnlLocale` on the device. */
    language: v.optional(locale),
    /** P33: opt-in push alerts; absent means every kind off. Quiet hours are whole hours in `timezone`. */
    alerts: v.optional(alertPreferences),
    /** D198: when the one hero reminder email went out (or was claimed for sending), and when the owner asked for none. */
    heroReminderSentAt: v.optional(v.number()),
    heroReminderStoppedAt: v.optional(v.number()),
    /** D154: the key (YYYY-MM-DD.NN) of the newest What's new change the owner dismissed; absent means none since joining. */
    whatsNewSeen: v.optional(v.string()),
  })
    .index('by_tokenIdentifier', ['tokenIdentifier'])
    .index('by_normalizedAlias', ['normalizedAlias'])
    .index('by_heldAlias_and_until', ['heldAlias.normalized', 'heldAlias.until'])
    .index('by_state', ['state']),

  deskCrawlerProfiles: defineTable({
    userId: v.id('users'),
    state: v.union(v.literal('active'), v.literal('deleting')),
    activeHeroId: v.optional(v.id('heroes')),
    /** P37: the last roster switch, for the one-a-day limit and the ten-minute undo back to `fromHeroId`. */
    lastSwitch: v.optional(v.object({ at: v.number(), fromHeroId: v.optional(v.id('heroes')) })),
    /** D142: the last name tag bought on the account; one is in stock a day. */
    lastNameTagAt: v.optional(v.number()),
    createdAt: v.number(),
  }).index('by_userId', ['userId']),

  /** One per account. `lastClaimWeek` is -1 on a row made only for the Easter Egg, before any weekly claim (D140). */
  deskKeepsakes: defineTable({
    userId: v.id('users'),
    totalCollected: v.number(),
    lastClaimWeek: v.number(),
    lastClaimedAt: v.number(),
    /** When the account found the hidden Easter Egg keepsake by entering the sample screen's code (D140). */
    easterEggFoundAt: v.optional(v.number()),
  }).index('by_userId', ['userId']),

  /** One row per earned achievement, keyed by owner so unlocks outlive a hero's lifecycle (D65). Bounded by the catalog. */
  heroAchievements: defineTable({
    userId: v.id('users'),
    heroId: v.id('heroes'),
    achievementId: v.string(),
    unlockedAt: v.number(),
    tick: v.number(),
    catalogVersion: v.number(),
  })
    .index('by_userId_and_achievementId', ['userId', 'achievementId'])
    .index('by_userId_and_unlockedAt', ['userId', 'unlockedAt']),


  gameDeletionJobs: defineTable({
    userId: v.id('users'),
    gameSlug: gameSlug,
    state: v.union(v.literal('running'), v.literal('completed')),
    phase: v.union(v.literal('connections'), v.literal('gameplay'), v.literal('done')),
    createdAt: v.number(),
    lastProgressAt: v.number(),
    completedAt: v.optional(v.number()),
  }).index('by_userId_and_state', ['userId', 'state']),

  heroes: defineTable({
    userId: v.id('users'),
    name: v.string(),
    /** P37: one hero per class per account (`by_userId_and_class`). */
    class: v.union(v.literal('warrior'), v.literal('rogue')),
    /** D149: the hero's look, purely cosmetic; absent means male, the original art. */
    gender: v.optional(heroGender),
    createdAt: v.number(),
    /** The account's current hero; since P37 a parked roster hero is false and carries `parkedAtTick`. */
    isActive: v.boolean(),
    /** P37: the world tick the hero was parked at; its tick-stamped timers move on by the gap when it returns. */
    parkedAtTick: v.optional(v.number()),
    schemaVersion: v.number(),
    activationState: v.union(v.literal('pending_trmnl'), v.literal('active')),
    activatedAt: v.optional(v.number()),
    level: v.number(),
    xp: v.number(),
    lifetimeXp: v.number(),
    hp: v.number(),
    gold: v.number(),
    lastLevelUpTick: v.number(),
    status: heroStatus,
    biomeId: v.string(),
    targetBiomeId: v.optional(v.string()),
    arriveAtTick: v.optional(v.number()),
    reviveAtTick: v.optional(v.number()),
    pausedFromStatus: v.optional(v.union(v.literal('exploring'), v.literal('resting'))),
    wakeAtTick: v.optional(v.number()),
    weaponId: v.optional(v.id('items')),
    armorId: v.optional(v.id('items')),
    heldItemId: v.optional(v.id('items')),
    /**
     * Legacy (D111, removed in D123): the desk drawer's item ids. No production hero held one at removal; a stored list is
     * ignored and its items count as bag gear. Kept optional so an old dev document still validates; drop it in a later release.
     */
    drawer: v.optional(v.array(v.id('items'))),
    /** D61: unequipped gear the bag holds, always a ladder tier's capacity. */
    bagCapacity: v.number(),
    /** D76: how carefully the hero sustains itself; absent means balanced. */
    stance: v.optional(v.union(v.literal('cautious'), v.literal('balanced'), v.literal('bold'))),
    /** D77: potion cap from the pouch ladder; absent means the catalog's potionStackCap. */
    potionCap: v.optional(v.number()),
    /** D78: an open merchant visit, cleared by the simulator when it expires or by the last purchase. */
    merchant: v.optional(merchantVisit),
    /** D79: a pending narrative choice, answered by `heroes.choose` or defaulted by the simulator at expiry. */
    choice: v.optional(v.object({ eventId: v.string(), offeredAtTick: v.number(), expiresAtTick: v.number(), biomeTier: v.number() })),
    /** D80: active temporary effects, at most three. */
    effects: v.optional(v.array(v.object({ id: v.string(), untilTick: v.number() }))),
    /** v1.2: the owner chose to show this hero on a public profile page; absent means private. */
    publicProfile: v.optional(v.boolean()),
    /** D110: this hero's row in the raid pool, created at its first evaluation under a catalog with raids. */
    raidPoolId: v.optional(v.id('raidPool')),
    /** P31: the office to-do list, written at the hero's first evaluation under a catalog with to-do rules. */
    todo: v.optional(todoList),
    /** P35: the career ladder state, written at the hero's first evaluation under a catalog with a ladder. */
    career: v.optional(careerState),
    /** D139: the last occasion occurrence announced (`<id>@<start date>`) and whether its gift was found. */
    occasion: v.optional(v.object({ key: v.string(), gifted: v.optional(v.literal(true)) })),
    /** D163: a dug-in elite, cleared by its fall, a knockout, travel, Walk away or its clock. */
    standoff: v.optional(v.object({ monsterId: v.string(), biomeId: v.string(), hp: v.number(), maxHp: v.number(), startedTick: v.number(), untilTick: v.number() })),
    eligibleFromTick: v.number(),
    lastTick: v.number(),
    lastProgressTick: v.number(),
    lastAdvancedAt: v.optional(v.number()),
    logSequence: v.number(),
    simulationState: v.union(v.literal('healthy'), v.literal('quarantined')),
    quarantineReasonCode: v.optional(v.string()),
    counters: heroCounters,
    /** Last achievement catalog version evaluated for this hero; absent means never (D65). */
    achievementsVersion: v.optional(v.number()),
    scoreHour: v.optional(v.number()),
    scoreHourXp: v.number(),
    companionVisitBaseline: v.optional(v.object({ at: v.number(), level: v.number(), lifetimeXp: v.number(), logSequence: v.number(), counters: heroCounters })),
  })
    .index('by_userId_and_isActive', ['userId', 'isActive'])
    .index('by_userId_and_class', ['userId', 'class'])
    .index('by_createdAt', ['createdAt'])
    .index('by_simulationState', ['simulationState']),

  items: defineTable({
    heroId: v.id('heroes'),
    templateId: v.string(),
    contentVersion: v.string(),
    kind: itemKind,
    name: v.string(),
    rarity,
    requiredLevel: v.number(),
    attack: v.number(),
    defense: v.number(),
    saleValue: v.number(),
    quantity: v.number(),
    createdAt: v.number(),
    /** D81: affix rolled at generation; absent on common, uncommon and older gear. */
    affixId: v.optional(v.string()),
    /** D129: the tier the workbench raised the item to and its reinforcement; absent on untouched gear. */
    tier: v.optional(v.number()),
    reinforced: v.optional(v.number()),
    /** D145: a found spare carries its first owner's account, public name and name version; absent on every other item. */
    relicUserId: v.optional(v.id('users')),
    relicName: v.optional(v.string()),
    relicNameVersion: v.optional(v.number()),
  })
    .index('by_heroId', ['heroId'])
    .index('by_heroId_and_kind', ['heroId', 'kind'])
    .index('by_relicUserId', ['relicUserId']),

  /**
   * D110: one row per hero that can be raided, at a random shard. A raider takes the first row at or after its
   * shard; a picked row moves to a new shard and records when it was picked, so nobody is everyone's target.
   */
  raidPool: defineTable({
    heroId: v.id('heroes'),
    shard: v.number(),
    raidedAtTick: v.optional(v.number()),
    /** D141: the hero's floor, patched by its own tick, so a meeting picks from the same floor. Absent until then. */
    biomeId: v.optional(v.string()),
    /** D141: the last tick this hero met or was met, for the meeting cooldown. */
    metAtTick: v.optional(v.number()),
  })
    .index('by_shard', ['shard'])
    .index('by_heroId', ['heroId'])
    .index('by_biomeId_and_shard', ['biomeId', 'shard']),

  /**
   * D145: lost property, at most one row per hero. A knockout writes the hero's spare (identity only, never stats) on
   * that floor at a random shard; a finder on the same floor takes the first lying row at or after its plan's shard
   * and marks it found; the owner's next evaluation tells it and deletes the row. A new knockout replaces a lying row.
   */
  lostProperty: defineTable({
    ownerHeroId: v.id('heroes'),
    ownerUserId: v.id('users'),
    biomeId: v.string(),
    shard: v.number(),
    templateId: v.string(),
    kind: v.union(v.literal('weapon'), v.literal('armor')),
    rarity,
    affixId: v.optional(v.string()),
    /** The template name as dropped, for the lines and the card. */
    name: v.string(),
    contentVersion: v.string(),
    droppedTick: v.number(),
    state: v.union(v.literal('lying'), v.literal('found')),
    finderHeroId: v.optional(v.id('heroes')),
    finderUserId: v.optional(v.id('users')),
    finderName: v.optional(v.string()),
    finderNameVersion: v.optional(v.number()),
    finderClass: v.optional(v.union(v.literal('warrior'), v.literal('rogue'))),
    foundTick: v.optional(v.number()),
  })
    .index('by_ownerHeroId', ['ownerHeroId'])
    .index('by_biomeId_and_state_and_shard', ['biomeId', 'state', 'shard'])
    .index('by_finderHeroId', ['finderHeroId']),

  /**
   * D141: one row per meeting, inserted by the starter's tick (keyed by starter and tick) and applied once by the
   * partner's next exploring or resting evaluation.
   */
  meetings: defineTable({
    starterHeroId: v.id('heroes'),
    starterUserId: v.id('users'),
    starterName: v.string(),
    starterNameVersion: v.number(),
    starterClass: v.union(v.literal('warrior'), v.literal('rogue')),
    partnerHeroId: v.id('heroes'),
    partnerUserId: v.id('users'),
    partnerName: v.string(),
    partnerNameVersion: v.number(),
    partnerClass: v.union(v.literal('warrior'), v.literal('rogue')),
    tick: v.number(),
    kindId: v.string(),
    biomeId: v.string(),
    state: v.union(v.literal('pending'), v.literal('applied')),
    appliedTick: v.optional(v.number()),
  })
    .index('by_starterHeroId_and_tick', ['starterHeroId', 'tick'])
    .index('by_partnerHeroId_and_state_and_tick', ['partnerHeroId', 'state', 'tick'])
    .index('by_partnerHeroId_and_tick', ['partnerHeroId', 'tick'])
    .index('by_state_and_tick', ['state', 'tick']),

  /**
   * D143: one player following another's public hero page, per account. The followed player's public-name version
   * is copied so a rename ends the follow. `by_followedUserId` serves deletion; no query lists followers. The
   * `rival`, `raidsWon` and `raidsLost` fields are retired (D205, 2026-10-20): never written, kept for rows that have them.
   */
  follows: defineTable({
    userId: v.id('users'),
    followedUserId: v.id('users'),
    followedNameVersion: v.number(),
    rival: v.optional(v.literal(true)),
    raidsWon: v.optional(v.number()),
    raidsLost: v.optional(v.number()),
    createdAt: v.number(),
  })
    .index('by_userId_and_followedUserId', ['userId', 'followedUserId'])
    .index('by_followedUserId', ['followedUserId']),

  /**
   * D110 raid ledger: the raider writes one row in its own tick; the target applies it once at its next exploring
   * or resting evaluation. Names are copied with their public-name versions so reads can mask a repaired name.
   */
  raids: defineTable({
    raiderHeroId: v.id('heroes'),
    raiderUserId: v.id('users'),
    raiderName: v.string(),
    raiderNameVersion: v.number(),
    targetHeroId: v.id('heroes'),
    targetUserId: v.id('users'),
    targetName: v.string(),
    targetNameVersion: v.number(),
    tick: v.number(),
    raiderWon: v.boolean(),
    /** Gold the loser loses and the winner gains, as the raider resolved it. */
    gold: v.number(),
    raiderHpLost: v.number(),
    /** The target's HP loss as a share of its maximum HP. */
    targetHpPct: v.number(),
    /** D139: a Friday the 13th mishap; `raiderWon` is false, `gold` is the raider's own loss and the target loses its own share. */
    mishap: v.optional(v.literal(true)),
    /** Retired (D205): a D143 rival raid; never written since 2026-10-20, kept for the rows that have it. */
    rival: v.optional(v.literal(true)),
    state: v.union(v.literal('pending'), v.literal('applied')),
    appliedTick: v.optional(v.number()),
    /** What the target actually lost or gained once applied (a loss is clamped to the gold it held). */
    targetGold: v.optional(v.number()),
    targetHpLost: v.optional(v.number()),
  })
    .index('by_raiderHeroId_and_tick', ['raiderHeroId', 'tick'])
    .index('by_targetHeroId_and_state_and_tick', ['targetHeroId', 'state', 'tick'])
    .index('by_targetHeroId_and_tick', ['targetHeroId', 'tick'])
    .index('by_state_and_tick', ['state', 'tick']),









  operationReceipts: defineTable({
    scope: v.optional(v.union(v.literal('platform'), v.literal('desk-crawler'), v.literal('idle-angler'), v.literal('paper-lives'), v.literal('little-plot'), v.literal('pixel-wars'))),
    userId: v.id('users'),
    operationId: v.string(),
    operation: v.string(),
    argumentHash: v.string(),
    result: v.object({
      changed: v.boolean(),
      gold: v.optional(v.number()),
      hp: v.optional(v.number()),
      count: v.optional(v.number()),
      tick: v.optional(v.number()),
      keepsakeOutcome: v.optional(v.union(v.literal('claimed'), v.literal('already_claimed'), v.literal('invalid_code'), v.literal('easter_egg'))),
      recapChanged: v.optional(v.boolean()),
    }),
    createdAt: v.number(),
    expiresAt: v.number(),
  })
    .index('by_userId_and_operationId', ['userId', 'operationId'])
    .index('by_userId_and_scope', ['userId', 'scope'])
    .index('by_expiresAt', ['expiresAt']),

  /** P33: one browser's Web Push subscription, at most five per account. */
  pushSubscriptions: defineTable({
    userId: v.id('users'),
    endpoint: v.string(),
    p256dh: v.string(),
    auth: v.string(),
    label: v.string(),
    createdAt: v.number(),
  })
    .index('by_userId', ['userId'])
    .index('by_endpoint', ['endpoint']),

  /** P33: one alert per qualifying event, written by the tick and drained by the sender; kept 7 days. */
  alertOutbox: defineTable({
    userId: v.id('users'),
    /** Desk Crawler rows carry the hero, Idle Angler rows the angler (D115). */
    heroId: v.optional(v.id('heroes')),
    anglerId: v.optional(v.id('anglers')),
    /** Paper Lives rows carry the life, the age it was raised at and the decision or the newborn's id (D159). */
    lifeId: v.optional(v.id('lives')),
    lifeAge: v.optional(v.number()),
    /** Little Plot rows carry the plot (D206). */
    plotId: v.optional(v.id('plots')),
    /** Pixel Wars rows carry the desk (D214). */
    deskId: v.optional(v.id('desks')),
    detail: v.optional(v.string()),
    kind: alertKind,
    /** `${heroId}:${kind}:${eventTick}`: one nap or one merchant visit is one alert. */
    key: v.string(),
    eventTick: v.number(),
    offerId: v.optional(v.union(v.literal('bag'), v.literal('pouch'))),
    offerName: v.optional(v.string()),
    state: v.union(v.literal('pending'), v.literal('sending'), v.literal('sent'), v.literal('skipped'), v.literal('failed')),
    reason: v.optional(v.string()),
    notBefore: v.number(),
    attempts: v.number(),
    /** The owner's local date when the push went out, for the daily caps. */
    localDay: v.optional(v.string()),
    createdAt: v.number(),
    updatedAt: v.number(),
  })
    .index('by_key', ['key'])
    .index('by_state_and_notBefore', ['state', 'notBefore'])
    .index('by_userId_and_localDay', ['userId', 'localDay'])
    .index('by_createdAt', ['createdAt']),

  /** P33: the one scheduled sender run, so ticks never queue a second. */
  alertSender: defineTable({
    key: v.literal('sender'),
    scheduledId: v.optional(v.id('_scheduled_functions')),
    runAt: v.optional(v.number()),
  }).index('by_key', ['key']),

  /**
   * D201: people waiting for a game's launch email. A signed-in player joins with one tap and only their identity is
   * kept (the address comes from Clerk at send time); a visitor leaves an email. Each row is deleted once its one
   * email is accepted, and an account's row goes with the account.
   */
  launchList: defineTable({
    gameSlug,
    email: v.optional(v.string()),
    tokenIdentifier: v.optional(v.string()),
    locale,
    state: v.union(v.literal('waiting'), v.literal('sending'), v.literal('failed')),
    attempts: v.number(),
    createdAt: v.number(),
  })
    .index('by_gameSlug_and_email', ['gameSlug', 'email'])
    .index('by_gameSlug_and_tokenIdentifier', ['gameSlug', 'tokenIdentifier'])
    .index('by_gameSlug_and_state', ['gameSlug', 'state'])
    .index('by_tokenIdentifier', ['tokenIdentifier']),

  rateLimitBuckets: defineTable({
    key: v.string(),
    windowStart: v.number(),
    count: v.number(),
    expiresAt: v.number(),
  })
    .index('by_key', ['key'])
    .index('by_key_and_windowStart', ['key', 'windowStart'])
    .index('by_expiresAt', ['expiresAt']),

  accountDeletionConfirmations: defineTable({
    tokenIdentifier: v.string(),
    tokenHash: v.string(),
    email: v.string(),
    emailId: v.string(),
    from: v.string(),
    origin: v.string(),
    /** D169: the language of the page the request came from, for the email. */
    locale: v.optional(locale),
    state: v.union(v.literal('pending'), v.literal('sent'), v.literal('failed'), v.literal('confirmed')),
    attempts: v.number(),
    createdAt: v.number(),
    expiresAt: v.number(),
  })
    .index('by_tokenIdentifier', ['tokenIdentifier'])
    .index('by_tokenHash', ['tokenHash'])
    .index('by_expiresAt', ['expiresAt']),

  /** Player feedback (D107): signed-in only, emailed to Barry, deleted with the account. */
  feedback: defineTable({
    tokenIdentifier: v.string(),
    clerkUserId: v.string(),
    publicAlias: v.optional(v.string()),
    message: v.string(),
    page: v.optional(v.string()),
    state: v.union(v.literal('pending'), v.literal('sent'), v.literal('failed')),
    attempts: v.number(),
    createdAt: v.number(),
  })
    .index('by_tokenIdentifier', ['tokenIdentifier'])
    .index('by_createdAt', ['createdAt']),

  accountDeletionJobs: defineTable({
    heroRef: v.optional(v.string()),
    analyticsDeletionRequired: v.optional(v.boolean()),
    userId: v.optional(v.id('users')),
    clerkUserId: v.optional(v.string()),
    state: v.union(v.literal('running'), v.literal('blocked'), v.literal('completed')),
    phase: v.union(v.literal('connections'), v.literal('gameplay'), v.literal('provider'), v.literal('finalize'), v.literal('done')),
    providerAttempts: v.number(),
    createdAt: v.number(),
    lastProgressAt: v.number(),
    completedAt: v.optional(v.number()),
    reasonCode: v.optional(v.string()),
  })
    .index('by_userId', ['userId'])
    .index('by_state_and_lastProgressAt', ['state', 'lastProgressAt']),

  revokedTrmnlCredentials: defineTable({
    tokenHash: v.string(),
    revokedAt: v.number(),
    reasonCode: v.string(),
  }).index('by_tokenHash', ['tokenHash']),

  revokedAuthIdentities: defineTable({
    identityHash: v.string(),
    revokedAt: v.number(),
    reasonCode: v.string(),
  }).index('by_identityHash', ['identityHash']),

  operationalIncidents: defineTable({
    incidentKey: v.string(),
    /** Any game's run (D115; the quarantine notice covers all five). */
    runId: v.union(v.id('simulationRuns'), v.id('iaSimulationRuns'), v.id('plSimulationRuns'), v.id('lpSimulationRuns'), v.id('pwSimulationRuns')),
    state: v.union(v.literal('open'), v.literal('recovered')),
    openedAt: v.number(),
    recoveredAt: v.optional(v.number()),
    alert: v.object({ state: v.union(v.literal('pending'), v.literal('sent'), v.literal('failed'), v.literal('disabled')), attempts: v.number(), lastAttemptAt: v.optional(v.number()) }),
    recovery: v.optional(v.object({ state: v.union(v.literal('pending'), v.literal('sent'), v.literal('failed'), v.literal('disabled')), attempts: v.number(), lastAttemptAt: v.optional(v.number()) })),
  })
    .index('by_incidentKey', ['incidentKey'])
    .index('by_runId_and_state', ['runId', 'state'])
    .index('by_state_and_openedAt', ['state', 'openedAt']),

  /** D197: one engagement report a day (aggregates over all heroes, nothing per player), for trends and retention. */
  engagementSnapshots: defineTable({
    day: v.string(),
    at: v.number(),
    report: v.any(),
  }).index('by_day', ['day']),
  adminAuditEvents: defineTable({
    actorRef: v.string(),
    action: v.string(),
    targetRef: v.string(),
    reasonCode: v.string(),
    outcome: v.string(),
    at: v.number(),
  })
    .index('by_at', ['at'])
    .index('by_actorRef', ['actorRef'])
    .index('by_targetRef', ['targetRef']),

  tickLogs: defineTable({
    heroId: v.id('heroes'),
    source: v.union(v.literal('tick'), v.literal('command'), v.literal('lifecycle')),
    tick: v.optional(v.number()),
    runId: v.optional(v.id('simulationRuns')),
    sequence: v.number(),
    at: v.number(),
    kind: logKind,
    summary: v.string(),
    detail: logDetail,
    deltas: v.object({ xpEarned: v.number(), gold: v.number(), hp: v.number() }),
  })
    .index('by_heroId_and_at_and_sequence', ['heroId', 'at', 'sequence'])
    .index('by_at', ['at']),

  trmnlGrants: defineTable({
    gameSlug: v.optional(gameSlug),
    userId: v.id('users'),
    tokenHash: v.string(),
    // Reused revoked credentials authorize only the freshly verified UUID.
    authorizedUuid: v.optional(v.string()),
    state: v.union(v.literal('active'), v.literal('revoked')),
    createdAt: v.number(),
    lastVerifiedAt: v.optional(v.number()),
  })
    .index('by_tokenHash', ['tokenHash'])
    .index('by_userId', ['userId']),

  trmnlReconnectAttempts: defineTable({
    tokenIdentifier: v.string(),
    tokenHash: v.string(),
    publicAlias: v.string(),
    heroName: v.string(),
    timezone: v.string(),
    analyticsConsent: v.optional(v.boolean()),
    createdAt: v.number(),
    expiresAt: v.number(),
    verifiedUuid: v.optional(v.string()),
    verifiedAt: v.optional(v.number()),
    proofExpiresAt: v.optional(v.number()),
  })
    .index('by_tokenIdentifier', ['tokenIdentifier'])
    .index('by_tokenHash_and_expiresAt', ['tokenHash', 'expiresAt'])
    .index('by_expiresAt', ['expiresAt']),

  trmnlInstallAttempts: defineTable({
    gameSlug: v.optional(gameSlug),
    userId: v.id('users'),
    grantId: v.id('trmnlGrants'),
    state: v.union(v.literal('pending'), v.literal('completed'), v.literal('expired')),
    createdAt: v.number(),
    expiresAt: v.number(),
    completedUuid: v.optional(v.string()),
  })
    .index('by_grantId_and_state', ['grantId', 'state'])
    .index('by_userId_and_state', ['userId', 'state'])
    .index('by_expiresAt', ['expiresAt']),

  trmnlInstances: defineTable({
    gameSlug: v.optional(gameSlug),
    grantId: v.id('trmnlGrants'),
    userId: v.id('users'),
    uuid: v.string(),
    pluginSettingId: v.optional(v.string()),
    state: v.union(v.literal('active'), v.literal('uninstalled'), v.literal('disconnected')),
    confirmedBy: v.union(v.literal('success_callback'), v.literal('screen_request'), v.literal('management_confirmation')),
    createdAt: v.number(),
    lastScreenServedAt: v.optional(v.number()),
  })
    .index('by_uuid', ['uuid'])
    .index('by_grantId', ['grantId'])
    .index('by_userId_and_state', ['userId', 'state'])
    .index('by_userId', ['userId']),
})
