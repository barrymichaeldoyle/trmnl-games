import { levelGroup } from '@trmnl-games/engine/levels'
import { createRng, pickOne } from '@trmnl-games/engine/rng'
import { kindOf, receiveSeed, removeSeed, spareSeeds, trapPercent, type LittlePlotCatalog, type PlotState, type VisitPlan } from '@trmnl-games/little-plot/sim'
import type { Doc, Id } from '../_generated/dataModel'
import type { MutationCtx } from '../_generated/server'
import { pagePublic } from '../lib/publicPage'

/**
 * Gnomes from other gardens (little-plot.md "Gnomes from other gardens"). The pure core rolls the night draw and the
 * defences; this adapter picks the garden from the pool and moves the seed through a ledger, so each plot only ever
 * writes its own document: the visitor's tick changes the visited plot at once and writes a `lpVisits` row for the
 * other garden, which applies it at its next evaluation. No seed is ever destroyed, only moved.
 */

export const VISIT_HISTORY = 30
/** A garden is called on at most once a day by anyone, so nobody is everyone's target. */
const VISIT_COOLDOWN_TICKS = 96
/** Plots quiet for a week leave the pool's draw. */
const ACTIVE_WITHIN_TICKS = 7 * 96

/** Keep the plot's pool row current: its level group, whether it may be drawn, and a shard once. */
export async function syncPoolRow(ctx: MutationCtx, plot: Doc<'plots'>, state: PlotState, tick: number): Promise<void> {
  const eligible = plot.activationState === 'active' && pagePublic(plot) && state.status === 'growing'
  const cohortKey = levelGroup(state.level).key
  const row = await ctx.db.query('lpGnomePool').withIndex('by_plotId', (q) => q.eq('plotId', plot._id)).unique()
  if (row === null) {
    await ctx.db.insert('lpGnomePool', { plotId: plot._id, userId: plot.userId, cohortKey, eligible, shard: Math.floor(Math.random() * 2 ** 32), lastActiveTick: tick })
    return
  }
  if (row.cohortKey !== cohortKey || row.eligible !== eligible || row.lastActiveTick !== tick) await ctx.db.patch(row._id, { cohortKey, eligible, lastActiveTick: tick })
}

export interface VisitOutcome {
  readonly state: PlotState
  readonly lines: string[]
  readonly otherUserId: Id<'users'>
  readonly otherName: string
  readonly otherNameVersion: number
}

/**
 * Another garden's gnome calls tonight: pick the garden from the plot's level group, then either the trap catches it
 * (the other garden loses a spare common at its next tick and this plot gains it then) or it leaves with one of this
 * plot's spare seeds (moved to the other garden at its next tick). Returns the new state and the lines for this plot.
 */
export async function hostVisit(ctx: MutationCtx, plot: Doc<'plots'>, owner: Doc<'users'>, state: PlotState, content: LittlePlotCatalog, plan: VisitPlan, tick: number, now: number): Promise<VisitOutcome | null> {
  const cohortKey = levelGroup(state.level).key
  const shard = plan.pick % 2 ** 31
  const candidates = [
    ...(await ctx.db.query('lpGnomePool').withIndex('by_cohortKey_and_eligible_and_shard', (q) => q.eq('cohortKey', cohortKey).eq('eligible', true).gte('shard', shard)).take(3)),
    ...(await ctx.db.query('lpGnomePool').withIndex('by_cohortKey_and_eligible_and_shard', (q) => q.eq('cohortKey', cohortKey).eq('eligible', true)).take(3)),
  ]
  const row = candidates.find((r) => r.plotId !== plot._id && (r.visitedAtTick === undefined || tick - r.visitedAtTick >= VISIT_COOLDOWN_TICKS) && tick - r.lastActiveTick <= ACTIVE_WITHIN_TICKS)
  if (row === undefined) return null
  const other = await ctx.db.get(row.plotId)
  const otherOwner = other ? await ctx.db.get(other.userId) : null
  if (other === null || otherOwner === null || otherOwner.state !== 'active' || otherOwner.nameRepairRequired || !other.isActive || !pagePublic(other)) return null
  await ctx.db.patch(row._id, { visitedAtTick: tick, shard: Math.floor(Math.random() * 2 ** 32) })

  const rng = createRng(plan.pick)
  const trap = trapPercent(content, state)
  const lines: string[] = []
  let next = state
  const otherName = otherOwner.publicAlias
  const base = { fromPlotId: plot._id, fromUserId: owner._id, fromName: owner.publicAlias, fromNameVersion: owner.publicNameVersion, tick, state: 'pending' as const, createdAt: now }
  if (trap > 0 && plan.trapRoll < trap) {
    // Caught: nothing leaves this tin. The other garden gives up a spare common at its next tick, and this plot gains it then.
    const theirs = spareSeeds(other.plot as PlotState, content).filter((id) => kindOf(content, id).rarity === 'common')
    const kindId = theirs.length > 0 ? pickOne(rng, theirs) : undefined
    next = { ...next, counters: { ...next.counters, gnomesCaught: next.counters.gnomesCaught + 1, gnomesHosted: next.counters.gnomesHosted + 1 } }
    lines.push(`A gnome from [[${otherName}]]'s garden was caught in the trap this morning, furious, and let go at the gate.${kindId ? ` It dropped a ${kindOf(content, kindId).name} seed on its way out.` : ''}`)
    if (kindId) {
      await ctx.db.insert('lpVisits', { ...base, plotId: other._id, kindId, effect: 'lose', caught: true })
      await ctx.db.insert('lpVisits', { ...base, plotId: plot._id, fromPlotId: other._id, fromUserId: otherOwner._id, fromName: otherName, fromNameVersion: otherOwner.publicNameVersion, kindId, effect: 'gain', caught: true })
    } else {
      await ctx.db.insert('lpVisits', { ...base, plotId: other._id, effect: 'none', caught: true })
    }
  } else {
    const spare = spareSeeds(next, content)
    if (spare.length === 0) {
      lines.push(`A gnome from [[${otherName}]]'s garden wandered round the beds in the night and left with nothing.`)
      next = { ...next, counters: { ...next.counters, gnomesHosted: next.counters.gnomesHosted + 1 } }
      await ctx.db.insert('lpVisits', { ...base, plotId: other._id, effect: 'none' })
    } else {
      const kindId = pickOne(rng, spare)
      next = { ...removeSeed(next, kindId), counters: { ...next.counters, seedsLost: next.counters.seedsLost + 1, gnomesHosted: next.counters.gnomesHosted + 1 } }
      lines.push(`A gnome in a red hat left with a ${kindOf(content, kindId).name} seed. [[${otherName}]]'s garden, by the look of it.`)
      await ctx.db.insert('lpVisits', { ...base, plotId: other._id, kindId, effect: 'gain' })
    }
  }
  return { state: next, lines, otherUserId: otherOwner._id, otherName, otherNameVersion: otherOwner.publicNameVersion }
}

export interface AppliedVisit {
  readonly state: PlotState
  readonly lines: Array<{ summary: string; otherUserId: Id<'users'>; otherName: string; otherNameVersion: number; kindId?: string }>
}

/** Apply the ledger rows waiting for this plot, oldest first, and trim the history past `VISIT_HISTORY`. */
export async function applyVisits(ctx: MutationCtx, plot: Doc<'plots'>, state: PlotState, content: LittlePlotCatalog, tick: number): Promise<AppliedVisit> {
  const pending = await ctx.db.query('lpVisits').withIndex('by_plotId_and_state_and_tick', (q) => q.eq('plotId', plot._id).eq('state', 'pending')).take(10)
  let next = state
  const lines: AppliedVisit['lines'] = []
  for (const row of pending) {
    const from = { otherUserId: row.fromUserId, otherName: row.fromName, otherNameVersion: row.fromNameVersion }
    if (row.effect === 'gain' && row.kindId !== undefined) {
      next = receiveSeed(next, content, row.kindId, row.fromName, row.cutting === true)
      const name = kindOf(content, row.kindId).name
      lines.push({
        summary: row.cutting ? `A ${name} seed came as a cutting from [[${row.fromName}]].` : row.caught ? `Your gnome was caught in [[${row.fromName}]]'s trap and came back with a ${name} seed from their tin.` : `Your gnome came home with a ${name} seed from [[${row.fromName}]]'s plot.`,
        ...from,
        kindId: row.kindId,
      })
      await ctx.db.patch(row._id, { state: 'applied', appliedTick: tick })
    } else if (row.effect === 'lose' && row.kindId !== undefined) {
      if ((next.tin[row.kindId] ?? 0) >= 1) {
        next = { ...removeSeed(next, row.kindId), counters: { ...next.counters, seedsLost: next.counters.seedsLost + 1 } }
        lines.push({ summary: `Your gnome was caught in [[${row.fromName}]]'s trap and came back without its ${kindOf(content, row.kindId).name} seed.`, ...from, kindId: row.kindId })
        await ctx.db.patch(row._id, { state: 'applied', appliedTick: tick })
      } else {
        lines.push({ summary: `Your gnome was caught in [[${row.fromName}]]'s trap and came home empty-handed.`, ...from })
        await ctx.db.patch(row._id, { state: 'void', appliedTick: tick })
      }
    } else {
      lines.push({ summary: row.caught ? `Your gnome was caught in [[${row.fromName}]]'s trap and let go.` : `Your gnome went round [[${row.fromName}]]'s plot and came back with nothing.`, ...from })
      await ctx.db.patch(row._id, { state: 'applied', appliedTick: tick })
    }
  }
  if (pending.length > 0) {
    const history = await ctx.db.query('lpVisits').withIndex('by_plotId_and_tick', (q) => q.eq('plotId', plot._id)).order('desc').take(VISIT_HISTORY + 10)
    for (const old of history.slice(VISIT_HISTORY)) if (old.state !== 'pending') await ctx.db.delete(old._id)
  }
  return { state: next, lines }
}

/** A friend's cutting: the sender's tin is already lighter; the recipient's plot gains it at its next tick. */
export async function sendCutting(ctx: MutationCtx, from: { plot: Doc<'plots'>; owner: Doc<'users'> }, to: Doc<'plots'>, kindId: string, tick: number, now: number): Promise<void> {
  await ctx.db.insert('lpVisits', { plotId: to._id, fromPlotId: from.plot._id, fromUserId: from.owner._id, fromName: from.owner.publicAlias, fromNameVersion: from.owner.publicNameVersion, kindId, effect: 'gain', cutting: true, tick, state: 'pending', createdAt: now })
}
