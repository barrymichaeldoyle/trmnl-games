import { describe, expect, it } from 'vitest'
import { contentV5, contentV6 } from '@trmnl-games/idle-angler/content'
import { allSatisfied } from '@trmnl-games/idle-angler/content/achievements'
import { anglerWords } from '@trmnl-games/idle-angler/i18n'
import { simulateAngler, starterAngler, waterOf, waterRankAt, waterRankFor, type AnglerState, type IdleAnglerCatalog, type WaterId } from '@trmnl-games/idle-angler/sim'
import { deriveAnglerSeeds, forecast } from '@trmnl-games/idle-angler/sim/seed'

/** A logbook holding the first `n` species of a water, in catalog order. */
const logged = (content: IdleAnglerCatalog, water: WaterId, n: number): AnglerState['logbook'] =>
  Object.fromEntries(content.species.filter((s) => s.water === water).slice(0, n).map((s) => [s.id, { count: 1, bestGrams: s.minGrams, firstTick: 0 }]))

describe('a rank at each water (D204)', () => {
  it('climbs from Visitor to Master by the share of the water logged, rounding up', () => {
    const at = (n: number, total: number) => waterRankAt(n, total).rank.id
    expect([0, 2, 3, 5, 7, 8, 9, 10].map((n) => at(n, 10))).toEqual(['visitor', 'visitor', 'angler', 'expert', 'expert', 'veteran', 'veteran', 'master'])
    expect(waterRankAt(4, 10).next).toEqual({ rank: expect.objectContaining({ id: 'expert' }), species: 5 })
    expect(waterRankAt(10, 10).next).toBeNull()
  })

  it('needs every species at the water for Master, the season visitor and the epic included', () => {
    for (const water of contentV6.waters) {
      const total = contentV6.species.filter((s) => s.water === water.id).length
      expect(waterRankFor(contentV6, logged(contentV6, water.id, total - 1), water.id).rank.id).toBe('veteran')
      expect(waterRankFor(contentV6, logged(contentV6, water.id, total), water.id)).toMatchObject({ logged: total, total, rank: { id: 'master' }, next: null })
    }
  })

  it('writes a milestone when a new species lifts the rank, under v6 only', () => {
    const story = (content: IdleAnglerCatalog, seed: number) => {
      // Two Millpond species short of Angler's three: the next new one lifts the rank.
      const angler: AnglerState = { ...starterAngler(content, 0), logbook: logged(content, 'millpond', 2), bait: { bread: 40, worms: 40 }, baitOnHook: 'bread' }
      const tickAt = Date.UTC(2026, 9, 19, 6) + seed * 15 * 60_000
      const result = simulateAngler({ angler, coolerCount: 0, tick: seed + 1, tickAt, weather: forecast(`r${seed}`, waterOf(content, 'millpond'), tickAt, content), content, streams: deriveAnglerSeeds(`r${seed}`, `a${seed}`, seed + 1, 1) })
      return [result.event, ...(result.extraEvents ?? [])].map((e) => e?.summary ?? '')
    }
    const firsts = Array.from({ length: 400 }, (_, seed) => seed).filter((seed) => story(contentV6, seed).some((line) => line.includes('in the logbook.') && line.startsWith('A')))
    expect(firsts.length).toBeGreaterThan(0)
    for (const seed of firsts) {
      expect(story(contentV6, seed)).toContain('Now an Angler at the Millpond, with 3 of 10 species logged there.')
      expect(story(contentV5, seed).some((line) => line.includes('species logged there'))).toBe(false)
    }
  })

  it('tells the rank in every language', () => {
    const line = 'Now an Expert at the charter, with 5 of 9 species logged there.'
    expect(anglerWords('en').retell(line)).toBe(line)
    expect(anglerWords('de').story(line)).toBe('Neuer Rang: Profi auf hoher See, mit 5 von 9 Arten im Fangbuch.')
    expect(anglerWords('fr').waterRank('master', 'millpond')).toBe('Maître à l’Étang du moulin')
  })

  it('earns Mastered waters at one, three and every water (achievements v6)', () => {
    const mastered = (waters: readonly WaterId[]) => {
      const logbook = Object.assign({}, ...waters.map((w) => logged(contentV6, w, 99)))
      return allSatisfied({ rodTier: 1, counters: starterAngler(contentV6, 0).counters, logbook, flies: 0 }, contentV6).map((a) => a.id).filter((id) => id.startsWith('mastered'))
    }
    const all = contentV6.waters.map((w) => w.id)
    expect(mastered([])).toEqual([])
    expect(mastered(['millpond'])).toEqual(['mastered_1'])
    expect(mastered(all.slice(0, 3))).toEqual(['mastered_1', 'mastered_2'])
    expect(mastered(all)).toEqual(['mastered_1', 'mastered_2', 'mastered_3'])
  })
})

describe('the rank on the device (D204, template v16)', () => {
  it('heads the screen with the rank at the angler water and counts that water in the ticks', async () => {
    const { buildPayload } = await import('@trmnl-games/idle-angler/payload')
    const { previewScenarios } = await import('@trmnl-games/idle-angler/templates/previewScenarios')
    const scenarios = previewScenarios('https://art.example')
    expect(buildPayload(scenarios.waterRank!)).toMatchObject({ title: 'Veteran', title_logged: 7, title_next_at: 9, title_pct: 0 })
    expect(buildPayload({ ...scenarios.waterRank!, locale: 'de' })).toMatchObject({ title: 'Veteran' })
    expect(buildPayload({ ...scenarios.waterRank!, locale: 'fr' })).toMatchObject({ title: 'Vétéran' })
    expect(buildPayload(scenarios.waterMaster!)).toMatchObject({ title: 'Master', title_next_at: null })
    // v5 and earlier keep the logbook title.
    expect(buildPayload({ ...scenarios.waterRank!, content: contentV5 })).toMatchObject({ title: 'Master Angler', title_logged: 31 })
  })
})
