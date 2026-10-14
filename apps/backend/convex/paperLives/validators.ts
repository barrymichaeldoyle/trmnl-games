import { v } from 'convex/values'

/** Paper Lives storage validators (paper-lives.md "Data"). Mirrors the pure core's types in packages/paper-lives. */
export const stage = v.union(v.literal('infant'), v.literal('child'), v.literal('teen'), v.literal('young'), v.literal('adult'), v.literal('senior'))
export const pronouns = v.union(v.literal('they'), v.literal('she'), v.literal('he'))
export const role = v.union(v.literal('parent'), v.literal('sibling'), v.literal('partner'), v.literal('former_partner'), v.literal('child'), v.literal('grandchild'), v.literal('friend'), v.literal('colleague'))
export const partnerStep = v.union(v.literal('dating'), v.literal('engaged'), v.literal('married'))
export const home = v.union(v.literal('family'), v.literal('renting'), v.literal('owned'))
export const education = v.union(v.literal('none'), v.literal('school'), v.literal('university'), v.literal('degree'), v.literal('trade'), v.literal('work'))
export const willKind = v.union(v.literal('split'), v.literal('one_child'), v.literal('partner'), v.literal('cause'))
export const glyph = v.union(
  v.literal('family'),
  v.literal('work'),
  v.literal('money'),
  v.literal('health'),
  v.literal('heart'),
  v.literal('paw'),
  v.literal('star'),
  v.literal('candle'),
  v.literal('ring'),
  v.literal('house'),
  v.literal('pram'),
  v.literal('book'),
  v.literal('none'),
)
export const stats = v.object({ health: v.number(), happiness: v.number(), smarts: v.number(), charm: v.number() })

export const person = v.object({
  id: v.string(),
  name: v.string(),
  role,
  bornAt: v.number(),
  metAt: v.number(),
  relationship: v.number(),
  alive: v.boolean(),
  step: v.optional(partnerStep),
  stepYears: v.optional(v.number()),
  parentId: v.optional(v.string()),
  history: v.array(v.string()),
})

export const pet = v.object({ kind: v.string(), name: v.string(), bornAt: v.number(), lifespan: v.number(), relationship: v.number() })

export const lifeCounters = v.object({
  yearsLived: v.number(),
  decisionsChosen: v.number(),
  decisionsDefaulted: v.number(),
  remarkableEvents: v.number(),
  jobsHeld: v.number(),
  marriages: v.number(),
  childrenRaised: v.number(),
  grandchildren: v.number(),
  housesOwned: v.number(),
  petsKept: v.number(),
  hobbiesTaken: v.number(),
  peakMoney: v.number(),
})

/**
 * The pure core's LifeState, stored whole. Bounded: at most 12 people of 4 history lines, 48 flags, 16 highlights,
 * and a seen list no longer than the content (about 510 ids).
 */
export const lifeState = v.object({
  first: v.string(),
  last: v.string(),
  pronouns,
  traits: v.array(v.string()),
  generation: v.number(),
  age: v.number(),
  stage,
  status: v.union(v.literal('living'), v.literal('paused'), v.literal('ended')),
  stats,
  gold: v.number(),
  education,
  tierBonus: v.number(),
  job: v.optional(v.string()),
  jobSince: v.optional(v.number()),
  income: v.number(),
  jobYears: v.record(v.string(), v.number()),
  retired: v.boolean(),
  pension: v.number(),
  home,
  house: v.optional(v.number()),
  hobby: v.optional(v.string()),
  hobbiesHad: v.optional(v.array(v.string())),
  pet: v.optional(pet),
  petLostAt: v.optional(v.number()),
  people: v.array(person),
  flags: v.array(v.string()),
  seen: v.array(v.string()),
  year: v.object({
    elapsed: v.number(),
    quietTicks: v.number(),
    ageUpRequested: v.boolean(),
    pending: v.optional(v.object({ decisionId: v.string(), chosen: v.optional(v.string()), personId: v.optional(v.string()) })),
    notes: v.array(v.string()),
    lines: v.number(),
    ambient: v.optional(v.number()),
  }),
  recap: v.optional(v.string()),
  will: v.optional(willKind),
  ailment: v.optional(v.string()),
  nextPersonId: v.number(),
  counters: lifeCounters,
  highlights: v.array(v.string()),
  death: v.optional(v.object({ cause: v.string(), line: v.string(), epitaph: v.string() })),
})

export const plLogKind = v.union(
  v.literal('event'),
  v.literal('ambient'),
  v.literal('decision_offered'),
  v.literal('decision_resolved'),
  v.literal('check'),
  v.literal('stage'),
  v.literal('recap'),
  v.literal('death'),
  v.literal('infant'),
  v.literal('achievement'),
  v.literal('system'),
)

/** A finished life's summary (paper-lives.md "The will, death and the next life"), written once. */
export const lifeRecordFields = {
  userId: v.id('users'),
  lifeId: v.id('lives'),
  ordinal: v.number(),
  parentRecordId: v.optional(v.id('lifeRecords')),
  endedAt: v.number(),
  first: v.string(),
  last: v.string(),
  pronouns,
  traits: v.array(v.string()),
  generation: v.number(),
  age: v.number(),
  cause: v.string(),
  epitaph: v.string(),
  finalStats: stats,
  peakMoney: v.number(),
  finalGold: v.number(),
  longestJob: v.optional(v.string()),
  hobby: v.optional(v.string()),
  counters: lifeCounters,
  house: v.optional(v.number()),
  will: v.optional(willKind),
  bequests: v.array(v.object({ personId: v.string(), gold: v.number(), house: v.boolean() })),
  highlights: v.array(v.string()),
  heirs: v.array(v.object({ id: v.string(), name: v.string(), role: v.union(v.literal('child'), v.literal('grandchild')), age: v.number(), relationship: v.number(), parentId: v.optional(v.string()) })),
  partner: v.optional(v.object({ name: v.string(), age: v.number(), relationship: v.number() })),
  /** Set once the next life has begun from this record. */
  continuedBy: v.optional(v.union(v.literal('child'), v.literal('stranger'))),
}

export const lifeBoard = v.union(v.literal('longest'), v.literal('fortune'))

/** The account's career across lives (packages/paper-lives content/achievements.ts), folded in once per finished life. */
export const career = v.object({
  livesEnded: v.number(),
  yearsLived: v.number(),
  oldestAge: v.number(),
  highestGeneration: v.number(),
  childrenRaised: v.number(),
  grandchildren: v.number(),
  marriages: v.number(),
  peakMoney: v.number(),
  housesOwned: v.number(),
  petsKept: v.number(),
  decisionsChosen: v.number(),
  decisionsDefaulted: v.number(),
  remarkableEvents: v.number(),
  jobs: v.array(v.string()),
  longJobs: v.array(v.string()),
  hobbies: v.array(v.string()),
  traits: v.array(v.string()),
  setPieces: v.array(v.string()),
})
