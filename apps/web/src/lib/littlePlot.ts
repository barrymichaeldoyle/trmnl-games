/**
 * The Little Plot companion's view of `littlePlot.plots.view` (little-plot.md "Companion"). The backend returns
 * `v.any()`; this is the shape the pages read. English copy lives in the pages for now; the eight-language catalogs
 * follow the Idle Angler pattern (D200) once the pages have settled.
 */
export type Rarity = 'common' | 'uncommon' | 'rare' | 'epic'
export type Group = 'flower' | 'vegetable' | 'herb'
export type Stage = 'sown' | 'sprout' | 'leaf' | 'bud' | 'ripe'

export interface Bed {
  index: number
  kind: { id: string; name: string; rarity: Rarity; group: Group } | null
  stage: Stage
  ripe: boolean
  greenhouse: boolean
  crossed: { id: string; known: boolean; name: string } | null
  nextStageInTicks: number | null
  ripeSinceTick: number | null
  coins?: number
  volunteer?: boolean
}

export interface Seed {
  id: string
  name: string
  rarity: Rarity
  group: Group
  count: number
  grown: boolean
  tags: Array<{ from: string; cutting: boolean }>
  note: string | null
}

export interface ShedSeed {
  id: string
  name: string
  rarity: Rarity
  group: Group
  price: number
  held: number
  note: string | null
}

export interface ShedItem {
  id: string
  name: string
  group: 'tool' | 'bed' | 'defence' | 'structure' | 'ornament'
  price: number
  blurb: string
  shown: boolean
  reason: string | null
  owned: boolean
  toGo: number
}

export interface CatalogueEntry {
  id: string
  name: string
  rarity: Rarity
  group: Group
  grown: { count: number; best: number; firstAt: number } | null
  source: 'shed' | 'cross' | 'trap' | 'frost'
  hint: { parents: string[]; more?: number } | { riddle: string | null } | null
  seeds: number
}

interface LogLine {
  id: string
  at: number
  tick: number | null
  kind: string
  summary: string
  detail: { kindId: string | null; childKindId: string | null; bed: number | null; effect: string | null; coins: number | null; first: boolean }
}

export interface PlotView {
  gameState: string | null
  plot: {
    id: string
    activationState: 'pending_trmnl' | 'active'
    status: 'growing' | 'paused'
    level: number
    xp: number
    gold: number
    rows: number
    cols: number
    beds: Bed[]
    items: Array<{ id: string; name: string; group: string }>
    wateredUntilTick: number
    wateredHoursLeft: number
    waterTicks: number
    publicProfile: boolean
    quarantined: boolean
    ripeCount: number
  } | null
  tin: Seed[]
  goal: { id: string | null; title: string; coins: number; page: 'plot' | 'tin' | 'shed' | 'catalogue'; progress: { value: number; target: number } | null; line: string | null }
  waiting: { count: number; coins: number } | null
  season: { id: 'spring' | 'summer' | 'autumn' | 'winter'; endsAt: number; weather: string; band: string; frost: boolean }
  shed: { seeds: ShedSeed[]; nextSeedLevel: number | null; items: ShedItem[] }
  catalogue: CatalogueEntry[]
  kindsGrown: number
  kindsTotal: number
  board: { top: Array<{ rank: number; name: string; level: number; own: boolean }>; own: { rank: number; total: number } | null } | null
  logs: LogLine[]
  nextTickAt: number
  worldTick: number
  seasonName: string
}

export const SEASON_NAME: Record<PlotView['season']['id'], string> = { spring: 'Spring', summer: 'Summer', autumn: 'Autumn', winter: 'Winter' }
export const STAGE_NAME: Record<Stage, string> = { sown: 'Sown', sprout: 'Sprout', leaf: 'In leaf', bud: 'In bud', ripe: 'Ripe' }
export const RARITY_NAME: Record<Rarity, string> = { common: 'Common', uncommon: 'Uncommon', rare: 'Rare', epic: 'Epic' }
export const GROUP_NAME: Record<Group, string> = { flower: 'Flower', vegetable: 'Vegetable', herb: 'Herb' }
export const GOAL_PAGE: Record<PlotView['goal']['page'], '/app/little-plot' | '/app/little-plot/tin' | '/app/little-plot/shed' | '/app/little-plot/catalogue'> = { plot: '/app/little-plot', tin: '/app/little-plot/tin', shed: '/app/little-plot/shed', catalogue: '/app/little-plot/catalogue' }

/** "in 1 h 20 min" for a count of quarter-hour ticks. */
export function ticksLabel(ticks: number): string {
  const minutes = ticks * 15
  if (minutes < 60) return `${minutes} min`
  const hours = Math.floor(minutes / 60)
  return minutes % 60 ? `${hours} h ${minutes % 60} min` : `${hours} h`
}

/** A story line with its [[name]] markers turned into the names alone. */
export const plain = (summary: string) => summary.replaceAll('[[', '').replaceAll(']]', '')
