import { v } from 'convex/values'
import { query } from './_generated/server'
import { currentHero } from './lib/gameProfile'
import { currentUser } from './lib/intent'
import { heldSpares, ownSpare } from './lib/lostProperty'
import { pagePublic } from './lib/publicPage'
import { HIDDEN_RIVAL } from './lib/raids'
import { ACTIVE_CONTENT, catalogs } from '@trmnl-games/desk-crawler/content'

const spareView = v.object({
  name: v.string(),
  rarity: v.union(v.literal('common'), v.literal('uncommon'), v.literal('rare'), v.literal('epic')),
  kind: v.union(v.literal('weapon'), v.literal('armor')),
  ownerName: v.string(),
  profile: v.boolean(),
})

/**
 * D145: the signed-in owner's lost property: where its own spare is lying or who found it, the spares it holds from
 * other players, and how many it has found. Null without a hero.
 */
export const mine = query({
  args: {},
  returns: v.union(
    v.null(),
    v.object({
      enabled: v.boolean(),
      mySpare: v.union(
        v.null(),
        v.object({ name: v.string(), floor: v.string(), found: v.boolean(), finderName: v.union(v.null(), v.string()), finderProfile: v.boolean() }),
      ),
      held: v.array(spareView),
      total: v.number(),
    }),
  ),
  handler: async (ctx) => {
    const user = await currentUser(ctx)
    const hero = await currentHero(ctx, user)
    if (user === null || hero === null) return null
    const content = catalogs[ACTIVE_CONTENT]
    const row = await ownSpare(ctx, hero._id)
    let mySpare = null
    if (row !== null) {
      const floor = content.biomes.find((biome) => biome.id === row.biomeId)?.name ?? row.biomeId
      if (row.state === 'found' && row.finderUserId !== undefined) {
        const finder = await ctx.db.get(row.finderUserId)
        const visible = finder !== null && finder.state === 'active' && !finder.nameRepairRequired && finder.publicNameVersion === row.finderNameVersion
        mySpare = { name: row.name, floor, found: true, finderName: visible ? row.finderName! : HIDDEN_RIVAL, finderProfile: visible && pagePublic(await currentHero(ctx, finder)) }
      } else {
        mySpare = { name: row.name, floor, found: false, finderName: null, finderProfile: false }
      }
    }
    const items = await ctx.db.query('items').withIndex('by_heroId', (q) => q.eq('heroId', hero._id)).take(40)
    return { enabled: content.lostProperty !== undefined, mySpare, held: await heldSpares(ctx, items), total: hero.counters.lostPropertyFound ?? 0 }
  },
})
