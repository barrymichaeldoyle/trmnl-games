import { describe, expect, it } from 'vitest'
import { contentV18 } from '@trmnl-games/desk-crawler/content/v18'
import { contentV19 } from '@trmnl-games/desk-crawler/content/v19'
import { validateCatalog } from '@trmnl-games/desk-crawler/content/validate'
import { codePoints } from '@trmnl-games/desk-crawler/sim/core/narrative'
import { localDay, occasionAt, occasionCalendar, occasionStarts } from '@trmnl-games/desk-crawler/sim/core/occasions'
import { planRaid } from '@trmnl-games/desk-crawler/sim/core/raid'
import { simulateHero, SIMULATION_VERSION } from '@trmnl-games/desk-crawler/sim/core/simulate'
import { scaled } from '@trmnl-games/desk-crawler/sim/core/modifiers'
import { heroMaxHp } from '@trmnl-games/desk-crawler/sim/core/stats'
import { starterHero, starterKit } from '@trmnl-games/desk-crawler/sim/core/starter'
import type { ContentCatalog, HeroState, IncomingRaid, ItemSnapshot, OccasionDateRule, RaidTarget, SimulationInput, SimulationResult, StreamSeeds } from '@trmnl-games/desk-crawler/sim/core/types'
import { seeds, withId } from './helpers'

const DAY = 24 * 60 * 60 * 1000
const iso = (day: number) => new Date(day * DAY).toISOString().slice(0, 10)
const noon = (date: string) => Date.parse(`${date}T12:00:00Z`)
const withRaid = (n: number): StreamSeeds => ({ ...seeds(n), raid: (n * 2891336453 + 7) >>> 0, quest: (n * 1597334677 + 11) >>> 0 })

function setup(content: ContentCatalog, overrides: Partial<HeroState> = {}): { hero: HeroState; inventory: ItemSnapshot[] } {
  const kit = starterKit(content)
  const inventory = [withId(kit.weapon, 'i000'), withId(kit.armor, 'i001'), withId({ ...kit.potions, quantity: 3 }, 'i999')]
  const base: HeroState = { ...starterHero('hero1', content, 0), weaponId: 'i000', armorId: 'i001', level: 8, biomeId: 'server_room', gold: 400, bagCapacity: 13, potionCap: 20, ...overrides }
  return { hero: { ...base, hp: overrides.hp ?? heroMaxHp(content, base) }, inventory }
}

const tick = (content: ContentCatalog, hero: HeroState, inventory: ItemSnapshot[], seed: number, tickAt: number, extra: Partial<SimulationInput> = {}): SimulationResult =>
  simulateHero({ hero, inventory, tick: 500, content, simulationVersion: SIMULATION_VERSION, streams: withRaid(seed), tickAt, ...extra })

const occasionLines = (result: SimulationResult) => (result.extraEvents ?? []).filter((event) => event.kind === 'occasion')

describe('office calendar (D139)', () => {
  it('validates v19 and fits every line in the summary budget', () => {
    expect(validateCatalog(contentV19)).toEqual([])
    for (const rule of contentV19.occasions!) {
      for (const line of [...rule.lines, ...(rule.effect?.gift?.lines ?? [])]) expect(codePoints(line)).toBeLessThanOrEqual(contentV19.constants.summaryMaxCodePoints)
    }
  })

  it('resolves the date rules to the published dates', () => {
    const rule = (id: string): OccasionDateRule => contentV19.occasions!.find((r) => r.id === id)!.date
    expect(occasionStarts(rule('thanksgiving'), 2026).map(iso)).toEqual(['2026-11-26'])
    expect(occasionStarts(rule('black_friday'), 2026).map(iso)).toEqual(['2026-11-27'])
    expect(occasionStarts(rule('thanksgiving'), 2027).map(iso)).toEqual(['2027-11-25'])
    expect(occasionStarts(rule('easter'), 2027).map(iso)).toEqual(['2027-03-26'])
    expect(occasionStarts(rule('easter'), 2028).map(iso)).toEqual(['2028-04-14'])
    expect(occasionStarts(rule('dog_day'), 2027).map(iso)).toEqual(['2027-06-25'])
    expect(occasionStarts(rule('friday_13th'), 2026).map(iso)).toEqual(['2026-02-13', '2026-03-13', '2026-11-13'])
    expect(occasionStarts(rule('leap_day'), 2027)).toEqual([])
    expect(occasionStarts(rule('leap_day'), 2028).map(iso)).toEqual(['2028-02-29'])
  })

  it('follows the local date, and an occurrence that crosses New Year keeps one key', () => {
    const lateOct30 = Date.parse('2026-10-30T23:00:00Z')
    expect(occasionAt(contentV19, lateOct30, 0)).toBeUndefined()
    expect(occasionAt(contentV19, lateOct30, 2 * 3600)?.key).toBe('halloween@2026-10-31')
    expect(occasionAt(contentV19, noon('2027-01-01'), 0)?.key).toBe('new_year@2026-12-31')
    expect(occasionAt(contentV19, noon('2026-12-26'), 0)?.key).toBe('christmas@2026-12-24')
    expect(occasionAt(contentV19, noon('2026-12-27'), 0)).toBeUndefined()
    // An offset outside ±14 hours reads UTC; a catalog without occasions has none.
    expect(occasionAt(contentV19, lateOct30, 20 * 3600)).toBeUndefined()
    expect(occasionAt(contentV18, noon('2026-10-31'), 0)).toBeUndefined()
  })

  it('tells the companion today’s occasion with its days left and the next one to start', () => {
    const on = (date: string) => occasionCalendar(contentV19, localDay(noon(date), 0))
    expect(on('2026-10-13')).toEqual({ next: { rule: expect.objectContaining({ id: 'bosses_day' }), inDays: 3 } })
    expect(on('2026-10-17')).toEqual({ next: { rule: expect.objectContaining({ id: 'halloween' }), inDays: 14 } })
    expect(on('2026-10-31')).toMatchObject({ live: { rule: { id: 'halloween' }, daysLeft: 1 }, next: { rule: { id: 'diwali' }, inDays: 8 } })
    expect(on('2026-12-24')).toMatchObject({ live: { rule: { id: 'christmas' }, daysLeft: 3 }, next: { rule: { id: 'new_year' }, inDays: 7 } })
    expect(on('2026-12-25')).toMatchObject({ live: { rule: { id: 'christmas' }, daysLeft: 2 } })
    expect(occasionCalendar(contentV18, localDay(noon('2026-10-31'), 0))).toEqual({})
  })

  it('plays an ordinary day exactly as v18', () => {
    const at = noon('2026-10-20')
    const { hero, inventory } = setup(contentV19)
    const target: RaidTarget = { heroId: 'rival', name: 'Quill', gold: 300 }
    for (let seed = 0; seed < 300; seed += 1) {
      const a = tick(contentV18, hero, inventory, seed, at, { raidTarget: target })
      const b = tick(contentV19, hero, inventory, seed, at, { raidTarget: target })
      expect(JSON.stringify(b).replaceAll('"v19"', '"v18"')).toBe(JSON.stringify(a))
    }
  })

  it('announces an occurrence once, counts it, and skips a paused hero', () => {
    const at = noon('2026-10-31')
    const { hero, inventory } = setup(contentV19)
    const first = tick(contentV19, hero, inventory, 1, at)
    const lines = occasionLines(first)
    expect(lines).toHaveLength(1)
    expect(contentV19.occasions!.find((r) => r.id === 'halloween')!.lines).toContain(lines[0]!.summary)
    expect(lines[0]!.detail.outcome).toEqual({ variant: 'occasion', occasionId: 'halloween', key: 'halloween@2026-10-31' })
    expect(first.nextHero.occasion).toEqual({ key: 'halloween@2026-10-31' })
    expect(first.nextHero.counters.occasionsSeen).toBe(1)
    const again = tick(contentV19, { ...first.nextHero, hp: hero.hp }, inventory, 2, at + 15 * 60 * 1000)
    expect(occasionLines(again)).toHaveLength(0)
    expect(again.nextHero.counters.occasionsSeen).toBe(1)
    const paused = tick(contentV19, { ...hero, status: 'paused', pausedFromStatus: 'exploring' }, inventory, 1, at)
    expect(occasionLines(paused)).toHaveLength(0)
    expect(paused.nextHero.occasion).toBeUndefined()
    // A dead hero still hears about it.
    const dead = tick(contentV19, { ...hero, status: 'dead', hp: 0, reviveAtTick: 900 }, inventory, 1, at)
    expect(occasionLines(dead)).toHaveLength(1)
  })

  it('adds Halloween gold to a victory', () => {
    const at = noon('2026-10-31')
    const { hero, inventory } = setup(contentV19)
    let checked = 0
    for (let seed = 0; seed < 400 && checked < 10; seed += 1) {
      const plain = tick(contentV18, hero, inventory, seed, at).event?.detail.outcome
      const party = tick(contentV19, hero, inventory, seed, at).event?.detail.outcome
      if (plain?.variant !== 'combat' || plain.outcome !== 'victory' || party?.variant !== 'combat') continue
      expect(party.goldGranted).toBe(scaled(plain.goldGranted, 15))
      checked += 1
    }
    expect(checked).toBe(10)
  })

  it('gives one Christmas gift per occurrence, after a career guarantee', () => {
    const at = noon('2026-12-25')
    const { hero, inventory } = setup(contentV19)
    const gifted = tick(contentV19, hero, inventory, 3, at)
    const outcome = gifted.event?.detail.outcome
    expect(outcome?.variant === 'loot' && outcome.found === 'gear').toBe(true)
    expect(gifted.event!.summary).toMatch(/gift/i)
    expect(gifted.nextHero.occasion).toEqual({ key: 'christmas@2026-12-24', gifted: true })
    // The next adventure is ordinary.
    let gear = 0
    for (let seed = 0; seed < 200; seed += 1) {
      const next = tick(contentV19, { ...gifted.nextHero, hp: hero.hp }, inventory, seed, at)
      const o = next.event?.detail.outcome
      if (o?.variant === 'loot' && o.found === 'gear') gear += 1
    }
    expect(gear).toBeLessThan(100)
    // Next year's occurrence gives another.
    const nextYear = tick(contentV19, { ...gifted.nextHero, hp: hero.hp }, inventory, 3, noon('2027-12-24'))
    expect(nextYear.nextHero.occasion).toEqual({ key: 'christmas@2027-12-24', gifted: true })
  })

  it('halves Black Friday merchant prices and doubles its visits', () => {
    const at = noon('2026-11-27')
    const ordinary = noon('2026-11-20')
    const { hero, inventory } = setup(contentV19)
    let sale = 0
    let plain = 0
    for (let seed = 0; seed < 4000; seed += 1) {
      const r = tick(contentV19, hero, inventory, seed, at)
      if (r.event?.detail.outcome.variant === 'merchant') {
        sale += 1
        const offer = r.nextHero.merchant!.offers.find((o) => o.id === 'potions')!
        expect(offer.price).toBe(Math.max(1, Math.floor((contentV19.merchant!.potionPrice * 2 * offer.quantity) / 2)))
      }
      if (tick(contentV19, hero, inventory, seed, ordinary).event?.detail.outcome.variant === 'merchant') plain += 1
    }
    expect(sale / plain).toBeGreaterThan(1.6)
    expect(sale / plain).toBeLessThan(2.5)
  })

  it('doubles raid launches on Friday the 13th and makes every raid a mishap for both sides', () => {
    const at = noon('2026-11-13')
    const day = Math.floor(at / DAY)
    expect(iso(day)).toBe('2026-11-13')
    let normal = 0
    let doubled = 0
    for (let seed = 0; seed < 20000; seed += 1) {
      if (planRaid(withRaid(seed), 'balanced', contentV19)) normal += 1
      if (planRaid(withRaid(seed), 'balanced', contentV19, 200)) doubled += 1
    }
    expect(doubled / normal).toBeGreaterThan(1.8)
    expect(doubled / normal).toBeLessThan(2.2)

    const { hero, inventory } = setup(contentV19, { stance: 'bold' })
    const target: RaidTarget = { heroId: 'rival', name: 'Quill', gold: 300 }
    let seen = 0
    for (let seed = 0; seed < 3000 && seen < 5; seed += 1) {
      const r = tick(contentV19, hero, inventory, seed, at, { raidTarget: target })
      // The adapter asks for a target with the same doubled share, so the two never disagree.
      expect(r.raidLaunch !== undefined).toBe(planRaid(withRaid(seed), 'bold', contentV19, 200) !== undefined && r.event?.kind !== 'rest')
      if (r.raidLaunch === undefined) continue
      seen += 1
      expect(r.raidLaunch).toMatchObject({ raiderWon: false, mishap: true, targetHpPct: 20, gold: Math.floor((400 * 5) / 100) })
      const outcome = r.event!.detail.outcome
      expect(outcome).toMatchObject({ variant: 'raid', role: 'raider', won: false, mishap: true })
      expect(r.nextHero.counters.raidMishaps).toBe(1)
      expect(r.nextHero.counters.raidsWon).toBe(0)
      // The gold goes nowhere: the raider is poorer and the ledger records only its own loss.
      expect(r.event!.deltas.gold).toBe(-20)
      expect(r.event!.summary).toContain('Quill')
    }
    expect(seen).toBe(5)
  })

  it('lands a mishap on the target as its own loss, whatever day it is applied', () => {
    const { hero, inventory } = setup(contentV19, { gold: 1000 })
    const raid: IncomingRaid = { raiderHeroId: 'rival', raiderName: 'Baz', tick: 499, raiderWon: false, gold: 7, targetHpPct: 20, mishap: true }
    const r = tick(contentV19, hero, inventory, 1, noon('2026-11-14'), { incomingRaid: raid })
    expect(r.raidApplied).toBe(true)
    expect(r.event!.detail.outcome).toMatchObject({ variant: 'raid', role: 'target', won: false, mishap: true, gold: 50 })
    expect(r.event!.deltas.gold).toBe(-50)
    expect(r.event!.deltas.hp).toBe(-Math.ceil((heroMaxHp(contentV19, hero) * 20) / 100))
    expect(r.nextHero.counters.raidMishaps).toBe(1)
    expect(r.nextHero.counters.raidsLost).toBe(0)
    expect(r.event!.summary).toContain('Baz')
  })
})
