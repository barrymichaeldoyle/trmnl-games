import type { LittlePlotCatalog, Rarity } from '../sim/types'

/**
 * Content checks a catalog must pass (little-plot.md "Plants", "Picking and the shed"): ids unique and referenced,
 * each cross's parents real and reachable, the ranges per rarity, device lines short enough, and every shed item's
 * prerequisite sold.
 */
export function validateContent(content: LittlePlotCatalog): string[] {
  const problems: string[] = []
  const ids = new Set<string>()
  const growRange: Record<Rarity, readonly [number, number]> = { common: [20, 40], uncommon: [48, 72], rare: [96, 144], epic: [192, 288] }
  const count: Record<Rarity, number> = { common: 0, uncommon: 0, rare: 0, epic: 0 }
  for (const kind of content.kinds) {
    if (ids.has(kind.id)) problems.push(`duplicate kind ${kind.id}`)
    ids.add(kind.id)
    count[kind.rarity] += 1
    const [min, max] = growRange[kind.rarity]
    if (kind.growTicks < min || kind.growTicks > max) problems.push(`${kind.id}: growTicks ${kind.growTicks} outside ${min} to ${max} for ${kind.rarity}`)
    if (kind.growTicks % 4 !== 0) problems.push(`${kind.id}: growTicks must divide into four stages`)
    if ((kind.rarity === 'rare' || kind.rarity === 'epic') && kind.source === 'shed') problems.push(`${kind.id}: the shed never sells a ${kind.rarity}`)
    if (kind.source === 'cross' && !kind.parents) problems.push(`${kind.id}: a cross needs parents`)
    if (kind.parents) {
      for (const p of kind.parents) if (!content.kinds.some((k) => k.id === p)) problems.push(`${kind.id}: unknown parent ${p}`)
      if (kind.parents[0] === kind.parents[1] && kind.source !== 'frost') problems.push(`${kind.id}: parents must differ`)
    }
    if (kind.needs && !content.items.some((i) => i.id === kind.needs)) problems.push(`${kind.id}: needs unknown item ${kind.needs}`)
    if (kind.rarity !== 'common' && kind.seeds !== 1) problems.push(`${kind.id}: a ${kind.rarity} returns one seed`)
    if (kind.note && kind.note.length > 160) problems.push(`${kind.id}: note over 160 characters`)
    if (kind.name.length > 16) problems.push(`${kind.id}: name over 16 characters for the device`)
  }
  if (count.common !== 14) problems.push(`expected 14 commons, found ${count.common}`)
  if (count.uncommon !== 10) problems.push(`expected 10 uncommons, found ${count.uncommon}`)
  if (count.rare !== 9) problems.push(`expected 9 rares (eight plus Ghost Pansy), found ${count.rare}`)
  if (count.epic !== 4) problems.push(`expected 4 epics, found ${count.epic}`)

  const itemIds = new Set<string>()
  for (const item of content.items) {
    if (itemIds.has(item.id)) problems.push(`duplicate item ${item.id}`)
    itemIds.add(item.id)
    if (item.requires && !content.items.some((i) => i.id === item.requires)) problems.push(`${item.id}: requires unknown ${item.requires}`)
    if (item.price < 0) problems.push(`${item.id}: negative price`)
    if (item.blurb.length > 90) problems.push(`${item.id}: blurb over 90 characters`)
  }
  for (const required of ['tin_can', 'fence', 'beehive', 'gnome_trap', 'greenhouse', 'bird_table', 'pond', 'beds_6', 'beds_9', 'beds_12']) if (!itemIds.has(required)) problems.push(`missing item ${required}`)

  const goalIds = new Set<string>()
  for (const goal of content.goals) {
    if (goalIds.has(goal.id)) problems.push(`duplicate goal ${goal.id}`)
    goalIds.add(goal.id)
    if (goal.predicate.kind === 'item' && !itemIds.has(goal.predicate.id)) problems.push(`${goal.id}: unknown item ${goal.predicate.id}`)
    if (goal.predicate.kind === 'adjacent') for (const p of goal.predicate.pair) if (!ids.has(p)) problems.push(`${goal.id}: unknown kind ${p}`)
    if (goal.title.length > 40) problems.push(`${goal.id}: title over 40 characters`)
  }

  for (const band of ['dawn', 'day', 'dusk', 'night'] as const) {
    const total = content.pestRule.table[band].reduce((s, [, w]) => s + w, 0)
    if (total <= 0) problems.push(`pest table for ${band} has no weight`)
  }
  for (const [effect, lines] of Object.entries(content.pestLines)) if (lines.length === 0) problems.push(`no pest lines for ${effect}`)
  for (const [stage, lines] of Object.entries(content.stageLines)) for (const l of lines) if (l.replace('{name}', 'Golden Sunflower').length > 90) problems.push(`stage line too long for ${stage}: ${l}`)
  for (const l of content.ambient) if (l.length > 90) problems.push(`ambient line over 90: ${l}`)
  const banned = /\b(kill|dead|dies|poison|gamble|cigarette)\b/i
  for (const text of [...content.ambient, ...Object.values(content.pestLines).flat(), ...Object.values(content.stageLines).flat(), ...content.kinds.map((k) => k.note ?? '')]) if (banned.test(text)) problems.push(`banned theme: ${text}`)
  return problems
}
