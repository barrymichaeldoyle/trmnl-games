import { classPose, type BasePose, type HeroGender, type HeroPose } from './hero'
import { SCENE_VERSION, type SceneTime } from './sceneTime'
import { MEETING_PROPS, type PropId } from './props'

/**
 * Pure mapping from hero state + latest gameplay event to the scene shown on
 * the device (revision 12). The key is part of an immutable image URL.
 */
export type SceneSubject =
  | { kind: 'monster'; id: string; elite: boolean }
  | { kind: 'prop'; id: PropId }
  /** D141: the other hero of a meeting, in its class, with the meeting's prop between them; D149: in its look. */
  | { kind: 'coworker'; heroClass: 'warrior' | 'rogue'; gender?: HeroGender; prop?: PropId }
  | { kind: 'none' }

export interface LatestEvent {
  readonly kind: string
  readonly outcome?: { readonly variant: string; readonly [key: string]: unknown }
  /** An achievement log's name (D65); used by the celebration, never by the scene. */
  readonly title?: string
}

/**
 * P37: the scene in the hero's class's poses; the Warrior's paths are the ones every earlier screen used.
 * D149: and in the hero's look. A meeting or lost-property outcome carries the other hero's look as `rivalGender`,
 * added by the backend when it reads the log (the simulator never sees looks).
 */
export function sceneFor(status: string, hasWake: boolean, latest: LatestEvent | null, heroClass: 'warrior' | 'rogue' = 'warrior', gender: HeroGender = 'male'): { pose: HeroPose; subject: SceneSubject } {
  const scene = baseScene(status, hasWake, latest)
  return { pose: classPose(scene.pose, heroClass, gender), subject: scene.subject }
}

/** D149: the coworker's class and look from a meeting or lost-property outcome. */
const coworkerOf = (outcome: NonNullable<LatestEvent['outcome']>) => ({ heroClass: outcome.rivalClass === 'rogue' ? ('rogue' as const) : ('warrior' as const), ...(outcome.rivalGender === 'female' ? { gender: 'female' as const } : {}) })

function baseScene(status: string, hasWake: boolean, latest: LatestEvent | null): { pose: BasePose; subject: SceneSubject } {
  const outcome = latest?.outcome
  const monster = outcome?.variant === 'combat' ? { kind: 'monster' as const, id: String(outcome.monsterId), elite: outcome.elite === true } : null
  switch (status) {
    case 'dead':
      return { pose: 'knocked_out', subject: monster ?? { kind: 'prop', id: 'trap' } }
    case 'sleeping':
      return hasWake ? { pose: 'walk', subject: { kind: 'prop', id: 'signpost' } } : { pose: 'sleep', subject: { kind: 'prop', id: 'full_bag' } }
    case 'paused':
    case 'resting':
      return { pose: 'rest', subject: { kind: 'prop', id: 'campfire' } }
    case 'travelling':
      return { pose: 'walk', subject: { kind: 'prop', id: 'signpost' } }
  }
  if (latest?.kind === 'levelup') return { pose: 'idle', subject: { kind: 'prop', id: 'level_up' } }
  if (monster) return { pose: 'fight', subject: monster }
  if (outcome?.variant === 'loot') {
    // D145: another player's spare comes out of the lost-property box.
    if (outcome.found === 'gear') return { pose: 'idle', subject: { kind: 'prop', id: outcome.spare === undefined ? 'gear' : 'lost_property' } }
    if (outcome.found === 'potion') return { pose: 'idle', subject: { kind: 'prop', id: 'potion' } }
    return { pose: 'idle', subject: { kind: 'prop', id: outcome.jackpot === true ? 'gold' : 'chest' } }
  }
  if (outcome?.variant === 'trap') return { pose: 'idle', subject: { kind: 'prop', id: 'trap' } }
  if (outcome?.variant === 'rest') return { pose: 'rest', subject: { kind: 'prop', id: 'campfire' } }
  // D110: a raid this hero won shows the gold it came away with; a lost one leaves the desk empty.
  if (outcome?.variant === 'raid') return { pose: 'idle', subject: outcome.won === true ? { kind: 'prop', id: 'gold' } : { kind: 'none' } }
  // D141: a meeting shows the other hero, facing ours across the meeting's prop.
  if (outcome?.variant === 'meeting') {
    const prop = MEETING_PROPS[String(outcome.kindId)]
    return { pose: 'idle', subject: { kind: 'coworker', ...coworkerOf(outcome), ...(prop === undefined ? {} : { prop }) } }
  }
  // D145: the owner is told who found its spare: the finder, beside the lost-property box.
  if (outcome?.variant === 'lost_property') return { pose: 'idle', subject: { kind: 'coworker', ...coworkerOf(outcome), prop: 'lost_property' } }
  return { pose: 'idle', subject: { kind: 'none' } }
}

/** URL path segment for a subject: `monster-<id>`, `elite-<id>`, `prop-<id>`, `coworker-[female_]<class>[-<prop>]` or `none`. */
export function subjectSegment(subject: SceneSubject): string {
  if (subject.kind === 'monster') return `${subject.elite ? 'elite' : 'monster'}-${subject.id}`
  if (subject.kind === 'prop') return `prop-${subject.id}`
  if (subject.kind === 'coworker') return `coworker-${subject.gender === 'female' ? 'female_' : ''}${subject.heroClass}${subject.prop === undefined ? '' : `-${subject.prop}`}`
  return 'none'
}

/** D139 (scene v5): the occasion segment follows the time; `plain` on an ordinary day. */
export const scenePath = (biomeId: string, pose: HeroPose, subject: SceneSubject, scale: number, time: SceneTime = 'day', occasion?: string) =>
  `/art/scene/v${SCENE_VERSION}/${biomeId}/${time}/${occasion ?? 'plain'}/${pose}/${subjectSegment(subject)}/${scale}.png`
