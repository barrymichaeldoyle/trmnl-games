import { describe, expect, it } from 'vitest'
import { buildPayload } from '@trmnl-games/desk-crawler/payload'
import { previewScenarios } from '@trmnl-games/desk-crawler/templates/previewScenarios'
import { DEVICE_WORDS, deviceArea } from '@trmnl-games/desk-crawler/i18n/device'

const { groups } = previewScenarios(null)
const states = groups.states

describe('the TRMNL screen in the owner’s language (D169)', () => {
  it('stays word for word in English without a locale', () => {
    const plain = buildPayload(states.normal!)
    expect(buildPayload({ ...states.normal!, locale: 'en' })).toEqual(plain)
    expect(plain.status_label).toBe('Exploring the [[Server Room]]')
    expect(plain.labels).toEqual(DEVICE_WORDS.en.labels)
  })

  it('tells the status, the stories and the labels in French and German', () => {
    const french = buildPayload({ ...states.normal!, locale: 'fr' })
    expect(french.status_label).toBe('Explore la [[Salle des serveurs]]')
    expect(french.labels.bag_full).toBe('Sac plein')
    expect(french.log[0]!.n).not.toBe(buildPayload(states.normal!).log[0]!.n)
    const german = buildPayload({ ...states.travelling!, locale: 'de' })
    expect(german.status_label).toBe('Unterwegs in die [[Kantinentiefen]]')
    expect(buildPayload({ ...states.dead!, locale: 'de' }).status_label).toMatch(/^K\. o\. Zurück in etwa/)
  })

  it('keeps the English unit on changes the template draws as a mark', () => {
    const french = buildPayload({ ...states.normal!, locale: 'fr' })
    for (const entry of french.log) for (const change of entry.d.split(' · ').filter(Boolean)) expect(change).not.toMatch(/\b(?:or|PV)$/)
  })

  it('puts an area’s article outside its bold marks', () => {
    expect(deviceArea('fr', 'Archive', 'object')).toBe('les [[Archives]]')
    expect(deviceArea('de', 'Server Room', 'at')).toBe('im [[Serverraum]]')
    expect(deviceArea('en', 'Archive', 'at')).toBe('[[Archive]]')
  })
})
