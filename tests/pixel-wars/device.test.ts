import { describe, expect, it } from 'vitest'
import { Liquid } from 'liquidjs'
import { contentV1 } from '@trmnl-games/pixel-wars/content'
import { buildPayload } from '@trmnl-games/pixel-wars/lib/payload'
import { mapPath, parseArtPath, renderMapPng, renderQrPng } from '@trmnl-games/pixel-wars/art/route'
import { fitWindow, patternInk, renderSwatch, renderWindow, windowSize } from '@trmnl-games/pixel-wars/art/render'
import { swatchUri } from '@trmnl-games/pixel-wars/art/marks'
import { screenMarkup } from '@trmnl-games/pixel-wars/templates/screen'
import { previewScenarios, scriptedMap } from '@trmnl-games/pixel-wars/templates/previewScenarios'

const ART = 'https://art.example'
const scenarios = previewScenarios(ART)
const liquid = new Liquid({ timezoneOffset: 0 })

describe('the patterns', () => {
  it('tell the four factions apart at every ink level and never make a checkerboard', () => {
    const density = (pattern: 'solid' | 'hatch' | 'dots' | 'weave', level: number) => {
      let on = 0
      for (let y = 0; y < 36; y += 1) for (let x = 0; x < 36; x += 1) if (patternInk(pattern, level, x, y)) on += 1
      return on / (36 * 36)
    }
    for (const pattern of ['solid', 'hatch', 'dots', 'weave'] as const) {
      expect(density(pattern, 3)).toBeGreaterThan(density(pattern, 2))
      expect(density(pattern, 2)).toBeGreaterThan(density(pattern, 1))
      // No isolated single pixels: every inked pixel has an inked orthogonal neighbour (strokes are two wide).
      for (let y = 1; y < 30; y += 1) for (let x = 1; x < 30; x += 1) if (patternInk(pattern, 3, x, y)) expect(patternInk(pattern, 3, x + 1, y) || patternInk(pattern, 3, x - 1, y) || patternInk(pattern, 3, x, y + 1) || patternInk(pattern, 3, x, y - 1)).toBe(true)
    }
    const swatches = ['solid', 'hatch', 'dots', 'weave'].map((p) => renderSwatch(p as 'solid', 16).ink.join(''))
    expect(new Set(swatches).size).toBe(4)
    expect(swatchUri('hatch').startsWith('data:image/svg+xml,')).toBe(true)
  })
})

describe('the map image', () => {
  it('shows the whole map when it fits and a window on the desk when it does not', () => {
    const small = scriptedMap(9, 20)
    const whole = fitWindow(small, 760, 290)
    expect(whole).toMatchObject({ x0: small.x0, y0: small.y0, cols: small.cols, rows: small.rows })
    expect(whole.px).toBeGreaterThanOrEqual(10)
    const big = scriptedMap(441, 10)
    const window = fitWindow(big, 160, 90, { x: 0, y: 0 })
    expect(window.px).toBe(10)
    expect(window.cols).toBeLessThanOrEqual(15)
    expect(window.x0).toBeLessThanOrEqual(0)
    expect(window.x0 + window.cols).toBeGreaterThan(0)
    const full = fitWindow(big, 760, 290)
    expect(full.px).toBe(10)
    expect(full.cols * 10).toBeLessThanOrEqual(760)
  })

  it('draws desks ringed, the viewer’s own ringed again, and encodes a PNG of the window’s size', () => {
    const map = scriptedMap(9, 20)
    const window = fitWindow(map, 760, 290)
    const seat = map.seats[0]!
    const canvas = renderWindow(map, window, (f) => contentV1.factions[f - 1]!.pattern, { x: seat.x, y: seat.y })
    const { width, height } = windowSize(window)
    expect([canvas.width, canvas.height]).toEqual([width, height])
    // The desk cell's edge is ink (its ring).
    const left = 1 + (seat.x - window.x0) * window.px
    const top = 1 + (seat.y - window.y0) * window.px
    expect(canvas.ink[top * width + left]).toBe(1)
    expect(canvas.ink[(top + window.px - 1) * width + left + window.px - 1]).toBe(1)
    // The own ring sits two pixels outside the cell.
    expect(canvas.ink[(top - 3) * width + left]).toBe(1)
    expect(canvas.ink[(top - 1) * width + left]).toBe(0)
    const png = renderMapPng(map, window, contentV1, { x: seat.x, y: seat.y })
    expect(png.subarray(0, 8)).toEqual(new Uint8Array([137, 80, 78, 71, 13, 10, 26, 10]))
  })

  it('parses and refuses art paths', () => {
    const path = mapPath('abc123', 42, { x0: -4, y0: -4, cols: 9, rows: 9, px: 12 }, 3)
    expect(parseArtPath(path)).toEqual({ kind: 'map', mapId: 'abc123', tick: 42, window: { x0: -4, y0: -4, cols: 9, rows: 9, px: 12 }, seat: 3 })
    expect(parseArtPath('/art/pw/map/v1/abc/1/0,0,99,99/12/0.png')).toBeNull()
    expect(parseArtPath('/art/pw/map/v1/abc/1/0,0,9,9/4/0.png')).toBeNull()
    expect(parseArtPath('/art/pw/qr/v1/home/3.png')).toEqual({ kind: 'qr', target: 'home', scale: 3 })
    expect(parseArtPath('/art/pw/qr/v1/home/9.png')).toBeNull()
    expect(parseArtPath('/art/pw/print/v1/seas0n/8.png')).toEqual({ kind: 'print', seasonId: 'seas0n', px: 8 })
    expect(renderQrPng('home', 2, 'https://trmnlgames.com').length).toBeGreaterThan(100)
  })
})

describe('the device payload', () => {
  it('describes a playing desk: the side, the shares, the desk line, the map windows and the code', () => {
    const payload = buildPayload(scenarios.playing!)
    expect(payload.status).toBe('playing')
    if (payload.status !== 'playing') return
    expect(payload.alias).toBe('Mo')
    expect(payload.faction_name).toBe(contentV1.factions[payload.faction - 1]!.name)
    expect(payload.shares.length).toBe(4)
    expect(payload.shares.filter((s) => s.own).length).toBe(1)
    expect(payload.shares.map((s) => s.rank)).toEqual([0, 1, 2, 3])
    expect(payload.desk_label).toMatch(/^Your desk \d\/5$/)
    expect(payload.map_full_og).toContain(`${ART}/art/pw/map/v1/medium/1600/`)
    expect(payload.map_quad_og).toBeDefined()
    expect(parseArtPath(payload.map_full_og!.slice(ART.length))?.kind).toBe('map')
    expect(payload.qr_base).toBe(`${ART}/art/pw/qr/v1/home`)
    expect(payload.lines.length).toBe(3)
    expect(payload.stories[0]!.glyph).toBe('flips')
    expect(payload.board?.own_label).toBe('#2 of 41')
    expect(payload.attention).toBeNull()
  })

  it('leads with a fallen desk, a side to pick, an empty desk, the bell, or a service note', () => {
    const fallen = buildPayload(scenarios.fallen!)
    expect(fallen.status).toBe('fallen')
    expect(fallen.status === 'fallen' && fallen.attention_kind).toBe('fallen')
    // The scripted war may have faded the desk to ground rather than handing it to another faction; both are a fall.
    expect(fallen.status === 'fallen' && /^(Held by \w+|Desk at ground)$/.test(fallen.desk_label)).toBe(true)
    const choose = buildPayload(scenarios.choose!)
    expect(choose.status).toBe('choose')
    expect(choose.status === 'choose' && choose.attention_kind).toBe('choose')
    expect(choose.status === 'choose' && choose.map_full_og).toBeDefined()
    const cleared = buildPayload(scenarios.cleared!)
    expect(cleared.status).toBe('cleared')
    const bell = buildPayload(scenarios.bell!)
    expect(bell.status === 'playing' && bell.attention_kind).toBe('bell')
    expect(bell.season_label).toBe('Bell in 1 h')
    const service = buildPayload(scenarios.service!)
    expect(service.data_state).toBe('service_paused')
    const shielded = buildPayload(scenarios.shielded!)
    expect(shielded.status === 'playing' && shielded.shielded).toBe(true)
  })

  it('shows the welcome before activation', () => {
    expect(buildPayload(scenarios.pending!).status).toBe('pending')
    expect(buildPayload(scenarios.unlinked!).status).toBe('unlinked')
  })
})

describe('the templates', () => {
  it('render every scenario in every layout with the right map and no Liquid left over', async () => {
    for (const [name, input] of Object.entries(scenarios)) {
      const payload = buildPayload(input)
      for (const [layout, markup] of Object.entries(screenMarkup)) {
        const html = await liquid.parseAndRender(markup, { ...payload, utc_offset: 0 })
        expect(html, `${name} ${layout}`).not.toMatch(/\{\{|\{%/)
        expect(html, `${name} ${layout}`).toContain('Pixel Wars')
        if (payload.status === 'playing') {
          expect(html, `${name} ${layout}`).toContain('data-strip="true"')
          expect(html, `${name} ${layout}`).toContain('/art/pw/map/v1/')
          if (layout === 'markup') expect(html).toContain(payload.map_full_og!)
          if (layout === 'markup_quadrant') expect(html).toContain(payload.map_quad_og!)
        }
        if (payload.status === 'pending' || payload.status === 'unlinked') expect(html).toContain('data-welcome="true"')
      }
    }
  })
})
