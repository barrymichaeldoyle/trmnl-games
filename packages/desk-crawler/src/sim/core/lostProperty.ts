import { createRng, type Rng } from './rng'
import type { ContentCatalog, ItemSnapshot, LostSpare, NewItem, SpareDrop, StreamSeeds } from './types'

/**
 * Lost property (D145). A knockout drops a named spare copy of one equipped item on that floor; another player's hero
 * finds it in place of an ordinary loot gear find. The `graveyard` stream's draws have fixed positions so the adapter
 * and the core read the same numbers: 1 which equipped item drops (index), 2 whether to look (permille), 3 where to
 * look on the floor (uint32). The stream exists only under a catalog with lost-property rules, so earlier catalogs
 * draw nothing and replay unchanged.
 */

export interface FindPlan {
  /** Where the adapter starts looking among the floor's lying spares: the first at or after this shard, wrapping once. */
  readonly shard: number
}

/** The graveyard stream for this tick, or undefined when lost property cannot happen (no rules or no seed). */
export function graveyardStream(streams: StreamSeeds, content: ContentCatalog): Rng | undefined {
  return content.lostProperty === undefined || streams.graveyard === undefined ? undefined : createRng(streams.graveyard)
}

interface GraveyardDraws {
  /** Draw 1: 0 or 1, which equipped item drops when the hero wears both. */
  readonly slot: number
  readonly plan: FindPlan | undefined
  /** Draw 3, also where a spare dropped this tick lies among the floor's spares. */
  readonly shard: number
}

function drawAll(rng: Rng, content: ContentCatalog): GraveyardDraws {
  const slot = rng.int(0, 1)
  const look = rng.int(1, 1000) <= content.lostProperty!.lookPermille
  const shard = Math.floor(rng.next() * 2 ** 32)
  return { slot, plan: look ? { shard } : undefined, shard }
}

/** The tick's three draws, or undefined without rules or a seed. The core and the adapter both call this. */
export function graveyardDraws(streams: StreamSeeds, content: ContentCatalog): GraveyardDraws | undefined {
  const rng = graveyardStream(streams, content)
  return rng === undefined ? undefined : drawAll(rng, content)
}

/**
 * For the adapter, before it calls the core: whether to look for a spare on the hero's floor this tick. Pure; the
 * core takes the same draws from the same seed, so the two can never disagree.
 */
export function planFind(streams: StreamSeeds, content: ContentCatalog): FindPlan | undefined {
  return graveyardDraws(streams, content)?.plan
}

/** The equipped item a knockout leaves a spare of: draw 1 picks when both are worn. Undefined with nothing equipped. */
export function spareSource(hero: { weaponId?: string; armorId?: string }, inventory: readonly ItemSnapshot[], slot: number): ItemSnapshot | undefined {
  const weapon = hero.weaponId === undefined ? undefined : inventory.find((item) => item.id === hero.weaponId)
  const armor = hero.armorId === undefined ? undefined : inventory.find((item) => item.id === hero.armorId)
  if (weapon !== undefined && armor !== undefined) return slot === 0 ? weapon : armor
  return weapon ?? armor
}

/** What a spare records: identity only. Stats, workbench tier and reinforcement stay behind. */
export function spareOf(item: ItemSnapshot, biomeId: string, tick: number, shard: number): SpareDrop {
  return {
    templateId: item.templateId,
    kind: item.kind === 'armor' ? 'armor' : 'weapon',
    rarity: item.rarity,
    ...(item.affixId === undefined ? {} : { affixId: item.affixId }),
    name: item.name,
    biomeId,
    tick,
    shard,
  }
}

/**
 * The finder's item, rebuilt from its own catalog the way a fresh find is: the template's tier and the spare's
 * rarity set the stats; the affix stays when the catalog knows it for that rarity. Undefined when the catalog lacks
 * the template, its tier or the rarity, so the fresh find stands.
 */
export function spareItem(content: ContentCatalog, spare: LostSpare): NewItem | undefined {
  const template = content.gearTemplates.find((t) => t.id === spare.templateId && t.kind === spare.kind)
  const stats = template === undefined ? undefined : content.gearTiers[template.tier]
  const rarity = content.rarities.find((rule) => rule.rarity === spare.rarity)
  if (template === undefined || stats === undefined || rarity === undefined) return undefined
  const affixKnown = spare.affixId !== undefined && content.affixRarities?.includes(spare.rarity) === true && content.affixes?.some((affix) => affix.id === spare.affixId) === true
  return {
    ...(affixKnown ? { affixId: spare.affixId } : {}),
    templateId: template.id,
    contentVersion: content.contentVersion,
    kind: template.kind,
    name: template.name,
    rarity: spare.rarity,
    requiredLevel: stats.requiredLevel,
    attack: template.kind === 'weapon' ? stats.weaponAttack + (template.statOffset ?? 0) + rarity.statBonus : 0,
    defense: template.kind === 'armor' ? stats.armorDefense + (template.statOffset ?? 0) + rarity.statBonus : 0,
    saleValue: stats.saleValue * rarity.saleMultiplier,
    quantity: 1,
  }
}
