import { describe, expect, it } from 'vitest'
import { contentV3, contentV4 } from '@trmnl-games/paper-lives/content'
import { validateContent } from '@trmnl-games/paper-lives/content/validate'
import { simulateLifeRun, POLICIES } from '../../tools/balance/paper-lives'

/** Choices that come back (Barry found a life dry, 2026-10-15): flags on childhood and teen options, and follow-ups. */
describe('Paper Lives content v4', () => {
  it('passes the validator and keeps every v3 id', () => {
    expect(validateContent(contentV4).problems).toEqual([])
    const ids = new Set([...contentV4.events, ...contentV4.decisions].map((x) => x.id))
    for (const x of [...contentV3.events, ...contentV3.decisions]) expect(ids.has(x.id)).toBe(true)
  })

  it('gives every childhood and teen choice that does something a follow-up, and follow-ups only to flags something sets', () => {
    const followed = new Set(contentV4.events.filter((e) => e.followUp).flatMap((e) => e.when?.flags ?? []))
    for (const d of contentV4.decisions.filter((d) => ['child', 'teen'].includes(d.stage as string))) {
      for (const o of d.options) if (o.effects?.flag?.startsWith('v4_')) expect(followed.has(o.effects.flag), `${d.id}.${o.id}`).toBe(true)
    }
    expect(contentV4.events.filter((e) => e.followUp).length).toBeGreaterThanOrEqual(50)
  })

  it('offers the toy shop sale only to a child who saved', () => {
    expect(contentV4.decisions.find((d) => d.id === 'ch3_toy_sale')?.when?.flags).toEqual(['v4_saved_jar'])
    expect(contentV4.decisions.find((d) => d.id === 'ch_pocket_money')?.options.find((o) => o.id === 'save')?.effects?.flag).toBe('v4_saved_jar')
  })

  it('pays choices off within a life, and gives childhood more decisions than v3', { timeout: 120_000 }, () => {
    const measure = (content: typeof contentV4) => {
      const lines = new Set(content.events.filter((e) => e.followUp && !e.line.includes('{')).map((e) => e.line))
      let followUps = 0
      let childhood = 0
      for (let i = 0; i < 40; i += 1) {
        const run = simulateLifeRun(POLICIES[0]!, i, 60, content, undefined, true)
        followUps += run.story.filter((e) => e.kind === 'event' && lines.has(e.summary)).length
        childhood += run.story.filter((e) => e.kind === 'decision_resolved' && e.age >= 6 && e.age <= 12).length
      }
      return { followUps: followUps / 40, childhood: childhood / 40 }
    }
    const v3 = measure(contentV3)
    const v4 = measure(contentV4)
    expect(v3.followUps).toBe(0)
    expect(v4.followUps).toBeGreaterThan(3)
    expect(v4.childhood).toBeGreaterThan(v3.childhood + 0.8)
  })
})
