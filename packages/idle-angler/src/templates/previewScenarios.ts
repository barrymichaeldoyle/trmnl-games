import { contentV1 } from '../content/v1'
import { contentV2 } from '../content/v2'
import type { IdleAnglerPayloadInput, PayloadAngler, PayloadStory } from '../lib/payload'

/**
 * Device states for the layout matrix (idle-angler.md "Device"): every status, the attention lines, the longest text
 * and each water. Shared by the local preview tool and its tests.
 */
export const PREVIEW_NOW = Date.UTC(2026, 10, 2, 17, 50)
const minutes = (n: number) => PREVIEW_NOW - n * 60_000
/** Content v2's world seasons (one a week from Monday 19 Oct 2026, spring): a summer Tuesday, a winter Wednesday, a spring Saturday. */
const V2_SUMMER = Date.UTC(2026, 9, 27, 17, 50)
const V2_WINTER = Date.UTC(2026, 10, 11, 9, 0)
const V2_SPRING_SATURDAY = Date.UTC(2026, 9, 24, 12, 0)

const angler: PayloadAngler = {
  alias: 'Wren',
  activationState: 'active',
  status: 'fishing',
  quarantined: false,
  gold: 1240,
  waterId: 'river_bend',
  rodTier: 2,
  coolerTier: 3,
  baitOnHook: 'maggots',
  bait: { maggots: 34, worms: 12 },
  speciesLogged: 17,
  fly: 'red_tag',
}

const stories: PayloadStory[] = [
  { kind: 'catch', summary: 'A 1.9 kg Barbel took the maggots at dusk. A new personal best.', at: minutes(5), speciesId: 'barbel', grams: 1900 },
  { kind: 'ambient', summary: 'A kingfisher flashes past, low and blue.', at: minutes(65) },
  { kind: 'catch', summary: 'A 410 g Chub took the maggots in the day.', at: minutes(140), speciesId: 'chub', grams: 410 },
  { kind: 'got_away', summary: 'Something heavy took the maggots and kept going.', at: minutes(200) },
  { kind: 'catch', summary: 'A 230 g Dace took the maggots in the day.', at: minutes(260), speciesId: 'dace', grams: 230 },
  // Template v7 shows as many stories as fit, so the matrix sends the payload's full sixteen.
  { kind: 'ambient', summary: 'Leaves drift down the main flow.', at: minutes(330) },
  { kind: 'catch', summary: 'A 620 g Grayling took the maggots in the day.', at: minutes(400), speciesId: 'grayling', grams: 620 },
  { kind: 'catch', summary: 'A 1.1 kg Chub took the maggots in the day.', at: minutes(470), speciesId: 'chub', grams: 1100 },
  { kind: 'ambient', summary: 'Water chatters over the gravel run.', at: minutes(540) },
  { kind: 'catch', summary: 'A 90 g Gudgeon took the maggots at first light.', at: minutes(610), speciesId: 'gudgeon', grams: 90 },
  { kind: 'release', summary: 'Cooler full. Released a 340 g Dace.', at: minutes(680), speciesId: 'dace', grams: 340 },
  { kind: 'ambient', summary: 'A trout rises once, out of reach.', at: minutes(750) },
  { kind: 'catch', summary: 'A 1.4 kg Barbel took the maggots in the dark.', at: minutes(820), speciesId: 'barbel', grams: 1400 },
  { kind: 'ambient', summary: 'The far bank is all willow roots.', at: minutes(890) },
  { kind: 'catch', summary: 'A 180 g Dace took the maggots in the dark.', at: minutes(960), speciesId: 'dace', grams: 180 },
  { kind: 'got_away', summary: 'Something heavy took the maggots and kept going.', at: minutes(1030) },
]

const base: IdleAnglerPayloadInput = {
  content: contentV1,
  now: PREVIEW_NOW,
  world: { createdAt: PREVIEW_NOW - 86_400_000, lastCompletedAt: PREVIEW_NOW - 4 * 60_000, paused: false },
  angler,
  coolerUsed: 7,
  weather: 'overcast',
  band: 'dusk',
  stories,
  artBaseUrl: 'https://local-art.invalid',
  board: {
    rank: 3,
    ownGrams: 1900,
    top: [
      { rank: 1, name: 'Quillfeather_Longname', grams: 5240, own: false },
      { rank: 2, name: 'Mo', grams: 3410, own: false },
      { rank: 3, name: 'Wren', grams: 1900, own: true },
      { rank: 4, name: 'Hidden player', grams: 1630, own: false },
      { rank: 5, name: 'Bea', grams: 1120, own: false },
    ],
  },
}

/** A content v2 state at its own moment: the world ticked four minutes before it, and its stories are timed from it. */
function v2At(b: IdleAnglerPayloadInput, now: number, state: Partial<IdleAnglerPayloadInput>): IdleAnglerPayloadInput {
  const shift = now - PREVIEW_NOW
  const stories = (state.stories ?? b.stories).map((story) => ({ ...story, at: story.at + shift }))
  return { ...b, ...state, content: contentV2, now, world: { createdAt: now - 86_400_000, lastCompletedAt: now - 4 * 60_000, paused: false }, stories }
}

export function previewScenarios(artBaseUrl: string): Record<string, IdleAnglerPayloadInput> {
  const b = { ...base, artBaseUrl }
  return {
    catch: b,
    waiting: { ...b, stories: [{ kind: 'ambient', summary: 'The float trots down the crease.', at: minutes(3) }, ...stories.slice(1)] },
    gotAway: { ...b, stories: [stories[3]!, ...stories.slice(0, 3)] },
    coolerFull: { ...b, coolerUsed: 18, stories: [{ kind: 'release', summary: 'Cooler full. Released a 1.2 kg Chub.', at: minutes(4), speciesId: 'chub', grams: 1200 }, ...stories] },
    bareHook: { ...b, angler: { ...angler, bait: { maggots: 0, worms: 12 } } },
    paused: { ...b, angler: { ...angler, status: 'paused' } },
    travelling: { ...b, angler: { ...angler, travelTo: 'harbour_pier' }, stories: [{ kind: 'system', summary: 'Packing up for the Harbour Pier.', at: minutes(2) }, ...stories] },
    pier: { ...b, angler: { ...angler, waterId: 'harbour_pier', rodTier: 4, coolerTier: 4, baitOnHook: 'strip', bait: { strip: 48 }, gold: 18450, speciesLogged: 26 }, coolerUsed: 23, band: 'night', weather: 'fog', stories: [{ kind: 'catch', summary: 'An 8.4 kg Thornback Ray took the mackerel strip in the dark. First Thornback Ray in the logbook.', at: minutes(6), speciesId: 'thornback_ray', grams: 8400 }, ...stories] },
    millpondDawn: { ...b, angler: { ...angler, gold: 0, waterId: 'millpond', rodTier: 1, coolerTier: 1, baitOnHook: 'worms', bait: { worms: 11 }, speciesLogged: 1 }, coolerUsed: 1, band: 'dawn', weather: 'clear', stories: [{ kind: 'catch', summary: 'A 140 g Roach took the worm at first light. First Roach in the logbook.', at: minutes(1), speciesId: 'roach', grams: 140 }, { kind: 'system', summary: 'You set up on the bank of the Millpond.', at: minutes(30) }] },
    // Barry's first morning (2026-10-10): a catch that earned a title and three achievements, then a quiet hour.
    achievements: {
      ...b,
      stories: [
        { kind: 'ambient', summary: 'Midges hang over the water.', at: minutes(2) },
        { kind: 'achievement', summary: 'Achievement: Specimen Perch', title: 'Specimen Perch', at: minutes(62) },
        { kind: 'achievement', summary: 'Achievement: First Perch', title: 'First Perch', at: minutes(62) },
        { kind: 'achievement', summary: 'Achievement: A Kilo Fish', title: 'A Kilo Fish', at: minutes(62) },
        { kind: 'milestone', summary: 'Now a Regular, with 4 species in the logbook.', at: minutes(62) },
        { kind: 'catch', summary: 'A 1.3 kg Perch took the worm in the day. First Perch in the logbook.', at: minutes(62), speciesId: 'perch', grams: 1325 },
        ...stories.slice(1),
      ],
    },
    outsideTop: { ...b, board: { ...b.board!, rank: 19, ownGrams: 610, top: b.board!.top.map((row) => ({ ...row, own: false })) } },
    unranked: { ...b, board: { ...b.board!, rank: null, ownGrams: null, top: b.board!.top.map((row) => ({ ...row, own: false })) } },
    longText: { ...b, angler: { ...angler, alias: 'WWWWWWWWWWWWWWWWWWWW', gold: 999999, coolerTier: 4, speciesLogged: 20 }, coolerUsed: 23, stories: stories.map((s) => ({ ...s, summary: 'An 18.0 kg Conger Eel took the mackerel strip in the dark. A new personal best.' })) },
    stale: { ...b, world: { ...b.world!, lastCompletedAt: PREVIEW_NOW - 90 * 60_000 } },
    servicePaused: { ...b, world: { ...b.world!, paused: true } },
    pending: { ...b, angler: { ...angler, activationState: 'pending_trmnl' }, stories: [] },
    // Content v2 (D162): each new water in its season, a run, an Open, a medal, a goal and an unlock.
    heronLake: v2At(b, V2_SUMMER, { angler: { ...angler, waterId: 'heron_lake', baitOnHook: 'boilies', bait: { boilies: 24 }, rodTier: 4, speciesLogged: 31, goal: 'Win a medal in an Open' }, band: 'night', weather: 'clear', stories: [{ kind: 'catch', summary: 'A 24.6 kg Wels Catfish took the deadbait in the dark. First Wels Catfish in the logbook.', at: minutes(4), speciesId: 'wels_catfish', grams: 24600 }, { kind: 'goal', summary: 'Goal reached: Hire the rowing boat. Next: Win a medal in an Open.', at: minutes(4) }, ...stories.slice(1)] }),
    charter: v2At(b, V2_WINTER, { angler: { ...angler, waterId: 'deep_sea', baitOnHook: 'deadbait', bait: { deadbait: 21 }, rodTier: 5, coolerTier: 4, speciesLogged: 40, goal: 'Catch a fish in every season' }, coolerUsed: 9, band: 'day', weather: 'wind', stories: [{ kind: 'run', summary: 'The cod are in on the charter grounds.', at: minutes(3) }, { kind: 'catch', summary: 'An 11.8 kg Cod took the deadbait in the day. A new personal best.', at: minutes(18), speciesId: 'cod', grams: 11800 }, ...stories.slice(1)] }),
    frozenTarn: v2At(b, V2_WINTER, { angler: { ...angler, waterId: 'frozen_tarn', baitOnHook: 'maggots', bait: { maggots: 30 }, rodTier: 5, coolerTier: 4, speciesLogged: 47, goal: 'Log 48 species' }, band: 'dawn', weather: 'clear', stories: [{ kind: 'catch', summary: 'A 3.2 kg Golden Char took the maggots at first light. First Golden Char in the logbook.', at: minutes(2), speciesId: 'golden_char', grams: 3200 }, { kind: 'milestone', summary: 'Now a Lakeside Legend, with 47 species in the logbook.', at: minutes(2) }, ...stories.slice(1)] }),
    openWeekend: v2At(b, V2_SPRING_SATURDAY, { angler: { ...angler, waterId: 'millpond', baitOnHook: 'worms', bait: { worms: 20 }, speciesLogged: 9, goal: 'Mount a fish on the wall' }, band: 'day', weather: 'clear', stories: [{ kind: 'open', summary: 'Entered the Perch Open at the Millpond with 640 g.', at: minutes(5) }, { kind: 'catch', summary: 'A 640 g Perch took the worm in the day.', at: minutes(5), speciesId: 'perch', grams: 640 }, { kind: 'milestone', summary: "Unlocked: the trophy wall. Fish at 60% of their species' top weight can be mounted from the Cooler.", at: minutes(80) }, ...stories.slice(1)] }),
    medal: v2At(b, V2_SUMMER, { angler: { ...angler, speciesLogged: 22, goal: 'Book a deep-sea charter' }, stories: [{ kind: 'open', summary: 'Gold in the Chub Open at River Bend with 2.1 kg. 500 coins.', at: minutes(2) }, { kind: 'goal', summary: 'Goal reached: Win a medal in an Open. Next: Book a deep-sea charter.', at: minutes(2) }, ...stories.slice(1)] }),
    unlinked: { ...b, angler: null, stories: [] },
  }
}
