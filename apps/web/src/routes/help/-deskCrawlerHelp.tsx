import type { ComponentType } from 'react'
import { HELP_FACTS as F } from './-deskCrawlerFacts'

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
