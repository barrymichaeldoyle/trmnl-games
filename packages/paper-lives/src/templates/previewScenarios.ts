import { contentV1 } from '../content'
import type { PaperLivesPayloadInput, PayloadStory } from '../payload'
import { starterLife } from '../sim/starter'
import type { LifeState } from '../sim/types'

/**
 * Every device state through the real payload builder (paper-lives.md "Device", L3): a full adult year with a
 * decision and a pet, a child between decisions, a brand new game, the year's end, the first infant years, a paused life, a service
 * pause, the memorial, a pending life, and long names on every line for the worst case.
 */
const NOW = Date.UTC(2026, 10, 2, 9, 10)
const HOUR = 3_600_000

const base = starterLife(contentV1, 41).life

function life(patch: Partial<LifeState>): LifeState {
  return { ...base, first: 'Maud', last: 'Okafor', ...patch }
}

const story = (age: number, glyph: PayloadStory['glyph'], summary: string, kind = 'event'): PayloadStory => ({ kind, glyph, age, summary, at: NOW - HOUR, ordinal: 1 })

const ADULT_LINES: PayloadStory[] = [
  story(34, 'work', 'Took the night shift. Tired, but the rent is paid.'),
  story(34, 'paw', 'Walked Biscuit in the woods every morning. The best hour of the day.'),
  story(34, 'none', 'A good stew on the hob all afternoon.', 'ambient'),
  story(33, 'heart', 'An anniversary dinner with Sam at the place you had your first date.'),
  story(33, 'health', 'Flu over Christmas. Ate the leftovers in bed.'),
  story(33, 'star', 'Turned thirty. A quiet dinner and a new pair of slippers.', 'stage'),
  // Template v4 shows as many lines as fit, so the matrix sends the payload's full twenty-four.
  story(32, 'work', 'Passed the ward exams on the second go.'),
  story(32, 'paw', 'Biscuit ate a whole birthday cake and was fine.'),
  story(32, 'none', 'Rain on the skylight most of March.', 'ambient'),
  story(31, 'heart', 'Moved in with Sam. Two kettles now.'),
  story(31, 'money', 'Paid off the last of the student loan.'),
  story(31, 'family', 'Sunday lunches at Mum’s, every other week.'),
  story(30, 'paw', 'Brought Biscuit home from the shelter.'),
  story(30, 'health', 'Took up running, then took up walking.'),
  story(30, 'work', 'Started on the children’s ward.'),
  story(29, 'heart', 'Met Sam at a pub quiz. Lost the quiz.'),
  story(29, 'house', 'Rented a flat above the bakery. Warm floors.'),
  story(29, 'none', 'Fog on the river most mornings.', 'ambient'),
  story(28, 'book', 'Read every Agatha Christie in order.'),
  story(28, 'work', 'Qualified as a nurse.'),
  story(28, 'family', 'Taught a cousin to ride a bike.'),
  story(27, 'health', 'Broke a wrist ice skating.'),
  story(27, 'money', 'Saved for a year and bought a decent coat.'),
  story(27, 'star', 'Ran a half marathon, slowly.'),
]

const LONG_LINES: PayloadStory[] = Array.from({ length: 24 }, (_, i) => story(87, i % 2 ? 'family' : 'candle', 'Went to Ottilie’s funeral and told the story about the canoe, which went on rather longer than planned.'))

const BOARD = {
  top: [
    { rank: 1, name: 'Ana', life: 'Dilys Achterberg', age: 101, own: false },
    { rank: 2, name: 'Mo', life: 'Maud Okafor', age: 94, own: true },
    { rank: 3, name: 'Kit', life: 'Bertie Smallwood', age: 91, own: false },
    { rank: 4, name: 'Jo', life: 'Imogen Cartwright', age: 88, own: false },
    { rank: 5, name: 'Rae', life: 'Errol Lindqvist', age: 86, own: false },
  ],
  own: { rank: 2, age: 94 },
}

type Scenario = PaperLivesPayloadInput & { utcOffset: number | null }

export function previewScenarios(artBaseUrl: string | null): Record<string, Scenario> {
  const world = { createdAt: NOW - HOUR, lastCompletedAt: NOW - 60_000, paused: false }
  const active = (state: LifeState, extra: Partial<Scenario> = {}): Scenario => ({
    content: contentV1,
    now: NOW,
    world,
    life: { state, activationState: 'active', quarantined: false, ordinal: 1, closesAt: NOW + 5 * HOUR, minimumAt: NOW + HOUR },
    stories: ADULT_LINES,
    board: BOARD,
    artBaseUrl,
    utcOffset: 7200,
    ...extra,
  })
  const adult = life({
    age: 34,
    stage: 'adult',
    job: 'nurse',
    home: 'renting',
    traits: ['curious', 'loyal'],
    flags: ['glasses'],
    pet: { kind: 'dog', name: 'Biscuit', bornAt: 30, lifespan: 13, relationship: 70 },
    stats: { health: 72, happiness: 58, smarts: 81, charm: 35 },
    gold: 12_400,
    recap: 'Age 33: an anniversary and flu.',
    year: { ...base.year, elapsed: 3, pending: { decisionId: 'ad_career' } },
  })
  const decisionStories = [story(34, 'work', 'Bored at work for a while. Change careers?', 'decision_offered'), ...ADULT_LINES]
  return {
    adult: active(adult, { stories: decisionStories }),
    child: active(life({ age: 9, stage: 'child', education: 'school', home: 'family', pet: { kind: 'rabbit', name: 'Bobbin', bornAt: 8, lifespan: 8, relationship: 70 }, stats: { health: 80, happiness: 66, smarts: 52, charm: 61 }, recap: 'Age 8: a new friend.' }), {
      stories: [story(9, 'family', 'A sleepover at Finn’s house. Nobody slept.'), story(9, 'book', 'Got a library card and took out the maximum every week.'), story(8, 'family', 'Made a friend called Finn over a shared rubber.')],
      board: { top: [], own: null },
    }),
    'year-end': active(life({ age: 52, stage: 'adult', job: 'teacher', home: 'owned', house: 2, stats: { health: 55, happiness: 70, smarts: 74, charm: 60 }, gold: 88_000, year: { ...base.year, elapsed: 12 } }), { utcOffset: null }),
    // A brand new game: the first year, one line and nobody's life finished this week (template v6 fills the space).
    newborn: active(life({ age: 0, stage: 'infant', home: 'family', recap: undefined as unknown as string }), { stories: [story(0, 'pram', 'Born on a wet Tuesday, to Ada and Tom. Seven pounds of opinion.', 'infant')], board: { top: [], own: null } }),
    infant: active(life({ age: 2, stage: 'infant', home: 'family', recap: undefined as unknown as string }), { stories: [story(1, 'star', 'Counts the stairs every time, and corrects anyone who miscounts.', 'infant'), story(0, 'pram', 'Slept through the first night, which nobody believed.', 'infant')] }),
    senior: active(life({ age: 78, stage: 'senior', retired: true, home: 'owned', house: 3, traits: ['stubborn', 'sunny'], pet: { kind: 'cat', name: 'Marmalade', bornAt: 70, lifespan: 15, relationship: 80 }, stats: { health: 31, happiness: 82, smarts: 60, charm: 77 }, gold: 140_500, year: { ...base.year, elapsed: 2, pending: { decisionId: 'sn_will' } } }), {
      stories: [story(78, 'money', 'Time to write a will?', 'decision_offered'), ...ADULT_LINES.map((s) => ({ ...s, age: 77 }))],
    }),
    paused: active(life({ age: 41, stage: 'adult', status: 'paused', job: 'architect', home: 'owned' })),
    service: active(adult, { world: { ...world, paused: true } }),
    memorial: active(life({ age: 87, stage: 'senior', status: 'ended', generation: 3, pet: { kind: 'tortoise', name: 'Sprout', bornAt: 30, lifespan: 70, relationship: 80 }, death: { cause: 'runner_beans', line: 'Died at 87 in the garden, among the runner beans.', epitaph: 'Raised a family on a working wage and outlived the pension forecast.' } })),
    'long-names': active(
      life({
        first: 'Ottilie',
        last: 'Achterberg',
        age: 100,
        stage: 'senior',
        job: 'museum_director',
        home: 'renting',
        traits: ['delicate', 'generous'],
        pet: { kind: 'goldfish', name: 'Wellington', bornAt: 95, lifespan: 10, relationship: 70 },
        stats: { health: 4, happiness: 100, smarts: 100, charm: 0 },
        gold: -2_000,
        recap: 'Age 99: a grandchild’s graduation and saying goodbye to Wellington.',
        year: { ...base.year, elapsed: 2, pending: { decisionId: 'sn_near_children' } },
      }),
      { stories: [story(100, 'family', 'Move closer to Ottilie and the grandchildren, now that the stairs are a struggle?', 'decision_offered'), ...LONG_LINES], board: { top: BOARD.top.map((r) => ({ ...r, life: 'Ottilie Achterberg-Cartwright', own: false })), own: { rank: null, age: 64 } } },
    ),
    pending: { ...active(life({})), life: { state: life({}), activationState: 'pending_trmnl', quarantined: false, ordinal: 1, closesAt: NOW, minimumAt: NOW } },
    unlinked: { ...active(life({})), life: null },
  }
}
