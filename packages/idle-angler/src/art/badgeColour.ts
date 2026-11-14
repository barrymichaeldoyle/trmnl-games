import { badgeColourLayers as paint, type BadgeTones } from '@trmnl-games/engine/art/badge'
import type { Sprite } from '@trmnl-games/engine/art/canvas'
import { badgeLayers, speciesOfFamily, type BadgeFrame } from './badges'
import { fishTones } from './tones'

/**
 * A badge in the companion's colours (P48): the device's layers, bottom to top, each with the tones it is painted in
 * (the engine's `badgeColourLayers`). A fish takes its own tones; a picture the ink on the disc.
 */
export function badgeColourLayers(family: string, frame: BadgeFrame): ReadonlyArray<{ readonly sprite: Sprite; readonly tones: BadgeTones }> {
  const species = speciesOfFamily(family)
  return paint(badgeLayers(family, frame, false), frame, species ? fishTones(species) : undefined)
}
