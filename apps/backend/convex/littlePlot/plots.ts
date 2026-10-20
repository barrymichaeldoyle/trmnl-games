import { v } from 'convex/values'
import { paginationOptsValidator } from 'convex/server'
import { contentV1 } from '@trmnl-games/little-plot/content'
import {
  buyItem,
  buySeed,
  claimGoalReward,
  conditionsAt,
  crossHint,
  currentGoal,
  giveSeed,
  goalLine,
  goalProgress,
  goalWaiting,
  growthFor,
  harvestCoins,
  itemOnShelf,
  kindOf,
  kindsGrown,
  moveGreenhouse,
  pause as pausePlot,
  pick,
  pickAll,
  resume as resumePlot,
  seasonAt,
  seedOnShelf,
  seedPrice,
  sow,
  sowRow,
  sowingNote,
  stageOf,
  stagePoints,
  water,
  waterTicks,
  type ActionResult,
  type LittlePlotCatalog,
  type PlotState,
  type TickEvent,
} from '@trmnl-games/little-plot/sim'
import { weekEndsAt } from '@trmnl-games/engine/calendar'
import type { Doc } from '../_generated/dataModel'
import { mutation, query, type MutationCtx, type QueryCtx } from '../_generated/server'
import { appError } from '../lib/errors'
import { pagePublic } from '../lib/publicPage'
import { currentUser, intentReturns, isIntentRefusal, runIntent, type IntentRefusal, type IntentResult } from '../lib/intent'
import { readEngineWorld } from '../lib/engine/world'
import { ALIAS_RULE, normalizeAlias } from '../lib/names'
import { fromPlotState, mirrored, storedDetail, toPlotState } from './adapter'
import { awardAfterPlotIntent } from './achievements'
import { readDeviceBoard } from './leaderboard'
import { currentPlot, littlePlotProfile } from './profile'
import { LITTLE_PLOT_RUNTIME, LITTLE_PLOT_SCHEDULE } from './runtime'
import { plotWeather } from './tick'
import { sendCutting } from './visits'

/**
 * Little Plot companion API (little-plot.md "Picking and the shed", "Watering", "Gnomes from other gardens"). Every
 * change is a receipted, rate-limited intent on the owner's own plot; the rules come from the pure core's actions so
 * the companion, the harness and the tick agree.
 */

export async function worldContentOf(ctx: QueryCtx): Promise<{ world: Doc<'worldState'> | null; content: LittlePlotCatalog }> {
  const world = await readEngineWorld(ctx, LITTLE_PLOT_RUNTIME)
  return { world, content: (world && LITTLE_PLOT_RUNTIME.content(world.activeContentVersion)) ?? contentV1 }
}

/** Intents need an activated, healthy plot. */
export async function playablePlot(ctx: QueryCtx, user: Doc<'users'>): Promise<Doc<'plots'>> {
  const plot = await currentPlot(ctx, user)
  if (plot === null) throw appError('HERO_NOT_FOUND', 'No plot yet.')
  if (plot.activationState !== 'active') throw appError('TRMNL_REQUIRED', 'Save Little Plot in TRMNL to start the plot growing.')
  if (plot.simulationState === 'quarantined') throw appError('SERVICE_PAUSED', 'This plot is paused for a service check.')
  return plot
}

async function commandLog(ctx: MutationCtx, plot: Doc<'plots'>, events: readonly TickEvent[], operation: string): Promise<number> {
  let sequence = plot.logSequence
  for (const event of events) {
    sequence += 1
    await ctx.db.insert('lpTickLogs', { plotId: plot._id, source: 'command', sequence, at: Date.now(), kind: event.kind, summary: event.summary.slice(0, 160), detail: { ...storedDetail(event), operation } })
  }
  return sequence
}

/** Apply a pure action to the plot, with its lines as command stories, then the goal and achievements. */
async function applyAction(ctx: MutationCtx, plot: Doc<'plots'>, result: ActionResult, operation: string): Promise<IntentResult> {
  if (!result.ok) throw appError('INVALID_STATE', result.reason)
  const sequence = await commandLog(ctx, plot, result.events, operation)
  await ctx.db.patch(plot._id, { plot: fromPlotState(result.plot), ...mirrored(result.plot), logSequence: sequence })
  const { world, content } = await worldContentOf(ctx)
  await awardAfterPlotIntent(ctx, plot, content, world?.currentTick ?? 0)
  return { changed: true, gold: result.plot.gold }
}

function plotIntent(operation: string, act: (ctx: MutationCtx, plot: Doc<'plots'>, state: PlotState, content: LittlePlotCatalog, world: Doc<'worldState'> | null, input: Record<string, unknown>) => Promise<IntentResult> | IntentResult) {
  return async (ctx: MutationCtx, operationId: string, input: Record<string, unknown>) =>
    await runIntent(ctx, operationId, operation, input, async (user) => {
      const plot = await playablePlot(ctx, user)
      const { world, content } = await worldContentOf(ctx)
      return await act(ctx, plot, toPlotState(plot), content, world, input)
    })
}

const intentResult = intentReturns({ operationId: v.string(), changed: v.boolean(), gold: v.optional(v.number()) })
const strip = (r: (IntentResult & { operationId: string }) | IntentRefusal) => (isIntentRefusal(r) ? r : { operationId: r.operationId, changed: r.changed, ...(r.gold === undefined ? {} : { gold: r.gold }) })

const tickOf = (world: Doc<'worldState'> | null) => world?.currentTick ?? 0

export const sowBed = mutation({
  args: { operationId: v.string(), bed: v.number(), kindId: v.string() },
  returns: intentResult,
  handler: async (ctx, { operationId, bed, kindId }) => strip(await plotIntent('littlePlot.sow', (ctx, plot, state, content, world, i) => applyAction(ctx, plot, sow(state, content, i.bed as number, i.kindId as string, tickOf(world)), 'littlePlot.sow'))(ctx, operationId, { bed, kindId })),
})

export const sowRowOf = mutation({
  args: { operationId: v.string(), row: v.number(), kindId: v.string() },
  returns: intentResult,
  handler: async (ctx, { operationId, row, kindId }) => strip(await plotIntent('littlePlot.sowRow', (ctx, plot, state, content, world, i) => applyAction(ctx, plot, sowRow(state, content, i.row as number, i.kindId as string, tickOf(world)), 'littlePlot.sowRow'))(ctx, operationId, { row, kindId })),
})

export const pickBed = mutation({
  args: { operationId: v.string(), bed: v.number() },
  returns: intentResult,
  handler: async (ctx, { operationId, bed }) => strip(await plotIntent('littlePlot.pick', (ctx, plot, state, content, world, i) => applyAction(ctx, plot, pick(state, content, i.bed as number, tickOf(world), Date.now()), 'littlePlot.pick'))(ctx, operationId, { bed })),
})

export const pickAllRipe = mutation({
  args: { operationId: v.string() },
  returns: intentResult,
  handler: async (ctx, { operationId }) => strip(await plotIntent('littlePlot.pickAll', (ctx, plot, state, content, world) => applyAction(ctx, plot, pickAll(state, content, tickOf(world), Date.now()), 'littlePlot.pickAll'))(ctx, operationId, {})),
})

export const waterPlot = mutation({
  args: { operationId: v.string() },
  returns: intentResult,
  handler: async (ctx, { operationId }) => strip(await plotIntent('littlePlot.water', (ctx, plot, state, content, world) => applyAction(ctx, plot, water(state, content, tickOf(world)), 'littlePlot.water'))(ctx, operationId, {})),
})

export const buySeeds = mutation({
  args: { operationId: v.string(), kindId: v.string(), count: v.number() },
  returns: intentResult,
  handler: async (ctx, { operationId, kindId, count }) => strip(await plotIntent('littlePlot.buySeed', (ctx, plot, state, content, _w, i) => applyAction(ctx, plot, buySeed(state, content, i.kindId as string, i.count as number), 'littlePlot.buySeed'))(ctx, operationId, { kindId, count })),
})

export const buyShedItem = mutation({
  args: { operationId: v.string(), itemId: v.string() },
  returns: intentResult,
  handler: async (ctx, { operationId, itemId }) => strip(await plotIntent('littlePlot.buyItem', (ctx, plot, state, content, world, i) => applyAction(ctx, plot, buyItem(state, content, i.itemId as string, tickOf(world)), 'littlePlot.buyItem'))(ctx, operationId, { itemId })),
})

export const moveGlass = mutation({
  args: { operationId: v.string(), from: v.number(), to: v.number() },
  returns: intentResult,
  handler: async (ctx, { operationId, from, to }) => strip(await plotIntent('littlePlot.moveGreenhouse', (ctx, plot, state, content, _w, i) => applyAction(ctx, plot, moveGreenhouse(state, content, i.from as number, i.to as number), 'littlePlot.moveGreenhouse'))(ctx, operationId, { from, to })),
})

export const claimGoal = mutation({
  args: { operationId: v.string(), goalId: v.optional(v.string()) },
  returns: intentResult,
  handler: async (ctx, { operationId, goalId }) =>
    strip(
      await plotIntent('littlePlot.claimGoal', async (ctx, plot, state, content, _w, i) => {
        const result = claimGoalReward(state, i.goalId as string | undefined)
        if (!result.ok) throw appError('INVALID_STATE', 'Nothing to claim.')
        return await applyAction(ctx, plot, { ok: true, plot: result.plot, events: [{ kind: 'goal', summary: `Claimed ${result.reward.coins} coins for ${content.goals.find((g) => g.id === result.reward.id)?.title ?? 'a goal'}.`, detail: { goalId: result.reward.id, coins: result.reward.coins } }] }, 'littlePlot.claimGoal')
      })(ctx, operationId, goalId === undefined ? {} : { goalId }),
    ),
})

export const pause = mutation({
  args: { operationId: v.string() },
  returns: intentResult,
  handler: async (ctx, { operationId }) => strip(await plotIntent('littlePlot.pause', (ctx, plot, state) => (state.status === 'paused' ? { changed: false } : applyAction(ctx, plot, pausePlot(state), 'littlePlot.pause')))(ctx, operationId, {})),
})

export const resume = mutation({
  args: { operationId: v.string() },
  returns: intentResult,
  handler: async (ctx, { operationId }) =>
    strip(
      await plotIntent('littlePlot.resume', async (ctx, plot, state, _c, world) => {
        if (state.status === 'growing') return { changed: false }
        const result = await applyAction(ctx, plot, resumePlot(state), 'littlePlot.resume')
        // No catch-up: the next tick is the first that counts.
        await ctx.db.patch(plot._id, { lastTick: Math.max(plot.lastTick, world?.currentTick ?? 0) })
        return result
      })(ctx, operationId, {}),
    ),
})

export const setPublicProfile = mutation({
  args: { operationId: v.string(), visible: v.boolean() },
  returns: intentResult,
  handler: async (ctx, { operationId, visible }) =>
    strip(
      await plotIntent('littlePlot.setPublicProfile', async (ctx, plot, _s, _c, _w, i) => {
        if (pagePublic(plot) === i.visible) return { changed: false }
        await ctx.db.patch(plot._id, { publicProfile: i.visible as boolean })
        return { changed: true }
      })(ctx, operationId, { visible }),
    ),
})

/** The followable player behind a public name with a public, active plot. */
async function cuttingTarget(ctx: QueryCtx, alias: string): Promise<{ user: Doc<'users'>; plot: Doc<'plots'> } | null> {
  const normalized = normalizeAlias(alias)
  if (normalized.length < ALIAS_RULE.min || normalized.length > ALIAS_RULE.max) return null
  const user = await ctx.db.query('users').withIndex('by_normalizedAlias', (q) => q.eq('normalizedAlias', normalized)).first()
  if (user === null || user.state !== 'active' || user.nameRepairRequired) return null
  const plot = await currentPlot(ctx, user)
  if (plot === null || plot.activationState !== 'active' || !pagePublic(plot)) return null
  return { user, plot }
}

/** Send one seed from the tin to a followed player's plot (little-plot.md "Sending a cutting"): once a day. */
export const giveCutting = mutation({
  args: { operationId: v.string(), alias: v.string(), kindId: v.string() },
  returns: intentResult,
  handler: async (ctx, { operationId, alias, kindId }) =>
    strip(
      await plotIntent('littlePlot.giveCutting', async (ctx, plot, state, content, world, i) => {
        const owner = (await ctx.db.get(plot.userId))!
        const target = await cuttingTarget(ctx, i.alias as string)
        if (target === null || target.user._id === owner._id) throw appError('PLAYER_NOT_FOUND', 'That plot is hidden, or there is no player by that name.')
        const follow = await ctx.db.query('follows').withIndex('by_userId_and_followedUserId', (q) => q.eq('userId', owner._id).eq('followedUserId', target.user._id)).unique()
        if (follow === null || follow.followedNameVersion !== target.user.publicNameVersion) throw appError('INVALID_STATE', 'You can send a cutting to a player you follow.')
        const day = Math.floor(Date.now() / 86_400_000)
        if (plot.lastCuttingDay === day) throw appError('RATE_LIMITED', 'One cutting a day. Tomorrow, then.')
        const result = giveSeed(state, content, i.kindId as string)
        if (!result.ok) throw appError('INVALID_STATE', result.reason)
        await sendCutting(ctx, { plot, owner }, target.plot, i.kindId as string, tickOf(world), Date.now())
        await ctx.db.patch(plot._id, { lastCuttingDay: day })
        return await applyAction(ctx, plot, { ...result, events: [{ ...result.events[0]!, summary: `Sent a ${kindOf(content, i.kindId as string).name} seed to ${target.user.publicAlias} as a cutting.` }] }, 'littlePlot.giveCutting')
      })(ctx, operationId, { alias: normalizeAlias(alias), kindId }),
    ),
})

/** The players this account follows who have a public Little Plot, for the cutting picker. */
export const cuttingTargets = query({
  args: {},
  returns: v.array(v.object({ alias: v.string() })),
  handler: async (ctx) => {
    const user = await currentUser(ctx)
    if (user === null || user.state !== 'active') return []
    const follows = await ctx.db.query('follows').withIndex('by_userId_and_followedUserId', (q) => q.eq('userId', user._id)).take(20)
    const out: Array<{ alias: string }> = []
    for (const row of follows) {
      const owner = await ctx.db.get(row.followedUserId)
      if (owner === null || owner.publicNameVersion !== row.followedNameVersion) continue
      const target = await cuttingTarget(ctx, owner.publicAlias)
      if (target) out.push({ alias: owner.publicAlias })
    }
    return out
  },
})

const HIDDEN = 'Hidden player'

/** A log row as the companion shows it: a visit's other garden masked once its owner is gone or renamed. */
async function maskedLog(ctx: QueryCtx, log: Doc<'lpTickLogs'>) {
  let summary = log.summary
  if (log.detail.otherUserId !== undefined && log.detail.otherName !== undefined) {
    const owner = await ctx.db.get(log.detail.otherUserId)
    const visible = owner !== null && owner.state === 'active' && !owner.nameRepairRequired && owner.publicNameVersion === log.detail.otherNameVersion
    if (!visible) summary = summary.replaceAll(`[[${log.detail.otherName}]]`, `[[${HIDDEN}]]`)
  }
  return { id: log._id, at: log.at, tick: log.tick ?? null, kind: log.kind, summary, detail: { kindId: log.detail.kindId ?? null, childKindId: log.detail.childKindId ?? null, bed: log.detail.bed ?? null, effect: log.detail.effect ?? null, coins: log.detail.coins ?? null, first: log.detail.first === true } }
}

/**
 * The signed-in owner's Plot page: the beds with stage and time to the next stage, the tin, the goal, the season and
 * the weather, the shed's shelves, the catalogue, recent stories and the device's board. Fixed bounded reads.
 */
export const view = query({
  args: {},
  returns: v.any(),
  handler: async (ctx) => {
    const user = await currentUser(ctx)
    const profile = user ? await littlePlotProfile(ctx, user._id) : null
    const doc = await currentPlot(ctx, user)
    if (user === null || doc === null) return { gameState: profile?.state ?? null, plot: null }
    const { world, content } = await worldContentOf(ctx)
    const now = Date.now()
    const tick = tickOf(world)
    const state = toPlotState(doc)
    const weather = await plotWeather(ctx, world?.worldSeed ?? 'world', now)
    const conditions = conditionsAt(content, now, user.trmnlUtcOffset, weather)
    const nextTickAt = LITTLE_PLOT_SCHEDULE.nextSlotAfter(now)
    const logs = await ctx.db.query('lpTickLogs').withIndex('by_plotId_and_at_and_sequence', (q) => q.eq('plotId', doc._id)).order('desc').take(40)
    const goal = currentGoal(content, state)
    const board = doc.activationState === 'active' ? await readDeviceBoard(ctx, doc) : null
    const beds = state.beds.map((bed, index) => {
      if (bed.kindId === undefined) return { index, kind: null, stage: 'sown' as const, ripe: false, greenhouse: bed.greenhouse === true, crossed: null, nextStageInTicks: null, ripeSinceTick: null }
      const kind = kindOf(content, bed.kindId)
      const stage = stageOf(bed, kind)
      const gain = growthFor(content, state, bed, kind, conditions, tick)
      const nextThreshold = stage === 'ripe' ? null : Math.ceil((bed.points + 1) / stagePoints(kind)) * stagePoints(kind)
      return {
        index,
        kind: { id: kind.id, name: kind.name, rarity: kind.rarity, group: kind.group },
        stage,
        ripe: stage === 'ripe',
        greenhouse: bed.greenhouse === true,
        crossed: bed.crossedKindId ? { id: bed.crossedKindId, known: state.catalogue[bed.crossedKindId] !== undefined, name: kindOf(content, bed.crossedKindId).name } : null,
        nextStageInTicks: nextThreshold === null ? null : gain > 0 ? Math.ceil((nextThreshold - bed.points) / gain) : null,
        ripeSinceTick: bed.ripeSinceTick ?? null,
        coins: harvestCoins(kind, content, now),
        volunteer: bed.volunteer === true,
      }
    })
    return {
      gameState: profile?.state ?? 'active',
      plot: {
        id: doc._id,
        activationState: doc.activationState,
        status: state.status,
        level: state.level,
        xp: state.xp,
        gold: state.gold,
        rows: state.rows,
        cols: state.cols,
        beds,
        items: state.items.map((id) => ({ id, name: kindOrItemName(content, id), group: content.items.find((i) => i.id === id)?.group ?? 'tool' })),
        wateredUntilTick: state.wateredUntilTick,
        wateredHoursLeft: Math.max(0, (state.wateredUntilTick - tick) / 4),
        waterTicks: waterTicks(content, state),
        publicProfile: pagePublic(doc),
        quarantined: doc.simulationState === 'quarantined',
        ripeCount: beds.filter((b) => b.ripe).length,
      },
      tin: Object.entries(state.tin)
        .filter(([, n]) => n > 0)
        .map(([id, count]) => {
          const kind = kindOf(content, id)
          return { id, name: kind.name, rarity: kind.rarity, group: kind.group, count, grown: state.catalogue[id] !== undefined, tags: state.tags.filter((t) => t.kindId === id).map((t) => ({ from: t.from, cutting: t.cutting === true })), note: sowingNote(kind, content, now) }
        }),
      goal: goal
        ? { id: goal.id, title: goal.title, coins: goal.coins, page: goal.page ?? 'plot', progress: goalProgress(content, state, goal.predicate), line: goalLine(content, state) }
        : { id: null, title: goalLine(content, state), coins: 0, page: 'catalogue' as const, progress: null, line: goalLine(content, state) },
      waiting: goalWaiting(state.goal?.unclaimed),
      season: { id: conditions.season, endsAt: weekEndsAt(now), weather, band: conditions.band, frost: conditions.frost },
      shed: {
        seeds: content.kinds.filter((k) => seedOnShelf(k, content, state)).map((k) => ({ id: k.id, name: k.name, rarity: k.rarity, group: k.group, price: seedPrice(k, content)!, held: state.tin[k.id] ?? 0, note: sowingNote(k, content, now) })),
        nextSeedLevel: state.level < content.unlocks.seeds ? content.unlocks.seeds : state.level < content.unlocks.uncommonSeeds ? content.unlocks.uncommonSeeds : null,
        items: content.items
          .filter((i) => i.price > 0)
          .map((i) => {
            const shelf = itemOnShelf(i, content, state, tick)
            return { id: i.id, name: i.name, group: i.group, price: i.price, blurb: i.blurb, shown: shelf.shown, reason: shelf.reason ?? null, owned: state.items.includes(i.id), toGo: Math.max(0, i.price - state.gold) }
          }),
      },
      catalogue: content.kinds.map((k) => {
        const entry = state.catalogue[k.id]
        const hint = crossHint(content, state, k)
        return {
          id: k.id,
          name: k.name,
          rarity: k.rarity,
          group: k.group,
          grown: entry ? { count: entry.count, best: entry.best, firstAt: entry.firstTick } : null,
          source: k.source,
          hint: entry ? null : k.source === 'cross' ? (hint.known === 2 ? { parents: hint.parents.map((p) => kindOf(content, p).name) } : hint.known === 1 ? { parents: hint.parents.map((p) => kindOf(content, p).name), more: 1 } : { riddle: k.hint ?? null }) : { riddle: k.hint ?? null },
          seeds: state.tin[k.id] ?? 0,
        }
      }),
      kindsGrown: kindsGrown(state),
      kindsTotal: content.kinds.length,
      board,
      logs: await Promise.all(logs.map((l) => maskedLog(ctx, l))),
      nextTickAt,
      worldTick: tick,
      seasonName: seasonAt(content, now),
    }
  },
})

function kindOrItemName(content: LittlePlotCatalog, id: string): string {
  return content.items.find((i) => i.id === id)?.name ?? content.kinds.find((k) => k.id === id)?.name ?? id
}

/** The plot's whole story, newest first, a page at a time. */
export const log = query({
  args: { paginationOpts: paginationOptsValidator },
  returns: v.any(),
  handler: async (ctx, { paginationOpts }) => {
    const user = await currentUser(ctx)
    const doc = await currentPlot(ctx, user)
    const empty = { page: [], isDone: true, continueCursor: '' }
    if (doc === null) return empty
    const result = await ctx.db.query('lpTickLogs').withIndex('by_plotId_and_at_and_sequence', (q) => q.eq('plotId', doc._id)).order('desc').paginate(paginationOpts)
    return { ...result, page: await Promise.all(result.page.map((l) => maskedLog(ctx, l))) }
  },
})

/** The week's comings and goings between gardens, for the More page. */
export const visits = query({
  args: {},
  returns: v.any(),
  handler: async (ctx) => {
    const user = await currentUser(ctx)
    const doc = await currentPlot(ctx, user)
    if (doc === null) return []
    const { content } = await worldContentOf(ctx)
    const rows = await ctx.db.query('lpVisits').withIndex('by_plotId_and_tick', (q) => q.eq('plotId', doc._id)).order('desc').take(30)
    return Promise.all(
      rows.map(async (row) => {
        const owner = await ctx.db.get(row.fromUserId)
        const visible = owner !== null && owner.state === 'active' && !owner.nameRepairRequired && owner.publicNameVersion === row.fromNameVersion
        return { at: row.createdAt, from: visible ? row.fromName : HIDDEN, kind: row.kindId ? kindOf(content, row.kindId).name : null, effect: row.effect, caught: row.caught === true, cutting: row.cutting === true, state: row.state }
      }),
    )
  },
})
