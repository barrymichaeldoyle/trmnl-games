/** Public platform configuration: no credentials or backend-only exports. */
export const PLATFORM_NAME = 'TRMNL Games'
export const PLATFORM_ORIGIN = 'https://trmnlgames.com'
export const DESK_CRAWLER_GAME = 'desk-crawler' as const
export const IDLE_ANGLER_GAME = 'idle-angler' as const
export const PAPER_LIVES_GAME = 'paper-lives' as const
export type GameSlug = typeof DESK_CRAWLER_GAME | typeof IDLE_ANGLER_GAME | typeof PAPER_LIVES_GAME
export const GAME_SLUGS: readonly GameSlug[] = [DESK_CRAWLER_GAME, IDLE_ANGLER_GAME, PAPER_LIVES_GAME]

/**
 * Lifecycle status (idle-angler.md "Architecture"). `hidden`: nothing lists the game and its routes
 * answer not-found for everyone but admins. `preview`: a "Coming soon" tile, routes still closed.
 * `live`: listed everywhere, every route open. The server holds the current value; `defaultStatus`
 * applies only until an admin sets one.
 */
export type GameStatus = 'hidden' | 'preview' | 'live'
export const GAME_STATUSES: readonly GameStatus[] = ['hidden', 'preview', 'live']

export interface GameEntry {
  readonly slug: GameSlug
  readonly name: string
  readonly description: string
  readonly defaultStatus: GameStatus
  readonly publicPath: string
  readonly companionPath: string
  readonly helpPath: string
  readonly installPath: string
  readonly managePath: string
  readonly clientIdEnv: string
}

export const games = {
  [DESK_CRAWLER_GAME]: {
    slug: DESK_CRAWLER_GAME,
    name: 'Desk Crawler',
    description: 'An office RPG that plays itself on your TRMNL.',
    defaultStatus: 'live',
    // Home is Desk Crawler's page until Idle Angler launches; /games/desk-crawler redirects there meanwhile (D137).
    publicPath: '/',
    companionPath: '/app/desk-crawler',
    helpPath: '/help/desk-crawler',
    installPath: '/connect/trmnl/desk-crawler/install',
    managePath: '/connect/trmnl/desk-crawler/manage',
    clientIdEnv: 'TRMNL_CLIENT_ID',
  },
  [IDLE_ANGLER_GAME]: {
    slug: IDLE_ANGLER_GAME,
    name: 'Idle Angler',
    description: 'A fishing game that plays itself on your TRMNL.',
    defaultStatus: 'hidden',
    publicPath: '/games/idle-angler',
    companionPath: '/app/idle-angler',
    helpPath: '/help/idle-angler',
    installPath: '/connect/trmnl/idle-angler/install',
    managePath: '/connect/trmnl/idle-angler/manage',
    clientIdEnv: 'TRMNL_CLIENT_ID_IDLE_ANGLER',
  },
  [PAPER_LIVES_GAME]: {
    slug: PAPER_LIVES_GAME,
    name: 'Paper Lives',
    description: 'A life story that writes itself on your TRMNL.',
    // D159: hidden (admin-only) while it is built, until its own listing.
    defaultStatus: 'hidden',
    publicPath: '/games/paper-lives',
    companionPath: '/app/paper-lives',
    helpPath: '/help/paper-lives',
    installPath: '/connect/trmnl/paper-lives/install',
    managePath: '/connect/trmnl/paper-lives/manage',
    clientIdEnv: 'TRMNL_CLIENT_ID_PAPER_LIVES',
  },
} as const satisfies Record<GameSlug, GameEntry>

export function isGameSlug(value: unknown): value is GameSlug {
  return value === DESK_CRAWLER_GAME || value === IDLE_ANGLER_GAME || value === PAPER_LIVES_GAME
}

export function isGameStatus(value: unknown): value is GameStatus {
  return value === 'hidden' || value === 'preview' || value === 'live'
}

/**
 * Platform achievements (idle-angler.md "Platform profile and achievements"): earned across games, shown on the shared
 * profile. `games` counts games with an active character; `collected` counts achievements earned in every game.
 */
export interface PlatformAchievement {
  readonly id: string
  readonly family: 'regular' | 'collector'
  readonly tier: number
  readonly name: string
  readonly blurb: string
  readonly kind: 'games' | 'collected'
  readonly atLeast: number
}

export const PLATFORM_ACHIEVEMENTS: readonly PlatformAchievement[] = [
  { id: 'regular_1', family: 'regular', tier: 1, name: 'Regular', blurb: 'Plays two TRMNL Games.', kind: 'games', atLeast: 2 },
  { id: 'collector_1', family: 'collector', tier: 1, name: 'Collector', blurb: '25 achievements across games.', kind: 'collected', atLeast: 25 },
  { id: 'collector_2', family: 'collector', tier: 2, name: 'Curator', blurb: '100 achievements across games.', kind: 'collected', atLeast: 100 },
  { id: 'collector_3', family: 'collector', tier: 3, name: 'Archivist', blurb: '250 achievements across games.', kind: 'collected', atLeast: 250 },
]

export function platformAchievements(stats: { games: number; collected: number }): PlatformAchievement[] {
  return PLATFORM_ACHIEVEMENTS.filter((a) => (a.kind === 'games' ? stats.games : stats.collected) >= a.atLeast)
}

export * from './names'
