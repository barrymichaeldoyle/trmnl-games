import type { GameSlug } from '@trmnl-games/platform'
import type { Doc, Id } from '../_generated/dataModel'
import type { MutationCtx, QueryCtx } from '../_generated/server'
import { activateAngler, prepareAngler } from '../idleAngler/lifecycle'
import { currentAngler, idleAnglerProfile } from '../idleAngler/profile'
import { activateLife, prepareLife } from '../paperLives/lifecycle'
import { currentLife, paperLivesProfile } from '../paperLives/profile'
import { activatePlot, preparePlot } from '../littlePlot/lifecycle'
import { currentPlot, littlePlotProfile } from '../littlePlot/profile'
import { currentHero, gameProfile } from './gameProfile'

/**
 * Per-game hooks for the shared TRMNL lifecycle (trmnl.ts): which profile can be deleting, the player
 * character an installation activates, and how one is prepared and activated. D115 generalized the
 * lifecycle from Desk Crawler's.
 */
export interface GameHooks {
  readonly slug: GameSlug
  readonly label: string
  deleting(ctx: QueryCtx, userId: Id<'users'>): Promise<boolean>
  current(ctx: QueryCtx, user: Doc<'users'> | null): Promise<{ _id: string; activationState: 'pending_trmnl' | 'active' } | null>
  /** Whether preparing needs a character name (Desk Crawler's hero name). */
  readonly needsName: boolean
  activate(ctx: MutationCtx, userId: Id<'users'>, now: number): Promise<void>
}

/** Only omitted pre-migration credentials inherit the original game's scope. */
export function isGame(row: { gameSlug?: string }, slug: GameSlug): boolean {
  return row.gameSlug === slug || (row.gameSlug === undefined && slug === 'desk-crawler')
}

export const IDLE_ANGLER_HOOKS: GameHooks & { prepare: (ctx: MutationCtx, user: Doc<'users'>, now: number) => Promise<unknown> } = {
  slug: 'idle-angler',
  label: 'Idle Angler',
  deleting: async (ctx, userId) => (await idleAnglerProfile(ctx, userId))?.state === 'deleting',
  current: currentAngler,
  needsName: false,
  activate: activateAngler,
  prepare: prepareAngler,
}

export const PAPER_LIVES_HOOKS: GameHooks & { prepare: (ctx: MutationCtx, user: Doc<'users'>, now: number) => Promise<unknown> } = {
  slug: 'paper-lives',
  label: 'Paper Lives',
  deleting: async (ctx, userId) => (await paperLivesProfile(ctx, userId))?.state === 'deleting',
  current: currentLife,
  needsName: false,
  activate: activateLife,
  prepare: prepareLife,
}

export const LITTLE_PLOT_HOOKS: GameHooks & { prepare: (ctx: MutationCtx, user: Doc<'users'>, now: number) => Promise<unknown> } = {
  slug: 'little-plot',
  label: 'Little Plot',
  deleting: async (ctx, userId) => (await littlePlotProfile(ctx, userId))?.state === 'deleting',
  current: currentPlot,
  needsName: false,
  activate: activatePlot,
  prepare: preparePlot,
}

/** The hooks of a game other than Desk Crawler, whose lifecycle predates the hooks (D115, D159, D206). */
export function otherGameHooks(slug: Exclude<GameSlug, 'desk-crawler'>): typeof IDLE_ANGLER_HOOKS {
  return slug === 'idle-angler' ? IDLE_ANGLER_HOOKS : slug === 'paper-lives' ? PAPER_LIVES_HOOKS : LITTLE_PLOT_HOOKS
}

/** A game's current player character for this user: the hero, the angler or the life. */
export async function currentCharacterOf(ctx: QueryCtx, slug: GameSlug, user: Doc<'users'> | null): Promise<{ _id: string; activationState: 'pending_trmnl' | 'active' } | null> {
  return slug === 'desk-crawler' ? await currentHero(ctx, user) : await otherGameHooks(slug).current(ctx, user)
}

/** Whether this game's progress is being deleted for the user. */
export async function gameDeletingFor(ctx: QueryCtx, slug: GameSlug, userId: Id<'users'>): Promise<boolean> {
  return slug === 'desk-crawler' ? await deskCrawlerDeleting(ctx, userId) : await otherGameHooks(slug).deleting(ctx, userId)
}

export const deskCrawlerDeleting = async (ctx: QueryCtx, userId: Id<'users'>) => (await gameProfile(ctx, userId))?.state === 'deleting'
export { currentHero }
