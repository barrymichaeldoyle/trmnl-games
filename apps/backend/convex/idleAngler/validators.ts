import { v } from 'convex/values'

/** Idle Angler storage validators (idle-angler.md "Data"). Mirrors the pure core's types in packages/idle-angler. */
export const waterId = v.union(v.literal('millpond'), v.literal('river_bend'), v.literal('harbour_pier'), v.literal('heron_lake'), v.literal('deep_sea'), v.literal('frozen_tarn'))
export const baitClass = v.union(v.literal('worms'), v.literal('bread'), v.literal('maggots'), v.literal('spinner'), v.literal('ragworm'), v.literal('strip'), v.literal('boilies'), v.literal('deadbait'))
export const accessId = v.union(v.literal('waders'), v.literal('pier_permit'), v.literal('rowing_boat'), v.literal('ice_auger'))
/** D162: the world's season (content v2). */
export const season = v.union(v.literal('spring'), v.literal('summer'), v.literal('autumn'), v.literal('winter'))
export const rarity = v.union(v.literal('common'), v.literal('uncommon'), v.literal('rare'), v.literal('epic'))
export const timeBand = v.union(v.literal('dawn'), v.literal('day'), v.literal('dusk'), v.literal('night'))
export const weather = v.union(v.literal('clear'), v.literal('overcast'), v.literal('rain'), v.literal('wind'), v.literal('fog'))

export const anglerCounters = v.object({
  casts: v.number(),
  bites: v.number(),
  fishCaught: v.number(),
  released: v.number(),
  gotAway: v.number(),
  rareCaught: v.number(),
  epicCaught: v.number(),
  nightCatches: v.number(),
  heaviestGrams: v.number(),
  goldEarned: v.number(),
  fishSold: v.number(),
  trips: v.number(),
  baitRunOuts: v.number(),
  // D162 (content v2), absent until the first one counts.
  ordersFilled: v.optional(v.number()),
  deadbaitUsed: v.optional(v.number()),
  deadbaitCatches: v.optional(v.number()),
  trophiesMounted: v.optional(v.number()),
  opensEntered: v.optional(v.number()),
  medals: v.optional(v.number()),
  charters: v.optional(v.number()),
  breadCatches: v.optional(v.number()),
  dawnDuskCatches: v.optional(v.number()),
  rainCatches: v.optional(v.number()),
  goalsReached: v.optional(v.number()),
  seasonsFished: v.optional(v.number()),
  runsFished: v.optional(v.number()),
})

/** D162: one fishmonger order on the slate (packages/idle-angler/src/sim/orders.ts). */
export const order = v.object({
  id: v.string(),
  kind: v.union(v.literal('species'), v.literal('weight'), v.literal('water'), v.literal('time'), v.literal('rarity'), v.literal('teaching')),
  count: v.number(),
  bonus: v.number(),
  speciesId: v.optional(v.string()),
  water: v.optional(waterId),
  minGrams: v.optional(v.number()),
  bands: v.optional(v.array(timeBand)),
  rarity: v.optional(rarity),
})

export const logbookEntry = v.object({ count: v.number(), bestGrams: v.number(), firstTick: v.number() })

export const iaLogKind = v.union(
  v.literal('catch'),
  v.literal('release'),
  v.literal('got_away'),
  v.literal('ambient'),
  v.literal('travel'),
  v.literal('bait_out'),
  v.literal('milestone'),
  v.literal('achievement'),
  v.literal('system'),
  v.literal('goal'),
  v.literal('run'),
  v.literal('order'),
  v.literal('trophy'),
  v.literal('open'),
)

export const iaLogDetail = v.object({
  v: v.literal(1),
  operation: v.optional(v.string()),
  speciesId: v.optional(v.string()),
  grams: v.optional(v.number()),
  value: v.optional(v.number()),
  record: v.optional(v.boolean()),
  firstOfSpecies: v.optional(v.boolean()),
  waterId: v.optional(waterId),
  bait: v.optional(baitClass),
  weather: v.optional(weather),
  band: v.optional(timeBand),
  count: v.optional(v.number()),
  achievementId: v.optional(v.string()),
  name: v.optional(v.string()),
  season: v.optional(season),
  goalId: v.optional(v.string()),
  runId: v.optional(v.string()),
  orderId: v.optional(v.string()),
  place: v.optional(v.number()),
})
