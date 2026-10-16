import { v } from 'convex/values'
import type { Doc } from './_generated/dataModel'
import { query, type MutationCtx } from './_generated/server'

/**
 * The public office tally (D174). Written once when a tick finishes walking the heroes it already pages,
 * and read as a single row by the landing page. No hero list, no account data.
 */

const extras = v.object({
  sold: v.number(),
  salvaged: v.number(),
  potions: v.number(),
  upgraded: v.number(),
  raids: v.number(),
  tasks: v.number(),
})

const census = v.object({
  heroes: v.number(),
  monstersDefeated: v.number(),
  finds: v.number(),
  asOfTick: v.number(),
  extras,
})

/** Replace the published snapshot with this walk's totals. */
export async function publishOfficeCensus(ctx: MutationCtx, run: Doc<'simulationRuns'>): Promise<void> {
  const next = {
    key: 'current' as const,
    heroes: run.censusHeroes ?? 0,
    monstersDefeated: run.censusMonsters ?? 0,
    finds: run.censusFinds ?? 0,
    asOfTick: run.tick,
    sold: run.censusSold ?? 0,
    salvaged: run.censusSalvaged ?? 0,
    potions: run.censusPotions ?? 0,
    upgraded: run.censusUpgraded ?? 0,
    raids: run.censusRaids ?? 0,
    tasks: run.censusTasks ?? 0,
  }
  const existing = await ctx.db.query('officeCensus').withIndex('by_key', (q) => q.eq('key', 'current')).unique()
  if (existing) await ctx.db.patch(existing._id, next)
  else await ctx.db.insert('officeCensus', next)
}

/** Unauthenticated. Null until the first tick after the tally ships. */
export const office = query({
  args: {},
  returns: v.union(census, v.null()),
  handler: async (ctx) => {
    const row = await ctx.db.query('officeCensus').withIndex('by_key', (q) => q.eq('key', 'current')).unique()
    if (row === null) return null
    return {
      heroes: row.heroes,
      monstersDefeated: row.monstersDefeated,
      finds: row.finds,
      asOfTick: row.asOfTick,
      extras: {
        sold: row.sold ?? 0,
        salvaged: row.salvaged ?? 0,
        potions: row.potions ?? 0,
        upgraded: row.upgraded ?? 0,
        raids: row.raids ?? 0,
        tasks: row.tasks ?? 0,
      },
    }
  },
})
