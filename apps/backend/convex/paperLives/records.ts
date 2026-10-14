import type { LifeRecord } from '@trmnl-games/paper-lives/sim'
import type { Doc, Id } from '../_generated/dataModel'
import type { MutationCtx, QueryCtx } from '../_generated/server'
import { weekKey } from '../idleAngler/records'
import { pagePublic } from '../lib/publicPage'
import { foldLife } from './achievements'
import { currentLife } from './profile'

/**
 * Finished lives and the record boards (paper-lives.md "Leaderboards"): a record is written once at death, and the
 * player's best per board this week and of all time is kept beside it. Nothing scans at a tick; boards read with
 * fixed, indexed reads. The week starts on Monday in UTC, as Idle Angler's.
 */

export type Board = Doc<'plLifeBoards'>['board']
export const BOARD_DEPTH = 100

/** The record of a life with this ordinal, or null while it is living. */
export async function recordOf(ctx: QueryCtx, userId: Id<'users'>, ordinal: number): Promise<Doc<'lifeRecords'> | null> {
  return await ctx.db.query('lifeRecords').withIndex('by_userId_and_ordinal', (q) => q.eq('userId', userId).eq('ordinal', ordinal)).unique()
}

/** Write a life's record and its board rows. Idempotent: a second call for the same ordinal changes nothing. */
export async function endedLife(ctx: MutationCtx, life: Doc<'lives'>, record: LifeRecord, now: number): Promise<Id<'lifeRecords'>> {
  const existing = await recordOf(ctx, life.userId, life.ordinal)
  if (existing) return existing._id
  const parent = life.ordinal > 1 ? await recordOf(ctx, life.userId, life.ordinal - 1) : null
  const recordId = await ctx.db.insert('lifeRecords', {
    userId: life.userId,
    lifeId: life._id,
    ordinal: life.ordinal,
    ...(parent && life.life.generation > 1 ? { parentRecordId: parent._id } : {}),
    endedAt: now,
    ...JSON.parse(JSON.stringify({ ...record, traits: [...record.traits] })),
  })
  for (const [board, value] of [['longest', record.age], ['fortune', record.peakMoney]] as const) {
    for (const period of [weekKey(now), 'all']) {
      const row = { recordId, value, age: record.age, endedAt: now, earlierFirst: -now }
      const prior = await ctx.db.query('plLifeBoards').withIndex('by_userId_and_board_and_period', (q) => q.eq('userId', life.userId).eq('board', board).eq('period', period)).unique()
      if (prior === null) await ctx.db.insert('plLifeBoards', { board, period, userId: life.userId, ...row })
      else if (value > prior.value) await ctx.db.patch(prior._id, row)
    }
  }
  // The oldest life on the all-time board earns its set piece; the career takes the life once, with the record.
  const top = await ctx.db.query('plLifeBoards').withIndex('by_board_and_period_and_value', (q) => q.eq('board', 'longest').eq('period', 'all')).order('desc').first()
  await foldLife(ctx, life, top?.recordId === recordId ? ['oldest_ever'] : [])
  return recordId
}

export type BoardRow = { rank: number; name: string; life: string; value: number; age: number; own: boolean; profile: boolean }

/**
 * A board's first `limit` rows and the viewer's own row and rank within `BOARD_DEPTH`. A row whose owner is gone,
 * suspended or deleting reads "Hidden player", as the other games' boards.
 */
export async function readBoard(ctx: QueryCtx, board: Board, period: string, viewer: Id<'users'> | null, limit: number) {
  const rows = await ctx.db
    .query('plLifeBoards')
    .withIndex('by_board_and_period_and_value', (q) => q.eq('board', board).eq('period', period))
    .order('desc')
    .take(BOARD_DEPTH)
  const shown = rows.slice(0, limit)
  const owners = await Promise.all(shown.map((row) => ctx.db.get(row.userId)))
  const records = await Promise.all(shown.map((row) => ctx.db.get(row.recordId)))
  const lives = await Promise.all(owners.map((owner) => currentLife(ctx, owner ?? null)))
  const entries: BoardRow[] = shown.map((row, index) => {
    const owner = owners[index]
    const record = records[index]
    const visible = owner !== null && owner !== undefined && owner.state === 'active' && record !== null && record !== undefined
    return {
      rank: index + 1,
      name: visible ? owner.publicAlias : 'Hidden player',
      life: visible ? `${record.first} ${record.last}` : '',
      value: row.value,
      age: row.age,
      own: row.userId === viewer,
      profile: visible && pagePublic(lives[index]),
    }
  })
  const ownIndex = viewer === null ? -1 : rows.findIndex((row) => row.userId === viewer)
  const ownRow = viewer === null ? null : ownIndex >= 0 ? rows[ownIndex]! : await ctx.db.query('plLifeBoards').withIndex('by_userId_and_board_and_period', (q) => q.eq('userId', viewer).eq('board', board).eq('period', period)).unique()
  return { entries, own: ownRow ? { rank: ownIndex >= 0 ? ownIndex + 1 : null, value: ownRow.value, age: ownRow.age } : null, full: rows.length === BOARD_DEPTH }
}
