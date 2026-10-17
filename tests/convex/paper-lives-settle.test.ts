// @vitest-environment edge-runtime
import { convexTest } from 'convex-test'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { internal } from '@trmnl-games/backend/api'
import schema from '../../apps/backend/convex/schema'
import type { T } from './helpers'
import { lifeOf, runPaperLivesTick, seedLife } from './paperLivesHelpers'

const modules = import.meta.glob('../../apps/backend/convex/**/*.ts')

const parent = (id: string, name: string, bornAt: number) => ({ id, name, role: 'parent' as const, bornAt, metAt: 0, relationship: 70, alive: true, history: [`3: ${name} read a chapter every bedtime.`] })

/** D182: a life begun before content v5 becomes a girl or a boy with a mother and a father, story and all. */
describe('Paper Lives family settle (D182)', () => {
  let t: T
  beforeEach(() => {
    vi.useFakeTimers()
    vi.setSystemTime(Date.UTC(2026, 10, 2, 6, 10, 3))
    t = convexTest(schema, modules)
  })
  afterEach(() => vi.useRealTimers())

  it('renames the second of two fathers in the life and its story, and settles the pronouns', async () => {
    // Waiting for TRMNL, so the tick that creates the world leaves it alone.
    const lifeId = await seedLife(t, { first: 'Bodhi', pronouns: 'they', people: [parent('p1', 'Max', -30), parent('p2', 'Hal', -32)], highlights: ['4: Hal took you to the fair.'] }, 'Ro', { activationState: 'pending_trmnl' })
    await t.run(async (ctx) => {
      await ctx.db.insert('plTickLogs', { lifeId, ordinal: 1, source: 'tick', sequence: 2, at: Date.now(), kind: 'event', glyph: 'family', age: 4, summary: 'Hal took you to the fair and won a coconut. Halcyon days.' })
    })
    await runPaperLivesTick(t)
    const result = await t.mutation(internal.paperLives.operations.settleFamilies, {})
    expect(result).toMatchObject({ changed: 1, renamed: 1, done: true })
    await t.finishAllScheduledFunctions(vi.runAllTimers)
    const life = (await lifeOf(t, lifeId)).life
    expect(life.pronouns).toBe('he')
    const [max, other] = life.people
    expect(max).toMatchObject({ name: 'Max', gender: 'male' })
    expect(other!.gender).toBe('female')
    expect(other!.name).not.toBe('Hal')
    expect(other!.history[0]).toBe(`3: ${other!.name} read a chapter every bedtime.`)
    expect(life.highlights[0]).toBe(`4: ${other!.name} took you to the fair.`)
    const logs = await t.run(async (ctx) => await ctx.db.query('plTickLogs').collect())
    expect(logs.find((l) => l.sequence === 2)?.summary).toBe(`${other!.name} took you to the fair and won a coconut. Halcyon days.`)
    // Run again: nothing left to change.
    expect(await t.mutation(internal.paperLives.operations.settleFamilies, {})).toMatchObject({ changed: 0, renamed: 0 })
  })
})
