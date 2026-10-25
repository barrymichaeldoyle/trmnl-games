import type { PixelWarsCatalog } from '../sim/types'

/** Content checks a catalog must pass: four distinct patterns, caps and intervals that make the fade and the well work, goals unique. */
export function validateContent(content: PixelWarsCatalog): string[] {
  const problems: string[] = []
  const patterns = new Set(content.factions.map((f) => f.pattern))
  if (patterns.size !== 4) problems.push('factions must have four distinct patterns')
  if (content.factions.some((f, i) => f.id !== i + 1)) problems.push('factions must be numbered 1 to 4 in order')
  if (content.latticeSpacing < 2) problems.push('lattice spacing must leave ground between desks')
  if (content.maxSide < content.latticeSpacing * 3) problems.push('maxSide too small for a ring')
  if (content.cellInkCap < 1 || content.cellInkCap > 7 || content.deskInkCap < content.cellInkCap || content.deskInkCap > 7) problems.push('ink caps must fit three bits with the desk cap at least the cell cap')
  for (let i = 1; i < 4; i += 1) if (content.fadeTicksByRank[i]! < content.fadeTicksByRank[i - 1]!) problems.push('fade must slow down the ranks')
  if (content.fadeTicksByRank.some((n) => n < 1)) problems.push('fade intervals must be positive')
  if (content.underdogMultiplier < 1 || content.liberateMultiplier < 1 || content.deskFadeMultiplier < 1) problems.push('multipliers must be at least 1')
  if (content.wellCap < content.dropsPerTick) problems.push('the well must hold at least one tick of ink')
  if (content.shield.fromHour < 0 || content.shield.fromHour > 23 || content.shield.toHour < 0 || content.shield.toHour > 23) problems.push('shield hours must be 0 to 23')
  if (content.fullFactionPercent <= 25 || content.fullFactionPercent >= 100) problems.push('the full faction share must be above an even split and below everything')
  const ids = new Set<string>()
  for (const goal of content.goals) {
    if (ids.has(goal.id)) problems.push(`duplicate goal ${goal.id}`)
    ids.add(goal.id)
    if (goal.title.length > 40) problems.push(`${goal.id}: title over 40 characters`)
    if (goal.xp <= 0) problems.push(`${goal.id}: a goal pays XP`)
  }
  return problems
}
