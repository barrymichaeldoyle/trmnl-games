import { v } from 'convex/values'
import type { Id } from '../_generated/dataModel'
import { internalQuery } from '../_generated/server'

/**
 * What the art route needs to draw a map window or a print (pixel-wars.md "Device"): the snapshot's geometry and
 * cells, and the ringed desk's cell when a seat is named. Public images of a hidden game show no names, only
 * patterns, so nothing here is private.
 */
export const snapshot = internalQuery({
  args: { mapId: v.string(), tick: v.number(), seat: v.number() },
  returns: v.union(v.null(), v.object({ x0: v.number(), y0: v.number(), cols: v.number(), rows: v.number(), cells: v.bytes(), own: v.union(v.null(), v.object({ x: v.number(), y: v.number() })) })),
  handler: async (ctx, { mapId, tick, seat }) => {
    const id = ctx.db.normalizeId('pwMaps', mapId)
    if (id === null) return null
    const row = await ctx.db.query('pwMapTicks').withIndex('by_mapId_and_tick', (q) => q.eq('mapId', id).eq('tick', tick)).unique()
    if (row === null) return null
    const map = seat > 0 ? await ctx.db.get(id) : null
    const s = map?.seats[seat - 1]
    return { x0: row.x0, y0: row.y0, cols: row.cols, rows: row.rows, cells: row.cells, own: s ? { x: s.x, y: s.y } : null }
  },
})

export const print = internalQuery({
  args: { seasonId: v.string() },
  returns: v.union(v.null(), v.object({ x0: v.number(), y0: v.number(), cols: v.number(), rows: v.number(), cells: v.bytes() })),
  handler: async (ctx, { seasonId }) => {
    const id = ctx.db.normalizeId('pwSeasons', seasonId) as Id<'pwSeasons'> | null
    if (id === null) return null
    const row = await ctx.db.get(id)
    return row ? { x0: row.x0, y0: row.y0, cols: row.cols, rows: row.rows, cells: row.cells } : null
  },
})
