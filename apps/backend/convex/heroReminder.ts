import { v } from 'convex/values'
import { hmac } from '@noble/hashes/hmac.js'
import { sha256 } from '@noble/hashes/sha2.js'
import { contentTranslator } from '@trmnl-games/desk-crawler/i18n'
import { currentRung } from '@trmnl-games/desk-crawler/sim/core/career'
import { isGear } from '@trmnl-games/desk-crawler/sim/core/workbench'
import { internal } from './_generated/api'
import type { Doc, Id } from './_generated/dataModel'
import { internalAction, internalMutation, internalQuery, mutation, type QueryCtx } from './_generated/server'
import { verifiedPrimaryEmail } from './lib/deletionConfirmation'
import { gameProfile } from './lib/gameProfile'
import { heroReminderEmail, type ReminderFacts } from './lib/heroReminderEmail'
import { normalizeAlias } from './lib/names'
import { deviceLocale } from './lib/trmnlUser'
import { toHeroState } from './sim/runs/adapter'
import { readWorld, worldContent } from './world'

/**
 * D198: one email, ever, to a player whose hero has run for two days while they have never opened the companion: what
 * waits for them there (career gold, finds in the bag, the next goal), in their language, with a link to stop. The
 * daily run sends nothing until `HERO_REMINDERS=on` is set on the deployment; `sendTest` mails one owner their own
 * hero's email without marking anything. Addresses come from Clerk at send time and are never stored.
 */

const DAY_MS = 24 * 60 * 60 * 1000
export const REMINDER_AFTER_MS = 2 * DAY_MS
const SCAN = 5000
const RARITY_RANK = { common: 0, uncommon: 1, rare: 2, epic: 3 } as const

/** Never opened the companion: no recap seen, and nothing done that only the companion can do. */
function untouched(hero: Doc<'heroes'>): boolean {
  const c = hero.counters
  return !hero.companionVisitBaseline && !(c.itemsEquipped ?? 0) && !(c.itemsSold ?? 0) && !(c.itemsSalvaged ?? 0) && !(c.purchases ?? 0)
}

export function reminderDue(hero: Doc<'heroes'>, user: Doc<'users'>, now: number): boolean {
  return (
    hero.isActive &&
    hero.activationState === 'active' &&
    now - (hero.activatedAt ?? hero.createdAt) >= REMINDER_AFTER_MS &&
    untouched(hero) &&
    user.state === 'active' &&
    user.heroReminderSentAt === undefined &&
    user.heroReminderStoppedAt === undefined
  )
}

async function factsFor(ctx: QueryCtx, hero: Doc<'heroes'>, user: Doc<'users'>): Promise<ReminderFacts> {
  const content = worldContent(await readWorld(ctx))
  const t = contentTranslator(deviceLocale(user))
  const state = toHeroState(hero)
  const waiting = state.career?.unclaimed ?? []
  const outside = new Set([hero.heldItemId, hero.weaponId, hero.armorId])
  const bag = (await ctx.db.query('items').withIndex('by_heroId', (q) => q.eq('heroId', hero._id)).take(200)).filter((item) => isGear(item.kind) && !outside.has(item._id))
  const best = bag.reduce<Doc<'items'> | null>((top, item) => (top === null || RARITY_RANK[item.rarity] > RARITY_RANK[top.rarity] || (item.rarity === top.rarity && item.saleValue > top.saleValue) ? item : top), null)
  const rung = currentRung(content, state)
  return {
    name: hero.name,
    level: hero.level,
    since: hero.activatedAt ?? hero.createdAt,
    timezone: user.timezone,
    gold: waiting.reduce((sum, reward) => sum + reward.gold, 0),
    goals: waiting.length,
    finds: bag.length,
    capacity: hero.bagCapacity,
    best: best ? t.name(best.name) : null,
    nextGoal: rung ? t.text(rung.title) : null,
  }
}

const encode = new TextEncoder()
const stopKey = () => process.env.EMAIL_STOP_KEY ?? process.env.ACCOUNT_DELETION_LINK_KEY ?? null
/** The stop link's proof, bound to the account; reproducible only with the deployment's key. */
const stopToken = (key: string, userId: string) => Array.from(hmac(sha256, encode.encode(key), encode.encode(JSON.stringify(['hero-reminder-stop-v1', userId]))), (byte) => byte.toString(16).padStart(2, '0')).join('')

/** Owners due a reminder now, at most `limit`: one per account, for the hero the owner plays. */
async function dueOwners(ctx: QueryCtx, now: number, limit: number) {
  const due: { userId: Id<'users'>; heroId: Id<'heroes'> }[] = []
  for (const hero of await ctx.db.query('heroes').withIndex('by_createdAt').take(SCAN)) {
    if (due.length >= limit) break
    const user = await ctx.db.get(hero.userId)
    if (user === null || !reminderDue(hero, user, now)) continue
    const profile = await gameProfile(ctx, user._id)
    if (profile?.state === 'deleting' || (profile?.activeHeroId ?? user.activeHeroId) !== hero._id) continue
    due.push({ userId: user._id, heroId: hero._id })
  }
  return due
}

/** Daily: claim each due owner (so no one is mailed twice) and send, a few seconds apart. Off until HERO_REMINDERS=on. */
export const queueDaily = internalMutation({
  args: {},
  returns: v.number(),
  handler: async (ctx) => {
    if (process.env.HERO_REMINDERS !== 'on') return 0
    const now = Date.now()
    const due = await dueOwners(ctx, now, 100)
    for (const [index, { userId, heroId }] of due.entries()) {
      await ctx.db.patch(userId, { heroReminderSentAt: now })
      await ctx.scheduler.runAfter(index * 5_000, internal.heroReminder.send, { userId, heroId, test: false })
    }
    return due.length
  },
})

/** What one email needs, read fresh at send time; null when the owner is no longer due (or, for a test, has no hero). */
export const emailFor = internalQuery({
  args: { userId: v.id('users'), heroId: v.id('heroes'), test: v.boolean() },
  returns: v.union(v.null(), v.object({ tokenIdentifier: v.string(), locale: v.string(), facts: v.any() })),
  handler: async (ctx, { userId, heroId, test }) => {
    const [user, hero] = await Promise.all([ctx.db.get(userId), ctx.db.get(heroId)])
    if (user === null || hero === null || hero.userId !== userId || user.state !== 'active' || user.heroReminderStoppedAt !== undefined) return null
    if (!test && (!untouched(hero) || !hero.isActive)) return null
    return { tokenIdentifier: user.tokenIdentifier, locale: deviceLocale(user), facts: await factsFor(ctx, hero, user) }
  },
})

export const send = internalAction({
  args: { userId: v.id('users'), heroId: v.id('heroes'), test: v.boolean() },
  returns: v.union(v.literal('sent'), v.literal('skipped'), v.literal('failed')),
  handler: async (ctx, { userId, heroId, test }): Promise<'sent' | 'skipped' | 'failed'> => {
    const row: { tokenIdentifier: string; locale: string; facts: ReminderFacts } | null = await ctx.runQuery(internal.heroReminder.emailFor, { userId, heroId, test })
    const key = process.env.RESEND_API_KEY
    const clerk = process.env.CLERK_SECRET_KEY
    const stop = stopKey()
    if (row === null) return 'skipped'
    let outcome: 'sent' | 'failed' = 'failed'
    if (key && clerk && stop) {
      try {
        const subject = row.tokenIdentifier.slice(row.tokenIdentifier.indexOf('|') + 1)
        const response = await fetch(`https://api.clerk.com/v1/users/${encodeURIComponent(subject)}`, { headers: { Authorization: `Bearer ${clerk}` }, signal: AbortSignal.timeout(10_000) })
        const email = response.ok ? verifiedPrimaryEmail(await response.json()) : null
        if (email) {
          const origin = new URL(process.env.COMPANION_ORIGIN ?? 'https://trmnlgames.com').origin
          const stopLink = new URL('/desk-crawler/unsubscribe', origin)
          stopLink.searchParams.set('u', userId)
          stopLink.searchParams.set('t', stopToken(stop, userId))
          const message = heroReminderEmail(row.locale as Parameters<typeof heroReminderEmail>[0], row.facts as ReminderFacts, { app: `${origin}/app/desk-crawler`, stop: stopLink.toString() })
          const sent = await fetch('https://api.resend.com/emails', {
            method: 'POST',
            signal: AbortSignal.timeout(10_000),
            headers: { Authorization: `Bearer ${key}`, 'Content-Type': 'application/json', 'Idempotency-Key': `hero-reminder/${userId}${test ? `/test/${Date.now()}` : ''}` },
            body: JSON.stringify({ from: process.env.REMINDER_FROM ?? 'Barry at TRMNL Games <alerts@trmnlgames.com>', to: [email.address], ...message, headers: { 'List-Unsubscribe': `<${stopLink.toString()}>` } }),
          })
          outcome = sent.ok ? 'sent' : 'failed'
        }
      } catch {
        outcome = 'failed'
      }
    }
    // A failed real send gives the claim back, so the next daily run tries again.
    if (!test && outcome === 'failed') await ctx.runMutation(internal.heroReminder.release, { userId })
    return outcome
  },
})

export const release = internalMutation({
  args: { userId: v.id('users') },
  returns: v.null(),
  handler: async (ctx, { userId }) => {
    const user = await ctx.db.get(userId)
    if (user?.heroReminderSentAt !== undefined) await ctx.db.patch(userId, { heroReminderSentAt: undefined })
    return null
  },
})

/** The operator's preview: `npx convex run --prod heroReminder:sendTest '{"alias":"<your public name>"}'` mails that owner their own hero's email. */
export const sendTest = internalAction({
  args: { alias: v.string() },
  returns: v.string(),
  handler: async (ctx, { alias }): Promise<string> => {
    const target = await ctx.runQuery(internal.heroReminder.ownerByAlias, { alias })
    if (target === null) return 'no user with that public name and a hero'
    return await ctx.runAction(internal.heroReminder.send, { ...target, test: true })
  },
})

export const ownerByAlias = internalQuery({
  args: { alias: v.string() },
  returns: v.union(v.null(), v.object({ userId: v.id('users'), heroId: v.id('heroes') })),
  handler: async (ctx, { alias }) => {
    const user = await ctx.db.query('users').withIndex('by_normalizedAlias', (q) => q.eq('normalizedAlias', normalizeAlias(alias))).unique()
    if (user === null) return null
    const heroId = (await gameProfile(ctx, user._id))?.activeHeroId ?? user.activeHeroId
    return heroId ? { userId: user._id, heroId } : null
  },
})

/** The stop link: no more reminders for this account. Valid only with the token the email carried. */
export const stop = mutation({
  args: { userId: v.string(), token: v.string() },
  returns: v.boolean(),
  handler: async (ctx, { userId, token }) => {
    const key = stopKey()
    const id = ctx.db.normalizeId('users', userId)
    if (!key || id === null || !/^[a-f0-9]{64}$/.test(token) || token !== stopToken(key, id)) return false
    const user = await ctx.db.get(id)
    if (user === null) return true
    if (user.heroReminderStoppedAt === undefined) await ctx.db.patch(id, { heroReminderStoppedAt: Date.now() })
    return true
  },
})
