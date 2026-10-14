import { describe, expect, it } from 'vitest'
import { Canvas } from '@trmnl-games/engine/art/canvas'
import { anglerPoses } from '@trmnl-games/idle-angler/art/angler'
import { FISH_TRAITS } from '@trmnl-games/idle-angler/art/fish'
import { sceneBase } from '@trmnl-games/idle-angler/art/route'
import { anglerPlacement, composeScene, STAGE_HEIGHT, STAGE_WIDTH, type SceneKey } from '@trmnl-games/idle-angler/art/scene'
import { paintedScene, paintedSceneUri, sceneBands, sceneKeyFromUrl } from '@trmnl-games/idle-angler/art/sceneColour'
import { FISH_TONES, FLY_TONES, fishTones } from '@trmnl-games/idle-angler/art/tones'
import { contentV1 } from '@trmnl-games/idle-angler/content'
import { FLIES } from '@trmnl-games/idle-angler/content/flies'

const waters = ['millpond', 'river_bend', 'harbour_pier'] as const
const bands = ['dawn', 'day', 'dusk', 'night'] as const
const weathers = ['clear', 'overcast', 'rain', 'wind', 'fog'] as const

describe('companion painted scene', () => {
  it('paints the angler in parts, the backdrop in its own tones and leaves the sky and water clear for the bands', () => {
    const key: SceneKey = { water: 'millpond', band: 'day', weather: 'clear', pose: 'waiting', fish: null }
    const grid = paintedScene(key)
    const angler = anglerPlacement(key)
    const at = (x: number, y: number) => grid[angler.top + y]![angler.left + x]
    expect(at(5, 1)).toBe('#7a8a4a') // hat crown
    expect(at(5, 3)).toBe('#f2c39b') // face
    expect(['#3f6b5a', '#5f8f7a']).toContain(at(5, 8)) // jacket
    expect(['#3a4a5c', '#55697f']).toContain(at(4, 14)) // waders
    expect(at(3, 20)).toBe('#1b1530') // boots
    // The sun's disc is gold, the grass bank green, and the open sky clear.
    expect(grid[5]![131]).toBe('#ffe08f')
    expect(['#5aa348', '#8fd36b']).toContain(grid[36]![20])
    expect(grid[1]![70]).toBeNull()
    expect(grid[30]![140]).toBeNull()
  })

  it('tones the night and a held fish in its species colours', () => {
    const night = paintedScene({ water: 'river_bend', band: 'night', weather: 'clear', pose: 'paused', fish: null })
    expect(night[3]![130]).toBe('#f4e7b0') // moon
    expect(night.flat()).toContain('#ffe08f') // stars
    const holding: SceneKey = { water: 'harbour_pier', band: 'day', weather: 'clear', pose: 'holding', fish: 'golden_carp' }
    const held = paintedScene(holding).flat()
    for (const tone of [fishTones('golden_carp').paper, ...fishTones('golden_carp').shade]) expect(held).toContain(tone)
    expect(sceneBands(holding)).toEqual({ sky: '#a8d8f0', water: '#3f80b8' })
    expect(sceneBands({ ...holding, weather: 'fog', band: 'night' })).toEqual({ sky: '#262a44', water: '#1b2f52' })
  })

  it('draws the same 1-bit image on the painted canvas as on the device', () => {
    for (const water of waters)
      for (const band of bands)
        for (const weather of weathers)
          for (const pose of Object.keys(anglerPoses) as Array<keyof typeof anglerPoses>) {
            const key: SceneKey = { water, band, weather, pose, fish: pose === 'holding' ? 'pike' : null, fly: 'zulu' }
            const grid = paintedScene(key)
            const device = composeScene(key, new Canvas(STAGE_WIDTH, STAGE_HEIGHT))
            expect(grid).toHaveLength(STAGE_HEIGHT)
            // Every inked device cell is painted; the painted scene adds paper and shade tones but never loses ink.
            for (let y = 0; y < STAGE_HEIGHT; y += 1) for (let x = 0; x < STAGE_WIDTH; x += 1) if (device.ink[y * STAGE_WIDTH + x]) expect(grid[y]![x]).not.toBeNull()
          }
    // At another stage width (D125) the painted scene is the device's composition at that width, column for column.
    for (const width of [120, 220]) {
      const key: SceneKey = { water: 'harbour_pier', band: 'dawn', weather: 'fog', pose: 'waiting', fish: null, fly: null }
      const grid = paintedScene(key, width)
      const device = composeScene(key, new Canvas(width, STAGE_HEIGHT))
      expect(grid[0]).toHaveLength(width)
      for (let y = 0; y < STAGE_HEIGHT; y += 1) for (let x = 0; x < width; x += 1) if (device.ink[y * width + x]) expect(grid[y]![x], `${width}:${x},${y}`).not.toBeNull()
      expect(paintedSceneUri(key, width)).toMatch(/^data:image\/png;base64,/)
    }
  })

  it('reads the scene key back from a device image URL and encodes a PNG', () => {
    const key: SceneKey = { water: 'river_bend', band: 'dusk', weather: 'rain', pose: 'holding', fish: 'salmon', fly: 'zulu' }
    expect(sceneKeyFromUrl(`https://art.test${sceneBase(key)}/182/3.png?x=1`)).toEqual({ ...key, season: null })
    expect(sceneKeyFromUrl(`${sceneBase({ ...key, season: 'autumn' })}/182/3.png`)).toEqual({ ...key, season: 'autumn' })
    expect(sceneKeyFromUrl(`${sceneBase(key)}/182/7.png`)).toBeNull()
    expect(sceneKeyFromUrl(`${sceneBase(key)}/3.png`)).toBeNull()
    expect(sceneKeyFromUrl('/art/ia/scene/v3/ocean/day/clear/waiting/none/nofly/152/3.png')).toBeNull()
    expect(paintedSceneUri(key)).toMatch(/^data:image\/png;base64,/)
  })

  it('names tones for every species and every fly', () => {
    for (const species of contentV1.species) expect(FISH_TONES[species.id], species.id).toBeDefined()
    for (const id of Object.keys(FISH_TRAITS)) expect(FISH_TONES[id], id).toBeDefined()
    for (const fly of FLIES) expect(FLY_TONES[fly.id], fly.id).toBeDefined()
  })
})
