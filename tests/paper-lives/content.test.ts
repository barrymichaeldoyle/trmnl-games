import { describe, expect, it } from 'vitest'
import { catalogs, contentV1 } from '@trmnl-games/paper-lives/content'
import { validateContent } from '@trmnl-games/paper-lives/content/validate'

describe('Paper Lives content v1', () => {
  it('passes the validator with no problems', () => {
    expect(validateContent(contentV1).problems).toEqual([])
  })

  it('meets the launch counts (paper-lives.md "Content")', () => {
    const { counts } = validateContent(contentV1)
    expect(counts.events).toBeGreaterThanOrEqual(360)
    expect(counts.decisions).toBe(90)
    expect(counts.majorDecisions).toBe(18)
    expect(counts.petEvents).toBeGreaterThanOrEqual(48)
    expect(counts.hobbyEvents).toBeGreaterThanOrEqual(32)
    expect(counts.ambient).toBe(96)
    expect(counts.jobs).toBe(30)
    expect(counts.traits).toBe(16)
    expect(counts.causes).toBe(16)
    expect(counts.epitaphs).toBe(36)
    expect(contentV1.hobbies).toHaveLength(8)
    expect(contentV1.pets).toHaveLength(6)
    expect(contentV1.causes.filter((c) => c.remarkable)).toHaveLength(4)
  })

  it('catches a broken line', () => {
    const broken = { ...contentV1, events: [...contentV1.events, { ...contentV1.events[20]!, id: 'broken', line: 'He met {person} at the casino.' }] }
    const problems = validateContent(broken).problems.join('\n')
    expect(problems).toMatch(/gendered/)
    expect(problems).toMatch(/banned/)
    expect(problems).toMatch(/\{person\} has no value/)
  })

  it('pins every catalog a run may use', () => {
    expect(Object.keys(catalogs)).toEqual(['v1', 'v2', 'v3', 'v4'])
    expect(catalogs.v1.version).toBe(1)
    expect(catalogs.v2.version).toBe(2)
    expect(catalogs.v3.version).toBe(3)
  })
})
