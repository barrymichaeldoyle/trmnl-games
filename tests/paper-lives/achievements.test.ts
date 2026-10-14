import { describe, expect, it } from 'vitest'
import { ACHIEVEMENTS, allSatisfied, emptyCareer, familyProgress, setPiecesOf, withLife } from '@trmnl-games/paper-lives/content/achievements'
import { contentV1 } from '@trmnl-games/paper-lives/content'
import { starterLife } from '@trmnl-games/paper-lives/sim'

const life = starterLife(contentV1, 3).life

describe('Paper Lives achievements', () => {
  it('has unique ids, about 130 of them, with a tier per job', () => {
    expect(new Set(ACHIEVEMENTS.map((a) => a.id)).size).toBe(ACHIEVEMENTS.length)
    expect(ACHIEVEMENTS.length).toBeGreaterThanOrEqual(120)
    for (const job of contentV1.jobs) expect(ACHIEVEMENTS.some((a) => a.id === `job_${job.id}`)).toBe(true)
  })

  it('adds a life to a career once, keeping distinct jobs, hobbies and traits', () => {
    const lived = { ...life, age: 81, status: 'ended' as const, generation: 2, jobYears: { nurse: 22, barista: 3 }, hobby: 'chess', hobbiesHad: ['chess', 'running'], counters: { ...life.counters, yearsLived: 81, childrenRaised: 2, peakMoney: 120_000, decisionsChosen: 30 } }
    const career = withLife(emptyCareer(), lived, true)
    expect(career).toMatchObject({ livesEnded: 1, yearsLived: 81, oldestAge: 81, highestGeneration: 2, childrenRaised: 2, peakMoney: 120_000, jobs: ['barista', 'nurse'], longJobs: ['nurse'], hobbies: ['chess', 'running'] })
    const twice = withLife(career, { ...lived, generation: 3, jobYears: { nurse: 1 } }, true)
    expect(twice).toMatchObject({ livesEnded: 2, yearsLived: 162, highestGeneration: 3, jobs: ['barista', 'nurse'] })
    const ids = allSatisfied(career).map((a) => a.id)
    expect(ids).toEqual(expect.arrayContaining(['lives_1', 'years_1', 'long_life_2', 'generations_1', 'family_1', 'fortune_2', 'job_nurse', 'job_nurse_20', 'job_barista', 'decisions_2']))
    expect(ids).not.toContain('job_barista_20')
  })

  it('finds set pieces in a life', () => {
    expect(setPiecesOf({ ...life, age: 60, stats: { health: 90, happiness: 90, smarts: 90, charm: 90 } })).toContain('all_round')
    const ended = { ...life, age: 70, status: 'ended' as const, home: 'family' as const, will: 'cause' as const, pet: { kind: 'dog', name: 'Rex', bornAt: 60, lifespan: 14, relationship: 70 }, death: { cause: 'summit', line: '', epitaph: '' } }
    expect(setPiecesOf(ended)).toEqual(expect.arrayContaining(['homebody', 'will_cause', 'loyal_dog', 'cause_summit']))
    for (const piece of setPiecesOf(ended)) expect(ACHIEVEMENTS.some((a) => a.id === `piece_${piece}`)).toBe(true)
  })

  it('reports each family’s progress towards its next tier', () => {
    const progress = familyProgress(withLife(emptyCareer(), { ...life, counters: { ...life.counters, yearsLived: 30 } }, false), new Set())
    expect(progress.find((f) => f.family === 'years')).toMatchObject({ value: 30, target: 50, earned: null })
  })
})
