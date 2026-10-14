import { describe, expect, it } from 'vitest'
import { POLICIES, nextGeneration, runHarness, simulateLifeRun } from '../../tools/balance/paper-lives'

describe('Paper Lives balance harness', () => {
  it('is deterministic per life and policy', () => {
    expect(simulateLifeRun(POLICIES[0]!, 3, 20)).toEqual(simulateLifeRun(POLICIES[0]!, 3, 20))
  })

  it('lives an hourly life faster than a never-visiting one', () => {
    const hourly = simulateLifeRun(POLICIES[0]!, 1, 60)
    const never = simulateLifeRun(POLICIES[2]!, 1, 60)
    const perYear = (run: typeof hourly) => run.years.reduce((s, y) => s + y.ticks, 0) / run.years.length
    expect(perYear(hourly)).toBeLessThan(perYear(never))
    expect(never.years.every((y) => y.ticks === 32 || y.ticks < 32)).toBe(true)
  })

  it('carries a family into the next generation', () => {
    for (let i = 0; i < 20; i += 1) {
      const run = simulateLifeRun(POLICIES[0]!, i, 60)
      const next = nextGeneration(run)
      if (!next) continue
      expect(next.generation).toBe(run.record!.generation + 1)
      expect(next.last).toBe(run.record!.last)
      const after = simulateLifeRun(POLICIES[0]!, 1000 + i, 60, undefined, next)
      expect(after.record?.generation ?? next.generation).toBe(next.generation)
      return
    }
    throw new Error('no life with children in twenty')
  })

  it('reports every gate with a value', () => {
    const report = runHarness(12, 60)
    expect(report.gates.length).toBe(13)
    expect(report.gates.filter((g) => g.name.startsWith('Median')).every((g) => g.value !== null)).toBe(true)
  }, 120_000)
})
