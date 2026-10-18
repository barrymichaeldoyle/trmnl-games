import { currentHero, gameProfile, setCurrentHero } from './lib/gameProfile'
import { v } from 'convex/values'
import type { Doc, Id } from './_generated/dataModel'
import { mutation, query, type MutationCtx, type QueryCtx } from './_generated/server'
import { appError } from './lib/errors'
import { HERO_NAME_RULE, validateName } from './lib/names'
import { commandLog, currentUser, intentReturns, isIntentRefusal, requirePlayableHero, runIntent } from './lib/intent'
import { heroGender } from './schema'
import { heroMaxHp, pctOf } from '@trmnl-games/desk-crawler/sim/core/stats'
import { bagUsed, currentTier, guaranteedTierIndex, isBagFull, nextEarlyTier, nextTier } from '@trmnl-games/desk-crawler/sim/core/bag'
import { currentPouchTier, guaranteedPouchIndex, nextEarlyPouchTier, nextPouchTier, potionCap } from '@trmnl-games/desk-crawler/sim/core/pouch'
import { starterKit } from '@trmnl-games/desk-crawler/sim/core/starter'
import { affixById } from '@trmnl-games/desk-crawler/sim/core/modifiers'
import { ACTIVE_CONTENT, catalogs } from '@trmnl-games/desk-crawler/content'
import type { ContentCatalog, HeroState } from '@trmnl-games/desk-crawler/sim/core/types'
import { readWorld, worldContent } from './world'
import { awardAfterIntent } from './lib/achievements'
import { spareOwners } from './lib/lostProperty'
import { withCounterDefaults } from '@trmnl-games/desk-crawler/sim/core/starter'
import { addMaterials, applyStep, heldMaterials, isGear, materialShortfall, nextStep, salvageYield, workbenchSuffix } from '@trmnl-games/desk-crawler/sim/core/workbench'
import { bestFitPotion, combineBatches, healPctOf, potionItem, potionStrengths, potionWord, potionsHeld, strengthById, strengthOf } from '@trmnl-games/desk-crawler/sim/core/potions'
import type { ItemSnapshot, MaterialCount } from '@trmnl-games/desk-crawler/sim/core/types'
import { BATCH_ITEMS, INVENTORY_READ } from '@trmnl-games/desk-crawler/sim/core/limits'
import { unlocked, unlockLevel } from '@trmnl-games/desk-crawler/sim/core/career'

const currentTick = async (ctx: QueryCtx) => (await readWorld(ctx))?.currentTick ?? 0

const intentResult = intentReturns({
  operationId: v.string(),
  changed: v.boolean(),
  gold: v.optional(v.number()),
  hp: v.optional(v.number()),
  count: v.optional(v.number()),
  tick: v.optional(v.number()),
})

// Everything but recovering (dead) and paused. Travelling is included: it fights and finds nothing, so a sale or swap on the way cannot race the simulator.
const MANAGEABLE = new Set(['exploring', 'resting', 'travelling', 'sleeping'])

/** D142: a "Hi, my name is" name tag renames the current hero for 200 gold; one is in stock a day per account. */
export const NAME_TAG_PRICE = 200
export const NAME_TAG_GAP_MS = 24 * 60 * 60 * 1000
/** D149: a makeover changes the current hero's look for 200 gold, the name tag's price; any time, no daily stock. */
export const MAKEOVER_PRICE = 200

async function heroItems(ctx: QueryCtx, heroId: Id<'heroes'>): Promise<Doc<'items'>[]> {
  return await ctx.db
    .query('items')
    .withIndex('by_heroId', (q) => q.eq('heroId', heroId))
    .take(INVENTORY_READ)
}

const contentOf = async (ctx: QueryCtx): Promise<ContentCatalog> => worldContent(await readWorld(ctx))
const asBagHero = (hero: Doc<'heroes'>): Pick<HeroState, 'heldItemId' | 'weaponId' | 'armorId' | 'bagCapacity' | 'level' | 'counters'> => ({
  level: hero.level,
  counters: withCounterDefaults(hero.counters),
  bagCapacity: hero.bagCapacity,
  ...(hero.heldItemId === undefined ? {} : { heldItemId: hero.heldItemId }),
  ...(hero.weaponId === undefined ? {} : { weaponId: hero.weaponId }),
  ...(hero.armorId === undefined ? {} : { armorId: hero.armorId }),
})
const asSnapshots = (items: Doc<'items'>[]) => items.map((item) => ({ id: item._id as string, kind: item.kind }))
const bagFull = (hero: Doc<'heroes'>, items: Doc<'items'>[]) => isBagFull(asBagHero(hero), asSnapshots(items))

/**
 * D179: sorting the bag out is the resume. A sleeping hero with a free slot and nothing held
 * wakes on the next adventure, in the current area. Filling the bag again, or holding a find,
 * drops a wake that is not due yet so the next tick does not quarantine them.
 */
async function syncBagSleep(ctx: MutationCtx, heroId: Id<'heroes'>): Promise<void> {
  let hero = await ctx.db.get(heroId)
  if (!hero) return
  const items = await heroItems(ctx, hero._id)
  // D189: a slot that frees up takes the held find at once, so making room is all the player has to do.
  if (hero.heldItemId !== undefined && !bagFull(hero, items)) {
    const heldId = hero.heldItemId
    const held = items.find((item) => item._id === heldId)
    await ctx.db.patch(hero._id, { heldItemId: undefined })
    await commandLog(ctx, hero, 'claim_held', held ? `Claimed the ${itemLabel(held)}.` : 'Claimed the held find.')
    hero = (await ctx.db.get(heroId))!
  }
  if (hero.status !== 'sleeping') return
  const ready = hero.heldItemId === undefined && !bagFull(hero, await heroItems(ctx, hero._id))
  if (ready) {
    if (hero.wakeAtTick !== undefined) return
    const world = await readWorld(ctx)
    await ctx.db.patch(hero._id, { wakeAtTick: (world?.currentTick ?? 0) + 1 })
    await commandLog(ctx, hero, 'resume_adventures', 'Adventures resume within 15 minutes.')
    return
  }
  if (hero.wakeAtTick === undefined && hero.targetBiomeId === undefined) return
  await ctx.db.patch(hero._id, { wakeAtTick: undefined, targetBiomeId: undefined })
}

/** The bag ladder as the companion shows it (D61): current bag, next bag and how to get it. */
function bagLadderView(content: ContentCatalog, hero: Doc<'heroes'>) {
  const ladder = content.bagLadder
  const state = asBagHero(hero)
  const current = currentTier(content, state)
  const next = nextTier(content, state)
  const early = nextEarlyTier(content, state)
  const guaranteed = ladder.tiers[guaranteedTierIndex(ladder, state)]!
  return {
    name: current?.name ?? 'Bag',
    // D122: whether a loot draw can still find a bag, and the merchant's cut off the ladder price (0 under older catalogs).
    findable: ladder.findPermille > 0,
    merchantDiscountPct: content.merchant?.ladderDiscountPct ?? 0,
    next: next
      ? {
          id: next.id,
          name: next.name,
          capacity: next.capacity,
          price: next.price ?? null,
          milestoneLevel: next.milestone?.level ?? null,
          milestoneAdventures: next.milestone?.ticksExplored ?? null,
          // Purchases may run one bag ahead of the guaranteed one, never more; a shop tier (D122) is always buyable.
          buyable: early?.id === next.id,
          lockedUntilLevel: early?.id === next.id ? null : (ladder.tiers.find((tier) => tier.capacity > guaranteed.capacity)?.milestone?.level ?? null),
        }
      : null,
  }
}
/** The potion pouch ladder as the companion shows it (D77): cap, next pouch and how to get it. */
function pouchView(content: ContentCatalog, hero: Doc<'heroes'>) {
  const state = { level: hero.level, ...(hero.potionCap === undefined ? {} : { potionCap: hero.potionCap }) }
  const cap = potionCap(content, state)
  const ladder = content.potionPouch
  if (!ladder) return { name: 'Potion pouch', cap, findable: false, merchantDiscountPct: 0, next: null }
  const next = nextPouchTier(content, state)
  const early = nextEarlyPouchTier(content, state)
  const guaranteed = ladder.tiers[guaranteedPouchIndex(content, state)]!
  return {
    name: currentPouchTier(content, state)?.name ?? 'Potion pouch',
    cap,
    findable: ladder.findPermille > 0,
    merchantDiscountPct: content.merchant?.ladderDiscountPct ?? 0,
    next: next
      ? {
          id: next.id,
          name: next.name,
          cap: next.cap,
          price: next.price ?? null,
          milestoneLevel: next.milestone?.level ?? null,
          buyable: early?.id === next.id,
          lockedUntilLevel: early?.id === next.id ? null : (ladder.tiers.find((tier) => tier.cap > guaranteed.cap)?.milestone?.level ?? null),
        }
      : null,
  }
}

/** The open merchant visit (D78) with the ticks it has left, or null. */
function merchantView(hero: Doc<'heroes'>, tick: number) {
  if (!hero.merchant || tick >= hero.merchant.expiresAtTick) return null
  return { offers: hero.merchant.offers, expiresAtTick: hero.merchant.expiresAtTick, ticksLeft: hero.merchant.expiresAtTick - tick, biomeId: hero.merchant.biomeId }
}

/** "Vampiric Rare Keyboard Mace Mk III +2": the affix adjective (looked up in the active catalog), the rarity, the name, the workbench suffix (D129). */
const itemLabel = (item: Doc<'items'>) => `${affixById(catalogs[ACTIVE_CONTENT], item.affixId)?.name ?? ''} ${item.rarity === 'common' ? '' : item.rarity.charAt(0).toUpperCase() + item.rarity.slice(1)} ${item.name} ${workbenchSuffix(catalogs[ACTIVE_CONTENT], snapshotOf(item))}`.replace(/\s+/g, ' ').trim()

/** The pure-core view of an item document. */
const snapshotOf = (item: Doc<'items'>): ItemSnapshot => ({
  id: item._id as string,
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
})

/** "6 Scrap and 1 Parts", in catalog order. */
function materialsText(content: ContentCatalog, count: MaterialCount): string {
  const parts = (content.workbench?.materials ?? []).filter((m) => (count[m.id] ?? 0) > 0).map((m) => `${count[m.id]} ${m.name}`)
  return parts.length <= 1 ? parts.join('') : `${parts.slice(0, -1).join(', ')} and ${parts.at(-1)}`
}

/**
 * D129: add (or, with negative counts, spend) materials in the hero's stack rows: one row per material kind, no empty
 * row. Spending below zero is a programming error; the intents check the shortfall first.
 */
async function adjustMaterials(ctx: MutationCtx, hero: Doc<'heroes'>, items: Doc<'items'>[], content: ContentCatalog, delta: MaterialCount): Promise<void> {
  for (const [id, n] of Object.entries(delta)) {
    if (n === 0) continue
    const row = items.find((item) => item.kind === 'material' && item.templateId === id)
    const quantity = (row?.quantity ?? 0) + n
    if (quantity < 0) throw new Error(`spent more ${id} than held`)
    if (row === undefined) {
      const material = content.workbench?.materials.find((m) => m.id === id)
      if (material === undefined) throw new Error(`unknown material ${id}`)
      await ctx.db.insert('items', { heroId: hero._id, templateId: id, contentVersion: content.contentVersion, kind: 'material', name: material.name, rarity: 'common', requiredLevel: 1, attack: 0, defense: 0, saleValue: 0, quantity, createdAt: Date.now() })
    } else if (quantity === 0) await ctx.db.delete(row._id)
    else await ctx.db.patch(row._id, { quantity })
  }
}

/** The workbench as the companion shows it for one piece of gear (D129): the next step, its price, the result, and what is short. */
function stepView(content: ContentCatalog, hero: Doc<'heroes'>, item: Doc<'items'>, held: MaterialCount) {
  const snapshot = snapshotOf(item)
  const step = nextStep(content, snapshot)
  if (step === undefined) return null
  const next = applyStep(content, snapshot, step)
  const short = materialShortfall(held, step.materials)
  return {
    kind: step.kind,
    label: step.kind === 'tier' ? `Upgrade to ${workbenchSuffix(content, next)}` : `Reinforce to +${step.to}`,
    gold: step.gold,
    materials: step.materials,
    stat: item.kind === 'weapon' ? { from: item.attack, to: next.attack } : { from: item.defense, to: next.defense },
    requiredLevel: next.requiredLevel,
    shortfall: short,
    affordable: hero.gold >= step.gold && Object.keys(short).length === 0 && next.requiredLevel <= hero.level,
  }
}

/** Bag, held find, potions and capacity for the owner's hero. */
export const mine = query({
  args: {},
  returns: v.any(),
  handler: async (ctx) => {
    const user = await currentUser(ctx)
    const hero = await currentHero(ctx, user)
    if (hero === null || user === null) return null
    const items = await heroItems(ctx, hero._id)
    const content = await contentOf(ctx)
    const capacity = hero.bagCapacity
    const used = bagUsed(asBagHero(hero), asSnapshots(items))
    const held = heldMaterials(items.map(snapshotOf))
    // D155: below the workbench unlock the Bag page shows neither salvage nor the workbench, only a locked card.
    const workbenchOpen = unlocked(content, hero.level, 'workbench')
    const workbench = workbenchOpen ? content.workbench : undefined
    // D145: whose name is on each found spare.
    const spares = await spareOwners(ctx, items)
    return {
      capacity,
      used,
      // D129: the material rows and the workbench's prices, absent under a catalog without one.
      materials: (workbench?.materials ?? []).map((m) => ({ id: m.id, name: m.name, glyph: m.glyph, count: held[m.id] ?? 0 })),
      workbench: workbench === undefined ? null : { affix: workbench.affix, affixes: (content.affixes ?? []).map((affix) => ({ id: affix.id, name: affix.name, blurb: affix.blurb })) },
      workbenchUnlockLevel: content.workbench !== undefined && !workbenchOpen ? (unlockLevel(content, 'workbench') ?? null) : null,
      ladder: bagLadderView(content, hero),
      pouch: pouchView(content, hero),
      merchant: merchantView(hero, await currentTick(ctx)),
      // D142: the client compares `inStockAt` with its own clock; null means one is in stock now.
      makeover: { price: MAKEOVER_PRICE, gender: hero.gender ?? 'male' },
      nameTag: { price: NAME_TAG_PRICE, inStockAt: ((last) => (last === undefined ? null : last + NAME_TAG_GAP_MS))((await gameProfile(ctx, user._id))?.lastNameTagAt) },
      weaponId: hero.weaponId ?? null,
      armorId: hero.armorId ?? null,
      heldItemId: hero.heldItemId ?? null,
      potions: potionsHeld(items),
      // D131: one entry per strength in catalog order (count 0 included), and the combine recipe with what it would make.
      potionRows: potionStrengths(content).map((strength) => ({ templateId: strength.templateId, name: strength.name, healPct: strength.healPct, heals: Math.min(heroMaxHp(content, hero), pctOf(heroMaxHp(content, hero), strength.healPct)), count: items.find((item) => item.kind === 'potion' && item.templateId === strength.templateId)?.quantity ?? 0 })),
      potionCombine: workbenchOpen ? combineView(content, items, held) : null,
      canResume: hero.status === 'sleeping' && hero.heldItemId === undefined && !bagFull(hero, items) && hero.wakeAtTick === undefined,
      resumePlan: hero.status === 'sleeping' && hero.wakeAtTick === undefined && !(hero.heldItemId === undefined && !bagFull(hero, items)) ? resumePlanView(hero, items) : null,
      // D189: an awake hero holding a find (v26 keeps going on a full bag) gets the same one-tap plan, without a resume.
      keepPlan: hero.status !== 'sleeping' && hero.heldItemId !== undefined ? resumePlanView(hero, items, 0) : null,
      gear: items
        .filter((item) => isGear(item.kind))
        .map((item) => ({
          id: item._id,
          kind: item.kind,
          templateId: item.templateId,
          name: item.name,
          label: itemLabel(item),
          rarity: item.rarity,
          requiredLevel: item.requiredLevel,
          attack: item.attack,
          defense: item.defense,
          saleValue: item.saleValue,
          affix: ((affix) => (affix ? { id: affix.id, name: affix.name, blurb: affix.blurb } : null))(affixById(catalogs[ACTIVE_CONTENT], item.affixId)),
          equipped: item._id === hero.weaponId || item._id === hero.armorId,
          held: item._id === hero.heldItemId,
          // D129: what salvaging yields, the workbench's next step, and whether an affix can be fitted.
          salvage: salvageYield(content, snapshotOf(item)),
          suffix: workbenchSuffix(content, snapshotOf(item)),
          reinforced: item.reinforced ?? 0,
          nextStep: workbench === undefined ? null : stepView(content, hero, item, held),
          affixable: workbench !== undefined && (content.affixRarities ?? []).includes(item.rarity),
          spareOf: spares.get(item._id) ?? null,
        }))
        .sort((a, b) => Number(b.held) - Number(a.held) || Number(b.equipped) - Number(a.equipped) || b.attack + b.defense - (a.attack + a.defense)),
    }
  },
})

/** D131: the combine recipe as the companion shows it: names, counts and how many batches the hero can make. */
function combineView(content: ContentCatalog, items: Doc<'items'>[], held: MaterialCount) {
  const rule = content.potions?.combine
  if (rule === undefined) return null
  const from = strengthById(content, rule.from)
  const to = strengthById(content, rule.to)
  if (from === undefined || to === undefined) return null
  const have = items.find((item) => item.kind === 'potion' && item.templateId === from.templateId)?.quantity ?? 0
  const short = materialShortfall(held, rule.materials)
  return {
    from: { templateId: from.templateId, name: from.name, count: rule.count, have },
    materials: rule.materials,
    to: { templateId: to.templateId, name: to.name },
    shortfall: { potions: Math.max(0, rule.count - have), materials: short },
    batches: combineBatches(content, items.map(snapshotOf), held),
  }
}

/**
 * Drink one potion. D131: `templateId` names the strength; without it the smallest potion that heals to full is
 * drunk, else the strongest held. Before D131 there is one strength and the argument is ignored.
 */
export const usePotion = mutation({
  args: { operationId: v.string(), templateId: v.optional(v.string()) },
  returns: intentResult,
  handler: async (ctx, args) =>
    await runIntent(ctx, args.operationId, 'inventory.usePotion', { ...(args.templateId === undefined ? {} : { templateId: args.templateId }) }, async (user) => {
      const hero = await requirePlayableHero(ctx, user)
      if (hero.status !== 'exploring' && hero.status !== 'resting' && hero.status !== 'travelling') throw appError('INVALID_STATE', 'Potions can be used while exploring, resting or travelling.')
      const content = await contentOf(ctx)
      const max = heroMaxHp(content, hero)
      if (hero.hp >= max) throw appError('FULL_HP', 'Your hero is already at full health.')
      const rows = (await heroItems(ctx, hero._id)).filter((item) => item.kind === 'potion').map((item) => ({ ...item, id: item._id as string }))
      const chosen = args.templateId === undefined || content.potions === undefined
        ? bestFitPotion(content, rows, hero.hp, max)
        : ((row) => (row === undefined ? undefined : { row, healPct: healPctOf(content, row.templateId) }))(rows.find((row) => row.templateId === args.templateId))
      if (chosen === undefined) {
        const named = args.templateId === undefined ? undefined : strengthOf(content, args.templateId)
        throw appError('NO_POTION', named === undefined ? 'No potions left.' : `No ${potionWord(named.name)}s left.`)
      }
      const potion = chosen.row
      const hp = Math.min(max, hero.hp + pctOf(max, chosen.healPct))
      if (potion.quantity <= 1) await ctx.db.delete(potion._id)
      else await ctx.db.patch(potion._id, { quantity: potion.quantity - 1 })
      const constants = content.constants
      const status = hero.status === 'resting' && hp * 100 >= max * constants.resumeExploringAtPct ? 'exploring' : hero.status
      await ctx.db.patch(hero._id, { hp, status, counters: { ...withCounterDefaults(hero.counters), potionsUsed: (hero.counters.potionsUsed ?? 0) + 1 } })
      await commandLog(ctx, hero, 'use_potion', content.potions === undefined ? 'Drank a potion.' : `Drank a ${potionWord(potion.name)}.`, { xpEarned: 0, gold: 0, hp: hp - hero.hp })
      await awardAfterIntent(ctx, hero, content, await currentTick(ctx))
      return { changed: true, hp }
    }),
})

/**
 * D131: combine potions by the catalog recipe (three minors and one Scrap make a major), `batches` times under one
 * receipt. Explicit only; the pouch can never overflow, since every batch removes more potions than it adds.
 */
export const combinePotions = mutation({
  args: { operationId: v.string(), batches: v.optional(v.number()) },
  returns: intentResult,
  handler: async (ctx, args) =>
    await runIntent(ctx, args.operationId, 'inventory.combinePotions', { batches: args.batches ?? 1 }, async (user) => {
      const batches = args.batches ?? 1
      if (!Number.isSafeInteger(batches) || batches < 1 || batches > 10) throw appError('INVALID_INPUT', 'Combine between 1 and 10 batches.')
      const hero = await requirePlayableHero(ctx, user)
      if (!MANAGEABLE.has(hero.status)) throw appError('INVALID_STATE', "Potions can't be combined while your hero is recovering or paused.")
      const content = await contentOf(ctx)
      // D155: the recipe spends Scrap, which only salvage makes, so combining opens with the workbench.
      if (content.workbench !== undefined) requireWorkbench(content, hero)
      const rule = content.potions?.combine
      const from = rule === undefined ? undefined : strengthById(content, rule.from)
      const to = rule === undefined ? undefined : strengthById(content, rule.to)
      if (rule === undefined || from === undefined || to === undefined) throw appError('POTIONS_UNAVAILABLE', 'Potions cannot be combined yet.')
      const items = await heroItems(ctx, hero._id)
      const source = items.find((item) => item.kind === 'potion' && item.templateId === from.templateId)
      const needed = rule.count * batches
      if ((source?.quantity ?? 0) < needed) throw appError('NOT_ENOUGH_POTIONS', `Needs ${needed - (source?.quantity ?? 0)} more ${potionWord(from.name)}${needed - (source?.quantity ?? 0) === 1 ? '' : 's'}.`)
      const cost = Object.fromEntries(Object.entries(rule.materials).map(([id, n]) => [id, n * batches]))
      const short = materialShortfall(heldMaterials(items.map(snapshotOf)), cost)
      if (Object.keys(short).length > 0) throw appError('NOT_ENOUGH_MATERIALS', `Needs ${materialsText(content, short)} more.`)
      if (source!.quantity === needed) await ctx.db.delete(source!._id)
      else await ctx.db.patch(source!._id, { quantity: source!.quantity - needed })
      await adjustMaterials(ctx, hero, items, content, Object.fromEntries(Object.entries(cost).map(([id, n]) => [id, -n])))
      const target = items.find((item) => item.kind === 'potion' && item.templateId === to.templateId)
      if (target) await ctx.db.patch(target._id, { quantity: target.quantity + batches })
      else await ctx.db.insert('items', { ...potionItem(content, to, batches), heroId: hero._id, createdAt: Date.now() })
      const counters = withCounterDefaults(hero.counters)
      await ctx.db.patch(hero._id, { counters: { ...counters, potionsCombined: counters.potionsCombined + batches } })
      const made = batches === 1 ? `a ${potionWord(to.name)}` : `${batches} ${potionWord(to.name)}s`
      await commandLog(ctx, (await ctx.db.get(hero._id))!, 'combine_potions', `Combined ${needed} ${potionWord(from.name)}s and ${materialsText(content, cost)} into ${made}.`, { xpEarned: 0, gold: 0, hp: 0 }, { materials: cost, potionsBought: batches })
      await awardAfterIntent(ctx, hero, content, await currentTick(ctx))
      return { changed: true, count: batches }
    }),
})

export const equip = mutation({
  args: { operationId: v.string(), itemId: v.id('items') },
  returns: intentResult,
  handler: async (ctx, args) =>
    await runIntent(ctx, args.operationId, 'inventory.equip', { itemId: args.itemId }, async (user) => {
      const hero = await requirePlayableHero(ctx, user)
      if (!MANAGEABLE.has(hero.status)) throw appError('INVALID_STATE', "Gear can't be changed while your hero is recovering or paused.")
      const item = await ctx.db.get(args.itemId)
      if (item === null || item.heroId !== hero._id || !isGear(item.kind)) throw appError('ITEM_NOT_AVAILABLE', 'That item is not available.')
      if (item._id === hero.heldItemId) throw appError('ITEM_HELD', 'Claim the held find first.')
      if (item.requiredLevel > hero.level) throw appError('LEVEL_REQUIREMENT', `Requires level ${item.requiredLevel}.`)
      const slot = item.kind === 'weapon' ? 'weaponId' : 'armorId'
      if (hero[slot] === item._id) return { changed: false }
      // Swapping is always possible: the old item takes the new one's bag slot. Filling an empty slot frees one.
      // P35: the equip counts, for the ladder's "Equip a piece of gear you found", and that goal marks done now.
      await ctx.db.patch(hero._id, { [slot]: item._id, counters: { ...withCounterDefaults(hero.counters), itemsEquipped: (hero.counters.itemsEquipped ?? 0) + 1 } })
      await commandLog(ctx, hero, 'equip', `Equipped the ${itemLabel(item)}.`)
      await awardAfterIntent(ctx, hero, await contentOf(ctx), await currentTick(ctx))
      await syncBagSleep(ctx, hero._id)
      return { changed: true }
    }),
})

export const unequip = mutation({
  args: { operationId: v.string(), slot: v.union(v.literal('weapon'), v.literal('armor')) },
  returns: intentResult,
  handler: async (ctx, args) =>
    await runIntent(ctx, args.operationId, 'inventory.unequip', { slot: args.slot }, async (user) => {
      const hero = await requirePlayableHero(ctx, user)
      if (!MANAGEABLE.has(hero.status)) throw appError('INVALID_STATE', "Gear can't be changed while your hero is recovering or paused.")
      const field = args.slot === 'weapon' ? 'weaponId' : 'armorId'
      if (hero[field] === undefined) return { changed: false }
      // D61: unequipped gear needs a bag slot of its own.
      if (bagFull(hero, await heroItems(ctx, hero._id))) throw appError('BAG_FULL', 'Free a bag slot to unequip this.')
      await ctx.db.patch(hero._id, { [field]: undefined })
      await syncBagSleep(ctx, hero._id)
      return { changed: true }
    }),
})

/** Sell bag gear. Equipped and held items are refused; the sale value comes from the stored item, never the client. */
async function sellItems(ctx: MutationCtx, hero: Doc<'heroes'>, itemIds: Id<'items'>[]) {
  if (!MANAGEABLE.has(hero.status)) throw appError('INVALID_STATE', "Gear can't be sold while your hero is recovering or paused.")
  if (new Set(itemIds).size !== itemIds.length) throw appError('INVALID_INPUT', 'Each item can only be sold once.')
  const items: Doc<'items'>[] = []
  for (const id of itemIds) {
    const item = await ctx.db.get(id)
    if (item === null || item.heroId !== hero._id || !isGear(item.kind)) throw appError('ITEM_NOT_AVAILABLE', 'One of those items is not available.')
    if (item._id === hero.weaponId || item._id === hero.armorId) throw appError('ITEM_EQUIPPED', 'Unequip an item before selling it.')
    if (item._id === hero.heldItemId) throw appError('ITEM_HELD', 'Claim the held find first.')
    items.push(item)
  }
  const gold = items.reduce((sum, item) => sum + item.saleValue, 0)
  for (const item of items) await ctx.db.delete(item._id)
  await ctx.db.patch(hero._id, { gold: hero.gold + gold, counters: { ...withCounterDefaults(hero.counters), goldEarned: hero.counters.goldEarned + gold, itemsSold: (hero.counters.itemsSold ?? 0) + items.length } })
  return { gold, items }
}

export const sell = mutation({
  args: { operationId: v.string(), itemId: v.id('items') },
  returns: intentResult,
  handler: async (ctx, args) =>
    await runIntent(ctx, args.operationId, 'inventory.sell', { itemId: args.itemId }, async (user) => {
      const hero = await requirePlayableHero(ctx, user)
      const { gold, items } = await sellItems(ctx, hero, [args.itemId])
      await commandLog(ctx, (await ctx.db.get(hero._id))!, 'sell', `Sold the ${itemLabel(items[0]!)}.`, { xpEarned: 0, gold, hp: 0 })
      await awardAfterIntent(ctx, hero, await contentOf(ctx), await currentTick(ctx))
      await syncBagSleep(ctx, hero._id)
      return { changed: true, gold, count: 1 }
    }),
})

/** D29: sell up to `BATCH_ITEMS` (D146) player-selected bag items atomically under one receipt. */
export const sellMany = mutation({
  args: { operationId: v.string(), itemIds: v.array(v.id('items')) },
  returns: intentResult,
  handler: async (ctx, args) =>
    await runIntent(ctx, args.operationId, 'inventory.sellMany', { itemIds: args.itemIds }, async (user) => {
      if (args.itemIds.length < 1 || args.itemIds.length > BATCH_ITEMS) throw appError('INVALID_INPUT', `Choose between 1 and ${BATCH_ITEMS} items.`)
      const hero = await requirePlayableHero(ctx, user)
      const { gold, items } = await sellItems(ctx, hero, args.itemIds)
      // A sale of one names it, like the single sale, rather than "Sold 1 items."
      await commandLog(ctx, (await ctx.db.get(hero._id))!, 'sell_many', items.length === 1 ? `Sold the ${itemLabel(items[0]!)}.` : `Sold ${items.length} items.`, { xpEarned: 0, gold, hp: 0 })
      await awardAfterIntent(ctx, hero, await contentOf(ctx), await currentTick(ctx))
      await syncBagSleep(ctx, hero._id)
      return { changed: true, gold, count: args.itemIds.length }
    }),
})

/** Move the held find into the bag; needs one free slot (D19). */
export const claimHeld = mutation({
  args: { operationId: v.string() },
  returns: intentResult,
  handler: async (ctx, args) =>
    await runIntent(ctx, args.operationId, 'inventory.claimHeld', {}, async (user) => {
      const hero = await requirePlayableHero(ctx, user)
      if (hero.heldItemId === undefined) throw appError('INVALID_STATE', 'There is no held find to claim.')
      const items = await heroItems(ctx, hero._id)
      const heldId = hero.heldItemId
      const held = items.find((item) => item._id === heldId)
      if (bagFull(hero, items)) throw appError('BAG_FULL', 'Free a bag slot to claim the find.')
      await ctx.db.patch(hero._id, { heldItemId: undefined })
      await commandLog(ctx, hero, 'claim_held', held ? `Claimed the ${itemLabel(held)}.` : 'Claimed the held find.')
      await syncBagSleep(ctx, hero._id)
      return { changed: true }
    }),
})

/** Wake on the next tick, optionally heading to an unlocked biome (D19/D29). No catch-up. */
export const resumeAdventures = mutation({
  args: { operationId: v.string(), biomeId: v.optional(v.string()) },
  returns: intentResult,
  handler: async (ctx, args) =>
    await runIntent(ctx, args.operationId, 'inventory.resumeAdventures', { biomeId: args.biomeId ?? null }, async (user) => {
      const hero = await requirePlayableHero(ctx, user)
      if (hero.status !== 'sleeping') throw appError('INVALID_STATE', 'Your hero is not taking a break.')
      if (hero.heldItemId !== undefined) throw appError('HELD_ITEM_PENDING', 'Claim the held find first.')
      const items = await heroItems(ctx, hero._id)
      const content = await contentOf(ctx)
      if (bagFull(hero, items)) throw appError('BAG_FULL', 'Free at least one bag slot first.')
      let targetBiomeId: string | undefined
      if (args.biomeId !== undefined && args.biomeId !== hero.biomeId) {
        const biome = content.biomes.find((b) => b.id === args.biomeId)
        if (!biome) throw appError('INVALID_INPUT', 'Unknown destination.')
        if (biome.unlockLevel > hero.level) throw appError('BIOME_LOCKED', `${biome.name} unlocks at level ${biome.unlockLevel}.`)
        targetBiomeId = biome.id
      }
      const world = await readWorld(ctx)
      const wakeAtTick = hero.wakeAtTick ?? (world?.currentTick ?? 0) + 1
      if (hero.wakeAtTick !== undefined && hero.targetBiomeId === targetBiomeId) return { changed: false, tick: wakeAtTick }
      await ctx.db.patch(hero._id, { wakeAtTick, targetBiomeId })
      await commandLog(ctx, hero, 'resume_adventures', 'Adventures resume within 15 minutes.')
      return { changed: true, tick: wakeAtTick }
    }),
})

/**
 * Sell the weakest spares, claim the held find, and wake, in one step. The ids must be the ones `mine` showed, so a
 * bag that changed between the look and the tap is refused before anything is sold. Resumes in the current area.
 */
export const clearAndResume = mutation({
  args: { operationId: v.string(), itemIds: v.array(v.id('items')) },
  returns: intentResult,
  handler: async (ctx, args) =>
    await runIntent(ctx, args.operationId, 'inventory.clearAndResume', { itemIds: [...args.itemIds] }, async (user) => {
      const hero = await requirePlayableHero(ctx, user)
      // D189: an awake hero holding a find sorts the bag the same way; it just has nothing to resume.
      const awake = hero.status !== 'sleeping'
      if (awake ? hero.heldItemId === undefined : hero.wakeAtTick !== undefined) throw appError('INVALID_STATE', 'Your hero is not waiting on a full bag.')
      const items = await heroItems(ctx, hero._id)
      const free = hero.bagCapacity - bagUsed(asBagHero(hero), asSnapshots(items))
      const holding = hero.heldItemId !== undefined
      const count = Math.max(0, (holding ? 1 : 0) + (awake ? 0 : 1) - free)
      const needed = weakestSpares(hero, items, count)
      if (needed.length < count) throw appError('BAG_FULL', 'Nothing left to sell. Free a slot another way.')
      const wanted = [...args.itemIds].map(String).sort().join(',')
      const actual = needed.map((item) => String(item._id)).sort().join(',')
      if (wanted !== actual) throw appError('INVALID_STATE', 'Your bag changed. Look again before selling.')
      let gold = 0
      if (needed.length > 0) {
        const sold = await sellItems(ctx, hero, needed.map((item) => item._id))
        gold = sold.gold
        await commandLog(ctx, (await ctx.db.get(hero._id))!, 'sell', `Sold ${sold.items.map(itemLabel).join(', ')}.`, { xpEarned: 0, gold, hp: 0 })
      }
      const afterSale = (await ctx.db.get(hero._id))!
      if (afterSale.heldItemId !== undefined) {
        const held = items.find((item) => item._id === afterSale.heldItemId)
        await ctx.db.patch(hero._id, { heldItemId: undefined })
        await commandLog(ctx, (await ctx.db.get(hero._id))!, 'claim_held', held ? `Claimed the ${itemLabel(held)}.` : 'Claimed the held find.')
      }
      if (awake) {
        await awardAfterIntent(ctx, hero, await contentOf(ctx), await currentTick(ctx))
        return { changed: true, gold, count: needed.length }
      }
      const world = await readWorld(ctx)
      const wakeAtTick = (world?.currentTick ?? 0) + 1
      await ctx.db.patch(hero._id, { wakeAtTick })
      await commandLog(ctx, (await ctx.db.get(hero._id))!, 'resume_adventures', 'Adventures resume within 15 minutes.')
      await awardAfterIntent(ctx, hero, await contentOf(ctx), await currentTick(ctx))
      return { changed: true, gold, tick: wakeAtTick, count: needed.length }
    }),
})

/** What to sell and whether to claim so one tap can put the hero back on the road. */
function resumePlanView(hero: Doc<'heroes'>, items: Doc<'items'>[], spare = 1) {
  const free = hero.bagCapacity - bagUsed(asBagHero(hero), asSnapshots(items))
  const holding = hero.heldItemId !== undefined
  // `spare`: the slot a sleeper needs left free for its next find; an awake hero only needs room for the held one.
  const count = Math.max(0, (holding ? 1 : 0) + spare - free)
  const sell = weakestSpares(hero, items, count)
  return {
    sell: sell.map((item) => ({ id: item._id, label: itemLabel(item), saleValue: item.saleValue })),
    gold: sell.reduce((sum, item) => sum + item.saleValue, 0),
    claim: holding,
  }
}

/** The cheapest unequipped spares, the ones a full bag should give up first. */
function weakestSpares(hero: Doc<'heroes'>, items: Doc<'items'>[], count: number): Doc<'items'>[] {
  if (count <= 0) return []
  return items
    .filter((item) => isGear(item.kind) && item._id !== hero.weaponId && item._id !== hero.armorId && item._id !== hero.heldItemId)
    .sort((a, b) => a.saleValue - b.saleValue || a.attack + a.defense - (b.attack + b.defense) || (a._id < b._id ? -1 : 1))
    .slice(0, count)
}

/**
 * D61: buy the next bag with gold. The client names the bag it saw, so a
 * changed offer (a milestone or find already granted it) is refused rather
 * than buying a different bag. Never more than one bag ahead of the milestones.
 */
export const buyBag = mutation({
  args: { operationId: v.string(), tierId: v.string() },
  returns: intentResult,
  handler: async (ctx, args) =>
    await runIntent(ctx, args.operationId, 'inventory.buyBag', { tierId: args.tierId }, async (user) => {
      const hero = await requirePlayableHero(ctx, user)
      if (!MANAGEABLE.has(hero.status)) throw appError('INVALID_STATE', "Bags can't be bought while your hero is recovering or paused.")
      const content = await contentOf(ctx)
      const tier = nextEarlyTier(content, asBagHero(hero))
      if (tier === undefined || tier.price === undefined || tier.id !== args.tierId) throw appError('BAG_UNAVAILABLE', 'That bag is not available right now.')
      if (hero.gold < tier.price) throw appError('NOT_ENOUGH_GOLD', `The ${tier.name} costs ${tier.price} gold.`)
      const from = hero.bagCapacity
      await ctx.db.patch(hero._id, { gold: hero.gold - tier.price, bagCapacity: tier.capacity })
      await commandLog(ctx, (await ctx.db.get(hero._id))!, 'buy_bag', `Bought a [[${tier.name}]]. Bag holds ${tier.capacity}.`, { xpEarned: 0, gold: -tier.price, hp: 0 }, { bagSlots: tier.capacity - from })
      await awardAfterIntent(ctx, hero, content, await currentTick(ctx))
      await syncBagSleep(ctx, hero._id)
      return { changed: true, gold: -tier.price, count: tier.capacity }
    }),
})

/** D142: buy the day's name tag and give the current hero a new name. Hero names need not be unique. */
export const buyNameTag = mutation({
  args: { operationId: v.string(), name: v.string() },
  returns: intentResult,
  handler: async (ctx, args) =>
    await runIntent(ctx, args.operationId, 'inventory.buyNameTag', { name: args.name }, async (user) => {
      const hero = await requirePlayableHero(ctx, user)
      const profile = await gameProfile(ctx, user._id)
      const now = Date.now()
      if (profile?.lastNameTagAt !== undefined && now < profile.lastNameTagAt + NAME_TAG_GAP_MS) throw appError('NAME_TAG_SOLD_OUT', "Today's name tag is sold. Another comes in tomorrow.")
      const name = validateName(args.name, HERO_NAME_RULE)
      if (!name.ok) throw appError('INVALID_INPUT', `Hero name: ${name.reason}`)
      if (name.value === hero.name) throw appError('INVALID_INPUT', `Your hero is already called ${hero.name}.`)
      if (hero.gold < NAME_TAG_PRICE) throw appError('NOT_ENOUGH_GOLD', `A name tag costs ${NAME_TAG_PRICE} gold.`)
      // An account still on the legacy hero pointer gets its profile row first.
      if (profile === null) await setCurrentHero(ctx, user, hero._id)
      await ctx.db.patch((profile ?? (await gameProfile(ctx, user._id)))!._id, { lastNameTagAt: now })
      await ctx.db.patch(hero._id, { gold: hero.gold - NAME_TAG_PRICE, name: name.value })
      await commandLog(ctx, (await ctx.db.get(hero._id))!, 'name_tag', `Pinned on a new name tag: "Hi, my name is [[${name.value}]]."`, { xpEarned: 0, gold: -NAME_TAG_PRICE, hp: 0 })
      return { changed: true, gold: -NAME_TAG_PRICE }
    }),
})

/** D149: a makeover: the current hero takes the other look. Purely cosmetic; nothing else about the hero changes. */
export const buyMakeover = mutation({
  args: { operationId: v.string(), gender: heroGender },
  returns: intentResult,
  handler: async (ctx, args) =>
    await runIntent(ctx, args.operationId, 'inventory.buyMakeover', { gender: args.gender }, async (user) => {
      const hero = await requirePlayableHero(ctx, user)
      if ((hero.gender ?? 'male') === args.gender) throw appError('INVALID_INPUT', `${hero.name} already has that look.`)
      if (hero.gold < MAKEOVER_PRICE) throw appError('NOT_ENOUGH_GOLD', `A makeover costs ${MAKEOVER_PRICE} gold.`)
      await ctx.db.patch(hero._id, { gold: hero.gold - MAKEOVER_PRICE, gender: args.gender === 'female' ? 'female' : undefined })
      await commandLog(ctx, (await ctx.db.get(hero._id))!, 'makeover', `Booked a makeover. [[${hero.name}]] is back at the desk with a new look.`, { xpEarned: 0, gold: -MAKEOVER_PRICE, hp: 0 })
      return { changed: true, gold: -MAKEOVER_PRICE }
    }),
})

/** D77: buy the next potion pouch tier for gold, the same shape as `buyBag`. */
export const buyPouch = mutation({
  args: { operationId: v.string(), tierId: v.string() },
  returns: intentResult,
  handler: async (ctx, args) =>
    await runIntent(ctx, args.operationId, 'inventory.buyPouch', { tierId: args.tierId }, async (user) => {
      const hero = await requirePlayableHero(ctx, user)
      if (!MANAGEABLE.has(hero.status)) throw appError('INVALID_STATE', "Pouches can't be bought while your hero is recovering or paused.")
      const content = await contentOf(ctx)
      const state = { level: hero.level, ...(hero.potionCap === undefined ? {} : { potionCap: hero.potionCap }) }
      const tier = nextEarlyPouchTier(content, state)
      if (tier === undefined || tier.price === undefined || tier.id !== args.tierId) throw appError('POUCH_UNAVAILABLE', 'That pouch is not available right now.')
      if (hero.gold < tier.price) throw appError('NOT_ENOUGH_GOLD', `The ${tier.name} costs ${tier.price} gold.`)
      await ctx.db.patch(hero._id, { gold: hero.gold - tier.price, potionCap: tier.cap })
      await commandLog(ctx, (await ctx.db.get(hero._id))!, 'buy_pouch', `Bought a [[${tier.name}]]. Holds ${tier.cap} potions.`, { xpEarned: 0, gold: -tier.price, hp: 0 })
      await awardAfterIntent(ctx, hero, content, await currentTick(ctx))
      return { changed: true, gold: -tier.price, count: tier.cap }
    }),
})

/**
 * D78: buy one of the visiting merchant's offers. Each offer sells once; the visit closes when its last offer is
 * bought or when its tick expires. A potion bundle that would overflow the pouch is refused rather than trimmed.
 */
export const buyOffer = mutation({
  args: { operationId: v.string(), offerId: v.union(v.literal('potions'), v.literal('pouch'), v.literal('bag')) },
  returns: intentResult,
  handler: async (ctx, args) =>
    await runIntent(ctx, args.operationId, 'inventory.buyOffer', { offerId: args.offerId }, async (user) => {
      const hero = await requirePlayableHero(ctx, user)
      if (!MANAGEABLE.has(hero.status)) throw appError('INVALID_STATE', "Shopping isn't open while your hero is recovering or paused.")
      const tick = await currentTick(ctx)
      const visit = hero.merchant
      if (!visit || tick >= visit.expiresAtTick) throw appError('MERCHANT_GONE', 'The merchant has moved on.')
      const offer = visit.offers.find((candidate) => candidate.id === args.offerId)
      if (!offer) throw appError('OFFER_UNAVAILABLE', 'That offer is no longer on the table.')
      if (hero.gold < offer.price) throw appError('NOT_ENOUGH_GOLD', `That costs ${offer.price} gold.`)
      const content = await contentOf(ctx)
      const state = { level: hero.level, ...(hero.potionCap === undefined ? {} : { potionCap: hero.potionCap }) }
      const remaining = visit.offers.filter((candidate) => candidate.id !== offer.id)
      const closing = remaining.length === 0 ? undefined : { ...visit, offers: remaining }
      const counters = withCounterDefaults(hero.counters)
      const patch: Partial<Doc<'heroes'>> = { gold: hero.gold - offer.price, merchant: closing, counters: { ...counters, purchases: counters.purchases + 1 } }
      let summary: string
      let count = offer.quantity
      if (offer.id === 'potions') {
        // D131: the merchant sells the catalog (healing) potion; the pouch counts every strength.
        const rows = (await heroItems(ctx, hero._id)).filter((item) => item.kind === 'potion')
        const potion = rows.find((item) => item.templateId === content.potion.templateId)
        const have = potionsHeld(rows)
        const cap = potionCap(content, state)
        if (have + offer.quantity > cap) throw appError('POUCH_FULL', `Your pouch holds ${cap} potions; ${cap - have} more would fit.`)
        if (potion) await ctx.db.patch(potion._id, { quantity: potion.quantity + offer.quantity })
        else await ctx.db.insert('items', { ...starterKit(content).potions, quantity: offer.quantity, heroId: hero._id, createdAt: Date.now() })
        summary = `Bought ${offer.quantity === 1 ? 'a healing potion' : `${offer.quantity} healing potions`} from the merchant.`
      } else if (offer.id === 'pouch') {
        const tier = nextEarlyPouchTier(content, state)
        if (tier === undefined || tier.id !== offer.tierId) throw appError('OFFER_UNAVAILABLE', 'That pouch is no longer available.')
        patch.potionCap = tier.cap
        count = tier.cap
        summary = `Bought a [[${tier.name}]] from the merchant. Holds ${tier.cap} potions.`
      } else {
        const tier = nextEarlyTier(content, asBagHero(hero))
        if (tier === undefined || tier.id !== offer.tierId) throw appError('OFFER_UNAVAILABLE', 'That bag is no longer available.')
        patch.bagCapacity = tier.capacity
        count = tier.capacity
        summary = `Bought a [[${tier.name}]] from the merchant. Bag holds ${tier.capacity}.`
      }
      await ctx.db.patch(hero._id, patch)
      await commandLog(ctx, (await ctx.db.get(hero._id))!, 'buy_offer', summary, { xpEarned: 0, gold: -offer.price, hp: 0 }, offer.id === 'potions' ? { potionsBought: offer.quantity } : offer.id === 'bag' ? { bagSlots: count - hero.bagCapacity } : {})
      await awardAfterIntent(ctx, hero, content, tick)
      if (offer.id === 'bag') await syncBagSleep(ctx, hero._id)
      return { changed: true, gold: -offer.price, count }
    }),
})

/** D129: the bag items a salvage or sale may take: the hero's own gear, neither equipped nor held, each once. */
async function bagGear(ctx: MutationCtx, hero: Doc<'heroes'>, itemIds: Id<'items'>[]): Promise<Doc<'items'>[]> {
  if (new Set(itemIds).size !== itemIds.length) throw appError('INVALID_INPUT', 'Each item can only be chosen once.')
  const items: Doc<'items'>[] = []
  for (const id of itemIds) {
    const item = await ctx.db.get(id)
    if (item === null || item.heroId !== hero._id || !isGear(item.kind)) throw appError('ITEM_NOT_AVAILABLE', 'One of those items is not available.')
    if (item._id === hero.weaponId || item._id === hero.armorId) throw appError('ITEM_EQUIPPED', 'Unequip an item before salvaging it.')
    if (item._id === hero.heldItemId) throw appError('ITEM_HELD', 'Claim the held find first.')
    items.push(item)
  }
  return items
}

/** D129: strip up to `BATCH_ITEMS` player-selected bag items for materials, atomically under one receipt. Never automatic. */
export const salvageMany = mutation({
  args: { operationId: v.string(), itemIds: v.array(v.id('items')) },
  returns: intentResult,
  handler: async (ctx, args) =>
    await runIntent(ctx, args.operationId, 'inventory.salvageMany', { itemIds: args.itemIds }, async (user) => {
      if (args.itemIds.length < 1 || args.itemIds.length > BATCH_ITEMS) throw appError('INVALID_INPUT', `Choose between 1 and ${BATCH_ITEMS} items.`)
      const hero = await requirePlayableHero(ctx, user)
      if (!MANAGEABLE.has(hero.status)) throw appError('INVALID_STATE', "Gear can't be salvaged while your hero is recovering or paused.")
      const content = await contentOf(ctx)
      requireWorkbench(content, hero)
      const chosen = await bagGear(ctx, hero, args.itemIds)
      const yielded = addMaterials(...chosen.map((item) => salvageYield(content, snapshotOf(item))))
      for (const item of chosen) await ctx.db.delete(item._id)
      await adjustMaterials(ctx, hero, await heroItems(ctx, hero._id), content, yielded)
      const counters = withCounterDefaults(hero.counters)
      await ctx.db.patch(hero._id, { counters: { ...counters, itemsSalvaged: counters.itemsSalvaged + chosen.length } })
      const what = chosen.length === 1 ? `the ${itemLabel(chosen[0]!)}` : `${chosen.length} items`
      await commandLog(ctx, (await ctx.db.get(hero._id))!, 'salvage_many', `Salvaged ${what} for ${materialsText(content, yielded)}.`, { xpEarned: 0, gold: 0, hp: 0 }, { materials: yielded })
      await awardAfterIntent(ctx, hero, content, await currentTick(ctx))
      await syncBagSleep(ctx, hero._id)
      return { changed: true, count: chosen.length }
    }),
})

/** D129/D155: refuse salvage and the workbench under a catalog without one, or below its unlock level. */
function requireWorkbench(content: ContentCatalog, hero: Doc<'heroes'>): NonNullable<ContentCatalog['workbench']> {
  if (content.workbench === undefined) throw appError('WORKBENCH_UNAVAILABLE', 'There is no workbench yet.')
  if (!unlocked(content, hero.level, 'workbench')) throw appError('LOCKED', `The workbench opens at level ${unlockLevel(content, 'workbench') ?? '?'}.`)
  return content.workbench
}

/** Refuse a workbench price the hero cannot pay, naming the shortfall. */
function requireAffordable(content: ContentCatalog, hero: Doc<'heroes'>, held: MaterialCount, price: { gold: number; materials: MaterialCount }): void {
  const short = materialShortfall(held, price.materials)
  if (Object.keys(short).length > 0) throw appError('NOT_ENOUGH_MATERIALS', `Needs ${materialsText(content, short)} more.`)
  if (hero.gold < price.gold) throw appError('NOT_ENOUGH_GOLD', `That costs ${price.gold} gold.`)
}

/** The owned, unheld gear a workbench step may change; equipped gear is fine, since the item changes in place. */
async function workbenchItem(ctx: MutationCtx, hero: Doc<'heroes'>, itemId: Id<'items'>): Promise<Doc<'items'>> {
  const item = await ctx.db.get(itemId)
  if (item === null || item.heroId !== hero._id || !isGear(item.kind)) throw appError('ITEM_NOT_AVAILABLE', 'That item is not available.')
  if (item._id === hero.heldItemId) throw appError('ITEM_HELD', 'Claim the held find first.')
  return item
}

/**
 * D129: apply the item's next workbench step (the next tier, then the next reinforcement), rewriting its copied stats
 * in place under this receipt. The step is determined by the item, so there is nothing to choose; a step whose result
 * the hero could not wear is refused.
 */
export const upgrade = mutation({
  args: { operationId: v.string(), itemId: v.id('items') },
  returns: intentResult,
  handler: async (ctx, args) =>
    await runIntent(ctx, args.operationId, 'inventory.upgrade', { itemId: args.itemId }, async (user) => {
      const hero = await requirePlayableHero(ctx, user)
      if (!MANAGEABLE.has(hero.status)) throw appError('INVALID_STATE', "The workbench is closed while your hero is recovering or paused.")
      const content = await contentOf(ctx)
      requireWorkbench(content, hero)
      const item = await workbenchItem(ctx, hero, args.itemId)
      const snapshot = snapshotOf(item)
      const step = nextStep(content, snapshot)
      if (step === undefined) throw appError('INVALID_STATE', 'This item is fully reinforced.')
      const next = applyStep(content, snapshot, step)
      if (next.requiredLevel > hero.level) throw appError('LEVEL_TOO_LOW', `${workbenchSuffix(content, next)} needs level ${next.requiredLevel}.`)
      const items = await heroItems(ctx, hero._id)
      requireAffordable(content, hero, heldMaterials(items.map(snapshotOf)), step)
      await ctx.db.patch(item._id, { attack: next.attack, defense: next.defense, requiredLevel: next.requiredLevel, saleValue: next.saleValue, tier: next.tier, reinforced: next.reinforced, contentVersion: next.contentVersion })
      await adjustMaterials(ctx, hero, items, content, Object.fromEntries(Object.entries(step.materials).map(([id, n]) => [id, -n])))
      const counters = withCounterDefaults(hero.counters)
      await ctx.db.patch(hero._id, { gold: hero.gold - step.gold, counters: { ...counters, gearUpgraded: counters.gearUpgraded + 1, topReinforcement: Math.max(counters.topReinforcement, next.reinforced ?? 0) } })
      const summary = step.kind === 'tier' ? `Upgraded the ${itemLabel(item)} to ${workbenchSuffix(content, next)}.` : `Reinforced the ${itemLabel(item)} to +${step.to}.`
      await commandLog(ctx, (await ctx.db.get(hero._id))!, step.kind === 'tier' ? 'upgrade' : 'reinforce', summary, { xpEarned: 0, gold: -step.gold, hp: 0 }, { materials: step.materials })
      await awardAfterIntent(ctx, hero, content, await currentTick(ctx))
      return { changed: true, gold: -step.gold }
    }),
})

/** D129: fit a chosen affix to rare or epic gear, replacing whatever it had. A choice, not a reroll. */
export const chooseAffix = mutation({
  args: { operationId: v.string(), itemId: v.id('items'), affixId: v.string() },
  returns: intentResult,
  handler: async (ctx, args) =>
    await runIntent(ctx, args.operationId, 'inventory.chooseAffix', { itemId: args.itemId, affixId: args.affixId }, async (user) => {
      const hero = await requirePlayableHero(ctx, user)
      if (!MANAGEABLE.has(hero.status)) throw appError('INVALID_STATE', "The workbench is closed while your hero is recovering or paused.")
      const content = await contentOf(ctx)
      const workbench = requireWorkbench(content, hero)
      const item = await workbenchItem(ctx, hero, args.itemId)
      if (!(content.affixRarities ?? []).includes(item.rarity)) throw appError('ITEM_NOT_AVAILABLE', 'Only rare and epic gear can take an affix.')
      const affix = affixById(content, args.affixId)
      if (affix === undefined) throw appError('INVALID_INPUT', 'Unknown affix.')
      if (item.affixId === affix.id) throw appError('INVALID_INPUT', `The ${itemLabel(item)} is already ${affix.name}.`)
      const items = await heroItems(ctx, hero._id)
      const price = workbench.affix
      requireAffordable(content, hero, heldMaterials(items.map(snapshotOf)), price)
      await ctx.db.patch(item._id, { affixId: affix.id })
      await adjustMaterials(ctx, hero, items, content, Object.fromEntries(Object.entries(price.materials).map(([id, n]) => [id, -n])))
      const counters = withCounterDefaults(hero.counters)
      await ctx.db.patch(hero._id, { gold: hero.gold - price.gold, counters: { ...counters, gearUpgraded: counters.gearUpgraded + 1 } })
      await commandLog(ctx, (await ctx.db.get(hero._id))!, 'choose_affix', `Fitted ${affix.name} to the ${itemLabel({ ...item, affixId: undefined })}.`, { xpEarned: 0, gold: -price.gold, hp: 0 }, { materials: price.materials })
      await awardAfterIntent(ctx, hero, content, await currentTick(ctx))
      return { changed: true, gold: -price.gold }
    }),
})
