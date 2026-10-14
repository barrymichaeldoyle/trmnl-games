import type { AmbientDef, DecisionDef, EventDef, OptionDef, PaperLivesCatalog, When } from '../../sim/types'
import { contentV1 } from '../v1'

/**
 * Paper Lives content v2 (2026-10-14): v1 with its story fixed where it happened at the wrong age, about the wrong
 * person, or to someone who was not there. v1 stays as it was, so its replays do not change; v2 changes entries by
 * id and appends new ones.
 *
 * - Infant milestones keep to their ages: first steps at 1, a first word at 1 or 2, nursery at 3 or 4. Five new
 *   infant events cover ages 0 and 4 to 5, so every early year has something that fits.
 * - Lines that name a parent need a living one (a child who carries the story on has lost a parent).
 * - Events that assume a job, a car, a home of your own, a garden or young children say so in their conditions.
 * - Nobody is engaged before 20, and a decision an event opens is about the person the event named.
 */

/** Event conditions added on top of v1's, by id. */
const EVENT_WHEN: Record<string, When> = {
  inf_first_word: { minAge: 1, maxAge: 2 },
  inf_steps: { minAge: 1, maxAge: 1, parentAlive: true },
  inf_tooth: { maxAge: 1 },
  inf_sibling: { minAge: 1, maxAge: 3 },
  inf_bath: { maxAge: 2 },
  inf_ducks: { minAge: 1 },
  inf_nursery: { minAge: 3, maxAge: 4 },
  inf_haircut: { minAge: 1, maxAge: 3, parentAlive: true },
  inf_chickenpox: { minAge: 2 },
  inf_drawing: { minAge: 3, parentAlive: true },
  inf_snow: { minAge: 1, maxAge: 3 },
  inf_clover: { minAge: 3, parentAlive: true },
  ch_bike: { maxAge: 9 },
  ch_long_division: { minAge: 8, maxAge: 11 },
  ch_hob_goal: { maxAge: 10 },
  ch_tidy_room: { parentAlive: true },
  ch_hob_chess: { parentAlive: true },
  tn_haircut: { parentAlive: true },
  tn_bedroom: { parentAlive: true },
  yg_sunday_lunch: { home: ['renting', 'owned'] },
  yg_parent_call: { home: ['renting', 'owned'] },
  yg_flatmate: { partner: false },
  yg_cycling: { job: true },
  yg_pet_flat_dog: { job: true },
  ad_kid_word: { personMinAge: 1 },
  ad_side_work: { home: ['owned'] },
  ad_car_breaks: { flags: ['car'], notFlags: ['no_car'] },
  ad_walking: { job: true },
  sn_gc_visit: { personMaxAge: 16 },
  sn_skydive: { minAge: 70, maxAge: 79 },
  sn_walking_group: { maxAge: 79 },
  sn_degree: { education: ['none', 'school', 'work', 'trade'] },
}

/** Event lines rewritten, by id. */
const EVENT_LINE: Record<string, string> = {
  yg_flat_out: 'Moved out of the family home into a small rented flat.',
  yg_apprentice: 'Passed the first apprenticeship module, first time.',
  ad_tidy_clearout: 'Cleared out the loft over a long weekend. Found every school report.',
  sn_memory: 'Lost the glasses twice in a week. Both times they were on your head.',
}

const infant = (id: string, rarity: EventDef['rarity'], line: string, note: string, when: When, effects?: EventDef['effects']): EventDef => ({ id, stage: 'infant', rarity, glyph: 'family', line, note, when, ...(effects ? { effects } : {}) })

const NEW_EVENTS: readonly EventDef[] = [
  infant('inf_pram', 'common', 'Slept in the pram through a whole afternoon at the park.', 'a pram nap', { maxAge: 1 }),
  infant('inf_passed_round', 'common', 'Passed round every relative at the first family get-together, and slept through it.', 'meeting the family', { maxAge: 0 }),
  infant('inf_own_name', 'common', 'Learned to write your own name, with one letter backwards.', 'writing a name', { minAge: 4 }, { stats: { smarts: 2 } }),
  infant('inf_stabilisers', 'common', 'A first bike, with stabilisers and a bell rung at everyone.', 'a first bike', { minAge: 4 }, { stats: { happiness: 2 } }),
  infant('inf_uniform', 'common', 'Tried on the school uniform for September and would not take it off.', 'a new uniform', { minAge: 5 }),
  // A couple who married while one of them still lived at home move out together.
  {
    id: 'yg_married_move',
    stage: ['young', 'adult'],
    rarity: 'common',
    glyph: 'house',
    line: 'Moved out of the family home with {person}, into a flat above the launderette.',
    note: 'a first home together',
    when: { person: 'partner', partner: 'married', home: ['family'] },
    effects: { home: 'renting', relationship: 4, stats: { happiness: 3 } },
    weight: 5,
  },
]

/** Decision conditions added on top of v1's, by id. */
const DECISION_WHEN: Record<string, When> = {
  ch_bully: { parentAlive: true },
  tn_hair: { parentAlive: true },
  ad_bigger_house: { maxAge: 59, person: 'child', personMaxAge: 17 },
  ad_holiday: { person: 'child', personMaxAge: 17 },
  ad_dog: { person: 'child', personMaxAge: 15 },
  sn_swim_lessons: { notFlags: ['swims'] },
}

const DECISION_PROMPT: Record<string, string> = {
  ad_coast_transfer: 'The firm offers a transfer to its office on the coast. Take it?',
}

/** Option changes, by decision id and option id. */
const OPTION: Record<string, Record<string, Partial<OptionDef>>> = {
  tn_shelter: { no: { line: 'Not this year. Waved at the dogs on the way past.' } },
  tn_weekend: { fishing: { gate: { parentAlive: true }, gateReason: 'Nobody at home to go fishing with.' } },
  yg_family: { yes: { line: 'A baby, {person}, arrived the next spring, to a spare room painted yellow.' } },
}

/** Quiet lines that assumed a job, a car or a garden, rewritten so they suit anyone at that stage. */
const AMBIENT_LINE: Record<string, string> = {
  'A dark commute both ways.': 'Dark by four, and the street lights on early.',
  'Reading on the bus to work.': 'Reading on the bus, and missing the stop.',
  'Payday, and the shopping is nicer for a week.': 'Good bread from the bakery, just because.',
  'Washing drying on every radiator in the flat.': 'Washing drying on every radiator.',
  'Tidying the flat for no particular reason.': 'Tidying up for no particular reason.',
  'The first cut of the lawn.': 'The first warm evening with the back door open.',
  'The car smells of sun cream.': 'Sun cream on everything, including the sandwiches.',
  'Raking leaves on a Sunday morning.': 'Kicking through leaves on the way to the shops.',
  'Apples from the tree in a bowl on the side.': 'Apples from the market in a bowl on the side.',
  'Scraping ice off the windscreen before work.': 'Frost on the inside of the window.',
  'A meeting that could have been an email.': 'A letter that could have been a phone call.',
  'Looking for the car keys, again.': 'Looking for the house keys, again.',
  'Tomatoes ripening in the greenhouse.': 'Tomatoes ripening on the windowsill.',
  'Taller than {parent} now, nearly.': 'Taller than last year’s coat, by a mile.',
}

const TRAIT_REVEAL: Record<string, string> = {
  sharp: 'Says “one, two, lots” about everything, and is very sure of it.',
  shy: 'Hides behind the nearest grown-up whenever the doorbell goes.',
}

const replaceLine = (lines: readonly string[], from: string, to: string) => lines.map((l) => (l === from ? to : l))

const events = contentV1.events.map((e): EventDef => {
  const when = EVENT_WHEN[e.id]
  const line = EVENT_LINE[e.id]
  // Learning to swim as a child rules out the senior swimming lessons.
  const effects = e.id === 'ch_swim' ? { ...e.effects, flag: 'swims' } : e.effects
  return { ...e, ...(when ? { when: { ...e.when, ...when } } : {}), ...(line ? { line } : {}), ...(effects ? { effects } : {}) }
})

const decisions = contentV1.decisions.map((d): DecisionDef => {
  const when = DECISION_WHEN[d.id]
  const prompt = DECISION_PROMPT[d.id]
  const options = OPTION[d.id]
  return {
    ...d,
    ...(when ? { when: { ...d.when, ...when } } : {}),
    ...(prompt ? { prompt } : {}),
    ...(options ? { options: d.options.map((o) => ({ ...o, ...options[o.id] })) } : {}),
  }
})

const ambient = contentV1.ambient.map((a): AmbientDef => (AMBIENT_LINE[a.line] ? { ...a, line: AMBIENT_LINE[a.line]! } : a))

const L = contentV1.lines

/**
 * First names read as female or male, so the People page can say mother, brother or daughter (Barry, 2026-10-14). Names
 * used either way (Sam, Robin, Quinn, Kit) are in neither list, and those people keep the plain label. Story lines stay
 * name-based, as the tone guide wants.
 */
const FEMALE = ['Ada', 'Agnes', 'Alba', 'Amara', 'Anouk', 'Asha', 'Bea', 'Bel', 'Cleo', 'Cora', 'Delia', 'Dilys', 'Dot', 'Edie', 'Elsie', 'Enid', 'Fern', 'Ffion', 'Flo', 'Greer', 'Gwen', 'Hattie', 'Ida', 'Imogen', 'Ines', 'Iris', 'Isla', 'Jess', 'Juno', 'Leni', 'Lola', 'Lowri', 'Lupe', 'Mabel', 'Mags', 'Maud', 'Meg', 'Mina', 'Nadia', 'Nell', 'Nina', 'Noor', 'Oona', 'Orla', 'Ottilie', 'Peggy', 'Priya', 'Rani', 'Rosa', 'Ruby', 'Seren', 'Suki', 'Tamsin', 'Tess', 'Tove', 'Ulla', 'Una', 'Vera', 'Yara', 'Zara', 'Zola', 'Halima', 'Juniper', 'Kasia']
const MALE = ['Arlo', 'Arun', 'Basil', 'Bertie', 'Bram', 'Cai', 'Cecil', 'Cosmo', 'Dev', 'Eli', 'Elio', 'Emeka', 'Errol', 'Ezra', 'Finn', 'Freddie', 'Gabe', 'Gethin', 'Gus', 'Hal', 'Hamish', 'Hugo', 'Ianto', 'Ike', 'Ivo', 'Jago', 'Jasper', 'Kenji', 'Kofi', 'Lenny', 'Leo', 'Luca', 'Max', 'Milo', 'Ned', 'Nico', 'Obi', 'Omar', 'Oscar', 'Otto', 'Percy', 'Perry', 'Rafe', 'Ravi', 'Reggie', 'Rhys', 'Rory', 'Rufus', 'Sid', 'Stan', 'Teddy', 'Theo', 'Toby', 'Wilf', 'Yusuf', 'Yves', 'Zeno', 'Mehmet']

export const contentV2: PaperLivesCatalog = {
  ...contentV1,
  version: 2,
  traits: contentV1.traits.map((t) => (TRAIT_REVEAL[t.id] ? { ...t, reveal: TRAIT_REVEAL[t.id]! } : t)),
  events: [...events, ...NEW_EVENTS],
  decisions,
  ambient,
  names: { ...contentV1.names, female: FEMALE, male: MALE },
  lines: {
    ...L,
    // A fourth grandchild is not "a grandparent at last", and a partner of two years is not "a long marriage".
    grandchild: replaceLine(L.grandchild, '{Parent} had a baby, {person}. A grandparent at last.', '{Parent} had a baby, {person}, and brought the photos round.'),
    partnerDied: replaceLine(L.partnerDied, 'Lost {person}, after a long marriage. Still lay two cups out some mornings.', 'Lost {person}. Still lay two cups out some mornings.'),
  },
  tuning: { ...contentV1.tuning, proposalMinAge: 20, openedKeepsPerson: true },
}
