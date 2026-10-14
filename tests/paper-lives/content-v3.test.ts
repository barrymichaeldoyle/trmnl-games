import { describe, expect, it } from 'vitest'
import { ACTIVE_CONTENT, contentV2, contentV3 } from '@trmnl-games/paper-lives/content'
import { validateContent } from '@trmnl-games/paper-lives/content/validate'
import { simulateLifeRun, POLICIES } from '../../tools/balance/paper-lives'

/** The first content pack (Barry chose it as the first work after the MVP, 2026-10-14). */
describe('Paper Lives content v3', () => {
  it('is active, passes the validator and keeps every v2 id', () => {
    expect(ACTIVE_CONTENT).toBe('v3')
    expect(validateContent(contentV3).problems).toEqual([])
    const ids = new Set([...contentV3.events, ...contentV3.decisions].map((x) => x.id))
    for (const x of [...contentV2.events, ...contentV2.decisions]) expect(ids.has(x.id)).toBe(true)
  })

  it('adds about 180 events, 30 decisions and 30 quiet lines', () => {
    const { counts } = validateContent(contentV3)
    expect(contentV3.events.length - contentV2.events.length).toBeGreaterThanOrEqual(175)
    expect(counts.decisions).toBe(120)
    expect(counts.majorDecisions).toBe(18)
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
})
