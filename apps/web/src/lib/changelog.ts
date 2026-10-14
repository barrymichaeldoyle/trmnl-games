/**
 * The public dev log (D153), newest first: changes players can see, in their words, dated by the day they went live.
 * Add an entry in the same commit as the change it describes. No decision numbers or internal names.
 */
export interface ChangelogEntry {
  /** The day it went live, as YYYY-MM-DD. */
  readonly date: string
  readonly changes: ReadonlyArray<{ readonly title: string; readonly body: string }>
}

export const CHANGELOG: ReadonlyArray<ChangelogEntry> = [
  {
    date: '2026-10-14',
    changes: [
      {
        title: 'Rankings show the players around you',
        body: 'The weekly board on your TRMNL now centres on your hero, so you see who is just ahead of you and who is just behind, not only the top of the board. In the app, Rankings opens with the two players either side of you once you are below fifth.',
      },
      {
        title: 'Goals done in the app show as done straight away',
        body: 'Equipping a find or changing your stance for a goal used to leave the goal card asking for it until your hero’s next adventure, up to fifteen minutes later. The card now says the goal is done as soon as you do it. Your hero still marks it off, and the reward arrives, on that next adventure.',
      },
    ],
  },
  {
    date: '2026-10-13',
    changes: [
      {
        title: 'Desk Crawler is on the TRMNL marketplace',
        body: 'Install it from the marketplace listing, link your TRMNL and your hero starts adventuring every fifteen minutes.',
      },
    ],
  },
]
