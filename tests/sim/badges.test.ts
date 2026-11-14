import { describe, expect, it } from 'vitest'
import { ACHIEVEMENTS } from '@trmnl-games/desk-crawler/content/achievements'
import { BADGE_FRAMES, BADGE_PICTURES, BADGE_SIZE, badgeCanvas, badgeColourLayers, badgeLayers, frameForTier, hasBadge, showcaseBadges } from '@trmnl-games/desk-crawler/art/badges'
import { badgeBase, renderBadgePng } from '@trmnl-games/desk-crawler/art/route'

describe('Desk Crawler badges (P49 C1)', () => {
  const families = [...new Set(ACHIEVEMENTS.map((a) => a.family))]

  it('draws every family, so a new one cannot ship without its badge; monsters come from their sprites', () => {
    expect(families.filter((family) => !hasBadge(family))).toEqual([])
    expect(families.filter((family) => family.startsWith('slay_') && family in BADGE_PICTURES)).toEqual([])
  })

  it('keeps every picture inside 20x20', () => {
    for (const [id, rows] of Object.entries(BADGE_PICTURES)) {
      expect(rows.length, id).toBeLessThanOrEqual(20)
      for (const row of rows) expect(row.length, id).toBeLessThanOrEqual(20)
    }
  })

  it('gives every frame a different ring, and every family the same "?" while locked', () => {
    expect(new Set(BADGE_FRAMES.map((frame) => badgeLayers('gold', frame).frame.rows.join('\n'))).size).toBe(BADGE_FRAMES.length)
    const locked = (family: string) => Buffer.from(badgeCanvas(family, 0).ink).toString('hex')
    expect(new Set(families.map(locked)).size).toBe(1)
  })

  it('gives a family\'s last tier the top frame', () => {
    expect(frameForTier('office_census', 1)).toBe(5)
    expect(frameForTier('adventures', 3)).toBe(3)
    expect(frameForTier('adventures', 5)).toBe(5)
    expect(frameForTier('slay_paper_imp', 0)).toBe(0)
  })

  it('paints the locked badge in the muted tone and an earned one on its disc', () => {
    expect(badgeColourLayers('gold', 0)[0]!.tones).toEqual({})
    expect(badgeColourLayers('gold', 3)[1]!.tones.ink).toBe('#e0a92a')
  })

  it('serves allowlisted badges only, at 40 pixels a scale', () => {
    expect(renderBadgePng(`${badgeBase('slay_paper_imp', 5)}/2.png`)).not.toBeNull()
    expect(badgeCanvas('gold', 1).width).toBe(BADGE_SIZE)
    for (const bad of ['/art/badge/v1/kraken/1/2.png', '/art/badge/v1/slay_kraken/1/2.png', '/art/badge/v1/gold/6/2.png', '/art/badge/v1/gold/1/9.png', '/art/badge/v2/gold/1/2.png']) expect(renderBadgePng(bad), bad).toBeNull()
  })

  it('shows six on a profile, finished families first', () => {
    const shown = showcaseBadges(['office_census', 'adventures_1', 'adventures_2', 'gold_1', 'levels_1', 'potions_1', 'traps_1', 'breaks_1'])
    expect(shown).toHaveLength(6)
    expect(shown[0]).toMatchObject({ family: 'office_census' })
    expect(shown.find((b) => b.family === 'adventures')).toMatchObject({ tier: 2 })
  })
})
