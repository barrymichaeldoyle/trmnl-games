import type { Doc, Id } from '../_generated/dataModel'
import type { MutationCtx, QueryCtx } from '../_generated/server'
import { pagePublic } from './publicPage'

/**
 * Who else is on a hero's floor (D216). The tick counts heroes by floor as it walks them and publishes one row per
 * floor; screens read that row and the owners of the few members they name, so every read is fixed and indexed.
 */

/** Floors that can hold a row; well above the catalog's. */
const FLOORS_READ = 32

/** Replace the published floors with this walk's: floors nobody stood on lose their row. */
export async function publishFloorPresence(ctx: MutationCtx, run: Doc<'simulationRuns'>): Promise<void> {
  const walked = run.censusPresence ?? {}
  const rows = await ctx.db.query('floorPresence').take(FLOORS_READ)
  for (const row of rows) if (walked[row.biomeId] === undefined) await ctx.db.delete(row._id)
  for (const [biomeId, floor] of Object.entries(walked)) {
    const next = { biomeId, count: floor.count, members: floor.members, asOfTick: run.tick }
    const existing = rows.find((row) => row.biomeId === biomeId)
    if (existing) await ctx.db.patch(existing._id, next)
    else await ctx.db.insert('floorPresence', next)
  }
}

/** Every floor's head count, the hero's own floor without the hero. */
export async function floorCounts(ctx: QueryCtx, hero: Doc<'heroes'>): Promise<Record<string, number>> {
  const rows = await ctx.db.query('floorPresence').take(FLOORS_READ)
  return Object.fromEntries(rows.map((row) => [row.biomeId, othersOn(row, hero._id)]))
}

const othersOn = (row: Doc<'floorPresence'>, heroId: Id<'heroes'>) => Math.max(0, row.count - (row.members.some((member) => member.heroId === heroId) ? 1 : 0))

export interface Company {
  /** Everyone else on the floor, named or not. */
  readonly others: number
  /** Up to `names` of them by level, under their current public names; a hidden owner is only counted. */
  readonly named: ReadonlyArray<{ readonly name: string; readonly heroName: string; readonly level: number; readonly profile: boolean }>
}

/**
 * The others on `biomeId` for `hero`, naming up to `names` of them. A name shows under the boards' rule (D110): the
 * owner is active and not under name repair, and the hero is still theirs. `profile` says the public page is open.
 */
export async function floorCompany(ctx: QueryCtx, hero: Doc<'heroes'>, biomeId: string, names: number): Promise<Company> {
  const row = await ctx.db.query('floorPresence').withIndex('by_biomeId', (q) => q.eq('biomeId', biomeId)).unique()
  if (row === null) return { others: 0, named: [] }
  const named: Array<Company['named'][number]> = []
  // A few spare members cover the hero itself and a hidden owner or two without reading the whole floor.
  for (const member of row.members.slice(0, names + 3)) {
    if (named.length >= names) break
    if (member.heroId === hero._id || member.userId === hero.userId) continue
    const [owner, other] = await Promise.all([ctx.db.get(member.userId), ctx.db.get(member.heroId)])
    if (owner === null || other === null || owner.state !== 'active' || owner.nameRepairRequired || other.userId !== owner._id || !other.isActive) continue
    named.push({ name: owner.publicAlias, heroName: other.name, level: other.level, profile: pagePublic(other) })
  }
  return { others: othersOn(row, hero._id), named }
}
