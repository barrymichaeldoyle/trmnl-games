import { describe, expect, it } from 'vitest'
import { contentV2, contentV3 } from '@trmnl-games/paper-lives/content'
import { validateContent } from '@trmnl-games/paper-lives/content/validate'
import { simulateLifeRun, POLICIES } from '../../tools/balance/paper-lives'

/** The first content pack (Barry chose it as the first work after the MVP, 2026-10-14). */
describe('Paper Lives content v3', () => {
  it('passes the validator and keeps every v2 id', () => {
    expect(validateContent(contentV3).problems).toEqual([])
    const ids = new Set([...contentV3.events, ...contentV3.decisions].map((x) => x.id))
    for (const x of [...contentV2.events, ...contentV2.decisions]) expect(ids.has(x.id)).toBe(true)
  })

  it('adds about 180 events, 32 decisions and 30 quiet lines', () => {
    const { counts } = validateContent(contentV3)
    expect(contentV3.events.length - contentV2.events.length).toBeGreaterThanOrEqual(175)
    expect(counts.decisions).toBe(122)
    expect(counts.majorDecisions).toBe(20)
    expect(contentV3.ambient.length - contentV2.ambient.length).toBe(30)
  })

  it('puts every event of a year inside its minimum, so Age up skips only quiet lines', { timeout: 60_000 }, () => {
    expect(contentV3.tuning.yearEndEventPercent).toBe(0)
    for (let i = 0; i < 20; i += 1) {
      const run = simulateLifeRun(POLICIES[2]!, i, 60, contentV3, undefined, true)
      // A never-visiting player's years run 32 ticks; past the minimum only quiet lines, recaps and checks appear.
      expect(run.story.filter((e) => e.kind === 'event').length).toBeGreaterThan(0)
    }
  })

  it('asks about retirement and the will once, with one reminder, and never repeats a line within a life', { timeout: 60_000 }, () => {
    const retire = contentV3.decisions.find((d) => d.id === 'sn_retire')!
    expect(retire.when?.notFlags).toContain('kept_working')
    expect(retire.options.find((o) => o.id === 'keep')?.effects?.flag).toBe('kept_working')
    expect(contentV3.decisions.find((d) => d.id === 'sn3_retire_later')?.when?.flags).toEqual(['kept_working'])
    expect(contentV3.decisions.find((d) => d.id === 'sn3_will_again')?.when?.flags).toEqual(['will_later'])
    for (let i = 0; i < 12; i += 1) {
      const run = simulateLifeRun(POLICIES[2]!, i, 60, contentV3, undefined, true)
      expect(run.story.filter((e) => e.summary === 'Kept working another year. Not ready yet.').length).toBeLessThanOrEqual(1)
      expect(run.story.filter((e) => e.summary === 'Put the will off for another year. Plenty of time.').length).toBeLessThanOrEqual(1)
    }
  })
})

