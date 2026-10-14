import { createRng, pickWeighted, type Rng } from '@trmnl-games/engine/rng'
import { unlocked } from './goals'
import { canFish, rodOf } from './shop'
import type { AnglerState, CatchRecord, IdleAnglerCatalog, Order, OrderKind, SpeciesDef, TimeBand, WaterDef } from './types'

/**
 * Fishmonger orders (D162, idle-angler-full.md "Fishmonger orders"): three orders filled by hand from the cooler for
 * more than the market pays. They never expire; an empty slot refills at the owner's 07:00, at most once a day, and one
 * swap a day replaces an order. Orders never name a fish that feeds only in some seasons, and at most one slot names a
 * species the logbook does not have yet (a teaching order), which is how the game teaches bait and time of day.
 */

const DAY_MS = 86_400_000
const HOUR_MS = 3_600_000

/** The refill day a moment belongs to: local days that start at the refill hour. */
export function orderDay(content: Pick<IdleAnglerCatalog, 'orders'>, at: number, utcOffsetSeconds: number | undefined): number {
  const hour = content.orders?.refillHour ?? 0
  return Math.floor((at + (utcOffsetSeconds ?? 0) * 1000 - hour * HOUR_MS) / DAY_MS)
}

const speciesById = (content: IdleAnglerCatalog, id: string) => content.species.find((s) => s.id === id)

/** Year-round waters the angler can fish, the only ones orders name (no charter, no seasonal water). */
function orderWaters(content: IdleAnglerCatalog, angler: AnglerState): WaterDef[] {
  return content.waters.filter((w) => !w.charter && w.openIn === undefined && canFish(content, angler, w.id))
}

function orderSpecies(content: IdleAnglerCatalog, angler: AnglerState): SpeciesDef[] {
  const waters = new Set(orderWaters(content, angler).map((w) => w.id))
  const limit = rodOf(content, angler.rodTier).limitGrams
  return content.species.filter((s) => waters.has(s.water) && s.seasons === undefined && s.rarity !== 'epic' && s.minGrams <= limit)
}

const roundTo100 = (grams: number) => Math.max(100, Math.round(grams / 100) * 100)
const sameTarget = (a: Order, b: Order) => a.kind === b.kind && a.speciesId === b.speciesId && a.water === b.water && a.minGrams === b.minGrams && a.rarity === b.rarity && String(a.bands) === String(b.bands)

function candidatesFor(content: IdleAnglerCatalog, angler: AnglerState, kind: OrderKind, id: string): Order[] {
  const rule = content.orders!
  const bonus = rule.bonus[kind]
  const pool = orderSpecies(content, angler)
  const logged = pool.filter((s) => angler.logbook[s.id] !== undefined)
  switch (kind) {
    case 'species':
      return logged.map((s) => ({ id, kind, bonus, speciesId: s.id, count: s.rarity === 'common' ? 2 : 1 }))
    case 'teaching':
      return pool.filter((s) => angler.logbook[s.id] === undefined && s.rarity !== 'rare').map((s) => ({ id, kind, bonus, speciesId: s.id, count: 1 }))
    case 'weight': {
      const limit = rodOf(content, angler.rodTier).limitGrams
      return logged.filter((s) => s.maxGrams * 0.5 <= limit && s.maxGrams >= 1000).map((s) => ({ id, kind, bonus, minGrams: roundTo100(s.maxGrams * 0.5), count: 1 }))
    }
    case 'water':
      return orderWaters(content, angler)
        .filter((w) => logged.filter((s) => s.water === w.id).length >= 3)
        .map((w) => ({ id, kind, bonus, water: w.id, count: 3 }))
    case 'time': {
      const out: Order[] = []
      const feeds = (bands: readonly TimeBand[]) => logged.some((s) => s.times === undefined || s.times.some((t) => bands.includes(t)))
      if (feeds(['night'])) out.push({ id, kind, bonus, bands: ['night'], count: 2 })
      if (feeds(['dawn', 'dusk'])) out.push({ id, kind, bonus, bands: ['dawn', 'dusk'], count: 2 })
      return out
    }
    case 'rarity': {
      const out: Order[] = []
      if (logged.some((s) => s.rarity === 'uncommon')) out.push({ id, kind, bonus, rarity: 'uncommon', count: 1 })
      if (logged.some((s) => s.rarity === 'rare')) out.push({ id, kind, bonus: bonus * 2, rarity: 'rare', count: 1 })
      return out
    }
  }
}

/** One new order for a slot, never repeating one already on the slate. Undefined when nothing fits yet. */
export function drawOrder(content: IdleAnglerCatalog, angler: AnglerState, slate: readonly Order[], rng: Rng, id: string): Order | undefined {
  const rule = content.orders
  if (!rule) return undefined
  const teachingOn = slate.some((o) => o.kind === 'teaching')
  const kinds = (Object.entries(rule.weights) as Array<[OrderKind, number]>).filter(([kind, w]) => w > 0 && !(kind === 'teaching' && teachingOn))
  const options = kinds
    .map(([kind, w]) => [kind, w, candidatesFor(content, angler, kind, id).filter((o) => !slate.some((s) => sameTarget(s, o)))] as const)
    .filter(([, , list]) => list.length > 0)
  if (options.length === 0) return undefined
  const [, , list] = pickWeighted(rng, options.map((o) => [o, o[1]] as const))
  return list[rng.int(0, list.length - 1)]
}

/** The refill: every empty slot gets an order, once per refill day, while orders are unlocked. */
export function refillOrders(content: IdleAnglerCatalog, angler: AnglerState, day: number, seed: number | undefined): AnglerState {
  const rule = content.orders
  if (!rule || seed === undefined || angler.ordersDay === day || !unlocked(content, angler, 'orders')) return angler
  const rng = createRng(seed)
  const slate = [...(angler.orders ?? [])]
  for (let slot = 0; slate.length < rule.slots && slot < rule.slots; slot += 1) {
    const order = drawOrder(content, angler, slate, rng, `${day}-${slot}`)
    if (order) slate.push(order)
  }
  return { ...angler, orders: slate, ordersDay: day }
}

export function catchMatches(content: IdleAnglerCatalog, order: Order, fish: Pick<CatchRecord, 'speciesId' | 'grams' | 'band'>): boolean {
  const species = speciesById(content, fish.speciesId)
  if (!species) return false
  switch (order.kind) {
    case 'species':
    case 'teaching':
      return fish.speciesId === order.speciesId
    case 'weight':
      return fish.grams >= (order.minGrams ?? Infinity)
    case 'water':
      return species.water === order.water
    case 'time':
      return fish.band !== undefined && (order.bands ?? []).includes(fish.band)
    case 'rarity':
      return species.rarity === order.rarity
  }
}

export type OrderRefusal = 'UNKNOWN' | 'WRONG_FISH' | 'WRONG_COUNT' | 'LOCKED' | 'SWAPPED_TODAY' | 'NOTHING_ELSE'

/** What handing these fish over would pay: their value at the order's rate, plus its bonus. */
export function orderReward(content: IdleAnglerCatalog, order: Order, fish: readonly Pick<CatchRecord, 'value'>[]): number {
  const value = fish.reduce((sum, f) => sum + f.value, 0)
  return Math.round((value * (content.orders?.multiplierPercent ?? 100)) / 100) + order.bonus
}

/** Hand fish over for an order: exactly its count, each matching. The slot stays empty until the next refill. */
export function fillOrder(content: IdleAnglerCatalog, angler: AnglerState, orderId: string, fish: readonly CatchRecord[]): { ok: true; angler: AnglerState; earned: number } | { ok: false; code: OrderRefusal } {
  const order = angler.orders?.find((o) => o.id === orderId)
  if (!order) return { ok: false, code: 'UNKNOWN' }
  if (fish.length !== order.count) return { ok: false, code: 'WRONG_COUNT' }
  if (!fish.every((f) => catchMatches(content, order, f))) return { ok: false, code: 'WRONG_FISH' }
  const earned = orderReward(content, order, fish)
  const counters = angler.counters
  return {
    ok: true,
    earned,
    angler: {
      ...angler,
      gold: angler.gold + earned,
      orders: (angler.orders ?? []).filter((o) => o.id !== orderId),
      counters: { ...counters, ordersFilled: (counters.ordersFilled ?? 0) + 1, goldEarned: counters.goldEarned + earned, fishSold: counters.fishSold + fish.length },
    },
  }
}

/** The day's one swap: the order is replaced from `seed` straight away (the intent derives it; the core never sees it). */
export function swapOrder(content: IdleAnglerCatalog, angler: AnglerState, orderId: string, day: number, seed: number): { ok: true; angler: AnglerState } | { ok: false; code: OrderRefusal } {
  if (!unlocked(content, angler, 'orders')) return { ok: false, code: 'LOCKED' }
  if (angler.swapDay === day) return { ok: false, code: 'SWAPPED_TODAY' }
  const slate = angler.orders ?? []
  const index = slate.findIndex((o) => o.id === orderId)
  if (index < 0) return { ok: false, code: 'UNKNOWN' }
  const replacement = drawOrder(content, angler, slate, createRng(seed), `${day}-s${index}`)
  if (!replacement) return { ok: false, code: 'NOTHING_ELSE' }
  return { ok: true, angler: { ...angler, orders: slate.map((o, i) => (i === index ? replacement : o)), swapDay: day } }
}
