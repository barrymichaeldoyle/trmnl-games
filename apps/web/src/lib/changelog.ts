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
        title: 'Elites can dig in',
        body: 'From level 12, on the Cafeteria Depths and deeper, an elite sometimes digs in and takes a few adventures to beat. Your TRMNL shows its health going down, and your hero comes back to it between rests. It hits hard and can knock your hero out, and it leaves after four hours. When it falls it pays many times an elite’s XP and gold and a rare or epic find. You can walk away from it on the Hero page.',
      },
      {
        title: 'What’s new has a home in More',
        body: 'Hiding the What’s new card on the Hero tab used to leave no easy way back to the list of changes. It now has its own row on the More tab, with the day of the latest update.',
      },
      {
        title: 'The quarter-size TRMNL view says when your hero is paused or knocked out',
        body: 'If Desk Crawler shares your TRMNL with other plugins in a quarter slot, it now says “Paused by you” while you have paused, and the time your hero is back after a knockout. A long hero name no longer hides your level, and the latest adventure gets more of the width.',
      },
      {
        title: 'Less on the Hero page until you need it',
        body: 'Features you haven’t reached yet no longer stack up as locked cards. The Hero page names the next one to open and its level, and the world map shows the floors you can visit plus the next one. The Career page still lists everything that opens later.',
      },
      {
        title: 'Buttons are easier to spot',
        body: 'Only things you can tap look like buttons now. Something you can’t afford yet shows its price and how much more gold you need instead of a greyed-out button, Drink potion appears only when your hero is hurt, the world map marks where you are, and the quest log is a plain list.',
      },
      {
        title: 'Rankings show the players around you',
        body: 'The weekly board on your TRMNL now centres on your hero, so you see who is just ahead of you and who is just behind as well as the top of the board. In the app, Rankings opens with the two players either side of you once you are below fifth.',
      },
      {
        title: 'The workbench opens at level 4',
        body: 'Salvage and the workbench used to be there from your first adventure, but the first upgrade needs level 4, so early materials could not be spent. They now open together at level 4. Your TRMNL says when, and your next goal is to salvage a piece of gear. Before that, sell your spares for gold, which pays for the first bags.',
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

/** The day an entry went live, written out in English ("14 October 2026"), the same on the server and in every browser. */
export const changeDay = (date: string, year = true) => new Date(`${date}T12:00:00Z`).toLocaleDateString('en-GB', { day: 'numeric', month: 'long', ...(year ? { year: 'numeric' } : {}), timeZone: 'UTC' })

/** The newest `count` changes, newest first, each with the day it went live. */
export const latestChanges = (count: number): Array<{ date: string; title: string; body: string }> =>
  CHANGELOG.flatMap((entry) => entry.changes.map((change) => ({ date: entry.date, ...change }))).slice(0, count)
