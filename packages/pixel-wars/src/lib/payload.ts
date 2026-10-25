import { keepsakeWeek, weekEndsAt } from '@trmnl-games/engine/calendar'
import { glyphFor } from '../art/marks'
import { fitWindow, type MapSource } from '../art/render'
import { mapPath, qrBase } from '../art/route'
import type { FactionId, FactionShare, PixelWarsCatalog } from '../sim/types'

/**
 * Pixel Wars device payload v1 (pixel-wars.md "Device"). Pure: the backend passes stored facts in, and every layout
 * reads the same flat fields. The map comes as one URL per slot, each a window of the tick's snapshot sized for that
 * slot on that screen, so no image is ever scaled in the browser.
 */
export const PAYLOAD_VERSION = 1
/** Two missed Pixel Wars ticks before the device says updates are delayed. */
export const STALE_AFTER_MS = 30 * 60 * 1000
export const MAX_STORIES = 12
export const MAX_DEVICE_LOGS = 24

export interface PayloadStory {
  readonly kind: string
  readonly summary: string
  readonly at: number
}

export interface PayloadBoard {
  readonly top: ReadonlyArray<{ readonly rank: number; readonly name: string; readonly level: number; readonly own: boolean }>
  readonly own: { readonly rank: number; readonly total: number } | null
}

export interface PayloadMap {
  readonly id: string
  readonly tick: number
  readonly source: MapSource
  readonly shares: readonly FactionShare[]
  /** The shares an hour ago, for the arrows; null when the map is younger than that. */
  readonly sharesBefore: readonly FactionShare[] | null
  readonly lines: readonly string[]
  readonly lastWinner: FactionId | null
}

export interface PixelWarsPayloadInput {
  readonly content: PixelWarsCatalog
  readonly now: number
  readonly world: { readonly createdAt: number; readonly lastCompletedAt?: number; readonly paused: boolean; readonly currentTick: number } | null
  readonly desk: {
    readonly alias: string
    readonly activationState: 'pending_trmnl' | 'active'
    readonly faction: FactionId | 0
    readonly seat: number | null
    readonly cell: { x: number; y: number } | null
    /** The desk cell as it stands: who holds it and how much ink. */
    readonly own: { faction: FactionId | 0; ink: number } | null
    readonly holderName: string | null
    readonly level: number
    readonly well: number
    readonly held: number
    readonly cleared: boolean
    readonly quarantined: boolean
    readonly shielded: boolean
  } | null
  readonly map: PayloadMap | null
  readonly stories: readonly PayloadStory[]
  readonly board: PayloadBoard | null
  readonly artBaseUrl: string | null
}

/**
 * The slots a map image is drawn into, in image pixels (the X draws images at 1.8x, so its slots are the CSS box over
 * 1.8), measured in the framework previews (D125): the OG's full view is 780 wide, its side 365, its portrait half 440
 * and portrait side 205; the X's full view 1836 and side 873.
 */
const SLOTS = {
  full_og: [760, 220],
  full_x: [1000, 500],
  full_portrait_og: [430, 520],
  full_portrait_x: [740, 880],
  half_og: [400, 160],
  half_x: [520, 220],
  half_portrait_og: [430, 150],
  half_portrait_x: [740, 230],
  side_og: [355, 260],
  side_x: [470, 440],
  side_portrait_og: [200, 320],
  side_portrait_x: [370, 560],
  quad_og: [140, 52],
  quad_x: [200, 90],
  quad_portrait_og: [190, 110],
  quad_portrait_x: [240, 170],
} as const
export type SlotKey = keyof typeof SLOTS

const DAY_NAMES = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday']

export function buildPayload(input: PixelWarsPayloadInput) {
  const { content, now, world, desk, map } = input
  const stale = world !== null && now - (world.lastCompletedAt ?? world.createdAt) > STALE_AFTER_MS
  const servicePaused = world?.paused ?? false
  const art = input.artBaseUrl
  const qr = art && !servicePaused ? `${art}${qrBase('home')}` : ''
  const factionName = (f: FactionId | 0) => (f === 0 ? '' : content.factions[f - 1]!.name)
  const factionPattern = (f: FactionId | 0) => (f === 0 ? '' : content.factions[f - 1]!.pattern)
  const bellAt = weekEndsAt(now)
  const hoursToBell = Math.max(0, Math.round((bellAt - now) / 3_600_000))
  const seasonLabel = hoursToBell < 24 ? `Bell in ${hoursToBell} h` : `Bell ${DAY_NAMES[new Date(bellAt).getUTCDay()]} 00:00 UTC`

  const common = {
    v: PAYLOAD_VERSION,
    game: 'pixel-wars' as const,
    season_label: seasonLabel,
    week: keepsakeWeek(now),
    qr_base: qr,
    stale,
  }
  if (desk === null || desk.activationState !== 'active') {
    return {
      ...common,
      data_state: servicePaused ? ('service_paused' as const) : ('unlinked' as const),
      status: desk === null ? ('unlinked' as const) : ('pending' as const),
      status_label: desk === null ? 'Not set up yet' : 'Waiting for TRMNL Save',
      alias: desk?.alias ?? null,
      attention: servicePaused ? 'Pixel Wars is down for maintenance.' : 'Sign in to the companion, then save this plugin in TRMNL.',
      attention_kind: servicePaused ? ('service' as const) : ('setup' as const),
      shares: [] as Array<{ faction: number; name: string; pattern: string; percent: number; change: number; rank: number; own: boolean }>,
      lines: [] as string[],
      stories: [] as Array<{ kind: string; glyph: string; summary: string; u: number }>,
    }
  }

  const shares = (map?.shares ?? content.factions.map((f) => ({ faction: f.id, cells: 0, desks: 0, score: 0, percent: 0, rank: f.id - 1 })))
    .map((s) => ({
      faction: s.faction,
      name: factionName(s.faction),
      pattern: factionPattern(s.faction),
      percent: s.percent,
      change: map?.sharesBefore ? s.percent - (map.sharesBefore.find((b) => b.faction === s.faction)?.percent ?? s.percent) : 0,
      rank: s.rank,
      own: s.faction === desk.faction,
    }))
    .sort((a, b) => a.rank - b.rank)

  const fallen = desk.own !== null && desk.faction !== 0 && desk.own.faction !== desk.faction
  const grounded = fallen && desk.own!.faction === 0
  const unplaced = desk.faction === 0 || desk.seat === null
  let attention: string | null = null
  let attentionKind: 'service' | 'choose' | 'fallen' | 'cleared' | 'bell' | null = null
  if (desk.quarantined || servicePaused) [attention, attentionKind] = ['Paused for a service check.', 'service']
  else if (stale) [attention, attentionKind] = ['Updates are delayed.', 'service']
  else if (unplaced) [attention, attentionKind] = ['Pick a side in the companion to join the map.', 'choose']
  else if (desk.cleared) [attention, attentionKind] = ['Your desk stands empty: it returns when a screen shows the map.', 'cleared']
  else if (grounded) [attention, attentionKind] = ['Your desk has faded to ground. One drop of yours counts three.', 'fallen']
  else if (fallen) [attention, attentionKind] = [`${factionName(desk.own!.faction)} holds your desk. One drop of yours counts three.`, 'fallen']
  else if (hoursToBell <= 1) [attention, attentionKind] = ['The bell is about to ring. The map resets on Monday 00:00 UTC.', 'bell']

  const status = unplaced ? ('choose' as const) : desk.cleared ? ('cleared' as const) : fallen ? ('fallen' as const) : ('playing' as const)
  const deskLabel = unplaced ? 'No side yet' : desk.cleared ? 'Desk empty' : grounded ? 'Desk at ground' : fallen ? `Held by ${factionName(desk.own!.faction)}` : `Your desk ${desk.own?.ink ?? 0}/${content.deskInkCap}`
  const stories = input.stories.slice(0, MAX_STORIES).map((s) => ({ kind: s.kind, glyph: glyphFor(s.kind), summary: s.summary.replaceAll('[[', '').replaceAll(']]', ''), u: Math.floor(s.at / 1000) }))

  const urls: Partial<Record<`map_${SlotKey}`, string>> = {}
  if (art && map && map.source.cols > 0) {
    for (const [key, [w, h]] of Object.entries(SLOTS) as Array<[SlotKey, readonly [number, number]]>) {
      const window = fitWindow(map.source, w, h, desk.cell ?? undefined)
      urls[`map_${key}`] = `${art}${mapPath(map.id, map.tick, window, desk.seat ?? 0)}`
    }
  }

  return {
    ...common,
    data_state: desk.quarantined || servicePaused ? ('service_paused' as const) : ('ready' as const),
    status,
    status_label: unplaced ? 'Choose a side' : `${factionName(desk.faction)} · Level ${desk.level}`,
    alias: desk.alias,
    level: desk.level,
    faction: desk.faction,
    faction_name: factionName(desk.faction),
    faction_pattern: factionPattern(desk.faction),
    desk_label: deskLabel,
    desk_fallen: fallen,
    desk_ink: desk.own?.ink ?? 0,
    desk_ink_cap: content.deskInkCap,
    holder_name: fallen && !grounded ? factionName(desk.own!.faction) : null,
    well: desk.well,
    well_cap: content.wellCap,
    held: desk.held,
    shielded: desk.shielded,
    rosette: map?.lastWinner !== null && map?.lastWinner !== undefined && map.lastWinner === desk.faction,
    attention,
    attention_kind: attentionKind,
    shares,
    lines: (map?.lines ?? []).slice(0, 3),
    stories,
    map_tick: map?.tick ?? 0,
    map_cells: map ? map.source.cols * map.source.rows : 0,
    map_desks: map?.shares.reduce((s, r) => s + r.desks, 0) ?? 0,
    ...urls,
    board: input.board
      ? {
          label: 'This week',
          rows: input.board.top.map((row) => ({ rank: row.rank, name: row.name, level: row.level, own: row.own })),
          own_label: input.board.own ? `#${input.board.own.rank} of ${input.board.own.total}` : 'Not ranked yet',
          own_listed: input.board.top.some((row) => row.own),
        }
      : null,
  }
}

export type PixelWarsPayload = ReturnType<typeof buildPayload>
