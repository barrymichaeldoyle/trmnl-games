import { ACTIVE_CONTENT, catalogs } from '@trmnl-games/desk-crawler/content'

/**
 * D169: everything the Desk Crawler help page reads from the active catalog, in no language. Each language's page body
 * (-deskCrawlerHelp.<locale>.tsx) words these facts itself; names stay English here and are translated where shown.
 */
const catalog = catalogs[ACTIVE_CONTENT]

const todo = catalog.todo
const standoff = catalog.standoff
const workbench = catalog.workbench
const potions = catalog.potions
const meetings = catalog.meetings
const effects = catalog.effects ?? []

const materialName = (id: string) => workbench?.materials.find((m) => m.id === id)?.name ?? id
const cost = (c: { gold: number; materials: Readonly<Record<string, number>> }) => ({ gold: c.gold, materials: Object.entries(c.materials).map(([id, n]) => ({ name: materialName(id), n })) })

export type Cost = ReturnType<typeof cost>
export type Occasion = NonNullable<typeof catalog.occasions>[number]

export const HELP_FACTS = {
  floors: catalog.biomes.map((biome) => ({ id: biome.id, name: biome.name, level: biome.unlockLevel, monsters: biome.monsterIds.map((id) => catalog.monsters.find((m) => m.id === id)?.name ?? id) })),
  lore: catalog.lore !== undefined,
  todo: todo === undefined ? undefined : {
    standup: `${String(todo.refillHour).padStart(2, '0')}:00`,
    pay: [...new Set(catalog.biomes.map((b) => b.tier))].sort((a, b) => a - b).map((tier) => todo.rewardByTier[tier] ?? 0),
  },
  standoff: standoff === undefined ? undefined : (() => {
    const floor = catalog.biomes.find((b) => !b.safe && b.tier >= standoff.minBiomeTier)
    return floor === undefined ? undefined : { minLevel: standoff.minLevel, floor: floor.name, xp: standoff.xpMultiplier, gold: standoff.goldMultiplier, hours: Math.round(standoff.durationTicks / 4) }
  })(),
  shopBags: catalog.bagLadder.tiers.filter((tier) => tier.milestone === undefined && tier.price !== undefined).map((tier) => ({ name: tier.name, size: tier.capacity, price: tier.price! })),
  tote: (() => { const tier = catalog.bagLadder.tiers.find((t) => t.milestone?.ticksExplored !== undefined); return tier === undefined ? undefined : { name: tier.name, size: tier.capacity } })(),
  topBag: catalog.bagLadder.tiers.at(-1)?.capacity ?? 0,
  firstPouch: { name: catalog.potionPouch?.tiers[0]?.name ?? 'Thermos', size: catalog.potionPouch?.tiers[0]?.cap ?? 20 },
  shopPouches: (catalog.potionPouch?.tiers ?? []).filter((tier) => tier.milestone === undefined && tier.price !== undefined).map((tier) => ({ name: tier.name, size: tier.cap, price: tier.price! })),
  merchantOff: catalog.merchant?.ladderDiscountPct ?? 0,
  workbench: workbench === undefined ? undefined : {
    level: catalog.unlocks?.workbench,
    materials: workbench.materials.map((m) => ({ name: m.name, rarities: m.rarities })),
    epicMultiplier: workbench.epicYieldMultiplier,
    tiers: workbench.steps.filter((s) => s.kind === 'tier').map(cost),
    reinforce: workbench.steps.filter((s) => s.kind === 'reinforce').map((s) => ({ to: s.kind === 'reinforce' ? s.to : 0, ...cost(s) })),
    affix: cost(workbench.affix),
  },
  potions: potions === undefined ? undefined : {
    strengths: potions.strengths.map((s) => ({ name: s.name, healPct: s.healPct })),
    drops: catalog.biomes.map((biome) => {
      const weights = potions.dropWeightsByTier[biome.tier] ?? {}
      const ranked = potions.strengths.filter((s) => (weights[s.id] ?? 0) > 0).sort((a, b) => (weights[b.id] ?? 0) - (weights[a.id] ?? 0))
      return { floor: biome.name, top: ranked[0]?.name, rest: ranked.slice(1).map((s) => s.name) }
    }).filter((drop) => drop.top !== undefined) as { floor: string; top: string; rest: string[] }[],
    combine: { count: potions.combine.count, from: potions.strengths.find((s) => s.id === potions.combine.from)?.name ?? 'Minor Potion', to: potions.strengths.find((s) => s.id === potions.combine.to)?.name ?? 'Major Potion', materials: cost({ gold: 0, materials: potions.combine.materials }).materials },
  },
  career: catalog.career === undefined ? undefined : { gold: catalog.career.rungs.reduce((sum, rung) => sum + rung.gold, 0), goals: catalog.career.rungs.filter((rung) => !rung.retired).length },
  unlocks: catalog.unlocks,
  classes: catalog.classes === undefined ? undefined : {
    rogue: { hpPct: catalog.classes.rogue.hpPct, attackPct: catalog.classes.rogue.modifiers.attackPct ?? 0, defensePct: catalog.classes.rogue.modifiers.defensePct ?? 0, goldPct: catalog.classes.rogue.modifiers.goldPct ?? 0, raidEdgePct: catalog.classes.rogue.raidEdgePct },
    warriorBlurb: catalog.classes.warrior.blurb,
    rogueBlurb: catalog.classes.rogue.blurb,
  },
  rosterLevel: catalog.unlocks?.roster,
  meetings: meetings === undefined ? undefined : {
    level: catalog.unlocks?.meetings,
    boonAdventures: effects.find((effect) => effect.id === meetings.kinds[0]?.effectId)?.durationTicks ?? 8,
    kinds: meetings.kinds.map((kind) => { const effect = effects.find((rule) => rule.id === kind.effectId); return { id: kind.id, name: kind.name, effect: effect?.name ?? kind.effectId, modifiers: effect?.modifiers ?? {} } }),
  },
  lostProperty: catalog.lostProperty !== undefined,
  occasions: catalog.occasions,
} as const


export type Modifiers = { attackPct?: number; defensePct?: number; xpPct?: number; goldPct?: number; trapDamagePct?: number }

/** "+10" or "−15". */
export const signed = (value: number) => (value > 0 ? `+${value}` : `−${Math.abs(value)}`)

/** The next date of an occasion that moves each year, or null. */
export function nextTableDate(dates: readonly string[]): Date | null {
  const next = dates.find((iso) => Date.parse(`${iso}T23:59:59Z`) >= Date.now())
  return next === undefined ? null : new Date(`${next}T12:00:00Z`)
}
