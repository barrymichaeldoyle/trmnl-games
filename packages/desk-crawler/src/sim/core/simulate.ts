import { applyItemChanges } from './apply'
import { isBagFull, milestoneUpgrade, nextEarlyTier } from './bag'
import { eventById, optionOf, resolveEffect } from './choice'
import { affixById, effectById, effectiveStats, liveEffects, scaled, withEffect } from './modifiers'
import { gearTierOf } from './biomes'
import { nextEarlyPouchTier, potionCap, pouchMilestoneUpgrade } from './pouch'
import { autoPotion, potionItem, potionRows, potionStrengths, potionWord, potionsHeld, rollPotionStrength, strengthOf } from './potions'
import { assertHeroInvariants, SimulationInvariantError } from './invariants'
import { codePoints, composeSummary, fill, rarityLabel, variant, withArticle, type NarrativeVars } from './narrative'
import { drawRaidPlan, raidGoldLoss, raidHpLoss, raidStream, raidWinChance } from './raid'
import { drawMeetingKind, drawMeetingPlan, meetingKind, meetingStream } from './meeting'
import { graveyardDraws, spareItem, spareOf, spareSource } from './lostProperty'
import { createRng, pickOne, pickWeighted, type Rng } from './rng'
import { applyTodo } from './todo'
import { applyCareer, currentRung, effectiveStance, guaranteeDue, unlocked } from './career'
import { applyOccasion } from './occasionLine'
import { mishapRule, occasionForTick, occasionModifiers, raidLaunchPct, type LiveOccasion } from './occasions'
import { applyXp, classRule, deriveStats, heroMaxHp, pctOf } from './stats'
import type {
  BagTier,
  BagUpgrade,
  BiomeTemplate,
  CombatRound,
  ContentCatalog,
  Disposition,
  EncounterKind,
  HeroClass,
  HeroCounters,
  HeroState,
  ItemChange,
  LogDetail,
  LogKind,
  MeetingKind,
  MeetingLaunch,
  MonsterTemplate,
  NewItem,
  OutcomeDetail,
  SpareDrop,
  SimulationInput,
  SimulationResult,
  TickMetrics,
  EffectRule,
  MerchantOffer,
  MerchantVisit,
  PendingChoice,
  PotionStrength,
  PouchTier,
  RaidLaunch,
  Rarity,
  Standoff,
} from './types'

export const SIMULATION_VERSION = 1

/** D163: a dug-in elite's fall pays one of these, by the catalog's weights renormalised over them. */
const STANDOFF_RARITIES: readonly Rarity[] = ['rare', 'epic']

type Mutable<T> = { -readonly [K in keyof T]: T[K] }
type WorkingHero = Mutable<Omit<HeroState, 'counters'>> & { counters: Mutable<Omit<HeroCounters, 'monsterWins' | 'biomesVisited'>> & { monsterWins: Record<string, number>; biomesVisited?: Record<string, number> } }

const ZERO_METRICS: TickMetrics = {
  encounter: 'none',
  victories: 0,
  retreats: 0,
  deaths: 0,
  rescues: 0,
  levelUps: 0,
  potionsUsed: 0,
  heldFinds: 0,
  bagUpgrades: 0,
  sleepStarts: 0,
  wakes: 0,
  elites: 0,
  jackpots: 0,
  merchantVisits: 0,
  pouchUpgrades: 0,
  choicesOffered: 0,
  choicesDefaulted: 0,
  effectsGained: 0,
  raidsLaunched: 0,
  raidsApplied: 0,
  meetingsLaunched: 0,
  meetingsApplied: 0,
  sparesDropped: 0,
  sparesFound: 0,
  sparesReturned: 0,
  tasksCompleted: 0,
  todoRefills: 0,
  careerRungs: 0,
  unlocks: 0,
  guarantees: 0,
  standoffStarts: 0,
  standoffWins: 0,
  standoffEnds: 0,
}

interface Streams {
  readonly encounter: Rng
  readonly combat: Rng
  readonly reward: Rng
  readonly narrative: Rng
}

/** Simulate one logical tick for one hero. Pure: identical complete inputs give identical results. */
export function simulateHero(input: SimulationInput): SimulationResult {
  if (input.simulationVersion !== SIMULATION_VERSION) {
    throw new SimulationInvariantError('SIM_VERSION', `unsupported simulation version ${input.simulationVersion}`)
  }
  if (!Number.isSafeInteger(input.tick) || input.tick < 0) throw new SimulationInvariantError('TICK', `invalid tick ${input.tick}`)
  assertHeroInvariants(input.hero, input.inventory, input.content)
  // P31: the to-do list reads the finished tick and adds its own lines after the tick's story; P35: the career
  // ladder reads the result of both and adds unlock and goal lines last.
  // D139: the occasion's announcement comes after both, once per occurrence.
  const result = applyOccasion(input, applyCareer(input, applyTodo(input, new TickRun(input).run())))
  validateOutput(input, result)
  return result
}

class TickRun {
  private readonly h: WorkingHero
  private readonly content: ContentCatalog
  private readonly rng: Streams
  private readonly changes: ItemChange[] = []
  private metrics: Mutable<TickMetrics> = { ...ZERO_METRICS }
  private raidLaunch: RaidLaunch | undefined
  private raidApplied = false
  private meetingLaunch: MeetingLaunch | undefined
  private meetingApplied = false
  private spareDropped: SpareDrop | undefined
  private spareFound: { ownerHeroId: string } | undefined
  private foundApplied = false
  /** D139: the occasion live on the hero's local date, if any. */
  private readonly occasion: LiveOccasion | undefined
  /** D163: a dug-in elite whose clock ran out while the hero explored; told as this tick's event. */
  private slipped: Standoff | undefined

  constructor(private readonly input: SimulationInput) {
    this.h = { ...input.hero, counters: { ...input.hero.counters, monsterWins: { ...input.hero.counters.monsterWins }, ...(input.hero.counters.biomesVisited === undefined ? {} : { biomesVisited: { ...input.hero.counters.biomesVisited } }) } }
    this.content = input.content
    this.rng = {
      encounter: createRng(input.streams.encounter),
      combat: createRng(input.streams.combat),
      reward: createRng(input.streams.reward),
      narrative: createRng(input.streams.narrative),
    }
    this.occasion = occasionForTick(input.content, input.tick, input.tickAt, input.utcOffsetSeconds)
  }

  /** What the hero fights with now: class, affixes, effects and the live occasion's modifiers. */
  private stats() {
    return effectiveStats(this.content, this.h, this.input.inventory, this.input.tick, occasionModifiers(this.occasion))
  }

  /**
   * The sustain thresholds this hero plays by (D76): its stance's, when the pinned catalog knows stances, else the
   * catalog constants. A hero without a stance, or any hero under a pre-v3 catalog, plays exactly as before.
   */
  private sustain(): { autoPotionBelowPct: number; restBelowPct: number; resumeExploringAtPct: number; victoryXpPct: number } {
    // P35: below the stance unlock a chosen stance waits; the hero plays balanced until then.
    const rule = this.content.stances?.[this.stance() ?? 'balanced']
    return rule ?? { ...this.content.constants, victoryXpPct: 100 }
  }

  /** The stance the hero plays and raids by (P35: balanced until stances unlock). */
  private stance() {
    return effectiveStance(this.content, this.h)
  }

  private narrate(templates: readonly string[], vars: NarrativeVars, callbacks?: Readonly<Record<string, string>>): string {
    return variant(this.rng.narrative, templates, vars, this.input.recentSummaries, callbacks)
  }

  run(): SimulationResult {
    const { h, input } = this
    // D78: an expired merchant leaves quietly, whatever the hero is doing; no event, no draw.
    if (h.merchant !== undefined && input.tick >= h.merchant.expiresAtTick) delete h.merchant
    // D80: expired effects drop the same way.
    if (h.effects !== undefined) {
      const live = liveEffects(h.effects, input.tick)
      if (live.length === 0) delete h.effects
      else if (live.length !== h.effects.length) h.effects = live
    }
    this.dropStaleStandoff()
    switch (h.status) {
      case 'paused':
        return this.finish('paused')
      case 'sleeping': {
        const due = h.wakeAtTick !== undefined && input.tick >= h.wakeAtTick
        const bagReady = h.heldItemId === undefined && !isBagFull(h, input.inventory)
        // D189: under a catalog where a full bag never stops the hero, a sleeper from an older catalog wakes now.
        const keepGoing = this.content.keepGoingWhenFull === true
        // A future wake stays asleep. No wake at all still wakes once the bag is sorted (D179).
        if (!keepGoing && !due && !(h.wakeAtTick === undefined && bagReady)) return this.finish('sleeping')
        // Waking needs the held slot clear and a free bag slot for the next find, unless a full bag keeps going.
        if (!bagReady && !keepGoing) {
          throw new SimulationInvariantError('WAKE_PRECONDITION', 'wake is due but the held slot is not clear or the bag is full')
        }
        delete h.wakeAtTick
        this.metrics.wakes = 1
        if (h.targetBiomeId !== undefined) return this.depart(h.targetBiomeId)
        h.status = 'exploring'
        return this.explore()
      }
      case 'dead':
        return input.tick >= (h.reviveAtTick ?? Infinity) ? this.revive() : this.finish('waiting_dead')
      case 'travelling':
        return input.tick >= (h.arriveAtTick ?? Infinity) ? this.arrive() : this.finish('waiting_travel')
      case 'resting':
        return this.restingTick()
      case 'exploring':
        return this.explore()
    }
  }

  // ------------------------------------------------------------ lifecycle

  private depart(destinationId: string): SimulationResult {
    const { h } = this
    const from = h.biomeId
    this.endStandoff()
    h.status = 'travelling'
    h.arriveAtTick = this.input.tick + 1
    const destination = this.biome(destinationId).name
    const text = this.narrate(this.content.narrative.shared.depart, { destination })
    return this.finish('departed', {
      kind: 'travel',
      summary: text,
      outcome: { variant: 'travel', phase: 'depart', fromBiomeId: from, toBiomeId: destinationId, arrivalTick: h.arriveAtTick },
    })
  }

  private arrive(): SimulationResult {
    const { h } = this
    const from = h.biomeId
    const to = h.targetBiomeId!
    const arrivalTick = h.arriveAtTick!
    h.biomeId = to
    delete h.targetBiomeId
    delete h.arriveAtTick
    h.status = 'exploring'
    h.counters.trips += 1
    // D133: the floor's field note opens on the first arrival; the count is per biome and never falls.
    h.counters.biomesVisited = { ...h.counters.biomesVisited, [to]: (h.counters.biomesVisited?.[to] ?? 0) + 1 }
    const arrivals = [...this.content.narrative.shared.arrive, ...this.content.narrative.biomes[to]!.arrive]
    const text = this.narrate(arrivals, { destination: this.biome(to).name })
    return this.finish('arrived', {
      kind: 'travel',
      summary: text,
      outcome: { variant: 'travel', phase: 'arrive', fromBiomeId: from, toBiomeId: to, arrivalTick },
    })
  }

  private revive(): SimulationResult {
    const { h, content } = this
    const previousBiomeId = h.biomeId
    const reviveAtTick = h.reviveAtTick!
    const hp = pctOf(heroMaxHp(this.content, h), content.constants.reviveHpPct)
    h.status = 'exploring'
    h.biomeId = content.safeBiomeId
    h.hp = hp
    delete h.reviveAtTick
    delete h.targetBiomeId
    delete h.arriveAtTick
    const text = this.narrate(content.narrative.shared.revive, { heal: hp, destination: this.biome(content.safeBiomeId).name })
    return this.finish('revived', {
      kind: 'revive',
      summary: text,
      outcome: { variant: 'revival', previousBiomeId, safeBiomeId: content.safeBiomeId, hpGranted: hp, reviveAtTick },
    })
  }

  /** D80: grants an effect (refreshing a running one); returns its rule for the story, or undefined when the catalog lacks it. */
  private grantEffect(id: string | undefined): EffectRule | undefined {
    const rule = id === undefined ? undefined : effectById(this.content, id)
    if (rule === undefined) return undefined
    this.h.effects = withEffect(this.h.effects, rule, this.input.tick)
    this.metrics.effectsGained = 1
    return rule
  }

  /** D80 rest cleansing: a rest, automatic or not, shakes off every bane. */
  private cleanseBanes(): void {
    const { h, content } = this
    if (h.effects === undefined) return
    const kept = h.effects.filter((active) => effectById(content, active.id)?.kind !== 'bane')
    if (kept.length === 0) delete h.effects
    else if (kept.length !== h.effects.length) h.effects = kept
  }

  /**
   * D79: a choice the player let expire resolves by its default option, as this tick's whole event, so the player
   * reads what happened and the encounter rhythm resumes next tick. Only an exploring or resting hero resolves it;
   * dead, travelling, paused and sleeping heroes keep it pending until they are back.
   */
  private resolveExpiredChoice(): SimulationResult | undefined {
    const { h, content, input } = this
    const pending = h.choice
    if (pending === undefined || input.tick < pending.expiresAtTick) return undefined
    const event = eventById(content, pending.eventId)
    const option = event === undefined ? undefined : optionOf(event, event.defaultOptionId)
    delete h.choice
    if (event === undefined || option === undefined) return undefined
    const change = resolveEffect(content, h, potionsHeld(input.inventory), option.effect, pending.biomeTier)
    h.gold += change.gold
    if (change.gold > 0) h.counters.goldEarned += change.gold
    h.hp += change.hp
    // A decision hands out the catalog potion (healing under D131), whatever else the pouch holds.
    const catalogPotion = strengthOf(content, content.potion.templateId) ?? potionStrengths(content)[0]!
    for (let i = 0; i < change.potions; i += 1) this.gainPotion(catalogPotion)
    const granted = this.grantEffect(option.effect.effectId)
    h.counters.choicesDefaulted += 1
    this.metrics.choicesDefaulted = 1
    const summary = composeSummary(option.story, option.story, ['Decided by itself.', ...(granted ? [`${granted.name} for ${granted.durationTicks} adventures.`] : [])], content.constants.summaryMaxCodePoints)
    return this.finish('advanced', { kind: 'choice', summary, outcome: { variant: 'choice', phase: 'defaulted', eventId: event.id, optionId: option.id, expiresAtTick: pending.expiresAtTick } }, granted ? { effectGained: granted.id } : {})
  }

  private restingTick(): SimulationResult {
    const { h, content } = this
    const expired = this.resolveExpiredChoice() ?? this.applyIncomingRaid() ?? this.applyIncomingMeeting() ?? this.applyIncomingFound()
    if (expired !== undefined) return expired
    const max = heroMaxHp(this.content, h)
    const healing = Math.min(max - h.hp, pctOf(max, content.constants.restingHealPct))
    h.hp += healing
    h.counters.restTicks += 1
    this.cleanseBanes()
    if (h.hp * 100 >= max * this.sustain().resumeExploringAtPct) h.status = 'exploring'
    const text = this.narrate(content.narrative.shared.restingHeal, { heal: healing })
    return this.finish('rested', {
      kind: 'rest',
      summary: composeSummary(text, text, this.waitingLine(), content.constants.summaryMaxCodePoints),
      outcome: { variant: 'rest', healing, automatic: true, resultingStatus: h.status },
    })
  }

  // ------------------------------------------------------------ exploring

  private explore(): SimulationResult {
    const { h, content, input } = this
    if (this.slipped !== undefined) return this.standoffLeft(this.slipped)
    const expired = this.resolveExpiredChoice() ?? this.applyIncomingRaid() ?? this.applyIncomingMeeting() ?? this.applyIncomingFound()
    if (expired !== undefined) return expired
    const c = content.constants
    const sustain = this.sustain()
    const max = heroMaxHp(this.content, h)
    // D131: every strength counts against the one pouch; the drink is the weakest that puts the hero back above its drinking line.
    let potionQty = potionsHeld(input.inventory)
    let potionsUsed = 0
    let potionHealing = 0
    let drank: string | undefined

    const drink = potionQty > 0 && h.hp * 100 < max * sustain.autoPotionBelowPct ? autoPotion(content, potionRows(input.inventory), h.hp, max, sustain.autoPotionBelowPct) : undefined
    if (drink !== undefined) {
      potionHealing = Math.min(max - h.hp, pctOf(max, drink.healPct))
      h.hp += potionHealing
      potionQty -= 1
      potionsUsed = 1
      drank = drink.row.name
      this.changes.push({ type: 'potion_decrement', itemId: drink.row.id, deleteRow: drink.row.quantity === 1 })
      this.metrics.potionsUsed = 1
      h.counters.potionsUsed += 1
    }
    const potionSuffix = potionsUsed > 0 ? [content.potions === undefined ? 'Drank a potion.' : `Drank a ${potionWord(drank ?? 'potion')}.`] : []

    if (h.hp * 100 < max * sustain.restBelowPct) {
      h.status = 'resting'
      const healing = Math.min(max - h.hp, pctOf(max, c.restingHealPct))
      h.hp += healing
      h.counters.restTicks += 1
      this.cleanseBanes()
      const text = this.narrate(content.narrative.shared.restingHeal, { heal: healing })
      return this.finish(
        'rested',
        { kind: 'rest', summary: composeSummary(text, text, [...potionSuffix, ...this.waitingLine()], c.summaryMaxCodePoints), outcome: { variant: 'rest', healing, automatic: true, resultingStatus: 'resting' } },
        { potionsUsed, potionHealing },
      )
    }

    // D163: a dug-in elite takes the tick's encounter: no raid or meeting launches and nothing is rolled.
    const standing = h.standoff
    if (standing === undefined) {
      // D110: after sustain and before the encounter roll, a raid can be the tick's whole event.
      const raid = this.launchRaid()
      if (raid !== undefined) return raid
      // D141: when no raid is, a meeting can be; its draws come from its own stream.
      const meeting = this.launchMeeting()
      if (meeting !== undefined) return meeting
    }

    const biome = this.biome(h.biomeId)
    // P35: a rung's guarantee replaces the rolled kind once its bound has passed; every draw is still taken in its place.
    // D163: one that comes due during a standoff waits for it to end.
    const forced = standing === undefined ? guaranteeDue(content, h) : undefined
    const rolled =
      standing !== undefined
        ? 'combat'
        : pickWeighted<EncounterKind>(this.rng.encounter, [
            ['combat', biome.weights.combat],
            ['loot', biome.weights.loot],
            ['trap', biome.weights.trap],
            ['rest', biome.weights.rest],
          ])
    // D139 Christmas: the occurrence's gift turns the first free adventure into a gear find; a career guarantee goes first.
    const gift = standing === undefined && forced === undefined && this.giftDue()
    const kind: EncounterKind = gift ? 'loot' : forced === undefined ? rolled : forced === 'combat' || forced === 'elite' ? 'combat' : 'loot'
    if (forced !== undefined) {
      this.metrics.guarantees = 1
      const { armedAt: _armed, armedCount: _count, ...career } = h.career!
      // Fired: a repeating guarantee is re-armed at the tick's end; any other stands down for the rest of the rung.
      h.career = currentRung(content, h)!.guarantee!.repeat ? career : { ...career, fired: true }
    }
    h.counters.ticksExplored += 1
    this.metrics.encounter = kind

    let xpGranted = 0
    let goldGranted = 0
    let goldPenalty = 0
    let gear: NewItem | undefined
    let spareOwner: { rivalHeroId: string; rivalName: string } | undefined
    let lethal = false
    let upgrade: BagUpgrade | undefined
    let pouchUpgrade: BagUpgrade | undefined
    let effectGained: EffectRule | undefined
    /** D163: "Down to 31%." on a standoff tick the elite survives. */
    let standoffLine: string | undefined
    let outcome: OutcomeDetail
    let primary: string
    let compact: string
    const vars: Record<string, string | number> = {}
    const narrative = content.narrative.biomes[biome.id]!
    const shared = content.narrative.shared

    switch (kind) {
      case 'combat': {
        const monster = this.monster(standing?.monsterId ?? pickOne(this.rng.encounter, biome.monsterIds))
        const elite = standing !== undefined || this.rng.encounter.chance(c.elite.chancePct) || forced === 'elite'
        // D163: one more encounter draw on every new elite combat under a catalog with the rule, used or not, then the
        // conditions. A guaranteed elite stays a one-tick fight, so the guarantee pays out this tick.
        const rule = content.standoff
        const digIn = standing === undefined && elite && rule !== undefined && this.rng.encounter.chance(rule.digInPct) && forced === undefined && h.level >= rule.minLevel && biome.tier >= rule.minBiomeTier && !biome.safe
        const phase: 'dug_in' | 'fighting' | undefined = standing !== undefined ? 'fighting' : digIn ? 'dug_in' : undefined
        if (phase === 'dug_in') this.metrics.standoffStarts = 1
        const stats = this.stats()
        const mods = stats.modifiers
        const monsterHpMax = standing?.maxHp ?? (digIn ? Math.floor((monster.hp * rule!.hpMultiplierPct) / 100) : elite ? Math.floor((monster.hp * c.elite.hpMultiplierPct) / 100) : monster.hp)
        let monsterHp = standing?.hp ?? monsterHpMax
        const monsterHpStart = monsterHp
        const monsterAttack = phase !== undefined ? Math.floor((monster.attack * rule!.attackPct) / 100) : monster.attack
        const rounds: CombatRound[] = []
        let result: 'victory' | 'retreat' | 'lethal' = 'retreat'
        for (let round = 0; round < c.maxCombatRounds; round += 1) {
          const heroDamage = this.damage(stats.attack, monster.defense)
          monsterHp = Math.max(0, monsterHp - heroDamage)
          if (monsterHp === 0) {
            rounds.push({ heroDamage, monsterDamage: 0 })
            result = 'victory'
            break
          }
          const monsterDamage = this.damage(monsterAttack, stats.defense)
          h.hp = Math.max(0, h.hp - monsterDamage)
          rounds.push({ heroDamage, monsterDamage })
          if (h.hp === 0) {
            result = 'lethal'
            break
          }
          // D163: against a dug-in elite the hero steps back once it falls below its step-back line, a share of its
          // stance's rest line; the elite keeps its HP. Fighting on past the rest line is where the knockouts come from.
          if (phase !== undefined && h.hp * 10_000 < max * sustain.restBelowPct * rule!.stepBackPct) break
        }
        vars.monster = monster.name
        let gearDropped = false
        if (result === 'victory') {
          // Rolled exactly as before; the stance and the modifiers scale the roll afterwards, so the reward stream is unchanged (D76, D80).
          const xpMultiplier = phase !== undefined ? rule!.xpMultiplier : elite ? c.elite.xpMultiplier : 1
          const goldMultiplier = phase !== undefined ? rule!.goldMultiplier : elite ? c.elite.goldMultiplier : 1
          xpGranted = scaled(Math.max(1, Math.floor((this.rng.reward.int(monster.xp.min, monster.xp.max) * xpMultiplier * this.sustain().victoryXpPct) / 100)), mods.xpPct)
          goldGranted = scaled(this.rng.reward.int(monster.gold.min, monster.gold.max) * goldMultiplier, mods.goldPct)
          if (phase !== undefined) {
            // D163: the fall pays a find from the floor's tier, rare or better: a reward, not luck (D35 stands).
            gearDropped = true
            gear = this.generateGear(gearTierOf(biome), STANDOFF_RARITIES)
            h.counters.standoffsWon += 1
            this.metrics.standoffWins = 1
            delete h.standoff
          } else {
            gearDropped = this.rng.reward.chance(c.combatGearDropPct)
            if (gearDropped) gear = this.generateGear(gearTierOf(biome))
          }
          h.counters.combatWins += 1
          h.counters.monsterWins[monster.id] = (h.counters.monsterWins[monster.id] ?? 0) + 1
          if (elite) h.counters.eliteWins += 1
          this.metrics.victories = 1
          if (elite) this.metrics.elites = 1
          // D81 vampiric: a little health after every win; D80: an elite win fires the hero up.
          if (mods.healOnVictoryPct > 0 && h.hp > 0) h.hp = Math.min(heroMaxHp(this.content, h), h.hp + pctOf(heroMaxHp(this.content, h), mods.healOnVictoryPct))
          if (elite) effectGained = this.grantEffect(content.effectSources?.eliteVictory)
          Object.assign(vars, { xp: xpGranted, gold: goldGranted })
          const victories = [...narrative.victory, ...(content.narrative.monsters[monster.id]?.victory ?? [])]
          if (phase !== undefined) {
            primary = this.narrate(rule!.narrative.won[biome.id]!, vars)
            compact = fill(rule!.narrative.wonCompact, vars)
          } else {
            primary = this.narrate(elite ? narrative.eliteVictory : victories, vars)
            compact = fill('Beat {monster}. +{xp} XP, +{gold} gold.', vars)
          }
        } else if (result === 'retreat' && phase !== undefined) {
          // D163: no retreat and no gold lost; the elite keeps its HP for the next fight tick.
          h.standoff = { monsterId: monster.id, biomeId: biome.id, hp: monsterHp, maxHp: monsterHpMax, startedTick: standing?.startedTick ?? input.tick, untilTick: standing?.untilTick ?? input.tick + rule!.durationTicks }
          const lines = rule!.narrative
          primary = this.narrate(phase === 'dug_in' ? lines.dugIn[biome.id]! : lines.fighting, vars)
          compact = fill(phase === 'dug_in' ? lines.dugInCompact : lines.fightingCompact, vars)
          standoffLine = `Down to ${Math.ceil((monsterHp * 100) / monsterHpMax)}%.`
        } else if (result === 'retreat') {
          goldPenalty = Math.floor((h.gold * Math.max(0, c.retreatGoldLossPct - mods.goldLossPct)) / 100)
          h.gold -= goldPenalty
          h.counters.retreats += 1
          this.metrics.retreats = 1
          primary = this.narrate(shared.retreat, vars)
          compact = fill('Retreated from {monster}.', vars)
        } else {
          lethal = true
          primary = ''
          compact = ''
          if (phase !== undefined) this.metrics.standoffEnds = 1
        }
        outcome = {
          variant: 'combat',
          monsterId: monster.id,
          elite,
          monsterHpStart,
          monsterHpEnd: monsterHp,
          rounds,
          outcome: result === 'lethal' ? 'death' : result,
          xpGranted,
          goldGranted,
          gearDropped,
          ...(phase === undefined ? {} : { standoff: result === 'victory' ? ('won' as const) : phase, monsterHpMax }),
        }
        break
      }
      case 'loot': {
        // One reward draw per loot encounter, used or not, so eligibility never shifts later draws.
        const bagRoll = this.rng.reward.int(1, 1000)
        const bag = bagRoll <= content.bagLadder.findPermille ? nextEarlyTier(content, h) : undefined
        if (bag !== undefined) {
          const from = h.bagCapacity
          h.bagCapacity = bag.capacity
          upgrade = { from, to: bag.capacity, tierId: bag.id, source: 'find' }
          vars.item = bag.name
          vars.capacity = bag.capacity
          primary = this.narrate(shared.bagFind, vars)
          compact = fill('Found a {item}. Bag holds {capacity}.', vars)
          outcome = { variant: 'loot', found: 'bag', goldGranted: 0, jackpot: false, potionFullFallback: false }
          break
        }
        // D77: one pouch draw per loot encounter under a catalog with a ladder, at a fixed position after the bag draw.
        if (content.potionPouch !== undefined) {
          const pouchRoll = this.rng.reward.int(1, 1000)
          const pouch = pouchRoll <= content.potionPouch.findPermille ? nextEarlyPouchTier(content, h) : undefined
          if (pouch !== undefined) {
            pouchUpgrade = { from: potionCap(content, h), to: pouch.cap, tierId: pouch.id, source: 'find' }
            h.potionCap = pouch.cap
            vars.item = pouch.name
            vars.capacity = pouch.cap
            primary = this.narrate(shared.pouchFind, vars)
            compact = fill('Found a {item}. Holds {capacity} potions.', vars)
            outcome = { variant: 'loot', found: 'pouch', goldGranted: 0, jackpot: false, potionFullFallback: false }
            break
          }
        }
        let found = pickWeighted<'gear' | 'potion' | 'gold' | 'merchant' | 'event'>(this.rng.encounter, [
          ['gear', c.lootWeights.gear],
          ['potion', c.lootWeights.potion],
          ['gold', c.lootWeights.gold],
          // D139 Black Friday: the merchant's weight scaled for the day; still one draw.
          ...(c.lootWeights.merchant === undefined ? [] : [['merchant', Math.floor((c.lootWeights.merchant * (this.occasion?.rule.effect?.merchantWeightPct ?? 100)) / 100)] as const]),
          ...(c.lootWeights.event === undefined ? [] : [['event', c.lootWeights.event] as const]),
        ])
        if (forced === 'gear' || gift) found = 'gear'
        else if (forced === 'choice') found = 'event'
        else if (forced === 'merchant') found = 'merchant'
        // D79: one pending choice at a time; a second draw while one is open falls through to gold. P35: so does a
        // draw before the feature unlocks, for choices and the merchant alike.
        if (found === 'event' && (h.choice !== undefined || content.choices === undefined || !unlocked(content, h.level, 'choices'))) found = 'gold'
        if (found === 'merchant' && (content.merchant === undefined || !unlocked(content, h.level, 'merchant'))) found = 'gold'
        if (found === 'event') {
          const event = pickOne(this.rng.reward, content.choices!.events)
          const choice: PendingChoice = { eventId: event.id, offeredAtTick: input.tick, expiresAtTick: input.tick + content.choices!.expiresAfterTicks, biomeTier: biome.tier }
          h.choice = choice
          this.metrics.choicesOffered = 1
          primary = event.prompt
          compact = `${event.title}. Decide in the companion.`
          outcome = { variant: 'choice', phase: 'offered', eventId: event.id, expiresAtTick: choice.expiresAtTick }
          break
        }
        if (found === 'merchant') {
          const visit = this.merchantVisit(biome.tier)
          h.merchant = visit
          h.counters.merchantVisits += 1
          this.metrics.merchantVisits = 1
          vars.ticks = content.merchant!.staysForTicks
          primary = this.narrate(shared.merchant, vars)
          compact = fill('A merchant is passing through. {ticks} adventures to shop.', vars)
          outcome = { variant: 'merchant', offers: visit.offers, expiresAtTick: visit.expiresAtTick }
          break
        }
        let jackpot = false
        let potionFullFallback = false
        let potionTemplate: string | undefined
        const rollGold = () => {
          goldGranted = this.rng.reward.int(biome.lootGold.min, biome.lootGold.max)
          jackpot = this.rng.reward.chance(c.jackpot.chancePct)
          if (jackpot) {
            goldGranted *= c.jackpot.goldMultiplier
            this.metrics.jackpots = 1
            h.counters.jackpots += 1
          }
          goldGranted = scaled(goldGranted, this.stats().modifiers.goldPct)
          vars.gold = goldGranted
        }
        if (found === 'gear') {
          gear = this.generateGear(gearTierOf(biome))
          // D145: an ordinary find may be another player's spare instead; every fresh-item draw above is still taken.
          // D189: a find that will stay behind leaves the spare lying on the floor for someone else.
          if (forced === undefined && !gift && !this.leavesFindsBehind()) {
            const spare = this.takeSpare()
            if (spare !== undefined) {
              gear = spare.item
              spareOwner = spare.owner
            }
          }
          primary = ''
          compact = ''
        } else if (found === 'potion' && potionQty >= potionCap(content, h)) {
          potionFullFallback = true
          rollGold()
          primary = this.narrate(jackpot ? narrative.jackpot : shared.potionFullGold, vars)
          compact = fill('+{gold} gold.', vars)
        } else if (found === 'potion') {
          // D131: the strength is a reward draw by biome tier, taken only under a catalog with strengths.
          const strength = rollPotionStrength(content, this.rng.reward, biome.tier)
          this.gainPotion(strength)
          if (content.potions !== undefined) {
            vars.potion = potionWord(strength.name)
            potionTemplate = strength.templateId
          }
          primary = this.narrate(shared.lootPotion, vars)
          compact = content.potions === undefined ? 'Found a potion.' : fill('Found a {potion}.', vars)
        } else {
          rollGold()
          primary = this.narrate(jackpot ? narrative.jackpot : narrative.lootGold, vars)
          compact = fill('Found {gold} gold.', vars)
        }
        outcome = { variant: 'loot', found: potionFullFallback ? 'gold' : found, goldGranted, jackpot, potionFullFallback, ...(potionTemplate === undefined ? {} : { templateId: potionTemplate }) }
        break
      }
      case 'trap': {
        const avoided = this.rng.combat.chance(c.trapAvoidPct)
        let damage = 0
        if (avoided) {
          h.counters.trapsAvoided += 1
          primary = this.narrate(shared.trapAvoided, vars)
          compact = 'Avoided a trap.'
        } else {
          damage = this.rng.combat.int(biome.trapDamage.min, biome.trapDamage.max)
          const trapMods = this.stats().modifiers
          if (trapMods.trapDamagePct > 0) damage = Math.max(1, Math.floor((damage * (100 - trapMods.trapDamagePct)) / 100))
          h.hp = Math.max(0, h.hp - damage)
          lethal = h.hp === 0
          if (!lethal) effectGained = this.grantEffect(content.effectSources?.trapHit)
          vars.damage = damage
          primary = lethal ? '' : this.narrate(narrative.trapHit, vars, narrative.trapHitCallbacks)
          compact = fill('A trap hit for {damage} HP.', vars)
        }
        outcome = { variant: 'trap', avoided, damage, outcome: 'survived' }
        break
      }
      case 'rest': {
        const healing = Math.min(max - h.hp, pctOf(max, c.restEncounterHealPct))
        h.hp += healing
        h.counters.restTicks += 1
        this.cleanseBanes()
        vars.heal = healing
        primary = this.narrate(healing > 0 ? narrative.rest : shared.restFull, vars)
        compact = fill('Rested. +{heal} HP.', vars)
        outcome = { variant: 'rest', healing, automatic: false, resultingStatus: 'exploring' }
        break
      }
    }

    // Death and safe-biome protection come before level-up.
    let logKind: LogKind = outcome.variant === 'merchant' ? 'merchant' : outcome.variant === 'choice' ? 'choice' : kind
    const consequences: string[] = standoffLine === undefined ? [] : [standoffLine]
    if (lethal) {
      const ticks = c.reviveAfterTicks
      const isCombat = outcome.variant === 'combat'
      if (biome.safe) {
        h.hp = 1
        h.status = 'resting'
        h.counters.rescues += 1
        this.metrics.rescues = 1
        primary = this.narrate(isCombat ? shared.rescue : shared.trapRescue, vars)
        compact = 'Got away and stopped to rest.'
        outcome = { ...outcome, outcome: 'rescue' } as OutcomeDetail
      } else {
        goldPenalty = this.knockOut()
        logKind = 'death'
        primary = this.narrate(isCombat ? shared.death : shared.trapDeath, { ...vars, ticks })
        compact = fill('Knocked out for about {hours} hours.', { hours: Math.max(1, Math.round(ticks / 4)) })
        outcome = { ...outcome, outcome: 'death' } as OutcomeDetail
        if (goldPenalty > 0) consequences.push(`Lost ${goldPenalty} gold.`)
        consequences.push(...this.spareLine())
      }
    } else if (goldPenalty > 0) {
      consequences.push(`Dropped ${goldPenalty} gold.`)
    }

    // Rewards, level-ups and lifetime counters.
    let levelsGained = 0
    if (xpGranted > 0) {
      const level = applyXp(h.level, h.xp, xpGranted)
      levelsGained = level.levelsGained
      h.level = level.level
      h.xp = level.xp
      h.lifetimeXp += xpGranted
      if (levelsGained > 0) {
        if (h.hp > 0) h.hp = Math.min(heroMaxHp(this.content, h), h.hp + heroMaxHp(this.content, h) - heroMaxHp(this.content, { level: h.level - levelsGained, class: h.class }))
        h.lastLevelUpTick = input.tick
        this.metrics.levelUps = levelsGained
        if (logKind !== 'death') logKind = 'levelup'
        consequences.push(`Reached level ${h.level}!`)
        // A level that opens a new area says so.
        const opened = content.biomes.find((b) => !b.safe && b.unlockLevel > h.level - levelsGained && b.unlockLevel <= h.level)
        if (opened) consequences.push(this.narrate(shared.unlock, { destination: opened.name }))
      }
    }
    if (goldGranted > 0) {
      h.gold += goldGranted
      h.counters.goldEarned += goldGranted
    }

    // Guaranteed bag milestones land before any gear is placed, so the new space is usable at once.
    const milestone: BagTier | undefined = milestoneUpgrade(content, h)
    if (milestone !== undefined) {
      upgrade = { from: upgrade?.from ?? h.bagCapacity, to: milestone.capacity, tierId: milestone.id, source: 'milestone' }
      h.bagCapacity = milestone.capacity
      consequences.push(`Found ${withArticle(milestone.name)}! Bag holds ${milestone.capacity}.`)
    }
    if (upgrade !== undefined) this.metrics.bagUpgrades = 1
    // D77: pouch milestones land the same way, so the new cap is usable at once.
    const pouchMilestone: PouchTier | undefined = pouchMilestoneUpgrade(content, h)
    if (pouchMilestone !== undefined) {
      pouchUpgrade = { from: pouchUpgrade?.from ?? potionCap(content, h), to: pouchMilestone.cap, tierId: pouchMilestone.id, source: 'milestone' }
      h.potionCap = pouchMilestone.cap
      consequences.push(`Found ${withArticle(pouchMilestone.name)}! Holds ${pouchMilestone.cap} potions.`)
    }
    if (pouchUpgrade !== undefined) this.metrics.pouchUpgrades = 1

    let heldFind = false
    let disposition: Disposition = 'advanced'
    if (gear !== undefined) {
      h.counters.itemsFound += 1
      if (gear.rarity === 'rare' || gear.rarity === 'epic') h.counters.rareFinds += 1
      if (gear.rarity === 'epic') h.counters.epicFinds += 1
      const affix = affixById(content, gear.affixId)
      const item = `${affix ? `${affix.name} ` : ''}${rarityLabel(gear.rarity)} ${gear.name}`
      // A find that overflows the bag is held and the hero sleeps until the player makes room (D18/D19, D123).
      // D189: under v26 the hero keeps going instead, and with a find already held a further one stays behind.
      const leftBehind = this.leavesFindsBehind()
      heldFind = !leftBehind && isBagFull(h, input.inventory)
      const destination = leftBehind ? 'left' : heldFind ? 'held' : 'bag'
      if (!leftBehind) this.changes.push({ type: 'create', destination: heldFind ? 'held' : 'bag', item: gear, ...(spareOwner === undefined ? {} : { spare: true as const }) })
      if (leftBehind) consequences.unshift('Bag full, so it stayed behind.')
      else if (heldFind) {
        this.metrics.heldFinds = 1
        consequences.unshift('Bag full. Holding it until you make room.')
        if (content.keepGoingWhenFull !== true) {
          h.status = 'sleeping'
          this.metrics.sleepStarts = 1
          disposition = 'inventory_sleep_started'
        }
      }
      if (outcome.variant === 'loot' && gift) {
        // The mark makes it once per occurrence, whatever else the tick did.
        h.occasion = { key: this.occasion!.key, gifted: true }
        primary = this.narrate(this.occasion!.rule.effect!.gift!.lines, {})
        compact = 'Unwrapped a gift.'
        consequences.unshift(`Found ${withArticle(item)}.`)
        outcome = { ...outcome, templateId: gear.templateId, rarity: gear.rarity, destination }
      } else if (outcome.variant === 'loot' && spareOwner !== undefined) {
        const lines = content.lostProperty!.narrative
        const spareVars = { rival: spareOwner.rivalName, item: gear.name }
        primary = this.narrate(lines.found, spareVars)
        compact = fill(lines.foundCompact, spareVars)
        outcome = { ...outcome, templateId: gear.templateId, rarity: gear.rarity, destination, spare: spareOwner }
      } else if (outcome.variant === 'loot') {
        primary = this.narrate([...shared.lootGear, ...narrative.lootGear], { item })
        compact = `Found ${withArticle(item)}.`
        outcome = { ...outcome, templateId: gear.templateId, rarity: gear.rarity, destination }
      } else {
        consequences.push(`Found ${withArticle(item)}.`)
      }
    }
    consequences.push(...potionSuffix)
    if (effectGained !== undefined) consequences.push(`${effectGained.name} for ${effectGained.durationTicks} adventures.`)

    return this.finish(
      disposition,
      { kind: logKind, summary: composeSummary(primary, compact, consequences, c.summaryMaxCodePoints), outcome, encounterKind: kind },
      { potionsUsed, potionHealing, levelsGained, goldPenalty, heldFind, xpGranted, ...(upgrade === undefined ? {} : { bagUpgrade: upgrade }), ...(pouchUpgrade === undefined ? {} : { pouchUpgrade }), ...(effectGained === undefined ? {} : { effectGained: effectGained.id }) },
    )
  }

  /**
   * D163: a standoff past its clock, off the hero's floor, or one the pinned catalog cannot fight (no rule, monster or
   * floor) is dropped at the start of every evaluation. Only the clock running out while the hero explores is told.
   */
  private dropStaleStandoff(): void {
    const { h, content, input } = this
    const standoff = h.standoff
    if (standoff === undefined) return
    const known = content.standoff !== undefined && content.monsters.some((m) => m.id === standoff.monsterId) && content.biomes.some((b) => b.id === standoff.biomeId)
    if (known && standoff.biomeId === h.biomeId && input.tick < standoff.untilTick) return
    this.endStandoff()
    if (known && standoff.biomeId === h.biomeId && h.status === 'exploring') this.slipped = standoff
  }

  /** D163: the standoff ends without a fall (clock, knockout, travel); a no-op without one. */
  private endStandoff(): void {
    if (this.h.standoff === undefined) return
    delete this.h.standoff
    this.metrics.standoffEnds = 1
  }

  /** D163: the elite's clock ran out; this tick's whole event, before anything incoming. */
  private standoffLeft(standoff: Standoff): SimulationResult {
    const lines = this.content.standoff!.narrative
    const vars = { monster: this.monster(standoff.monsterId).name }
    return this.finish('advanced', {
      kind: 'combat',
      summary: composeSummary(this.narrate(lines.slipped, vars), fill(lines.slippedCompact, vars), [], this.content.constants.summaryMaxCodePoints),
      outcome: { variant: 'standoff_left', monsterId: standoff.monsterId, startedTick: standoff.startedTick },
    })
  }

  /** D163: a rest line's note that the dug-in elite is waiting. */
  private waitingLine(): string[] {
    const standoff = this.h.standoff
    return standoff === undefined ? [] : [fill(this.content.standoff!.narrative.waiting, { monster: this.monster(standoff.monsterId).name })]
  }

  /** D139: the live occasion has a gift this hero has not found in this occurrence. */
  private giftDue(): boolean {
    const live = this.occasion
    return live?.rule.effect?.gift !== undefined && !(this.h.occasion?.key === live.key && this.h.occasion.gifted === true)
  }

  /** A knockout outside Office Cubicles: the death gold loss (less thrifty), every effect cleared, revival scheduled. */
  private knockOut(): number {
    const { h, content, input } = this
    const c = content.constants
    const goldPenalty = Math.floor((h.gold * Math.max(0, c.deathGoldLossPct - this.stats().modifiers.goldLossPct)) / 100)
    h.gold -= goldPenalty
    h.status = 'dead'
    // D80 death ordering: a knockout clears every effect, boon or bane; revival starts clean.
    delete h.effects
    // D163: revival is in the Office, so a dug-in elite is left behind.
    this.endStandoff()
    h.reviveAtTick = input.tick + c.reviveAfterTicks
    delete h.targetBiomeId
    delete h.arriveAtTick
    h.counters.deaths += 1
    this.metrics.deaths = 1
    this.dropSpare()
    return goldPenalty
  }

  /**
   * D145: a knockout leaves a spare of one equipped item on the floor, picked by the graveyard stream's first draw.
   * Nothing drops while an earlier spare's found notice is still waiting, so the notice lands first.
   */
  private dropSpare(): void {
    const { h, content, input } = this
    const draws = graveyardDraws(input.streams, content)
    if (draws === undefined || input.incomingFound !== undefined) return
    const source = spareSource(h, input.inventory, draws.slot)
    if (source === undefined) return
    this.spareDropped = spareOf(source, h.biomeId, input.tick, draws.shard)
    this.metrics.sparesDropped = 1
  }

  /** The knockout's spare line, when one dropped. */
  private spareLine(): string[] {
    const spare = this.spareDropped
    return spare === undefined ? [] : [fill(this.content.lostProperty!.narrative.dropped, { item: spare.name })]
  }

  /**
   * D145 finder side: the adapter's spare, when the graveyard stream's look hit, becomes this tick's gear find. A
   * spare of the hero's own, or one the catalog cannot rebuild, leaves the fresh find standing.
   */
  /** D189: the bag is full and a find is already held, so under a catalog that keeps going a new find stays behind. */
  private leavesFindsBehind(): boolean {
    return this.content.keepGoingWhenFull === true && this.h.heldItemId !== undefined && isBagFull(this.h, this.input.inventory)
  }

  private takeSpare(): { item: NewItem; owner: { rivalHeroId: string; rivalName: string } } | undefined {
    const { h, content, input } = this
    const spare = input.lostSpare
    if (spare === undefined || spare.ownerHeroId === h.id || graveyardDraws(input.streams, content)?.plan === undefined) return undefined
    const item = spareItem(content, spare)
    if (item === undefined) return undefined
    h.counters.lostPropertyFound += 1
    this.metrics.sparesFound = 1
    this.spareFound = { ownerHeroId: spare.ownerHeroId }
    return { item, owner: { rivalHeroId: spare.ownerHeroId, rivalName: spare.ownerName } }
  }

  /**
   * D145 owner side: someone found this hero's spare; the notice lands as this tick's whole event, after any incoming
   * raid or meeting. Under a catalog without lost-property rules it stays pending.
   */
  private applyIncomingFound(): SimulationResult | undefined {
    const { content, input } = this
    const found = input.incomingFound
    if (found === undefined || content.lostProperty === undefined) return undefined
    const lines = content.lostProperty.narrative
    const vars = { rival: found.finderName, item: found.name, destination: this.biome(found.biomeId).name }
    this.foundApplied = true
    this.metrics.sparesReturned = 1
    return this.finish('advanced', {
      kind: 'lost_property',
      summary: composeSummary(this.narrate(lines.returned, vars), fill(lines.returnedCompact, vars), [], content.constants.summaryMaxCodePoints),
      outcome: { variant: 'lost_property', rivalHeroId: found.finderHeroId, rivalName: found.finderName, rivalClass: found.finderClass, templateId: found.templateId, biomeId: found.biomeId, foundTick: found.foundTick },
    })
  }

  /**
   * D110 raider side: the launch draw, then the contest, as this tick's whole event. Without raid rules, a raid
   * seed or a raidable target the tick goes on to its ordinary encounter (the draw is spent, nothing is logged).
   */
  private launchRaid(): SimulationResult | undefined {
    const { h, content, input } = this
    const rng = raidStream(input.streams, content)
    // P35: no launch draw before raids unlock; the adapter checks the same level before it looks for a target.
    if (rng === undefined || !unlocked(content, h.level, 'raids')) return undefined
    if (drawRaidPlan(rng, this.stance(), content, raidLaunchPct(this.occasion)) === undefined) return undefined
    const target = input.raidTarget
    if (target === undefined || target.heroId === h.id) return undefined
    const rules = content.raids!
    // The contest draw is taken even on Friday the 13th, so the stream's positions never move.
    const raiderWon = rng.chance(raidWinChance(content, this.stance(), target.stance, classRule(content, h.class)?.raidEdgePct ?? 0, target.classEdgePct ?? 0))
    const thrifty = this.stats().modifiers.goldLossPct
    const mishap = this.occasion?.rule.effect?.raidMishap
    if (mishap !== undefined) {
      // D139: nobody wins. Each side loses its own share of gold, which goes nowhere, and the same share of HP.
      const lost = raidGoldLoss(h.gold, mishap.goldLossPct, thrifty)
      h.gold -= lost
      // Not a launch in the record: "raids failed" stays launched minus won.
      h.counters.ticksExplored += 1
      h.counters.raidMishaps += 1
      this.metrics.raidsLaunched = 1
      const hpLost = Math.min(h.hp, raidHpLoss(heroMaxHp(this.content, h), mishap.hpPct))
      h.hp -= hpLost
      this.raidLaunch = { targetHeroId: target.heroId, tick: input.tick, raiderWon: false, gold: lost, targetHpPct: mishap.hpPct, mishap: true }
      return this.finishRaid('raider', target.heroId, target.name, false, lost, hpLost, input.tick, mishap.raider)
    }
    const gold = raiderWon ? raidGoldLoss(target.gold, rules.goldLossPct, target.goldLossPct ?? 0) : raidGoldLoss(h.gold, rules.goldLossPct, thrifty)
    if (raiderWon) {
      h.gold += gold
      h.counters.goldEarned += gold
      h.counters.raidsWon += 1
    } else {
      h.gold -= gold
    }
    h.counters.ticksExplored += 1
    h.counters.raidsLaunched += 1
    this.metrics.raidsLaunched = 1
    const hpLost = Math.min(h.hp, raidHpLoss(heroMaxHp(this.content, h), raiderWon ? rules.winnerHpPct : rules.loserHpPct))
    h.hp -= hpLost
    this.raidLaunch = { targetHeroId: target.heroId, tick: input.tick, raiderWon, gold, targetHpPct: raiderWon ? rules.loserHpPct : rules.winnerHpPct }
    return this.finishRaid('raider', target.heroId, target.name, raiderWon, gold, hpLost, input.tick)
  }

  /**
   * D110 target side: a ledger raid lands as this tick's whole event, the way a defaulted choice does. Gold moves by
   * the ledger amount, a loss clamped to what the hero holds now; HP by the share of maximum HP. Under a catalog
   * without raid rules the raid stays pending.
   */
  private applyIncomingRaid(): SimulationResult | undefined {
    const { h, content, input } = this
    const raid = input.incomingRaid
    if (raid === undefined || content.raids === undefined) return undefined
    if (raid.mishap === true) {
      // D139: the target loses its own share of gold, as it would on the day; a catalog without the rule uses the raid share.
      const rule = mishapRule(content)
      const gold = raidGoldLoss(h.gold, rule?.goldLossPct ?? content.raids.goldLossPct, this.stats().modifiers.goldLossPct)
      h.gold -= gold
      h.counters.raidMishaps += 1
      const hpLost = Math.min(h.hp, raidHpLoss(heroMaxHp(this.content, h), raid.targetHpPct))
      h.hp -= hpLost
      this.raidApplied = true
      this.metrics.raidsApplied = 1
      return this.finishRaid('target', raid.raiderHeroId, raid.raiderName, false, gold, hpLost, raid.tick, rule?.target ?? content.raids.narrative.raided)
    }
    const won = !raid.raiderWon
    let gold: number
    if (won) {
      gold = raid.gold
      h.gold += gold
      h.counters.goldEarned += gold
      h.counters.raidsRepelled += 1
    } else {
      gold = Math.min(raid.gold, h.gold)
      h.gold -= gold
      h.counters.raidsLost += 1
    }
    const hpLost = Math.min(h.hp, raidHpLoss(heroMaxHp(this.content, h), raid.targetHpPct))
    h.hp -= hpLost
    this.raidApplied = true
    this.metrics.raidsApplied = 1
    return this.finishRaid('target', raid.raiderHeroId, raid.raiderName, won, gold, hpLost, raid.tick)
  }

  /** One raid log entry from this hero's side; lethal raid damage resolves like any lethal encounter. */
  private finishRaid(role: 'raider' | 'target', rivalHeroId: string, rivalName: string, won: boolean, gold: number, hpLost: number, raidTick: number, mishapLines?: readonly string[]): SimulationResult {
    const { h, content } = this
    const lines = content.raids!.narrative
    const vars = { rival: rivalName, gold }
    const mishap = mishapLines !== undefined
    const pool = mishapLines ?? (role === 'raider' ? (won ? lines.raidWon : lines.raidLost) : won ? lines.repelled : lines.raided)
    const compactTemplate = mishap ? (role === 'raider' ? 'A raid on {rival} went wrong.' : "{rival}'s raid went wrong.") : role === 'raider' ? (won ? 'Raided {rival}.' : 'Caught raiding {rival}.') : won ? 'Caught {rival} raiding.' : 'Raided by {rival}.'
    const primary = this.narrate(pool, vars)
    const compact = fill(compactTemplate, vars)
    let kind: LogKind = 'raid'
    let outcome: 'survived' | 'death' | 'rescue' = 'survived'
    let goldPenalty = 0
    // The raid stays the story; a knockout or rescue is its most important consequence.
    const consequences: string[] = []
    if (h.hp === 0) {
      if (this.biome(h.biomeId).safe) {
        h.hp = 1
        h.status = 'resting'
        h.counters.rescues += 1
        this.metrics.rescues = 1
        outcome = 'rescue'
        consequences.push(this.narrate(lines.rescue, vars))
      } else {
        const ticks = content.constants.reviveAfterTicks
        goldPenalty = this.knockOut()
        outcome = 'death'
        kind = 'death'
        // Fixed and short, so the knockout survives the budget beside the longest name and purse.
        consequences.push(fill('Out cold for {hours} hours.', { hours: Math.max(1, Math.round(ticks / 4)) }))
        if (goldPenalty > 0) consequences.push(`Lost ${goldPenalty} gold.`)
        consequences.push(...this.spareLine())
      }
    }
    return this.finish(
      'advanced',
      { kind, summary: composeSummary(primary, compact, consequences, content.constants.summaryMaxCodePoints), outcome: { variant: 'raid', role, rivalHeroId, rivalName, won, gold, hpLost, raidTick, outcome, ...(mishap ? { mishap: true as const } : {}) } },
      { goldPenalty },
    )
  }

  /**
   * D141 starter side: the launch draw, then the kind, as this tick's whole event. Without meeting rules, a meeting
   * seed or a partner the tick goes on to its ordinary encounter (the draw is spent, nothing is logged).
   */
  private launchMeeting(): SimulationResult | undefined {
    const { h, content, input } = this
    const rng = meetingStream(input.streams, content)
    // No launch draw before meetings unlock; the adapter checks the same level before it looks for a partner.
    if (rng === undefined || !unlocked(content, h.level, 'meetings')) return undefined
    if (drawMeetingPlan(rng, content) === undefined) return undefined
    const partner = input.meetingPartner
    if (partner === undefined || partner.heroId === h.id) return undefined
    const kind = drawMeetingKind(rng, content)
    h.counters.ticksExplored += 1
    h.counters.meetings += 1
    this.metrics.meetingsLaunched = 1
    this.meetingLaunch = { partnerHeroId: partner.heroId, tick: input.tick, kindId: kind.id }
    return this.finishMeeting('starter', partner.heroId, partner.name, partner.class, kind, input.tick)
  }

  /**
   * D141 partner side: a ledger meeting lands as this tick's whole event, after any incoming raid. Under a catalog
   * without meeting rules it stays pending; a kind the catalog no longer has lands as its first kind.
   */
  private applyIncomingMeeting(): SimulationResult | undefined {
    const { h, content, input } = this
    const meeting = input.incomingMeeting
    if (meeting === undefined || content.meetings === undefined) return undefined
    const kind = meetingKind(content, meeting.kindId) ?? content.meetings.kinds[0]!
    h.counters.meetings += 1
    this.meetingApplied = true
    this.metrics.meetingsApplied = 1
    return this.finishMeeting('partner', meeting.starterHeroId, meeting.starterName, meeting.starterClass, kind, meeting.tick)
  }

  /** One meeting log entry from this hero's side, with the kind's boon. */
  private finishMeeting(role: 'starter' | 'partner', rivalHeroId: string, rivalName: string, rivalClass: HeroClass, kind: MeetingKind, meetingTick: number): SimulationResult {
    const { content } = this
    const vars = { rival: rivalName }
    const primary = this.narrate(role === 'starter' ? kind.starter : kind.partner, vars)
    const granted = this.grantEffect(kind.effectId)
    const consequences = granted === undefined ? [] : [`${granted.name} for ${granted.durationTicks} adventures.`]
    return this.finish(
      'advanced',
      { kind: 'meeting', summary: composeSummary(primary, fill(kind.compact, vars), consequences, content.constants.summaryMaxCodePoints), outcome: { variant: 'meeting', role, rivalHeroId, rivalName, rivalClass, kindId: kind.id, meetingTick } },
      granted === undefined ? {} : { effectGained: granted.id },
    )
  }

  /**
   * The merchant's offers (D78), drawn from the reward stream so a visit replays exactly: a potion bundle priced by
   * the biome tier, plus the next pouch and the next bag when the hero may take them early. Bounded: at most three.
   */
  private merchantVisit(biomeTier: number): MerchantVisit {
    const { h, content } = this
    const rule = content.merchant!
    const quantity = this.rng.reward.int(1, rule.maxPotionsOffered)
    // D139 Black Friday: every price on a visit that opens that day is scaled for the whole visit.
    const sale = (price: number) => Math.max(1, Math.floor((price * (this.occasion?.rule.effect?.merchantPricePct ?? 100)) / 100))
    const offers: MerchantOffer[] = [{ id: 'potions', name: quantity === 1 ? 'Healing potion' : `${quantity} healing potions`, quantity, price: sale(rule.potionPrice * biomeTier * quantity) }]
    // D122: the merchant undercuts the companion's ladder price, so a visit is a deal rather than a convenience.
    const discounted = (price: number) => sale(Math.max(1, Math.floor((price * (100 - (rule.ladderDiscountPct ?? 0))) / 100)))
    const pouch = nextEarlyPouchTier(content, h)
    if (pouch?.price !== undefined) offers.push({ id: 'pouch', name: pouch.name, quantity: 1, price: discounted(pouch.price), tierId: pouch.id })
    const bag = nextEarlyTier(content, h)
    if (bag?.price !== undefined) offers.push({ id: 'bag', name: bag.name, quantity: 1, price: discounted(bag.price), tierId: bag.id })
    return { offers, expiresAtTick: this.input.tick + rule.staysForTicks, biomeId: h.biomeId }
  }

  // ------------------------------------------------------------ helpers

  private damage(attack: number, defense: number): number {
    const { min, max } = this.content.constants.damageVariance
    const variance = this.rng.combat.int(min, max)
    return Math.max(1, Math.floor(((2 * attack - defense) * variance) / 200))
  }

  /** One more potion of a strength: its row, or a new row for the strength (D131: one row per strength, one pouch). */
  private gainPotion(strength: PotionStrength): void {
    const { content, input } = this
    // Before D131 the one potion row is the row, whatever template it carries.
    const row = content.potions === undefined ? potionRows(input.inventory)[0] : potionRows(input.inventory).find((item) => item.templateId === strength.templateId)
    const rowId = row?.id
    const pendingDelete = rowId === undefined ? -1 : this.changes.findIndex((change) => change.type === 'potion_decrement' && change.itemId === rowId)
    if (pendingDelete >= 0) {
      // Drank and found a potion in the same tick: the stack is unchanged.
      this.changes.splice(pendingDelete, 1)
      return
    }
    if (rowId !== undefined) {
      this.changes.push({ type: 'potion_increment', itemId: rowId })
      return
    }
    // A second potion of a strength with no row yet (a decision's bundle) joins the row this tick creates.
    const at = this.changes.findIndex((change) => change.type === 'create' && change.destination === 'potion_stack' && change.item.templateId === strength.templateId)
    const pending = this.changes[at]
    if (pending !== undefined && pending.type === 'create') {
      this.changes[at] = { ...pending, item: { ...pending.item, quantity: pending.item.quantity + 1 } }
      return
    }
    this.changes.push({ type: 'create', destination: 'potion_stack', item: potionItem(content, strength, 1) })
  }

  /** `only` limits the rarity draw to those rarities, by their weights (D163's guaranteed find). */
  private generateGear(tier: number, only?: readonly Rarity[]): NewItem {
    const { content } = this
    const rng = this.rng.reward
    const rarity = pickWeighted(rng, content.rarities.filter((rule) => only === undefined || only.includes(rule.rarity)).map((rule) => [rule, rule.weight] as const))
    const kind = rng.int(0, 1) === 0 ? 'weapon' : 'armor'
    const template = pickOne(rng, content.gearTemplates.filter((t) => t.tier === tier && t.kind === kind))
    const stats = content.gearTiers[tier]
    if (stats === undefined) throw new SimulationInvariantError('GEAR_TIER', `no gear tier ${tier}`)
    // D81: rare and epic gear roll one affix, a draw that exists only under a catalog with affixes.
    const affix = content.affixes !== undefined && content.affixRarities?.includes(rarity.rarity) ? pickOne(rng, content.affixes) : undefined
    return {
      ...(affix === undefined ? {} : { affixId: affix.id }),
      templateId: template.id,
      contentVersion: content.contentVersion,
      kind,
      name: template.name,
      rarity: rarity.rarity,
      requiredLevel: stats.requiredLevel,
      attack: kind === 'weapon' ? stats.weaponAttack + (template.statOffset ?? 0) + rarity.statBonus : 0,
      defense: kind === 'armor' ? stats.armorDefense + (template.statOffset ?? 0) + rarity.statBonus : 0,
      saleValue: stats.saleValue * rarity.saleMultiplier,
      quantity: 1,
    }
  }

  private biome(id: string): BiomeTemplate {
    const biome = this.content.biomes.find((b) => b.id === id)
    if (biome === undefined) throw new SimulationInvariantError('BIOME', `unknown biome ${id}`)
    return biome
  }

  private monster(id: string): MonsterTemplate {
    const monster = this.content.monsters.find((m) => m.id === id)
    if (monster === undefined) throw new SimulationInvariantError('MONSTER', `unknown monster ${id}`)
    return monster
  }

  private finish(
    disposition: Disposition,
    event?: { kind: LogKind; summary: string; outcome: OutcomeDetail; encounterKind?: EncounterKind },
    extra: { potionsUsed?: number; potionHealing?: number; levelsGained?: number; goldPenalty?: number; heldFind?: boolean; xpGranted?: number; bagUpgrade?: BagUpgrade; pouchUpgrade?: BagUpgrade; effectGained?: string } = {},
  ): SimulationResult {
    const { h, input } = this
    const nextHero = toHeroState(h)
    const base = { nextHero, itemChanges: this.changes, metrics: this.metrics, disposition, ...(this.raidLaunch === undefined ? {} : { raidLaunch: this.raidLaunch }), ...(this.raidApplied ? { raidApplied: true } : {}), ...(this.meetingLaunch === undefined ? {} : { meetingLaunch: this.meetingLaunch }), ...(this.meetingApplied ? { meetingApplied: true } : {}), ...(this.spareDropped === undefined ? {} : { spareDropped: this.spareDropped }), ...(this.spareFound === undefined ? {} : { spareFound: this.spareFound }), ...(this.foundApplied ? { foundApplied: true } : {}) }
    if (event === undefined) return base
    const detail: LogDetail = {
      v: 1,
      simulationVersion: input.simulationVersion,
      contentVersion: this.content.contentVersion,
      disposition,
      ...(event.encounterKind === undefined ? {} : { encounterKind: event.encounterKind }),
      potionsUsed: extra.potionsUsed ?? 0,
      ...(extra.potionHealing ? { potionHealing: extra.potionHealing } : {}),
      levelsGained: extra.levelsGained ?? 0,
      goldPenalty: extra.goldPenalty ?? 0,
      heldFind: extra.heldFind ?? false,
      ...(extra.bagUpgrade === undefined ? {} : { bagUpgrade: extra.bagUpgrade }),
      ...(extra.pouchUpgrade === undefined ? {} : { pouchUpgrade: extra.pouchUpgrade }),
      ...(extra.effectGained === undefined ? {} : { effectGained: extra.effectGained }),
      outcome: event.outcome,
    }
    return {
      ...base,
      event: {
        kind: event.kind,
        summary: event.summary,
        detail,
        deltas: { xpEarned: extra.xpGranted ?? 0, gold: nextHero.gold - input.hero.gold, hp: nextHero.hp - input.hero.hp },
      },
    }
  }
}

/** Drop undefined optional fields so the result satisfies exact optional property types. */
function toHeroState(h: WorkingHero): HeroState {
  const entries = Object.entries(h).filter(([, value]) => value !== undefined)
  return { ...(Object.fromEntries(entries) as unknown as HeroState), counters: { ...h.counters, monsterWins: { ...h.counters.monsterWins }, ...(h.counters.biomesVisited === undefined ? {} : { biomesVisited: { ...h.counters.biomesVisited } }) } }
}

function validateOutput(input: SimulationInput, result: SimulationResult): void {
  const fail = (code: string, message: string): never => {
    throw new SimulationInvariantError(code, message)
  }
  let next = 0
  const applied = applyItemChanges(result.nextHero, input.inventory, result.itemChanges, () => `￿-new-${next++}`)
  assertHeroInvariants(applied.hero, applied.inventory, input.content)
  const { hero } = input
  const out = result.nextHero
  if (out.id !== hero.id || out.class !== hero.class) fail('IDENTITY', 'simulator changed hero identity')
  if (out.weaponId !== hero.weaponId || out.armorId !== hero.armorId) fail('EQUIPMENT', 'simulator changed equipment')
  if (out.heldItemId !== hero.heldItemId) fail('HELD', 'simulator cannot set held IDs directly')
  if (result.itemChanges.filter((change) => change.type === 'create').length > 1) fail('CREATES', 'more than one new row')
  const xpEarned = result.event?.deltas.xpEarned ?? 0
  if (out.lifetimeXp - hero.lifetimeXp !== xpEarned) fail('XP_CONSERVATION', 'lifetime XP delta differs from granted XP')
  if (out.level < hero.level) fail('LEVEL_DOWN', 'level decreased')
  if (out.bagCapacity < hero.bagCapacity) fail('BAG_SHRANK', 'bag capacity decreased')
  if ((out.potionCap ?? 0) < (hero.potionCap ?? 0)) fail('POUCH_SHRANK', 'potion cap decreased')
  if (out.merchant !== undefined && (out.merchant.offers.length === 0 || out.merchant.offers.length > 3 || out.merchant.expiresAtTick <= input.tick)) fail('MERCHANT', 'merchant offers must be one to three and still open')
  if (out.choice !== undefined && hero.choice === undefined && out.choice.offeredAtTick !== input.tick) fail('CHOICE', 'a new choice must be offered this tick')
  if (out.effects !== undefined && (out.effects.length === 0 || out.effects.length > 3 || out.effects.some((effect) => effect.untilTick <= input.tick))) fail('EFFECTS', 'effects must be one to three live entries')
  if (result.event && codePoints(result.event.summary) > input.content.constants.summaryMaxCodePoints) {
    fail('SUMMARY_LENGTH', result.event.summary)
  }
  if (result.event && result.event.summary.trim() === '') fail('SUMMARY_EMPTY', 'event without summary')
  const meetingSides = (result.meetingLaunch === undefined ? 0 : 1) + (result.meetingApplied ? 1 : 0)
  if (meetingSides > 1 || out.counters.meetings - hero.counters.meetings !== meetingSides || (meetingSides === 1 && result.event?.detail.outcome.variant !== 'meeting')) fail('MEETING', 'one side of one meeting per tick, and the counter follows it')
  const finds = result.spareFound === undefined ? 0 : 1
  if (out.counters.lostPropertyFound - hero.counters.lostPropertyFound !== finds || (finds === 1 && (result.event?.detail.outcome.variant !== 'loot' || result.itemChanges.filter((change) => change.type === 'create' && change.spare === true).length !== 1))) fail('LOST_PROPERTY', 'a found spare is the tick\'s one labelled gear find, and the counter follows it')
  if (result.foundApplied === true && result.event?.detail.outcome.variant !== 'lost_property') fail('LOST_PROPERTY', 'a found notice is the tick\'s event')
  for (const extra of result.extraEvents ?? []) {
    if ((extra.kind !== 'todo' && extra.kind !== 'career' && extra.kind !== 'occasion') || extra.deltas.xpEarned !== 0 || extra.deltas.hp !== 0 || extra.deltas.gold < 0) fail('EXTRA_EVENT', 'to-do and career lines add gold only')
    if (extra.kind === 'occasion' && extra.deltas.gold !== 0) fail('OCCASION_LINE', 'an occasion line changes nothing itself')
    if (extra.kind === 'career' && extra.deltas.gold !== 0) fail('CAREER_GOLD', 'a goal line sets its gold aside for the claim; it pays nothing itself')
    if (codePoints(extra.summary) > input.content.constants.summaryMaxCodePoints) fail('SUMMARY_LENGTH', extra.summary)
  }
  const todoLines = (result.extraEvents ?? []).filter((extra) => extra.kind === 'todo')
  const careerLines = (result.extraEvents ?? []).filter((extra) => extra.kind === 'career')
  if (input.content.todo === undefined && (out.todo !== hero.todo || todoLines.length > 0)) fail('TODO', 'no to-do list without to-do rules')
  const occasionLines = (result.extraEvents ?? []).filter((extra) => extra.kind === 'occasion').length
  if (occasionLines > 1 || out.counters.occasionsSeen - hero.counters.occasionsSeen !== occasionLines) fail('OCCASION_COUNT', 'one announcement per tick and the counter follows it')
  if (input.content.career === undefined && input.content.unlocks === undefined && (out.career !== hero.career || careerLines.length > 0)) fail('CAREER', 'no career lines without a ladder')
  const reached = careerLines.filter((extra) => extra.detail.outcome.variant === 'career' && extra.detail.outcome.phase === 'reached').length
  if (reached > 1 || out.counters.careerRungs - hero.counters.careerRungs !== reached) fail('CAREER_COUNT', 'one rung pays per tick and the counter follows it')
  const taskGold = todoLines.reduce((sum, extra) => sum + extra.deltas.gold, 0)
  // A task ticked off this tick may already be refilled by the stand-up, so count the lines, not the list.
  const ticked = todoLines.reduce((sum, extra) => sum + (extra.detail.outcome.variant === 'todo' && extra.detail.outcome.phase === 'done' ? extra.detail.outcome.tasks.length : 0), 0)
  if (out.counters.tasksCompleted - hero.counters.tasksCompleted !== ticked) fail('TODO_COUNT', 'tasks completed must match the tasks ticked off this tick')
  if (taskGold < 0) fail('TODO_GOLD', 'task rewards cannot take gold')
  // D163: one standoff, on the hero's floor, only while it can fight, and a fall counted once.
  const standoff = out.standoff
  if (standoff !== undefined && (out.status === 'dead' || out.status === 'travelling' || out.status === 'sleeping' || input.content.standoff === undefined)) fail('STANDOFF', 'a standoff needs a hero who can fight it under a catalog with the rule')
  if ((out.counters.standoffsWon ?? 0) - (hero.counters.standoffsWon ?? 0) !== result.metrics.standoffWins) fail('STANDOFF_COUNT', 'a fall is counted once and only by a fall')
  if (out.status === 'sleeping' && hero.status !== 'sleeping' && applied.hero.heldItemId === undefined) {
    fail('SLEEP_WITHOUT_FIND', 'inventory sleep requires a held find')
  }
}

