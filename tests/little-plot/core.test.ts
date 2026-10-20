import { describe, expect, it } from 'vitest'
import { seasonAt as anglerSeasonAt } from '@trmnl-games/idle-angler/sim'
import { contentV2 as anglerContent } from '@trmnl-games/idle-angler/content/v2'
import { contentV1 } from '@trmnl-games/little-plot/content'
import { validateContent } from '@trmnl-games/little-plot/content/validate'
import {
  buyItem,
  buySeed,
  claimGoalReward,
  derivePlotSeeds,
  giveSeed,
  kindOf,
  pick,
  pickAll,
  pointsAtStage,
  receiveSeed,
  seasonAt,
  simulatePlot,
  sow,
  stageOf,
  starterPlot,
  water,
  type PlotState,
  type TickInput,
  type Weather,
} from '@trmnl-games/little-plot/sim'

const content = contentV1
/** Monday 2026-10-19 10:00 UTC: a daytime tick in a spring week on the shared calendar. */
const DAY_AT = Date.UTC(2026, 9, 19, 10)
const NIGHT_AT = Date.UTC(2026, 9, 19, 23)

function tickInput(plot: PlotState, tick: number, overrides: Partial<TickInput> = {}): TickInput {
  return { plot, tick, tickAt: DAY_AT + tick * 15 * 60_000, utcOffsetSeconds: 0, weather: 'clear', content, streams: derivePlotSeeds('seed', 'plot', tick, 1), ...overrides }
}

function run(plot: PlotState, ticks: number, from = 1, overrides: Partial<TickInput> = {}): PlotState {
  let next = plot
  for (let tick = from; tick < from + ticks; tick += 1) next = simulatePlot(tickInput(next, tick, overrides)).plot
  return next
}

describe('content v1', () => {
  it('passes its validator', () => {
    expect(validateContent(content)).toEqual([])
  })

  it('shares the season calendar with Idle Angler, week for week', () => {
    for (let week = 0; week < 12; week += 1) {
      const at = Date.UTC(2026, 9, 19) + week * 7 * 86_400_000 + 5 * 3_600_000
      expect(seasonAt(content, at)).toBe(anglerSeasonAt(anglerContent, at))
    }
  })
})

describe('the plot', () => {
  it('starts with four starters sown, two seeds of each, a tin can and the first goal', () => {
    const plot = starterPlot(content, 0)
    expect(plot.beds.map((b) => b.kindId)).toEqual(['marigold', 'lettuce', 'radish', 'nasturtium'])
    expect(plot.tin).toEqual({ marigold: 2, lettuce: 2, radish: 2, nasturtium: 2 })
    expect(plot.items).toEqual(['tin_can'])
    expect(plot.goal).toEqual({ rung: 0, ticksAtStart: 0 })
    expect(plot.wateredUntilTick).toBe(16)
  })

  it('grows a bed through five stages and enters the kind in the catalogue when it ripens', () => {
    let plot = starterPlot(content, 0)
    const radish = kindOf(content, 'radish')
    const seen = new Set<string>()
    for (let tick = 1; tick <= 40; tick += 1) {
      const result = simulatePlot(tickInput(plot, tick))
      plot = result.plot
      seen.add(stageOf(plot.beds[2]!, radish))
      if (plot.catalogue.radish) break
    }
    expect([...seen]).toEqual(expect.arrayContaining(['sprout', 'leaf', 'bud', 'ripe']))
    expect(plot.catalogue.radish).toMatchObject({ count: 1 })
    expect(plot.counters.ripenings).toBeGreaterThan(0)
    expect(plot.lifetimeXp).toBeGreaterThan(0)
  })

  it('is deterministic: the same input gives the same output', () => {
    const plot = starterPlot(content, 0)
    const a = simulatePlot(tickInput(plot, 7))
    const b = simulatePlot(tickInput(plot, 7))
    expect(a).toEqual(b)
  })

  it('does nothing while paused', () => {
    const plot: PlotState = { ...starterPlot(content, 0), status: 'paused' }
    const result = simulatePlot(tickInput(plot, 1))
    expect(result.disposition).toBe('paused')
    expect(result.plot).toEqual(plot)
    expect(result.events).toEqual([])
  })

  it('grows faster watered and in the rain, and a tender plant pauses in a winter frost', () => {
    const plot = starterPlot(content, 0)
    const dry = { ...plot, wateredUntilTick: 0 }
    const wet = run(plot, 1)
    const unwatered = run(dry, 1)
    expect(wet.beds[0]!.points).toBeGreaterThan(unwatered.beds[0]!.points)
    const rain = run(dry, 1, 1, { weather: 'rain' as Weather })
    expect(rain.beds[0]!.points).toBeGreaterThan(unwatered.beds[0]!.points)
    // A winter week: three weeks on from the spring one, at night, under a clear sky.
    const winterNight = Date.UTC(2026, 10, 9, 23)
    expect(seasonAt(content, winterNight)).toBe('winter')
    const frosted = simulatePlot({ ...tickInput(dry, 1), tickAt: winterNight }).plot
    expect(frosted.beds[0]!.points).toBe(0)
    // Hardy chives grow through it.
    const chives: PlotState = { ...dry, beds: [{ kindId: 'chives', points: 0, sownTick: 0 }], rows: 1, cols: 1 }
    expect(simulatePlot({ ...tickInput(chives, 1), tickAt: winterNight }).plot.beds[0]!.points).toBeGreaterThan(0)
  })
})

describe('going to seed', () => {
  it('a ripe bed left a day puts a seed in the tin and resows itself, and a volunteer never crosses', () => {
    const marigold = kindOf(content, 'marigold')
    let plot: PlotState = { ...starterPlot(content, 0), beds: [{ kindId: 'marigold', points: pointsAtStage(marigold, 'ripe'), sownTick: 0, ripeSinceTick: 1 }, { kindId: 'poppy', points: pointsAtStage(kindOf(content, 'poppy'), 'ripe'), sownTick: 0, ripeSinceTick: 1 }], rows: 1, cols: 2, tin: {}, goal: undefined as never }
    plot = { ...plot, goal: { rung: content.goals.length, ticksAtStart: 0 } }
    const before = plot
    plot = run(plot, 1, content.ripeToSeedTicks + 2)
    expect((plot.tin.marigold ?? 0) + (plot.tin.poppy ?? 0)).toBeGreaterThanOrEqual(1)
    expect(plot.beds[0]!.points).toBe(0)
    expect(plot.beds[0]!.volunteer).toBe(true)
    expect(plot.counters.volunteers).toBe(2)
    expect(before.counters.ripenings).toBe(0)
  })

  it('leaves the seed for the birds when the tin is full of that kind', () => {
    const radish = kindOf(content, 'radish')
    let plot: PlotState = { ...starterPlot(content, 0), beds: [{ kindId: 'radish', points: pointsAtStage(radish, 'ripe'), sownTick: 0, ripeSinceTick: 1 }], rows: 1, cols: 1, tin: { radish: content.tinCap } }
    plot = { ...plot, goal: { rung: content.goals.length, ticksAtStart: 0 } }
    const result = simulatePlot(tickInput(plot, content.ripeToSeedTicks + 2))
    expect(result.plot.tin.radish).toBe(content.tinCap)
    expect(result.events.some((e) => e.kind === 'seeded' && e.summary.includes('left for the birds'))).toBe(true)
  })
})

describe('crossing', () => {
  it('a marigold ripening beside a poppy at bud sets a Moon Marigold seed when the draw hits, and the harvest returns it', () => {
    const marigold = kindOf(content, 'marigold')
    const poppy = kindOf(content, 'poppy')
    const base: PlotState = {
      ...starterPlot(content, 0),
      rows: 1,
      cols: 2,
      beds: [
        { kindId: 'marigold', points: pointsAtStage(marigold, 'ripe') - 1, sownTick: 0 },
        { kindId: 'poppy', points: pointsAtStage(poppy, 'bud'), sownTick: 0 },
      ],
      tin: {},
      goal: { rung: 7, ticksAtStart: 0 },
    }
    // Goal 8 ("Find a cross") guarantees the first adjacent pair crosses.
    const result = simulatePlot(tickInput(base, 1))
    expect(result.plot.beds[0]!.crossedKindId).toBe('moon_marigold')
    expect(result.events.some((e) => e.kind === 'cross')).toBe(true)
    expect(result.plot.counters.crossesFound).toBe(1)
    const picked = pick(result.plot, content, 0, 2, DAY_AT)
    expect(picked.ok).toBe(true)
    if (picked.ok) {
      expect(picked.plot.tin.moon_marigold).toBe(1)
      expect(picked.plot.gold).toBe(marigold.coins)
      expect(picked.events[0]!.summary).toContain("a kind you haven't grown")
    }
  })

  it('a cross draw without the guarantee follows the chance, and the beehive doubles it', () => {
    const marigold = kindOf(content, 'marigold')
    const poppy = kindOf(content, 'poppy')
    const make = (items: string[]): PlotState => ({
      ...starterPlot(content, 0),
      rows: 1,
      cols: 2,
      items,
      beds: [
        { kindId: 'marigold', points: pointsAtStage(marigold, 'ripe') - 1, sownTick: 0 },
        { kindId: 'poppy', points: pointsAtStage(poppy, 'bud'), sownTick: 0 },
      ],
      goal: { rung: content.goals.length, ticksAtStart: 0 },
    })
    const rate = (items: string[]) => {
      let hits = 0
      for (let i = 0; i < 400; i += 1) if (simulatePlot({ ...tickInput(make(items), 1), streams: derivePlotSeeds('seed', `p${i}`, 1, 1) }).plot.beds[0]!.crossedKindId) hits += 1
      return hits / 400
    }
    const plain = rate(['tin_can'])
    const bees = rate(['tin_can', 'beehive'])
    expect(plain).toBeGreaterThan(0.15)
    expect(plain).toBeLessThan(0.35)
    expect(bees).toBeGreaterThan(plain * 1.5)
  })
})

describe('actions', () => {
  it('sows from the tin, refuses an occupied bed and an empty tin, waters once per can, and claims goals', () => {
    let plot = starterPlot(content, 0)
    const picked = pick(plot, content, 0, 1, DAY_AT)
    expect(picked.ok).toBe(false)
    plot = { ...plot, beds: plot.beds.map((b, i) => (i === 0 ? { points: 0, sownTick: 0 } : b)) }
    expect(sow(plot, content, 1, 'marigold', 1).ok).toBe(false)
    expect(sow(plot, content, 0, 'sunflower', 1).ok).toBe(false)
    const sown = sow(plot, content, 0, 'marigold', 1)
    expect(sown.ok).toBe(true)
    if (sown.ok) {
      plot = sown.plot
      expect(plot.tin.marigold).toBe(1)
      expect(plot.counters.sowings).toBe(1)
    }
    expect(water(plot, content, 0).ok).toBe(false)
    const watered = water({ ...plot, wateredUntilTick: 0 }, content, 1)
    expect(watered.ok).toBe(true)
    if (watered.ok) expect(watered.plot.wateredUntilTick).toBe(17)
  })

  it('picks a ripe bed for coins and seeds, more in autumn, and picks all at once', () => {
    const radish = kindOf(content, 'radish')
    const plot: PlotState = { ...starterPlot(content, 0), beds: [{ kindId: 'radish', points: pointsAtStage(radish, 'ripe'), sownTick: 0, ripeSinceTick: 1 }, { kindId: 'radish', points: pointsAtStage(radish, 'ripe'), sownTick: 0, ripeSinceTick: 1 }, { points: 0, sownTick: 0 }, { points: 0, sownTick: 0 }], tin: {} }
    const spring = pick(plot, content, 0, 2, DAY_AT)
    expect(spring.ok && spring.plot.gold).toBe(radish.coins)
    // Picked fresh: one more seed than the kind returns.
    expect(spring.ok && spring.plot.tin.radish).toBe(radish.seeds + 1)
    const autumnAt = Date.UTC(2026, 10, 2, 10)
    expect(seasonAt(content, autumnAt)).toBe('autumn')
    const autumn = pick(plot, content, 0, 2, autumnAt)
    expect(autumn.ok && autumn.plot.gold).toBe(Math.round((radish.coins * content.autumnCoinsPercent) / 100))
    const all = pickAll(plot, content, 2, DAY_AT)
    expect(all.ok && all.plot.gold).toBe(radish.coins * 2)
    expect(all.ok && all.plot.beds.every((b) => b.kindId === undefined)).toBe(true)
  })

  it('sells seeds and items by level, never a rare seed, and grows the plot when beds are bought', () => {
    const plot: PlotState = { ...starterPlot(content, 0), gold: 10_000, level: 1 }
    expect(buySeed(plot, content, 'poppy', 1).ok).toBe(false)
    expect(buySeed({ ...plot, level: 2 }, content, 'poppy', 1).ok).toBe(true)
    expect(buySeed({ ...plot, level: 2 }, content, 'tomato', 1).ok).toBe(false)
    expect(buySeed({ ...plot, level: 3 }, content, 'tomato', 1).ok).toBe(true)
    expect(buySeed({ ...plot, level: 20 }, content, 'moon_marigold', 1).ok).toBe(false)
    expect(buyItem(plot, content, 'fence', 1).ok).toBe(false)
    const fenced = buyItem({ ...plot, level: 3 }, content, 'fence', 1)
    expect(fenced.ok && fenced.plot.items).toContain('fence')
    expect(buyItem({ ...plot, level: 3 }, content, 'beds_9', 1).ok).toBe(false)
    const six = buyItem(plot, content, 'beds_6', 1)
    expect(six.ok && six.plot.beds.length).toBe(6)
    expect(six.ok && [six.plot.rows, six.plot.cols]).toEqual([2, 3])
    expect(six.ok && buyItem(six.plot, content, 'beds_6', 1).ok).toBe(false)
  })

  it('claims goal rewards one at a time and the first goal is met by a sprout', () => {
    let plot = starterPlot(content, 0)
    plot = run(plot, 12)
    expect(plot.goal!.rung).toBeGreaterThanOrEqual(1)
    const claim = claimGoalReward(plot)
    expect(claim.ok).toBe(true)
    if (claim.ok) {
      expect(claim.plot.gold).toBe(content.goals[0]!.coins)
      expect(claim.reward.id).toBe('first_sprout')
    }
  })

  it('sends a cutting out of the tin and receives a tagged seed, within the tag cap', () => {
    let plot = starterPlot(content, 0)
    const sent = giveSeed(plot, content, 'marigold')
    expect(sent.ok && sent.plot.tin.marigold).toBe(1)
    expect(sent.ok && sent.plot.counters.cuttingsSent).toBe(1)
    plot = receiveSeed(plot, content, 'daisy', 'Wren', true)
    expect(plot.tin.daisy).toBe(1)
    expect(plot.tags).toEqual([{ kindId: 'daisy', from: 'Wren', cutting: true }])
    for (let i = 0; i < 12; i += 1) plot = receiveSeed(plot, content, 'daisy', `P${i}`, false)
    expect(plot.tags.length).toBe(content.tagCap)
    expect(plot.counters.gnomesHosted).toBe(12)
  })
})

describe('pests and visitors', () => {
  it('a plot with nothing to take sees setbacks but never loses a plant, and defences lower the rate', () => {
    const count = (items: string[], nights: number) => {
      let plot: PlotState = { ...starterPlot(content, 0), items, goal: { rung: content.goals.length, ticksAtStart: 0 } }
      let pests = 0
      for (let tick = 1; tick <= nights * 96; tick += 1) {
        const result = simulatePlot({ ...tickInput(plot, tick), tickAt: NIGHT_AT + tick * 15 * 60_000 })
        plot = result.plot
        pests += result.events.filter((e) => e.kind === 'pest').length
        expect(plot.beds.filter((b) => b.kindId !== undefined).length).toBeGreaterThanOrEqual(4)
      }
      return pests
    }
    const bare = count(['tin_can'], 20)
    const fenced = count(['tin_can', 'fence', 'copper_tape', 'netting', 'scarecrow', 'lantern', 'garden_cat'], 20)
    expect(bare).toBeGreaterThan(fenced)
  })

  it('rolls a visiting gnome only at night and hands the adapter a plan, less often with the lantern and the cat', () => {
    const visits = (items: string[]) => {
      let n = 0
      for (let i = 0; i < 2000; i += 1) {
        const plot: PlotState = { ...starterPlot(content, 0), items, goal: { rung: content.goals.length, ticksAtStart: 0 } }
        if (simulatePlot({ ...tickInput(plot, 1), tickAt: NIGHT_AT, streams: derivePlotSeeds('seed', `v${i}`, 1, 1) }).visit) n += 1
      }
      return n
    }
    expect(simulatePlot(tickInput(starterPlot(content, 0), 1)).visit).toBeUndefined()
    const open = visits(['tin_can'])
    const lit = visits(['tin_can', 'lantern', 'garden_cat'])
    expect(open).toBeGreaterThan(10)
    expect(lit).toBeLessThan(open / 2)
  })
})
