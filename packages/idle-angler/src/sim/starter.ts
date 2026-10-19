import type { AnglerCounters, AnglerState, IdleAnglerCatalog } from './types'

export const zeroCounters = (): AnglerCounters => ({
  casts: 0,
  bites: 0,
  fishCaught: 0,
  released: 0,
  gotAway: 0,
  rareCaught: 0,
  epicCaught: 0,
  nightCatches: 0,
  heaviestGrams: 0,
  goldEarned: 0,
  fishSold: 0,
  trips: 0,
  baitRunOuts: 0,
})

/** A new angler (idle-angler.md "Angler and starting state"): Cane Rod, Bucket, one tub of worms on the hook, at the Millpond. */
export function starterAngler(content: IdleAnglerCatalog, tick: number): AnglerState {
  const worms = content.baits.find((b) => b.class === 'worms')
  return {
    gold: 0,
    status: 'fishing',
    waterId: 'millpond',
    rodTier: 1,
    coolerTier: 1,
    baitOnHook: 'worms',
    bait: { worms: worms?.castsPerTub ?? 24 },
    access: [],
    logbook: {},
    counters: zeroCounters(),
    quietTicks: 0,
    // v5 (D199): on the first goal from the start, so its guarantee bites on the first cast and its reward is earned.
    ...(content.starterGoal && content.goals ? { goal: { rung: 0, castsAtStart: 0 } } : {}),
  }
}

export const FIRST_LOG = 'You set up on the bank of the Millpond.'
