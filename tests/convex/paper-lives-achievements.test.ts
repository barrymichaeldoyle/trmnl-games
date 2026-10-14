// @vitest-environment edge-runtime
import { convexTest } from 'convex-test'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { api } from '@trmnl-games/backend/api'
import schema from '../../apps/backend/convex/schema'
import type { T } from './helpers'
import { lifeOf, nextPaperLivesTick, seedLife } from './paperLivesHelpers'

const modules = import.meta.glob('../../apps/backend/convex/**/*.ts')

describe('Paper Lives achievements on the backend (D159, L5)', () => {
  let t: T
  beforeEach(() => {
    vi.useFakeTimers()
    vi.setSystemTime(Date.UTC(2026, 10, 2, 6, 10, 3))
    t = convexTest(schema, modules)
  })
  afterEach(() => vi.useRealTimers())

  it('folds a finished life into the career once, awards what it earned, and tallies rarity on the hourly set', async () => {
    const lifeId = await seedLife(t, { age: 100, stage: 'senior', stats: { health: 0, happiness: 60, smarts: 50, charm: 50 }, jobYears: { nurse: 25 }, counters: { yearsLived: 94, decisionsChosen: 3, decisionsDefaulted: 12, remarkableEvents: 1, jobsHeld: 1, marriages: 1, childrenRaised: 0, grandchildren: 0, housesOwned: 0, petsKept: 0, hobbiesTaken: 0, peakMoney: 40_000 } }, 'Ana')
    for (let i = 0; i < 400 && (await lifeOf(t, lifeId)).life.status !== 'ended'; i += 1) await nextPaperLivesTick(t)
    for (let i = 0; i < 4; i += 1) await nextPaperLivesTick(t)
    const state = await t.run(async (ctx) => ({
      profile: await ctx.db.query('paperLivesProfiles').first(),
      rows: await ctx.db.query('plAchievements').collect(),
      stats: await ctx.db.query('plAchievementStats').collect(),
    }))
    expect(state.profile?.career).toMatchObject({ livesEnded: 1, jobs: ['nurse'], longJobs: ['nurse'] })
    expect(state.profile!.career!.setPieces).toContain('oldest_ever')
    const ids = state.rows.map((r) => r.achievementId)
    expect(new Set(ids).size).toBe(ids.length)
    expect(ids).toEqual(expect.arrayContaining(['lives_1', 'long_life_4', 'job_nurse', 'job_nurse_20', 'piece_oldest_ever', 'let_it_be_1', 'remarkable_1', 'vows_1']))
    expect(state.stats.length).toBeGreaterThan(0)
    expect(state.stats.at(-1)!.counts.lives_1).toBe(1)
    const mine = await t.withIdentity({ issuer: 'issuer', subject: 'Ana' }).query(api.paperLives.achievements.mine, {})
    expect(mine.earnedCount).toBe(ids.length)
    expect(mine.families.find((f: { family: string }) => f.family === 'lives')).toMatchObject({ earned: { id: 'lives_1' }, value: 1, target: 3 })
    // Beginning the next life does not count the finished one again.
    await t.withIdentity({ issuer: 'issuer', subject: 'Ana' }).mutation(api.paperLives.lives.begin, { operationId: 'operation-begin-1', kind: 'stranger' })
    const after = await t.run(async (ctx) => (await ctx.db.query('paperLivesProfiles').first())!.career)
    expect(after?.livesEnded).toBe(1)
  }, 60_000)
})
