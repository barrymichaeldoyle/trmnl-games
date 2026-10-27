// @vitest-environment edge-runtime
import { convexTest } from 'convex-test'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { api, internal } from '@trmnl-games/backend/api'
import { ACTIVE_CONTENT } from '@trmnl-games/desk-crawler/content'
import schema from '../../apps/backend/convex/schema'
import { runTick, seedHero, seedWorld, type T } from './helpers'

const modules = import.meta.glob('../../apps/backend/convex/**/*.ts')

describe('owner-run moderation (D23)', () => {
  let t: T
  beforeEach(async () => {
    vi.useFakeTimers()
    vi.setSystemTime(Date.UTC(2026, 9, 3, 10, 0))
    vi.stubEnv('ADMIN_TOKEN_IDENTIFIERS', 'issuer|Admin')
    t = convexTest(schema, modules)
    await seedWorld(t)
  })
  afterEach(() => {
    vi.useRealTimers()
    vi.unstubAllEnvs()
  })

  it('refuses non-admins and audits admin name repair without touching progress', async () => {
    const heroId = await seedHero(t, { lifetimeXp: 300, level: 3, xp: 99 }, 'Rude')
    const user = await t.run(async (ctx) => (await ctx.db.get(heroId))!.userId)
    await expect(t.withIdentity({ issuer: 'issuer', subject: 'Rude' }).mutation(api.admin.repairPublicNames, { userId: user, reasonCode: 'x' })).rejects.toThrow()

    const admin = t.withIdentity({ issuer: 'issuer', subject: 'Admin' })
    await admin.mutation(api.admin.repairPublicNames, { userId: user, reasonCode: 'offensive_name' })
    const [u, h, events] = await t.run(async (ctx) => [await ctx.db.get(user), await ctx.db.get(heroId), await ctx.db.query('adminAuditEvents').collect()])
    expect(u).toMatchObject({ publicNameVersion: 2, nameRepairRequired: true })
    expect(u?.publicAlias).toMatch(/^Adventurer-/)
    expect(h).toMatchObject({ name: 'Hero', lifetimeXp: 300, level: 3, xp: 99 })
    expect(events).toHaveLength(1)

    const owner = t.withIdentity({ issuer: 'issuer', subject: 'Rude' })
    await owner.mutation(api.users.replacePublicNames, { operationId: 'names-0001', publicAlias: 'Polite', heroName: 'Gentle' })
    expect(await t.run(async (ctx) => await ctx.db.get(user))).toMatchObject({ publicAlias: 'Polite', publicNameVersion: 3, nameRepairRequired: false })
    expect(await owner.mutation(api.users.replacePublicNames, { operationId: 'names-0002', publicAlias: 'Again', heroName: 'Again' })).toMatchObject({ ok: false })
  })

  it('suspension blocks commands until restored', async () => {
    const heroId = await seedHero(t, {}, 'Spam')
    const user = await t.run(async (ctx) => (await ctx.db.get(heroId))!.userId)
    const admin = t.withIdentity({ issuer: 'issuer', subject: 'Admin' })
    await admin.mutation(api.admin.setSuspended, { userId: user, suspended: true, reasonCode: 'abuse' })
    const player = t.withIdentity({ issuer: 'issuer', subject: 'Spam' })
    expect(await player.mutation(api.heroes.pause, { operationId: 'pause-0009' })).toMatchObject({ ok: false })
    await admin.mutation(api.admin.setSuspended, { userId: user, suspended: false, reasonCode: 'appeal_ok' })
    await player.mutation(api.heroes.pause, { operationId: 'pause-0010' })
  })

  it('reports v1.1 engagement across active heroes regardless of analytics consent', async () => {
    const chooser = await seedHero(t, { stance: 'bold', potionCap: 30 })
    await t.run(async (ctx) => {
      const hero = (await ctx.db.get(chooser))!
      await ctx.db.patch(chooser, { counters: { ...hero.counters, choicesMade: 2, choicesDefaulted: 1, stanceChanges: 3, merchantVisits: 2, purchases: 1 }, companionVisitBaseline: { at: Date.now(), level: 1, lifetimeXp: 0, logSequence: 1, counters: hero.counters } })
      await ctx.db.patch(hero.userId, { analyticsConsent: false })
    })
    const passive = await seedHero(t, { choice: { eventId: 'e', offeredAtTick: 1, expiresAtTick: 97, biomeTier: 1 } })
    await t.run(async (ctx) => await ctx.db.patch(passive, { counters: { ...(await ctx.db.get(passive))!.counters, choicesDefaulted: 4 } }))
    await seedHero(t, { activationState: 'pending_trmnl' })

    const stats = await t.query(internal.admin.engagement, {})
    expect(stats).toMatchObject({
      truncated: false,
      activeHeroes: 2,
      companionVisits: { within1Day: 1, within7Days: 1, never: 1 },
      stances: { bold: 1, balanced: 1 },
      stanceChanges: { total: 3, heroes: 1 },
      choices: { made: 2, defaulted: 5, heroesWhoChose: 1, pending: 1 },
      merchant: { visits: 2, purchases: 1, heroesMet: 1, heroesBought: 1, open: 0 },
      potionCap: { 30: 1, default: 1 },
      analyticsConsent: { declined: 1, unset: 2 },
    })
    // Both heroes started this week: one has opened the companion, today.
    expect(Object.values(stats.retention)).toEqual([{ heroes: 2, visitedEver: 1, visited7Days: 1 }])
  })

  it('counts a visit per owner, across parked heroes and companion-only actions (D213)', async () => {
    const seller = await seedHero(t, {})
    const switcher = await seedHero(t, {})
    await t.run(async (ctx) => {
      const sold = (await ctx.db.get(seller))!
      await ctx.db.patch(seller, { counters: { ...sold.counters, itemsSold: 2 } })
      const old = (await ctx.db.get(switcher))!
      await ctx.db.patch(switcher, { isActive: false, parkedAtTick: 1, companionVisitBaseline: { at: Date.now(), level: 1, lifetimeXp: 0, logSequence: 1, counters: old.counters } })
      const { _id, _creationTime, ...rest } = old
      await ctx.db.insert('heroes', { ...rest, name: 'Odin', class: 'rogue', isActive: true })
    })
    await seedHero(t, {})
    const stats = await t.query(internal.admin.engagement, {})
    // The seller has no recap time, so only the switcher's visit falls in the windows.
    expect(stats.companionVisits).toEqual({ within1Day: 1, within7Days: 1, never: 1 })
    expect(Object.values(stats.retention).reduce((sum: number, week) => sum + (week as { visitedEver: number }).visitedEver, 0)).toBe(2)
  })

  it('keeps one engagement report a day and reads the trend back newest first (D197)', async () => {
    await seedHero(t, {})
    await t.mutation(internal.admin.snapshotEngagement, {})
    await t.mutation(internal.admin.snapshotEngagement, {})
    vi.advanceTimersByTime(24 * 60 * 60 * 1000)
    await seedHero(t, {})
    await t.mutation(internal.admin.snapshotEngagement, {})
    const history = await t.query(internal.admin.engagementHistory, { days: 7 })
    expect(history.days.map((d: { heroes: number }) => d.heroes)).toEqual([2, 1])
    expect(history.days[0]).toMatchObject({ visited1Day: 0, neverVisited: 2 })
    expect(Object.values(history.retention).reduce((sum: number, week) => sum + (week as { heroes: number }).heroes, 0)).toBe(2)
  })

  it('releases a quarantined hero and brings HP back under its class ceiling, from the page and from the terminal', async () => {
    await t.run(async (ctx) => { const world = (await ctx.db.query('worldState').first())!; await ctx.db.patch(world._id, { activeContentVersion: ACTIVE_CONTENT }) })
    const heroId = await seedHero(t, { class: 'rogue', level: 6, hp: 160, simulationState: 'quarantined', quarantineReasonCode: 'HP' }, 'Tdb')
    const admin = t.withIdentity({ issuer: 'issuer', subject: 'Admin' })
    await expect(t.withIdentity({ issuer: 'issuer', subject: 'Tdb' }).mutation(api.admin.releaseHero, { heroId, reasonCode: 'x' })).rejects.toThrow()
    await admin.mutation(api.admin.releaseHero, { heroId, reasonCode: 'hp_ceiling_fixed' })
    expect(await t.run(async (ctx) => await ctx.db.get(heroId))).toMatchObject({ simulationState: 'healthy', hp: 148 })
    const events = await t.run(async (ctx) => await ctx.db.query('adminAuditEvents').collect())
    expect(events.at(-1)).toMatchObject({ action: 'release_hero', reasonCode: 'hp_ceiling_fixed', outcome: 'healthy, hp 160 to 148' })
    await expect(admin.mutation(api.admin.releaseHero, { heroId, reasonCode: 'again' })).rejects.toThrow()

    const other = await seedHero(t, { level: 3, hp: 50, simulationState: 'quarantined', quarantineReasonCode: 'XP' }, 'Cli')
    expect(await t.mutation(internal.admin.releaseHeroFromCli, { heroId: other, reasonCode: 'diagnosed' })).toEqual({ outcome: 'healthy' })
    expect(await t.run(async (ctx) => await ctx.db.get(other))).toMatchObject({ simulationState: 'healthy', hp: 50 })
  })

  it('compensates a hero with audited gold and a log line the player can read, within bounds', async () => {
    const heroId = await seedHero(t, { gold: 40 }, 'Tdb')
    expect(await t.mutation(internal.admin.compensateHero, { heroId, gold: 300, reasonCode: 'hp_quarantine_2026_10_26' })).toEqual({ gold: 340 })
    const hero = await t.run(async (ctx) => await ctx.db.get(heroId))
    expect(hero).toMatchObject({ gold: 340, level: 1 })
    expect(hero?.counters.goldEarned).toBe(300)
    const log = await t.run(async (ctx) => await ctx.db.query('tickLogs').withIndex('by_heroId_and_at_and_sequence', (q) => q.eq('heroId', heroId)).order('desc').first())
    expect(log).toMatchObject({ source: 'command', kind: 'system', summary: 'Thanks for the heads-up about the pause. The office chipped in [[300 gold]].', detail: { operation: 'compensate' }, deltas: { gold: 300, xpEarned: 0, hp: 0 } })
    expect((await t.run(async (ctx) => await ctx.db.query('adminAuditEvents').collect())).at(-1)).toMatchObject({ action: 'compensate_hero', outcome: 'gold +300', reasonCode: 'hp_quarantine_2026_10_26' })
    await expect(t.mutation(internal.admin.compensateHero, { heroId, gold: 0, reasonCode: 'x' })).rejects.toThrow()
    await expect(t.mutation(internal.admin.compensateHero, { heroId, gold: 5001, reasonCode: 'x' })).rejects.toThrow()
  })

  it('catches a released hero up through the real runs it missed, tick by tick, and audits both ends', async () => {
    const NOW = Date.UTC(2026, 9, 3, 10, 0, 2)
    vi.setSystemTime(NOW)
    await t.run(async (ctx) => { const world = (await ctx.db.query('worldState').first())!; await ctx.db.patch(world._id, { activeContentVersion: ACTIVE_CONTENT, lastPublishedAt: NOW - 5 * 60_000 }) })
    // Over the ceiling from the start: quarantined on tick 1, then carried as quarantined through ticks 2 to 4.
    const heroId = await seedHero(t, { hp: 999 }, 'Tdb')
    const witness = await seedHero(t, {}, 'Other')
    for (let tick = 1; tick <= 4; tick += 1) {
      vi.setSystemTime(NOW + (tick - 1) * 15 * 60_000)
      await runTick(t)
    }
    expect(await t.run(async (ctx) => await ctx.db.get(heroId))).toMatchObject({ simulationState: 'quarantined', lastTick: 4 })
    expect(await t.run(async (ctx) => await ctx.db.get(witness))).toMatchObject({ lastTick: 4 })
    await expect(t.mutation(internal.admin.catchUpHero, { heroId, fromTick: 1, reasonCode: 'x' })).rejects.toThrow()
    expect(await t.mutation(internal.admin.releaseHeroFromCli, { heroId, reasonCode: 'fixed' })).toEqual({ outcome: 'healthy, hp 999 to 100' })

    expect(await t.mutation(internal.admin.catchUpHero, { heroId, fromTick: 1, reasonCode: 'hp_quarantine' })).toEqual({ state: 'scheduled', lastTick: 0, toTick: 4 })
    await t.finishAllScheduledFunctions(vi.runAllTimers)
    const hero = await t.run(async (ctx) => await ctx.db.get(heroId))
    expect(hero).toMatchObject({ simulationState: 'healthy', lastTick: 4 })
    expect(hero!.lifetimeXp).toBeGreaterThan(0)
    const ticks = await t.run(async (ctx) => (await ctx.db.query('tickLogs').withIndex('by_heroId_and_at_and_sequence', (q) => q.eq('heroId', heroId)).collect()).filter((e) => e.source === 'tick').map((e) => e.tick))
    expect(new Set(ticks)).toEqual(new Set([1, 2, 3, 4]))
    const audits = (await t.run(async (ctx) => await ctx.db.query('adminAuditEvents').collect())).filter((a) => a.action === 'catch_up_hero').map((a) => a.outcome)
    expect(audits[0]).toBe('start 1..4')
    expect(audits.at(-1)).toMatch(/^done 1\.\.4: level \d+, \d+ gold/)
  })
})
