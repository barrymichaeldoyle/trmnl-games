import { catchMatches, currentGoal, describeOrder, goalLine, orderDay, orderReward, runsAt, SEASON_NAME, seasonAt, seasonEndsAt, speciesLogged, teachingHint, unlocked, type CatchRecord, type IdleAnglerCatalog, type Order } from '@trmnl-games/idle-angler/sim'
import { canFish, mountCost, nextPegs, pegsOf } from '@trmnl-games/idle-angler/sim/shop'
import type { Doc } from '../_generated/dataModel'
import { toAnglerState } from './adapter'

/** D162 read helpers shared by the Dock (anglers.ts) and the full-game intents (full.ts), kept apart to avoid an import cycle. */

export const asCatch = (row: Doc<'catches'>): CatchRecord => ({
  speciesId: row.speciesId,
  grams: row.grams,
  value: row.value,
  caughtTick: row.caughtTick,
  ...(row.band === undefined ? {} : { band: row.band }),
  ...(row.weather === undefined ? {} : { weather: row.weather }),
  ...(row.season === undefined ? {} : { season: row.season }),
})

export const speciesName = (content: IdleAnglerCatalog, id: string) => content.species.find((s) => s.id === id)?.name ?? id

const FEATURE_NAMES = { shop_upgrades: 'Rod and cooler upgrades', orders: 'Fishmonger orders', opens: 'Weekend Opens', trophies: 'The trophy wall', deadbait: 'Deadbait' } as const

/**
 * The Dock's content v2 block (D162): the goal, the next locked feature, the slate with the fish that fit each order,
 * the season and its run, the charter ticket and the wall's pegs, and what each cooler fish can do. Undefined under
 * content v1, so the companion shows the MVP Dock unchanged until the switch.
 */
export function fullDock(content: IdleAnglerCatalog, angler: Doc<'anglers'>, catches: readonly Doc<'catches'>[], now: number, utcOffsetSeconds: number | undefined) {
  if (!content.goals) return undefined
  const state = toAnglerState(angler)
  const logged = speciesLogged(content, angler.logbook)
  const goal = currentGoal(content, state)
  const locked = (Object.entries(content.unlocks ?? {}) as Array<[keyof typeof FEATURE_NAMES, number]>).filter(([, at]) => logged < at).sort((a, b) => a[1] - b[1])[0]
  const season = seasonAt(content, now)
  const fishFor = (order: Order) =>
    catches
      .filter((c) => catchMatches(content, order, asCatch(c)))
      .sort((a, b) => a.value - b.value)
      .slice(0, order.count)
  const features = Object.fromEntries((Object.keys(FEATURE_NAMES) as Array<keyof typeof FEATURE_NAMES>).map((f) => [f, unlocked(content, state, f)]))
  return {
    goal: {
      line: goalLine(content, state),
      coins: goal?.coins ?? 0,
      page: goal?.page ?? null,
      rung: angler.goal?.rung ?? 0,
      of: content.goals.length,
      // v3: reached goals whose coins wait for the Claim button, oldest first.
      unclaimed: (angler.goal?.unclaimed ?? []).map((reward) => ({ id: reward.id, title: content.goals?.find((g) => g.id === reward.id)?.title ?? reward.id, coins: reward.coins })),
    },
    comingUp: locked ? { feature: locked[0], name: FEATURE_NAMES[locked[0]], species: locked[1], logged } : null,
    features,
    orders: (angler.orders ?? []).map((o) => {
      const fish = fishFor(o)
      return { id: o.id, kind: o.kind, line: describeOrder(content, o), hint: teachingHint(content, o), count: o.count, catchIds: fish.length === o.count ? fish.map((f) => f._id) : [], reward: fish.length === o.count ? orderReward(content, o, fish) : null, bonus: o.bonus }
    }),
    swappedToday: angler.swapDay === orderDay(content, now, utcOffsetSeconds),
    season: season ? { id: season, name: SEASON_NAME[season], endsAt: seasonEndsAt(now) } : null,
    // Only runs at waters the angler can fish (D157): a newcomer is not told about the charter's cod.
    runs: runsAt(content, now).filter((r) => canFish(content, { ...state, charterCasts: 1 }, r.water)).map((r) => ({ id: r.id, line: r.line, water: r.water, species: speciesName(content, r.species) })),
    charter: content.charterTicket ? { price: content.charterTicket.price, casts: content.charterTicket.casts, castsLeft: angler.charterCasts ?? 0 } : null,
    pegs: { pegs: pegsOf(content, state), next: nextPegs(content, state) },
    deadbait: angler.bait.deadbait ?? 0,
    catchActions: Object.fromEntries(
      catches.map((c) => {
        const species = content.species.find((s) => s.id === c.speciesId)
        return [c._id, { bait: features.deadbait === true && species?.baitFish === true, mountCost: features.trophies === true ? mountCost(content, c) : null }]
      }),
    ),
  }
}
