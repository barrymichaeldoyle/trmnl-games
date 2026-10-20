import type { Id } from '@trmnl-games/backend/data-model'
import { anglerWords, type AnglerWords } from '@trmnl-games/idle-angler/i18n'
import { useLocale } from './i18n'

/** D200: Idle Angler's game words (fish, waters, baits, goals, stories) in the reader's language. */
export const useAngler = (): AnglerWords => anglerWords(useLocale())

/** D204 (content v6): an angler's rank at one water, and the next rank with the species it needs. */
export type WaterRank = { id: string; logged: number; total: number; next: { id: string; species: number } | null }

/** The client's view of `idleAngler.anglers.dock` (idle-angler.md "Companion"). */
export interface Dock {
  readonly gameState: 'active' | 'deleting' | null
  readonly angler: null | {
    readonly alias: string
    readonly activationState: 'pending_trmnl' | 'active'
    readonly status: 'fishing' | 'paused'
    /** Standing by species logged (idle-angler titles.ts), and the next title with the species it needs. */
    readonly title: string
    readonly nextTitle: { name: string; species: number } | null
    readonly gold: number
    readonly waterId: string
    readonly travelTo: string | null
    readonly rod: { tier: number; name: string; limitGrams: number }
    readonly cooler: { tier: number; name: string; capacity: number; used: number }
    readonly baitOnHook: string | null
    readonly bait: ReadonlyArray<{ class: string; name: string; units: number; tubSize: number; price: number; tubsThatFit: number }>
    readonly access: readonly string[]
    readonly counters: Record<string, number>
    readonly publicProfile: boolean
    readonly speciesLogged: number
    readonly speciesTotal: number
  }
  readonly catches?: ReadonlyArray<{ id: Id<'catches'>; speciesId: string; name: string; grams: number; value: number; caughtTick: number; record?: boolean }>
  readonly waters?: ReadonlyArray<{ id: string; name: string; opensAfter: { waterId: string; waterName: string; species: number; logged: number } | null; access: string | null; open: boolean; charter?: boolean; closed?: boolean; weather: string; band: string; bitePercent: number; baits: readonly string[]; weatherUntil: number; rank?: WaterRank | null }>
  readonly shop?: {
    readonly rod: { name: string; price: number; limitGrams: number; biteBonusPercent: number } | null
    readonly cooler: { name: string; price: number; capacity: number } | null
    readonly access: ReadonlyArray<{ id: 'waders' | 'pier_permit' | 'rowing_boat' | 'ice_auger'; name: string; price: number; water: string; owned: boolean }>
    /** Issue #7: passes not on sale yet, kept back without names or prices. */
    readonly moreAccess?: boolean
  }
  readonly logs?: ReadonlyArray<{ id: string; at: number; kind: string; summary: string; gold: number }>
  readonly recap?: { landed: number; released: number; records: number; firsts: number; best: { speciesId: string; grams: number } | null; gotAway: number; awayGrams: number[] }
  readonly nextTickAt?: number
  /** D162: content v2's goal, slate, season and wall; null under v1. */
  readonly full?: FullDock | null
}

type Feature = 'shop_upgrades' | 'orders' | 'opens' | 'trophies' | 'deadbait'

interface FullDock {
  readonly goal: { orders?: boolean; line: string | null; coins: number; page: 'cooler' | 'shop' | 'dock' | 'log' | null; hint?: string | null; progress?: { value: number; target: number } | null; rung: number; of: number; unclaimed?: ReadonlyArray<{ id: string; title: string; coins: number }> }
  readonly comingUp: { feature: Feature; name: string; species: number; logged: number } | null
  readonly features: Readonly<Record<Feature, boolean>>
  readonly orders: ReadonlyArray<{ id: string; kind: string; line: string; hint: string | null; count: number; catchIds: Id<'catches'>[]; reward: number | null; bonus: number }>
  readonly swappedToday: boolean
  readonly season: { id: string; name: string; endsAt: number } | null
  readonly runs: ReadonlyArray<{ id: string; line: string; water: string; species: string }>
  readonly charter: { price: number; casts: number; castsLeft: number } | null
  readonly pegs: { pegs: number; free: number; next: { pegs: number; price: number } | null }
  /** Issue #6: the mounting rule (a fish at `minPercent` of its species' top weight, for its value plus `fee`). */
  readonly trophies?: { minPercent: number; fee: number } | null
  readonly deadbait: number
  readonly catchActions: Readonly<Record<string, { bait: boolean; mountCost: number | null }>>
}

type Catch = NonNullable<Dock['catches']>[number]

/** D167: the fishmonger's orders the cooler fills now, with the fish a sale takes (the cheapest that fit), the payout and their market price. */
export function readyOrders(dock: Dock): Array<{ order: FullDock['orders'][number]; reward: number; going: Catch[]; market: number }> {
  const full = dock.full
  if (!full?.features.orders) return []
  const catches = dock.catches ?? []
  return full.orders.flatMap((order) => {
    const going = order.catchIds.map((id) => catches.find((c) => c.id === id)).filter((c): c is Catch => c !== undefined)
    return order.reward !== null && going.length === order.count ? [{ order, reward: order.reward, going, market: going.reduce((sum, c) => sum + c.value, 0) }] : []
  })
}


/** The companion page a goal points at. */
export const GOAL_PAGE: Record<string, '/app/idle-angler' | '/app/idle-angler/cooler' | '/app/idle-angler/shop' | '/app/idle-angler/trophies'> = { dock: '/app/idle-angler', cooler: '/app/idle-angler/cooler', shop: '/app/idle-angler/shop', log: '/app/idle-angler/trophies' }
