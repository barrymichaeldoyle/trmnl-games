import { describe, expect, it } from 'vitest'
import { ACHIEVEMENTS } from '@trmnl-games/idle-angler/content/achievements'
import { BADGE_FRAMES, BADGE_PICTURES, BADGE_SIZE, badgeCanvas, badgeLayers, frameForTier, hasBadge } from '@trmnl-games/idle-angler/art/badges'
import { badgeBase, renderIdleAnglerArt } from '@trmnl-games/idle-angler/art/route'

const ORIGIN = 'https://trmnlgames.com'

describe('Idle Angler badges (P48)', () => {
  it('draws every achievement family, so a new family cannot ship without its badge', () => {
    const families = [...new Set(ACHIEVEMENTS.map((a) => a.family))]
    expect(families.filter((family) => !hasBadge(family))).toEqual([])
  })

  it('keeps every picture 16x16 and inside the frame', () => {
    for (const [id, rows] of Object.entries(BADGE_PICTURES)) {
      expect(rows, id).toHaveLength(16)
      for (const row of rows) expect(row, id).toHaveLength(16)
    }
  })

  it('gives every frame a different ring, and the locked badge no solid ink in its picture', () => {
    const rings = BADGE_FRAMES.map((frame) => badgeLayers('catches', frame).frame.rows.join('\n'))
    expect(new Set(rings).size).toBe(BADGE_FRAMES.length)
    expect(badgeLayers('catches', 0).picture.rows.join('')).not.toContain('#')
  })

  it('gives a family\'s last tier the top frame and climbs to it from copper', () => {
    expect(frameForTier('catches', 0)).toBe(0)
    expect(frameForTier('catches', 3)).toBe(3)
    expect(frameForTier('catches', 5)).toBe(5)
    expect(frameForTier('seasons', 1)).toBe(5)
    expect(frameForTier('rods', 3)).toBe(3)
    expect(frameForTier('rods', 4)).toBe(5)
    expect(frameForTier('logbook', 6)).toBe(4)
    expect(frameForTier('species_pike', 1)).toBe(1)
    expect(frameForTier('species_pike', 2)).toBe(5)
  })

  it('cuts the top tier out of a solid disc on the device', () => {
    const canvas = badgeCanvas('medals', 5)
    const centre = Math.floor(BADGE_SIZE / 2)
    // The disc's edge is ink at the top tier and paper at the first.
    expect(canvas.ink[centre * BADGE_SIZE + 3]).toBe(1)
    expect(badgeCanvas('medals', 1).ink[centre * BADGE_SIZE + 6]).toBe(0)
  })

  it('serves allowlisted badges only', () => {
    const png = renderIdleAnglerArt(`${badgeBase('night_fishing', 2)}/3.png`, ORIGIN)
    expect(png?.immutable).toBe(true)
    expect(renderIdleAnglerArt(`${badgeBase('species_barbel', 5)}/2.png`, ORIGIN)).not.toBeNull()
    for (const bad of ['/art/ia/badge/v2/kraken/1/2.png', '/art/ia/badge/v2/species_kraken/1/2.png', '/art/ia/badge/v2/catches/6/2.png', '/art/ia/badge/v2/catches/1/7.png', '/art/ia/badge/v1/catches/1/2.png']) expect(renderIdleAnglerArt(bad, ORIGIN), bad).toBeNull()
  })
})

describe('Idle Angler badge panel (P48, template v26)', async () => {
  const { Liquid } = await import('liquidjs')
  const { buildPayload, badgeToShow, BADGE_WINDOW_MS } = await import('@trmnl-games/idle-angler/payload')
  const { previewScenarios, PREVIEW_NOW } = await import('@trmnl-games/idle-angler/templates/previewScenarios')
  const { screenMarkup } = await import('@trmnl-games/idle-angler/templates/screen')
  const scenarios = previewScenarios('https://art.example')
  const liquid = new Liquid({ timezoneOffset: 0 })

  it('celebrates the highest frame first, then the newest, and counts the rest', () => {
    const now = PREVIEW_NOW
    expect(badgeToShow([{ achievementId: 'first_perch', at: now - 1000 }, { achievementId: 'specimen_perch', at: now - 5000 }, { achievementId: 'catches_1', at: now - 100 }], now)).toMatchObject({ def: { id: 'specimen_perch' }, frame: 5, more: 2 })
    expect(badgeToShow([{ achievementId: 'catches_1', at: now - 5000 }, { achievementId: 'got_away_1', at: now - 100 }], now)).toMatchObject({ def: { id: 'got_away_1' }, more: 1 })
    expect(badgeToShow([{ achievementId: 'catches_1', at: now - BADGE_WINDOW_MS - 1 }], now)).toBeNull()
    expect(badgeToShow([{ achievementId: 'not_a_badge', at: now }], now)).toBeNull()
  })

  it('sends the badge with its art, name and tag, and holds it back under an attention line', () => {
    expect(buildPayload(scenarios.badge!).badge).toEqual({ name: 'Night Owl', label: 'Achievement', more: 0, more_label: null, base: 'https://art.example/art/ia/badge/v2/night_fishing/2' })
    expect(buildPayload(scenarios.badgeSpecies!).badge).toMatchObject({ name: 'Specimen Perch', more_label: '+2 more', base: 'https://art.example/art/ia/badge/v2/species_perch/5' })
    expect(buildPayload({ ...scenarios.badge!, locale: 'de' }).badge).toMatchObject({ label: 'Erfolg' })
    expect(buildPayload(scenarios.badgeBareHook!).badge).toBeNull()
    expect(buildPayload(scenarios.catch!).badge).toBeNull()
  })

  it('draws the badge in every layout, served by the art route', async () => {
    const payload = { ...buildPayload(scenarios.badgeSpecies!), fly_code: null }
    for (const [layout, markup] of Object.entries(screenMarkup)) {
      const html = await liquid.parseAndRender(markup, payload)
      expect(html, layout).toContain('data-badge="true"')
      expect(html, layout).toContain('Specimen Perch')
      for (const [, path] of html.matchAll(/src="https:\/\/art\.example(\/art\/ia\/badge\/[^"]+)"/g)) expect(renderIdleAnglerArt(path!, ORIGIN), path).not.toBeNull()
    }
  })
})

describe('Idle Angler profile badges (P48 B5)', async () => {
  const { showcaseBadges } = await import('@trmnl-games/idle-angler/art/badges')
  it('shows each family once at its best tier, finished families then the rarest first, six at most', () => {
    const ids = ['catches_1', 'catches_2', 'seasons_1', 'got_away_1', 'night_fishing_1', 'first_perch', 'specimen_perch', 'sales_1', 'orders_1', 'flies_1']
    const shown = showcaseBadges(ids, { got_away_1: 30, night_fishing_1: 2, sales_1: 10 })
    expect(shown).toHaveLength(6)
    expect(shown.slice(0, 2).map((b) => b.id).sort()).toEqual(['seasons_1', 'specimen_perch'])
    expect(shown.find((b) => b.family === 'catches')).toMatchObject({ tier: 2 })
    // Among the unfinished first tiers, the rarest come first; ones nobody has counted yet go after.
    expect(shown.indexOf(shown.find((b) => b.id === 'night_fishing_1')!)).toBeLessThan(shown.indexOf(shown.find((b) => b.id === 'got_away_1')!))
    expect(showcaseBadges([])).toEqual([])
  })
})
