import type { Locale } from '@trmnl-games/platform'
import { EARLIER_CHANGES } from './changelogEarlier'
import { changeIn, changeKey, RECENT_CHANGES, type ChangelogEntry, type GameTag } from './changelogRecent'

/**
 * The whole public dev log (D153), newest first: the newest entries (changelogRecent.ts, which the front page reads on
 * its own) ahead of the rest (changelogEarlier.ts). The What's new page and the companion's card read it all from here.
 */
export { changeDay, changeIn, changeKey, GAME_TAG_NAMES, GAME_TAGS, type ChangelogEntry, type GameTag } from './changelogRecent'

export const CHANGELOG: ReadonlyArray<ChangelogEntry> = [...RECENT_CHANGES, ...EARLIER_CHANGES]
/** Whether a change concerns a player of `game` (D225): its own game's changes and the ones for everyone. */
export const changeIsFor = (change: { readonly game?: GameTag }, game: GameTag | undefined): boolean => game === undefined || change.game === undefined || change.game === game

/**
 * D154: every change with a key that sorts by when it was added: its day, then its place in that day counted from the
 * day's first change ("2026-10-14.03"). The companion's card shows the keys after the owner's `whatsNewSince`, for the
 * changes that concern its game (D225).
 */
export const changeKeys = (locale: Locale = 'en', game?: GameTag): Array<{ key: string; title: string }> =>
  CHANGELOG.flatMap((entry) => entry.changes.flatMap((change, index) => (changeIsFor(change, game) ? [{ key: changeKey(entry, index), title: changeIn(change, locale).title }] : [])))
