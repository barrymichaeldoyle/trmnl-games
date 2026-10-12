import type { ContentCatalog, Modifiers } from '../sim/core/types'
import { zeroCounters } from '../sim/core/starter'
import { potionProblems } from '../sim/core/potions'
import { inventoryRowsNeeded, workbenchProblems } from '../sim/core/workbench'

/** Content limits from the specs: name budgets (domain-contracts.md) and the D26 content floor. */
export const CONTENT_LIMITS = {
  monsterName: 24,
  itemName: 32,
  monstersPerBiome: 4,
  variantsPerEncounterPerBiome: 4,
} as const

/** Return every problem found; an empty list means the catalog is valid. */
export function validateCatalog(content: ContentCatalog): string[] {
  const problems: string[] = []
  const { constants: c } = content
  const percent = (name: string, value: number) => {
    if (!Number.isSafeInteger(value) || value < 0 || value > 100) problems.push(`${name} must be an integer percentage`)
  }
  const sum = (values: readonly number[]) => values.reduce((total, value) => total + value, 0)

  if (sum(Object.values(c.lootWeights)) !== 100) problems.push('loot weights must sum to 100')
  if (sum(content.rarities.map((rule) => rule.weight)) !== 100) problems.push('rarity weights must sum to 100')
  for (const [name, value] of Object.entries(c)) {
    if (name.endsWith('Pct')) percent(name, value as number)
  }
  percent('elite.chancePct', c.elite.chancePct)
  // D76: thresholds must be ordered so a hero cannot loop between resting and exploring, and each stance is complete.
  for (const stance of Object.values(content.stances ?? {})) {
    for (const [name, value] of [['autoPotionBelowPct', stance.autoPotionBelowPct], ['restBelowPct', stance.restBelowPct], ['resumeExploringAtPct', stance.resumeExploringAtPct]] as const) percent(`stance ${stance.id} ${name}`, value)
    if (!(stance.restBelowPct < stance.autoPotionBelowPct && stance.autoPotionBelowPct < stance.resumeExploringAtPct)) problems.push(`stance ${stance.id} thresholds must satisfy rest < potion < resume`)
    if (!Number.isSafeInteger(stance.victoryXpPct) || stance.victoryXpPct < 50 || stance.victoryXpPct > 150) problems.push(`stance ${stance.id} victory XP must be an integer percentage between 50 and 150`)
    if (stance.restBelowPct > c.reviveHpPct) problems.push(`stance ${stance.id} would rest a hero straight after revival`)
  }
  if (content.stances && !(['cautious', 'balanced', 'bold'] as const).every((id) => content.stances?.[id]?.id === id)) problems.push('stances must define cautious, balanced and bold under their own ids')
  // D77/D78: the pouch ladder mirrors the bag ladder's rules; the merchant's numbers are bounded.
  const pouch = content.potionPouch
  if (pouch) {
    if (pouch.tiers.length < 2) problems.push('potion pouch needs at least two tiers')
    if (pouch.tiers[0]?.milestone !== undefined || pouch.tiers[0]?.price !== undefined) problems.push('the starting pouch has no milestone or price')
    if (pouch.tiers[0]?.cap !== c.potionStackCap) problems.push('the starting pouch must match potionStackCap')
    pouch.tiers.forEach((tier, i) => {
      if (i > 0 && (tier.price === undefined || tier.price < 1)) problems.push(`pouch ${tier.id} needs a price`)
      if (i > 0 && tier.cap <= pouch.tiers[i - 1]!.cap) problems.push(`pouch ${tier.id} must be larger than the previous tier`)
      // D122: milestone tiers come first, then shop tiers; a milestone never follows a shop tier.
      if (i > 1 && tier.milestone !== undefined && pouch.tiers[i - 1]!.milestone === undefined) problems.push(`pouch ${tier.id} has a milestone after a shop tier`)
      if (i > 1 && tier.milestone !== undefined && tier.milestone.level <= (pouch.tiers[i - 1]!.milestone?.level ?? 0)) problems.push(`pouch ${tier.id} milestone must come after the previous tier's`)
      if (i > 0 && tier.milestone === undefined && tier.price! <= (pouch.tiers[i - 1]!.price ?? 0)) problems.push(`pouch ${tier.id} must cost more than the previous tier`)
    })
    if (!Number.isSafeInteger(pouch.findPermille) || pouch.findPermille < 0 || pouch.findPermille > 1000) problems.push('pouch find chance must be a permille')
  }
  if (c.lootWeights.merchant !== undefined && !content.merchant) problems.push('a merchant loot weight needs merchant rules')
  // D79: every event has two or three options with distinct ids, a default among them, and bounded effects.
  if (c.lootWeights.event !== undefined && !content.choices) problems.push('an event loot weight needs choice rules')
  // D80/D81: affixes and effects are small, distinct and bounded; every source names a known effect.
  const modifierBounds = (owner: string, m: Modifiers) => {
    for (const [name, value] of Object.entries(m) as Array<[string, number | undefined]>) if (value !== undefined && (!Number.isSafeInteger(value) || value < -50 || value > 50)) problems.push(`${owner} modifier ${name} out of bounds`)
  }
  const affixIds = new Set<string>()
  for (const affix of content.affixes ?? []) {
    if (affixIds.has(affix.id)) problems.push(`duplicate affix ${affix.id}`)
    affixIds.add(affix.id)
    modifierBounds(`affix ${affix.id}`, affix.modifiers)
  }
  for (const rarity of content.affixRarities ?? []) if (!content.rarities.some((rule) => rule.rarity === rarity)) problems.push(`affix rarity ${rarity} is not in the rarity table`)
  if ((content.affixRarities?.length ?? 0) > 0 && (content.affixes?.length ?? 0) === 0) problems.push('affix rarities need affixes')
  const effectIds = new Set<string>()
  for (const effect of content.effects ?? []) {
    if (effectIds.has(effect.id)) problems.push(`duplicate effect ${effect.id}`)
    effectIds.add(effect.id)
    if (!(effect.durationTicks >= 1 && effect.durationTicks <= 96)) problems.push(`effect ${effect.id} must last 1 to 96 ticks`)
    modifierBounds(`effect ${effect.id}`, effect.modifiers)
  }
  for (const [source, id] of Object.entries(content.effectSources ?? {})) if (id !== undefined && !effectIds.has(id)) problems.push(`effect source ${source} names unknown effect ${id}`)
  for (const event of content.choices?.events ?? []) for (const option of event.options) if (option.effect.effectId !== undefined && !effectIds.has(option.effect.effectId)) problems.push(`option ${event.id}/${option.id} names unknown effect ${option.effect.effectId}`)
  if (content.choices) {
    if (!(content.choices.expiresAfterTicks >= 4 && content.choices.expiresAfterTicks <= 192)) problems.push('choices must expire between 4 and 192 ticks')
    if (content.choices.events.length === 0) problems.push('choices need at least one event')
    const eventIds = new Set<string>()
    for (const event of content.choices.events) {
      if (eventIds.has(event.id)) problems.push(`duplicate event ${event.id}`)
      eventIds.add(event.id)
      if (event.options.length < 2 || event.options.length > 3) problems.push(`event ${event.id} needs two or three options`)
      if (new Set(event.options.map((option) => option.id)).size !== event.options.length) problems.push(`event ${event.id} has duplicate option ids`)
      if (!event.options.some((option) => option.id === event.defaultOptionId)) problems.push(`event ${event.id} default is not one of its options`)
      if ([...event.prompt].length > c.summaryMaxCodePoints) problems.push(`event ${event.id} prompt too long`)
      for (const option of event.options) {
        const e = option.effect
        if ([...option.story].length > c.summaryMaxCodePoints) problems.push(`option ${event.id}/${option.id} story too long`)
        if (e.hpPct !== undefined && (e.hpPct < -50 || e.hpPct > 50)) problems.push(`option ${event.id}/${option.id} HP effect out of bounds`)
        if (e.potions !== undefined && (e.potions < 0 || e.potions > 3)) problems.push(`option ${event.id}/${option.id} potion effect out of bounds`)
        if ((e.gold ?? 0) < -100 || (e.gold ?? 0) > 500 || (e.goldPerTier ?? 0) < 0 || (e.goldPerTier ?? 0) > 100) problems.push(`option ${event.id}/${option.id} gold effect out of bounds`)
      }
    }
  }
  // D110: raid chances are permille, the contest stays a real contest for every pairing, losses are bounded shares.
  const raids = content.raids
  if (raids) {
    const stances = ['cautious', 'balanced', 'bold'] as const
    for (const id of stances) {
      const launch = raids.launchPermille[id]
      if (!Number.isSafeInteger(launch) || launch < 0 || launch > 100) problems.push(`raid launch chance for ${id} must be 0–100 permille`)
      if (!Number.isSafeInteger(raids.edgePct[id])) problems.push(`raid edge for ${id} must be an integer`)
    }
    for (const raider of stances) for (const target of stances) {
      const chance = 50 + raids.edgePct[raider] - raids.edgePct[target]
      if (!(chance >= 10 && chance <= 90)) problems.push(`raid win chance ${raider} on ${target} must stay within 10–90%`)
    }
    for (const [name, value] of [['goldLossPct', raids.goldLossPct], ['loserHpPct', raids.loserHpPct], ['winnerHpPct', raids.winnerHpPct]] as const) {
      if (!Number.isSafeInteger(value) || value < 0 || value > 50) problems.push(`raid ${name} must be an integer from 0 to 50`)
    }
    if (raids.winnerHpPct > raids.loserHpPct) problems.push('the raid winner must lose less HP than the loser')
    if (!(raids.targetCooldownTicks >= 1 && raids.targetCooldownTicks <= 96)) problems.push('raid target cooldown must be 1 to 96 ticks')
    for (const [key, lines] of Object.entries(raids.narrative)) {
      if (lines.length < 1) problems.push(`raid narrative ${key} is empty`)
      for (const line of lines) {
        const allowed = ['rival']
        for (const [, name] of line.matchAll(/\{(\w+)\}/g)) if (!allowed.includes(name!)) problems.push(`raid narrative ${key} uses {${name}}: ${line}`)
      }
    }
  }
  const todo = content.todo
  if (todo) {
    // P31: one template per kind, enough kinds to fill three slots at level 1, a target for every tier a task can name.
    const kinds = todo.templates.map((t) => t.kind)
    if (new Set(kinds).size !== kinds.length) problems.push('to-do templates must have one per kind')
    const tiers = [...new Set(content.biomes.map((b) => b.tier))]
    const levelOne = todo.templates.filter((t) => (t.minLevel ?? 1) <= 1 && (t.kind === 'defeat_monster' || t.kind === 'explore_biome' || t.target[1] !== undefined))
    if (levelOne.length < 3) problems.push('a level-1 hero needs three to-do kinds')
    for (const template of todo.templates) {
      const biomeKind = template.kind === 'defeat_monster' || template.kind === 'explore_biome'
      for (const tier of tiers) {
        const range = template.target[tier]
        if (range === undefined) {
          if (biomeKind) problems.push(`to-do ${template.kind} needs a target for tier ${tier}`)
          continue
        }
        if (!Number.isSafeInteger(range.min) || !Number.isSafeInteger(range.max) || range.min < 1 || range.max < range.min) problems.push(`to-do ${template.kind} tier ${tier} target range is invalid`)
      }
      const allowed = template.kind === 'defeat_monster' ? ['target', 'monster', 'monsters'] : template.kind === 'explore_biome' ? ['target', 'biome'] : ['target']
      for (const line of [template.label, template.labelOne]) {
        for (const [, name] of line.matchAll(/\{(\w+)\}/g)) if (!allowed.includes(name!)) problems.push(`to-do ${template.kind} label uses {${name}}: ${line}`)
      }
      if (!template.label.includes('{target}')) problems.push(`to-do ${template.kind} label needs {target}`)
    }
    for (const tier of tiers) {
      const reward = todo.rewardByTier[tier]
      if (reward === undefined || !Number.isSafeInteger(reward) || reward < 1) problems.push(`to-do reward for tier ${tier} must be a positive integer`)
    }
    if (!Number.isSafeInteger(todo.refillHour) || todo.refillHour < 0 || todo.refillHour > 23) problems.push('to-do refill hour must be 0 to 23')
    // The 20-hour floor (80 ticks) is the timezone-abuse bound; a day-long floor would push every refill late.
    if (!Number.isSafeInteger(todo.minRefillGapTicks) || todo.minRefillGapTicks < 1 || todo.minRefillGapTicks > 95) problems.push('to-do refill floor must be 1 to 95 ticks')
    if (!Number.isSafeInteger(todo.staleAfterRefills) || todo.staleAfterRefills < 1) problems.push('to-do stale swap needs at least one refill')
    percent('to-do away chance', todo.awayPct)
    for (const monster of content.monsters) {
      const plural = todo.monsterPlurals[monster.id]
      if (plural === undefined || [...plural].length > CONTENT_LIMITS.monsterName + 2) problems.push(`to-do needs a short plural for ${monster.id}`)
    }
  }
  // P35: unlock levels gate features the catalog actually has; a ladder's rungs are well formed and their lines fit.
  if (content.unlocks) {
    for (const [feature, level] of Object.entries(content.unlocks)) {
      if (!Number.isSafeInteger(level) || level < 1 || level > 20) problems.push(`unlock level for ${feature} must be 1 to 20`)
    }
    if (content.unlocks.todo > 1 && content.todo === undefined) problems.push('to-do unlock without to-do rules')
    if (content.unlocks.stances > 1 && content.stances === undefined) problems.push('stance unlock without stances')
    if (content.unlocks.choices > 1 && content.choices === undefined) problems.push('choice unlock without choices')
    if (content.unlocks.merchant > 1 && content.merchant === undefined) problems.push('merchant unlock without a merchant')
    if (content.unlocks.raids > 1 && content.raids === undefined) problems.push('raid unlock without raid rules')
  }
  if (content.career) {
    const counters = new Set(Object.keys(zeroCounters()))
    const ids = new Set<string>()
    if (content.career.rungs.filter((rung) => !rung.retired).length < 1) problems.push('a career ladder needs at least one rung')
    for (const rung of content.career.rungs) {
      if (ids.has(rung.id)) problems.push(`duplicate career rung ${rung.id}`)
      ids.add(rung.id)
      if (!/^[a-z0-9_]+$/.test(rung.id)) problems.push(`career rung id ${rung.id} must be snake case`)
      if ([...rung.title].length < 1 || [...rung.title].length > 40) problems.push(`career rung ${rung.id} title must be 1 to 40 characters`)
      if ([...rung.blurb].length < 1 || [...rung.blurb].length > 120) problems.push(`career rung ${rung.id} blurb must be 1 to 120 characters`)
      if (!Number.isSafeInteger(rung.gold) || rung.gold < 0) problems.push(`career rung ${rung.id} gold must be a nonnegative integer`)
      const p = rung.predicate
      if ((p.kind === 'counter' && !counters.has(p.counter)) || (p.kind === 'anyCounter' && (p.counters.length === 0 || p.counters.some((counter) => !counters.has(counter))))) problems.push(`career rung ${rung.id} names an unknown counter`)
      if ('atLeast' in p && (!Number.isSafeInteger(p.atLeast) || p.atLeast < 1)) problems.push(`career rung ${rung.id} target must be a positive integer`)
      if (p.kind === 'biomeWin' && !content.biomes.some((biome) => biome.id === p.biomeId)) problems.push(`career rung ${rung.id} names an unknown biome`)
      if (p.kind === 'bag' && !content.bagLadder.tiers.some((tier) => tier.capacity === p.atLeast)) problems.push(`career rung ${rung.id} bag target is not a tier`)
      if (p.kind === 'pouch' && !(content.potionPouch?.tiers ?? []).some((tier) => tier.cap === p.atLeast)) problems.push(`career rung ${rung.id} pouch target is not a tier`)
      const g = rung.guarantee
      if (rung.retired && g !== undefined) problems.push(`retired career rung ${rung.id} cannot carry a guarantee`)
      if (g !== undefined) {
        if (!Number.isSafeInteger(g.withinTicks) || g.withinTicks < 1 || g.withinTicks > 960) problems.push(`career rung ${rung.id} guarantee must be 1 to 960 adventures`)
        if (g.event === 'choice' && content.choices === undefined) problems.push(`career rung ${rung.id} guarantees a choice without choices`)
        if (g.event === 'merchant' && content.merchant === undefined) problems.push(`career rung ${rung.id} guarantees a merchant without one`)
      }
    }
  }
  if (content.merchant) {
    if (!(content.merchant.potionPrice >= 1 && content.merchant.maxPotionsOffered >= 1 && content.merchant.maxPotionsOffered <= 10)) problems.push('merchant potion offer out of bounds')
    if (!(content.merchant.staysForTicks >= 1 && content.merchant.staysForTicks <= 8)) problems.push('merchant must stay between 1 and 8 ticks')
    const discount = content.merchant.ladderDiscountPct
    if (discount !== undefined && !(Number.isSafeInteger(discount) && discount >= 1 && discount <= 50)) problems.push('merchant ladder discount must be a whole percentage from 1 to 50')
  }
  if (content.stances && (content.stances.balanced.autoPotionBelowPct !== c.autoPotionBelowPct || content.stances.balanced.restBelowPct !== c.restBelowPct || content.stances.balanced.resumeExploringAtPct !== c.resumeExploringAtPct || content.stances.balanced.victoryXpPct !== 100)) problems.push('the balanced stance must mirror the catalog constants')
  percent('jackpot.chancePct', c.jackpot.chancePct)

  const monsterIds = new Set<string>()
  for (const monster of content.monsters) {
    if (monsterIds.has(monster.id)) problems.push(`duplicate monster ${monster.id}`)
    monsterIds.add(monster.id)
    if ([...monster.name].length > CONTENT_LIMITS.monsterName) problems.push(`monster name too long: ${monster.name}`)
    for (const range of [monster.xp, monster.gold]) {
      if (range.min < 1 || range.max < range.min) problems.push(`monster ${monster.id} has an invalid reward range`)
    }
  }
  for (const template of content.gearTemplates) {
    if ([...template.name].length > CONTENT_LIMITS.itemName) problems.push(`item name too long: ${template.name}`)
    const tier = content.gearTiers[template.tier]
    if (tier === undefined) problems.push(`gear ${template.id} has unknown tier`)
    else if ((template.kind === 'weapon' ? tier.weaponAttack : tier.armorDefense) + (template.statOffset ?? 0) < 1) problems.push(`gear ${template.id} stat offset leaves no stat`)
  }

  const biomeIds = new Set(content.biomes.map((biome) => biome.id))
  if (!biomeIds.has(content.safeBiomeId)) problems.push('safe biome missing')
  for (const biome of content.biomes) {
    if (sum(Object.values(biome.weights)) !== 100) problems.push(`biome ${biome.id} weights must sum to 100`)
    if (biome.monsterIds.length < CONTENT_LIMITS.monstersPerBiome) problems.push(`biome ${biome.id} needs ${CONTENT_LIMITS.monstersPerBiome} monsters`)
    for (const id of biome.monsterIds) {
      const monster = content.monsters.find((m) => m.id === id)
      if (monster === undefined) problems.push(`biome ${biome.id} references missing monster ${id}`)
      else if (monster.tier !== biome.tier) problems.push(`monster ${id} tier does not match ${biome.id}`)
    }
    for (const kind of ['weapon', 'armor'] as const) {
      if (!content.gearTemplates.some((t) => t.tier === biome.tier && t.kind === kind)) problems.push(`biome ${biome.id} has no ${kind} templates`)
    }
    const narrative = content.narrative.biomes[biome.id]
    if (narrative === undefined) {
      problems.push(`biome ${biome.id} has no narrative`)
      continue
    }
    for (const key of ['victory', 'lootGold', 'trapHit', 'rest'] as const) {
      if (narrative[key].length < CONTENT_LIMITS.variantsPerEncounterPerBiome) problems.push(`biome ${biome.id} needs 4 ${key} variants`)
    }
    for (const key of ['eliteVictory', 'jackpot'] as const) {
      if (narrative[key].length < 1) problems.push(`biome ${biome.id} needs a ${key} variant`)
    }
  }
  for (const [key, list] of Object.entries(content.narrative.shared)) {
    if ((list as readonly string[]).length < 1) problems.push(`shared narrative ${key} is empty`)
  }
  const tiers = content.bagLadder.tiers
  if (tiers.length < 2) problems.push('bag ladder needs at least two tiers')
  if (tiers[0]?.milestone !== undefined || tiers[0]?.price !== undefined) problems.push('the starting bag has no milestone or price')
  tiers.forEach((tier, i) => {
    if ([...tier.name].length > CONTENT_LIMITS.itemName) problems.push(`bag name too long: ${tier.name}`)
    if (!Number.isSafeInteger(tier.capacity) || tier.capacity < 1) problems.push(`bag ${tier.id} capacity must be a positive integer`)
    if (i > 0) {
      if (tier.capacity <= tiers[i - 1]!.capacity) problems.push(`bag ${tier.id} must be larger than the previous tier`)
      if (tier.price === undefined || tier.price < 1) problems.push(`bag ${tier.id} needs a price`)
      // D122: milestone tiers come first, then shop tiers that gold buys in order at rising prices.
      if (i > 1 && tier.milestone !== undefined && tiers[i - 1]!.milestone === undefined) problems.push(`bag ${tier.id} has a milestone after a shop tier`)
      if (tier.milestone === undefined && tier.price !== undefined && tier.price <= (tiers[i - 1]!.price ?? 0)) problems.push(`bag ${tier.id} must cost more than the previous tier`)
    }
  })
  // Bounded reads (MAX_INVENTORY_ROWS): bag + two equipped + held + the stack rows (potion, and D129 materials).
  if (inventoryRowsNeeded(content) > 32) problems.push('bag capacity exceeds the 32-row inventory read')
  problems.push(...workbenchProblems(content))
  problems.push(...potionProblems(content))
  const permille = content.bagLadder.findPermille
  if (!Number.isSafeInteger(permille) || permille < 0 || permille > 1000) problems.push('bag find chance must be 0–1000 permille')
  for (const [id, lines] of Object.entries(content.narrative.monsters)) {
    if (!monsterIds.has(id)) problems.push(`monster narrative for unknown monster ${id}`)
    for (const line of lines.victory) {
      if (!line.includes('{monster}') || !line.includes('{xp}')) problems.push(`monster ${id} victory line misses {monster} or {xp}: ${line}`)
    }
  }
  return problems
}
