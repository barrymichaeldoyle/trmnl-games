import { existsSync } from 'node:fs'
import { expect, it } from 'vitest'
import { ACTIVE_CONTENT, catalogs } from '../../packages/desk-crawler/src/content'
import { FLOORS, UNLOCKS } from '../../apps/web/src/lib/facts.gen'

it('keeps the public pages\' floor facts, quoted levels and pictures in step with the active catalog (rerun tools/landing/floors.ts)', () => {
  const catalog = catalogs[ACTIVE_CONTENT]
  const name = (id: string) => catalog.monsters.find((monster) => monster.id === id)?.name ?? id
  expect(FLOORS.map(({ id, name, level, monsters }) => ({ id, name, level, monsters }))).toEqual(
    catalog.biomes.map((biome) => ({ id: biome.id, name: biome.name, level: biome.unlockLevel, monsters: biome.monsterIds.map(name) })),
  )
  expect(UNLOCKS).toEqual({ raids: catalog.unlocks?.raids, roster: catalog.unlocks?.roster })
  for (const floor of FLOORS) expect(existsSync(`apps/web/public/games/desk-crawler/floors/${floor.id}.png`)).toBe(true)
})
