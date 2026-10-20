import { v } from 'convex/values'

/** Little Plot storage validators (little-plot.md "Data"). Mirrors the pure core's types in packages/little-plot. */
export const season = v.union(v.literal('spring'), v.literal('summer'), v.literal('autumn'), v.literal('winter'))
export const weather = v.union(v.literal('clear'), v.literal('overcast'), v.literal('rain'), v.literal('fog'))
export const timeBand = v.union(v.literal('dawn'), v.literal('day'), v.literal('dusk'), v.literal('night'))
export const stage = v.union(v.literal('sown'), v.literal('sprout'), v.literal('leaf'), v.literal('bud'), v.literal('ripe'))
export const pestId = v.union(v.literal('slugs'), v.literal('aphids'), v.literal('birds'), v.literal('fox'), v.literal('gnome'), v.literal('heron'))
export const pestEffect = v.union(
  v.literal('slugs'),
  v.literal('aphids'),
  v.literal('birds_tin'),
  v.literal('fox'),
  v.literal('gnome_seed'),
  v.literal('gnome_move'),
  v.literal('gnome_turn'),
  v.literal('gnome_caught'),
  v.literal('heron'),
  v.literal('frost_rose'),
)

export const bed = v.object({
  kindId: v.optional(v.string()),
  points: v.number(),
  sownTick: v.number(),
  ripeSinceTick: v.optional(v.number()),
  crossedKindId: v.optional(v.string()),
  slowUntilTick: v.optional(v.number()),
  volunteer: v.optional(v.literal(true)),
  greenhouse: v.optional(v.literal(true)),
})

export const catalogueEntry = v.object({ count: v.number(), best: v.number(), firstTick: v.number() })

export const seedTag = v.object({ kindId: v.string(), from: v.string(), cutting: v.optional(v.literal(true)) })

export const plotCounters = v.object({
  ripenings: v.number(),
  harvests: v.number(),
  sowings: v.number(),
  waterings: v.number(),
  crossesFound: v.number(),
  epicsFound: v.number(),
  gnomesCaught: v.number(),
  pestsDeterred: v.number(),
  pestEvents: v.number(),
  nightRipenings: v.number(),
  rainWateredTicks: v.number(),
  goldEarned: v.number(),
  volunteers: v.number(),
  windSeeds: v.number(),
  seedsLost: v.number(),
  seedsFound: v.number(),
  gnomesHosted: v.number(),
  cuttingsSent: v.number(),
  cuttingsReceived: v.number(),
  greenhouseRareRipenings: v.number(),
  goalsReached: v.number(),
  itemsBought: v.number(),
  seedsBought: v.number(),
  seasonsGrown: v.number(),
})

/** The pure core's PlotState, stored whole. Bounded: at most 12 beds, 36 tin keys, 8 tags, 36 catalogue keys. */
export const plotState = v.object({
  level: v.number(),
  xp: v.number(),
  lifetimeXp: v.number(),
  gold: v.number(),
  status: v.union(v.literal('growing'), v.literal('paused')),
  rows: v.number(),
  cols: v.number(),
  beds: v.array(bed),
  tin: v.record(v.string(), v.number()),
  tags: v.array(seedTag),
  items: v.array(v.string()),
  wateredUntilTick: v.number(),
  ladybirdsUntilTick: v.optional(v.number()),
  heronUntilTick: v.optional(v.number()),
  heronWeek: v.optional(v.number()),
  birdTableDay: v.optional(v.number()),
  frostWeek: v.optional(v.number()),
  catalogue: v.record(v.string(), catalogueEntry),
  counters: plotCounters,
  quietTicks: v.number(),
  goal: v.optional(v.object({ rung: v.number(), ticksAtStart: v.number(), used: v.optional(v.literal(true)), unclaimed: v.optional(v.array(v.object({ id: v.string(), coins: v.number() }))) })),
  ticks: v.number(),
})

export const lpLogKind = v.union(
  v.literal('stage'),
  v.literal('ripe'),
  v.literal('seeded'),
  v.literal('pest'),
  v.literal('deterred'),
  v.literal('cross'),
  v.literal('ambient'),
  v.literal('goal'),
  v.literal('level'),
  v.literal('visit'),
  v.literal('system'),
  v.literal('frost'),
  v.literal('heron'),
  v.literal('harvest'),
  v.literal('sow'),
  v.literal('water'),
  v.literal('shop'),
  v.literal('cutting'),
  v.literal('achievement'),
)

/** What a story line was about, for the companion's icons and the device's recap. */
export const lpLogDetail = v.object({
  v: v.literal(1),
  bed: v.optional(v.number()),
  kindId: v.optional(v.string()),
  childKindId: v.optional(v.string()),
  stage: v.optional(stage),
  pest: v.optional(pestId),
  effect: v.optional(pestEffect),
  item: v.optional(v.string()),
  coins: v.optional(v.number()),
  xp: v.optional(v.number()),
  level: v.optional(v.number()),
  goalId: v.optional(v.string()),
  first: v.optional(v.literal(true)),
  season: v.optional(season),
  weather: v.optional(weather),
  band: v.optional(timeBand),
  /** A visit's other garden, masked on read like a rank row. */
  otherUserId: v.optional(v.id('users')),
  otherName: v.optional(v.string()),
  otherNameVersion: v.optional(v.number()),
  operation: v.optional(v.string()),
  achievementId: v.optional(v.string()),
})
