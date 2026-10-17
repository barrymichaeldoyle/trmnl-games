import { describe, expect, it } from 'vitest'
import { ACTIVE_CONTENT, contentV4, contentV5 } from '@trmnl-games/paper-lives/content'
import { validateContent } from '@trmnl-games/paper-lives/content/validate'
import { beginChild, rename, setPronouns, settleGender, starterLife, type LifeEvent, type LifeState } from '@trmnl-games/paper-lives/sim'
import { simulateLifeRun, POLICIES } from '../../tools/balance/paper-lives'

const LIVES = 60
const runs = Array.from({ length: LIVES }, (_, i) => simulateLifeRun(POLICIES[i % 2]!, i, 60, contentV5, undefined, true))

/** The index of the first story line matching, or -1. */
const firstAt = (story: readonly LifeEvent[], test: (line: string) => boolean) => story.findIndex((e) => test(e.summary))

/** A story that keeps track of itself (D182): Barry found a 10k "first" after a half marathon, a sexless character and a fiancée from nowhere. */
describe('Paper Lives content v5', () => {
  it('is active, passes the validator and keeps every v4 id', () => {
    expect(ACTIVE_CONTENT).toBe('v5')
    expect(validateContent(contentV5).problems).toEqual([])
    const ids = new Set([...contentV5.events, ...contentV5.decisions].map((x) => x.id))
    for (const x of [...contentV4.events, ...contentV4.decisions]) expect(ids.has(x.id)).toBe(true)
  })

  it('is born a girl or a boy with a matching name, to a mother and a father', () => {
    for (let seed = 1; seed <= 200; seed += 1) {
      const { life } = starterLife(contentV5, seed)
      expect(['she', 'he']).toContain(life.pronouns)
      expect(life.pronouns === 'she' ? contentV5.names.female : contentV5.names.male).toContain(life.first)
      const parents = life.people.filter((p) => p.role === 'parent')
      expect(new Set(parents.map((p) => p.gender))).toEqual(new Set(['female', 'male']))
      for (const p of life.people) expect(p.gender === 'female' ? contentV5.names.female : contentV5.names.male).toContain(p.name)
    }
  })

  it('pairs every partner with the other sex, and gives everyone a gender', () => {
    let partners = 0
    for (const run of runs) {
      const own = run.final.pronouns === 'she' ? 'female' : 'male'
      for (const p of run.final.people) {
        expect(p.gender, `${run.index} ${p.name}`).toBeDefined()
        if (p.role === 'partner' || p.role === 'former_partner') {
          partners += 1
          expect(p.gender, `${run.index} ${p.name}`).not.toBe(own)
        }
      }
    }
    expect(partners).toBeGreaterThan(LIVES / 2)
  })

  it('writes the meeting before every engagement and wedding', () => {
    let checked = 0
    for (const run of runs) {
      const partners = run.final.people.filter((p) => p.role === 'partner' || p.role === 'former_partner')
      for (const p of partners) {
        const named = new RegExp(`(?<![\\p{L}])${p.name}(?![\\p{L}])`, 'u')
        const engaged = firstAt(run.story, (l) => named.test(l) && /proposed|Proposed|Engaged|marry/.test(l))
        if (engaged < 0) continue
        checked += 1
        const met = firstAt(run.story, (l) => named.test(l))
        expect(met, `${run.index}: ${p.name}`).toBeLessThan(engaged)
      }
    }
    expect(checked).toBeGreaterThan(10)
  })

  it('runs the 5k, 10k, half marathon and marathon in order, each first once', () => {
    for (const run of runs) {
      const story = run.story.filter((e) => e.kind === 'event' || e.kind === 'decision_resolved')
      const first10k = firstAt(story, (l) => /first 10k|a whole 10k/.test(l))
      const bigger = firstAt(story, (l) => /half marathon|finished the marathon|Ran the 10k|a 10k in a fancy dress/.test(l))
      const fiveK = firstAt(story, (l) => /a whole 5k/.test(l))
      if (first10k >= 0 && bigger >= 0) expect(first10k, `${run.index}`).toBeLessThan(bigger)
      if (fiveK >= 0 && first10k >= 0) expect(fiveK, `${run.index}`).toBeLessThan(first10k)
      expect(story.filter((e) => /first 10k|a whole 10k/.test(e.summary)).length).toBeLessThanOrEqual(1)
    }
  })

  it('brings babies only to a married couple', () => {
    for (const run of runs) {
      for (const child of run.final.people.filter((p) => p.role === 'child')) {
        const born = firstAt(run.story, (l) => l.includes(child.name) && /born|arrived|A baby/.test(l))
        const married = firstAt(run.story, (l) => /^Married |^Renewed/.test(l))
        // Adoption needs no partner; every other child comes after a wedding.
        const adopted = run.story.some((e) => e.summary.includes(child.name) && /forms and visits/.test(e.summary))
        if (born >= 0 && !adopted) expect(married, `${run.index}: ${child.name}`).toBeGreaterThanOrEqual(0)
      }
    }
  })

  it('never names a dead parent at the graduation', () => {
    for (const run of runs) {
      const line = run.story.find((e) => /^Graduated in a borrowed gown/.test(e.summary))
      if (!line) continue
      const parent = run.final.people.find((p) => p.role === 'parent' && line.summary.includes(p.name))
      if (!parent) continue
      const died = firstAt(run.story, (l) => l.includes(parent.name) && /died|Lost /.test(l))
      if (died >= 0) expect(died).toBeGreaterThan(run.story.indexOf(line))
    }
  })

  it('settles a v4 life written as they: the other sex to its partner, or by its name', () => {
    const base = starterLife(contentV4, 7).life
    const withPartner: LifeState = { ...base, people: [...base.people, { id: 'p9', name: 'Seren', role: 'partner', bornAt: -1, metAt: 20, relationship: 60, alive: true, step: 'married', history: [] }] }
    const settled = settleGender(withPartner, contentV5)
    expect(settled.pronouns).toBe('he')
    expect(settled.people.every((p) => p.gender)).toBe(true)
    expect(settleGender(settled, contentV5)).toBe(settled)
    expect(settleGender({ ...base, first: 'Maud' }, contentV5).pronouns).toBe('she')
    expect(settleGender(base, contentV4)).toBe(base)
  })

  it('lets the name, surname and sex change only while an infant, and never to they', () => {
    const { life } = starterLife(contentV5, 3)
    expect(rename(life, 'Ida', 'Okafor')).toMatchObject({ ok: true, life: { first: 'Ida', last: 'Okafor' } })
    expect(setPronouns(life, 'they')).toMatchObject({ ok: false, code: 'CHOOSE_SEX' })
    expect(setPronouns({ ...life, age: 5 }, life.pronouns === 'she' ? 'he' : 'she')).toMatchObject({ ok: true })
    const school: LifeState = { ...life, age: 6, stage: 'child' }
    expect(rename(school, 'Ida')).toMatchObject({ ok: false, code: 'TOO_LATE' })
    expect(rename({ ...life, generation: 2 }, 'Ida', 'Okafor')).toMatchObject({ ok: false, code: 'FAMILY_NAME' })
  })

  it('carries the heir on as the daughter or son they were', () => {
    const run = runs.find((r) => r.record && r.record.heirs.some((h) => h.role === 'child'))!
    const heir = run.record!.heirs.find((h) => h.role === 'child')!
    expect(heir.gender).toBeDefined()
    const next = beginChild(run.record!, heir.id, contentV5, 11).life
    expect(next.pronouns).toBe(heir.gender === 'female' ? 'she' : 'he')
    const parents = next.people.filter((p) => p.role === 'parent')
    if (parents.length === 2) expect(parents[0]!.gender).not.toBe(parents[1]!.gender)
  })
})
