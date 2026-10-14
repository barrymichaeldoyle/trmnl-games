import type { EventDef } from '../../sim/types'

type Rest = Omit<EventDef, 'id' | 'stage' | 'rarity' | 'glyph' | 'line' | 'note'>
const young = (id: string, rarity: EventDef['rarity'], glyph: EventDef['glyph'], line: string, note: string, rest: Rest = {}): EventDef => ({ id, stage: 'young', rarity, glyph, line, note, ...rest })

/** Ages 18 to 29: leaving home, study or work, partners, the first flat. */
export const youngEvents: readonly EventDef[] = [
  // Friends and family.
  young('yg_flatmate', 'common', 'family', 'A new flatmate, {person}, who labels everything in the fridge.', 'a new flatmate', { when: { home: ['renting'] }, effects: { addPerson: 'friend' } }),
  young('yg_friend_quiz', 'common', 'family', 'Joined a pub quiz team with {person}. Came second, every week.', 'quiz nights', { effects: { addPerson: 'friend', stats: { smarts: 1, happiness: 2 } } }),
  young('yg_colleague', 'common', 'work', '{Person} from work turned out to be good company.', 'a work friend', { when: { job: true }, effects: { addPerson: 'colleague', stats: { happiness: 2 } } }),
  young('yg_sunday_lunch', 'common', 'family', 'Went home for Sunday lunch and left with a bag of leftovers.', 'Sunday lunch', { when: { parentAlive: true }, effects: { roleRelationship: { role: 'parent', delta: 3 } } }),
  young('yg_parent_call', 'common', 'family', '{Person} rang every Sunday at six, without fail.', 'Sunday calls', { when: { person: 'parent' }, effects: { relationship: 4 } }),
  young('yg_sibling_wedding', 'uncommon', 'ring', '{Person} got married. You gave a speech that went on a bit.', 'a family wedding', { when: { person: 'sibling' }, effects: { relationship: 5, stats: { charm: 2 } } }),
  young('yg_friend_trip', 'common', 'family', 'A long weekend in a cottage with {person} and too much cheese.', 'a weekend away', { when: { person: 'friend' }, effects: { relationship: 5, stats: { happiness: 3 } } }),
  young('yg_lost_touch', 'common', 'family', 'Lost touch with {person}. Nobody meant to.', 'losing touch', { when: { person: 'friend' }, effects: { relationship: -10 } }),
  young('yg_reunion', 'uncommon', 'family', 'Bumped into {person} after years apart. Talked until closing.', 'an old friend', { when: { person: 'friend', personKnownYears: 5 }, effects: { relationship: 8, stats: { happiness: 3 } } }),
  young('yg_birthday_surprise', 'common', 'family', 'Friends threw a surprise party. You had guessed, but acted well.', 'a surprise party', { effects: { stats: { happiness: 4, charm: 1 } } }),
  // Home.
  young('yg_mould', 'common', 'house', 'Damp in the bathroom. Bleached the ceiling twice.', 'damp', { when: { home: ['renting'] }, effects: { stats: { health: -2 } } }),
  young('yg_landlord', 'common', 'house', 'The landlord put the rent up again.', 'a rent rise', { when: { home: ['renting'] }, effects: { gold: -400, stats: { happiness: -2 } } }),
  young('yg_houseplant', 'common', 'house', 'Bought a fern for the windowsill and kept it alive all year.', 'a fern', { effects: { stats: { happiness: 1 } } }),
  young('yg_moved_flat', 'uncommon', 'house', 'Moved to a better flat with a window that looks at a tree.', 'a new flat', { when: { home: ['renting'] }, effects: { gold: -500, stats: { happiness: 4 } } }),
  young('yg_back_home', 'uncommon', 'house', 'Back in the old bedroom for a while to save money. Same posters.', 'moving back home', { when: { home: ['renting'], money: ['debt', 'low'], parentAlive: true }, effects: { home: 'family', stats: { happiness: -3 } } }),
  young('yg_flat_out', 'common', 'house', 'Moved out of the family home into a small rented room.', 'moving out', { when: { home: ['family'], minAge: 19 }, effects: { home: 'renting', stats: { happiness: 3 } } }),
  // Work and money.
  young('yg_late_shift', 'common', 'work', 'Covered three late shifts in a row. Slept through Sunday.', 'late shifts', { when: { job: true }, effects: { gold: 300, stats: { health: -2 } } }),
  young('yg_payday', 'common', 'money', 'Payday. Paid the bills, then bought good bread.', 'payday', { when: { job: true }, effects: { stats: { happiness: 2 } } }),
  young('yg_boss_praise', 'common', 'work', 'The manager said “good work” in front of everyone. Glowed all day.', 'praise at work', { when: { job: true }, effects: { stats: { happiness: 3, charm: 1 } } }),
  young('yg_raise', 'uncommon', 'work', 'A pay rise, small but welcome.', 'a raise', { when: { job: true }, effects: { job: 'promote', stats: { happiness: 3 } } }),
  young('yg_redundant', 'rare', 'work', 'The firm closed the branch. Cleared out your locker in a box.', 'losing a job', { when: { job: true }, effects: { job: 'lose', stats: { happiness: -6 } } }),
  young('yg_job_hunt', 'common', 'work', 'Sent out applications all spring and got a job at the end of it.', 'a job hunt', { when: { job: false, education: ['work', 'trade', 'degree'] }, effects: { job: 'offer', stats: { happiness: 2 } } }),
  young('yg_overdraft', 'common', 'money', 'Into the overdraft by the 20th. Ate a lot of soup.', 'an overdraft', { when: { money: ['low', 'debt'] }, effects: { gold: -300, stats: { happiness: -2 } } }),
  young('yg_budget', 'common', 'money', 'Started keeping a budget in a notebook. It mostly works.', 'a budget', { effects: { gold: 400 } }),
  young('yg_tax_rebate', 'uncommon', 'money', 'A tax rebate of 420 arrived out of the blue.', 'a tax rebate', { when: { job: true }, effects: { gold: 420 } }),
  young('yg_car', 'uncommon', 'money', 'Bought a second-hand car with 90,000 miles and a good heart.', 'a car', { when: { minGold: 3_000, notFlags: ['car'] }, effects: { gold: -2_500, flag: 'car', stats: { happiness: 3 } } }),
  young('yg_car_fail', 'common', 'money', 'The car failed its test. Brakes, tyres and a mystery noise.', 'car repairs', { when: { flags: ['car'] }, effects: { gold: -600 } }),
  young('yg_course', 'common', 'book', 'Night classes in accounts. Dull, but the certificate looks good.', 'night classes', { when: { job: true }, effects: { stats: { smarts: 3 } } }),
  // Study.
  young('yg_uni_halls', 'common', 'book', 'Halls of residence. A corridor of strangers, then friends.', 'halls', { when: { education: ['university'] }, effects: { addPerson: 'friend', stats: { charm: 2 } } }),
  young('yg_uni_essay', 'common', 'book', 'Wrote an essay through the night and handed it in at 8:59.', 'an essay', { when: { education: ['university'] }, effects: { stats: { smarts: 3, health: -1 } } }),
  young('yg_uni_loan', 'common', 'money', 'The student loan ran out in week nine. Pasta and ketchup.', 'a lean term', { when: { education: ['university'] }, effects: { gold: -300 } }),
  young('yg_uni_society', 'common', 'star', 'Joined the hiking society and walked up a lot of wet hills.', 'the hiking society', { when: { education: ['university'] }, effects: { stats: { health: 3 } } }),
  young('yg_apprentice', 'common', 'work', 'Passed the first apprenticeship module with a tidy bit of welding.', 'an apprenticeship', { when: { education: ['trade'] }, effects: { stats: { smarts: 2, happiness: 2 } } }),
  // Love.
  young('yg_date', 'common', 'heart', 'A first date with {person} at the cinema. Neither watched the film.', 'a first date', { when: { partner: false }, effects: { addPerson: 'partner', stats: { happiness: 4 } } }),
  young('yg_blind_date', 'uncommon', 'heart', 'A friend set you up with {person}. It went better than expected.', 'a set-up', { when: { partner: false }, effects: { addPerson: 'partner', stats: { happiness: 3 } } }),
  young('yg_partner_holiday', 'common', 'heart', 'A week in the sun with {person}. Came back pink.', 'a holiday together', { when: { person: 'partner', seasons: ['summer'] }, effects: { relationship: 6, gold: -700, stats: { happiness: 4 } } }),
  young('yg_partner_cook', 'common', 'heart', '{Person} cooked a three-course dinner for no reason at all.', 'a dinner for two', { when: { person: 'partner' }, effects: { relationship: 5 } }),
  young('yg_partner_row', 'common', 'heart', 'A row with {person} about whose turn it was to call the plumber.', 'a row', { when: { person: 'partner' }, effects: { relationship: -6 } }),
  young('yg_move_in', 'uncommon', 'heart', 'Moved in with {person}. Two kettles, one cupboard.', 'moving in together', { when: { person: 'partner', partner: 'dating', home: ['renting', 'family'] }, effects: { home: 'renting', relationship: 6, stats: { happiness: 4 } } }),
  young('yg_parting', 'uncommon', 'heart', '{Person} wanted different things. Parted kindly at the station.', 'a parting', { when: { partner: 'dating' }, effects: { partner: 'separate', stats: { happiness: -5 } } }),
  young('yg_lonely', 'common', 'heart', 'A lonely winter. The radio was good company.', 'a lonely winter', { when: { partner: false, seasons: ['winter'] }, effects: { stats: { happiness: -3 } } }),
  young('yg_ex', 'uncommon', 'heart', 'Saw {person} across the street and waved. It was fine.', 'an old flame', { when: { person: 'former_partner' }, effects: { relationship: 5 } }),
  // Health.
  young('yg_gym', 'common', 'health', 'Joined a gym and went twice. Still paying for it.', 'a gym membership', { effects: { gold: -240, stats: { health: 1 } } }),
  young('yg_cycling', 'common', 'health', 'Cycled to work all summer and felt marvellous.', 'cycling', { when: { seasons: ['summer', 'spring'] }, effects: { stats: { health: 4 } } }),
  young('yg_flu', 'common', 'health', 'Flu. A whole week under a duvet with toast.', 'flu', { effects: { stats: { health: -4 }, ailment: 'flu' } }),
  young('yg_back', 'common', 'health', 'Put your back out lifting a sofa up the stairs.', 'a bad back', { effects: { stats: { health: -3 } } }),
  young('yg_dentist', 'common', 'health', 'Two fillings at the dentist. Lots of sympathy, no sweets.', 'fillings', { effects: { gold: -120 } }),
  young('yg_appendix', 'rare', 'health', 'Appendix out in an emergency. Three days in hospital and a neat scar.', 'an operation', { effects: { stats: { health: -7 } } }),
  young('yg_asthma', 'uncommon', 'health', 'Diagnosed with asthma. An inhaler in every coat pocket.', 'asthma', { when: { traits: ['delicate'], notFlags: ['asthma'] }, effects: { flag: 'asthma', stats: { health: -4 }, ailment: 'lungs' } }),
  young('yg_marathon', 'rare', 'health', 'Ran a half marathon in the rain and cried at the finish.', 'a half marathon', { when: { stat: { id: 'health', min: 55 } }, effects: { stats: { health: 5, happiness: 4 } } }),
  // Traits.
  young('yg_curious_course', 'uncommon', 'book', 'Took an evening class in geology for the fun of it.', 'a geology class', { when: { traits: ['curious', 'bookish'] }, effects: { stats: { smarts: 4 } } }),
  young('yg_restless_travel', 'uncommon', 'star', 'Spent three months working on farms abroad.', 'farm work abroad', { when: { traits: ['restless', 'curious'] }, effects: { stats: { happiness: 5, health: 2 } } }),
  young('yg_thrifty_save', 'uncommon', 'money', 'Saved a whole month’s wages by fixing things instead of replacing them.', 'thrift', { when: { traits: ['thrifty'] }, effects: { gold: 1_200 } }),
  young('yg_generous_loan', 'uncommon', 'money', 'Lent {person} 500 for the deposit on a flat. Got it back, slowly.', 'a loan to a friend', { when: { traits: ['generous'], person: 'friend' }, effects: { relationship: 10, gold: -150 } }),
  young('yg_lucky_bonus', 'uncommon', 'money', 'A surprise bonus of 1,000 for a suggestion box idea about the kettle.', 'a bonus', { when: { traits: ['lucky'], job: true }, effects: { gold: 1_000, stats: { happiness: 3 } } }),
  young('yg_sunny_wedding', 'uncommon', 'star', 'Danced at a wedding until the band packed up.', 'a lot of dancing', { when: { traits: ['sunny', 'gentle'] }, effects: { stats: { happiness: 4, charm: 2 } } }),
  young('yg_shy_speech', 'uncommon', 'star', 'Gave a toast at a friend’s wedding without a single note.', 'a toast', { when: { traits: ['shy'] }, effects: { stats: { charm: 5 } } }),
  // Rare and remarkable.
  young('yg_newspaper_letter', 'rare', 'book', 'A letter you wrote to the paper about bus times got printed.', 'a printed letter', { effects: { stats: { charm: 3 } } }),
  young('yg_old_bike_sale', 'rare', 'money', 'Sold an old bike from the shed to a collector for 2,000.', 'a valuable bike', { effects: { gold: 2_000, stats: { happiness: 4 } } }),
  young('yg_quiz_show', 'remarkable', 'star', 'Won 10,000 on a television quiz show, on a question about moths.', 'a quiz show win', { effects: { gold: 10_000, stats: { happiness: 6, charm: 3 } } }),
  young('yg_saved_dog', 'remarkable', 'star', 'Waded into the river to save a stranger’s dog. On the local news.', 'a river rescue', { effects: { stats: { charm: 6, happiness: 5 } } }),
  young('yg_inheritance_aunt', 'remarkable', 'money', 'A distant cousin you met twice left you 8,000 and a clock.', 'a surprise inheritance', { effects: { gold: 8_000 } }),
  // Decisions that arrive mid-year.
  young('yg_letter_abroad', 'uncommon', 'work', 'A letter offering a year’s work abroad.', 'a letter from abroad', { when: { job: true }, opens: 'yg_job_abroad' }),
  young('yg_friend_business', 'uncommon', 'money', '{Person} wants a partner for a market stall selling pies.', 'a pie stall idea', { when: { person: 'friend', minGold: 2_000 }, opens: 'yg_pie_stall' }),
  // Pets.
  young('yg_pet_kitten', 'uncommon', 'paw', 'A kitten from a box outside the corner shop, now called {pet}.', 'a kitten', { kind: 'pet', when: { pet: false }, effects: { pet: 'cat', stats: { happiness: 4 } } }),
  young('yg_pet_budgie', 'uncommon', 'paw', 'A budgie called {pet}, rehomed from a neighbour who moved.', 'a budgie', { kind: 'pet', when: { pet: false }, effects: { pet: 'budgie', stats: { happiness: 2 } } }),
  young('yg_pet_flat_dog', 'common', 'paw', 'Walked {pet} along the canal every evening after work.', 'evening walks', { kind: 'pet', when: { pet: ['dog'] }, effects: { stats: { health: 2 } } }),
  young('yg_pet_cat_gift', 'common', 'paw', '{Pet} left a mouse on the doormat as a present.', 'a present on the mat', { kind: 'pet', when: { pet: ['cat'] } }),
  young('yg_pet_vet_bill', 'common', 'paw', 'A vet bill for {pet} of 340. Worth every penny.', 'a vet bill', { kind: 'pet', when: { pet: true }, effects: { gold: -340 } }),
  young('yg_pet_sofa', 'common', 'paw', '{Pet} chewed the arm of the rented sofa. Lost some deposit.', 'a chewed sofa', { kind: 'pet', when: { pet: ['dog'], home: ['renting'] }, effects: { gold: -200 } }),
  young('yg_pet_goldfish_tank', 'common', 'paw', 'Bought {pet} a bigger tank with a little castle.', 'a fish tank', { kind: 'pet', when: { pet: ['goldfish'] }, effects: { gold: -60 } }),
  young('yg_pet_rabbit_run', 'common', 'paw', '{Pet} dug out of the run and ate the neighbour’s lettuces.', 'stolen lettuces', { kind: 'pet', when: { pet: ['rabbit'] } }),
  young('yg_pet_tortoise_sleep', 'common', 'paw', '{Pet} went into a box of straw for the winter and woke in April.', 'a long sleep', { kind: 'pet', when: { pet: ['tortoise'], seasons: ['winter', 'autumn'] } }),
  young('yg_pet_comfort', 'common', 'paw', 'A bad week made better by {pet}, who just sat there.', 'a good companion', { kind: 'pet', when: { pet: true }, effects: { stats: { happiness: 3 } } }),
  // Hobbies.
  young('yg_hob_league', 'common', 'star', 'Sunday league football. Lost 7-1 and went to the pub anyway.', 'Sunday league', { kind: 'hobby', when: { hobby: ['football'] }, effects: { stats: { health: 3, happiness: 2 } } }),
  young('yg_hob_bake_off', 'common', 'star', 'Came second in the village bake-off with a lemon drizzle.', 'a bake-off', { kind: 'hobby', when: { hobby: ['baking'] }, effects: { stats: { charm: 2, happiness: 3 } } }),
  young('yg_hob_allotment', 'common', 'house', 'Took on half an allotment. Grew a lot of courgettes.', 'an allotment', { kind: 'hobby', when: { hobby: ['gardening'] }, effects: { stats: { health: 2, happiness: 3 } } }),
  young('yg_hob_tournament', 'common', 'book', 'Played in a chess tournament in a church hall and won three games.', 'a chess tournament', { kind: 'hobby', when: { hobby: ['chess'] }, effects: { stats: { smarts: 3 } } }),
  young('yg_hob_fishing', 'common', 'star', 'Caught nothing at the reservoir all day and loved it.', 'a day by the water', { kind: 'hobby', when: { hobby: ['fishing'] }, effects: { stats: { happiness: 3 } } }),
  young('yg_hob_any', 'common', 'star', 'Kept up {hobby} through a busy year. It kept you sane.', 'keeping up {hobby}', { kind: 'hobby', when: { hobby: true }, effects: { stats: { happiness: 3 } } }),
]
