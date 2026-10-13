import { describe, expect, it } from 'vitest'
import { contentV19 } from '@trmnl-games/desk-crawler/content/v19'
import { heroPoses, type HeroPose } from '@trmnl-games/desk-crawler/art/hero'
import { monsterArt } from '@trmnl-games/desk-crawler/art/monsters'
import { DRESSING, isOccasionArt, OCCASION_ARTS } from '@trmnl-games/desk-crawler/art/occasions'
import { parseScenePath, renderScenePng } from '@trmnl-games/desk-crawler/art/route'
import { composeScene, scenePlacements, STAGE_HEIGHT, STAGE_WIDTH, type BiomeArt } from '@trmnl-games/desk-crawler/art/scene'
import { paintedSceneUri } from '@trmnl-games/desk-crawler/art/sceneColour'
import { scenePath } from '@trmnl-games/desk-crawler/art/sceneKey'
import { Canvas } from '@trmnl-games/desk-crawler/art/canvas'
import { buildPayload, sceneOccasion, type PayloadInput } from '@trmnl-games/desk-crawler/payload'

const BIOMES: BiomeArt[] = ['office_cubicles', 'server_room', 'cafeteria_depths', 'archive', 'parking_garage']
const POSES = Object.keys(heroPoses) as HeroPose[]
const noon = (date: string) => Date.parse(`${date}T12:00:00Z`)

describe('occasion dressing (D139)', () => {
  it('has art for every occasion in the catalog and nothing else', () => {
    expect(contentV19.occasions!.map((rule) => rule.id).sort()).toEqual([...OCCASION_ARTS].sort())
    for (const id of OCCASION_ARTS) expect(isOccasionArt(id)).toBe(true)
    expect(isOccasionArt('plain')).toBe(false)
  })

  it('keeps every prop and hat inside the stage on every floor and pose', () => {
    for (const occasion of OCCASION_ARTS) {
      expect(DRESSING[occasion].prop.width).toBeLessThanOrEqual(20)
      expect(DRESSING[occasion].prop.height).toBeLessThanOrEqual(16)
      for (const pose of POSES) {
        for (const subject of [{ kind: 'none' } as const, { kind: 'monster', id: 'auditor', elite: false } as const]) {
          for (const placement of scenePlacements(pose, subject, occasion)) {
            expect(placement.left).toBeGreaterThanOrEqual(0)
            expect(placement.top).toBeGreaterThanOrEqual(0)
            expect(placement.left + placement.sprite.width).toBeLessThanOrEqual(STAGE_WIDTH)
            expect(placement.top + placement.sprite.height).toBeLessThanOrEqual(STAGE_HEIGHT)
          }
        }
      }
    }
  })

  it('dresses a scene only when an occasion is given, and serves a v5 path for each', () => {
    for (const biome of BIOMES) {
      const plain = composeScene(biome, 'fight', { kind: 'monster', id: 'paper_imp', elite: false }, 'night')
      expect(composeScene(biome, 'fight', { kind: 'monster', id: 'paper_imp', elite: false }, 'night', new Canvas(STAGE_WIDTH, STAGE_HEIGHT), undefined).ink).toEqual(plain.ink)
      for (const occasion of OCCASION_ARTS) {
        const path = scenePath(biome, 'fight', { kind: 'monster', id: 'paper_imp', elite: false }, 5, 'night', occasion)
        expect(parseScenePath(path)?.occasion).toBe(occasion)
        const dressed = composeScene(biome, 'fight', { kind: 'monster', id: 'paper_imp', elite: false }, 'night', new Canvas(STAGE_WIDTH, STAGE_HEIGHT), occasion)
        expect(dressed.ink).not.toEqual(plain.ink)
        expect(renderScenePng(path)).not.toBeNull()
        expect(renderScenePng(path.replace('/5.png', '/5-bwry.png'))).not.toBeNull()
        expect(paintedSceneUri(path)).toMatch(/^data:image\/png;base64,/)
      }
    }
  })

  it('stands the prop in the foe’s place on an empty stage, and keeps an elite’s crown instead of a hat', () => {
    const empty = scenePlacements('idle', { kind: 'none' }, 'halloween').find((p) => p.role === 'decor' && p.id === 'halloween:prop')!
    const busy = scenePlacements('idle', { kind: 'monster', id: 'paper_imp', elite: false }, 'halloween').find((p) => p.role === 'decor' && p.id === 'halloween:prop')!
    expect(empty.left).toBeGreaterThan(busy.left)
    const elite = scenePlacements('fight', { kind: 'monster', id: 'paper_imp', elite: true }, 'christmas')
    expect(elite.some((p) => p.role === 'crown')).toBe(true)
    expect(elite.some((p) => p.role === 'decor' && p.id === 'christmas:monsterHat')).toBe(false)
    for (const id of Object.keys(monsterArt) as (keyof typeof monsterArt)[]) {
      expect(scenePlacements('fight', { kind: 'monster', id, elite: false }, 'christmas').some((p) => p.role === 'decor' && p.id === 'christmas:monsterHat')).toBe(true)
    }
  })

  it('picks the occasion on the device’s local date, and plain on an ordinary day', () => {
    expect(sceneOccasion(contentV19, noon('2026-10-31'), 0)).toBe('halloween')
    expect(sceneOccasion(contentV19, Date.parse('2026-10-30T23:30:00Z'), 3600)).toBe('halloween')
    expect(sceneOccasion(contentV19, noon('2026-10-20'), 0)).toBeUndefined()
    const at = (now: number): PayloadInput => ({
      now,
      world: { currentTick: 1, lastCompletedTick: 1, lastCompletedAt: now - 60_000, createdAt: now - 3_600_000, ticksPaused: false, maintenanceMode: false },
      ownerAlias: 'Ana',
      timezone: 'UTC',
      utcOffset: 0,
      hero: { name: 'Baz', level: 1, xp: 0, hp: 60, gold: 0, status: 'exploring', biomeId: 'office_cubicles', lastTick: 0, quarantined: false },
      weaponName: null,
      armorName: null,
      weaponAttack: 0,
      armorDefense: 0,
      potions: 3,
      bagUsed: 0,
      bagCapacity: 10,
      heldItemName: null,
      logs: [],
      instanceName: 'Desk Crawler',
      content: contentV19,
      spriteBaseUrl: null,
      artBaseUrl: 'https://art.test',
      latestEvent: null,
      ranking: null,
    })
    const url = (now: number) => (buildPayload(at(now)) as unknown as { scene_url: string }).scene_url
    expect(url(noon('2026-12-25'))).toContain('/day/christmas/')
    expect(url(noon('2026-12-28'))).toContain('/day/plain/')
  })
})
