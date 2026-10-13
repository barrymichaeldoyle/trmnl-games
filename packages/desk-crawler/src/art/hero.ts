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

export const CLOAKED_POSES = new Set(['idle', 'fight', 'walk'])

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

export const heroPoses = {
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

export type HeroPose = keyof typeof heroPoses
/** The six poses every class draws. */
export type BasePose = 'idle' | 'fight' | 'walk' | 'rest' | 'sleep' | 'knocked_out'

/** P37: the pose a class draws for a base pose; the Warrior keeps the original names, so its image URLs never change. */
export const classPose = (pose: BasePose, heroClass: 'warrior' | 'rogue' = 'warrior'): HeroPose => (heroClass === 'warrior' ? pose : (`${heroClass}_${pose}` as HeroPose))

/** The base pose and class a pose draws. */
export function poseParts(pose: HeroPose): { base: BasePose; heroClass: 'warrior' | 'rogue' } {
  return pose.startsWith('rogue_') ? { base: pose.slice(6) as BasePose, heroClass: 'rogue' } : { base: pose as BasePose, heroClass: 'warrior' }
}
