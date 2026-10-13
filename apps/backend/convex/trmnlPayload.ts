import { currentHero, gameProfile, isDeskCrawler } from './lib/gameProfile'
import { maskRaidSummaries } from './lib/raids'
import { sceneEvent } from './lib/heroScene'
import { v } from 'convex/values'
import { internalQuery, query, type QueryCtx } from './_generated/server'
import type { Doc } from './_generated/dataModel'
import { currentUser } from './lib/intent'

import { bagUsed as countBag } from '@trmnl-games/desk-crawler/sim/core/bag'
import { potionsHeld } from '@trmnl-games/desk-crawler/sim/core/potions'
import { buildPayload, MAX_LOGS, MAX_RECAP_EVENTS, recapPeriod, type PayloadInput } from '@trmnl-games/desk-crawler/payload'
import { readWorld, worldContent } from './world'
import { readDeviceRanking } from './lib/rankingRead'
import { keepsakeCode, keepsakeGrant } from './lib/keepsakes'
import { keepsakesOpen, keepsakeWeek } from '@trmnl-games/desk-crawler/content/keepsakes'
import { displayLogDeltas } from '@trmnl-games/desk-crawler/log'
import { affixById } from '@trmnl-games/desk-crawler/sim/core/modifiers'
import { todoCompactLine } from '@trmnl-games/desk-crawler/sim/core/todo'
import { careerLine, currentRung, measureRung } from '@trmnl-games/desk-crawler/sim/core/career'
import { taskLabel } from '@trmnl-games/desk-crawler/sim/core/todo'
import { toHeroState } from './sim/runs/adapter'
import type { ContentCatalog } from '@trmnl-games/desk-crawler/sim/core/types'
import { INVENTORY_READ } from '@trmnl-games/desk-crawler/sim/core/limits'

/**
 * Fixed-cost canonical payload for one authorized instance (trmnl.md "Query
 * read budget"). Returns null for any authorization failure; the HTTP layer
 * answers a generic 404. Read-only: confirmation/activation happen before this.
 */
/** How often a screen request may refresh an instance's `lastScreenServedAt`. */
export const SCREEN_SERVED_THROTTLE_MS = 60 * 60_000

export const forInstance = internalQuery({
  args: { gameSlug: v.optional(v.literal('desk-crawler')), tokenHash: v.string(), uuid: v.string(), now: v.number(), instanceName: v.union(v.string(), v.null()), utcOffset: v.optional(v.union(v.number(), v.null())) },
  returns: v.union(
    v.null(),
    v.object({ outcome: v.literal('recoverable') }),
    v.object({ outcome: v.literal('payload'), payload: v.any(), keepsakeCode: v.union(v.string(), v.null()), recordOffsetFor: v.optional(v.id('users')), screenServedFor: v.optional(v.id('trmnlInstances')) }),
  ),
  handler: async (ctx, args) => {
    const instance = await ctx.db
      .query('trmnlInstances')
      .withIndex('by_uuid', (q) => q.eq('uuid', args.uuid))
      .unique()
    if (!instance) {
      if (await ctx.db.query('revokedTrmnlCredentials').withIndex('by_tokenHash', q => q.eq('tokenHash', args.tokenHash)).first()) return null
      const grant = await ctx.db.query('trmnlGrants').withIndex('by_tokenHash', q => q.eq('tokenHash', args.tokenHash)).unique()
      return grant && isDeskCrawler(grant) && grant.state === 'active' && !grant.authorizedUuid ? { outcome: 'recoverable' as const } : null
    }
    const grant = await ctx.db.get(instance.grantId)
    if (!grant || !isDeskCrawler(grant) || grant.state !== 'active' || grant.tokenHash !== args.tokenHash || (grant.authorizedUuid && grant.authorizedUuid !== args.uuid)) return null
    if (!isDeskCrawler(instance) || instance.userId !== grant.userId || instance.state !== 'active') return null
    const user = await ctx.db.get(instance.userId)
    if (user === null || user.state !== 'active' || (await gameProfile(ctx, user._id))?.state === 'deleting') return null

    const payload = await payloadFor(ctx, user, args.now, args.instanceName, args.utcOffset ?? null)
    // Device envelope only: canonical/owner-preview payload never contains a claim code.
    const week = keepsakeWeek(args.now)
    const collection = await ctx.db.query('deskKeepsakes').withIndex('by_userId', (q) => q.eq('userId', user._id)).unique()
    const codeGrant = payload.status !== 'unlinked' && keepsakesOpen(args.now) && (!collection || collection.lastClaimWeek < week) ? await keepsakeGrant(ctx, user._id) : null
    // P31: the route stores the owner's offset only when it differs from the stored one, so most requests write nothing.
    const offsetChanged = args.utcOffset !== undefined && args.utcOffset !== null && args.utcOffset !== user.trmnlUtcOffset
    // data-model.md: `lastScreenServedAt` is telemetry written at most once an hour per instance; the companion reads it to
    // know TRMNL has fetched this installation's screen at least once.
    const screenStale = instance.lastScreenServedAt === undefined || args.now - instance.lastScreenServedAt >= SCREEN_SERVED_THROTTLE_MS
    return { outcome: 'payload' as const, payload, keepsakeCode: codeGrant ? keepsakeCode(codeGrant.tokenHash, user._id, week) : null, ...(offsetChanged ? { recordOffsetFor: user._id } : {}), ...(screenStale ? { screenServedFor: instance._id } : {}) }
  },
})

/**
 * D112: the count form of a stand-up, or of several tasks ticked off at once; a single ticked-off task keeps its label.
 * P35: a goal line drops its "Next:" clause where the row is narrow.
 */
function compactLine(log: Doc<'tickLogs'>): { compact?: string } {
  if (!('outcome' in log.detail)) return {}
  const outcome = log.detail.outcome
  if (log.kind === 'todo' && outcome.variant === 'todo') return outcome.phase === 'standup' || outcome.tasks.length > 1 ? { compact: todoCompactLine(outcome.phase, outcome.tasks.length) } : {}
  if (log.kind === 'career' && outcome.variant === 'career') {
    const { compact } = careerLine(outcome)
    return compact === log.summary ? {} : { compact }
  }
  return {}
}

/** The canonical device payload for a user's current hero. Shared by the device endpoint and the owner preview. */
async function payloadFor(ctx: QueryCtx, user: Doc<'users'>, now: number, instanceName: string | null, utcOffset: number | null) {
  const world = await readWorld(ctx)
  const content = worldContent(world)
  const heroDoc = await currentHero(ctx, user)
  const hero = heroDoc && heroDoc.activationState === 'active' ? heroDoc : null

  let weaponName: string | null = null
  let armorName: string | null = null
  let weaponAttack = 0
  let armorDefense = 0
  let heldItemName: string | null = null
  let potions = 0
  let bagUsed = 0
  let logs: PayloadInput['logs'] = []
  let activity: PayloadInput['activity']
  let latestEvent: { kind: string; outcome?: { variant: string; [key: string]: unknown } } | null = null
  let newestEvent: { kind: string; outcome?: { variant: string; [key: string]: unknown }; title?: string } | null = null
  if (hero) {
    const items = await ctx.db
      .query('items')
      .withIndex('by_heroId', (q) => q.eq('heroId', hero._id))
      .take(INVENTORY_READ)
    const named = (id: string | undefined) => items.find((item) => item._id === id)
    const label = (item: (typeof items)[number] | undefined) =>
      item ? `${affixById(content, item.affixId)?.name ?? ''} ${item.rarity === 'common' ? '' : item.rarity.charAt(0).toUpperCase() + item.rarity.slice(1)} ${item.name}`.replace(/\s+/g, ' ').trim() : null
    weaponName = label(named(hero.weaponId))
    armorName = label(named(hero.armorId))
    weaponAttack = named(hero.weaponId)?.attack ?? 0
    armorDefense = named(hero.armorId)?.defense ?? 0
    heldItemName = label(named(hero.heldItemId))
    // D131: every strength counts; the device shows one number.
    potions = potionsHeld(items)
    bagUsed = countBag({
      ...(hero.heldItemId === undefined ? {} : { heldItemId: hero.heldItemId }),
      ...(hero.weaponId === undefined ? {} : { weaponId: hero.weaponId }),
      ...(hero.armorId === undefined ? {} : { armorId: hero.armorId }),
    }, items.map((item) => ({ id: item._id as string, kind: item.kind })))
    const recent = await ctx.db
      .query('tickLogs')
      .withIndex('by_heroId_and_at_and_sequence', (q) => q.eq('heroId', hero._id))
      .order('desc')
      .take(MAX_LOGS)
    // D110: a raid rival whose name has since changed or gone reads "Hidden player" here too.
    const summaries = await maskRaidSummaries(ctx, recent)
    // D112: a stand-up, or several tasks ticked off at once, carries its count form for rows too narrow for the labels.
    // A legacy drawer find (D111, removed in D123) reads as the loot line it is.
    logs = recent.map((log, index) => ({ at: log.at, kind: log.kind, summary: summaries[index]!, deltas: displayLogDeltas(log), ...compactLine(log) }))
    // The most recently completed night or day period in the owner's local time (D75), the same one buildPayload labels.
    const period = recapPeriod(now, utcOffset)
    const window = await ctx.db
      .query('tickLogs')
      .withIndex('by_heroId_and_at_and_sequence', (q) => q.eq('heroId', hero._id).gt('at', period.from).lte('at', period.to))
      .order('desc')
      .take(MAX_RECAP_EVENTS + 1)
    activity = { entries: window.slice(0, MAX_RECAP_EVENTS), truncated: window.length > MAX_RECAP_EVENTS }
    // The scene follows the newest gameplay event; the celebration follows the newest log, which may be an achievement (D65).
    // D112: to-do lines follow their tick's story, so neither the scene nor the celebration ever follows one.
    // P35: a career line (a goal reached, a feature unlocked) is a celebration, never a scene.
    // D139: an occasion line follows its tick's story like a to-do line; the dressed scene announces the occasion.
    const gameplay = recent.find((log) => log.kind !== 'achievement' && log.kind !== 'todo' && log.kind !== 'career' && log.kind !== 'occasion')
    if (gameplay) latestEvent = await sceneEvent(ctx, gameplay)
    const newest = recent.find((log) => log.kind !== 'todo' && log.kind !== 'occasion')
    if (newest) {
      const title = 'achievementId' in newest.detail ? newest.detail.name : 'outcome' in newest.detail && newest.detail.outcome.variant === 'career' ? careerLine(newest.detail.outcome).compact.replace(/\.$/, '') : undefined
      newestEvent = { kind: newest.kind, ...('outcome' in newest.detail ? { outcome: newest.detail.outcome } : {}), ...(title === undefined ? {} : { title }) }
    }
  }

  const payload = buildPayload({
    now,
    world: world
      ? {
          currentTick: world.currentTick,
          ...(world.lastCompletedTick === undefined ? {} : { lastCompletedTick: world.lastCompletedTick }),
          ...(world.lastCompletedAt === undefined ? {} : { lastCompletedAt: world.lastCompletedAt }),
          createdAt: world.createdAt,
          ticksPaused: world.ticksPaused,
          maintenanceMode: world.maintenanceMode,
        }
      : null,
    ownerAlias: user.publicAlias,
    timezone: user.timezone,
    hero: hero
      ? {
          name: hero.name,
          level: hero.level,
          xp: hero.xp,
          hp: hero.hp,
          gold: hero.gold,
          status: hero.status,
          biomeId: hero.biomeId,
          ...(hero.targetBiomeId === undefined ? {} : { targetBiomeId: hero.targetBiomeId }),
          ...(hero.arriveAtTick === undefined ? {} : { arriveAtTick: hero.arriveAtTick }),
          ...(hero.reviveAtTick === undefined ? {} : { reviveAtTick: hero.reviveAtTick }),
          ...(hero.wakeAtTick === undefined ? {} : { wakeAtTick: hero.wakeAtTick }),
          lastTick: hero.lastTick,
          ...(hero.lastAdvancedAt === undefined ? {} : { lastAdvancedAt: hero.lastAdvancedAt }),
          quarantined: hero.simulationState === 'quarantined',
          ...(hero.merchant === undefined ? {} : { merchantExpiresAtTick: hero.merchant.expiresAtTick }),
          ...(hero.choice === undefined ? {} : { choiceExpiresAtTick: hero.choice.expiresAtTick }),
          ...(hero.stance === undefined ? {} : { stance: hero.stance }),
          class: hero.class,
          ...(hero.gender === undefined ? {} : { gender: hero.gender }),
        }
      : null,
    weaponName,
    armorName,
    weaponAttack,
    armorDefense,
    potions,
    bagUsed,
    bagCapacity: hero?.bagCapacity ?? 0,
    heldItemName,
    logs,
    ...(activity ? { activity } : {}),
    utcOffset,
    instanceName,
    content,
    spriteBaseUrl: process.env.SPRITE_BASE_URL ?? null,
    artBaseUrl: process.env.CONVEX_SITE_URL ?? null,
    latestEvent,
    newestEvent,
    ranking: hero ? await readDeviceRanking(ctx, world, hero) : null,
    // D138: the X full landscape shows today's tasks and the current goal beside the stories.
    ...(hero?.todo && content.todo ? { todoTasks: hero.todo.tasks.map((task) => ({ label: taskLabel(task, content), progress: task.progress, target: task.target, done: task.doneTick !== undefined })) } : {}),
    goal: hero ? deviceGoal(content, hero) : null,
  })
  return payload
}

/**
 * Owner preview: exactly what the user's TRMNL renders now. `now` comes from
 * the client (rounded to the minute) so the query stays cacheable.
 */
export const mine = query({
  args: { now: v.number(), utcOffset: v.optional(v.union(v.number(), v.null())) },
  returns: v.union(v.null(), v.any()),
  handler: async (ctx, { now, utcOffset }) => {
    const user = await currentUser(ctx)
    if (user === null || user.state !== 'active' || (await gameProfile(ctx, user._id))?.state === 'deleting') return null
    const hero = await currentHero(ctx, user)
    if (hero === null || hero.activationState !== 'active') return null
    return await payloadFor(ctx, user, now, null, utcOffset ?? null)
  },
})

/** D138: the hero's current goal with its progress, for the device; null off the ladder or past its end. */
function deviceGoal(content: ContentCatalog, hero: Doc<'heroes'>) {
  const state = toHeroState(hero)
  const rung = currentRung(content, state)
  if (rung === undefined) return null
  const { value, target } = measureRung(rung.predicate, state, content)
  return { title: rung.title, value, target, gold: rung.gold }
}
