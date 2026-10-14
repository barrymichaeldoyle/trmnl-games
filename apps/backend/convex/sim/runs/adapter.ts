import type { Doc, Id } from '../../_generated/dataModel'
import type { MutationCtx } from '../../_generated/server'
import type { HeroState, ItemChange, ItemSnapshot, LogDetail, SimulationResult } from '@trmnl-games/desk-crawler/sim/core/types'
import { withCounterDefaults } from '@trmnl-games/desk-crawler/sim/core/starter'

/** Convex hero document -> pure domain state (domain-contracts.md). */
export function toHeroState(hero: Doc<'heroes'>): HeroState {
  return {
    id: hero._id,
    class: hero.class,
    level: hero.level,
    xp: hero.xp,
    lifetimeXp: hero.lifetimeXp,
    hp: hero.hp,
    gold: hero.gold,
    status: hero.status,
    biomeId: hero.biomeId,
    ...(hero.targetBiomeId === undefined ? {} : { targetBiomeId: hero.targetBiomeId }),
    ...(hero.arriveAtTick === undefined ? {} : { arriveAtTick: hero.arriveAtTick }),
    ...(hero.reviveAtTick === undefined ? {} : { reviveAtTick: hero.reviveAtTick }),
    ...(hero.pausedFromStatus === undefined ? {} : { pausedFromStatus: hero.pausedFromStatus }),
    ...(hero.wakeAtTick === undefined ? {} : { wakeAtTick: hero.wakeAtTick }),
    ...(hero.weaponId === undefined ? {} : { weaponId: hero.weaponId }),
    ...(hero.armorId === undefined ? {} : { armorId: hero.armorId }),
    ...(hero.heldItemId === undefined ? {} : { heldItemId: hero.heldItemId }),
    bagCapacity: hero.bagCapacity,
    lastLevelUpTick: hero.lastLevelUpTick,
    counters: withCounterDefaults(hero.counters),
    ...(hero.stance === undefined ? {} : { stance: hero.stance }),
    ...(hero.potionCap === undefined ? {} : { potionCap: hero.potionCap }),
    ...(hero.merchant === undefined ? {} : { merchant: hero.merchant }),
    ...(hero.choice === undefined ? {} : { choice: hero.choice }),
    ...(hero.effects === undefined ? {} : { effects: hero.effects }),
    ...(hero.todo === undefined ? {} : { todo: hero.todo }),
    ...(hero.career === undefined ? {} : { career: hero.career }),
    ...(hero.occasion === undefined ? {} : { occasion: hero.occasion }),
    ...(hero.standoff === undefined ? {} : { standoff: hero.standoff }),
  }
}

/** Item documents -> snapshots sorted lexically by ID (a reproducibility requirement). */
export function toInventory(items: readonly Doc<'items'>[]): ItemSnapshot[] {
  return items
    .map((item) => ({
      id: item._id,
      templateId: item.templateId,
      contentVersion: item.contentVersion,
      kind: item.kind,
      name: item.name,
      rarity: item.rarity,
      requiredLevel: item.requiredLevel,
      attack: item.attack,
      defense: item.defense,
      saleValue: item.saleValue,
      quantity: item.quantity,
      ...(item.affixId === undefined ? {} : { affixId: item.affixId }),
      ...(item.tier === undefined ? {} : { tier: item.tier }),
      ...(item.reinforced === undefined ? {} : { reinforced: item.reinforced }),
    }))
    .sort((a, b) => (a.id < b.id ? -1 : a.id > b.id ? 1 : 0))
}

/**
 * Apply only simulator-owned hero fields and item directives. Names, ownership,
 * activation, equipment references and quarantine markers are never written
 * from a core result. Optional fields the core cleared are removed.
 */
export async function applyResult(
  ctx: MutationCtx,
  hero: Doc<'heroes'>,
  items: readonly Doc<'items'>[],
  result: SimulationResult,
  now: number,
  /** D145: the owner label for a created item that is a found spare. */
  spareLabel?: Pick<Doc<'items'>, 'relicUserId' | 'relicName' | 'relicNameVersion'>,
): Promise<void> {
  const next = result.nextHero
  const patch: Partial<Doc<'heroes'>> = {
    level: next.level,
    xp: next.xp,
    lifetimeXp: next.lifetimeXp,
    hp: next.hp,
    gold: next.gold,
    status: next.status,
    biomeId: next.biomeId,
    targetBiomeId: next.targetBiomeId,
    arriveAtTick: next.arriveAtTick,
    reviveAtTick: next.reviveAtTick,
    pausedFromStatus: next.pausedFromStatus,
    wakeAtTick: next.wakeAtTick,
    bagCapacity: next.bagCapacity,
    potionCap: next.potionCap,
    // Convex stores mutable arrays; the core hands out readonly ones.
    merchant: next.merchant === undefined ? undefined : { ...next.merchant, offers: next.merchant.offers.map((offer) => ({ ...offer })) },
    choice: next.choice,
    effects: next.effects === undefined ? undefined : next.effects.map((effect) => ({ ...effect })),
    // P31: an earlier catalog carries the list untouched, so this never clears one.
    todo: next.todo === undefined ? undefined : { ...next.todo, tasks: next.todo.tasks.map((task) => ({ ...task })) },
    // P35: same for the career state.
    career: next.career === undefined ? undefined : { ...next.career, reached: next.career.reached.map((entry) => ({ ...entry })), unclaimed: next.career.unclaimed === undefined ? undefined : next.career.unclaimed.map((entry) => ({ ...entry })) },
    // D139: an earlier catalog carries the mark untouched, so this never clears one.
    occasion: next.occasion === undefined ? undefined : { ...next.occasion },
    // D163: cleared by the core on a fall, knockout, travel or its clock; an earlier catalog drops it the same way.
    standoff: next.standoff === undefined ? undefined : { ...next.standoff },
    lastLevelUpTick: next.lastLevelUpTick,
    counters: next.counters,
  }
  const byId = new Map(items.map((item) => [item._id as string, item]))
  for (const change of result.itemChanges) {
    if (change.type === 'potion_decrement') {
      const row = byId.get(change.itemId)
      if (!row) throw new Error('potion row missing')
      if (change.deleteRow) await ctx.db.delete(row._id)
      else await ctx.db.patch(row._id, { quantity: row.quantity - 1 })
    } else if (change.type === 'potion_increment') {
      const row = byId.get(change.itemId)
      if (!row) throw new Error('potion row missing')
      await ctx.db.patch(row._id, { quantity: row.quantity + 1 })
    } else {
      const id: Id<'items'> = await ctx.db.insert('items', { ...change.item, heroId: hero._id, createdAt: now, ...(change.spare === true && spareLabel !== undefined ? spareLabel : {}) })
      if (change.destination === 'held') patch.heldItemId = id
    }
  }
  await ctx.db.patch(hero._id, patch)
}

/** Copy core detail and annotate combat gear from the actual transactional award. No simulator/RNG change. */
export function storedDetail(detail: LogDetail, changes: readonly ItemChange[] = [], rival?: { userId: Id<'users'>; nameVersion: number }): Doc<'tickLogs'>['detail'] {
  const gear = changes.find(change => change.type === 'create' && change.item.kind !== 'potion')
  const outcome = detail.outcome.variant === 'combat' ? {
    ...detail.outcome,
    rounds: [...detail.outcome.rounds],
    ...(detail.outcome.gearDropped && gear?.type === 'create' ? { gearRarity: gear.item.rarity } : {}),
  } : detail.outcome.variant === 'merchant' ? { ...detail.outcome, offers: detail.outcome.offers.map((offer) => ({ ...offer })) }
    // D110: the rival's owner and name version let reads mask a name repaired after the raid.
    // D141: a meeting names the other hero the same way.
    : (detail.outcome.variant === 'raid' || detail.outcome.variant === 'meeting' || detail.outcome.variant === 'lost_property') && rival !== undefined ? { ...detail.outcome, rivalUserId: rival.userId, rivalNameVersion: rival.nameVersion }
    // D145: a found spare names its owner inside the loot outcome.
    : detail.outcome.variant === 'loot' && detail.outcome.spare !== undefined ? { ...detail.outcome, spare: { ...detail.outcome.spare, ...(rival === undefined ? {} : { rivalUserId: rival.userId, rivalNameVersion: rival.nameVersion }) } }
    : detail.outcome.variant === 'todo' ? { ...detail.outcome, tasks: detail.outcome.tasks.map((task) => ({ ...task })) }
    : detail.outcome
  return { ...detail, outcome }
}
