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

  it('leaves floors without their own shares exactly as v27 plays them, but for the merchant\'s longer stay', () => {
    // A merchant line names its stay ("Open for 4 adventures" against 32); every other line matches seed by seed.
    const stay = (line: string) => line.replace(/\b(4|32) adventures/, 'N adventures')
    const a = lootFinds(v27, 'server_room', 8, 400)
    const b = lootFinds(v28, 'server_room', 8, 400)
    expect(b.found).toEqual(a.found)
    expect(b.summaries.map(stay)).toEqual(a.summaries.map(stay))
    expect(a.summaries.some((line) => line.includes('Merchant'))).toBe(true)
  })

  it('finds potions more often in the Archive, in place of gold', () => {
    const before = lootFinds(v27, 'archive', 12, 2400).found
    const after = lootFinds(v28, 'archive', 12, 2400).found
    expect(share(before, 'potion')).toBeLessThan(0.26)
    expect(share(after, 'potion')).toBeGreaterThan(0.38)
    expect(share(after, 'gold')).toBeLessThan(share(before, 'gold'))
  })
})

describe('a merchant that stays the day (D223)', () => {
  const kit = starterKit(v28)
  const inventory: ItemSnapshot[] = [withId(kit.weapon, 'i000'), withId(kit.armor, 'i001'), withId(kit.potions, 'i002')]
  const base = { ...starterHero('hero1', v28, 0), level: 12, biomeId: 'archive', weaponId: 'i000', armorId: 'i001' }
  const tickAt = EPOCH + 1000 * QUARTER
  const tick = (content: ContentCatalog, hero: typeof base, seed: number) =>
    simulateHero({ hero, inventory, tick: 1000, content, simulationVersion: SIMULATION_VERSION, streams: { ...seeds(seed), quest: seed + 11, raid: seed + 7 }, tickAt })
  const merchantSeed = (content: ContentCatalog) => {
    for (let seed = 0; seed < 5000; seed += 1) if (tick(content, base, seed).event?.detail.outcome.variant === 'merchant') return seed
    throw new Error('no merchant draw')
  }

  it('stays 32 adventures, and the validator holds a long stay to one visit at a time', () => {
    expect(v28.merchant).toMatchObject({ staysForTicks: 32, oneVisitAtATime: true })
    const visit = tick(v28, base, merchantSeed(v28)).nextHero.merchant
    expect(visit?.expiresAtTick).toBe(1032)
    expect(validateCatalog({ ...v28, merchant: { ...v28.merchant!, oneVisitAtATime: undefined } } as unknown as ContentCatalog)).toContain('a merchant staying past 8 ticks must keep one visit at a time')
    expect(validateCatalog({ ...v28, merchant: { ...v28.merchant!, staysForTicks: 97 } })).toContain('merchant must stay between 1 and 96 ticks')
  })

  it('pays gold for a second merchant draw while a visit is open, where v27 replaced the visit', () => {
    const open = { offers: [{ id: 'potions' as const, name: 'Healing Potion', price: 48, quantity: 1 }], expiresAtTick: 1010, biomeId: 'archive' }
    const later = tick(v28, { ...base, merchant: open }, merchantSeed(v28))
    expect(later.event?.detail.outcome).toMatchObject({ variant: 'loot', found: 'gold' })
    expect(later.nextHero.merchant).toEqual(open)
    const replaced = tick(v27, { ...base, merchant: open }, merchantSeed(v27))
    expect(replaced.event?.detail.outcome.variant).toBe('merchant')
    expect(replaced.nextHero.merchant).not.toEqual(open)
  })
})
