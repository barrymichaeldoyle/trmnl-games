import type { Locale } from '@trmnl-games/platform'
import { EARLIER_CHANGES } from './changelogEarlier'
import { changeIn, changeKey, RECENT_CHANGES, type ChangelogEntry } from './changelogRecent'

/**
 * The whole public dev log (D153), newest first: the newest entries (changelogRecent.ts, which the front page reads on
 * its own) ahead of the rest (changelogEarlier.ts). The What's new page and the companion's card read it all from here.
 */
export { changeDay, changeIn, changeKey, type ChangelogEntry } from './changelogRecent'

export const CHANGELOG: ReadonlyArray<ChangelogEntry> = [...RECENT_CHANGES, ...EARLIER_CHANGES]
/**
 * D154: every change with a key that sorts by when it was added: its day, then its place in that day counted from the
 * day's first change ("2026-10-14.03"). The companion's card shows the keys after the owner's `whatsNewSince`.
 */
export const changeKeys = (locale: Locale = 'en'): Array<{ key: string; title: string }> =>
  CHANGELOG.flatMap((entry) => entry.changes.map((change, index) => ({ key: changeKey(entry, index), title: changeIn(change, locale).title })))
