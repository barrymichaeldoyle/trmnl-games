import { describe, expect, it } from 'vitest'
import { Liquid } from 'liquidjs'
import { buildPayload } from '@trmnl-games/paper-lives/payload'
import { parsePortraitPath, portraitBase, portraitKey, renderPaperLivesArt, PORTRAIT_SCALES } from '@trmnl-games/paper-lives/art/route'
import { composePortrait, FRAME, HAIR_STYLES, PET_KINDS, PORTRAIT_HEIGHT, PORTRAIT_WIDTH } from '@trmnl-games/paper-lives/art/portrait'
import { PL_MARKS, STORY_GLYPHS } from '@trmnl-games/paper-lives/art/marks'
import { screenMarkup } from '@trmnl-games/paper-lives/templates/screen'
import { previewScenarios } from '@trmnl-games/paper-lives/templates/previewScenarios'
import { contentV1 } from '@trmnl-games/paper-lives/content'

const ART = 'https://art.example'
const liquid = new Liquid({ timezoneOffset: 0 })

describe('Paper Lives portraits', () => {
  it('draws every stage, hair, extra and pet within bounds, framed or not', () => {
    for (const stage of ['infant', 'child', 'teen', 'young', 'adult', 'senior'] as const)
      for (let hair = 0; hair < HAIR_STYLES.length; hair += 1)
        for (const extra of ['none', 'hat', 'scarf'] as const)
          for (const pet of [null, ...PET_KINDS])
            for (const frame of [false, true]) {
              const c = composePortrait({ stage, hair, glasses: hair % 2 === 0, extra, pet, frame })
              expect(c.width).toBe(PORTRAIT_WIDTH + (frame ? FRAME * 2 : 0))
              expect(c.height).toBe(PORTRAIT_HEIGHT + (frame ? FRAME * 2 : 0))
              expect(c.ink.some((v) => v === 1)).toBe(true)
            }
    expect(PET_KINDS.sort()).toEqual(contentV1.pets.map((p) => p.id).sort())
  })

  it('serves only allowlisted portrait and code paths', () => {
    const key = portraitKey({ ...previewScenarios(null).adult!.life!.state })
    const base = portraitBase(key)
    expect(parsePortraitPath(`${base}/3.png`)).toMatchObject({ ...key, scale: 3 })
    for (const scale of PORTRAIT_SCALES) expect(renderPaperLivesArt(`${base}/${scale}.png`, ART)?.immutable).toBe(true)
    expect(renderPaperLivesArt('/art/pl/qr/v1/app/2.png', ART)?.immutable).toBe(false)
    for (const bad of [`${base}/9.png`, '/art/pl/portrait/v1/elder/0/g0/none/none/f0/2.png', '/art/pl/portrait/v1/adult/9/g0/none/none/f0/2.png', '/art/pl/portrait/v1/adult/0/g0/none/dragon/f0/2.png', '/art/pl/portrait/v2/adult/0/g0/none/none/f0/2.png', '/art/pl/qr/v1/other/2.png'])
      expect(renderPaperLivesArt(bad, ART)).toBeNull()
  })

  it('keeps a life’s look through a rename, with glasses once a line gave them', () => {
    const life = previewScenarios(null).adult!.life!.state
    const renamed: typeof life = { ...life, first: 'Ida', flags: [] }
    expect(portraitKey({ ...life, flags: [] }).hair).toBe(portraitKey(renamed).hair)
    expect(portraitKey(life).glasses).toBe(true)
    expect(portraitKey({ ...life, status: 'ended' }).frame).toBe(true)
  })

  it('has an 8x8 mark for every story glyph', () => {
    for (const glyph of STORY_GLYPHS) expect(PL_MARKS[glyph].every((row) => row.length === 8)).toBe(true)
    for (const event of contentV1.events) expect(STORY_GLYPHS as readonly string[]).toContain(event.glyph)
  })
})

describe('Paper Lives screen templates', () => {
  it('render every scenario and layout without inline style, escaping user text', async () => {
    for (const [name, { utcOffset, ...input }] of Object.entries(previewScenarios(ART))) {
      const payload = buildPayload(input)
      for (const [layout, markup] of Object.entries(screenMarkup)) {
        const html = await liquid.parseAndRender(markup, { ...payload, utc_offset: utcOffset })
        expect(html, `${name} ${layout}`).not.toMatch(/style=/)
        expect(html, `${name} ${layout}`).toContain('Paper Lives')
      }
    }
    const nasty = previewScenarios(ART).adult!
    const payload = buildPayload({ ...nasty, life: { ...nasty.life!, state: { ...nasty.life!.state, first: '<b>Maud</b>' } } })
    const html = await liquid.parseAndRender(screenMarkup.markup, payload)
    expect(html).not.toContain('<b>Maud</b>')
    expect(html).toContain('&lt;b&gt;Maud&lt;/b&gt;')
  })

  it('shows the close time in the owner’s offset, and leaves it out without one', async () => {
    const { utcOffset, ...input } = previewScenarios(ART).child!
    const payload = buildPayload(input)
    const withOffset = await liquid.parseAndRender(screenMarkup.markup, { ...payload, utc_offset: utcOffset })
    const closes = new Date((payload.closes_at! + utcOffset!) * 1000).toISOString().slice(11, 16)
    expect(withOffset).toContain(`The year ends at ${closes}`)
    const without = await liquid.parseAndRender(screenMarkup.markup, { ...payload, utc_offset: null })
    expect(without).toContain('The year ends later today')
  })

  it('swaps the column for the memorial once the life has ended', async () => {
    const { utcOffset, ...input } = previewScenarios(ART).memorial!
    const html = await liquid.parseAndRender(screenMarkup.markup, { ...buildPayload(input), utc_offset: utcOffset })
    expect(html).toContain('Third of the Okafors')
    expect(html).toContain('Start the next life in the companion')
    expect(html).toContain('/f1/3.png')
    expect(html).not.toContain('data-stats')
  })
})
