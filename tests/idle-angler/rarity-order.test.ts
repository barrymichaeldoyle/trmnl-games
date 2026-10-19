import { describe, expect, it } from 'vitest'
import { catalogs } from '@trmnl-games/idle-angler/content'
import { RARITY_RANK, sortByRarity, speciesByWater } from '@trmnl-games/idle-angler/content/order'

describe('fish lists run common to epic (issue #10)', () => {
  it.each(Object.entries(catalogs))('sorts every water in %s by rarity and keeps catalog order within a rarity', (_id, content) => {
    for (const water of content.waters) {
      const declared = content.species.filter((s) => s.water === water.id)
      const listed = sortByRarity(declared)
      expect(listed).toHaveLength(declared.length)
      for (let i = 1; i < listed.length; i++) {
        const [before, after] = [listed[i - 1]!, listed[i]!]
        expect(RARITY_RANK[before.rarity]).toBeLessThanOrEqual(RARITY_RANK[after.rarity])
        if (before.rarity === after.rarity) expect(declared.indexOf(before)).toBeLessThan(declared.indexOf(after))
      }
    }
    expect(speciesByWater(content)).toHaveLength(content.species.length)
  })

  it('moves the v2 season visitors in among their own rarity', () => {
    const ids = (water: string) => sortByRarity(catalogs.v2.species.filter((s) => s.water === water)).map((s) => s.id)
    expect(ids('river_bend').slice(-2)).toEqual(['sea_trout', 'salmon'])
    const pier = ids('harbour_pier')
    expect(pier.indexOf('garfish')).toBeLessThan(pier.indexOf('sea_bass'))
    expect(pier.at(-1)).toBe('thornback_ray')
  })
})
