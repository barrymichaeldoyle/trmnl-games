import { pickWeighted, type Rng } from './rng'
import { pctOf } from './stats'
import type { ContentCatalog, ItemSnapshot, MaterialCount, NewItem, PotionStrength } from './types'

/**
 * Potion strengths (D131). Pure rules shared by the simulator, the intents, the companion view, the validator and
 * the balance harness. A catalog without a `potions` rule has one strength, the catalog potion at
 * `constants.potionHealPct`, so every path below reads the same under v13 and earlier.
 */

type PotionRow = Pick<ItemSnapshot, 'id' | 'kind' | 'templateId' | 'quantity'>

/** The strengths this catalog knows, ascending by heal; one entry before v14. */
export function potionStrengths(content: ContentCatalog): readonly PotionStrength[] {
  return content.potions?.strengths ?? [{ id: 'healing', templateId: content.potion.templateId, name: content.potion.name, healPct: content.constants.potionHealPct }]
}

/** The strength a potion row is, or undefined when the catalog does not know its template. */
export function strengthOf(content: ContentCatalog, templateId: string): PotionStrength | undefined {
  return potionStrengths(content).find((strength) => strength.templateId === templateId)
}

/** Heal percentage of a row: its strength's, or the catalog constant for a template this catalog does not know. */
export const healPctOf = (content: ContentCatalog, templateId: string): number => strengthOf(content, templateId)?.healPct ?? content.constants.potionHealPct

/** The potion rows of an inventory, in inventory (id) order. */
export const potionRows = <T extends Pick<ItemSnapshot, 'kind'>>(inventory: readonly T[]): T[] => inventory.filter((item) => item.kind === 'potion')

/** Potions held across every strength, the number the pouch cap bounds and the device shows. */
export const potionsHeld = (inventory: readonly Pick<ItemSnapshot, 'kind' | 'quantity'>[]): number => potionRows(inventory).reduce((sum, row) => sum + row.quantity, 0)

/** Rows with a potion in them, weakest first, by catalog heal then id so the order is stable. */
function heldByStrength<T extends PotionRow>(content: ContentCatalog, inventory: readonly T[]): T[] {
  return potionRows(inventory)
    .filter((row) => row.quantity > 0)
    .sort((a, b) => healPctOf(content, a.templateId) - healPctOf(content, b.templateId) || (a.id < b.id ? -1 : a.id > b.id ? 1 : 0))
}

/**
 * The automatic drink: the weakest potion that leaves the hero at or above `linePct` (the stance's drinking line,
 * so it will not need another drink next tick; the harness measured this against the rest line and it costs the
 * undergeared cohort fewer knockouts), else the strongest it holds. Undefined with nothing to drink. No draw.
 */
export function autoPotion<T extends PotionRow>(content: ContentCatalog, inventory: readonly T[], hp: number, max: number, linePct: number): { row: T; healPct: number } | undefined {
  const held = heldByStrength(content, inventory)
  if (held.length === 0) return undefined
  const clears = held.find((row) => (hp + pctOf(max, healPctOf(content, row.templateId))) * 100 >= max * linePct)
  const row = clears ?? held[held.length - 1]!
  return { row, healPct: healPctOf(content, row.templateId) }
}

/** The manual drink's default: the smallest potion that heals to full, else the strongest held. */
export function bestFitPotion<T extends PotionRow>(content: ContentCatalog, inventory: readonly T[], hp: number, max: number): { row: T; healPct: number } | undefined {
  const held = heldByStrength(content, inventory)
  if (held.length === 0) return undefined
  const fills = held.find((row) => hp + pctOf(max, healPctOf(content, row.templateId)) >= max)
  const row = fills ?? held[held.length - 1]!
  return { row, healPct: healPctOf(content, row.templateId) }
}

/** The strength a potion find in this biome tier is, drawn from the reward stream; the catalog potion before v14 (no draw). */
export function rollPotionStrength(content: ContentCatalog, rng: Rng, biomeTier: number): PotionStrength {
  const rule = content.potions
  if (rule === undefined) return potionStrengths(content)[0]!
  const weights = rule.dropWeightsByTier[biomeTier] ?? rule.dropWeightsByTier[Math.max(...Object.keys(rule.dropWeightsByTier).map(Number))] ?? {}
  return pickWeighted(rng, rule.strengths.map((strength) => [strength, weights[strength.id] ?? 0] as const))
}

/** A new potion row for a strength, the shape the starter kit uses. */
export function potionItem(content: ContentCatalog, strength: PotionStrength, quantity: number): NewItem {
  return { templateId: strength.templateId, contentVersion: content.contentVersion, kind: 'potion', name: strength.name, rarity: 'common', requiredLevel: 1, attack: 0, defense: 0, saleValue: 0, quantity }
}

/** "minor potion", "healing potion": the strength's name as a story or change-row word. */
export const potionWord = (name: string): string => name.toLowerCase()

/** Batches of the combine recipe the hero can make from what it holds (0 without the rule). */
export function combineBatches(content: ContentCatalog, inventory: readonly PotionRow[], held: MaterialCount): number {
  const rule = content.potions?.combine
  if (rule === undefined) return 0
  const from = potionRows(inventory).find((row) => row.templateId === strengthById(content, rule.from)?.templateId)?.quantity ?? 0
  let batches = Math.floor(from / rule.count)
  for (const [id, n] of Object.entries(rule.materials)) if (n > 0) batches = Math.min(batches, Math.floor((held[id] ?? 0) / n))
  return Math.max(0, batches)
}

/** A strength by its id. */
export const strengthById = (content: ContentCatalog, id: string): PotionStrength | undefined => content.potions?.strengths.find((strength) => strength.id === id)

/** Potion rows a hero can hold: one per strength. */
export const potionRowKinds = (content: ContentCatalog): number => potionStrengths(content).length

/** Content problems with a potion rule, for the catalog validator. */
export function potionProblems(content: ContentCatalog): string[] {
  const rule = content.potions
  if (rule === undefined) return []
  const problems: string[] = []
  const ids = new Set<string>()
  const templates = new Set<string>()
  rule.strengths.forEach((strength, i) => {
    if (ids.has(strength.id)) problems.push(`duplicate potion strength ${strength.id}`)
    ids.add(strength.id)
    if (templates.has(strength.templateId)) problems.push(`duplicate potion template ${strength.templateId}`)
    templates.add(strength.templateId)
    if (!/^[a-z0-9_]+$/.test(strength.id)) problems.push(`potion strength id ${strength.id} must be snake case`)
    if ([...strength.name].length < 1 || [...strength.name].length > 24) problems.push(`potion ${strength.id} name must be 1 to 24 characters`)
    if (!Number.isSafeInteger(strength.healPct) || strength.healPct < 1 || strength.healPct > 100) problems.push(`potion ${strength.id} heal must be an integer percentage`)
    if (i > 0 && strength.healPct <= rule.strengths[i - 1]!.healPct) problems.push(`potion ${strength.id} must heal more than ${rule.strengths[i - 1]!.id}`)
  })
  if (rule.strengths.length < 2) problems.push('potion strengths need at least two entries')
  const catalogPotion = rule.strengths.find((strength) => strength.templateId === content.potion.templateId)
  if (catalogPotion === undefined) problems.push('the catalog potion must be one of the strengths')
  else if (catalogPotion.name !== content.potion.name || catalogPotion.healPct !== content.constants.potionHealPct) problems.push('the catalog potion strength must match the potion name and potionHealPct')
  for (const tier of new Set(content.biomes.map((biome) => biome.tier))) {
    const weights = rule.dropWeightsByTier[tier]
    if (weights === undefined) {
      problems.push(`potion drop weights missing for biome tier ${tier}`)
      continue
    }
    let sum = 0
    for (const [id, weight] of Object.entries(weights)) {
      if (!ids.has(id)) problems.push(`potion drop weights for tier ${tier} name unknown strength ${id}`)
      if (!Number.isSafeInteger(weight) || weight < 0) problems.push(`potion drop weight ${id} for tier ${tier} must be a nonnegative integer`)
      sum += weight
    }
    if (sum !== 100) problems.push(`potion drop weights for tier ${tier} must sum to 100`)
  }
  const combine = rule.combine
  const from = rule.strengths.find((strength) => strength.id === combine.from)
  const to = rule.strengths.find((strength) => strength.id === combine.to)
  if (from === undefined || to === undefined) problems.push('the combine recipe names an unknown strength')
  else if (from.healPct >= to.healPct) problems.push('combining must make a stronger potion')
  if (!Number.isSafeInteger(combine.count) || combine.count < 2 || combine.count > 10) problems.push('combining takes 2 to 10 potions')
  for (const [id, n] of Object.entries(combine.materials)) {
    if (!content.workbench?.materials.some((material) => material.id === id)) problems.push(`combining costs unknown material ${id}`)
    if (!Number.isSafeInteger(n) || n < 0) problems.push(`combine material ${id} must be a nonnegative integer`)
  }
  if (Object.values(combine.materials).every((n) => n === 0)) problems.push('combining must cost a material')
  // The loot lines name the strength, so every one must carry the placeholder.
  for (const line of content.narrative.shared.lootPotion) if (!line.includes('{potion}')) problems.push(`lootPotion line misses {potion}: ${line}`)
  return problems
}
