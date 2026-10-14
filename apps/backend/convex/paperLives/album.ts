import { v } from 'convex/values'
import { contentV1 } from '@trmnl-games/paper-lives/content'
import { stageFor } from '@trmnl-games/paper-lives/sim'
import { portraitKey } from '@trmnl-games/paper-lives/art/route'
import { generationLabel } from '@trmnl-games/paper-lives/payload'
import type { Doc } from '../_generated/dataModel'
import { query, type QueryCtx } from '../_generated/server'
import { weekEndsAt, weekKey } from '../idleAngler/records'
import { adminRef } from '../lib/adminAccess'
import { currentUser } from '../lib/intent'
import { pagePublic } from '../lib/publicPage'
import { gameStatusOf } from '../platform'
import { currentLife } from './profile'
import { BOARD_DEPTH, readBoard } from './records'
import { lifeBoard } from './validators'

/**
 * The Album (paper-lives.md "Companion"): finished lives newest first with their portraits, epitaphs and highlights; the
 * family tree as each line of descent by generation; and the Following card with each followed player's current life.
 * Bounded: at most `ALBUM_LIVES` records and the account's 20 follows.
 */
export const ALBUM_LIVES = 100

const traitName = (id: string) => contentV1.traits.find((t) => t.id === id)?.name ?? id

/** A finished life as an album card. */
export function card(record: Doc<'lifeRecords'>) {
  return {
    ordinal: record.ordinal,
    name: `${record.first} ${record.last}`,
    age: record.age,
    generation: record.generation,
    generationLabel: generationLabel(record.generation, record.last),
    epitaph: record.epitaph,
    highlights: record.highlights,
    traits: record.traits.map(traitName),
    endedAt: record.endedAt,
    portrait: portraitKey({ stage: stageFor(record.age), last: record.last, generation: record.generation, traits: [record.traits[0]!, record.traits[1]!], flags: [], status: 'ended' }),
    parentOrdinal: null as number | null,
  }
}

/**
 * The family tree: each line starts at a stranger's life and runs down through the children who carried it on, so a
 * tree is a list of lines of descent, oldest first, each life with its depth.
 */
export function familyTree(records: readonly Doc<'lifeRecords'>[]) {
  const byId = new Map(records.map((r) => [r._id, r]))
  const sorted = [...records].sort((a, b) => a.ordinal - b.ordinal)
  return sorted.map((r) => {
    let depth = 0
    for (let p = r.parentRecordId ? byId.get(r.parentRecordId) : undefined; p; p = p.parentRecordId ? byId.get(p.parentRecordId) : undefined) depth += 1
    return { ordinal: r.ordinal, name: `${r.first} ${r.last}`, age: r.age, depth, parentOrdinal: r.parentRecordId ? (byId.get(r.parentRecordId)?.ordinal ?? null) : null }
  })
}

async function following(ctx: QueryCtx, user: Doc<'users'>) {
  const follows = await ctx.db.query('follows').withIndex('by_userId_and_followedUserId', (q) => q.eq('userId', user._id)).take(20)
  const open = (await gameStatusOf(ctx, 'paper-lives')) === 'live' || (await adminRef(ctx)) !== null
  const rows = []
  for (const follow of follows) {
    const owner = await ctx.db.get(follow.followedUserId)
    if (!open || !owner || owner.state !== 'active' || owner.nameRepairRequired || owner.publicNameVersion !== follow.followedNameVersion) continue
    const life = await currentLife(ctx, owner)
    if (!life || life.activationState !== 'active' || !pagePublic(life)) continue
    const job = life.life.job ? contentV1.jobs.find((j) => j.id === life.life.job)?.name : undefined
    rows.push({ alias: owner.publicAlias, name: `${life.life.first} ${life.life.last}`, age: life.life.age, job: job ?? null, status: life.life.status })
  }
  return rows
}

export const view = query({
  args: {},
  returns: v.any(),
  handler: async (ctx) => {
    const user = await currentUser(ctx)
    const life = await currentLife(ctx, user)
    if (user === null || life === null || life.activationState !== 'active') return null
    const records = await ctx.db.query('lifeRecords').withIndex('by_userId_and_endedAt', (q) => q.eq('userId', user._id)).order('desc').take(ALBUM_LIVES)
    const byId = new Map(records.map((r) => [r._id, r]))
    return {
      alias: user.publicAlias,
      publicProfile: pagePublic(life),
      lives: records.map((r) => ({ ...card(r), parentOrdinal: r.parentRecordId ? (byId.get(r.parentRecordId)?.ordinal ?? null) : null })),
      tree: familyTree(records),
      following: await following(ctx, user),
    }
  },
})

/** The record boards: longest lives or fortunes, this week or all time, with the viewer's own row and rank. */
export const board = query({
  args: { board: v.optional(lifeBoard), period: v.optional(v.union(v.literal('week'), v.literal('all'))) },
  returns: v.any(),
  handler: async (ctx, args) => {
    const user = await currentUser(ctx)
    const which = args.board ?? 'longest'
    const period = args.period ?? 'week'
    const now = Date.now()
    const rows = await readBoard(ctx, which, period === 'all' ? 'all' : weekKey(now), user?._id ?? null, BOARD_DEPTH)
    return { board: which, period, weekEndsAt: weekEndsAt(now), ...rows }
  },
})
