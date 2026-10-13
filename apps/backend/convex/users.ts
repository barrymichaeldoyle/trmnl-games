import { currentHero, gameProfile } from './lib/gameProfile'
import { heroStatus } from './schema'
import { v } from 'convex/values'
import { mutation, query } from './_generated/server'
import { currentUser, runIntent } from './lib/intent'
import { ALIAS_RULE, HERO_NAME_RULE, normalizeAlias, validateName, validateTimezone } from './lib/names'
import { appError } from './lib/errors'
import { identityHash } from './deletion'
import { aliasTaken } from './lib/aliases'

/** D142: a player can change their public name once every 7 days, and the old one is kept from others as long. */
export const PUBLIC_NAME_GAP_MS = 7 * 24 * 60 * 60 * 1000

/**
 * The signed-in owner's profile, or null when signed out. `signedIn` with a
 * null `user` means authenticated but not yet onboarded.
 */
export const me = query({
  args: {},
  returns: v.union(
    v.null(),
    v.object({
      signedIn: v.literal(true),
      gameState: v.union(v.literal('active'), v.literal('deleting'), v.null()),
      hasActiveInstallation: v.boolean(),
      user: v.union(
        v.null(),
        v.object({ publicAlias: v.string(), timezone: v.string(), state: v.string(), nameRepairRequired: v.boolean(), analyticsConsent: v.boolean(), publicNameChangeAt: v.union(v.number(), v.null()) }),
      ),
      hero: v.union(
        v.null(),
        v.object({ name: v.string(), activationState: v.union(v.literal('pending_trmnl'), v.literal('active')), status: heroStatus }),
      ),
    }),
  ),
  handler: async (ctx) => {
    const identity = await ctx.auth.getUserIdentity()
    if (identity === null) return null
    const user = await ctx.db
      .query('users')
      .withIndex('by_tokenIdentifier', (q) => q.eq('tokenIdentifier', identity.tokenIdentifier))
      .unique()
    if (user === null && await ctx.db.query('revokedAuthIdentities').withIndex('by_identityHash', (q) => q.eq('identityHash', identityHash(identity.tokenIdentifier))).first()) return null
    const hero = await currentHero(ctx, user)
    const installation = user?.state === 'active' ? await ctx.db.query('trmnlInstances').withIndex('by_userId_and_state', (q) => q.eq('userId', user._id).eq('state', 'active')).first() : null
    return {
      signedIn: true as const,
      hasActiveInstallation: installation !== null,
      gameState: user ? (await gameProfile(ctx, user._id))?.state ?? (hero ? 'active' as const : null) : null,
      user: user === null ? null : { publicAlias: user.publicAlias, timezone: user.timezone, state: user.state, nameRepairRequired: user.nameRepairRequired ?? false, analyticsConsent: user.analyticsConsent ?? false, publicNameChangeAt: user.publicNameChangedAt === undefined ? null : user.publicNameChangedAt + PUBLIC_NAME_GAP_MS },
      hero: hero === null ? null : { name: hero.name, activationState: hero.activationState, status: hero.status },
    }
  },
})

/** Browser preference authorizes server-side activation telemetry for this owner. */
export const setAnalyticsConsent = mutation({
  args: { allowed: v.boolean() },
  returns: v.null(),
  handler: async (ctx, { allowed }) => {
    const user = await currentUser(ctx)
    if (user?.state === 'active' && user.analyticsConsent !== allowed) await ctx.db.patch(user._id, { analyticsConsent: allowed })
    return null
  },
})

/** Formatting-only setting (api.md); never affects deadlines or rewards. */
export const setTimezone = mutation({
  args: { operationId: v.string(), timezone: v.string() },
  returns: v.object({ operationId: v.string(), changed: v.boolean() }),
  handler: async (ctx, args) => {
    const result = await runIntent(ctx, args.operationId, 'users.setTimezone', { timezone: args.timezone }, async (user) => {
      const timezone = validateTimezone(args.timezone)
      if (timezone === user.timezone) return { changed: false }
      await ctx.db.patch(user._id, { timezone })
      return { changed: true }
    })
    return { operationId: result.operationId, changed: result.changed }
  },
})

/** Restricted owner replacement after an admin name repair (D23); not an ordinary rename. */
export const replacePublicNames = mutation({
  args: { operationId: v.string(), publicAlias: v.string(), heroName: v.string() },
  returns: v.object({ operationId: v.string(), changed: v.boolean() }),
  handler: async (ctx, args) => {
    const result = await runIntent(ctx, args.operationId, 'users.replacePublicNames', { publicAlias: args.publicAlias, heroName: args.heroName }, async (user) => {
      if (!user.nameRepairRequired) throw appError('INVALID_STATE', 'No name change is required.')
      const alias = validateName(args.publicAlias, ALIAS_RULE)
      if (!alias.ok) throw appError('INVALID_INPUT', `Public name: ${alias.reason}`)
      const heroName = validateName(args.heroName, HERO_NAME_RULE)
      if (!heroName.ok) throw appError('INVALID_INPUT', `Hero name: ${heroName.reason}`)
      const normalizedAlias = normalizeAlias(alias.value)
      if (await aliasTaken(ctx, normalizedAlias, Date.now(), user._id)) throw appError('ALIAS_TAKEN', 'That public name is taken. Try another.')
      await ctx.db.patch(user._id, { publicAlias: alias.value, normalizedAlias, publicNameVersion: user.publicNameVersion + 1, nameRepairRequired: false })
      const hero = await currentHero(ctx, user)
      if (hero) await ctx.db.patch(hero._id, { name: heroName.value })
      return { changed: true }
    })
    return { operationId: result.operationId, changed: result.changed }
  },
})

/**
 * D142: the owner changes their public name, the one name shared by every game, for free once every 7 days. The
 * name version moves on, so other players' raid and meeting lines read "Hidden player" as for any rename, and the old
 * name stays off-limits to other players for 7 days so a shared profile link cannot be picked up straight away.
 */
export const changePublicName = mutation({
  args: { operationId: v.string(), publicAlias: v.string() },
  returns: v.object({ operationId: v.string(), changed: v.boolean() }),
  handler: async (ctx, args) => {
    const result = await runIntent(ctx, args.operationId, 'users.changePublicName', { publicAlias: args.publicAlias }, async (user) => {
      if (user.nameRepairRequired) throw appError('INVALID_STATE', 'Choose new names from the name change notice first.')
      const now = Date.now()
      if (user.publicNameChangedAt !== undefined && now < user.publicNameChangedAt + PUBLIC_NAME_GAP_MS) throw appError('NAME_CHANGE_LIMIT', 'You can change your public name once every 7 days.')
      const alias = validateName(args.publicAlias, ALIAS_RULE)
      if (!alias.ok) throw appError('INVALID_INPUT', `Public name: ${alias.reason}`)
      const normalizedAlias = normalizeAlias(alias.value)
      if (alias.value === user.publicAlias) return { changed: false }
      if (await aliasTaken(ctx, normalizedAlias, now, user._id)) throw appError('ALIAS_TAKEN', 'That public name is taken. Try another.')
      // A change of letter case only keeps the same name, so nothing is held back for it.
      const held = normalizedAlias === user.normalizedAlias ? user.heldAlias : { normalized: user.normalizedAlias, until: now + PUBLIC_NAME_GAP_MS }
      await ctx.db.patch(user._id, { publicAlias: alias.value, normalizedAlias, publicNameVersion: user.publicNameVersion + 1, publicNameChangedAt: now, heldAlias: held })
      return { changed: true }
    })
    return { operationId: result.operationId, changed: result.changed }
  },
})
