import type { Doc, Id } from '../_generated/dataModel'
import type { MutationCtx } from '../_generated/server'
import { starterHero, starterKit } from '@trmnl-games/desk-crawler/sim/core/starter'
import type { HeroClass } from '@trmnl-games/desk-crawler/sim/core/types'
import type { HeroGender } from '@trmnl-games/desk-crawler/art/hero'
import { setCurrentHero } from './gameProfile'
import { getOrCreateWorld, worldContent } from '../world'

/**
 * A new hero at level 1 with the starter kit and a welcome log, made the account's current hero. The world's pinned
 * catalog decides the starting bag and the class's health, so a hero never starts on rules its ticks do not use.
 * `active: false` is first setup, waiting for the TRMNL save (no rank or simulation until activation); `active: true`
 * is a roster recruit (P37), whose account already has its TRMNL, so it adventures from the next tick.
 */
export async function createHero(ctx: MutationCtx, user: Doc<'users'>, args: { name: string; heroClass: HeroClass; gender?: HeroGender; now: number; active: boolean }): Promise<Id<'heroes'>> {
  const world = await getOrCreateWorld(ctx)
  const content = worldContent(world)
  const base = starterHero('pending', content, world.currentTick, args.heroClass)
  const heroId = await ctx.db.insert('heroes', {
    userId: user._id,
    name: args.name,
    class: args.heroClass,
    // D149: only the female look is stored; absent is the original art.
    ...(args.gender === 'female' ? { gender: 'female' as const } : {}),
    createdAt: args.now,
    isActive: true,
    schemaVersion: 1,
    activationState: args.active ? 'active' : 'pending_trmnl',
    ...(args.active ? { activatedAt: args.now } : {}),
    level: base.level,
    xp: base.xp,
    lifetimeXp: base.lifetimeXp,
    hp: base.hp,
    gold: base.gold,
    lastLevelUpTick: world.currentTick,
    status: base.status,
    biomeId: base.biomeId,
    bagCapacity: base.bagCapacity,
    eligibleFromTick: world.currentTick + 1,
    lastTick: world.currentTick,
    lastProgressTick: world.currentTick,
    logSequence: 1,
    simulationState: 'healthy',
    counters: base.counters,
    scoreHourXp: 0,
  })
  const kit = starterKit(content)
  const weaponId = await ctx.db.insert('items', { ...kit.weapon, heroId, createdAt: args.now })
  const armorId = await ctx.db.insert('items', { ...kit.armor, heroId, createdAt: args.now })
  await ctx.db.insert('items', { ...kit.potions, heroId, createdAt: args.now })
  await ctx.db.patch(heroId, { weaponId, armorId })
  await setCurrentHero(ctx, user, heroId)
  await ctx.db.insert('tickLogs', {
    heroId,
    source: 'lifecycle',
    sequence: 1,
    at: args.now,
    kind: 'system',
    summary: 'Your shift begins in the [[Office Cubicles]].',
    detail: { v: 1, operation: 'hero_created' },
    deltas: { xpEarned: 0, gold: 0, hp: 0 },
  })
  return heroId
}
