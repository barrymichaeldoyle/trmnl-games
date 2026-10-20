import { v } from 'convex/values'
import { mutation, query, type MutationCtx, type QueryCtx } from './_generated/server'
import type { Doc } from './_generated/dataModel'
import { currentHero } from './lib/gameProfile'
import { appError } from './lib/errors'
import { currentUser, intentReturns, runIntent } from './lib/intent'
import { ALIAS_RULE, normalizeAlias } from './lib/names'
import { pagePublic } from './lib/publicPage'
import { readWorld, worldContent } from './world'

/**
 * Following (D143, friends.md). One-way, silent follows of public hero pages, per account. A follow is never shown
 * to the followed player and changes nothing in play. Every read is bounded by `MAX_FOLLOWS`. The rival (one
 * followed player raided more and told who named them) was removed in D205: raids pick from the pool alone.
 */
export const MAX_FOLLOWS = 20

const intentResult = intentReturns({ operationId: v.string(), changed: v.boolean() })

const heroStatus = v.union(v.literal('exploring'), v.literal('resting'), v.literal('travelling'), v.literal('dead'), v.literal('paused'), v.literal('sleeping'))

const followRow = v.object({
  id: v.id('follows'),
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
  if (hero === null || hero.activationState !== 'active' || !pagePublic(hero)) return null
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
      if (target === null || target._id === user._id) throw appError('PLAYER_NOT_FOUND', 'That hero page is hidden, or there is no player by that name.')
      const all = await followsOf(ctx, user)
      const row = all.find((follow) => follow.followedUserId === target._id) ?? null
      if (row === null) {
        if (all.length >= MAX_FOLLOWS) throw appError('FOLLOW_LIMIT', `You can follow up to ${MAX_FOLLOWS} players. Unfollow someone first.`)
        await ctx.db.insert('follows', { userId: user._id, followedUserId: target._id, followedNameVersion: target.publicNameVersion, createdAt: Date.now() })
        return { changed: true }
      }
      if (row.followedNameVersion !== target.publicNameVersion) {
        // A follow from before their rename is a new acquaintance: refresh the name.
        await ctx.db.patch(row._id, { followedNameVersion: target.publicNameVersion })
        return { changed: true }
      }
      return { changed: false }
    }),
})

async function ownFollow(ctx: MutationCtx, user: Doc<'users'>, followId: Doc<'follows'>['_id']) {
  const row = await ctx.db.get(followId)
  return row !== null && row.userId === user._id ? row : null
}

/** Stop following. */
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

/** The owner's follows, newest first. */
export const list = query({
  args: {},
  returns: v.union(v.null(), v.object({ follows: v.array(followRow), limit: v.number() })),
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
    rows.sort((a, b) => b.createdAt - a.createdAt)
    const follows = await Promise.all(
      rows.map(async (row) => {
        const owner = await ctx.db.get(row.followedUserId)
        const named = owner !== null && owner.state === 'active' && !owner.nameRepairRequired && owner.publicNameVersion === row.followedNameVersion
        const hero = named ? await currentHero(ctx, owner) : null
        const base = { id: row._id }
        if (!named || hero === null || hero.activationState !== 'active') return { ...base, state: 'gone' as const, name: HIDDEN, hero: null }
        if (!pagePublic(hero)) return { ...base, state: 'private' as const, name: owner.publicAlias, hero: null }
        return {
          ...base,
          state: 'public' as const,
          name: owner.publicAlias,
          hero: { name: hero.name, heroClass: hero.class ?? 'warrior', level: hero.level, status: hero.status, biome: content.biomes.find((biome) => biome.id === hero.biomeId)?.name ?? null, rank: await rankOf(hero._id) },
        }
      }),
    )
    return { follows, limit: MAX_FOLLOWS }
  },
})

/** What a public hero page offers the viewer: nothing (signed out, own page, not followable), Follow, or Following. */
export const status = query({
  args: { alias: v.string() },
  returns: v.union(v.null(), v.object({ followId: v.union(v.null(), v.id('follows')), full: v.boolean() })),
  handler: async (ctx, { alias }) => {
    const user = await currentUser(ctx)
    if (user === null || user.state !== 'active' || (await currentHero(ctx, user)) === null) return null
    const target = await followable(ctx, alias)
    if (target === null || target._id === user._id) return null
    const row = await findFollow(ctx, user, target._id)
    const current = row !== null && row.followedNameVersion === target.publicNameVersion
    return { followId: current ? row._id : null, full: !current && (await followsOf(ctx, user)).length >= MAX_FOLLOWS }
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
