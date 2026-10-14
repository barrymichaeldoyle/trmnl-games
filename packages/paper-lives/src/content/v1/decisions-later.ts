import type { DecisionDef } from '../../sim/types'
import { decision, option } from './decisions-early'

/** Ages 30 to 59. Night school at 30 is forced for anyone without a degree. */
export const adultDecisions: readonly DecisionDef[] = [
  decision('ad_night_school', 'adult', 'common', false, 'book', 'Thirty. The college runs night classes for a better job.', [
    option('enrol', 'Enrol', 'Two years of night school, then a certificate in a frame.', 'night school', { tierBonus: 1, stats: { smarts: 3 }, gold: -800 }),
    option('not', 'Not now', 'Let night school pass. Evenings stay for the family and the telly.', 'quiet evenings'),
  ], 'not', { forced: true, when: { minAge: 30, maxAge: 30, education: ['work', 'trade', 'school'] } }),
  decision('ad_career', 'adult', 'common', true, 'work', 'Bored at work for a while. Change careers?', [
    option('change', 'Retrain', 'Retrained, nervously, and started somewhere new.', 'a career change', { job: 'change', gold: -2_000, stats: { happiness: 4, smarts: 2 } }, { minGold: 2_000 }, 'Needs 2,000'),
    option('stay', 'Stay where you are', 'Stayed in the job. Better the devil you know.', 'staying put', { stats: { happiness: -1 } }),
  ], 'stay', { when: { job: true, maxAge: 52 } }),
  decision('ad_adopt', 'adult', 'uncommon', true, 'pram', 'You have always wanted a child. Look into adopting?', [
    option('adopt', 'Adopt', 'After a year of forms and visits, {person} came home to stay.', 'an adoption', { addPerson: 'child', stats: { happiness: 6 } }),
    option('not', 'Not now', 'Decided the time was not right. Became a favourite godparent instead.', 'a godchild'),
  ], 'not', { when: { hasChildren: false, notFlags: ['no_children'], minAge: 32, maxAge: 50 } }),
  decision('ad_another', 'adult', 'common', true, 'pram', 'Another baby?', [
    option('yes', 'Yes', 'Another baby on the way. More washing, more joy.', 'another baby', { addPerson: 'child', stats: { happiness: 4 } }, { partner: true }, 'Needs a partner'),
    option('happy', 'We are happy as we are', 'Decided the family was the right size already.', 'a full house'),
  ], 'happy', { when: { hasChildren: true, partner: true, maxAge: 44 } }),
  decision('ad_country', 'adult', 'uncommon', true, 'house', 'A cottage in the country, cheaper than the town. Move?', [
    option('move', 'Move to the country', 'Moved to a cottage with a woodburner and a lot of mud.', 'a move to the country', { stats: { happiness: 5, health: 2 }, roleRelationship: { role: 'friend', delta: -6 } }),
    option('stay', 'Stay in town', 'Stayed in town, near the shops and the friends.', 'staying in town'),
  ], 'stay', { when: { home: ['owned'] } }),
  decision('ad_separate', 'adult', 'uncommon', true, 'heart', 'Things with {person} have been bad for a long time.', [
    option('separate', 'Separate', 'Separated from {person}, gently and with a lot of tea.', 'a separation', { partner: 'separate', stats: { happiness: -4 } }),
    option('try', 'Try counselling', 'Went to counselling with {person}. Hard, and it helped.', 'counselling', { relationship: 15 }),
  ], 'try', { when: { person: 'partner', personMaxRelationship: 35 } }),
  decision('ad_bigger_house', ['adult', 'senior'], 'common', true, 'house', 'The family is outgrowing the place. Move somewhere bigger?', [
    option('terrace', 'A terraced house', 'Moved into {house}, with a room each for the children.', 'a bigger house', { house: 2, stats: { happiness: 4 } }, { minGold: 50_000 }, 'Needs savings'),
    option('garden', 'A house with a garden', 'Moved into {house}. The children ran straight to the end of it.', 'a bigger house', { house: 3, stats: { happiness: 5 } }, { minGold: 90_000 }, 'Needs more savings'),
    option('stay', 'Make do', 'Stayed put and built bunk beds.', 'bunk beds'),
  ], 'stay', { when: { home: ['owned'], hasChildren: true, minGold: 50_000 } }),
  decision('ad_coast_transfer', 'adult', 'uncommon', true, 'work', 'The coast clinic offers a transfer. Take it?', [
    option('go', 'Take the transfer', 'Took the transfer to the coast. Sea air and a longer commute for everyone else.', 'a move to the coast', { job: 'promote', stats: { happiness: 4, health: 2 }, roleRelationship: { role: 'friend', delta: -5 } }),
    option('stay', 'Stay where you are', 'Stayed where you are. The sea will keep.', 'staying put'),
  ], 'stay', { eventOnly: true, when: { job: true } }),
  decision('ad_sibling_loan', 'adult', 'uncommon', false, 'money', 'Lend {person} 3,000?', [
    option('lend', 'Lend it', 'Lent {person} 3,000. Paid back over three years, with a cake.', 'a loan to family', { gold: -1_000, relationship: 12 }),
    option('help', 'Offer to help another way', 'Helped {person} with the books instead of the money.', 'helping out', { relationship: 3, stats: { smarts: 1 } }),
  ], 'help', { eventOnly: true, when: { person: 'sibling' } }),
  decision('ad_puppy', ['adult', 'senior'], 'uncommon', false, 'paw', 'Take the last puppy?', [
    option('take', 'Take the puppy', 'Took the last puppy home and called it {pet}.', 'a puppy', { pet: 'dog', stats: { happiness: 5 } }),
    option('no', 'Not this time', 'Visited the puppy twice and left it to another family.', 'a puppy visit'),
  ], 'no', { eventOnly: true, when: { pet: false } }),
  decision('ad_parent_move_in', 'adult', 'uncommon', false, 'family', '{Person} is struggling alone. Move them in?', [
    option('move', 'Move them in', '{Person} moved into the spare room with a lot of cushions.', 'a parent moving in', { relationship: 12, stats: { happiness: -2 } }, { home: ['owned'] }, 'Needs a house'),
    option('visit', 'Visit more often', 'Visited {person} three times a week with shopping and news.', 'more visits', { relationship: 6 }),
  ], 'visit', { when: { person: 'parent', personMinAge: 75 } }),
  decision('ad_uni_fees', 'adult', 'uncommon', false, 'money', '{Person} has a place at university. Help with the costs?', [
    option('pay', 'Pay for it', 'Paid {person}’s university costs. A thank-you card on the mantelpiece.', 'paying for university', { gold: -12_000, relationship: 10 }, { minGold: 12_000 }, 'Needs 12,000'),
    option('some', 'Help a little', 'Sent {person} off with a food parcel and some money each term.', 'helping a little', { gold: -2_000, relationship: 5 }),
  ], 'some', { when: { person: 'child', personMinAge: 18, personMaxAge: 19 } }),
  decision('ad_holiday', 'adult', 'common', false, 'family', 'Where should the family go on holiday this year?', [
    option('abroad', 'Abroad', 'Two weeks somewhere hot. Everyone came back freckled.', 'a holiday abroad', { gold: -3_000, stats: { happiness: 5 } }, { minGold: 3_000 }, 'Needs 3,000'),
    option('coast', 'The coast', 'A week at the coast in a caravan. Chips every night.', 'a week at the coast', { gold: -800, stats: { happiness: 3 } }),
    option('home', 'Days out from home', 'Stayed home and did day trips. Saved a fortune.', 'day trips', { stats: { happiness: 1 } }),
  ], 'home', { when: { hasChildren: true, maxAge: 55 } }),
  decision('ad_extension', 'adult', 'uncommon', false, 'house', 'Build an extension on the kitchen?', [
    option('build', 'Build it', 'Six months of builders, then a kitchen you can dance in.', 'an extension', { gold: -15_000, stats: { happiness: 5 } }, { minGold: 15_000 }, 'Needs 15,000'),
    option('no', 'Leave it', 'Left the kitchen as it is. Still nowhere to put the toaster.', 'the same kitchen'),
  ], 'no', { when: { home: ['owned'] } }),
  decision('ad_hobby', 'adult', 'common', false, 'star', 'Time for a hobby of your own?', [
    option('garden', 'Take on an allotment', 'Took on an allotment. Grew far too many beans.', 'an allotment', { hobby: 'gardening', stats: { health: 2 } }),
    option('baking', 'Baking', 'Started baking bread every Saturday. The house smells wonderful.', 'baking bread', { hobby: 'baking', stats: { happiness: 3 } }),
    option('fishing', 'Fishing', 'Took up fishing at the reservoir. Mostly an excuse to sit still.', 'fishing', { hobby: 'fishing', stats: { happiness: 3 } }),
  ], 'garden', { when: { hobby: false } }),
  decision('ad_sabbatical', 'adult', 'rare', false, 'work', 'Work will hold your job for six months unpaid.', [
    option('take', 'Take a sabbatical', 'Took six months off to walk the coast path. Came back slower and kinder.', 'a sabbatical', { gold: -8_000, stats: { happiness: 7, health: 3 } }, { minGold: 8_000 }, 'Needs 8,000'),
    option('no', 'Keep working', 'Kept working, and promised yourself a long holiday later.', 'carrying on'),
  ], 'no', { when: { job: true } }),
  decision('ad_mentor', 'adult', 'common', false, 'work', 'A new starter, {person}, has been asking for help.', [
    option('help', 'Take them under your wing', 'Showed {person} the ropes. They still send a card at Christmas.', 'mentoring', { relationship: 10, stats: { charm: 2 } }),
    option('busy', 'Point them to the manual', 'Pointed {person} to the manual and went back to your desk.', 'the manual'),
  ], 'busy', { when: { person: 'colleague' } }),
  decision('ad_council', 'adult', 'rare', false, 'star', 'The neighbours want you to stand for the town council.', [
    option('stand', 'Stand', 'Elected to the town council by 43 votes. Meetings on Tuesdays.', 'the town council', { stats: { charm: 4, happiness: 2 } }, { stat: { id: 'charm', min: 50 } }, 'Needs Charm 50'),
    option('no', 'Decline', 'Declined the council, and voted for the person who did stand.', 'a vote'),
  ], 'no'),
  decision('ad_marathon', 'adult', 'uncommon', false, 'health', 'A friend dares you to run a marathon.', [
    option('train', 'Start training', 'Trained all winter and finished the marathon, slowly, smiling.', 'a marathon', { stats: { health: 6, happiness: 4 } }, { stat: { id: 'health', min: 40 } }, 'Needs Health 40'),
    option('cheer', 'Cheer from the side', 'Stood at mile twenty with jelly babies for the runners.', 'cheering on'),
  ], 'cheer'),
  decision('ad_invest', 'adult', 'common', false, 'money', 'Savings are sitting idle. Put them somewhere?', [
    option('fund', 'A careful fund', 'Put savings in a careful fund. It grew, carefully.', 'a careful fund', { gold: 2_500 }, { minGold: 20_000 }, 'Needs 20,000'),
    option('bank', 'Leave it in the bank', 'Left the money in the bank, where you can see it.', 'money in the bank', { gold: 400 }),
  ], 'bank', { when: { minGold: 5_000 } }),
  decision('ad_part_time', 'adult', 'uncommon', false, 'work', 'Go down to four days a week?', [
    option('four', 'Four days', 'Went down to four days. Fridays for the garden and the shops.', 'four-day weeks', { stats: { happiness: 4, health: 2 }, gold: -3_000 }),
    option('five', 'Keep five days', 'Kept the full week. The money comes in handy.', 'full weeks'),
  ], 'five', { when: { job: true, minAge: 50 } }),
  decision('ad_vows', 'adult', 'rare', false, 'ring', 'Many years married to {person}. Renew the vows?', [
    option('renew', 'Renew them', 'Renewed the vows with {person} in the garden. The same music as the first time.', 'renewed vows', { relationship: 10, gold: -800, stats: { happiness: 5 } }),
    option('dinner', 'A quiet dinner instead', 'A quiet anniversary dinner with {person}. Just right.', 'a quiet dinner', { relationship: 4 }),
  ], 'dinner', { when: { person: 'partner', partner: 'married', partnerYears: 15 } }),
  decision('ad_boss', 'adult', 'common', false, 'work', 'The manager takes credit for your work again.', [
    option('speak', 'Speak up', 'Spoke up in the meeting. The room went quiet, then agreed.', 'speaking up', { stats: { charm: 3, happiness: 2 } }, { stat: { id: 'charm', min: 45 } }, 'Needs Charm 45'),
    option('note', 'Keep a record', 'Kept a careful record of your work. It came in handy later.', 'a careful record', { stats: { smarts: 1 } }),
  ], 'note', { when: { job: true } }),
  decision('ad_choir', 'adult', 'common', false, 'star', 'The community choir is short of altos.', [
    option('join', 'Join', 'Joined the choir. Tuesday nights, and a concert at Christmas.', 'the choir', { addPerson: 'friend', stats: { happiness: 4 } }),
    option('no', 'Not your thing', 'Went to the Christmas concert and sang along quietly.', 'a concert'),
  ], 'no'),
  decision('ad_dog', 'adult', 'common', false, 'paw', 'The children want a dog.', [
    option('dog', 'Get a dog', 'A dog called {pet} joined the family and slept on everyone in turn.', 'a family dog', { pet: 'dog', stats: { happiness: 5 } }),
    option('rabbit', 'A rabbit to start with', 'Started with a rabbit called {pet}. Everyone fell for it.', 'a rabbit', { pet: 'rabbit', stats: { happiness: 3 } }),
  ], 'rabbit', { when: { pet: false, hasChildren: true } }),
  decision('ad_old_friend', 'adult', 'uncommon', false, 'family', '{Person} is going through a hard time.', [
    option('visit', 'Go and stay', 'Went to stay with {person} for a week. Cooked, listened, walked.', 'a friend in need', { relationship: 12, stats: { happiness: 1 } }),
    option('call', 'Call more often', 'Rang {person} every few days for a while.', 'calls to a friend', { relationship: 6 }),
  ], 'call', { when: { person: 'friend' } }),
  decision('ad_health_kick', 'adult', 'common', false, 'health', 'The doctor suggests a few changes.', [
    option('change', 'Make the changes', 'Cut down the biscuits and walked every lunchtime.', 'a health kick', { stats: { health: 5, happiness: -1 } }),
    option('later', 'Next year', 'Promised the doctor next year, and meant it.', 'good intentions'),
  ], 'later', { when: { minAge: 40, stat: { id: 'health', max: 55 } } }),
  decision('ad_reunion_invite', 'adult', 'uncommon', false, 'family', 'An invitation to a school reunion.', [
    option('go', 'Go', 'Went to the reunion. Recognised most people by their laugh.', 'a reunion', { addPerson: 'friend', stats: { happiness: 3 } }),
    option('skip', 'Skip it', 'Skipped the reunion and looked at the photos online.', 'reunion photos'),
  ], 'skip'),
]

/** Ages 60 and up. The will and retirement keep coming back until they are settled. */
export const seniorDecisions: readonly DecisionDef[] = [
  decision('sn_retire', 'senior', 'common', true, 'work', 'Retire this year?', [
    option('retire', 'Retire', 'Retired with a cake, a card and a long walk home.', 'retirement', { job: 'retire', stats: { happiness: 5 } }),
    option('keep', 'Keep working a while', 'Kept working another year. Not ready yet.', 'another working year'),
  ], 'keep', { recurring: true, weight: 6, when: { job: true, minAge: 60 } }),
  decision('sn_will', 'senior', 'common', true, 'money', 'Time to write a will?', [
    option('split', 'Split it among the children', 'Wrote a will splitting everything evenly among the children.', 'a will', { will: 'split' }, { hasChildren: true }, 'Needs children'),
    option('one', 'Leave it to one child', 'Wrote a will leaving everything to the child who rings most.', 'a will', { will: 'one_child' }, { hasChildren: true }, 'Needs children'),
    option('partner', 'Leave it to your partner', 'Wrote a will leaving everything to your partner.', 'a will', { will: 'partner' }, { partner: true }, 'Needs a partner'),
    option('cause', 'Leave it to a good cause', 'Wrote a will leaving everything to the animal shelter.', 'a will to a good cause', { will: 'cause', flag: 'will_cause' }),
    option('later', 'Not this year', 'Put the will off for another year. Plenty of time.', 'putting it off'),
  ], 'later', { recurring: true, weight: 6, when: { will: false, minAge: 60 } }),
  decision('sn_downsize', 'senior', 'uncommon', true, 'house', 'Sell up and move somewhere smaller?', [
    option('sell', 'Sell up', 'Sold the old house and moved into {house} near the shops.', 'downsizing', { downsize: true, stats: { happiness: 2 } }),
    option('stay', 'Stay put', 'Stayed in the old house with all its stairs and memories.', 'staying put'),
  ], 'stay', { eventOnly: true, when: { home: ['owned'] } }),
  decision('sn_near_children', 'senior', 'uncommon', true, 'family', 'Move closer to {person} and the grandchildren?', [
    option('move', 'Move closer', 'Moved round the corner from {person}. Babysitting on tap.', 'moving near family', { relationship: 10, roleRelationship: { role: 'grandchild', delta: 8 }, stats: { happiness: 4 } }),
    option('stay', 'Stay where you are', 'Stayed put, with a spare room for visits.', 'a spare room'),
  ], 'stay', { when: { person: 'child', personMinAge: 28, hasGrandchildren: true } }),
  decision('sn_old_town', 'senior', 'rare', true, 'house', 'You miss the town you grew up in. Move back?', [
    option('move', 'Move back', 'Moved back to the old town. The bakery is still there.', 'moving home', { stats: { happiness: 6 }, roleRelationship: { role: 'friend', delta: -5 } }),
    option('visit', 'Just visit', 'Spent a weekend in the old town and walked past the old house.', 'a visit home', { stats: { happiness: 2 } }),
  ], 'visit', { when: { minAge: 65 } }),
  decision('sn_hobby', 'senior', 'common', false, 'star', 'Plenty of time now. Take something up?', [
    option('garden', 'Gardening', 'Took up gardening properly. Knees complain, roses thrive.', 'gardening', { hobby: 'gardening', stats: { health: 2 } }),
    option('chess', 'Chess at the club', 'Joined the chess club at the library. Wins more than expected.', 'chess', { hobby: 'chess', stats: { smarts: 2 } }),
    option('drawing', 'Watercolours', 'Took up watercolours. Mostly boats.', 'watercolours', { hobby: 'drawing', stats: { happiness: 3 } }),
  ], 'garden', { when: { hobby: false } }),
  decision('sn_trip', 'senior', 'common', false, 'star', 'A big trip, while the knees allow?', [
    option('far', 'Somewhere far', 'Three weeks somewhere far away. Sent postcards to everyone.', 'a big trip', { gold: -6_000, stats: { happiness: 6 } }, { minGold: 6_000 }, 'Needs 6,000'),
    option('near', 'A week by the sea', 'A week by the sea in a guest house with a stern landlady.', 'a week by the sea', { gold: -700, stats: { happiness: 3 } }),
  ], 'near'),
  decision('sn_give_now', 'senior', 'uncommon', false, 'money', 'Give the children some money now, rather than later?', [
    option('give', 'Give it now', 'Gave the children a share of the savings now. Saw them enjoy it.', 'an early gift', { gold: -10_000, roleRelationship: { role: 'child', delta: 8 }, stats: { happiness: 4 } }, { minGold: 20_000 }, 'Needs 20,000'),
    option('keep', 'Keep it for now', 'Kept the savings for now. Rainy days, and all that.', 'savings kept'),
  ], 'keep', { when: { hasChildren: true, minGold: 20_000 } }),
  decision('sn_hospital_desk', 'senior', 'common', false, 'family', 'The hospital needs volunteers on the front desk.', [
    option('help', 'Volunteer', 'Volunteered at the hospital desk. Gave directions all day.', 'volunteering', { addPerson: 'friend', stats: { happiness: 4 } }),
    option('no', 'Not for you', 'Gave the hospital a cake for the volunteers instead.', 'a cake'),
  ], 'no', { when: { retired: true } }),
  decision('sn_swim_lessons', 'senior', 'uncommon', false, 'health', 'Never learned to swim properly. Lessons at the leisure centre?', [
    option('learn', 'Learn', 'Learned to swim properly at last, in the slow lane.', 'swimming lessons', { stats: { health: 4, happiness: 4 } }),
    option('no', 'Stay on dry land', 'Stayed on dry land and watched from the cafe.', 'dry land'),
  ], 'no'),
  decision('sn_dog', 'senior', 'common', false, 'paw', 'An older dog at the rescue needs a quiet home.', [
    option('dog', 'Take the dog', 'Brought home an old dog called {pet}. Two slow walkers.', 'an old dog', { pet: 'dog', stats: { happiness: 5, health: 2 } }),
    option('cat', 'A cat might be easier', 'Took a cat called {pet} instead. Less walking, more lap.', 'a cat', { pet: 'cat', stats: { happiness: 4 } }),
  ], 'cat', { when: { pet: false } }),
  decision('sn_old_stories', 'senior', 'common', false, 'book', 'The grandchildren want to hear the old stories.', [
    option('write', 'Write them down', 'Wrote the old stories down in a notebook for the family.', 'a memoir', { roleRelationship: { role: 'grandchild', delta: 6 }, stats: { happiness: 4 } }),
    option('tell', 'Tell them at Sunday lunch', 'Told the old stories at Sunday lunch, a different one each week.', 'Sunday stories', { roleRelationship: { role: 'grandchild', delta: 3 } }),
  ], 'tell', { when: { hasGrandchildren: true } }),
  decision('sn_specialist', 'senior', 'common', false, 'health', 'The doctor suggests seeing a specialist.', [
    option('go', 'Go private, quickly', 'Saw a specialist within the week. Reassuring, and expensive.', 'a quick appointment', { gold: -1_500, stats: { health: 5 } }, { minGold: 1_500 }, 'Needs 1,500'),
    option('wait', 'Wait for the appointment', 'Waited for the appointment. It came in the spring, and it helped.', 'a long wait', { stats: { health: 2 } }),
  ], 'wait', { when: { stat: { id: 'health', max: 45 } } }),
  decision('sn_former', 'senior', 'rare', false, 'heart', '{Person} has written after all these years.', [
    option('reply', 'Write back', 'Wrote back to {person}. Letters every month now.', 'old letters', { relationship: 15, stats: { happiness: 3 } }),
    option('leave', 'Leave it be', 'Kept the letter from {person} in a drawer.', 'a letter in a drawer'),
  ], 'leave', { when: { person: 'former_partner' } }),
  decision('sn_christmas', 'senior', 'common', false, 'family', 'Host Christmas this year?', [
    option('host', 'Host it', 'Hosted Christmas for fourteen. The turkey was nearly done on time.', 'hosting Christmas', { gold: -400, roleRelationship: { role: 'child', delta: 5 }, stats: { happiness: 4, health: -1 } }),
    option('guest', 'Be a guest', 'Went to {person}’s for Christmas and did the washing up.', 'Christmas as a guest', { relationship: 4 }),
  ], 'guest', { when: { person: 'child', personMinAge: 25 } }),
  decision('sn_reunion', 'senior', 'uncommon', false, 'family', 'Organise a family reunion?', [
    option('organise', 'Organise it', 'Organised a reunion. Forty relatives, three cakes, one marquee.', 'a family reunion', { gold: -1_000, roleRelationship: { role: 'sibling', delta: 8 }, stats: { happiness: 5 } }),
    option('no', 'Too much work', 'Sent everyone a long letter instead.', 'a family letter'),
  ], 'no', { when: { hasChildren: true } }),
  decision('sn_car', 'senior', 'common', false, 'money', 'Driving at night is harder now. Sell the car?', [
    option('sell', 'Sell it', 'Sold the car and learned the bus timetable by heart.', 'selling the car', { gold: 2_000, flag: 'no_car' }),
    option('keep', 'Keep it for days', 'Kept the car for daytime trips only.', 'daytime driving'),
  ], 'keep', { when: { flags: ['car'], notFlags: ['no_car'], minAge: 75 } }),
  decision('sn_grandchild_help', 'senior', 'uncommon', false, 'money', '{Person} is saving for driving lessons.', [
    option('pay', 'Pay for them', 'Paid for {person}’s driving lessons. First lift home was memorable.', 'paying for lessons', { gold: -800, relationship: 10 }),
    option('teach', 'Teach them yourself', 'Taught {person} to drive in the supermarket car park. Both survived.', 'driving lessons', { relationship: 6, stats: { happiness: -1 } }),
  ], 'teach', { when: { person: 'grandchild', personMinAge: 17, personMaxAge: 18 } }),
  decision('sn_garden_down', 'senior', 'common', false, 'house', 'The garden is a lot of work now.', [
    option('help', 'Pay someone to help', 'Got a gardener in on Fridays. The roses look better than ever.', 'a gardener', { gold: -600, stats: { happiness: 2 } }),
    option('pave', 'Pave some of it', 'Paved half the garden and kept a few good pots.', 'pots on a patio'),
  ], 'pave', { when: { home: ['owned'], minAge: 72 } }),
  decision('sn_tablet', 'senior', 'common', false, 'book', 'The family want to buy you a tablet computer.', [
    option('yes', 'Accept graciously', 'Learned the tablet. Now play word games until midnight.', 'a tablet', { stats: { smarts: 2, happiness: 2 } }),
    option('no', 'Ask for slippers', 'Asked for slippers instead. Got both.', 'new slippers'),
  ], 'no', { when: { hasChildren: true } }),
]
