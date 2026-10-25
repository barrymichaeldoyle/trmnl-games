import { v } from 'convex/values'
import { xpToLeave } from '@trmnl-games/engine/levels'
import { emptySeatEvents, evaluateGoals, heldBy, cellAt, wellAt, xpFor, type DeskCounters, type FactionId, type PixelWarsCatalog, type SeatEvents } from '@trmnl-games/pixel-wars/sim'
import { needsFullPass } from '@trmnl-games/pixel-wars/content/achievements'
import type { Doc, Id } from '../_generated/dataModel'
import { internalMutation, type MutationCtx } from '../_generated/server'
import { runBatch, startRun, watchdogStep, type SubjectStep } from '../lib/engine/runner'
import { accumulatorOf, addBucket, creditTick, foldScore } from '../lib/engine/scores'
import { queuePixelWarsAlerts } from '../lib/alerts'
import { awardDesk, stateOf, tallyDeskUnlocks } from './achievements'
import { writeRankInput } from './leaderboard'
import { ensureMapTick, setSeatFaction, syncSeatOffset, toMapState } from './maps'
import { currentDesk } from './profile'
import { PIXEL_WARS_RUNTIME } from './runtime'

/**
 * Pixel Wars' tick (pixel-wars.md "Architecture"), on the shared engine run frame: cron at minutes 3, 18, 33 and 48
 * (crons.ts), the same guards, pages, publication and watchdog as the other games. The map is resolved once per run
 * by the first desk of a page to reach it (`ensureMapTick`); each desk's step then reads its own events off the
 * snapshot, credits XP, walks its goals, refunds refused drops and writes its stories.
 */

export const startTick = internalMutation({
  args: {},
  returns: v.union(v.null(), v.id('pwSimulationRuns')),
  handler: async (ctx) => (await startRun(ctx, PIXEL_WARS_RUNTIME)) as unknown as Id<'pwSimulationRuns'> | null,
})

export const simulateBatch = internalMutation({
  args: { runId: v.id('pwSimulationRuns'), expectedSequence: v.number() },
  returns: v.null(),
  handler: async (ctx, { runId, expectedSequence }) => await runBatch(ctx, PIXEL_WARS_RUNTIME, runId as unknown as Id<'simulationRuns'>, expectedSequence, simulateDeskStep),
})

export const watchdog = internalMutation({
  args: {},
  returns: v.null(),
  handler: async (ctx) => await watchdogStep(ctx, PIXEL_WARS_RUNTIME),
})

const DAY_MS = 86_400_000

async function publishInputs(ctx: MutationCtx, desk: Doc<'desks'>, owner: Doc<'users'>, step: SubjectStep<PixelWarsCatalog>, accumulator = accumulatorOf(desk)) {
  const scores = await foldScore(ctx, PIXEL_WARS_RUNTIME, desk._id as unknown as Id<'heroes'>, step.run, accumulator)
  await writeRankInput(ctx, step.run, (await ctx.db.get(desk._id))!, owner, scores)
  await tallyDeskUnlocks(ctx, owner._id, step.tally.unlocks)
  step.tally.population += 1
}

export function levelFor(xp: number, level: number): { level: number; xp: number; ups: number } {
  let l = level
  let x = xp
  let ups = 0
  while (x >= xpToLeave(l)) {
    x -= xpToLeave(l)
    l += 1
    ups += 1
  }
  return { level: l, xp: x, ups }
}

/** The most recent screen any of the owner's Pixel Wars installations served. */
async function lastScreenAt(ctx: MutationCtx, userId: Id<'users'>): Promise<number | null> {
  const instances = await ctx.db.query('trmnlInstances').withIndex('by_userId_and_state', (q) => q.eq('userId', userId).eq('state', 'active')).take(10)
  const times = instances.filter((i) => i.gameSlug === 'pixel-wars').map((i) => i.lastScreenServedAt ?? i.createdAt)
  return times.length === 0 ? null : Math.max(...times)
}

/** One desk's share of a page: eligibility, the map's tick, its events, XP, goals, the bell, the shield offset and its writes. */
async function simulateDeskStep(ctx: MutationCtx, subject: Doc<'heroes'>, step: SubjectStep<PixelWarsCatalog>): Promise<void> {
  const desk = subject as unknown as Doc<'desks'>
  const { run, content, now, tally } = step
  const counts = tally.counts as Record<'eligible' | 'skippedDormant' | 'quarantined' | 'orders' | 'flips' | 'desksTaken', number>
  if (!desk.isActive || desk.activationState !== 'active' || desk.eligibleFromTick > run.tick || desk.lastTick >= run.tick) return
  const owner = await ctx.db.get(desk.userId)
  if (owner === null || (await currentDesk(ctx, owner))?._id !== desk._id) return
  counts.eligible += 1

  // Not on the map yet (no faction chosen): nothing moves until it is, and it leaves the recent boards.
  if (desk.mapId === undefined || desk.seat === undefined) {
    counts.skippedDormant += 1
    await ctx.db.patch(desk._id, { lastTick: run.tick })
    if (run.publishes) await publishInputs(ctx, desk, owner, step)
    return
  }
  if (desk.simulationState === 'quarantined') {
    counts.quarantined += 1
    await ctx.db.patch(desk._id, { lastTick: run.tick })
    if (run.publishes) await publishInputs(ctx, desk, owner, step)
    return
  }

  const snapshot = await ensureMapTick(ctx, desk.mapId, run, content, now)
  let map = (await ctx.db.get(desk.mapId))!
  const seat = desk.seat
  let sequence = desk.logSequence
  const log = async (summary: string, detail: Doc<'pwTickLogs'>['detail'], kind: Doc<'pwTickLogs'>['kind']) => {
    sequence += 1
    await ctx.db.insert('pwTickLogs', { deskId: desk._id, source: 'tick', tick: run.tick, runId: run._id as unknown as Id<'pwSimulationRuns'>, sequence, at: now, kind, summary: summary.slice(0, 160), detail })
  }
  const factionName = (f: FactionId) => content.factions[f - 1]!.name

  let counters: DeskCounters = { ...desk.counters }
  let week = { ...desk.week }
  let faction = desk.faction
  let xpEarned = 0
  const patch: Partial<Doc<'desks'>> = { lastTick: run.tick }

  // The bell: the first tick of a new week for this desk refills the well, tallies the season and resets the week.
  if (desk.seasonWeek < map.seasonWeek) {
    if (desk.seasonWeek > 0) {
      counters = { ...counters, seasonsPlayed: counters.seasonsPlayed + 1 }
      if (map.lastWinner !== undefined && map.lastWinner === desk.faction && week.painted + week.flipped + week.liberated > 0) {
        counters = { ...counters, seasonsWon: counters.seasonsWon + 1 }
        xpEarned += content.xp.seasonWon
        await log(`${factionName(map.lastWinner)} won the week. ${content.xp.seasonWon} XP for everyone who placed an order.`, { v: 1, faction: map.lastWinner, xp: content.xp.seasonWon, week: desk.seasonWeek }, 'bell')
      } else await log(`The bell. ${map.lastWinner === undefined ? 'The week is over' : `${factionName(map.lastWinner)} held the most ground this week`}. The map is clean and your well is full.`, { v: 1, week: desk.seasonWeek, ...(map.lastWinner === undefined ? {} : { faction: map.lastWinner }) }, 'bell')
    }
    week = { painted: 0, flipped: 0, desksTaken: 0, liberated: 0, lost: 0, fell: 0, refunded: 0 }
    patch.seasonWeek = map.seasonWeek
    patch.well = { drops: content.wellCap, tick: run.tick }
  }

  // Events off the snapshot.
  const e: SeatEvents = snapshot.seatEvents[String(seat)] ?? emptySeatEvents()
  const state = toMapState({ ...snapshot, seats: map.seats })
  const seatRow = state.seats[seat - 1]!
  const own = cellAt(state, seatRow.x, seatRow.y)
  const hourly = run.publishes
  const held = hourly ? heldBy(state, seat) : 0
  const deskFull = hourly && own !== null && own.faction === faction && own.ink === content.deskInkCap
  xpEarned += xpFor(content, e, held, deskFull)
  counters = {
    ...counters,
    cellsPainted: counters.cellsPainted + e.painted,
    stamps: counters.stamps + e.stamped,
    cellsFlipped: counters.cellsFlipped + e.flipped,
    underdogFlips: counters.underdogFlips + e.underdogFlips,
    desksTaken: counters.desksTaken + e.desksTaken,
    desksLiberated: counters.desksLiberated + e.liberated + e.liberatedOthers,
    deskFullHours: counters.deskFullHours + (deskFull ? 1 : 0),
    deskFalls: counters.deskFalls + (e.fell !== undefined ? 1 : 0),
  }
  week = { painted: week.painted + e.painted, flipped: week.flipped + e.flipped, desksTaken: week.desksTaken + e.desksTaken, liberated: week.liberated + e.liberated + e.liberatedOthers, lost: week.lost + e.lost, fell: week.fell + (e.fell !== undefined ? 1 : 0), refunded: week.refunded + e.refunded }
  if (e.fell !== undefined) await log(`Your desk fell to ${factionName(e.fell)}. One drop of yours counts three on your own desk.`, { v: 1, faction: e.fell }, 'fell')
  if (e.recovered) await log(e.liberated > 0 ? 'Your desk is yours again.' : 'A faction-mate took your desk back.', { v: 1 }, 'recovered')
  if (e.desksTaken > 0) await log(`You took ${e.desksTaken === 1 ? 'a desk' : `${e.desksTaken} desks`}.`, { v: 1, cells: e.desksTaken }, 'taken')
  if (e.flipped + e.painted > 0) await log(`${e.flipped > 0 ? `Took ${e.flipped} ${e.flipped === 1 ? 'cell' : 'cells'}` : ''}${e.flipped > 0 && e.painted > 0 ? ', ' : ''}${e.painted > 0 ? `painted ${e.painted}` : ''}${e.lost > 0 ? `, lost ${e.lost}` : ''}.`, { v: 1, cells: e.flipped + e.painted }, 'flips')
  if (e.refunded > 0) {
    await log(`${e.refunded} ${e.refunded === 1 ? 'drop' : 'drops'} returned: the target changed before the tick.`, { v: 1, drops: e.refunded }, 'refund')
    const current = patch.well ?? desk.well
    patch.well = { drops: Math.min(content.wellCap + e.refunded, wellAt(content, current.drops, current.tick, run.tick) + e.refunded), tick: run.tick }
  }
  // Resolved orders of this desk are gone from the queue.
  for (const row of await ctx.db.query('pwOrders').withIndex('by_deskId_and_tick', (q) => q.eq('deskId', desk._id).lte('tick', run.tick)).take(64)) await ctx.db.delete(row._id)

  // Goals and levels.
  const goals = evaluateGoals(content, desk.goal, counters)
  counters = goals.counters
  for (const g of goals.reached) await log(`Goal reached: ${g.title}. ${g.xp} XP.`, { v: 1, goalId: g.id, xp: g.xp }, 'goal')
  xpEarned += goals.xp
  patch.goal = goals.state
  const levelled = levelFor(desk.xp + xpEarned, desk.level)
  if (levelled.ups > 0) {
    await log(`Level ${levelled.level}.`, { v: 1, level: levelled.level }, 'level')
    patch.lastLevelUpTick = run.tick
  }
  patch.level = levelled.level
  patch.xp = levelled.xp
  patch.lifetimeXp = desk.lifetimeXp + xpEarned
  patch.counters = counters
  patch.week = week
  if (xpEarned > 0 || e.painted + e.flipped + e.stamped > 0) {
    patch.lastProgressTick = run.tick
    patch.lastAdvancedAt = now
  }

  // Hourly: the shield offset, and the cleared-desk rule (pixel-wars.md "Desks, maps and placement").
  if (hourly) {
    await syncSeatOffset(ctx, map, seat, owner.trmnlUtcOffset)
    const seen = await lastScreenAt(ctx, owner._id)
    const silent = seen !== null && now - seen > content.clearAfterDays * DAY_MS
    if (silent && desk.cleared !== true && faction !== 0) {
      map = (await ctx.db.get(desk.mapId))!
      await setSeatFaction(ctx, map, seat, 0)
      patch.cleared = true
      await log('Your desk stands empty: no screen has shown the map for two weeks. It comes back when one does.', { v: 1 }, 'cleared')
    } else if (!silent && desk.cleared === true && faction !== 0) {
      map = (await ctx.db.get(desk.mapId))!
      await setSeatFaction(ctx, map, seat, faction as FactionId)
      patch.cleared = false
      await log('Your desk is back on the map.', { v: 1 }, 'system')
    }
  }
  void faction

  // Alerts (D214): the desk taken this tick, the side's lead lost this tick, the bell.
  if (owner.alerts !== undefined) {
    const leadLost = snapshot.leaderFrom !== undefined && snapshot.leaderFrom === faction && snapshot.leaderTo !== undefined && snapshot.leaderTo !== faction ? factionName(snapshot.leaderTo) : null
    const bellNow = snapshot.bell === true ? { winner: map.lastWinner === undefined ? null : factionName(map.lastWinner), week: map.seasonWeek } : null
    if (e.fell !== undefined || leadLost !== null || bellNow !== null) await queuePixelWarsAlerts(ctx, { owner, deskId: desk._id, fellTo: e.fell === undefined ? null : factionName(e.fell), leadLostTo: leadLost, bell: bellNow, tick: run.tick, now })
  }

  if (sequence !== desk.logSequence) patch.logSequence = sequence
  const credited = creditTick(accumulatorOf(desk), run.scoreAt, xpEarned)
  if (credited.fold) await addBucket(ctx, PIXEL_WARS_RUNTIME, desk._id as unknown as Id<'heroes'>, credited.fold)
  patch.scoreHourXp = credited.accumulator.scoreHourXp
  patch.scoreHour = credited.accumulator.scoreHour
  await ctx.db.patch(desk._id, patch)

  const updated = (await ctx.db.get(desk._id))!
  if (goals.reached.length > 0 || e.painted + e.flipped + e.desksTaken + e.liberated + e.liberatedOthers > 0 || levelled.ups > 0 || deskFull || needsFullPass(desk.achievementsVersion)) await awardDesk(ctx, updated, stateOf(desk), stateOf(updated), now, run.tick)
  if (run.publishes) await publishInputs(ctx, (await ctx.db.get(desk._id))!, owner, step, credited.accumulator)

  counts.flips += e.flipped
  counts.desksTaken += e.desksTaken
  counts.orders += e.painted + e.stamped + e.flipped
}
