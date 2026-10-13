import { ACTIVE_CONTENT, catalogs, type CatalogId } from '@trmnl-games/desk-crawler/content'
import { remapRung } from '@trmnl-games/desk-crawler/sim/core/career'
import type { ContentCatalog } from '@trmnl-games/desk-crawler/sim/core/types'
import { v } from 'convex/values'
import type { Doc } from './_generated/dataModel'
import { internalMutation, type MutationCtx, type QueryCtx } from './_generated/server'
import { DESK_CRAWLER_RUNTIME } from './lib/engine/deskCrawler'
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
    const to = catalogs[switched.to as CatalogId]?.career
    let heroesMoved = 0
    if (from !== undefined && to !== undefined && from !== to) {
      // A release operation, once per catalog switch: one pass over every hero, writing only those that move.
      for await (const hero of ctx.db.query('heroes')) {
        const career = hero.career
        if (career === undefined) continue
        const rung = remapRung(from, to, career.rung)
        if (rung === career.rung) continue
        // The rung under the pointer is the same one unless the new ladder dropped it; a guarantee belongs to its rung.
        const same = from.rungs[career.rung]?.id === to.rungs[rung]?.id
        const { armedAt: _a, armedCount: _c, fired: _f, ...rest } = career
        await ctx.db.patch(hero._id, { career: same ? { ...career, rung } : { ...rest, rung } })
        heroesMoved += 1
      }
    }
    return { ...switched, heroesMoved }
  },
})
