import { Canvas, type Sprite } from './canvas'

/**
 * Achievement badges shared by the games (P48 Idle Angler, P49 Desk Crawler): a square medallion whose frame shows the
 * tier around a picture or a creature's sprite. Every radius hangs off the ring's outer edge, `size / 2 - 2.5`, so a
 * 32-pixel medallion (Idle Angler) and a 40-pixel one (Desk Crawler, whose monsters are wider) share one drawing.
 * The device draws the layers in one ink (`badgeCanvas`); the companion paints them (`badgeColourLayers`).
 */

/** The frames: 0 is locked, 1 to 4 the tiers climbing, 5 a family's last tier. */
export const BADGE_FRAMES = [0, 1, 2, 3, 4, 5] as const
export type BadgeFrame = (typeof BADGE_FRAMES)[number]

/** A family's last tier always wears the top frame, so a finished family looks finished whatever its length; the tiers before it climb copper, silver, gold and sky. */
export function frameForTier(tier: number, tiers: number): BadgeFrame {
  if (tier <= 0) return 0
  return (tier >= tiers ? 5 : Math.min(4, tier)) as BadgeFrame
}

const toRad = (deg: number) => (deg * Math.PI) / 180
/** The gap in degrees between two angles. */
const apart = (a: number, b: number) => Math.abs((((a - b) % 360) + 540) % 360 - 180)

/** The medallion's geometry: centre, the ring's outer edge, and each cell's distance and angle (0 at the top, clockwise). */
function geometry(size: number) {
  const centre = (size - 1) / 2
  const outer = size / 2 - 2.5
  return {
    centre,
    outer,
    distance: (x: number, y: number) => Math.hypot(x - centre, y - centre),
    angle: (x: number, y: number) => ((Math.atan2(x - centre, centre - y) * 180) / Math.PI + 360) % 360,
  }
}

/**
 * The frame by tier, as rows: a ring two cells thick inside `outer`, and what each tier adds outside it. `open` gives the
 * top frame a paper window inside a thick ring, for a creature that does not read cut out of ink.
 */
export function badgeFrameRows(size: number, frame: BadgeFrame, open = false): string[] {
  const { centre, outer, distance, angle: angleOf } = geometry(size)
  // Sixteen rays at 32 pixels, more round a larger medallion so they stay as close together.
  const count = Math.round((16 * size) / 32)
  const rays = (d: number, angle: number) => d >= outer + 0.5 && d < outer + 3.1 && Array.from({ length: count }, (_, i) => (i * 360) / count).some((a) => toRad(apart(angle, a)) * d <= (outer + 3.1 - d) * 0.75)
  const rows: string[] = []
  for (let y = 0; y < size; y += 1) {
    let row = ''
    for (let x = 0; x < size; x += 1) {
      const d = distance(x, y)
      const angle = angleOf(x, y)
      let ink = false
      switch (frame) {
        case 0:
          // Locked: a thin dotted ring.
          ink = d >= outer - 1 && d < outer && (x + y) % 2 === 0
          break
        case 1:
          ink = d >= outer - 2 && d < outer
          break
        case 2:
          // A double ring.
          ink = (d >= outer - 2 && d < outer) || (d >= outer + 1 && d < outer + 2.1)
          break
        case 3: {
          // A thick ring with eight round studs on it.
          const stud = [0, 45, 90, 135, 180, 225, 270, 315].some((a) => Math.hypot(x - (centre + outer * Math.sin(toRad(a))), y - (centre - outer * Math.cos(toRad(a)))) < 1.9)
          ink = (d >= outer - 2 && d < outer + 0.7) || stud
          break
        }
        case 4:
          // The ring with its rays, tapering outward.
          ink = (d >= outer - 2 && d < outer) || rays(d, angle)
          break
        case 5:
          // The top tier: the sunburst round a solid disc (or, `open`, a thick ring round a paper window).
          ink = (open ? d >= outer - 3.5 && d < outer : d < outer) || rays(d, angle)
          break
      }
      row += ink ? '#' : ' '
    }
    rows.push(row)
  }
  return rows
}

/** One cell of a picture cut out of the top tier's solid disc: ink becomes paper and paper ink. */
const cutoutCell = (ch: string): string => (ch === '#' ? 'w' : ch === 'w' ? '#' : ch)

export interface BadgeLayers {
  readonly disc: Sprite
  readonly frame: Sprite
  readonly picture: Sprite
}

/**
 * The medallion's layers, each a full-size sprite: the paper disc, the frame and the art centred on it. Locked art is
 * a checker silhouette. On the device (`cutout`) the top frame cuts a picture out of its solid disc, ink to paper, and
 * gives a `creature` (a fish, a monster) a paper window instead; the companion paints the disc in the tier's colour
 * and keeps the art as it is.
 */
export function badgeLayers(size: number, art: readonly string[], frame: BadgeFrame, options: { cutout?: boolean; creature?: boolean } = {}): BadgeLayers {
  const cutout = options.cutout ?? true
  const creature = options.creature ?? false
  const { outer, distance } = geometry(size)
  const disc: string[] = []
  for (let y = 0; y < size; y += 1) {
    let row = ''
    for (let x = 0; x < size; x += 1) row += distance(x, y) < outer - 1 ? 'w' : ' '
    disc.push(row)
  }
  const width = art[0]?.length ?? 0
  const left = Math.floor((size - width) / 2)
  const top = Math.floor((size - art.length) / 2)
  const rows: string[] = Array.from({ length: size }, () => ' '.repeat(size))
  art.forEach((line, dy) => {
    const drawn = frame === 0 ? [...line].map((ch) => (ch === ' ' ? ' ' : ':')).join('') : frame === 5 && cutout && !creature ? [...line].map(cutoutCell).join('') : line
    // Art wider than the medallion is clipped to it.
    const from = Math.max(0, -left)
    const visible = drawn.slice(from, from + size)
    const at = Math.max(0, left)
    const y = top + dy
    if (y >= 0 && y < size) rows[y] = (rows[y]!.slice(0, at) + visible + rows[y]!.slice(at + visible.length)).slice(0, size)
  })
  const sprite = (r: string[]): Sprite => ({ width: size, height: size, rows: r })
  return { disc: sprite(disc), frame: sprite(badgeFrameRows(size, frame, cutout && creature)), picture: sprite(rows) }
}

/** The 1-bit medallion for the device: paper disc, frame and art on one canvas. */
export function badgeCanvas(layers: BadgeLayers): Canvas {
  const canvas = new Canvas(layers.disc.width, layers.disc.height)
  canvas.draw(layers.disc, 0, 0)
  canvas.draw(layers.frame, 0, 0)
  canvas.draw(layers.picture, 0, 0)
  return canvas
}

/** Colours a painted sprite takes: '#' cells `ink`, 'w' cells `paper`, shades alternate the two `shade` tones. */
export interface BadgeTones {
  readonly ink?: string
  readonly paper?: string
  readonly shade?: readonly [string, string]
}

/**
 * The badge's colours in the companion: copper to the top frame's violet. The ring and its studs or rays take the
 * frame's colour; the top frame's solid disc too, with the art painted over it as usual. Locked badges have no disc:
 * the dotted ring and the checker silhouette in `locked`, which reads on both themes.
 */
export const BADGE_TONES = {
  ink: '#1b1530',
  disc: '#f4f1ff',
  locked: '#8c86a8',
  rings: ['#8c86a8', '#c7794a', '#a9b3c6', '#e0a92a', '#5d8fd6', '#a77bff'],
} as const

/** The layers bottom to top with the tones each is painted in; `art` is the picture's or creature's own tones. */
export function badgeColourLayers(layers: BadgeLayers, frame: BadgeFrame, art?: BadgeTones): ReadonlyArray<{ readonly sprite: Sprite; readonly tones: BadgeTones }> {
  const picture: BadgeTones = frame === 0 ? { ink: BADGE_TONES.locked, shade: [BADGE_TONES.locked, ''] } : art ?? { ink: BADGE_TONES.ink, paper: BADGE_TONES.disc }
  return [
    { sprite: layers.disc, tones: frame === 0 ? {} : { paper: BADGE_TONES.disc } },
    { sprite: layers.frame, tones: { ink: BADGE_TONES.rings[frame] } },
    { sprite: layers.picture, tones: picture },
  ]
}

/** Badges on a public profile. */
export const SHOWCASE_BADGES = 6

/**
 * The badges a public profile shows: each family's highest earned tier, finished families first, then the rarest
 * (`counts` holders), then the higher tier. Automatic; players do not choose.
 */
export function showcase<T extends { readonly family: string; readonly tier: number; readonly id: string }>(earned: readonly T[], frameOf: (badge: T) => BadgeFrame, counts: Readonly<Record<string, number>> | null = null): T[] {
  const best = new Map<string, T>()
  for (const badge of earned) if (badge.tier > (best.get(badge.family)?.tier ?? 0)) best.set(badge.family, badge)
  const held = (id: string) => counts?.[id] ?? Number.MAX_SAFE_INTEGER
  return [...best.values()]
    .sort((a, b) => frameOf(b) - frameOf(a) || held(a.id) - held(b.id) || b.tier - a.tier || a.family.localeCompare(b.family))
    .slice(0, SHOWCASE_BADGES)
}
