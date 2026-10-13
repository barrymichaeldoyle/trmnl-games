import { sprite, type Sprite } from './canvas'
import { poseParts, type HeroPose } from './hero'

/*
 * Occasion dressing (D139): what each office-calendar occasion adds to the scene. Up to five layers: a garland (or
 * cobwebs) along the ceiling, a floor prop between the hero and its foe (standing in the foe's place when the scene is
 * otherwise empty), a hat on the hero, a hat on every ordinary monster and a view in the office window. The ids
 * match the content catalog's occasion ids; the scene URL carries one. Reserved art (LICENSE).
 */

// ---------------------------------------------------------------- garland motifs (at most 7x6, hung from the line)

const bat = sprite(`
#  #  #
##w#w##
 #####
  # #
`)
const leaf = sprite(`
  #
 #:#
#:#:#
 #:#
  #
`)
const bauble = sprite(`
 #
###
#:w#
#::#
 ##
`)
const pennant = sprite(`
#####
#:::#
 #:#
  #
`)
const lamp = sprite(`
  #
 #w#
#####
 ###
`)
const lantern = sprite(`
 ##
####
#ww#
#ww#
####
 ##
`)
const heart = sprite(`
 # #
#w#w#
#www#
 #w#
  #
`)
const piGlyph = sprite(`
#####
 # #
 # #
 # #
`)
const shamrock = sprite(`
 # #
#w#w#
 #w#
#w#w#
 ##
  #
`)
const egg = sprite(`
 ##
#ww#
#::#
#ww#
 ##
`)
const bone = sprite(`
#   #
#####
#   #
`)
const skullFlag = sprite(`
######
##ww##
#w##w#
##ww##
#w##w#
######
`)
const bean = sprite(`
 ##
#w##
##w#
 ##
`)

/** A 3x5 hand-cut figure set for garland cards: only the characters the garlands spell. */
const MINI: Record<string, readonly string[]> = {
  S: ['###', '#  ', '###', '  #', '###'],
  A: ['###', '# #', '###', '# #', '# #'],
  L: ['#  ', '#  ', '#  ', '#  ', '###'],
  E: ['###', '#  ', '## ', '#  ', '###'],
  B: ['## ', '# #', '## ', '# #', '## '],
  O: ['###', '# #', '# #', '# #', '###'],
  '1': [' # ', '## ', ' # ', ' # ', '###'],
  '2': ['###', '  #', '###', '#  ', '###'],
  '3': ['###', '  #', '###', '  #', '###'],
  '4': ['# #', '# #', '###', '  #', '  #'],
  '5': ['###', '#  ', '###', '  #', '###'],
  '6': ['###', '#  ', '###', '# #', '###'],
  '9': ['###', '# #', '###', '  #', '###'],
  '.': ['   ', '   ', '   ', '   ', ' # '],
}

/** A white card on the garland with one figure on it and a one-pixel margin: 7 wide and 9 tall. */
const card = (ch: string): Sprite => sprite(['#######', '#wwwww#', ...MINI[ch]!.map((row) => `#w${row.replaceAll(' ', 'w')}w#`), '#wwwww#', '#######'].join('\n'))
const cards = (text: string): readonly Sprite[] => [...text].map(card)

// ---------------------------------------------------------------- hats (the hero's, then the monsters')

const witchHat = sprite(`
      #
     ##
    #:#
    #::#
   #:::#
   #::::#
  #::::::#
###########
`)
const santaHat = sprite(`
         ##
   ######ww
  #::::::##
 #::::::::#
###########
#wwwwwwwwww#
############
`)
const partyHat = sprite(`
   #
  #w#
  #:#
 #w:w#
 #:w:#
#w:w:w#
#######
`)
const bunnyEars = sprite(`
 ##   ##
#ww# #ww#
#w:# #:w#
#w:# #:w#
#w:# #:w#
 #w# #w#
  ## ##
`)
const topHat = sprite(`
  #######
  #:::::#
  #:::::#
  #:::::#
  #wwwww#
###########
`)
const jesterHat = sprite(`
##         ##
 #w#     #w#
  #:#   #:#
  #::# #::#
   #:::::#
  #########
`)
const tricorn = sprite(`
 ##       ##
#::#######::#
#:::::w:::::#
 #:::www:::#
  #########
`)
const smallWitchHat = sprite(`
    #
   ##
   #:#
  #::#
 #:::#
#######
`)
const smallSantaHat = sprite(`
      ##
  ####ww
 #::::#
#######
#wwwwww#
########
`)
const smallPartyHat = sprite(`
  #
 #w#
 #:#
#w:w#
#####
`)

// ---------------------------------------------------------------- floor props (at most 16x11)

const pumpkin = sprite(`
     ##
      #
  #########
 #:::::::::#
#::#:::::#::#
#:###:::###:#
#:::::#:::::#
#::#######::#
#:::#:#:#:::#
 #:::::::::#
  #########
`)
const blackCat = sprite(`
#    #
##  ##
######      #
#w##w#       #
######       #
 ####       #
  ####     #
 ######   #
#######  #
########
########
 #######
`)
const roast = sprite(`
   #########
  #w#w#w#w#w#
 #w#w#w#w#w#w#
 #ww#w#w#w#ww#
  #ww#####ww#
   ###www###
   ##w#ww#
  #w#wwww#
   ##wwwww#
     #wwww#
      ####
      #  #
     ##  ##
`)
const shoppingBags = sprite(`
  ##        ##
 #  #      #  #
########  ######
#wwwwww#  #wwww#
#w#ww#w#  #w##w#
#ww##ww#  #w##w#
#w#ww#w#  #wwww#
#wwwwww#  #wwww#
########  ######
`)
const tree = sprite(`
       #
      ###
       #
      #w#
     #www#
    #ww#ww#
     #www#
    #wwwww#
   #w#www#w#
    #wwwww#
   #wwwwwww#
  #ww#www#ww#
 #wwwwwwwwwww#
###############
      #w#
     #####
`)
const champagne = sprite(`
    #  #
  #   #   #
     ##
     ##
    #ww#
    #ww#
   #wwww#     #   #
   #:::::#    #www#
   #:www:#    #www#
   #:www:#     #w#
   #:::::#      #
   #wwwww#      #
   #wwwww#     ###
   #######
`)
const diya = sprite(`
       #
      #w#
      #w#
     #www#
      ###
 ###############
 #:::::::::::::#
  #:::#:::#:::#
   ###########
# # # # # # # # #
`)
const bigLantern = sprite(`
    #
   ###
 #######
#:w:w:w:#
#:w:w:w:#
#:w:w:w:#
#:w:w:w:#
 #######
   ###
   # #
`)
const heartBox = sprite(`
  ##   ##
 #ww# #ww#
#wwww#wwww#
#w:wwwwwww#
#wwwwwwwww#
 #wwwwwww#
  #wwwww#
   #www#
    #w#
     #
`)
const pie = sprite(`
   #   #
    #   #
   #   #
  ###########
 ##w#w#w#w#w##
#wwwwwwwwwwwww#
###############
#:#:#:#:#:#:#:#
 #############
`)
const potOfGold = sprite(`
    #  #  #
  #w##w##w#
 #wwwwwwwwww#
 #w#ww#ww#w#
################
 #::::::::::::#
#::::::::::::::#
#::::::::::::::#
 #::::::::::::#
  ############
`)
const basket = sprite(`
     #####
    #     #
   #       #
  #  ##  ## #
  # #ww##ww##
 ###############
 #w#w#w#w#w#w#w#
 ##w#w#w#w#w#w##
 #w#w#w#w#w#w#w#
  #############
`)
const whoopee = sprite(`
     ####
    #wwww#
  ###wwww###
 #wwwwwwwwww#
#wwwwwwwwwwww#
 #wwwwwwwwww#
  ##########
`)
const dog = sprite(`
  ###
 #www##
#ww#www#
#wwwwww###
 #wwwww#
  #www#           ##
  #wwww#         #w#
  #wwwwww#######ww#
  #wwwwwwwwwwwwwww#
  #wwwwwwwwwwwwww#
  #ww##wwwww##ww#
  #ww# #ww# #ww#
  ###  ###  ###
`)
const parrot = sprite(`
    ####
   #wwww#
  #w#www##
  #wwww#ww#
   #ww:##
   #w:::#
  #w::::#
  #w::::#
   #::::#
    #::#
    #:#
  #########
      #
      #
      #
    #####
`)
const mug = sprite(`
   #  #
    #  #
   #  #
#########
#wwwwwww###
#w#####w# #
#wwwwwww# #
#wwwwwww###
#wwwwwww#
#########
`)
const trophy = sprite(`
  #########
###wwwwwww###
#w#ww#wwww#w#
#w#w##wwww#w#
 ##ww#wwww##
   #w#www#
    #www#
     #w#
     #w#
   #######
   #wwwww#
   #######
`)
const frog = sprite(`
  ##    ##
 #w##  #w##
 #ww######
#wwwwwwwwww#
#w########w#
 #wwwwwwww#
#w##wwww##w#
###  ##  ###
`)

// ---------------------------------------------------------------- the table

export interface Dressing {
  /** Hung along a sagging line under the ceiling, or (`cobwebs`) cobwebs in the top corners with motifs flying free. */
  readonly strip?: { readonly kind: 'garland' | 'cobwebs'; readonly motif: Sprite | readonly Sprite[] }
  readonly prop: Sprite
  readonly heroHat?: Sprite
  readonly monsterHat?: Sprite
  /** What the office window shows instead of its sky. */
  readonly window?: 'snow' | 'fireworks' | 'hearts'
}

export const DRESSING = {
  christmas: { strip: { kind: 'garland', motif: bauble }, prop: tree, heroHat: santaHat, monsterHat: smallSantaHat, window: 'snow' },
  new_year: { strip: { kind: 'garland', motif: pennant }, prop: champagne, heroHat: partyHat, monsterHat: smallPartyHat, window: 'fireworks' },
  halloween: { strip: { kind: 'cobwebs', motif: bat }, prop: pumpkin, heroHat: witchHat, monsterHat: smallWitchHat },
  friday_13th: { prop: blackCat },
  thanksgiving: { strip: { kind: 'garland', motif: leaf }, prop: roast },
  black_friday: { strip: { kind: 'garland', motif: cards('SALE') }, prop: shoppingBags },
  diwali: { strip: { kind: 'garland', motif: lamp }, prop: diya, window: 'fireworks' },
  lunar_new_year: { strip: { kind: 'garland', motif: lantern }, prop: bigLantern, window: 'fireworks' },
  valentines: { strip: { kind: 'garland', motif: heart }, prop: heartBox, window: 'hearts' },
  pi_day: { strip: { kind: 'garland', motif: [piGlyph, ...cards('3.14159265')] }, prop: pie },
  st_patricks: { strip: { kind: 'garland', motif: shamrock }, prop: potOfGold, heroHat: topHat },
  easter: { strip: { kind: 'garland', motif: egg }, prop: basket, heroHat: bunnyEars },
  april_fools: { prop: whoopee, heroHat: jesterHat },
  dog_day: { strip: { kind: 'garland', motif: bone }, prop: dog },
  pirate_day: { strip: { kind: 'garland', motif: skullFlag }, prop: parrot, heroHat: tricorn },
  coffee_day: { strip: { kind: 'garland', motif: bean }, prop: mug },
  bosses_day: { strip: { kind: 'garland', motif: cards('BOSS') }, prop: trophy },
  leap_day: { prop: frog },
} as const satisfies Record<string, Dressing>

export type OccasionArt = keyof typeof DRESSING
/** The dressing for an occasion, read through the interface so optional layers stay optional. */
export const dressingFor = (occasion: OccasionArt | undefined): Dressing | undefined => (occasion === undefined ? undefined : DRESSING[occasion])
export const OCCASION_ARTS = Object.keys(DRESSING) as OccasionArt[]
export const isOccasionArt = (id: string): id is OccasionArt => id in DRESSING

/**
 * Where a hat sits on each pose: the head's centre column and the sprite row the hat's bottom row lands on. Lying
 * down, the hat sits on the head on the pillow. The Rogue's hood is narrower and sits a row lower.
 */
const HAT_ANCHOR: Record<string, { readonly centre: number; readonly bottom: number }> = {
  idle: { centre: 12, bottom: 1 },
  fight: { centre: 12, bottom: 1 },
  walk: { centre: 12, bottom: 1 },
  rest: { centre: 12, bottom: 5 },
  sleep: { centre: 6, bottom: 8 },
  knocked_out: { centre: 6, bottom: 6 },
  rogue_idle: { centre: 10, bottom: 2 },
  rogue_fight: { centre: 10, bottom: 2 },
  rogue_walk: { centre: 10, bottom: 2 },
  rogue_rest: { centre: 10, bottom: 6 },
}

export function heroHatAnchor(pose: HeroPose): { readonly centre: number; readonly bottom: number } {
  // D149: long hair and the braid hang behind the head, so a look wears its class's hat in the same place.
  const { base, heroClass } = poseParts(pose)
  return HAT_ANCHOR[heroClass === 'warrior' ? base : `${heroClass}_${base}`] ?? HAT_ANCHOR[base]!
}

/** The column a monster's hat centres on: the middle of its topmost inked row, so a lopsided monster wears it on its head. */
export function monsterHatCentre(s: Sprite): number {
  const top = s.rows.find((row) => row.trim() !== '') ?? ''
  const first = top.search(/\S/)
  const last = top.length - [...top].reverse().join('').search(/\S/) - 1
  return Math.floor((first + last) / 2)
}
