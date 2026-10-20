import { createRng, pickOne, pickWeighted, type Rng } from '@trmnl-games/engine/rng'
import { BAND_PHRASE, effectiveBands, localHour, timeBand } from './conditions'
import { articleFor, fishValue, formatWeight } from './progress'
import { speciesLogged, titleFor, waterRankAt, waterRankName } from './titles'
import { evaluateGoal, guaranteedBite, unlockEvents } from './goals'
import { orderDay, refillOrders } from './orders'
import { SEASON_BIT, runAt, seasonAt, waterOpenIn } from './seasons'
import type { AnglerCounters, AnglerState, BaitClass, CastInput, CastResult, Conditions, IdleAnglerCatalog, SpeciesDef, TickEvent, WaterDef } from './types'

/**
 * The Idle Angler pure core (idle-angler.md "The cast"). One evaluation per eligible
 * tick, in a fixed order: conditions, bite, species, weight, landing, logbook and
 * milestones, cooler, bait. Pure: no clock, no network, no storage; the adapter passes
 * the wall slot, offset, weather and stream seeds in. A kept fish or one that
 * gets away uses one unit of bait; a quiet cast or a release uses none.
 *
 * Draw order (part of the simulation version): `bite` draws once per cast;
 * `species` draws once after a bite; `size` draws once after a species;
 * `narrative` draws only to pick an ambient line.
 */
export const SIMULATION_VERSION = 1

export class IdleAnglerInvariantError extends Error {
  constructor(readonly code: string, message: string) {
    super(message)
  }
}

export function waterOf(content: IdleAnglerCatalog, id: string): WaterDef {
  const water = content.waters.find((w) => w.id === id)
  if (!water) throw new IdleAnglerInvariantError('UNKNOWN_WATER', `unknown water ${id}`)
  return water
}

export function rodOf(content: IdleAnglerCatalog, tier: number) {
  const rod = content.rods.find((r) => r.tier === tier)
  if (!rod) throw new IdleAnglerInvariantError('UNKNOWN_ROD', `unknown rod tier ${tier}`)
  return rod
}

export function coolerOf(content: IdleAnglerCatalog, tier: number) {
  const cooler = content.coolers.find((c) => c.tier === tier)
  if (!cooler) throw new IdleAnglerInvariantError('UNKNOWN_COOLER', `unknown cooler tier ${tier}`)
  return cooler
}

export function baitOf(content: IdleAnglerCatalog, cls: BaitClass) {
  const bait = content.baits.find((b) => b.class === cls)
  if (!bait) throw new IdleAnglerInvariantError('UNKNOWN_BAIT', `unknown bait ${cls}`)
  return bait
}

/** The bait actually on the hook at this water: the chosen class, if the water takes it and the tub is not empty. */
export function activeBait(angler: Pick<AnglerState, 'baitOnHook' | 'bait'>, water: WaterDef): BaitClass | undefined {
  const chosen = angler.baitOnHook
  if (chosen === undefined || !water.baits.includes(chosen)) return undefined
  return (angler.bait[chosen] ?? 0) > 0 ? chosen : undefined
}

/**
 * Bite chance in permille for these conditions (each multiplier a whole percent, floored once at the end). Content v2
 * adds the season's percent and deadbait's; v1 has neither and keeps its formula exactly.
 */
export function bitePermille(content: IdleAnglerCatalog, water: WaterDef, rodTier: number, bait: BaitClass | undefined, conditions: Conditions): number {
  const rod = rodOf(content, rodTier)
  const baitPercent = bait === undefined ? content.bareHookPercent : bait === 'deadbait' ? (content.deadbait?.bitePercent ?? 100) : 100
  const base = water.biteBasePermille * water.timePercent[conditions.band] * water.weatherPercent[conditions.weather] * (100 + rod.biteBonusPercent) * baitPercent
  if (water.seasonPercent === undefined || conditions.season === undefined) return Math.floor(base / 100 ** 4)
  return Math.floor((base * water.seasonPercent[conditions.season]) / 100 ** 5)
}

/** Species that could take this cast, with their draw weights. */
export function candidates(content: IdleAnglerCatalog, water: WaterDef, bait: BaitClass | undefined, conditions: Conditions): Array<readonly [SpeciesDef, number]> {
  const bands = effectiveBands(conditions.band, conditions.weather)
  const run = conditions.run === undefined ? undefined : content.runs?.find((r) => r.id === conditions.run)
  return content.species
    .filter((s) => s.water === water.id)
    .filter((s) => (bait === undefined ? s.anyBait === true : s.baits.includes(bait)))
    .filter((s) => s.times === undefined || s.times.some((t) => bands.includes(t)))
    .filter((s) => s.weather === undefined || s.weather.includes(conditions.weather) || (run?.species === s.id && run.anyWeather === true))
    .filter((s) => s.seasons === undefined || (conditions.season !== undefined && s.seasons.includes(conditions.season)))
    .map((s) => {
      const weight = s.weight ?? content.rarityWeights[s.rarity]
      return [s, run?.species === s.id ? Math.round((weight * run.weightPercent) / 100) : weight] as const
    })
}

/**
 * Skewed weight: most fish in the lower third of the range, a long tail to the maximum. One draw. Deadbait (v2) maps the
 * same draw through a square root, which leaves it even across the range, so predators on deadbait run heavier.
 */
export function drawGrams(rng: Rng, species: SpeciesDef, bait?: BaitClass): number {
  const u = rng.next()
  const share = bait === 'deadbait' ? u : u * u
  return species.minGrams + Math.floor((species.maxGrams - species.minGrams) * share)
}

const NO_METRICS = { landed: 0, released: 0, gotAway: 0 } as const

function bump(counters: AnglerCounters, patch: Partial<Record<keyof AnglerCounters, number>>): AnglerCounters {
  const next = { ...counters } as Record<keyof AnglerCounters, number>
  for (const [key, add] of Object.entries(patch) as Array<[keyof AnglerCounters, number]>) next[key] = (next[key] ?? 0) + add
  return next
}

export function conditionsAt(input: Pick<CastInput, 'tickAt' | 'utcOffsetSeconds' | 'weather' | 'content'>, waterId?: string): Conditions {
  const band = timeBand(localHour(input.tickAt, input.utcOffsetSeconds), input.content)
  const season = seasonAt(input.content, input.tickAt)
  if (season === undefined) return { band, weather: input.weather }
  const run = waterId === undefined ? undefined : runAt(input.content, waterId, input.tickAt)
  return { band, weather: input.weather, season, ...(run ? { run: run.id } : {}) }
}

/**
 * Content v2's steps after an evaluation: the goal (D128 shape) and the fishmonger's refill at the owner's 07:00, both
 * after the cast so an unlock and its first slate arrive together. v1 has neither rule and returns the result as is.
 */
function finish(input: CastInput, result: CastResult): CastResult {
  const { content } = input
  if (content.goals === undefined && content.orders === undefined) return result
  let angler = refillOrders(content, result.angler, orderDay(content, input.tickAt, input.utcOffsetSeconds), input.streams.orders)
  const goal = evaluateGoal(content, angler)
  angler = goal.angler
  const extraEvents = goal.event ? [...(result.extraEvents ?? []), goal.event] : result.extraEvents
  return { ...result, angler, ...(extraEvents ? { extraEvents } : {}) }
}

const RETURN_LINE: Readonly<Record<string, string>> = {
  frozen_tarn: 'The ice is going out. You walk back to Heron Lake.',
  deep_sea: 'The charter ties up. You walk back along the Harbour Pier.',
}

export function simulateAngler(input: CastInput): CastResult {
  if (input.angler.status === 'paused') return { angler: input.angler, conditions: conditionsAt(input, input.angler.waterId), metrics: NO_METRICS, disposition: 'paused' }
  return finish(input, cast(input))
}

function cast(input: CastInput): CastResult {
  const { content, tick } = input
  let angler = input.angler
  let conditions = conditionsAt(input, angler.waterId)

  // v2: a seasonal water that has closed, or a charter whose ticket is spent, sends the angler back (D162).
  const here = waterOf(content, angler.waterId)
  let returnLine: string | undefined
  if (angler.travelTo === undefined && here.returnsTo !== undefined && (!waterOpenIn(here, conditions.season) || (here.charter && (angler.charterCasts ?? 0) <= 0))) {
    angler = { ...angler, travelTo: here.returnsTo }
    returnLine = RETURN_LINE[here.id]
  }

  // Travel takes the whole tick: arrive, no cast (idle-angler.md "Waters").
  if (angler.travelTo !== undefined) {
    const to = waterOf(content, angler.travelTo)
    const { travelTo: _drop, ...rest } = angler
    angler = { ...rest, waterId: to.id, quietTicks: 0, counters: bump(angler.counters, { trips: 1 }) }
    const summary = returnLine ?? to.arrival ?? `You set up on the bank at ${to.the}.`.replace('on the bank at the Harbour Pier', 'at the end of the Harbour Pier')
    const event: TickEvent = { kind: 'travel', summary, detail: { waterId: to.id }, deltas: { gold: 0 } }
    return { angler, event, conditions: conditionsAt(input, to.id), metrics: NO_METRICS, disposition: 'travelled' }
  }

  const water = here
  const bait = activeBait(angler, water)
  const extraEvents: TickEvent[] = []

  // v2: a run announces itself on its first cast at the water.
  const run = conditions.run === undefined ? undefined : content.runs?.find((r) => r.id === conditions.run)
  if (run) {
    const seen = `${run.id}:${Math.floor(input.tickAt / 86_400_000 / 7)}`
    if (angler.runSeen !== seen) {
      angler = { ...angler, runSeen: seen }
      extraEvents.push({ kind: 'run', summary: run.line, detail: { waterId: water.id, runId: run.id }, deltas: { gold: 0 } })
    }
  }
  // v2: each cast at sea spends one cast of the charter ticket, bite or not.
  if (water.charter) angler = { ...angler, charterCasts: Math.max(0, (angler.charterCasts ?? 0) - 1) }

  const forced = content.goals !== undefined && guaranteedBite(content, angler, bait)
  angler = { ...angler, counters: bump(angler.counters, { casts: 1 }) }

  const biteRng = createRng(input.streams.bite)
  const bit = biteRng.int(1, 1000) <= bitePermille(content, water, angler.rodTier, bait, conditions) || forced
  const pool = bit ? candidates(content, water, bait, conditions) : []
  if (pool.length === 0) {
    // Quiet: every Nth quiet tick writes one ambient line so the story never goes stale for long.
    const quietTicks = angler.quietTicks + 1
    angler = { ...angler, quietTicks: quietTicks % content.ambientEvery }
    const event: TickEvent | undefined =
      quietTicks % content.ambientEvery === 0
        ? { kind: 'ambient', summary: pickOne(createRng(input.streams.narrative), content.ambient[water.id] ?? []), detail: { waterId: water.id, ...conditions }, deltas: { gold: 0 } }
        : undefined
    return { angler, ...(event ? { event } : {}), ...(extraEvents.length ? { extraEvents } : {}), conditions, metrics: NO_METRICS, disposition: 'cast' }
  }

  angler = { ...angler, quietTicks: 0, counters: bump(angler.counters, { bites: 1 }) }
  const rod = rodOf(content, angler.rodTier)
  // v5 (D199): a goal's guaranteed bite is a fish the rod can land, so "Land your first fish" lands one on the first cast.
  const landable = forced && content.starterGoal === true
  const fits = landable ? pool.filter(([s]) => s.minGrams <= rod.limitGrams) : pool
  const species = pickWeighted(createRng(input.streams.species), fits.length > 0 ? fits : pool)
  const drawn = drawGrams(createRng(input.streams.size), species, bait)
  const grams = landable ? Math.min(drawn, rod.limitGrams) : drawn
  const capacity = coolerOf(content, angler.coolerTier).capacity
  const kept = input.coolerCount < capacity
  const escapes = grams > rod.limitGrams
  // Bait: a fish that is kept or gets away takes one unit; a fish released from a full cooler leaves it on
  // the hook, so an angler between visits spends nothing (S1 change from the spec's per-cast use).
  if (bait !== undefined && (kept || escapes)) {
    const left = (angler.bait[bait] ?? 0) - 1
    angler = { ...angler, bait: { ...angler.bait, [bait]: left } }
    if (left === 0) {
      angler = { ...angler, counters: bump(angler.counters, { baitRunOuts: 1 }) }
      extraEvents.push({ kind: 'bait_out', summary: `The ${baitOf(content, bait).name.toLowerCase()} ran out. Fishing a bare hook.`, detail: { bait }, deltas: { gold: 0 } })
    }
  }
  const baitPhrase = bait === undefined ? 'a bare hook' : baitOf(content, bait).the

  if (escapes) {
    angler = { ...angler, counters: bump(angler.counters, { gotAway: 1 }) }
    const event: TickEvent = { kind: 'got_away', summary: `Something heavy took ${baitPhrase} and kept going.`, detail: { speciesId: species.id, grams, waterId: water.id, ...conditions }, deltas: { gold: 0 } }
    return { angler, event, ...(extraEvents.length ? { extraEvents } : {}), conditions, metrics: { ...NO_METRICS, gotAway: 1 }, disposition: 'cast' }
  }

  // Landed: logbook, then the cooler or a release.
  const previous = angler.logbook[species.id]
  const record = previous !== undefined && grams > previous.bestGrams
  const firstOfSpecies = previous === undefined
  angler = {
    ...angler,
    logbook: { ...angler.logbook, [species.id]: { count: (previous?.count ?? 0) + 1, bestGrams: Math.max(previous?.bestGrams ?? 0, grams), firstTick: previous?.firstTick ?? tick } },
    counters: bump(angler.counters, {
      fishCaught: 1,
      rareCaught: species.rarity === 'rare' || species.rarity === 'epic' ? 1 : 0,
      epicCaught: species.rarity === 'epic' ? 1 : 0,
      nightCatches: conditions.band === 'night' ? 1 : 0,
    }),
  }
  if (conditions.season !== undefined) {
    // v2 counters for goals and achievements; v1 conditions carry no season and skip this.
    const runIndex = run?.species === species.id ? (content.runs ?? []).indexOf(run) : -1
    angler = {
      ...angler,
      counters: {
        ...bump(angler.counters, {
          breadCatches: bait === 'bread' ? 1 : 0,
          deadbaitCatches: bait === 'deadbait' ? 1 : 0,
          dawnDuskCatches: conditions.band === 'dawn' || conditions.band === 'dusk' ? 1 : 0,
          rainCatches: conditions.weather === 'rain' ? 1 : 0,
        }),
        seasonsFished: (angler.counters.seasonsFished ?? 0) | SEASON_BIT[conditions.season],
        runsFished: (angler.counters.runsFished ?? 0) | (runIndex >= 0 ? 1 << runIndex : 0),
      },
    }
  }
  if (grams > angler.counters.heaviestGrams) angler = { ...angler, counters: { ...angler.counters, heaviestGrams: grams } }

  const value = fishValue(species.price, grams, species.maxGrams)
  const weight = formatWeight(grams)
  const lead = `${articleFor(weight)} ${weight} ${species.name}`
  const tail = record ? ' A new personal best.' : firstOfSpecies ? ` First ${species.name} in the logbook.` : ''
  const detail = { speciesId: species.id, grams, value, record, firstOfSpecies, waterId: water.id, ...(bait ? { bait } : {}), ...conditions }
  let event: TickEvent
  let catchRecord
  if (kept) {
    catchRecord = { speciesId: species.id, grams, value, caughtTick: tick, ...(conditions.season !== undefined ? { band: conditions.band, weather: conditions.weather, season: conditions.season } : {}) }
    event = { kind: 'catch', summary: `${lead} took ${baitPhrase} ${BAND_PHRASE[conditions.band]}.${tail}`, detail, deltas: { gold: 0 } }
  } else {
    angler = { ...angler, counters: bump(angler.counters, { released: 1 }) }
    event = { kind: 'release', summary: `Cooler full. Released ${lead.charAt(0).toLowerCase()}${lead.slice(1)}.${tail}`, detail, deltas: { gold: 0 } }
  }
  if (firstOfSpecies) extraEvents.push(...logbookEvents(content, angler, species))
  return {
    angler,
    ...(catchRecord ? { catch: catchRecord } : {}),
    event,
    ...(extraEvents.length ? { extraEvents } : {}),
    conditions,
    metrics: { landed: 1, released: kept ? 0 : 1, gotAway: 0 },
    disposition: 'cast',
  }
}

/**
 * A new species can earn a title, a rank at its water (v6) and open a water (titles.ts), each told as its own milestone story.
 */
function logbookEvents(content: IdleAnglerCatalog, angler: AnglerState, species: SpeciesDef): TickEvent[] {
  const events: TickEvent[] = []
  const total = speciesLogged(content, angler.logbook)
  const title = titleFor(total)
  if (titleFor(total - 1).id !== title.id) events.push({ kind: 'milestone', summary: `Now a ${title.name}, with ${total} species in the logbook.`, detail: {}, deltas: { gold: 0 } })
  events.push(...unlockEvents(content, total))
  const here = speciesLogged(content, angler.logbook, species.water)
  if (content.waterRanks) {
    const total = content.species.filter((s) => s.water === species.water).length
    const rank = waterRankAt(here, total).rank
    if (waterRankAt(here - 1, total).rank.id !== rank.id) {
      const article = rank.name.startsWith('A') || rank.name.startsWith('E') ? 'an' : 'a'
      events.push({ kind: 'milestone', summary: `Now ${article} ${waterRankName(rank, waterOf(content, species.water))}, with ${here} of ${total} species logged there.`, detail: { waterId: species.water }, deltas: { gold: 0 } })
    }
  }
  for (const water of content.waters) {
    if (water.opensAfter?.water !== species.water || water.opensAfter.species !== here) continue
    const access = water.access ? content.access.find((a) => a.id === water.access) : undefined
    const from = waterOf(content, species.water).name
    const needs = access && !angler.access.includes(access.id) ? ` with the ${access.name}` : ''
    events.push({ kind: 'milestone', summary: `${here} ${from} species logged. ${water.name} is open${needs}.`, detail: { waterId: water.id }, deltas: { gold: 0 } })
  }
  return events
}
