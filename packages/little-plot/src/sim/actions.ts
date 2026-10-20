import { evaluateGoal } from './goals'
import { addSeed, bump, removeSeed } from './simulate'
import { greenhouseBeds, itemOf, kindOf, kindsGrown, seasonAt, stageOf, waterTicks } from './rules'
import type { ActionResult, ItemDef, KindDef, LittlePlotCatalog, PlotState, TickEvent } from './types'

/**
 * Player actions (little-plot.md "Picking and the shed", "Watering"): pure, so the companion, the harness and the
 * tests agree. Each returns the new plot and the lines to log, or a refusal with a plain reason. An action may meet
 * the current goal, so each runs the goal step.
 */

const finish = (content: LittlePlotCatalog, plot: PlotState, events: TickEvent[]): ActionResult => {
  const goal = evaluateGoal(content, plot)
  return { ok: true, plot: goal.plot, events: goal.event ? [...events, goal.event] : events }
}

const refuse = (reason: string): ActionResult => ({ ok: false, reason })

/** Whether a kind may be sown this season without the slowdown, for the companion's "Slow until spring". */
export function sowingNote(kind: KindDef, content: LittlePlotCatalog, at: number): string | null {
  const season = seasonAt(content, at)
  if (kind.sowSeasons === undefined || kind.sowSeasons.includes(season)) return null
  return `Slow until ${kind.sowSeasons[0]}`
}

export function sow(plot: PlotState, content: LittlePlotCatalog, bedIndex: number, kindId: string, tick: number): ActionResult {
  if (plot.status === 'paused') return refuse('The plot is paused.')
  const bed = plot.beds[bedIndex]
  if (bed === undefined) return refuse('No such bed.')
  if (bed.kindId !== undefined) return refuse('That bed has something growing in it.')
  if ((plot.tin[kindId] ?? 0) < 1) return refuse('No seed of that kind in the tin.')
  const kind = kindOf(content, kindId)
  const next: PlotState = {
    ...removeSeed(plot, kindId),
    beds: plot.beds.map((b, i) => (i === bedIndex ? { kindId, points: 0, sownTick: tick, ...(b.greenhouse ? { greenhouse: true as const } : {}) } : b)),
    counters: bump(plot.counters, { sowings: 1 }),
  }
  return finish(content, { ...next, tags: removeSeed(plot, kindId).tags }, [{ kind: 'sow', summary: `Sowed a ${kind.name}.`, detail: { bed: bedIndex, kindId } }])
}

/** The trowel: the empty beds of one row, as many as the tin has seeds for. */
export function sowRow(plot: PlotState, content: LittlePlotCatalog, row: number, kindId: string, tick: number): ActionResult {
  if (!plot.items.some((id) => itemOf(content, id).effects.rowSowing)) return refuse('A trowel sows a whole row at once.')
  let next = plot
  const events: TickEvent[] = []
  let sown = 0
  for (let col = 0; col < plot.cols; col += 1) {
    const index = row * plot.cols + col
    if (next.beds[index]?.kindId !== undefined || (next.tin[kindId] ?? 0) < 1) continue
    const result = sow(next, content, index, kindId, tick)
    if (!result.ok) return result
    next = result.plot
    sown += 1
  }
  if (sown === 0) return refuse('Nothing to sow in that row.')
  events.push({ kind: 'sow', summary: `Sowed ${sown} ${kindOf(content, kindId).name} along the row.`, detail: { kindId } })
  return finish(content, next, events)
}

/** Coins for one harvest now: the kind's coins, more in autumn. */
export function harvestCoins(kind: KindDef, content: LittlePlotCatalog, at: number): number {
  return seasonAt(content, at) === 'autumn' ? Math.round((kind.coins * content.autumnCoinsPercent) / 100) : kind.coins
}

/** Seeds one harvest returns: the kind's, one more when picked fresh, and a cross's child in place of one. */
export function harvestSeeds(bed: { ripeSinceTick?: number; crossedKindId?: string }, kind: KindDef, content: LittlePlotCatalog, tick: number): Array<{ kindId: string; count: number }> {
  const fresh = bed.ripeSinceTick !== undefined && tick - bed.ripeSinceTick <= content.freshTicks ? 1 : 0
  const own = kind.seeds + fresh
  if (bed.crossedKindId === undefined) return [{ kindId: kind.id, count: own }]
  return own > 1 ? [{ kindId: bed.crossedKindId, count: 1 }, { kindId: kind.id, count: own - 1 }] : [{ kindId: bed.crossedKindId, count: 1 }]
}

export function pick(plot: PlotState, content: LittlePlotCatalog, bedIndex: number, tick: number, at: number): ActionResult {
  if (plot.status === 'paused') return refuse('The plot is paused.')
  const bed = plot.beds[bedIndex]
  if (bed === undefined || bed.kindId === undefined) return refuse('Nothing growing there.')
  const kind = kindOf(content, bed.kindId)
  if (stageOf(bed, kind) !== 'ripe') return refuse(`The ${kind.name} isn't ripe yet.`)
  const coins = harvestCoins(kind, content, at)
  let next: PlotState = {
    ...plot,
    gold: plot.gold + coins,
    beds: plot.beds.map((b, i) => (i === bedIndex ? { points: 0, sownTick: tick, ...(b.greenhouse ? { greenhouse: true as const } : {}) } : b)),
    catalogue: { ...plot.catalogue, [kind.id]: { count: plot.catalogue[kind.id]?.count ?? 1, best: Math.max(plot.catalogue[kind.id]?.best ?? 0, coins), firstTick: plot.catalogue[kind.id]?.firstTick ?? tick } },
    counters: bump(plot.counters, { harvests: 1, goldEarned: coins }),
  }
  const parts: string[] = []
  for (const seed of harvestSeeds(bed, kind, content, tick)) {
    const added = addSeed(next, seed.kindId, content, seed.count)
    next = added.plot
    const seedKind = kindOf(content, seed.kindId)
    if (seed.kindId !== kind.id) {
      const first = plot.catalogue[seed.kindId] === undefined && (plot.tin[seed.kindId] ?? 0) === 0
      parts.push(first ? `one ${seedKind.name} seed, a kind you haven't grown` : `one ${seedKind.name} seed`)
      next = { ...next, counters: bump(next.counters, { seedsFound: 1 }) }
    } else if (added.added > 0) parts.push(`${added.added} ${added.added === 1 ? 'seed' : 'seeds'}`)
  }
  const summary = `Picked the ${kind.name}: ${coins} coins${parts.length > 0 ? ` and ${parts.join(' and ')}` : ''}.`
  return finish(content, next, [{ kind: 'harvest', summary, detail: { bed: bedIndex, kindId: kind.id, coins, ...(bed.crossedKindId ? { childKindId: bed.crossedKindId } : {}) } }])
}

/** Every ripe bed in one go, one receipt. */
export function pickAll(plot: PlotState, content: LittlePlotCatalog, tick: number, at: number): ActionResult {
  const ripe = plot.beds.flatMap((b, i) => (b.kindId !== undefined && stageOf(b, kindOf(content, b.kindId)) === 'ripe' ? [i] : []))
  if (ripe.length === 0) return refuse('Nothing is ripe.')
  let next = plot
  let coins = 0
  for (const index of ripe) {
    const result = pick(next, content, index, tick, at)
    if (!result.ok) return result
    coins += result.plot.gold - next.gold
    next = result.plot
  }
  return finish(content, next, [{ kind: 'harvest', summary: `Picked ${ripe.length} beds: ${coins} coins, and the seeds are in the tin.`, detail: { coins } }])
}

export function water(plot: PlotState, content: LittlePlotCatalog, tick: number): ActionResult {
  if (plot.status === 'paused') return refuse('The plot is paused.')
  const until = tick + waterTicks(content, plot)
  if (plot.wateredUntilTick >= until) return refuse('The plot is already watered for longer than that.')
  return finish(content, { ...plot, wateredUntilTick: until, counters: bump(plot.counters, { waterings: 1 }) }, [{ kind: 'water', summary: `Watered the plot. It'll stay damp for ${Math.round((until - tick) / 4)} hours.`, detail: {} }])
}

/** The shed's price for a seed, or null when the shed does not sell it. */
export function seedPrice(kind: KindDef, content: LittlePlotCatalog): number | null {
  if (kind.source !== 'shed') return null
  if (kind.rarity === 'common') return content.seedPrice.common
  if (kind.rarity === 'uncommon') return content.seedPrice.uncommon
  return null
}

/** Whether the shed shows this seed at the plot's level. */
export function seedOnShelf(kind: KindDef, content: LittlePlotCatalog, plot: Pick<PlotState, 'level'>): boolean {
  const price = seedPrice(kind, content)
  if (price === null) return false
  return plot.level >= (kind.rarity === 'uncommon' ? content.unlocks.uncommonSeeds : content.unlocks.seeds)
}

export function buySeed(plot: PlotState, content: LittlePlotCatalog, kindId: string, count: number): ActionResult {
  const kind = kindOf(content, kindId)
  const price = seedPrice(kind, content)
  if (price === null) return refuse('The shed never sells that seed. It has to be found.')
  if (!seedOnShelf(kind, content, plot)) return refuse(`${kind.name} seeds reach the shelf at level ${kind.rarity === 'uncommon' ? content.unlocks.uncommonSeeds : content.unlocks.seeds}.`)
  if (!Number.isInteger(count) || count < 1 || count > content.tinCap) return refuse('Pick how many seeds.')
  const room = content.tinCap - (plot.tin[kindId] ?? 0)
  if (room < count) return refuse(room === 0 ? 'The tin is full of those.' : `The tin has room for ${room} more.`)
  const cost = price * count
  if (plot.gold < cost) return refuse(`${cost - plot.gold} coins to go.`)
  const next = addSeed({ ...plot, gold: plot.gold - cost, counters: bump(plot.counters, { seedsBought: count }) }, kindId, content, count).plot
  return finish(content, next, [{ kind: 'shop', summary: `Bought ${count} ${kind.name} ${count === 1 ? 'seed' : 'seeds'} for ${cost} coins.`, detail: { kindId, coins: -cost } }])
}

/** Whether the shed shows the item: level, prerequisites, and not owned (ladybirds can be bought again once lapsed). */
export function itemOnShelf(item: ItemDef, content: LittlePlotCatalog, plot: PlotState, tick: number): { shown: boolean; reason?: string } {
  const group = item.group
  const level = item.level ?? (group === 'defence' ? content.unlocks.defences : group === 'structure' ? content.unlocks.structures : 1)
  if (plot.level < level) return { shown: false, reason: `Level ${level}` }
  if (item.requires && !plot.items.includes(item.requires)) return { shown: false, reason: `Needs ${itemOf(content, item.requires).name}` }
  if (plot.items.includes(item.id) && !(item.effects.lasts === 'season' && (plot.ladybirdsUntilTick ?? 0) < tick)) return { shown: false, reason: 'Owned' }
  return { shown: true }
}

export function buyItem(plot: PlotState, content: LittlePlotCatalog, itemId: string, tick: number): ActionResult {
  const item = itemOf(content, itemId)
  const shelf = itemOnShelf(item, content, plot, tick)
  if (!shelf.shown) return refuse(shelf.reason === 'Owned' ? `You already have the ${item.name}.` : `Not yet: ${shelf.reason}.`)
  if (plot.gold < item.price) return refuse(`${item.price - plot.gold} coins to go.`)
  let next: PlotState = { ...plot, gold: plot.gold - item.price, items: plot.items.includes(item.id) ? plot.items : [...plot.items, item.id], counters: bump(plot.counters, { itemsBought: 1 }) }
  if (item.effects.lasts === 'season') next = { ...next, ladybirdsUntilTick: tick + 7 * 96 }
  if (item.effects.beds) {
    const { rows, cols } = item.effects.beds
    const beds = [...next.beds]
    while (beds.length < rows * cols) beds.push({ points: 0, sownTick: tick })
    next = { ...next, rows, cols, beds }
  }
  if (item.effects.greenhouseBeds) {
    // The newest glass goes over the first bed without any, and the player may move it.
    const under = greenhouseBeds(content, next)
    const have = next.beds.filter((b) => b.greenhouse).length
    const beds = [...next.beds]
    for (let i = 0; i < beds.length && beds.filter((b) => b.greenhouse).length < Math.min(under, have + item.effects.greenhouseBeds); i += 1) if (!beds[i]!.greenhouse) beds[i] = { ...beds[i]!, greenhouse: true }
    next = { ...next, beds }
  }
  return finish(content, next, [{ kind: 'shop', summary: `Bought the ${item.name} for ${item.price} coins.`, detail: { item: item.id, coins: -item.price } }])
}

/** Move the glass to another bed; the plant under it comes with nothing. */
export function moveGreenhouse(plot: PlotState, content: LittlePlotCatalog, from: number, to: number): ActionResult {
  if (!plot.beds[from]?.greenhouse) return refuse('No greenhouse on that bed.')
  if (plot.beds[to] === undefined) return refuse('No such bed.')
  if (plot.beds[to].greenhouse) return refuse('That bed is already under glass.')
  const beds = plot.beds.map((b, i) => {
    if (i === from) {
      const { greenhouse: _g, ...rest } = b
      return rest
    }
    return i === to ? { ...b, greenhouse: true as const } : b
  })
  return finish(content, { ...plot, beds }, [{ kind: 'shop', summary: 'Moved the greenhouse.', detail: { bed: to } }])
}

export function pause(plot: PlotState): ActionResult {
  if (plot.status === 'paused') return refuse('Already paused.')
  return { ok: true, plot: { ...plot, status: 'paused' }, events: [{ kind: 'system', summary: 'The plot is paused. Nothing grows and nothing visits.', detail: {} }] }
}

export function resume(plot: PlotState): ActionResult {
  if (plot.status === 'growing') return refuse('Already growing.')
  return { ok: true, plot: { ...plot, status: 'growing' }, events: [{ kind: 'system', summary: 'The plot is growing again.', detail: {} }] }
}

/** A seed to a followed player's tin; the one way a rare seed moves between gardens. */
export function giveSeed(plot: PlotState, content: LittlePlotCatalog, kindId: string): ActionResult {
  if ((plot.tin[kindId] ?? 0) < 1) return refuse('No seed of that kind in the tin.')
  const kind = kindOf(content, kindId)
  return { ok: true, plot: { ...removeSeed(plot, kindId), counters: bump(plot.counters, { cuttingsSent: 1 }) }, events: [{ kind: 'cutting', summary: `Sent a ${kind.name} seed as a cutting.`, detail: { kindId } }] }
}

/** A seed from another garden, tagged with where it came from (a gnome's haul or a friend's cutting). */
export function receiveSeed(plot: PlotState, content: LittlePlotCatalog, kindId: string, from: string, cutting: boolean): PlotState {
  const added = addSeed(plot, kindId, content)
  if (added.added === 0) return plot
  const tags = [...plot.tags, { kindId, from, ...(cutting ? { cutting: true as const } : {}) }].slice(-content.tagCap)
  return { ...added.plot, tags, counters: bump(added.plot.counters, cutting ? { cuttingsReceived: 1, seedsFound: 1 } : { seedsFound: 1, gnomesHosted: 1 }) }
}

/** Seeds a visiting gnome may take: a common or uncommon kind with two or more, never the last of a kind. */
export function spareSeeds(plot: PlotState, content: LittlePlotCatalog): string[] {
  return Object.keys(plot.tin)
    .filter((id) => (plot.tin[id] ?? 0) >= 2 && (kindOf(content, id).rarity === 'common' || kindOf(content, id).rarity === 'uncommon'))
    .sort()
}

export const catalogueCount = kindsGrown
