// @vitest-environment edge-runtime
import { convexTest } from 'convex-test'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { internal } from '@trmnl-games/backend/api'
import schema from '../../apps/backend/convex/schema'
import { sha256Hex } from '../../apps/backend/convex/lib/hash'
import { seedWorld, type T } from './helpers'
import { lifeOf, nextPaperLivesTick, runPaperLivesTick, seedLife } from './paperLivesHelpers'

const modules = import.meta.glob('../../apps/backend/convex/**/*.ts')
const UUID_A = 'aaaaaaaa-1111-4aed-8464-bad68368e97c'

const link = (t: T, alias: string, token: string) =>
  t.mutation(internal.trmnl.linkInstall, { gameSlug: 'paper-lives', tokenIdentifier: `issuer|${alias}`, tokenHash: sha256Hex(token), publicAlias: alias, timezone: 'UTC' })
const confirm = (t: T, token: string, uuid: string) => t.mutation(internal.trmnl.confirmInstance, { gameSlug: 'paper-lives', tokenHash: sha256Hex(token), uuid, confirmedBy: 'success_callback' })

describe('Paper Lives tick on the shared engine (D159, L2)', () => {
  let t: T
  beforeEach(() => {
    vi.useFakeTimers()
    // 06:10 UTC: a Paper Lives slot.
    vi.setSystemTime(Date.UTC(2026, 10, 2, 6, 10, 3))
    t = convexTest(schema, modules)
  })
  afterEach(() => vi.useRealTimers())

  it('ticks on its own ten-past slots and runs an empty world cleanly', async () => {
    const runId = await runPaperLivesTick(t)
    const run = await t.run(async (ctx) => await ctx.db.get(runId!))
    expect(run).toMatchObject({ tick: 1, state: 'completed', wallSlot: Date.UTC(2026, 10, 2, 6, 10), processed: 0, events: 0, years: 0, deaths: 0 })
    expect(await runPaperLivesTick(t)).toBeNull()
  })

  it('prepares a pending life at install, starts its years on Save and never before', async () => {
    await seedWorld(t)
    await runPaperLivesTick(t)
    // Hidden while it is built: installs refuse until the game opens (here, as for an admin's test).
    await expect(link(t, 'Ana', 'pl-tok-ana')).rejects.toThrow('Paper Lives is not open yet.')
    await t.mutation(internal.platform.setGameStatusInternal, { slug: 'paper-lives', status: 'live' })
    expect(await link(t, 'Ana', 'pl-tok-ana')).toEqual({ activationState: 'pending_trmnl', heroCreated: true })
    const pending = await t.run(async (ctx) => ({ lives: await ctx.db.query('lives').collect(), profile: await ctx.db.query('paperLivesProfiles').first(), logs: await ctx.db.query('plTickLogs').collect() }))
    expect(pending.lives).toHaveLength(1)
    expect(pending.lives[0]).toMatchObject({ activationState: 'pending_trmnl', ordinal: 1, life: { age: 0, stage: 'infant', status: 'living', pronouns: expect.stringMatching(/^(she|he)$/) } })
    expect(pending.lives[0]!.life.traits).toHaveLength(2)
    expect(pending.lives[0]!.life.people.filter((p) => p.role === 'parent')).toHaveLength(2)
    expect(pending.profile?.lifeId).toBe(pending.lives[0]!._id)
    expect(pending.logs[0]!.summary).toMatch(/^Born on a /)
    await nextPaperLivesTick(t)
    expect((await lifeOf(t, pending.lives[0]!._id)).life.age).toBe(0)

    expect(await confirm(t, 'pl-tok-ana', UUID_A)).toEqual({ ok: true, reason: 'confirmed' })
    for (let i = 0; i < 6; i += 1) await nextPaperLivesTick(t)
    const grown = await lifeOf(t, pending.lives[0]!._id)
    expect(grown.life).toMatchObject({ age: 6, stage: 'child', education: 'school' })
    expect(grown.lastTick).toBeGreaterThan(0)
  })

  it('closes a year by itself at the close, or at the minimum once Age up is asked', async () => {
    const lifeId = await seedLife(t, { age: 30, stage: 'adult', education: 'work' })
    for (let i = 0; i < 31; i += 1) await nextPaperLivesTick(t)
    expect((await lifeOf(t, lifeId)).life.age).toBe(30)
    await nextPaperLivesTick(t)
    const closed = await lifeOf(t, lifeId)
    expect(closed.life.age).toBe(31)
    expect(closed.life.year.elapsed).toBe(0)
    await t.run(async (ctx) => await ctx.db.patch(lifeId, { life: { ...closed.life, year: { ...closed.life.year, ageUpRequested: true } } }))
    for (let i = 0; i < 8; i += 1) await nextPaperLivesTick(t)
    expect((await lifeOf(t, lifeId)).life.age).toBe(32)
    const logs = await t.run(async (ctx) => await ctx.db.query('plTickLogs').withIndex('by_lifeId_and_at_and_sequence', (q) => q.eq('lifeId', lifeId)).collect())
    expect(logs.filter((l) => l.kind === 'recap').map((l) => l.age)).toEqual([30, 31])
    expect(logs.map((l) => l.sequence)).toEqual(logs.map((_, i) => i + 2))
    // Lines keep what their effect moved (template v7), and only story lines carry it.
    expect(logs.some((l) => l.changes !== undefined)).toBe(true)
    for (const l of logs) if (l.changes) expect(['event', 'decision_resolved', 'infant']).toContain(l.kind)
  })

  it('skips a paused life and leaves it where it was', async () => {
    const lifeId = await seedLife(t, { age: 40, stage: 'adult', status: 'paused' })
    for (let i = 0; i < 5; i += 1) await nextPaperLivesTick(t)
    const life = await lifeOf(t, lifeId)
    expect(life.life.year.elapsed).toBe(0)
    expect(life.lastProgressTick).toBe(0)
  })

  it('writes a finished life’s record and board rows once, then rests as a memorial', async () => {
    const lifeId = await seedLife(t, { age: 100, stage: 'senior', stats: { health: 0, happiness: 60, smarts: 50, charm: 50 }, gold: 12_000, counters: { yearsLived: 94, decisionsChosen: 0, decisionsDefaulted: 0, remarkableEvents: 0, jobsHeld: 1, marriages: 0, childrenRaised: 0, grandchildren: 0, housesOwned: 0, petsKept: 0, hobbiesTaken: 0, peakMoney: 40_000 } }, 'Old')
    for (let i = 0; i < 400 && (await lifeOf(t, lifeId)).life.status !== 'ended'; i += 1) await nextPaperLivesTick(t)
    const ended = await lifeOf(t, lifeId)
    expect(ended.life.status).toBe('ended')
    expect(ended.life.death?.epitaph.length).toBeGreaterThan(0)
    for (let i = 0; i < 3; i += 1) await nextPaperLivesTick(t)
    const rows = await t.run(async (ctx) => ({ records: await ctx.db.query('lifeRecords').collect(), boards: await ctx.db.query('plLifeBoards').collect(), deaths: (await ctx.db.query('plTickLogs').collect()).filter((l) => l.kind === 'death') }))
    expect(rows.records).toHaveLength(1)
    expect(rows.records[0]).toMatchObject({ lifeId, ordinal: 1, age: ended.life.age, peakMoney: 40_000 })
    expect(rows.boards.map((b) => [b.board, b.period === 'all' ? 'all' : 'week', b.value]).sort()).toEqual([['fortune', 'all', 40_000], ['fortune', 'week', 40_000], ['longest', 'all', ended.life.age], ['longest', 'week', ended.life.age]])
    expect(rows.deaths).toHaveLength(1)
  })
})
