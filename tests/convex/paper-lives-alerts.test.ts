// @vitest-environment edge-runtime
import { convexTest } from 'convex-test'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { api, internal } from '@trmnl-games/backend/api'
import type { Id } from '@trmnl-games/backend/data-model'
import { contentV1 } from '@trmnl-games/paper-lives/content'
import type { LifeState } from '@trmnl-games/paper-lives/sim'
import schema from '../../apps/backend/convex/schema'
import { queuePaperLivesAlerts } from '../../apps/backend/convex/lib/alerts'
import { toLifeState } from '../../apps/backend/convex/paperLives/adapter'
import type { T } from './helpers'
import { lifeOf, nextPaperLivesTick, runPaperLivesTick, seedLife } from './paperLivesHelpers'

// The real library needs Node's crypto; what reaches the push service is what these tests check (as alerts.test.ts).
const sent: Array<{ endpoint: string; payload: string }> = []
vi.mock('../../apps/backend/node_modules/web-push/src/index.js', () => ({
  default: {
    sendNotification: async (subscription: { endpoint: string }, payload: string) => {
      sent.push({ endpoint: subscription.endpoint, payload })
      return { statusCode: 201 }
    },
  },
}))

const modules = import.meta.glob('../../apps/backend/convex/**/*.ts')

describe('Paper Lives alerts (D159, L6)', () => {
  let t: T
  beforeEach(async () => {
    vi.useFakeTimers()
    // 10:10 UTC: a Paper Lives slot outside the default quiet hours.
    vi.setSystemTime(Date.UTC(2026, 10, 2, 10, 10, 3))
    vi.stubEnv('VAPID_PUBLIC_KEY', 'BPublicKeyForTests')
    vi.stubEnv('VAPID_PRIVATE_KEY', 'private-key-for-tests')
    sent.length = 0
    t = convexTest(schema, modules)
    await runPaperLivesTick(t)
  })
  afterEach(() => {
    vi.useRealTimers()
    vi.unstubAllEnvs()
  })

  async function setup(prefs: { majorDecision?: boolean; lifeEnded?: boolean; newArrival?: boolean }, life: Partial<LifeState> = {}, quiet = { quietStart: 3, quietEnd: 4 }) {
    const lifeId = await seedLife(t, { age: 30, stage: 'adult', education: 'work', ...life }, 'Ana')
    const ana = t.withIdentity({ issuer: 'issuer', subject: 'Ana' })
    await ana.mutation(api.alerts.subscribe, { operationId: 'sub-ana-001', endpoint: 'https://push.example/ana', p256dh: 'BKey', auth: 'Auth', label: 'Phone' })
    await ana.mutation(api.alerts.setPreferences, { operationId: 'pref-ana-01', ...prefs, ...quiet, timezone: 'UTC' })
    return { lifeId, ana }
  }
  const outbox = () => t.run(async (ctx) => await ctx.db.query('alertOutbox').collect())
  /** Queue straight from a before and after state, as the tick does. */
  const queue = (lifeId: Id<'lives'>, change: (life: LifeState) => LifeState) =>
    t.run(async (ctx) => {
      const life = (await ctx.db.get(lifeId))!
      const owner = (await ctx.db.get(life.userId))!
      const before = toLifeState(life)
      await queuePaperLivesAlerts(ctx, { owner, lifeId, before, after: change(before), content: contentV1, tick: 9, now: Date.now() })
    })
  const openYear = (elapsed: number): Partial<LifeState> => ({ year: { elapsed, quietTicks: 0, ageUpRequested: false, pending: { decisionId: 'ad_career' }, notes: [], lines: 0 } })

  it('raises a major decision once, on the tick the minimum passes, and pushes it while the year is open', async () => {
    const { lifeId } = await setup({ majorDecision: true }, openYear(contentV1.tuning.minYearTicks - 1))
    // The tick queues the row and the sender it schedules pushes it.
    await nextPaperLivesTick(t)
    const life = await lifeOf(t, lifeId)
    expect(life.life.year.pending?.decisionId).toBe('ad_career')
    const rows = await outbox()
    expect(rows).toHaveLength(1)
    expect(rows[0]).toMatchObject({ kind: 'major_decision', state: 'sent', lifeId, lifeAge: 30, detail: 'ad_career' })
    expect(sent).toHaveLength(1)
    expect(JSON.parse(sent[0]!.payload)).toMatchObject({ title: `A big decision for ${life.life.first}`, url: '/app/paper-lives?alert=major_decision', tag: 'major_decision' })
    await nextPaperLivesTick(t)
    expect(await outbox()).toHaveLength(1)
  })

  it('stays quiet for a decision already chosen and drops one whose year has closed', async () => {
    const { lifeId } = await setup({ majorDecision: true }, openYear(contentV1.tuning.minYearTicks))
    await queue(lifeId, (life) => ({ ...life, year: { ...life.year, pending: { decisionId: 'ad_career', chosen: 'stay' } } }))
    expect(await outbox()).toEqual([])
    await queue(lifeId, (life) => life)
    expect(await outbox()).toHaveLength(0)
    // Open past the minimum before and after: nothing new. From under the minimum: one row.
    await queue(lifeId, (life) => ({ ...life, year: { ...life.year, elapsed: life.year.elapsed + 1 } }))
    expect(await outbox()).toHaveLength(0)
    await t.run(async (ctx) => { const life = (await ctx.db.get(lifeId))!; await ctx.db.patch(lifeId, { life: { ...life.life, year: { ...life.life.year, elapsed: 7 } } }) })
    await queue(lifeId, (life) => ({ ...life, year: { ...life.year, elapsed: 8 } }))
    expect(await outbox()).toHaveLength(1)
    await t.run(async (ctx) => { const life = (await ctx.db.get(lifeId))!; await ctx.db.patch(lifeId, { life: { ...life.life, age: 31, year: { ...life.life.year, pending: undefined, elapsed: 0 } } }) })
    expect(await t.mutation(internal.alerts.claimDue, {})).toEqual([])
    expect((await outbox())[0]).toMatchObject({ state: 'skipped', reason: 'year_closed' })
  })

  it('holds a major decision and a death through quiet hours and skips a birth', async () => {
    const { lifeId } = await setup({ majorDecision: true, lifeEnded: true, newArrival: true }, openYear(7), { quietStart: 9, quietEnd: 12 })
    await queue(lifeId, (life) => ({ ...life, year: { ...life.year, elapsed: 8 }, people: [...life.people, { id: 'p99', name: 'Robin', role: 'child', bornAt: 30, metAt: 30, relationship: 80, alive: true, history: [] }] }))
    // The newborn and the decision are on the stored life too, as after a real tick.
    await t.run(async (ctx) => {
      const life = (await ctx.db.get(lifeId))!
      await ctx.db.patch(lifeId, { life: { ...life.life, year: { ...life.life.year, elapsed: 8 }, people: [...life.life.people, { id: 'p99', name: 'Robin', role: 'child', bornAt: 30, metAt: 30, relationship: 80, alive: true, history: [] }] } })
    })
    expect((await outbox()).map((row) => row.kind).sort()).toEqual(['major_decision', 'new_arrival'])
    expect(await t.mutation(internal.alerts.claimDue, {})).toEqual([])
    const rows = await outbox()
    expect(rows.find((row) => row.kind === 'new_arrival')).toMatchObject({ state: 'skipped', reason: 'quiet_hours' })
    expect(rows.find((row) => row.kind === 'major_decision')).toMatchObject({ state: 'pending', notBefore: Date.UTC(2026, 10, 2, 12, 0) })
  })

  it('sends a life ended alert once and a birth with the baby name', async () => {
    const { lifeId } = await setup({ lifeEnded: true, newArrival: true })
    const first = (await lifeOf(t, lifeId)).life.first
    await queue(lifeId, (life) => ({ ...life, people: [...life.people, { id: 'p98', name: 'Wren', role: 'grandchild', bornAt: 30, metAt: 30, relationship: 80, alive: true, history: [] }] }))
    await t.run(async (ctx) => {
      const life = (await ctx.db.get(lifeId))!
      await ctx.db.patch(lifeId, { life: { ...life.life, people: [...life.life.people, { id: 'p98', name: 'Wren', role: 'grandchild', bornAt: 30, metAt: 30, relationship: 80, alive: true, history: [] }] } })
    })
    const [birth] = await t.mutation(internal.alerts.claimDue, {})
    expect(JSON.parse(birth!.payload)).toMatchObject({ title: `${first} has a grandchild`, body: `Wren was born today, a grandchild for ${first}.`, url: '/app/paper-lives/people?alert=new_arrival' })
    await queue(lifeId, (life) => ({ ...life, status: 'ended' }))
    await queue(lifeId, (life) => ({ ...life, status: 'ended' }))
    await t.run(async (ctx) => { const life = (await ctx.db.get(lifeId))!; await ctx.db.patch(lifeId, { life: { ...life.life, status: 'ended' } }) })
    expect((await outbox()).filter((row) => row.kind === 'life_ended')).toHaveLength(1)
    const [ended] = await t.mutation(internal.alerts.claimDue, {})
    expect(JSON.parse(ended!.payload)).toMatchObject({ title: `${first}'s life has ended`, url: '/app/paper-lives?alert=life_ended' })
  })

  it('stays quiet when the kinds are off and keeps the three switches apart', async () => {
    const { lifeId, ana } = await setup({})
    await queue(lifeId, (life) => ({ ...life, status: 'ended' }))
    expect(await outbox()).toEqual([])
    await ana.mutation(api.alerts.setPreferences, { operationId: 'pref-ana-02', majorDecision: true, lifeEnded: true, quietStart: 3, quietEnd: 4, timezone: 'UTC' })
    expect(await ana.query(api.alerts.mine, {})).toMatchObject({ majorDecision: true, lifeEnded: true, newArrival: false })
  })
})
