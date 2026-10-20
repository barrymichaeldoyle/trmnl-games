import { describe, expect, it } from 'vitest'
import { LOCALES, type Locale } from '@trmnl-games/platform'
import { contentV6 as content } from '@trmnl-games/idle-angler/content'
import { ACHIEVEMENTS } from '@trmnl-games/idle-angler/content/achievements'
import { IA_LANGUAGES, anglerWords } from '@trmnl-games/idle-angler/i18n'
import { FIXED_LINES } from '@trmnl-games/idle-angler/i18n/lines'
import { describeOrder, simulateAngler, starterAngler, teachingHint, waterOf, type AnglerState, type BaitClass, type WaterId } from '@trmnl-games/idle-angler/sim'
import { deriveAnglerSeeds, forecast } from '@trmnl-games/idle-angler/sim/seed'

/** Every story shape the simulator writes: rich anglers at every water on every bait, a few days each, in every season. */
function simulatedLines(): string[] {
  const lines = new Set<string>()
  const start = Date.UTC(2026, 9, 19, 0, 5)
  const waters = content.waters.map((w) => w.id)
  for (let i = 0; i < waters.length * 8; i++) {
    const water = waters[i % waters.length]! as WaterId
    const baits = waterOf(content, water).baits
    const bait = baits[Math.floor(i / waters.length) % baits.length] as BaitClass
    let angler: AnglerState = { ...starterAngler(content, 0), rodTier: 1 + (i % 5), coolerTier: 1 + (i % 4), gold: 50_000, waterId: water, baitOnHook: bait, bait: { [bait]: 40 }, access: ['waders', 'pier_permit', 'rowing_boat', 'ice_auger'], charterCasts: 400 }
    let cooler = i % 3 === 0 ? 30 : 0
    const offset = (i % 4) * 7 * 96
    for (let tick = 1 + offset; tick <= 96 * 3 + offset; tick++) {
      const at = start + tick * 15 * 60_000
      const result = simulateAngler({ angler, coolerCount: cooler, tick, tickAt: at, weather: forecast(`l${i}`, waterOf(content, angler.travelTo ?? angler.waterId), at, content), content, streams: deriveAnglerSeeds(`l${i}`, `a${i}`, tick, 1) })
      angler = result.angler
      if (result.catch) cooler++
      for (const event of [result.event, ...(result.extraEvents ?? [])]) if (event) lines.add(event.summary)
    }
  }
  return [...lines]
}

/** Lines the backend writes (anglers.ts, full.ts, tick.ts, achievements.ts), in their exact English shapes. */
const BACKEND_LINES = [
  'Sold 6 fish for 312 coins.', 'Sold 1 fish for 22 coins.', 'Bought the Carbon Rod.', 'Bought the Cool Box.', 'Bought the Pier Permit.', 'Bought 1 tub of worms.', 'Bought 3 tubs of mackerel strip.',
  'Put maggots on the hook.', 'Packing up for the Harbour Pier.', 'Packing up for River Bend.', 'Rod on the rest. Fishing paused.', 'Line back in the water.', 'Claimed 10 coins for a goal: Land your first fish.',
  'Handed a Roach to the fishmonger for 61 coins.', 'Handed 2 Roach and Rudd to the fishmonger for 120 coins.', 'Asked the fishmonger for a different order.', 'A 250 g Dace goes in the deadbait box.', 'The 2.6 kg Tench goes up on the wall.',
  'The wall now has 12 pegs.', 'Booked a charter for 96 casts.', 'Entered the Perch Open at the Millpond with 640 g.', 'Gold in the Chub Open at River Bend with 2.1 kg. 500 coins.', 'Bronze in the Mirror Carp Open at Heron Lake with 12.4 kg. 150 coins.',
  'Achievement: First Bite', 'Achievement: Specimen Perch', '3 achievements: Specimen Perch, First Perch, A Kilo Fish', 'You set up on the bank of the Millpond.',
]

const lines = [...simulatedLines(), ...BACKEND_LINES]
const others = LOCALES.filter((l): l is Exclude<Locale, 'en'> => l !== 'en')

describe('Idle Angler in every language (D200)', () => {
  it('reads every English story back into its parts and tells it again unchanged', { timeout: 30_000 }, () => {
    expect(lines.length).toBeGreaterThan(300)
    const en = anglerWords('en')
    const changed = lines.filter((line) => en.retell(line) !== line).map((line) => [line, en.retell(line)])
    expect(changed).toEqual([])
  })

  it.each(others)('translates every story into %s', { timeout: 30_000 }, (locale) => {
    const words = anglerWords(locale)
    const untranslated = lines.filter((line) => words.story(line) === line)
    expect(untranslated).toEqual([])
    expect(lines.map((line) => words.story(line)).filter((line) => /undefined|NaN|\{|\}/.test(line))).toEqual([])
  })

  it.each(others)('gives %s every name, goal, achievement and fixed line', (locale) => {
    const lang = IA_LANGUAGES[locale]
    const en = IA_LANGUAGES.en
    for (const key of ['species', 'waters', 'baits', 'rods', 'coolers', 'access', 'titles', 'waterRanks', 'flies', 'goals', 'achievements', 'achievementFamilies'] as const) expect(Object.keys(lang[key]).sort(), key).toEqual(Object.keys(en[key]).sort())
    expect(Object.keys(lang.lines).sort()).toEqual([...new Set(FIXED_LINES)].sort())
    for (const def of ACHIEVEMENTS) expect(anglerWords(locale).achievement(def.id).name).not.toBe(def.name)
  })

  it.each(others)('translates the slate and its hints into %s', (locale) => {
    const words = anglerWords(locale)
    const orders = [
      { id: 'a', kind: 'species' as const, count: 2, speciesId: 'roach', bonus: 20 },
      { id: 'b', kind: 'weight' as const, count: 1, minGrams: 1500, bonus: 40 },
      { id: 'c', kind: 'water' as const, count: 3, water: 'river_bend' as const, bonus: 30 },
      { id: 'd', kind: 'time' as const, count: 2, bands: ['dawn', 'dusk'] as const, bonus: 30 },
      { id: 'e', kind: 'rarity' as const, count: 1, rarity: 'uncommon' as const, bonus: 50 },
      { id: 'f', kind: 'teaching' as const, count: 1, speciesId: 'grayling', bonus: 60 },
    ]
    for (const order of orders) {
      const line = describeOrder(content, order as never)
      expect(words.text(line), line).not.toBe(line)
      const hint = teachingHint(content, order as never)
      if (hint) expect(words.text(hint), hint).not.toBe(hint)
    }
    for (const line of FIXED_LINES) expect(words.text(line)).toBe(IA_LANGUAGES[locale].lines[line])
  })
})
