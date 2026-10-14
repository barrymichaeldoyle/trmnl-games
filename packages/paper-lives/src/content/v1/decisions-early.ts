import type { DecisionDef, Effects, OptionDef, When } from '../../sim/types'

type Rest = Omit<DecisionDef, 'id' | 'stage' | 'rarity' | 'major' | 'glyph' | 'prompt' | 'options' | 'default'>
export const decision = (id: string, stage: DecisionDef['stage'], rarity: DecisionDef['rarity'], major: boolean, glyph: DecisionDef['glyph'], prompt: string, options: OptionDef[], fallback: string, rest: Rest = {}): DecisionDef => ({ id, stage, rarity, major, glyph, prompt, options, default: fallback, ...rest })
export const option = (id: string, label: string, line: string, note: string, effects?: Effects, gate?: When, gateReason?: string): OptionDef => ({ id, label, line, note, ...(effects ? { effects } : {}), ...(gate ? { gate } : {}), ...(gateReason ? { gateReason } : {}) })

/** Ages 6 to 12. Defaults are the gentle choice, and the ones that pick a hobby or a pet pick a modest one. */
export const childDecisions: readonly DecisionDef[] = [
  decision('ch_club', 'child', 'common', false, 'star', 'School clubs are starting. Which one?', [
    option('football', 'Football', 'Joined the football club. Muddy knees from now on.', 'football club', { hobby: 'football', stats: { health: 2 } }),
    option('drawing', 'Art club', 'Joined art club and came home covered in paint.', 'art club', { hobby: 'drawing', stats: { happiness: 2 } }),
    option('chess', 'Chess club', 'Joined chess club. Lost every game for a month, then won one.', 'chess club', { hobby: 'chess', stats: { smarts: 2 } }),
    option('friends', 'Whatever friends pick', 'Went along with friends to football club.', 'football club', { hobby: 'football' }),
  ], 'friends', { when: { hobby: false } }),
  decision('ch_pet', 'child', 'common', false, 'paw', 'Could the family get a pet?', [
    option('dog', 'Beg for a dog', 'Begged for a dog for a month. A puppy called {pet} arrived.', 'a puppy', { pet: 'dog', stats: { happiness: 5 } }),
    option('cat', 'Ask for a cat', 'A cat called {pet} came home from the rescue centre.', 'a cat', { pet: 'cat', stats: { happiness: 4 } }),
    option('goldfish', 'Settle for a goldfish', 'Settled for a goldfish called {pet}. Loved it fiercely.', 'a goldfish', { pet: 'goldfish', stats: { happiness: 2 } }),
  ], 'goldfish', { when: { pet: false } }),
  decision('ch_piano_offer', 'child', 'uncommon', false, 'book', 'A neighbour offers piano lessons for pocket money.', [
    option('yes', 'Take the lessons', 'Piano lessons on Wednesdays, with a metronome that ticks too loud.', 'piano lessons', { hobby: 'piano', stats: { smarts: 2 } }),
    option('no', 'Say no thank you', 'Politely said no to the piano. The neighbour played on regardless.', 'no piano'),
  ], 'no', { when: { hobby: false } }),
  decision('ch_bully', 'child', 'common', false, 'family', 'An older kid keeps taking your lunch.', [
    option('teacher', 'Tell a teacher', 'Told a teacher. It stopped, and nobody made a fuss.', 'telling a teacher', { stats: { happiness: 2 } }),
    option('stand', 'Stand up to them', 'Stood up to the lunch thief in the playground. It worked, just.', 'standing firm', { stats: { charm: 3, health: -2 } }, { traits: ['stubborn', 'sunny', 'restless'] }, 'Needs a bold trait'),
    option('parent', 'Tell {parent}', 'Told {parent}, who had a quiet word at the school gate.', 'a quiet word', { roleRelationship: { role: 'parent', delta: 3 } }),
  ], 'parent'),
  decision('ch_audition', 'child', 'common', false, 'star', 'Auditions for the school play.', [
    option('lead', 'Go for the lead', 'Got the lead in the school play and remembered every line.', 'the lead role', { stats: { charm: 5 } }, { stat: { id: 'charm', min: 45 } }, 'Needs Charm 45'),
    option('part', 'Ask for a small part', 'Played the innkeeper, with one line, delivered perfectly.', 'a small part', { stats: { charm: 2 } }),
    option('crew', 'Help backstage', 'Painted scenery for the play. The moon was very convincing.', 'stage crew', { stats: { happiness: 2 } }),
  ], 'crew'),
  decision('ch_pocket_money', 'child', 'common', false, 'money', 'Pocket money day. Save it or spend it?', [
    option('save', 'Save it in a jar', 'Saved pocket money in a jar for a whole year.', 'a savings jar', { gold: 60 }),
    option('spend', 'Spend it on sweets', 'Spent every penny at the sweet shop. No regrets.', 'sweets', { stats: { happiness: 3 } }),
  ], 'save'),
  decision('ch_new_kid', 'child', 'common', false, 'family', 'A new kid has joined the class and sits alone.', [
    option('befriend', 'Sit with them', 'Sat with the new kid, {person}, and found a best friend.', 'a best friend', { addPerson: 'friend', stats: { charm: 2, happiness: 2 } }),
    option('leave', 'Stick with your friends', 'Stuck with your usual friends at lunch.', 'the usual crowd'),
  ], 'leave'),
  decision('ch_summer', 'child', 'common', false, 'family', 'The long summer holiday. What to do?', [
    option('camp', 'Go to summer camp', 'A week at summer camp. Canoes, midges and a new friend.', 'summer camp', { stats: { health: 2, charm: 2 } }),
    option('library', 'Read through the library', 'Read forty books from the library over the summer.', 'a summer of books', { stats: { smarts: 4 } }),
    option('home', 'Stay home and play out', 'Played out until the streetlights came on, every day.', 'playing out', { stats: { happiness: 3 } }),
  ], 'home'),
  decision('ch_sibling_blame', 'child', 'uncommon', false, 'family', '{Person} broke the vase and blamed you.', [
    option('own', 'Take the blame anyway', 'Took the blame for {person}’s vase. Never forgotten.', 'taking the blame', { relationship: 10, stats: { happiness: -2 } }),
    option('tell', 'Tell the truth', 'Told the truth about the vase. {Person} sulked for days.', 'telling the truth', { relationship: -5 }),
  ], 'tell', { when: { person: 'sibling' } }),
  decision('ch_garden', 'child', 'uncommon', false, 'house', 'You can have a patch of the garden to grow things.', [
    option('grow', 'Grow vegetables', 'Grew carrots in a patch by the fence. Small, but yours.', 'a vegetable patch', { hobby: 'gardening' }),
    option('no', 'Leave it to the grown-ups', 'Left the garden to the grown-ups and kept the football.', 'no garden'),
  ], 'grow', { when: { hobby: false } }),
]

/** Ages 13 to 17. */
export const teenDecisions: readonly DecisionDef[] = [
  decision('tn_subjects', 'teen', 'common', false, 'book', 'Time to pick subjects for the exams.', [
    option('sciences', 'Sciences', 'Picked the sciences. Lots of graphs.', 'the sciences', { stats: { smarts: 4 } }),
    option('arts', 'Arts and languages', 'Picked arts and languages. Lots of reading aloud.', 'the arts', { stats: { charm: 3, smarts: 1 } }),
    option('mix', 'A bit of everything', 'Picked a mix of subjects and kept every door open.', 'a mix of subjects', { stats: { smarts: 2, charm: 1 } }),
  ], 'mix'),
  decision('tn_saturday', 'teen', 'common', false, 'work', 'A Saturday job, or more time for school work?', [
    option('job', 'Get a Saturday job', 'Went looking for a Saturday job and found one.', 'a Saturday job', { job: 'offer' }),
    option('study', 'Focus on school', 'Kept Saturdays for homework and a long lie-in.', 'school work', { stats: { smarts: 3 } }),
  ], 'study', { when: { job: false, minAge: 14 } }),
  decision('tn_party', 'teen', 'common', false, 'star', 'An invite to a party on the night before an exam.', [
    option('go', 'Go to the party', 'Went to the party, came home at one, sat the exam on toast and luck.', 'a party', { stats: { charm: 3, smarts: -2 } }),
    option('stay', 'Stay in and revise', 'Stayed in and revised. Heard all about the party later.', 'revision', { stats: { smarts: 2 } }),
  ], 'stay'),
  decision('tn_driving_lessons', 'teen', 'common', false, 'money', 'Driving lessons cost 600. Learn now?', [
    option('learn', 'Book the lessons', 'Passed the driving test at the second try.', 'a driving test', { gold: -600, stats: { happiness: 3 } }, { minGold: 600 }, 'Needs 600'),
    option('wait', 'Wait a few years', 'Put off driving. The bus is fine.', 'waiting on driving'),
  ], 'wait', { when: { minAge: 17 } }),
  decision('tn_ask_out', 'teen', 'common', false, 'heart', 'You like someone from the swimming club. Ask them out?', [
    option('ask', 'Ask them out', 'Asked {person} to the cinema. A yes, then popcorn everywhere.', 'a first date', { addPerson: 'partner', stats: { happiness: 5 } }),
    option('wait', 'Keep it to yourself', 'Kept it quiet. Probably for the best, probably.', 'a secret crush'),
  ], 'wait', { when: { minAge: 16, partner: false } }),
  decision('tn_trip', 'teen', 'common', false, 'book', 'A school trip abroad. It costs 400.', [
    option('go', 'Go on the trip', 'Went on the trip abroad and came back with a new word for bread.', 'a trip abroad', { gold: -400, stats: { smarts: 3, happiness: 3 } }, { minGold: 400 }, 'Needs 400'),
    option('skip', 'Stay home', 'Stayed home and heard all about it on the coach back.', 'staying home'),
  ], 'skip'),
  decision('tn_council', 'teen', 'common', false, 'star', 'Stand for the school council?', [
    option('stand', 'Stand', 'Stood for the school council and won on a promise of better chips.', 'the school council', { stats: { charm: 4 } }),
    option('vote', 'Just vote', 'Voted for a friend, who lost, graciously.', 'a vote'),
  ], 'vote'),
  decision('tn_weekend', 'teen', 'common', false, 'star', 'Something for the weekends?', [
    option('running', 'Running club', 'Joined the running club. Early Sundays on the towpath.', 'running club', { hobby: 'running', stats: { health: 3 } }),
    option('baking', 'Baking', 'Took over the kitchen on Sundays and baked everything in the book.', 'baking', { hobby: 'baking', stats: { happiness: 2 } }),
    option('fishing', 'Fishing with {parent}', 'Went fishing with {parent} at weekends. Caught very little.', 'fishing', { hobby: 'fishing', roleRelationship: { role: 'parent', delta: 4 } }),
  ], 'running', { when: { hobby: false } }),
  decision('tn_band', 'teen', 'uncommon', false, 'star', 'Friends are starting a band and need a drummer.', [
    option('join', 'Join the band', 'Played drums in a garage band. Two gigs, one fan.', 'a band', { stats: { charm: 3, happiness: 3 } }),
    option('no', 'Say no', 'Turned down the band. Went to their gig and clapped loudly.', 'a gig'),
  ], 'no'),
  decision('tn_hair', 'teen', 'common', false, 'family', 'You want to dye your hair green. {Parent} is not keen.', [
    option('dye', 'Dye it anyway', 'Dyed your hair green. It came out more of a teal.', 'green hair', { stats: { happiness: 3 }, roleRelationship: { role: 'parent', delta: -3 } }),
    option('wait', 'Wait until after school', 'Agreed to wait until after school. Kept a picture of the colour.', 'patience'),
  ], 'wait'),
  decision('tn_shelter', 'teen', 'uncommon', false, 'family', 'The animal shelter needs volunteers at weekends.', [
    option('yes', 'Volunteer', 'Volunteered at the animal shelter. Smelled of dog every Sunday.', 'volunteering', { stats: { charm: 2, happiness: 3 } }),
    option('no', 'Not this year', 'Gave the shelter a donation from the Saturday job instead.', 'a donation'),
  ], 'no'),
  decision('tn_festival', 'teen', 'uncommon', false, 'star', 'A music festival on the same weekend as the family holiday.', [
    option('festival', 'Go to the festival', 'Went to the festival. Slept in a field, happy and damp.', 'a festival', { stats: { happiness: 4 }, roleRelationship: { role: 'parent', delta: -2 } }),
    option('holiday', 'Go on the holiday', 'Went on the family holiday. Secretly enjoyed it.', 'a family holiday', { roleRelationship: { role: 'parent', delta: 4 } }),
  ], 'holiday', { when: { minAge: 16 } }),
]

/** Ages 18 to 29. The education choice at 18 is forced: every life makes it. */
export const youngDecisions: readonly DecisionDef[] = [
  decision('yg_education', 'young', 'common', true, 'book', 'Eighteen. University, a trade, or straight to work?', [
    option('university', 'University', 'Off to university with a suitcase and a box of pans.', 'university', { education: 'university', stats: { smarts: 3 } }, { stat: { id: 'smarts', min: 50 } }, 'Needs Smarts 50'),
    option('trade', 'Learn a trade', 'Started an apprenticeship. Early starts, steel-capped boots.', 'an apprenticeship', { education: 'trade', stats: { health: 1 } }),
    option('work', 'Straight to work', 'Went straight into work and kept the first payslip.', 'starting work', { education: 'work', job: 'offer' }),
  ], 'work', { forced: true, when: { minAge: 18, maxAge: 18 } }),
  decision('yg_leave_home', 'young', 'common', false, 'house', 'Time to move out of the family home?', [
    option('move', 'Rent a room', 'Moved into a rented room with a sink in the corner.', 'moving out', { home: 'renting', stats: { happiness: 3 } }),
    option('stay', 'Stay a while longer', 'Stayed at home a while longer and saved some rent.', 'staying at home', { gold: 1_500 }),
  ], 'stay', { when: { home: ['family'], minAge: 19 } }),
  decision('yg_flat_share', 'young', 'common', false, 'house', 'A friend needs a flatmate. Share or live alone?', [
    option('share', 'Share with a friend', 'Moved in with {person}. A rota for the bins was drawn up.', 'sharing a flat', { relationship: 6, gold: 800 }),
    option('alone', 'Live alone', 'Kept a place of your own. Quiet, tidy and a bit dear.', 'living alone'),
  ], 'alone', { when: { person: 'friend', home: ['renting'] } }),
  decision('yg_propose', ['young', 'adult'], 'common', true, 'ring', 'Things are good with {person}. Propose?', [
    option('propose', 'Propose', 'Proposed to {person} on the hill above town. A yes, and a hug.', 'an engagement', { partner: 'engaged', relationship: 8, stats: { happiness: 5 } }),
    option('wait', 'Not yet', 'Decided not to rush things with {person}.', 'taking things slowly'),
  ], 'wait', { when: { person: 'partner', partner: 'dating', personMinRelationship: 55, minAge: 21 } }),
  decision('yg_wedding', ['young', 'adult', 'senior'], 'common', true, 'ring', 'Engaged to {person}. Set a date?', [
    option('big', 'A big wedding', 'Married {person} in front of everyone, with a ceilidh after.', 'a big wedding', { partner: 'married', gold: -8_000, stats: { happiness: 6 } }, { minGold: 8_000 }, 'Needs 8,000'),
    option('small', 'A small wedding', 'Married {person} at the registry office, then lunch for twelve.', 'a small wedding', { partner: 'married', gold: -1_500, stats: { happiness: 5 } }),
    option('wait', 'Next year', 'Pushed the wedding back a year. Nobody minded much.', 'a long engagement'),
  ], 'small', { when: { person: 'partner', partner: 'engaged' } }),
  decision('yg_family', ['young', 'adult'], 'common', true, 'pram', 'Start a family with {person}?', [
    option('yes', 'Yes, let’s', 'A baby on the way. {Person} painted the spare room yellow.', 'starting a family', { addPerson: 'child', flag: 'family_open', stats: { happiness: 5 } }),
    option('later', 'When it happens', 'Decided to let a family come when it comes.', 'an open door', { flag: 'family_open' }),
    option('no', 'Not for us', 'Talked it through with {person}. Not for you two, and that is fine.', 'a quiet decision', { flag: 'no_children' }),
  ], 'later', { when: { person: 'partner', hasChildren: false, notFlags: ['family_open', 'no_children'], minAge: 22, maxAge: 42 } }),
  decision('yg_house', ['young', 'adult', 'senior'], 'common', true, 'house', 'There is enough saved to buy a place.', [
    option('flat', 'A flat', 'Bought {house}, with a view of the car park and a new kettle.', 'buying a flat', { house: 1, stats: { happiness: 4 } }, { minGold: 60_000 }, 'Needs 60,000'),
    option('terrace', 'A terraced house', 'Bought {house} with a yard and a temperamental boiler.', 'buying a house', { house: 2, stats: { happiness: 5 } }, { minGold: 110_000 }, 'Needs 110,000'),
    option('garden', 'A house with a garden', 'Bought {house}. Stood in the garden in your socks.', 'buying a house', { house: 3, stats: { happiness: 6 } }, { minGold: 180_000 }, 'Needs 180,000'),
    option('rent', 'Keep renting', 'Kept renting for now and left the savings where they are.', 'renting on'),
  ], 'rent', { when: { home: ['renting', 'family'], minGold: 60_000, minAge: 25 } }),
  decision('yg_ask_raise', ['young', 'adult'], 'common', false, 'work', 'You have been doing more for the same money. Ask for a raise?', [
    option('ask', 'Ask', 'Asked for a raise and got one, after a pause.', 'a raise', { job: 'promote' }, { stat: { id: 'charm', min: 40 } }, 'Needs Charm 40'),
    option('quiet', 'Say nothing', 'Kept your head down and your thoughts to yourself.', 'keeping quiet'),
  ], 'quiet', { when: { job: true } }),
  decision('yg_travel', 'young', 'common', false, 'star', 'A friend is going travelling for three months. Join them?', [
    option('go', 'Go travelling', 'Three months of trains and hostels with {person}. Came back thin and happy.', 'travelling', { gold: -2_500, relationship: 8, stats: { happiness: 6, charm: 3 } }, { minGold: 2_500 }, 'Needs 2,500'),
    option('stay', 'Stay home', 'Waved {person} off at the airport and got postcards.', 'postcards'),
  ], 'stay', { when: { person: 'friend' } }),
  decision('yg_evening_course', ['young', 'adult'], 'common', false, 'book', 'Work will pay half for an evening course.', [
    option('take', 'Take the course', 'Took the evening course and passed with a distinction.', 'an evening course', { stats: { smarts: 4 }, gold: -300 }),
    option('skip', 'Not this year', 'Let the course go. Evenings stayed free.', 'free evenings'),
  ], 'skip', { when: { job: true } }),
  decision('yg_pet', ['young', 'adult'], 'common', false, 'paw', 'The rescue centre has a cat who needs a home.', [
    option('cat', 'Take the cat', 'Brought home a cat called {pet}, who took the best chair at once.', 'a rescue cat', { pet: 'cat', stats: { happiness: 4 } }),
    option('no', 'Not right now', 'Gave the rescue centre a donation instead.', 'a donation'),
  ], 'no', { when: { pet: false } }),
  decision('yg_running_partner', 'young', 'common', false, 'health', 'A friend wants a running partner for the mornings.', [
    option('run', 'Start running', 'Started running at dawn with a friend. Hated it, then loved it.', 'morning runs', { hobby: 'running', stats: { health: 4 } }),
    option('sleep', 'Keep the lie-ins', 'Kept the lie-ins. Waved at the runners from the window.', 'lie-ins'),
  ], 'sleep', { when: { hobby: false } }),
  decision('yg_save_spend', 'young', 'common', false, 'money', 'A bonus at work. What to do with it?', [
    option('save', 'Save it', 'Put the bonus straight into savings.', 'savings', { gold: 1_200 }),
    option('spend', 'A good holiday', 'Spent the bonus on a week by a lake.', 'a lakeside week', { stats: { happiness: 5 } }),
  ], 'save', { when: { job: true } }),
  decision('yg_wedding_abroad', 'young', 'uncommon', false, 'ring', '{Person} is getting married abroad. Fly out?', [
    option('go', 'Go to the wedding', 'Flew out for {person}’s wedding and danced on a terrace.', 'a wedding abroad', { gold: -900, relationship: 8, stats: { happiness: 4 } }),
    option('card', 'Send a card', 'Sent a card and a toaster to {person}’s wedding.', 'a wedding card', { relationship: -2 }),
  ], 'card', { when: { person: 'friend' } }),
  decision('yg_instrument', 'young', 'uncommon', false, 'star', 'A second-hand piano is going free to anyone who can carry it.', [
    option('take', 'Take the piano', 'Got the piano up the stairs with four friends and a lot of shouting.', 'a free piano', { hobby: 'piano', stats: { happiness: 3 } }),
    option('leave', 'Leave it', 'Left the piano for someone with a ground-floor flat.', 'no piano'),
  ], 'leave', { when: { hobby: false } }),
  decision('yg_job_abroad', 'young', 'uncommon', true, 'work', 'A year’s work abroad. Go?', [
    option('go', 'Go', 'A year working abroad. New language, new friends, a lot of letters home.', 'a year abroad', { stats: { smarts: 3, charm: 4, happiness: 4 }, roleRelationship: { role: 'parent', delta: -3 }, addPerson: 'friend' }),
    option('stay', 'Stay where you are', 'Turned the job abroad down. Stayed near the people you know.', 'staying put'),
  ], 'stay', { eventOnly: true, when: { job: true } }),
  decision('yg_pie_stall', 'young', 'uncommon', false, 'money', 'Go into the pie stall with {person}?', [
    option('invest', 'Put in 2,000', 'Went halves with {person} on a pie stall at the market.', 'a pie stall', { gold: -2_000, relationship: 10, flag: 'pie_stall' }, { minGold: 2_000 }, 'Needs 2,000'),
    option('luck', 'Wish them luck', 'Wished {person} luck with the pies and bought the first one.', 'the first pie', { relationship: 2 }),
  ], 'luck', { eventOnly: true, when: { person: 'friend' } }),
  decision('yg_buy_car', 'young', 'common', false, 'money', 'A small car for sale on the street, 2,500.', [
    option('buy', 'Buy it', 'Bought the little car. Named it after a weather presenter.', 'a car', { gold: -2_500, flag: 'car', stats: { happiness: 3 } }, { minGold: 2_500 }, 'Needs 2,500'),
    option('bus', 'Stick with the bus', 'Stuck with the bus and a good book.', 'the bus'),
  ], 'bus', { when: { notFlags: ['car'], minAge: 19 } }),
  decision('yg_volunteer', 'young', 'uncommon', false, 'family', 'The food bank needs drivers on Saturdays.', [
    option('help', 'Help out', 'Drove for the food bank on Saturdays. Met {person} there.', 'volunteering', { addPerson: 'friend', stats: { happiness: 3, charm: 2 } }),
    option('donate', 'Donate instead', 'Gave a monthly donation to the food bank.', 'a donation', { gold: -300 }),
  ], 'donate'),
  decision('yg_reconnect', ['young', 'adult'], 'uncommon', false, 'family', 'You and {person} have not spoken properly in years.', [
    option('call', 'Call them', 'Rang {person}. Two hours, and a plan to meet.', 'a long phone call', { relationship: 12 }),
    option('leave', 'Let it be', 'Let it be. Thought about {person} now and then.', 'letting it be'),
  ], 'leave', { when: { person: 'sibling', personMaxRelationship: 45 } }),
]
