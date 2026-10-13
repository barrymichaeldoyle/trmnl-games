import { describe, expect, it } from 'vitest'
import { contentV19 } from '@trmnl-games/desk-crawler/content/v19'
import { contentV20 } from '@trmnl-games/desk-crawler/content/v20'
import { validateCatalog } from '@trmnl-games/desk-crawler/content/validate'
import { codePoints, fill } from '@trmnl-games/desk-crawler/sim/core/narrative'
import { planMeeting } from '@trmnl-games/desk-crawler/sim/core/meeting'
import { planRaid } from '@trmnl-games/desk-crawler/sim/core/raid'
import { simulateHero, SIMULATION_VERSION } from '@trmnl-games/desk-crawler/sim/core/simulate'
import { heroMaxHp, xpToLeave } from '@trmnl-games/desk-crawler/sim/core/stats'
import { starterHero, starterKit } from '@trmnl-games/desk-crawler/sim/core/starter'
import type { ContentCatalog, HeroState, IncomingMeeting, IncomingRaid, ItemSnapshot, MeetingPartner, SimulationInput, SimulationResult, StreamSeeds } from '@trmnl-games/desk-crawler/sim/core/types'
import { seeds, withId } from './helpers'

const streams = (n: number): StreamSeeds => ({ ...seeds(n), raid: (n * 2891336453 + 7) >>> 0, quest: (n * 1597334677 + 11) >>> 0, meeting: (n * 3812015801 + 13) >>> 0 })
const partner: MeetingPartner = { heroId: 'rival', name: 'Quill', class: 'rogue' }
const incoming = (overrides: Partial<IncomingMeeting> = {}): IncomingMeeting => ({ starterHeroId: 'rival', starterName: 'Baz', starterClass: 'warrior', tick: 499, kindId: 'coffee_run', ...overrides })

function setup(content: ContentCatalog, overrides: Partial<HeroState> = {}): { hero: HeroState; inventory: ItemSnapshot[] } {
  const kit = starterKit(content)
  const inventory = [withId(kit.weapon, 'i000'), withId(kit.armor, 'i001'), withId({ ...kit.potions, quantity: 3 }, 'i999')]
  const base: HeroState = { ...starterHero('hero1', content, 0), weaponId: 'i000', armorId: 'i001', level: 8, biomeId: 'server_room', gold: 400, bagCapacity: 13, potionCap: 20, ...overrides }
  return { hero: { ...base, hp: overrides.hp ?? heroMaxHp(content, base) }, inventory }
}

const tick = (content: ContentCatalog, hero: HeroState, inventory: ItemSnapshot[], seed: number, extra: Partial<SimulationInput> = {}): SimulationResult =>
  simulateHero({ hero, inventory, tick: 500, content, simulationVersion: SIMULATION_VERSION, streams: streams(seed), tickAt: Date.parse('2026-10-14T12:00:00Z'), ...extra })

/** Seeds whose meeting draw hits and whose raid draw does not, at a stance's raid odds. */
const meetingSeeds = (count: number) => {
  const found: number[] = []
  for (let seed = 0; found.length < count; seed += 1) if (planMeeting(streams(seed), contentV20) && !planRaid(streams(seed), undefined, contentV20)) found.push(seed)
  return found
}

describe('meetings (D141)', () => {
  it('validates v20 and fits every compact line beside the longest name and the boon', () => {
    expect(validateCatalog(contentV20)).toEqual([])
    for (const kind of contentV20.meetings!.kinds) {
      const effect = contentV20.effects!.find((rule) => rule.id === kind.effectId)!
      expect(codePoints(`${fill(kind.compact, { rival: 'W'.repeat(20) })} ${effect.name} for ${effect.durationTicks} adventures.`)).toBeLessThanOrEqual(contentV20.constants.summaryMaxCodePoints)
    }
  })

  it('leaves v19 untouched by a meeting seed, a partner or a pending meeting', () => {
    const { hero, inventory } = setup(contentV19)
    for (let seed = 0; seed < 400; seed += 1) {
      const { meeting: _, ...plain } = streams(seed)
      const without = simulateHero({ hero, inventory, tick: 500, content: contentV19, simulationVersion: SIMULATION_VERSION, streams: plain, tickAt: Date.parse('2026-10-14T12:00:00Z') })
      expect(tick(contentV19, hero, inventory, seed, { meetingPartner: partner, incomingMeeting: incoming() })).toEqual(without)
    }
  })

  it('starts exactly when planMeeting says so and the raid draw misses; without a partner the tick plays as before', () => {
    const { hero, inventory } = setup(contentV20)
    let launches = 0
    for (let seed = 0; seed < 4000; seed += 1) {
      const met = tick(contentV20, hero, inventory, seed, { meetingPartner: partner })
      const alone = tick(contentV20, hero, inventory, seed)
      expect(alone.meetingLaunch).toBeUndefined()
      if (planMeeting(streams(seed), contentV20) === undefined) expect(met).toEqual(alone)
      else if (met.meetingLaunch !== undefined) {
        launches += 1
        expect(met.event?.kind).toBe('meeting')
        expect(met.raidLaunch).toBeUndefined()
      }
    }
    // 5 permille of 4,000 exploring ticks.
    expect(launches).toBeGreaterThan(8)
    expect(launches).toBeLessThan(40)
  })

  it('gives the starter the kind boon, names the partner, and changes no gold, XP, HP or items', () => {
    const { hero, inventory } = setup(contentV20)
    const kinds = new Set<string>()
    for (const seed of meetingSeeds(60)) {
      const result = tick(contentV20, hero, inventory, seed, { meetingPartner: partner })
      const outcome = result.event!.detail.outcome
      if (outcome.variant !== 'meeting') throw new Error('expected a meeting')
      kinds.add(outcome.kindId)
      const kind = contentV20.meetings!.kinds.find((k) => k.id === outcome.kindId)!
      expect(outcome).toMatchObject({ role: 'starter', rivalHeroId: 'rival', rivalName: 'Quill', rivalClass: 'rogue', meetingTick: 500 })
      expect(result.meetingLaunch).toEqual({ partnerHeroId: 'rival', tick: 500, kindId: kind.id })
      expect(result.event!.detail.effectGained).toBe(kind.effectId)
      expect(result.nextHero.effects).toContainEqual({ id: kind.effectId, untilTick: 508 })
      expect(result.event!.deltas).toEqual({ xpEarned: 0, gold: 0, hp: 0 })
      expect(result.itemChanges).toEqual([])
      expect(result.event!.summary).toContain('Quill')
      expect(result.nextHero.counters.meetings).toBe(1)
      expect(result.nextHero.counters.ticksExplored).toBe(hero.counters.ticksExplored + 1)
    }
    expect(kinds.size).toBe(contentV20.meetings!.kinds.length)
  })

  it('never meets itself, never below level 2, and never on a tick that rests instead', () => {
    const [seed] = meetingSeeds(1)
    const { hero, inventory } = setup(contentV20)
    expect(tick(contentV20, hero, inventory, seed!, { meetingPartner: { ...partner, heroId: hero.id } }).meetingLaunch).toBeUndefined()
    const starter = setup(contentV20, { level: 1 })
    expect(tick(contentV20, starter.hero, starter.inventory, seed!, { meetingPartner: partner }).meetingLaunch).toBeUndefined()
    const low = setup(contentV20, { hp: 5 })
    expect(tick(contentV20, low.hero, low.inventory.filter((item) => item.kind !== 'potion'), seed!, { meetingPartner: partner }).meetingLaunch).toBeUndefined()
  })

  it('a raid takes the tick before a meeting can', () => {
    const { hero, inventory } = setup(contentV20, { stance: 'bold' })
    let seen = 0
    for (let seed = 0; seen < 5; seed += 1) {
      if (!planRaid(streams(seed), 'bold', contentV20) || !planMeeting(streams(seed), contentV20)) continue
      seen += 1
      const result = tick(contentV20, hero, inventory, seed, { raidTarget: { heroId: 'other', name: 'Ada', gold: 100 }, meetingPartner: partner })
      expect(result.raidLaunch).toBeDefined()
      expect(result.meetingLaunch).toBeUndefined()
    }
  })

  it('lands on the partner once as the whole event, with the same boon, exploring or resting', () => {
    for (const status of ['exploring', 'resting'] as const) {
      const { hero, inventory } = setup(contentV20, { status, ...(status === 'resting' ? { hp: 40 } : {}) })
      const result = tick(contentV20, hero, inventory, 3, { incomingMeeting: incoming() })
      expect(result.meetingApplied).toBe(true)
      expect(result.event!.kind).toBe('meeting')
      expect(result.event!.detail.outcome).toMatchObject({ variant: 'meeting', role: 'partner', rivalName: 'Baz', rivalClass: 'warrior', kindId: 'coffee_run', meetingTick: 499 })
      expect(result.nextHero.effects).toContainEqual({ id: 'caffeinated', untilTick: 508 })
      expect(result.event!.deltas).toEqual({ xpEarned: 0, gold: 0, hp: 0 })
      expect(result.nextHero.counters.meetings).toBe(1)
    }
  })

  it('waits behind an incoming raid, and stays pending while the hero is away', () => {
    const { hero, inventory } = setup(contentV20)
    const raid: IncomingRaid = { raiderHeroId: 'r', raiderName: 'Ada', tick: 498, raiderWon: false, gold: 5, targetHpPct: 10 }
    const first = tick(contentV20, hero, inventory, 3, { incomingRaid: raid, incomingMeeting: incoming() })
    expect(first.raidApplied).toBe(true)
    expect(first.meetingApplied).toBeUndefined()
    const travelling = setup(contentV20, { status: 'travelling', targetBiomeId: 'cafeteria_depths', arriveAtTick: 510 })
    expect(tick(contentV20, travelling.hero, travelling.inventory, 3, { incomingMeeting: incoming() }).meetingApplied).toBeUndefined()
  })

  it('a kind the catalog no longer has lands as the first kind', () => {
    const { hero, inventory } = setup(contentV20)
    const result = tick(contentV20, hero, inventory, 3, { incomingMeeting: incoming({ kindId: 'retired' }) })
    expect(result.event!.detail.outcome).toMatchObject({ variant: 'meeting', kindId: 'coffee_run' })
  })

  it('announces meetings at level 2', () => {
    const { hero, inventory } = setup(contentV20, { level: 1, xp: 0 })
    for (let seed = 0; seed < 4000; seed += 1) {
      const result = tick(contentV20, { ...hero, xp: xpToLeave(1) - 1 }, inventory, seed)
      if (result.nextHero.level < 2) continue
      const lines = (result.extraEvents ?? []).filter((event) => event.detail.outcome.variant === 'career' && event.detail.outcome.phase === 'unlocked').map((event) => event.summary)
      expect(lines).toContain('Unlocked: meetings with coworkers.')
      return
    }
    throw new Error('no level-up found')
  })
})

describe('meeting scenes (D141)', () => {
  it('draws the other hero with the meeting prop, and every v20 kind has a prop', async () => {
    const { sceneFor, scenePath } = await import('@trmnl-games/desk-crawler/art/sceneKey')
    const { parseScenePath, renderScenePng } = await import('@trmnl-games/desk-crawler/art/route')
    const { MEETING_PROPS } = await import('@trmnl-games/desk-crawler/art/props')
    for (const kind of contentV20.meetings!.kinds) expect(MEETING_PROPS[kind.id]).toBeDefined()
    const scene = sceneFor('exploring', false, { kind: 'meeting', outcome: { variant: 'meeting', rivalClass: 'rogue', kindId: 'pep_talk' } }, 'warrior')
    expect(scene).toEqual({ pose: 'idle', subject: { kind: 'coworker', heroClass: 'rogue', prop: 'whiteboard' } })
    const path = scenePath('server_room', scene.pose, scene.subject, 5, 'day')
    expect(path).toBe('/art/scene/v5/server_room/day/plain/idle/coworker-rogue-whiteboard/5.png')
    expect(parseScenePath(path)?.subject).toEqual({ kind: 'coworker', heroClass: 'rogue', prop: 'whiteboard' })
    expect(renderScenePng(path)).not.toBeNull()
    expect(renderScenePng(path.replace('5.png', '5-bwry.png'))).not.toBeNull()
    // A kind the art does not know draws the coworker alone; an unknown prop or class is not a scene.
    expect(sceneFor('exploring', false, { kind: 'meeting', outcome: { variant: 'meeting', rivalClass: 'warrior', kindId: 'retired' } }).subject).toEqual({ kind: 'coworker', heroClass: 'warrior' })
    expect(parseScenePath('/art/scene/v5/server_room/day/plain/idle/coworker-warrior/5.png')?.subject).toEqual({ kind: 'coworker', heroClass: 'warrior' })
    expect(parseScenePath('/art/scene/v5/server_room/day/plain/idle/coworker-wizard/5.png')).toBeNull()
    expect(parseScenePath('/art/scene/v5/server_room/day/plain/idle/coworker-rogue-sofa/5.png')).toBeNull()
  })
})
