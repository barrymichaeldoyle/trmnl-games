import { v } from 'convex/values'
import { query } from './_generated/server'
import { currentUser } from './lib/intent'
import { currentHero } from './lib/gameProfile'
import { floorCompany } from './lib/presence'
import { PRESENCE_MEMBERS_MAX } from './lib/engine/runner'

const named = v.object({ name: v.string(), heroName: v.string(), level: v.number(), profile: v.boolean() })

/**
 * D216: everyone else on the signed-in player's floor, by level, for the companion's full list. Null without a hero,
 * and while the hero is between floors.
 */
export const here = query({
  args: {},
  returns: v.union(v.null(), v.object({ biomeId: v.string(), others: v.number(), named: v.array(named) })),
  handler: async (ctx) => {
    const hero = await currentHero(ctx, await currentUser(ctx))
    if (hero === null || hero.activationState !== 'active' || hero.status === 'travelling') return null
    const company = await floorCompany(ctx, hero, hero.biomeId, PRESENCE_MEMBERS_MAX)
    return { biomeId: hero.biomeId, others: company.others, named: [...company.named] }
  },
})
