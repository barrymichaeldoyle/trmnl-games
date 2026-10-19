import { ACHIEVEMENTS } from '../content/achievements'
import { FLIES } from '../content/flies'
import { contentV5 } from '../content/v5'
import { BAND_PHRASE } from '../sim/conditions'
import { articleFor } from '../sim/progress'
import { SEASON_NAME } from '../sim/seasons'
import { TITLES } from '../sim/titles'
import type { FishName, IaLanguage } from './types'

/**
 * English, the source: every line here is the one the simulator and backend write, so a stored line parsed and told
 * again in English comes back unchanged (tests/idle-angler/i18n.test.ts holds every simulated line to that).
 */
const content = contentV5
const byId = <T extends { id: string }, V>(rows: readonly T[], value: (row: T) => V): Record<string, V> => Object.fromEntries(rows.map((row) => [row.id, value(row)]))
const lead = (weight: string, fish: FishName) => `${articleFor(weight)} ${weight} ${fish.name}`
const lower = (text: string) => text.charAt(0).toLowerCase() + text.slice(1)
const PLACE = ['Gold', 'Silver', 'Bronze'] as const
const BAND_LABEL = { dawn: 'Dawn', day: 'Day', dusk: 'Dusk', night: 'Night' } as const

export const en: IaLanguage = {
  species: byId(content.species, (s) => ({ name: s.name, a: s.name })),
  waters: Object.fromEntries(content.waters.map((w) => [w.id, { name: w.name, at: `at ${w.the}`, to: `to ${w.name}`, the: w.the, of: `from ${w.name}` }])) as IaLanguage['waters'],
  baits: Object.fromEntries(content.baits.map((b) => [b.class, { name: b.name, took: b.the }])) as IaLanguage['baits'],
  bareHook: { name: 'Bare hook', took: 'a bare hook' },
  rods: byId(content.rods, (r) => r.name),
  coolers: Object.fromEntries(content.coolers.map((c) => [String(c.tier), c.name])),
  access: byId(content.access, (a) => a.name),
  titles: byId(TITLES, (t) => t.name),
  flies: byId(FLIES, (f) => f.name),
  seasons: SEASON_NAME,
  bands: { dawn: { name: BAND_LABEL.dawn, phrase: BAND_PHRASE.dawn }, day: { name: BAND_LABEL.day, phrase: BAND_PHRASE.day }, dusk: { name: BAND_LABEL.dusk, phrase: BAND_PHRASE.dusk }, night: { name: BAND_LABEL.night, phrase: BAND_PHRASE.night } },
  weather: { clear: 'Clear', overcast: 'Overcast', rain: 'Rain', wind: 'Wind', fog: 'Fog' },
  rarity: { common: 'common', uncommon: 'uncommon', rare: 'rare', epic: 'epic' },
  lines: {},
  goals: byId(content.goals!, (g) => g.title),
  achievements: byId(ACHIEVEMENTS.filter((a) => a.category !== 'Species'), (a) => [a.name, a.blurb] as const),
  achievementFamilies: Object.fromEntries(ACHIEVEMENTS.filter((a) => a.category !== 'Species').map((a) => [a.family, a.familyName])),
  achievementCategories: { Fishing: 'Fishing', Logbook: 'Logbook', Trade: 'Trade', Progress: 'Progress', Species: 'Species' },
  speciesAchievement: {
    first: (fish) => [`First ${fish.name}`, `A ${fish.name} in the logbook.`],
    specimen: (fish, kg) => [`Specimen ${fish.name}`, `A ${fish.name} over ${kg} kg.`],
  },
  tell: {
    caught: (fish, weight, bait, band) => `${lead(weight, fish)} took ${bait.took} ${band}.`,
    released: (fish, weight) => `Cooler full. Released ${lower(lead(weight, fish))}.`,
    gotAway: (bait) => `Something heavy took ${bait.took} and kept going.`,
    personalBest: 'A new personal best.',
    newSpecies: (fish) => `First ${fish.name} in the logbook.`,
    baitOut: (bait) => `The ${bait.name.toLowerCase()} ran out. Fishing a bare hook.`,
    newTitle: (title, species) => `Now a ${title}, with ${species} species in the logbook.`,
    waterOpen: (logged, from, water, pass) => `${logged} ${from.name} species logged. ${water.name} is open${pass ? ` with the ${pass}` : ''}.`,
    settledAt: (water) => `You set up on the bank at ${water.the}.`,
    goalReached: (goal, next) => `Goal reached: ${goal}. Next: ${next}.`,
    logSpecies: (n) => `Log ${n} species`,
    achievement: (name) => `Achievement: ${name}`,
    achievements: (n, names) => `${n} achievements: ${names}`,
    enteredOpen: (fish, water, weight) => `Entered the ${fish.name} Open at ${water.the} with ${weight}.`,
    medal: (place, fish, water, weight, prize) => `${PLACE[place]} in the ${fish.name} Open at ${water.the} with ${weight}. ${prize} coins.`,
    sold: (n, coins) => `Sold ${n} fish for ${coins} coins.`,
    bought: (item) => `Bought the ${item}.`,
    boughtBait: (tubs, bait) => `Bought ${tubs} ${tubs === 1 ? 'tub' : 'tubs'} of ${bait.name.toLowerCase()}.`,
    baitOnHook: (bait) => `Put ${bait.name.toLowerCase()} on the hook.`,
    packingUp: (water) => `Packing up for ${water.the}.`,
    claimed: (coins, goal) => `Claimed ${coins} coins for a goal: ${goal}.`,
    handedOver: (count, fish, coins) => `Handed ${count === 1 ? 'a' : count} ${fish.map((f) => f.name).join(' and ')} to the fishmonger for ${coins} coins.`,
    swapOrder: 'Asked the fishmonger for a different order.',
    toDeadbait: (fish, weight) => `A ${weight} ${fish.name} goes in the deadbait box.`,
    mounted: (fish, weight) => `The ${weight} ${fish.name} goes up on the wall.`,
    pegs: (n) => `The wall now has ${n} pegs.`,
    charter: (casts) => `Booked a charter for ${casts} casts.`,
    paused: 'Rod on the rest. Fishing paused.',
    resumed: 'Line back in the water.',
  },
  orders: {
    species: (count, fish) => `${COUNT_WORD[count] ?? count} ${fish.name}`,
    weight: (count, weight) => `${COUNT_WORD[count] ?? count} fish over ${weight}`,
    water: (count, water) => `${COUNT_WORD[count] ?? count} fish from ${water.name}`,
    time: (count, bands) => `${COUNT_WORD[count] ?? count} fish caught at ${bands}`,
    rarity: (count, rarity) => `${count === 1 ? (rarity === 'uncommon' ? 'An' : 'A') : (COUNT_WORD[count] ?? count)} ${rarity} fish`,
    or: 'or',
    hint: (water, baits, bands, weather) => `${water.name}, on ${baits}${bands ? `, at ${bands}` : ''}${weather ? `, in ${weather} weather` : ''}`,
  },
  device: {
    casting: (water) => `Casting at ${water.the}`,
    heading: (water) => `Heading to ${water.name}`,
    paused: 'Fishing paused',
    notSetUp: 'Not set up yet',
    waitingForSave: 'Waiting for TRMNL Save',
    maintenance: 'Idle Angler is down for maintenance.',
    signIn: 'Sign in to the companion, then save this plugin in TRMNL.',
    serviceCheck: 'Paused for a service check.',
    delayed: 'Updates are delayed.',
    coolerFull: 'Cooler full. Sell in the companion.',
    outOf: (bait) => `Out of ${bait.toLowerCase()}, fishing a bare hook.`,
    bareHook: 'Fishing a bare hook.',
    goalWaiting: (count, coins) => `${count > 1 ? `${count} goals` : 'Goal'} reached! Claim ${coins} coins in the companion.`,
    fish: (n) => `${n} fish`,
    best: (weight, fish) => `Best ${weight} ${fish}`,
    gotAway: (n) => `${n} got away`,
    thisWeek: 'This week',
    noFishYet: 'No fish here this week yet',
    yourBest: (weight) => `Your best ${weight}`,
    rankBest: (rank, weight) => `#${rank}, best ${weight}`,
    labels: { fly: 'Fly', fly_code: 'Fly code', last_12_hours: 'Last 12 hours', released: 'Released', newest_catch: 'Newest catch', goal: 'Goal:', back_soon: 'Back soon', finish_setup: 'Finish setting up', save_plugin: 'Save the plugin in TRMNL. The first cast is within 15 minutes.', ready: '%name% is ready to fish' },
  },
}

const COUNT_WORD: Readonly<Record<number, string>> = { 0: 'No', 1: 'One', 2: 'Two', 3: 'Three' }
