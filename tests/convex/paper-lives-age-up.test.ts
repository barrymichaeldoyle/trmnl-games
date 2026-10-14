// @vitest-environment edge-runtime
import { convexTest } from 'convex-test'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { api } from '@trmnl-games/backend/api'
import { contentV3 } from '@trmnl-games/paper-lives/content'
import schema from '../../apps/backend/convex/schema'
import type { T } from './helpers'
import { lifeOf, nextPaperLivesTick, runPaperLivesTick, seedLife } from './paperLivesHelpers'

const modules = import.meta.glob('../../apps/backend/convex/**/*.ts')
let op = 0
const opId = () => `age-up-${++op}`
const year = (elapsed: number) => ({ year: { elapsed, quietTicks: 0, ageUpRequested: false, notes: [], lines: 0 } })

/** Barry, 2026-10-14: Age up promised something and then asked for a long wait. A ready year now ends on the spot. */
describe('Paper Lives Age up (content v3)', () => {
  let t: T
  beforeEach(async () => {
    vi.useFakeTimers()
    vi.setSystemTime(Date.UTC(2026, 10, 2, 6, 10, 3))
    t = convexTest(schema, modules)
    await runPaperLivesTick(t)
  })
  afterEach(() => vi.useRealTimers())
  const as = (alias: string) => t.withIdentity({ issuer: 'issuer', subject: alias })

  it('ends a year that has reached its minimum at once, with its recap, and the next tick carries on from there', async () => {
    const min = contentV3.tuning.minYearTicks
    const lifeId = await seedLife(t, { age: 30, stage: 'adult', education: 'work', ...year(min - 1) }, 'Ana')
    expect(await as('Ana').mutation(api.paperLives.lives.ageUp, { operationId: opId() })).toMatchObject({ changed: true })
    const after = await lifeOf(t, lifeId)
    expect(after.life.age).toBe(31)
    expect(after.life.year.elapsed).toBe(0)
    expect(after.life.year.ageUpRequested).toBe(false)
    const logs = await t.run(async (ctx) => await ctx.db.query('plTickLogs').withIndex('by_lifeId_and_at_and_sequence', (q) => q.eq('lifeId', lifeId)).collect())
    expect(logs.some((l) => l.kind === 'recap' && l.age === 30)).toBe(true)
    await nextPaperLivesTick(t)
    const next = await lifeOf(t, lifeId)
    expect(next.life.age).toBe(31)
    expect(next.life.year.elapsed).toBe(1)
  })

  it('queues before the minimum, and the year still ends at the minimum', async () => {
    const lifeId = await seedLife(t, { age: 30, stage: 'adult', education: 'work', ...year(2) }, 'Bo')
    await as('Bo').mutation(api.paperLives.lives.ageUp, { operationId: opId() })
    const queued = await lifeOf(t, lifeId)
    expect(queued.life).toMatchObject({ age: 30, year: { elapsed: 2, ageUpRequested: true } })
    for (let i = 0; i < contentV3.tuning.minYearTicks - 2; i += 1) await nextPaperLivesTick(t)
    expect((await lifeOf(t, lifeId)).life.age).toBe(31)
  })
})
