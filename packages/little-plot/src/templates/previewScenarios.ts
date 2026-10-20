import { contentV1 } from '../content'
import type { LittlePlotPayloadInput, PayloadStory } from '../lib/payload'
import { kindOf, pointsAtStage, starterPlot } from '../sim'
import type { PlotState } from '../sim/types'

/**
 * Every device state through the real payload builder (little-plot.md "Device", G3): a growing plot with a board, a
 * big 3 × 4 plot with every structure and a gnome, half the beds ripe, a waiting goal, winter frost at night, a paused
 * plot, a service pause, a pending plot, a brand new one and long names on every line for the worst case.
 */
/** Monday 2026-10-19 10:10 UTC, a spring week on the shared calendar. */
const NOW = Date.UTC(2026, 9, 19, 10, 10)
const WINTER_NIGHT = Date.UTC(2026, 10, 9, 23, 10)
const HOUR = 3_600_000
const base = starterPlot(contentV1, 0)

const story = (kind: string, summary: string, minutesAgo: number, extra: Partial<PayloadStory> = {}): PayloadStory => ({ kind, summary, at: NOW - minutesAgo * 60_000, ...extra })

const STORIES: PayloadStory[] = [
  story('ripe', 'The Radish is ripe. Pick it in the companion.', 5, { kindId: 'radish' }),
  story('stage', 'The Marigold is in bud.', 5),
  story('pest', 'Slugs in the night. The Lettuce is a stage back.', 20, { effect: 'slugs' }),
  story('visit', "A gnome in a red hat left with a Cornflower seed. [[Wren]]'s garden, by the look of it.", 65),
  story('cross', "The Marigold by the Poppy has set a seed you don't recognise.", 95),
  story('ambient', 'The robin is back on the fork handle.', 125),
  story('seeded', 'The Daisy went to seed and sowed itself again. A seed is in the tin.', 185),
  story('achievement', 'Achievement: First Pick', 240, { title: 'First Pick' }),
  story('achievement', 'Achievement: Tin Can', 240, { title: 'Tin Can' }),
  story('goal', 'Goal reached: Grow all four starters. Next: Buy a seed in the shed.', 300),
  story('level', 'Level 3. The plot is coming on.', 300),
  story('frost', 'Frost on the Silver Lavender. In the morning there is a seed on the soil that was not there before.', 420),
  story('pest', 'A gnome in the trap this morning, furious. It gave everything back and was let go.', 480, { effect: 'gnome_caught' }),
  story('stage', 'The Nasturtium is up.', 540),
  story('ambient', 'Mist on the Millpond. The plot is quiet.', 600),
  story('ripe', 'The Lettuce is ripe, and the bed is waiting.', 660, { kindId: 'lettuce' }),
]

const LONG_STORIES: PayloadStory[] = Array.from({ length: 16 }, (_, i) => story(i % 2 ? 'visit' : 'pest', "A gnome from [[Quillfeather_Longname]]'s garden wandered round the beds in the night and left with a Golden Sunflower seed, which it should not have had.", 10 + i * 30, { effect: 'gnome_seed' }))

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

type Scenario = LittlePlotPayloadInput

const at = (kindId: string, stage: 'sown' | 'sprout' | 'leaf' | 'bud' | 'ripe', extra: Partial<PlotState['beds'][number]> = {}) => ({ kindId, points: pointsAtStage(kindOf(contentV1, kindId), stage), sownTick: 0, ...(stage === 'ripe' ? { ripeSinceTick: 0 } : {}), ...extra })

export function previewScenarios(artBaseUrl: string | null): Record<string, Scenario> {
  const world = { createdAt: NOW - HOUR, lastCompletedAt: NOW - 60_000, paused: false, currentTick: 400 }
  const active = (state: PlotState, extra: Partial<Scenario> = {}): Scenario => ({
    content: contentV1,
    now: NOW,
    world,
    plot: { alias: 'Mo', state, activationState: 'active', quarantined: false, flowers: 3 },
    weather: 'rain',
    utcOffsetSeconds: 3600,
    stories: STORIES,
    board: BOARD,
    artBaseUrl,
    ...extra,
  })
  const growing: PlotState = { ...base, level: 6, xp: 40, gold: 312, wateredUntilTick: 420, rows: 2, cols: 3, items: ['tin_can', 'beds_6', 'copper_tape', 'fence'], tin: { marigold: 4, poppy: 2, radish: 6, lettuce: 3 }, beds: [at('radish', 'ripe'), at('marigold', 'bud'), at('lettuce', 'sprout'), at('poppy', 'leaf'), at('nasturtium', 'sown'), { points: 0, sownTick: 0 }], goal: { rung: 6, ticksAtStart: 300 } }
  const big: PlotState = {
    ...growing,
    level: 14,
    gold: 4820,
    rows: 3,
    cols: 4,
    items: ['tin_can', 'brass_can', 'hose', 'beds_6', 'beds_9', 'beds_12', 'copper_tape', 'netting', 'fence', 'scarecrow', 'lantern', 'garden_cat', 'gnome_trap', 'pond', 'beehive', 'bird_table', 'compost_bin', 'bench', 'path', 'decoy_gnome', 'sundial', 'wind_chimes', 'greenhouse'],
    beds: [at('moon_marigold', 'ripe', { crossedKindId: 'moonflower' }), at('ghost_pansy', 'bud'), at('tomato', 'leaf'), at('foxglove', 'bud'), at('pumpkin', 'bud', { greenhouse: true }), at('sunflower', 'ripe'), at('honey_pea', 'bud'), at('lavender', 'leaf'), at('daisy', 'sprout'), at('carrot', 'sown'), at('chives', 'ripe'), { points: 0, sownTick: 0 }],
    goal: { rung: 14, ticksAtStart: 300 },
  }
  return {
    growing: active(growing),
    big: active(big, { weather: 'clear', stories: [story('visit', "A gnome in a red hat left with a Daisy seed. [[Wren]]'s garden, by the look of it.", 3), ...STORIES] }),
    ripe: active({ ...growing, beds: [at('radish', 'ripe'), at('marigold', 'ripe'), at('lettuce', 'ripe'), at('poppy', 'leaf'), at('nasturtium', 'sown'), { points: 0, sownTick: 0 }] }, { weather: 'overcast' }),
    claim: active({ ...growing, goal: { rung: 7, ticksAtStart: 300, unclaimed: [{ id: 'buy_seed', coins: 30 }, { id: 'poppy_marigold', coins: 50 }] } }, { board: null }),
    // A brand new plot: four beds sown, no board, one line.
    new: active({ ...base }, { stories: [story('stage', 'The Radish is up.', 12)], board: null, weather: 'clear', plot: { alias: 'Mo', state: base, activationState: 'active', quarantined: false, flowers: 0 } }),
    frost: active({ ...growing, items: [...growing.items, 'lantern'] }, { now: WINTER_NIGHT, weather: 'clear', world: { ...world, lastCompletedAt: WINTER_NIGHT - 60_000 }, stories: STORIES.map((s) => ({ ...s, at: s.at - (NOW - WINTER_NIGHT) })) }),
    fog: active(growing, { weather: 'fog', now: Date.UTC(2026, 9, 19, 5, 40), world: { ...world, lastCompletedAt: Date.UTC(2026, 9, 19, 5, 39) } }),
    paused: active({ ...growing, status: 'paused' }),
    service: active(growing, { world: { ...world, paused: true } }),
    'long-names': active({ ...big, items: big.items }, { plot: { alias: 'Quillfeather_Longname', state: big, activationState: 'active', quarantined: false, flowers: 24 }, stories: LONG_STORIES, board: { top: BOARD.top.map((r) => ({ ...r, name: 'Quillfeather_Longname', own: false })), own: { rank: 99, total: 1200 } } }),
    pending: { ...active(base), plot: { alias: 'Mo', state: base, activationState: 'pending_trmnl', quarantined: false, flowers: 0 } },
    unlinked: { ...active(base), plot: null },
  }
}
