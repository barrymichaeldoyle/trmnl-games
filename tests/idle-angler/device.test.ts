import { describe, expect, it } from 'vitest'
import { Liquid } from 'liquidjs'
import { contentV1 } from '@trmnl-games/idle-angler/content'
import { buildPayload, deviceStories } from '@trmnl-games/idle-angler/payload'
import { fishBase, parseScenePath, renderIdleAnglerArt, sceneBase, scenePath, SCENE_SCALES } from '@trmnl-games/idle-angler/art/route'
import { IA_MARKS, STORY_GLYPHS } from '@trmnl-games/idle-angler/art/marks'
import { Canvas } from '@trmnl-games/engine/art/canvas'
import { clampStageWidth, composeScene, MAX_STAGE_WIDTH, MIN_STAGE_WIDTH, poseFor, STAGE_HEIGHT, STAGE_WIDTH } from '@trmnl-games/idle-angler/art/scene'
import { FISH_TRAITS, fishSprite } from '@trmnl-games/idle-angler/art/fish'
import { screenMarkup } from '@trmnl-games/idle-angler/templates/screen'
import { previewScenarios, PREVIEW_NOW } from '@trmnl-games/idle-angler/templates/previewScenarios'

const ART = 'https://art.example'
const scenarios = previewScenarios(ART)

describe('Idle Angler fish art', () => {
  it('has traits for every species and draws each at both sizes within bounds', () => {
    for (const species of contentV1.species) {
      expect(FISH_TRAITS[species.id], species.id).toBeDefined()
      for (const [w, h] of [[30, 12], [15, 7]] as const) {
        const sprite = fishSprite(species.id, w, h)
        expect(sprite.rows).toHaveLength(h)
        expect(sprite.rows.every((row) => row.length === w)).toBe(true)
        expect(sprite.rows.join('')).toMatch(/#/)
      }
    }
  })
})

describe('Idle Angler scenes and codes', () => {
  it('composes a stage for every water, band, weather and pose', () => {
    for (const water of ['millpond', 'river_bend', 'harbour_pier'] as const)
      for (const band of ['dawn', 'day', 'dusk', 'night'] as const)
        for (const weather of ['clear', 'overcast', 'rain', 'wind', 'fog'] as const)
          for (const pose of ['waiting', 'casting', 'reeling', 'holding', 'paused'] as const) {
            const canvas = composeScene({ water, band, weather, pose, fish: pose === 'holding' ? 'roach' : null })
            expect(canvas.width).toBe(STAGE_WIDTH)
            expect(canvas.height).toBe(STAGE_HEIGHT)
          }
  })

  it('composes any stage width the layouts ask for: the cast stays with the angler, the far backdrop with the right edge', () => {
    const key = { water: 'harbour_pier', band: 'night', weather: 'clear', pose: 'waiting', fish: null } as const
    const composed = composeScene(key)
    // A column's rows from the top: the whole stage, or only the sky and backdrop above the horizon (row 21), under which the ripples' phase runs from the left.
    const column = (c: Canvas, x: number, rows = STAGE_HEIGHT) => Array.from({ length: rows }, (_, y) => c.ink[y * c.width + x]).join('')
    const columns = (c: Canvas, from: number, to: number, rows = STAGE_HEIGHT) => Array.from({ length: to - from }, (_, i) => column(c, from + i, rows)).join('|')
    for (const width of [MIN_STAGE_WIDTH, 182, 220, MAX_STAGE_WIDTH]) {
      const wide = composeScene(key, new Canvas(width, STAGE_HEIGHT))
      expect(wide.width).toBe(width)
      // The pier, the angler and the cast are unchanged at the left; the lighthouse and the moon sit the same distance from the right edge.
      expect(columns(wide, 0, 48)).toBe(columns(composed, 0, 48))
      expect(columns(wide, width - 16, width, 21)).toBe(columns(composed, STAGE_WIDTH - 16, STAGE_WIDTH, 21))
      // The horizon runs the whole width.
      for (let x = 0; x < width; x += 1) expect(wide.ink[21 * width + x], `horizon at ${x} of ${width}`).toBe(1)
    }
    expect(clampStageWidth(90)).toBe(MIN_STAGE_WIDTH)
    expect(clampStageWidth(119.9)).toBe(MIN_STAGE_WIDTH)
    expect(clampStageWidth(153.7)).toBe(153)
    expect(clampStageWidth(9000)).toBe(MAX_STAGE_WIDTH)
  })

  it('round-trips scene paths and refuses anything off the allowlist', () => {
    const key = { water: 'river_bend', band: 'dusk', weather: 'rain', pose: 'holding', fish: 'salmon', fly: 'zulu' } as const
    const base = sceneBase(key)
    expect(base).toBe('/art/ia/scene/v4/river_bend/dusk/rain/noseason/holding/salmon/zulu')
    expect(sceneBase({ ...key, season: 'winter' })).toBe('/art/ia/scene/v4/river_bend/dusk/rain/winter/holding/salmon/zulu')
    // v3 paths (no season) still render while devices catch up (D162).
    expect(parseScenePath('/art/ia/scene/v3/river_bend/dusk/rain/holding/salmon/zulu/182/5.png')).toMatchObject({ water: 'river_bend', season: null, width: 182 })
    expect(scenePath(key, 182, 5)).toBe(`${base}/182/5.png`)
    expect(parseScenePath(`${base}/182/5.png`)).toMatchObject({ water: 'river_bend', fish: 'salmon', fly: 'zulu', width: 182, scale: 5 })
    expect(sceneBase({ water: 'millpond', band: 'day', weather: 'clear', pose: 'waiting', fish: 'roach' })).toBe('/art/ia/scene/v4/millpond/day/clear/noseason/waiting/none/nofly')
    for (const bad of [`${base}/152/7.png`, `${base}/5.png`, `${base}/119/5.png`, `${base}/401/5.png`, `${base}/1520/5.png`, `${base}/0152/5.png`, '/art/ia/scene/v3/ocean/day/clear/waiting/none/nofly/152/5.png', '/art/ia/scene/v4/millpond/day/clear/monsoon/waiting/none/nofly/152/5.png', '/art/ia/scene/v3/millpond/day/clear/waiting/shark/nofly/152/5.png', '/art/ia/scene/v3/millpond/day/clear/waiting/none/dragonfly/152/5.png', '/art/ia/scene/v2/millpond/day/clear/waiting/none/nofly/5.png', '/art/ia/scene/v1/millpond/day/clear/waiting/none/5.png', '/art/ia/qr/v1/anything/3.png'])
      expect(renderIdleAnglerArt(bad, 'https://trmnlgames.com'), bad).toBeNull()
    expect(renderIdleAnglerArt('/art/ia/qr/v1/home/3.png', 'https://trmnlgames.com')?.immutable).toBe(false)
    expect(renderIdleAnglerArt(`${base}/152/2.png`, 'https://trmnlgames.com')?.immutable).toBe(true)
    // The served PNG is the stage width over the scale: its IHDR holds the width at byte 16 and the height at 20.
    const png = renderIdleAnglerArt(`${base}/220/2.png`, 'https://trmnlgames.com')!.png
    const view = new DataView(png.buffer, png.byteOffset, png.byteLength)
    expect([view.getUint32(16), view.getUint32(20)]).toEqual([440, STAGE_HEIGHT * 2])
    expect([...SCENE_SCALES]).toEqual([1, 2, 3, 4, 5, 6, 8, 10])
  })

  it('draws any species alone for the catch panel, and nothing off the allowlist', () => {
    const png = renderIdleAnglerArt(`${fishBase('barbel')}/4.png`, 'https://trmnlgames.com')
    expect(png?.immutable).toBe(true)
    for (const bad of [`${fishBase('kraken')}/4.png`, `${fishBase('barbel')}/7.png`, '/art/ia/fish/v2/barbel/4.png']) expect(renderIdleAnglerArt(bad, 'https://trmnlgames.com'), bad).toBeNull()
  })

  it('keeps every screen mark on its grid', () => {
    for (const [name, rows] of Object.entries(IA_MARKS)) {
      expect(rows.every((row) => row.length === rows[0]!.length && /^[#.]+$/.test(row)), name).toBe(true)
      expect(rows.join(''), name).toMatch(/#/)
    }
    for (const kind of STORY_GLYPHS) expect(IA_MARKS[kind]).toBeDefined()
  })

  it('holds up a kept or released fish, bends the rod for one that got away', () => {
    expect(poseFor('fishing', 'catch')).toBe('holding')
    expect(poseFor('fishing', 'release')).toBe('holding')
    expect(poseFor('fishing', 'got_away')).toBe('reeling')
    expect(poseFor('fishing', 'ambient')).toBe('waiting')
    expect(poseFor('paused', 'catch')).toBe('paused')
  })
})

describe('Idle Angler payload', () => {
  it('tells the screen in the owner\'s language, and leaves English unchanged without one (D200)', async () => {
    const english = buildPayload(scenarios.listing!)
    const french = buildPayload({ ...scenarios.listing!, locale: 'fr' })
    expect(english.status_label).toBe('Casting at River Bend')
    expect(french).toMatchObject({ status_label: 'Pêche au Méandre', band_label: 'Crépuscule', weather_label: 'Couvert', title: 'Main sûre', goal_line: 'Prendre un poisson sous la pluie', board: { label: 'Cette semaine', rank_label: 'N° 3, record 1,9 kg' } })
    expect(french.stories[0]!.summary).toBe('Un barbeau de 1,9 kg a mordu aux asticots au crépuscule. Nouveau record personnel.')
    const html = await new Liquid().parseAndRender(screenMarkup.markup, french)
    expect(html).toContain('12 dernières heures')
    expect(html).not.toContain('Last 12 hours')
    expect(await new Liquid().parseAndRender(screenMarkup.markup, english)).toContain('Last 12 hours')
  })

  it('shows the newest catch in the scene, the counters and a recap', () => {
    const payload = buildPayload(scenarios.catch!)
    expect(payload).toMatchObject({
      status: 'fishing',
      status_label: 'Casting at River Bend',
      conditions_label: 'dusk, overcast',
      cooler_label: '7/18',
      bait_label: 'Maggots 34',
      attention: null,
      latest_catch: { species_id: 'barbel', name: 'Barbel', weight_label: '1.9 kg' },
      scene_base: `${ART}/art/ia/scene/v4/river_bend/dusk/overcast/noseason/holding/barbel/red_tag`,
      qr_base: `${ART}/art/ia/qr/v1/home`,
      recap: 'Last 12 hours: 7 fish, best 1.9 kg Barbel, 1 got away',
    })
  })

  it('gives the v2 screen its counters, recap facts and newest catch', () => {
    expect(buildPayload(scenarios.catch!)).toMatchObject({
      bait_name: 'Maggots',
      bait_count: 34,
      attention_kind: null,
      recap_items: [{ k: 'catch', text: '7 fish' }, { k: 'best', text: 'Best 1.9 kg Barbel' }, { k: 'got_away', text: '1 got away' }],
      newest_catch: { name: 'Barbel', weight_label: '1.9 kg', released: false, fish_base: `${ART}/art/ia/fish/v1/barbel` },
    })
    // The newest fish is found past a story that is not a catch, and a release says so.
    expect(buildPayload(scenarios.waiting!).newest_catch).toMatchObject({ name: 'Chub' })
    expect(buildPayload(scenarios.coolerFull!)).toMatchObject({ attention_kind: 'cooler', newest_catch: { name: 'Chub', released: true } })
    expect(buildPayload(scenarios.bareHook!)).toMatchObject({ bait_name: 'Bare hook', bait_count: null, attention_kind: 'bait' })
    expect(buildPayload(scenarios.stale!).attention_kind).toBe('service')
  })

  it('keeps a catch on screen when it also earned a title and achievements', () => {
    // Barry's log on 2026-10-10: the Perch fell sixth behind its own level-up (now a title) and three achievements.
    const payload = buildPayload(scenarios.achievements!)
    // Template v7 sends up to sixteen stories; the cast's lines still lead in this order.
    expect(payload.stories.map((s) => s.kind).slice(0, 5)).toEqual(['ambient', 'catch', 'milestone', 'achievement', 'ambient'])
    expect(payload.stories.length).toBeLessThanOrEqual(16)
    expect(payload.stories[1]!.summary).toContain('1.3 kg Perch')
    expect(payload.stories[3]!.summary).toBe('3 achievements: Specimen Perch, First Perch, A Kilo Fish')
    expect(payload.newest_catch).toMatchObject({ name: 'Perch', weight_label: '1.3 kg' })
    // When the cast is the newest moment, the angler holds the fish.
    const fresh = buildPayload({ ...scenarios.achievements!, stories: scenarios.achievements!.stories.slice(1) })
    expect(fresh.stories[0]!.kind).toBe('catch')
    expect(fresh.scene_base).toContain('/holding/perch/')
    // A lone achievement keeps its own line, and lines from different moments keep their order.
    expect(deviceStories([{ kind: 'achievement', summary: 'Achievement: First Bite', at: 2 }, { kind: 'catch', summary: 'x', at: 1 }]).map((s) => s.summary)).toEqual(['Achievement: First Bite', 'x'])
  })

  it('says what needs a hand, most urgent first', () => {
    expect(buildPayload(scenarios.coolerFull!)).toMatchObject({ cooler_full: true, attention: 'Cooler full. Sell in the companion.', qr_base: `${ART}/art/ia/qr/v1/cooler` })
    expect(buildPayload(scenarios.bareHook!)).toMatchObject({ bait_label: 'Bare hook', attention: 'Out of maggots, fishing a bare hook.' })
    expect(buildPayload(scenarios.stale!).attention).toBe('Updates are delayed.')
    expect(buildPayload(scenarios.servicePaused!)).toMatchObject({ data_state: 'service_paused', attention: 'Paused for a service check.' })
    expect(buildPayload(scenarios.travelling!)).toMatchObject({ status: 'travelling', status_label: 'Heading to Harbour Pier' })
    expect(buildPayload(scenarios.paused!).scene_base).toContain('/paused/none/red_tag')
  })

  it('calls a waiting goal reward to the companion after anything that stops the fishing (issue #8)', () => {
    expect(buildPayload(scenarios.goalWaiting!)).toMatchObject({ attention: 'Goal reached! Claim 150 coins in the companion.', attention_kind: 'goal', goal_claim: { count: 1, coins: 150 } })
    expect(buildPayload(scenarios.goalWaitingFull!)).toMatchObject({ attention_kind: 'cooler', goal_claim: { count: 2, coins: 1250 } })
    expect(buildPayload(scenarios.heronLake!)).toMatchObject({ goal_claim: null })
  })

  it('asks for setup before the angler is active', () => {
    expect(buildPayload(scenarios.pending!)).toMatchObject({ status: 'pending', status_label: 'Waiting for TRMNL Save', alias: 'Wren' })
    expect(buildPayload(scenarios.unlinked!)).toMatchObject({ status: 'unlinked', alias: null })
    // Template v15: the welcome shows the angler's water, or the first one before there is an angler, with no catch or fly.
    expect(buildPayload(scenarios.pending!).scene_base).toContain('/river_bend/dusk/overcast/noseason/waiting/none/nofly')
    expect(buildPayload(scenarios.unlinked!).scene_base).toContain('/millpond/dusk/overcast/noseason/waiting/none/nofly')
  })

  it('leaves image fields empty without an art origin', () => {
    expect(buildPayload({ ...scenarios.catch!, artBaseUrl: null })).toMatchObject({ scene_base: '', qr_base: '' })
  })

  it('drops stories older than twelve hours from the recap', () => {
    const old = { ...scenarios.catch!, stories: scenarios.catch!.stories.map((s) => ({ ...s, at: PREVIEW_NOW - 13 * 3_600_000 })) }
    expect(buildPayload(old).recap).toBeNull()
  })
})

describe('Idle Angler markup', () => {
  const liquid = new Liquid({ timezoneOffset: 0 })

  it('uses no inline style and starts at the layout, not a second view', () => {
    for (const markup of Object.values(screenMarkup)) {
      expect(markup).not.toMatch(/style=/)
      expect(markup).not.toMatch(/class="view/)
      expect(markup).toMatch(/class="title_bar portrait:hidden"/)
    }
  })

  it('lets the framework repaint every mark in the theme ink, but not scenes, fish or codes (D181)', async () => {
    for (const [name, input] of Object.entries(scenarios)) {
      const payload = { ...buildPayload(input), fly_code: '482 917' }
      for (const [layout, markup] of Object.entries(screenMarkup)) {
        const html = (await liquid.parseAndRender(markup, payload)).replace(/<script>[\s\S]*?<\/script>/g, '')
        for (const [, classes, src] of html.matchAll(/<img class="([^"]*)"[^>]* src="([^"]*)"/g)) {
          expect(classes!.split(' ').includes('image--adaptive'), `${name} ${layout} ${src!.slice(0, 50)}`).toBe(src!.startsWith('data:'))
        }
      }
    }
  })

  it('escapes the public name in every layout', async () => {
    const payload = { ...buildPayload({ ...scenarios.catch!, angler: { ...scenarios.catch!.angler!, alias: '<b>x</b>' } }), fly_code: null }
    for (const markup of Object.values(screenMarkup)) {
      const html = await liquid.parseAndRender(markup, payload)
      expect(html).not.toContain('<b>x</b>')
      expect(html).toContain('&lt;b&gt;x&lt;/b&gt;')
    }
  })

  it('leads each story with its glyph and sets the recap as facts', async () => {
    const html = await liquid.parseAndRender(screenMarkup.markup, { ...buildPayload(scenarios.catch!), fly_code: null })
    expect(html).toContain('data-story="catch"')
    expect(html).toContain('data-story="ambient"')
    expect(html).toContain('data-story="got_away"')
    expect(html).toContain('data-recap-item="best"')
    expect(html).toContain('data-band="dusk"')
    expect(html).toContain('data-weather="overcast"')
    expect(html).toContain('data-catch="true"')
    // Template v18: no progress ticks; the title stays beside the name.
    expect(html).not.toContain('data-xp-ticks')
    expect(html).toContain('Old Hand')
    expect(buildPayload(scenarios.catch!)).toMatchObject({ title: 'Old Hand', title_next_at: 20, board: { label: 'This week', rank_label: '#3, best 1.9 kg', rows: [{ rank: 1, weight_label: '5.2 kg' }, {}, { rank: 3, own: true }, {}, {}] } })
    expect(buildPayload(scenarios.outsideTop!).board?.rows.at(-1)).toMatchObject({ rank: 19, weight_label: '610 g', own: true })
    expect(buildPayload(scenarios.unranked!).board?.rank_label).toBe('No fish here this week yet')
    const full = await liquid.parseAndRender(screenMarkup.markup, { ...buildPayload(scenarios.coolerFull!), fly_code: null })
    expect(full).toContain('data-attention="cooler"')
  })

  it('shows a waiting goal reward once in every layout, and the next goal again once it is claimed (issue #8)', async () => {
    for (const [layout, markup] of Object.entries(screenMarkup)) {
      const one = await liquid.parseAndRender(markup, { ...buildPayload(scenarios.goalWaiting!), fly_code: null })
      expect(one, layout).toContain('data-attention="goal"')
      expect(one, layout).not.toContain('data-goal-claim')
      expect(one, layout).not.toContain('data-goal="true"')
    }
    const full = await liquid.parseAndRender(screenMarkup.markup, { ...buildPayload(scenarios.goalWaitingFull!), fly_code: null })
    expect(full).toContain('data-attention="cooler"')
    expect(full).toMatch(/data-goal-claim="true"[^]*2 goals reached! Claim 1250 coins in the companion\./)
    const claimed = await liquid.parseAndRender(screenMarkup.markup, { ...buildPayload(scenarios.medal!), fly_code: null })
    expect(claimed).not.toContain('data-goal-claim')
    expect(claimed).toMatch(/data-goal="true"[^]*Goal:<\/span><span[^>]*>Book a deep-sea charter<\/span>/)
  })

  it('times each story in the owner\'s clock, and leaves the times off without an offset (template v15)', async () => {
    const payload = buildPayload(scenarios.catch!)
    expect(payload.stories[0]).toMatchObject({ u: Math.floor((PREVIEW_NOW - 5 * 60_000) / 1000) })
    for (const [layout, markup] of Object.entries(screenMarkup)) {
      const timed = await liquid.parseAndRender(markup, { ...payload, fly_code: null, utc_offset: 3600 })
      expect(timed, layout).toMatch(/data-story-time="true">18:45</)
      const plain = await liquid.parseAndRender(markup, { ...payload, fly_code: null })
      expect(plain, layout).not.toContain('data-story-time')
    }
  })

  it('turns the dock code into the waiting fly\'s claim link with its code, but never a full cooler\'s (D180)', async () => {
    const fly = { fly_code: '482 917', fly_qr_base: 'https://art.test/art/ia/qr/v1/fly/482917' }
    for (const [layout, markup] of Object.entries(screenMarkup)) {
      const html = await liquid.parseAndRender(markup, { ...buildPayload(scenarios.catch!), ...fly })
      expect(html, layout).toContain('src="https://art.test/art/ia/qr/v1/fly/482917/')
      expect(html, layout).not.toMatch(/qr\/v1\/home\//)
      expect(html, layout).toMatch(/data-fly-caption="true"[^>]*>Fly&nbsp;482&nbsp;917<\/span>/)
      const cooler = await liquid.parseAndRender(markup, { ...buildPayload(scenarios.coolerFull!), ...fly })
      expect(cooler, layout).not.toContain('qr/v1/fly/')
      expect(cooler, layout).not.toContain('data-fly-caption')
      const older = await liquid.parseAndRender(markup, { ...buildPayload(scenarios.catch!), fly_code: '482 917' })
      expect(older, layout).not.toContain('qr/v1/fly/')
    }
    const { flyQrBase, renderIdleAnglerArt } = await import('@trmnl-games/idle-angler/art/route')
    expect(flyQrBase('482 917')).toBe('/art/ia/qr/v1/fly/482917')
    expect(flyQrBase('4829')).toBeNull()
    expect(renderIdleAnglerArt('/art/ia/qr/v1/fly/482917/3.png', 'https://trmnlgames.com')).not.toBeNull()
    for (const bad of ['/art/ia/qr/v1/fly/48291/3.png', '/art/ia/qr/v1/fly/482917/9.png', '/art/ia/qr/v2/fly/482917/3.png']) expect(renderIdleAnglerArt(bad, 'https://trmnlgames.com')).toBeNull()
  })

  it('renders every preview state in every layout without Liquid errors', async () => {
    for (const input of Object.values(scenarios)) for (const markup of Object.values(screenMarkup)) await liquid.parseAndRender(markup, { ...buildPayload(input), fly_code: null })
  })
})
