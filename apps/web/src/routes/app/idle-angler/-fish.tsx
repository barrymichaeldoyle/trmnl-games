import { Fragment, type ReactNode } from 'react'
import { contentV2 } from '@trmnl-games/idle-angler/content'
import { sortByRarity } from '@trmnl-games/idle-angler/content/order'
import { RARITY_TONE } from '../../../lib/palette'

const byId = new Map(contentV2.species.map((s) => [s.id, s]))
const byName = new Map(contentV2.species.map((s) => [s.name, s]))
const waterByName = new Map(contentV2.waters.map((w) => [w.name, w]))
const waterById = new Map<string, { name: string }>(contentV2.waters.map((w) => [w.id, w]))
// Longest first, so "Conger Eel" wins over "Eel" and "Common Carp" over "Carp". Waters are marked in stories too.
const NAMES = new RegExp(`\\b(${[...byName.keys(), ...waterByName.keys()].sort((a, b) => b.length - a.length).map((n) => n.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')).join('|')})\\b`, 'g')

/** A water's name in bold sky ink, so places stand out from fish (gold and rarity tones) and from the prose around them. */
export function WaterName({ id, children }: { id: string; children?: ReactNode }) {
  return <strong className="font-semibold text-sky-ink">{children ?? waterById.get(id)?.name ?? id}</strong>
}

/** A fish's name in bold, coloured by rarity as the logbook's gems are. */
export function FishName({ id, children }: { id: string; children?: ReactNode }) {
  const species = byId.get(id)
  return <strong className={`font-semibold ${RARITY_TONE[species?.rarity ?? 'common'] ?? ''}`}>{children ?? species?.name ?? id}</strong>
}

/** A story line with every species name set as a FishName and every water as a WaterName. Stories stored before D121 say gold; they read coins. */
export function FishText({ text }: { text: string }) {
  const parts = text.replace(/\bgold\b/g, 'coins').split(NAMES)
  return <>{parts.map((part, i) => (i % 2 === 1 && byName.has(part) ? <FishName key={i} id={byName.get(part)!.id} /> : i % 2 === 1 && waterByName.has(part) ? <WaterName key={i} id={waterByName.get(part)!.id} /> : <Fragment key={i}>{part}</Fragment>))}</>
}

/** Who takes a bait, split into the fish that take nothing else and the rest; only fish in `seen` are named. */
export function baitCatches(bait: string, seen: ReadonlySet<string>) {
  const takers = sortByRarity(contentV2.species.filter((s) => s.baits.includes(bait as never)))
  const group = (rows: typeof takers) => ({ ids: rows.filter((s) => seen.has(s.id)).map((s) => s.id), unseen: rows.filter((s) => !seen.has(s.id)).length })
  return { only: group(takers.filter((s) => s.baits.length === 1)), also: group(takers.filter((s) => s.baits.length > 1)) }
}

/** "Roach, Perch, +2 not caught yet", or "3 fish not caught yet", with the names as FishNames. */
export function FishList({ ids, unseen }: { ids: string[]; unseen: number }) {
  const parts: ReactNode[] = ids.map((id) => <FishName key={id} id={id} />)
  if (unseen > 0) parts.push(<span key="unseen" className="text-muted">{ids.length > 0 ? `+${unseen} not caught yet` : `${unseen} fish not caught yet`}</span>)
  return <>{parts.map((part, i) => <Fragment key={i}>{i > 0 ? ', ' : ''}{part}</Fragment>)}</>
}
