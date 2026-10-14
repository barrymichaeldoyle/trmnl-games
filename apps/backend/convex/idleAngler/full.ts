import { v } from 'convex/values'
import { claimGoalReward, fillOrder, formatWeight, openPeriod, openTarget, orderDay, swapOrder, waterOf, type WaterId } from '@trmnl-games/idle-angler/sim'
import { baitFromCatch, buyCharter, buyPegs, mountFish, pegsOf } from '@trmnl-games/idle-angler/sim/shop'
import { deriveStreamSeed } from '@trmnl-games/engine/seed'
import type { Doc, Id } from '../_generated/dataModel'
import { internalMutation, mutation, query, type MutationCtx } from '../_generated/server'
import { appError } from '../lib/errors'
import { currentUser, runIntent } from '../lib/intent'
import { readEngineWorld } from '../lib/engine/world'
import { fromAnglerState, toAnglerState } from './adapter'
import { awardAfterAnglerIntent } from './achievements'
import { asCatch, speciesName } from './dockFull'
import { REFUSAL, commandLog, intentResult, playableAngler, shopIntent, strip, worldContentOf } from './anglers'
import { currentAngler } from './profile'
import { readBoard } from './records'
import { IDLE_ANGLER_RUNTIME } from './runtime'

/**
 * Idle Angler, the full game (D162, idle-angler-full.md): the companion intents for fishmonger orders, deadbait, the
 * trophy wall and charter tickets, the wall and Opens reads, and the Monday run that awards each weekend's medals. The
 * rules are the pure core's (packages/idle-angler/src/sim); these functions load rows, check ownership and write.
 */

const MOUNTED_MAX = 24
const SHELF_PAGE = 50
const DAY_MS = 86_400_000

async function ownCatch(ctx: MutationCtx, angler: Doc<'anglers'>, id: Id<'catches'>): Promise<Doc<'catches'>> {
  const row = await ctx.db.get(id)
  if (row === null || row.anglerId !== angler._id) throw appError('INVALID_STATE', 'That fish is no longer in your cooler.')
  return row
}

async function mountedFish(ctx: MutationCtx, anglerId: Id<'anglers'>) {
  return await ctx.db.query('iaTrophies').withIndex('by_anglerId_and_kind', (q) => q.eq('anglerId', anglerId).eq('kind', 'fish')).take(MOUNTED_MAX + 1)
}

/** Claim one waiting goal reward (v3): the oldest unless a goal is named. A duplicate receipt finds nothing waiting. */
export const claimGoal = mutation({
  args: { operationId: v.string(), goalId: v.optional(v.string()) },
  returns: intentResult,
  handler: async (ctx, { operationId, goalId }) =>
    strip(
      await runIntent(ctx, operationId, 'idleAngler.claimGoal', { goalId: goalId ?? null }, async (user) => {
        const angler = await playableAngler(ctx, user)
        const { world, content } = await worldContentOf(ctx)
        const claimed = claimGoalReward(content, toAnglerState(angler), goalId)
        if (!claimed.ok) throw appError('INVALID_STATE', 'No goal reward is waiting.')
        const title = content.goals?.find((g) => g.id === claimed.reward.id)?.title ?? claimed.reward.id
        const sequence = await commandLog(ctx, angler, 'idleAngler.claimGoal', `Claimed ${claimed.reward.coins} coins for a goal: ${title}.`, claimed.reward.coins)
        await ctx.db.patch(angler._id, { ...fromAnglerState(claimed.angler), logSequence: sequence })
        await awardAfterAnglerIntent(ctx, angler, content, world?.currentTick ?? 0)
        return { changed: true, gold: claimed.angler.gold }
      }),
    ),
})

/** Hand chosen fish to the fishmonger for an order: exactly its count, each matching, for its reward. */
export const handOverOrder = mutation({
  args: { operationId: v.string(), orderId: v.string(), catchIds: v.array(v.id('catches')) },
  returns: intentResult,
  handler: async (ctx, { operationId, orderId, catchIds }) => {
    if (catchIds.length === 0 || catchIds.length > 3 || new Set(catchIds).size !== catchIds.length) throw appError('INVALID_INPUT', 'Choose the fish for this order.')
    return strip(
      await runIntent(ctx, operationId, 'idleAngler.handOver', { orderId, catchIds }, async (user) => {
        const angler = await playableAngler(ctx, user)
        const { world, content } = await worldContentOf(ctx)
        const rows = []
        for (const id of catchIds) rows.push(await ownCatch(ctx, angler, id))
        const result = fillOrder(content, toAnglerState(angler), orderId, rows.map(asCatch))
        if (!result.ok) throw appError('INVALID_STATE', result.code === 'WRONG_FISH' ? 'Those fish do not fit this order.' : result.code === 'WRONG_COUNT' ? 'This order needs a different number of fish.' : 'That order is no longer on the slate.')
        for (const row of rows) await ctx.db.delete(row._id)
        const names = [...new Set(rows.map((r) => speciesName(content, r.speciesId)))].join(' and ')
        const sequence = await commandLog(ctx, angler, 'idleAngler.handOver', `Handed ${rows.length === 1 ? 'a' : rows.length} ${names} to the fishmonger for ${result.earned} coins.`, result.earned)
        await ctx.db.patch(angler._id, { ...fromAnglerState(result.angler), logSequence: sequence })
        await awardAfterAnglerIntent(ctx, angler, content, world?.currentTick ?? 0)
        return { changed: true, gold: result.angler.gold, count: rows.length }
      }),
    )
  },
})

/** The day's one swap: the order is replaced straight away. */
export const swapFishmongerOrder = mutation({
  args: { operationId: v.string(), orderId: v.string() },
  returns: intentResult,
  handler: async (ctx, { operationId, orderId }) =>
    strip(
      await runIntent(ctx, operationId, 'idleAngler.swapOrder', { orderId }, async (user) => {
        const angler = await playableAngler(ctx, user)
        const { world, content } = await worldContentOf(ctx)
        if (world === null) throw appError('SERVICE_PAUSED', 'The waters are not open yet.')
        const day = orderDay(content, Date.now(), user.trmnlUtcOffset)
        const seed = deriveStreamSeed(world.worldSeed, angler._id, day, 1, 'order-swap')
        const result = swapOrder(content, toAnglerState(angler), orderId, day, seed)
        if (!result.ok) throw appError('INVALID_STATE', result.code === 'SWAPPED_TODAY' ? 'You have swapped an order today already.' : result.code === 'NOTHING_ELSE' ? 'The fishmonger has nothing else to ask for yet.' : 'That order is no longer on the slate.')
        const sequence = await commandLog(ctx, angler, 'idleAngler.swapOrder', 'Asked the fishmonger for a different order.')
        await ctx.db.patch(angler._id, { ...fromAnglerState(result.angler), logSequence: sequence })
        return { changed: true }
      }),
    ),
})

/** A small fish from the cooler goes back on the hook as deadbait. */
export const useAsBait = mutation({
  args: { operationId: v.string(), catchId: v.id('catches') },
  returns: intentResult,
  handler: async (ctx, { operationId, catchId }) =>
    strip(
      await runIntent(ctx, operationId, 'idleAngler.useAsBait', { catchId }, async (user) => {
        const angler = await playableAngler(ctx, user)
        const { world, content } = await worldContentOf(ctx)
        const row = await ownCatch(ctx, angler, catchId)
        const result = baitFromCatch(content, toAnglerState(angler), row)
        if (!result.ok) throw appError('INVALID_STATE', REFUSAL[result.code] ?? 'That is not possible right now.')
        await ctx.db.delete(row._id)
        const sequence = await commandLog(ctx, angler, 'idleAngler.useAsBait', `A ${formatWeight(row.grams)} ${speciesName(content, row.speciesId)} goes in the deadbait box.`)
        await ctx.db.patch(angler._id, { ...fromAnglerState(result.angler), logSequence: sequence })
        await awardAfterAnglerIntent(ctx, angler, content, world?.currentTick ?? 0)
        return { changed: true }
      }),
    ),
})

/** Mount a big fish on a free peg: it leaves the cooler and the market for the wall. */
export const mountCatch = mutation({
  args: { operationId: v.string(), catchId: v.id('catches') },
  returns: intentResult,
  handler: async (ctx, { operationId, catchId }) =>
    strip(
      await runIntent(ctx, operationId, 'idleAngler.mount', { catchId }, async (user) => {
        const angler = await playableAngler(ctx, user)
        const { world, content } = await worldContentOf(ctx)
        const row = await ownCatch(ctx, angler, catchId)
        const mounted = await mountedFish(ctx, angler._id)
        const result = mountFish(content, toAnglerState(angler), row, mounted.length)
        if (!result.ok) throw appError('INVALID_STATE', REFUSAL[result.code] ?? 'That is not possible right now.')
        const taken = new Set(mounted.map((m) => m.peg))
        let peg = 0
        while (taken.has(peg)) peg += 1
        const water = content.species.find((s) => s.id === row.speciesId)?.water ?? angler.waterId
        await ctx.db.delete(row._id)
        await ctx.db.insert('iaTrophies', { anglerId: angler._id, userId: angler.userId, kind: 'fish', speciesId: row.speciesId, grams: row.grams, water, at: Date.now(), peg })
        const sequence = await commandLog(ctx, angler, 'idleAngler.mount', `The ${formatWeight(row.grams)} ${speciesName(content, row.speciesId)} goes up on the wall.`, -result.spent)
        await ctx.db.patch(angler._id, { ...fromAnglerState(result.angler), logSequence: sequence })
        await awardAfterAnglerIntent(ctx, angler, content, world?.currentTick ?? 0)
        return { changed: true, gold: result.angler.gold }
      }),
    ),
})

/** Take a mounted fish down, freeing its peg. Nothing is refunded. */
export const takeDownTrophy = mutation({
  args: { operationId: v.string(), trophyId: v.id('iaTrophies') },
  returns: intentResult,
  handler: async (ctx, { operationId, trophyId }) =>
    strip(
      await runIntent(ctx, operationId, 'idleAngler.takeDown', { trophyId }, async (user) => {
        const angler = await playableAngler(ctx, user)
        const trophy = await ctx.db.get(trophyId)
        if (trophy === null || trophy.anglerId !== angler._id || trophy.kind !== 'fish') throw appError('INVALID_STATE', 'That trophy is not on your wall.')
        await ctx.db.delete(trophy._id)
        return { changed: true }
      }),
    ),
})

export const buyMorePegs = mutation({
  args: { operationId: v.string() },
  returns: intentResult,
  handler: async (ctx, { operationId }) => strip(await shopIntent('idleAngler.buyPegs', (c, a) => buyPegs(c, a), (n, c) => `The wall now has ${pegsOf(c, n)} pegs.`)(ctx, operationId, {})),
})

export const buyCharterTicket = mutation({
  args: { operationId: v.string() },
  returns: intentResult,
  handler: async (ctx, { operationId }) => strip(await shopIntent('idleAngler.buyCharter', (c, a) => buyCharter(c, a), (n) => `Booked a charter for ${n.charterCasts ?? 0} casts.`)(ctx, operationId, {})),
})

/** The trophy wall and shelf: every mounted fish, the newest medals, and the rosettes (one per Open entered). */
export const trophies = query({
  args: {},
  returns: v.any(),
  handler: async (ctx) => {
    const user = await currentUser(ctx)
    const angler = await currentAngler(ctx, user)
    if (angler === null) return null
    const { content } = await worldContentOf(ctx)
    const wall = await ctx.db.query('iaTrophies').withIndex('by_anglerId_and_kind', (q) => q.eq('anglerId', angler._id).eq('kind', 'fish')).take(MOUNTED_MAX)
    const medals = await ctx.db.query('iaTrophies').withIndex('by_anglerId_and_kind', (q) => q.eq('anglerId', angler._id).eq('kind', 'medal')).order('desc').take(SHELF_PAGE)
    const describe = (t: Doc<'iaTrophies'>) => ({ id: t._id, speciesId: t.speciesId ?? null, name: t.speciesId ? speciesName(content, t.speciesId) : null, grams: t.grams ?? null, water: waterOf(content, t.water).name, at: t.at, peg: t.peg ?? null, place: t.place ?? null, period: t.periodKey ?? null })
    return { pegs: pegsOf(content, toAnglerState(angler)), wall: wall.map(describe).sort((a, b) => (a.peg ?? 0) - (b.peg ?? 0)), medals: medals.map(describe), rosettes: angler.counters.opensEntered ?? 0 }
  },
})

/** This weekend's Opens: the target at each water, the top rows and the viewer's own. */
export const opens = query({
  args: {},
  returns: v.any(),
  handler: async (ctx) => {
    const user = await currentUser(ctx)
    const angler = await currentAngler(ctx, user)
    const { content } = await worldContentOf(ctx)
    if (!content.opens) return null
    const now = Date.now()
    const period = openPeriod(now)
    const saturday = Date.parse(`${period.slice(1)}T00:00:00Z`)
    const waters = []
    for (const water of content.waters) {
      const target = openTarget(content, water.id, now)
      if (!target) continue
      const board = await readBoard(ctx, water.id, period, angler?._id ?? null, 10)
      waters.push({ id: water.id, name: water.name, target: { id: target.id, name: target.name }, ...board })
    }
    return { period, startsAt: saturday, endsAt: saturday + 2 * DAY_MS, on: now >= saturday && now < saturday + 2 * DAY_MS, waters, prizes: content.opens.prizes }
  },
})

const PLACE = ['Gold', 'Silver', 'Bronze'] as const

/**
 * Monday 00:10 UTC: last weekend's Opens close. Each water's top three take a medal and its coins, once (the
 * `iaOpenAwards` receipt), with a story line. Reads are three rows per water.
 */
export const closeOpens = internalMutation({
  args: {},
  returns: v.null(),
  handler: async (ctx) => {
    const world = await readEngineWorld(ctx, IDLE_ANGLER_RUNTIME)
    const content = world ? IDLE_ANGLER_RUNTIME.content(world.activeContentVersion) : undefined
    if (!content?.opens) return null
    const period = openPeriod(Date.now() - 3 * DAY_MS)
    const at = Date.parse(`${period.slice(1)}T12:00:00Z`)
    for (const water of content.waters) {
      const target = openTarget(content, water.id, at)
      if (!target) continue
      const done = await ctx.db.query('iaOpenAwards').withIndex('by_period_and_waterId', (q) => q.eq('period', period).eq('waterId', water.id)).unique()
      if (done) continue
      const top = await ctx.db.query('iaCatchRecords').withIndex('by_waterId_and_period_and_grams', (q) => q.eq('waterId', water.id).eq('period', period)).order('desc').take(3)
      for (const [place, row] of top.entries()) {
        const angler = await ctx.db.get(row.anglerId)
        if (angler === null) continue
        const prize = content.opens.prizes[place]!
        await ctx.db.insert('iaTrophies', { anglerId: angler._id, userId: angler.userId, kind: 'medal', speciesId: row.speciesId, grams: row.grams, water: water.id, periodKey: period, place: place + 1, at: Date.now() })
        const sequence = angler.logSequence + 1
        const summary = `${PLACE[place]} in the ${target.name} Open at ${waterOf(content, water.id).the} with ${formatWeight(row.grams)}. ${prize} coins.`
        await ctx.db.insert('iaTickLogs', { anglerId: angler._id, source: 'lifecycle', sequence, at: Date.now(), kind: 'open', summary, detail: { v: 1, speciesId: row.speciesId, grams: row.grams, waterId: water.id as WaterId, place: place + 1 }, deltas: { gold: prize } })
        const counters = { ...angler.counters, medals: (angler.counters.medals ?? 0) + 1, goldEarned: angler.counters.goldEarned + prize }
        await ctx.db.patch(angler._id, { gold: angler.gold + prize, counters, logSequence: sequence })
        await awardAfterAnglerIntent(ctx, angler, content, world?.currentTick ?? 0)
      }
      await ctx.db.insert('iaOpenAwards', { period, waterId: water.id, awarded: top.length, at: Date.now() })
    }
    return null
  },
})

