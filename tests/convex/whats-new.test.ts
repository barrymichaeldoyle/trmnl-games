// @vitest-environment edge-runtime
import { convexTest } from 'convex-test'
import { describe, expect, it } from 'vitest'
import { api } from '@trmnl-games/backend/api'
import schema from '../../apps/backend/convex/schema'
import { CHANGELOG, changeKeys } from '../../apps/web/src/lib/changelog'
import { seedHero, seedWorld } from './helpers'

const modules = import.meta.glob('../../apps/backend/convex/**/*.ts')

describe('What\'s new since the last visit (D154)', () => {
  it('starts from the day the owner joined and only moves forward', async () => {
    const t = convexTest(schema, modules)
    await seedWorld(t)
    const heroId = await seedHero(t, {}, 'Ana')
    await t.run(async (ctx) => await ctx.db.patch((await ctx.db.get(heroId))!.userId, { createdAt: Date.UTC(2026, 9, 13, 18, 30) }))
    const ana = t.withIdentity({ issuer: 'issuer', subject: 'Ana' })
    const since = async () => (await ana.query(api.users.me, {}))?.user?.whatsNewSince
    expect(await since()).toBe('2026-10-13')
    await ana.mutation(api.users.dismissWhatsNew, { seen: '2026-10-14.02' })
    expect(await since()).toBe('2026-10-14.02')
    // A change added later the same day sorts after it.
    await ana.mutation(api.users.dismissWhatsNew, { seen: '2026-10-14.03' })
    expect(await since()).toBe('2026-10-14.03')
    // An older date (a stale tab) never brings back what was hidden.
    await ana.mutation(api.users.dismissWhatsNew, { seen: '2026-10-13' })
    expect(await since()).toBe('2026-10-14.03')
    await expect(ana.mutation(api.users.dismissWhatsNew, { seen: 'yesterday' })).rejects.toThrow()
  })

  it('keeps the dev log newest first, one entry per day, each with a change', () => {
    const dates = CHANGELOG.map((entry) => entry.date)
    expect(dates.every((date) => /^\d{4}-\d{2}-\d{2}$/.test(date))).toBe(true)
    expect([...dates].sort().reverse()).toEqual(dates)
    expect(new Set(dates).size).toBe(dates.length)
    expect(CHANGELOG.every((entry) => entry.changes.length > 0)).toBe(true)
    // Keys run newest first and never repeat, so the card's "after" test holds.
    const keys = changeKeys().map((change) => change.key)
    expect([...keys].sort().reverse()).toEqual(keys)
    expect(new Set(keys).size).toBe(keys.length)
  })
})
