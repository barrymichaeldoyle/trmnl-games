import type { ComponentType } from 'react'
import { contentV5 as content } from '@trmnl-games/idle-angler/content'
import { FLIES } from '@trmnl-games/idle-angler/content/flies'
import { TITLES, WATER_RANKS } from '@trmnl-games/idle-angler/sim'

/** D200: one language's Idle Angler help page: its head, title, section names and body. */
export interface HelpPage {
  readonly seoTitle: string
  readonly description: string
  readonly title: string
  readonly contents: Readonly<Record<SectionId, string>>
  readonly Body: ComponentType
}

const SECTIONS = ['getting-started', 'goals', 'how-fishing-works', 'time-and-weather', 'bait', 'the-fishmonger', 'the-cooler', 'rods-and-fish-that-get-away', 'waters', 'the-logbook', 'rankings', 'the-trophy-wall', 'the-fly-box', 'achievements', 'alerts', 'pausing-and-removing', 'help'] as const
type SectionId = (typeof SECTIONS)[number]

export const contentsOf = (page: HelpPage): ReadonlyArray<readonly [string, string]> => SECTIONS.map((id) => [id, page.contents[id]] as const)

const gate = (id: string) => content.waters.find((w) => w.id === id)!.opensAfter!.species

/** The numbers every language's help quotes, read from the live catalog so the guide follows a retune. */
export const IA_FACTS = {
  unlocks: content.unlocks!,
  deadbaitPerFish: content.deadbait!.unitsPerFish,
  deadbaitCap: content.baitCaps!.deadbait!,
  baitCap: content.baitCap,
  orderSlots: content.orders!.slots,
  charter: content.charterTicket!,
  prizes: content.opens!.prizes,
  trophies: { minPercent: content.trophies!.minPercent, fee: content.trophies!.fee, firstPegs: content.trophies!.pegs[0]!, maxPegs: content.trophies!.pegs.at(-1)! },
  flies: FLIES.length,
  /** Titles after the first, with the species each needs. */
  titles: TITLES.slice(1).map((t) => ({ id: t.id, species: t.species })),
  firstTitle: TITLES[0]!.id,
  /** P45: the ranks at each water, Visitor first. */
  ranks: WATER_RANKS.map((r) => r.id),
  runs: (content.runs ?? []).map((r) => r.species),
  gates: { river_bend: gate('river_bend'), harbour_pier: gate('harbour_pier'), heron_lake: gate('heron_lake'), deep_sea: gate('deep_sea'), frozen_tarn: gate('frozen_tarn') },
} as const

export const SAMPLE_IMAGE = { path: '/games/idle-angler/sample.png', alt: 'A sample Idle Angler screen' }
