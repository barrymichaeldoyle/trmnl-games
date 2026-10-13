import type { Doc, Id } from '../_generated/dataModel'
import type { MutationCtx, QueryCtx } from '../_generated/server'
import { currentHero } from './gameProfile'
import { pagePublic } from './publicPage'
import { HIDDEN_RIVAL } from './raids'
import type { FindPlan } from '@trmnl-games/desk-crawler/sim/core/lostProperty'
import type { IncomingFound, LostSpare, SimulationResult } from '@trmnl-games/desk-crawler/sim/core/types'

/**
 * Lost-property adapter (D145). Every read is bounded: every hero under a catalog with lost property reads its own
 * row (one indexed get); a hero whose look hit takes at most two lying rows on its floor, then the owner's user doc.
 * The table holds at most one row per hero, so it never grows past the hero count.
 */

const shownName = (user: Doc<'users'> | null): boolean => user !== null && user.state === 'active' && !user.nameRepairRequired

export interface SparePick {
  readonly spare: LostSpare
  readonly row: Doc<'lostProperty'>
  readonly ownerUser: Doc<'users'>
}

/** The hero's own lost-property row, if any. */
export async function ownSpare(ctx: QueryCtx, heroId: Id<'heroes'>): Promise<Doc<'lostProperty'> | null> {
  return await ctx.db.query('lostProperty').withIndex('by_ownerHeroId', (q) => q.eq('ownerHeroId', heroId)).first()
}

/** The owner side: its found spare as the core takes it, with the finder's name as it can be shown now. */
export async function incomingFound(ctx: MutationCtx, row: Doc<'lostProperty'> | null): Promise<IncomingFound | undefined> {
  if (row === null || row.state !== 'found' || row.finderHeroId === undefined || row.finderUserId === undefined) return undefined
  const finder = await ctx.db.get(row.finderUserId)
  const name = shownName(finder) && finder!.publicNameVersion === row.finderNameVersion ? row.finderName! : HIDDEN_RIVAL
  return { finderHeroId: row.finderHeroId, finderName: name, finderClass: row.finderClass ?? 'warrior', templateId: row.templateId, name: row.name, biomeId: row.biomeId, foundTick: row.foundTick ?? row.droppedTick }
}

/**
 * The spare at `plan.shard` on the hero's floor: the first lying row there at or after it, wrapping once, that
 * another account dropped. Only that row is tried; an owner that is deleting, suspended or under name repair spends
 * the draw and the tick plays its ordinary find.
 */
export async function pickSpare(ctx: MutationCtx, finder: Doc<'heroes'>, finderUserId: Id<'users'>, plan: FindPlan): Promise<SparePick | undefined> {
  const floor = finder.biomeId
  const after = await ctx.db.query('lostProperty').withIndex('by_biomeId_and_state_and_shard', (q) => q.eq('biomeId', floor).eq('state', 'lying').gte('shard', plan.shard)).take(2)
  const wrapped = after.length === 2 ? [] : await ctx.db.query('lostProperty').withIndex('by_biomeId_and_state_and_shard', (q) => q.eq('biomeId', floor).eq('state', 'lying')).take(2)
  const row = [...after, ...wrapped].find((candidate) => candidate.ownerUserId !== finderUserId)
  if (row === undefined) return undefined
  const ownerUser = await ctx.db.get(row.ownerUserId)
  if (ownerUser === null || !shownName(ownerUser)) return undefined
  const spare: LostSpare = { ownerHeroId: row.ownerHeroId, ownerName: ownerUser.publicAlias, templateId: row.templateId, kind: row.kind, rarity: row.rarity, ...(row.affixId === undefined ? {} : { affixId: row.affixId }) }
  return { spare, row, ownerUser }
}

/** The label a found spare's item row carries. */
export function spareLabel(pick: SparePick): Pick<Doc<'items'>, 'relicUserId' | 'relicName' | 'relicNameVersion'> {
  return { relicUserId: pick.ownerUser._id, relicName: pick.ownerUser.publicAlias, relicNameVersion: pick.ownerUser.publicNameVersion }
}

/**
 * Commit this evaluation's lost-property effects once: a found spare is marked with its finder (re-read, so two
 * finders in one batch cannot both take it), a told owner's row is deleted, and a knockout writes or replaces the
 * hero's own row. A retried evaluation finds the row in the state it left it.
 */
export async function settleLostProperty(
  ctx: MutationCtx,
  args: { hero: Doc<'heroes'>; owner: Doc<'users'>; result: SimulationResult; pick: SparePick | undefined; own: Doc<'lostProperty'> | null; contentVersion: string; tick: number },
): Promise<void> {
  const { hero, owner, result, pick, own, contentVersion, tick } = args
  if (result.spareFound !== undefined && pick !== undefined) {
    const row = await ctx.db.get(pick.row._id)
    if (row !== null && row.state === 'lying') {
      await ctx.db.patch(row._id, { state: 'found', finderHeroId: hero._id, finderUserId: owner._id, finderName: owner.publicAlias, finderNameVersion: owner.publicNameVersion, finderClass: hero.class, foundTick: tick })
    }
  }
  if (result.foundApplied && own !== null && own.state === 'found') await ctx.db.delete(own._id)
  const drop = result.spareDropped
  if (drop !== undefined && (own === null || own.state === 'lying')) {
    const fields = {
      biomeId: drop.biomeId,
      shard: drop.shard,
      templateId: drop.templateId,
      kind: drop.kind,
      rarity: drop.rarity,
      ...(drop.affixId === undefined ? {} : { affixId: drop.affixId }),
      name: drop.name,
      contentVersion,
      droppedTick: drop.tick,
      state: 'lying' as const,
    }
    if (own === null) await ctx.db.insert('lostProperty', { ownerHeroId: hero._id, ownerUserId: owner._id, ...fields })
    else await ctx.db.replace(own._id, { ownerHeroId: hero._id, ownerUserId: owner._id, ...fields })
  }
}

/** The other hero behind this evaluation's lost-property log, for the stored detail's masking annotation. */
export function spareRival(result: SimulationResult, pick: SparePick | undefined, own: Doc<'lostProperty'> | null): { userId: Id<'users'>; nameVersion: number } | undefined {
  if (result.spareFound !== undefined && pick !== undefined) return { userId: pick.ownerUser._id, nameVersion: pick.ownerUser.publicNameVersion }
  if (result.foundApplied && own?.finderUserId !== undefined && own.finderNameVersion !== undefined) return { userId: own.finderUserId, nameVersion: own.finderNameVersion }
  return undefined
}

/**
 * Deletion: the hero's own row and any row it found but whose owner has not been told yet (that owner simply never
 * hears), a batch at a time.
 */
export async function purgeLostPropertyRows(ctx: MutationCtx, heroId: Id<'heroes'>, batch: number): Promise<number> {
  const owned = await ctx.db.query('lostProperty').withIndex('by_ownerHeroId', (q) => q.eq('ownerHeroId', heroId)).take(batch)
  const found = await ctx.db.query('lostProperty').withIndex('by_finderHeroId', (q) => q.eq('finderHeroId', heroId)).take(batch)
  const seen = new Set<string>()
  for (const row of [...owned, ...found]) {
    if (seen.has(row._id)) continue
    seen.add(row._id)
    await ctx.db.delete(row._id)
  }
  return seen.size
}

/** Deletion: take this account's name off other players' spares, a batch at a time; the items stay as plain gear. */
export async function scrubSpareLabels(ctx: MutationCtx, userId: Id<'users'>, batch: number): Promise<number> {
  const labelled = await ctx.db.query('items').withIndex('by_relicUserId', (q) => q.eq('relicUserId', userId)).take(batch)
  for (const item of labelled) await ctx.db.patch(item._id, { relicUserId: undefined, relicName: undefined, relicNameVersion: undefined })
  return labelled.length
}

export interface SpareView {
  readonly name: string
  readonly rarity: Doc<'items'>['rarity']
  readonly kind: 'weapon' | 'armor'
  /** The first owner's public name, or "Hidden player" once renamed, repaired, suspended or gone. */
  readonly ownerName: string
  /** Whether the name links to the owner's public page. */
  readonly profile: boolean
}

/**
 * The first owner of each found spare among a hero's bounded item rows, keyed by item id, names masked as rank rows
 * are. One owner read per distinct owner.
 */
export async function spareOwners(ctx: QueryCtx, items: readonly Doc<'items'>[]): Promise<Map<string, { ownerName: string; profile: boolean }>> {
  const owners = new Map<string, Doc<'users'> | null>()
  const out = new Map<string, { ownerName: string; profile: boolean }>()
  for (const item of items) {
    if (item.relicUserId === undefined || item.relicName === undefined) continue
    if (!owners.has(item.relicUserId)) owners.set(item.relicUserId, await ctx.db.get(item.relicUserId))
    const owner = owners.get(item.relicUserId) ?? null
    const visible = shownName(owner) && owner!.publicNameVersion === item.relicNameVersion
    out.set(item._id, { ownerName: visible ? item.relicName : HIDDEN_RIVAL, profile: visible && pagePublic(await currentHero(ctx, owner)) })
  }
  return out
}

/** The spares a hero holds, for its public page and the companion card. */
export async function heldSpares(ctx: QueryCtx, items: readonly Doc<'items'>[]): Promise<SpareView[]> {
  const owners = await spareOwners(ctx, items)
  return items.flatMap((item) => {
    const owner = owners.get(item._id)
    return owner === undefined || (item.kind !== 'weapon' && item.kind !== 'armor') ? [] : [{ name: item.name, rarity: item.rarity, kind: item.kind, ...owner }]
  })
}
