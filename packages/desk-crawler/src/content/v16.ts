import type { BiomeNarrative, ContentCatalog, LoreRule, MonsterNarrative, MonsterTemplate } from '../sim/core/types'
import { contentV15 } from './v15'

/*
 * Content catalog v16 (D133): the Archive and the Parking Garage, with field
 * notes for every floor and monster.
 *
 * The Cafeteria Depths were the top floor from level 8 on, and a daily manager
 * reaches level 32 in ninety days with nothing new to see after day eight. Two
 * floors follow it: the Archive at level 12 (tier 4, the records basement:
 * paper, dust and things that were filed and forgot to leave) and the Parking
 * Garage at level 16 (tier 5, the concrete underworld below it). They drop the
 * tier-3 gear the Cafeteria drops (`gearTier: 3`): the workbench ceiling is its
 * own slice (docs/salvage.md), so better gear does not arrive with them; harder
 * fights, better potions, bigger to-do pay and more gold do. Monster numbers
 * are fitted to the Cafeteria's fight ratios at each floor's unlock level in
 * tier-3 gear and checked by the harness (docs/evidence/biomes.md).
 *
 * Field notes (`lore`): one short note per floor and per monster, read on the
 * companion's Field notes page once the hero has stood on the floor or beaten
 * the monster. Nothing is drawn, stored or logged, so the notes change no
 * outcome. Two rungs join the end of the ladder. Everything else is v15.
 *
 * Authored names and story text are reserved content (LICENSE exclusions), not MIT code.
 */

const monster = (
  id: string,
  name: string,
  tier: number,
  hp: number,
  attack: number,
  defense: number,
  xp: [number, number],
  gold: [number, number],
): MonsterTemplate => ({ id, name, tier, hp, attack, defense, xp: { min: xp[0], max: xp[1] }, gold: { min: gold[0], max: gold[1] } })

const win = ' +{xp} XP, +{gold} gold.'

const archive: BiomeNarrative = {
  victory: [
    `Defeated a {monster} between the rolling shelves.${win}`,
    `A {monster} went back in its box.${win}`,
    `Beat a {monster} under the one working light.${win}`,
    `Cross-referenced a {monster} into defeat.${win}`,
    `Left a {monster} flat under a dictionary.${win}`,
    `Shelved a {monster} out of order, on purpose.${win}`,
    `Beat a {monster} by the microfilm reader.${win}`,
    `Stamped a {monster} RETURNED.${win}`,
  ],
  lootGold: [
    'Found {gold} gold in a box marked 1997.',
    'A petty-cash ledger still had {gold} gold tucked in the back.',
    'Found {gold} gold in the microfilm drawer.',
    "A retired manager's desk tin held {gold} gold.",
    'Found {gold} gold pressed inside an old annual report.',
    'An uncashed Christmas bonus envelope: {gold} gold.',
  ],
  trapHit: [
    'A rolling shelf rolled. -{damage} HP.',
    'A box of annual reports came down. -{damage} HP.',
    'Breathed in forty years of dust. -{damage} HP.',
    'A ring binder snapped shut on a finger. -{damage} HP.',
    'A filing cabinet toppled across the aisle. -{damage} HP.',
    'Tripped over a crate of carbon paper. -{damage} HP.',
    'A ceiling tile let go. -{damage} HP.',
    'A ladder slid along its rail. -{damage} HP.',
    'A stack of box files fell like dominoes. -{damage} HP.',
    'Caught a sleeve on a rusted bracket. -{damage} HP.',
    'The microfilm reader sparked. -{damage} HP.',
    'A drawer of index cards burst open. -{damage} HP.',
    'Walked into a shelf end in the dark. -{damage} HP.',
    'The one working light went out mid-step. -{damage} HP.',
    'A bundle of blueprints unrolled underfoot. -{damage} HP.',
    'A papercut from a 1983 memo. -{damage} HP.',
    'Something unlabelled fell off the top shelf. -{damage} HP.',
    'A guillotine blade was left up. -{damage} HP.',
  ],
  trapHitCallbacks: { 'A rolling shelf rolled. -{damage} HP.': 'The same rolling shelf rolled back. -{damage} HP.' },
  rest: [
    'Sat on a crate and read a 1991 newsletter. +{heal} HP.',
    'Napped on a stack of unbound minutes. +{heal} HP.',
    'Found a quiet aisle nobody has filed in for years. +{heal} HP.',
    'A thermos of soup, left and still warm. +{heal} HP.',
    'Rested under the one working light. +{heal} HP.',
    'Read the staff handbook cover to cover. +{heal} HP.',
  ],
  eliteVictory: [
    `An elite {monster} was finally archived.${win}`,
    `Took down an elite {monster} in the dark stacks.${win}`,
    `An elite {monster} will not be requested again.${win}`,
  ],
  jackpot: [
    'Jackpot! A forgotten pension envelope: {gold} gold.',
    'Jackpot! The 1990s office lottery pool, never claimed: {gold} gold.',
    'Jackpot! A box of mint stationery vouchers: {gold} gold.',
  ],
  lootGear: ['Found a {item} in a box marked MISC.', 'Pulled a {item} from a crate of retired equipment.', 'A {item} was shelved under W for weapons.'],
  arrive: ['Took the back stairs down to the {destination}. It smells of paper.', 'Made it to the {destination}. The light flickers twice and holds.'],
}

const garage: BiomeNarrative = {
  victory: [
    `Defeated a {monster} on level B3.${win}`,
    `A {monster} stalled between two pillars.${win}`,
    `Beat a {monster} at the ticket barrier.${win}`,
    `Clamped a {monster} for good.${win}`,
    `Left a {monster} in a disabled bay without a permit.${win}`,
    `Beat a {monster} by the broken lift.${win}`,
    `Reversed a {monster} into the wall.${win}`,
    `Towed a {monster} away.${win}`,
  ],
  lootGold: [
    'Found {gold} gold in the pay-and-display machine.',
    'Found {gold} gold down the back of a parked seat.',
    'A dropped wallet, long empty of cards, still held {gold} gold.',
    'Found {gold} gold in an oil drum.',
    "The attendant's booth had {gold} gold in the till.",
    'Found {gold} gold under a wheel clamp.',
  ],
  trapHit: [
    'The barrier arm came down. -{damage} HP.',
    'Slipped on an oil patch. -{damage} HP.',
    'A car alarm went off right behind. -{damage} HP.',
    'Walked into a concrete pillar in the dark. -{damage} HP.',
    'A speed bump out of nowhere. -{damage} HP.',
    'Exhaust fumes on level B4. -{damage} HP.',
    'The lift doors closed on an arm. -{damage} HP.',
    'A loose cable hung from the ceiling. -{damage} HP.',
    'A shopping trolley came down the ramp. -{damage} HP.',
    'Stepped in a puddle deeper than it looked. -{damage} HP.',
    'A fluorescent tube dropped from its fitting. -{damage} HP.',
    'Clipped by a reversing van. -{damage} HP.',
    'Tripped over a wheel stop. -{damage} HP.',
    'A pipe dripped down the collar. -{damage} HP.',
    'The ticket machine spat out a ticket, hard. -{damage} HP.',
    'A loose drain cover tipped. -{damage} HP.',
    'Kicked an unlit bike rack. -{damage} HP.',
    'A gust of wind off the ramp slammed a door. -{damage} HP.',
  ],
  rest: [
    'Sat on a wheel stop and waited for the echo to fade. +{heal} HP.',
    "Rested in the attendant's booth with the heater on. +{heal} HP.",
    'A nap in the back of an unlocked van. +{heal} HP.',
    'Drank a coffee from the machine by the lift. +{heal} HP.',
    'Found a dry corner on level B2. +{heal} HP.',
    'Sat in a parked car and listened to the radio. +{heal} HP.',
  ],
  eliteVictory: [
    `An elite {monster} was towed at the owner's expense.${win}`,
    `Took down an elite {monster} on the lowest level.${win}`,
    `An elite {monster} stalled for the last time.${win}`,
  ],
  jackpot: [
    'Jackpot! A year of parking fines in a carrier bag: {gold} gold.',
    "Jackpot! The pay-and-display machine's whole float: {gold} gold.",
    'Jackpot! A briefcase of unmarked gold under a tarp: {gold} gold.',
  ],
  lootGear: ['Found a {item} in the boot of an abandoned car.', 'A {item} was wedged behind the ticket machine.', 'Pulled a {item} from a skip by the ramp.'],
  arrive: ['Took the ramp down to the {destination}. Every sound comes back twice.', 'Made it to the {destination}. Mind the puddles.'],
}

const signature = (...lines: string[]): MonsterNarrative => ({ victory: lines.map((line) => `${line}${win}`) })

const monsters: Record<string, MonsterNarrative> = {
  box_file_beetle: signature('Pressed a {monster} flat and filed it.', 'Tipped a {monster} out of its box.'),
  shelf_lurker: signature('Cornered a {monster} at the end of the aisle.', 'Rolled the shelves shut on a {monster}.'),
  microfilm_phantom: signature('Wound a {monster} back to the start.', 'Switched the reader off on a {monster}.'),
  auditor: signature('Produced a receipt for everything and an {monster} left.', 'Closed the books on an {monster}.'),
  trolley_swarm: signature('Chained up a {monster} by the lift.', 'Pushed a {monster} back up the ramp.'),
  oil_slick: signature('Sanded over an {monster}.', 'Mopped an {monster} down the drain.'),
  barrier_golem: signature('Lifted a {monster} by hand and walked under.', 'Fed a {monster} an expired ticket.'),
  ghost_car: signature('Clamped a {monster} and walked away.', 'Put a {monster} in neutral and let it roll.'),
}

/*
 * Field notes: a few lines in the voice of a hero's notebook. Floors open on the first arrival; monsters on the
 * first victory. Each sits on one phone card, so they stay under the LORE_NOTE_MAX.
 */
const lore: LoreRule = {
  biomes: {
    office_cubicles:
      'Where every hero starts, and where every hero wakes up after a bad day. The printer is always jammed and the plant by the window is plastic. Nothing here keeps you down for long, because someone always walks past with a first-aid kit.',
    server_room:
      'One aisle is cold, the next is hot, and the fans never stop. The badge reader has never kept out anything living in the cable trays. Half the racks have no label, and switching one off to find out is against policy.',
    cafeteria_depths:
      'The lunch counter is the top of it. Below the dish pit the stairs keep going down past the walk-in freezer and an old kitchen, into stone arches lit by torches. The menu down there has not changed in years.',
    archive:
      'Under the cafeteria, behind a door marked RECORDS, forty years of paper sit on rolling shelves under one working light. Everything that was ever filed is still here, and some of it has started to move.',
    parking_garage:
      'Five levels of concrete below the archive, reached by a ramp that keeps turning. The puddles never dry, and the pay-and-display machine still takes coins. Nobody who drove down to the bottom level has come back up.',
  },
  monsters: {
    paper_imp:
      'A memo that got up and walked, held together mostly by staples. It wants to be read and goes to pieces when it is not. The shredder stops it for good. Put it in recycling and it may come back as a different memo.',
    rogue_roomba:
      'Facilities bought it to clean the floor. It cleans the floor of anything it can reach, ankles included. Flip it on its back and it beeps until the battery goes, which is about three hours longer than anyone can bear.',
    stapler_mimic:
      'It is an ordinary stapler until a hand gets near it. The red ones are the worst, and nobody has ever seen one being bought. Unjam it properly and it goes back to being office supplies for a while.',
    dust_daemon:
      'It grows behind the monitors when nobody dusts, and it breathes out every time you breathe in. A can of compressed air sends it to the vents, where it waits for the next quiet month.',
    cable_serpent:
      "Every cable in the Server Room, tied together over ten years by people who meant to label them later. It coils around any ankle that comes near. Zip ties and a label maker are the only things it respects.",
    overheated_rack:
      'A rack whose fans gave up around the time its owner left the company. It runs hot and is still serving something nobody can find. Talk it down to room temperature and it goes quiet for a bit.',
    firewall_gremlin:
      'It lives in firewall rules nobody wrote down, blocks whatever you need and logs every attempt. It can be got past on port 443, which it finds humiliating.',
    legacy_mainframe:
      'Older than the building, by some accounts. It holds every invoice since 1979 and will not be migrated. Four decommissioning projects have been announced, and it has outlived all of them.',
    coffee_slime:
      'The bottom of every pot left on the hotplate since the cafeteria opened, grown together. It moves slowly and smells of burnt Tuesday. A mop deals with it, though the mop is never the same afterwards.',
    crumb_golem:
      'Built from everything that fell off a tray and was never swept up. It is bigger every year and the pigeons are afraid of it. Breaking it up takes persistence; it is only ever crumbs, but there are a great many of them.',
    microwave_wraith:
      'Nobody cleaned the microwave and it noticed. It haunts the kitchen with the smell of fish curry and the sound of a ding that never quite finishes. Hit cancel and it fades; unplug it and it sulks for a week.',
    leftovers_hydra:
      "Every unclaimed container in the fridge, grown heads. Throw one out and two more turn up by Friday. It is beaten by binning every head at once, which is also the only way the fridge has ever been cleared.",
    box_file_beetle:
      'A box file that learned to walk and bite. It carries the minutes of a meeting nobody attended and defends them to the last ring binder. Pressed flat and filed, it keeps for years.',
    shelf_lurker:
      'Lives between the rolling shelves and moves when they move. Nobody has seen all of it; the one working light only ever catches an arm or an eye. It does not like the shelves rolled shut and will tell you so.',
    microfilm_phantom:
      'The reader was left on in 1988 and something in the reel kept reading. It flickers through forty years of records looking for its own name. Wind it back to the start and it loses the thread for a while.',
    auditor:
      'Came down to check the books in a year nobody can agree on and never went back up. It still asks for receipts and still finds discrepancies. The only known defence is a receipt for everything, which nobody has.',
    trolley_swarm:
      'Shopping trolleys from a supermarket that closed, drawn to the garage by the slope. They move together, always downhill. Chained up by the lift they rest for a while, rattling against each other.',
    oil_slick:
      'An oil patch that spread for a decade until it started to move. It waits for someone to step on it. Sand takes the shine off it, and the drain takes the rest, slowly.',
    barrier_golem:
      'The ticket barrier, after years of being driven at, grew legs and a temper. It wants a valid ticket and does not take cards. An expired ticket confuses it long enough to walk under.',
    ghost_car:
      'A car on the bottom level with no plates and no dust on it. Its lights come on when you look away. It has been towed more than once, and it is always back in the same bay by morning.',
  },
}

export const contentV16: ContentCatalog = {
  ...contentV15,
  contentVersion: 'v16',
  biomes: [
    ...contentV15.biomes,
    {
      id: 'archive',
      name: 'Archive',
      unlockLevel: 12,
      safe: false,
      tier: 4,
      gearTier: 3,
      weights: { combat: 50, loot: 25, trap: 15, rest: 10 },
      monsterIds: ['box_file_beetle', 'shelf_lurker', 'microfilm_phantom', 'auditor'],
      lootGold: { min: 10, max: 13 },
      trapDamage: { min: 30, max: 50 },
    },
    {
      id: 'parking_garage',
      name: 'Parking Garage',
      unlockLevel: 16,
      safe: false,
      tier: 5,
      gearTier: 3,
      weights: { combat: 50, loot: 25, trap: 15, rest: 10 },
      monsterIds: ['trolley_swarm', 'oil_slick', 'barrier_golem', 'ghost_car'],
      lootGold: { min: 13, max: 16 },
      trapDamage: { min: 40, max: 65 },
    },
  ],
  // Fitted to the Cafeteria's own ratios: at its unlock level in common tier-3 gear (level 8: 184 HP, attack 36,
  // defense 18) a Cafeteria fight takes 3 to 4 rounds and costs 21% to 50% of max HP. The Archive at level 12 (232 HP,
  // attack 44, defense 21) and the Garage at level 16 (280 HP, attack 52, defense 24) land at 3 to 4 rounds and 21% to
  // 43% with these numbers; the first draft, 40% stronger, knocked daily managers out on 84% of Archive days
  // (docs/evidence/biomes.md).
  monsters: [
    ...contentV15.monsters,
    monster('box_file_beetle', 'Box File Beetle', 4, 105, 27, 10, [55, 64], [10, 12]),
    monster('shelf_lurker', 'Shelf Lurker', 4, 120, 30, 12, [60, 70], [10, 13]),
    monster('microfilm_phantom', 'Microfilm Phantom', 4, 135, 33, 11, [66, 76], [11, 13]),
    monster('auditor', 'Auditor', 4, 145, 35, 14, [72, 82], [11, 14]),
    monster('trolley_swarm', 'Trolley Swarm', 5, 130, 33, 13, [86, 98], [13, 15]),
    monster('oil_slick', 'Oil Slick', 5, 150, 36, 15, [92, 106], [13, 16]),
    monster('barrier_golem', 'Barrier Golem', 5, 165, 39, 14, [100, 114], [14, 16]),
    monster('ghost_car', 'Ghost Car', 5, 170, 42, 17, [108, 124], [14, 17]),
  ],
  potions: {
    ...contentV15.potions!,
    dropWeightsByTier: {
      ...contentV15.potions!.dropWeightsByTier,
      4: { minor: 5, healing: 45, major: 50 },
      5: { minor: 0, healing: 35, major: 65 },
    },
  },
  todo: {
    ...contentV15.todo!,
    templates: contentV15.todo!.templates.map((template) => {
      const three = template.target[3]
      if (three === undefined) return template
      // Tier-4 and tier-5 targets continue the tier-3 ranges; gold targets scale with the floors' pay.
      const scale = template.kind === 'earn_gold' ? { 4: 1.4, 5: 1.8 } : { 4: 1, 5: 1 }
      return { ...template, target: { ...template.target, 4: { min: Math.round(three.min * scale[4]), max: Math.round(three.max * scale[4]) }, 5: { min: Math.round(three.min * scale[5]), max: Math.round(three.max * scale[5]) } } }
    }),
    rewardByTier: { ...contentV15.todo!.rewardByTier, 4: 40, 5: 50 },
    monsterPlurals: {
      ...contentV15.todo!.monsterPlurals,
      box_file_beetle: 'Box File Beetles',
      shelf_lurker: 'Shelf Lurkers',
      microfilm_phantom: 'Microfilm Phantoms',
      auditor: 'Auditors',
      trolley_swarm: 'Trolley Swarms',
      oil_slick: 'Oil Slicks',
      barrier_golem: 'Barrier Golems',
      ghost_car: 'Ghost Cars',
    },
  },
  career: {
    rungs: [
      ...contentV15.career!.rungs,
      { id: 'archive_win', title: 'Win a fight in the Archive', blurb: 'Level 12 opens the Archive under the cafeteria. Travel there and beat something that was filed.', predicate: { kind: 'biomeWin', biomeId: 'archive' }, gold: 120, companion: true },
      { id: 'garage_win', title: 'Win a fight in the Parking Garage', blurb: 'Level 16 opens the Parking Garage. Take the ramp down and win once.', predicate: { kind: 'biomeWin', biomeId: 'parking_garage' }, gold: 150, companion: true },
    ],
  },
  lore,
  narrative: {
    ...contentV15.narrative,
    biomes: { ...contentV15.narrative.biomes, archive, parking_garage: garage },
    monsters: { ...contentV15.narrative.monsters, ...monsters },
  },
}
