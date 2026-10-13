import { MAX_INVENTORY_ROWS } from './limits'
import type { ContentCatalog, GearKind, ItemKind, ItemSnapshot, MaterialCount, NewItem, Rarity, WorkbenchRule, WorkbenchStep } from './types'

/**
 * Salvage and the workbench (D129). Pure rules shared by the intents, the companion view, the validator and the
 * balance harness. The simulator never calls these: materials are never drawn, and an upgraded item plays by the
 * stats copied onto it, so a reinforced item behaves the same under every catalog.
 */

/** Gear takes bag slots; potions and materials are stack rows outside it. */
export const isGear = (kind: ItemKind): kind is GearKind => kind === 'weapon' || kind === 'armor'

/** Reinforcement never goes past the last reinforce step in the catalog. */
export function maxReinforcement(rules: WorkbenchRule): number {
  return rules.steps.reduce((top, step) => (step.kind === 'reinforce' ? Math.max(top, step.to) : top), 0)
}

/** The material a rarity salvages into, or undefined when the catalog has none for it. */
export function materialFor(rules: WorkbenchRule, rarity: Rarity) {
  return rules.materials.find((material) => material.rarities.includes(rarity))
}

/** Catalog gear tiers in ascending order. */
export const gearTierNumbers = (content: ContentCatalog): number[] => Object.keys(content.gearTiers).map(Number).sort((a, b) => a - b)

/**
 * The tier an item plays at: the workbench's `tier` if set, else its template's, else the tier whose required level it
 * copied (gear from a catalog whose template this one no longer knows), else the lowest tier.
 */
export function itemTier(content: ContentCatalog, item: Pick<ItemSnapshot, 'templateId' | 'requiredLevel' | 'tier'>): number {
  if (item.tier !== undefined) return item.tier
  const template = content.gearTemplates.find((t) => t.id === item.templateId)
  if (template !== undefined) return template.tier
  const byLevel = Object.entries(content.gearTiers).find(([, stats]) => stats.requiredLevel === item.requiredLevel)
  return byLevel === undefined ? gearTierNumbers(content)[0]! : Number(byLevel[0])
}

/** The tier an item was found at, whatever the workbench did since: its template's, by required level for an unknown template. */
export const templateTier = (content: ContentCatalog, item: Pick<ItemSnapshot, 'templateId' | 'requiredLevel'>): number => itemTier(content, { templateId: item.templateId, requiredLevel: item.requiredLevel })

/**
 * Materials a bag item yields: the tier it was found at, in units of its rarity's material, epic at the catalog
 * multiplier. Upgrades never raise the yield, so no step turns one material (or gold) into another.
 */
export function salvageYield(content: ContentCatalog, item: Pick<ItemSnapshot, 'templateId' | 'requiredLevel' | 'rarity' | 'kind'>): MaterialCount {
  const rules = content.workbench
  if (rules === undefined || !isGear(item.kind)) return {}
  const material = materialFor(rules, item.rarity)
  if (material === undefined) return {}
  return { [material.id]: templateTier(content, item) * (item.rarity === 'epic' ? rules.epicYieldMultiplier : 1) }
}

/** Sum of several yields or costs. */
export function addMaterials(...counts: readonly MaterialCount[]): MaterialCount {
  const total: Record<string, number> = {}
  for (const count of counts) for (const [id, n] of Object.entries(count)) total[id] = (total[id] ?? 0) + n
  return total
}

/** What a cost lacks against what is held: empty when affordable. */
export function materialShortfall(held: MaterialCount, cost: MaterialCount): MaterialCount {
  const short: Record<string, number> = {}
  for (const [id, n] of Object.entries(cost)) if ((held[id] ?? 0) < n) short[id] = n - (held[id] ?? 0)
  return short
}

/** Held materials from the inventory's material rows, by template id. */
export function heldMaterials(inventory: readonly Pick<ItemSnapshot, 'kind' | 'templateId' | 'quantity'>[]): MaterialCount {
  const held: Record<string, number> = {}
  for (const row of inventory) if (row.kind === 'material') held[row.templateId] = (held[row.templateId] ?? 0) + row.quantity
  return held
}

/**
 * The item's next workbench step, or undefined when it is fully reinforced: the tier step above its tier while one
 * exists, then the reinforce step above its reinforcement.
 */
export function nextStep(content: ContentCatalog, item: Pick<ItemSnapshot, 'templateId' | 'requiredLevel' | 'tier' | 'reinforced' | 'kind'>): WorkbenchStep | undefined {
  const rules = content.workbench
  if (rules === undefined || !isGear(item.kind)) return undefined
  const tier = itemTier(content, item)
  const tierStep = rules.steps.find((step) => step.kind === 'tier' && step.toTier === tier + 1)
  if (tierStep !== undefined) return tierStep
  if (rules.steps.some((step) => step.kind === 'tier' && step.toTier > tier)) return undefined
  return rules.steps.find((step) => step.kind === 'reinforce' && step.to === (item.reinforced ?? 0) + 1)
}

/** The stats a piece of gear carries at a tier and reinforcement under this catalog, from its template, rarity and affix-free rules. */
export function gearStats(content: ContentCatalog, item: Pick<ItemSnapshot, 'templateId' | 'kind' | 'rarity'>, tier: number, reinforced: number): Pick<NewItem, 'attack' | 'defense' | 'requiredLevel' | 'saleValue'> {
  const stats = content.gearTiers[tier]
  if (stats === undefined) throw new Error(`no gear tier ${tier}`)
  const offset = content.gearTemplates.find((t) => t.id === item.templateId)?.statOffset ?? 0
  const bonus = content.rarities.find((rule) => rule.rarity === item.rarity)?.statBonus ?? 0
  const multiplier = content.rarities.find((rule) => rule.rarity === item.rarity)?.saleMultiplier ?? 1
  const stat = (item.kind === 'weapon' ? stats.weaponAttack : stats.armorDefense) + offset + bonus + reinforced
  return {
    attack: item.kind === 'weapon' ? stat : 0,
    defense: item.kind === 'armor' ? stat : 0,
    requiredLevel: stats.requiredLevel,
    saleValue: stats.saleValue * multiplier,
  }
}

/** The item after a step: new tier or reinforcement, stats recomputed, the catalog that rewrote it. */
export function applyStep(content: ContentCatalog, item: ItemSnapshot, step: WorkbenchStep): ItemSnapshot {
  const tier = step.kind === 'tier' ? step.toTier : itemTier(content, item)
  const reinforced = step.kind === 'reinforce' ? step.to : (item.reinforced ?? 0)
  return { ...item, ...gearStats(content, item, tier, reinforced), tier, reinforced, contentVersion: content.contentVersion }
}

/** "Mk II +2": the suffix an upgraded or reinforced item carries after its name; empty for untouched gear. */
export function workbenchSuffix(content: ContentCatalog, item: Pick<ItemSnapshot, 'templateId' | 'requiredLevel' | 'tier' | 'reinforced' | 'kind'>): string {
  if (!isGear(item.kind)) return ''
  const parts: string[] = []
  if (item.tier !== undefined) {
    const template = content.gearTemplates.find((t) => t.id === item.templateId)
    if (template === undefined || template.tier !== item.tier) parts.push(`Mk ${ROMAN[item.tier - 1] ?? String(item.tier)}`)
  }
  if ((item.reinforced ?? 0) > 0) parts.push(`+${item.reinforced}`)
  return parts.join(' ')
}

const ROMAN = ['I', 'II', 'III', 'IV', 'V'] as const

/** Stack rows a hero can hold outside the bag: one potion row per strength (D131) plus one per material kind. */
export const stackRowKinds = (content: ContentCatalog): number => (content.potions?.strengths.length ?? 1) + (content.workbench?.materials.length ?? 0)

/**
 * Rows the bounded inventory read must hold under this catalog: the top bag, two equipped, one held, the stack rows.
 * The read itself stays `MAX_INVENTORY_ROWS`; the validator keeps this at or under it (roadmap guardrail).
 */
export const inventoryRowsNeeded = (content: ContentCatalog): number => Math.max(...content.bagLadder.tiers.map((tier) => tier.capacity)) + 3 + stackRowKinds(content)

/** Problems with a stored material row or workbench-touched item under a catalog that knows the rule; undefined when fine. */
export function itemProblems(content: ContentCatalog, item: ItemSnapshot): string | undefined {
  const rules = content.workbench
  if (item.kind === 'material') {
    if (rules === undefined) return `material ${item.templateId} under a catalog without a workbench`
    if (!rules.materials.some((material) => material.id === item.templateId)) return `unknown material ${item.templateId}`
    if (item.quantity < 1) return `material ${item.templateId} quantity ${item.quantity}`
    if (item.attack !== 0 || item.defense !== 0 || item.saleValue !== 0) return `material ${item.templateId} carries stats`
    return undefined
  }
  if (!isGear(item.kind)) return undefined
  if (item.tier === undefined && item.reinforced === undefined) return undefined
  const tier = itemTier(content, item)
  if (content.gearTiers[tier] === undefined) return `item ${item.id} at unknown tier ${tier}`
  const reinforced = item.reinforced ?? 0
  if (!Number.isSafeInteger(reinforced) || reinforced < 0 || (rules !== undefined && reinforced > maxReinforcement(rules))) return `item ${item.id} reinforced ${reinforced}`
  // Stats are checked only where this catalog can compute them, so gear rewritten under a later catalog is carried untouched.
  if (rules === undefined) return undefined
  const expected = gearStats(content, item, tier, reinforced)
  if (item.attack !== expected.attack || item.defense !== expected.defense || item.requiredLevel !== expected.requiredLevel) return `item ${item.id} stats do not match tier ${tier} +${reinforced}`
  return undefined
}

/** Content problems with a workbench rule, for the catalog validator. */
export function workbenchProblems(content: ContentCatalog): string[] {
  const rules = content.workbench
  if (rules === undefined) return []
  const problems: string[] = []
  const ids = new Set<string>()
  const count = (name: string, value: number) => {
    if (!Number.isSafeInteger(value) || value < 0) problems.push(`${name} must be a nonnegative integer`)
  }
  for (const material of rules.materials) {
    if (ids.has(material.id)) problems.push(`duplicate material ${material.id}`)
    ids.add(material.id)
    if (!/^[a-z0-9_]+$/.test(material.id)) problems.push(`material id ${material.id} must be snake case`)
    if ([...material.name].length < 1 || [...material.name].length > 16) problems.push(`material ${material.id} name must be 1 to 16 characters`)
    if (material.rarities.length < 1) problems.push(`material ${material.id} salvages from no rarity`)
  }
  for (const rule of content.rarities) {
    const owners = rules.materials.filter((material) => material.rarities.includes(rule.rarity))
    if (owners.length !== 1) problems.push(`rarity ${rule.rarity} must salvage into exactly one material`)
  }
  if (!Number.isSafeInteger(rules.epicYieldMultiplier) || rules.epicYieldMultiplier < 1) problems.push('epic yield multiplier must be a positive integer')
  const checkCost = (name: string, cost: MaterialCount) => {
    for (const [id, n] of Object.entries(cost)) {
      if (!ids.has(id)) problems.push(`${name} costs unknown material ${id}`)
      count(`${name} ${id}`, n)
    }
  }
  const tiers = gearTierNumbers(content)
  const tierSteps = rules.steps.filter((step) => step.kind === 'tier')
  const reinforceSteps = rules.steps.filter((step) => step.kind === 'reinforce')
  for (const [i, step] of tierSteps.entries()) {
    const name = `tier step to ${step.toTier}`
    if (!tiers.includes(step.toTier) || step.toTier === tiers[0]) problems.push(`${name} names no gear tier above the first`)
    if (tierSteps.some((other, j) => j !== i && other.toTier === step.toTier)) problems.push(`${name} is defined twice`)
    count(`${name} gold`, step.gold)
    checkCost(name, step.materials)
  }
  // Every tier above the first must be reachable in order, so a tier-1 item can climb to the top.
  for (const tier of tiers.slice(1)) if (!tierSteps.some((step) => step.toTier === tier)) problems.push(`no workbench step reaches tier ${tier}`)
  reinforceSteps.forEach((step, i) => {
    const name = `reinforce step +${step.to}`
    if (step.to !== i + 1) problems.push(`${name} must follow +${step.to - 1} in order`)
    count(`${name} gold`, step.gold)
    checkCost(name, step.materials)
    if (i > 0 && step.gold <= reinforceSteps[i - 1]!.gold) problems.push(`${name} must cost more gold than +${i}`)
  })
  if (reinforceSteps.length > 9) problems.push('at most nine reinforcement steps')
  count('affix gold', rules.affix.gold)
  checkCost('affix', rules.affix.materials)
  if (Object.values(rules.affix.materials).every((n) => n === 0) && rules.affix.gold === 0) problems.push('an affix choice must cost something')
  // Salvage after a step is always a loss: yields never rise with a step (`salvageYield` reads the found tier), so a
  // step only needs to cost something at all.
  for (const step of rules.steps) {
    if (step.gold === 0 && Object.values(step.materials).every((n) => n === 0)) problems.push(`${step.kind === 'tier' ? `tier step to ${step.toTier}` : `reinforce step +${step.to}`} costs nothing`)
  }
  if (inventoryRowsNeeded(content) > MAX_INVENTORY_ROWS) problems.push(`material rows exceed the ${MAX_INVENTORY_ROWS}-row inventory read`)
  return problems
}
