/**
 * Deterministic balance harness (quality.md, A03). Runs the real pure simulator
 * in memory; never touches a database. Usage:
 *   pnpm balance [--heroes 500] [--days 30] [--content v3] [--stance cautious|balanced|bold] [--json out.json]
 * Under a catalog with to-do rules (P31) the report adds the to-do list, each hero lives in its own timezone, and a
 * daily cohort that moves its TRMNL clock forward four hours every morning measures timezone abuse.
 */
import { writeFileSync } from 'node:fs'
import { pathToFileURL } from 'node:url'
import { ACTIVE_CONTENT, catalogs, type CatalogId } from '@trmnl-games/desk-crawler/content'
import { applyItemChanges } from '@trmnl-games/desk-crawler/sim/core/apply'
import { nextEarlyTier } from '@trmnl-games/desk-crawler/sim/core/bag'
import { topGearTier } from '@trmnl-games/desk-crawler/sim/core/biomes'
import { simulateHero, SIMULATION_VERSION } from '@trmnl-games/desk-crawler/sim/core/simulate'
import { starterHero, starterKit } from '@trmnl-games/desk-crawler/sim/core/starter'
import { cumulativeXpToReach } from '@trmnl-games/desk-crawler/sim/core/stats'
import type { ContentCatalog, HeroState, ItemSnapshot, MaterialCount, StanceId, TodoKind, UnlockableFeature } from '@trmnl-games/desk-crawler/sim/core/types'
import { eventById, optionOf, resolveEffect } from '@trmnl-games/desk-crawler/sim/core/choice'
import { nextEarlyPouchTier, potionCap } from '@trmnl-games/desk-crawler/sim/core/pouch'
import { currentRung, FEATURES, unlocked } from '@trmnl-games/desk-crawler/sim/core/career'
import { addMaterials, applyStep, heldMaterials, isGear, materialShortfall, nextStep, salvageYield } from '@trmnl-games/desk-crawler/sim/core/workbench'
import { combineBatches, potionItem, potionRows, potionStrengths, potionsHeld, strengthById, strengthOf } from '@trmnl-games/desk-crawler/sim/core/potions'
import { createRng } from '@trmnl-games/desk-crawler/sim/core/rng'
import { ACHIEVEMENTS, ACHIEVEMENT_FAMILIES, rarityBand } from '@trmnl-games/desk-crawler/content/achievements'
import { allSatisfied } from '@trmnl-games/desk-crawler/sim/core/achievements'

/** Days at which each hero's satisfied achievements are snapshotted (achievements.md "Verification"). */
const ACHIEVEMENT_DAYS = [1, 7, 30] as const

const TICKS_PER_DAY = 96
/** P31: the harness's tick 0 is midnight UTC; each hero's own offset decides its stand-up. */
const HARNESS_EPOCH = Date.UTC(2026, 9, 1)
const SLOT_MS = 15 * 60 * 1000

type Mutable<T> = { -readonly [K in keyof T]: T[K] }

export interface Policy {
  readonly name: string
  /** Days between visits; 0 never visits. */
  readonly everyDays: number
  readonly equipGear?: boolean
  readonly staySafe?: boolean
  /** D61: buy the next bag whenever affordable (default true for visiting cohorts). */
  readonly buyBags?: boolean
  /** P31: move the TRMNL clock four hours forward every morning (wrapping from +14 to -12) to farm refills. */
  readonly timezoneAbuse?: boolean
  /** D129: once both ladders are bought, salvage spare gear instead of selling it and apply every affordable workbench step (default true for visiting cohorts under a catalog with a workbench). */
  readonly workbench?: boolean
}

export const POLICIES: readonly Policy[] = [
  { name: 'unattended', everyDays: 0 },
  { name: 'daily', everyDays: 1 },
  { name: 'three-day', everyDays: 3 },
  { name: 'seven-day', everyDays: 7 },
  { name: 'undergeared-three-day', everyDays: 3, equipGear: false },
  { name: 'safe-farming-three-day', everyDays: 3, staySafe: true },
]

/** P31: run beside the cohorts above only under a catalog with to-do rules. */
export const TIMEZONE_ABUSE: Policy = { name: 'daily-timezone-abuse', everyDays: 1, timezoneAbuse: true }

/** A hero's UTC offset in seconds on a day: spread from -11 to +13 hours, or the abuser's daily jump. */
export function harnessOffset(policy: Policy, heroIndex: number, day: number): number {
  if (policy.timezoneAbuse) return ((((heroIndex % 7) + day * 4) % 26) - 12) * 3600
  return (((heroIndex * 5) % 25) - 11) * 3600
}

export interface HeroLog {
  reachTick: Map<number, number>
  firstSleepTick?: number
  bestInSlotTick?: number
  deathsByBiome: Map<string, number>
  exploringTicksByBiome: Map<string, number>
  eligibleDaysByBiome: Map<string, Set<number>>
  deathDaysByBiome: Map<string, Set<number>>
  stateTicks: Map<string, number>
  gearFound: number
  usefulGearFound: number
  equippedUpgrades: number
  startingPotions: number
  potionsFound: number
  potionsUsed: number
  potionFullFallbacks: number
  /** D131: finds and drinks per strength id, majors made by combining, and the final count per strength. */
  potionsFoundByStrength: Map<string, number>
  potionsUsedByStrength: Map<string, number>
  potionsCombined: number
  finalPotionsByStrength: Map<string, number>
  finalPotions: number
  retreats: number
  rescues: number
  elites: number
  jackpots: number
  jackpotGold: number
  goldEarned: number
  dailyXp: number[]
  finalLevel: number
  finalGold: number
  goldDay30?: number
  /** D61: first tick at each bag capacity, plus how each upgrade arrived. */
  bagTick: Map<number, number>
  bagFinds: number
  bagMilestones: number
  bagPurchases: number
  bagGoldSpent: number
  /** P31: tasks ticked off per 96-tick day, whether the hero spent most of that day asleep, and the gold they paid. */
  tasksByDay: number[]
  asleepDays: boolean[]
  taskGold: number
  /** P31: ticks from a task being written to being ticked off, by kind. */
  taskTicks: Map<TodoKind, number[]>
  tasksWritten: number
  staleSwaps: number
  refills: number
  /** D65: achievement ids satisfied at the end of each snapshot day. */
  achievementsByDay: Map<number, readonly string[]>
  /** P35: first tick each feature was unlocked, each rung was reached, guarantee fires by rung, and the ladder's gold. */
  unlockTick: Map<UnlockableFeature, number>
  rungTick: Map<string, number>
  guaranteeFires: Map<string, number>
  careerGold: number
  finalRung?: string
  /** D129: gear salvaged, materials held at the end, gold spent on the workbench, the first tick each slot reached each step, and gold at days 30/60/90. */
  itemsSalvaged: number
  materialsHeld: MaterialCount
  workbenchGold: number
  stepTick: Map<string, number>
  goldByDay: Map<number, number>
}

function args() {
  const argv = process.argv.slice(2)
  const get = (flag: string, fallback: string) => {
    const i = argv.indexOf(flag)
    return i >= 0 && argv[i + 1] !== undefined ? argv[i + 1]! : fallback
  }
  return {
    heroes: Number(get('--heroes', '500')),
    days: Number(get('--days', '30')),
    content: get('--content', ACTIVE_CONTENT) as CatalogId,
    /** D76: every hero plays this stance; omitted means no stance (the catalog constants). */
    stance: argv.includes('--stance') ? (get('--stance', 'balanced') as StanceId) : undefined,
    json: get('--json', ''),
    ticks: argv.includes('--ticks') ? Number(get('--ticks', '')) : undefined,
  }
}

/** Fast deterministic per-hero/tick stream seeds for the harness (production uses seed v1 SHA-256). */
function streams(heroIndex: number, tick: number) {
  const base = createRng((heroIndex * 0x9e3779b1 + tick * 0x85ebca77) >>> 0)
  const next = () => Math.floor(base.next() * 2 ** 32)
  return { encounter: next(), combat: next(), reward: next(), narrative: next(), quest: next(), raid: next() }
}

function bestInSlot(content: ContentCatalog): { attack: number; defense: number } {
  const top = topGearTier(content)
  const tier = content.gearTiers[top]!
  const bonus = Math.max(...content.rarities.map((r) => r.statBonus))
  const offset = (kind: 'weapon' | 'armor') => Math.max(...content.gearTemplates.filter((t) => t.tier === top && t.kind === kind).map((t) => t.statOffset ?? 0))
  return { attack: tier.weaponAttack + offset('weapon') + bonus, defense: tier.armorDefense + offset('armor') + bonus }
}

/**
 * One visit: equip best eligible gear, claim and sell everything else, resume/travel to the hardest unlocked biome (D29).
 * P35: the visit also does what a player does once on the companion, so the ladder's companion rungs are reachable in
 * the harness: it counts equips and sales, picks a stance once stances are unlocked, answers a pending decision with its
 * default, and buys the merchant's bag or pouch offer (else its potions) when it can afford it.
 */
export function visit(hero: HeroState, inventory: ItemSnapshot[], tick: number, content: ContentCatalog, policy: Policy, home?: StanceId): { hero: HeroState; inventory: ItemSnapshot[]; bought: number; salvaged: number; workbenchGold: number; steps: string[]; combined: number } {
  let bought = 0
  let salvaged = 0
  let workbenchGold = 0
  let combined = 0
  const steps: string[] = []
  if (!['exploring', 'resting', 'sleeping'].includes(hero.status)) return { hero, inventory, bought, salvaged, workbenchGold, steps, combined }
  const h: Mutable<HeroState> = { ...hero }
  const counters = { ...h.counters }
  h.counters = counters
  const gear = inventory.filter((item) => isGear(item.kind))
  const best = (kind: 'weapon' | 'armor') =>
    gear
      .filter((item) => item.kind === kind && item.requiredLevel <= h.level)
      .reduce<ItemSnapshot | undefined>((top, item) => {
        const score = (x: ItemSnapshot) => (kind === 'weapon' ? x.attack : x.defense)
        return top === undefined || score(item) > score(top) ? item : top
      }, undefined)
  const weapon = best('weapon')
  const armor = best('armor')
  if (weapon && policy.equipGear !== false && h.weaponId !== weapon.id) {
    h.weaponId = weapon.id
    counters.itemsEquipped += 1
  }
  if (armor && policy.equipGear !== false && h.armorId !== armor.id) {
    h.armorId = armor.id
    counters.itemsEquipped += 1
  }
  delete h.heldItemId
  let gold = h.gold
  let sold = 0
  // D129: a player sells while a bag or pouch is still to buy, then salvages. Yields pile into the material rows.
  const workbench = policy.workbench !== false && content.workbench !== undefined && nextEarlyTier(content, h) === undefined && nextEarlyPouchTier(content, { level: h.level, ...(h.potionCap === undefined ? {} : { potionCap: h.potionCap }) }) === undefined
  let yielded: MaterialCount = {}
  let kept = inventory.filter((item) => {
    if (!isGear(item.kind) || item.id === h.weaponId || item.id === h.armorId) return true
    if (workbench) {
      yielded = addMaterials(yielded, salvageYield(content, item))
      salvaged += 1
      return false
    }
    gold += item.saleValue
    sold += 1
    return false
  })
  h.gold = gold
  counters.itemsSold += sold
  counters.itemsSalvaged += salvaged
  counters.goldEarned += gold - hero.gold
  if (salvaged > 0) kept = withMaterials(content, kept, yielded)
  // D129: claim every goal reward waiting since the last visit.
  if (h.career?.unclaimed !== undefined) {
    const claimed = h.career.unclaimed.reduce((sum, reward) => sum + reward.gold, 0)
    h.gold += claimed
    counters.goldEarned += claimed
    const { unclaimed: _u, ...career } = h.career
    h.career = career
  }
  // P35: the once-only companion deeds. The stance pick keeps the cohort's sustain (balanced unless --stance).
  if (content.stances !== undefined && unlocked(content, h.level, 'stances') && counters.stanceChanges === 0) counters.stanceChanges = 1
  // D135: a stance goal is met by switching for an adventure or more; the next visit after it switches back to `home`.
  const goal = currentRung(content, h)?.predicate
  if (goal?.kind === 'stance' && unlocked(content, h.level, 'stances')) h.stance = goal.stance
  else if (h.stance !== home) {
    if (home === undefined) delete h.stance
    else h.stance = home
  }
  if (h.choice !== undefined && content.choices !== undefined) {
    const event = eventById(content, h.choice.eventId)
    const option = event === undefined ? undefined : optionOf(event, event.defaultOptionId)
    if (option !== undefined) {
      const change = resolveEffect(content, h, potionsHeld(kept), option.effect, h.choice.biomeTier)
      h.gold += change.gold
      h.hp += change.hp
      if (change.potions > 0) kept = withPotions(content, kept, content.potion.templateId, change.potions)
    }
    delete h.choice
    counters.choicesMade += 1
  }
  if (h.merchant !== undefined && h.merchant.expiresAtTick > tick) {
    const ladder = h.merchant.offers.find((offer) => (offer.id === 'bag' || offer.id === 'pouch') && offer.price <= h.gold)
    const potions = h.merchant.offers.find((offer) => offer.id === 'potions' && offer.price <= h.gold)
    const offer = ladder ?? potions
    if (offer !== undefined) {
      h.gold -= offer.price
      counters.purchases += 1
      if (offer.id === 'bag') h.bagCapacity = content.bagLadder.tiers.find((tier) => tier.id === offer.tierId)?.capacity ?? h.bagCapacity
      else if (offer.id === 'pouch') h.potionCap = content.potionPouch?.tiers.find((tier) => tier.id === offer.tierId)?.cap ?? potionCap(content, h)
      else kept = withPotions(content, kept, content.potion.templateId, Math.min(offer.quantity, potionCap(content, h) - potionsHeld(kept)))
      delete h.merchant
    }
  }
  // D61/D122: keep buying the next bag while it is allowed and affordable. Under milestone ladders the one-ahead rule
  // stops this after one; under a shop ladder a visit with the gold climbs several rungs, as a player would.
  for (;;) {
    const bag = policy.buyBags === false ? undefined : nextEarlyTier(content, h)
    if (bag?.price === undefined || h.gold < bag.price) break
    h.gold -= bag.price
    h.bagCapacity = bag.capacity
    bought += bag.price
  }
  // P35: the Lunchbox is a rung, so a visiting player buys the next pouch too once the bag ladder stops taking its gold.
  for (;;) {
    const pouch = policy.buyBags === false ? undefined : nextEarlyPouchTier(content, h)
    if (pouch?.price === undefined || h.gold < pouch.price) break
    h.gold -= pouch.price
    h.potionCap = pouch.cap
  }
  // D129: every affordable workbench step on the equipped pieces, weapon first, as a player with the materials would.
  if (workbench) {
    for (const slot of ['weaponId', 'armorId'] as const) {
      for (;;) {
        const item = kept.find((row) => row.id === h[slot])
        const step = item === undefined ? undefined : nextStep(content, item)
        if (item === undefined || step === undefined || h.gold < step.gold) break
        if (Object.keys(materialShortfall(heldMaterials(kept), step.materials)).length > 0) break
        const next = applyStep(content, item, step)
        if (next.requiredLevel > h.level) break
        h.gold -= step.gold
        workbenchGold += step.gold
        kept = withMaterials(content, kept.map((row) => (row.id === item.id ? next : row)), Object.fromEntries(Object.entries(step.materials).map(([id, n]) => [id, -n])))
        counters.gearUpgraded += 1
        counters.topReinforcement = Math.max(counters.topReinforcement, next.reinforced ?? 0)
        steps.push(`${item.kind}:${step.kind === 'tier' ? `Mk ${step.toTier}` : `+${step.to}`}`)
      }
    }
  }
  // D131: combine every batch the pouch and the materials allow, as a player clearing minors would.
  const recipe = content.potions?.combine
  if (recipe !== undefined && policy.workbench !== false) {
    const batches = combineBatches(content, kept, heldMaterials(kept))
    const from = strengthById(content, recipe.from)!
    const to = strengthById(content, recipe.to)!
    if (batches > 0) {
      kept = withPotions(content, kept, from.templateId, -recipe.count * batches)
      kept = withPotions(content, kept, to.templateId, batches)
      kept = withMaterials(content, kept, Object.fromEntries(Object.entries(recipe.materials).map(([id, n]) => [id, -n * batches])))
      counters.potionsCombined += batches
      combined += batches
    }
  }
  const hardest = policy.staySafe ? content.biomes.find(b => b.safe)! : content.biomes.filter((b) => b.unlockLevel <= h.level).at(-1)!
  if (h.status === 'sleeping') {
    h.wakeAtTick = tick + 1
    if (hardest.id !== h.biomeId) h.targetBiomeId = hardest.id
  } else if (hardest.id !== h.biomeId) {
    h.status = 'travelling'
    h.targetBiomeId = hardest.id
    h.arriveAtTick = tick + 1
  }
  return { hero: h, inventory: kept, bought, salvaged, workbenchGold, steps, combined }
}

/** Add (or spend, with negative counts) potions of one strength; a row that reaches zero goes. Ids are stable per strength so the sort order holds. */
function withPotions(content: ContentCatalog, inventory: ItemSnapshot[], templateId: string, n: number): ItemSnapshot[] {
  if (n === 0) return inventory
  const existing = inventory.find((row) => row.kind === 'potion' && row.templateId === templateId)
  const quantity = (existing?.quantity ?? 0) + n
  if (quantity < 0) throw new Error(`spent more ${templateId} than held`)
  const rows = inventory.filter((row) => row !== existing)
  const strength = strengthOf(content, templateId) ?? potionStrengths(content)[0]!
  if (quantity > 0) rows.push({ ...potionItem(content, strength, quantity), id: existing?.id ?? `p-${templateId}` })
  return rows.sort((a, b) => (a.id < b.id ? -1 : a.id > b.id ? 1 : 0))
}

/** Add (or spend, with negative counts) materials in the stack rows; a row that reaches zero goes. Ids are stable per material so the sort order holds. */
function withMaterials(content: ContentCatalog, inventory: ItemSnapshot[], delta: MaterialCount): ItemSnapshot[] {
  let rows = [...inventory]
  for (const [id, n] of Object.entries(delta)) {
    if (n === 0) continue
    const existing = rows.find((row) => row.kind === 'material' && row.templateId === id)
    const quantity = (existing?.quantity ?? 0) + n
    if (quantity < 0) throw new Error(`spent more ${id} than held`)
    rows = rows.filter((row) => row !== existing)
    if (quantity > 0) rows.push({ id: `m-${id}`, templateId: id, contentVersion: content.contentVersion, kind: 'material', name: content.workbench?.materials.find((m) => m.id === id)?.name ?? id, rarity: 'common', requiredLevel: 1, attack: 0, defense: 0, saleValue: 0, quantity })
  }
  return rows.sort((a, b) => (a.id < b.id ? -1 : a.id > b.id ? 1 : 0))
}

export function simulateCohort(policy: Policy, heroes: number, days: number, content: ContentCatalog, ticks = days * TICKS_PER_DAY, stance?: StanceId): HeroLog[] {
  const logs: HeroLog[] = []
  const bis = bestInSlot(content)
  const kit = starterKit(content)
  for (let index = 0; index < heroes; index += 1) {
    let nextId = 0
    const id = () => `h${String(nextId++).padStart(6, '0')}`
    let inventory: ItemSnapshot[] = [{ ...kit.weapon, id: id() }, { ...kit.armor, id: id() }, { ...kit.potions, id: id() }]
    let hero: HeroState = { ...starterHero(`hero-${index}`, content, 0), weaponId: inventory[0]!.id, armorId: inventory[1]!.id, ...(stance === undefined ? {} : { stance }) }
    const offset = (index * 37) % TICKS_PER_DAY
    const log: HeroLog = {
      reachTick: new Map(),
      deathsByBiome: new Map(),
      exploringTicksByBiome: new Map(),
      eligibleDaysByBiome: new Map(),
      deathDaysByBiome: new Map(),
      stateTicks: new Map(),
      gearFound: 0,
      usefulGearFound: 0,
      equippedUpgrades: 0,
      startingPotions: kit.potions.quantity,
      potionsFound: 0,
      potionsUsed: 0,
      potionFullFallbacks: 0,
      potionsFoundByStrength: new Map(),
      potionsUsedByStrength: new Map(),
      potionsCombined: 0,
      finalPotionsByStrength: new Map(),
      finalPotions: 0,
      retreats: 0,
      rescues: 0,
      elites: 0,
      jackpots: 0,
      jackpotGold: 0,
      goldEarned: 0,
      dailyXp: [],
      finalLevel: 1,
      finalGold: 0,
      bagTick: new Map([[hero.bagCapacity, 0]]),
      bagFinds: 0,
      bagMilestones: 0,
      bagPurchases: 0,
      bagGoldSpent: 0,
      tasksByDay: [],
      asleepDays: [],
      taskGold: 0,
      taskTicks: new Map(),
      tasksWritten: 0,
      staleSwaps: 0,
      refills: 0,
      achievementsByDay: new Map(),
      unlockTick: new Map(),
      rungTick: new Map(),
      guaranteeFires: new Map(),
      careerGold: 0,
      itemsSalvaged: 0,
      materialsHeld: {},
      workbenchGold: 0,
      stepTick: new Map(),
      goldByDay: new Map(),
    }
    let dayTasks = 0
    let daySleep = 0
    let dayXp = 0
    let recentSummaries: string[] = []
    const markDay = (map: Map<string, Set<number>>, biome: string, day: number) => {
      const set = map.get(biome) ?? new Set<number>()
      set.add(day)
      map.set(biome, set)
    }
    for (let tick = 1; tick <= ticks; tick += 1) {
      if (policy.everyDays > 0 && (tick - offset) % (policy.everyDays * TICKS_PER_DAY) === 0) {
        const before = hero
        let bought: number
        let salvaged: number
        let workbenchGold: number
        let steps: string[]
        let combined: number
        ;({ hero, inventory, bought, salvaged, workbenchGold, steps, combined } = visit(hero, inventory, tick, content, policy, stance))
        log.itemsSalvaged += salvaged
        log.workbenchGold += workbenchGold
        log.potionsCombined += combined
        for (const step of steps) if (!log.stepTick.has(step)) log.stepTick.set(step, tick)
        if (bought > 0) {
          log.bagPurchases += 1
          log.bagGoldSpent += bought
          // A visit may climb several rungs at once (D122); every rung passed counts as reached now.
          for (const tier of content.bagLadder.tiers) if (tier.capacity <= hero.bagCapacity && !log.bagTick.has(tier.capacity)) log.bagTick.set(tier.capacity, tick)
        }
        log.equippedUpgrades += Number(before.weaponId !== hero.weaponId) + Number(before.armorId !== hero.armorId)
      }
      log.stateTicks.set(hero.status, (log.stateTicks.get(hero.status) ?? 0) + 1)
      const biomeBefore = hero.biomeId
      const day = Math.floor((tick - 1) / TICKS_PER_DAY)
      if (hero.status === 'exploring' || hero.status === 'resting') markDay(log.eligibleDaysByBiome, biomeBefore, day)
      const utcOffsetSeconds = harnessOffset(policy, index, day)
      const before = hero.todo?.tasks
      const rungBefore = currentRung(content, hero)?.id
      // P35: a stand-in desk to raid (balanced, 200 gold), so launches happen at their natural rate and the ladder's raid rung
      // can be measured; being raided needs the pool, which only tools/balance/raids.ts models. Added 2026-10-12: earlier
      // evidence files were produced without raids in this harness.
      const result = simulateHero({ hero, inventory, tick, content, simulationVersion: SIMULATION_VERSION, streams: streams(index, tick), recentSummaries, tickAt: HARNESS_EPOCH + tick * SLOT_MS, utcOffsetSeconds, ...(content.raids === undefined ? {} : { raidTarget: { heroId: 'coworker', name: 'A coworker', gold: 200 } }) })
      if (hero.status === 'sleeping') daySleep += 1
      for (const extra of result.extraEvents ?? []) {
        const outcome = extra.detail.outcome
        if (outcome.variant !== 'todo') continue
        if (outcome.phase === 'done') {
          dayTasks += outcome.tasks.length
          log.taskGold += extra.deltas.gold
        } else {
          log.tasksWritten += outcome.tasks.length
        }
      }
      const after = result.nextHero.todo?.tasks ?? []
      // Time to finish from the list the tick started with: a task ticked off now may already be refilled.
      const ticked = (result.extraEvents ?? []).flatMap((e) => (e.detail.outcome.variant === 'todo' && e.detail.outcome.phase === 'done' ? e.detail.outcome.tasks.map((t) => t.templateId) : []))
      for (const task of before ?? []) {
        if (task.doneTick !== undefined || !ticked.includes(task.templateId)) continue
        const list = log.taskTicks.get(task.templateId) ?? []
        list.push(tick - task.addedTick)
        log.taskTicks.set(task.templateId, list)
      }
      if (result.metrics.todoRefills) {
        log.refills += 1
        // A slot rewritten this tick whose old task was not ticked off was a stale swap.
        if (before !== undefined) after.forEach((task, i) => { if (task.addedTick === tick && before[i]!.doneTick === undefined && !(result.extraEvents ?? []).some((e) => e.detail.outcome.variant === 'todo' && e.detail.outcome.phase === 'done' && e.detail.outcome.tasks.some((t) => t.templateId === before[i]!.templateId))) log.staleSwaps += 1 })
      }
      // P35: rungs reached and guarantees fired, by rung id; unlocks by the level the hero holds after the tick.
      for (const extra of result.extraEvents ?? []) {
        const outcome = extra.detail.outcome
        if (outcome.variant !== 'career' || outcome.phase !== 'reached') continue
        log.rungTick.set(outcome.id, tick)
        log.careerGold += outcome.gold
      }
      if (result.metrics.guarantees && rungBefore !== undefined) log.guaranteeFires.set(rungBefore, (log.guaranteeFires.get(rungBefore) ?? 0) + 1)
      if (content.unlocks !== undefined) for (const feature of FEATURES) if (!log.unlockTick.has(feature) && result.nextHero.level >= content.unlocks[feature]) log.unlockTick.set(feature, tick)
      if (result.event) recentSummaries = [result.event.summary, ...recentSummaries].slice(0, 2)
      if (result.metrics.encounter !== 'none') {
        log.exploringTicksByBiome.set(biomeBefore, (log.exploringTicksByBiome.get(biomeBefore) ?? 0) + 1)
      }
      if (result.metrics.deaths) {
        log.deathsByBiome.set(biomeBefore, (log.deathsByBiome.get(biomeBefore) ?? 0) + result.metrics.deaths)
        markDay(log.deathDaysByBiome, biomeBefore, day)
      }
      log.potionsUsed += result.metrics.potionsUsed
      log.retreats += result.metrics.retreats
      log.rescues += result.metrics.rescues
      const outcome = result.event?.detail.outcome
      if (outcome?.variant === 'loot' && outcome.potionFullFallback) log.potionFullFallbacks += 1
      // A found potion can cancel this tick's decrement, leaving no item directive.
      // Count the encounter outcome so gross supply and usage still conserve the stack.
      if (outcome?.variant === 'loot' && outcome.found === 'potion') {
        log.potionsFound += 1
        const strength = strengthOf(content, outcome.templateId ?? content.potion.templateId)?.id ?? 'healing'
        log.potionsFoundByStrength.set(strength, (log.potionsFoundByStrength.get(strength) ?? 0) + 1)
      }
      if (result.metrics.potionsUsed) {
        // The drink's row: the decrement, or, when a find of the same strength cancelled it, the row the story names.
        const decrement = result.itemChanges.find((change) => change.type === 'potion_decrement')
        const drunk = decrement?.type === 'potion_decrement' ? inventory.find((item) => item.id === decrement.itemId)?.templateId : undefined
        const word = /Drank a (\w+) potion\./.exec(result.event?.summary ?? '')?.[1]
        const strength = drunk !== undefined ? strengthOf(content, drunk)?.id ?? 'healing' : word ?? 'healing'
        log.potionsUsedByStrength.set(strength, (log.potionsUsedByStrength.get(strength) ?? 0) + 1)
      }
      for (const change of result.itemChanges) {
        if (change.type !== 'create') continue
        if (change.item.kind === 'potion') continue
        const current = inventory.find(item => item.id === (change.item.kind === 'weapon' ? hero.weaponId : hero.armorId))
        const score = change.item.kind === 'weapon' ? change.item.attack : change.item.defense
        const equippedScore = change.item.kind === 'weapon' ? current?.attack ?? 0 : current?.defense ?? 0
        if (change.item.requiredLevel <= result.nextHero.level && score > equippedScore) log.usefulGearFound += 1
      }
      if (result.metrics.heldFinds && log.firstSleepTick === undefined) log.firstSleepTick = tick
      const upgrade = result.event?.detail.bagUpgrade
      if (upgrade) {
        if (upgrade.source === 'find') log.bagFinds += 1
        else log.bagMilestones += 1
        if (!log.bagTick.has(upgrade.to)) log.bagTick.set(upgrade.to, tick)
      }
      log.elites += result.metrics.elites
      if (result.metrics.jackpots) {
        log.jackpots += 1
        log.jackpotGold += result.event?.detail.outcome.variant === 'loot' ? result.event.detail.outcome.goldGranted : 0
      }
      log.gearFound += result.itemChanges.filter((change) => change.type === 'create' && change.item.kind !== 'potion').length
      dayXp += result.event?.deltas.xpEarned ?? 0
      ;({ hero, inventory } = applyItemChanges(result.nextHero, inventory, result.itemChanges, id))
      for (let level = 2; level <= hero.level; level += 1) if (!log.reachTick.has(level)) log.reachTick.set(level, tick)
      if (log.bestInSlotTick === undefined) {
        const w = inventory.find((i) => i.id === hero.weaponId)
        const a = inventory.find((i) => i.id === hero.armorId)
        if ((w?.attack ?? 0) >= bis.attack && (a?.defense ?? 0) >= bis.defense) log.bestInSlotTick = tick
      }
      if (tick === 30 * TICKS_PER_DAY) log.goldDay30 = hero.gold
      if (tick % (30 * TICKS_PER_DAY) === 0) log.goldByDay.set(tick / TICKS_PER_DAY, hero.gold)
      if (tick % TICKS_PER_DAY === 0 && (ACHIEVEMENT_DAYS as readonly number[]).includes(tick / TICKS_PER_DAY)) {
        log.achievementsByDay.set(tick / TICKS_PER_DAY, allSatisfied({ level: hero.level, bagCapacity: hero.bagCapacity, counters: hero.counters, keepsakeTotal: 0 }, content).map((a) => a.id))
      }
      if (tick % TICKS_PER_DAY === 0) {
        log.dailyXp.push(dayXp)
        dayXp = 0
        log.tasksByDay.push(dayTasks)
        log.asleepDays.push(daySleep * 2 > TICKS_PER_DAY)
        dayTasks = 0
        daySleep = 0
      }
    }
    if (ticks % TICKS_PER_DAY !== 0) log.dailyXp.push(dayXp)
    log.finalLevel = hero.level
    log.finalGold = hero.gold
    log.goldEarned = hero.counters.goldEarned
    log.finalPotions = potionsHeld(inventory)
    for (const row of potionRows(inventory)) log.finalPotionsByStrength.set(strengthOf(content, row.templateId)?.id ?? 'healing', row.quantity)
    log.materialsHeld = heldMaterials(inventory)
    const finalRung = currentRung(content, hero)?.id
    if (finalRung !== undefined) log.finalRung = finalRung
    logs.push(log)
  }
  return logs
}

const pct = (values: readonly number[], p: number): number => {
  if (values.length === 0) return NaN
  const sorted = [...values].sort((a, b) => a - b)
  return sorted[Math.min(sorted.length - 1, Math.floor(p * sorted.length))]!
}
const days = (tick: number) => tick / TICKS_PER_DAY
const round1 = (n: number) => Math.round(n * 10) / 10

export function summarize(policy: Policy, logs: HeroLog[], totalDays: number, content: ContentCatalog) {
  /** Percentiles over every hero; heroes who never got there count as later than the run (reported as '>N'). */
  const censored = (ticks: (number | undefined)[]) => {
    const values = ticks.map((t) => (t === undefined ? Infinity : days(t)))
    const show = (v: number) => (Number.isFinite(v) ? round1(v) : `>${totalDays}`)
    return { p10: show(pct(values, 0.1)), median: show(pct(values, 0.5)), p90: show(pct(values, 0.9)), reached: values.filter(Number.isFinite).length }
  }
  const reach = (level: number) => ({ level, ...censored(logs.map((l) => l.reachTick.get(level))) })
  const sum = (f: (l: HeroLog) => number) => logs.reduce((total, l) => total + f(l), 0)
  const deathRate = Object.fromEntries(
    content.biomes
      .filter((b) => !b.safe)
      .map((b) => {
        const heroDays = sum(l => l.eligibleDaysByBiome.get(b.id)?.size ?? 0)
        const daysWithDeath = sum(l => l.deathDaysByBiome.get(b.id)?.size ?? 0)
        const p = daysWithDeath / Math.max(1, heroDays)
        const z2 = 1.96 ** 2
        const center = (p + z2 / (2 * Math.max(1, heroDays))) / (1 + z2 / Math.max(1, heroDays))
        const half = 1.96 * Math.sqrt(p * (1 - p) / Math.max(1, heroDays) + z2 / (4 * Math.max(1, heroDays) ** 2)) / (1 + z2 / Math.max(1, heroDays))
        return [b.id, { eligibleHeroDays: heroDays, heroDaysWithDeath: daysWithDeath, deathProbabilityPct: heroDays ? round1(p * 100) : null, wilson95Pct: heroDays ? [round1(Math.max(0, center - half) * 100), round1(Math.min(1, center + half) * 100)] : null, deathsPerEligibleHeroDay: heroDays ? Math.round(sum(l => l.deathsByBiome.get(b.id) ?? 0) / heroDays * 1000) / 1000 : null }]
      }),
  )
  const totalTicks = logs.length * totalDays * TICKS_PER_DAY
  const states = Object.fromEntries(
    ['exploring', 'resting', 'travelling', 'dead', 'sleeping'].map((s) => [s, Math.round((sum((l) => l.stateTicks.get(s) ?? 0) / totalTicks) * 1000) / 10]),
  )
  const lastDay = logs.map((l) => l.dailyXp.at(-1) ?? 0)
  const last7 = logs.map((l) => l.dailyXp.slice(-7).reduce((a, b) => a + b, 0))
  const spread = (values: number[]) => {
    const p10 = pct(values, 0.1)
    const p90 = pct(values, 0.9)
    return { p10, median: pct(values, 0.5), p90, ratio: p10 > 0 ? Math.round(p90 / p10 * 100) / 100 : null }
  }
  return {
    policy: policy.name,
    heroes: logs.length,
    days: totalDays,
    // D133: level 2, every floor's unlock level and the ladder's top, so new floors report their own date.
    reach: [...new Set([2, ...content.biomes.map((b) => b.unlockLevel).filter((l) => l > 1), 12])].sort((a, b) => a - b).map(reach),
    finalLevelMedian: pct(logs.map((l) => l.finalLevel), 0.5),
    deathByBiome: deathRate,
    stateSharePct: states,
    firstInventorySleep: censored(logs.map(l => l.firstSleepTick)),
    gearPerDay: round1(sum((l) => l.gearFound) / logs.length / totalDays),
    usefulGearPerDay: round1(sum(l => l.usefulGearFound) / logs.length / totalDays),
    equippedUpgradesPerHero: round1(sum(l => l.equippedUpgrades) / logs.length),
    potions: { acquiredPerHeroDay: round1(sum(l => l.potionsFound) / logs.length / totalDays), usedPerHeroDay: round1(sum(l => l.potionsUsed) / logs.length / totalDays), fullStackFallbacksPerHeroDay: round1(sum(l => l.potionFullFallbacks) / logs.length / totalDays), finalCount: { p10: pct(logs.map(l => l.finalPotions), 0.1), median: pct(logs.map(l => l.finalPotions), 0.5), p90: pct(logs.map(l => l.finalPotions), 0.9) } },
    // D131: finds, drinks and the final pouch per strength (per hero over the run), plus majors combined and the Scrap it took.
    potionStrengths: content.potions === undefined ? null : potionStrengthReport(logs, content, totalDays),
    retreatsPerHeroDay: round1(sum(l => l.retreats) / logs.length / totalDays),
    rescuesPerHeroDay: round1(sum(l => l.rescues) / logs.length / totalDays),
    bestInSlot: censored(logs.map((l) => l.bestInSlotTick)),
    goldDayEnd: { median: pct(logs.map((l) => l.finalGold), 0.5), p90: pct(logs.map((l) => l.finalGold), 0.9) },
    goldDay30: totalDays >= 30 ? pct(logs.map((l) => l.goldDay30 ?? 0), 0.5) : null,
    todo: content.todo === undefined ? null : todoReport(logs, totalDays),
    career: content.career === undefined ? null : careerReport(logs, totalDays, content, censored),
    workbench: content.workbench === undefined ? null : workbenchReport(logs, content, censored),
    jackpotGoldShare: Math.round((sum((l) => l.jackpotGold) / Math.max(1, sum((l) => l.goldEarned))) * 1000) / 10,
    elitesPerHeroDay: Math.round((sum((l) => l.elites) / logs.length / totalDays) * 100) / 100,
    bag: {
      reach: content.bagLadder.tiers.slice(1).map((tier) => ({ capacity: tier.capacity, ...censored(logs.map((l) => l.bagTick.get(tier.capacity))) })),
      findsPerHero: Math.round(sum((l) => l.bagFinds) / logs.length * 100) / 100,
      purchasesPerHero: Math.round(sum((l) => l.bagPurchases) / logs.length * 100) / 100,
      goldSpentMedian: pct(logs.map((l) => l.bagGoldSpent), 0.5),
    },
    xpLastDay: spread(lastDay),
    xpLast7Days: spread(last7),
    achievements: achievementShares(logs),
  }
}

/**
 * P31 reports: tasks finished per hero-day (all days, and days the hero spent mostly awake), the share of hero-days
 * with at least two, task gold as a share of every other gold earned, hours to finish by kind, stale swaps per task
 * written, and refills per hero-day.
 */
function todoReport(logs: HeroLog[], totalDays: number) {
  const days = logs.flatMap((l) => l.tasksByDay.map((tasks, i) => ({ tasks, asleep: l.asleepDays[i]! })))
  const awake = days.filter((d) => !d.asleep)
  const share = (list: typeof days, atLeast: number) => (list.length === 0 ? null : Math.round((list.filter((d) => d.tasks >= atLeast).length / list.length) * 1000) / 10)
  const mean = (list: typeof days) => (list.length === 0 ? null : round1(list.reduce((sum, d) => sum + d.tasks, 0) / list.length))
  const taskGold = logs.reduce((sum, l) => sum + l.taskGold, 0)
  const otherGold = logs.reduce((sum, l) => sum + l.goldEarned - l.taskGold, 0)
  const kinds = [...new Set(logs.flatMap((l) => [...l.taskTicks.keys()]))].sort()
  const hours = Object.fromEntries(
    kinds.map((kind) => {
      const ticks = logs.flatMap((l) => l.taskTicks.get(kind) ?? [])
      return [kind, { finished: ticks.length, p10: pct(ticks, 0.1) / 4, median: pct(ticks, 0.5) / 4, p90: pct(ticks, 0.9) / 4 }]
    }),
  )
  const written = logs.reduce((sum, l) => sum + l.tasksWritten, 0)
  return {
    tasksPerHeroDay: mean(days),
    tasksPerAwakeHeroDay: mean(awake),
    awakeDaySharePct: Math.round((awake.length / Math.max(1, days.length)) * 1000) / 10,
    daysWithTwoPlusPct: share(days, 2),
    awakeDaysWithTwoPlusPct: share(awake, 2),
    taskGoldSharePct: otherGold > 0 ? round1((taskGold / otherGold) * 100) : null,
    taskGoldPerHeroDay: round1(taskGold / logs.length / totalDays),
    hoursToFinish: hours,
    staleSwapsPerTaskWrittenPct: written > 0 ? round1((logs.reduce((sum, l) => sum + l.staleSwaps, 0) / written) * 100) : null,
    refillsPerHeroDay: Math.round((logs.reduce((sum, l) => sum + l.refills, 0) / logs.length / totalDays) * 1000) / 1000,
    maxRefillsPerDay: Math.round(Math.max(...logs.map((l) => l.refills / totalDays)) * 1000) / 1000,
  }
}

/**
 * P35 reports: the day each feature unlocks and each rung is reached (censored percentiles), guarantee fires per hero
 * by rung, the ladder's gold as a share of all gold earned, and where heroes stand at the end (companion rungs are the
 * ones a device-only player waits on).
 */
function careerReport(logs: HeroLog[], totalDays: number, content: ContentCatalog, censored: (ticks: (number | undefined)[]) => { p10: number | string; median: number | string; p90: number | string; reached: number }) {
  // D132: a retired rung is walked past, so it has nothing to report.
  const rungs = content.career!.rungs.filter((rung) => !rung.retired)
  const careerGold = logs.reduce((sum, l) => sum + l.careerGold, 0)
  const allGold = logs.reduce((sum, l) => sum + l.goldEarned, 0)
  const standing = new Map<string, number>()
  for (const l of logs) standing.set(l.finalRung ?? 'done', (standing.get(l.finalRung ?? 'done') ?? 0) + 1)
  return {
    unlocks: content.unlocks === undefined ? null : Object.fromEntries(FEATURES.map((feature) => [feature, { level: content.unlocks![feature], ...censored(logs.map((l) => l.unlockTick.get(feature))) }])),
    rungs: rungs.map((rung) => ({
      id: rung.id,
      companion: rung.companion ?? false,
      ...censored(logs.map((l) => l.rungTick.get(rung.id))),
      guaranteeFiresPerHero: rung.guarantee === undefined ? null : Math.round((logs.reduce((sum, l) => sum + (l.guaranteeFires.get(rung.id) ?? 0), 0) / logs.length) * 1000) / 1000,
    })),
    careerGoldSharePct: allGold > 0 ? round1((careerGold / allGold) * 100) : null,
    careerGoldPerHero: round1(careerGold / logs.length),
    rungsReachedMedian: pct(logs.map((l) => l.rungTick.size), 0.5),
    finalRung: Object.fromEntries([...standing.entries()].sort((a, b) => b[1] - a[1])),
    waitingOnCompanionPct: round1((logs.filter((l) => rungs.find((r) => r.id === l.finalRung)?.companion).length / logs.length) * 100),
    days: totalDays,
  }
}

/** D131 reports: per strength, finds and drinks per hero-day and the median final count; majors combined per hero and the material that took. */
function potionStrengthReport(logs: HeroLog[], content: ContentCatalog, totalDays: number) {
  const perHeroDay = (pick: (l: HeroLog) => number) => round1(logs.reduce((sum, l) => sum + pick(l), 0) / logs.length / totalDays)
  const recipe = content.potions!.combine
  return {
    byStrength: Object.fromEntries(content.potions!.strengths.map((s) => [s.id, {
      foundPerHeroDay: perHeroDay((l) => l.potionsFoundByStrength.get(s.id) ?? 0),
      usedPerHeroDay: perHeroDay((l) => l.potionsUsedByStrength.get(s.id) ?? 0),
      finalMedian: pct(logs.map((l) => l.finalPotionsByStrength.get(s.id) ?? 0), 0.5),
    }])),
    combinedPerHero: round1(logs.reduce((sum, l) => sum + l.potionsCombined, 0) / logs.length),
    combinedMedian: pct(logs.map((l) => l.potionsCombined), 0.5),
    materialsSpentPerHero: Object.fromEntries(Object.entries(recipe.materials).map(([id, n]) => [id, round1((logs.reduce((sum, l) => sum + l.potionsCombined, 0) / logs.length) * n)])),
    restTicksPerHeroDay: perHeroDay((l) => l.stateTicks.get('resting') ?? 0),
  }
}

/**
 * D129 reports: gold at each 30-day mark, materials held at the end, gear salvaged and gold spent on the workbench
 * per hero, and the day each slot reached each step (censored percentiles), so the sink can be read against the hoard.
 */
function workbenchReport(logs: HeroLog[], content: ContentCatalog, censored: (ticks: (number | undefined)[]) => { p10: number | string; median: number | string; p90: number | string; reached: number }) {
  const days = [...new Set(logs.flatMap((l) => [...l.goldByDay.keys()]))].sort((a, b) => a - b)
  const keys = [...new Set(logs.flatMap((l) => [...l.stepTick.keys()]))].sort()
  return {
    goldByDay: Object.fromEntries(days.map((day) => [`day${day}`, { median: pct(logs.map((l) => l.goldByDay.get(day) ?? 0), 0.5), p90: pct(logs.map((l) => l.goldByDay.get(day) ?? 0), 0.9) }])),
    materialsHeldMedian: Object.fromEntries(content.workbench!.materials.map((m) => [m.id, pct(logs.map((l) => l.materialsHeld[m.id] ?? 0), 0.5)])),
    salvagedPerHero: round1(logs.reduce((sum, l) => sum + l.itemsSalvaged, 0) / logs.length),
    workbenchGoldMedian: pct(logs.map((l) => l.workbenchGold), 0.5),
    steps: Object.fromEntries(keys.map((key) => [key, censored(logs.map((l) => l.stepTick.get(key)))])),
  }
}

/**
 * Share of heroes holding each achievement at each snapshot day, plus a band
 * census, so a release can check that monster tier V stays Legendary at day 30.
 */
function achievementShares(logs: HeroLog[]) {
  const byDay: Record<string, { bands: Record<string, number>; monsterTiers: Record<string, number[]>; shares: Record<string, number> }> = {}
  for (const day of ACHIEVEMENT_DAYS) {
    const counts = new Map<string, number>()
    let heroes = 0
    for (const log of logs) {
      const ids = log.achievementsByDay.get(day)
      if (ids === undefined) continue
      heroes += 1
      for (const id of ids) counts.set(id, (counts.get(id) ?? 0) + 1)
    }
    if (heroes === 0) continue
    const shares: Record<string, number> = {}
    const bands: Record<string, number> = { common: 0, uncommon: 0, rare: 0, legendary: 0 }
    for (const def of ACHIEVEMENTS) {
      const share = (counts.get(def.id) ?? 0) / heroes
      shares[def.id] = Math.round(share * 1000) / 10
      bands[rarityBand(share)] = (bands[rarityBand(share)] ?? 0) + 1
    }
    const monsterTiers: Record<string, number[]> = {}
    for (const family of ACHIEVEMENT_FAMILIES) {
      if (!family.id.startsWith('slay_')) continue
      monsterTiers[family.id] = ACHIEVEMENTS.filter((a) => a.family === family.id).map((a) => shares[a.id]!)
    }
    byDay[`day${day}`] = { bands, monsterTiers, shares }
  }
  return byDay
}

function main() {
  const options = args()
  if (!Number.isSafeInteger(options.heroes) || options.heroes < 1 || options.heroes > 10_000) throw new Error('--heroes must be an integer from 1 to 10000')
  if (!Number.isSafeInteger(options.days) || options.days < 1 || options.days > 365) throw new Error('--days must be an integer from 1 to 365')
  if (options.ticks !== undefined && (!Number.isSafeInteger(options.ticks) || options.ticks < 1 || options.ticks > 365 * TICKS_PER_DAY)) throw new Error('--ticks must be an integer from 1 to 35040')
  const catalog = catalogs[options.content]
  if (!catalog) throw new Error(`unknown content ${options.content}`)
  const content: ContentCatalog = catalog
  const started = Date.now()
  const ticks = options.ticks ?? options.days * TICKS_PER_DAY
  const totalDays = ticks / TICKS_PER_DAY
  const policies = content.todo === undefined ? POLICIES : [...POLICIES, TIMEZONE_ABUSE]
  const reports = policies.map((policy) => summarize(policy, simulateCohort(policy, options.heroes, totalDays, content, ticks, options.stance), totalDays, content))
  const meta = { reportVersion: 3, contentVersion: content.contentVersion, stance: options.stance ?? null, simulationVersion: SIMULATION_VERSION, heroes: options.heroes, days: totalDays, ticks, seconds: (Date.now() - started) / 1000, cumulativeXpToLevel8: cumulativeXpToReach(8), deathDenominator: 'hero-days with at least one exploring/resting tick in the biome; multiple deaths count once for probability', uncertainty: 'Wilson 95% descriptive interval; repeated days per seeded hero are correlated, not a player forecast' }
  if (options.json) writeFileSync(options.json, JSON.stringify({ meta, reports }, null, 2) + '\n')
  console.log(JSON.stringify(meta))
  for (const r of reports) {
    console.log(`\n== ${r.policy} (${r.heroes} heroes x ${r.days} days)`)
    for (const x of r.reach) console.log(`  L${x.level}: p10 ${x.p10}d  median ${x.median}d  p90 ${x.p90}d  reached ${x.reached}/${r.heroes}`)
    console.log(`  final level median ${r.finalLevelMedian}; death hero-days ${JSON.stringify(r.deathByBiome)}`)
    console.log(`  state % ${JSON.stringify(r.stateSharePct)}; first sleep ${JSON.stringify(r.firstInventorySleep)}`)
    console.log(`  gear/day ${r.gearPerDay}; best-in-slot ${JSON.stringify(r.bestInSlot)}; gold end ${JSON.stringify(r.goldDayEnd)}; gold day 30 median ${r.goldDay30}`)
    console.log(`  jackpot gold share ${r.jackpotGoldShare}%; elites/hero-day ${r.elitesPerHeroDay}`)
    if (r.todo) {
      const t = r.todo
      console.log(`  to-do: tasks/hero-day ${t.tasksPerHeroDay} (awake ${t.tasksPerAwakeHeroDay}, ${t.awakeDaySharePct}% of days awake); days with 2+ ${t.daysWithTwoPlusPct}% (awake ${t.awakeDaysWithTwoPlusPct}%); task gold ${t.taskGoldSharePct}% of other gold (${t.taskGoldPerHeroDay}/hero-day)`)
      console.log(`  to-do: stale swaps ${t.staleSwapsPerTaskWrittenPct}% of tasks written; refills/hero-day ${t.refillsPerHeroDay} (max hero ${t.maxRefillsPerDay}); hours to finish ${Object.entries(t.hoursToFinish).map(([k, h]) => `${k} ${h.median}h (p10 ${h.p10}, p90 ${h.p90}, n ${h.finished})`).join('; ')}`)
    }
    if (r.career) {
      const c = r.career
      console.log(`  unlocks: ${Object.entries(c.unlocks ?? {}).map(([f, u]) => `${f} L${u.level} ${u.median}d`).join('; ')}`)
      console.log(`  career: ${c.rungs.map((x) => `${x.id} ${x.median}d (${x.reached}/${r.heroes}${x.guaranteeFiresPerHero === null ? '' : `, forced ${x.guaranteeFiresPerHero}/hero`})`).join('; ')}`)
      console.log(`  career: gold ${c.careerGoldSharePct}% of all gold (${c.careerGoldPerHero}/hero); rungs reached median ${c.rungsReachedMedian}; waiting on a companion rung at the end ${c.waitingOnCompanionPct}%; standing ${JSON.stringify(c.finalRung)}`)
    }
    if (r.workbench) {
      const w = r.workbench
      console.log(`  workbench: gold ${Object.entries(w.goldByDay).map(([d, g]) => `${d} ${g.median} (p90 ${g.p90})`).join('; ')}; spent median ${w.workbenchGoldMedian}; salvaged/hero ${w.salvagedPerHero}; held ${JSON.stringify(w.materialsHeldMedian)}`)
      console.log(`  workbench: ${Object.entries(w.steps).map(([k, s]) => `${k} ${s.median}d (${s.reached}/${r.heroes})`).join('; ')}`)
    }
    console.log(`  potions ${JSON.stringify(r.potions)}; useful gear/day ${r.usefulGearPerDay}; equipped upgrades/hero ${r.equippedUpgradesPerHero}`)
    if (r.potionStrengths) {
      const p = r.potionStrengths
      console.log(`  strengths: ${Object.entries(p.byStrength).map(([id, s]) => `${id} found ${s.foundPerHeroDay}/d used ${s.usedPerHeroDay}/d end ${s.finalMedian}`).join('; ')}; combined/hero ${p.combinedPerHero} (median ${p.combinedMedian}); spent ${JSON.stringify(p.materialsSpentPerHero)}; rest ticks/hero-day ${p.restTicksPerHeroDay}`)
    }
    console.log(`  bag ${r.bag.reach.map((b) => `${b.capacity}: ${b.median}d (p10 ${b.p10}, p90 ${b.p90})`).join('; ')}; finds/hero ${r.bag.findsPerHero}; buys/hero ${r.bag.purchasesPerHero}; gold spent median ${r.bag.goldSpentMedian}`)
    console.log(`  XP last day ${JSON.stringify(r.xpLastDay)}; last 7 days ${JSON.stringify(r.xpLast7Days)}`)
    for (const [day, a] of Object.entries(r.achievements)) {
      console.log(`  achievements ${day}: bands ${JSON.stringify(a.bands)}; monster tier shares % ${Object.entries(a.monsterTiers).map(([f, tiers]) => `${f.slice(5)} ${tiers.join('/')}`).join('; ')}`)
    }
  }
}

if (process.argv[1] && import.meta.url === pathToFileURL(process.argv[1]).href) main()
