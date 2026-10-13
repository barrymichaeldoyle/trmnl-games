import { ACTIVE_CONTENT, catalogs, type CatalogId } from '@trmnl-games/desk-crawler/content'
import { remapRung, rungSatisfied } from '@trmnl-games/desk-crawler/sim/core/career'
import type { ContentCatalog } from '@trmnl-games/desk-crawler/sim/core/types'
import { v } from 'convex/values'
import type { Doc } from './_generated/dataModel'
import { internalMutation, type MutationCtx, type QueryCtx } from './_generated/server'
import { DESK_CRAWLER_RUNTIME } from './lib/engine/deskCrawler'
import { toHeroState } from './sim/runs/adapter'
import { getOrCreateEngineWorld, readEngineWorld, setEngineContentVersion } from './lib/engine/world'

export async function readWorld(ctx: QueryCtx): Promise<Doc<'worldState'> | null> {
  return await readEngineWorld(ctx, DESK_CRAWLER_RUNTIME)
}

/**
 * The catalog the next run pins. Intents and displays follow it, so bag rules
 * never differ between a companion command and the tick that follows.
 */
export function worldContent(world: Pick<Doc<'worldState'>, 'activeContentVersion'> | null): ContentCatalog {
  return (world && catalogs[world.activeContentVersion as CatalogId]) ?? catalogs[ACTIVE_CONTENT]
}

/** Idempotently create the world singleton. The seed is server-only and never returned by public functions. */
export async function getOrCreateWorld(ctx: MutationCtx): Promise<Doc<'worldState'>> {
  return await getOrCreateEngineWorld(ctx, DESK_CRAWLER_RUNTIME)
}

/**
 * Switch the content catalog the next run pins (operations.md "Content releases"). Refused while a run is
 * active, so no run mixes catalogs; runs already started keep the version they recorded. D135: career pointers are
 * indices into the ladder, so the same transaction moves every hero to the same rung by id under the new ladder.
 */
export const setActiveContentVersion = internalMutation({
  args: { contentVersion: v.string() },
  returns: v.object({ from: v.string(), to: v.string(), heroesMoved: v.number() }),
  handler: async (ctx, { contentVersion }) => {
    const switched = await setEngineContentVersion(ctx, DESK_CRAWLER_RUNTIME, contentVersion)
    const from = catalogs[switched.from as CatalogId]?.career
    const content = catalogs[switched.to as CatalogId]
    const to = content?.career
    let heroesMoved = 0
    if (from !== undefined && to !== undefined && from !== to) {
      // A release operation, once per catalog switch: one pass over every hero, writing only those that move.
      for await (const hero of ctx.db.query('heroes')) {
        const career = hero.career
        if (career === undefined) continue
        const heroState = toHeroState(hero)
        const rung = remapRung(from, to, career.rung, (entry) => !rungSatisfied(entry, heroState, content!))
        // A guarantee belongs to its rung, so it goes when the rung under the pointer changes, even at the same index.
        const same = from.rungs[career.rung]?.id === to.rungs[rung]?.id
        if (rung === career.rung && (same || career.armedAt === undefined)) continue
        const { armedAt: _a, armedCount: _c, fired: _f, ...rest } = career
        await ctx.db.patch(hero._id, { career: same ? { ...career, rung } : { ...rest, rung } })
        heroesMoved += 1
      }
    }
    return { ...switched, heroesMoved }
  },
})
