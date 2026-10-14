import type { GoalDef, IdleAnglerCatalog, Season, SpeciesDef, WaterDef, Weather } from '../sim/types'
import { contentV1 } from './v1'

/**
 * Idle Angler content v2 (D162, idle-angler-full.md): seasons and runs, three new waters and 28 species, the Boat Rod,
 * boilies and deadbait, fishmonger orders, goals and unlocks, the weekend Opens and the trophy wall. Starting numbers
 * from the spec, tuned by the F1 harness (tools/balance/idle-angler-v2.ts), whose evidence records each change. v1 is
 * untouched and replays as it always has.
 */

type Table = ReadonlyArray<readonly [Weather, number]>
const freshwaterSeasons: Readonly<Record<Season, Table>> = {
  spring: [['clear', 40], ['overcast', 30], ['rain', 20], ['fog', 10]],
  summer: [['clear', 55], ['overcast', 25], ['rain', 15], ['fog', 5]],
  autumn: [['clear', 30], ['overcast', 30], ['rain', 30], ['fog', 10]],
  winter: [['clear', 35], ['overcast', 30], ['rain', 15], ['fog', 20]],
}
const seaSeasons: Readonly<Record<Season, Table>> = {
  spring: [['clear', 35], ['overcast', 25], ['rain', 15], ['wind', 15], ['fog', 10]],
  summer: [['clear', 45], ['overcast', 25], ['rain', 10], ['wind', 15], ['fog', 5]],
  autumn: [['clear', 25], ['overcast', 25], ['rain', 20], ['wind', 25], ['fog', 5]],
  winter: [['clear', 25], ['overcast', 25], ['rain', 15], ['wind', 20], ['fog', 15]],
}
const freshwaterPercent = { spring: 110, summer: 100, autumn: 110, winter: 85 } as const
const seaPercent = { spring: 100, summer: 110, autumn: 100, winter: 90 } as const
const freshwaterTime = { dawn: 130, day: 100, dusk: 130, night: 80 } as const

const withDeadbait = (water: WaterDef): WaterDef => ({ ...water, baits: [...water.baits, 'deadbait'] })
const v1Water = (id: string) => contentV1.waters.find((w) => w.id === id)!

const waters: readonly WaterDef[] = [
  { ...withDeadbait(v1Water('millpond')), seasonPercent: freshwaterPercent, seasonWeather: freshwaterSeasons },
  { ...withDeadbait(v1Water('river_bend')), seasonPercent: freshwaterPercent, seasonWeather: freshwaterSeasons },
  { ...withDeadbait(v1Water('harbour_pier')), seasonPercent: seaPercent, seasonWeather: seaSeasons },
  {
    id: 'heron_lake',
    name: 'Heron Lake',
    the: 'Heron Lake',
    opensAfter: { water: 'river_bend', species: 6 },
    access: 'rowing_boat',
    biteBasePermille: 120,
    baits: ['worms', 'maggots', 'bread', 'boilies', 'spinner', 'deadbait'],
    weather: freshwaterSeasons.summer,
    seasonWeather: freshwaterSeasons,
    timePercent: freshwaterTime,
    weatherPercent: { clear: 100, overcast: 110, rain: 105, wind: 90, fog: 100 },
    seasonPercent: freshwaterPercent,
    arrival: 'You row out onto Heron Lake.',
  },
  {
    id: 'deep_sea',
    name: 'Deep-sea charter',
    the: 'the charter',
    opensAfter: { water: 'harbour_pier', species: 6 },
    charter: true,
    returnsTo: 'harbour_pier',
    biteBasePermille: 150,
    baits: ['ragworm', 'strip', 'spinner', 'deadbait'],
    weather: seaSeasons.summer,
    seasonWeather: seaSeasons,
    timePercent: { dawn: 120, day: 100, dusk: 120, night: 90 },
    weatherPercent: { clear: 100, overcast: 110, rain: 100, wind: 85, fog: 95 },
    seasonPercent: seaPercent,
    arrival: 'The charter boat heads out past the harbour wall.',
  },
  {
    id: 'frozen_tarn',
    name: 'Frozen Tarn',
    the: 'Frozen Tarn',
    opensAfter: { water: 'heron_lake', species: 5 },
    access: 'ice_auger',
    openIn: ['winter'],
    returnsTo: 'heron_lake',
    biteBasePermille: 110,
    baits: ['maggots', 'worms', 'spinner', 'deadbait'],
    weather: freshwaterSeasons.winter,
    timePercent: { dawn: 130, day: 100, dusk: 120, night: 90 },
    weatherPercent: { clear: 100, overcast: 110, rain: 100, wind: 90, fog: 100 },
    arrival: 'You cut a hole in the ice on Frozen Tarn.',
  },
]

const g = (kg: number) => Math.round(kg * 1000)

/** v1 species gain deadbait for the predators and a bait-fish mark for the small ones; nothing else changes. */
// F1: Chub left out. It made deadbait a worse worm at River Bend (0.29x the spinner); without it deadbait is a predator hunt.
const PREDATORS = new Set(['perch', 'eel', 'pike', 'zander', 'sea_bass', 'conger_eel', 'smoothhound'])
const BAIT_FISH = new Set(['minnow', 'roach', 'rudd', 'gudgeon', 'dace', 'sand_eel', 'mackerel', 'whiting'])
const fromV1: readonly SpeciesDef[] = contentV1.species.map((s) => ({
  ...s,
  ...(PREDATORS.has(s.id) ? { baits: [...s.baits, 'deadbait' as const] } : {}),
  ...(BAIT_FISH.has(s.id) ? { baitFish: true as const } : {}),
}))

const added: readonly SpeciesDef[] = [
  // Season visitors at the v1 waters
  { id: 'sea_trout', name: 'Sea Trout', water: 'river_bend', rarity: 'rare', minGrams: g(1.0), maxGrams: g(6.0), baits: ['spinner', 'worms'], times: ['night'], seasons: ['summer'], price: 130 },
  { id: 'garfish', name: 'Garfish', water: 'harbour_pier', rarity: 'uncommon', minGrams: g(0.2), maxGrams: g(1.0), baits: ['strip', 'spinner', 'ragworm'], times: ['day'], seasons: ['spring'], price: 40 },
  // Heron Lake
  { id: 'bleak', name: 'Bleak', water: 'heron_lake', rarity: 'common', minGrams: g(0.01), maxGrams: g(0.08), baits: ['maggots', 'bread'], anyBait: true, baitFish: true, price: 9 },
  { id: 'ide', name: 'Ide', water: 'heron_lake', rarity: 'common', minGrams: g(0.2), maxGrams: g(2.5), baits: ['worms', 'maggots', 'bread'], price: 26 },
  { id: 'silver_bream', name: 'Silver Bream', water: 'heron_lake', rarity: 'common', minGrams: g(0.05), maxGrams: g(0.6), baits: ['worms', 'bread', 'maggots'], price: 14 },
  { id: 'mirror_carp', name: 'Mirror Carp', water: 'heron_lake', rarity: 'uncommon', minGrams: g(2.0), maxGrams: g(15.0), baits: ['boilies', 'bread'], times: ['dawn', 'dusk', 'night'], price: 70 },
  { id: 'grass_carp', name: 'Grass Carp', water: 'heron_lake', rarity: 'uncommon', minGrams: g(2.0), maxGrams: g(12.0), baits: ['bread', 'boilies'], times: ['day'], seasons: ['summer'], price: 80 },
  { id: 'leather_carp', name: 'Leather Carp', water: 'heron_lake', rarity: 'rare', minGrams: g(3.0), maxGrams: g(18.0), baits: ['boilies'], times: ['night'], price: 120 },
  { id: 'wels_catfish', name: 'Wels Catfish', water: 'heron_lake', rarity: 'rare', minGrams: g(5.0), maxGrams: g(40.0), baits: ['deadbait', 'boilies'], times: ['night'], seasons: ['summer'], price: 180 },
  { id: 'lake_trout', name: 'Lake Trout', water: 'heron_lake', rarity: 'rare', minGrams: g(1.0), maxGrams: g(8.0), baits: ['spinner', 'deadbait'], times: ['dawn'], seasons: ['spring', 'autumn'], price: 140 },
  { id: 'ghost_koi', name: 'Ghost Koi', water: 'heron_lake', rarity: 'epic', weight: 90, minGrams: g(2.0), maxGrams: g(10.0), baits: ['bread'], times: ['dawn', 'dusk'], weather: ['clear', 'overcast'], seasons: ['summer'], price: 420 },
  // Deep-sea charter
  { id: 'gurnard', name: 'Gurnard', water: 'deep_sea', rarity: 'common', minGrams: g(0.2), maxGrams: g(1.5), baits: ['ragworm', 'strip'], price: 30 },
  { id: 'coalfish', name: 'Coalfish', water: 'deep_sea', rarity: 'common', minGrams: g(0.3), maxGrams: g(4.0), baits: ['spinner', 'strip'], price: 34 },
  { id: 'haddock', name: 'Haddock', water: 'deep_sea', rarity: 'common', minGrams: g(0.3), maxGrams: g(3.0), baits: ['ragworm', 'strip'], price: 36 },
  { id: 'ling', name: 'Ling', water: 'deep_sea', rarity: 'uncommon', minGrams: g(2.0), maxGrams: g(20.0), baits: ['strip', 'deadbait'], price: 70 },
  { id: 'cod', name: 'Cod', water: 'deep_sea', rarity: 'uncommon', minGrams: g(1.0), maxGrams: g(15.0), baits: ['ragworm', 'deadbait'], seasons: ['autumn', 'winter'], price: 80 },
  { id: 'turbot', name: 'Turbot', water: 'deep_sea', rarity: 'uncommon', minGrams: g(1.0), maxGrams: g(10.0), baits: ['deadbait', 'strip'], seasons: ['summer'], price: 110 },
  { id: 'tope', name: 'Tope', water: 'deep_sea', rarity: 'rare', minGrams: g(5.0), maxGrams: g(30.0), baits: ['deadbait'], seasons: ['summer'], price: 160 },
  { id: 'blue_shark', name: 'Blue Shark', water: 'deep_sea', rarity: 'rare', minGrams: g(15.0), maxGrams: g(60.0), baits: ['deadbait'], seasons: ['summer'], price: 260 },
  { id: 'halibut', name: 'Halibut', water: 'deep_sea', rarity: 'epic', minGrams: g(10.0), maxGrams: g(60.0), baits: ['deadbait'], seasons: ['winter'], price: 520 },
  // Frozen Tarn (open in winter only)
  { id: 'smelt', name: 'Smelt', water: 'frozen_tarn', rarity: 'common', minGrams: g(0.01), maxGrams: g(0.06), baits: ['maggots'], anyBait: true, baitFish: true, price: 10 },
  { id: 'whitefish', name: 'Whitefish', water: 'frozen_tarn', rarity: 'common', minGrams: g(0.2), maxGrams: g(1.5), baits: ['maggots', 'worms'], price: 30 },
  { id: 'ruffe', name: 'Ruffe', water: 'frozen_tarn', rarity: 'common', minGrams: g(0.02), maxGrams: g(0.15), baits: ['worms', 'maggots'], anyBait: true, price: 12 },
  { id: 'vendace', name: 'Vendace', water: 'frozen_tarn', rarity: 'uncommon', minGrams: g(0.05), maxGrams: g(0.3), baits: ['maggots'], price: 45 },
  { id: 'arctic_char', name: 'Arctic Char', water: 'frozen_tarn', rarity: 'uncommon', minGrams: g(0.3), maxGrams: g(3.0), baits: ['spinner', 'worms', 'maggots'], price: 70 },
  { id: 'brook_trout', name: 'Brook Trout', water: 'frozen_tarn', rarity: 'uncommon', minGrams: g(0.2), maxGrams: g(2.0), baits: ['worms', 'spinner'], times: ['dawn', 'dusk'], price: 60 },
  { id: 'burbot', name: 'Burbot', water: 'frozen_tarn', rarity: 'rare', minGrams: g(0.5), maxGrams: g(5.0), baits: ['deadbait', 'worms'], times: ['night'], price: 120 },
  { id: 'golden_char', name: 'Golden Char', water: 'frozen_tarn', rarity: 'epic', weight: 40, minGrams: g(1.0), maxGrams: g(5.0), baits: ['spinner', 'maggots'], times: ['dawn', 'dusk'], weather: ['clear', 'overcast'], price: 450 },
]

/** The ladder (idle-angler-full.md "Goals and unlocks"); append-only from here. */
const goals: readonly GoalDef[] = [
  { id: 'first_fish', title: 'Land your first fish', predicate: { kind: 'counter', counter: 'fishCaught', at: 1 }, coins: 10, guarantee: { casts: 8 } },
  { id: 'first_sale', title: 'Sell a fish', predicate: { kind: 'counter', counter: 'fishSold', at: 1 }, coins: 10, page: 'cooler' },
  { id: 'buy_bread', title: 'Buy a tub of bread', predicate: { kind: 'bought', bait: 'bread' }, coins: 10, page: 'shop' },
  { id: 'bread_catch', title: 'Catch a fish on bread', predicate: { kind: 'counter', counter: 'breadCatches', at: 1 }, coins: 15, guarantee: { casts: 16, bait: 'bread' } },
  { id: 'four_species', title: 'Log four species', predicate: { kind: 'species', at: 4 }, coins: 20 },
  { id: 'first_order', title: 'Fill an order for the fishmonger', predicate: { kind: 'counter', counter: 'ordersFilled', at: 1 }, coins: 20, page: 'cooler' },
  { id: 'cool_box', title: 'Buy the Cool Box', predicate: { kind: 'cooler', at: 2 }, coins: 20, page: 'shop' },
  { id: 'dawn_dusk', title: 'Catch a fish at dawn or dusk', predicate: { kind: 'counter', counter: 'dawnDuskCatches', at: 1 }, coins: 15 },
  { id: 'fibreglass', title: 'Buy the Fibreglass Rod', predicate: { kind: 'rod', at: 2 }, coins: 25, page: 'shop' },
  { id: 'six_millpond', title: 'Log six Millpond species', predicate: { kind: 'species', at: 6, water: 'millpond' }, coins: 25 },
  { id: 'river_bend', title: 'Fish River Bend', predicate: { kind: 'fished', water: 'river_bend' }, coins: 30, page: 'dock' },
  { id: 'rain', title: 'Catch a fish in the rain', predicate: { kind: 'counter', counter: 'rainCatches', at: 1 }, coins: 20 },
  { id: 'eight_species', title: 'Log eight species', predicate: { kind: 'species', at: 8 }, coins: 30 },
  { id: 'mount', title: 'Mount a fish on the wall', predicate: { kind: 'counter', counter: 'trophiesMounted', at: 1 }, coins: 30, page: 'cooler' },
  { id: 'open', title: 'Land the target fish in a weekend Open', predicate: { kind: 'counter', counter: 'opensEntered', at: 1 }, coins: 30 },
  { id: 'deadbait', title: 'Put a fish on the hook as bait', predicate: { kind: 'counter', counter: 'deadbaitUsed', at: 1 }, coins: 30, page: 'cooler' },
  { id: 'predator', title: 'Catch a Pike or a Zander', predicate: { kind: 'logged', anyOf: ['pike', 'zander'] }, coins: 40 },
  { id: 'ten_orders', title: 'Fill ten orders', predicate: { kind: 'counter', counter: 'ordersFilled', at: 10 }, coins: 40, page: 'cooler' },
  { id: 'pier_permit', title: 'Buy the Pier Permit', predicate: { kind: 'access', id: 'pier_permit' }, coins: 50, page: 'shop' },
  { id: 'fourteen_species', title: 'Log fourteen species', predicate: { kind: 'species', at: 14 }, coins: 50 },
  { id: 'rowing_boat', title: 'Hire the rowing boat', predicate: { kind: 'access', id: 'rowing_boat' }, coins: 60, page: 'shop' },
  { id: 'medal', title: 'Win a medal in an Open', predicate: { kind: 'counter', counter: 'medals', at: 1 }, coins: 80 },
  { id: 'charter', title: 'Book a deep-sea charter', predicate: { kind: 'counter', counter: 'charters', at: 1 }, coins: 80, page: 'shop' },
  { id: 'four_seasons', title: 'Catch a fish in every season', predicate: { kind: 'seasons', at: 4 }, coins: 100 },
  { id: 'master_angler', title: 'Log twenty-six species', predicate: { kind: 'species', at: 26 }, coins: 100 },
  { id: 'frozen_tarn', title: 'Fish Frozen Tarn', predicate: { kind: 'fished', water: 'frozen_tarn' }, coins: 100, page: 'dock' },
]

export const contentV2: IdleAnglerCatalog = {
  ...contentV1,
  contentVersion: 'v2',
  waters,
  species: [...fromV1, ...added],
  rods: [...contentV1.rods, { tier: 5, id: 'boat_rod', name: 'Boat Rod', limitGrams: g(60), biteBonusPercent: 20, price: 6000 }],
  baits: [
    ...contentV1.baits,
    { class: 'boilies', name: 'Boilies', the: 'the boilie', castsPerTub: 12, price: 45 },
    { class: 'deadbait', name: 'Deadbait', the: 'the deadbait', castsPerTub: 3, price: 0 },
  ],
  access: [
    ...contentV1.access,
    { id: 'rowing_boat', name: 'Rowing Boat', water: 'heron_lake', price: 1200 },
    { id: 'ice_auger', name: 'Ice Auger', water: 'frozen_tarn', price: 3500 },
  ],
  ambient: {
    ...contentV1.ambient,
    heron_lake: [
      'Oars knock in the rowlocks.',
      'A great crested grebe dives and comes up far off.',
      'The boathouse door bangs once in the wind.',
      'A heron stands knee deep by the reeds.',
      'Carp bubbles fizz past the boat.',
      'Mist sits on the far end of the lake.',
    ],
    deep_sea: [
      'The skipper pours tea from a flask.',
      'Gannets fold up and drop into the swell.',
      'The boat rolls and the rod tip dips.',
      'Land is a grey line behind the boat.',
      'The engine idles over the wreck mark.',
      'A shearwater skims the wave tops.',
    ],
    frozen_tarn: [
      'The ice creaks somewhere out in the middle.',
      'Snow blows across the hole in the ice.',
      'A raven calls from the pines.',
      'The line stiffens with frost.',
      'Breath hangs in the still air.',
      'The fell behind the tarn is white to the top.',
    ],
  },
  seasons: { order: ['spring', 'summer', 'autumn', 'winter'], offsetWeeks: 1 },
  runs: [
    { id: 'garfish_run', season: 'spring', water: 'harbour_pier', species: 'garfish', weightPercent: 400, line: 'The garfish are in at the Harbour Pier.' },
    { id: 'mackerel_run', season: 'summer', water: 'harbour_pier', species: 'mackerel', weightPercent: 400, line: 'The mackerel are in at the Harbour Pier.' },
    { id: 'salmon_run', season: 'autumn', water: 'river_bend', species: 'salmon', weightPercent: 400, anyWeather: true, line: 'The salmon are running at River Bend.' },
    { id: 'cod_run', season: 'winter', water: 'deep_sea', species: 'cod', weightPercent: 400, line: 'The cod are in on the charter grounds.' },
  ],
  deadbait: { unitsPerFish: 3, bitePercent: 110 },
  charterTicket: { water: 'deep_sea', price: 550, casts: 96 },
  orders: {
    slots: 3,
    refillHour: 7,
    multiplierPercent: 150,
    bonus: { species: 20, weight: 40, water: 30, time: 30, rarity: 50, teaching: 60 },
    weights: { species: 30, weight: 15, water: 15, time: 15, rarity: 10, teaching: 30 },
  },
  goals,
  unlocks: { shop_upgrades: 2, orders: 4, opens: 6, trophies: 8, deadbait: 10 },
  opens: {
    rotation: {
      millpond: ['perch', 'roach', 'tench', 'bream', 'rudd', 'crucian_carp'],
      river_bend: ['chub', 'dace', 'barbel', 'brown_trout', 'gudgeon', 'grayling'],
      harbour_pier: ['whiting', 'pollock', 'flounder', 'mackerel', 'wrasse'],
      heron_lake: ['ide', 'silver_bream', 'mirror_carp', 'bleak'],
      deep_sea: ['coalfish', 'haddock', 'gurnard', 'ling'],
      frozen_tarn: ['whitefish', 'arctic_char', 'ruffe'],
    },
    prizes: [500, 300, 150],
  },
  trophies: { minPercent: 60, fee: 100, pegs: [6, 12, 18, 24], pegPrices: [0, 800, 2500, 6000] },
  baitCaps: { deadbait: 24 },
}
