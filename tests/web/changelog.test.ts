import { describe, expect, it } from 'vitest'
import { CHANGELOG, changeKeys } from '../../apps/web/src/lib/changelog'
import { EARLIER_CHANGES } from '../../apps/web/src/lib/changelogEarlier'
import { latestChanges, RECENT_CHANGES } from '../../apps/web/src/lib/changelogRecent'

/** The log is split so the front page loads only its newest entries (changelogRecent.ts); the two files must stay in order. */
describe('changelog split', () => {
  it('keeps the recent file small and newest, with enough for the front page', () => {
    const recent = RECENT_CHANGES.flatMap((entry) => entry.changes)
    expect(recent.length).toBeGreaterThanOrEqual(3)
    expect(recent.length).toBeLessThanOrEqual(10)
    const dates = CHANGELOG.map((entry) => entry.date)
    expect([...dates].sort().reverse()).toEqual(dates)
    expect(new Set(dates).size).toBe(dates.length)
    expect(RECENT_CHANGES.at(-1)!.date > EARLIER_CHANGES[0]!.date).toBe(true)
  })

  it('shows the front page the same newest three as the whole log', () => {
    expect(latestChanges(3).map((change) => change.key)).toEqual(changeKeys().slice(0, 3).map((change) => change.key))
  })
})
