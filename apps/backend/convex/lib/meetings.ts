import type { Doc, Id } from '../_generated/dataModel'
import type { MutationCtx, QueryCtx } from '../_generated/server'
import { currentHero } from './gameProfile'
import { HIDDEN_RIVAL } from './raids'
import { canMeet } from '@trmnl-games/desk-crawler/sim/core/career'
import type { MeetingPlan } from '@trmnl-games/desk-crawler/sim/core/meeting'
import type { ContentCatalog, IncomingMeeting, MeetingPartner, SimulationResult } from '@trmnl-games/desk-crawler/sim/core/types'

/**
 * Meetings adapter (D141). Every read is bounded: a starter whose launch draw hit takes at most two pool rows on its
 * floor, then the partner hero and its owner; every hero under a catalog with meetings takes its oldest pending
 * ledger row. The pool is the raid pool, which now carries each hero's floor.
 */

const visibleName = (owner: Doc<'users'> | null): string => (owner !== null && owner.state === 'active' && !owner.nameRepairRequired ? owner.publicAlias : HIDDEN_RIVAL)

export interface MeetingPick {
  readonly partner: MeetingPartner
  readonly poolRowId: Id<'raidPool'>
  readonly partnerHeroId: Id<'heroes'>
  readonly partnerUser: Doc<'users'>
}

export interface PendingMeeting {
  readonly row: Doc<'meetings'>
  readonly incoming: IncomingMeeting
}

/**
 * The meeting partner at `plan.shard` on the hero's floor: the first pool row there at or after it, wrapping once,
 * skipping the hero's own row. Only that one row is tried; when its hero is not available the draw is spent and the
 * tick plays its ordinary encounter. The starter's own cooldown is read from its own row.
 */
export async function pickMeetingPartner(ctx: MutationCtx, starter: Doc<'heroes'>, plan: MeetingPlan, tick: number, content: ContentCatalog): Promise<MeetingPick | undefined> {
  const cooldown = content.meetings!.cooldownTicks
  const own = starter.raidPoolId === undefined ? null : await ctx.db.get(starter.raidPoolId)
  if (own?.metAtTick !== undefined && tick - own.metAtTick < cooldown) return undefined
  const floor = starter.biomeId
  const after = await ctx.db.query('raidPool').withIndex('by_biomeId_and_shard', (q) => q.eq('biomeId', floor).gte('shard', plan.shard)).take(2)
  const wrapped = after.length === 2 ? [] : await ctx.db.query('raidPool').withIndex('by_biomeId_and_shard', (q) => q.eq('biomeId', floor)).take(2)
  const row = [...after, ...wrapped].find((candidate) => candidate.heroId !== starter._id)
  if (row === undefined) return undefined
  if (row.metAtTick !== undefined && tick - row.metAtTick < cooldown) return undefined
  const hero = await ctx.db.get(row.heroId)
  if (hero === null || !hero.isActive) return undefined
  if (hero.activationState !== 'active' || hero.simulationState !== 'healthy' || hero.eligibleFromTick > tick) return undefined
  if (hero.status !== 'exploring' && hero.status !== 'resting') return undefined
  // The row's floor can lag its hero by a tick; the live floor decides.
  if (hero.biomeId !== floor || !canMeet(content, hero.level)) return undefined
  const owner = await ctx.db.get(hero.userId)
  if (owner === null || (await currentHero(ctx, owner))?._id !== hero._id) return undefined
  return { partner: { heroId: hero._id, name: visibleName(owner), class: hero.class }, poolRowId: row._id, partnerHeroId: hero._id, partnerUser: owner }
}

/** The oldest meeting still waiting to land on this hero, with the starter's name as it can be shown now. */
export async function nextIncomingMeeting(ctx: MutationCtx, heroId: Id<'heroes'>): Promise<PendingMeeting | undefined> {
  const row = await ctx.db
    .query('meetings')
    .withIndex('by_partnerHeroId_and_state_and_tick', (q) => q.eq('partnerHeroId', heroId).eq('state', 'pending'))
    .first()
  if (row === null) return undefined
  const starterOwner = await ctx.db.get(row.starterUserId)
  const name = starterOwner !== null && starterOwner.publicNameVersion === row.starterNameVersion ? row.starterName : visibleName(starterOwner)
  return { row, incoming: { starterHeroId: row.starterHeroId, starterName: name, starterClass: row.starterClass, tick: row.tick, kindId: row.kindId } }
}

/**
 * Commit both sides' ledger effects for one evaluation, once: a started meeting inserts its row (keyed by starter and
 * tick, so a replayed evaluation finds it), stamps the partner's pool row and moves it; an applied one is marked.
 */
export async function settleMeetings(
  ctx: MutationCtx,
  args: { hero: Doc<'heroes'>; owner: Doc<'users'>; result: SimulationResult; plan: MeetingPlan | undefined; pick: MeetingPick | undefined; pending: PendingMeeting | undefined; tick: number },
): Promise<void> {
  const { hero, owner, result, plan, pick, pending, tick } = args
  const launch = result.meetingLaunch
  if (launch !== undefined && pick !== undefined && plan !== undefined) {
    const duplicate = await ctx.db.query('meetings').withIndex('by_starterHeroId_and_tick', (q) => q.eq('starterHeroId', hero._id).eq('tick', tick)).first()
    if (duplicate === null) {
      await ctx.db.insert('meetings', {
        starterHeroId: hero._id,
        starterUserId: owner._id,
        starterName: visibleName(owner),
        starterNameVersion: owner.publicNameVersion,
        starterClass: hero.class,
        partnerHeroId: pick.partnerHeroId,
        partnerUserId: pick.partnerUser._id,
        partnerName: pick.partner.name,
        partnerNameVersion: pick.partnerUser.publicNameVersion,
        partnerClass: pick.partner.class,
        tick,
        kindId: launch.kindId,
        biomeId: hero.biomeId,
        state: 'pending',
      })
      // The starter's own row is stamped by `syncPoolRow`, after a first evaluation has joined it to the pool.
      await ctx.db.patch(pick.poolRowId, { metAtTick: tick, shard: plan.reshard })
    }
  }
  if (result.meetingApplied && pending !== undefined && pending.row.state === 'pending') {
    await ctx.db.patch(pending.row._id, { state: 'applied', appliedTick: tick })
  }
}

/** The other hero behind this evaluation's meeting log, for the stored detail's masking annotation. */
export function meetingRival(result: SimulationResult, pick: MeetingPick | undefined, pending: PendingMeeting | undefined): { userId: Id<'users'>; nameVersion: number } | undefined {
  if (result.meetingLaunch !== undefined && pick !== undefined) return { userId: pick.partnerUser._id, nameVersion: pick.partnerUser.publicNameVersion }
  if (result.meetingApplied && pending !== undefined) return { userId: pending.row.starterUserId, nameVersion: pending.row.starterNameVersion }
  return undefined
}

/**
 * D141: keep the hero's own pool row on its floor and stamp it when the hero started a meeting this tick; one read of
 * its own row, a write only when something changed.
 */
export async function syncPoolRow(ctx: MutationCtx, poolRowId: Id<'raidPool'> | undefined, biomeId: string, result: SimulationResult, tick: number): Promise<void> {
  if (poolRowId === undefined) return
  const row = await ctx.db.get(poolRowId)
  if (row === null) return
  const met = result.meetingLaunch !== undefined && row.metAtTick !== tick
  if (row.biomeId !== biomeId || met) await ctx.db.patch(poolRowId, { biomeId, ...(met ? { metAtTick: tick } : {}) })
}

/** Deletion: every meeting row the hero is party to, a batch at a time. */
export async function purgeMeetingRows(ctx: MutationCtx, heroId: Id<'heroes'>, batch: number): Promise<number> {
  const started = await ctx.db.query('meetings').withIndex('by_starterHeroId_and_tick', (q) => q.eq('starterHeroId', heroId)).take(batch)
  const received = await ctx.db.query('meetings').withIndex('by_partnerHeroId_and_tick', (q) => q.eq('partnerHeroId', heroId)).take(batch)
  const seen = new Set<string>()
  for (const row of [...started, ...received]) {
    if (seen.has(row._id)) continue
    seen.add(row._id)
    await ctx.db.delete(row._id)
  }
  return seen.size
}

/** The last meetings a hero was party to, newest first, both directions merged, names masked as rank rows are. */
export async function recentMeetings(ctx: QueryCtx, heroId: Id<'heroes'>, limit: number) {
  const started = await ctx.db.query('meetings').withIndex('by_starterHeroId_and_tick', (q) => q.eq('starterHeroId', heroId)).order('desc').take(limit)
  const received = await ctx.db.query('meetings').withIndex('by_partnerHeroId_and_tick', (q) => q.eq('partnerHeroId', heroId)).order('desc').take(limit)
  const rows = [...started.map((row) => ({ row, role: 'starter' as const })), ...received.map((row) => ({ row, role: 'partner' as const }))]
    .sort((a, b) => b.row.tick - a.row.tick)
    .slice(0, limit)
  return await Promise.all(
    rows.map(async ({ row, role }) => {
      const otherUserId = role === 'starter' ? row.partnerUserId : row.starterUserId
      const storedName = role === 'starter' ? row.partnerName : row.starterName
      const storedVersion = role === 'starter' ? row.partnerNameVersion : row.starterNameVersion
      const other = await ctx.db.get(otherUserId)
      const visible = other !== null && other.state === 'active' && !other.nameRepairRequired && other.publicNameVersion === storedVersion
      return {
        tick: row.tick,
        at: row._creationTime,
        role,
        rivalName: visible ? storedName : HIDDEN_RIVAL,
        // D109/D141: the name links to the other player's page while it's public.
        profile: visible && (await currentHero(ctx, other))?.publicProfile === true,
        rivalClass: role === 'starter' ? row.partnerClass : row.starterClass,
        kindId: row.kindId,
        biomeId: row.biomeId,
        pending: row.state === 'pending',
      }
    }),
  )
}
