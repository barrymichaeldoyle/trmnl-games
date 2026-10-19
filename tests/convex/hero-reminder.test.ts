// @vitest-environment edge-runtime
import { convexTest } from 'convex-test'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { api, internal } from '@trmnl-games/backend/api'
import schema from '../../apps/backend/convex/schema'
import { heroReminderEmail } from '../../apps/backend/convex/lib/heroReminderEmail'
import { seedHero, seedWorld, type T } from './helpers'

const modules = import.meta.glob('../../apps/backend/convex/**/*.ts')
const DAY = 24 * 60 * 60 * 1000
const clerkUser = { primary_email_address_id: 'email_1', email_addresses: [{ id: 'email_1', email_address: 'owner@example.com', verification: { status: 'verified' } }] }

describe('the hero reminder email (D198)', () => {
  let t: T
  let fetchMock: ReturnType<typeof vi.fn>
  const messages = () => fetchMock.mock.calls.filter(([url]) => url === 'https://api.resend.com/emails').map(([, init]) => JSON.parse((init as RequestInit).body as string))
  const user = (alias: string) => t.run(async (ctx) => await ctx.db.query('users').withIndex('by_normalizedAlias', (q) => q.eq('normalizedAlias', alias.toLowerCase())).unique())
  beforeEach(async () => {
    vi.useFakeTimers()
    vi.setSystemTime(Date.UTC(2026, 9, 13, 12))
    vi.stubEnv('ACCOUNT_DELETION_LINK_KEY', 'test-deletion-link-signing-secret-32-characters')
    vi.stubEnv('CLERK_SECRET_KEY', 'sk_test_fake')
    vi.stubEnv('RESEND_API_KEY', 're_test_fake')
    vi.stubEnv('COMPANION_ORIGIN', 'https://trmnlgames.com')
    fetchMock = vi.fn(async (url: string) => new Response(url.startsWith('https://api.clerk.com') ? JSON.stringify(clerkUser) : '{}', { status: 200 }))
    vi.stubGlobal('fetch', fetchMock)
    t = convexTest(schema, modules)
    await seedWorld(t)
  })
  afterEach(() => { vi.useRealTimers(); vi.unstubAllGlobals(); vi.unstubAllEnvs() })

  it('sends nothing until HERO_REMINDERS is on, then mails each untouched owner once after two days', { timeout: 30_000 }, async () => {
    await seedHero(t, { name: 'Tobias', level: 3, career: { rung: 1, startedTick: 0, reached: [{ id: 'first_win', tick: 1 }], unclaimed: [{ id: 'first_win', gold: 10, tick: 1 }] } }, 'Ana')
    const visitor = await seedHero(t, {}, 'Bo')
    await t.run(async (ctx) => {
      const hero = (await ctx.db.get(visitor))!
      await ctx.db.patch(visitor, { companionVisitBaseline: { at: Date.now(), level: 1, lifetimeXp: 0, logSequence: 1, counters: hero.counters } })
    })
    vi.advanceTimersByTime(2 * DAY)
    expect(await t.mutation(internal.heroReminder.queueDaily, {})).toBe(0)
    vi.stubEnv('HERO_REMINDERS', 'on')
    expect(await t.mutation(internal.heroReminder.queueDaily, {})).toBe(1)
    await t.finishAllScheduledFunctions(vi.runAllTimers)
    expect(messages()).toHaveLength(1)
    const [mail] = messages()
    expect(mail.to).toEqual(['owner@example.com'])
    expect(mail.subject).toBe('Desk Crawler for TRMNL: Tobias has 10 gold waiting')
    expect(mail.text).toContain('Tobias has been adventuring on your TRMNL since you installed Desk Crawler on 13 October, and is now level 3.')
    expect(mail.text).toContain('- 10 gold from a goal reached, ready to claim')
    expect(mail.text).toMatch(/https:\/\/trmnlgames\.com\/desk-crawler\/unsubscribe\?u=[^&]+&t=[a-f0-9]{64}/)
    expect(mail.headers['List-Unsubscribe']).toMatch(/^<https:\/\/trmnlgames\.com\/desk-crawler\/unsubscribe/)
    expect((await user('Ana'))!.heroReminderSentAt).toBeDefined()
    // Once is all: the next day's run finds nobody.
    vi.advanceTimersByTime(DAY)
    expect(await t.mutation(internal.heroReminder.queueDaily, {})).toBe(0)
  })

  it('waits two days, gives the claim back when a send fails, and skips an owner who opened the companion meanwhile', { timeout: 30_000 }, async () => {
    vi.stubEnv('HERO_REMINDERS', 'on')
    const hero = await seedHero(t, {}, 'Ana')
    vi.advanceTimersByTime(DAY)
    expect(await t.mutation(internal.heroReminder.queueDaily, {})).toBe(0)
    vi.advanceTimersByTime(DAY)
    fetchMock.mockImplementation(async (url: string) => new Response(url.startsWith('https://api.clerk.com') ? JSON.stringify(clerkUser) : '{}', { status: url.startsWith('https://api.resend.com') ? 500 : 200 }))
    expect(await t.mutation(internal.heroReminder.queueDaily, {})).toBe(1)
    await t.finishAllScheduledFunctions(vi.runAllTimers)
    expect((await user('Ana'))!.heroReminderSentAt).toBeUndefined()
    await t.run(async (ctx) => {
      const row = (await ctx.db.get(hero))!
      await ctx.db.patch(hero, { counters: { ...row.counters, itemsEquipped: 1 } })
    })
    expect(await t.mutation(internal.heroReminder.queueDaily, {})).toBe(0)
  })

  it('stops reminders only with the link the email carried', { timeout: 30_000 }, async () => {
    vi.stubEnv('HERO_REMINDERS', 'on')
    await seedHero(t, {}, 'Ana')
    vi.advanceTimersByTime(2 * DAY)
    const ana = (await user('Ana'))!
    const sent = await t.action(internal.heroReminder.sendTest, { alias: 'Ana' })
    expect(sent).toBe('sent')
    const link = new URL(messages()[0].text.match(/https:\/\/trmnlgames\.com\/desk-crawler\/unsubscribe\S+/)![0])
    // A test send marks nothing, so the owner is still due.
    expect((await user('Ana'))!.heroReminderSentAt).toBeUndefined()
    expect(await t.mutation(api.heroReminder.stop, { userId: ana._id, token: 'f'.repeat(64) })).toBe(false)
    expect(await t.mutation(api.heroReminder.stop, { userId: link.searchParams.get('u')!, token: link.searchParams.get('t')! })).toBe(true)
    expect((await user('Ana'))!.heroReminderStoppedAt).toBeDefined()
    expect(await t.mutation(internal.heroReminder.queueDaily, {})).toBe(0)
  })
})

describe('the hero reminder text', () => {
  const facts = { name: 'Tobias', level: 3, since: Date.UTC(2026, 9, 13, 9), timezone: 'Europe/Paris', gold: 25, goals: 2, finds: 7, capacity: 10, best: 'Rare Keyboard Mace', nextGoal: 'Equip a piece of gear you found' }
  const links = { app: 'https://trmnlgames.com/app/desk-crawler', stop: 'https://trmnlgames.com/stop' }

  it('lists only what is there, in every language, with the stop link last', () => {
    const en = heroReminderEmail('en', facts, links)
    expect(en.subject).toBe('Desk Crawler for TRMNL: Tobias has 25 gold waiting')
    expect(en.text).toContain('- 25 gold from 2 goals reached, ready to claim\n- 7 finds in the bag (7 of 10 slots). Best find: Rare Keyboard Mace\n- Next goal: Equip a piece of gear you found')
    const quiet = heroReminderEmail('en', { ...facts, gold: 0, goals: 0, finds: 0, best: null }, links)
    expect(quiet.subject).toBe('Desk Crawler for TRMNL: Tobias is level 3')
    expect(quiet.text).not.toContain('gold from')
    expect(quiet.text).toContain('Here’s what’s next in the Desk Crawler app:')
    for (const locale of ['en', 'fr', 'de', 'es', 'it', 'pt', 'pl', 'nl'] as const) {
      const mail = heroReminderEmail(locale, facts, links)
      expect(mail.subject, locale).toContain('Tobias')
      expect(mail.text.trimEnd().endsWith(links.stop), locale).toBe(true)
      expect(mail.text, locale).toContain(links.app)
      expect(mail.text, locale).not.toMatch(/undefined|NaN|—/)
    }
    expect(heroReminderEmail('fr', facts, links).text).toContain('le 13 octobre')
    expect(heroReminderEmail('de', facts, links).text).toContain('am 13. Oktober')
  })
})
