import type { DecisionDef, EventDef, OptionDef } from '../../sim/types'

type Rest = Omit<EventDef, 'id' | 'stage' | 'rarity' | 'glyph' | 'line' | 'note' | 'followUp'>
/** A follow-up: it needs the flag an earlier choice left, and the draw takes it first while unseen (`followUpPercent`). */
const after = (stage: EventDef['stage']) => (id: string, flag: string, glyph: EventDef['glyph'], line: string, note: string, rest: Rest = {}): EventDef => ({ id, stage, rarity: 'common', glyph, line, note, followUp: true, ...rest, when: { ...rest.when, flags: [flag] } })

const child = after('child')
const teen = after('teen')
const young = after('young')
const growing = after(['child', 'teen'])
const older = after(['teen', 'young'])

/**
 * The flag each childhood and teen option leaves (decision id, then option id), so a later year can pay it off. Before
 * v4 only ten options in the whole game left anything behind, and a choice was gone as soon as it was made.
 */
export const OPTION_FLAGS: Readonly<Record<string, Readonly<Record<string, string>>>> = {
  ch_club: { football: 'v4_club_football', friends: 'v4_club_football', drawing: 'v4_club_art', chess: 'v4_club_chess' },
  ch_piano_offer: { yes: 'v4_piano' },
  ch_bully: { stand: 'v4_stood_up', teacher: 'v4_told_teacher' },
  ch_audition: { lead: 'v4_stage_lead', part: 'v4_stage_part', crew: 'v4_stage_crew' },
  ch_pocket_money: { save: 'v4_saved_jar', spend: 'v4_sweets' },
  ch_new_kid: { befriend: 'v4_new_kid' },
  ch_summer: { camp: 'v4_camp', library: 'v4_reader', home: 'v4_played_out' },
  ch_sibling_blame: { own: 'v4_took_blame' },
  ch_garden: { grow: 'v4_grew_veg' },
  ch3_swim_team: { try: 'v4_swim_team' },
  ch3_sleepover: { go: 'v4_sleepover' },
  ch3_toy_sale: { spend: 'v4_kite' },
  tn_subjects: { sciences: 'v4_sciences', arts: 'v4_arts' },
  tn_party: { go: 'v4_party' },
  tn_council: { stand: 'v4_council' },
  tn_band: { join: 'v4_band' },
  tn_hair: { dye: 'v4_green_hair' },
  tn_shelter: { yes: 'v4_shelter' },
  tn_trip: { go: 'v4_trip' },
  tn_weekend: { running: 'v4_running', baking: 'v4_baking', fishing: 'v4_fishing' },
  tn3_care_home: { visit: 'v4_care_home' },
  tn3_summer_job: { seaside: 'v4_seaside' },
}

/** Warmer words for a few default lines that read as nothing happening. */
export const OPTION_LINES: Readonly<Record<string, Readonly<Record<string, string>>>> = {
  ch_new_kid: { leave: 'Stuck with the usual crowd at lunch, and waved at the new kid on the way out.' },
  tn_ask_out: { wait: 'Kept it quiet and wrote their name in the back of a notebook.' },
  tn_band: { no: 'Turned down the band, then went to every gig and clapped the loudest.' },
}

/** Earlier choices paying off, a year or more later. */
export const followUps: readonly EventDef[] = [
  // Clubs and hobbies picked in childhood.
  growing('ch4_goal', 'v4_club_football', 'star', 'Scored for the club from the halfway line. Nobody has let it go since.', 'a famous goal', { effects: { stats: { charm: 2, happiness: 3 } } }),
  teen('tn4_captain', 'v4_club_football', 'star', 'Made captain of the football team and learned every name on the bench.', 'the captaincy', { effects: { stats: { charm: 3 } } }),
  growing('ch4_library_wall', 'v4_club_art', 'star', 'A painting from art club went up in the town library, with a little card.', 'a painting on show', { effects: { stats: { happiness: 4, charm: 1 } } }),
  teen('tn4_mural', 'v4_club_art', 'star', 'Painted a mural on the school bike shed. The bikes never looked better.', 'a mural', { effects: { stats: { happiness: 3 } } }),
  growing('ch4_beat_teacher', 'v4_club_chess', 'book', 'Beat the chess club teacher for the first time and got a handshake.', 'a chess win', { effects: { stats: { smarts: 3, happiness: 2 } } }),
  teen('tn4_county_chess', 'v4_club_chess', 'book', 'Played chess for the county and came home with a small, heavy trophy.', 'a county trophy', { effects: { stats: { smarts: 3, charm: 1 } } }),
  growing('ch4_concert', 'v4_piano', 'star', 'Played the piano at the school concert. A wrong note in bar four, and kept going.', 'a concert', { effects: { stats: { charm: 3, happiness: 2 } } }),
  teen('tn4_piano_grade', 'v4_piano', 'book', 'Passed grade three on the piano. The neighbour who taught you sent a card.', 'a piano grade', { effects: { stats: { smarts: 2, happiness: 2 } } }),
  growing('ch4_prize_veg', 'v4_grew_veg', 'house', 'The vegetable patch grew strawberries. Ate most of them warm, straight off the plant.', 'strawberries', { effects: { stats: { happiness: 3, health: 1 } } }),
  teen('tn4_marrow', 'v4_grew_veg', 'house', 'Won second prize for a marrow at the village show, with a rosette.', 'a prize marrow', { effects: { stats: { happiness: 3, charm: 1 } } }),
  growing('ch4_gala', 'v4_swim_team', 'health', 'Swam the last leg at the swimming gala and touched the wall first.', 'a gala win', { effects: { stats: { health: 3, happiness: 3 } } }),

  // Standing up, owning up, making friends.
  growing('ch4_apology', 'v4_stood_up', 'heart', 'The old lunch thief said sorry at the bus stop. It had taken them a while.', 'an apology', { effects: { stats: { happiness: 3, charm: 1 } } }),
  growing('ch4_look_out', 'v4_told_teacher', 'heart', 'Kept an eye out for the younger ones at lunch, the way that teacher had.', 'looking out for others', { effects: { stats: { charm: 3 } } }),
  growing('ch4_best_friend', 'v4_new_kid', 'family', 'The new kid from that first lunch is still your best friend. Matching bikes too.', 'a best friend', { effects: { stats: { happiness: 3, charm: 1 } } }),
  growing('ch4_vase', 'v4_took_blame', 'family', '{Person} owned up about the vase at last, in front of the whole family.', 'the vase, owned up', { when: { person: 'sibling' }, effects: { relationship: 6, stats: { happiness: 2 } } }),
  child('ch4_sleepover_back', 'v4_sleepover', 'family', 'Hosted a sleepover in return. Six sleeping bags on the front room floor.', 'a sleepover at home', { effects: { stats: { happiness: 3, charm: 1 } } }),

  // The stage.
  growing('ch4_lead_again', 'v4_stage_lead', 'star', 'Got the lead in the next play too, and learned the lines in the bath.', 'another lead role', { effects: { stats: { charm: 3 } } }),
  growing('ch4_four_lines', 'v4_stage_part', 'star', 'A bigger part in the next play, with four lines. Delivered all four.', 'a bigger part', { effects: { stats: { charm: 2, happiness: 2 } } }),
  growing('ch4_lighting', 'v4_stage_crew', 'star', 'Ran the lights for the school play from a ladder at the back of the hall.', 'the lighting', { effects: { stats: { smarts: 2, happiness: 2 } } }),

  // Pocket money and summers.
  child('ch4_jar_count', 'v4_saved_jar', 'money', 'Counted the savings jar out on the kitchen floor. More than expected.', 'a full jar', { effects: { gold: 40, stats: { happiness: 2 } } }),
  growing('ch4_kite_tree', 'v4_kite', 'star', 'The kite got stuck in the oak. Climbed up, scraped a knee, got it back.', 'a rescued kite', { effects: { stats: { health: -1, happiness: 3 } } }),
  growing('ch4_filling', 'v4_sweets', 'health', 'A filling at the dentist. Blamed the sweet shop, mostly.', 'a filling', { effects: { stats: { health: -2, happiness: -1 } } }),
  growing('ch4_pen_friend', 'v4_camp', 'family', 'A letter from a friend made at summer camp. Wrote back with drawings.', 'a pen friend', { effects: { stats: { charm: 2, happiness: 2 } } }),
  growing('ch4_reading_prize', 'v4_reader', 'book', 'Won the library reading challenge and got your name on the board.', 'a reading prize', { effects: { stats: { smarts: 3 } } }),
  growing('ch4_shortcuts', 'v4_played_out', 'family', 'Knew every shortcut in the neighbourhood and showed them to the little ones.', 'every shortcut', { effects: { stats: { health: 2, charm: 1 } } }),

  // Teen choices.
  teen('tn4_volcano', 'v4_sciences', 'book', 'Built a volcano for the science fair and singed the curtains.', 'the science fair', { effects: { stats: { smarts: 3 } } }),
  young('yg4_lab', 'v4_sciences', 'book', 'A summer placement in a lab, washing test tubes and asking questions.', 'a lab placement', { effects: { gold: 300, stats: { smarts: 3 } } }),
  teen('tn4_poem', 'v4_arts', 'book', 'A poem went in the school magazine. Pretended not to mind, and kept three copies.', 'a poem in print', { effects: { stats: { charm: 2, happiness: 2 } } }),
  young('yg4_order_lunch', 'v4_arts', 'star', 'Ordered lunch abroad in the language from school, without pointing once.', 'lunch abroad', { effects: { stats: { smarts: 2, happiness: 3 } } }),
  teen('tn4_scraped', 'v4_party', 'book', 'The exam after the party came back. Scraped through by two marks.', 'a close exam', { effects: { stats: { smarts: -1, happiness: -1 } } }),
  teen('tn4_bench', 'v4_council', 'star', 'Got the school to put a bench by the gates, as promised on the posters.', 'a bench by the gates', { effects: { stats: { charm: 3, happiness: 2 } } }),
  teen('tn4_fair_gig', 'v4_band', 'star', 'The band played the school fair. Forty people, most of them listening.', 'a gig at the fair', { effects: { stats: { charm: 2, happiness: 3 } } }),
  young('yg4_drumsticks', 'v4_band', 'star', 'Found the old drumsticks in a box and played along to the radio.', 'old drumsticks', { effects: { stats: { happiness: 2 } } }),
  older('tn4_teal_photos', 'v4_green_hair', 'family', 'Looked through the teal hair photos with {parent}, and you both laughed.', 'old photos', { when: { parentAlive: true }, effects: { roleRelationship: { role: 'parent', delta: 3 }, stats: { happiness: 2 } } }),
  teen('tn4_namesake', 'v4_shelter', 'paw', 'The shelter named a puppy after you. It grew enormous.', 'a namesake puppy', { effects: { stats: { happiness: 4 } } }),
  young('yg4_shelter_sundays', 'v4_shelter', 'paw', 'Still walking dogs for the shelter on Sundays, years on.', 'shelter Sundays', { effects: { stats: { happiness: 2, health: 2 } } }),
  older('tn4_letter_abroad', 'v4_trip', 'book', 'Wrote to the family from the school trip at Christmas, in their language.', 'a letter abroad', { effects: { stats: { smarts: 2, charm: 1 } } }),
  older('tn4_whist_card', 'v4_care_home', 'heart', 'A card from the care home, signed by every one of the whist players.', 'a card from the care home', { effects: { stats: { happiness: 3 } } }),
  older('tn4_cake', 'v4_baking', 'star', 'Baked the cake for a friend’s eighteenth. Three tiers, one wobble.', 'a birthday cake', { effects: { stats: { charm: 2, happiness: 2 } } }),
  older('tn4_10k', 'v4_running', 'health', 'Ran a whole 10k without stopping, then lay on the grass for an hour.', 'a 10k', { effects: { stats: { health: 4 } } }),
  older('tn4_proper_fish', 'v4_fishing', 'family', 'Caught a proper fish with {parent} at last, then let it go.', 'a proper fish', { when: { parentAlive: true }, effects: { roleRelationship: { role: 'parent', delta: 4 }, stats: { happiness: 2 } } }),
  older('tn4_cafe_again', 'v4_seaside', 'money', 'The seaside cafe asked you back for another summer, with a raise.', 'the cafe again', { when: { minAge: 17 }, effects: { gold: 700, stats: { happiness: 2 } } }),

  // The new choices below.
  child('ch4_lemonade_again', 'v4_lemonade', 'money', 'Ran the lemonade stall again, with a sign and a price list this time.', 'a better stall', { effects: { gold: 20, stats: { smarts: 1 } } }),
  growing('ch4_purse_thanks', 'v4_honest', 'heart', 'The owner of the purse from the park bought everything on your fair stall.', 'a thank-you', { effects: { gold: 15, stats: { happiness: 3 } } }),
  growing('ch4_orchestra', 'v4_violin', 'star', 'Played the violin in the school orchestra, second row, every note.', 'the orchestra', { effects: { stats: { charm: 2, smarts: 2 } } }),
  growing('ch4_last_note', 'v4_trumpet', 'star', 'Played the trumpet at the Remembrance service and held the last note.', 'the last post', { effects: { stats: { charm: 3 } } }),
  growing('ch4_club_meeting', 'v4_treehouse', 'family', 'Held secret club meetings in the treehouse. The password changed weekly.', 'a secret club', { effects: { stats: { charm: 2, happiness: 2 } } }),
  growing('ch4_crystals', 'v4_chem', 'book', 'The crystals from the chemistry set won a ribbon at science week.', 'a ribbon for crystals', { effects: { stats: { smarts: 2, happiness: 2 } } }),
  growing('ch4_spelling_final', 'v4_spelling', 'book', 'Back at the spelling bee and through to the final, out on “necessary”.', 'the spelling final', { effects: { stats: { smarts: 3, charm: 1 } } }),
  growing('ch4_hoglets', 'v4_hedgehog', 'paw', 'The hedgehog came back to the garden with three hoglets in tow.', 'hoglets', { effects: { stats: { happiness: 4 } } }),
  teen('tn4_bike', 'v4_paper_round', 'money', 'Bought a second-hand bike with the paper round money and rode it everywhere.', 'a bike of your own', { effects: { gold: -150, stats: { happiness: 4, health: 1 } } }),
  older('tn4_won_debate', 'v4_debate', 'book', 'Won a debate against the grammar school on whether cats beat dogs.', 'a debate win', { effects: { stats: { charm: 3, smarts: 1 } } }),
  young('yg4_moors', 'v4_hike', 'health', 'Went back to the moors on your own, with a proper map and a flask.', 'the moors again', { effects: { stats: { health: 3, happiness: 2 } } }),
  young('yg4_reading_card', 'v4_mentor', 'heart', 'A card from the pupil you helped with reading. They were off to university.', 'a card from a pupil', { when: { minAge: 23 }, effects: { stats: { happiness: 4 } } }),
  young('yg4_roast', 'v4_cook', 'star', 'Cooked a full roast for friends in a tiny kitchen, timed to the minute.', 'a roast for friends', { effects: { stats: { charm: 3, happiness: 2 } } }),
  older('tn4_bake_sale_again', 'v4_bake_sale', 'money', 'Asked to bake for the bake sale again. Brought a tray of flapjacks.', 'flapjacks', { effects: { gold: 10, stats: { charm: 2 } } }),
]

const decision = (stage: DecisionDef['stage'], id: string, glyph: DecisionDef['glyph'], prompt: string, options: readonly OptionDef[], fallback: string, when?: DecisionDef['when']): DecisionDef => ({ id, stage, rarity: 'common', major: false, glyph, prompt, options, default: fallback, ...(when ? { when } : {}) })

/** More childhood and teen choices, each leaving something for a later year. */
export const newDecisions: readonly DecisionDef[] = [
  decision('child', 'ch4_lemonade', 'money', 'A hot weekend. Sell lemonade at the end of the drive?', [
    { id: 'sell', label: 'Set up a stall', line: 'Sold lemonade at the end of the drive and made 12, plus a sunburn.', note: 'a lemonade stall', effects: { gold: 12, stats: { charm: 2 }, flag: 'v4_lemonade' } },
    { id: 'drink', label: 'Drink it yourself', line: 'Drank the lemonade in the shade with a comic.', note: 'lemonade in the shade', effects: { stats: { happiness: 2 } } },
  ], 'drink'),
  decision('child', 'ch4_purse', 'heart', 'Found a purse in the park with 20 in it.', [
    { id: 'doors', label: 'Find the owner', line: 'Knocked on doors until the purse found its owner. Got biscuits for it.', note: 'a purse returned', effects: { stats: { charm: 3, happiness: 2 }, flag: 'v4_honest' } },
    { id: 'shop', label: 'Hand it in at the shop', line: 'Handed the purse in at the corner shop and felt very grown up.', note: 'a purse handed in', effects: { stats: { charm: 1 } } },
  ], 'shop'),
  decision('child', 'ch4_instrument', 'star', 'Music lessons at school. Which instrument?', [
    { id: 'recorder', label: 'The recorder', line: 'Learned the recorder. The whole house learned it too.', note: 'the recorder', effects: { stats: { smarts: 1 } } },
    { id: 'violin', label: 'The violin', line: 'Took up the violin. It sounded like a cat for a year, then like music.', note: 'the violin', effects: { stats: { smarts: 2, happiness: 1 }, flag: 'v4_violin' } },
    { id: 'trumpet', label: 'The trumpet', line: 'Took up the trumpet and practised in the shed, by request.', note: 'the trumpet', effects: { stats: { charm: 2 }, flag: 'v4_trumpet' } },
  ], 'recorder', { minAge: 7 }),
  decision('child', 'ch4_treehouse', 'house', 'An old tree at the end of the garden. Build a den in it?', [
    { id: 'build', label: 'Build a treehouse', line: 'Built a treehouse out of borrowed planks. It leaned, but it held.', note: 'a treehouse', effects: { stats: { happiness: 4, smarts: 1, health: -1 }, flag: 'v4_treehouse' } },
    { id: 'climb', label: 'Just climb it', line: 'Left the tree as it was and climbed it most afternoons.', note: 'a climbing tree', effects: { stats: { health: 1 } } },
  ], 'climb'),
  decision('child', 'ch4_present', 'star', 'A chemistry set or a football for Christmas?', [
    { id: 'chem', label: 'The chemistry set', line: 'Got a chemistry set and grew crystals on the windowsill.', note: 'a chemistry set', effects: { stats: { smarts: 3 }, flag: 'v4_chem' } },
    { id: 'ball', label: 'The football', line: 'Got a new football and wore it smooth by spring.', note: 'a new football', effects: { stats: { health: 2 } } },
  ], 'ball'),
  decision('child', 'ch4_spelling', 'book', 'The school spelling bee. Enter?', [
    { id: 'enter', label: 'Enter', line: 'Came third in the spelling bee, out on “rhythm”.', note: 'the spelling bee', effects: { stats: { smarts: 3, charm: 1 }, flag: 'v4_spelling' } },
    { id: 'watch', label: 'Watch from the hall', line: 'Watched the spelling bee and spelled along under your breath.', note: 'spelling along', effects: { stats: { smarts: 1 } } },
  ], 'watch', { minAge: 8 }),
  decision('child', 'ch4_hedgehog', 'paw', 'A hedgehog has been visiting the garden at night.', [
    { id: 'feed', label: 'Leave food out', line: 'Left food out every night for the hedgehog and named it Prickles.', note: 'a hedgehog', effects: { stats: { happiness: 3 }, flag: 'v4_hedgehog' } },
    { id: 'watch', label: 'Watch with a torch', line: 'Watched for the hedgehog from the window with a torch.', note: 'hedgehog watching', effects: { stats: { happiness: 1 } } },
  ], 'watch'),
  decision('child', 'ch4_birthday', 'family', 'A birthday coming up. A party, or a day out?', [
    { id: 'party', label: 'A party at home', line: 'A birthday party at home with a cake shaped like a castle.', note: 'a castle cake', effects: { stats: { charm: 2, happiness: 3 } } },
    { id: 'trip', label: 'A day at the seaside', line: 'A birthday trip to the seaside, with chips on the harbour wall.', note: 'a seaside birthday', effects: { stats: { happiness: 3 } } },
  ], 'trip'),

  decision('teen', 'tn4_paper_round', 'money', 'A paper round, before school every day?', [
    { id: 'take', label: 'Take the round', line: 'Did a paper round in all weathers. Strong legs, cold ears.', note: 'a paper round', effects: { gold: 400, stats: { health: 2 }, flag: 'v4_paper_round' } },
    { id: 'sleep', label: 'Keep the lie-ins', line: 'Kept the lie-ins. Someone else’s bike rattled past at six.', note: 'lie-ins', effects: { stats: { happiness: 1 } } },
  ], 'sleep', { job: false }),
  decision('teen', 'tn4_debate', 'book', 'The debating team needs one more speaker.', [
    { id: 'join', label: 'Join the team', line: 'Joined the debating team and argued for school uniform, against your own views.', note: 'the debating team', effects: { stats: { smarts: 2, charm: 2 }, flag: 'v4_debate' } },
    { id: 'watch', label: 'Watch from the back', line: 'Watched the debates from the back row and took notes.', note: 'watching debates', effects: { stats: { smarts: 1 } } },
  ], 'watch'),
  decision('teen', 'tn4_hike', 'health', 'Sign up for three days on the moors with a tent, for a hiking award?', [
    { id: 'go', label: 'Sign up', line: 'Walked three days across the moors with a tent and a map, mostly the right way up.', note: 'three days on the moors', effects: { stats: { health: 4, charm: 1 }, flag: 'v4_hike' } },
    { id: 'skip', label: 'Not this year', line: 'Stayed home that weekend and heard all about the blisters.', note: 'a weekend at home', effects: { stats: { happiness: 1 } } },
  ], 'skip', { minAge: 14 }),
  decision('teen', 'tn4_mentor', 'heart', 'Help a younger pupil with their reading at lunch?', [
    { id: 'help', label: 'Help them', line: 'Helped a younger pupil with reading at lunch. They finished a whole book.', note: 'a reading buddy', effects: { stats: { charm: 3 }, flag: 'v4_mentor' } },
    { id: 'no', label: 'Keep lunch for yourself', line: 'Kept lunchtimes for yourself, a sandwich and a library book.', note: 'quiet lunches', effects: { stats: { happiness: 1 } } },
  ], 'no'),
  decision('teen', 'tn4_cook', 'family', 'Cook dinner for the family once a week?', [
    { id: 'cook', label: 'Take Thursdays', line: 'Cooked dinner every Thursday. Lots of pasta, one memorable curry.', note: 'Thursday dinners', effects: { stats: { smarts: 1, happiness: 2 }, flag: 'v4_cook' } },
    { id: 'wash', label: 'Do the washing up', line: 'Did the washing up instead, with the radio on loud.', note: 'the washing up', effects: { stats: { happiness: 1 } } },
  ], 'wash'),
  decision('teen', 'tn4_bake_sale', 'money', 'The school bake sale needs cakes.', [
    { id: 'bake', label: 'Bake for it', line: 'Baked forty fairy cakes for the bake sale. Sold out before break.', note: 'forty fairy cakes', effects: { stats: { charm: 2, happiness: 1 }, flag: 'v4_bake_sale' } },
    { id: 'buy', label: 'Buy instead', line: 'Bought three cakes at the bake sale and ate two on the way home.', note: 'cakes from the sale', effects: { stats: { happiness: 2 } } },
  ], 'buy'),
]
