import { describe, expect, it } from 'vitest'
import { CHANGELOG, changeIsFor, changeKeys, GAME_TAGS } from '../../apps/web/src/lib/changelog'
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

  it('tags each change with one game or none, and gives each game its own and the shared changes (D225)', () => {
    const all = CHANGELOG.flatMap((entry) => entry.changes)
    for (const change of all) expect(change.game === undefined || GAME_TAGS.includes(change.game), change.title).toBe(true)
    const shared = all.filter((change) => change.game === undefined)
    expect(shared.length).toBeGreaterThan(0)
    for (const game of GAME_TAGS) {
      const keys = changeKeys('en', game)
      expect(keys.length).toBe(all.filter((change) => changeIsFor(change, game)).length)
      expect(keys.length).toBeGreaterThanOrEqual(shared.length)
      expect(keys.length).toBeLessThan(all.length)
    }
    expect(changeKeys('en').length).toBe(all.length)
    // The entries about the second game's own pages belong to it alone.
    expect(all.find((change) => change.title === 'The fly code is asked for on the Dock')?.game).toBe('idle-angler')
    expect(all.find((change) => change.title === 'Idle Angler is here')?.game).toBeUndefined()
  })
})
