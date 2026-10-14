import { bagUsed } from './bag'
import { potionCap } from './pouch'
import { strengthOf } from './potions'
import { heroMaxHp, xpToLeave } from './stats'
import { todoProblems } from './todo'
import { careerProblems } from './career'
import { isGear, itemProblems } from './workbench'
import { MAX_INVENTORY_ROWS } from './limits'
import type { ContentCatalog, HeroState, ItemSnapshot } from './types'

/** A recognized pure-core failure. The adapter quarantines the hero; it never retries blindly. */
export class SimulationInvariantError extends Error {
  constructor(
    readonly code: string,
    message: string,
  ) {
    super(`${code}: ${message}`)
    this.name = 'SimulationInvariantError'
  }
}

const fail = (code: string, message: string): never => {
  throw new SimulationInvariantError(code, message)
}

const isCount = (value: number): boolean => Number.isSafeInteger(value) && value >= 0

/** Cross-field hero/inventory invariants shared by input and output validation. */
export function assertHeroInvariants(hero: HeroState, inventory: readonly ItemSnapshot[], content: ContentCatalog): void {
  const { constants } = content
  if (!Number.isSafeInteger(hero.level) || hero.level < 1) fail('LEVEL', `invalid level ${hero.level}`)
  if (!isCount(hero.xp) || hero.xp >= xpToLeave(hero.level)) fail('XP', `xp ${hero.xp} outside level ${hero.level}`)
  if (!isCount(hero.lifetimeXp)) fail('LIFETIME_XP', 'lifetime XP must be a safe nonnegative integer')
  if (!isCount(hero.gold)) fail('GOLD', `invalid gold ${hero.gold}`)
  const max = heroMaxHp(content, hero)
  if (!isCount(hero.hp) || hero.hp > max) fail('HP', `hp ${hero.hp} outside 0..${max}`)
  if (!isCount(hero.lastLevelUpTick)) fail('LEVEL_TICK', 'invalid last level-up tick')
  for (const [name, value] of Object.entries(hero.counters)) {
    if (name === 'monsterWins' || name === 'biomesVisited') continue
    if (typeof value !== 'number' || !isCount(value)) fail('COUNTER', `counter ${name} invalid`)
  }
  // D133: arrivals per biome; a biome id is never retired, so every key must be one the catalog knows.
  const knownBiomes = new Set(content.biomes.map((biome) => biome.id))
  for (const [id, visits] of Object.entries(hero.counters.biomesVisited ?? {})) {
    if (!knownBiomes.has(id)) fail('COUNTER', `visits for unknown biome ${id}`)
    if (!isCount(visits)) fail('COUNTER', `visits for ${id} invalid`)
  }
  const monsterIds = new Set(content.monsters.map((monster) => monster.id))
  for (const [id, wins] of Object.entries(hero.counters.monsterWins)) {
    if (!monsterIds.has(id)) fail('COUNTER', `monster wins for unknown monster ${id}`)
    if (!isCount(wins)) fail('COUNTER', `monster wins for ${id} invalid`)
  }

  if (hero.stance !== undefined && !['cautious', 'balanced', 'bold'].includes(hero.stance)) fail('STANCE', `unknown stance ${hero.stance}`)
  if (hero.potionCap !== undefined && content.potionPouch !== undefined && !content.potionPouch.tiers.some((tier) => tier.cap === hero.potionCap)) fail('POUCH', `potion cap ${hero.potionCap} is not a pouch tier`)
  if (hero.potionCap !== undefined && !isCount(hero.potionCap)) fail('POUCH', 'invalid potion cap')
  if (hero.effects !== undefined && (hero.effects.length > 3 || hero.effects.some((effect) => typeof effect.id !== 'string' || !Number.isSafeInteger(effect.untilTick)))) fail('EFFECTS', 'invalid effects')
  if (hero.choice !== undefined && content.choices !== undefined && !content.choices.events.some((event) => event.id === hero.choice?.eventId)) fail('CHOICE', `unknown event ${hero.choice.eventId}`)
  // D163: the shape only; whether the pinned catalog can still fight it is the simulator's call (it drops it quietly).
  const standoff = hero.standoff
  if (standoff !== undefined) {
    if (!isCount(standoff.hp) || !isCount(standoff.maxHp) || standoff.hp < 1 || standoff.hp > standoff.maxHp) fail('STANDOFF', 'standoff HP must be 1 to its maximum')
    if (!isCount(standoff.startedTick) || !Number.isSafeInteger(standoff.untilTick) || standoff.startedTick >= standoff.untilTick) fail('STANDOFF', 'a standoff must start before it ends')
    if ((hero.status === 'exploring' || hero.status === 'resting') && standoff.biomeId !== hero.biomeId) fail('STANDOFF', 'a standoff stays on the hero\'s floor')
  }
  // P31: a stored list is checked only under a catalog that knows to-do rules; an earlier catalog carries it untouched.
  if (hero.todo !== undefined && content.todo !== undefined) {
    const problem = todoProblems(hero.todo, content)
    if (problem !== undefined) fail('TODO', problem)
  }
  // P35: the same for a career state.
  if (hero.career !== undefined && content.career !== undefined) {
    const problem = careerProblems(hero.career, content)
    if (problem !== undefined) fail('CAREER', problem)
  }
  const biomeIds = new Set(content.biomes.map((biome) => biome.id))
  if (!biomeIds.has(hero.biomeId)) fail('BIOME', `unknown biome ${hero.biomeId}`)
  if (hero.targetBiomeId !== undefined && !biomeIds.has(hero.targetBiomeId)) fail('TARGET', `unknown target ${hero.targetBiomeId}`)

  switch (hero.status) {
    case 'dead':
      if (hero.hp !== 0 || hero.reviveAtTick === undefined) fail('DEAD', 'dead requires hp 0 and a revival tick')
      break
    case 'travelling':
      if (hero.targetBiomeId === undefined || hero.arriveAtTick === undefined) fail('TRAVEL', 'travelling requires target and arrival')
      break
    case 'paused':
      if (hero.pausedFromStatus === undefined) fail('PAUSED', 'paused requires its prior status')
      break
    case 'sleeping':
      if (hero.hp === 0) fail('SLEEP', 'sleeping hero must be alive')
      // D29: a pending Resume may carry a destination without an arrival tick.
      if (hero.targetBiomeId !== undefined && hero.wakeAtTick === undefined) fail('SLEEP', 'destination requires a pending wake')
      break
    case 'exploring':
    case 'resting':
      if (hero.hp === 0) fail('ALIVE', `${hero.status} hero must have hp`)
      break
  }
  if (hero.status !== 'dead' && hero.reviveAtTick !== undefined) fail('STALE_REVIVE', 'revival tick outside dead state')
  if (hero.status !== 'travelling' && hero.arriveAtTick !== undefined) fail('STALE_ARRIVAL', 'arrival tick outside travel')
  if (hero.status !== 'travelling' && hero.status !== 'sleeping' && hero.targetBiomeId !== undefined) fail('STALE_TARGET', 'target outside travel/pending wake')
  if (hero.status !== 'sleeping' && hero.wakeAtTick !== undefined) fail('STALE_WAKE', 'wake tick outside sleep')
  if (hero.status !== 'paused' && hero.pausedFromStatus !== undefined) fail('STALE_PAUSE', 'paused status outside pause')

  if (inventory.length > MAX_INVENTORY_ROWS) fail('INVENTORY_SIZE', `${inventory.length} rows`)
  const ids = new Set<string>()
  // D131: one row per potion strength, every strength under one pouch cap.
  const potionTemplates = new Set<string>()
  let potionTotal = 0
  const materialRows = new Set<string>()
  for (let i = 0; i < inventory.length; i += 1) {
    const item = inventory[i]!
    if (ids.has(item.id)) fail('ITEM_DUPLICATE', item.id)
    ids.add(item.id)
    if (i > 0 && inventory[i - 1]!.id >= item.id) fail('ITEM_ORDER', 'inventory must be sorted by ID')
    for (const value of [item.requiredLevel, item.attack, item.defense, item.saleValue, item.quantity]) {
      if (!isCount(value)) fail('ITEM_STAT', `item ${item.id} has an invalid number`)
    }
    if (item.kind === 'potion') {
      if (potionTemplates.has(item.templateId)) fail('POTION_ROWS', `two rows of ${item.templateId}`)
      potionTemplates.add(item.templateId)
      if (item.quantity < 1 || item.quantity > potionCap(content, hero)) fail('POTION_QTY', `potion quantity ${item.quantity}`)
      potionTotal += item.quantity
      if (content.potions !== undefined && strengthOf(content, item.templateId) === undefined) fail('POTION_KIND', `unknown potion ${item.templateId}`)
    } else if (item.kind === 'material') {
      // D129: one row per material kind, checked under a catalog that knows the workbench; an earlier catalog carries it.
      if (materialRows.has(item.templateId)) fail('MATERIAL_ROWS', `two rows of ${item.templateId}`)
      materialRows.add(item.templateId)
      if (item.quantity < 1) fail('MATERIAL_QTY', `material quantity ${item.quantity}`)
      if (content.workbench !== undefined) {
        const problem = itemProblems(content, item)
        if (problem !== undefined) fail('MATERIAL', problem)
      }
    } else if (item.quantity !== 1) {
      fail('GEAR_QTY', `gear ${item.id} quantity ${item.quantity}`)
    } else {
      const problem = itemProblems(content, item)
      if (problem !== undefined) fail('WORKBENCH', problem)
    }
  }
  if (potionTotal > potionCap(content, hero)) fail('POTION_QTY', `${potionTotal} potions over the pouch`)

  const byId = new Map(inventory.map((item) => [item.id, item]))
  const ref = (id: string | undefined, kind: 'weapon' | 'armor' | 'gear', code: string) => {
    if (id === undefined) return
    const item = byId.get(id)
    if (item === undefined) fail(code, `missing item ${id}`)
    else if (kind === 'gear' ? !isGear(item.kind) : item.kind !== kind) fail(code, `item ${id} has wrong kind`)
  }
  ref(hero.weaponId, 'weapon', 'WEAPON_REF')
  ref(hero.armorId, 'armor', 'ARMOR_REF')
  ref(hero.heldItemId, 'gear', 'HELD_REF')
  if (hero.heldItemId !== undefined && (hero.heldItemId === hero.weaponId || hero.heldItemId === hero.armorId)) {
    fail('HELD_EQUIPPED', 'held gear cannot be equipped')
  }
  if (!content.bagLadder.tiers.some((tier) => tier.capacity === hero.bagCapacity)) fail('BAG_CAPACITY', `capacity ${hero.bagCapacity} is not a bag tier`)
  if (bagUsed(hero, inventory) > hero.bagCapacity) fail('BAG_FULL', 'bag gear above capacity')
}
