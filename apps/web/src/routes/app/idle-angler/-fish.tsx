import { Fragment, useMemo, type ReactNode } from 'react'
import { contentV2 } from '@trmnl-games/idle-angler/content'
import { sortByRarity } from '@trmnl-games/idle-angler/content/order'
import type { AnglerWords } from '@trmnl-games/idle-angler/i18n'
import { RARITY_TONE } from '../../../lib/palette'
import { useAngler } from '../../../lib/idleAngler'
import { useT } from '../../../lib/i18n'
import { iaCommon } from '../../../i18n/ia'

const byId = new Map(contentV2.species.map((s) => [s.id, s]))
const escape = (text: string) => text.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')

/** A water's name in bold sky ink, so places stand out from fish (gold and rarity tones) and from the prose around them. */
export function WaterName({ id, children }: { id: string; children?: ReactNode }) {
  const words = useAngler()
  return <strong className="font-semibold text-sky-ink">{children ?? words.water(id)}</strong>
}

/** A fish's name in bold, coloured by rarity as the logbook's gems are. */
export function FishName({ id, children }: { id: string; children?: ReactNode }) {
  const words = useAngler()
  const species = byId.get(id)
  return <strong className={`font-semibold ${RARITY_TONE[species?.rarity ?? 'common'] ?? ''}`}>{children ?? (species ? words.species(id) : id)}</strong>
}

/**
 * Every species and water name in the reader's language, longest first ("Conger Eel" before "Eel"), matched without
 * regard to the first letter's case, since other languages write a fish in lower case mid-sentence ("un barbeau").
 */
function namePattern(words: AnglerWords): { pattern: RegExp; fish: Map<string, string>; water: Map<string, string> } {
  const fish = new Map(contentV2.species.map((s) => [words.species(s.id).toLowerCase(), s.id]))
  const water = new Map(contentV2.waters.map((w) => [words.water(w.id).toLowerCase(), w.id]))
  const names = [...fish.keys(), ...water.keys()].sort((a, b) => b.length - a.length).map(escape)
  return { pattern: new RegExp(`(?<![\\p{L}\\p{N}])(${names.join('|')})(?![\\p{L}\\p{N}])`, 'giu'), fish, water }
}

/**
 * A story line in the reader's language (D200), with every species name set as a FishName and every water as a
 * WaterName. Stories stored before D121 say gold; they read coins.
 */
export function FishText({ text }: { text: string }) {
  const words = useAngler()
  const names = useMemo(() => namePattern(words), [words])
  const told = words.text(text.replace(/\bgold\b/g, 'coins'))
  const parts = told.split(names.pattern)
  return (
    <>
      {parts.map((part, i) => {
        if (i % 2 === 0) return <Fragment key={i}>{part}</Fragment>
        const fish = names.fish.get(part.toLowerCase())
        if (fish) return <FishName key={i} id={fish}>{part}</FishName>
        const water = names.water.get(part.toLowerCase())
        return water ? <WaterName key={i} id={water}>{part}</WaterName> : <Fragment key={i}>{part}</Fragment>
      })}
    </>
  )
}

/** Who takes a bait, split into the fish that take nothing else and the rest; only fish in `seen` are named. */
export function baitCatches(bait: string, seen: ReadonlySet<string>) {
  const takers = sortByRarity(contentV2.species.filter((s) => s.baits.includes(bait as never)))
  const group = (rows: typeof takers) => ({ ids: rows.filter((s) => seen.has(s.id)).map((s) => s.id), unseen: rows.filter((s) => !seen.has(s.id)).length })
  return { only: group(takers.filter((s) => s.baits.length === 1)), also: group(takers.filter((s) => s.baits.length > 1)) }
}

/** "Roach, Perch, +2 not caught yet", or "3 fish not caught yet", with the names as FishNames. */
export function FishList({ ids, unseen }: { ids: string[]; unseen: number }) {
  const t = useT(iaCommon)
  const parts: ReactNode[] = ids.map((id) => <FishName key={id} id={id} />)
  if (unseen > 0) parts.push(<span key="unseen" className="text-muted">{ids.length > 0 ? t.moreNotCaught(unseen) : t.fishNotCaught(unseen)}</span>)
  return <>{parts.map((part, i) => <Fragment key={i}>{i > 0 ? ', ' : ''}{part}</Fragment>)}</>
}

/**
 * D200: the water a gate counts species from, in the language's "from" form with the name in bold ("von der
 * Flussbiegung", "du Méandre"). English, and Polish (whose form inflects the name), keep the bare name.
 */
export function FromWater({ id }: { id: string }) {
  const words = useAngler()
  const water = words.waterName(id)
  const at = water.of.indexOf(water.name)
  if (words.locale === 'en' || at < 0) return <WaterName id={id} />
  return <>{water.of.slice(0, at)}<WaterName id={id} />{water.of.slice(at + water.name.length)}</>
}
