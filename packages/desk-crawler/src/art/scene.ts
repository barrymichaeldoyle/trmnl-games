import { Canvas, mirror, sprite, type Sprite } from './canvas'
import { classPose, CLOAKED_POSES, heroCloak, heroPoses, type HeroGender, type HeroPose } from './hero'
import { monsterArt } from './monsters'
import { eliteCrown, propArt, type PropId } from './props'
import { dressingFor, heroHatAnchor, monsterHatCentre, type Dressing, type OccasionArt } from './occasions'
import type { SceneTime } from './sceneTime'
export { SCENE_VERSION } from './sceneTime'

/**
 * Scene window composition (revision 13): biome backdrop + hero pose + the
 * latest encounter's subject and local sky, on a 152x40 pixel stage, dressed for
 * the live occasion (D139). Deterministic for a given key, so the image URL is cacheable.
 */
export const STAGE_WIDTH = 152
export const STAGE_HEIGHT = 40
/**
 * Full layout renders 152x40 at x5 (760x200, full content width); smaller layouts at x2 (304x80).
 * Large screens (TRMNL X, `screen--lg`) get x6 for the full view and x3 for the smaller views.
 */
export const FULL_SCALE = 5
export const SMALL_SCALE = 2
export const LARGE_SCALE = 6
export const MEDIUM_SCALE = 3
const GROUND = 37
const HERO_X = 24
const SUBJECT_X = 92
/** D139: an occasion's floor prop stands here, in the clear band between the hero and its foe. */
const DECOR_X = 66

export type BiomeArt = 'office_cubicles' | 'server_room' | 'cafeteria_depths' | 'archive' | 'parking_garage'
export type Subject =
  | { kind: 'monster'; id: keyof typeof monsterArt; elite: boolean }
  | { kind: 'prop'; id: PropId }
  /** D141: the other hero of a meeting, with the meeting's prop between the two; D149: in its look. */
  | { kind: 'coworker'; heroClass: 'warrior' | 'rogue'; gender?: HeroGender; prop?: PropId }
  | { kind: 'none' }

/** The blade's columns in the standing poses (hero.ts): a coworker comes to a meeting without one. */
const BLADE_FROM = 17

/** D141: the coworker's sprite: its class's idle pose, the blade left at its desk, turned to face our hero. */
export function coworkerSprite(heroClass: 'warrior' | 'rogue', gender: HeroGender = 'male'): Sprite {
  const idle = heroPoses[classPose('idle', heroClass, gender)]
  return mirror({ width: BLADE_FROM, height: idle.height, rows: idle.rows.map((row) => row.slice(0, BLADE_FROM).padEnd(BLADE_FROM)) })
}

const star = sprite(`
 #
###
 #
`)
const moon = sprite(`
  ###
 ##w
##w
##
##
##w
 ##w
  ###
`)
const sun = sprite(`
   #
 #   #
  ###
# #w# #
  ###
 #   #
   #
`)
const cloud = sprite(`
   ###
 ###ww##
#wwwwwww#
 #######
`)
const torch = sprite(`
  #
 #w#
#www#
 #w#
 ###
  #
  #
  #
`)
const plant = sprite(`
   # #  #
  #w# ##w#
 #ww##www#
  ##w#w##
 #ww###ww#
  ## # ##
`)
const plantPot = sprite(`
   #####
   #:::#
   #:::#
   #####
`)
const monitor = sprite(`
#########
#wwwwwww#
#w:::::w#
#w:::::w#
#wwwwwww#
#########
   ###
  #####
`)
const pot = sprite(`
   #
   #
 #####
#:::::#
#:::::#
 #####
`)

// ---------------------------------------------------------------- backdrops

function office(c: Canvas, time: SceneTime, view?: Dressing['window']): void {
  // The window follows local day/night; the indoor stage stays the same.
  c.region = 'frame'
  c.rect(4, 2, 36, 18, '#')
  c.region = 'sky'
  c.rect(6, 4, 32, 14, 'w')
  if (view !== undefined) windowView(c, view)
  else if (time === 'night') {
    c.region = 'star'
    for (const [x, y] of [[8, 6], [16, 11], [24, 5], [9, 13]] as const) c.draw(star, x, y)
    c.region = 'moon'
    c.draw(moon, 28, 7)
  } else {
    c.region = 'sun'
    c.draw(sun, 28, 5)
    c.region = 'cloud'
    c.draw(cloud, 8, 5)
    c.draw(cloud, 11, 12)
  }
  c.region = 'frame'
  c.vline(22, 4, 17)
  c.hline(6, 37, 10)
  // Cubicle partition with a cork-board shade, monitor and plant.
  c.region = 'partition'
  c.rect(56, 14, 32, 2, '#')
  c.rect(56, 16, 32, 6, ':')
  c.vline(56, 14, 24)
  c.vline(87, 14, 24)
  c.region = 'monitor'
  c.draw(monitor, 66, 6)
  c.region = 'partition'
  c.rect(122, 14, 30, 2, '#')
  c.rect(122, 16, 30, 6, ':')
  c.vline(122, 14, 24)
  c.region = 'monitor'
  c.draw(monitor, 132, 6)
  c.region = 'leaves'
  c.draw(plant, 140, 26)
  c.region = 'pot'
  c.draw(plantPot, 140, 32)
  c.region = 'lamp'
  for (const x of [52, 100, 136]) {
    c.hline(x, x + 8, 0)
    c.hline(x + 2, x + 6, 1, ':')
  }
}

function serverRoom(c: Canvas): void {
  // Racks of varied height with blinking lights.
  const racks: Array<[number, number]> = [[2, 22], [20, 26], [52, 24], [70, 20], [118, 26], [136, 22]]
  for (const [left, height] of racks) {
    const top = 28 - height
    c.region = 'rack'
    c.rect(left, top, 14, height, '#')
    c.rect(left + 2, top + 2, 10, height - 4, 'w')
    for (let y = top + 4; y < top + height - 3; y += 3) {
      c.region = 'slot'
      c.hline(left + 3, left + 7, y, '#')
      // Blinking status lights, kept clear of the rack border.
      c.region = (left + y) % 2 === 0 ? 'led' : 'led-amber'
      if ((left + y) % 3 !== 0) c.paint(left + 9, y, '#')
    }
  }
  // Cables sagging from the ceiling.
  c.region = 'cable'
  for (let x = 0; x < STAGE_WIDTH; x += 1) c.paint(x, 1 + Math.round(2 * Math.sin(x / 7)), '#')
  // Raised floor tiles.
  c.region = 'tile'
  for (let x = 0; x < STAGE_WIDTH; x += 10) c.vline(x, GROUND + 1, STAGE_HEIGHT - 1, ':')
}

function cafeteria(c: Canvas): void {
  // Stone arches with torches: the cafeteria's depths.
  for (const left of [4, 104]) {
    c.region = 'arch'
    for (let x = 0; x <= 44; x += 1) {
      const y = 2 + Math.round(9 * (1 - Math.sin((Math.PI * x) / 44)))
      c.paint(left + x, y, '#')
      c.paint(left + x, y + 1, '#')
    }
    c.vline(left, 11, 24)
    c.vline(left + 44, 11, 24)
    c.region = 'torch'
    c.draw(torch, left + 20, 6)
  }
  // Brick wall between the arches.
  c.region = 'brick'
  for (let y = 4; y < 24; y += 4) {
    c.hline(52, 100, y, '#')
    for (let x = 52 + ((y / 4) % 2) * 4; x <= 100; x += 8) c.vline(x, y, y + 3, '#')
  }
  // Serving counter with a steaming pot.
  c.region = 'counter'
  c.rect(0, 24, STAGE_WIDTH, 2, '#')
  c.rect(0, 26, STAGE_WIDTH, 3, ':')
  c.region = 'pot'
  c.draw(pot, 72, 18)
  c.region = 'steam'
  for (const [x, y] of [[76, 15], [77, 13], [76, 11]] as const) c.paint(x, y, '#')
}

function archive(c: Canvas): void {
  // Rolling shelves either side, boxes on every shelf, one hanging light over the middle (D133).
  for (const left of [0, 118]) {
    c.region = 'shelf'
    c.rect(left, 6, 34, 1, '#')
    c.vline(left, 6, 30)
    c.vline(left + 33, 6, 30)
    for (const y of [13, 20, 27]) c.hline(left, left + 33, y)
    c.region = 'box'
    for (const [y, pattern] of [[8, [2, 9, 17, 25]], [15, [3, 12, 21]], [22, [2, 10, 16, 24]]] as const) {
      for (const x of pattern) {
        c.rect(left + x, y, 7, 5, ':')
        c.hline(left + x, left + x + 6, y, '#')
        c.vline(left + x, y, y + 4)
        c.vline(left + x + 6, y, y + 4)
      }
    }
  }
  // The one working light: a cord, a shade and a cone of lit paper.
  c.region = 'lamp'
  c.vline(76, 0, 4)
  c.hline(72, 80, 5)
  c.hline(70, 82, 6, ':')
  c.region = 'light'
  for (let y = 7; y < 17; y += 1) {
    c.paint(76 - (y - 6), y, '#')
    c.paint(76 + (y - 6), y, '#')
    c.hline(77 - (y - 6), 75 + (y - 6), y, '.')
  }
  // A ceiling of pipes and the dust line along the floor.
  c.region = 'pipe'
  c.hline(0, STAGE_WIDTH - 1, 1)
  c.region = 'dust'
  for (let x = 2; x < STAGE_WIDTH; x += 5) c.paint(x, GROUND - 1, '#')
}

function parkingGarage(c: Canvas): void {
  // Concrete pillars clear of the hero and the foe, a ramp curving away on the right, pipes and a strip light on the
  // ceiling, a level sign, the bay line and two puddles (D133).
  c.region = 'pipe'
  c.hline(0, STAGE_WIDTH - 1, 0)
  c.hline(0, STAGE_WIDTH - 1, 2)
  for (let x = 4; x < STAGE_WIDTH; x += 24) c.vline(x, 0, 2)
  c.region = 'tube'
  c.rect(74, 4, 26, 3, '#')
  c.rect(75, 5, 24, 1, 'w')
  for (const left of [6, 60, 146]) {
    c.region = 'pillar'
    const wide = left + 8 > STAGE_WIDTH ? STAGE_WIDTH - left : 8
    c.rect(left, 6, wide, 24, '#')
    c.rect(left + 1, 7, wide - 2, 22, ':')
    c.region = 'band'
    c.rect(left + 1, 20, wide - 2, 2, 'w')
  }
  c.region = 'ramp'
  for (let x = 124; x < 146; x += 1) {
    const y = 30 - Math.round(((x - 124) * 12) / 22)
    c.paint(x, y, '#')
    c.paint(x, y + 1, '#')
  }
  c.region = 'sign'
  c.rect(100, 7, 13, 8, '#')
  c.rect(101, 8, 11, 6, 'w')
  c.hline(104, 108, 9)
  c.vline(106, 9, 12)
  c.region = 'bay'
  c.hline(0, STAGE_WIDTH - 1, 34, '=')
  c.region = 'puddle'
  c.rect(42, 35, 18, 2, ':')
  c.rect(118, 35, 14, 2, ':')
}

const burst = sprite(`
   #
 # # #
  ###
### ###
  ###
 # # #
   #
`)
const flake = sprite(`
 #
###
 #
`)
const windowHeart = sprite(`
 # #
#####
 ###
  #
`)

/** D139: the office window's occasion view, drawn over the sky in place of the sun, clouds, moon and stars. */
function windowView(c: Canvas, view: NonNullable<Dressing['window']>): void {
  if (view === 'snow') {
    c.region = 'snow'
    for (const [x, y] of [[8, 5], [14, 8], [19, 5], [26, 6], [32, 9], [10, 12], [29, 13], [17, 14], [35, 5]] as const) c.draw(flake, x - 1, y - 1)
    // A drift on the sill.
    c.region = 'drift'
    c.rect(6, 16, 32, 2, 'w')
    c.hline(6, 37, 15)
    return
  }
  if (view === 'fireworks') {
    c.region = 'firework'
    for (const [x, y] of [[8, 5], [25, 4], [15, 10], [31, 11]] as const) c.draw(burst, x, y)
    return
  }
  c.region = 'heart'
  for (const [x, y] of [[8, 5], [16, 11], [27, 5], [32, 12], [10, 13]] as const) c.draw(windowHeart, x, y)
}


const BACKDROPS: Record<BiomeArt, (c: Canvas, time: SceneTime, view?: Dressing['window']) => void> = { office_cubicles: office, server_room: serverRoom, cafeteria_depths: cafeteria, archive, parking_garage: parkingGarage }

/** Draw a sprite with a 1px white halo so it stays legible over busy backdrops. */
function drawWithHalo(c: Canvas, s: Sprite, left: number, top: number, region: string): void {
  c.region = 'halo'
  s.rows.forEach((row, dy) =>
    [...row].forEach((ch, dx) => {
      if (ch === ' ') return
      for (let oy = -1; oy <= 1; oy += 1) for (let ox = -1; ox <= 1; ox += 1) c.paint(left + dx + ox, top + dy + oy, 'w')
    }),
  )
  c.region = region
  c.draw(s, left, top)
}

/** A sprite on the stage, back to front, with what it is so the companion can colour it (sceneColour.ts). */
export type Placement =
  | { readonly role: 'cloak' | 'hero' | 'crown'; readonly sprite: Sprite; readonly left: number; readonly top: number }
  /** D139: an occasion's floor prop, hero hat or monster hat; `id` is `<occasion>:<part>`. */
  | { readonly role: 'decor'; readonly id: `${OccasionArt}:${'prop' | 'hat' | 'monsterHat'}`; readonly sprite: Sprite; readonly left: number; readonly top: number }
  | { readonly role: 'monster'; readonly id: keyof typeof monsterArt; readonly sprite: Sprite; readonly left: number; readonly top: number }
  | { readonly role: 'prop'; readonly id: PropId; readonly sprite: Sprite; readonly left: number; readonly top: number }
  /** D141: the other hero of a meeting, drawn mirrored; its cloak is a `cloak` placement like ours. */
  | { readonly role: 'coworker'; readonly heroClass: 'warrior' | 'rogue'; readonly gender: HeroGender; readonly sprite: Sprite; readonly left: number; readonly top: number }

export function scenePlacements(pose: HeroPose, subject: Subject, occasion?: OccasionArt): Placement[] {
  const hero = heroPoses[pose]
  const dressing = dressingFor(occasion)
  const placements: Placement[] = []
  // D139: the floor prop stands behind everything, between the hero and its foe, or in the foe's place on an empty stage.
  // D141: at a meeting the meeting's own prop takes that place.
  if (dressing !== undefined && subject.kind !== 'coworker') {
    const left = subject.kind === 'none' ? SUBJECT_X : DECOR_X
    placements.push({ role: 'decor', id: `${occasion!}:prop`, sprite: dressing.prop, left, top: GROUND - dressing.prop.height })
  }
  if (CLOAKED_POSES.has(pose)) placements.push({ role: 'cloak', sprite: heroCloak, left: HERO_X - 5, top: GROUND - hero.height + 8 })
  const heroTop = GROUND - hero.height
  placements.push({ role: 'hero', sprite: hero, left: HERO_X, top: heroTop })
  if (dressing?.heroHat !== undefined) {
    const anchor = heroHatAnchor(pose)
    const hat = dressing.heroHat
    placements.push({ role: 'decor', id: `${occasion!}:hat`, sprite: hat, left: HERO_X + anchor.centre - Math.floor(hat.width / 2), top: heroTop + anchor.bottom - hat.height + 1 })
  }
  if (subject.kind === 'monster') {
    const art = monsterArt[subject.id]
    placements.push({ role: 'monster', id: subject.id, sprite: art, left: SUBJECT_X, top: GROUND - art.height })
    if (subject.elite) placements.push({ role: 'crown', sprite: eliteCrown, left: SUBJECT_X + Math.floor((art.width - eliteCrown.width) / 2), top: GROUND - art.height - eliteCrown.height - 2 })
    // An elite keeps its crown; an ordinary monster dresses for the occasion, the hat's brim on its top row.
    else if (dressing?.monsterHat !== undefined) {
      const hat = dressing.monsterHat
      const firstRow = art.rows.findIndex((row) => row.trim() !== '')
      placements.push({ role: 'decor', id: `${occasion!}:monsterHat`, sprite: hat, left: SUBJECT_X + monsterHatCentre(art) - Math.floor(hat.width / 2), top: GROUND - art.height + firstRow - hat.height + 1 })
    }
  } else if (subject.kind === 'prop') {
    const art = propArt[subject.id]
    placements.push({ role: 'prop', id: subject.id, sprite: art, left: SUBJECT_X, top: GROUND - art.height })
  } else if (subject.kind === 'coworker') {
    if (subject.prop !== undefined) {
      const art = propArt[subject.prop]
      placements.push({ role: 'prop', id: subject.prop, sprite: art, left: DECOR_X + 10 - Math.floor(art.width / 2), top: GROUND - art.height })
    }
    const gender = subject.gender ?? 'male'
    const body = coworkerSprite(subject.heroClass, gender)
    const top = GROUND - body.height
    const left = SUBJECT_X + 2
    // Mirrored, so the cloak (5 columns behind our hero's back) hangs off its right.
    if (CLOAKED_POSES.has(classPose('idle', subject.heroClass, gender))) placements.push({ role: 'cloak', sprite: mirror(heroCloak), left: left + body.width + 5 - heroCloak.width, top: top + 8 })
    placements.push({ role: 'coworker', heroClass: subject.heroClass, gender, sprite: body, left, top })
    if (dressing?.heroHat !== undefined) {
      const anchor = heroHatAnchor(classPose('idle', subject.heroClass, gender))
      const hat = mirror(dressing.heroHat)
      placements.push({ role: 'decor', id: `${occasion!}:hat`, sprite: hat, left: left + (body.width - 1 - anchor.centre) - Math.floor(hat.width / 2), top: top + anchor.bottom - hat.height + 1 })
    }
  }
  return placements
}

/** D139: the ceiling layer: a garland sagging across the stage with motifs hung from it, or cobwebs in both corners. */
function ceilingStrip(c: Canvas, strip: NonNullable<Dressing['strip']>, occasion: OccasionArt): void {
  const motif = `motif:${occasion}`
  if (strip.kind === 'cobwebs') {
    c.region = 'web'
    for (const mirrored of [false, true]) {
      const x = (dx: number) => (mirrored ? STAGE_WIDTH - 1 - dx : dx)
      // Radial threads from the corner and three sagging rings.
      for (let i = 0; i <= 12; i += 1) (c.paint(x(i), 0, '#'), c.paint(x(0), i, i < 10 ? '#' : ' '), c.paint(x(i), i, '#'))
      for (let i = 0; i <= 7; i += 1) c.paint(x(Math.round(i * 1.8)), Math.round(i * 0.6) + 0, '#')
      for (const ring of [4, 8, 12]) for (let t = 0; t <= ring; t += 1) c.paint(x(t), ring - t + Math.round((t * (ring - t)) / (ring * 1.5)), '#')
    }
    const motifs = Array.isArray(strip.motif) ? strip.motif : [strip.motif as Sprite]
    ;([[40, 3], [72, 6], [112, 2]] as const).forEach(([x, y], i) => drawWithHalo(c, motifs[i % motifs.length]!, x, y, motif))
    return
  }
  // Two swags, each hanging from the corners and the middle, sagging four rows; a motif every 12 columns.
  const sag = (x: number) => {
    const t = (x % 76) / 75
    return 1 + Math.round(4 * Math.sin(Math.PI * t))
  }
  c.region = 'garland'
  for (let x = 0; x < STAGE_WIDTH; x += 1) c.paint(x, sag(x), '#')
  // A list of motifs (letter cards) repeats in order along the line.
  const motifs = Array.isArray(strip.motif) ? strip.motif : [strip.motif as Sprite]
  for (let x = 6, i = 0; x < STAGE_WIDTH - 4; x += 12, i += 1) {
    const art = motifs[i % motifs.length]!
    drawWithHalo(c, art, x - Math.floor(art.width / 2), sag(x) + 1, motif)
  }
}

/** The region a placement draws under: its role, or the monster or prop it is. */
export const placementRegion = (placement: Placement): string => (placement.role === 'monster' || placement.role === 'prop' || placement.role === 'decor' ? `${placement.role}:${placement.id}` : placement.role)

/** The stage, drawn onto `c` (a fresh 1-bit canvas unless the companion passes its colour-tracking one). */
export function composeScene(biome: BiomeArt, pose: HeroPose, subject: Subject, time: SceneTime = 'day', c = new Canvas(STAGE_WIDTH, STAGE_HEIGHT), occasion?: OccasionArt): Canvas {
  const dressing = dressingFor(occasion)
  BACKDROPS[biome](c, time, dressing?.window)
  if (dressing?.strip !== undefined) ceilingStrip(c, dressing.strip, occasion!)
  // Ground and a clear floor band.
  c.region = 'ground'
  c.rect(0, GROUND, STAGE_WIDTH, 1, '#')
  c.rect(0, GROUND - 22, STAGE_WIDTH, 0, 'w')
  for (const placement of scenePlacements(pose, subject, occasion)) drawWithHalo(c, placement.sprite, placement.left, placement.top, placementRegion(placement))
  return c
}
