import { createRng, pickOne, pickWeighted, type Rng } from '@trmnl-games/engine/rng'
import { xpToLeave } from '@trmnl-games/engine/levels'
import { evaluateGoal, guaranteeLive, useGuarantee } from './goals'
import { childrenOf, conditionsAt, crossPercent, emptyBeds, growthStructurePercent, isNightish, kindOf, neighbours, pestPercent, pointsAtStage, seasonBit, stageIndex, stageOf, stagePoints, trapPercent, visitorPercent } from './rules'
import type { Bed, Conditions, EventDetail, KindDef, LittlePlotCatalog, PestEffect, PestId, PlotCounters, PlotState, Stage, TickEvent, TickInput, TickResult, VisitPlan } from './types'
import { STAGES } from './types'

/**
 * The Little Plot pure core (little-plot.md "The tick"). One evaluation per eligible tick, in a fixed order:
 * conditions, growth on every bed, going to seed, the frost, the bird table, the pest draw, the visitor draw, the
 * ambient line, XP and levels, then the goal. Pure: no clock, no network, no storage; the adapter passes the wall
 * slot, offset, weather and stream seeds in.
 *
 * Draw order (part of the simulation version): `growth` draws the stage and ripe lines, each volunteer's wind, the
 * frost's chance and the bird table's seed; `cross` draws once per ripening with a candidate; `pest` draws the base
 * roll, the pest, the defence roll, the told-or-not roll and the target; `trap` the catch rolls; `visitor` the
 * night roll and the defence roll; `narrative` only for an ambient line.
 */
export const SIMULATION_VERSION = 1

export const fill = (template: string, vars: Record<string, string>): string => template.replace(/\{(\w+)\}/g, (_, key: string) => vars[key] ?? `{${key}}`)

export function bump(counters: PlotCounters, patch: Partial<Record<keyof PlotCounters, number>>): PlotCounters {
  const next = { ...counters } as Record<keyof PlotCounters, number>
  for (const [key, add] of Object.entries(patch) as Array<[keyof PlotCounters, number]>) next[key] = (next[key] ?? 0) + add
  return next
}

/** Seeds into the tin, capped per kind; `added` is how many fitted ("left for the birds" when none). */
export function addSeed(plot: PlotState, kindId: string, content: LittlePlotCatalog, count = 1): { plot: PlotState; added: number } {
  const have = plot.tin[kindId] ?? 0
  const added = Math.max(0, Math.min(count, content.tinCap - have))
  if (added === 0) return { plot, added }
  return { plot: { ...plot, tin: { ...plot.tin, [kindId]: have + added } }, added }
}

/** Seeds out of the tin; a tag leaves with the last tagged seed of its kind. */
export function removeSeed(plot: PlotState, kindId: string, count = 1): PlotState {
  const have = plot.tin[kindId] ?? 0
  if (have < count) throw new Error(`not enough ${kindId} seeds`)
  const tin = { ...plot.tin }
  if (have === count) delete tin[kindId]
  else tin[kindId] = have - count
  const left = tin[kindId] ?? 0
  let tags = plot.tags
  while (tags.filter((t) => t.kindId === kindId).length > left) {
    const drop = tags.findIndex((t) => t.kindId === kindId)
    tags = tags.filter((_, i) => i !== drop)
  }
  return { ...plot, tin, tags }
}

/** Growth this tick for one bed, in hundredths of a point. A greenhouse bed sees only water and the compost. */
export function growthFor(content: LittlePlotCatalog, plot: PlotState, bed: Bed, kind: KindDef, conditions: Conditions, tick: number): number {
  const watered = plot.wateredUntilTick >= tick ? content.wateredPercent : 100
  const structure = growthStructurePercent(content, plot)
  const slowed = (bed.slowUntilTick ?? 0) >= tick ? 50 : 100
  if (bed.greenhouse) return Math.round((100 * watered * structure * slowed) / 100 ** 3)
  if (conditions.frost && !kind.hardy) return 0
  const season = content.seasonGrowthPercent[conditions.season]
  const weather = content.weatherGrowthPercent[conditions.weather]
  const inSeason = kind.sowSeasons === undefined || kind.sowSeasons.includes(conditions.season) ? 100 : content.outOfSeasonPercent
  return Math.round((100 * season * weather * watered * structure * inSeason * slowed) / 100 ** 6)
}

/** Whether the bed may ripen this tick: a night kind waits at bud by day, a seasonal one out of its season. */
function mayRipen(bed: Bed, kind: KindDef, conditions: Conditions): boolean {
  if (bed.greenhouse) return true
  if (kind.night && !isNightish(conditions)) return false
  if (kind.ripenIn && !kind.ripenIn.includes(conditions.season)) return false
  return true
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

export function simulatePlot(input: TickInput): TickResult {
  const { content, tick } = input
  const conditions = conditionsAt(content, input.tickAt, input.utcOffsetSeconds, input.weather)
  if (input.plot.status === 'paused') return { plot: input.plot, events: [], conditions, xpEarned: 0, levelUps: 0, disposition: 'paused' }

  let plot: PlotState = { ...input.plot, ticks: input.plot.ticks + 1 }
  const events: TickEvent[] = []
  let xpEarned = 0
  const growthRng = createRng(input.streams.growth)
  const crossRng = createRng(input.streams.cross)

  // 1. Rain waters the plot for the block.
  if (conditions.weather === 'rain') plot = { ...plot, wateredUntilTick: Math.max(plot.wateredUntilTick, tick), counters: bump(plot.counters, { rainWateredTicks: 1 }) }

  // 2. Growth on every bed, in bed order; the ripenings are settled after.
  const ripenedNow: number[] = []
  const stageLines: TickEvent[] = []
  const beds = plot.beds.map((bed, index) => {
    if (bed.kindId === undefined) return bed
    const kind = kindOf(content, bed.kindId)
    const before = stageOf(bed, kind)
    if (before === 'ripe') return bed
    const gain = growthFor(content, plot, bed, kind, conditions, tick)
    const cap = mayRipen(bed, kind, conditions) ? Number.MAX_SAFE_INTEGER : pointsAtStage(kind, 'ripe') - 1
    const points = Math.min(bed.points + gain, Math.max(bed.points, cap))
    const next: Bed = { ...bed, points }
    const after = stageOf(next, kind)
    if (after === before) return next
    if (after === 'ripe') {
      ripenedNow.push(index)
      return { ...next, ripeSinceTick: tick }
    }
    stageLines.push({ kind: 'stage', summary: fill(pickOne(growthRng, content.stageLines[after as Exclude<Stage, 'sown'>]), { name: kind.name }), detail: { bed: index, kindId: kind.id, stage: after } })
    return next
  })
  plot = { ...plot, beds }

  const ripen = (index: number, kind: KindDef, bed: Bed) => {
    const previous = plot.catalogue[kind.id]
    const first = previous === undefined
    const xp = first ? Math.round((kind.xp * content.firstXpPercent) / 100) : kind.xp
    xpEarned += xp
    plot = {
      ...plot,
      catalogue: { ...plot.catalogue, [kind.id]: { count: (previous?.count ?? 0) + 1, best: previous?.best ?? 0, firstTick: previous?.firstTick ?? tick } },
      counters: {
        ...bump(plot.counters, {
          ripenings: 1,
          nightRipenings: conditions.band === 'night' ? 1 : 0,
          greenhouseRareRipenings: bed.greenhouse && (kind.rarity === 'rare' || kind.rarity === 'epic') ? 1 : 0,
          epicsFound: first && kind.rarity === 'epic' ? 1 : 0,
        }),
        seasonsGrown: plot.counters.seasonsGrown | seasonBit(conditions.season),
      },
    }
    const detail: EventDetail = { bed: index, kindId: kind.id, stage: 'ripe', xp, ...(first ? { first: true } : {}), season: conditions.season }
    events.push({ kind: 'ripe', summary: fill(pickOne(growthRng, content.stageLines.ripe), { name: kind.name }) + (first ? ' A new plant for the catalogue.' : ''), detail })
    if (kind.note && first) events.push({ kind: 'ripe', summary: kind.note, detail: { bed: index, kindId: kind.id } })
  }

  for (const index of ripenedNow) {
    const bed = plot.beds[index]!
    const kind = kindOf(content, bed.kindId!)
    ripen(index, kind, bed)
    // Crossing: a neighbour at bud or ripe whose kind forms a known pair with this one. Volunteers never cross.
    if (bed.volunteer) continue
    const candidates = neighbours(plot, index).flatMap((n) => {
      const other = plot.beds[n]
      if (other?.kindId === undefined) return []
      if (stageIndex(stageOf(other, kindOf(content, other.kindId))) < stageIndex('bud')) return []
      return childrenOf(content, kind.id, other.kindId).filter((child) => child.needs === undefined || plot.items.includes(child.needs))
    })
    if (candidates.length === 0) continue
    const forced = guaranteeLive(content, plot, 'cross')
    if (!forced && crossRng.int(1, 100) > crossPercent(content, plot)) continue
    const child = candidates[0]!
    if (forced) plot = useGuarantee(plot)
    const otherParent = kindOf(content, child.parents![0] === kind.id ? child.parents![1] : child.parents![0])
    plot = { ...plot, beds: plot.beds.map((b, i) => (i === index ? { ...b, crossedKindId: child.id } : b)), counters: bump(plot.counters, { crossesFound: 1 }) }
    events.push({ kind: 'cross', summary: `The ${kind.name} by the ${otherParent.name} has set a seed you don't recognise.`, detail: { bed: index, kindId: kind.id, childKindId: child.id } })
  }
  events.push(...stageLines)

  // The ripe guarantee (goal 2): the most advanced bed ripens when nothing has yet.
  if (ripenedNow.length === 0 && plot.counters.ripenings === 0 && guaranteeLive(content, plot, 'ripe')) {
    const sown = plot.beds.map((b, i) => ({ b, i })).filter(({ b }) => b.kindId !== undefined)
    const best = sown.sort((x, y) => y.b.points / stagePoints(kindOf(content, y.b.kindId!)) - x.b.points / stagePoints(kindOf(content, x.b.kindId!)))[0]
    if (best) {
      const kind = kindOf(content, best.b.kindId!)
      plot = useGuarantee({ ...plot, beds: plot.beds.map((b, i) => (i === best.i ? { ...b, points: pointsAtStage(kind, 'ripe'), ripeSinceTick: tick } : b)) })
      ripen(best.i, kind, plot.beds[best.i]!)
    }
  }

  // 3. Going to seed.
  plot = goToSeed(content, plot, conditions, tick, growthRng, events)

  // A Silver Lavender at bud or ripe through a frost may be left a Frost Rose seed.
  if (conditions.frost && plot.frostWeek !== conditions.week) plot = frostSeeds(content, plot, conditions.week, tick, growthRng, events)

  // The bird table drops one common seed a day, told at dawn.
  if (plot.items.includes('bird_table') && plot.birdTableDay !== conditions.day && conditions.band === 'dawn') {
    const kind = pickOne(growthRng, content.kinds.filter((k) => k.rarity === 'common'))
    const added = addSeed(plot, kind.id, content)
    plot = { ...added.plot, birdTableDay: conditions.day, counters: bump(added.plot.counters, { seedsFound: added.added }) }
    if (added.added > 0) events.push({ kind: 'system', summary: `A ${kind.name} seed on the bird table this morning.`, detail: { kindId: kind.id } })
  }

  // 4. Pests.
  const pest = pests(content, plot, conditions, tick, createRng(input.streams.pest), createRng(input.streams.trap))
  plot = pest.plot
  events.push(...pest.events)

  // 5. The other garden's gnome: the core rolls, the adapter picks the garden and moves the seed.
  let visit: VisitPlan | undefined
  if (conditions.band === 'night') {
    const rng = createRng(input.streams.visitor)
    if (rng.int(1, 1000) <= content.visitor.permille) {
      if (rng.int(1, 100) <= visitorPercent(content, plot)) {
        const trap = createRng(input.streams.trap)
        trap.int(1, 100)
        trap.int(1, 4)
        visit = { trapRoll: trap.int(0, 99), pick: trap.int(0, 2 ** 31 - 1) }
      } else {
        plot = { ...plot, counters: bump(plot.counters, { pestsDeterred: 1 }) }
      }
    }
  }

  // 6. Ambient: every Nth quiet tick writes one line.
  if (events.length === 0) {
    const quietTicks = plot.quietTicks + 1
    plot = { ...plot, quietTicks: quietTicks % content.ambientEvery }
    if (quietTicks % content.ambientEvery === 0) events.push({ kind: 'ambient', summary: pickOne(createRng(input.streams.narrative), content.ambient), detail: { season: conditions.season, weather: conditions.weather, band: conditions.band } })
  } else {
    plot = { ...plot, quietTicks: 0 }
  }

  // XP and levels.
  let levelUps = 0
  if (xpEarned > 0) {
    const levelled = levelFor(plot.xp + xpEarned, plot.level)
    levelUps = levelled.ups
    plot = { ...plot, xp: levelled.xp, level: levelled.level, lifetimeXp: plot.lifetimeXp + xpEarned }
    if (levelUps > 0) events.push({ kind: 'level', summary: `Level ${levelled.level}. The plot is coming on.`, detail: { level: levelled.level } })
  }

  // 7. The goal.
  const goal = evaluateGoal(content, plot)
  plot = goal.plot
  if (goal.event) events.push(goal.event)

  return { plot, events, conditions, xpEarned, levelUps, ...(visit ? { visit } : {}), disposition: 'grew' }
}

/** A ripe bed left long enough goes to seed: a seed into the tin, the bed resown, one in ten as a different common. */
function goToSeed(content: LittlePlotCatalog, plot: PlotState, conditions: Conditions, tick: number, rng: Rng, events: TickEvent[]): PlotState {
  let next = plot
  for (const [index, bed] of plot.beds.entries()) {
    if (bed.kindId === undefined || bed.ripeSinceTick === undefined || tick - bed.ripeSinceTick < content.ripeToSeedTicks) continue
    const kind = kindOf(content, bed.kindId)
    const seeded = addSeed(next, bed.crossedKindId ?? kind.id, content)
    next = seeded.plot
    const wind = kind.rarity === 'common' && rng.int(1, 100) <= content.windPercent
    const inSeason = content.kinds.filter((k) => k.rarity === 'common' && k.id !== kind.id && (k.sowSeasons === undefined || k.sowSeasons.includes(conditions.season)))
    const resow = wind && inSeason.length > 0 ? pickOne(rng, inSeason) : kind
    const volunteer: Bed = { kindId: resow.id, points: 0, sownTick: tick, volunteer: true, ...(bed.greenhouse ? { greenhouse: true } : {}) }
    next = { ...next, beds: next.beds.map((b, i) => (i === index ? volunteer : b)), counters: bump(next.counters, { volunteers: 1, windSeeds: resow.id === kind.id ? 0 : 1 }) }
    const where = seeded.added > 0 ? (bed.crossedKindId ? 'Its strange seed is in the tin.' : 'A seed is in the tin.') : 'The tin is full of them, so the seed is left for the birds.'
    const summary = resow.id === kind.id ? `The ${kind.name} went to seed and sowed itself again. ${where}` : `The ${kind.name} went to seed. ${where} Something the wind brought in is coming up in its place: a ${resow.name}.`
    events.push({ kind: 'seeded', summary, detail: { bed: index, kindId: kind.id, ...(bed.crossedKindId ? { childKindId: bed.crossedKindId } : {}) } })
  }
  return next
}

function frostSeeds(content: LittlePlotCatalog, plot: PlotState, week: number, tick: number, rng: Rng, events: TickEvent[]): PlotState {
  let next: PlotState = { ...plot, frostWeek: week }
  for (const kind of content.kinds.filter((k) => k.source === 'frost' && k.parents)) {
    const parent = kind.parents![0]
    const bed = next.beds.findIndex((b) => b.kindId === parent && !b.greenhouse && stageIndex(stageOf(b, kindOf(content, parent))) >= stageIndex('bud'))
    if (bed < 0 || (next.tin[kind.id] ?? 0) > 0 || next.catalogue[kind.id] !== undefined) continue
    rng.int(1, 100)
    const added = addSeed(next, kind.id, content)
    if (added.added === 0) continue
    next = { ...added.plot, counters: bump(added.plot.counters, { seedsFound: 1 }) }
    events.push({ kind: 'frost', summary: `Frost on the ${kindOf(content, parent).name}. In the morning there is a seed on the soil that was not there before.`, detail: { bed, kindId: kind.id } })
  }
  return next
}

/** The pest draw: base chance by band, the pest, the defences, then its target. At most one event. */
function pests(content: LittlePlotCatalog, plot: PlotState, conditions: Conditions, tick: number, rng: Rng, trap: Rng): { plot: PlotState; events: TickEvent[] } {
  const rule = content.pestRule
  const events: TickEvent[] = []
  let base = rule.basePermille[conditions.band]
  if (conditions.band === 'night') base += rule.gnomePerBedPermille * Math.max(0, plot.beds.length - 6)
  if (rng.int(1, 1000) > base) return { plot, events }

  const table = rule.table[conditions.band].map(([id, weight]) => {
    let w = weight
    if (id === 'slugs' && conditions.weather === 'overcast') w = Math.round((w * rule.overcastSlugsPercent) / 100)
    if (id === 'birds' && conditions.weather === 'rain') w = Math.round((w * rule.rainBirdsPercent) / 100)
    if (id === 'gnome' && conditions.weather === 'fog') w = Math.round((w * rule.fogGnomePercent) / 100)
    if (id === 'aphids' && conditions.season === 'summer') w = Math.round((w * rule.summerAphidsPercent) / 100)
    return [id, Math.max(1, w)] as const
  })
  const pest: PestId = pickWeighted(rng, table)

  if (rng.int(1, 100) > pestPercent(content, plot, pest, conditions, tick)) {
    const deterred: PlotState = { ...plot, counters: bump(plot.counters, { pestsDeterred: 1 }) }
    // One deterred pest in four is told, so the defences are seen working without filling the log.
    if (rng.int(1, 4) === 1) {
      const defence = content.items.find((i) => plot.items.includes(i.id) && i.effects.pests?.[pest] !== undefined)
      if (defence) events.push({ kind: 'deterred', summary: fill(pickOne(rng, content.deterredLines), { pest: content.pests.find((p) => p.id === pest)?.name ?? pest, item: defence.name }), detail: { pest, item: defence.id } })
    }
    return { plot: deterred, events }
  }

  const apply = (effect: PestEffect, patch: Partial<PlotState>, vars: Record<string, string>, detail: EventDetail): PlotState => {
    events.push({ kind: 'pest', summary: fill(pickOne(rng, content.pestLines[effect]), vars), detail: { pest, effect, ...detail } })
    const counters = bump(patch.counters ?? plot.counters, { pestEvents: 1 })
    return { ...plot, ...patch, counters }
  }
  const named = (i: number) => kindOf(content, plot.beds[i]!.kindId!).name
  const setBack = (i: number, stages: number): Bed[] =>
    plot.beds.map((b, j) => {
      if (j !== i) return b
      const kind = kindOf(content, b.kindId!)
      const target = STAGES[Math.max(0, stageIndex(stageOf(b, kind)) - stages)]!
      const { ripeSinceTick: _r, ...rest } = b
      return { ...rest, points: pointsAtStage(kind, target) }
    })
  const at = (stages: readonly Stage[]) => plot.beds.flatMap((b, i) => (b.kindId !== undefined && stages.includes(stageOf(b, kindOf(content, b.kindId))) ? [i] : []))

  switch (pest) {
    case 'slugs': {
      const targets = at(['sprout', 'leaf'])
      if (targets.length === 0) return { plot, events }
      const i = pickOne(rng, targets)
      return { plot: apply('slugs', { beds: setBack(i, 1) }, { name: named(i) }, { bed: i, kindId: plot.beds[i]!.kindId! }), events }
    }
    case 'aphids': {
      const targets = at(['sprout', 'leaf', 'bud'])
      if (targets.length === 0) return { plot, events }
      const i = pickOne(rng, targets)
      return { plot: apply('aphids', { beds: plot.beds.map((b, j) => (j === i ? { ...b, slowUntilTick: tick + rule.aphidTicks } : b)) }, { name: named(i) }, { bed: i, kindId: plot.beds[i]!.kindId! }), events }
    }
    case 'birds': {
      const commons = Object.keys(plot.tin)
        .filter((id) => (plot.tin[id] ?? 0) > 0 && kindOf(content, id).rarity === 'common')
        .sort()
      if (commons.length === 0) return { plot, events }
      const id = pickOne(rng, commons)
      const taken = removeSeed(plot, id)
      return { plot: apply('birds_tin', { tin: taken.tin, tags: taken.tags, counters: bump(plot.counters, { seedsLost: 1 }) }, { seed: kindOf(content, id).name }, { kindId: id }), events }
    }
    case 'fox': {
      const targets = at(['sprout', 'leaf', 'bud'])
      if (targets.length === 0) return { plot, events }
      const i = pickOne(rng, targets)
      return { plot: apply('fox', { beds: setBack(i, 2) }, { name: named(i) }, { bed: i, kindId: plot.beds[i]!.kindId! }), events }
    }
    case 'heron': {
      if (!plot.items.includes('pond') || plot.heronWeek === conditions.week) return { plot, events }
      return { plot: apply('heron', { heronUntilTick: tick + rule.heronTicks, heronWeek: conditions.week }, {}, {}), events }
    }
    case 'gnome': {
      const catchPercent = trapPercent(content, plot)
      const forced = catchPercent > 0 && guaranteeLive(content, plot, 'trap')
      if (catchPercent > 0 && (forced || trap.int(1, 100) <= catchPercent)) {
        let next = forced ? useGuarantee(plot) : plot
        const cap = content.kinds.find((k) => k.source === 'trap')
        const drop = cap !== undefined && trap.int(1, 4) === 1
        if (cap && drop) {
          const added = addSeed(next, cap.id, content)
          next = { ...added.plot, counters: bump(added.plot.counters, { seedsFound: added.added }) }
        }
        next = { ...next, counters: bump(next.counters, { gnomesCaught: 1, pestEvents: 1 }) }
        events.push({ kind: 'pest', summary: pickOne(rng, content.pestLines.gnome_caught) + (cap && drop ? ` It dropped a ${cap.name} seed on its way out.` : ''), detail: { pest, effect: 'gnome_caught', ...(cap && drop ? { kindId: cap.id } : {}) } })
        return { plot: next, events }
      }
      const spare = Object.keys(plot.tin)
        .filter((id) => (plot.tin[id] ?? 0) >= 2 && (kindOf(content, id).rarity === 'common' || kindOf(content, id).rarity === 'uncommon'))
        .sort()
      const movable = at(['sown', 'sprout'])
      const empties = emptyBeds(plot)
      const ornaments = plot.items.filter((id) => content.items.find((i) => i.id === id)?.group === 'ornament')
      const options: Array<'seed' | 'move' | 'turn'> = []
      if (spare.length > 0) options.push('seed')
      if (movable.length > 0 && empties.length > 0) options.push('move')
      if (ornaments.length > 0) options.push('turn')
      if (options.length === 0) return { plot, events }
      const choice = pickOne(rng, options)
      if (choice === 'seed') {
        const id = pickOne(rng, spare)
        const taken = removeSeed(plot, id)
        return { plot: apply('gnome_seed', { tin: taken.tin, tags: taken.tags, counters: bump(plot.counters, { seedsLost: 1 }) }, { seed: kindOf(content, id).name }, { kindId: id }), events }
      }
      if (choice === 'move') {
        const from = pickOne(rng, movable)
        const to = pickOne(rng, empties)
        const moved = plot.beds[from]!
        const beds = plot.beds.map((b, i) => {
          if (i === from) return { points: 0, sownTick: tick, ...(b.greenhouse ? { greenhouse: true as const } : {}) }
          if (i === to) {
            const { greenhouse: _g, ...rest } = moved
            return { ...rest, ...(b.greenhouse ? { greenhouse: true as const } : {}) }
          }
          return b
        })
        return { plot: apply('gnome_move', { beds }, { name: named(from) }, { bed: to, kindId: moved.kindId! }), events }
      }
      const item = content.items.find((i) => i.id === pickOne(rng, ornaments))!
      return { plot: apply('gnome_turn', {}, { item: item.name }, { item: item.id }), events }
    }
  }
}
