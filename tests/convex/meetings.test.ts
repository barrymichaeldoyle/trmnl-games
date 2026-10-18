// @vitest-environment edge-runtime
import { convexTest } from 'convex-test'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { api, internal } from '@trmnl-games/backend/api'
import type { Id } from '@trmnl-games/backend/data-model'
import schema from '../../apps/backend/convex/schema'
import { contentV20 } from '@trmnl-games/desk-crawler/content/v20'
import type { MeetingRule, RaidRule } from '@trmnl-games/desk-crawler/sim/core/types'
import { SLOT_MS } from '../../apps/backend/convex/sim/runs/tick'
import { runTick, seedHero, seedWorld, type T } from './helpers'

const modules = import.meta.glob('../../apps/backend/convex/**/*.ts')
const SLOT = Date.UTC(2026, 9, 14, 10, 0, 2)
const meetingRules = contentV20.meetings!
const raidRules = contentV20.raids!
/** Every exploring tick tries to meet and none raids, so a test needs no seed search. */
const alwaysMeet: MeetingRule = { ...meetingRules, launchPermille: 1000 }
const neverRaid: RaidRule = { ...raidRules, launchPermille: { cautious: 0, balanced: 0, bold: 0 } }
const setRules = (meetings: MeetingRule, raids: RaidRule) => {
  ;(contentV20 as { meetings?: MeetingRule }).meetings = meetings
  ;(contentV20 as { raids?: RaidRule }).raids = raids
}

const all = (t: T) =>
  t.run(async (ctx) => ({
    meetings: await ctx.db.query('meetings').collect(),
    pool: await ctx.db.query('raidPool').collect(),
    heroes: await ctx.db.query('heroes').collect(),
  }))

async function tickAt(t: T, slot: number) {
  vi.setSystemTime(SLOT + slot * SLOT_MS)
  return await runTick(t)
}

const ready = { level: 5, hp: 60, gold: 400 }

describe('meetings backend (D141 M2)', () => {
  let t: T
  beforeEach(async () => {
    vi.useFakeTimers()
    vi.setSystemTime(SLOT)
    t = convexTest(schema, modules)
    setRules(alwaysMeet, neverRaid)
  })
  afterEach(() => {
    setRules(meetingRules, raidRules)
    vi.useRealTimers()
  })

  it('stays out of meetings under v19: no ledger, and pool rows carry no floor', async () => {
    await seedWorld(t, { activeContentVersion: 'v19', currentTick: 10, lastPublishedAt: SLOT - 30 * 60_000 })
    for (const alias of ['Ana', 'Bo']) await seedHero(t, ready, alias)
    for (let slot = 0; slot <= 2; slot += 1) await tickAt(t, slot)
    const state = await all(t)
    expect(state.meetings).toEqual([])
    expect(state.pool.every((row) => row.biomeId === undefined)).toBe(true)
  })

  it('meets heroes on the same floor, applies each meeting once on the partner side and respects the cooldown', async () => {
    await seedWorld(t, { activeContentVersion: 'v20', currentTick: 10, lastPublishedAt: SLOT - 30 * 60_000 })
    for (const alias of ['Ana', 'Bo', 'Cy', 'Di']) await seedHero(t, ready, alias)
    for (let slot = 0; slot <= 5; slot += 1) await tickAt(t, slot)
    const state = await all(t)
    expect(state.pool.every((row) => row.biomeId === 'office_cubicles')).toBe(true)
    expect(state.meetings.length).toBeGreaterThan(0)
    for (const meeting of state.meetings) {
      expect(meeting.starterHeroId).not.toBe(meeting.partnerHeroId)
      expect(meeting.biomeId).toBe('office_cubicles')
      expect(contentV20.meetings!.kinds.some((kind) => kind.id === meeting.kindId)).toBe(true)
    }
    // The 48-tick cooldown: within six ticks no hero is in two meetings.
    const party = state.meetings.flatMap((meeting) => [meeting.starterHeroId, meeting.partnerHeroId])
    expect(new Set(party).size).toBe(party.length)
    const applied = state.meetings.filter((meeting) => meeting.state === 'applied')
    expect(applied.length).toBeGreaterThan(0)
    for (const hero of state.heroes) {
      const started = state.meetings.filter((meeting) => meeting.starterHeroId === hero._id).length
      const received = applied.filter((meeting) => meeting.partnerHeroId === hero._id).length
      expect(hero.counters.meetings ?? 0).toBe(started + received)
      if (started + received > 0) expect(hero.effects?.length).toBeGreaterThan(0)
    }
    const logs = await t.run(async (ctx) => (await ctx.db.query('tickLogs').collect()).filter((log) => log.source === 'tick' && log.detail && 'outcome' in log.detail && log.detail.outcome.variant === 'meeting'))
    expect(logs.length).toBe(state.meetings.length + applied.length)
    for (const log of logs) {
      expect(log.kind).toBe('meeting')
      expect(log.detail).toMatchObject({ outcome: { rivalUserId: expect.any(String), rivalNameVersion: 1 } })
      // A potion drunk in sustain can heal; the meeting itself moves no gold or XP.
      expect(log.deltas).toMatchObject({ xpEarned: 0, gold: 0 })
    }
  })

  it('never meets a hero on another floor', async () => {
    await seedWorld(t, { activeContentVersion: 'v20', currentTick: 10, lastPublishedAt: SLOT - 30 * 60_000 })
    await seedHero(t, ready, 'Ana')
    await seedHero(t, { ...ready, level: 8, biomeId: 'server_room' }, 'Bo')
    for (let slot = 0; slot <= 3; slot += 1) await tickAt(t, slot)
    expect((await all(t)).meetings).toEqual([])
  })

  it('commits nothing twice when a stale or duplicate batch worker replays a run', async () => {
    await seedWorld(t, { activeContentVersion: 'v20', currentTick: 10, lastPublishedAt: SLOT - 30 * 60_000 })
    for (const alias of ['Ana', 'Bo', 'Cy']) await seedHero(t, ready, alias)
    await tickAt(t, 0)
    const runId = await tickAt(t, 1)
    const before = await all(t)
    await t.mutation(internal.sim.runs.tick.simulateBatch, { runId: runId!, expectedSequence: 0 })
    await t.finishAllScheduledFunctions(vi.runAllTimers)
    const after = await all(t)
    expect(after.meetings).toEqual(before.meetings)
    expect(after.heroes.map((hero) => hero.counters)).toEqual(before.heroes.map((hero) => hero.counters))
  })

  it('lists the last meetings with masked names, and nothing without a hero', async () => {
    await seedWorld(t, { activeContentVersion: 'v20', currentTick: 10, lastPublishedAt: SLOT - 30 * 60_000 })
    for (const alias of ['Ana', 'Bo']) await seedHero(t, ready, alias)
    for (let slot = 0; slot <= 2; slot += 1) await tickAt(t, slot)
    const ana = t.withIdentity({ issuer: 'issuer', subject: 'Ana' })
    const view = (await ana.query(api.meetings.recent, {}))!
    expect(view.meetings).toHaveLength(1)
    expect(view.meetings[0]).toMatchObject({ rivalName: 'Bo', rivalClass: 'warrior', biomeId: 'office_cubicles' })
    expect(view.total).toBe(1)
    await t.run(async (ctx) => {
      const bo = await ctx.db.query('users').withIndex('by_normalizedAlias', (q) => q.eq('normalizedAlias', 'bo')).unique()
      await ctx.db.patch(bo!._id, { publicAlias: 'Robert', normalizedAlias: 'robert', publicNameVersion: 2 })
    })
    expect((await ana.query(api.meetings.recent, {}))!.meetings[0]!.rivalName).toBe('Hidden player')
    const page = (await ana.query(api.heroes.recentLog, { heroId: (await ana.query(api.heroes.mine, {}))!.id, paginationOpts: { numItems: 40, cursor: null } })).page as Array<{ kind: string; summary: string }>
    const lines = page.filter((entry) => entry.kind === 'meeting')
    expect(lines).toHaveLength(1)
    expect(lines[0]!.summary).toContain('[[Hidden player]]')
    expect(await t.withIdentity({ issuer: 'issuer', subject: 'Nobody' }).query(api.meetings.recent, {})).toBeNull()
  })

  it('removes every meeting row the hero is party to with game deletion, and retention keeps pending rows', async () => {
    await seedWorld(t, { activeContentVersion: 'v20', currentTick: 10, lastPublishedAt: SLOT - 30 * 60_000 })
    const ana = await seedHero(t, ready, 'Ana')
    for (const alias of ['Bo', 'Cy']) await seedHero(t, ready, alias)
    for (let slot = 0; slot <= 3; slot += 1) await tickAt(t, slot)
    const before = await all(t)
    const party = before.meetings.filter((meeting) => meeting.starterHeroId === ana || meeting.partnerHeroId === ana)
    expect(party.length).toBeGreaterThan(0)
    await t.withIdentity({ issuer: 'issuer', subject: 'Ana' }).mutation(api.deletion.requestGameDeletion, { operationId: 'game-delete-meetings', confirm: 'DELETE' })
    await t.finishAllScheduledFunctions(vi.runAllTimers)
    const after = await all(t)
    expect(after.meetings.some((meeting) => meeting.starterHeroId === ana || meeting.partnerHeroId === ana)).toBe(false)
    expect(after.meetings.length).toBe(before.meetings.length - party.length)
  })

  it('retention removes applied meetings after 30 days and keeps pending ones', async () => {
    await seedWorld(t, { activeContentVersion: 'v20', currentTick: 4000, lastPublishedAt: SLOT - 30 * 60_000 })
    const ana = await seedHero(t, {}, 'Ana')
    const bo = await seedHero(t, {}, 'Bo')
    await t.run(async (ctx) => {
      const [a, b] = [(await ctx.db.get(ana))!, (await ctx.db.get(bo))!]
      const row = { starterHeroId: ana as Id<'heroes'>, starterUserId: a.userId, starterName: 'Ana', starterNameVersion: 1, starterClass: 'warrior' as const, partnerHeroId: bo as Id<'heroes'>, partnerUserId: b.userId, partnerName: 'Bo', partnerNameVersion: 1, partnerClass: 'warrior' as const, kindId: 'coffee_run', biomeId: 'office_cubicles' }
      await ctx.db.insert('meetings', { ...row, tick: 10, state: 'applied', appliedTick: 11 })
      await ctx.db.insert('meetings', { ...row, tick: 20, state: 'pending' })
      await ctx.db.insert('meetings', { ...row, tick: 3990, state: 'applied', appliedTick: 3991 })
    })
    await t.mutation(internal.maintenance.cleanup, { job: 'meetings' })
    await t.finishAllScheduledFunctions(vi.runAllTimers)
    expect((await all(t)).meetings.map((meeting) => [meeting.tick, meeting.state])).toEqual([[20, 'pending'], [3990, 'applied']])
  })
})
