import { weekEndsAt } from '@trmnl-games/engine/calendar'
import { glyphFor } from '../art/marks'
import { qrBase, sceneBase } from '../art/route'
import { SCENE_ITEMS, type SceneBed, type SceneItem } from '../art/scene'
import { conditionsAt, currentGoal, goalLine, goalWaiting, kindOf, stageOf } from '../sim'
import type { LittlePlotCatalog, PlotState, Weather } from '../sim/types'

/**
 * Little Plot device payload v1 (little-plot.md "Device"). Pure: the backend passes stored facts in, and every layout
 * reads the same flat fields. Required stats are always present; optional ones are null, never zero by accident.
 */
export const PAYLOAD_VERSION = 1
/** Two missed Little Plot ticks before the device says updates are delayed. */
export const STALE_AFTER_MS = 30 * 60 * 1000
/** Stories sent to the device; each layout shows as many as fit. */
export const MAX_STORIES = 16
/** The recap covers the last twelve hours of stories. */
export const RECAP_MS = 12 * 3_600_000
/** Stories the backend reads for the device and the recap. */
export const MAX_DEVICE_LOGS = 48

export interface PayloadStory {
  readonly kind: string
  readonly summary: string
  readonly at: number
  readonly effect?: string | null
  readonly kindId?: string | null
  /** An achievement's name, so several earned on one tick can share a line. */
  readonly title?: string
}

export interface PayloadBoard {
  readonly top: ReadonlyArray<{ readonly rank: number; readonly name: string; readonly level: number; readonly own: boolean }>
  readonly own: { readonly rank: number; readonly total: number } | null
}

export interface LittlePlotPayloadInput {
  readonly content: LittlePlotCatalog
  readonly now: number
  readonly world: { readonly createdAt: number; readonly lastCompletedAt?: number; readonly paused: boolean; readonly currentTick: number } | null
  readonly plot: {
    readonly alias: string
    readonly state: PlotState
    readonly activationState: 'pending_trmnl' | 'active'
    readonly quarantined: boolean
    /** The newest pressed flower hangs in the shed window. */
    readonly flowers: number
  } | null
  readonly weather: Weather
  readonly utcOffsetSeconds?: number
  readonly stories: readonly PayloadStory[]
  readonly board: PayloadBoard | null
  readonly artBaseUrl: string | null
}

/** Within one tick, the ripenings lead, then crosses and visits, then stages, then what it earned. */
const STORY_RANK: Readonly<Record<string, number>> = { ripe: 0, cross: 1, visit: 1, pest: 1, frost: 1, seeded: 2, stage: 3, level: 4, goal: 4, achievement: 5 }
/** Lines the device never shows: the player's own actions are seen in the companion. */
const HIDDEN = new Set(['sow', 'water', 'shop', 'harvest', 'cutting', 'deterred'])

/** The stories as the device lists them (newest first): a tick's lines ordered by what matters, achievements shared on one line. */
export function deviceStories(stories: readonly PayloadStory[]): PayloadStory[] {
  const shown = stories.filter((s) => !HIDDEN.has(s.kind))
  const out: PayloadStory[] = []
  for (let start = 0; start < shown.length; ) {
    let end = start
    while (end < shown.length && shown[end]!.at === shown[start]!.at) end += 1
    const group = shown
      .slice(start, end)
      .map((story, index) => ({ story, index }))
      .sort((a, b) => (STORY_RANK[a.story.kind] ?? 5) - (STORY_RANK[b.story.kind] ?? 5) || a.index - b.index)
      .map(({ story }) => story)
    const earned = group.filter((story) => story.kind === 'achievement')
    for (const story of group) {
      if (story.kind !== 'achievement') out.push(story)
      else if (story === earned[0]) {
        const names = earned.map((a) => a.title ?? a.summary.replace(/^Achievement: /, '').replace(/\.$/, ''))
        out.push(earned.length === 1 ? story : { kind: 'achievement', at: story.at, summary: `${earned.length} achievements: ${names.join(', ')}` })
      }
    }
    start = end
  }
  return out
}

const SEASON_NAME = { spring: 'Spring', summer: 'Summer', autumn: 'Autumn', winter: 'Winter' } as const
const BAND_WORD = { dawn: 'dawn', day: 'day', dusk: 'dusk', night: 'night' } as const
const WEATHER_WORD = { clear: 'clear', overcast: 'overcast', rain: 'rain', fog: 'fog' } as const
const DAY_NAMES = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday']

/** The scene key for a plot: each bed at its stage, the drawable items, a gnome on the tick it came. */
export function sceneKeyFor(state: PlotState, content: LittlePlotCatalog, band: 'dawn' | 'day' | 'dusk' | 'night', weather: Weather, season: 'spring' | 'summer' | 'autumn' | 'winter', gnome: boolean, flower: boolean) {
  const beds: SceneBed[] = state.beds.map((b) => {
    if (b.kindId === undefined) return { stage: 'empty' as const, group: null, crossed: false, greenhouse: b.greenhouse === true }
    const kind = kindOf(content, b.kindId)
    return { stage: stageOf(b, kind), group: kind.group, crossed: b.crossedKindId !== undefined, greenhouse: b.greenhouse === true }
  })
  const items = SCENE_ITEMS.filter((i): i is SceneItem => state.items.includes(i))
  return { band, weather, season, rows: state.rows, cols: state.cols, beds, items, gnome, flower }
}

export function buildPayload(input: LittlePlotPayloadInput) {
  const { content, now, world, plot } = input
  const stale = world !== null && now - (world.lastCompletedAt ?? world.createdAt) > STALE_AFTER_MS
  const servicePaused = world?.paused ?? false
  const conditions = conditionsAt(content, now, input.utcOffsetSeconds, input.weather)
  const seasonLine = `${SEASON_NAME[conditions.season]} until ${DAY_NAMES[new Date(weekEndsAt(now)).getUTCDay()]}`
  const qr = input.artBaseUrl && !servicePaused ? `${input.artBaseUrl}${qrBase('home')}` : ''
  if (plot === null || plot.activationState !== 'active') {
    const state = plot?.state
    const scene = state ? sceneKeyFor(state, content, conditions.band, conditions.weather, conditions.season, false, false) : null
    return {
      v: PAYLOAD_VERSION,
      game: 'little-plot' as const,
      data_state: servicePaused ? ('service_paused' as const) : ('unlinked' as const),
      status: plot === null ? ('unlinked' as const) : ('pending' as const),
      status_label: plot === null ? 'Not set up yet' : 'Waiting for TRMNL Save',
      alias: plot?.alias ?? null,
      attention: servicePaused ? 'Little Plot is down for maintenance.' : 'Sign in to the companion, then save this plugin in TRMNL.',
      attention_kind: servicePaused ? ('service' as const) : ('setup' as const),
      qr: 'home' as const,
      qr_base: qr,
      scene_base: input.artBaseUrl && scene ? `${input.artBaseUrl}${sceneBase(scene)}` : '',
      stories: [] as Array<{ kind: string; glyph: string; summary: string; u: number }>,
      season: conditions.season,
      season_label: seasonLine,
      band: conditions.band,
      weather: conditions.weather,
      stale: false,
    }
  }
  const state = plot.state
  const tick = world?.currentTick ?? 0
  const beds = state.beds.length
  const ripe = state.beds.filter((b) => b.kindId !== undefined && stageOf(b, kindOf(content, b.kindId)) === 'ripe').length
  const halfRipe = ripe >= Math.ceil(beds / 2) && ripe > 0
  const sorted = deviceStories(input.stories)
  const newest = sorted[0]
  const gnomeNow = newest !== undefined && now - newest.at < 20 * 60_000 && (newest.kind === 'visit' || (newest.kind === 'pest' && newest.effect?.startsWith('gnome') === true))
  const scene = sceneKeyFor(state, content, conditions.band, conditions.weather, conditions.season, gnomeNow, plot.flowers > 0)
  const goal = currentGoal(content, state)
  const waiting = goalWaiting(state.goal?.unclaimed)
  let attention: string | null = null
  let attentionKind: 'service' | 'ripe' | 'goal' | 'setup' | null = null
  if (plot.quarantined || servicePaused) [attention, attentionKind] = ['Paused for a service check.', 'service']
  else if (stale) [attention, attentionKind] = ['Updates are delayed.', 'service']
  else if (state.status === 'paused') [attention, attentionKind] = ['The plot is paused.', 'service']
  else if (halfRipe) [attention, attentionKind] = [`${ripe} ${ripe === 1 ? 'bed' : 'beds'} ripe: pick them in the companion.`, 'ripe']
  else if (waiting) [attention, attentionKind] = [waiting.count > 1 ? `${waiting.count} goals reached! Claim ${waiting.coins} coins in the companion.` : `Goal reached! Claim ${waiting.coins} coins in the companion.`, 'goal']
  const stories = sorted.slice(0, MAX_STORIES).map((s) => ({ kind: s.kind, glyph: glyphFor(s.kind, s.effect ?? null), summary: s.summary.replaceAll('[[', '').replaceAll(']]', ''), u: Math.floor(s.at / 1000) }))
  // Twelve-hour recap: ripenings, pests, gnomes seen off and visits.
  const recent = input.stories.filter((s) => now - s.at <= RECAP_MS)
  const ripened = recent.filter((s) => s.kind === 'ripe' && s.kindId).length
  const pests = recent.filter((s) => s.kind === 'pest').length
  const deterred = recent.filter((s) => s.kind === 'deterred').length
  const visits = recent.filter((s) => s.kind === 'visit').length
  const recapItems = ripened + pests + deterred + visits > 0 ? [...(ripened ? [{ k: 'ripe', text: `${ripened} ripened` }] : []), ...(pests ? [{ k: 'pest', text: `${pests} ${pests === 1 ? 'pest' : 'pests'}` }] : []), ...(deterred ? [{ k: 'deterred', text: `${deterred} seen off` }] : []), ...(visits ? [{ k: 'visit', text: `${visits} ${visits === 1 ? 'visit' : 'visits'}` }] : [])] : null
  const statusLabel = state.status === 'paused' ? 'Plot paused' : `${SEASON_NAME[conditions.season]} at the plot, ${BAND_WORD[conditions.band]}, ${WEATHER_WORD[conditions.weather]}`
  const seeds = Object.values(state.tin).reduce((s, n) => s + n, 0)
  return {
    v: PAYLOAD_VERSION,
    game: 'little-plot' as const,
    data_state: plot.quarantined || servicePaused ? ('service_paused' as const) : ('ready' as const),
    status: state.status === 'paused' ? ('paused' as const) : ('growing' as const),
    status_label: statusLabel,
    alias: plot.alias,
    level: state.level,
    gold: state.gold,
    ripe_count: ripe,
    bed_count: beds,
    ripe_label: `${ripe}/${beds}`,
    seed_count: seeds,
    watered: state.wateredUntilTick >= tick,
    water_hours: Math.max(0, Math.ceil((state.wateredUntilTick - tick) / 4)),
    season: conditions.season,
    season_label: seasonLine,
    frost: conditions.frost,
    band: conditions.band,
    weather: conditions.weather,
    goal_line: goal ? goal.title : goalLine(content, state),
    goal_claim: waiting ? { count: waiting.count, coins: waiting.coins } : null,
    attention,
    attention_kind: attentionKind,
    qr: halfRipe ? ('ripe' as const) : ('home' as const),
    qr_base: qr ? `${input.artBaseUrl}${qrBase(halfRipe ? 'ripe' : 'home')}` : '',
    scene_base: input.artBaseUrl ? `${input.artBaseUrl}${sceneBase(scene)}` : '',
    stories,
    recap_items: recapItems,
    board: input.board
      ? {
          label: 'This week',
          rows: input.board.top.map((row) => ({ rank: row.rank, name: row.name, level: row.level, own: row.own })),
          own_label: input.board.own ? `#${input.board.own.rank} of ${input.board.own.total}` : 'Not ranked yet',
          own_listed: input.board.top.some((row) => row.own),
        }
      : null,
    stale,
  }
}

export type LittlePlotPayload = ReturnType<typeof buildPayload>
