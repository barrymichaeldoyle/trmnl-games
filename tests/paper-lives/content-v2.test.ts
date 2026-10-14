import { describe, expect, it } from 'vitest'
import { contentV1, contentV2 } from '@trmnl-games/paper-lives/content'
import { validateContent } from '@trmnl-games/paper-lives/content/validate'
import { simulateLifeRun, POLICIES } from '../../tools/balance/paper-lives'

/** Barry, 2026-10-14: a character took their first steps at five. Content v2 keeps the story to the right ages and people. */
describe('Paper Lives content v2', () => {
  it('passes the validator and keeps every v1 id', () => {
    expect(validateContent(contentV2).problems).toEqual([])
    const ids = new Set([...contentV2.events, ...contentV2.decisions].map((x) => x.id))
    for (const x of [...contentV1.events, ...contentV1.decisions]) expect(ids.has(x.id)).toBe(true)
  })

  it('names a parent only where one is alive, under the v2 rules', () => {
    const problems = validateContent({ ...contentV1, version: 2 }).problems.join('\n')
    expect(problems).toMatch(/event inf_steps: slot \{parent\} has no value here/)
    expect(problems).toMatch(/trait shy: slot \{parent\}/)
  })

  it('keeps milestones to their ages and nobody engaged before 20 across many lives', { timeout: 60_000 }, () => {
    const window: Record<string, [number, number]> = {
      'First steps,': [1, 1],
      'First word was': [1, 2],
      'Started nursery.': [3, 4],
      'A first tooth,': [0, 1],
      'Learned to ride a bike down the back lane': [6, 9],
    }
    for (let i = 0; i < 60; i += 1) {
      const run = simulateLifeRun(POLICIES[i % POLICIES.length]!, i, 60, contentV2, undefined, true)
      for (const event of run.story) {
        for (const [start, [lo, hi]] of Object.entries(window)) if (event.summary.startsWith(start)) expect([event.age, event.summary]).toEqual([expect.toSatisfy((a: number) => a >= lo && a <= hi), event.summary])
        if (event.glyph === 'ring' && event.kind !== 'decision_resolved' && /engaged|proposed|propose|marry/i.test(event.summary)) expect(event.age).toBeGreaterThanOrEqual(20)
      }
    }
  })
})

describe('Paper Lives family labels (Barry, 2026-10-14)', () => {
  it('says mother or father for every parent, from the story, the name or the person', async () => {
    const { familyLabel } = await import('@trmnl-games/paper-lives/sim')
    const person = (name: string, role: 'parent' | 'sibling' | 'child' | 'grandchild' | 'partner' | 'friend', extra = {}) => ({ name, role, ...extra })
    expect(familyLabel(person('Maud', 'parent'), contentV2)).toBe('Mother')
    expect(familyLabel(person('Hamish', 'parent'), contentV2)).toBe('Father')
    // A name used either way gets one gender for that person, the same every time.
    const sam = familyLabel({ ...person('Sam', 'parent'), id: 'p2' }, contentV2)
    expect(['Mother', 'Father']).toContain(sam)
    expect(familyLabel({ ...person('Sam', 'parent'), id: 'p2' }, contentV2)).toBe(sam)
    expect(familyLabel(person('Sam', 'parent', { gender: 'female' }), contentV2)).toBe('Mother')
    expect(familyLabel(person('Ruby', 'sibling'), contentV2)).toBe('Sister')
    expect(familyLabel(person('Otto', 'child'), contentV2)).toBe('Son')
    expect(familyLabel(person('Iris', 'grandchild'), contentV2)).toBe('Granddaughter')
    expect(familyLabel(person('Obi', 'partner', { step: 'married' }), contentV2)).toBe('Husband')
    expect(familyLabel(person('Obi', 'partner', { step: 'dating' }), contentV2)).toBe('Partner')
    expect(familyLabel(person('Ruby', 'friend'), contentV2)).toBe('Friend')
    // v1 has no name lists, so the labels stay as they were.
    expect(familyLabel(person('Maud', 'parent'), contentV1)).toBe('Parent')
  })

  it('makes the last character a mother or father to the child who carries on', async () => {
    const { beginChild } = await import('@trmnl-games/paper-lives/sim')
    for (let i = 0; i < 40; i += 1) {
      const run = simulateLifeRun(POLICIES[0]!, i, 60, contentV2)
      const heir = run.record?.heirs.find((h) => h.role === 'child')
      if (!run.record || !heir) continue
      const record = { ...run.record, pronouns: 'she' as const }
      const next = beginChild(record, heir.id, contentV2, 7)
      expect(next.life.people.find((p) => p.name === record.first && p.role === 'parent')?.gender).toBe('female')
      return
    }
    throw new Error('no heir in 40 lives')
  })
})
