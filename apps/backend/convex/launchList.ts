import { hmac } from '@noble/hashes/hmac.js'
import { sha256 } from '@noble/hashes/sha2.js'
import { bytesToHex } from '@noble/hashes/utils.js'
import type { Locale } from '@trmnl-games/platform'
import { v } from 'convex/values'
import { internal } from './_generated/api'
import type { Id } from './_generated/dataModel'
import { internalAction, internalMutation, internalQuery, mutation, query } from './_generated/server'
import { verifiedPrimaryEmail } from './lib/deletionConfirmation'
import { appError } from './lib/errors'
import { launchEmail } from './lib/launchEmail'
import { gameSlug as gameSlugValidator, locale as localeValidator } from './schema'

/**
 * D201: a game's launch list while it waits for marketplace review. A signed-in player taps Notify me and only their
 * identity is kept; the address comes from Clerk when the one email is sent, as the hero reminder's does (D198). A
 * visitor leaves an email. Each row is deleted once Resend accepts its email; Barry starts the send after approval:
 * `npx convex run --prod launchList:sendLaunch '{"gameSlug":"idle-angler","installUrl":"https://trmnl.com/integrations/idle-angler"}'`.
 */
const JOIN_WINDOW_MS = 10 * 60_000
const JOIN_LIMIT = 300
const SEND_BATCH = 25
const SEND_ATTEMPTS = 3
const LISTED = new Set(['idle-angler'])

export function normalizeEmail(raw: string): string | null {
  const email = raw.trim().toLowerCase()
  return email.length <= 254 && /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email) ? email : null
}

const linkKey = () => process.env.EMAIL_STOP_KEY ?? process.env.ACCOUNT_DELETION_LINK_KEY ?? null

/** Unsubscribe proof for one row; still checks after the row is gone, so a late click succeeds quietly. */
export function unsubscribeToken(key: string, id: string): string {
  const encode = new TextEncoder()
  return bytesToHex(hmac(sha256, encode.encode(key), encode.encode(JSON.stringify(['launch-list-unsubscribe-v1', id]))))
}

const listed = (slug: string) => {
  if (!LISTED.has(slug)) throw appError('INVALID_INPUT', 'That game has no launch list.')
}

/** A visitor's email. The same answer for new and existing addresses, so the form never reveals who is on the list. */
export const join = mutation({
  args: { gameSlug: gameSlugValidator, email: v.string(), locale: localeValidator, website: v.optional(v.string()) },
  returns: v.null(),
  handler: async (ctx, args) => {
    listed(args.gameSlug)
    // A hidden field only bots fill in: accept quietly, store nothing.
    if (args.website) return null
    const email = normalizeEmail(args.email)
    if (!email) throw appError('INVALID_INPUT', 'Enter a valid email address.')
    const now = Date.now()
    const windowStart = Math.floor(now / JOIN_WINDOW_MS) * JOIN_WINDOW_MS
    const key = `launchList:join:${args.gameSlug}`
    const bucket = await ctx.db.query('rateLimitBuckets').withIndex('by_key_and_windowStart', (q) => q.eq('key', key).eq('windowStart', windowStart)).unique()
    if (bucket && bucket.count >= JOIN_LIMIT) throw appError('RATE_LIMITED', 'Lots of people are signing up right now. Try again in a few minutes.')
    if (bucket) await ctx.db.patch(bucket._id, { count: bucket.count + 1 })
    else await ctx.db.insert('rateLimitBuckets', { key, windowStart, count: 1, expiresAt: windowStart + 2 * JOIN_WINDOW_MS })
    const existing = await ctx.db.query('launchList').withIndex('by_gameSlug_and_email', (q) => q.eq('gameSlug', args.gameSlug).eq('email', email)).first()
    if (!existing) await ctx.db.insert('launchList', { gameSlug: args.gameSlug, email, locale: args.locale, state: 'waiting', attempts: 0, createdAt: now })
    return null
  },
})

/** Notify me, for a signed-in player: one tap, nothing typed, only the identity kept. */
export const notifyMe = mutation({
  args: { gameSlug: gameSlugValidator, locale: localeValidator },
  returns: v.null(),
  handler: async (ctx, args) => {
    listed(args.gameSlug)
    const identity = await ctx.auth.getUserIdentity()
    if (!identity) throw appError('UNAUTHENTICATED', 'Sign in to continue.')
    const existing = await ctx.db.query('launchList').withIndex('by_gameSlug_and_tokenIdentifier', (q) => q.eq('gameSlug', args.gameSlug).eq('tokenIdentifier', identity.tokenIdentifier)).first()
    if (existing) {
      if (existing.locale !== args.locale) await ctx.db.patch(existing._id, { locale: args.locale })
      return null
    }
    await ctx.db.insert('launchList', { gameSlug: args.gameSlug, tokenIdentifier: identity.tokenIdentifier, locale: args.locale, state: 'waiting', attempts: 0, createdAt: Date.now() })
    return null
  },
})

/** Whether the signed-in player is on a game's list; false when signed out. */
export const mine = query({
  args: { gameSlug: gameSlugValidator },
  returns: v.boolean(),
  handler: async (ctx, { gameSlug }) => {
    const identity = await ctx.auth.getUserIdentity()
    if (!identity) return false
    return (await ctx.db.query('launchList').withIndex('by_gameSlug_and_tokenIdentifier', (q) => q.eq('gameSlug', gameSlug).eq('tokenIdentifier', identity.tokenIdentifier)).first()) !== null
  },
})

export const leaveMine = mutation({
  args: { gameSlug: gameSlugValidator },
  returns: v.null(),
  handler: async (ctx, { gameSlug }) => {
    const identity = await ctx.auth.getUserIdentity()
    if (!identity) throw appError('UNAUTHENTICATED', 'Sign in to continue.')
    const rows = await ctx.db.query('launchList').withIndex('by_gameSlug_and_tokenIdentifier', (q) => q.eq('gameSlug', gameSlug).eq('tokenIdentifier', identity.tokenIdentifier)).take(10)
    for (const row of rows) await ctx.db.delete(row._id)
    return null
  },
})

/** The unsubscribe link's target. It needs a press on the page, so mail scanners that open links remove no one. */
export const leave = mutation({
  args: { id: v.string(), token: v.string() },
  returns: v.boolean(),
  handler: async (ctx, args) => {
    const key = linkKey()
    if (!key || !/^[a-f0-9]{64}$/.test(args.token) || unsubscribeToken(key, args.id) !== args.token) return false
    const id = ctx.db.normalizeId('launchList', args.id)
    if (id && (await ctx.db.get(id))) await ctx.db.delete(id)
    return true
  },
})

/** Operator view: `npx convex run --prod launchList:summary '{"gameSlug":"idle-angler"}'`. Counts stop at 5,000 per state. */
export const summary = internalQuery({
  args: { gameSlug: gameSlugValidator },
  returns: v.object({ waiting: v.number(), signedIn: v.number(), sending: v.number(), failed: v.number() }),
  handler: async (ctx, { gameSlug }) => {
    const rows = (state: 'waiting' | 'sending' | 'failed') => ctx.db.query('launchList').withIndex('by_gameSlug_and_state', (q) => q.eq('gameSlug', gameSlug).eq('state', state)).take(5000)
    const waiting = await rows('waiting')
    return { waiting: waiting.length, signedIn: waiting.filter((row) => row.tokenIdentifier).length, sending: (await rows('sending')).length, failed: (await rows('failed')).length }
  },
})

export const claimBatch = internalMutation({
  args: { gameSlug: gameSlugValidator },
  returns: v.array(v.object({ id: v.id('launchList'), email: v.union(v.string(), v.null()), tokenIdentifier: v.union(v.string(), v.null()), locale: localeValidator })),
  handler: async (ctx, { gameSlug }) => {
    const rows = await ctx.db.query('launchList').withIndex('by_gameSlug_and_state', (q) => q.eq('gameSlug', gameSlug).eq('state', 'waiting')).take(SEND_BATCH)
    for (const row of rows) await ctx.db.patch(row._id, { state: 'sending' })
    return rows.map((row) => ({ id: row._id, email: row.email ?? null, tokenIdentifier: row.tokenIdentifier ?? null, locale: row.locale }))
  },
})

/** A sent row is deleted (the privacy promise); a failure retries, then parks as failed; `drop` removes a row with no address. */
export const finish = internalMutation({
  args: { sent: v.array(v.id('launchList')), failed: v.array(v.id('launchList')), drop: v.array(v.id('launchList')) },
  returns: v.null(),
  handler: async (ctx, { sent, failed, drop }) => {
    for (const id of [...sent, ...drop]) if (await ctx.db.get(id)) await ctx.db.delete(id)
    for (const id of failed) {
      const row = await ctx.db.get(id)
      if (row && row.state === 'sending') await ctx.db.patch(id, { attempts: row.attempts + 1, state: row.attempts + 1 >= SEND_ATTEMPTS ? 'failed' : 'waiting' })
    }
    return null
  },
})

const REPLY_TO = 'barry@barrymichaeldoyle.com'
const sender = () => ({ origin: new URL(process.env.COMPANION_ORIGIN ?? 'https://trmnlgames.com').origin, from: process.env.WAITLIST_FROM ?? 'TRMNL Games <hello@trmnlgames.com>' })

/** The address for a row: the visitor's own, or the account's verified primary email from Clerk, fetched now. */
async function addressFor(row: { email: string | null; tokenIdentifier: string | null }): Promise<string | null> {
  if (row.email) return row.email
  const clerk = process.env.CLERK_SECRET_KEY
  if (!row.tokenIdentifier || !clerk) return null
  const subject = row.tokenIdentifier.slice(row.tokenIdentifier.indexOf('|') + 1)
  try {
    const response = await fetch(`https://api.clerk.com/v1/users/${encodeURIComponent(subject)}`, { headers: { Authorization: `Bearer ${clerk}` }, signal: AbortSignal.timeout(10_000) })
    const email = response.ok ? verifiedPrimaryEmail(await response.json())?.address : null
    return email ? normalizeEmail(email) : null
  } catch {
    return null
  }
}

function messageFor(id: string, locale: Locale, to: string, installUrl: string, key: string) {
  const { origin, from } = sender()
  const unsubscribe = new URL('/launch-list/unsubscribe', origin)
  unsubscribe.searchParams.set('id', id)
  unsubscribe.searchParams.set('token', unsubscribeToken(key, id))
  const { subject, text } = launchEmail(locale, { install: installUrl, unsubscribe: unsubscribe.toString() })
  return { from, to: [to], subject, text, reply_to: REPLY_TO, headers: { 'List-Unsubscribe': `<${unsubscribe.toString()}>` } }
}

/**
 * One copy of the launch email to `to`, subject marked [Test], touching no row:
 * `npx convex run --prod launchList:sendTest '{"to":"you@example.com","locale":"en","installUrl":"https://trmnl.com/..."}'`.
 */
export const sendTest = internalAction({
  args: { to: v.string(), locale: localeValidator, installUrl: v.string() },
  returns: v.boolean(),
  handler: async (_ctx, { to, locale, installUrl }) => {
    const resend = process.env.RESEND_API_KEY
    const key = linkKey()
    const email = normalizeEmail(to)
    if (!resend || !key || !email || !/^https:\/\//.test(installUrl)) return false
    const message = messageFor('test', locale, email, installUrl, key)
    const response = await fetch('https://api.resend.com/emails', { method: 'POST', signal: AbortSignal.timeout(20_000), headers: { Authorization: `Bearer ${resend}`, 'Content-Type': 'application/json' }, body: JSON.stringify({ ...message, subject: `[Test] ${message.subject}` }) })
    return response.ok
  },
})

/** Sends the launch email to everyone waiting, a batch at a time, rescheduling itself until the list is empty. */
export const sendLaunch = internalAction({
  args: { gameSlug: gameSlugValidator, installUrl: v.string() },
  returns: v.object({ sent: v.number(), failed: v.number(), status: v.union(v.literal('continuing'), v.literal('done'), v.literal('disabled')) }),
  handler: async (ctx, { gameSlug, installUrl }): Promise<{ sent: number; failed: number; status: 'continuing' | 'done' | 'disabled' }> => {
    const resend = process.env.RESEND_API_KEY
    const key = linkKey()
    if (!resend || !key || !/^https:\/\//.test(installUrl)) return { sent: 0, failed: 0, status: 'disabled' }
    const batch = await ctx.runMutation(internal.launchList.claimBatch, { gameSlug })
    if (batch.length === 0) return { sent: 0, failed: 0, status: 'done' }
    const sent: Id<'launchList'>[] = []
    const failed: Id<'launchList'>[] = []
    const drop: Id<'launchList'>[] = []
    for (const row of batch) {
      const to = await addressFor(row)
      // An account with no verified email has nothing to send to; its row goes, as a sent one would.
      if (!to) { drop.push(row.id); continue }
      try {
        const response = await fetch('https://api.resend.com/emails', {
          method: 'POST',
          signal: AbortSignal.timeout(20_000),
          headers: { Authorization: `Bearer ${resend}`, 'Content-Type': 'application/json', 'Idempotency-Key': `launch-list/${row.id}` },
          body: JSON.stringify(messageFor(row.id, row.locale, to, installUrl, key)),
        })
        if (response.ok) sent.push(row.id)
        else failed.push(row.id)
      } catch {
        failed.push(row.id)
      }
    }
    await ctx.runMutation(internal.launchList.finish, { sent, failed, drop })
    await ctx.scheduler.runAfter(failed.length ? 60_000 : 1_000, internal.launchList.sendLaunch, { gameSlug, installUrl })
    return { sent: sent.length, failed: failed.length, status: 'continuing' }
  },
})
