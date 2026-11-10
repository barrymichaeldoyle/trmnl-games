import type { BiomeNarrative, CareerRung, ContentCatalog, LootWeights, MonsterNarrative, MonsterTemplate } from '../sim/core/types'
import { contentV29 } from './v29'

/*
 * Content catalog v30 (D228): the Boiler Room, with tier-4 gear.
 *
 * The Parking Garage was the top floor from level 16 on. The 2026-11-10 audit
 * (D227) found production heroes at level 26 with nothing new to see after
 * level 16, Garage fights costing under a fifth of their HP, and finds that
 * stopped mattering once both slots were at +3. A sixth floor follows: the
 * Boiler Room at level 20 (tier 6), under the lowest level of the garage,
 * where the building's heating has run unattended for forty years and the
 * caretaker never left. It drops tier-4 gear (`gearTier: 4`), the first new
 * gear tier since launch: the workbench gains a Mk IV step that carries a
 * piece's reinforcement with it, and the next step a hero sees stays at its
 * own tier until its level can equip the next one, so a level-12 hero still
 * reinforces Mk III gear. Monster numbers are fitted to the Garage's fight
 * ratios at level 20 in tier-3 gear and checked by the harness
 * (docs/evidence/boiler-room.md).
 *
 * The floor carries the Garage's potion share (D222), its own field notes and
 * dug-in lines, and one career rung, "Win a fight in the Boiler Room",
 * inserted before the +3 goal at the end of the ladder; "Reach level 20" now
 * says what it opens. Everything else is v29.
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

const boilerRoom: BiomeNarrative = {
  victory: [
    `Defeated a {monster} between the boilers.${win}`,
    `A {monster} ran out of steam.${win}`,
    `Beat a {monster} under the pressure gauge.${win}`,
    `Turned a {monster} down to the pilot light.${win}`,
    `Left a {monster} cooling on the grating.${win}`,
    `Beat a {monster} by the fuse board.${win}`,
    `Vented a {monster} up the chimney.${win}`,
    `Signed a {monster} off in the maintenance log.${win}`,
  ],
  lootGold: [
    'Found {gold} gold in a tobacco tin on the pipe shelf.',
    "The caretaker's coat had {gold} gold in the pocket.",
    'Found {gold} gold behind the fuse board.',
    'A jar of coins by the kettle held {gold} gold.',
    'Found {gold} gold in the ash pan.',
    'Someone taped {gold} gold to the back of the boiler manual.',
  ],
  trapHit: [
    'A steam pipe spat. -{damage} HP.',
    'Grabbed a handrail that was hotter than it looked. -{damage} HP.',
    'A pressure valve let go. -{damage} HP.',
    'Slipped on the wet grating. -{damage} HP.',
    'A fuse blew in a shower of sparks. -{damage} HP.',
    'Walked into a low pipe. -{damage} HP.',
    'The furnace door swung open. -{damage} HP.',
    'Breathed in a lungful of soot. -{damage} HP.',
    'A coal scuttle tipped off the shelf. -{damage} HP.',
    'Tripped on a cable run across the floor. -{damage} HP.',
    'Hot water from a bleed valve. -{damage} HP.',
    'A bolt sheared and a bracket swung down. -{damage} HP.',
    'Bare wire on the switch panel. -{damage} HP.',
    'The lights cut out next to the boiler. -{damage} HP.',
    'Knocked a wrench off the top of a tank. -{damage} HP.',
    'A gauge glass burst. -{damage} HP.',
    'Headbutted the pump housing. -{damage} HP.',
    'A floor drain was not where the grate said. -{damage} HP.',
  ],
  trapHitCallbacks: { 'A steam pipe spat. -{damage} HP.': 'The same steam pipe spat again. -{damage} HP.' },
  rest: [
    'Sat with a back against the warm boiler. +{heal} HP.',
    'Dried off by the furnace. +{heal} HP.',
    "A mug of tea from the caretaker's kettle. +{heal} HP.",
    "Napped in the caretaker's chair. +{heal} HP.",
    'Listened to the pipes tick as they cooled. +{heal} HP.',
    'Found a dry crate behind the pumps. +{heal} HP.',
  ],
  eliteVictory: [
    `An elite {monster} was shut down for maintenance.${win}`,
    `Took down an elite {monster} in the furnace glow.${win}`,
    `An elite {monster} will not be relit.${win}`,
  ],
  jackpot: [
    "Jackpot! The caretaker's retirement fund, in a biscuit tin: {gold} gold.",
    'Jackpot! Thirty years of vending machine coins, in sacks: {gold} gold.',
    'Jackpot! A payroll strongbox behind the boiler: {gold} gold.',
  ],
  lootGear: ['Found a {item} hanging on the tool board.', 'Pulled a {item} out of the coal bunker.', 'A {item} was warming on top of the boiler.'],
  arrive: ['Took the service stairs down to the {destination}. It is warm, at least.', 'Made it to the {destination}. Mind the pipes.'],
}

const signature = (...lines: string[]): MonsterNarrative => ({ victory: lines.map((line) => `${line}${win}`) })

const monsters: Record<string, MonsterNarrative> = {
  pipe_python: signature('Tied a {monster} in a knot it could not undo.', 'Turned the stopcock on a {monster}.'),
  fuse_box_fiend: signature('Flipped the breaker on a {monster}.', 'Earthed a {monster} with a copper pipe.'),
  furnace_hound: signature('Shut the furnace door on a {monster}.', 'Put a {monster} out with the extinguisher.'),
  caretaker: signature('Handed the {monster} a work order it could not refuse.', 'Clocked out before the {monster} could object.'),
}

/* Field notes (D133): one per floor and per monster, in the voice of a hero's notebook, 20 to 240 characters. */
const lore = {
  biomes: {
    boiler_room:
      "Below the lowest level of the garage, past a door marked NO ADMITTANCE, the building's heart still beats. Boilers due for replacement in the eighties feed pipes nobody has traced. The caretaker never left.",
  },
  monsters: {
    pipe_python:
      'A heating pipe that came loose at both ends and kept moving. It winds through every ceiling in the building and is warm to the touch, which is how it gets you. Turn the stopcock and it goes slack for a while.',
    fuse_box_fiend:
      'It lives in the fuse board and trips whatever is most inconvenient. Every power cut upstairs is its doing, and it enjoys the complaints. Flip the breaker and it goes quiet until someone resets it.',
    furnace_hound:
      'Something in the old furnace was fed scraps for years and grew teeth. It guards the firebox and glows through the grate at night. The extinguisher cools it off, though it is back by the morning shift.',
    caretaker:
      'Hired before anyone can remember and never told to stop. The caretaker keeps the boilers running and counts everyone below the garage a trespasser. A work order with the right stamp buys a shift of peace.',
  },
}

/* The Garage's potion share (D222): the extra potion draws come out of gold. */
const base = contentV29.constants.lootWeights
const POTION_SHARE = 35
const lootWeights: LootWeights = { ...base, potion: POTION_SHARE, gold: base.gold - (POTION_SHARE - base.potion) }

/* One rung right before the +3 goal at the end, so a hero waiting there meets it first (D135's insert rule); "Reach
 * level 20" keeps its place and its blurb now names the floor it opens. */
const boilerWin: CareerRung = {
  id: 'boiler_win',
  title: 'Win a fight in the Boiler Room',
  blurb: 'Level 20 opens the Boiler Room under the garage. Take the service stairs down and win once.',
  predicate: { kind: 'biomeWin', biomeId: 'boiler_room' },
  gold: 200,
  companion: true,
}
const rungs = contentV29.career!.rungs.flatMap((rung) => {
  if (rung.id === 'level_20') return [{ ...rung, blurb: 'The Boiler Room opens at level 20.' }]
  if (rung.id === 'reinforce_3') return [boilerWin, rung]
  return [rung]
})
if (!rungs.some((rung) => rung.id === 'boiler_win') || !rungs.some((rung) => rung.blurb === 'The Boiler Room opens at level 20.')) throw new Error('career rungs level_20 or reinforce_3 are missing')

export const contentV30: ContentCatalog = {
  ...contentV29,
  contentVersion: 'v30',
  biomes: [
    ...contentV29.biomes,
    {
      id: 'boiler_room',
      name: 'Boiler Room',
      unlockLevel: 20,
      safe: false,
      tier: 6,
      gearTier: 4,
      weights: { combat: 50, loot: 25, trap: 15, rest: 10 },
      monsterIds: ['pipe_python', 'fuse_box_fiend', 'furnace_hound', 'caretaker'],
      lootGold: { min: 16, max: 20 },
      trapDamage: { min: 50, max: 80 },
      lootWeights,
    },
  ],
  // Fitted to the Garage's ratios at its own unlock (D133): at level 20 in common tier-3 gear (328 HP, attack 60,
  // defense 27) a fight here takes 3 to 4 rounds and costs 26% to 35% of max HP before potions, the same band the
  // Garage's monsters give a level-16 hero. Tier-4 gear then takes about a sixth off the cost.
  monsters: [
    ...contentV29.monsters,
    monster('pipe_python', 'Pipe Python', 6, 165, 42, 18, [130, 146], [16, 18]),
    monster('fuse_box_fiend', 'Fuse Box Fiend', 6, 185, 45, 20, [138, 156], [16, 19]),
    monster('furnace_hound', 'Furnace Hound', 6, 200, 49, 19, [150, 170], [17, 20]),
    monster('caretaker', 'Caretaker', 6, 190, 52, 22, [162, 186], [17, 21]),
  ],
  gearTemplates: [
    ...contentV29.gearTemplates,
    { id: 'pipe_wrench', kind: 'weapon', tier: 4, name: 'Pipe Wrench', statOffset: -1 },
    { id: 'furnace_poker', kind: 'weapon', tier: 4, name: 'Furnace Poker', statOffset: 1 },
    { id: 'boiler_suit', kind: 'armor', tier: 4, name: 'Boiler Suit', statOffset: -1 },
    { id: 'fire_blanket_cloak', kind: 'armor', tier: 4, name: 'Fire Blanket Cloak', statOffset: 1 },
  ],
  // Tier 4 continues the 3 / 7 / 12 and 2 / 5 / 9 curves and needs the floor's own level.
  gearTiers: {
    ...contentV29.gearTiers,
    4: { weaponAttack: 18, armorDefense: 14, requiredLevel: 20, saleValue: 48 },
  },
  workbench: {
    ...contentV29.workbench!,
    reinforceFromTier: 3,
    steps: [
      ...contentV29.workbench!.steps.filter((step) => step.kind === 'tier'),
      { kind: 'tier', toTier: 4, gold: 2500, materials: { scrap: 10, parts: 6, components: 2 } },
      ...contentV29.workbench!.steps.filter((step) => step.kind === 'reinforce'),
    ],
  },
  potions: {
    ...contentV29.potions!,
    dropWeightsByTier: {
      ...contentV29.potions!.dropWeightsByTier,
      6: { minor: 0, healing: 25, major: 75 },
    },
  },
  todo: {
    ...contentV29.todo!,
    templates: contentV29.todo!.templates.map((template) => {
      const three = template.target[3]
      if (three === undefined) return template
      // Tier-6 targets continue the tier-3 ranges; gold targets scale with the floor's pay.
      const scale = template.kind === 'earn_gold' ? 2.2 : 1
      return { ...template, target: { ...template.target, 6: { min: Math.round(three.min * scale), max: Math.round(three.max * scale) } } }
    }),
    rewardByTier: { ...contentV29.todo!.rewardByTier, 6: 60 },
    monsterPlurals: {
      ...contentV29.todo!.monsterPlurals,
      pipe_python: 'Pipe Pythons',
      fuse_box_fiend: 'Fuse Box Fiends',
      furnace_hound: 'Furnace Hounds',
      caretaker: 'Caretakers',
    },
  },
  standoff: {
    ...contentV29.standoff!,
    narrative: {
      ...contentV29.standoff!.narrative,
      dugIn: {
        ...contentV29.standoff!.narrative.dugIn,
        boiler_room: ['An elite {monster} has dug in behind the main boiler.', 'An elite {monster} has dug in inside the coal bunker.', 'An elite {monster} has dug in under the pump housing.'],
      },
      won: {
        ...contentV29.standoff!.narrative.won,
        boiler_room: ['The elite {monster} is shut down for good.', 'Switched off the elite {monster} at last.', 'The elite {monster} has gone cold for good.'],
      },
    },
  },
  career: { rungs },
  lore: {
    biomes: { ...contentV29.lore!.biomes, ...lore.biomes },
    monsters: { ...contentV29.lore!.monsters, ...lore.monsters },
  },
  narrative: {
    ...contentV29.narrative,
    biomes: { ...contentV29.narrative.biomes, boiler_room: boilerRoom },
    monsters: { ...contentV29.narrative.monsters, ...monsters },
  },
}
