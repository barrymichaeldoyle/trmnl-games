import { v } from 'convex/values'
import { query } from './_generated/server'
import { currentHero } from './lib/gameProfile'
import { currentUser } from './lib/intent'
import { recentRaids } from './lib/raids'

const RECENT_RAIDS = 5

const raidRow = v.object({
  tick: v.number(),
  /** When the raider's tick wrote it. */
  at: v.number(),
  role: v.union(v.literal('raider'), v.literal('target')),
  rivalName: v.string(),
  won: v.boolean(),
  gold: v.number(),
  hpLost: v.union(v.number(), v.null()),
  pending: v.boolean(),
  /** D139: a Friday the 13th mishap, which nobody won. */
  mishap: v.optional(v.literal(true)),
})

/** D110: the signed-in owner's last five raids, both directions, and its lifetime record. Null without a hero. */
export const recent = query({
  args: {},
  returns: v.union(v.null(), v.object({ raids: v.array(raidRow), record: v.object({ launched: v.number(), won: v.number(), repelled: v.number(), lost: v.number(), mishaps: v.number() }) })),
  handler: async (ctx) => {
    const user = await currentUser(ctx)
    const hero = await currentHero(ctx, user)
    if (user === null || hero === null) return null
    const counters = hero.counters
    return {
      raids: await recentRaids(ctx, hero._id, RECENT_RAIDS),
      record: { launched: counters.raidsLaunched ?? 0, won: counters.raidsWon ?? 0, repelled: counters.raidsRepelled ?? 0, lost: counters.raidsLost ?? 0, mishaps: counters.raidMishaps ?? 0 },
    }
  },
})
