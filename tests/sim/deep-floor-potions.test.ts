import { describe, expect, it } from 'vitest'
import { catalogs } from '@trmnl-games/desk-crawler/content'
import { validateCatalog } from '@trmnl-games/desk-crawler/content/validate'
import { simulateHero, SIMULATION_VERSION } from '@trmnl-games/desk-crawler/sim/core/simulate'
import { starterHero, starterKit } from '@trmnl-games/desk-crawler/sim/core/starter'
import type { ContentCatalog, ItemSnapshot } from '@trmnl-games/desk-crawler/sim/core/types'
import { seeds, withId } from './helpers'

const v27 = catalogs.v27
const v28 = catalogs.v28
const EPOCH = Date.UTC(2026, 10, 4)
const QUARTER = 15 * 60 * 1000

/** One exploring tick per seed on a floor; returns what each loot draw found. */
function lootFinds(content: ContentCatalog, biomeId: string, level: number, n: number) {
  const kit = starterKit(content)
  const inventory: ItemSnapshot[] = [withId(kit.weapon, 'i000'), withId(kit.armor, 'i001'), withId(kit.potions, 'i002')]
  const hero = { ...starterHero('hero1', content, 0), level, biomeId, weaponId: 'i000', armorId: 'i001' }
  const found: string[] = []
  const summaries: string[] = []
  for (let seed = 0; seed < n; seed += 1) {
    const result = simulateHero({ hero, inventory, tick: 1000, content, simulationVersion: SIMULATION_VERSION, streams: { ...seeds(seed), quest: seed + 11, raid: seed + 7 }, tickAt: EPOCH + 1000 * QUARTER })
    summaries.push(result.event?.summary ?? '')
    const outcome = result.event?.detail.outcome
    if (outcome?.variant === 'loot') found.push(outcome.found)
  }
  return { found, summaries }
}

const share = (found: readonly string[], kind: string) => found.filter((f) => f === kind).length / found.length

describe('deep-floor potion shares (D222)', () => {
  it('gives the Cafeteria, Archive and Garage their own loot shares, the extra potions taken from gold', () => {
    expect(validateCatalog(v28)).toEqual([])
    const shares = Object.fromEntries(v28.biomes.map((b) => [b.id, b.lootWeights ?? null]))
    expect(shares.office_cubicles).toBeNull()
    expect(shares.server_room).toBeNull()
    expect(shares.cafeteria_depths).toEqual({ ...v28.constants.lootWeights, potion: 35, gold: 40 })
    expect(shares.archive).toEqual({ ...v28.constants.lootWeights, potion: 45, gold: 30 })
    expect(shares.parking_garage).toEqual({ ...v28.constants.lootWeights, potion: 35, gold: 40 })
    expect(v27.biomes.every((b) => b.lootWeights === undefined)).toBe(true)
  })

  it('rejects floor shares that do not sum to 100 or offer a merchant the catalog has no rules for', () => {
    const archive = v28.biomes.find((b) => b.id === 'archive')!
    const withArchive = (content: ContentCatalog, lootWeights: NonNullable<typeof archive.lootWeights>) => validateCatalog({ ...content, biomes: content.biomes.map((b) => (b.id === 'archive' ? { ...b, lootWeights } : b)) })
    expect(withArchive(v28, { ...archive.lootWeights!, gold: 50 })).toContain('biome archive loot weights must sum to 100')
    const { merchant: _merchant, ...noMerchant } = v28
    expect(withArchive(noMerchant as ContentCatalog, archive.lootWeights!)).toContain('biome archive merchant loot weight needs merchant rules')
  })

  it('leaves floors without their own shares exactly as v27 plays them', () => {
    const a = lootFinds(v27, 'server_room', 8, 400)
    const b = lootFinds(v28, 'server_room', 8, 400)
    expect(b.summaries).toEqual(a.summaries)
  })

  it('finds potions more often in the Archive, in place of gold', () => {
    const before = lootFinds(v27, 'archive', 12, 2400).found
    const after = lootFinds(v28, 'archive', 12, 2400).found
    expect(share(before, 'potion')).toBeLessThan(0.26)
    expect(share(after, 'potion')).toBeGreaterThan(0.38)
    expect(share(after, 'gold')).toBeLessThan(share(before, 'gold'))
  })
})
