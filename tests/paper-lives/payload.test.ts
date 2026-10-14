import { describe, expect, it } from 'vitest'
import { contentV1 } from '@trmnl-games/paper-lives/content'
import { buildPayload, generationLabel, statusLine } from '@trmnl-games/paper-lives/payload'
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
    expect(payload.lines).toEqual([{ age: 18, glyph: 'star', summary: 'Bought a fern.' }])
  })

  it('turns an ended life into a memorial and flags a stalled world', () => {
    const ended = input({ status: 'ended', age: 81, death: { cause: 'sleep', line: 'Died in their sleep at 81.', epitaph: 'A good neighbour for a long time.' } })
    expect(ended).toMatchObject({ status: 'ended', status_label: 'A life remembered', decision: null, closes_at: null, memorial: { age: 81, epitaph: 'A good neighbour for a long time.' } })
    const stale = input({}, { world: { createdAt: at - 3_600_000, lastCompletedAt: at - 3_600_000, paused: false } })
    expect(stale).toMatchObject({ stale: true, attention: 'Updates are delayed.' })
  })
})
