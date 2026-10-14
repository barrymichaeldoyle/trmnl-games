/**
 * The public dev log (D153), newest first: changes players can see, in their words, dated by the day they went live.
 * Add an entry in the same commit as the change it describes. No decision numbers or internal names. A later change on
 * the same day goes first in that day's list, so each change keeps its key (see `changeKeys`).
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
        title: 'Buttons are easier to spot',
        body: 'Only things you can tap look like buttons now. Something you can’t afford yet shows its price and how much more gold you need instead of a greyed-out button, Drink potion appears only when your hero is hurt, the world map marks where you are, and the quest log is a plain list.',
      },
      {
        title: 'Rankings show the players around you',
        body: 'The weekly board on your TRMNL now centres on your hero, so you see who is just ahead of you and who is just behind, not only the top of the board. In the app, Rankings opens with the two players either side of you once you are below fifth.',
      },
      {
        title: 'The workbench opens at level 4',
        body: 'Salvage and the workbench used to be there from your first adventure, but the first upgrade needs level 4, so early materials had nothing to buy. They now open together at level 4. Your TRMNL says when, and your next goal is to salvage a piece of gear. Before that, sell your spares for gold, which pays for the first bags.',
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

/**
 * D154: every change with a key that sorts by when it was added: its day, then its place in that day counted from the
 * day's first change ("2026-10-14.03"). The companion's card shows the keys after the owner's `whatsNewSince`.
 */
export const changeKeys = (): Array<{ key: string; title: string }> =>
  CHANGELOG.flatMap((entry) => entry.changes.map((change, index) => ({ key: `${entry.date}.${String(entry.changes.length - index).padStart(2, '0')}`, title: change.title })))
