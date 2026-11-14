import type { Sprite } from '@trmnl-games/engine/art/canvas'
import { badgeLayers, frameForTier, speciesOfFamily } from './badges'
import { BADGE_TONES, fishTones, INK, type Tones } from './tones'

/**
 * A badge in the companion's colours (P48): the device's layers, bottom to top, each with the tones it is painted in.
 * The paper disc, the frame in its tier's colour (the top tier's solid disc too), then the picture in ink or the fish
 * in its own tones. Locked badges are the checker silhouette in a muted tone.
 */
export function badgeColourLayers(family: string, tier: number): ReadonlyArray<{ readonly sprite: Sprite; readonly tones: Tones }> {
  const frame = frameForTier(family, tier)
  const layers = badgeLayers(family, frame, false)
  const species = speciesOfFamily(family)
  const picture: Tones = frame === 0 ? { ink: BADGE_TONES.locked, shade: [BADGE_TONES.locked, BADGE_TONES.lockedDisc] } : species ? fishTones(species) : { ink: INK, paper: BADGE_TONES.disc }
  return [
    { sprite: layers.disc, tones: { paper: frame === 0 ? BADGE_TONES.lockedDisc : BADGE_TONES.disc } },
    { sprite: layers.frame, tones: { ink: BADGE_TONES.rings[frame] } },
    { sprite: layers.picture, tones: picture },
  ]
}
