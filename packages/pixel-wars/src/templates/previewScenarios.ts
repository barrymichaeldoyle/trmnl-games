import { contentV1 } from '../content'
import type { PayloadStory, PixelWarsPayloadInput } from '../lib/payload'
import { emptyMap, placeSeat, resolve, shares, type FactionId, type MapState, type Order } from '../sim'

/**
 * Every device state through the real payload builder (pixel-wars.md "Device", W3): a young map, a big map, a desk
 * that fell, a shielded night, the bell hour, a desk without a side, a cleared desk, a service pause, a pending desk and
 * a brand new one. The maps are built by the real core from scripted orders, so the previews show real fades and flips.
 */
/** Monday 2026-10-19 10:10 UTC. */
export const NOW = Date.UTC(2026, 9, 19, 10, 10)
const HOUR = 3_600_000
const content = contentV1

const story = (kind: string, summary: string, minutesAgo: number): PayloadStory => ({ kind, summary, at: NOW - minutesAgo * 60_000 })

const STORIES: PayloadStory[] = [
  story('flips', 'Took 3 cells, painted 2, lost 1.', 5),
  story('recovered', 'Your desk is yours again.', 65),
  story('fell', 'Your desk fell to Hatch. One drop of yours counts three on your own desk.', 185),
  story('refund', '2 drops returned: the target changed before the tick.', 245),
  story('goal', 'Goal reached: Take a cell from another faction. 25 XP.', 300),
  story('level', 'Level 3.', 300),
  story('achievement', 'Achievement: First Blood', 300),
  story('taken', 'You took a desk.', 420),
  story('bell', 'Ink won the week. 50 XP for everyone who placed an order.', 600),
  story('faction', 'You chose Ink.', 720),
]
const LONG_STORIES: PayloadStory[] = Array.from({ length: 12 }, (_, i) => story(i % 2 ? 'fell' : 'flips', 'Your desk fell to Weave after a long night of strikes from three directions, and the ring around it is theirs now too.', 10 + i * 30))

const BOARD = {
  top: [
    { rank: 1, name: 'Ana', level: 7, own: false },
    { rank: 2, name: 'Mo', level: 6, own: true },
    { rank: 3, name: 'Kit', level: 6, own: false },
    { rank: 4, name: 'Jo', level: 5, own: false },
    { rank: 5, name: 'Rae', level: 5, own: false },
  ],
  own: { rank: 2, total: 41 },
}

/** A map of `n` desks in a 40/30/20/10 split, fought over for `ticks` ticks by a simple scripted hand. */
export function scriptedMap(n: number, ticks: number): MapState {
  let map = emptyMap()
  for (let i = 0; i < n; i += 1) {
    const faction: FactionId = i < n * 0.4 ? 1 : i < n * 0.7 ? 2 : i < n * 0.9 ? 3 : 4
    const placed = placeSeat(map, content, faction, i > 0 && i % 3 === 0 ? i : undefined)
    if (!placed) break
    map = placed.map
  }
  for (let tick = 1; tick <= ticks; tick += 1) {
    const orders: Order[] = []
    map.seats.forEach((s, k) => {
      if ((tick + k) % 7 !== 0 || s.faction === 0) return
      const dirs = [[1, 0], [0, 1], [-1, 0], [0, -1], [1, 1], [2, 0], [0, 2]] as const
      for (const [dx, dy] of dirs) orders.push({ seat: k + 1, x: s.x + dx, y: s.y + dy, kind: 'paint', drops: 1 + ((tick + k) % 3) })
      for (const [dx, dy] of dirs) orders.push({ seat: k + 1, x: s.x + dx, y: s.y + dy, kind: 'strike', drops: 1 + ((tick + k) % 4) })
    })
    map = resolve({ map, orders, tick, content, shielded: new Set() }).map
  }
  return map
}

type Scenario = PixelWarsPayloadInput

export function previewScenarios(artBaseUrl: string | null): Record<string, Scenario> {
  const world = { createdAt: NOW - 400 * HOUR, lastCompletedAt: NOW - 60_000, paused: false, currentTick: 1600 }
  const small = scriptedMap(9, 60)
  const medium = scriptedMap(60, 200)
  const large = scriptedMap(441, 300)
  const payloadMap = (map: MapState, id: string, lines: string[], lastWinner: FactionId | null = 1) => {
    const now = shares(map, content)
    const before = now.map((s) => ({ ...s, percent: Math.max(0, s.percent + ((s.faction * 7) % 5) - 2) }))
    return { id, tick: world.currentTick, source: { x0: map.x0, y0: map.y0, cols: map.cols, rows: map.rows, cells: map.cells }, shares: now, sharesBefore: before, lines, lastWinner }
  }
  const deskOn = (map: MapState, seat: number, extra: Partial<NonNullable<Scenario['desk']>> = {}): NonNullable<Scenario['desk']> => {
    const s = map.seats[seat - 1]!
    const i = (s.y - map.y0) * map.cols + (s.x - map.x0)
    const byte = map.cells[i]!
    return { alias: 'Mo', activationState: 'active', faction: s.faction as FactionId, seat, cell: { x: s.x, y: s.y }, own: { faction: (byte & 7) as FactionId | 0, ink: (byte >> 3) & 7 }, holderName: null, level: 6, well: 31, held: 14, cleared: false, quarantined: false, shielded: false, ...extra }
  }
  const lines = ["Wren's desk fell to Hatch.", 'Dots took 14 cells from Ink.', "9 of Weave's cells faded to nothing."]
  const active = (map: MapState, id: string, desk: NonNullable<Scenario['desk']>, extra: Partial<Scenario> = {}): Scenario => ({
    content,
    now: NOW,
    world,
    desk,
    map: payloadMap(map, id, lines),
    stories: STORIES,
    board: BOARD,
    artBaseUrl,
    ...extra,
  })
  /** The first seat whose desk stands in its own faction's hands, for the scenarios that are not about a fallen desk. */
  const heldSeat = (map: MapState, from = 1): number => {
    for (let k = from - 1; k < map.seats.length; k += 1) {
      const s = map.seats[k]!
      const byte = map.cells[(s.y - map.y0) * map.cols + (s.x - map.x0)]!
      if ((byte & 7) === s.faction && s.faction !== 0) return k + 1
    }
    return from
  }
  const fallenSeat = (() => {
    for (let k = 0; k < medium.seats.length; k += 1) {
      const s = medium.seats[k]!
      const byte = medium.cells[(s.y - medium.y0) * medium.cols + (s.x - medium.x0)]!
      if ((byte & 7) !== s.faction) return k + 1
    }
    return 1
  })()
  return {
    young: active(small, 'young', deskOn(small, heldSeat(small, 1))),
    playing: active(medium, 'medium', deskOn(medium, heldSeat(medium, 2))),
    big: active(large, 'large', deskOn(large, heldSeat(large, 200), { held: 3 })),
    fallen: active(medium, 'medium', deskOn(medium, fallenSeat, { holderName: 'Hatch' })),
    shielded: active(medium, 'medium', deskOn(medium, heldSeat(medium, 5), { shielded: true }), { now: Date.UTC(2026, 9, 19, 23, 10), world: { ...world, lastCompletedAt: Date.UTC(2026, 9, 19, 23, 9) }, stories: STORIES.slice(0, 4) }),
    bell: active(medium, 'medium', deskOn(medium, heldSeat(medium, 3)), { now: Date.UTC(2026, 9, 25, 23, 20), world: { ...world, lastCompletedAt: Date.UTC(2026, 9, 25, 23, 19) }, map: { ...payloadMap(medium, 'medium', ['The bell rings at midnight UTC.']), sharesBefore: null } }),
    choose: active(medium, 'medium', { alias: 'Mo', activationState: 'active', faction: 0, seat: null, cell: null, own: null, holderName: null, level: 1, well: 48, held: 0, cleared: false, quarantined: false, shielded: false }, { stories: [], board: null }),
    cleared: active(medium, 'medium', deskOn(medium, heldSeat(medium, 4), { cleared: true, own: { faction: 0, ink: 0 } }), { stories: STORIES.slice(0, 3) }),
    long: active(medium, 'medium', { ...deskOn(medium, heldSeat(medium, 6)), alias: 'Quillfeather_Longname' }, { stories: LONG_STORIES }),
    service: active(medium, 'medium', deskOn(medium, heldSeat(medium, 2)), { world: { ...world, paused: true } }),
    pending: { content, now: NOW, world, desk: { alias: 'Mo', activationState: 'pending_trmnl', faction: 0, seat: null, cell: null, own: null, holderName: null, level: 1, well: 48, held: 0, cleared: false, quarantined: false, shielded: false }, map: null, stories: [], board: null, artBaseUrl },
    unlinked: { content, now: NOW, world, desk: null, map: null, stories: [], board: null, artBaseUrl },
  }
}
