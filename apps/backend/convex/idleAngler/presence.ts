import { v } from 'convex/values'
import type { IdleAnglerCatalog } from '@trmnl-games/idle-angler/sim'
import { titleFor, waterRankFor } from '@trmnl-games/idle-angler/sim'
import type { Doc, Id } from '../_generated/dataModel'
import { query, type MutationCtx, type QueryCtx } from '../_generated/server'
import { currentUser } from '../lib/intent'
import { pagePublic } from '../lib/publicPage'
import { PRESENCE_MEMBERS_MAX } from '../lib/engine/runner'
import { worldContentOf } from './anglers'
import { currentAngler } from './profile'

/**
 * Who else fishes the angler's water (D220), as Desk Crawler's floors do (D216): the tick counts anglers by water as it
 * walks them and publishes one row per water; screens read that row and the owners of the few members they name, so
 * every read is fixed and indexed. A member's `heroId` is an angler (the engine's name for its subject) and its `level`
 * the species it has logged at that water, the count its rank there follows (D204).
 */

/** Waters that can hold a row; well above the catalog's. */
const WATERS_READ = 16

/** Replace the published waters with this walk's: waters nobody fished lose their row. */
export async function publishWaterPresence(ctx: MutationCtx, run: Doc<'simulationRuns'>): Promise<void> {
  const walked = (run as unknown as Doc<'iaSimulationRuns'>).censusPresence ?? {}
  const rows = await ctx.db.query('waterPresence').take(WATERS_READ)
  for (const row of rows) if (walked[row.waterId] === undefined) await ctx.db.delete(row._id)
  for (const [waterId, water] of Object.entries(walked)) {
    const next = { waterId, count: water.count, members: water.members, asOfTick: run.tick }
    const existing = rows.find((row) => row.waterId === waterId)
    if (existing) await ctx.db.patch(existing._id, next)
    else await ctx.db.insert('waterPresence', next)
  }
}

/** Every water's head count, the angler's own water without the angler. */
export async function waterCounts(ctx: QueryCtx, angler: Doc<'anglers'>): Promise<Record<string, number>> {
  const rows = await ctx.db.query('waterPresence').take(WATERS_READ)
  return Object.fromEntries(rows.map((row) => [row.waterId, othersAt(row, angler._id)]))
}

const othersAt = (row: Doc<'waterPresence'>, anglerId: Id<'anglers'>) => Math.max(0, row.count - (row.members.some((member) => member.heroId === anglerId) ? 1 : 0))

export interface WaterCompany {
  /** Everyone else at the water, named or not. */
  readonly others: number
  /** Up to `names` of them by species logged there, under their current public names; a hidden owner is only counted. */
  readonly named: ReadonlyArray<{ readonly name: string; readonly standing: Standing | null; readonly profile: boolean }>
}

/**
 * The others at `waterId` for `angler`, naming up to `names` of them. A name shows under the boards' rule (D110): the
 * owner is active and not under name repair, and the angler is still theirs. `standing` is the rank at that water under
 * content v6 (D204), the title before; `profile` says the public page is open.
 */
export async function waterCompany(ctx: QueryCtx, angler: Doc<'anglers'>, waterId: string, names: number, content: IdleAnglerCatalog | null = null): Promise<WaterCompany> {
  const row = await ctx.db.query('waterPresence').withIndex('by_waterId', (q) => q.eq('waterId', waterId)).unique()
  if (row === null) return { others: 0, named: [] }
  const named: Array<WaterCompany['named'][number]> = []
  // A few spare members cover the angler itself and a hidden owner or two without reading the whole water.
  for (const member of row.members.slice(0, names + 3)) {
    if (named.length >= names) break
    if (member.heroId === angler._id || member.userId === angler.userId) continue
    const [owner, other] = await Promise.all([ctx.db.get(member.userId), ctx.db.get(member.heroId)])
    if (owner === null || other === null || owner.state !== 'active' || owner.nameRepairRequired || other.userId !== owner._id || !other.isActive) continue
    named.push({ name: owner.publicAlias, standing: content ? standingOf(content, other, waterId) : null, profile: pagePublic(other) })
  }
  return { others: othersAt(row, angler._id), named }
}

/** An angler's standing at a water as the screen's header shows it: the rank there under v6, the title before. */
type Standing = { readonly kind: 'rank' | 'title'; readonly id: string }
const standingOf = (content: IdleAnglerCatalog, angler: Doc<'anglers'>, waterId: string): Standing =>
  content.waterRanks ? { kind: 'rank', id: waterRankFor(content, angler.logbook, waterId as never).rank.id } : { kind: 'title', id: titleFor(Object.keys(angler.logbook).length).id }

const named = v.object({ name: v.string(), standing: v.union(v.null(), v.object({ kind: v.union(v.literal('rank'), v.literal('title')), id: v.string() })), profile: v.boolean() })

/**
 * D220: everyone else at the signed-in angler's water, by species logged there, for the companion's full list. Null
 * without an active angler, and while the angler is heading somewhere or paused.
 */
export const here = query({
  args: {},
  returns: v.union(v.null(), v.object({ waterId: v.string(), others: v.number(), named: v.array(named) })),
  handler: async (ctx) => {
    const angler = await currentAngler(ctx, await currentUser(ctx))
    if (angler === null || angler.activationState !== 'active' || angler.status !== 'fishing' || angler.travelTo !== undefined) return null
    const { content } = await worldContentOf(ctx)
    const company = await waterCompany(ctx, angler, angler.waterId, PRESENCE_MEMBERS_MAX, content)
    return { waterId: angler.waterId, others: company.others, named: [...company.named] }
  },
})
