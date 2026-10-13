import { v } from 'convex/values'
import type { Doc, Id } from './_generated/dataModel'
import { mutation, query, type MutationCtx, type QueryCtx } from './_generated/server'
import { unlocked, unlockLevel } from '@trmnl-games/desk-crawler/sim/core/career'
import { heroMaxHp } from '@trmnl-games/desk-crawler/sim/core/stats'
import type { ContentCatalog, HeroClass } from '@trmnl-games/desk-crawler/sim/core/types'
import { appError } from './lib/errors'
import { createHero } from './lib/heroCreate'
import { currentHero, gameProfile, setCurrentHero } from './lib/gameProfile'
import { commandLog, currentUser, requirePlayableHero, runIntent } from './lib/intent'
import { HERO_NAME_RULE, validateName } from './lib/names'
import { readWorld, worldContent } from './world'
import { heroGender } from './schema'

/**
 * The hero roster (P37, D136): one hero per class per account, one current hero at a time. The others are parked:
 * not simulated, not ranked, not raided, and their tick-stamped timers move on by the gap when they return, so a
 * parked hero comes back exactly as it was left. The roster opens when the account's Warrior reaches the catalog's
 * `roster` level; a switch is allowed once a day, with a ten-minute undo back to the hero just left.
 */

export const SWITCH_GAP_MS = 24 * 60 * 60 * 1000
export const UNDO_MS = 10 * 60 * 1000
const CLASSES: readonly HeroClass[] = ['warrior', 'rogue']
const intentResult = v.object({ operationId: v.string(), changed: v.boolean() })

/** Every hero the account owns, oldest first (at most one per class). */
async function rosterOf(ctx: QueryCtx, userId: Id<'users'>): Promise<Doc<'heroes'>[]> {
  const heroes = await ctx.db.query('heroes').withIndex('by_userId_and_isActive', (q) => q.eq('userId', userId)).take(CLASSES.length + 1)
  return heroes.sort((a, b) => a.createdAt - b.createdAt)
}

/** Whether the roster is open: the catalog has classes and the account's Warrior has reached the unlock level. */
function rosterOpen(content: ContentCatalog, heroes: readonly Doc<'heroes'>[]): boolean {
  const warrior = heroes.find((hero) => hero.class === 'warrior')
  return warrior !== undefined && unlocked(content, warrior.level, 'roster')
}

/** When the next switch is allowed, and whether a switch back to the hero just left is still an undo. */
function switchState(profile: Doc<'deskCrawlerProfiles'> | null, now: number) {
  const last = profile?.lastSwitch
  const nextAt = last === undefined ? null : last.at + SWITCH_GAP_MS
  const undoHeroId = last?.fromHeroId !== undefined && now < last.at + UNDO_MS ? last.fromHeroId : null
  return { nextAt: nextAt !== null && nextAt > now ? nextAt : null, undoHeroId, undoUntil: undoHeroId === null ? null : last!.at + UNDO_MS }
}

/** A hero that is dead or on the road cannot be parked: switching must not skip a knockout or a trip. */
function assertParkable(hero: Doc<'heroes'>) {
  if (hero.status === 'dead') throw appError('INVALID_STATE', `${hero.name} is knocked out. Switch heroes once they are back on their feet.`)
  if (hero.status === 'travelling') throw appError('INVALID_STATE', `${hero.name} is on the road. Switch heroes once they arrive.`)
}

/** Park the current hero where it stands; a merchant's visit ends, since four adventures is a visit, not a reservation. */
async function park(ctx: MutationCtx, hero: Doc<'heroes'>, tick: number, nextName: string) {
  await ctx.db.patch(hero._id, { isActive: false, parkedAtTick: tick, merchant: undefined })
  await commandLog(ctx, hero, 'park_hero', `Clocked out. [[${nextName}]] takes the desk.`)
}

/** Bring a parked hero back: every tick-stamped timer moves on by the gap, so nothing ran out while it waited. */
async function unpark(ctx: MutationCtx, hero: Doc<'heroes'>, tick: number) {
  const gap = Math.max(0, tick - (hero.parkedAtTick ?? tick))
  await ctx.db.patch(hero._id, {
    isActive: true,
    parkedAtTick: undefined,
    eligibleFromTick: Math.max(hero.eligibleFromTick, tick + 1),
    ...(hero.wakeAtTick === undefined ? {} : { wakeAtTick: hero.wakeAtTick + gap }),
    ...(hero.choice === undefined ? {} : { choice: { ...hero.choice, offeredAtTick: hero.choice.offeredAtTick + gap, expiresAtTick: hero.choice.expiresAtTick + gap } }),
    ...(hero.effects === undefined ? {} : { effects: hero.effects.map((effect) => ({ id: effect.id, untilTick: effect.untilTick + gap })) }),
  })
  await commandLog(ctx, hero, 'unpark_hero', 'Back at the desk, right where you left off.')
}

/** P37: the Roster page. Null before the account has a hero. */
export const mine = query({
  args: { now: v.number() },
  returns: v.any(),
  handler: async (ctx, { now }) => {
    const user = await currentUser(ctx)
    const current = await currentHero(ctx, user)
    if (user === null || current === null) return null
    const world = await readWorld(ctx)
    const content = worldContent(world)
    const heroes = await rosterOf(ctx, user._id)
    const tick = world?.currentTick ?? 0
    const level = unlockLevel(content, 'roster')
    return {
      available: content.classes !== undefined && level !== undefined,
      open: rosterOpen(content, heroes),
      unlockLevel: level ?? null,
      warriorLevel: heroes.find((hero) => hero.class === 'warrior')?.level ?? null,
      heroes: heroes.map((hero) => ({
        id: hero._id,
        name: hero.name,
        class: hero.class,
        className: content.classes?.[hero.class]?.name ?? 'Warrior',
        level: hero.level,
        status: hero.status,
        hp: hero.hp,
        maxHp: heroMaxHp(content, hero),
        gold: hero.gold,
        biome: content.biomes.find((biome) => biome.id === hero.biomeId)?.name ?? hero.biomeId,
        current: hero._id === current._id,
        // Parked for this many adventures (ticks), or null for the current hero.
        parkedFor: hero._id === current._id || hero.parkedAtTick === undefined ? null : Math.max(0, tick - hero.parkedAtTick),
      })),
      classes: CLASSES.flatMap((id) => {
        const rule = content.classes?.[id]
        if (rule === undefined) return []
        return [{ id, name: rule.name, blurb: rule.blurb, passive: rule.passive, hpPct: rule.hpPct, modifiers: rule.modifiers, raidEdgePct: rule.raidEdgePct, recruited: heroes.some((hero) => hero.class === id) }]
      }),
      canPark: current.status !== 'dead' && current.status !== 'travelling',
      ...switchState(await gameProfile(ctx, user._id), now),
    }
  },
})

/** P37: recruit a hero of a class not yet on the roster; it starts at level 1 and becomes the current hero. */
export const recruit = mutation({
  args: { operationId: v.string(), heroClass: v.union(v.literal('warrior'), v.literal('rogue')), name: v.string(), gender: v.optional(heroGender) },
  returns: intentResult,
  handler: async (ctx, args) =>
    await runIntent(ctx, args.operationId, 'roster.recruit', { heroClass: args.heroClass, name: args.name, ...(args.gender === undefined ? {} : { gender: args.gender }) }, async (user) => {
      const current = await requirePlayableHero(ctx, user)
      const world = await readWorld(ctx)
      const content = worldContent(world)
      if (content.classes?.[args.heroClass] === undefined) throw appError('INVALID_INPUT', 'That class is not here yet.')
      const heroes = await rosterOf(ctx, user._id)
      if (!rosterOpen(content, heroes)) throw appError('LOCKED', `A second hero opens when your Warrior reaches level ${unlockLevel(content, 'roster') ?? '?'}.`)
      if (heroes.some((hero) => hero.class === args.heroClass)) throw appError('INVALID_STATE', `You already have a ${content.classes[args.heroClass]!.name}.`)
      const name = validateName(args.name, HERO_NAME_RULE)
      if (!name.ok) throw appError('INVALID_INPUT', `Hero name: ${name.reason}`)
      assertParkable(current)
      const profile = await gameProfile(ctx, user._id)
      const now = Date.now()
      // Recruiting is the day's switch, so hopping cannot be had by recruiting; the undo returns to the hero left.
      if (switchState(profile, now).nextAt !== null) throw appError('RATE_LIMITED', 'You switched heroes in the last day. Recruit once the day is up.')
      await park(ctx, current, world?.currentTick ?? 0, name.value)
      await createHero(ctx, user, { name: name.value, heroClass: args.heroClass, ...(args.gender === undefined ? {} : { gender: args.gender }), now, active: true })
      await ctx.db.patch((await gameProfile(ctx, user._id))!._id, { lastSwitch: { at: now, fromHeroId: current._id } })
      return { changed: true }
    }),
})

/** P37: make a parked hero current. Once a day, or within ten minutes back to the hero just left. */
export const switchHero = mutation({
  args: { operationId: v.string(), heroId: v.id('heroes') },
  returns: intentResult,
  handler: async (ctx, args) =>
    await runIntent(ctx, args.operationId, 'roster.switchHero', { heroId: args.heroId }, async (user) => {
      const current = await requirePlayableHero(ctx, user)
      if (current._id === args.heroId) return { changed: false }
      const target = await ctx.db.get(args.heroId)
      if (target === null || target.userId !== user._id) throw appError('HERO_NOT_FOUND', 'That hero is not on your roster.')
      if (target.simulationState === 'quarantined') throw appError('SERVICE_PAUSED', 'That hero is paused for a service check.')
      assertParkable(current)
      const profile = await gameProfile(ctx, user._id)
      const now = Date.now()
      const state = switchState(profile, now)
      const undo = state.undoHeroId === target._id
      if (!undo && state.nextAt !== null) throw appError('RATE_LIMITED', 'One switch a day. Your next switch opens a day after the last one.')
      const tick = (await readWorld(ctx))?.currentTick ?? 0
      await park(ctx, current, tick, target.name)
      await unpark(ctx, target, tick)
      await setCurrentHero(ctx, user, target._id)
      // An undo keeps the day's clock from the original switch and cannot itself be undone.
      await ctx.db.patch(profile!._id, { lastSwitch: undo ? { at: profile!.lastSwitch!.at } : { at: now, fromHeroId: current._id } })
      return { changed: true }
    }),
})
