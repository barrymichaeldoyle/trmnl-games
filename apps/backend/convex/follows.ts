import { v } from 'convex/values'
import { mutation, query, type MutationCtx, type QueryCtx } from './_generated/server'
import type { Doc } from './_generated/dataModel'
import { currentHero } from './lib/gameProfile'
import { appError } from './lib/errors'
import { currentUser, runIntent } from './lib/intent'
import { ALIAS_RULE, normalizeAlias } from './lib/names'
import { readWorld, worldContent } from './world'

/**
 * Friends and rivals (D143, friends.md). One-way, silent follows of public hero pages, per account, with one rival
 * among them. Nothing here affects play, and nothing returns who follows a given player. Every read is bounded by
 * `MAX_FOLLOWS`.
 */
export const MAX_FOLLOWS = 20

const intentResult = v.object({ operationId: v.string(), changed: v.boolean() })

const heroStatus = v.union(v.literal('exploring'), v.literal('resting'), v.literal('travelling'), v.literal('dead'), v.literal('paused'), v.literal('sleeping'))

const followRow = v.object({
  id: v.id('follows'),
  rival: v.boolean(),
  /** `public`: the page is on; `private`: same player and name, page off; `gone`: renamed, suspended or no hero. */
  state: v.union(v.literal('public'), v.literal('private'), v.literal('gone')),
  /** The public name, except for `gone`, where it is masked like a rank row. */
  name: v.string(),
  hero: v.union(
    v.null(),
    v.object({ name: v.string(), heroClass: v.union(v.literal('warrior'), v.literal('rogue')), level: v.number(), status: heroStatus, biome: v.union(v.null(), v.string()), rank: v.union(v.null(), v.number()) }),
  ),
})

const HIDDEN = 'Hidden player'

/** The followable player behind a public name: the same checks as `profiles.view`, so both fail the same way. */
async function followable(ctx: QueryCtx, alias: string) {
  const normalized = normalizeAlias(alias)
  if (normalized.length < ALIAS_RULE.min || normalized.length > ALIAS_RULE.max) return null
  const user = await ctx.db.query('users').withIndex('by_normalizedAlias', (q) => q.eq('normalizedAlias', normalized)).first()
  if (user === null || user.state !== 'active' || user.nameRepairRequired) return null
  const hero = await currentHero(ctx, user)
  if (hero === null || hero.activationState !== 'active' || hero.publicProfile !== true) return null
  return user
}

const followsOf = (ctx: QueryCtx, user: Doc<'users'>) => ctx.db.query('follows').withIndex('by_userId_and_followedUserId', (q) => q.eq('userId', user._id)).take(MAX_FOLLOWS + 1)

const findFollow = (ctx: QueryCtx, user: Doc<'users'>, followedUserId: Doc<'users'>['_id']) =>
  ctx.db.query('follows').withIndex('by_userId_and_followedUserId', (q) => q.eq('userId', user._id).eq('followedUserId', followedUserId)).unique()

/** Follow the player behind a public hero page. Following again after their rename refreshes the stored name version. */
export const follow = mutation({
  args: { operationId: v.string(), alias: v.string() },
  returns: intentResult,
  handler: async (ctx, args) =>
    await runIntent(ctx, args.operationId, 'follows.follow', { alias: normalizeAlias(args.alias) }, async (user) => {
      const target = await followable(ctx, args.alias)
      if (target === null || target._id === user._id) throw appError('PLAYER_NOT_FOUND', 'That hero page is private, or there is no player by that name.')
      const existing = await findFollow(ctx, user, target._id)
      if (existing !== null) {
        if (existing.followedNameVersion === target.publicNameVersion) return { changed: false }
        await ctx.db.patch(existing._id, { followedNameVersion: target.publicNameVersion })
        return { changed: true }
      }
      if ((await followsOf(ctx, user)).length >= MAX_FOLLOWS) throw appError('FOLLOW_LIMIT', `You can follow up to ${MAX_FOLLOWS} players. Unfollow someone first.`)
      await ctx.db.insert('follows', { userId: user._id, followedUserId: target._id, followedNameVersion: target.publicNameVersion, createdAt: Date.now() })
      return { changed: true }
    }),
})

async function ownFollow(ctx: MutationCtx, user: Doc<'users'>, followId: Doc<'follows'>['_id']) {
  const row = await ctx.db.get(followId)
  return row !== null && row.userId === user._id ? row : null
}

/** Stop following; unfollowing the rival clears the rival with it. */
export const unfollow = mutation({
  args: { operationId: v.string(), followId: v.id('follows') },
  returns: intentResult,
  handler: async (ctx, args) =>
    await runIntent(ctx, args.operationId, 'follows.unfollow', { followId: args.followId }, async (user) => {
      const row = await ownFollow(ctx, user, args.followId)
      if (row === null) return { changed: false }
      await ctx.db.delete(row._id)
      return { changed: true }
    }),
})

/** Mark one followed player as the rival, or clear it with null. At most one rival per account. */
export const setRival = mutation({
  args: { operationId: v.string(), followId: v.union(v.null(), v.id('follows')) },
  returns: intentResult,
  handler: async (ctx, args) =>
    await runIntent(ctx, args.operationId, 'follows.setRival', { followId: args.followId }, async (user) => {
      const target = args.followId === null ? null : await ownFollow(ctx, user, args.followId)
      if (args.followId !== null && target === null) throw appError('PLAYER_NOT_FOUND', 'You no longer follow that player.')
      let changed = false
      for (const row of await followsOf(ctx, user)) {
        if (row.rival && row._id !== target?._id) {
          await ctx.db.patch(row._id, { rival: undefined })
          changed = true
        }
      }
      if (target !== null && !target.rival) {
        await ctx.db.patch(target._id, { rival: true })
        changed = true
      }
      return { changed }
    }),
})

/** The owner's follows, rival first then newest, and the owner's own level and rank for the rival's head-to-head. */
export const list = query({
  args: {},
  returns: v.union(v.null(), v.object({ follows: v.array(followRow), limit: v.number(), own: v.object({ level: v.number(), rank: v.union(v.null(), v.number()) }) })),
  handler: async (ctx) => {
    const user = await currentUser(ctx)
    const own = await currentHero(ctx, user)
    if (user === null || own === null) return null
    const world = await readWorld(ctx)
    const content = worldContent(world)
    const publication = world?.publishedPublicationId ? await ctx.db.get(world.publishedPublicationId) : null
    const published = publication !== null && publication.state === 'published' ? publication : null
    const rankOf = async (heroId: Doc<'heroes'>['_id']) =>
      published
        ? ((await ctx.db.query('heroRanks').withIndex('by_publicationId_and_board_and_heroId', (q) => q.eq('publicationId', published._id).eq('board', 'overall').eq('heroId', heroId)).unique())?.rank ?? null)
        : null
    const rows = (await followsOf(ctx, user)).slice(0, MAX_FOLLOWS)
    rows.sort((a, b) => Number(b.rival ?? false) - Number(a.rival ?? false) || b.createdAt - a.createdAt)
    const follows = await Promise.all(
      rows.map(async (row) => {
        const owner = await ctx.db.get(row.followedUserId)
        const named = owner !== null && owner.state === 'active' && !owner.nameRepairRequired && owner.publicNameVersion === row.followedNameVersion
        const hero = named ? await currentHero(ctx, owner) : null
        const base = { id: row._id, rival: row.rival === true }
        if (!named || hero === null || hero.activationState !== 'active') return { ...base, state: 'gone' as const, name: HIDDEN, hero: null }
        if (hero.publicProfile !== true) return { ...base, state: 'private' as const, name: owner.publicAlias, hero: null }
        return {
          ...base,
          state: 'public' as const,
          name: owner.publicAlias,
          hero: { name: hero.name, heroClass: hero.class ?? 'warrior', level: hero.level, status: hero.status, biome: content.biomes.find((biome) => biome.id === hero.biomeId)?.name ?? null, rank: await rankOf(hero._id) },
        }
      }),
    )
    return { follows, limit: MAX_FOLLOWS, own: { level: own.level, rank: await rankOf(own._id) } }
  },
})

/** What a public hero page offers the viewer: nothing (signed out, own page, not followable), Follow, or Following. */
export const status = query({
  args: { alias: v.string() },
  returns: v.union(v.null(), v.object({ followId: v.union(v.null(), v.id('follows')), rival: v.boolean(), full: v.boolean() })),
  handler: async (ctx, { alias }) => {
    const user = await currentUser(ctx)
    if (user === null || user.state !== 'active' || (await currentHero(ctx, user)) === null) return null
    const target = await followable(ctx, alias)
    if (target === null || target._id === user._id) return null
    const row = await findFollow(ctx, user, target._id)
    const current = row !== null && row.followedNameVersion === target.publicNameVersion
    return { followId: current ? row._id : null, rival: current && row.rival === true, full: !current && (await followsOf(ctx, user)).length >= MAX_FOLLOWS }
  },
})

/** Deletion (D143): the player's own follows and every follow pointing at them, one batch per call. */
export async function purgeFollowRows(ctx: MutationCtx, userId: Doc<'users'>['_id'], batch: number): Promise<number> {
  const own = await ctx.db.query('follows').withIndex('by_userId_and_followedUserId', (q) => q.eq('userId', userId)).take(batch)
  const pointing = await ctx.db.query('follows').withIndex('by_followedUserId', (q) => q.eq('followedUserId', userId)).take(batch)
  const seen = new Set<string>()
  for (const row of [...own, ...pointing]) {
    if (seen.has(row._id)) continue
    seen.add(row._id)
    await ctx.db.delete(row._id)
  }
  return seen.size
}
