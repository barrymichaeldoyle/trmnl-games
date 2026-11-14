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
    for (const bad of ['/art/ia/badge/v1/kraken/1/2.png', '/art/ia/badge/v1/species_kraken/1/2.png', '/art/ia/badge/v1/catches/6/2.png', '/art/ia/badge/v1/catches/1/7.png', '/art/ia/badge/v2/catches/1/2.png']) expect(renderIdleAnglerArt(bad, ORIGIN), bad).toBeNull()
  })
})
