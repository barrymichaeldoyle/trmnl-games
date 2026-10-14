// @vitest-environment edge-runtime
/**
 * Writes tools/review/fixtures/paper-lives.json for the companion phone harness: the real `paperLives.lives.view`
 * output for each state, from lives seeded here and run through real ticks. Runs only when asked:
 *   PL_FIXTURES=1 npx vitest run tests/convex/paper-lives-fixtures.test.ts
 */
import { writeFileSync } from 'node:fs'
import { convexTest } from 'convex-test'
import { describe, expect, it, vi } from 'vitest'
import { api } from '@trmnl-games/backend/api'
import type { LifeState } from '@trmnl-games/paper-lives/sim'
import schema from '../../apps/backend/convex/schema'
import { lifeOf, nextPaperLivesTick, seedLife } from './paperLivesHelpers'

const modules = import.meta.glob('../../apps/backend/convex/**/*.ts')
const person = (id: string, name: string, role: string, bornAt: number, relationship: number, extra: Record<string, unknown> = {}) => ({ id, name, role, bornAt, metAt: Math.max(0, bornAt), relationship, alive: true, history: [], ...extra })

describe.runIf(process.env.PL_FIXTURES)('Paper Lives companion fixtures', () => {
  it('writes the view for every state', async () => {
    vi.useFakeTimers()
    vi.setSystemTime(Date.UTC(2026, 10, 2, 9, 10, 3))
    const t = convexTest(schema, modules)
    const states: Record<string, Partial<LifeState> & { _ticks?: number; _pending?: string; _status?: 'pending_trmnl' }> = {
      adult: {
        first: 'Maud', last: 'Okafor', age: 34, stage: 'adult', job: 'nurse', jobSince: 26, income: 28_000, jobYears: { nurse: 8 }, education: 'degree', home: 'renting', traits: ['curious', 'loyal'], flags: ['glasses', 'family_open'],
        pet: { kind: 'dog', name: 'Biscuit', bornAt: 30, lifespan: 13, relationship: 70 },
        stats: { health: 72, happiness: 58, smarts: 81, charm: 35 }, gold: 12_400, counters: { yearsLived: 34, decisionsChosen: 4, decisionsDefaulted: 9, remarkableEvents: 0, jobsHeld: 2, marriages: 1, childrenRaised: 1, grandchildren: 0, housesOwned: 0, petsKept: 1, hobbiesTaken: 1, peakMoney: 15_000 }, hobby: 'running',
        people: [person('p1', 'Lenny', 'parent', -30, 74), person('p2', 'Hamish', 'parent', -33, 61, { alive: false, history: ['31: Lost Hamish. Kept the reading glasses on the hall table for a year.'] }), person('p3', 'Sam', 'partner', -1, 82, { step: 'married', stepYears: 6 }), person('p4', 'Ida', 'child', 31, 88), person('p5', 'Finn', 'friend', 1, 66, { history: ['8: Made a friend called Finn over a shared rubber.', '20: A long weekend in a cottage with Finn and too much cheese.'] })],
        _ticks: 28, _pending: 'ad_career',
      },
      child: { first: 'Pip', last: 'Moss', age: 9, stage: 'child', education: 'school', home: 'family', pet: { kind: 'rabbit', name: 'Bobbin', bornAt: 8, lifespan: 8, relationship: 70 }, people: [person('p1', 'Ada', 'parent', -29, 80), person('p2', 'Cai', 'parent', -31, 75), person('p3', 'Tess', 'sibling', -3, 60)], _ticks: 28 },
      first: { first: 'Robin', last: 'Hale', _ticks: 0 },
      infant: { first: 'Robin', last: 'Hale', age: 3, counters: { yearsLived: 3, decisionsChosen: 0, decisionsDefaulted: 0, remarkableEvents: 0, jobsHeld: 0, marriages: 0, childrenRaised: 0, grandchildren: 0, housesOwned: 0, petsKept: 0, hobbiesTaken: 0, peakMoney: 0 }, _ticks: 0 },
      senior: { first: 'Dot', last: 'Achterberg', age: 78, stage: 'senior', retired: true, pension: 9_000, home: 'owned', house: 3, traits: ['stubborn', 'sunny'], stats: { health: 31, happiness: 82, smarts: 60, charm: 77 }, gold: 140_500, people: [person('p1', 'Kit', 'child', 30, 70), person('p2', 'Bea', 'child', 33, 55), person('p3', 'Ottilie', 'grandchild', 62, 90, { parentId: 'p1' })], _ticks: 28, _pending: 'sn_will' },
      paused: { first: 'Errol', last: 'Wade', age: 41, stage: 'adult', status: 'paused', job: 'architect', home: 'owned', house: 2, _ticks: 0 },
      memorial: { first: 'Maud', last: 'Okafor', age: 100, stage: 'senior', generation: 3, stats: { health: 0, happiness: 70, smarts: 60, charm: 60 }, gold: 30_000, people: [person('c1', 'Ida', 'child', 31, 88), person('c2', 'Jago', 'child', 34, 61)], _ticks: 400 },
      long: { first: 'Ottilie', last: 'Achterberg', age: 52, stage: 'adult', job: 'museum_director', home: 'renting', traits: ['delicate', 'generous'], stats: { health: 100, happiness: 0, smarts: 100, charm: 0 }, gold: -2_000, people: [person('p1', 'Wellington', 'friend', 2, 100, { history: Array.from({ length: 4 }, () => '40: Went to Ottilie’s funeral and told the story about the canoe, which went on rather longer.') })], _ticks: 28, _pending: 'ad_old_friend' },
      pending: { first: 'Jude', last: 'Fenwick', _status: 'pending_trmnl', _ticks: 0 },
    }
    const out: Record<string, unknown> = {}
    for (const [name, { _ticks = 0, _pending, _status, ...state }] of Object.entries(states)) {
      const alias = `Fx${name}`
      const lifeId = await seedLife(t, state, alias, _status ? { activationState: _status } : {})
      for (let i = 0; i < _ticks; i += 1) {
        await nextPaperLivesTick(t)
        if (name === 'memorial' && (await lifeOf(t, lifeId)).life.status === 'ended') break
      }
      if (_pending) {
        const life = await lifeOf(t, lifeId)
        const personId = _pending === 'ad_old_friend' ? 'p1' : undefined
        await t.run(async (ctx) => await ctx.db.patch(lifeId, { life: { ...life.life, year: { ...life.life.year, pending: { decisionId: _pending, ...(personId ? { personId } : {}) } } } }))
      }
      out[name] = await t.withIdentity({ issuer: 'issuer', subject: alias }).query(api.paperLives.lives.view, {})
    }
    expect((out.memorial as { life: { status: string } }).life.status).toBe('ended')
    writeFileSync('tools/review/fixtures/paper-lives.json', `${JSON.stringify(out, null, 1)}\n`)
    vi.useRealTimers()
  }, 120_000)
})
