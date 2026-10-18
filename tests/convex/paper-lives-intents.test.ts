// @vitest-environment edge-runtime
import { convexTest } from 'convex-test'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { api } from '@trmnl-games/backend/api'
import schema from '../../apps/backend/convex/schema'
import type { T } from './helpers'
import { zeroCounters } from '@trmnl-games/paper-lives/sim'
import { lifeOf, nextPaperLivesTick, seedLife } from './paperLivesHelpers'

const zero = zeroCounters()

const modules = import.meta.glob('../../apps/backend/convex/**/*.ts')
let op = 0
const opId = () => `operation-${++op}`

describe('Paper Lives intents (D159, L2)', () => {
  let t: T
  beforeEach(() => {
    vi.useFakeTimers()
    vi.setSystemTime(Date.UTC(2026, 10, 2, 6, 10, 3))
    t = convexTest(schema, modules)
  })
  afterEach(() => {
    vi.useRealTimers()
    vi.restoreAllMocks()
  })

  const as = (alias: string) => t.withIdentity({ issuer: 'issuer', subject: alias })

  it('records a choice, refuses a gated one with its reason, and resolves at the boundary', async () => {
    const lifeId = await seedLife(t, { age: 18, stage: 'young', education: 'school', stats: { health: 70, happiness: 50, smarts: 30, charm: 50 }, year: { elapsed: 0, quietTicks: 0, ageUpRequested: false, notes: [], lines: 0, pending: { decisionId: 'yg_education' } } }, 'Ana')
    expect(await as('Ana').mutation(api.paperLives.lives.choose, { operationId: opId(), decisionId: 'yg_education', optionId: 'university' })).toMatchObject({ ok: false, message: expect.stringContaining('Needs Smarts 50') })
    expect(await as('Ana').mutation(api.paperLives.lives.choose, { operationId: opId(), decisionId: 'yg_education', optionId: 'trade' })).toMatchObject({ changed: true })
    // The same operation id replays its receipt; choosing the same option again changes nothing.
    const id = opId()
    expect(await as('Ana').mutation(api.paperLives.lives.choose, { operationId: id, decisionId: 'yg_education', optionId: 'trade' })).toMatchObject({ changed: false })
    expect(await as('Ana').mutation(api.paperLives.lives.choose, { operationId: id, decisionId: 'yg_education', optionId: 'trade' })).toMatchObject({ operationId: id, changed: false })
    const view = await as('Ana').query(api.paperLives.lives.view, {})
    expect(view.year.decision).toMatchObject({ id: 'yg_education', chosen: 'trade', default: 'work' })
    expect(view.year.decision.options.find((o: { id: string }) => o.id === 'university')).toMatchObject({ open: false, reason: 'Needs Smarts 50' })
    expect(await as('Ana').mutation(api.paperLives.lives.ageUp, { operationId: opId() })).toMatchObject({ changed: true })
    for (let i = 0; i < 8; i += 1) await nextPaperLivesTick(t)
    const life = await lifeOf(t, lifeId)
    expect(life.life).toMatchObject({ age: 19, education: 'trade' })
    expect(life.life.counters.decisionsChosen).toBe(1)
  })

  it('names the baby and sets a girl or a boy while an infant, before TRMNL is saved too (D182)', async () => {
    await seedLife(t, {}, 'Bo', { activationState: 'pending_trmnl' })
    await expect(as('Bo').mutation(api.paperLives.lives.rename, { operationId: opId(), first: 'X' })).rejects.toThrow('First name')
    expect(await as('Bo').mutation(api.paperLives.lives.rename, { operationId: opId(), first: 'Maud', last: 'Okafor' })).toMatchObject({ changed: true })
    expect(await as('Bo').mutation(api.paperLives.lives.setPronouns, { operationId: opId(), pronouns: 'she' })).toMatchObject({ changed: true })
    expect(await as('Bo').mutation(api.paperLives.lives.setPronouns, { operationId: opId(), pronouns: 'they' })).toMatchObject({ ok: false, message: expect.stringContaining('girl or a boy') })
    const view = await as('Bo').query(api.paperLives.lives.view, {})
    expect(view.life).toMatchObject({ first: 'Maud', last: 'Okafor', pronouns: 'she', canRename: true, canRenameLast: true })
  })

  it('settles the name once school starts', async () => {
    await seedLife(t, { age: 5, counters: { ...zero, yearsLived: 5 } }, 'Bea')
    expect(await as('Bea').mutation(api.paperLives.lives.rename, { operationId: opId(), first: 'Ida' })).toMatchObject({ changed: true })
    await nextPaperLivesTick(t)
    expect(await as('Bea').mutation(api.paperLives.lives.rename, { operationId: opId(), first: 'Maud' })).toMatchObject({ ok: false, message: expect.stringContaining('settled') })
  })

  it('pauses and resumes without catch-up', async () => {
    const lifeId = await seedLife(t, { age: 40, stage: 'adult' }, 'Cy')
    await nextPaperLivesTick(t)
    expect(await as('Cy').mutation(api.paperLives.lives.pause, { operationId: opId() })).toMatchObject({ changed: true })
    for (let i = 0; i < 4; i += 1) await nextPaperLivesTick(t)
    expect((await lifeOf(t, lifeId)).life.year.elapsed).toBe(1)
    expect(await as('Cy').mutation(api.paperLives.lives.resume, { operationId: opId() })).toMatchObject({ changed: true })
    await nextPaperLivesTick(t)
    expect((await lifeOf(t, lifeId)).life.year.elapsed).toBe(2)
  })

  it('begins the next life as a child with the inheritance, or as a stranger, in place', async () => {
    // The world seed comes from Math.random, and the last thirty-odd years differ with it: some runs spend the whole
    // fortune and leave a will of 0. Pinned, the run is the same every time and the will leaves gold.
    vi.spyOn(Math, 'random').mockReturnValue(0.42)
    const lifeId = await seedLife(
      t,
      {
        age: 100,
        stage: 'senior',
        stats: { health: 0, happiness: 60, smarts: 50, charm: 50 },
        gold: 20_000,
        people: [
          { id: 'c1', name: 'Ada', role: 'child', bornAt: 30, metAt: 30, relationship: 80, alive: true, history: [] },
          { id: 'c2', name: 'Bea', role: 'child', bornAt: 34, metAt: 34, relationship: 60, alive: true, history: [] },
        ],
      },
      'Di',
    )
    expect(await as('Di').mutation(api.paperLives.lives.begin, { operationId: opId(), kind: 'stranger' })).toMatchObject({ ok: false, message: expect.stringContaining('still being lived') })
    for (let i = 0; i < 400 && (await lifeOf(t, lifeId)).life.status !== 'ended'; i += 1) await nextPaperLivesTick(t)
    const memorial = await as('Di').query(api.paperLives.lives.view, {})
    expect(memorial.memorial).toMatchObject({ recorded: true, heirs: [{ id: 'c1', name: 'Ada' }, { id: 'c2', name: 'Bea' }] })
    expect(await as('Di').mutation(api.paperLives.lives.begin, { operationId: opId(), kind: 'child', personId: 'nobody' })).toMatchObject({ ok: false, message: expect.stringContaining('cannot take up the story') })
    expect(await as('Di').mutation(api.paperLives.lives.begin, { operationId: opId(), kind: 'child' })).toMatchObject({ changed: true })
    const child = await lifeOf(t, lifeId)
    expect(child).toMatchObject({ ordinal: 2, life: { first: 'Ada', status: 'living', generation: 2 } })
    expect(child.life.age).toBeGreaterThanOrEqual(66)
    const record = await t.run(async (ctx) => await ctx.db.query('lifeRecords').first())
    // The heir starts with exactly their bequest.
    expect(child.life.gold).toBeGreaterThan(0)
    expect(child.life.gold).toBe(record?.bequests.find((bequest) => bequest.personId === 'c1')?.gold)
    expect(record?.continuedBy).toBe('child')
    // The child's life goes on from the next tick.
    await nextPaperLivesTick(t)
    expect((await lifeOf(t, lifeId)).life.year.elapsed).toBe(1)
  })

  it('begins a stranger at birth when there is no child to carry on', async () => {
    const lifeId = await seedLife(t, { age: 100, stage: 'senior', stats: { health: 0, happiness: 60, smarts: 50, charm: 50 }, people: [] }, 'Fay')
    for (let i = 0; i < 400 && (await lifeOf(t, lifeId)).life.status !== 'ended'; i += 1) await nextPaperLivesTick(t)
    expect(await as('Fay').mutation(api.paperLives.lives.begin, { operationId: opId(), kind: 'child' })).toMatchObject({ ok: false, message: expect.stringContaining('cannot take up the story') })
    expect(await as('Fay').mutation(api.paperLives.lives.begin, { operationId: opId(), kind: 'stranger' })).toMatchObject({ changed: true })
    const next = await lifeOf(t, lifeId)
    expect(next).toMatchObject({ ordinal: 2, life: { age: 0, stage: 'infant', generation: 1, status: 'living' } })
    const view = await as('Fay').query(api.paperLives.lives.view, {})
    expect(view.logs.every((l: { age: number }) => l.age === 0)).toBe(true)
  })

  it('refuses intents before activation and for strangers', async () => {
    await seedLife(t, {}, 'Ed', { activationState: 'pending_trmnl' })
    expect(await as('Ed').mutation(api.paperLives.lives.ageUp, { operationId: opId() })).toMatchObject({ ok: false, message: expect.stringContaining('Save Paper Lives in TRMNL') })
    expect(await as('Nobody').mutation(api.paperLives.lives.ageUp, { operationId: opId() })).toMatchObject({ ok: false })
    expect(await as('Nobody').query(api.paperLives.lives.view, {})).toMatchObject({ life: null })
  })
})
