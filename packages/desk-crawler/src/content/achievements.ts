import type { HeroClass, NumericCounter } from '../sim/core/types'

/**
 * Achievement catalog (achievements.md, D65). Content, versioned like the
 * monster catalog: ids are append-only and never reused; renaming a joke is a
 * copy change, changing a threshold is a new id. Every predicate reads only
 * bounded hero state (lifetime counters, level, bag capacity, keepsake total),
 * never logs, so a hero who did the deed before an achievement existed earns
 * it on the first evaluation after release.
 */
export const ACHIEVEMENTS_VERSION = 13

export type AchievementPredicate =
  | { readonly kind: 'counter'; readonly counter: NumericCounter; readonly atLeast: number }
  | { readonly kind: 'monster'; readonly monsterId: string; readonly atLeast: number }
  | { readonly kind: 'level'; readonly atLeast: number }
  | { readonly kind: 'bag'; readonly atLeast: number }
  | { readonly kind: 'keepsakes'; readonly atLeast: number }
  /** Every monster in the pinned catalog defeated at least `atLeast` times. */
  | { readonly kind: 'everyMonster'; readonly atLeast: number }
  /** At least one monster of every biome defeated at least `atLeast` times. */
  | { readonly kind: 'everyBiome'; readonly atLeast: number }
  /** Every monster of one biome defeated at least `atLeast` times. */
  | { readonly kind: 'biomeMonsters'; readonly biomeId: string; readonly atLeast: number }
  /** P37: the hero being evaluated is of this class and at least this level. */
  | { readonly kind: 'classLevel'; readonly heroClass: HeroClass; readonly atLeast: number }
  /** P37: the hero being evaluated is of this class and its counter is at least this. */
  | { readonly kind: 'classCounter'; readonly heroClass: HeroClass; readonly counter: NumericCounter; readonly atLeast: number }

export interface AchievementFamily {
  readonly id: string
  readonly name: string
  /** Shown on an unearned family's "?" card instead of its name. */
  readonly category: string
}

export interface AchievementDef {
  readonly id: string
  readonly family: string
  /** 1-based rung within the family; set pieces are tier 1 of a one-tier family. */
  readonly tier: number
  readonly name: string
  readonly blurb: string
  readonly predicate: AchievementPredicate
}

/** Monster and elite families share one ladder (achievements.md "Catalog rules"). */
export const MONSTER_LADDER = [1, 5, 25, 100, 500] as const

type TierCopy = readonly (readonly [name: string, blurb: string])[]

const families: AchievementFamily[] = []
const defs: AchievementDef[] = []

function family(id: string, name: string, category: string, tiers: TierCopy, predicate: (tier: number) => AchievementPredicate): void {
  families.push({ id, name, category })
  tiers.forEach(([tierName, blurb], index) => {
    // A one-tier family (a set piece) is its own id; ladders number their rungs.
    defs.push({ id: tiers.length === 1 ? id : `${id}_${index + 1}`, family: id, tier: index + 1, name: tierName, blurb, predicate: predicate(index) })
  })
}

const monster = (monsterId: string, name: string, biome: string, tiers: TierCopy) =>
  family(`slay_${monsterId}`, name, `${biome} monster`, tiers, (i) => ({ kind: 'monster', monsterId, atLeast: MONSTER_LADDER[i]! }))

const counter = (id: string, name: string, category: string, key: NumericCounter, ladder: readonly number[], tiers: TierCopy) =>
  family(id, name, category, tiers, (i) => ({ kind: 'counter', counter: key, atLeast: ladder[i]! }))

// ---------------------------------------------------------------- monster families

monster('paper_imp', 'Paper Imp', 'Office Cubicles', [
  ['Shredder Duty', 'Fed a Paper Imp to the shredder, staples and all.'],
  ['Blue Bin Regular', 'Put one in the blue recycling bin.'],
  ['Imp Exterminator', 'The photocopier room is clear of imps.'],
  ['Paperless Office', 'Management sent a memo about it.'],
  ['Pulp Legend', 'A plaque hangs by the shredder.'],
])
monster('rogue_roomba', 'Rogue Roomba', 'Office Cubicles', [
  ['Flipped It', 'Left one on its back, beeping.'],
  ['Bin Emptier', 'Emptied its dust bin.'],
  ['Roomba Wrangler', 'Twenty-five roombas flipped.'],
  ['Floor Supervisor', 'A hundred roombas flipped.'],
  ['Clean Sweep', 'The cleaners sent a thank-you card.'],
])
monster('stapler_mimic', 'Stapler Mimic', 'Office Cubicles', [
  ['Unjammed', 'Unjammed one for good.'],
  ['Staple Remover', 'Pulled the staples out.'],
  ['Mimic Spotter', 'You check every stapler twice.'],
  ['Supplies Auditor', 'You have opened every drawer on the floor.'],
  ['Red Stapler', 'The red stapler is yours to keep.'],
])
monster('dust_daemon', 'Dust Daemon', 'Office Cubicles', [
  ['Canned Air', 'Cleared one with a blast of canned air.'],
  ['Dust Buster', 'Blew five daemons into the vents.'],
  ['Allergy Season', 'Tissues on expenses.'],
  ['Spring Cleaning', 'Every vent dusted.'],
  ['Spotless', 'You can see your reflection in the keyboard.'],
])
monster('cable_serpent', 'Cable Serpent', 'Server Room', [
  ['Zip-Tied', 'Coiled one up and labelled it.'],
  ['Cable Manager', 'Tied them up with velcro straps.'],
  ['Labelled Everything', 'Labelled both ends of every cable.'],
  ['Patch Panel Pro', 'Colour-coded and alphabetical.'],
  ['Structured Cabling', 'The rack photo went viral internally.'],
])
monster('overheated_rack', 'Overheated Rack', 'Server Room', [
  ['Room Temperature', 'Talked it down to 21 degrees.'],
  ['Vented', 'Got the hot aisle venting properly.'],
  ['Thermal Throttler', 'Fans at a reasonable hum.'],
  ['Cold Aisle', 'Jumper required.'],
  ['Absolute Zero', 'The thermostat reads 18.'],
])
monster('firewall_gremlin', 'Firewall Gremlin', 'Server Room', [
  ['Port 443', 'Got through on HTTPS.'],
  ['Patch Tuesday', 'Reboot required.'],
  ['Deny All', 'Started from a rule that blocks everything.'],
  ['Zero Trust', 'Every port closed by default.'],
  ['Air Gapped', 'Unplugged from every network.'],
])
monster('legacy_mainframe', 'Legacy Mainframe', 'Server Room', [
  ['Decommissioned', 'Switched off a legacy mainframe at last.'],
  ['Migration Lead', 'Moved it to the cloud and left the old box plugged in, just in case.'],
  ['Cloud Native', 'Nobody remembers the on-prem days.'],
  ['End of Life', 'Extended support declined.'],
  ['Last COBOL Standing', 'Somebody still has to maintain it.'],
])
monster('coffee_slime', 'Coffee Slime', 'Cafeteria Depths', [
  ['Mopped Up', 'Wet floor sign deployed.'],
  ['Down the Sink', 'With the rest of the morning.'],
  ['Decaf Only', "The break room only stocks decaf now."],
  ['Barista', 'Latte art of a defeated slime.'],
  ['Cold Brew Master', 'Steeped for twelve hours.'],
])
monster('crumb_golem', 'Crumb Golem', 'Cafeteria Depths', [
  ['Dustpan', 'Swept into the bin.'],
  ['Crumb Collector', 'Not a crumb left for the pigeons.'],
  ['Table Wiper', 'Every table in the canteen.'],
  ['Five-Second Rule', 'Golems stay on the floor longer than five seconds.'],
  ['Breadwinner', 'You earned the loaf.'],
])
monster('microwave_wraith', 'Microwave Wraith', 'Cafeteria Depths', [
  ['Hit Cancel', 'Hit cancel before the ding.'],
  ['Unplugged', 'Try turning it off and leaving it off.'],
  ['Thirty Seconds More', 'It was still cold in the middle.'],
  ['Fish Curry Day', 'You have smelled every lunch in the microwave.'],
  ['Ding', 'The microwave is finally quiet.'],
])
monster('leftovers_hydra', 'Leftovers Hydra', 'Cafeteria Depths', [
  ['Nobody Claimed It', 'Every head went in the bin.'],
  ['Fridge Cleaner', "Cleared the fridge at four on a Friday."],
  ['Tupperware Hero', 'Returned to its rightful owner.'],
  ['Friday Purge', 'A passive-aggressive note was not needed.'],
  ['Sell-By Legend', 'The fridge has been empty for a week.'],
])

// ---------------------------------------------------------------- set pieces

family('office_census', 'Office Census', 'Set piece', [['Office Census', 'Met every monster on the premises at least once.']], () => ({ kind: 'everyMonster', atLeast: 1 }))
family('full_tour', 'Full Tour', 'Set piece', [['Full Tour', 'Won a fight on every floor.']], () => ({ kind: 'everyBiome', atLeast: 1 }))
family('floor_cleared_1', 'Cubicles Cleared', 'Set piece', [['Cubicles Cleared', 'Twenty-five of each in the Office Cubicles.']], () => ({ kind: 'biomeMonsters', biomeId: 'office_cubicles', atLeast: 25 }))
family('floor_cleared_2', 'Server Room Cleared', 'Set piece', [['Server Room Cleared', 'Twenty-five of each in the Server Room.']], () => ({ kind: 'biomeMonsters', biomeId: 'server_room', atLeast: 25 }))
family('floor_cleared_3', 'Cafeteria Cleared', 'Set piece', [['Cafeteria Cleared', 'Twenty-five of each in the Cafeteria Depths.']], () => ({ kind: 'biomeMonsters', biomeId: 'cafeteria_depths', atLeast: 25 }))

// ---------------------------------------------------------------- counter families

counter('elites', 'Elites', 'Lifetime', 'eliteWins', [1, 5, 25, 100], [
  ['The Floor Clapped', 'Took down your first elite.'],
  ['Elite Problem', 'Five elites beaten.'],
  ['Senior Exterminator', 'Title confirmed by email.'],
  ['Head of Department', 'Elites are your department.'],
])
counter('jackpots', 'Jackpots', 'Lifetime', 'jackpots', [1, 5, 25], [
  ['Lucky Break', 'Ten times the gold from one find.'],
  ['Expense Approved', 'No receipts required.'],
  ['Petty Cash Tin', 'You know where it is kept.'],
])
counter('rare_finds', 'Rare finds', 'Lifetime', 'rareFinds', [1, 5, 25, 100], [
  ['Shiny', 'Found your first rare piece of gear.'],
  ['Collector', 'Five rare finds and counting.'],
  ['Curator', 'Twenty-five rare finds, all catalogued.'],
  ['The Vault', 'A hundred rare finds in one drawer.'],
])
counter('adventures', 'Adventures', 'Lifetime', 'ticksExplored', [1, 100, 500, 2500, 10000], [
  ['First Day', 'Found the kitchen and your desk.'],
  ['Probation Passed', 'A day and a bit of adventuring.'],
  ['Weekly Standup', 'Roughly a week on the clock.'],
  ['Monthly Report', 'A full month of fifteen-minute quests.'],
  ['Long Service Award', 'A carriage clock would be appropriate.'],
])
counter('finds', 'Finds', 'Lifetime', 'itemsFound', [10, 100, 1000, 5000], [
  ['Finders Keepers', 'Someone left it on their desk.'],
  ['Drawer of Things', 'A hundred finds and a full drawer.'],
  ['Supply Cupboard', 'Colleagues borrow from your thousand finds.'],
  ['Lost Property Office', 'It all ends up with you.'],
])
counter('gold', 'Gold earned', 'Lifetime', 'goldEarned', [100, 1000, 10000, 100000], [
  ['Coins in the Couch', 'Lifetime gold, not current balance.'],
  ['Expense Claim', 'A thousand gold earned, paid out after three reminders.'],
  ['Bonus Season', 'Ten thousand gold earned, and the bonus is still discretionary.'],
  ['Golden Handshake', 'Enough gold to retire on.'],
])
family('levels', 'Levels', 'Lifetime', [
  ['Promoted', 'The Server Room is open.'],
  ['Team Lead', 'The Cafeteria Depths are open.'],
  ['Middle Management', 'The Archive is open.'],
  ['Director', 'The Parking Garage is open.'],
  ['Corner Office', 'It has a window, and the blind works.'],
], (i) => ({ kind: 'level', atLeast: [4, 8, 12, 16, 20][i]! }))
counter('knockouts', 'Knock-outs', 'Lifetime', 'deaths', [1, 5, 25, 100], [
  ['Out Cold', 'Back in two hours, a little poorer.'],
  ['Sick Note', 'Signed by the first-aider.'],
  ['Regular at HR', 'They have a chair with your name on it.'],
  ['Nine Lives (Expired)', 'A hundred knockouts.'],
])
counter('rescues', 'Rescues', 'Lifetime', 'rescues', [1, 5, 25], [
  ['Fire Drill', 'The alarm went off mid-fight.'],
  ["First-Aider's Friend", 'On first-name terms with the green box.'],
  ['Coworker of the Year', 'Awarded to whoever keeps rescuing you.'],
])
counter('retreats', 'Retreats', 'Lifetime', 'retreats', [1, 5, 25, 100], [
  ['Rain Check', 'Backed out of a fight to try again later.'],
  ["Night Shift's Problem", 'Left five fights for the night shift.'],
  ['Strategic Withdrawal', 'Put it in the slide deck.'],
  ['Diary Full', 'Could not possibly fit the fight in.'],
])
counter('potions', 'Potions', 'Lifetime', 'potionsUsed', [1, 10, 100, 500], [
  ['First Aid', 'Tasted of strawberry.'],
  ['Kit Raider', 'Facilities put a lock on the first-aid box.'],
  ['Pharmacy', 'Prescriptions on request.'],
  ['Self-Medicated', 'Five hundred potions drunk.'],
])
counter('traps', 'Traps avoided', 'Lifetime', 'trapsAvoided', [1, 25, 100, 500], [
  ['Watch Your Step', 'Spotted the trap in time.'],
  ['Wet Floor Sign', 'You put it there yourself.'],
  ['Health and Safety', 'Completed the safety e-learning.'],
  ['Risk Assessed', 'Every corridor has a laminated form.'],
])
counter('breaks', 'Breaks', 'Lifetime', 'restTicks', [10, 100, 1000], [
  ['Coffee Break', 'Status set to "out of office".'],
  ['Power Nap', 'Feet up under the desk.'],
  ['Out of Office', 'Back on the twelfth, roughly.'],
])
counter('trips', 'Trips', 'Lifetime', 'trips', [1, 10, 100], [
  ['Commuter', 'Took the stairs to another floor.'],
  ['Hot Desker', 'No fixed address.'],
  ['Frequent Flyer', 'Lounge access to the Server Room.'],
])
family('bags', 'Bag ladder', 'Lifetime', [
  ['Tote-ally Prepared', 'The Paper Bag is retired with honours.'],
  ['Backpacker', 'Padded straps and a laptop sleeve.'],
  ['Messenger', 'Worn across the body for maximum urgency.'],
  ['Rolling Suitcase', 'The bag with wheels.'],
], (i) => ({ kind: 'bag', atLeast: [10, 13, 16, 20][i]! }))
counter('sales', 'Sales', 'Lifetime', 'itemsSold', [1, 25, 250, 1000], [
  ['Car Boot Sale', 'One careful owner.'],
  ['Declutter', 'Sold what you did not need.'],
  ['Procurement', 'A spreadsheet is involved.'],
  ['Liquidation', 'Sold a thousand pieces of gear.'],
])
family('keepsakes', 'Keepsakes', 'Lifetime', [
  ['Desk Ornament', 'Your first keepsake, propped by the monitor.'],
  ['Shelf Life', 'Half a shelf and counting.'],
  ['Full Set', 'Every design, once.'],
  ['Second Shelf', 'Facilities have been informed.'],
], (i) => ({ kind: 'keepsakes', atLeast: [1, 6, 12, 24][i]! }))

// ---------------------------------------------------------------- v1.1 Decisions (catalog version 2; appended, never edited)

counter('purchases', 'Purchases', 'Decisions', 'purchases', [1, 5, 25], [
  ['Impulse Buy', 'Bought from the merchant.'],
  ['Loyalty Card', 'Five stamps on the loyalty card.'],
  ['Preferred Customer', 'The merchant waves from across the floor.'],
])
counter('merchants', 'Merchants met', 'Decisions', 'merchantVisits', [1, 10, 50], [
  ['Trestle Table', 'A cart, a cloth and a price list.'],
  ['Market Day', 'Ten visits and counting.'],
  ['Trade Route', 'The merchant stops by your desk first.'],
])
counter('stances', 'Stance changes', 'Decisions', 'stanceChanges', [1, 5, 25], [
  ['New Posture', 'Tried a different approach.'],
  ['Mood Board', 'Five changes of heart.'],
  ['Agile', 'Pivots weekly.'],
])
counter('choices', 'Decisions made', 'Decisions', 'choicesMade', [1, 5, 25, 100], [
  ['Decider', 'Answered your first decision.'],
  ['Executive Function', 'Five decisions, all on time.'],
  ['Steering Committee', 'Twenty-five decisions and a slide deck.'],
  ['Chief Decision Officer', 'A job title made up just for you.'],
])
counter('epics', 'Epic finds', 'Lifetime', 'epicFinds', [1, 5], [
  ['Legendary Stationery', 'Found an epic piece, about one find in a hundred.'],
  ['The Good Drawer', 'Five epics, under lock and key.'],
])

// ---------------------------------------------------------------- v1.2 Other people (catalog version 3, D110; appended, never edited)

counter('office_raider', 'Office raider', 'Raids', 'raidsWon', [1, 10, 50], [
  ['Light Fingers', "Came back from someone else's desk with their petty cash."],
  ['Desk Burglar', 'Ten other desks are a little lighter.'],
  ['Cat Burglar', 'Fifty raids won across the open-plan.'],
])
counter('desk_defender', 'Desk defender', 'Raids', 'raidsRepelled', [1, 10, 50], [
  ['Not Today', 'Caught a raider at the drawers and showed them out.'],
  ['Neighbourhood Watch', 'Ten raiders sent packing.'],
  ['Fort Knox Desk', 'Fifty raiders shown out.'],
])

// ---------------------------------------------------------------- v1.1 To-do list (catalog version 4, D112; appended, never edited)

counter('tasks_done', 'Tasks done', 'Lifetime', 'tasksCompleted', [1, 10, 50, 250], [
  ['Ticked Off', 'Crossed the first task off the office to-do list.'],
  ['Inbox Zero-ish', 'Ten tasks ticked off.'],
  ['Getting Things Done', 'Fifty tasks ticked off without a single reminder.'],
  ['Employee of the Month', 'Two hundred and fifty tasks ticked off.'],
])

// ---------------------------------------------------------------- v2.0 Salvage and the workbench (catalog version 5, D129; appended, never edited)

counter('salvaged', 'Salvaged', 'Lifetime', 'itemsSalvaged', [1, 25, 100], [
  ['Recycling Bin', 'Stripped a piece of gear for parts instead of selling it.'],
  ['Spare Parts Drawer', 'Broke down twenty-five pieces of gear for parts.'],
  ['Scrapyard Foreman', 'Salvaged a hundred pieces of gear.'],
])
counter('workbench', 'Workbench', 'Lifetime', 'gearUpgraded', [1, 5, 15], [
  ['Tinkerer', 'Took a piece of gear to the workbench and made it better.'],
  ['Shop Steward', 'Finished five jobs at the workbench.'],
  ['Master of the Works', 'Finished fifteen jobs at the workbench.'],
])

// ---------------------------------------------------------------- v2.0 Potion strengths (catalog version 6, D131; appended, never edited)

counter('mixing', 'Potion mixing', 'Lifetime', 'potionsCombined', [1, 10, 50], [
  ['Kitchen Chemist', 'Mixed three minor potions and some Scrap into a major one.'],
  ['Tea Round', 'Mixed ten major potions.'],
  ['Head of Pharmacy', 'Mixed fifty major potions in the break-room sink.'],
])

// ---------------------------------------------------------------- v2.0 The Archive and the Parking Garage (catalog version 7, D133; appended, never edited)

monster('box_file_beetle', 'Box File Beetle', 'Archive', [
  ['Pressed Flat', 'Filed under B, for beetle.'],
  ['Ring Binder', 'Filed five beetles in one lever arch file.'],
  ['Records Clerk', 'Filed twenty-five beetles in date order.'],
  ['Head of Records', 'Filed a hundred beetles.'],
  ['Deep Storage', 'Filed five hundred beetles.'],
])
monster('shelf_lurker', 'Shelf Lurker', 'Archive', [
  ['Shelves Shut', 'Rolled the shelves shut on a lurker.'],
  ['Aisle Monitor', 'Shut five lurkers in the stacks.'],
  ['Night Librarian', 'You know which shelf it moved to.'],
  ['Stack Supervisor', 'Shut a hundred lurkers in the stacks.'],
  ['Keeper of the Stacks', 'Shut five hundred lurkers in the stacks.'],
])
monster('microfilm_phantom', 'Microfilm Phantom', 'Archive', [
  ['Rewound', 'Back to the start of the reel.'],
  ['Reel Change', 'Wound five phantoms back to the start.'],
  ['Microfilm Operator', 'Twenty-five reels and a very tired eye.'],
  ['Reading Room', 'A hundred reels, all catalogued.'],
  ['Digitised', 'Wound five hundred phantoms back to the start.'],
])
monster('auditor', 'Auditor', 'Archive', [
  ['Receipt Found', 'For once, you had the paperwork.'],
  ['Books Balanced', 'Five audits with nothing to report.'],
  ['Clean Audit', 'Passed twenty-five audits without a discrepancy.'],
  ['Audit Committee', 'Passed a hundred audits.'],
  ['Signed Off', 'Passed five hundred audits.'],
])
monster('trolley_swarm', 'Trolley Swarm', 'Parking Garage', [
  ['Chained Up', 'A pound coin got them back.'],
  ['Trolley Return', 'Five swarms sent back up the ramp.'],
  ['Bay Attendant', 'Chained up twenty-five swarms by the lift.'],
  ['Trolley Park', 'A hundred swarms, chained in rows.'],
  ['Rolling Stock', 'Chained up five hundred swarms of trolleys.'],
])
monster('oil_slick', 'Oil Slick', 'Parking Garage', [
  ['Sanded Over', 'Sanded the shine off an oil slick.'],
  ['Drain Cleared', 'Five slicks down the drain.'],
  ['Spill Kit', 'Mopped twenty-five slicks down the drain.'],
  ['Dry Floor', 'Mopped a hundred slicks down the drain.'],
  ['Teflon', 'Mopped five hundred slicks down the drain.'],
])
monster('barrier_golem', 'Barrier Golem', 'Parking Garage', [
  ['Walked Under', 'An expired ticket does wonders.'],
  ['Season Ticket', 'Five golems lifted.'],
  ['Permit Holder', 'Walked under twenty-five barrier golems.'],
  ['Free Parking', 'Got past a hundred barrier golems.'],
  ['Barrier Free', 'Got past five hundred barrier golems.'],
])
monster('ghost_car', 'Ghost Car', 'Parking Garage', [
  ['Clamped', 'Clamped a ghost car that was back in its bay by morning.'],
  ['Ticketed', 'Five tickets under one wiper.'],
  ['Towed', 'Had a ghost car towed twenty-five times.'],
  ['Impounded', 'Had a ghost car towed a hundred times.'],
  ['Scrapped', 'Had a ghost car towed five hundred times.'],
])
family('floor_cleared_4', 'Archive Cleared', 'Set piece', [['Archive Cleared', 'Twenty-five of each in the Archive.']], () => ({ kind: 'biomeMonsters', biomeId: 'archive', atLeast: 25 }))
family('floor_cleared_5', 'Garage Cleared', 'Set piece', [['Garage Cleared', 'Twenty-five of each in the Parking Garage.']], () => ({ kind: 'biomeMonsters', biomeId: 'parking_garage', atLeast: 25 }))

// ---------------------------------------------------------------- P37 Classes and the roster (catalog version 8, D136; appended, never edited)

family('rogue', 'The Rogue', 'Roster', [
  ['New Hire', 'Recruited a Rogue.'],
  ['Cutpurse', 'Your Rogue reached level 7, and the desk raids that come with it.'],
  ['Stairwell Shadow', 'Your Rogue reached level 12.'],
  ['Master of Keys', 'Your Rogue reached level 16.'],
], (i) => ({ kind: 'classLevel', heroClass: 'rogue', atLeast: [1, 7, 12, 16][i]! }))
family('rogue_raids', 'Light Fingers', 'Roster', [
  ['Pickpocket', 'Your Rogue won a desk raid.'],
  ['Second-Storey Work', 'Ten raids won as a Rogue.'],
  ['The Heist', 'Fifty raids won as a Rogue.'],
], (i) => ({ kind: 'classCounter', heroClass: 'rogue', counter: 'raidsWon', atLeast: [1, 10, 50][i]! }))
family('rogue_gold', 'Deep Pockets', 'Roster', [
  ['Loose Change', 'Your Rogue has earned 1,000 gold.'],
  ['Petty Cash', 'Your Rogue has earned 10,000 gold.'],
  ['Slush Fund', 'Your Rogue has earned 50,000 gold.'],
], (i) => ({ kind: 'classCounter', heroClass: 'rogue', counter: 'goldEarned', atLeast: [1000, 10000, 50000][i]! }))

// ---------------------------------------------------------------- D139 Office calendar (catalog version 9; appended, never edited)

counter('office_calendar', 'Office calendar', 'Office calendar', 'occasionsSeen', [1, 6, 12], [
  ['Signed the Card', 'On duty for an office occasion.'],
  ['Party Committee', 'Six office occasions at the desk.'],
  ['Office Institution', 'At the desk for twelve office occasions.'],
])
family('thirteenth_floor', 'Thirteenth Floor', 'Raids', [['Thirteenth Floor', 'Caught in a Friday the 13th raid that went wrong for everyone.']], () => ({ kind: 'counter', counter: 'raidMishaps', atLeast: 1 }))

// ---------------------------------------------------------------- D141 Meetings (catalog version 10; appended, never edited)

counter('networking', 'Networking', 'Coworkers', 'meetings', [1, 10, 50], [
  ['Water Cooler Moment', 'Met another hero on the floor.'],
  ['Familiar Face', 'Met other heroes ten times.'],
  ['Office Fixture', 'Met other heroes fifty times.'],
])

// ---------------------------------------------------------------- D145 Lost property (catalog version 11; appended, never edited)

counter('lost_and_found', 'Lost and found', 'Coworkers', 'lostPropertyFound', [1, 10, 25], [
  ['Lost and Found', "Found another hero's spare, name and all."],
  ['Label Reader', "Found ten other heroes' spares."],
  ['Head of Lost Property', "Found twenty-five other heroes' spares."],
])

// ---------------------------------------------------------------- D146 Bigger bags (catalog version 12; appended, never edited)

family('big_bags', 'Bigger bags', 'Lifetime', [
  ['Gym Duffel', 'A 24-slot bag that smells faintly of the gym.'],
  ['Steamer Trunk', 'Covered in stickers from places you have never been.'],
  ['Stationery Cupboard', 'A 32-slot cupboard, and you have the only key.'],
], (i) => ({ kind: 'bag', atLeast: [24, 28, 32][i]! }))

// ---------------------------------------------------------------- D163 Dug-in elites (catalog version 13; appended, never edited)

counter('dug_in', 'Dug in', 'Lifetime', 'standoffsWon', [1, 10, 50], [
  ['Eviction Notice', 'Beat an elite that had dug in.'],
  ['Pest Control', 'Beat ten elites that had dug in.'],
  ['Building Management', 'Beat fifty elites that had dug in.'],
])

/** Families in display order. */
export const ACHIEVEMENT_FAMILIES: readonly AchievementFamily[] = families
/** Every achievement in catalog order: by family, then tier. */
export const ACHIEVEMENTS: readonly AchievementDef[] = defs
export const ACHIEVEMENT_BY_ID: ReadonlyMap<string, AchievementDef> = new Map(defs.map((def) => [def.id, def]))

export const ROMAN = ['I', 'II', 'III', 'IV', 'V'] as const
export const tierLabel = (tier: number): string => ROMAN[tier - 1] ?? String(tier)

/** Rarity bands over the share of ranked heroes holding an achievement (achievements.md "Player experience"). */
export type RarityBand = 'common' | 'uncommon' | 'rare' | 'legendary'
export function rarityBand(share: number): RarityBand {
  if (share >= 0.5) return 'common'
  if (share >= 0.1) return 'uncommon'
  if (share >= 0.01) return 'rare'
  return 'legendary'
}

/** Below this many ranked heroes the companion shows "3 of 11 heroes" instead of a percentage. */
export const RARITY_PERCENT_MIN_POPULATION = 20
