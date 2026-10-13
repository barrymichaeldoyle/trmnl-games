import { occasionForTick } from './occasions'
import type { LogDetail, SimulationInput, SimulationResult, TickEvent } from './types'

/**
 * The occasion's announcement (D139): the hero's first evaluation inside an occurrence logs one line naming it and
 * counts it, after the tick's story and any to-do or career lines. A paused hero gets nothing and catches nothing up;
 * a dead, sleeping or travelling hero still gets the line, so the device says why the scene changed. No draw: the
 * line is picked by tick, so the encounter and its streams are exactly what the same tick without occasions gives.
 */
export function applyOccasion(input: SimulationInput, result: SimulationResult): SimulationResult {
  const { content, tick } = input
  const live = occasionForTick(content, tick, input.tickAt, input.utcOffsetSeconds)
  if (live === undefined || result.disposition === 'paused' || input.hero.occasion?.key === live.key) return result
  const hero = result.nextHero
  // A gift found this very tick keeps its mark.
  const gifted = hero.occasion?.key === live.key && hero.occasion.gifted === true
  const nextHero = { ...hero, occasion: { key: live.key, ...(gifted ? { gifted: true as const } : {}) }, counters: { ...hero.counters, occasionsSeen: hero.counters.occasionsSeen + 1 } }
  const detail: LogDetail = {
    v: 1,
    simulationVersion: input.simulationVersion,
    contentVersion: content.contentVersion,
    disposition: result.disposition,
    potionsUsed: 0,
    levelsGained: 0,
    goldPenalty: 0,
    heldFind: false,
    outcome: { variant: 'occasion', occasionId: live.rule.id, key: live.key },
  }
  const line: TickEvent = { kind: 'occasion', summary: live.rule.lines[tick % live.rule.lines.length]!, detail, deltas: { xpEarned: 0, gold: 0, hp: 0 } }
  return { ...result, nextHero, extraEvents: [...(result.extraEvents ?? []), line] }
}
