import { describe, expect, it } from 'vitest'
import { Liquid } from 'liquidjs'
import { contentV1 } from '@trmnl-games/little-plot/content'
import { buildPayload, deviceStories, MAX_STORIES } from '@trmnl-games/little-plot/lib/payload'
import { parseScenePath, renderLittlePlotArt, sceneBase, scenePath } from '@trmnl-games/little-plot/art/route'
import { composeScene, decodeBeds, encodeBeds, type SceneKey } from '@trmnl-games/little-plot/art/scene'
import { screenMarkup } from '@trmnl-games/little-plot/templates/screen'
import { previewScenarios } from '@trmnl-games/little-plot/templates/previewScenarios'
import { Canvas } from '@trmnl-games/engine/art/canvas'

const ART = 'https://art.example'
const scenarios = previewScenarios(ART)
const liquid = new Liquid({ timezoneOffset: 0 })

describe('the device payload', () => {
  it('describes a growing plot: status, counters, the goal, the scene and the code', () => {
    const payload = buildPayload(scenarios.growing!)
    expect(payload.status).toBe('growing')
    if (payload.status !== 'growing') return
    expect(payload.alias).toBe('Mo')
    expect(payload.level).toBe(6)
    expect(payload.ripe_label).toBe('1/6')
    expect(payload.season).toBe('spring')
    expect(payload.season_label).toMatch(/^Spring until Monday$/)
    expect(payload.goal_line).toBe('Sow a Poppy next to a Marigold')
    expect(payload.scene_base.startsWith(`${ART}/art/lp/scene/v1/day/rain/spring/2x3/`)).toBe(true)
    expect(payload.qr_base).toBe(`${ART}/art/lp/qr/v1/home`)
    expect(payload.stories.length).toBeLessThanOrEqual(MAX_STORIES)
    expect(payload.stories[0]!.glyph).toBe('ripe')
    // The two achievements earned on one tick share a line, and the gnome's visit keeps no name markers on the device.
    expect(payload.stories.some((s) => s.summary.startsWith('2 achievements: '))).toBe(true)
    expect(payload.stories.every((s) => !s.summary.includes('[['))).toBe(true)
    expect(payload.recap_items).toEqual(expect.arrayContaining([{ k: 'ripe', text: '2 ripened' }]))
    expect(payload.board?.own_label).toBe('#2 of 41')
  })

  it('leads with the ripe beds, then a waiting reward, then nothing', () => {
    const ripe = buildPayload(scenarios.ripe!)
    expect(ripe.status === 'growing' && ripe.attention_kind).toBe('ripe')
    expect(ripe.status === 'growing' && ripe.attention).toBe('3 beds ripe: pick them in the companion.')
    expect(ripe.qr_base).toBe(`${ART}/art/lp/qr/v1/ripe`)
    const claim = buildPayload(scenarios.claim!)
    expect(claim.status === 'growing' && claim.attention_kind).toBe('goal')
    expect(claim.status === 'growing' && claim.attention).toBe('2 goals reached! Claim 80 coins in the companion.')
    const growing = buildPayload(scenarios.growing!)
    expect(growing.status === 'growing' && growing.attention).toBeNull()
  })

  it('says frost on a clear winter night and paused or delayed when it is', () => {
    const frost = buildPayload(scenarios.frost!)
    expect(frost.season).toBe('winter')
    expect(frost.status === 'growing' && frost.frost).toBe(true)
    const paused = buildPayload(scenarios.paused!)
    expect(paused.status).toBe('paused')
    const service = buildPayload(scenarios.service!)
    expect(service.data_state).toBe('service_paused')
    const stale = buildPayload({ ...scenarios.growing!, world: { ...scenarios.growing!.world!, lastCompletedAt: scenarios.growing!.now - 3 * 3_600_000 } })
    expect(stale.stale).toBe(true)
    expect(stale.status === 'growing' && stale.attention).toBe('Updates are delayed.')
  })

  it('shows the welcome before activation, with the sown plot as its scene', () => {
    const pending = buildPayload(scenarios.pending!)
    expect(pending.status).toBe('pending')
    expect(pending.scene_base).toContain('/2x2/')
    const unlinked = buildPayload(scenarios.unlinked!)
    expect(unlinked.status).toBe('unlinked')
    expect(unlinked.scene_base).toBe('')
  })

  it('orders a tick by what matters and hides the player’s own actions', () => {
    const at = 1000
    const out = deviceStories([
      { kind: 'stage', summary: 'up', at },
      { kind: 'ripe', summary: 'ripe', at },
      { kind: 'harvest', summary: 'picked', at: at + 1 },
      { kind: 'achievement', summary: 'Achievement: A', at, title: 'A' },
      { kind: 'achievement', summary: 'Achievement: B', at, title: 'B' },
    ])
    expect(out.map((s) => s.kind)).toEqual(['ripe', 'stage', 'achievement'])
    expect(out[2]!.summary).toBe('2 achievements: A, B')
  })
})

describe('the art route', () => {
  const key: SceneKey = { band: 'day', weather: 'clear', season: 'spring', rows: 2, cols: 2, beds: [{ stage: 'ripe', group: 'flower', crossed: true, greenhouse: false }, { stage: 'sown', group: 'vegetable', crossed: false, greenhouse: true }, { stage: 'empty', group: null, crossed: false, greenhouse: false }, { stage: 'bud', group: 'herb', crossed: false, greenhouse: false }], items: ['fence', 'pond'], gnome: true, flower: true }

  it('round-trips a scene key through its path and renders a 1-bit PNG at the stage width and scale', () => {
    const path = scenePath(key, 156, 5)
    const parsed = parseScenePath(path)
    expect(parsed).toMatchObject({ ...key, width: 156, scale: 5 })
    expect(decodeBeds(encodeBeds(key.beds), 4)).toEqual(key.beds)
    const art = renderLittlePlotArt(path, 'https://trmnlgames.com')
    expect(art?.immutable).toBe(true)
    expect(art!.png.slice(1, 4)).toEqual(new Uint8Array([0x50, 0x4e, 0x47]))
  })

  it('refuses anything off the allowlist', () => {
    expect(parseScenePath(sceneBase(key) + '/156/7.png')).toBeNull()
    expect(parseScenePath(sceneBase(key).replace('/day/', '/noon/') + '/156/5.png')).toBeNull()
    expect(parseScenePath(sceneBase(key).replace('/2x2/', '/2x3/') + '/156/5.png')).toBeNull()
    expect(renderLittlePlotArt('/art/lp/qr/v1/home/9.png', 'https://trmnlgames.com')).toBeNull()
    expect(renderLittlePlotArt('/art/lp/qr/v1/home/3.png', 'https://trmnlgames.com')?.immutable).toBe(false)
    expect(renderLittlePlotArt('/art/lp/qr/v1/flower/482917/3.png', 'https://trmnlgames.com')).not.toBeNull()
    expect(renderLittlePlotArt('/art/lp/qr/v1/flower/48291/3.png', 'https://trmnlgames.com')).toBeNull()
  })

  it('draws every bed of a 3 × 4 plot inside the hedge at every stage, on the narrowest and widest stage', () => {
    for (const width of [120, 400]) {
      const big: SceneKey = { ...key, rows: 3, cols: 4, beds: Array.from({ length: 12 }, (_, i) => ({ stage: (['empty', 'sown', 'sprout', 'leaf', 'bud', 'ripe'] as const)[i % 6]!, group: (['flower', 'vegetable', 'herb'] as const)[i % 3]!, crossed: i % 4 === 0, greenhouse: i % 5 === 0 })), items: ['fence', 'scarecrow', 'lantern', 'garden_cat', 'gnome_trap', 'pond', 'beehive', 'bird_table', 'compost_bin', 'bench', 'path', 'decoy_gnome', 'sundial', 'wind_chimes'] }
      const canvas = composeScene(big, new Canvas(width, 40))
      // Something is drawn in every bed's tile, and the hedge rows are inked.
      expect(canvas.ink.some((v) => v === 1)).toBe(true)
      expect(canvas.ink.slice(8 * width, 9 * width).some((v) => v === 1)).toBe(true)
      expect(canvas.ink.slice(39 * width, 40 * width).some((v) => v === 1)).toBe(true)
    }
  })
})

describe('the screen templates', () => {
  it('render every scenario in every layout without a Liquid error, escaping the alias', async () => {
    for (const [name, input] of Object.entries(scenarios)) {
      const payload = buildPayload({ ...input, plot: input.plot ? { ...input.plot, alias: '<b>&amp;' } : null })
      for (const markup of Object.values(screenMarkup)) {
        const html = await liquid.parseAndRender(markup, { ...payload, flower_code: '482 917', flower_qr_base: `${ART}/art/lp/qr/v1/flower/482917`, utc_offset: 3600 })
        expect(html, name).not.toContain('<b>&amp;')
        expect(html, name).toContain('title_bar')
        if (payload.status === 'growing') expect(html, name).toContain('data-stories')
      }
    }
  })

  it('puts the flower code in the title bar and the claim link behind the code while nothing more pressing shows', async () => {
    const payload = buildPayload(scenarios.growing!)
    const html = await liquid.parseAndRender(screenMarkup.markup, { ...payload, flower_code: '482 917', flower_qr_base: `${ART}/art/lp/qr/v1/flower/482917`, utc_offset: 3600 })
    expect(html).toContain('Flower code 482 917')
    expect(html).toContain('/art/lp/qr/v1/flower/482917/2.png')
    const ripe = buildPayload(scenarios.ripe!)
    const ripeHtml = await liquid.parseAndRender(screenMarkup.markup, { ...ripe, flower_code: '482 917', flower_qr_base: `${ART}/art/lp/qr/v1/flower/482917`, utc_offset: 3600 })
    expect(ripeHtml).toContain('/art/lp/qr/v1/ripe/2.png')
  })

  it('keeps every content line short enough for the device', () => {
    for (const kind of contentV1.kinds) expect(kind.name.length).toBeLessThanOrEqual(16)
    for (const goal of contentV1.goals) expect(goal.title.length).toBeLessThanOrEqual(40)
  })
})
