import { sprite, type Sprite } from './canvas'

/*
 * The Warrior: an office adventurer with tousled hair, cardigan, lanyard badge
 * and a letter-opener blade. 24x24 grids, facing right. Reserved art (LICENSE).
 */

export const heroIdle = sprite(`
          ######
        #########
       ##########         #
      ###wwwww###        #w#
      ##wwwwwwww#        #w#
      #ww#ww#www#        #w#
      #wwwwwwwww#        #w#
       #ww###ww#         #w#
        #wwwww#          #w#
       ##::#::##        #####
      #:::w#w:::#        #w#
     #::::#w#:::##      ##w#
    #w#:::#w#::::#######ww#
    #w#:::#w#::::##ww####
    #w#::::#:::::# ###
     ## #:::::::#
        #:::::::#
        #########
        ##     ##
        ##     ##
        ##     ##
       ###     ###
      ####     ####
`)

export const heroFight = sprite(`
          ######
        #########
       ##########
      ###wwwww###
      ##wwwwwwww#
      #ww#ww##ww#
      #wwwwwwwww#
       #ww##www#
        #wwwww#
       ##::#::##
      #:::w#w:::#
     #::::#w#:::########w##
    #w#:::#w#::::#ww#######ww#
    #w#:::#w#::::#########ww#
    #w#::::#:::::#      ####
     ## #:::::::#
        #:::::::#
        #########
        ##    ##
       ##      ##
      ##        ##
     ##          ##
    ###          ###
`)

export const heroWalk = sprite(`
          ######
        #########
       ##########
      ###wwwww###
      ##wwwwwwww#
      #ww#ww#www#
      #wwwwwwwww#
       #ww###ww#
        #wwwww#
       ##::#::##
      #:::w#w:::#
     #::::#w#:::#
    #w#:::#w#::::#
    #w#:::#w#::::#w#
     ##::::#:::::#w#
       #:::::::# ##
        #:::::::#
        #########
         ##   ##
        ##     ##
       ##       ##
      ###       ###
     ####       ####
`)

export const heroRest = sprite(`




          ######
        #########
       ##########
      ###wwwww###
      ##wwwwwwww#
      #ww##w##ww#
      #wwwwwwwww#
       #ww###ww#
        #wwwww#
       ##::#::##
      #:::w#w:::#
     #:::::#:::::#
    #w#:::::::::#w#
    #w#:::::::::#w#
    ###############
   ##################
   ##################
`)

export const heroSleep = sprite(`
                    ###
                      #
                     #
                    ###
              ##
               #
              #
              ##
    ######
   ########################
  #wwwwww#::::::::::::::::##
  #w##ww##::::::w#w:::::::##
  #wwwwww#::::::::::::::::##
   ########################
   ########################
`)

export const heroKnockedOut = sprite(`





    ######
   ########################
  #wwwwww#::::::::::::::::##
  #w#w#ww#::::::w#w:::::::##
  #ww#www#::::::::::::::::##
  #w#w#ww#::::::::::::::::##
   ########################
   ########################
          #w#      ####
          #w##########w#
          ###############
`)

/** A flowing cloak drawn behind the standing poses for a touch of the arcane. */
export const heroCloak = sprite(`
       ###
      #:::#
     #:::::#
    #::::::#
    #::::::#
   #:::::::#
   #::::::#
  #::::::#
  #:::::#
 #:::::#
 #::::#
  ####
`)

export const CLOAKED_POSES = new Set(['idle', 'fight', 'walk', 'female_idle', 'female_fight', 'female_walk'])

/*
 * The Rogue (P37): the Warrior's body under a pointed hood, with a scarf over the lower face. The head rows replace
 * the Warrior's in the standing and sitting poses; lying down only the colours differ (the companion's palette).
 */
const ROGUE_HEAD = [
  '     ##',
  '      ######',
  '      #########',
  '     ####wwwww##',
  '     ###wwwwwww#',
  '     ##ww#ww#ww#',
  '     ##wwwwwwww#',
  '      #:::::::#',
  '       #:::::#',
]

/** The sprite with the Rogue's head over its first nine rows from `top`, leaving the blade's columns (17 on) as drawn. */
function hooded(s: Sprite, top: number): Sprite {
  return { ...s, rows: s.rows.map((row, y) => (y < top || y >= top + ROGUE_HEAD.length ? row : ROGUE_HEAD[y - top]!.padEnd(17) + row.slice(17))) }
}

/*
 * The female look (D149): hair down the back of the head to the shoulders on the Warrior, a braid out of the Rogue's
 * hood, and hair spread on the pillow lying down. Purely cosmetic; the cells are added to the male grids so every
 * face, eye and blade stays as drawn. Cells are [row, column] from the head's top row.
 */
const LONG_HAIR: ReadonlyArray<readonly [number, number]> = [[3, 5], [4, 5], [5, 5], [6, 5], [7, 5], [7, 6], [8, 5], [8, 6], [8, 7], [9, 5], [9, 6], [10, 5]]
const BRAID: ReadonlyArray<readonly [number, number]> = [[6, 4], [7, 3], [7, 4], [8, 3], [8, 4], [9, 3], [9, 4], [10, 4]]

function withCells(s: Sprite, top: number, cells: ReadonlyArray<readonly [number, number]>): Sprite {
  const rows = s.rows.map((row) => [...row.padEnd(s.width)])
  for (const [dy, x] of cells) rows[top + dy]![x] = '#'
  return { ...s, rows: rows.map((row) => row.join('')) }
}

/** Lying down: hair spread on the pillow above the head, two columns wide, from below the hair row to the chin. */
const PILLOW_HAIR: ReadonlyArray<readonly [number, number]> = [[1, 1], [1, 2], [2, 0], [2, 1], [3, 0], [3, 1], [4, 0], [4, 1], [5, 1], [5, 2]]
const hairOnPillow = (s: Sprite, hairRow: number): Sprite => withCells(s, hairRow, PILLOW_HAIR)

const warriorPoses = {
  idle: heroIdle,
  fight: heroFight,
  walk: heroWalk,
  rest: heroRest,
  sleep: heroSleep,
  knocked_out: heroKnockedOut,
  rogue_idle: hooded(heroIdle, 0),
  rogue_fight: hooded(heroFight, 0),
  rogue_walk: hooded(heroWalk, 0),
  rogue_rest: hooded(heroRest, 4),
  rogue_sleep: heroSleep,
  rogue_knocked_out: heroKnockedOut,
} as const

export const heroPoses = {
  ...warriorPoses,
  female_idle: withCells(heroIdle, 0, LONG_HAIR),
  female_fight: withCells(heroFight, 0, LONG_HAIR),
  female_walk: withCells(heroWalk, 0, LONG_HAIR),
  female_rest: withCells(heroRest, 4, LONG_HAIR),
  female_sleep: hairOnPillow(heroSleep, 8),
  female_knocked_out: hairOnPillow(heroKnockedOut, 6),
  female_rogue_idle: withCells(warriorPoses.rogue_idle, 0, BRAID),
  female_rogue_fight: withCells(warriorPoses.rogue_fight, 0, BRAID),
  female_rogue_walk: withCells(warriorPoses.rogue_walk, 0, BRAID),
  female_rogue_rest: withCells(warriorPoses.rogue_rest, 4, BRAID),
  female_rogue_sleep: hairOnPillow(heroSleep, 8),
  female_rogue_knocked_out: hairOnPillow(heroKnockedOut, 6),
} as const

export type HeroPose = keyof typeof heroPoses
/** The six poses every class draws. */
export type BasePose = 'idle' | 'fight' | 'walk' | 'rest' | 'sleep' | 'knocked_out'

/** D149: a hero's look; absent on a stored hero means male, the original art. */
export type HeroGender = 'male' | 'female'

/**
 * P37: the pose a class draws for a base pose; the Warrior keeps the original names, so its image URLs never change.
 * D149: the female look prefixes `female_`, so the male paths never change either.
 */
export const classPose = (pose: BasePose, heroClass: 'warrior' | 'rogue' = 'warrior', gender: HeroGender = 'male'): HeroPose =>
  `${gender === 'female' ? 'female_' : ''}${heroClass === 'warrior' ? '' : `${heroClass}_`}${pose}` as HeroPose

/** The base pose, class and look a pose draws. */
export function poseParts(pose: HeroPose): { base: BasePose; heroClass: 'warrior' | 'rogue'; gender: HeroGender } {
  const gender: HeroGender = pose.startsWith('female_') ? 'female' : 'male'
  const rest = gender === 'female' ? pose.slice(7) : pose
  return rest.startsWith('rogue_') ? { base: rest.slice(6) as BasePose, heroClass: 'rogue', gender } : { base: rest as BasePose, heroClass: 'warrior', gender }
}
