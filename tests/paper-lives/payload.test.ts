import { describe, expect, it } from 'vitest'
import { contentV1 } from '@trmnl-games/paper-lives/content'
import { buildPayload, generationLabel, MAX_LINES, statusLine } from '@trmnl-games/paper-lives/payload'
import { starterLife, type LifeState } from '@trmnl-games/paper-lives/sim'

const base = starterLife(contentV1, 5).life
const at = Date.UTC(2026, 10, 2, 6, 10)
const input = (state: Partial<LifeState>, extra: Partial<Parameters<typeof buildPayload>[0]> = {}) =>
  buildPayload({
    content: contentV1,
    now: at,
    world: { createdAt: at - 60_000, lastCompletedAt: at - 60_000, paused: false },
    life: { state: { ...base, ...state }, activationState: 'active', quarantined: false, ordinal: 1, closesAt: at + 8 * 3_600_000, minimumAt: at + 2 * 3_600_000 },
    stories: [],
    board: null,
    artBaseUrl: null,
    ...extra,
  })

describe('Paper Lives payload v1', () => {
  it('names the generation and writes a status line without pronouns', () => {
    expect(generationLabel(3, 'Okafor')).toBe('Third of the Okafors')
    expect(generationLabel(2, 'Moss')).toBe('Second of the Mosses')
    expect(generationLabel(14, 'Tan')).toBe('14th of the Tans')
    expect(statusLine({ ...base, first: 'Maud', last: 'Okafor', age: 34, stage: 'adult', job: 'nurse', home: 'renting' }, contentV1)).toBe('Maud Okafor, 34, nurse, renting')
    for (const pronouns of ['they', 'she', 'he'] as const) expect(statusLine({ ...base, pronouns, age: 34, stage: 'adult', home: 'owned' }, contentV1)).not.toMatch(/\b(they|she|he|her|his|their)\b/)
  })

  it('shows the open decision and only the current life’s lines', () => {
    const payload = input(
      { age: 18, stage: 'young', year: { ...base.year, pending: { decisionId: 'yg_education' } } },
      {
        stories: [
          { kind: 'decision_offered', glyph: 'book', age: 18, summary: 'Eighteen. University, a trade, or straight to work?', at, ordinal: 1 },
          { kind: 'event', glyph: 'star', age: 18, summary: 'Bought a fern.', at, ordinal: 1 },
          { kind: 'event', glyph: 'star', age: 70, summary: 'A line from the last life.', at, ordinal: 0 },
        ],
      },
    )
    expect(payload).toMatchObject({ status: 'living', decision: { age: 18, prompt: 'Eighteen. University, a trade, or straight to work?', major: true } })
    expect(payload.lines).toEqual([{ age: 18, glyph: 'star', summary: 'Bought a fern.', head: 'Age 18 · this year', marks: [], money: null }])
  })

  it('sends the newest twenty-four lines, each layout showing as many as fit (template v4)', () => {
    const stories = Array.from({ length: 30 }, (_, i) => ({ kind: 'event', glyph: 'star' as const, age: 40 - i, summary: `Line ${i}.`, at, ordinal: 1 }))
    const payload = input({ age: 40, stage: 'adult' }, { stories })
    expect(payload.lines).toHaveLength(MAX_LINES)
    expect(MAX_LINES).toBe(24)
    expect(payload.lines.at(-1)).toMatchObject({ summary: 'Line 23.' })
  })

  it('heads each age once, newest first, and marks what each line changed (template v7)', () => {
    const story = (age: number, summary: string, changes?: { stats?: Record<string, number>; gold?: number }) => ({ kind: 'event', glyph: 'star' as const, age, summary, at, ordinal: 1, ...(changes ? { changes } : {}) })
    const payload = input(
      { age: 9, stage: 'child' },
      { stories: [story(9, 'A sleepover.', { stats: { charm: 2, health: -1 } }), story(9, 'A library card.', { stats: { smarts: 5 } }), story(8, 'Found a pound.', { gold: 1_500 }), story(8, 'Rain.', { stats: { happiness: -7 }, gold: -40 })] },
    )
    expect(payload.lines.map((l) => [l.head, l.marks.map((m) => `${m.k}${m.sign}`).join(' '), l.money])).toEqual([
      ['Age 9 · this year', 'health- charm+', null],
      [null, 'smarts++', null],
      ['Age 8', '', '+1,500'],
      [null, 'happiness--', '-40'],
    ])
    // Once the year has turned, last year's lines head as plain ages.
    expect(input({ age: 10, stage: 'child' }, { stories: [story(9, 'A sleepover.')] }).lines[0]?.head).toBe('Age 9')
  })

  it('turns an ended life into a memorial and flags a stalled world', () => {
    const ended = input({ status: 'ended', age: 81, death: { cause: 'sleep', line: 'Died in their sleep at 81.', epitaph: 'A good neighbour for a long time.' } })
    expect(ended).toMatchObject({ status: 'ended', status_label: 'A life remembered', decision: null, closes_at: null, memorial: { age: 81, epitaph: 'A good neighbour for a long time.' } })
    const stale = input({}, { world: { createdAt: at - 3_600_000, lastCompletedAt: at - 3_600_000, paused: false } })
    expect(stale).toMatchObject({ stale: true, attention: 'Updates are delayed.' })
  })
})
