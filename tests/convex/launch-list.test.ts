// @vitest-environment edge-runtime
import { convexTest } from 'convex-test'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { api, internal } from '@trmnl-games/backend/api'
import schema from '../../apps/backend/convex/schema'
import { unsubscribeToken } from '../../apps/backend/convex/launchList'
import { launchEmail } from '../../apps/backend/convex/lib/launchEmail'
import { LOCALES } from '@trmnl-games/platform'
import type { T } from './helpers'

const modules = import.meta.glob('../../apps/backend/convex/**/*.ts')
const rows = (t: T) => t.run(async (ctx) => await ctx.db.query('launchList').collect())

describe('launch list (D201)', () => {
  let t: T
  beforeEach(() => {
    vi.stubEnv('EMAIL_STOP_KEY', 'test-key')
    t = convexTest(schema, modules)
  })
  afterEach(() => vi.unstubAllEnvs())

  it('keeps one row per visitor email, quietly drops bots, and refuses a game with no list', async () => {
    await t.mutation(api.launchList.join, { gameSlug: 'idle-angler', email: ' Ana@Example.com ', locale: 'fr' })
    await t.mutation(api.launchList.join, { gameSlug: 'idle-angler', email: 'ana@example.com', locale: 'fr' })
    await t.mutation(api.launchList.join, { gameSlug: 'idle-angler', email: 'bot@example.com', locale: 'en', website: 'spam' })
    await expect(t.mutation(api.launchList.join, { gameSlug: 'idle-angler', email: 'not-an-email', locale: 'en' })).rejects.toThrow(/valid email/)
    await expect(t.mutation(api.launchList.join, { gameSlug: 'desk-crawler', email: 'bo@example.com', locale: 'en' })).rejects.toThrow(/no launch list/)
    expect(await rows(t)).toMatchObject([{ email: 'ana@example.com', locale: 'fr', state: 'waiting' }])
  })

  it('adds a signed-in player with one tap and no email, once, and lets them leave', async () => {
    const asAna = t.withIdentity({ issuer: 'issuer', subject: 'Ana' })
    expect(await asAna.query(api.launchList.mine, { gameSlug: 'idle-angler' })).toBe(false)
    await asAna.mutation(api.launchList.notifyMe, { gameSlug: 'idle-angler', locale: 'de' })
    await asAna.mutation(api.launchList.notifyMe, { gameSlug: 'idle-angler', locale: 'de' })
    const [row] = await rows(t)
    expect(await rows(t)).toHaveLength(1)
    expect(row).toMatchObject({ tokenIdentifier: 'issuer|Ana', locale: 'de' })
    expect(row!.email).toBeUndefined()
    expect(await asAna.query(api.launchList.mine, { gameSlug: 'idle-angler' })).toBe(true)
    expect(await t.query(api.launchList.mine, { gameSlug: 'idle-angler' })).toBe(false)
    await asAna.mutation(api.launchList.leaveMine, { gameSlug: 'idle-angler' })
    expect(await rows(t)).toHaveLength(0)
  })

  it('removes a row only with its own unsubscribe token', async () => {
    await t.mutation(api.launchList.join, { gameSlug: 'idle-angler', email: 'bo@example.com', locale: 'en' })
    const [row] = await rows(t)
    expect(await t.mutation(api.launchList.leave, { id: row!._id, token: 'a'.repeat(64) })).toBe(false)
    expect(await rows(t)).toHaveLength(1)
    expect(await t.mutation(api.launchList.leave, { id: row!._id, token: unsubscribeToken('test-key', row!._id) })).toBe(true)
    expect(await rows(t)).toHaveLength(0)
    // A second click on the same link still succeeds.
    expect(await t.mutation(api.launchList.leave, { id: row!._id, token: unsubscribeToken('test-key', row!._id) })).toBe(true)
  })

  it('claims a batch for sending, deletes sent rows and retries failures', async () => {
    await t.mutation(api.launchList.join, { gameSlug: 'idle-angler', email: 'a@example.com', locale: 'en' })
    await t.mutation(api.launchList.join, { gameSlug: 'idle-angler', email: 'b@example.com', locale: 'pl' })
    const batch = await t.mutation(internal.launchList.claimBatch, { gameSlug: 'idle-angler' })
    expect(batch).toHaveLength(2)
    expect(await t.mutation(internal.launchList.claimBatch, { gameSlug: 'idle-angler' })).toHaveLength(0)
    await t.mutation(internal.launchList.finish, { sent: [batch[0]!.id], failed: [batch[1]!.id], drop: [] })
    expect(await rows(t)).toMatchObject([{ email: 'b@example.com', state: 'waiting', attempts: 1 }])
    expect(await t.query(internal.launchList.summary, { gameSlug: 'idle-angler' })).toEqual({ waiting: 1, signedIn: 0, sending: 0, failed: 0 })
  })

  it('writes the launch email in every language with its links', () => {
    for (const locale of LOCALES) {
      const { subject, text } = launchEmail(locale, { install: 'https://trmnl.com/integrations/idle-angler', unsubscribe: 'https://trmnlgames.com/launch-list/unsubscribe?id=x' })
      expect(subject).toContain('Idle Angler')
      expect(text).toContain('https://trmnl.com/integrations/idle-angler')
      expect(text).toContain('launch-list/unsubscribe')
    }
  })
})
