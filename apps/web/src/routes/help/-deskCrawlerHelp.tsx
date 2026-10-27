import type { ComponentType } from 'react'
import type { Locale } from '@trmnl-games/platform'
import { HELP_FACTS as F } from './-deskCrawlerFacts'
import { preloadContent } from '../../lib/content'

/** D169: one language's Desk Crawler help page: its head, title, section names and body. */
export interface HelpPage {
  readonly seoTitle: string
  readonly description: string
  readonly title: string
  readonly contents: Readonly<Record<SectionId, string>>
  readonly Body: ComponentType
}

type SectionId = (typeof SECTIONS)[number]

const SECTIONS = ['getting-started', 'if-the-qr-sends-you-back-to-setup', 'how-time-works', 'floors', 'desk-keepsakes', 'career', 'heroes-and-classes', 'stances', 'desk-raids', 'meetings', 'lost-property', 'to-do-list', 'potions', 'the-wandering-merchant', 'decisions', 'effects', 'office-calendar', 'rare-and-epic-gear', 'when-your-bag-fills-up', 'bigger-bags', 'salvage-and-the-workbench', 'getting-knocked-out', 'recaps', 'understanding-rankings', 'sharing-your-hero', 'following', 'names', 'gender', 'alerts', 'troubleshooting', 'disconnecting-and-removing', 'help'] as const

/** Sections the active catalog has no rule for are left out of the page and its jump list. */
const PRESENT: Partial<Record<SectionId, boolean>> = {
  career: F.career !== undefined,
  'heroes-and-classes': F.classes !== undefined,
  meetings: F.meetings !== undefined,
  'lost-property': F.lostProperty,
  'to-do-list': F.todo !== undefined,
  'office-calendar': F.occasions !== undefined,
  'salvage-and-the-workbench': F.workbench !== undefined,
}

/** The jump list at the top: on a phone the page runs to about twenty screens. */
export const contentsOf = (page: HelpPage): ReadonlyArray<readonly [string, string]> =>
  SECTIONS.filter((id) => PRESENT[id] !== false).map((id) => [id, page.contents[id]] as const)

/**
 * D215: one language's guide at a time. Each guide writes its game names out at module scope through the lazy content
 * translator, so its dictionary must be here before its module is evaluated: `loadDeskCrawlerHelp` awaits the one, then
 * imports the other. The route's loader calls it, and so does the client entry before hydration (lib/content), so the
 * server render and the first client render agree. The eight guides and seven dictionaries (380 KB gzipped) used to
 * come as one chunk for every reader.
 */
const GUIDES: Readonly<Record<Locale, () => Promise<HelpPage>>> = {
  en: () => import('./-deskCrawlerHelp.en').then((m) => m.en),
  fr: () => import('./-deskCrawlerHelp.fr').then((m) => m.fr),
  de: () => import('./-deskCrawlerHelp.de').then((m) => m.de),
  es: () => import('./-deskCrawlerHelp.es').then((m) => m.es),
  it: () => import('./-deskCrawlerHelp.it').then((m) => m.it),
  pt: () => import('./-deskCrawlerHelp.pt').then((m) => m.pt),
  pl: () => import('./-deskCrawlerHelp.pl').then((m) => m.pl),
  nl: () => import('./-deskCrawlerHelp.nl').then((m) => m.nl),
}
const guides = new Map<Locale, HelpPage>()

export async function loadDeskCrawlerHelp(locale: Locale): Promise<void> {
  if (guides.has(locale)) return
  await preloadContent(locale)
  guides.set(locale, await GUIDES[locale]())
}

/** The guide `loadDeskCrawlerHelp` fetched for the locale; undefined only if the loader did not run. */
export const deskCrawlerHelp = (locale: Locale): HelpPage | undefined => guides.get(locale)
