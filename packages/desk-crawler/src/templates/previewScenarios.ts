/**
 * Fictional layout-preview scenarios: canonical payload inputs for every screen
 * state the templates handle. Shared by the local preview CLI
 * (tools/trmnl/preview.ts) and the dev-only preview gallery in the web app, so
 * both render the same cases. Never written to a deployment, and never carries
 * a redeemable keepsake code.
 */
import { ACTIVE_CONTENT, catalogs } from '../content'
import { MAX_LOGS, MAX_RECAP_EVENTS, type ActivityEntry, type PayloadInput } from '../lib/payload'
import type { OutcomeDetail } from '../sim/core/types'
import { SAMPLE_KEEPSAKE_CODE } from '../content/keepsakes'

export const PREVIEW_NOW = Date.UTC(2026, 9, 4, 8, 20)
/** The sample owner is in Johannesburg (UTC+2); TRMNL renders Liquid in UTC and the screen route adds `utc_offset`. */
export const PREVIEW_UTC_OFFSET = 2 * 3600
/** The end of the recap period the preview clock falls in: the night recap, which ends at 07:00 in Johannesburg (D75). */
export const PREVIEW_PERIOD_END = Date.UTC(2026, 9, 4, 5, 0)
/** Preview-only sample of the verified device-envelope field; never an actual redeemable code. */
export const PREVIEW_KEEPSAKE_CODE = SAMPLE_KEEPSAKE_CODE
/** Screens that never show a keepsake code. */
export const KEEPSAKE_FREE_SCENARIOS: ReadonlySet<string> = new Set(['unlinked', 'unlinkedPaused'])
/** Scenarios that render without the owner's UTC offset, to prove the fallback. */
export const NO_OFFSET_SCENARIOS: ReadonlySet<string> = new Set(['noMetadata'])

export type PreviewScenarioGroup = 'states' | 'recap' | 'potionFinds' | 'noEffect' | 'marketing'
export const PREVIEW_SCENARIO_GROUP_LABELS: Record<PreviewScenarioGroup, string> = {
  states: 'Screen states',
  recap: 'Recap and density',
  potionFinds: 'Potion finds',
  noEffect: 'No effect',
  marketing: 'Marketing sample',
}

export interface PreviewScenarios {
  groups: Record<PreviewScenarioGroup, Record<string, PayloadInput>>
  /** Recap entries the CLI's `--recap` run adds to states that have no activity of their own. */
  overnightEntries: ActivityEntry[]
  base: PayloadInput
}

const NOW = PREVIEW_NOW

/** Gives a scenario the overnight recap when it has no activity of its own, shifted to its clock. */
export function withOvernightRecap(input: PayloadInput, overnightEntries: ActivityEntry[]): PayloadInput {
  return input.activity ? input : { ...input, activity: { entries: overnightEntries.map(entry => ({ ...entry, at: entry.at - NOW + input.now })), truncated: false } }
}

/** Fourteen older adventures, so the base log carries the full `MAX_LOGS` the device receives. */
const olderLogs: PayloadInput['logs'] = Array.from({ length: 14 }, (_, i) => {
  const at = NOW - (97 + i * 15) * 60_000
  return [
    { at, kind: 'combat', summary: 'Filed a [[Paper Imp]] under defeated. +6 XP, +2 gold.', deltas: { xpEarned: 6, gold: 2, hp: -4 } },
    { at, kind: 'rest', summary: 'Took a coffee break. +12 HP.', deltas: { xpEarned: 0, gold: 0, hp: 12 } },
    { at, kind: 'loot', summary: 'Found 8 gold in a desk drawer.', deltas: { xpEarned: 0, gold: 8, hp: 0 } },
    { at, kind: 'combat', summary: 'Out-argued a [[Stapler Mimic]]. +10 XP, +4 gold.', deltas: { xpEarned: 10, gold: 4, hp: -7 } },
  ][i % 4]!
})

export function previewScenarios(artBaseUrl: string | null): PreviewScenarios {
  const topRows = [
    { rank: 1, name: 'Ana', hero_name: 'Pip', level: 7, score: 2410 },
    { rank: 2, name: 'Bo', hero_name: 'Staple', level: 6, score: 1990 },
    { rank: 3, name: 'barrymichaeldoyle', hero_name: 'Baz', level: 5, score: 1840 },
    { rank: 4, name: 'Cy', hero_name: 'Mug', level: 5, score: 1700 },
    { rank: 5, name: 'Dee', hero_name: 'Clip', level: 4, score: 1515 },
    { rank: 6, name: 'Eli', hero_name: 'Toner', level: 6, score: 1390 },
    { rank: 7, name: 'Fen', hero_name: 'Lanyard', level: 4, score: 1210 },
    { rank: 8, name: 'Gus', hero_name: 'Memo', level: 5, score: 1085 },
    { rank: 9, name: 'Hal', hero_name: 'Badge', level: 4, score: 940 },
    { rank: 10, name: 'Ivy', hero_name: 'Ream', level: 7, score: 815 },
  ]
  const base: PayloadInput = {
    now: NOW,
    world: { currentTick: 120, lastCompletedTick: 120, lastCompletedAt: NOW - 7 * 60_000, createdAt: NOW - 86_400_000, ticksPaused: false, maintenanceMode: false },
    ownerAlias: 'barrymichaeldoyle',
    timezone: 'Africa/Johannesburg',
    utcOffset: PREVIEW_UTC_OFFSET,
    hero: { name: 'Baz', level: 5, xp: 210, hp: 118, gold: 640, status: 'exploring', biomeId: 'server_room', lastTick: 120, lastAdvancedAt: NOW - 7 * 60_000, quarantined: false },
    weaponName: 'Uncommon Cable Cutter',
    armorName: 'Insulated Cardigan',
    weaponAttack: 5,
    armorDefense: 2,
    potions: 4,
    bagUsed: 17,
    bagCapacity: 20,
    heldItemName: null,
    logs: [
      { at: NOW - 7 * 60_000, kind: 'combat', summary: 'Untangled a [[Cable Serpent]] and zip-tied it. +14 XP, +5 gold.', deltas: { xpEarned: 14, gold: 5, hp: -12 } },
      { at: NOW - 22 * 60_000, kind: 'loot', summary: 'Pulled a [[Rare Keyboard Mace]] out of a cable tray.' },
      { at: NOW - 37 * 60_000, kind: 'rest', summary: 'Cooled off by the air conditioning. +30 HP.', deltas: { xpEarned: 0, gold: 0, hp: 30 } },
      { at: NOW - 52 * 60_000, kind: 'combat', summary: 'Rebooted an [[Overheated Rack]] for good. +11 XP, +4 gold.', deltas: { xpEarned: 11, gold: 4, hp: -9 } },
      { at: NOW - 67 * 60_000, kind: 'loot', summary: 'Found 22 gold under a raised floor tile.', deltas: { xpEarned: 0, gold: 22, hp: 0 } },
      { at: NOW - 82 * 60_000, kind: 'combat', summary: 'Unplugged a [[Cable Serpent]]. +9 XP, +3 gold.', deltas: { xpEarned: 9, gold: 3, hp: -15 } },
      ...olderLogs,
    ],
    // D138: today's to-do tasks and the current goal, which the X full landscape shows beside the stories.
    todoTasks: [
      { label: 'Defeat 4 [[Cable Serpents]]', progress: 2, target: 4, done: false },
      { label: 'Find a piece of gear', progress: 1, target: 1, done: true },
      { label: 'Explore the [[Server Room]] 12 times', progress: 5, target: 12, done: false },
    ],
    goal: { title: 'Reach level 7', value: 5, target: 7, gold: 40 },
    instanceName: 'Desk Crawler',
    // The live catalog, so the screens show what devices show (its stances name the status line, D103).
    content: catalogs[ACTIVE_CONTENT],
    spriteBaseUrl: null,
    artBaseUrl,
    latestEvent: { kind: 'combat', outcome: { variant: 'combat', monsterId: 'cable_serpent', elite: false } },
    ranking: {
      rank: 3,
      rankDelta: 1,
      status: 'ranked',
      cohortKey: '4-7',
      cohortLabel: 'Levels 4-7',
      score: 1840,
      scoreAt: NOW - 22 * 60_000,
      asOfTick: 118,
      builtAt: NOW - 21 * 60_000,
      windowStart: NOW - 167 * 3_600_000,
      totalPlayers: 41,
      globalTotalPlayers: 212,
      top: topRows,
      // Ranked third, so the window is the first rows with the hero third (D152).
      nearby: topRows,
      nearbyOwn: 2,
    },
  }
  /** Base's ranking with `patch`, its neighbour window (D152) the first rows with the hero found by rank. */
  const ranked = (patch: Partial<NonNullable<PayloadInput['ranking']>>): NonNullable<PayloadInput['ranking']> => {
    const ranking = { ...base.ranking!, ...patch }
    const own = ranking.top.findIndex((row) => row.rank === ranking.rank)
    return { ...ranking, nearby: patch.nearby ?? ranking.top, nearbyOwn: patch.nearbyOwn !== undefined ? patch.nearbyOwn : own < 0 ? null : own }
  }
  // A hero mid-board (D152): ranked 14th of 41, so the window holds ranks 9 to 18 with the hero sixth.
  const midRows = [
    { rank: 9, name: 'Hal', hero_name: 'Badge', level: 4, score: 940 },
    { rank: 10, name: 'Ivy', hero_name: 'Ream', level: 7, score: 815 },
    { rank: 11, name: 'Jo', hero_name: 'Ledger', level: 5, score: 790 },
    { rank: 12, name: 'Kit', hero_name: 'Folder', level: 4, score: 742 },
    { rank: 13, name: 'Lou', hero_name: 'Stamp', level: 6, score: 701 },
    { rank: 14, name: 'barrymichaeldoyle', hero_name: 'Baz', level: 5, score: 655 },
    { rank: 15, name: 'Mo', hero_name: 'Tack', level: 4, score: 610 },
    { rank: 16, name: 'Nat', hero_name: 'Quill', level: 5, score: 588 },
    { rank: 17, name: 'Oz', hero_name: 'Binder', level: 6, score: 540 },
    { rank: 18, name: 'Pam', hero_name: 'Eraser', level: 4, score: 512 },
  ]

  const hero = (patch: Partial<NonNullable<PayloadInput['hero']>>) => ({ ...base.hero!, ...patch })
  const officeLogs: PayloadInput['logs'] = [{ at: NOW - 7 * 60_000, kind: 'combat', summary: 'Filed a [[Paper Imp]] under defeated. +6 XP, +2 gold.', deltas: { xpEarned: 6, gold: 2, hp: -4 } }]
  const states: Record<string, PayloadInput> = {
    normal: base,
    officeDay: { ...base, hero: hero({ biomeId: 'office_cubicles' }), logs: officeLogs, latestEvent: { kind: 'combat', outcome: { variant: 'combat', monsterId: 'paper_imp', elite: false } } },
    officeNight: { ...base, now: NOW + 12 * 3_600_000, world: { ...base.world!, lastCompletedAt: NOW + 12 * 3_600_000 - 7 * 60_000 }, hero: hero({ biomeId: 'office_cubicles' }), logs: officeLogs.map(log => ({ ...log, at: log.at + 12 * 3_600_000 })), latestEvent: { kind: 'combat', outcome: { variant: 'combat', monsterId: 'paper_imp', elite: false } } },
    expense: { ...base, logs: [{ at: NOW - 7 * 60_000, kind: 'loot', summary: 'An old expense claim finally paid out: 2 gold.', deltas: { xpEarned: 0, gold: 2, hp: 0 } }, ...base.logs] },
    elite: { ...base, latestEvent: { kind: 'combat', outcome: { variant: 'combat', monsterId: 'legacy_mainframe', elite: true, outcome: 'victory' } }, logs: [{ at: NOW - 7 * 60_000, kind: 'combat', summary: 'Took down an elite [[Legacy Mainframe]]. The floor heard it. +64 XP, +15 gold.', deltas: { xpEarned: 64, gold: 15, hp: -42 } }, ...base.logs] },
    levelUp: { ...base, hero: hero({ level: 6, xp: 12 }), latestEvent: { kind: 'levelup', outcome: { variant: 'combat', monsterId: 'cable_serpent', elite: false, outcome: 'victory' } }, logs: [{ at: NOW - 7 * 60_000, kind: 'levelup', summary: 'Unplugged a [[Cable Serpent]]. +15 XP, +5 gold. Reached level 6!', deltas: { xpEarned: 15, gold: 5, hp: 8 } }, ...base.logs] },
    dead: { ...base, hero: hero({ status: 'dead', hp: 0, reviveAtTick: 125 }), latestEvent: { kind: 'death', outcome: { variant: 'combat', monsterId: 'firewall_gremlin', elite: false } }, logs: [{ at: NOW - 7 * 60_000, kind: 'death', summary: 'Flattened by a [[Firewall Gremlin]]. Lost 64 gold.', deltas: { xpEarned: 0, gold: -64, hp: -118 } }, ...base.logs] },
    travelling: { ...base, hero: hero({ status: 'travelling', targetBiomeId: 'cafeteria_depths', arriveAtTick: 121 }), latestEvent: { kind: 'system' }, logs: [{ at: NOW - 3 * 60_000, kind: 'system', summary: 'Set off for the Cafeteria Depths.', deltas: { xpEarned: 0, gold: 0, hp: 0 } }, ...base.logs] },
    sleeping: { ...base, hero: hero({ status: 'sleeping' }), heldItemName: 'Rare Spork Halberd', bagUsed: 20, latestEvent: { kind: 'loot', outcome: { variant: 'loot', found: 'gear' } }, logs: [{ at: NOW - 7 * 60_000, kind: 'loot', summary: 'Found a [[Rare Spork Halberd]]. Bag full. Holding it until you make room.' }, ...base.logs] },
    // D189: v26 keeps going on a full bag; the held find waits and a later find stays behind.
    bagKeepGoing: { ...base, heldItemName: 'Rare Spork Halberd', bagUsed: 20, logs: [{ at: NOW - 7 * 60_000, kind: 'loot', summary: 'Pulled a [[Common Desk Fan Shield]] out of a cable tray. Bag full, so it stayed behind.', deltas: { xpEarned: 0, gold: 0, hp: 0 } }, ...base.logs] },
    paused: { ...base, hero: hero({ status: 'paused' }), ranking: ranked({ rank: null, rankDelta: null, status: 'dormant', score: null }) },
    quarantined: { ...base, hero: hero({ quarantined: true }) },
    // D79: a pending choice shows the decision notice; the offer is the newest story.
    choice: { ...base, hero: hero({ choiceExpiresAtTick: 216 }), logs: [{ at: NOW - 7 * 60_000, kind: 'choice', summary: 'A wallet is lying by the lifts, full of gold, with a photo of a cat inside.', deltas: { xpEarned: 0, gold: 0, hp: 0 } }, ...base.logs], latestEvent: { kind: 'choice' } },
    // D78: an open merchant visit shows the inverted notice line beside an ordinary day.
    merchant: { ...base, hero: hero({ merchantExpiresAtTick: 124 }), logs: [{ at: NOW - 7 * 60_000, kind: 'merchant', summary: 'A [[Wandering Merchant]] set up a trestle table. Open for 4 adventures.', deltas: { xpEarned: 0, gold: 0, hp: 0, offers: 3 } }, ...base.logs], latestEvent: { kind: 'merchant' } },
    stale: { ...base, world: { ...base.world!, lastCompletedAt: NOW - 3 * 3_600_000 } },
    longText: {
      ...base,
      // The widest status line too: the longest area under the longest stance name (D103).
      hero: hero({ name: 'Sir Staplington', biomeId: 'cafeteria_depths', stance: 'cautious' }),
      latestEvent: { kind: 'combat', outcome: { variant: 'combat', monsterId: 'microwave_wraith', elite: true, outcome: 'victory' } },
      ownerAlias: 'A_Very_Long_Alias__',
      // Widest case for the unclamped rank rows: a 20-character public name with a five-digit score.
      ranking: ranked({ rank: 1, score: 12840, top: [{ rank: 1, name: 'Maximilian_Wolfgangs', hero_name: 'Sir Staplington', level: 12, score: 12840 }, ...base.ranking!.top.slice(1)] }),
      logs: [{ at: NOW - 7 * 60_000, kind: 'combat', summary: 'Sent an elite [[Microwave Wraith]] back to the kitchen. +188 XP, +57 gold. Reached level 12! Found a [[Rare Ladle of Ruin]].', deltas: { xpEarned: 188, gold: 57, hp: -48 } }, ...base.logs],
      // The longest task labels and goal title, so the to-do column wraps and the goal clamps at their worst.
      todoTasks: [
        { label: 'Defeat 5 [[Microwave Wraiths]] in the [[Cafeteria Depths]]', progress: 3, target: 5, done: false },
        { label: 'Avoid 3 traps in the [[Cafeteria Depths]]', progress: 3, target: 3, done: true },
        { label: 'Beat an elite in the [[Cafeteria Depths]]', progress: 0, target: 1, done: false },
      ],
      goal: { title: 'Win a fight in the Parking Garage', value: 0, target: 1, gold: 150 },
    },
    // D184: a reached goal's reward waits, so the goal row inverts and points to the companion (five-digit gold at its widest).
    goalClaim: { ...base, goal: { title: 'Equip a piece of gear you found', value: 1, target: 1, gold: 12_340, claimable: true } },
    // D123: the widest HUD (a full bag, five-digit gold, the longest name and the Cautious stance) and sleep on a full bag.
    hudWide: { ...base, bagUsed: 20, hero: hero({ name: 'Sir Staplington', biomeId: 'cafeteria_depths', stance: 'cautious', gold: 99_999 }), latestEvent: { kind: 'loot', outcome: { variant: 'loot', found: 'gear' } }, logs: [{ at: NOW - 7 * 60_000, kind: 'loot', summary: 'Found an [[Epic Ladle of Ruin]] under a stack of unread memos.' }, ...base.logs] },
    bagSleeping: { ...base, hero: hero({ status: 'sleeping' }), heldItemName: 'Rare Spork Halberd', bagUsed: 20, latestEvent: { kind: 'loot', outcome: { variant: 'loot', found: 'gear' } }, logs: [{ at: NOW - 7 * 60_000, kind: 'loot', summary: 'Found a [[Rare Spork Halberd]]. Bag full. Holding it until you make room.' }, ...base.logs] },
    // D110: the longest raid line with a 20-character rival, a raid this hero lost and one it won (the gold scene), and a lethal raid.
    raidLost: { ...base, latestEvent: { kind: 'raid', outcome: { variant: 'raid', role: 'raider', won: false } }, logs: [{ at: NOW - 7 * 60_000, kind: 'raid', summary: "The raid on [[Maximilian_Wolfgangs]]'s desk went badly. Dropped the loot on the way out.", deltas: { xpEarned: 0, gold: -1240, hp: -54 } }, ...base.logs] },
    raidWon: { ...base, latestEvent: { kind: 'raid', outcome: { variant: 'raid', role: 'target', won: true } }, logs: [{ at: NOW - 7 * 60_000, kind: 'raid', summary: 'Caught [[Maximilian_Wolfgangs]] at the drawers. They fled and dropped their loot.', deltas: { xpEarned: 0, gold: 1240, hp: -18 } }, ...base.logs] },
    raidKnockout: { ...base, hero: hero({ status: 'dead', hp: 0, reviveAtTick: 128 }), latestEvent: { kind: 'death', outcome: { variant: 'raid', role: 'target', won: false } }, logs: [{ at: NOW - 7 * 60_000, kind: 'death', summary: 'Came back to find [[Maximilian_Wolfgangs]] had been through the drawers. Out cold for 2 hours. Lost 64 gold.', deltas: { xpEarned: 0, gold: -1304, hp: -54 } }, ...base.logs] },
    // D141: a meeting at its longest that still fits (89 code points with a 20-character name), drawing the Rogue coworker at the whiteboard.
    meeting: { ...base, latestEvent: { kind: 'meeting', outcome: { variant: 'meeting', role: 'starter', rivalClass: 'rogue', kindId: 'pep_talk' } }, logs: [{ at: NOW - 7 * 60_000, kind: 'meeting', summary: '[[Maximilian_Wolfgangs]] gave you a pep talk at the whiteboard. Backed up for 8 adventures.', deltas: { xpEarned: 0, gold: 0, hp: 0, effectGained: 'backed_up' } }, ...base.logs] },
    // D145: the longest lost-property lines with a 20-character name: a spare found (out of the lost-property box) and
    // the owner told who found it (the finder beside the box).
    lostPropertyFound: { ...base, hero: hero({ biomeId: 'cafeteria_depths', level: 9 }), latestEvent: { kind: 'loot', outcome: { variant: 'loot', found: 'gear', spare: { rivalHeroId: 'other', rivalName: 'Maximilian_Wolfgangs' } } }, logs: [{ at: NOW - 7 * 60_000, kind: 'loot', summary: 'Fished an [[Insulated Cardigan]] out of lost property. Label: [[Maximilian_Wolfgangs]].', deltas: { xpEarned: 0, gold: 0, hp: 0 } }, ...base.logs] },
    // D163: a dug-in elite with the longest eligible name, fresh (100%) and nearly beaten (1%), and one waiting while the hero rests.
    standoffFresh: { ...base, hero: hero({ biomeId: 'archive', level: 14, lastTick: 120, standoff: { monsterId: 'microfilm_phantom', hp: 1080, maxHp: 1080, untilTick: 144 } }), latestEvent: { kind: 'combat', outcome: { variant: 'combat', monsterId: 'microfilm_phantom', elite: true, outcome: 'retreat' } }, logs: [{ at: NOW - 7 * 60_000, kind: 'combat', summary: 'An elite [[Microfilm Phantom]] has dug in at the end of the rolling shelves. Down to 100%.', deltas: { xpEarned: 0, gold: 0, hp: -64 } }, ...base.logs] },
    standoffLow: { ...base, hero: hero({ biomeId: 'archive', level: 14, lastTick: 120, standoff: { monsterId: 'microfilm_phantom', hp: 6, maxHp: 1080, untilTick: 121 } }), latestEvent: { kind: 'combat', outcome: { variant: 'combat', monsterId: 'microfilm_phantom', elite: true, outcome: 'retreat' } }, logs: [{ at: NOW - 7 * 60_000, kind: 'combat', summary: 'Another round with the elite [[Microfilm Phantom]]. Down to 1%.', deltas: { xpEarned: 0, gold: 0, hp: -88 } }, ...base.logs] },
    standoffResting: { ...base, hero: hero({ biomeId: 'archive', level: 14, status: 'resting', lastTick: 120, standoff: { monsterId: 'microfilm_phantom', hp: 540, maxHp: 1080, untilTick: 136 } }), latestEvent: { kind: 'rest', outcome: { variant: 'rest' } }, logs: [{ at: NOW - 7 * 60_000, kind: 'rest', summary: 'Rested at a desk. +40 HP. The elite [[Microfilm Phantom]] is waiting.', deltas: { xpEarned: 0, gold: 0, hp: 40 } }, ...base.logs] },
    lostPropertyTold: { ...base, latestEvent: { kind: 'lost_property', outcome: { variant: 'lost_property', rivalClass: 'rogue' } }, logs: [{ at: NOW - 7 * 60_000, kind: 'lost_property', summary: '[[Maximilian_Wolfgangs]] picked up your spare [[Insulated Cardigan]] in the [[Cafeteria Depths]].', deltas: { xpEarned: 0, gold: 0, hp: 0 } }, ...base.logs] },
    // D112: the longest single task line, two tasks ticked off at once, the longest three-task stand-up as the newest
    // line, and a stand-up in an older row, where it says its count. The scene keeps following the tick's story.
    todoDone: { ...base, hero: hero({ biomeId: 'cafeteria_depths', level: 9 }), logs: [{ at: NOW - 7 * 60_000, kind: 'todo', summary: 'Ticked off: Explore the [[Cafeteria Depths]] for 40 adventures.', deltas: { xpEarned: 0, gold: 30, hp: 0 } }, ...base.logs] },
    todoTwo: { ...base, hero: hero({ biomeId: 'cafeteria_depths', level: 9 }), logs: [{ at: NOW - 7 * 60_000, kind: 'todo', summary: 'Ticked off: Defeat 5 [[Leftovers Hydras]]. Explore the [[Cafeteria Depths]] for 40 adventures.', compact: 'Ticked off 2 tasks.', deltas: { xpEarned: 0, gold: 60, hp: 0 } }, ...base.logs] },
    todoStandup: { ...base, hero: hero({ biomeId: 'cafeteria_depths', level: 9 }), logs: [{ at: NOW - 7 * 60_000, kind: 'todo', summary: 'Stand-up: Defeat 5 [[Leftovers Hydras]]. Earn 260 gold adventuring. Dodge 2 traps.', compact: 'Stand-up: 3 new tasks.', deltas: { xpEarned: 0, gold: 0, hp: 0 } }, ...base.logs] },
    todoStandupRow: { ...base, logs: [base.logs[0]!, { at: NOW - 22 * 60_000, kind: 'todo', summary: 'Stand-up: Defeat 5 [[Legacy Mainframes]]. Earn 140 gold adventuring. Beat an elite.', compact: 'Stand-up: 3 new tasks.', deltas: { xpEarned: 0, gold: 0, hp: 0 } }, ...base.logs.slice(1)] },
    // Older rows with every kind of change: a shop purchase with a bag-slot mark (which once left the story a word wide
    // on a scaled portrait X), a potion found and drunk, the widest numbers each column holds, and a change with no mark.
    // User report: zero-change achievements mixed with multi-line changes in the X vertical half.
    sideAchievementLog: { ...base, hero: hero({ name: 'Rombso', level: 1, xp: 41, hp: 100, gold: 36, biomeId: 'office_cubicles' }), logs: [
      { kind: 'achievement', summary: 'Achievement: [[Coffee Break]]', hp: 0, gold: 0, xp: 0 },
      { kind: 'rest', summary: 'A decent cup of coffee.', hp: 2, gold: 0, xp: 0 },
      { kind: 'loot', summary: 'An old expense claim finally paid out.', hp: 0, gold: 2, xp: 0 },
      { kind: 'achievement', summary: 'Achievement: [[First Aid]]', hp: 0, gold: 0, xp: 0 },
      { kind: 'system', summary: 'Drank a healing potion.', hp: 40, gold: 0, xp: 0 },
      { kind: 'combat', summary: 'Filed a [[Dust Daemon]] under defeated.', hp: -14, gold: 2, xp: 7 },
      { kind: 'trap', summary: 'Got stuck in the revolving door. Bruised for 4 adventures.', hp: -7, gold: 0, xp: 0 },
      { kind: 'loot', summary: 'An old expense claim finally paid out.', hp: 0, gold: 3, xp: 0 },
      { kind: 'combat', summary: 'Cleared a [[Dust Daemon]] from the break room.', hp: -8, gold: 2, xp: 6 },
      { kind: 'rest', summary: 'Took a coffee break.', hp: 4, gold: 0, xp: 0 },
    ].map((entry, index) => ({ at: NOW - (index + 1) * 60_000, kind: entry.kind, summary: entry.summary, deltas: { xpEarned: entry.xp, gold: entry.gold, hp: entry.hp } })) },
    ledgerChanges: { ...base, logs: [base.logs[0]!,
      { at: NOW - 22 * 60_000, kind: 'system', summary: 'Bought a [[Laptop Backpack]]. Bag holds 13.', deltas: { xpEarned: 0, gold: -100, hp: 0, bagSlots: 3 } },
      { at: NOW - 23 * 60_000, kind: 'loot', summary: 'Found a healing potion. Drank a potion.', deltas: { xpEarned: 0, gold: 0, hp: 8, potionsFound: 1, potionHealing: 20 } },
      { at: NOW - 24 * 60_000, kind: 'raid', summary: 'Raided [[Maximilian_Wolfgangs]] and came back heavy.', deltas: { xpEarned: 2256, gold: -8888, hp: -148 } },
      { at: NOW - 25 * 60_000, kind: 'system', summary: 'Sold 6 items.', deltas: { xpEarned: 0, gold: 40, hp: 0, pouchCap: 6 } },
      ...base.logs.slice(1)] },
    // P35: the longest goal line with its "Next:" clause as the newest story (the compact form in narrow rows), the
    // celebration it brings, and an unlock line. The scene keeps following the tick's story.
    careerGoal: { ...base, hero: hero({ level: 5, biomeId: 'server_room' }), newestEvent: { kind: 'career', title: 'Goal reached: Answer an office decision' }, logs: [{ at: NOW - 7 * 60_000, kind: 'career', summary: 'Goal reached: Answer an office decision. Next: Buy the Lunchbox.', compact: 'Goal reached: Answer an office decision.', deltas: { xpEarned: 0, gold: 30, hp: 0 } }, ...base.logs] },
    careerUnlock: { ...base, hero: hero({ level: 6, biomeId: 'server_room' }), newestEvent: { kind: 'career', title: 'Unlocked: the wandering merchant' }, logs: [{ at: NOW - 7 * 60_000, kind: 'career', summary: 'Unlocked: the wandering merchant.', deltas: { xpEarned: 0, gold: 0, hp: 0 } }, ...base.logs] },
    unlinked: { ...base, hero: null, ranking: null, logs: [], latestEvent: null },
    // Setup screen while the service is paused: no code to scan, so the panel says so instead of asking for a scan.
    unlinkedPaused: { ...base, hero: null, ranking: null, logs: [], latestEvent: null, world: { ...base.world!, maintenanceMode: true } },
    midBoard: { ...base, ranking: ranked({ rank: 14, score: 655, nearby: midRows, nearbyOwn: 5 }) },
    firstRun: { ...base, hero: hero({ level: 1, xp: 0, hp: 60, gold: 0, biomeId: 'office_cubicles', lastTick: 0 }), logs: [], latestEvent: null, ranking: ranked({ rank: null, rankDelta: null, status: 'awaiting', score: null, top: [] }) },
  }

  // A fictional public sample generated through the same payload and templates.
  // Never include a redeemable keepsake code in a marketplace or landing image.
  const potionStates: Record<string, PayloadInput> = Object.fromEntries([
    ['potionFind', 'Found a healing potion.', 1, 0, 0],
    ['potionFindAndUse', 'Found a healing potion. Drank a potion.', 1, 0, 20],
    ['potionFullFallback', 'Potion pouch full; sold a spare for 5 gold.', 0, 5, 0],
  ].map(([name, summary, potionsFound, gold, hp]) => [name, { ...base, latestEvent: { kind: 'loot', outcome: { variant: 'loot', found: potionsFound ? 'potion' : 'gold' } }, logs: [{ at: NOW - 7 * 60_000, kind: 'loot', summary: String(summary), deltas: { xpEarned: 0, potionsFound: Number(potionsFound), gold: Number(gold), hp: Number(hp) } }, ...base.logs] }]))
  const noEffectStates: Record<string, PayloadInput> = {
    coffeeBreak: { ...base, hero: hero({ biomeId: 'office_cubicles', hp: 148 }), latestEvent: { kind: 'rest' }, logs: [{ at: NOW - 7 * 60_000, kind: 'rest', summary: 'Took a coffee break anyway.', deltas: { xpEarned: 0, gold: 0, hp: 0 } }, ...base.logs] },
  }
  // Explicit recorded-outcome fixtures; these are fictional and never written to a deployment.
  // Recorded outcomes sit inside the period the preview clock shows: at 10:20 Johannesburg that is the night recap, up to 07:00 (05:00 UTC).
  const activityEntry = (outcome: OutcomeDetail, index: number, patch: Partial<ActivityEntry> = {}): ActivityEntry => ({ at: PREVIEW_PERIOD_END - (index + 1) * 900_000, deltas: { xpEarned: 0, gold: 0, hp: 0 }, detail: { outcome, levelsGained: 0, heldFind: false }, ...patch })
  const fixtureFight: OutcomeDetail = { variant: 'combat', monsterId: 'cable_serpent', elite: false, monsterHpStart: 40, monsterHpEnd: 0, rounds: [], outcome: 'victory', xpGranted: 14, goldGranted: 5, gearDropped: false }
  const fixtureGear: OutcomeDetail = { variant: 'loot', found: 'gear', rarity: 'rare', goldGranted: 0, jackpot: false, potionFullFallback: false }
  const fixtureBreak: OutcomeDetail = { variant: 'rest', healing: 0, automatic: false, resultingStatus: 'exploring' }
  const overnightEntries = [
    ...Array.from({ length: 13 }, (_, i) => activityEntry(fixtureFight, i, { deltas: { xpEarned: 14, gold: 5, hp: -4 } })),
    ...Array.from({ length: 3 }, (_, i) => activityEntry(fixtureGear, i + 13)),
    ...Array.from({ length: 4 }, (_, i) => activityEntry({ variant: 'loot', found: 'potion', goldGranted: 0, jackpot: false, potionFullFallback: false }, i + 16)),
    ...Array.from({ length: 17 }, (_, i) => activityEntry(fixtureBreak, i + 20)),
  ]
  const milestoneEntries = [
    activityEntry(fixtureFight, 1, { deltas: { xpEarned: 188, gold: 57, hp: -48 }, detail: { outcome: { ...fixtureFight, elite: true, goldGranted: 57 }, levelsGained: 2, heldFind: false } }),
    activityEntry(fixtureGear, 30),
    ...overnightEntries,
  ]
  const recapStates: Record<string, PayloadInput> = {
    overnight: { ...base, activity: { entries: overnightEntries, truncated: false } },
    milestones: { ...states.longText!, activity: { entries: milestoneEntries, truncated: false } },
    quietMorning: { ...noEffectStates.coffeeBreak!, activity: { entries: Array.from({ length: 17 }, (_, i) => activityEntry(fixtureBreak, i)), truncated: false } },
    emptyWindow: { ...states.paused!, logs: base.logs.map(log => ({ ...log, at: log.at - 13 * 3_600_000 })), activity: { entries: [], truncated: false } },
    partial: { ...base, activity: { entries: Array.from({ length: MAX_RECAP_EVENTS }, (_, i) => activityEntry(fixtureFight, i, { at: PREVIEW_PERIOD_END - (i + 1) * 60_000, deltas: { xpEarned: 999, gold: 999, hp: 0 } })), truncated: true } },
    fullBagRecap: { ...states.sleeping!, activity: { entries: [activityEntry(fixtureGear, 0, { detail: { outcome: fixtureGear, levelsGained: 0, heldFind: true } }), ...overnightEntries], truncated: false } },
    knockoutRecap: { ...states.dead!, activity: { entries: [activityEntry({ ...fixtureFight, outcome: 'death', goldGranted: 0, gearDropped: false }, 0), ...overnightEntries], truncated: false } },
    recoveredRecap: { ...base, activity: { entries: [activityEntry({ variant: 'revival', previousBiomeId: 'server_room', safeBiomeId: 'office_cubicles', hpGranted: 30, reviveAtTick: 119 }, 0), activityEntry({ ...fixtureFight, outcome: 'death', goldGranted: 0, gearDropped: false }, 8), ...overnightEntries], truncated: false } },
    // D112: tasks ticked off overnight join the recap as one fact; the stand-up is not counted.
    tasksRecap: { ...base, activity: { entries: [
      activityEntry({ variant: 'todo', phase: 'done', tasks: [{ templateId: 'defeat_any', label: 'Win 12 fights', reward: 16 }] }, 0, { deltas: { xpEarned: 0, gold: 16, hp: 0 } }),
      activityEntry({ variant: 'todo', phase: 'standup', tasks: [{ templateId: 'find_gear', label: 'Find 2 pieces of gear', reward: 16 }] }, 1),
      activityEntry({ variant: 'todo', phase: 'done', tasks: [{ templateId: 'find_gear', label: 'Find 2 pieces of gear', reward: 16 }] }, 2, { deltas: { xpEarned: 0, gold: 16, hp: 0 } }),
      ...overnightEntries,
    ], truncated: false } },
    // D110: raids won and lost overnight, one of them lethal.
    raidRecap: { ...base, activity: { entries: [
      activityEntry({ variant: 'raid', role: 'raider', rivalHeroId: 'r1', rivalName: 'Quill', won: true, gold: 14, hpLost: 9, raidTick: 110, outcome: 'survived' }, 0),
      activityEntry({ variant: 'raid', role: 'target', rivalHeroId: 'r2', rivalName: 'Mo', won: false, gold: 22, hpLost: 54, raidTick: 104, outcome: 'death' }, 1),
      activityEntry({ variant: 'raid', role: 'target', rivalHeroId: 'r3', rivalName: 'Bea', won: true, gold: 6, hpLost: 18, raidTick: 100, outcome: 'survived' }, 2),
      ...overnightEntries,
    ], truncated: false } },
    arrivalRecap: { ...base, activity: { entries: [activityEntry({ variant: 'travel', phase: 'arrive', fromBiomeId: 'office_cubicles', toBiomeId: 'server_room', arrivalTick: 120 }, 0), ...overnightEntries], truncated: false } },
  }
  // Saturated histories prove layout capacity is measured instead of capped at three stories.
  const denseLogs = (summary: string): PayloadInput['logs'] => Array.from({ length: MAX_LOGS }, (_, i) => ({ at: NOW - (i + 1) * 900_000, kind: 'rest', summary, deltas: { xpEarned: 0, gold: 0, hp: 0 } }))
  Object.assign(recapStates, {
    denseShort: { ...base, logs: denseLogs('Took a coffee break anyway.') },
    emptyHistory: { ...base, logs: [] },
    missingQr: { ...base, artBaseUrl: null, logs: denseLogs('Took a coffee break anyway.') },
    denseLong: { ...states.longText!, logs: denseLogs('Sent an elite [[Microwave Wraith]] back to the kitchen. Reached level 12! Found a [[Rare Ladle of Ruin]].') },
    longHero: { ...base, hero: hero({ name: 'W'.repeat(16) }), logs: denseLogs('Filed a [[Paper Imp]] under defeated.') },
    denseRaid: { ...base, logs: denseLogs("The raid on [[Maximilian_Wolfgangs]]'s desk went badly. Dropped the loot on the way out.").map(log => ({ ...log, kind: 'raid', deltas: { xpEarned: 0, gold: -1240, hp: -54 } })) },
    noMetadata: { ...base, logs: denseLogs('A quiet moment.').map(({ deltas: _deltas, ...entry }) => entry) },
    largeRanking: { ...base, logs: denseLogs('Filed a [[Paper Imp]] under defeated.'), ranking: ranked({ rank: 12345, totalPlayers: 999999, top: base.ranking!.top.map(row => ({ ...row, score: 999999 })) }) },
  })

  const marketing: Record<string, PayloadInput> = {
    // The public pages' sample (D137): a level-7 hero on Bold, so its log can show a desk raid on Bo from the board, and
    // the goal after the first raid. With --keepsakes it shows the preview-only keepsake code too.
    sample: {
      ...base,
      ownerAlias: 'Steve',
      hero: hero({ name: 'Pip', level: 7, xp: 412, hp: 141, stance: 'bold' }),
      logs: base.logs.map((log, i) => i === 2 ? { at: log.at, kind: 'raid', summary: "Raided [[Bo]]'s desk while they were at lunch.", deltas: { xpEarned: 0, gold: 31, hp: -17 } } : log),
      goal: { title: 'Win a fight in the Cafeteria Depths', value: 0, target: 1, gold: 50 },
      ranking: ranked({ top: base.ranking!.top.map(row => row.rank === 3 ? { ...row, name: 'Steve', hero_name: 'Pip' } : row) }),
    },
  }
  return { groups: { states, recap: recapStates, potionFinds: potionStates, noEffect: noEffectStates, marketing }, overnightEntries, base }
}
