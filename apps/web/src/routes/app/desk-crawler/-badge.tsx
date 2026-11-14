import { useMemo } from 'react'
import { badgeColourLayers, frameForTier } from '@trmnl-games/desk-crawler/art/badges'
import { BadgeArt } from '../../../lib/badgeArt'

/** A Desk Crawler achievement badge (P49): the family's picture or monster in the frame its tier wears; tier 0 is the locked "?". */
export function DcBadge({ family, tier, scale = 2, className = '' }: { family: string; tier: number; scale?: number; className?: string }) {
  const frame = frameForTier(family, tier)
  const layers = useMemo(() => badgeColourLayers(family, frame), [family, frame])
  return <BadgeArt layers={layers} scale={scale} className={className} />
}
