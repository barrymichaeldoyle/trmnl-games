import { describe, expect, it } from 'vitest'
import { contentV1 } from '@trmnl-games/pixel-wars/content'
import { validateContent } from '@trmnl-games/pixel-wars/content/validate'
import { ACHIEVEMENTS, allSatisfied, familyProgress, newlyUnlocked } from '@trmnl-games/pixel-wars/content/achievements'
import {
  cellAt,
  cellsFromHex,
  cellsToHex,
  decodePainters,
  emptyMap,
  encodePainters,
  evaluateGoals,
  extremes,
  heldBy,
  indexOf,
  localHour,
  nextSeatPlace,
  openFactions,
  paintClean,
  placeSeat,
  refuseReason,
  resolve,
  shares,
  shieldedHour,
  spiralIndex,
  spiralPoint,
  wellAt,
  xpFor,
  zeroCounters,
  type FactionId,
  type MapState,
  type Order,
} from '@trmnl-games/pixel-wars/sim'

const content = contentV1
const none = new Set<number>()

/** A map with desks placed in order, each in the given faction. */
function mapWith(factions: FactionId[], invites: Record<number, number> = {}): MapState {
  let map = emptyMap()
  factions.forEach((f, i) => {
    const placed = placeSeat(map, content, f, invites[i + 1])
    if (!placed) throw new Error('map full')
    map = placed.map
  })
  return map
}

const tick = (map: MapState, orders: Order[], t = 1, shielded = none) => resolve({ map, orders, tick: t, content, shielded })

describe('content v1', () => {
  it('passes its own checks and the achievement catalog is unique', () => {
    expect(validateContent(content)).toEqual([])
    expect(new Set(ACHIEVEMENTS.map((a) => a.id)).size).toBe(ACHIEVEMENTS.length)
  })
})

describe('the lattice', () => {
  it('spirals out from the centre and inverts', () => {
    expect(spiralPoint(0)).toEqual({ u: 0, v: 0 })
    const seen = new Set<string>()
    for (let n = 0; n < 200; n += 1) {
      const p = spiralPoint(n)
      expect(spiralIndex(p.u, p.v)).toBe(n)
      seen.add(`${p.u},${p.v}`)
      // Ring r is filled before ring r+1 starts.
      expect(Math.max(Math.abs(p.u), Math.abs(p.v))).toBe(Math.ceil((Math.sqrt(n + 1) - 1) / 2))
    }
    expect(seen.size).toBe(200)
  })

  it('places the first desk at the origin inside a 3 by 3 window and grows a ring at a time', () => {
    const one = mapWith([1])
    expect([one.x0, one.y0, one.cols, one.rows]).toEqual([-1, -1, 3, 3])
    expect(cellAt(one, 0, 0)).toEqual({ faction: 1, ink: content.deskInkCap, desk: true, painter: 1 })
    const nine = mapWith([1, 2, 3, 4, 1, 2, 3, 4, 1])
    expect([nine.cols, nine.rows]).toEqual([9, 9])
    expect(nine.seats.every((s) => s.x % 3 === 0 && s.y % 3 === 0)).toBe(true)
    // Growth keeps every cell where it was.
    expect(cellAt(nine, 0, 0)?.painter).toBe(1)
  })

  it('places an invited desk beside the inviter, never on a taken point', () => {
    const map = mapWith([1, 2, 3, 4, 1], { 2: 1, 3: 1, 4: 1, 5: 1 })
    const [a, b, c, d, e] = map.seats
    for (const s of [b!, c!, d!, e!]) expect(Math.max(Math.abs(s.x - a!.x), Math.abs(s.y - a!.y))).toBe(3)
    expect(new Set(map.seats.map((s) => `${s.x},${s.y}`)).size).toBe(5)
    expect(map.seats.filter((s) => s.faction === 1).length).toBe(2)
  })

  it('refuses a desk when the lattice is full', () => {
    const small = { ...content, maxSide: 11 }
    let map = emptyMap()
    let placed = 0
    for (;;) {
      const next = placeSeat(map, small, 1)
      if (!next) break
      map = next.map
      placed += 1
    }
    expect(placed).toBe(9)
    expect(nextSeatPlace(map, small)).toBeNull()
    expect(map.cols).toBeLessThanOrEqual(small.maxSide)
  })

  it('offers the smallest faction first and closes a full one', () => {
    const map = mapWith([1, 1, 1, 1, 1, 2, 2, 3, 4, 4])
    const open = openFactions(map, content)
    expect(open.find((o) => o.faction === 1)).toMatchObject({ open: false, desks: 5 })
    expect(open.find((o) => o.faction === 3)).toMatchObject({ open: true, smallest: true })
    expect(openFactions(emptyMap(), content).every((o) => o.open)).toBe(true)
  })
})

describe('orders', () => {
  // Two desks: seat 1 (Ink) at 0,0 and seat 2 (Hatch) at 3,0; ground between at 1,0 and 2,0.
  const two = () => mapWith([1, 2], { 2: 1 })

  it('paints adjacent ground, refuses ground out of reach, and stamps its own cells', () => {
    const map = two()
    expect(map.seats[1]).toMatchObject({ x: 3, y: 0 })
    const r = tick(map, [
      { seat: 1, x: 1, y: 0, kind: 'paint', drops: 2 },
      { seat: 1, x: 2, y: 0, kind: 'paint', drops: 1 },
    ])
    expect(cellAt(r.map, 1, 0)).toMatchObject({ faction: 1, ink: 2, painter: 1 })
    expect(cellAt(r.map, 2, 0)?.faction).toBe(0)
    expect(r.refused).toEqual([expect.objectContaining({ seat: 1, reason: 'not_adjacent' })])
    expect(r.seats.get(1)).toMatchObject({ painted: 1, refunded: 1 })
    const s = tick(r.map, [{ seat: 1, x: 1, y: 0, kind: 'stamp', drops: 5 }], 2)
    expect(cellAt(s.map, 1, 0)?.ink).toBe(content.cellInkCap)
    expect(s.seats.get(1)?.stamped).toBe(5)
  })

  it('a strike is absorbed by the ink, then flips with the surplus, and two attackers tying leave ground', () => {
    let map = tick(two(), [{ seat: 2, x: 2, y: 0, kind: 'paint', drops: 3 }]).map
    const painted = map
    map = tick(map, [{ seat: 1, x: 1, y: 0, kind: 'paint', drops: 3 }], 2).map
    // Hatch strikes Ink's cell at 1,0 (ink 3) with 2: weakened to 1.
    let r = tick(map, [{ seat: 2, x: 1, y: 0, kind: 'strike', drops: 2 }], 3)
    expect(cellAt(r.map, 1, 0)).toMatchObject({ faction: 1, ink: 1 })
    // With 4: flips at ink 3 (surplus 3, capped).
    r = tick(map, [{ seat: 2, x: 1, y: 0, kind: 'strike', drops: 6 }], 3)
    expect(cellAt(r.map, 1, 0)).toMatchObject({ faction: 2, ink: 3, painter: 2 })
    expect(r.seats.get(2)?.flipped).toBe(1)
    expect(r.seats.get(1)?.lost).toBe(1)
    expect(r.events).toContainEqual({ kind: 'transfer', from: 1, to: 2, cells: 1 })
    // Two factions painting the same ground with equal drops: nobody has it. (1,0 sits between Ink's desk and Hatch's cell at 2,0.)
    const g = tick(painted, [
      { seat: 1, x: 1, y: 0, kind: 'paint', drops: 2 },
      { seat: 2, x: 1, y: 0, kind: 'paint', drops: 2 },
    ], 3)
    expect(cellAt(g.map, 1, 0)?.faction).toBe(0)
    expect(g.events).toContainEqual({ kind: 'contested', cells: 1 })
  })

  it('takes a desk, tells the owner, and the owner liberates it at triple strength without adjacency', () => {
    const map = two()
    // Hatch paints up to Ink's desk then strikes it: desk ink 5 needs 6 drops.
    let m = tick(map, [{ seat: 2, x: 2, y: 0, kind: 'paint', drops: 1 }]).map
    m = tick(m, [{ seat: 2, x: 1, y: 0, kind: 'paint', drops: 1 }], 2).map
    const taken = tick(m, [{ seat: 2, x: 0, y: 0, kind: 'strike', drops: 7 }], 3)
    // Hatch is the larger faction here, so it claims the smaller's desk at ink 1 whatever the surplus.
    expect(cellAt(taken.map, 0, 0)).toMatchObject({ faction: 2, desk: true, ink: 1 })
    expect(taken.seats.get(2)?.desksTaken).toBe(1)
    expect(taken.seats.get(1)?.fell).toBe(2)
    expect(taken.events).toContainEqual({ kind: 'deskFell', seat: 1, by: 2, faction: 2 })
    // Ink has no cells left anywhere, yet one drop (×3) beats ink 2 and the desk comes home.
    const home = tick(taken.map, [{ seat: 1, x: 0, y: 0, kind: 'liberate', drops: 1 }], 4)
    expect(cellAt(home.map, 0, 0)).toMatchObject({ faction: 1, desk: true, ink: 2 })
    expect(home.seats.get(1)).toMatchObject({ liberated: 1, recovered: true })
    expect(home.events).toContainEqual({ kind: 'deskRecovered', seat: 1, by: 1 })
    expect(refuseReason(home.map, { seat: 1, x: 0, y: 0, kind: 'liberate', drops: 1 }, content, none)).toBe('own_desk_held')
  })

  it('refuses a strike on a shielded desk and refunds it, but not on ground or on a desk already lost', () => {
    const map = two()
    let m = tick(map, [{ seat: 2, x: 2, y: 0, kind: 'paint', drops: 1 }]).map
    m = tick(m, [{ seat: 2, x: 1, y: 0, kind: 'paint', drops: 1 }], 2).map
    const r = tick(m, [{ seat: 2, x: 0, y: 0, kind: 'strike', drops: 7 }], 3, new Set([1]))
    expect(r.refused[0]?.reason).toBe('shielded')
    expect(cellAt(r.map, 0, 0)?.faction).toBe(1)
    expect(r.seats.get(2)?.refunded).toBe(7)
    expect(shieldedHour(content, 23)).toBe(true)
    expect(shieldedHour(content, 6)).toBe(true)
    expect(shieldedHour(content, 7)).toBe(false)
    expect(localHour(Date.UTC(2026, 9, 19, 22), 3600)).toBe(23)
  })

  it('doubles the smallest faction against the largest, and the largest claims the smallest’s cells at ink 1', () => {
    // Ink holds many cells; Weave has one desk.
    let map = mapWith([1, 1, 1, 4], { 2: 1, 3: 1, 4: 1 })
    const weave = map.seats[3]!
    // Ink paints the cell beside Weave's desk at full ink.
    const between = { x: (weave.x + map.seats[0]!.x) / 3 === 1 ? weave.x - 1 : weave.x + 1, y: weave.y }
    const ink1 = map.seats[0]!
    // Find a ground cell adjacent to both an Ink desk and Weave's desk by painting a path from Ink's desk towards Weave.
    const path: Array<{ x: number; y: number }> = []
    let cx = ink1.x
    let cy = ink1.y
    while (Math.abs(cx - weave.x) + Math.abs(cy - weave.y) > 1) {
      if (cx !== weave.x) cx += Math.sign(weave.x - cx)
      else cy += Math.sign(weave.y - cy)
      if (!(cx === weave.x && cy === weave.y)) path.push({ x: cx, y: cy })
    }
    let t = 1
    for (const p of path) {
      if (cellAt(map, p.x, p.y)?.faction === 1) continue
      map = tick(map, [{ seat: 1, x: p.x, y: p.y, kind: 'paint', drops: 3 }], t++).map
    }
    const last = path[path.length - 1]!
    expect(cellAt(map, last.x, last.y)).toMatchObject({ faction: 1, ink: 3 })
    expect(extremes(shares(map, content))).toEqual({ largest: 1, smallest: 4 })
    // Weave (smallest) strikes with 2 drops: doubled to 4 against ink 3, so it flips.
    const r = tick(map, [{ seat: 4, x: last.x, y: last.y, kind: 'strike', drops: 2 }], 100)
    expect(cellAt(r.map, last.x, last.y)).toMatchObject({ faction: 4, ink: 1 })
    expect(r.seats.get(4)).toMatchObject({ flipped: 1, underdogFlips: 1 })
    // Ink (largest) takes it back with a big surplus but lands at ink 1.
    const back = tick(r.map, [{ seat: 1, x: last.x, y: last.y, kind: 'strike', drops: 9 }], 101)
    expect(cellAt(back.map, last.x, last.y)).toMatchObject({ faction: 1, ink: 1 })
    void between
  })
})

describe('the fade', () => {
  it('fades the largest faction fastest, desks at half rate, and faded cells become ground', () => {
    let map = mapWith([1, 2], { 2: 1 })
    map = tick(map, [{ seat: 1, x: 1, y: 0, kind: 'paint', drops: 1 }], 1).map
    const i = indexOf(map, 1, 0)
    // Ink is rank 0 (two cells to one): its ground cell fades every 16 ticks on ticks where (tick + i) % 16 == 0.
    let faded: number | null = null
    for (let t = 2; t < 40 && faded === null; t += 1) {
      const r = tick(map, [], t)
      if (cellAt(r.map, 1, 0)?.faction === 0) faded = t
      map = r.map
    }
    expect(faded).not.toBeNull()
    expect((faded! + i) % content.fadeTicksByRank[0]!).toBe(0)
    // Desks fade too, but slower, and a desk never loses its desk bit.
    let desk = mapWith([1])
    let deskFaded = 0
    for (let t = 1; t <= 48 * 2 * 5 + 1; t += 1) {
      desk = tick(desk, [], t).map
      if (cellAt(desk, 0, 0)?.faction === 0) {
        deskFaded = t
        break
      }
    }
    expect(deskFaded).toBeGreaterThan(5 * content.fadeTicksByRank[0]!)
    expect(cellAt(desk, 0, 0)?.desk).toBe(true)
  })
})

describe('the season and the records', () => {
  it('paints the map clean at the bell, keeps the desks, applies switches and fills nothing else', () => {
    let map = mapWith([1, 2], { 2: 1 })
    map = tick(map, [{ seat: 1, x: 1, y: 0, kind: 'paint', drops: 3 }]).map
    const switched: MapState = { ...map, seats: map.seats.map((s, k) => (k === 1 ? { ...s, switchTo: 3 as const } : s)) }
    const clean = paintClean(switched, content)
    expect(cellAt(clean, 1, 0)?.faction).toBe(0)
    expect(cellAt(clean, 0, 0)).toMatchObject({ faction: 1, ink: content.deskInkCap, painter: 1 })
    expect(cellAt(clean, 3, 0)).toMatchObject({ faction: 3, ink: content.deskInkCap, painter: 2 })
    expect(clean.seats[1]?.faction).toBe(3)
    expect(clean.seats[1]).not.toHaveProperty('switchTo')
  })

  it('counts held cells, pays XP by the table, accrues the well and walks the goal ladder', () => {
    let map = mapWith([1, 2], { 2: 1 })
    map = tick(map, [{ seat: 1, x: 1, y: 0, kind: 'paint', drops: 3 }]).map
    expect(heldBy(map, 1)).toBe(2)
    expect(xpFor(content, { painted: 1, stamped: 0, flipped: 2, underdogFlips: 0, desksTaken: 1, liberated: 0, liberatedOthers: 1, lost: 0, refunded: 0 }, 4, true)).toBe(2 * 5 + 25 + 10 + 4 + 2)
    expect(wellAt(content, 10, 5, 20)).toBe(25)
    expect(wellAt(content, 40, 0, 500)).toBe(content.wellCap)
    const walked = evaluateGoals(content, undefined, { ...zeroCounters(), cellsPainted: 3, stamps: 1 })
    expect(walked.reached.map((g) => g.id)).toEqual(['paint', 'stamp'])
    expect(walked.xp).toBe(20)
    expect(walked.state.rung).toBe(2)
    expect(walked.counters.goalsReached).toBe(2)
  })

  it('unlocks achievements as counters cross tiers and reports family progress', () => {
    const before = { counters: zeroCounters(), level: 1 }
    const after = { counters: { ...zeroCounters(), cellsFlipped: 30, desksTaken: 1 }, level: 4 }
    expect(newlyUnlocked(before, after).map((a) => a.id).sort()).toEqual(['desks_taken_1', 'levels_1', 'striker_1', 'striker_2'])
    expect(allSatisfied(before)).toEqual([])
    const progress = familyProgress(after, new Set(['striker_1', 'striker_2']))
    expect(progress.find((f) => f.family === 'striker')).toMatchObject({ earned: expect.objectContaining({ id: 'striker_2' }), next: expect.objectContaining({ id: 'striker_3' }), value: 30, target: 250 })
  })
})

describe('determinism and storage', () => {
  it('replays the same map from the same orders byte for byte, and the bytes round-trip', () => {
    const map = mapWith([1, 2, 3, 4, 1, 2, 3, 4, 1])
    const orders: Order[] = map.seats.flatMap((s, k) => [
      { seat: k + 1, x: s.x + 1, y: s.y, kind: 'paint' as const, drops: 2 },
      { seat: k + 1, x: s.x, y: s.y + 1, kind: 'paint' as const, drops: 1 },
    ])
    const a = tick(map, orders, 7)
    const b = tick(map, [...orders].reverse(), 7)
    expect(cellsToHex(a.map.cells)).toBe(cellsToHex(b.map.cells))
    expect(Array.from(a.map.painters)).toEqual(Array.from(b.map.painters))
    expect(cellsFromHex(cellsToHex(a.map.cells))).toEqual(a.map.cells)
    expect(decodePainters(encodePainters(a.map.painters))).toEqual(a.map.painters)
    // Shares sum to the held cells and ranks are a permutation.
    const s = shares(a.map, content)
    expect(s.map((r) => r.rank).sort()).toEqual([0, 1, 2, 3])
    expect(s.reduce((n, r) => n + r.cells, 0)).toBe(Array.from(a.map.cells).filter((c) => (c & 7) !== 0).length)
  })
})
