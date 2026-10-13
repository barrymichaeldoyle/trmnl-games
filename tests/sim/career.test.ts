import { describe, expect, it } from 'vitest'
import { catalogs } from '@trmnl-games/desk-crawler/content'
import { validateCatalog } from '@trmnl-games/desk-crawler/content/validate'
import { applyItemChanges } from '@trmnl-games/desk-crawler/sim/core/apply'
import { canRaid, careerLine, careerProblems, claimReward, currentRung, effectiveStance, firstOpenRung, guaranteeDue, liveRung, measureRung, remapRung, unlocked } from '@trmnl-games/desk-crawler/sim/core/career'
import { simulateHero, SIMULATION_VERSION } from '@trmnl-games/desk-crawler/sim/core/simulate'
import { starterHero, starterKit } from '@trmnl-games/desk-crawler/sim/core/starter'
import { maxHp, xpToLeave } from '@trmnl-games/desk-crawler/sim/core/stats'
import type { CareerState, ContentCatalog, HeroCounters, HeroState, ItemSnapshot, SimulationResult, StreamSeeds } from '@trmnl-games/desk-crawler/sim/core/types'
import { seeds, withId } from './helpers'

const v11 = catalogs.v11
const v12 = catalogs.v12
const EPOCH = Date.UTC(2026, 9, 12)
const QUARTER = 15 * 60 * 1000

const allStreams = (n: number): StreamSeeds => ({ ...seeds(n), quest: (n * 1597334677 + 11) >>> 0, raid: (n * 2246822519 + 7) >>> 0 })

function hero(overrides: Partial<HeroState> = {}, counters: Partial<HeroCounters> = {}): { hero: HeroState; inventory: ItemSnapshot[] } {
  const kit = starterKit(v12)
  const inventory = [withId(kit.weapon, 'i000'), withId(kit.armor, 'i001'), withId(kit.potions, 'i999')]
  const base = starterHero('hero1', v12, 0)
  return { hero: { ...base, weaponId: 'i000', armorId: 'i001', ...overrides, counters: { ...base.counters, ...counters } }, inventory }
}

function run(h: HeroState, inventory: readonly ItemSnapshot[], tick: number, seed: number, content: ContentCatalog = v12, extra: Partial<Parameters<typeof simulateHero>[0]> = {}): SimulationResult {
  return simulateHero({ hero: h, inventory, tick, content, simulationVersion: SIMULATION_VERSION, streams: allStreams(seed), tickAt: EPOCH + tick * QUARTER, ...extra })
}

function find(h: HeroState, inventory: readonly ItemSnapshot[], tick: number, predicate: (result: SimulationResult) => boolean, content: ContentCatalog = v12): SimulationResult {
  for (let seed = 0; seed < 20_000; seed += 1) {
    const result = run(h, inventory, tick, seed, content)
    if (predicate(result)) return result
  }
  throw new Error('no seed satisfied the predicate')
}

const careerLines = (result: SimulationResult) => (result.extraEvents ?? []).filter((e) => e.kind === 'career')
const rungId = (content: ContentCatalog, index: number) => content.career!.rungs[index]?.id
const atRung = (id: string, armedAt?: number, armedCount = 0): CareerState => ({ rung: v12.career!.rungs.findIndex((r) => r.id === id), startedTick: 0, reached: [], ...(armedAt === undefined ? {} : { armedAt, armedCount }) })

describe('career catalog (P35)', () => {
  it('is valid under v12 and absent before it', () => {
    expect(validateCatalog(v12)).toEqual([])
    expect(v11.career).toBeUndefined()
    expect(v11.unlocks).toBeUndefined()
    expect(v12.unlocks).toEqual({ todo: 2, stances: 3, choices: 5, merchant: 6, raids: 7 })
    expect(v12.career!.rungs).toHaveLength(19)
    expect(new Set(v12.career!.rungs.map((r) => r.id)).size).toBe(19)
    // Every goal line fits the summary budget in its full form, so the device never needs the compact one for the ladder.
    v12.career!.rungs.forEach((rung, i) => {
      const next = v12.career!.rungs[i + 1]
      const { full } = careerLine({ variant: 'career', phase: 'reached', id: rung.id, title: rung.title, ...(next ? { next: next.title } : {}), gold: rung.gold })
      expect([...full].length).toBeLessThanOrEqual(v12.constants.summaryMaxCodePoints)
    })
  })

  it('rejects broken ladders and unlocks', () => {
    const rungs = v12.career!.rungs
    const broken = (patch: Partial<ContentCatalog>) => validateCatalog({ ...v12, ...patch })
    expect(broken({ career: { rungs: [...rungs, rungs[0]!] } })).toContain('duplicate career rung first_win')
    expect(broken({ career: { rungs: [{ ...rungs[0]!, predicate: { kind: 'counter', counter: 'nope' as never, atLeast: 1 } }] } })).toContain('career rung first_win names an unknown counter')
    expect(broken({ career: { rungs: [{ ...rungs[0]!, predicate: { kind: 'bag', atLeast: 14 } }] } })).toContain('career rung first_win bag target is not a tier')
    expect(broken({ career: { rungs: [{ ...rungs[0]!, guarantee: { event: 'combat', withinTicks: 0 } }] } })).toContain('career rung first_win guarantee must be 1 to 960 adventures')
    expect(broken({ career: { rungs: [] } })).toContain('a career ladder needs at least one rung')
    expect(broken({ unlocks: { ...v12.unlocks!, raids: 0 } })).toContain('unlock level for raids must be 1 to 20')
    const { raids: _raids, ...noRaids } = v12
    expect(validateCatalog(noRaids)).toContain('raid unlock without raid rules')
  })
})

describe('feature unlocks (P35)', () => {
  it('reads levels from the catalog and treats older catalogs as fully unlocked', () => {
    expect(unlocked(v11, 1, 'raids')).toBe(true)
    expect(unlocked(v12, 1, 'todo')).toBe(false)
    expect(unlocked(v12, 2, 'todo')).toBe(true)
    expect(unlocked(v12, 6, 'raids')).toBe(false)
    expect(canRaid(v12, 7)).toBe(true)
    expect(canRaid(v11, 1)).toBe(true)
    expect(canRaid(catalogs.v6, 20)).toBe(false)
    expect(effectiveStance(v12, { level: 2, stance: 'bold' })).toBeUndefined()
    expect(effectiveStance(v12, { level: 3, stance: 'bold' })).toBe('bold')
  })

  it('writes no to-do list, merchant, choice or raid for a level-1 hero', { timeout: 30_000 }, () => {
    const { hero: h, inventory } = hero()
    const target = { heroId: 'rival', name: 'Rival', gold: 500 }
    for (let seed = 0; seed < 400; seed += 1) {
      const result = run(h, inventory, 10, seed, v12, { raidTarget: target })
      expect(result.nextHero.todo).toBeUndefined()
      expect(result.raidLaunch).toBeUndefined()
      const variant = result.event?.detail.outcome.variant
      expect(variant === 'merchant' || variant === 'choice' || variant === 'raid').toBe(false)
    }
  })

  it('plays balanced below the stance unlock, whatever the stored stance says', () => {
    // 45% HP: balanced drinks below 50%, bold only below 35%.
    const low = { hp: Math.floor(maxHp(1) * 0.45), stance: 'bold' as const }
    const locked = hero(low)
    const unlockedHero = hero({ ...low, level: 3 })
    expect(run(locked.hero, locked.inventory, 10, 1).metrics.potionsUsed).toBe(1)
    expect(run(unlockedHero.hero, unlockedHero.inventory, 10, 1).metrics.potionsUsed).toBe(0)
    expect(run(locked.hero, locked.inventory, 10, 1, v11).metrics.potionsUsed).toBe(0)
  })

  it('logs each unlock once, on the tick that crosses its level, after the stand-up it brings', () => {
    const { hero: h, inventory } = hero({ xp: xpToLeave(1) - 1 })
    const result = find(h, inventory, 10, (r) => (r.event?.detail.levelsGained ?? 0) > 0)
    expect(result.nextHero.level).toBe(2)
    const kinds = (result.extraEvents ?? []).map((e) => e.kind)
    expect(kinds).toEqual(['todo', 'career', 'career'])
    expect(result.extraEvents![0]!.summary).toMatch(/^Stand-up: /)
    expect(result.extraEvents![1]!.summary).toBe('Unlocked: the to-do list.')
    expect(result.extraEvents![1]!.detail.outcome).toMatchObject({ variant: 'career', phase: 'unlocked', id: 'todo' })
    // The third line is the first rung, won by the same fight.
    expect(result.extraEvents![2]!.summary).toBe('Goal reached: Win your first fight. Next: Equip a piece of gear you found.')
    expect(result.metrics.unlocks).toBe(1)
    // The next tick says nothing more about it.
    const { hero: next, inventory: nextInventory } = { hero: result.nextHero, inventory: applyItemChanges(result.nextHero, inventory, result.itemChanges, () => 'i500').inventory }
    const after = run(next, nextInventory, 11, 2)
    expect(careerLines(after).some((e) => e.detail.outcome.variant === 'career' && e.detail.outcome.phase === 'unlocked')).toBe(false)
  })

  it('names every feature a jump of several levels crosses', () => {
    const { hero: h, inventory } = hero({ level: 4, xp: xpToLeave(4) - 1, biomeId: 'server_room' }, { combatWins: 5, itemsEquipped: 1, tasksCompleted: 3, itemsSold: 1, stanceChanges: 1, trips: 1 })
    const result = find(h, inventory, 10, (r) => (r.event?.detail.levelsGained ?? 0) > 0)
    const unlockedIds = careerLines(result).flatMap((e) => (e.detail.outcome.variant === 'career' && e.detail.outcome.phase === 'unlocked' ? [e.detail.outcome.id] : []))
    expect(unlockedIds).toEqual(['choices'])
  })
})

describe('the career ladder (P35)', () => {
  it('replays v11 unchanged for a hero past every unlock, apart from the ladder itself', { timeout: 30_000 }, () => {
    const { hero: h, inventory } = hero({ level: 8, hp: maxHp(8), biomeId: 'server_room', stance: 'bold' })
    for (let seed = 0; seed < 300; seed += 1) {
      const old = run(h, inventory, 10 + seed, seed, v11)
      const now = run(h, inventory, 10 + seed, seed, v12)
      const { career: _c, ...nowHero } = now.nextHero
      expect({ ...nowHero, counters: { ...nowHero.counters, careerRungs: 0 } }).toEqual(old.nextHero)
      expect(now.event === undefined ? undefined : { ...now.event, detail: { ...now.event.detail, contentVersion: 'v11' } }).toEqual(old.event)
      expect(JSON.parse(JSON.stringify(now.itemChanges).replaceAll('"v12"', '"v11"'))).toEqual(old.itemChanges)
      expect((now.extraEvents ?? []).filter((e) => e.kind !== 'career').map((e) => ({ ...e, detail: { ...e.detail, contentVersion: 'v11' } }))).toEqual(old.extraEvents ?? [])
    }
  })

  it('starts a new hero at the first rung and sets its reward aside with the first win', () => {
    const { hero: h, inventory } = hero()
    const result = find(h, inventory, 10, (r) => r.metrics.victories === 1)
    expect(result.nextHero.career).toEqual({ rung: 1, startedTick: 10, armedAt: 1, armedCount: result.nextHero.counters.itemsFound, reached: [{ id: 'first_win', tick: 10, at: EPOCH + 10 * QUARTER }], unclaimed: [{ id: 'first_win', gold: 10, tick: 10, at: EPOCH + 10 * QUARTER }] })
    expect(result.nextHero.counters.careerRungs).toBe(1)
    const line = careerLines(result)[0]!
    // D129: the gold waits for the claim; the line pays nothing itself but says what is waiting.
    expect(line.deltas).toEqual({ xpEarned: 0, gold: 0, hp: 0 })
    expect(line.detail.outcome).toMatchObject({ variant: 'career', gold: 10 })
    expect(result.nextHero.gold - h.gold).toBe(result.event!.detail.outcome.variant === 'combat' ? result.event!.detail.outcome.goldGranted : 0)
    // The claim pays it once, oldest first or by name, and refuses when nothing waits.
    const claimed = claimReward(result.nextHero, v12)
    expect(claimed).toEqual({ career: { ...result.nextHero.career!, unclaimed: undefined }, reward: { id: 'first_win', title: 'Win your first fight', gold: 10 } })
    if ('career' in claimed) expect(claimReward({ ...result.nextHero, career: claimed.career }, v12)).toEqual({ refusal: 'NOTHING_TO_CLAIM' })
    expect(claimReward(result.nextHero, v12, 'level_2')).toEqual({ refusal: 'NOTHING_TO_CLAIM' })
    expect(claimReward(result.nextHero, v11)).toEqual({ refusal: 'NO_LADDER' })
    // A tick without the win keeps the hero on the rung, with the guarantee armed from its first adventure.
    const quiet = find(h, inventory, 10, (r) => r.metrics.victories === 0 && r.metrics.encounter !== 'none')
    expect(quiet.nextHero.career).toEqual({ rung: 0, startedTick: 10, armedAt: 1, armedCount: quiet.nextHero.counters.retreats, reached: [] })
    expect(careerLines(quiet)).toEqual([])
  })

  it('places an existing hero at its first unfinished rung without pay or lines', () => {
    const { hero: h, inventory } = hero({ level: 5, biomeId: 'server_room', potionCap: 20 }, { combatWins: 60, itemsEquipped: 2, tasksCompleted: 9, itemsSold: 4, stanceChanges: 1, trips: 2 })
    const result = find(h, inventory, 10, (r) => r.metrics.victories === 1)
    expect(result.nextHero.career?.rung).toBe(v12.career!.rungs.findIndex((r) => r.id === 'laptop_backpack'))
    expect(result.nextHero.career?.reached).toEqual([])
    expect(result.nextHero.counters.careerRungs).toBe(0)
    expect(careerLines(result)).toEqual([])
    expect(firstOpenRung(v12.career!, h, v12)).toBe(8)
  })

  it('pays one rung per tick, so deeds done ahead of the ladder pay in order over the following ticks', () => {
    // First win and level 2 in one fight, with a piece already equipped: the win pays now, the equip next tick, level 2 after.
    const { hero: h, inventory } = hero({ xp: xpToLeave(1) - 1 }, { itemsEquipped: 1 })
    const result = find(h, inventory, 10, (r) => (r.event?.detail.levelsGained ?? 0) > 0)
    expect(careerLines(result).filter((e) => e.detail.outcome.variant === 'career' && e.detail.outcome.phase === 'reached')).toHaveLength(1)
    expect(rungId(v12, result.nextHero.career!.rung)).toBe('equip_find')
    let hero2 = result.nextHero
    let inventory2 = applyItemChanges(hero2, inventory, result.itemChanges, () => 'i500').inventory
    const next = run(hero2, inventory2, 11, 3)
    expect(careerLines(next).find((e) => e.detail.outcome.variant === 'career' && e.detail.outcome.phase === 'reached')?.summary).toBe('Goal reached: Equip a piece of gear you found. Next: Reach level 2.')
    hero2 = next.nextHero
    inventory2 = applyItemChanges(hero2, inventory2, next.itemChanges, () => 'i501').inventory
    const third = run(hero2, inventory2, 12, 4)
    expect(careerLines(third).find((e) => e.detail.outcome.variant === 'career' && e.detail.outcome.phase === 'reached')?.summary).toBe('Goal reached: Reach level 2. Next: Finish three to-do tasks.')
    expect(third.nextHero.counters.careerRungs).toBe(3)
    expect(third.nextHero.career?.reached.map((r) => r.id)).toEqual(['first_win', 'equip_find', 'level_2'])
  })

  it('pays a rung reached in the companion at the next evaluation, in any status', () => {
    const { hero: h, inventory } = hero({ status: 'paused', pausedFromStatus: 'exploring', career: atRung('first_sale') }, { combatWins: 3, itemsEquipped: 1, itemsSold: 1 })
    const result = run(h, inventory, 10, 1)
    expect(result.event).toBeUndefined()
    expect(careerLines(result).map((e) => e.summary)).toEqual(['Goal reached: Sell a piece of gear. Next: Pick a stance.'])
    expect(result.nextHero.gold).toBe(h.gold)
    expect(result.nextHero.career?.unclaimed).toEqual([{ id: 'first_sale', gold: 20, tick: 10, at: EPOCH + 10 * QUARTER }])
  })

  it('ends with a last line and then counts nothing', () => {
    const last = v12.career!.rungs.length - 1
    const { hero: h, inventory } = hero({ level: 12, biomeId: 'cafeteria_depths', career: { rung: last, startedTick: 0, reached: [] } })
    const result = run(h, inventory, 10, 1)
    expect(careerLines(result)[0]!.summary).toBe('Goal reached: Reach level 12. That was the last one, for now.')
    expect(result.nextHero.career?.rung).toBe(last + 1)
    const after = run(result.nextHero, applyItemChanges(result.nextHero, inventory, result.itemChanges, () => 'i500').inventory, 11, 2)
    expect(careerLines(after)).toEqual([])
  })

  it('measures progress for the companion', () => {
    const { hero: h } = hero({ bagCapacity: 10 }, { tasksCompleted: 2, monsterWins: { coffee_slime: 1 } })
    expect(measureRung({ kind: 'counter', counter: 'tasksCompleted', atLeast: 3 }, h, v12)).toEqual({ value: 2, target: 3 })
    expect(measureRung({ kind: 'bag', atLeast: 13 }, h, v12)).toEqual({ value: 10, target: 13 })
    expect(measureRung({ kind: 'pouch', atLeast: 30 }, h, v12)).toEqual({ value: 20, target: 30 })
    expect(measureRung({ kind: 'biomeWin', biomeId: 'cafeteria_depths' }, h, v12)).toEqual({ value: 1, target: 1 })
    expect(measureRung({ kind: 'anyCounter', counters: ['raidsLaunched', 'raidsLost'], atLeast: 1 }, h, v12)).toEqual({ value: 0, target: 1 })
  })
})

describe('guarantees (P35)', () => {
  it('forces the first fight once four adventures have passed without one, and not before', { timeout: 30_000 }, () => {
    const armed = hero({ career: atRung('first_win', 0) }, { ticksExplored: 4 })
    for (let seed = 0; seed < 200; seed += 1) {
      const result = run(armed.hero, armed.inventory, 10, seed)
      expect(result.metrics.encounter).toBe('combat')
      expect(result.metrics.guarantees).toBe(1)
    }
    const early = hero({ career: atRung('first_win', 0) }, { ticksExplored: 3 })
    expect(guaranteeDue(v12, early.hero)).toBeUndefined()
    const kinds = new Set(Array.from({ length: 200 }, (_, seed) => run(early.hero, early.inventory, 10, seed).metrics.encounter))
    expect(kinds.size).toBeGreaterThan(1)
  })

  it('forces a gear find, a decision, a merchant and an elite for their rungs', { timeout: 30_000 }, () => {
    const gear = hero({ career: atRung('equip_find', 0) }, { combatWins: 1, ticksExplored: 12 })
    for (let seed = 0; seed < 100; seed += 1) {
      const result = run(gear.hero, gear.inventory, 10, seed)
      expect(result.event?.detail.outcome).toMatchObject({ variant: 'loot', found: 'gear' })
    }
    // A find that came by itself since the rung was armed stands the guarantee down: the piece is waiting in the bag.
    const found = hero({ career: atRung('equip_find', 0) }, { combatWins: 1, ticksExplored: 12, itemsFound: 1 })
    expect(guaranteeDue(v12, found.hero)).toBeUndefined()
    const decision = hero({ level: 5, biomeId: 'server_room', career: atRung('first_decision', 0) }, { ticksExplored: 48 })
    for (let seed = 0; seed < 50; seed += 1) expect(run(decision.hero, decision.inventory, 10, seed).event?.detail.outcome).toMatchObject({ variant: 'choice', phase: 'offered' })
    // A pending decision means the player already has one to answer: nothing to force.
    const pending = hero({ level: 5, biomeId: 'server_room', career: atRung('first_decision', 0), choice: { eventId: v12.choices!.events[0]!.id, offeredAtTick: 5, expiresAtTick: 500, biomeTier: 2 } }, { ticksExplored: 48 })
    expect(guaranteeDue(v12, pending.hero)).toBeUndefined()
    const merchant = hero({ level: 6, biomeId: 'server_room', career: atRung('merchant_meet', 0) }, { ticksExplored: 48 })
    for (let seed = 0; seed < 50; seed += 1) expect(run(merchant.hero, merchant.inventory, 10, seed).event?.detail.outcome.variant).toBe('merchant')
    const elite = hero({ level: 7, biomeId: 'server_room', career: atRung('first_elite', 0) }, { ticksExplored: 96 })
    for (let seed = 0; seed < 50; seed += 1) expect(run(elite.hero, elite.inventory, 10, seed).event?.detail.outcome).toMatchObject({ variant: 'combat', elite: true })
    // Not in the Office, where the rung says the elite would be wasted.
    const office = hero({ level: 7, career: atRung('first_elite', 0) }, { ticksExplored: 96 })
    expect(guaranteeDue(v12, office.hero)).toBeUndefined()
  })

  it('fires once per rung: a forced tick disarms the rung and the next tick rolls freely', { timeout: 30_000 }, () => {
    const armed = hero({ bagCapacity: 10, career: atRung('equip_find', 0) }, { combatWins: 1, ticksExplored: 12 })
    const first = run(armed.hero, armed.inventory, 10, 3)
    expect(first.metrics.guarantees).toBe(1)
    expect(first.nextHero.career).toEqual({ rung: 1, startedTick: 0, fired: true, reached: [] })
    const inventory = applyItemChanges(first.nextHero, armed.inventory, first.itemChanges, () => 'i500').inventory
    const kinds = new Set(Array.from({ length: 100 }, (_, seed) => run(first.nextHero, inventory, 11, seed).metrics.encounter))
    expect(kinds.size).toBeGreaterThan(1)
    expect(Array.from({ length: 100 }, (_, seed) => run(first.nextHero, inventory, 11, seed).metrics.guarantees).every((g) => g === 0)).toBe(true)
  })

  it('re-arms a repeating guarantee, so a decision is waiting for whoever visits', () => {
    const decision = hero({ level: 5, biomeId: 'server_room', career: atRung('first_decision', 0) }, { ticksExplored: 48 })
    const forced = run(decision.hero, decision.inventory, 10, 2)
    expect(forced.event?.detail.outcome).toMatchObject({ variant: 'choice', phase: 'offered' })
    expect(forced.nextHero.career).toMatchObject({ rung: decision.hero.career!.rung, armedAt: forced.nextHero.counters.ticksExplored })
    expect(forced.nextHero.career?.fired).toBeUndefined()
    // Pending: nothing more to force. Expired and defaulted: 48 adventures later it forces another.
    expect(guaranteeDue(v12, forced.nextHero)).toBeUndefined()
    const { choice: _c, ...later } = forced.nextHero
    expect(guaranteeDue(v12, { ...later, counters: { ...later.counters, ticksExplored: later.counters.ticksExplored + 48, choicesDefaulted: 1 } })).toBe('choice')
  })

  it('arms a guarantee only once its feature is unlocked', () => {
    const locked = hero({ level: 4, biomeId: 'server_room', career: atRung('first_decision') }, { ticksExplored: 10 })
    expect(run(locked.hero, locked.inventory, 10, 1).nextHero.career?.armedAt).toBeUndefined()
    const open = hero({ level: 5, biomeId: 'server_room', career: atRung('first_decision') }, { ticksExplored: 10 })
    const result = run(open.hero, open.inventory, 10, 1)
    expect(result.nextHero.career?.armedAt).toBe(result.nextHero.counters.ticksExplored)
    expect(result.nextHero.career?.armedCount).toBe(result.nextHero.counters.choicesMade + result.nextHero.counters.choicesDefaulted)
  })

  it('takes the same draws, so the next tick replays as without the guarantee', () => {
    // The forced tick's reward and narrative draws differ, but the streams are per tick, so the following tick is untouched.
    const armed = hero({ bagCapacity: 10, career: atRung('first_win', 0) }, { ticksExplored: 4 })
    const plain = hero({ bagCapacity: 10, career: atRung('first_win', 0) }, { ticksExplored: 1 })
    const a = run(armed.hero, armed.inventory, 11, 7)
    const b = run(plain.hero, plain.inventory, 11, 7)
    expect(a.metrics.guarantees).toBe(1)
    expect(b.metrics.guarantees).toBe(0)
    expect(run({ ...a.nextHero, hp: maxHp(1) }, armed.inventory, 12, 8).event?.summary).toBe(run({ ...a.nextHero, hp: maxHp(1), career: b.nextHero.career!, counters: { ...a.nextHero.counters, ticksExplored: 2 } }, armed.inventory, 12, 8).event?.summary)
  })
})

describe('stances with desk raids (D132, content v15)', () => {
  const v14 = catalogs.v14
  const v15 = catalogs.v15
  const index = (id: string) => v15.career!.rungs.findIndex((r) => r.id === id)
  const done = { combatWins: 1, itemsEquipped: 1, tasksCompleted: 3, itemsSold: 1 }

  it('is valid, moves only the stance unlock and retires only the stance goal, keeping every id in place', () => {
    expect(validateCatalog(v15)).toEqual([])
    expect(v15.unlocks).toEqual({ ...v14.unlocks, stances: 7 })
    expect(v15.career!.rungs.map((r) => r.id)).toEqual(v14.career!.rungs.map((r) => r.id))
    expect(v15.career!.rungs.filter((r) => r.retired).map((r) => r.id)).toEqual(['pick_stance'])
    expect(v15.career!.rungs.find((r) => r.id === 'first_raid')!.blurb).toMatch(/stance/)
    expect(validateCatalog({ ...v15, career: { rungs: v15.career!.rungs.map((r) => (r.id === 'pick_stance' ? { ...r, guarantee: { event: 'combat' as const, withinTicks: 4 } } : r)) } })).toContain('retired career rung pick_stance cannot carry a guarantee')
    expect(validateCatalog({ ...v15, career: { rungs: [{ ...v15.career!.rungs[0]!, retired: true }] } })).toContain('a career ladder needs at least one rung')
  })

  it('plays balanced until level 7', () => {
    expect(effectiveStance(v15, { level: 6, stance: 'bold' })).toBeUndefined()
    expect(effectiveStance(v15, { level: 7, stance: 'bold' })).toBe('bold')
    expect(effectiveStance(v14, { level: 3, stance: 'bold' })).toBe('bold')
  })

  it('walks past the retired rung: a hero joining skips it, and the sale goal names level 4 next', () => {
    const { hero: h } = hero({ level: 3 }, done)
    expect(firstOpenRung(v14.career!, h, v14)).toBe(index('pick_stance'))
    expect(firstOpenRung(v15.career!, h, v15)).toBe(index('level_4'))
    expect(liveRung(v15.career!, index('pick_stance'))).toBe(index('level_4'))
    const { hero: atSale, inventory } = hero({ level: 3, career: { rung: index('first_sale'), startedTick: 0, reached: [] } }, done)
    const result = run(atSale, inventory, 10, 1, v15)
    expect(careerLines(result).map((e) => e.summary)).toContain('Goal reached: Sell a piece of gear. Next: Reach level 4.')
    expect(result.nextHero.career!.rung).toBe(index('level_4'))
  })

  it('moves a pointer left on the retired rung on without pay or a line, then pays the next rung that holds', () => {
    const { hero: h, inventory } = hero({ level: 4, career: { rung: index('pick_stance'), startedTick: 0, reached: [] } }, done)
    expect(currentRung(v15, h)!.id).toBe('level_4')
    const result = run(h, inventory, 10, 1, v15)
    const reached = careerLines(result).flatMap((e) => (e.detail.outcome.variant === 'career' && e.detail.outcome.phase === 'reached' ? [e.detail.outcome.id] : []))
    expect(reached).toEqual(['level_4'])
    expect(result.nextHero.career!.rung).toBe(index('first_trip'))
    expect(result.nextHero.career!.reached.map((r) => r.id)).toEqual(['level_4'])
  })

  it('keeps a stance goal reached under v14 valid, unclaimed reward included', () => {
    const state: CareerState = { rung: index('level_4'), startedTick: 0, reached: [{ id: 'pick_stance', tick: 5 }], unclaimed: [{ id: 'pick_stance', gold: 20, tick: 5 }] }
    expect(careerProblems(state, v15)).toBeUndefined()
    const { hero: h } = hero({ level: 4, career: state }, done)
    expect(claimReward(h, v15)).toMatchObject({ reward: { id: 'pick_stance', title: 'Pick a stance', gold: 20 } })
  })
})


describe('level 7 and Bold before the raid goal (D135, content v17)', () => {
  const v16 = catalogs.v16
  const v17 = catalogs.v17
  const index = (content: ContentCatalog, id: string) => content.career!.rungs.findIndex((r) => r.id === id)
  const done = { combatWins: 1, itemsEquipped: 1, tasksCompleted: 3, itemsSold: 1, trips: 1, choicesMade: 1, merchantVisits: 1, eliteWins: 1 }
  const reachedIds = (result: SimulationResult) => careerLines(result).flatMap((e) => (e.detail.outcome.variant === 'career' && e.detail.outcome.phase === 'reached' ? [[e.detail.outcome.id, e.detail.outcome.gold]] : []))

  it('is valid and inserts the two goals right before the raid goal, keeping every other id in order', () => {
    expect(validateCatalog(v17)).toEqual([])
    const ids = v16.career!.rungs.map((r) => r.id)
    const at = ids.indexOf('first_raid')
    expect(v17.career!.rungs.map((r) => r.id)).toEqual([...ids.slice(0, at), 'level_7', 'go_bold', ...ids.slice(at)])
    expect(v17.career!.rungs.filter((r) => !r.retired)).toHaveLength(25)
    expect(v17.unlocks).toEqual(v16.unlocks)
    v17.career!.rungs.forEach((rung, i) => {
      const next = v17.career!.rungs[i + 1]
      const { full } = careerLine({ variant: 'career', phase: 'reached', id: rung.id, title: rung.title, ...(next ? { next: next.title } : {}), gold: rung.gold })
      expect([...full].length).toBeLessThanOrEqual(v17.constants.summaryMaxCodePoints)
    })
    const patch = (id: string, change: object) => ({ ...v17, career: { rungs: v17.career!.rungs.map((r) => (r.id === id ? { ...r, ...change } : r)) } })
    expect(validateCatalog(patch('go_bold', { predicate: { kind: 'stance', stance: 'reckless' } }))).toContain('career rung go_bold names an unknown stance')
    expect(validateCatalog(patch('go_bold', { supersedes: 'first_win' }))).toContain('career rung go_bold supersedes a rung that is not retired')
  })

  it('counts Bold only once stances are open', () => {
    const goal = v17.career!.rungs[index(v17, 'go_bold')]!.predicate
    expect(measureRung(goal, hero({ level: 6, stance: 'bold' }).hero, v17)).toEqual({ value: 0, target: 1 })
    expect(measureRung(goal, hero({ level: 7, stance: 'cautious' }).hero, v17)).toEqual({ value: 0, target: 1 })
    expect(measureRung(goal, hero({ level: 7, stance: 'bold' }).hero, v17)).toEqual({ value: 1, target: 1 })
  })

  it('names level 7 after the elite goal, then Bold, then the raid', () => {
    const { hero: h, inventory } = hero({ level: 9, stance: 'bold', career: { rung: index(v17, 'first_elite'), startedTick: 0, reached: [] } }, done)
    let items: readonly ItemSnapshot[] = inventory
    const step = (prev: SimulationResult, tick: number) => {
      items = applyItemChanges(prev.nextHero, items, prev.itemChanges, () => `i${500 + tick}`).inventory
      return run(prev.nextHero, items, tick, tick, v17)
    }
    let result = run(h, items, 10, 1, v17)
    expect(careerLines(result).map((e) => e.summary)).toContain('Goal reached: Beat an elite. Next: Reach level 7.')
    result = step(result, 11)
    expect(careerLines(result).map((e) => e.summary)).toContain('Goal reached: Reach level 7. Next: Switch to Bold.')
    result = step(result, 12)
    expect(reachedIds(result)).toEqual([['go_bold', 20]])
    expect(result.nextHero.career!.rung).toBe(index(v17, 'first_raid'))
    expect(result.nextHero.career!.unclaimed!.map((r) => [r.id, r.gold])).toEqual([['first_elite', 40], ['level_7', 40], ['go_bold', 20]])
  })

  it('pays nothing for Bold to a hero that was paid for the retired stance goal', () => {
    const { hero: h, inventory } = hero({ level: 9, stance: 'bold', career: { rung: index(v17, 'go_bold'), startedTick: 0, reached: [{ id: 'pick_stance', tick: 5 }] } }, done)
    const result = run(h, inventory, 10, 1, v17)
    expect(reachedIds(result)).toEqual([['go_bold', 0]])
    expect(result.nextHero.career!.unclaimed).toEqual([])
    expect(result.nextHero.career!.rung).toBe(index(v17, 'first_raid'))
  })

  it('remaps stored pointers by rung id: before, on and after the raid goal, and back again', () => {
    const from = v16.career!
    const to = v17.career!
    for (const id of ['first_win', 'pick_stance', 'first_elite', 'first_raid', 'cafeteria_win', 'garage_win']) expect(remapRung(from, to, index(v16, id))).toBe(index(v17, id))
    expect(remapRung(from, to, from.rungs.length)).toBe(to.rungs.length)
    // Rolling back drops the two new goals: a pointer on either lands on the raid goal.
    expect(remapRung(to, from, index(v17, 'level_7'))).toBe(index(v16, 'first_raid'))
    expect(remapRung(to, from, index(v17, 'go_bold'))).toBe(index(v16, 'first_raid'))
    expect(remapRung(to, from, index(v17, 'first_raid'))).toBe(index(v16, 'first_raid'))
    expect(remapRung(from, from, 7)).toBe(7)
    // With the hero's state: unmet inserted rungs right before the pointer's rung come first; nothing else changes.
    const unmet = (ids: string[]) => (rung: { id: string }) => ids.includes(rung.id)
    expect(remapRung(from, to, index(v16, 'first_raid'), unmet(['level_7', 'go_bold', 'first_raid']))).toBe(index(v17, 'level_7'))
    expect(remapRung(from, to, index(v16, 'first_raid'), unmet(['go_bold', 'first_raid']))).toBe(index(v17, 'go_bold'))
    expect(remapRung(from, to, index(v16, 'first_raid'), unmet(['first_raid']))).toBe(index(v17, 'first_raid'))
    expect(remapRung(from, to, index(v16, 'cafeteria_win'), unmet(['level_7', 'go_bold', 'cafeteria_win']))).toBe(index(v17, 'cafeteria_win'))
  })
})
