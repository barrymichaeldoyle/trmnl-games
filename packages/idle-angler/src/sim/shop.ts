import { unlocked } from './goals'
import { seasonAt, waterOpenIn } from './seasons'
import { coolerOf, rodOf, waterOf } from './simulate'
import { waterKnown } from './titles'
import type { AccessId, AnglerState, BaitClass, CatchRecord, IdleAnglerCatalog, WaterId } from './types'

/**
 * Companion purchase and setup rules (idle-angler.md "Selling and the shop"), pure so the intents and
 * the harness share them. Each returns the new angler or a refusal code; nothing here reads storage.
 */
export type ShopRefusal = 'NOT_ENOUGH_GOLD' | 'MAX_TIER' | 'ALREADY_OWNED' | 'BAIT_FULL' | 'LOCKED' | 'UNKNOWN' | 'SAME_WATER' | 'NOT_USED_HERE' | 'CLOSED' | 'NO_TICKET' | 'TICKET_HELD' | 'TOO_SMALL' | 'WALL_FULL' | 'NOT_BAIT_FISH'
export type ShopResult = { readonly ok: true; readonly angler: AnglerState; readonly spent: number } | { readonly ok: false; readonly code: ShopRefusal }

const refuse = (code: ShopRefusal): ShopResult => ({ ok: false, code })

export function nextRod(content: IdleAnglerCatalog, angler: AnglerState) {
  return content.rods.find((r) => r.tier === angler.rodTier + 1)
}

export function nextCooler(content: IdleAnglerCatalog, angler: AnglerState) {
  return content.coolers.find((c) => c.tier === angler.coolerTier + 1)
}

export function buyRod(content: IdleAnglerCatalog, angler: AnglerState): ShopResult {
  const rod = nextRod(content, angler)
  if (!rod) return refuse('MAX_TIER')
  if (!unlocked(content, angler, 'shop_upgrades')) return refuse('LOCKED')
  if (angler.gold < rod.price) return refuse('NOT_ENOUGH_GOLD')
  return { ok: true, angler: { ...angler, rodTier: rod.tier, gold: angler.gold - rod.price }, spent: rod.price }
}

export function buyCooler(content: IdleAnglerCatalog, angler: AnglerState): ShopResult {
  const cooler = nextCooler(content, angler)
  if (!cooler) return refuse('MAX_TIER')
  if (!unlocked(content, angler, 'shop_upgrades')) return refuse('LOCKED')
  if (angler.gold < cooler.price) return refuse('NOT_ENOUGH_GOLD')
  return { ok: true, angler: { ...angler, coolerTier: cooler.tier, gold: angler.gold - cooler.price }, spent: cooler.price }
}

export function buyAccess(content: IdleAnglerCatalog, angler: AnglerState, id: AccessId): ShopResult {
  const item = content.access.find((a) => a.id === id)
  if (!item) return refuse('UNKNOWN')
  if (angler.access.includes(id)) return refuse('ALREADY_OWNED')
  if (angler.gold < item.price) return refuse('NOT_ENOUGH_GOLD')
  return { ok: true, angler: { ...angler, access: [...angler.access, id], gold: angler.gold - item.price }, spent: item.price }
}

/** Most units of a class the angler may hold. */
export const baitCapOf = (content: IdleAnglerCatalog, cls: BaitClass): number => content.baitCaps?.[cls] ?? content.baitCap

/** Tubs that fit under the cap right now. Deadbait is never bought; it comes from the cooler. */
export function tubsThatFit(content: IdleAnglerCatalog, angler: AnglerState, cls: BaitClass): number {
  const bait = content.baits.find((b) => b.class === cls)
  if (!bait || cls === 'deadbait') return 0
  return Math.max(0, Math.floor((baitCapOf(content, cls) - (angler.bait[cls] ?? 0)) / bait.castsPerTub))
}

export function buyBait(content: IdleAnglerCatalog, angler: AnglerState, cls: BaitClass, tubs: number): ShopResult {
  const bait = content.baits.find((b) => b.class === cls)
  if (!bait || !Number.isSafeInteger(tubs) || tubs < 1) return refuse('UNKNOWN')
  if (tubs > tubsThatFit(content, angler, cls)) return refuse('BAIT_FULL')
  const cost = bait.price * tubs
  if (angler.gold < cost) return refuse('NOT_ENOUGH_GOLD')
  return { ok: true, angler: { ...angler, bait: { ...angler.bait, [cls]: (angler.bait[cls] ?? 0) + bait.castsPerTub * tubs }, gold: angler.gold - cost }, spent: cost }
}

/**
 * Whether the angler may fish a water: its access item, and a logbook that knows the water before it (titles.ts).
 * Under content v2 a charter water also needs casts on a ticket, and with `at` a seasonal water must be open then.
 */
export function canFish(content: IdleAnglerCatalog, angler: Pick<AnglerState, 'access' | 'logbook' | 'waterId'> & Partial<Pick<AnglerState, 'charterCasts'>>, waterId: WaterId, at?: number): boolean {
  const water = waterOf(content, waterId)
  if (water.charter && (angler.charterCasts ?? 0) <= 0) return false
  if (at !== undefined && !waterOpenIn(water, seasonAt(content, at))) return false
  return (water.access === undefined || angler.access.includes(water.access)) && waterKnown(content, angler, water)
}

/**
 * The bait to switch to when moving: none while the chosen bait works at the destination and has units left, otherwise
 * the held bait that water takes with the most units (the water's order breaks ties). Without it, an angler who moved
 * with bread to River Bend fished a bare hook until the player noticed. The travel cast casts nothing, so the switch
 * never touches a cast at the old water.
 */
export function baitForTravel(content: IdleAnglerCatalog, angler: Pick<AnglerState, 'baitOnHook' | 'bait'>, waterId: WaterId): BaitClass | undefined {
  const to = waterOf(content, waterId)
  const held = (cls: BaitClass) => angler.bait[cls] ?? 0
  if (angler.baitOnHook !== undefined && to.baits.includes(angler.baitOnHook) && held(angler.baitOnHook) > 0) return undefined
  return to.baits.filter((cls) => held(cls) > 0).sort((a, b) => held(b) - held(a))[0]
}

export function travel(content: IdleAnglerCatalog, angler: AnglerState, waterId: WaterId, at?: number): ShopResult {
  if (!content.waters.some((w) => w.id === waterId)) return refuse('UNKNOWN')
  if (angler.waterId === waterId && angler.travelTo === undefined) return refuse('SAME_WATER')
  const water = waterOf(content, waterId)
  if (water.charter && (angler.charterCasts ?? 0) <= 0 && canFish(content, { ...angler, charterCasts: 1 }, waterId)) return refuse('NO_TICKET')
  if (at !== undefined && !waterOpenIn(water, seasonAt(content, at)) && canFish(content, angler, waterId)) return refuse('CLOSED')
  if (!canFish(content, angler, waterId, at)) return refuse('LOCKED')
  const swap = baitForTravel(content, angler, waterId)
  return { ok: true, angler: { ...angler, travelTo: waterId, ...(swap ? { baitOnHook: swap } : {}) }, spent: 0 }
}

/** Put a bait class on the hook. Any owned class may be chosen; an unused one at this water fishes as a bare hook. */
export function setBait(content: IdleAnglerCatalog, angler: AnglerState, cls: BaitClass): ShopResult {
  if (!content.baits.some((b) => b.class === cls)) return refuse('UNKNOWN')
  return { ok: true, angler: { ...angler, baitOnHook: cls }, spent: 0 }
}

/** Sell catches: the angler gains their value. Selection is explicit (the caller passes the rows). */
export function sell(angler: AnglerState, values: readonly number[]): AnglerState {
  const total = values.reduce((sum, value) => sum + value, 0)
  return { ...angler, gold: angler.gold + total, counters: { ...angler.counters, goldEarned: angler.counters.goldEarned + total, fishSold: angler.counters.fishSold + values.length } }
}

/** v2: a charter ticket's casts. One ticket at a time; casts left after a trip stay for the next (D162). */
export function buyCharter(content: IdleAnglerCatalog, angler: AnglerState): ShopResult {
  const rule = content.charterTicket
  if (!rule) return refuse('UNKNOWN')
  if ((angler.charterCasts ?? 0) > 0) return refuse('TICKET_HELD')
  if (!canFish(content, { ...angler, charterCasts: 1 }, rule.water)) return refuse('LOCKED')
  if (angler.gold < rule.price) return refuse('NOT_ENOUGH_GOLD')
  return { ok: true, angler: { ...angler, charterCasts: rule.casts, gold: angler.gold - rule.price, counters: { ...angler.counters, charters: (angler.counters.charters ?? 0) + 1 } }, spent: rule.price }
}

/** v2: a small fish from the cooler goes on the hook as deadbait (the caller removes the catch row). */
export function baitFromCatch(content: IdleAnglerCatalog, angler: AnglerState, fish: Pick<CatchRecord, 'speciesId'>): ShopResult {
  const rule = content.deadbait
  const species = content.species.find((s) => s.id === fish.speciesId)
  if (!rule || !species) return refuse('UNKNOWN')
  if (!unlocked(content, angler, 'deadbait')) return refuse('LOCKED')
  if (!species.baitFish) return refuse('NOT_BAIT_FISH')
  const held = angler.bait.deadbait ?? 0
  if (held + rule.unitsPerFish > baitCapOf(content, 'deadbait')) return refuse('BAIT_FULL')
  return { ok: true, angler: { ...angler, bait: { ...angler.bait, deadbait: held + rule.unitsPerFish }, counters: { ...angler.counters, deadbaitUsed: (angler.counters.deadbaitUsed ?? 0) + 1 } }, spent: 0 }
}

/** Pegs on the wall: the first step's count until the owner buys more. */
export const pegsOf = (content: IdleAnglerCatalog, angler: Pick<AnglerState, 'pegs'>): number => angler.pegs ?? content.trophies?.pegs[0] ?? 0

/** v2: whether a catch is big enough to mount, and what mounting it costs. */
export function mountCost(content: IdleAnglerCatalog, fish: Pick<CatchRecord, 'speciesId' | 'grams' | 'value'>): number | null {
  const rule = content.trophies
  const species = content.species.find((s) => s.id === fish.speciesId)
  if (!rule || !species || fish.grams * 100 < species.maxGrams * rule.minPercent) return null
  return fish.value + rule.fee
}

/** v2: mount a catch on a free peg (the caller removes the catch row and writes the trophy). */
export function mountFish(content: IdleAnglerCatalog, angler: AnglerState, fish: Pick<CatchRecord, 'speciesId' | 'grams' | 'value'>, mounted: number): ShopResult {
  if (!content.trophies) return refuse('UNKNOWN')
  if (!unlocked(content, angler, 'trophies')) return refuse('LOCKED')
  const cost = mountCost(content, fish)
  if (cost === null) return refuse('TOO_SMALL')
  if (mounted >= pegsOf(content, angler)) return refuse('WALL_FULL')
  if (angler.gold < cost) return refuse('NOT_ENOUGH_GOLD')
  return { ok: true, angler: { ...angler, gold: angler.gold - cost, counters: { ...angler.counters, trophiesMounted: (angler.counters.trophiesMounted ?? 0) + 1 } }, spent: cost }
}

/** v2: the next step of pegs and its price. */
export function nextPegs(content: IdleAnglerCatalog, angler: Pick<AnglerState, 'pegs'>): { pegs: number; price: number } | null {
  const rule = content.trophies
  if (!rule) return null
  const step = rule.pegs.indexOf(pegsOf(content, angler))
  if (step < 0 || step + 1 >= rule.pegs.length) return null
  return { pegs: rule.pegs[step + 1]!, price: rule.pegPrices[step + 1]! }
}

export function buyPegs(content: IdleAnglerCatalog, angler: AnglerState): ShopResult {
  const next = nextPegs(content, angler)
  if (!next) return refuse('MAX_TIER')
  if (!unlocked(content, angler, 'trophies')) return refuse('LOCKED')
  if (angler.gold < next.price) return refuse('NOT_ENOUGH_GOLD')
  return { ok: true, angler: { ...angler, pegs: next.pegs, gold: angler.gold - next.price }, spent: next.price }
}

export { coolerOf, rodOf }
