import type { AmbientDef, DecisionDef, OptionDef } from '../../sim/types'

const option = (id: string, label: string, line: string, note: string, rest: Omit<OptionDef, 'id' | 'label' | 'line' | 'note'> = {}): OptionDef => ({ id, label, line, note, ...rest })
type Rest = Omit<DecisionDef, 'id' | 'stage' | 'rarity' | 'major' | 'glyph' | 'prompt' | 'options' | 'default'>
const decision = (id: string, stage: DecisionDef['stage'], rarity: DecisionDef['rarity'], glyph: DecisionDef['glyph'], prompt: string, options: OptionDef[], fallback: string, rest: Rest = {}): DecisionDef => ({ id, stage, rarity, major: false, glyph, prompt, options, default: fallback, ...rest })

/** Content v3's decisions: thirty more small choices, none of them major. */
export const packDecisions: readonly DecisionDef[] = [
  // Child.
  decision('ch3_swim_team', 'child', 'common', 'health', 'The swimming club is picking a team.', [
    option('try', 'Try out', 'Made the swimming team. Chlorine in your hair every Tuesday.', 'the swimming team', { gate: { stat: { id: 'health', min: 45 } }, gateReason: 'Needs a bit more puff first.', effects: { stats: { health: 4 } } }),
    option('watch', 'Cheer from the gallery', 'Cheered the team from the gallery with a bag of crisps.', 'cheering', { effects: { stats: { happiness: 1 } } }),
  ], 'watch', { when: { minAge: 8 } }),
  decision('ch3_sleepover', 'child', 'common', 'family', 'Invited to a sleepover. The first one away from home?', [
    option('go', 'Go', 'Went to the sleepover and stayed awake until two.', 'a first sleepover', { effects: { stats: { charm: 2, happiness: 2 } } }),
    option('home', 'Stay home this time', 'Stayed home and heard about the midnight feast on Monday.', 'a night at home'),
  ], 'home'),
  decision('ch3_toy_sale', 'child', 'common', 'money', 'The toy shop has a sale. Spend the savings?', [
    option('spend', 'Buy a kite', 'Bought a kite with the savings and flew it the same day.', 'a new kite', { effects: { stats: { happiness: 3 } } }),
    option('keep', 'Keep saving', 'Kept saving. The jar is getting heavy.', 'a heavy jar', { effects: { gold: 20 } }),
  ], 'keep'),
  decision('ch3_left_out', 'child', 'uncommon', 'heart', '{Person} has been left out at school.', [
    option('include', 'Sit with them every day', 'Made sure {person} had someone to sit with every day.', 'looking out for a friend', { effects: { relationship: 8, stats: { charm: 2 } } }),
    option('kind', 'Say something kind', 'Said something kind to {person} at the gate.', 'a kind word', { effects: { relationship: 3 } }),
  ], 'kind', { when: { person: 'friend' } }),

  // Teen.
  decision('tn3_leavers_dance', 'teen', 'common', 'star', 'The school leavers’ dance is coming up.', [
    option('go', 'Go with friends', 'Went to the leavers’ dance with friends and danced all night.', 'the leavers’ dance', { effects: { stats: { happiness: 4, charm: 2 } } }),
    option('skip', 'Films at home instead', 'Skipped the dance and watched films at home.', 'a night of films', { effects: { stats: { happiness: 1 } } }),
  ], 'skip', { when: { minAge: 16 } }),
  decision('tn3_summer_job', 'teen', 'common', 'work', 'A summer job at the seaside, or a summer at home?', [
    option('seaside', 'The seaside cafe', 'Worked the summer at a seaside cafe. Sandy, sunburnt, happy.', 'a seaside summer', { effects: { gold: 600, stats: { happiness: 3 } } }),
    option('home', 'A summer at home', 'Spent the summer at home, reading in the garden.', 'a summer of reading', { effects: { stats: { happiness: 2 } } }),
  ], 'home', { when: { minAge: 16 } }),
  decision('tn3_diary', 'teen', 'uncommon', 'family', '{Person} read your diary.', [
    option('row', 'Have it out', 'Had a row with {person} that the whole street heard.', 'a row about a diary', { effects: { relationship: -6, stats: { happiness: -1 } } }),
    option('forgive', 'Let it go', 'Let it go. {Person} brought a cup of tea by way of apology.', 'an apology', { effects: { relationship: 3 } }),
  ], 'forgive', { when: { person: 'sibling' } }),
  decision('tn3_care_home', 'teen', 'common', 'heart', 'The care home wants teenagers to visit on Sundays.', [
    option('visit', 'Visit', 'Visited the care home on Sundays and learned to play whist.', 'Sunday visits', { effects: { stats: { charm: 3, happiness: 2 } } }),
    option('no', 'Not this year', 'Sent the care home a card at Christmas instead.', 'a card'),
  ], 'no'),

  // Young adult.
  decision('yg3_holiday_alone', 'young', 'common', 'star', 'A week away on your own, somewhere new?', [
    option('go', 'Go', 'A week on your own by a lake abroad. Read four books.', 'a week by a lake', { gate: { minGold: 800 }, gateReason: 'Not enough saved yet.', effects: { gold: -800, stats: { happiness: 5 } } }),
    option('stay', 'Save it for later', 'Stayed home and put the money aside for later.', 'money put aside', { effects: { gold: 200 } }),
  ], 'stay'),
  decision('yg3_dog_sit', 'young', 'common', 'paw', 'A friend needs someone to mind their dog for a month.', [
    option('sit', 'Mind the dog', 'Minded a friend’s dog for a month and missed it terribly after.', 'a borrowed dog', { effects: { stats: { happiness: 4, health: 2 } } }),
    option('no', 'Say no', 'Said no to the dog. The flat stayed tidy.', 'a tidy flat'),
  ], 'no', { when: { pet: false } }),
  decision('yg3_chess_club', 'young', 'common', 'book', 'A colleague runs a chess club on Thursdays. Join?', [
    option('join', 'Join', 'Joined the Thursday chess club and lost gracefully for a year.', 'the chess club', { effects: { hobby: 'chess', stats: { smarts: 2 } } }),
    option('no', 'Keep Thursdays free', 'Kept Thursdays for the sofa.', 'free Thursdays'),
  ], 'no', { when: { hobby: false, job: true } }),
  decision('yg3_deposit', 'young', 'common', 'money', 'Start saving hard for a deposit on a home?', [
    option('save', 'Save hard', 'Saved hard for a deposit. Fewer nights out, a growing pot.', 'saving for a deposit', { effects: { gold: 3000, stats: { happiness: -2 } } }),
    option('relax', 'Save a little', 'Kept a little back each month and enjoyed the rest.', 'a little saved', { effects: { stats: { happiness: 2 } } }),
  ], 'relax', { when: { home: ['renting'], minAge: 24 } }),
  decision('yg3_parent_birthday', 'young', 'common', 'family', '{Person} has a big birthday coming.', [
    option('trip', 'A weekend by the sea', 'Took {person} away for a birthday weekend by the sea.', 'a birthday weekend', { gate: { minGold: 600 }, gateReason: 'Not enough saved yet.', effects: { gold: -600, relationship: 10 } }),
    option('card', 'A card and a call', 'Sent {person} a card and rang on the day.', 'a birthday call', { effects: { relationship: 3 } }),
  ], 'card', { when: { person: 'parent', personMinAge: 50 } }),
  decision('yg3_spanish', 'young', 'common', 'book', 'The college runs evening classes in Spanish.', [
    option('take', 'Take the class', 'Took Spanish at the college and ordered dinner in it on holiday.', 'Spanish classes', { effects: { gold: -150, stats: { smarts: 3 } } }),
    option('skip', 'Another year', 'Left the Spanish for another year.', 'a class put off'),
  ], 'skip'),

  // Adult.
  decision('ad3_governor', 'adult', 'common', 'book', 'The school needs a parent governor.', [
    option('stand', 'Stand', 'Became a school governor. Meetings about the roof, mostly.', 'a school governor', { gate: { stat: { id: 'charm', min: 40 } }, gateReason: 'Needs a bit more confidence.', effects: { stats: { charm: 3 } } }),
    option('fete', 'Help at the fete', 'Let someone else be governor and ran the cake stall at the fete.', 'the school fete', { effects: { stats: { happiness: 1 } } }),
  ], 'fete', { when: { person: 'child', personMinAge: 5, personMaxAge: 16 } }),
  decision('ad3_garden', 'adult', 'common', 'house', 'The garden is a jungle. Tackle it?', [
    option('clear', 'Clear it', 'Spent the summer clearing the garden. Found a path nobody knew about.', 'a cleared garden', { effects: { stats: { health: 3, happiness: 3 } } }),
    option('wild', 'Leave it wild', 'Left the garden wild. The birds approve.', 'a wild garden'),
  ], 'wild', { when: { home: ['owned'] } }),
  decision('ad3_rabbit', 'adult', 'common', 'paw', '{Person} wants a rabbit.', [
    option('rabbit', 'Get a rabbit', 'A rabbit called {pet} joined the family, chosen by {person}.', 'a rabbit', { effects: { pet: 'rabbit', relationship: 5 } }),
    option('later', 'When they are older', 'Promised {person} a pet when they are older.', 'a promise'),
  ], 'later', { when: { person: 'child', personMinAge: 6, personMaxAge: 14, pet: false } }),
  decision('ad3_hospice_run', 'adult', 'common', 'health', 'The office is running a 10k for the hospice.', [
    option('run', 'Run it', 'Ran the 10k for the hospice in a team T-shirt.', 'a charity 10k', { gate: { stat: { id: 'health', min: 45 } }, gateReason: 'Needs to be fitter first.', effects: { stats: { health: 4, charm: 2 } } }),
    option('sponsor', 'Sponsor the runners', 'Sponsored everyone who ran and cheered at the finish.', 'cheering at the finish', { effects: { gold: -50 } }),
  ], 'sponsor', { when: { job: true } }),
  decision('ad3_two_of_you', 'adult', 'common', 'heart', 'A weekend away, just you and {person}?', [
    option('go', 'Book a cottage', 'A weekend in a cottage with {person}. Nobody mentioned work.', 'a weekend away', { gate: { minGold: 400 }, gateReason: 'Not enough spare this year.', effects: { gold: -400, relationship: 8 } }),
    option('home', 'A night in', 'A night in with {person}, a takeaway and an early film.', 'a night in', { effects: { relationship: 3 } }),
  ], 'home', { when: { person: 'partner' } }),
  decision('ad3_newer_car', 'adult', 'common', 'money', 'The car is getting old. Replace it?', [
    option('buy', 'Buy a newer one', 'Bought a newer car. Still miss the old one’s dents.', 'a newer car', { gate: { minGold: 6000 }, gateReason: 'Not enough saved yet.', effects: { gold: -6000, stats: { happiness: 3 } } }),
    option('keep', 'Keep it going', 'Kept the old car going. It owes nobody anything.', 'an old car kept'),
  ], 'keep', { when: { flags: ['car'], notFlags: ['no_car'] } }),
  decision('ad3_open_days', 'adult', 'uncommon', 'book', '{Person} wants to visit universities.', [
    option('tour', 'Go on the tours', 'Toured four universities with {person} and ate in every canteen.', 'open days', { effects: { relationship: 6, gold: -200 } }),
    option('brochures', 'Read the brochures', 'Went through the brochures with {person} at the kitchen table.', 'brochures', { effects: { relationship: 3 } }),
  ], 'brochures', { when: { person: 'child', personMinAge: 17, personMaxAge: 18 } }),
  decision('ad3_wedding_speech', 'adult', 'uncommon', 'ring', '{Person} asks you to speak at their wedding.', [
    option('speak', 'Give a speech', 'Spoke at {person}’s wedding and got a laugh in all the right places.', 'a wedding speech', { gate: { stat: { id: 'charm', min: 40 } }, gateReason: 'Needs a bit more confidence.', effects: { relationship: 8, stats: { charm: 3 } } }),
    option('toast', 'A quiet toast', 'Raised a quiet toast to {person} instead of a speech.', 'a quiet toast', { effects: { relationship: 2 } }),
  ], 'toast', { when: { person: 'friend' } }),
  decision('ad3_parent_holiday', 'adult', 'uncommon', 'family', 'Take {person} back to the seaside of their childhood?', [
    option('go', 'Take them', 'Took {person} back to the seaside town of their childhood.', 'a trip down memory lane', { gate: { minGold: 1000 }, gateReason: 'Not enough saved yet.', effects: { gold: -1000, relationship: 10, stats: { happiness: 3 } } }),
    option('photos', 'Look at old photos', 'Spent a long Sunday with {person} looking at old photographs.', 'old photographs', { effects: { relationship: 4 } }),
  ], 'photos', { when: { person: 'parent', personMinAge: 65 } }),

  // Senior.
  decision('sn3_free_course', 'senior', 'common', 'book', 'The college offers a free course for the over-sixties.', [
    option('art', 'Watercolours', 'Took the art course and painted the cat, badly, with love.', 'an art course', { effects: { stats: { happiness: 3 } } }),
    option('history', 'Local history', 'Took the local history course and corrected the lecturer once.', 'a history course', { effects: { stats: { smarts: 3 } } }),
    option('no', 'Not for you', 'Let the course go to someone keener.', 'a course passed up'),
  ], 'no', { when: { retired: true } }),
  decision('sn3_computer', 'senior', 'common', 'book', 'The library runs a computer class.', [
    option('learn', 'Learn', 'Learned to email at the library and wrote to everyone you know.', 'a computer class', { effects: { stats: { smarts: 3 } } }),
    option('letters', 'Stick to letters', 'Stuck to letters. They take longer and mean more.', 'letters'),
  ], 'letters'),
  decision('sn3_garden_patch', 'senior', 'common', 'house', '{Person} wants a patch of your garden.', [
    option('give', 'Give them a patch', 'Gave {person} a patch of garden. Radishes, mostly.', 'a garden patch', { effects: { relationship: 8 } }),
    option('share', 'Garden together', 'Let {person} help with your patch instead.', 'gardening together', { effects: { relationship: 4 } }),
  ], 'share', { when: { person: 'grandchild', personMinAge: 4, personMaxAge: 12, home: ['owned'] } }),
  decision('sn3_fifty_years', 'senior', 'uncommon', 'family', 'Fifty years since leaving school. A reunion?', [
    option('go', 'Go', 'Went to the reunion. Half the class still sit in the same order.', 'a school reunion', { effects: { addPerson: 'friend', stats: { happiness: 3 } } }),
    option('photo', 'Send a photo', 'Sent a photo to the reunion and heard it was passed round.', 'a photo sent'),
  ], 'photo', { when: { minAge: 66, maxAge: 70 } }),
  decision('sn3_pen_pal', 'senior', 'common', 'book', 'A school wants older pen pals for its pupils.', [
    option('write', 'Write', 'Wrote every month to a ten-year-old about the old days.', 'a young pen pal', { effects: { stats: { charm: 2, happiness: 3 } } }),
    option('no', 'Leave it', 'Left the pen pals to younger hands.', 'a letter unwritten'),
  ], 'no'),
  decision('sn3_charity_shop', 'senior', 'common', 'heart', 'The charity shop needs help on Wednesdays.', [
    option('help', 'Help out', 'Worked Wednesdays at the charity shop and priced everything at 50.', 'the charity shop', { effects: { addPerson: 'friend', stats: { happiness: 3 } } }),
    option('bags', 'Give some bags instead', 'Gave the charity shop two bags of clothes instead.', 'two bags of clothes'),
  ], 'bags', { when: { retired: true } }),
  decision('sn3_family_week', 'senior', 'uncommon', 'family', 'Take the whole family away for a week?', [
    option('go', 'Book a big house', 'Took the family to a big house by the sea for a week.', 'a family week away', { gate: { minGold: 3000 }, gateReason: 'Not enough saved.', effects: { gold: -3000, roleRelationship: { role: 'child', delta: 6 }, stats: { happiness: 5 } } }),
    option('lunch', 'Sunday lunch instead', 'Had everyone round for Sunday lunch instead.', 'a family lunch', { effects: { roleRelationship: { role: 'child', delta: 2 } } }),
  ], 'lunch', { when: { hasChildren: true } }),
]

/** Content v3's quiet lines: a few more for every stage and season, and for the year's end. */
export const packAmbient: readonly AmbientDef[] = [
  { stage: 'child', line: 'Making daisy chains on the field at lunch.', season: 'spring' },
  { stage: 'child', line: 'Paddling in the stream with jeans rolled up.', season: 'summer' },
  { stage: 'child', line: 'Conkers threaded on a shoelace.', season: 'autumn' },
  { stage: 'child', line: 'Sledge tracks on the hill by the school.', season: 'winter' },
  { stage: 'child', line: 'Writing a birthday list, longer than the last one.', yearEnd: true },
  { stage: 'child', line: 'Counting down the days to the holidays.', yearEnd: true },
  { stage: 'teen', line: 'The exam timetable stuck to the bedroom door.', season: 'spring' },
  { stage: 'teen', line: 'A long walk home in the warm dark.', season: 'summer' },
  { stage: 'teen', line: 'The smell of bonfires on the way to school.', season: 'autumn' },
  { stage: 'teen', line: 'Frost on the bus shelter, and nobody talking.', season: 'winter' },
  { stage: 'teen', line: 'Moving the posters round for the new year.', yearEnd: true },
  { stage: 'teen', line: 'Old school books in a box under the bed.', yearEnd: true },
  { stage: 'young', line: 'A picnic in the park on the first warm Saturday.', season: 'spring' },
  { stage: 'young', line: 'Shoes off on the grass on a long evening.', season: 'summer' },
  { stage: 'young', line: 'A conker in the coat pocket, for luck.', season: 'autumn' },
  { stage: 'young', line: 'Fairy lights in the window all through December.', season: 'winter' },
  { stage: 'young', line: 'Pinning up a new calendar.', yearEnd: true },
  { stage: 'young', line: 'A quiet night in, thinking about the year ahead.', yearEnd: true },
  { stage: 'adult', line: 'The washing out on the line for the first time in months.', season: 'spring' },
  { stage: 'adult', line: 'Ice cream from the van, chased down the street.', season: 'summer' },
  { stage: 'adult', line: 'Conkers on the mantelpiece, kept for luck.', season: 'autumn' },
  { stage: 'adult', line: 'Mince pies on the kitchen side from November on.', season: 'winter' },
  { stage: 'adult', line: 'Last year’s birthday cards, found in a drawer.', yearEnd: true },
  { stage: 'adult', line: 'A long walk on the last Sunday of the year.', yearEnd: true },
  { stage: 'senior', line: 'Primroses in the window box.', season: 'spring' },
  { stage: 'senior', line: 'Shelling peas on the back step.', season: 'summer' },
  { stage: 'senior', line: 'Blackberries from the hedge, and purple fingers.', season: 'autumn' },
  { stage: 'senior', line: 'A robin on the bird table every morning.', season: 'winter' },
  { stage: 'senior', line: 'Copying the birthdays into the new diary.', yearEnd: true },
  { stage: 'senior', line: 'The good tablecloth out for the turn of the year.', yearEnd: true },
]
