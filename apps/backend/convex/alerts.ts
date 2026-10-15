import { v } from 'convex/values'
import type { Doc, Id } from './_generated/dataModel'
import { internalMutation, internalQuery, mutation, query, type MutationCtx, type QueryCtx } from './_generated/server'
import { currentHero } from './lib/gameProfile'
import { appError } from './lib/errors'
import { sha256Hex } from './lib/hash'
import { currentUser, runIntent } from './lib/intent'
import { validateTimezone } from './lib/names'
import { ALERTS, alertMessage, DESK_CRAWLER_KINDS, ensureSender, inQuietHours, kindOn, lifeAlertMessage, localDay, PAPER_LIVES_KINDS, PREF_FOR, quietEndsAt, IDLE_ANGLER_KINDS, SWITCHES, type AlertKind, type AlertSwitch } from './lib/alerts'
import { currentAngler } from './idleAngler/profile'
import { currentLife } from './paperLives/profile'
import type { GameSlug } from '@trmnl-games/platform'
import { coolerOf } from '@trmnl-games/idle-angler/sim'
import { contentV1 } from '@trmnl-games/idle-angler/content'
import { ACTIVE_CONTENT, catalogs } from '@trmnl-games/paper-lives/content'
import { readWorld } from './world'
import { deviceLocale } from './lib/trmnlUser'

/** P33 hero alerts: preferences, this account's push devices and the sender's two transactions (alerts.md). */

const SLOT_MINUTES = 15

const intentResult = v.object({ operationId: v.string(), changed: v.boolean() })

const switches = (prefs: Doc<'users'>['alerts']) => Object.fromEntries(SWITCHES.map((id) => [id, prefs?.[id] ?? false])) as Record<AlertSwitch, boolean>

const defaults = (prefs: Doc<'users'>['alerts']) => ({
  ...switches(prefs),
  quietStart: prefs?.quietStart ?? ALERTS.quietStart,
  quietEnd: prefs?.quietEnd ?? ALERTS.quietEnd,
  offReason: prefs?.offReason ?? null,
})

/** Alerts need a player character in some game: a hero, an angler (D115) or a life (D159). */
async function playsAGame(ctx: QueryCtx, user: Doc<'users'>): Promise<boolean> {
  return (await currentHero(ctx, user)) !== null || (await currentAngler(ctx, user)) !== null || (await currentLife(ctx, user)) !== null
}

/** A short, stable fingerprint of an endpoint, so the companion can tell which listed device it is without the endpoint itself. */
export const endpointFingerprint = (endpoint: string) => sha256Hex(`push:${endpoint}`).slice(0, 16)

async function devicesOf(ctx: QueryCtx, userId: Id<'users'>) {
  return await ctx.db.query('pushSubscriptions').withIndex('by_userId', (q) => q.eq('userId', userId)).take(ALERTS.maxSubscriptions + 1)
}

/** The owner's alert settings and devices, or null when signed out or without a hero. */
export const mine = query({
  args: {},
  returns: v.union(
    v.null(),
    v.object({
      vapidPublicKey: v.union(v.string(), v.null()),
      timezone: v.string(),
      asleep: v.boolean(),
      merchant: v.boolean(),
      coolerFull: v.boolean(),
      baitOut: v.boolean(),
      majorDecision: v.boolean(),
      lifeEnded: v.boolean(),
      newArrival: v.boolean(),
      quietStart: v.number(),
      quietEnd: v.number(),
      offReason: v.union(v.literal('no_devices'), v.null()),
      devices: v.array(v.object({ id: v.id('pushSubscriptions'), label: v.string(), createdAt: v.number(), fingerprint: v.string() })),
    }),
  ),
  handler: async (ctx) => {
    const user = await currentUser(ctx)
    if (user === null || !(await playsAGame(ctx, user))) return null
    const devices = await devicesOf(ctx, user._id)
    return {
      vapidPublicKey: process.env.VAPID_PUBLIC_KEY ?? null,
      timezone: user.timezone,
      ...defaults(user.alerts),
      devices: devices.map((device) => ({ id: device._id, label: device.label, createdAt: device.createdAt, fingerprint: endpointFingerprint(device.endpoint) })),
    }
  },
})

const hour = (value: number) => Number.isInteger(value) && value >= 0 && value <= 23

/**
 * Turn alert kinds on or off and set quiet hours (whole hours in the browser's timezone). Turning a kind on needs a
 * device that can receive it; quiet hours can move but never disappear, so start and end must differ.
 */
export const setPreferences = mutation({
  // Each game's card sends its own switches; a switch left out keeps its stored value (D115).
  args: {
    operationId: v.string(),
    asleep: v.optional(v.boolean()),
    merchant: v.optional(v.boolean()),
    coolerFull: v.optional(v.boolean()),
    baitOut: v.optional(v.boolean()),
    majorDecision: v.optional(v.boolean()),
    lifeEnded: v.optional(v.boolean()),
    newArrival: v.optional(v.boolean()),
    quietStart: v.number(), quietEnd: v.number(), timezone: v.string() },
  returns: intentResult,
  handler: async (ctx, args) => {
    const { operationId, ...input } = args
    const result = await runIntent(ctx, operationId, 'alerts.setPreferences', input, async (user) => {
      if (!(await playsAGame(ctx, user))) throw appError('HERO_NOT_FOUND', 'No hero yet.')
      if (!hour(input.quietStart) || !hour(input.quietEnd) || input.quietStart === input.quietEnd) throw appError('INVALID_INPUT', 'Quiet hours need a different start and end hour.')
      const current = user.alerts
      const stored = defaults(current)
      const next = {
        ...(Object.fromEntries(SWITCHES.map((id) => [id, input[id] ?? stored[id]])) as Record<AlertSwitch, boolean>),
        quietStart: input.quietStart,
        quietEnd: input.quietEnd,
      }
      if (SWITCHES.some((id) => next[id]) && (await devicesOf(ctx, user._id)).length === 0) throw appError('INVALID_STATE', 'Allow alerts on this device first.')
      const timezone = validateTimezone(input.timezone)
      const same = current !== undefined && current.offReason === undefined && SWITCHES.every((id) => stored[id] === next[id]) && current.quietStart === next.quietStart && current.quietEnd === next.quietEnd
      if (same && user.timezone === timezone) return { changed: false }
      await ctx.db.patch(user._id, { alerts: next, timezone })
      return { changed: true }
    })
    return { operationId: result.operationId, changed: result.changed }
  },
})

const base64url = /^[A-Za-z0-9_-]+={0,2}$/

/** Store this browser's push subscription. A sixth device replaces the oldest; an endpoint follows the account that last saved it. */
export const subscribe = mutation({
  args: { operationId: v.string(), endpoint: v.string(), p256dh: v.string(), auth: v.string(), label: v.string() },
  returns: intentResult,
  handler: async (ctx, args) => {
    const { operationId, ...input } = args
    const result = await runIntent(ctx, operationId, 'alerts.subscribe', input, async (user) => {
      if (!(await playsAGame(ctx, user))) throw appError('HERO_NOT_FOUND', 'No hero yet.')
      let url: URL
      try {
        url = new URL(input.endpoint)
      } catch {
        throw appError('INVALID_INPUT', 'That push subscription is not valid.')
      }
      if (url.protocol !== 'https:' || input.endpoint.length > 1024 || !base64url.test(input.p256dh) || !base64url.test(input.auth) || input.p256dh.length > 200 || input.auth.length > 100) {
        throw appError('INVALID_INPUT', 'That push subscription is not valid.')
      }
      const label = input.label.replace(/[^\w .,()'-]/g, '').trim().slice(0, 40) || 'This browser'
      const now = Date.now()
      const existing = await ctx.db.query('pushSubscriptions').withIndex('by_endpoint', (q) => q.eq('endpoint', input.endpoint)).first()
      if (existing !== null && existing.userId === user._id) {
        if (existing.p256dh === input.p256dh && existing.auth === input.auth && existing.label === label) return { changed: false }
        await ctx.db.patch(existing._id, { p256dh: input.p256dh, auth: input.auth, label })
        return { changed: true }
      }
      // The browser now belongs to this account; the other account loses the device and, if it was its last, its alerts.
      if (existing !== null) await removeSubscription(ctx, existing, undefined)
      const devices = await devicesOf(ctx, user._id)
      const oldest = [...devices].sort((a, b) => a.createdAt - b.createdAt)
      for (const device of oldest.slice(0, Math.max(0, devices.length - ALERTS.maxSubscriptions + 1))) await ctx.db.delete(device._id)
      await ctx.db.insert('pushSubscriptions', { userId: user._id, endpoint: input.endpoint, p256dh: input.p256dh, auth: input.auth, label, createdAt: now })
      if (user.alerts?.offReason !== undefined) {
        const { offReason: _cleared, ...rest } = user.alerts
        await ctx.db.patch(user._id, { alerts: rest })
      }
      return { changed: true }
    })
    return { operationId: result.operationId, changed: result.changed }
  },
})

/** Stop alerts on one device. Removing the last device turns every kind off. */
export const removeDevice = mutation({
  args: { operationId: v.string(), deviceId: v.id('pushSubscriptions') },
  returns: intentResult,
  handler: async (ctx, args) => {
    const result = await runIntent(ctx, args.operationId, 'alerts.removeDevice', { deviceId: args.deviceId }, async (user) => {
      const device = await ctx.db.get(args.deviceId)
      if (device === null || device.userId !== user._id) return { changed: false }
      await removeSubscription(ctx, device, undefined)
      return { changed: true }
    })
    return { operationId: result.operationId, changed: result.changed }
  },
})

/** Delete a subscription; when it was the owner's last, both kinds turn off, with a reason when the push service dropped it. */
async function removeSubscription(ctx: MutationCtx, device: Doc<'pushSubscriptions'>, reason: 'no_devices' | undefined): Promise<void> {
  await ctx.db.delete(device._id)
  if ((await devicesOf(ctx, device.userId)).length > 0) return
  const owner = await ctx.db.get(device.userId)
  if (owner?.alerts === undefined || !SWITCHES.some((id) => owner.alerts![id] === true)) return
  const { offReason: _old, ...rest } = owner.alerts
  await ctx.db.patch(owner._id, { alerts: { ...rest, ...Object.fromEntries(SWITCHES.map((id) => [id, false])), asleep: false, merchant: false, ...(reason === undefined ? {} : { offReason: reason }) } })
}

const sendValidator = v.object({
  outboxId: v.id('alertOutbox'),
  ttlSeconds: v.number(),
  payload: v.string(),
  subscriptions: v.array(v.object({ id: v.id('pushSubscriptions'), endpoint: v.string(), p256dh: v.string(), auth: v.string() })),
})

/**
 * Sender, first transaction: take up to 50 due rows, oldest first, and decide each one. A row whose moment has
 * passed is skipped, quiet hours hold `asleep` until morning and drop `merchant`, the caps skip without queueing,
 * and what is left is marked sending and handed to the push action.
 */
export const claimDue = internalMutation({
  args: {},
  returns: v.array(sendValidator),
  handler: async (ctx) => {
    const now = Date.now()
    const due = await ctx.db.query('alertOutbox').withIndex('by_state_and_notBefore', (q) => q.eq('state', 'pending').lte('notBefore', now)).take(ALERTS.batch)
    const world = await readWorld(ctx)
    const tick = world?.currentTick ?? 0
    const sends: Array<typeof sendValidator.type> = []
    const skip = async (row: Doc<'alertOutbox'>, reason: string) => await ctx.db.patch(row._id, { state: 'skipped', reason, updatedAt: now })
    for (const row of due) {
      const owner = await ctx.db.get(row.userId)
      if (owner === null || owner.state !== 'active') { await skip(row, 'account'); continue }
      const prefs = owner.alerts
      if (prefs === undefined || !kindOn(prefs, row.kind)) { await skip(row, 'kind_off'); continue }
      // An alert never tells the player something that is already over.
      let ttlSeconds = 12 * 60 * 60
      let name = owner.publicAlias
      let lifeMessage: ReturnType<typeof lifeAlertMessage> | undefined
      if (PAPER_LIVES_KINDS.includes(row.kind)) {
        // D159: the life must still be the owner's current one; a decision must still be open in the same year.
        const life = await currentLife(ctx, owner)
        if (life === null || life._id !== row.lifeId || life.activationState !== 'active') { await skip(row, 'life_gone'); continue }
        const state = life.life
        if (row.kind === 'major_decision') {
          const pending = state.year.pending
          if (state.status !== 'living' || state.age !== row.lifeAge || pending?.decisionId !== row.detail || pending?.chosen !== undefined) { await skip(row, 'year_closed'); continue }
          ttlSeconds = Math.max(60, (catalogs[ACTIVE_CONTENT].tuning.closeYearTicks - state.year.elapsed) * SLOT_MINUTES * 60)
          lifeMessage = lifeAlertMessage(row, state.first)
        } else if (row.kind === 'new_arrival') {
          const baby = state.people.find((person) => person.id === row.detail)
          if (baby === undefined || !baby.alive || state.status === 'ended') { await skip(row, 'arrival_gone'); continue }
          ttlSeconds = 6 * 60 * 60
          lifeMessage = lifeAlertMessage(row, state.first, { name: baby.name, role: baby.role === 'grandchild' ? 'grandchild' : 'child' })
        } else {
          if (state.status !== 'ended') { await skip(row, 'life_gone'); continue }
          lifeMessage = lifeAlertMessage(row, state.first)
        }
      } else if (row.kind === 'cooler_full' || row.kind === 'bait_out') {
        // D115: Idle Angler rechecks its angler; the cooler must still be full, or the hook still bare.
        const angler = await currentAngler(ctx, owner)
        if (angler === null || angler._id !== row.anglerId || angler.status === 'paused') { await skip(row, 'angler_gone'); continue }
        if (row.kind === 'cooler_full') {
          const held = (await ctx.db.query('catches').withIndex('by_anglerId', (q) => q.eq('anglerId', angler._id)).take(32)).length
          if (held < coolerOf(contentV1, angler.coolerTier).capacity) { await skip(row, 'sold'); continue }
        } else if (angler.baitOnHook !== undefined && (angler.bait[angler.baitOnHook] ?? 0) > 0) { await skip(row, 'restocked'); continue }
      } else {
      const hero = await currentHero(ctx, owner)
      if (hero === null || hero._id !== row.heroId) { await skip(row, 'hero_gone'); continue }
      name = hero.name
      if (row.kind === 'asleep') {
        if (hero.status !== 'sleeping' || hero.wakeAtTick !== undefined) { await skip(row, 'woke'); continue }
      } else {
        const visit = hero.merchant
        const offer = visit?.offers.find((candidate) => candidate.id === row.offerId)
        if (visit === undefined || tick >= visit.expiresAtTick) { await skip(row, 'merchant_gone'); continue }
        if (offer === undefined) { await skip(row, 'offer_gone'); continue }
        if (hero.gold < offer.price) { await skip(row, 'cant_afford'); continue }
        ttlSeconds = (visit.expiresAtTick - tick) * SLOT_MINUTES * 60
      }
      }
      const devices = await devicesOf(ctx, owner._id)
      if (devices.length === 0) { await skip(row, 'no_devices'); continue }
      if (inQuietHours(now, owner.timezone, prefs)) {
        // The nap, a full cooler, a waiting decision and a death are still news in the morning; the merchant, a bait
        // alert and a birth are not worth waking for (a decision whose year closes overnight drops at the recheck).
        if (row.kind === 'merchant' || row.kind === 'bait_out' || row.kind === 'new_arrival') await skip(row, 'quiet_hours')
        else await ctx.db.patch(row._id, { notBefore: quietEndsAt(now, owner.timezone, prefs), updatedAt: now })
        continue
      }
      const day = localDay(now, owner.timezone)
      const today = (await ctx.db.query('alertOutbox').withIndex('by_userId_and_localDay', (q) => q.eq('userId', owner._id).eq('localDay', day)).take(20))
        .filter((other) => other._id !== row._id && (other.state === 'sent' || other.state === 'sending'))
      if (today.length >= ALERTS.dailyCap) { await skip(row, 'daily_cap'); continue }
      if (row.kind === 'merchant' && today.filter((other) => other.kind === 'merchant').length >= ALERTS.merchantDailyCap) { await skip(row, 'merchant_cap'); continue }
      await ctx.db.patch(row._id, { state: 'sending', localDay: day, attempts: row.attempts + 1, updatedAt: now })
      const message = lifeMessage ?? alertMessage(row, name, deviceLocale(owner))
      sends.push({
        outboxId: row._id,
        ttlSeconds,
        payload: JSON.stringify({ ...message, tag: `${row.kind}` }),
        subscriptions: devices.map((device) => ({ id: device._id, endpoint: device.endpoint, p256dh: device.p256dh, auth: device.auth })),
      })
    }
    await scheduleNext(ctx, due.length === ALERTS.batch ? now : undefined)
    return sends
  },
})

/**
 * Sender, second transaction: record each row's outcome. A 404 or 410 from the push service deletes that
 * subscription; a failure retries twice with backoff and then stops.
 */
export const recordResults = internalMutation({
  args: { results: v.array(v.object({ outboxId: v.id('alertOutbox'), delivered: v.number(), gone: v.array(v.id('pushSubscriptions')) })) },
  returns: v.null(),
  handler: async (ctx, { results }) => {
    const now = Date.now()
    for (const result of results) {
      for (const id of result.gone) {
        const device = await ctx.db.get(id)
        if (device !== null) await removeSubscription(ctx, device, 'no_devices')
      }
      const row = await ctx.db.get(result.outboxId)
      if (row === null || row.state !== 'sending') continue
      if (result.delivered > 0) await ctx.db.patch(row._id, { state: 'sent', updatedAt: now })
      else if ((await devicesOf(ctx, row.userId)).length === 0) await ctx.db.patch(row._id, { state: 'skipped', reason: 'no_devices', localDay: undefined, updatedAt: now })
      else if (row.attempts < ALERTS.maxAttempts) await ctx.db.patch(row._id, { state: 'pending', localDay: undefined, notBefore: now + ALERTS.retryMs * row.attempts, updatedAt: now })
      else await ctx.db.patch(row._id, { state: 'failed', reason: 'push_failed', localDay: undefined, updatedAt: now })
    }
    await scheduleNext(ctx, undefined)
    return null
  },
})

/** Schedule the sender for the earliest pending row, or not at all when the outbox is idle. */
async function scheduleNext(ctx: MutationCtx, at: number | undefined): Promise<void> {
  const next = await ctx.db.query('alertOutbox').withIndex('by_state_and_notBefore', (q) => q.eq('state', 'pending')).first()
  const when = at ?? next?.notBefore
  if (when !== undefined) await ensureSender(ctx, when)
}

/** Operator check (`alertsPush.sendTest`): the devices of the account with this sign-in identity. */
export const devicesForTest = internalQuery({
  args: { tokenIdentifier: v.string() },
  returns: v.array(v.object({ id: v.id('pushSubscriptions'), endpoint: v.string(), p256dh: v.string(), auth: v.string() })),
  handler: async (ctx, { tokenIdentifier }) => {
    const user = await ctx.db.query('users').withIndex('by_tokenIdentifier', (q) => q.eq('tokenIdentifier', tokenIdentifier)).unique()
    if (user === null) return []
    return (await devicesOf(ctx, user._id)).map((device) => ({ id: device._id, endpoint: device.endpoint, p256dh: device.p256dh, auth: device.auth }))
  },
})

/**
 * Deleting one game's progress (D115): that game's outbox rows and switches go. Devices and quiet hours stay while the
 * other game still has a character to alert about; otherwise everything goes, as D114 removed it with Desk Crawler.
 * Returns how many rows went.
 */
export async function purgeGameAlertRows(ctx: MutationCtx, userId: Id<'users'>, game: GameSlug, batch: number): Promise<number> {
  const owner = await ctx.db.get(userId)
  // Another game still has a character to alert about (D159: three games).
  const otherGame =
    owner === null
      ? false
      : (game !== 'desk-crawler' && (await currentHero(ctx, owner)) !== null) || (game !== 'idle-angler' && (await currentAngler(ctx, owner)) !== null) || (game !== 'paper-lives' && (await currentLife(ctx, owner)) !== null)
  if (!otherGame) return await purgeAlertRows(ctx, userId, batch)
  const kinds: readonly AlertKind[] = game === 'idle-angler' ? IDLE_ANGLER_KINDS : game === 'paper-lives' ? PAPER_LIVES_KINDS : DESK_CRAWLER_KINDS
  const rows = (await ctx.db.query('alertOutbox').withIndex('by_userId_and_localDay', (q) => q.eq('userId', userId)).take(batch * 4)).filter((row) => kinds.includes(row.kind)).slice(0, batch)
  for (const row of rows) await ctx.db.delete(row._id)
  if (rows.length === 0) {
    const user = await ctx.db.get(userId)
    if (user?.alerts !== undefined && kinds.some((kind) => user.alerts![PREF_FOR[kind]] === true)) await ctx.db.patch(userId, { alerts: { ...user.alerts, ...Object.fromEntries(kinds.map((kind) => [PREF_FOR[kind], false])) } })
  }
  return rows.length
}

/** Deletion (D22): every alert row of the account, in bounded batches. Returns how many rows went. */
export async function purgeAlertRows(ctx: MutationCtx, userId: Id<'users'>, batch: number): Promise<number> {
  const outbox = await ctx.db.query('alertOutbox').withIndex('by_userId_and_localDay', (q) => q.eq('userId', userId)).take(batch)
  const devices = await ctx.db.query('pushSubscriptions').withIndex('by_userId', (q) => q.eq('userId', userId)).take(batch)
  for (const row of [...outbox, ...devices]) await ctx.db.delete(row._id)
  if (outbox.length + devices.length === 0) {
    const user = await ctx.db.get(userId)
    if (user?.alerts !== undefined) await ctx.db.patch(userId, { alerts: undefined })
  }
  return outbox.length + devices.length
}
