import { describe, expect, it } from 'vitest'
import { classPose, heroPoses, poseParts, type BasePose } from '@trmnl-games/desk-crawler/art/hero'
import { heroHatAnchor } from '@trmnl-games/desk-crawler/art/occasions'
import { parseScenePath, renderScenePng } from '@trmnl-games/desk-crawler/art/route'
import { scenePlacements } from '@trmnl-games/desk-crawler/art/scene'
import { paintedScene } from '@trmnl-games/desk-crawler/art/sceneColour'
import { sceneFor, scenePath } from '@trmnl-games/desk-crawler/art/sceneKey'

const BASES: BasePose[] = ['idle', 'fight', 'walk', 'rest', 'sleep', 'knocked_out']
const HAIR = '#5a3a24'

describe('hero gender art (D149)', () => {
  it('draws every pose of both classes in the female look and leaves every male path as it was', () => {
    expect(sceneFor('exploring', false, null)).toEqual({ pose: 'idle', subject: { kind: 'none' } })
    expect(sceneFor('exploring', false, null, 'warrior', 'male')).toEqual({ pose: 'idle', subject: { kind: 'none' } })
    expect(sceneFor('exploring', false, null, 'warrior', 'female').pose).toBe('female_idle')
    expect(sceneFor('dead', false, null, 'rogue', 'female').pose).toBe('female_rogue_knocked_out')
    for (const heroClass of ['warrior', 'rogue'] as const) {
      for (const base of BASES) {
        const male = classPose(base, heroClass)
        const female = classPose(base, heroClass, 'female')
        expect(male).toBe(heroClass === 'warrior' ? base : `rogue_${base}`)
        expect(poseParts(female)).toEqual({ base, heroClass, gender: 'female' })
        // Hair is added to the male grid: same size, every male cell kept, and something new drawn.
        const [m, f] = [heroPoses[male], heroPoses[female]]
        expect([f.width, f.height]).toEqual([m.width, m.height])
        m.rows.forEach((row, y) => [...row].forEach((ch, x) => { if (ch !== ' ') expect(f.rows[y]![x]).toBe(ch) }))
        expect(f.rows).not.toEqual(m.rows)
        const path = scenePath('office_cubicles', female, { kind: 'none' }, 5)
        expect(parseScenePath(path)?.pose).toBe(female)
        expect(renderScenePng(path)).not.toBeNull()
        // Hats sit where the class wears them.
        expect(heroHatAnchor(female)).toEqual(heroHatAnchor(male))
      }
    }
  })

  it('keeps the Warrior’s cloak and paints the long hair brown', () => {
    const roles = (pose: 'idle' | 'female_idle') => scenePlacements(pose, { kind: 'none' }).map((p) => p.role)
    expect(roles('female_idle')).toEqual(roles('idle'))
    const hero = scenePlacements('female_idle', { kind: 'none' }).find((p) => p.role === 'hero')!
    // Row 7 of the grid, column 5: a hair cell only the female look has.
    expect(paintedScene('office_cubicles', 'female_idle', { kind: 'none' }, 'day')[hero.top + 7]![hero.left + 5]).toBe(HAIR)
    expect(paintedScene('office_cubicles', 'idle', { kind: 'none' }, 'day')[hero.top + 7]![hero.left + 5]).not.toBe(HAIR)
  })

  it('draws a coworker in its own look from the outcome’s rivalGender', () => {
    const meeting = (rivalGender?: 'female') => ({ kind: 'meeting', outcome: { variant: 'meeting', rivalClass: 'rogue', kindId: 'pep_talk', ...(rivalGender ? { rivalGender } : {}) } })
    const before = sceneFor('exploring', false, meeting())
    expect(before.subject).toEqual({ kind: 'coworker', heroClass: 'rogue', prop: 'whiteboard' })
    expect(scenePath('server_room', before.pose, before.subject, 5)).toBe('/art/scene/v5/server_room/day/plain/idle/coworker-rogue-whiteboard/5.png')
    const scene = sceneFor('exploring', false, meeting('female'), 'warrior', 'female')
    const path = scenePath('server_room', scene.pose, scene.subject, 5)
    expect(path).toBe('/art/scene/v5/server_room/day/plain/female_idle/coworker-female_rogue-whiteboard/5.png')
    expect(parseScenePath(path)?.subject).toEqual({ kind: 'coworker', heroClass: 'rogue', gender: 'female', prop: 'whiteboard' })
    expect(renderScenePng(path)).not.toBeNull()
    const found = sceneFor('exploring', false, { kind: 'lost_property', outcome: { variant: 'lost_property', rivalClass: 'warrior', rivalGender: 'female' } })
    expect(found.subject).toEqual({ kind: 'coworker', heroClass: 'warrior', gender: 'female', prop: 'lost_property' })
    expect(parseScenePath('/art/scene/v5/server_room/day/plain/idle/coworker-female_wizard/5.png')).toBeNull()
    expect(parseScenePath('/art/scene/v5/server_room/day/plain/idle/coworker-male_rogue/5.png')).toBeNull()
  })
})
