import { portraitBase, portraitKey, qrBase as qrPath } from './art/route'
import type { Glyph, LifeState, PaperLivesCatalog, StatId } from './sim/types'

/**
 * Paper Lives device payload v1 (paper-lives.md "Device"): the flat merge variables the screen templates read.
 * Pure; the backend gathers the life, its newest story lines and the device board. Times go out as epoch seconds and
 * the template formats them with the D42 `utc_offset` rule. The status line never uses pronouns.
 */
export const PAYLOAD_VERSION = 1
export const STALE_AFTER_MS = 30 * 60 * 1000
/** Story lines on the full layout. */
export const MAX_LINES = 6
/** Log rows the backend reads for the device. */
export const MAX_DEVICE_LOGS = 24

export interface PayloadStory {
  readonly kind: string
  readonly glyph: Glyph
  readonly age: number
  readonly summary: string
  readonly at: number
  readonly ordinal: number
}

export interface PayloadBoard {
  readonly top: ReadonlyArray<{ readonly rank: number; readonly name: string; readonly life: string; readonly age: number; readonly own: boolean }>
  readonly own: { readonly rank: number | null; readonly age: number } | null
}

export interface PaperLivesPayloadInput {
  readonly content: PaperLivesCatalog
  readonly now: number
  readonly world: { readonly createdAt: number; readonly lastCompletedAt?: number; readonly paused: boolean } | null
  readonly life: {
    readonly state: LifeState
    readonly activationState: 'pending_trmnl' | 'active'
    readonly quarantined: boolean
    readonly ordinal: number
    /** When the year closes by itself and when its minimum passes, epoch ms. */
    readonly closesAt: number
    readonly minimumAt: number
  } | null
  readonly stories: readonly PayloadStory[]
  readonly board: PayloadBoard | null
  /** For the QR and portrait art (L3). */
  readonly artBaseUrl: string | null
}

/** Device lines: story lines and quiet lines of the current life, newest first; prompts, recaps and command lines are shown elsewhere. */
const SHOWN = new Set(['event', 'ambient', 'decision_resolved', 'check', 'stage', 'death', 'infant', 'system'])

const ORDINALS = ['First', 'Second', 'Third', 'Fourth', 'Fifth', 'Sixth', 'Seventh', 'Eighth', 'Ninth', 'Tenth', 'Eleventh', 'Twelfth']

/** "Third of the Okafors". */
export function generationLabel(generation: number, surname: string): string {
  const nth = ORDINALS[generation - 1] ?? `${generation}th`
  const plural = /(s|x|z|ch|sh)$/i.test(surname) ? `${surname}es` : `${surname}s`
  return `${nth} of the ${plural}`
}

/** "nurse, renting": the job or the stage of life, then the home. */
export function statusDetail(life: LifeState, content: PaperLivesCatalog): string {
  const job = life.job ? content.jobs.find((j) => j.id === life.job)?.name.toLowerCase() : undefined
  const role = job ?? (life.retired ? 'retired' : life.stage === 'infant' ? 'little' : life.stage === 'child' || life.stage === 'teen' ? 'at school' : life.education === 'university' ? 'studying' : 'between jobs')
  const home = life.home === 'family' ? 'at home' : life.home
  return `${role}, ${home}`
}

/** "Maud Okafor, 34, nurse, renting": name, age, the job or the stage of life, the home. */
export function statusLine(life: LifeState, content: PaperLivesCatalog): string {
  return `${life.first} ${life.last}, ${life.age}, ${statusDetail(life, content)}`
}

export function buildPayload(input: PaperLivesPayloadInput) {
  const { content, now, world, life } = input
  const servicePaused = world?.paused ?? false
  const stale = world !== null && now - (world.lastCompletedAt ?? world.createdAt) > STALE_AFTER_MS
  const qrBase = input.artBaseUrl && !servicePaused ? `${input.artBaseUrl}${qrPath()}` : ''
  if (life === null || life.activationState !== 'active') {
    return {
      v: PAYLOAD_VERSION,
      game: 'paper-lives' as const,
      data_state: servicePaused ? ('service_paused' as const) : ('unlinked' as const),
      status: life === null ? ('unlinked' as const) : ('pending' as const),
      status_label: life === null ? 'Not set up yet' : 'Waiting for TRMNL Save',
      name: life ? `${life.state.first} ${life.state.last}` : null,
      attention: servicePaused ? 'Paper Lives is down for maintenance.' : 'Sign in to the companion, then save this plugin in TRMNL.',
      lines: [] as Array<{ age: number; glyph: Glyph; summary: string }>,
      qr_base: qrBase,
      stale: false,
    }
  }
  const state = life.state
  const ended = state.status === 'ended'
  const lines = input.stories
    .filter((s) => s.ordinal === life.ordinal && SHOWN.has(s.kind))
    .slice(0, MAX_LINES)
    .map((s) => ({ age: s.age, glyph: s.glyph, summary: s.summary }))
  const pending = state.year.pending
  const def = pending ? content.decisions.find((d) => d.id === pending.decisionId) : undefined
  const offered = pending ? input.stories.find((s) => s.ordinal === life.ordinal && s.kind === 'decision_offered') : undefined
  let attention: string | null = null
  if (life.quarantined || servicePaused) attention = 'Paused for a service check.'
  else if (stale) attention = 'Updates are delayed.'
  const traits = state.traits.map((id) => content.traits.find((t) => t.id === id)?.name ?? id)
  const status = ended ? ('ended' as const) : state.status === 'paused' ? ('paused' as const) : ('living' as const)
  const statRow = (k: StatId, label: string) => ({ k, label, value: state.stats[k], halves: Math.round(state.stats[k] / 10) })
  return {
    v: PAYLOAD_VERSION,
    game: 'paper-lives' as const,
    data_state: life.quarantined || servicePaused ? ('service_paused' as const) : ('ready' as const),
    status,
    status_label: ended ? 'A life remembered' : state.status === 'paused' ? 'Life paused' : statusLine(state, content),
    // Beside the name and age, the rest of the status line.
    status_detail: ended ? 'A life remembered' : state.status === 'paused' ? 'Life paused' : statusDetail(state, content),
    name: `${state.first} ${state.last}`,
    age: state.age,
    stage: state.stage,
    generation: state.generation,
    generation_label: generationLabel(state.generation, state.last),
    traits,
    traits_label: traits.join(' · '),
    stats: { health: state.stats.health, happiness: state.stats.happiness, smarts: state.stats.smarts, charm: state.stats.charm },
    // Five ticks a stat, filled in half steps (ten halves for 100).
    stat_rows: [statRow('health', 'Health'), statRow('happiness', 'Happiness'), statRow('smarts', 'Smarts'), statRow('charm', 'Charm')],
    money: state.gold,
    money_label: state.gold.toLocaleString('en-GB'),
    portrait_base: input.artBaseUrl ? `${input.artBaseUrl}${portraitBase(portraitKey(state))}` : '',
    lines,
    recap: state.recap ?? null,
    // The year's decision: the prompt on the device, taken in the companion. Major decisions are marked.
    decision: !ended && def && offered ? { age: state.age, prompt: offered.summary, major: def.major } : null,
    // When the year closes by itself; shown when there is no decision to prompt.
    closes_at: ended || state.stage === 'infant' ? null : Math.floor(life.closesAt / 1000),
    year_end: !ended && state.year.elapsed > content.tuning.minYearTicks,
    memorial: ended
      ? {
          age: state.age,
          line: state.death?.line ?? null,
          epitaph: state.death?.epitaph ?? null,
          prompt: 'Start the next life in the companion',
        }
      : null,
    board: input.board
      ? {
          label: 'Longest this week',
          rows: input.board.top.map((row) => ({ rank: row.rank, name: row.name, life: row.life, age: row.age, own: row.own })),
          own_label: input.board.own ? (input.board.own.rank === null ? `Your best ${input.board.own.age}` : `#${input.board.own.rank}, ${input.board.own.age} years`) : 'No finished life this week',
          own_listed: input.board.top.some((row) => row.own),
        }
      : null,
    attention,
    qr_base: qrBase,
    stale,
  }
}

export type PaperLivesPayload = ReturnType<typeof buildPayload>
