import type { BiomeTemplate, ContentCatalog, LootWeights } from '../sim/core/types'
import { contentV27 } from './v27'

/*
 * Content catalog v28 (D222): more potions on the deep floors.
 *
 * A level-16 player wrote that her hero had no potions left. Every hero on the
 * Archive and the Parking Garage held 0 to 7, while Office and Server Room
 * heroes sat on full pouches: a potion is one loot draw in five on every floor,
 * so finds stay near four a day while drinking doubles from the Cafeteria
 * down. The harness agreed (daily managers began 52% of Cafeteria ticks and 75%
 * of Archive ticks with an empty pouch). Each deep floor now carries its own
 * loot shares, the extra potion share taken from gold; a full pouch still turns
 * a potion find into gold, so a hero with potions to spare loses little.
 *
 * D223: the merchant stays a working day. Production heroes had met it 862
 * times and bought 65 times; a one-hour visit was over before most players
 * looked. It now stays 32 adventures (eight hours), and while it is there
 * another merchant draw pays gold instead of replacing the open visit.
 * Everything else is v27.
 */
const base = contentV27.constants.lootWeights
const potionShare: Readonly<Record<string, number>> = { cafeteria_depths: 35, archive: 45, parking_garage: 35 }

const withShare = (biome: BiomeTemplate): BiomeTemplate => {
  const potion = potionShare[biome.id]
  if (potion === undefined) return biome
  const lootWeights: LootWeights = { ...base, potion, gold: base.gold - (potion - base.potion) }
  return { ...biome, lootWeights }
}

export const contentV28: ContentCatalog = {
  ...contentV27,
  contentVersion: 'v28',
  biomes: contentV27.biomes.map(withShare),
  merchant: { ...contentV27.merchant!, staysForTicks: 32, oneVisitAtATime: true },
}
