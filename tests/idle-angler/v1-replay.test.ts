import { createHash } from 'node:crypto'
import { describe, expect, it } from 'vitest'
import { contentV1 } from '@trmnl-games/idle-angler/content'
import { simulateAngler, starterAngler, waterOf, type AnglerState } from '@trmnl-games/idle-angler/sim'
import { buyAccess, buyBait, buyCooler, buyRod, sell } from '@trmnl-games/idle-angler/sim/shop'
import { deriveAnglerSeeds, forecast } from '@trmnl-games/idle-angler/sim/seed'

/**
 * Content v1 must replay seed by seed forever (idle-angler.md "Determinism and versions"). The fingerprints were
 * recorded on 2026-10-14 before content v2 (D162) touched the core; a change means v1 replays differently.
 * The loop is self-contained so a harness change cannot move it.
 */
const START = Date.UTC(2026, 10, 1, 0, 5)

function fingerprint(anglers: number, days: number, visits: boolean): string {
  const hash = createHash('sha256')
  for (let i = 0; i < anglers; i += 1) {
    let angler: AnglerState = starterAngler(contentV1, 0)
    let cooler: number[] = []
    for (let tick = 1; tick <= days * 96; tick += 1) {
      const at = START + (tick - 1) * 15 * 60_000
      if (visits && tick % 96 === 76) {
        angler = sell(angler, cooler)
        cooler = []
        for (const buy of [() => buyCooler(contentV1, angler), () => buyRod(contentV1, angler), () => buyAccess(contentV1, angler, 'waders'), () => buyBait(contentV1, angler, 'worms', 1)]) {
          const result = buy()
          if (result.ok) angler = result.angler
        }
      }
      const water = waterOf(contentV1, angler.travelTo ?? angler.waterId)
      const result = simulateAngler({ angler, coolerCount: cooler.length, tick, tickAt: at, utcOffsetSeconds: 7200, weather: forecast(`replay-${i}`, water, at), content: contentV1, streams: deriveAnglerSeeds(`replay-${i}`, `a${i}`, tick, 1) })
      angler = result.angler
      if (result.catch) cooler.push(result.catch.value)
      hash.update(JSON.stringify([result.event?.summary, result.extraEvents?.map((e) => e.summary), result.metrics]))
    }
    hash.update(JSON.stringify(angler))
  }
  return hash.digest('hex').slice(0, 16)
}

describe('content v1 replay', () => {
  it('replays a visiting and a never-visiting cohort unchanged', { timeout: 30_000 }, () => {
    expect(fingerprint(6, 21, true)).toBe('26f02a49acb6d438')
    expect(fingerprint(6, 21, false)).toBe('fc31e9b36025f040')
  })
})
