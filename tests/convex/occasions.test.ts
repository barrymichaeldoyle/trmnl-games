// @vitest-environment edge-runtime
import { convexTest } from 'convex-test'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import type { Id } from '@trmnl-games/backend/data-model'
import schema from '../../apps/backend/convex/schema'
import { contentV19 } from '@trmnl-games/desk-crawler/content/v19'
import type { RaidRule } from '@trmnl-games/desk-crawler/sim/core/types'
import { SLOT_MS } from '../../apps/backend/convex/sim/runs/tick'
import { runTick, seedHero, seedWorld, type T } from './helpers'

const modules = import.meta.glob('../../apps/backend/convex/**/*.ts')
const raidRules = contentV19.raids!
/** Every exploring tick launches, so a test needs no seed search. */
const alwaysRaid: RaidRule = { ...raidRules, launchPermille: { cautious: 1000, balanced: 1000, bold: 1000 } }
const setRules = (rules: RaidRule) => {
  ;(contentV19 as { raids?: RaidRule }).raids = rules
}

const state = (t: T) =>
  t.run(async (ctx) => ({
    raids: await ctx.db.query('raids').collect(),
    heroes: await ctx.db.query('heroes').collect(),
    logs: await ctx.db.query('tickLogs').collect(),
  }))

describe('office calendar backend (D139)', () => {
  let t: T
  let start: number
  const tickAt = async (slot: number) => {
    vi.setSystemTime(start + slot * SLOT_MS)
    return await runTick(t)
  }
  beforeEach(() => {
    vi.useFakeTimers()
    t = convexTest(schema, modules)
    setRules(alwaysRaid)
  })
  afterEach(() => {
    setRules(raidRules)
    vi.useRealTimers()
  })

  it('announces Friday the 13th once per hero and records every raid as a mishap on both sides', async () => {
    start = Date.UTC(2026, 10, 13, 10, 0, 2)
    vi.setSystemTime(start)
    await seedWorld(t, { activeContentVersion: 'v19', currentTick: 10, lastPublishedAt: start - 30 * 60_000 })
    const ids: Id<'heroes'>[] = []
    for (const alias of ['Ana', 'Bo', 'Cy', 'Di']) ids.push(await seedHero(t, { level: 8, hp: 180, gold: 400 }, alias))
    for (let slot = 0; slot <= 4; slot += 1) await tickAt(slot)
    const { raids, heroes, logs } = await state(t)

    expect(raids.length).toBeGreaterThan(0)
    for (const raid of raids) expect(raid).toMatchObject({ mishap: true, raiderWon: false, targetHpPct: 20 })
    const applied = raids.filter((raid) => raid.state === 'applied')
    expect(applied.length).toBeGreaterThan(0)
    for (const hero of heroes) {
      const sides = raids.filter((raid) => raid.raiderHeroId === hero._id).length + applied.filter((raid) => raid.targetHeroId === hero._id).length
      expect(hero.counters.raidMishaps ?? 0).toBe(sides)
      expect(hero.counters.raidsWon ?? 0).toBe(0)
      expect(hero.counters.raidsLost ?? 0).toBe(0)
      expect(hero.counters.occasionsSeen).toBe(1)
      expect(hero.occasion).toEqual({ key: 'friday_13th@2026-11-13' })
      const lines = logs.filter((log) => log.heroId === hero._id && log.kind === 'occasion')
      expect(lines).toHaveLength(1)
      expect(lines[0]!.detail).toMatchObject({ outcome: { variant: 'occasion', occasionId: 'friday_13th', key: 'friday_13th@2026-11-13' } })
    }
    const raidLogs = logs.filter((log) => log.kind === 'raid' || log.kind === 'death')
    expect(raidLogs.some((log) => 'outcome' in log.detail && log.detail.outcome.variant === 'raid' && log.detail.outcome.mishap === true)).toBe(true)
  })

  it('plays an ordinary day without occasion lines and with ordinary raids', async () => {
    start = Date.UTC(2026, 10, 12, 10, 0, 2)
    vi.setSystemTime(start)
    await seedWorld(t, { activeContentVersion: 'v19', currentTick: 10, lastPublishedAt: start - 30 * 60_000 })
    for (const alias of ['Ana', 'Bo', 'Cy']) await seedHero(t, { level: 8, hp: 180, gold: 400 }, alias)
    for (let slot = 0; slot <= 2; slot += 1) await tickAt(slot)
    const { raids, heroes, logs } = await state(t)
    expect(raids.length).toBeGreaterThan(0)
    expect(raids.every((raid) => raid.mishap === undefined)).toBe(true)
    expect(logs.some((log) => log.kind === 'occasion')).toBe(false)
    expect(heroes.every((hero) => hero.occasion === undefined && (hero.counters.occasionsSeen ?? 0) === 0)).toBe(true)
  })
})
