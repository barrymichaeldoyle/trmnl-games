// @vitest-environment edge-runtime
import { convexTest } from 'convex-test'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { api, internal } from '@trmnl-games/backend/api'
import schema from '../../apps/backend/convex/schema'
import type { T } from './helpers'
import { lifeOf, nextPaperLivesTick, seedLife } from './paperLivesHelpers'

const modules = import.meta.glob('../../apps/backend/convex/**/*.ts')

describe('Paper Lives public life pages (D159, L4)', () => {
  let t: T
  beforeEach(() => {
    vi.useFakeTimers()
    vi.setSystemTime(Date.UTC(2026, 10, 2, 6, 10, 3))
    t = convexTest(schema, modules)
  })
  afterEach(() => vi.useRealTimers())

  async function finishedLife(alias: string) {
    const lifeId = await seedLife(t, { age: 100, stage: 'senior', stats: { health: 0, happiness: 60, smarts: 50, charm: 50 }, people: [{ id: 'c1', name: 'Ada', role: 'child', bornAt: 30, metAt: 30, relationship: 80, alive: true, history: [] }] }, alias)
    for (let i = 0; i < 400 && (await lifeOf(t, lifeId)).life.status !== 'ended'; i += 1) await nextPaperLivesTick(t)
    return lifeId
  }

  it('shows a finished life once the game is live, and links the next generation', async () => {
    await finishedLife('Ana')
    expect(await t.query(api.paperLives.public.lifePage, { alias: 'Ana', ordinal: 1 })).toBeNull()
    await t.mutation(internal.platform.setGameStatusInternal, { slug: 'paper-lives', status: 'live' })
    const page = await t.query(api.paperLives.public.lifePage, { alias: 'ana', ordinal: 1 })
    const record = await t.run(async (ctx) => await ctx.db.query('lifeRecords').first())
    expect(page).toMatchObject({ alias: 'Ana', ordinal: 1, age: record!.age, generation: 'First of the ' + page.name.split(' ')[1] + 's', child: null, portrait: { frame: true, stage: 'senior' } })
    expect(page.epitaph.length).toBeGreaterThan(0)
    await t.withIdentity({ issuer: 'issuer', subject: 'Ana' }).mutation(api.paperLives.lives.begin, { operationId: 'operation-begin-1', kind: 'child' })
    expect(await t.query(api.paperLives.public.lifePage, { alias: 'Ana', ordinal: 1 })).toMatchObject({ child: null })
  })

  it('answers the same not-found for a missing life, a private page, a suspended owner and a bad address', async () => {
    const lifeId = await finishedLife('Bo')
    await t.mutation(internal.platform.setGameStatusInternal, { slug: 'paper-lives', status: 'live' })
    expect(await t.query(api.paperLives.public.lifePage, { alias: 'Bo', ordinal: 1 })).not.toBeNull()
    expect(await t.query(api.paperLives.public.lifePage, { alias: 'Bo', ordinal: 2 })).toBeNull()
    expect(await t.query(api.paperLives.public.lifePage, { alias: 'Bo', ordinal: 0 })).toBeNull()
    expect(await t.query(api.paperLives.public.lifePage, { alias: 'Nobody', ordinal: 1 })).toBeNull()
    await t.run(async (ctx) => await ctx.db.patch(lifeId, { publicProfile: false }))
    expect(await t.query(api.paperLives.public.lifePage, { alias: 'Bo', ordinal: 1 })).toBeNull()
    await t.run(async (ctx) => {
      await ctx.db.patch(lifeId, { publicProfile: true })
      const user = (await ctx.db.query('users').first())!
      await ctx.db.patch(user._id, { state: 'suspended' })
    })
    expect(await t.query(api.paperLives.public.lifePage, { alias: 'Bo', ordinal: 1 })).toBeNull()
  })
})
